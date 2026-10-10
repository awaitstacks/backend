// // import mongoose from "mongoose";
// // import { v2 as cloudinary } from "cloudinary";
// // import { createWorker } from "tesseract.js";
// // import sharp from "sharp";
// // import fs from "fs";
// // import aadhaarModel from "../models/aadhaarModel.js";
 
// // let workerPromise;
// // function getWorker() {
// //   if (!workerPromise) {
// //     workerPromise = createWorker("eng").then(async (worker) => {
// //       // Aadhaar cards are mostly short, isolated lines of printed text
// //       // (name / DOB / gender / address block), not paragraphs — PSM 6
// //       // ("assume a single uniform block of text") reads that far more
// //       // reliably than Tesseract's default "auto page layout" mode, which
// //       // was producing garbled, out-of-order text on photographed cards.
// //       await worker.setParameters({ tessedit_pageseg_mode: "6" });
// //       return worker;
// //     });
// //   }
// //   return workerPromise;
// // }
 
// // // Phone photos of an Aadhaar card are usually low-contrast, slightly
// // // skewed/noisy, and sometimes small — all of which wreck raw Tesseract
// // // accuracy (this is what was producing garbled text like "Wo: SHSM,
// // // HETEAT2..." instead of a real name/address). Upscaling + grayscale +
// // // contrast normalization + a light sharpen is the standard fix and
// // // consistently improves OCR accuracy on this kind of photo, without
// // // touching the parsing logic below at all. If preprocessing itself fails
// // // for any reason, we fall back to the original file rather than failing
// // // the whole read.
// // async function preprocessForOcr(filePath) {
// //   const outPath = `${filePath}-ocr.png`;
// //   const image = sharp(filePath).rotate(); // auto-orient via EXIF
// //   const metadata = await image.metadata();
// //   const targetWidth = Math.max(metadata.width || 0, 1600);
// //   await image
// //     .resize({ width: targetWidth, withoutEnlargement: false })
// //     .grayscale()
// //     .normalize()
// //     .sharpen()
// //     .toFile(outPath);
// //   return outPath;
// // }
 
// // async function readImageText(filePath) {
// //   const worker = await getWorker();
// //   let ocrPath = filePath;
// //   let preprocessed = false;
// //   try {
// //     ocrPath = await preprocessForOcr(filePath);
// //     preprocessed = true;
// //   } catch (err) {
// //     console.error("OCR preprocess failed, reading original image instead:", err.message);
// //   }
// //   try {
// //     const { data: { text } } = await worker.recognize(ocrPath);
// //     return text;
// //   } finally {
// //     if (preprocessed) {
// //       fs.unlink(ocrPath, () => {}); // best-effort cleanup of the temp preprocessed file
// //     }
// //   }
// // }
// // function calcAge(dob) {
// //   const [d, m, y] = dob.split(/[/\-.]/).map(Number);
// //   if (!d || !m || !y) return "";
// //   const today = new Date();
// //   let age = today.getFullYear() - y;
// //   if (today < new Date(today.getFullYear(), m - 1, d)) age--;
// //   return age;
// // }
// // function parseAadhaarText(text = "") {
// //   const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
// //   const dobMatch = text.match(/(?:DOB|D\.O\.B|Date of Birth)\s*[:\-]?\s*(\d{2}[/\-]\d{2}[/\-]\d{4})/i);
// //   const yobMatch = text.match(/(?:Year of Birth|YOB)\s*[:\-]?\s*(\d{4})/i);
// //   let age = "", dob = "";
// //   if (dobMatch) { dob = dobMatch[1]; age = calcAge(dob); }
// //   else if (yobMatch) { age = new Date().getFullYear() - Number(yobMatch[1]); }
// //   let gender = "";
// //   if (/female/i.test(text)) gender = "Female";
// //   else if (/\bmale\b/i.test(text)) gender = "Male";
// //   else if (/transgender/i.test(text)) gender = "Other";
// //   let fullName = "";
// //   const dobIdx = lines.findIndex((l) => /DOB|D\.O\.B|Year of Birth|YOB|Date of Birth/i.test(l));
// //   for (let i = dobIdx - 1; i >= 0; i--) {
// //     if (/^[A-Za-z .]{3,}$/.test(lines[i]) && !/government|india|authority/i.test(lines[i])) {
// //       fullName = lines[i]; break;
// //     }
// //   }
// //   const parts = fullName.split(/\s+/).filter(Boolean);
// //   const firstName = parts[0] || "", lastName = parts.slice(1).join(" ");
// //   const phone = extractPhone(text);
// //   const address = extractAddress(text);
// //   return { firstName, lastName, age, dob, gender, address, phone };
// // }
 
// // // Mobile number — many Aadhaar scans OCR a 10-digit mobile number with an
// // // internal space or hyphen (e.g. "98765 43210" instead of "9876543210"),
// // // which the old strict \b[6-9]\d{9}\b regex missed entirely. This tolerates
// // // that gap. Note: a lot of current Aadhaar cards simply don't print a
// // // mobile number on the card at all — no regex can recover a number that
// // // was never printed.
// // function extractPhone(text = "") {
// //   const match = text.match(/\b([6-9]\d{4})[\s-]?(\d{5})\b/);
// //   return match ? `${match[1]}${match[2]}` : "";
// // }
 
// // // Address — the old regex required the literal word "Address" to OCR
// // // cleanly, which is fragile on noisy scans. Try progressively looser
// // // fallbacks, all anchored on the 6-digit PIN code every Aadhaar address
// // // ends with, which OCRs far more reliably than the word "Address" itself.
// // function extractAddress(text = "") {
// //   // 1) Literal "Address" keyword through the PIN code.
// //   let match = text.match(/Address[:\s]*([\s\S]*?\b\d{6}\b)/i);
// //   if (match) return match[1].replace(/\s*\n\s*/g, ", ").trim();
 
// //   // 2) S/O, D/O, W/O or C/O (son/daughter/wife/care of) marker through the
// //   // PIN code — most Aadhaar backs start the address with one of these even
// //   // when the word "Address" itself doesn't OCR cleanly.
// //   match = text.match(/\b[SDWC]\/O[:\s]*([\s\S]*?\b\d{6}\b)/i);
// //   if (match) return match[1].replace(/\s*\n\s*/g, ", ").trim();
 
// //   // 3) Last resort — take the handful of lines immediately before the
// //   // first 6-digit PIN code found anywhere in the text.
// //   match = text.match(/\b\d{6}\b/);
// //   if (match) {
// //     const idx = text.indexOf(match[0]);
// //     const before = text.slice(0, idx + match[0].length);
// //     const lines = before.split("\n").map((l) => l.trim()).filter(Boolean);
// //     return lines.slice(-6).join(", ");
// //   }
 
// //   return "";
// // }
// // function mergeSides(front, back) {
// //   return {
// //     firstName: front.firstName || back.firstName || "",
// //     lastName: front.lastName || back.lastName || "",
// //     age: front.age || back.age || "",
// //     dob: front.dob || back.dob || "",
// //     gender: front.gender || back.gender || "",
// //     phone: front.phone || back.phone || "",
// //     address: back.address || front.address || "",
// //   };
// // }
 
// // // POST /ocr/aadhaar — multipart: front (required), back (optional)
// // export const extractAadhaar = async (req, res) => {
// //   try {
// //     const frontFile = req.files?.front?.[0];
// //     const backFile = req.files?.back?.[0];
// //     if (!frontFile) {
// //       return res.status(400).json({ success: false, message: "Aadhaar front image is required" });
// //     }
// //     const frontText = await readImageText(frontFile.path);
// //     const frontData = parseAadhaarText(frontText);
// //     const frontUpload = await cloudinary.uploader.upload(frontFile.path, { folder: "aadhaar", resource_type: "image" });
 
// //     let backData = {}, backUpload = null, backText = "";
// //     if (backFile) {
// //       backText = await readImageText(backFile.path);
// //       backData = parseAadhaarText(backText);
// //       backUpload = await cloudinary.uploader.upload(backFile.path, { folder: "aadhaar", resource_type: "image" });
// //     }
// //     const merged = mergeSides(frontData, backData);
// //     return res.status(200).json({
// //       success: true,
// //       parsed: merged,
// //       front: { url: frontUpload.secure_url, ocrText: frontText },
// //       back: backUpload ? { url: backUpload.secure_url, ocrText: backText } : null,
// //     });
// //   } catch (error) {
// //     console.error("extractAadhaar error:", error);
// //     return res.status(500).json({ success: false, message: "Could not read the Aadhaar image.", error: error.message });
// //   }
// // };
 
// // // POST /ocr/payment-screenshot — multipart: screenshot; body: type, amount
// // export const uploadPaymentScreenshot = async (req, res) => {
// //   try {
// //     const file = req.file;
// //     const { type, amount } = req.body;
// //     if (!file) return res.status(400).json({ success: false, message: "Screenshot image is required" });
// //     if (!["advance", "balance", "partial"].includes(type)) {
// //       return res.status(400).json({ success: false, message: "type must be advance, balance or partial" });
// //     }
// //     const upload = await cloudinary.uploader.upload(file.path, { folder: "payment-screenshots", resource_type: "image" });
// //     return res.status(200).json({ success: true, type, url: upload.secure_url, amount: amount ? Number(amount) : null });
// //   } catch (error) {
// //     console.error("uploadPaymentScreenshot error:", error);
// //     return res.status(500).json({ success: false, message: "Upload failed.", error: error.message });
// //   }
// // };
 
