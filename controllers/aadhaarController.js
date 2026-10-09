import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { createWorker } from "tesseract.js";
import sharp from "sharp";
import fs from "fs";
import aadhaarModel from "../models/aadhaarModel.js";
 
let workerPromise;
function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker("eng").then(async (worker) => {
      // Aadhaar cards are mostly short, isolated lines of printed text
      // (name / DOB / gender / address block), not paragraphs — PSM 6
      // ("assume a single uniform block of text") reads that far more
      // reliably than Tesseract's default "auto page layout" mode, which
      // was producing garbled, out-of-order text on photographed cards.
      await worker.setParameters({ tessedit_pageseg_mode: "6" });
      return worker;
    });
  }
  return workerPromise;
}
 
// Phone photos of an Aadhaar card are usually low-contrast, slightly
// skewed/noisy, and sometimes small — all of which wreck raw Tesseract
// accuracy (this is what was producing garbled text like "Wo: SHSM,
// HETEAT2..." instead of a real name/address). Upscaling + grayscale +
// contrast normalization + a light sharpen is the standard fix and
// consistently improves OCR accuracy on this kind of photo, without
// touching the parsing logic below at all. If preprocessing itself fails
// for any reason, we fall back to the original file rather than failing
// the whole read.
async function preprocessForOcr(filePath) {
  const outPath = `${filePath}-ocr.png`;
  const image = sharp(filePath).rotate(); // auto-orient via EXIF
  const metadata = await image.metadata();
  const targetWidth = Math.max(metadata.width || 0, 1600);
  await image
    .resize({ width: targetWidth, withoutEnlargement: false })
    .grayscale()
    .normalize()
    .sharpen()
    .toFile(outPath);
  return outPath;
}
 
async function readImageText(filePath) {
  const worker = await getWorker();
  let ocrPath = filePath;
  let preprocessed = false;
  try {
    ocrPath = await preprocessForOcr(filePath);
    preprocessed = true;
  } catch (err) {
    console.error("OCR preprocess failed, reading original image instead:", err.message);
  }
  try {
    const { data: { text } } = await worker.recognize(ocrPath);
    return text;
  } finally {
    if (preprocessed) {
      fs.unlink(ocrPath, () => {}); // best-effort cleanup of the temp preprocessed file
    }
  }
}
function calcAge(dob) {
  const [d, m, y] = dob.split(/[/\-.]/).map(Number);
  if (!d || !m || !y) return "";
  const today = new Date();
  let age = today.getFullYear() - y;
  if (today < new Date(today.getFullYear(), m - 1, d)) age--;
  return age;
}
function parseAadhaarText(text = "") {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const dobMatch = text.match(/(?:DOB|D\.O\.B|Date of Birth)\s*[:\-]?\s*(\d{2}[/\-]\d{2}[/\-]\d{4})/i);
  const yobMatch = text.match(/(?:Year of Birth|YOB)\s*[:\-]?\s*(\d{4})/i);
  let age = "", dob = "";
  if (dobMatch) { dob = dobMatch[1]; age = calcAge(dob); }
  else if (yobMatch) { age = new Date().getFullYear() - Number(yobMatch[1]); }
  let gender = "";
  if (/female/i.test(text)) gender = "Female";
  else if (/\bmale\b/i.test(text)) gender = "Male";
  else if (/transgender/i.test(text)) gender = "Other";
  let fullName = "";
  const dobIdx = lines.findIndex((l) => /DOB|D\.O\.B|Year of Birth|YOB|Date of Birth/i.test(l));
  for (let i = dobIdx - 1; i >= 0; i--) {
    if (/^[A-Za-z .]{3,}$/.test(lines[i]) && !/government|india|authority/i.test(lines[i])) {
      fullName = lines[i]; break;
    }
  }
  const parts = fullName.split(/\s+/).filter(Boolean);
  const firstName = parts[0] || "", lastName = parts.slice(1).join(" ");
  const phone = extractPhone(text);
  const address = extractAddress(text);
  return { firstName, lastName, age, dob, gender, address, phone };
}
 