// // export const saveBookingNotes = async (req, res) => {
// //   try {
// //     const { tourId, packageType, boardingPoint, deboardingPoint, addons, remarks } = req.body;
 
// //     if (!tourId) {
// //       return res.status(400).json({ success: false, message: "tourId is required" });
// //     }
 
// //     const doc = await aadhaarModel.create({
// //       type: "bookingNotes",
// //       tourId,
// //       packageType: packageType || "",
// //       boardingPoint: boardingPoint || "",
// //       deboardingPoint: deboardingPoint || "",
// //       addons: addons || "",
// //       remarks: remarks || "",
// //       uploadedBy: "admin",
// //     });
 
// //     return res.status(201).json({ success: true, note: doc });
// //   } catch (error) {
// //     console.error("saveBookingNotes error:", error);
// //     return res.status(500).json({ success: false, message: "Could not save booking notes.", error: error.message });
// //   }
// // };
 
// // // POST /ocr/save-aadhaar-upload — the Aadhaar Upload page's "Save Booking"
// // // button. One call, one walk-in booking capture: creates every aadhaarModel
// // // doc this capture produced — aadhaarFront (always), aadhaarBack (if the
// // // back side was also captured), paymentAdvance (if an advance screenshot
// // // was uploaded), and bookingNotes (the typed package/boarding/deboarding/
// // // addons/remarks). No tnr/travellerId yet — those get filled in later, once
// // // this walk-in booking is picked up from the All Bookings page and an
// // // actual tourBookingModel booking + tnr is created for it. All docs from
// // // this one Save share a groupId so that page can fetch them back together
// // // before a tnr exists.
// // export const saveAadhaarUpload = async (req, res) => {
// //   try {
// //     const {
// //       tourId,
// //       packageType,
// //       boardingPoint,
// //       deboardingPoint,
// //       addons,
// //       remarks,
// //       traveller,
// //       coTravellers,
// //       advanceScreenshot,
// //     } = req.body;
 
// //     if (!tourId) {
// //       return res.status(400).json({ success: false, message: "Select a tour first" });
// //     }
// //     if (!traveller?.front?.url) {
// //       return res.status(400).json({ success: false, message: "Aadhaar front image is required" });
// //     }
 
// //     const groupId = new mongoose.Types.ObjectId().toString();
// //     const parsed = {
// //       firstName: traveller.firstName || "",
// //       lastName: traveller.lastName || "",
// //       age: traveller.age || null,
// //       dob: traveller.dob || "",
// //       gender: traveller.gender || "",
// //       address: traveller.address || "",
// //       phone: traveller.phone || "",
// //       title: traveller.title || "",
// //       sharingType: traveller.sharingType || "",
// //     };
 
// //     const docs = [
// //       {
// //         groupId,
// //         type: "aadhaarFront",
// //         isCoTraveller: false,
// //         url: traveller.front.url,
// //         ocrText: traveller.front.ocrText || "",
// //         parsed,
// //         uploadedBy: "admin",
// //       },
// //     ];
 
// //     if (traveller.back?.url) {
// //       docs.push({
// //         groupId,
// //         type: "aadhaarBack",
// //         isCoTraveller: false,
// //         url: traveller.back.url,
// //         ocrText: traveller.back.ocrText || "",
// //         parsed,
// //         uploadedBy: "admin",
// //       });
// //     }
 
// //     // Co-travellers — up to 9 more (10 per booking including the main
// //     // traveller) — Aadhaar FRONT side only, no back needed.
// //     if (Array.isArray(coTravellers)) {
// //       for (const ct of coTravellers) {
// //         if (!ct?.front?.url) continue; // skip incomplete entries silently
// //         docs.push({
// //           groupId,
// //           type: "aadhaarFront",
// //           isCoTraveller: true,
// //           url: ct.front.url,
// //           ocrText: ct.front.ocrText || "",
// //           parsed: {
// //             firstName: ct.firstName || "",
// //             lastName: ct.lastName || "",
// //             age: ct.age || null,
// //             dob: ct.dob || "",
// //             gender: ct.gender || "",
// //             address: ct.address || "",
// //             phone: ct.phone || "",
// //             title: ct.title || "",
// //             sharingType: ct.sharingType || "",
// //           },
// //           uploadedBy: "admin",
// //         });
// //       }
// //     }
 
// //     if (advanceScreenshot?.url) {
// //       docs.push({
// //         groupId,
// //         type: "paymentAdvance",
// //         url: advanceScreenshot.url,
// //         amount: advanceScreenshot.amount ?? null,
// //         uploadedBy: "admin",
// //       });
// //     }
 
// //     docs.push({
// //       groupId,
// //       type: "bookingNotes",
// //       tourId,
// //       packageType: packageType || "",
// //       boardingPoint: boardingPoint || "",
// //       deboardingPoint: deboardingPoint || "",
// //       addons: addons || "",
// //       remarks: remarks || "",
// //       uploadedBy: "admin",
// //     });
 
// //     const created = await aadhaarModel.insertMany(docs);
 
// //     return res.status(201).json({ success: true, groupId, docs: created });
// //   } catch (error) {
// //     console.error("saveAadhaarUpload error:", error);
// //     return res.status(500).json({ success: false, message: "Could not save this booking.", error: error.message });
// //   }
// // };
 
// // // GET /ocr/bookings — All Bookings tab. Groups every aadhaarModel doc that
// // // has a groupId into one card per booking: main traveller (front+back),
// // // co-travellers (front only), payment screenshots (advance/balance/
// // // partial, each possibly uploaded more than once), the typed booking
// // // notes, and the tnr once one has been linked (see linkGroupTnr below).
// // export const getAadhaarBookings = async (req, res) => {
// //   try {
// //     const docs = await aadhaarModel
// //       .find({ groupId: { $ne: null } })
// //       .sort({ createdAt: 1 })
// //       .populate("tourId", "title")
// //       .lean();
 
// //     const groups = {};
// //     for (const d of docs) {
// //       const gid = d.groupId;
// //       if (!groups[gid]) {
// //         groups[gid] = {
// //           groupId: gid,
// //           tnr: "",
// //           tourId: null,
// //           tourTitle: "",
// //           bookingNotes: null,
// //           main: null,
// //           coTravellers: [],
// //           payments: { advance: null, balance: [], partial: [] },
// //           createdAt: d.createdAt,
// //         };
// //       }
// //       const g = groups[gid];
// //       if (d.tnr) g.tnr = d.tnr;
 
// //       if (d.type === "bookingNotes") {
// //         g.tourId = d.tourId?._id || d.tourId || null;
// //         g.tourTitle = d.tourId?.title || "";
// //         g.bookingNotes = {
// //           packageType: d.packageType,
// //           boardingPoint: d.boardingPoint,
// //           deboardingPoint: d.deboardingPoint,
// //           addons: d.addons,
// //           remarks: d.remarks,
// //         };
// //       } else if (d.type === "aadhaarFront") {
// //         const traveller = { _id: d._id, ...d.parsed, url: d.url, ocrText: d.ocrText };
// //         if (d.isCoTraveller) g.coTravellers.push(traveller);
// //         else g.main = { ...traveller, front: { url: d.url }, back: g.main?.back || null };
// //       } else if (d.type === "aadhaarBack") {
// //         if (!d.isCoTraveller) {
// //           g.main = g.main
// //             ? { ...g.main, back: { url: d.url } }
// //             : { _id: d._id, ...d.parsed, back: { url: d.url }, front: null };
// //         }
// //       } else if (d.type === "paymentAdvance") {
// //         g.payments.advance = { _id: d._id, url: d.url, amount: d.amount, createdAt: d.createdAt };
// //       } else if (d.type === "paymentBalance") {
// //         g.payments.balance.push({ _id: d._id, url: d.url, amount: d.amount, createdAt: d.createdAt });
// //       } else if (d.type === "paymentPartial") {
// //         g.payments.partial.push({ _id: d._id, url: d.url, amount: d.amount, createdAt: d.createdAt });
// //       }
// //     }
 
// //     const bookings = Object.values(groups).sort(
// //       (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
// //     );
 
// //     return res.status(200).json({ success: true, bookings });
// //   } catch (error) {
// //     console.error("getAadhaarBookings error:", error);
// //     return res.status(500).json({ success: false, message: "Could not fetch bookings.", error: error.message });
// //   }
// // };
 
// // // POST /ocr/add-co-traveller — adds ONE more traveller to an existing
// // // booking group, Aadhaar front side only. Used from both tabs: on Tab 1
// // // before Save, and on Tab 2 any time afterwards (before OR after a tnr has
// // // been linked — if the group already has a tnr, the new traveller is
// // // tagged with it immediately).
// // export const addCoTraveller = async (req, res) => {
// //   try {
// //     const { groupId, title, firstName, lastName, age, dob, gender, sharingType, phone, address, front } = req.body;
 
// //     if (!groupId) return res.status(400).json({ success: false, message: "groupId is required" });
// //     if (!front?.url) return res.status(400).json({ success: false, message: "Aadhaar front image is required" });
 
// //     const existing = await aadhaarModel.findOne({ groupId }).select("tnr");
 
// //     const doc = await aadhaarModel.create({
// //       groupId,
// //       tnr: existing?.tnr || "",
// //       type: "aadhaarFront",
// //       isCoTraveller: true,
// //       url: front.url,
// //       ocrText: front.ocrText || "",
// //       parsed: {
// //         firstName: firstName || "",
// //         lastName: lastName || "",
// //         age: age || null,
// //         dob: dob || "",
// //         gender: gender || "",
// //         address: address || "",
// //         phone: phone || "",
// //         title: title || "",
// //         sharingType: sharingType || "",
// //       },
// //       uploadedBy: "admin",
// //     });
 
// //     return res.status(201).json({ success: true, traveller: doc });
// //   } catch (error) {
// //     console.error("addCoTraveller error:", error);
// //     return res.status(500).json({ success: false, message: "Could not add co-traveller.", error: error.message });
// //   }
// // };
 
// // // POST /ocr/upload-group-payment — multipart: screenshot; body: groupId,
// // // type (advance|balance|partial), amount. Unlike the old
// // // uploadPaymentScreenshot (which only uploaded to Cloudinary and handed the
// // // url back for CreateBooking.jsx to carry), this one SAVES the screenshot
// // // straight into aadhaarModel against the group — Balance/Partial can be
// // // uploaded more than once (e.g. part-payments over time), each call just
// // // adds one more doc.
// // export const uploadGroupPayment = async (req, res) => {
// //   try {
// //     const file = req.file;
// //     const { groupId, type, amount } = req.body;
 
// //     if (!file) return res.status(400).json({ success: false, message: "Screenshot image is required" });
// //     if (!groupId) return res.status(400).json({ success: false, message: "groupId is required" });
// //     if (!["advance", "balance", "partial"].includes(type)) {
// //       return res.status(400).json({ success: false, message: "type must be advance, balance or partial" });
// //     }
 
// //     const upload = await cloudinary.uploader.upload(file.path, { folder: "payment-screenshots", resource_type: "image" });
// //     const existing = await aadhaarModel.findOne({ groupId }).select("tnr");
 
// //     const doc = await aadhaarModel.create({
// //       groupId,
// //       tnr: existing?.tnr || "",
// //       type: type === "advance" ? "paymentAdvance" : type === "balance" ? "paymentBalance" : "paymentPartial",
// //       url: upload.secure_url,
// //       amount: amount ? Number(amount) : null,
// //       uploadedBy: "admin",
// //     });
 
// //     return res.status(201).json({ success: true, payment: doc });
// //   } catch (error) {
// //     console.error("uploadGroupPayment error:", error);
// //     return res.status(500).json({ success: false, message: "Upload failed.", error: error.message });
// //   }
// // };
 
// // // POST /ocr/link-tnr — once "Create Booking" (on Tab 2) has sent the admin
// // // to the existing, untouched CreateBooking.jsx flow and a real tnr has been
// // // generated there, the admin pastes it back here so this group's docs
// // // (main + co-travellers + all screenshots) carry that tnr too. Also makes
// // // the card show "Raise Manage Booking" from then on.
// // export const linkGroupTnr = async (req, res) => {
// //   try {
// //     const { groupId, tnr } = req.body;
// //     if (!groupId || !tnr) {
// //       return res.status(400).json({ success: false, message: "groupId and tnr are required" });
// //     }
// //     await aadhaarModel.updateMany({ groupId }, { $set: { tnr: tnr.trim().toUpperCase() } });
// //     return res.status(200).json({ success: true });
// //   } catch (error) {
// //     console.error("linkGroupTnr error:", error);
// //     return res.status(500).json({ success: false, message: "Could not link TNR.", error: error.message });
// //   }
// // };


// import mongoose from "mongoose";
// import { v2 as cloudinary } from "cloudinary";
// import { createWorker } from "tesseract.js";
// import sharp from "sharp";
// import fs from "fs";
// import aadhaarModel from "../models/aadhaarModel.js";
// // Read-only use here — only ever queried (.find/.findOne), never written.
// // Writing to this model (payment fields especially) stays off-limits until
// // updateBookingBalance/updateTourBalance/markOfflineAdvancePaid from
// // tourController.js have been reviewed — invoiceNumber generation only
// // fires inside tourBookingSchema's pre("save") hook, so any write that
// // bypasses .save() (e.g. a raw updateOne) would silently skip it.
// import tourBookingModel from "../models/tourBookingModel.js";
 
// let workerPromise;
// function getWorker() {
//   if (!workerPromise) {
//     workerPromise = createWorker("eng").then(async (worker) => {
//       // Aadhaar cards are mostly short, isolated lines of printed text
//       // (name / DOB / gender / address block), not paragraphs — PSM 6
//       // ("assume a single uniform block of text") reads that far more
//       // reliably than Tesseract's default "auto page layout" mode, which
//       // was producing garbled, out-of-order text on photographed cards.
//       await worker.setParameters({ tessedit_pageseg_mode: "6" });
//       return worker;
//     });
//   }
//   return workerPromise;
// }
 
// // Phone photos of an Aadhaar card are usually low-contrast, slightly
// // skewed/noisy, and sometimes small — all of which wreck raw Tesseract
// // accuracy (this is what was producing garbled text like "Wo: SHSM,
// // HETEAT2..." instead of a real name/address). Upscaling + grayscale +
// // contrast normalization + a light sharpen is the standard fix and
// // consistently improves OCR accuracy on this kind of photo, without
// // touching the parsing logic below at all. If preprocessing itself fails
// // for any reason, we fall back to the original file rather than failing
// // the whole read.
// async function preprocessForOcr(filePath) {
//   const outPath = `${filePath}-ocr.png`;
//   const image = sharp(filePath).rotate(); // auto-orient via EXIF
//   const metadata = await image.metadata();
//   const targetWidth = Math.max(metadata.width || 0, 1600);
//   await image
//     .resize({ width: targetWidth, withoutEnlargement: false })
//     .grayscale()
//     .normalize()
//     .sharpen()
//     .toFile(outPath);
//   return outPath;
// }
 
// async function readImageText(filePath) {
//   const worker = await getWorker();
//   let ocrPath = filePath;
//   let preprocessed = false;
//   try {
//     ocrPath = await preprocessForOcr(filePath);
//     preprocessed = true;
//   } catch (err) {
//     console.error("OCR preprocess failed, reading original image instead:", err.message);
//   }
//   try {
//     const { data: { text } } = await worker.recognize(ocrPath);
//     return text;
//   } finally {
//     if (preprocessed) {
//       fs.unlink(ocrPath, () => {}); // best-effort cleanup of the temp preprocessed file
//     }
//   }
// }
// // Plain edit-distance, used only for the gender word below (short strings,
// // no need for anything fancier).
// function levenshtein(a, b) {
//   const m = a.length, n = b.length;
//   const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
//   for (let i = 0; i <= m; i++) dp[i][0] = i;
//   for (let j = 0; j <= n; j++) dp[0][j] = j;
//   for (let i = 1; i <= m; i++) {
//     for (let j = 1; j <= n; j++) {
//       dp[i][j] =
//         a[i - 1] === b[j - 1]
//           ? dp[i - 1][j - 1]
//           : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
//     }
//   }
//   return dp[m][n];
// }
 
// // "FEMALE" on a blurry/angled Aadhaar scan often comes out as "FEMALZ",
// // "FEMAIE", "FENALE", "FEMAL" etc — none of which match /female/i, so the
// // old code fell through and the frontend silently defaulted to Male/Mr
// // even on an obviously female card (reported: "Vasanthi" card came out
// // Male). Exact match first (cheap, no false positives); if that fails,
// // check every word-like token against FEMALE/MALE/TRANSGENDER by edit
// // distance instead of giving up.
// function detectGender(text) {
//   if (/female/i.test(text)) return "Female";
//   if (/\bmale\b/i.test(text)) return "Male";
//   if (/transgender/i.test(text)) return "Other";
 