// Mobile number — many Aadhaar scans OCR a 10-digit mobile number with an
// internal space or hyphen (e.g. "98765 43210" instead of "9876543210"),
// which the old strict \b[6-9]\d{9}\b regex missed entirely. This tolerates
// that gap. Note: a lot of current Aadhaar cards simply don't print a
// mobile number on the card at all — no regex can recover a number that
// was never printed.
function extractPhone(text = "") {
  const match = text.match(/\b([6-9]\d{4})[\s-]?(\d{5})\b/);
  return match ? `${match[1]}${match[2]}` : "";
}
 
// Address — the old regex required the literal word "Address" to OCR
// cleanly, which is fragile on noisy scans. Try progressively looser
// fallbacks, all anchored on the 6-digit PIN code every Aadhaar address
// ends with, which OCRs far more reliably than the word "Address" itself.
function extractAddress(text = "") {
  // 1) Literal "Address" keyword through the PIN code.
  let match = text.match(/Address[:\s]*([\s\S]*?\b\d{6}\b)/i);
  if (match) return match[1].replace(/\s*\n\s*/g, ", ").trim();
 
  // 2) S/O, D/O, W/O or C/O (son/daughter/wife/care of) marker through the
  // PIN code — most Aadhaar backs start the address with one of these even
  // when the word "Address" itself doesn't OCR cleanly.
  match = text.match(/\b[SDWC]\/O[:\s]*([\s\S]*?\b\d{6}\b)/i);
  if (match) return match[1].replace(/\s*\n\s*/g, ", ").trim();
 
  // 3) Last resort — take the handful of lines immediately before the
  // first 6-digit PIN code found anywhere in the text.
  match = text.match(/\b\d{6}\b/);
  if (match) {
    const idx = text.indexOf(match[0]);
    const before = text.slice(0, idx + match[0].length);
    const lines = before.split("\n").map((l) => l.trim()).filter(Boolean);
    return lines.slice(-6).join(", ");
  }
 
  return "";
}
function mergeSides(front, back) {
  return {
    firstName: front.firstName || back.firstName || "",
    lastName: front.lastName || back.lastName || "",
    age: front.age || back.age || "",
    dob: front.dob || back.dob || "",
    gender: front.gender || back.gender || "",
    phone: front.phone || back.phone || "",
    address: back.address || front.address || "",
  };
}
 
// POST /ocr/aadhaar — multipart: front (required), back (optional)
export const extractAadhaar = async (req, res) => {
  try {
    const frontFile = req.files?.front?.[0];
    const backFile = req.files?.back?.[0];
    if (!frontFile) {
      return res.status(400).json({ success: false, message: "Aadhaar front image is required" });
    }
    const frontText = await readImageText(frontFile.path);
    const frontData = parseAadhaarText(frontText);
    const frontUpload = await cloudinary.uploader.upload(frontFile.path, { folder: "aadhaar", resource_type: "image" });
 
    let backData = {}, backUpload = null, backText = "";
    if (backFile) {
      backText = await readImageText(backFile.path);
      backData = parseAadhaarText(backText);
      backUpload = await cloudinary.uploader.upload(backFile.path, { folder: "aadhaar", resource_type: "image" });
    }
    const merged = mergeSides(frontData, backData);
    return res.status(200).json({
      success: true,
      parsed: merged,
      front: { url: frontUpload.secure_url, ocrText: frontText },
      back: backUpload ? { url: backUpload.secure_url, ocrText: backText } : null,
    });
  } catch (error) {
    console.error("extractAadhaar error:", error);
    return res.status(500).json({ success: false, message: "Could not read the Aadhaar image.", error: error.message });
  }
};
 