//   const words = text.match(/[A-Za-z]{3,}/g) || [];
//   let best = { gender: "", dist: Infinity };
//   for (const raw of words) {
//     const w = raw.toUpperCase();
//     const dFemale = levenshtein(w, "FEMALE");
//     const dMale = levenshtein(w, "MALE");
//     const dTrans = levenshtein(w, "TRANSGENDER");
//     // Thresholds scale with the target word's length — MALE is short, so
//     // it needs a near-exact match or half the junk text on the card would
//     // "match" it; FEMALE/TRANSGENDER are longer and can tolerate more
//     // misreads before the match becomes unreliable.
//     if (dFemale <= 2 && dFemale < best.dist) best = { gender: "Female", dist: dFemale };
//     if (dMale <= 1 && dMale < best.dist) best = { gender: "Male", dist: dMale };
//     if (dTrans <= 3 && dTrans < best.dist) best = { gender: "Other", dist: dTrans };
//   }
//   return best.gender;
// }
// function calcAge(dob) {
//   const [d, m, y] = dob.split(/[/\-.]/).map(Number);
//   if (!d || !m || !y) return "";
//   const today = new Date();
//   let age = today.getFullYear() - y;
//   if (today < new Date(today.getFullYear(), m - 1, d)) age--;
//   return age;
// }
// function parseAadhaarText(text = "") {
//   const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
//   const dobMatch = text.match(/(?:DOB|D\.O\.B|Date of Birth)\s*[:\-]?\s*(\d{2}[/\-]\d{2}[/\-]\d{4})/i);
//   const yobMatch = text.match(/(?:Year of Birth|YOB)\s*[:\-]?\s*(\d{4})/i);
//   let age = "", dob = "";
//   if (dobMatch) { dob = dobMatch[1]; age = calcAge(dob); }
//   else if (yobMatch) { age = new Date().getFullYear() - Number(yobMatch[1]); }
//   const gender = detectGender(text);
//   let fullName = "";
//   const dobIdx = lines.findIndex((l) => /DOB|D\.O\.B|Year of Birth|YOB|Date of Birth/i.test(l));
//   for (let i = dobIdx - 1; i >= 0; i--) {
//     const line = lines[i];
//     if (/government|india|authority|unique identification/i.test(line)) continue;
//     // The line right above DOB is very often "Father : SUPPAIYA" (or
//     // S/O, D/O, W/O, C/O), NOT the cardholder's own name — it printed
//     // the father's/husband's name there, closer to DOB than the actual
//     // name line above it. Without this skip, that line "wins" (it's
//     // clean letters too) and the father's name gets saved as the
//     // traveller's own name (reported: "Geetha Sankaram"'s card came out
//     // as "Suppaiya Suppaiya" — her father's name, not hers).
//     if (/father|\b[sdwc]\/o\b/i.test(line)) continue;
//     // The old rule required the WHOLE line to be clean letters-only text,
//     // which meant a real name line with ANY stray OCR noise attached to
//     // it — "8] | g Vasanthi 2", "gE & Elango Sivaprakasam &" — got
//     // skipped entirely, either landing on an unrelated earlier line that
//     // happened to be all-letters ("CY Ne oy") or finding nothing at all
//     // and leaving First/Last Name blank. Instead, pull out the longest
//     // run of letters/spaces/dots FROM WITHIN the line, then drop any
//     // single-letter "word" left in it (OCR noise like a stray "g" or "|"
//     // misread as a letter — never a real first/last name on its own).
//     const runs = line.match(/[A-Za-z][A-Za-z .]*/g) || [];
//     const candidates = runs
//       .map((r) => r.trim().split(/\s+/).filter((w) => w.length > 1).join(" "))
//       .filter((c) => c.length >= 3)
//       .sort((a, b) => b.length - a.length);
//     if (candidates[0]) {
//       fullName = candidates[0];
//       break;
//     }
//   }
//   const parts = fullName.split(/\s+/).filter(Boolean);
//   const firstName = parts[0] || "";
//   let lastName = parts.slice(1).join(" ");
//   // When the card only has one name (e.g. "Vasanthi", no surname printed
//   // at all), fill Last Name with that same name instead of leaving it
//   // blank — downstream (ticketing/booking) needs both fields filled, and
//   // an empty Last Name just means the admin has to type it in by hand
//   // every time. This only fires when there was genuinely no second word
//   // in the extracted name — it doesn't duplicate a real two-part name.
//   if (!lastName) {
//     lastName = firstName;
//   }
//   const phone = extractPhone(text);
//   const address = extractAddress(text);
//   return { firstName, lastName, age, dob, gender, address, phone };
// }
 
// // Mobile number — many Aadhaar scans OCR a 10-digit mobile number with an
// // internal space or hyphen (e.g. "98765 43210" instead of "9876543210"),
// // which the old strict \b[6-9]\d{9}\b regex missed entirely. This tolerates
// // that gap. Note: a lot of current Aadhaar cards simply don't print a
// // mobile number on the card at all — no regex can recover a number that
// // was never printed.
// function extractPhone(text = "") {
//   const match = text.match(/\b([6-9]\d{4})[\s-]?(\d{5})\b/);
//   return match ? `${match[1]}${match[2]}` : "";
// }
 
// // Address — the old regex required the literal word "Address" to OCR
// // cleanly, which is fragile on noisy scans. Try progressively looser
// // fallbacks, all anchored on the 6-digit PIN code every Aadhaar address
// // ends with, which OCRs far more reliably than the word "Address" itself.
// function extractAddress(text = "") {
//   // 1) Literal "Address" keyword through the PIN code.
//   let match = text.match(/Address[:\s]*([\s\S]*?\b\d{6}\b)/i);
//   if (match) return match[1].replace(/\s*\n\s*/g, ", ").trim();
 
//   // 2) S/O, D/O, W/O or C/O (son/daughter/wife/care of) marker through the
//   // PIN code — most Aadhaar backs start the address with one of these even
//   // when the word "Address" itself doesn't OCR cleanly.
//   match = text.match(/\b[SDWC]\/O[:\s]*([\s\S]*?\b\d{6}\b)/i);
//   if (match) return match[1].replace(/\s*\n\s*/g, ", ").trim();
 
//   // 3) Last resort — take the handful of lines immediately before the
//   // first 6-digit PIN code found anywhere in the text.
//   match = text.match(/\b\d{6}\b/);
//   if (match) {
//     const idx = text.indexOf(match[0]);
//     const before = text.slice(0, idx + match[0].length);
//     const lines = before.split("\n").map((l) => l.trim()).filter(Boolean);
//     return lines.slice(-6).join(", ");
//   }
 
//   return "";
// }
// function mergeSides(front, back) {
//   return {
//     firstName: front.firstName || back.firstName || "",
//     lastName: front.lastName || back.lastName || "",
//     age: front.age || back.age || "",
//     dob: front.dob || back.dob || "",
//     gender: front.gender || back.gender || "",
//     phone: front.phone || back.phone || "",
//     address: back.address || front.address || "",
//   };
// }
 
// // POST /ocr/aadhaar — multipart: front (required), back (optional)
// export const extractAadhaar = async (req, res) => {
//   try {
//     const frontFile = req.files?.front?.[0];
//     const backFile = req.files?.back?.[0];
//     if (!frontFile) {
//       return res.status(400).json({ success: false, message: "Aadhaar front image is required" });
//     }
//     const frontText = await readImageText(frontFile.path);
//     const frontData = parseAadhaarText(frontText);
//     const frontUpload = await cloudinary.uploader.upload(frontFile.path, { folder: "aadhaar", resource_type: "image" });
 
//     let backData = {}, backUpload = null, backText = "";
//     if (backFile) {
//       backText = await readImageText(backFile.path);
//       backData = parseAadhaarText(backText);
//       backUpload = await cloudinary.uploader.upload(backFile.path, { folder: "aadhaar", resource_type: "image" });
//     }
//     const merged = mergeSides(frontData, backData);
//     return res.status(200).json({
//       success: true,
//       parsed: merged,
//       front: { url: frontUpload.secure_url, ocrText: frontText },
//       back: backUpload ? { url: backUpload.secure_url, ocrText: backText } : null,
//     });
//   } catch (error) {
//     console.error("extractAadhaar error:", error);
//     return res.status(500).json({ success: false, message: "Could not read the Aadhaar image.", error: error.message });
//   }
// };
 
// // POST /ocr/payment-screenshot — multipart: screenshot; body: type, amount
// // (optional manual override). Same OCR-first amount reading as
// // uploadGroupPayment below, kept consistent for the Tab 1 Advance Payment
// // upload (this is the only payment type collected on Tab 1 — Balance/
// // Partial always go through uploadGroupPayment on the All Bookings tab).
// export const uploadPaymentScreenshot = async (req, res) => {
//   try {
//     const file = req.file;
//     const { type, amount } = req.body;
//     if (!file) return res.status(400).json({ success: false, message: "Screenshot image is required" });
//     if (!["advance", "balance", "partial"].includes(type)) {
//       return res.status(400).json({ success: false, message: "type must be advance, balance or partial" });
//     }
//     const upload = await cloudinary.uploader.upload(file.path, { folder: "payment-screenshots", resource_type: "image" });
 
//     let ocrAmount = null;
//     try {
//       const text = await readImageText(file.path);
//       ocrAmount = extractPaymentAmount(text);
//     } catch (err) {
//       console.error("Payment screenshot OCR failed, falling back to typed amount:", err.message);
//     }
//     const finalAmount = ocrAmount ?? (amount ? Number(amount) : null);
 
//     return res.status(200).json({
//       success: true,
//       type,
//       url: upload.secure_url,
//       amount: finalAmount,
//       amountSource: ocrAmount !== null ? "ocr" : amount ? "manual" : "none",
//     });
//   } catch (error) {
//     console.error("uploadPaymentScreenshot error:", error);
//     return res.status(500).json({ success: false, message: "Upload failed.", error: error.message });
//   }
// };
 
// export const saveBookingNotes = async (req, res) => {
//   try {
//     const { tourId, packageType, boardingPoint, deboardingPoint, addons, remarks } = req.body;
 
//     if (!tourId) {
//       return res.status(400).json({ success: false, message: "tourId is required" });
//     }
 
//     const doc = await aadhaarModel.create({
//       type: "bookingNotes",
//       tourId,
//       packageType: packageType || "",
//       boardingPoint: boardingPoint || "",
//       deboardingPoint: deboardingPoint || "",
//       addons: addons || "",
//       remarks: remarks || "",
//       uploadedBy: "admin",
//     });
 
//     return res.status(201).json({ success: true, note: doc });
//   } catch (error) {
//     console.error("saveBookingNotes error:", error);
//     return res.status(500).json({ success: false, message: "Could not save booking notes.", error: error.message });
//   }
// };
 
// // POST /ocr/save-aadhaar-upload — the Aadhaar Upload page's "Save Booking"
// // button. One call, one walk-in booking capture: creates every aadhaarModel
// // doc this capture produced — aadhaarFront (always), aadhaarBack (if the
// // back side was also captured), paymentAdvance (if an advance screenshot
// // was uploaded), and bookingNotes (the typed package/boarding/deboarding/
// // addons/remarks). No tnr/travellerId yet — those get filled in later, once
// // this walk-in booking is picked up from the All Bookings page and an
// // actual tourBookingModel booking + tnr is created for it. All docs from
// // this one Save share a groupId so that page can fetch them back together
// // before a tnr exists.
// export const saveAadhaarUpload = async (req, res) => {
//   try {
//     const {
//       tourId,
//       packageType,
//       boardingPoint,
//       deboardingPoint,
//       addons,
//       addonsDetail,
//       remarks,
//       traveller,
//       coTravellers,
//       advanceScreenshot,
//     } = req.body;
 
//     if (!tourId) {
//       return res.status(400).json({ success: false, message: "Select a tour first" });
//     }
//     if (!traveller?.front?.url) {
//       return res.status(400).json({ success: false, message: "Aadhaar front image is required" });
//     }
 
//     const groupId = new mongoose.Types.ObjectId().toString();
//     const parsed = {
//       firstName: traveller.firstName || "",
//       lastName: traveller.lastName || "",
//       age: traveller.age || null,
//       dob: traveller.dob || "",
//       gender: traveller.gender || "",
//       address: traveller.address || "",
//       phone: traveller.phone || "",
//       title: traveller.title || "",
//       sharingType: traveller.sharingType || "",
//     };
 
//     const docs = [
//       {
//         groupId,
//         type: "aadhaarFront",
//         isCoTraveller: false,
//         url: traveller.front.url,
//         ocrText: traveller.front.ocrText || "",
//         parsed,
//         uploadedBy: "admin",
//       },
//     ];
 
//     if (traveller.back?.url) {
//       docs.push({
//         groupId,
//         type: "aadhaarBack",
//         isCoTraveller: false,
//         url: traveller.back.url,
//         ocrText: traveller.back.ocrText || "",
//         parsed,
//         uploadedBy: "admin",
//       });
//     }
 
//     // Co-travellers — up to 9 more (10 per booking including the main
//     // traveller) — Aadhaar FRONT side only, no back needed.
//     if (Array.isArray(coTravellers)) {
//       for (const ct of coTravellers) {
//         if (!ct?.front?.url) continue; // skip incomplete entries silently
//         docs.push({
//           groupId,
//           type: "aadhaarFront",
//           isCoTraveller: true,
//           url: ct.front.url,
//           ocrText: ct.front.ocrText || "",
//           parsed: {
//             firstName: ct.firstName || "",
//             lastName: ct.lastName || "",
//             age: ct.age || null,
//             dob: ct.dob || "",
//             gender: ct.gender || "",
//             address: ct.address || "",
//             phone: ct.phone || "",
//             title: ct.title || "",
//             sharingType: ct.sharingType || "",
//           },
//           uploadedBy: "admin",
//         });
//       }
//     }
 
//     if (advanceScreenshot?.url) {
//       docs.push({
//         groupId,
//         type: "paymentAdvance",
//         url: advanceScreenshot.url,
//         amount: advanceScreenshot.amount ?? null,
//         uploadedBy: "admin",
//       });
//     }
 
//     docs.push({
//       groupId,
//       type: "bookingNotes",
//       tourId,
//       packageType: packageType || "",
//       boardingPoint: boardingPoint || "",
//       deboardingPoint: deboardingPoint || "",
//       addons: addons || "",
//       addonsDetail: Array.isArray(addonsDetail) ? addonsDetail : [],
//       remarks: remarks || "",
//       uploadedBy: "admin",
//     });
 
//     const created = await aadhaarModel.insertMany(docs);
 
//     return res.status(201).json({ success: true, groupId, docs: created });
//   } catch (error) {
//     console.error("saveAadhaarUpload error:", error);
//     return res.status(500).json({ success: false, message: "Could not save this booking.", error: error.message });
//   }
// };
 
// // Matches a walk-in booking group (from this Aadhaar Upload page) to the
// // real tourBookingModel booking that "Create Booking" produced for it, and
// // links the tnr automatically — no manual paste needed. CreateBooking.jsx
// // is never touched, so there's no event/callback telling us when that
// // booking gets created; instead this matches on what we know must be true
// // of it: same tour, same contact mobile number (the main traveller's
// // phone — CreateBooking.jsx receives it as contactMobile, prefilled from
// // this exact group), and booked at/after this group's own createdAt (the
// // real booking can only have been created afterwards, never before).
// // tourBookingModel has no timestamps:true — `bookingDate` is its own
// // created-at equivalent (defaults to Date.now on creation). Only read
// // queries here, never a write to tourBookingModel itself.
// // tourController.js's offline Create Booking endpoint takes `contact.mobile`
// // as its OWN typed field (`const mobile = (contact?.mobile || "").trim()`,
// // around line 646) — it is NOT auto-filled from this Aadhaar group's
// // group.main.phone, so a strict string-equality match broke the moment the
// // admin's typed number differed by so much as a space, dash or leading
// // "+91" from the one OCR'd off the card. Compare by the last 10 digits of
// // each number instead of the raw strings, so formatting differences don't
// // block the match — only the actual digits have to agree.
// const normalizePhone = (p) => String(p || "").replace(/\D/g, "").slice(-10);
 
// async function autoMatchTnrForGroup(group) {
//   if (group.tnr || !group.tourId || !group.main?.phone) {
//     console.log(
//       `[autoMatchTnr] skip group ${group.groupId}: tourId=${!!group.tourId} phone=${group.main?.phone || "none"}`,
//     );
//     return null;
//   }
 
//   try {
//     // Don't re-match a tnr some OTHER group has already claimed, so two
//     // different walk-in bookings for the same phone+tour can't collide.
//     const claimedTnrs = await aadhaarModel.distinct("tnr", { tnr: { $nin: [null, ""] } });
//     const wantPhone = normalizePhone(group.main.phone);
 
//     // Phone comparison happens in JS (below), not in this query, since
//     // Mongo can't normalize digits for us — pull every same-tour booking
//     // created at/after this group and check each one's contact.mobile.
//     const candidates = await tourBookingModel
//       .find({
//         tourId: group.tourId,
//         bookingDate: { $gte: group.createdAt },
//         tnr: { $exists: true, $nin: [null, "", ...claimedTnrs] },
//       })
//       .sort({ bookingDate: 1 })
//       .select("tnr contact.mobile")
//       .lean();
 
//     const candidate = candidates.find((c) => normalizePhone(c.contact?.mobile) === wantPhone);
 
//     if (!candidate?.tnr) {
//       console.log(
//         `[autoMatchTnr] no match for group ${group.groupId} (looking for phone ending ${wantPhone}); checked ${candidates.length} same-tour booking(s): ${candidates.map((c) => normalizePhone(c.contact?.mobile)).join(", ") || "none"}`,
//       );
//       return null;
//     }
//     console.log(`[autoMatchTnr] linked tnr ${candidate.tnr} to group ${group.groupId}`);
 
//     await aadhaarModel.updateMany({ groupId: group.groupId }, { $set: { tnr: candidate.tnr } });
//     return candidate.tnr;
//   } catch (err) {
//     console.error(`autoMatchTnrForGroup failed for group ${group.groupId}:`, err.message);
//     return null;
//   }
// }
 
// // GET /ocr/bookings — All Bookings tab. Groups every aadhaarModel doc that
// // has a groupId into one card per booking: main traveller (front+back),
// // co-travellers (front only), payment screenshots (advance/balance/
// // partial, each possibly uploaded more than once), the typed booking
// // notes, and the tnr — auto-matched against the real booking the moment
// // one exists (autoMatchTnrForGroup above), falling back to linkGroupTnr's
// // manual paste only if the auto-match can't find it (e.g. a mismatched
// // phone number).
// export const getAadhaarBookings = async (req, res) => {
//   try {
//     const docs = await aadhaarModel
//       .find({ groupId: { $ne: null } })
//       .sort({ createdAt: 1 })
//       .populate("tourId", "title")
//       .lean();
 
//     const groups = {};
//     for (const d of docs) {
//       const gid = d.groupId;
//       if (!groups[gid]) {
//         groups[gid] = {
//           groupId: gid,
//           tnr: "",
//           tourId: null,
//           tourTitle: "",
//           bookingNotes: null,
//           main: null,
//           coTravellers: [],
//           payments: { advance: null, balance: [], partial: [] },
//           createdAt: d.createdAt,
//         };
//       }
//       const g = groups[gid];
//       if (d.tnr) g.tnr = d.tnr;
 
//       if (d.type === "bookingNotes") {
//         g.tourId = d.tourId?._id || d.tourId || null;
//         g.tourTitle = d.tourId?.title || "";
//         g.bookingNotes = {
//           packageType: d.packageType,
//           boardingPoint: d.boardingPoint,
//           deboardingPoint: d.deboardingPoint,
//           addons: d.addons,
//           addonsDetail: d.addonsDetail || [],
//           remarks: d.remarks,
//         };
//       } else if (d.type === "aadhaarFront") {
//         const traveller = {
//           _id: d._id,
//           ...d.parsed,
//           url: d.url,
//           ocrText: d.ocrText,
//           // Only true for someone added via "Add Co-Traveller" after the
//           // group already had a tnr — gates the "Raise Manage Booking"
//           // button so it never shows for travellers already in the
//           // original booking.
//           postBooking: !!d.postBooking,
//         };
//         if (d.isCoTraveller) g.coTravellers.push(traveller);
//         else g.main = { ...traveller, front: { url: d.url }, back: g.main?.back || null };
//       } else if (d.type === "aadhaarBack") {
//         if (!d.isCoTraveller) {
//           g.main = g.main
//             ? { ...g.main, back: { url: d.url } }
//             : { _id: d._id, ...d.parsed, back: { url: d.url }, front: null };
//         }
//       } else if (d.type === "paymentAdvance") {
//         g.payments.advance = { _id: d._id, url: d.url, amount: d.amount, createdAt: d.createdAt };
//       } else if (d.type === "paymentBalance") {
//         g.payments.balance.push({ _id: d._id, url: d.url, amount: d.amount, createdAt: d.createdAt });
//       } else if (d.type === "paymentPartial") {
//         g.payments.partial.push({ _id: d._id, url: d.url, amount: d.amount, createdAt: d.createdAt });
//       }
//     }
 