// POST /ocr/payment-screenshot — multipart: screenshot; body: type, amount
export const uploadPaymentScreenshot = async (req, res) => {
  try {
    const file = req.file;
    const { type, amount } = req.body;
    if (!file) return res.status(400).json({ success: false, message: "Screenshot image is required" });
    if (!["advance", "balance", "partial"].includes(type)) {
      return res.status(400).json({ success: false, message: "type must be advance, balance or partial" });
    }
    const upload = await cloudinary.uploader.upload(file.path, { folder: "payment-screenshots", resource_type: "image" });
    return res.status(200).json({ success: true, type, url: upload.secure_url, amount: amount ? Number(amount) : null });
  } catch (error) {
    console.error("uploadPaymentScreenshot error:", error);
    return res.status(500).json({ success: false, message: "Upload failed.", error: error.message });
  }
};
 
export const saveBookingNotes = async (req, res) => {
  try {
    const { tourId, packageType, boardingPoint, deboardingPoint, addons, remarks } = req.body;
 
    if (!tourId) {
      return res.status(400).json({ success: false, message: "tourId is required" });
    }
 
    const doc = await aadhaarModel.create({
      type: "bookingNotes",
      tourId,
      packageType: packageType || "",
      boardingPoint: boardingPoint || "",
      deboardingPoint: deboardingPoint || "",
      addons: addons || "",
      remarks: remarks || "",
      uploadedBy: "admin",
    });
 
    return res.status(201).json({ success: true, note: doc });
  } catch (error) {
    console.error("saveBookingNotes error:", error);
    return res.status(500).json({ success: false, message: "Could not save booking notes.", error: error.message });
  }
};
 
// POST /ocr/save-aadhaar-upload — the Aadhaar Upload page's "Save Booking"
// button. One call, one walk-in booking capture: creates every aadhaarModel
// doc this capture produced — aadhaarFront (always), aadhaarBack (if the
// back side was also captured), paymentAdvance (if an advance screenshot
// was uploaded), and bookingNotes (the typed package/boarding/deboarding/
// addons/remarks). No tnr/travellerId yet — those get filled in later, once
// this walk-in booking is picked up from the All Bookings page and an
// actual tourBookingModel booking + tnr is created for it. All docs from
// this one Save share a groupId so that page can fetch them back together
// before a tnr exists.
export const saveAadhaarUpload = async (req, res) => {
  try {
    const {
      tourId,
      packageType,
      boardingPoint,
      deboardingPoint,
      addons,
      remarks,
      traveller,
      coTravellers,
      advanceScreenshot,
    } = req.body;
 
    if (!tourId) {
      return res.status(400).json({ success: false, message: "Select a tour first" });
    }
    if (!traveller?.front?.url) {
      return res.status(400).json({ success: false, message: "Aadhaar front image is required" });
    }
 
    const groupId = new mongoose.Types.ObjectId().toString();
    const parsed = {
      firstName: traveller.firstName || "",
      lastName: traveller.lastName || "",
      age: traveller.age || null,
      dob: traveller.dob || "",
      gender: traveller.gender || "",
      address: traveller.address || "",
      phone: traveller.phone || "",
      title: traveller.title || "",
      sharingType: traveller.sharingType || "",
    };
 
    const docs = [
      {
        groupId,
        type: "aadhaarFront",
        isCoTraveller: false,
        url: traveller.front.url,
        ocrText: traveller.front.ocrText || "",
        parsed,
        uploadedBy: "admin",
      },
    ];
 
    if (traveller.back?.url) {
      docs.push({
        groupId,
        type: "aadhaarBack",
        isCoTraveller: false,
        url: traveller.back.url,
        ocrText: traveller.back.ocrText || "",
        parsed,
        uploadedBy: "admin",
      });
    }
 
    // Co-travellers — up to 9 more (10 per booking including the main
    // traveller) — Aadhaar FRONT side only, no back needed.
    if (Array.isArray(coTravellers)) {
      for (const ct of coTravellers) {
        if (!ct?.front?.url) continue; // skip incomplete entries silently
        docs.push({
          groupId,
          type: "aadhaarFront",
          isCoTraveller: true,
          url: ct.front.url,
          ocrText: ct.front.ocrText || "",
          parsed: {
            firstName: ct.firstName || "",
            lastName: ct.lastName || "",
            age: ct.age || null,
            dob: ct.dob || "",
            gender: ct.gender || "",
            address: ct.address || "",
            phone: ct.phone || "",
            title: ct.title || "",
            sharingType: ct.sharingType || "",
          },
          uploadedBy: "admin",
        });
      }
    }
 
    if (advanceScreenshot?.url) {
      docs.push({
        groupId,
        type: "paymentAdvance",
        url: advanceScreenshot.url,
        amount: advanceScreenshot.amount ?? null,
        uploadedBy: "admin",
      });
    }
 
    docs.push({
      groupId,
      type: "bookingNotes",
      tourId,
      packageType: packageType || "",
      boardingPoint: boardingPoint || "",
      deboardingPoint: deboardingPoint || "",
      addons: addons || "",
      remarks: remarks || "",
      uploadedBy: "admin",
    });
 
    const created = await aadhaarModel.insertMany(docs);
 
    return res.status(201).json({ success: true, groupId, docs: created });
  } catch (error) {
    console.error("saveAadhaarUpload error:", error);
    return res.status(500).json({ success: false, message: "Could not save this booking.", error: error.message });
  }
};
 