//     let bookings = Object.values(groups);
 
//     // Auto-link the tnr for any booking that doesn't have one yet, so the
//     // admin never has to paste it in manually — see autoMatchTnrForGroup.
//     for (const b of bookings) {
//       if (!b.tnr) {
//         const matched = await autoMatchTnrForGroup(b);
//         if (matched) b.tnr = matched;
//       }
//     }
 
//     bookings = bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
 
//     return res.status(200).json({ success: true, bookings });
//   } catch (error) {
//     console.error("getAadhaarBookings error:", error);
//     return res.status(500).json({ success: false, message: "Could not fetch bookings.", error: error.message });
//   }
// };
 
// // POST /ocr/add-co-traveller — adds ONE more traveller to an existing
// // booking group, Aadhaar front side only. Used from both tabs: on Tab 1
// // before Save, and on Tab 2 any time afterwards (before OR after a tnr has
// // been linked — if the group already has a tnr, the new traveller is
// // tagged with it immediately).
// export const addCoTraveller = async (req, res) => {
//   try {
//     const { groupId, title, firstName, lastName, age, dob, gender, sharingType, phone, address, front } = req.body;
 
//     if (!groupId) return res.status(400).json({ success: false, message: "groupId is required" });
//     if (!front?.url) return res.status(400).json({ success: false, message: "Aadhaar front image is required" });
 
//     const existing = await aadhaarModel.findOne({ groupId }).select("tnr");
 
//     const doc = await aadhaarModel.create({
//       groupId,
//       tnr: existing?.tnr || "",
//       // If the group already has a tnr at this moment, this traveller is
//       // being added AFTER the booking was created — only those travellers
//       // should ever get a "Raise Manage Booking" button.
//       postBooking: !!existing?.tnr,
//       type: "aadhaarFront",
//       isCoTraveller: true,
//       url: front.url,
//       ocrText: front.ocrText || "",
//       parsed: {
//         firstName: firstName || "",
//         lastName: lastName || "",
//         age: age || null,
//         dob: dob || "",
//         gender: gender || "",
//         address: address || "",
//         phone: phone || "",
//         title: title || "",
//         sharingType: sharingType || "",
//       },
//       uploadedBy: "admin",
//     });
 
//     return res.status(201).json({ success: true, traveller: doc });
//   } catch (error) {
//     console.error("addCoTraveller error:", error);
//     return res.status(500).json({ success: false, message: "Could not add co-traveller.", error: error.message });
//   }
// };
 
// // Payment screenshots (UPI apps, bank apps, etc.) print the paid amount
// // next to a ₹/Rs/INR marker, almost always as the biggest number on
// // screen. Try the marked forms first (most reliable), then fall back to
// // the largest bare number with 2+ digits so a screenshot that OCR'd the
// // ₹ symbol poorly still gets a usable read.
// function extractPaymentAmount(text = "") {
//   const markedMatches = [
//     ...text.matchAll(/(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/gi),
//   ].map((m) => Number(m[1].replace(/,/g, "")));
//   if (markedMatches.length > 0) {
//     return Math.max(...markedMatches.filter((n) => !Number.isNaN(n)));
//   }
//   const bareNumbers = [...text.matchAll(/\b\d{2,3}(?:,\d{3})*(?:\.\d{1,2})?\b/g)]
//     .map((m) => Number(m[0].replace(/,/g, "")))
//     .filter((n) => !Number.isNaN(n) && n > 0);
//   return bareNumbers.length > 0 ? Math.max(...bareNumbers) : null;
// }
 
// // POST /ocr/upload-group-payment — multipart: screenshot; body: groupId,
// // type (advance|balance|partial), amount (optional manual override).
// // Unlike the old uploadPaymentScreenshot (which only uploaded to Cloudinary
// // and handed the url back for CreateBooking.jsx to carry), this one SAVES
// // the screenshot straight into aadhaarModel against the group — Balance/
// // Partial can be uploaded more than once (e.g. part-payments over time),
// // each call just adds one more doc. The paid amount is read off the
// // screenshot via OCR rather than relying on the admin typing it in; if OCR
// // can't find a number, the typed `amount` (if any) is used instead.
// export const uploadGroupPayment = async (req, res) => {
//   try {
//     const file = req.file;
//     const { groupId, type, amount } = req.body;
 
//     if (!file) return res.status(400).json({ success: false, message: "Screenshot image is required" });
//     if (!groupId) return res.status(400).json({ success: false, message: "groupId is required" });
//     if (!["advance", "balance", "partial"].includes(type)) {
//       return res.status(400).json({ success: false, message: "type must be advance, balance or partial" });
//     }
 
//     const upload = await cloudinary.uploader.upload(file.path, { folder: "payment-screenshots", resource_type: "image" });
//     const existing = await aadhaarModel.findOne({ groupId }).select("tnr");
 
//     let ocrAmount = null;
//     try {
//       const text = await readImageText(file.path);
//       ocrAmount = extractPaymentAmount(text);
//     } catch (err) {
//       console.error("Payment screenshot OCR failed, falling back to typed amount:", err.message);
//     }
//     const finalAmount = ocrAmount ?? (amount ? Number(amount) : null);
 
//     const doc = await aadhaarModel.create({
//       groupId,
//       tnr: existing?.tnr || "",
//       type: type === "advance" ? "paymentAdvance" : type === "balance" ? "paymentBalance" : "paymentPartial",
//       url: upload.secure_url,
//       amount: finalAmount,
//       uploadedBy: "admin",
//     });
 
//     return res.status(201).json({ success: true, payment: doc, amountSource: ocrAmount !== null ? "ocr" : amount ? "manual" : "none" });
//   } catch (error) {
//     console.error("uploadGroupPayment error:", error);
//     return res.status(500).json({ success: false, message: "Upload failed.", error: error.message });
//   }
// };
 
// // POST /ocr/link-tnr — once "Create Booking" (on Tab 2) has sent the admin
// // to the existing, untouched CreateBooking.jsx flow and a real tnr has been
// // generated there, the admin pastes it back here so this group's docs
// // (main + co-travellers + all screenshots) carry that tnr too. Also makes
// // the card show "Raise Manage Booking" from then on.
// export const linkGroupTnr = async (req, res) => {
//   try {
//     const { groupId, tnr } = req.body;
//     if (!groupId || !tnr) {
//       return res.status(400).json({ success: false, message: "groupId and tnr are required" });
//     }
//     await aadhaarModel.updateMany({ groupId }, { $set: { tnr: tnr.trim().toUpperCase() } });
//     return res.status(200).json({ success: true });
//   } catch (error) {
//     console.error("linkGroupTnr error:", error);
//     return res.status(500).json({ success: false, message: "Could not link TNR.", error: error.message });
//   }
// };

import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { createWorker } from "tesseract.js";
import sharp from "sharp";
import fs from "fs";
import aadhaarModel from "../models/aadhaarModel.js";
// Read-only use here — only ever queried (.find/.findOne), never written.
// Writing to this model (payment fields especially) stays off-limits until
// updateBookingBalance/updateTourBalance/markOfflineAdvancePaid from
// tourController.js have been reviewed — invoiceNumber generation only
// fires inside tourBookingSchema's pre("save") hook, so any write that
// bypasses .save() (e.g. a raw updateOne) would silently skip it.
import tourBookingModel from "../models/tourBookingModel.js";
 
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
// Plain edit-distance, used only for the gender word below (short strings,
// no need for anything fancier).
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}
 