// GET /ocr/bookings — All Bookings tab. Groups every aadhaarModel doc that
// has a groupId into one card per booking: main traveller (front+back),
// co-travellers (front only), payment screenshots (advance/balance/
// partial, each possibly uploaded more than once), the typed booking
// notes, and the tnr once one has been linked (see linkGroupTnr below).
export const getAadhaarBookings = async (req, res) => {
  try {
    const docs = await aadhaarModel
      .find({ groupId: { $ne: null } })
      .sort({ createdAt: 1 })
      .populate("tourId", "title")
      .lean();
 
    const groups = {};
    for (const d of docs) {
      const gid = d.groupId;
      if (!groups[gid]) {
        groups[gid] = {
          groupId: gid,
          tnr: "",
          tourId: null,
          tourTitle: "",
          bookingNotes: null,
          main: null,
          coTravellers: [],
          payments: { advance: null, balance: [], partial: [] },
          createdAt: d.createdAt,
        };
      }
      const g = groups[gid];
      if (d.tnr) g.tnr = d.tnr;
 
      if (d.type === "bookingNotes") {
        g.tourId = d.tourId?._id || d.tourId || null;
        g.tourTitle = d.tourId?.title || "";
        g.bookingNotes = {
          packageType: d.packageType,
          boardingPoint: d.boardingPoint,
          deboardingPoint: d.deboardingPoint,
          addons: d.addons,
          remarks: d.remarks,
        };
      } else if (d.type === "aadhaarFront") {
        const traveller = { _id: d._id, ...d.parsed, url: d.url, ocrText: d.ocrText };
        if (d.isCoTraveller) g.coTravellers.push(traveller);
        else g.main = { ...traveller, front: { url: d.url }, back: g.main?.back || null };
      } else if (d.type === "aadhaarBack") {
        if (!d.isCoTraveller) {
          g.main = g.main
            ? { ...g.main, back: { url: d.url } }
            : { _id: d._id, ...d.parsed, back: { url: d.url }, front: null };
        }
      } else if (d.type === "paymentAdvance") {
        g.payments.advance = { _id: d._id, url: d.url, amount: d.amount, createdAt: d.createdAt };
      } else if (d.type === "paymentBalance") {
        g.payments.balance.push({ _id: d._id, url: d.url, amount: d.amount, createdAt: d.createdAt });
      } else if (d.type === "paymentPartial") {
        g.payments.partial.push({ _id: d._id, url: d.url, amount: d.amount, createdAt: d.createdAt });
      }
    }
 
    const bookings = Object.values(groups).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
 
    return res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error("getAadhaarBookings error:", error);
    return res.status(500).json({ success: false, message: "Could not fetch bookings.", error: error.message });
  }
};
 