// "FEMALE" on a blurry/angled Aadhaar scan often comes out as "FEMALZ",
// "FEMAIE", "FENALE", "FEMAL" etc — none of which match /female/i, so the
// old code fell through and the frontend silently defaulted to Male/Mr
// even on an obviously female card (reported: "Vasanthi" card came out
// Male). Exact match first (cheap, no false positives); if that fails,
// check every word-like token against FEMALE/MALE/TRANSGENDER by edit
// distance instead of giving up.
function detectGender(text) {
  if (/female/i.test(text)) return "Female";
  if (/\bmale\b/i.test(text)) return "Male";
  if (/transgender/i.test(text)) return "Other";
 
  const words = text.match(/[A-Za-z]{3,}/g) || [];
  let best = { gender: "", dist: Infinity };
  for (const raw of words) {
    const w = raw.toUpperCase();
    const dFemale = levenshtein(w, "FEMALE");
    const dMale = levenshtein(w, "MALE");
    const dTrans = levenshtein(w, "TRANSGENDER");
    // Thresholds scale with the target word's length — MALE is short, so
    // it needs a near-exact match or half the junk text on the card would
    // "match" it; FEMALE/TRANSGENDER are longer and can tolerate more
    // misreads before the match becomes unreliable.
    if (dFemale <= 2 && dFemale < best.dist) best = { gender: "Female", dist: dFemale };
    if (dMale <= 1 && dMale < best.dist) best = { gender: "Male", dist: dMale };
    if (dTrans <= 3 && dTrans < best.dist) best = { gender: "Other", dist: dTrans };
  }
  return best.gender;
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
  const gender = detectGender(text);
  let fullName = "";
  const dobIdx = lines.findIndex((l) => /DOB|D\.O\.B|Year of Birth|YOB|Date of Birth/i.test(l));
  // Every Aadhaar card prints the cardholder's name TWICE directly above
  // DOB: once in the regional script, once in English right below it.
  // Garbled OCR of the regional-script line (e.g. Tamil "கீதா சங்கர்ராம்"
  // misread as "SLleHLILIT") still often passes a bare "3+ letters" check,
  // so stopping at the FIRST line that produces any candidate (scanning
  // upward) can land on that garbage line and never reach the real English
  // name one line further up — reported live: Geetha Sankaram's card kept
  // reading as "SLleHLILIT SLleHLILIT" even after the Father-line skip
  // below was already working correctly.
  //
  // The reliable tell: a genuine printed English name is Title Case
  // ("Geetha", "Sankaram") — regional-script OCR noise almost never is
  // (irregular internal caps like "SLleHLILIT", or ALL-CAPS like "SHEDS").
  // So instead of stopping at the first candidate, scan a small window of
  // lines above DOB and score each by its count of Title-Case words,
  // keeping the best-scoring one (ties keep the line closest to DOB, same
  // as the old stop-at-first behaviour, so normal cards are unaffected).
  const NAME_SCAN_WINDOW = 6;
  let bestScore = -1;
  let bestCandidate = "";
  for (let i = dobIdx - 1; i >= Math.max(0, dobIdx - 1 - NAME_SCAN_WINDOW); i--) {
    const line = lines[i];
    if (/government|india|authority|unique identification/i.test(line)) continue;
    // The line right above DOB is very often "Father : SUPPAIYA" (or
    // S/O, D/O, W/O, C/O), NOT the cardholder's own name — it printed
    // the father's/husband's name there, closer to DOB than the actual
    // name line above it. Without this skip, that line "wins" (it's
    // clean letters too) and the father's name gets saved as the
    // traveller's own name (reported: "Geetha Sankaram"'s card came out
    // as "Suppaiya Suppaiya" — her father's name, not hers).
    if (/father|\b[sdwc]\/o\b/i.test(line)) continue;
    // The old rule required the WHOLE line to be clean letters-only text,
    // which meant a real name line with ANY stray OCR noise attached to
    // it — "8] | g Vasanthi 2", "gE & Elango Sivaprakasam &" — got
    // skipped entirely, either landing on an unrelated earlier line that
    // happened to be all-letters ("CY Ne oy") or finding nothing at all
    // and leaving First/Last Name blank. Instead, pull out every run of
    // letters/spaces/dots FROM WITHIN the line, split into words, and
    // drop any single-letter "word" (OCR noise like a stray "g" or "|"
    // misread as a letter — never a real first/last name on its own).
    const runs = line.match(/[A-Za-z][A-Za-z .]*/g) || [];
    const words = runs
      .flatMap((r) => r.trim().split(/\s+/))
      .filter((w) => w.length > 1);
    if (words.length === 0) continue;
 
    // Prefer just the Title-Case words when there are any — this is what
    // drops a stray lowercase noise word (like "hess" bleeding in from
    // the line above) from the final name, keeping only "Geetha Sankaram".
    const titleCaseWords = words.filter((w) => /^[A-Z][a-z]+$/.test(w));
    const candidate = (titleCaseWords.length > 0 ? titleCaseWords : words).join(" ");
    if (candidate.length < 3) continue;
 
    const score = titleCaseWords.length;
    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }
  fullName = bestCandidate;
  const parts = fullName.split(/\s+/).filter(Boolean);
  const firstName = parts[0] || "";
  let lastName = parts.slice(1).join(" ");
  // When the card only has one name (e.g. "Vasanthi", no surname printed
  // at all), fill Last Name with that same name instead of leaving it
  // blank — downstream (ticketing/booking) needs both fields filled, and
  // an empty Last Name just means the admin has to type it in by hand
  // every time. This only fires when there was genuinely no second word
  // in the extracted name — it doesn't duplicate a real two-part name.
  if (!lastName) {
    lastName = firstName;
  }
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
// (optional manual override). Same OCR-first amount reading as
// uploadGroupPayment below, kept consistent for the Tab 1 Advance Payment
// upload (this is the only payment type collected on Tab 1 — Balance/
// Partial always go through uploadGroupPayment on the All Bookings tab).
export const uploadPaymentScreenshot = async (req, res) => {
  try {
    const file = req.file;
    const { type, amount } = req.body;
    if (!file) return res.status(400).json({ success: false, message: "Screenshot image is required" });
    if (!["advance", "balance", "partial"].includes(type)) {
      return res.status(400).json({ success: false, message: "type must be advance, balance or partial" });
    }
    const upload = await cloudinary.uploader.upload(file.path, { folder: "payment-screenshots", resource_type: "image" });
 
    let ocrAmount = null;
    try {
      const text = await readImageText(file.path);
      ocrAmount = extractPaymentAmount(text);
    } catch (err) {
      console.error("Payment screenshot OCR failed, falling back to typed amount:", err.message);
    }
    const finalAmount = ocrAmount ?? (amount ? Number(amount) : null);
 
    return res.status(200).json({
      success: true,
      type,
      url: upload.secure_url,
      amount: finalAmount,
      amountSource: ocrAmount !== null ? "ocr" : amount ? "manual" : "none",
    });
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
      addonsDetail,
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
      addonsDetail: Array.isArray(addonsDetail) ? addonsDetail : [],
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
 
// Matches a walk-in booking group (from this Aadhaar Upload page) to the
// real tourBookingModel booking that "Create Booking" produced for it, and
// links the tnr automatically — no manual paste needed. CreateBooking.jsx
// is never touched, so there's no event/callback telling us when that
// booking gets created; instead this matches on what we know must be true
// of it: same tour, same contact mobile number (the main traveller's
// phone — CreateBooking.jsx receives it as contactMobile, prefilled from
// this exact group), and booked at/after this group's own createdAt (the
// real booking can only have been created afterwards, never before).
// tourBookingModel has no timestamps:true — `bookingDate` is its own
// created-at equivalent (defaults to Date.now on creation). Only read
// queries here, never a write to tourBookingModel itself.
// tourController.js's offline Create Booking endpoint takes `contact.mobile`
// as its OWN typed field (`const mobile = (contact?.mobile || "").trim()`,
// around line 646) — it is NOT auto-filled from this Aadhaar group's
// group.main.phone, so a strict string-equality match broke the moment the
// admin's typed number differed by so much as a space, dash or leading
// "+91" from the one OCR'd off the card. Compare by the last 10 digits of
// each number instead of the raw strings, so formatting differences don't
// block the match — only the actual digits have to agree.
const normalizePhone = (p) => String(p || "").replace(/\D/g, "").slice(-10);
 
async function autoMatchTnrForGroup(group) {
  if (group.tnr || !group.tourId || !group.main?.phone) {
    console.log(
      `[autoMatchTnr] skip group ${group.groupId}: tourId=${!!group.tourId} phone=${group.main?.phone || "none"}`,
    );
    return null;
  }
 
  try {
    // Don't re-match a tnr some OTHER group has already claimed, so two
    // different walk-in bookings for the same phone+tour can't collide.
    const claimedTnrs = await aadhaarModel.distinct("tnr", { tnr: { $nin: [null, ""] } });
    const wantPhone = normalizePhone(group.main.phone);
 
    // Phone comparison happens in JS (below), not in this query, since
    // Mongo can't normalize digits for us — pull every same-tour booking
    // created at/after this group and check each one's contact.mobile.
    const candidates = await tourBookingModel
      .find({
        tourId: group.tourId,
        bookingDate: { $gte: group.createdAt },
        tnr: { $exists: true, $nin: [null, "", ...claimedTnrs] },
      })
      .sort({ bookingDate: 1 })
      .select("tnr contact.mobile")
      .lean();
 
    const candidate = candidates.find((c) => normalizePhone(c.contact?.mobile) === wantPhone);
 
    if (!candidate?.tnr) {
      console.log(
        `[autoMatchTnr] no match for group ${group.groupId} (looking for phone ending ${wantPhone}); checked ${candidates.length} same-tour booking(s): ${candidates.map((c) => normalizePhone(c.contact?.mobile)).join(", ") || "none"}`,
      );
      return null;
    }
    console.log(`[autoMatchTnr] linked tnr ${candidate.tnr} to group ${group.groupId}`);
 
    await aadhaarModel.updateMany({ groupId: group.groupId }, { $set: { tnr: candidate.tnr } });
    return candidate.tnr;
  } catch (err) {
    console.error(`autoMatchTnrForGroup failed for group ${group.groupId}:`, err.message);
    return null;
  }
}
 
// GET /ocr/bookings — All Bookings tab. Groups every aadhaarModel doc that
// has a groupId into one card per booking: main traveller (front+back),
// co-travellers (front only), payment screenshots (advance/balance/
// partial, each possibly uploaded more than once), the typed booking
// notes, and the tnr — auto-matched against the real booking the moment
// one exists (autoMatchTnrForGroup above), falling back to linkGroupTnr's
// manual paste only if the auto-match can't find it (e.g. a mismatched
// phone number).
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
          addonsDetail: d.addonsDetail || [],
          remarks: d.remarks,
        };
      } else if (d.type === "aadhaarFront") {
        const traveller = {
          _id: d._id,
          ...d.parsed,
          url: d.url,
          ocrText: d.ocrText,
          // Only true for someone added via "Add Co-Traveller" after the
          // group already had a tnr — gates the "Raise Manage Booking"
          // button so it never shows for travellers already in the
          // original booking.
          postBooking: !!d.postBooking,
        };
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
 
    let bookings = Object.values(groups);
 
    // Auto-link the tnr for any booking that doesn't have one yet, so the
    // admin never has to paste it in manually — see autoMatchTnrForGroup.
    for (const b of bookings) {
      if (!b.tnr) {
        const matched = await autoMatchTnrForGroup(b);
        if (matched) b.tnr = matched;
      }
    }
 
    bookings = bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
 
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
      // If the group already has a tnr at this moment, this traveller is
      // being added AFTER the booking was created — only those travellers
      // should ever get a "Raise Manage Booking" button.
      postBooking: !!existing?.tnr,
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
 
// POST /api/tour/edit-traveller — body: { docId, ...fields }. Fixes a
// captured traveller's details (main or co-traveller). This is NOT a new
// OCR extraction and never creates a traveller manually (that rule stays
// intact for addCoTraveller above) — it only corrects fields on a
// traveller the OCR flow already captured, the same way the admin edits
// the draft fields before ever saving.
//
// Blocked once the booking already has a real tnr: at that point this
// traveller is part of an actual tourBookingModel booking, and changes
// have to go through the existing "Raise Manage Booking" approval flow
// instead of a silent direct edit here (same rule — and same reasoning —
// as deleteAadhaarTraveller below).
export const editAadhaarTraveller = async (req, res) => {
  try {
    const { docId } = req.body;
    if (!docId) return res.status(400).json({ success: false, message: "docId is required" });
    const doc = await aadhaarModel.findOne({ _id: docId, type: "aadhaarFront" });
    if (!doc) {
      return res.status(404).json({ success: false, message: "Traveller not found." });
    }
    if (doc.tnr) {
      return res.status(400).json({
        success: false,
        message: "This booking already has a TNR — edit it through Raise Manage Booking instead.",
      });
    }
 
    const editable = ["title", "firstName", "lastName", "age", "gender", "sharingType", "phone", "address"];
    const parsed = { ...(doc.parsed || {}) };
    editable.forEach((f) => {
      if (req.body[f] !== undefined) parsed[f] = req.body[f];
    });
    doc.parsed = parsed;
    await doc.save();
 
    return res.status(200).json({ success: true, traveller: { _id: doc._id, ...parsed } });
  } catch (error) {
    console.error("editAadhaarTraveller error:", error);
    return res.status(500).json({ success: false, message: "Could not update traveller.", error: error.message });
  }
};
 
// POST /api/tour/delete-traveller — body: { docId }. Deletes a captured
// co-traveller (removes just that one aadhaarFront doc), or — if this IS
// the main traveller — the entire draft booking (every doc under that
// groupId: both Aadhaar sides, payment screenshots, booking notes), since
// nothing is left to anchor the draft to once the main traveller is gone.
//
// Same tnr guard as editAadhaarTraveller above — once a real tnr exists,
// nothing here can be deleted directly any more.
export const deleteAadhaarTraveller = async (req, res) => {
  try {
    const { docId } = req.body;
    if (!docId) return res.status(400).json({ success: false, message: "docId is required" });
    const doc = await aadhaarModel.findOne({ _id: docId, type: "aadhaarFront" });
    if (!doc) {
      return res.status(404).json({ success: false, message: "Traveller not found." });
    }
    if (doc.tnr) {
      return res.status(400).json({
        success: false,
        message: "This booking already has a TNR — it can no longer be deleted directly.",
      });
    }
 
    if (doc.isCoTraveller) {
      await aadhaarModel.deleteOne({ _id: doc._id });
    } else {
      // Main traveller IS the booking — wipe the whole draft group.
      await aadhaarModel.deleteMany({ groupId: doc.groupId });
    }
 
    return res.status(200).json({ success: true, deletedGroup: !doc.isCoTraveller });
  } catch (error) {
    console.error("deleteAadhaarTraveller error:", error);
    return res.status(500).json({ success: false, message: "Could not delete traveller.", error: error.message });
  }
};
 
// Payment screenshots (UPI apps, bank apps, etc.) print the paid amount
// next to a ₹/Rs/INR marker, almost always as the biggest number on
// screen. Try the marked forms first (most reliable), then fall back to
// comma-grouped bare numbers so a screenshot that OCR'd the ₹ symbol
// poorly still gets a usable read.
//
// CONFIRMED LIVE (2026-10-10, raw OCR text captured via the console.log
// below): a ₹2,080 screenshot got saved as 32080. Root cause nailed down
// from the actual raw text — the ₹ glyph (a known weak spot for
// Tesseract's default, non-Indic model) was dropped from in front of the
// hero amount, but in the body line turned into a stray "3" GLUED
// directly onto the digits with no space: "Payment of ₹2,080 completed"
// came back as "Payment of 32,080 completed". No ₹/Rs/INR marker survives
// that, so it fell through to the bare-number fallback, which read the
// fused "32,080" as a whole number.
//
// Fix: the big "hero" amount at the top of every UPI confirmation screen
// is usually OCR'd as its own line with each digit read separately,
// completely independent of (and immune to) the ₹-glue bug above — in
// the same raw text this screenshot's hero line came back as
// "2 ? 0 8 0" (comma misread as "?", each digit isolated). That line is
// tried FIRST, before the ₹-marker and bare-number strategies, since it
// doesn't go anywhere near the ₹ symbol at all.
function extractPaymentAmount(text = "") {
  // Strategy 1 (most trusted): spaced-out hero digit line, e.g.
  // "2 ? 0 8 0" → 2080. Needs at least 3 single-character tokens
  // (digit, comma, or a common comma-OCR-garble) on their own line.
  const heroLineMatch = text.match(
    /(?:^|\n)[ \t]*((?:[\d,.?:;]\s+){2,}[\d,.?:;])[ \t]*(?:\n|$)/,
  );
  if (heroLineMatch) {
    const digits = heroLineMatch[1].replace(/\s+/g, "").replace(/\D/g, "");
    const heroAmount = digits ? Number(digits) : NaN;
    if (!Number.isNaN(heroAmount) && heroAmount > 0) {
      console.log(
        `[extractPaymentAmount] hero spaced-digit line "${heroLineMatch[1]}" → ${heroAmount}`,
      );
      return heroAmount;
    }
  }
 
  // Strategy 2: explicit ₹/Rs/INR marker (reliable whenever OCR gets the
  // symbol itself right).
  const markedMatches = [
    ...text.matchAll(/(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/gi),
  ].map((m) => Number(m[1].replace(/,/g, "")));
  if (markedMatches.length > 0) {
    const result = Math.max(...markedMatches.filter((n) => !Number.isNaN(n)));
    console.log(
      `[extractPaymentAmount] ₹/Rs/INR-marked match(es): [${markedMatches.join(", ")}] → using ${result}`,
    );
    return result;
  }
 
  // Strategy 3 (last resort — the one confirmed to misfire above). Kept
  // only as a final fallback for screenshots with no hero line and no
  // surviving ₹ marker. Widened to a 1-3 digit leading group (was 2-3) so
  // a genuine 4-digit amount like "2,080" — only ONE digit before its
  // first comma — isn't missed when the ₹ is cleanly dropped instead of
  // glued on. Also now requires at least one comma group, so odd 2-3
  // digit fragments (a time, a date fragment) aren't picked up.
  const bareNumbers = [...text.matchAll(/\b\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?\b/g)]
    .map((m) => Number(m[0].replace(/,/g, "")))
    .filter((n) => !Number.isNaN(n) && n > 0);
  const result = bareNumbers.length > 0 ? Math.max(...bareNumbers) : null;
  console.log(
    `[extractPaymentAmount] no hero line, no ₹/Rs/INR marker; bare comma-grouped candidate(s): [${bareNumbers.join(", ")}] → using ${result}. Raw OCR text: ${JSON.stringify(text)}`,
  );
  return result;
}
 
// POST /ocr/upload-group-payment — multipart: screenshot; body: groupId,
// type (advance|balance|partial), amount (optional manual override).
// Unlike the old uploadPaymentScreenshot (which only uploaded to Cloudinary
// and handed the url back for CreateBooking.jsx to carry), this one SAVES
// the screenshot straight into aadhaarModel against the group — Balance/
// Partial can be uploaded more than once (e.g. part-payments over time),
// each call just adds one more doc. The paid amount is read off the
// screenshot via OCR rather than relying on the admin typing it in; if OCR
// can't find a number, the typed `amount` (if any) is used instead.
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
 
    let ocrAmount = null;
    try {
      const text = await readImageText(file.path);
      ocrAmount = extractPaymentAmount(text);
    } catch (err) {
      console.error("Payment screenshot OCR failed, falling back to typed amount:", err.message);
    }
    const finalAmount = ocrAmount ?? (amount ? Number(amount) : null);
 
    const doc = await aadhaarModel.create({
      groupId,
      tnr: existing?.tnr || "",
      type: type === "advance" ? "paymentAdvance" : type === "balance" ? "paymentBalance" : "paymentPartial",
      url: upload.secure_url,
      amount: finalAmount,
      uploadedBy: "admin",
    });
 
    return res.status(201).json({ success: true, payment: doc, amountSource: ocrAmount !== null ? "ocr" : amount ? "manual" : "none" });
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