// POST /ocr/add-co-traveller — adds ONE more traveller to an existing
// booking group, Aadhaar front side only. Used from both tabs: on Tab 1
// before Save, and on Tab 2 any time afterwards (before OR after a tnr has
// been linked — if the group already has a tnr, the new traveller is
// tagged with it immediately).
export const addCoTraveller = async (req, res) => {
  try {
    const { groupId, title, firstName, lastName, age, dob, gender, sharingType, phone, address, front } = req.body;
 
    if (!groupId) return res.status(400).json({ success: false, message: "groupId is required" });
    if (!front?.url) return res.status(400).json({ success: false, message: "Aadhaar front image is required" });
 
    const existing = await aadhaarModel.findOne({ groupId }).select("tnr");
 
    const doc = await aadhaarModel.create({
      groupId,
      tnr: existing?.tnr || "",
      type: "aadhaarFront",
      isCoTraveller: true,
      url: front.url,
      ocrText: front.ocrText || "",
      parsed: {
        firstName: firstName || "",
        lastName: lastName || "",
        age: age || null,
        dob: dob || "",
        gender: gender || "",
        address: address || "",
        phone: phone || "",
        title: title || "",
        sharingType: sharingType || "",
      },
      uploadedBy: "admin",
    });
 
    return res.status(201).json({ success: true, traveller: doc });
  } catch (error) {
    console.error("addCoTraveller error:", error);
    return res.status(500).json({ success: false, message: "Could not add co-traveller.", error: error.message });
  }
};
 
// POST /ocr/upload-group-payment — multipart: screenshot; body: groupId,
// type (advance|balance|partial), amount. Unlike the old
// uploadPaymentScreenshot (which only uploaded to Cloudinary and handed the
// url back for CreateBooking.jsx to carry), this one SAVES the screenshot
// straight into aadhaarModel against the group — Balance/Partial can be
// uploaded more than once (e.g. part-payments over time), each call just
// adds one more doc.
export const uploadGroupPayment = async (req, res) => {
  try {
    const file = req.file;
    const { groupId, type, amount } = req.body;
 
    if (!file) return res.status(400).json({ success: false, message: "Screenshot image is required" });
    if (!groupId) return res.status(400).json({ success: false, message: "groupId is required" });
    if (!["advance", "balance", "partial"].includes(type)) {
      return res.status(400).json({ success: false, message: "type must be advance, balance or partial" });
    }
 
    const upload = await cloudinary.uploader.upload(file.path, { folder: "payment-screenshots", resource_type: "image" });
    const existing = await aadhaarModel.findOne({ groupId }).select("tnr");
 
    const doc = await aadhaarModel.create({
      groupId,
      tnr: existing?.tnr || "",
      type: type === "advance" ? "paymentAdvance" : type === "balance" ? "paymentBalance" : "paymentPartial",
      url: upload.secure_url,
      amount: amount ? Number(amount) : null,
      uploadedBy: "admin",
    });
 
    return res.status(201).json({ success: true, payment: doc });
  } catch (error) {
    console.error("uploadGroupPayment error:", error);
    return res.status(500).json({ success: false, message: "Upload failed.", error: error.message });
  }
};
 
// POST /ocr/link-tnr — once "Create Booking" (on Tab 2) has sent the admin
// to the existing, untouched CreateBooking.jsx flow and a real tnr has been
// generated there, the admin pastes it back here so this group's docs
// (main + co-travellers + all screenshots) carry that tnr too. Also makes
// the card show "Raise Manage Booking" from then on.
export const linkGroupTnr = async (req, res) => {
  try {
    const { groupId, tnr } = req.body;
    if (!groupId || !tnr) {
      return res.status(400).json({ success: false, message: "groupId and tnr are required" });
    }
    await aadhaarModel.updateMany({ groupId }, { $set: { tnr: tnr.trim().toUpperCase() } });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("linkGroupTnr error:", error);
    return res.status(500).json({ success: false, message: "Could not link TNR.", error: error.message });
  }
};
