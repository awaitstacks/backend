
//
// Latest changes:
//   1. addCoTraveller (tnr path) — a co-traveller added via Aadhaar to a
//      REAL booking (USER / Create-Booking-page ADMIN booking) is NO LONGER
//      pushed straight into tourBookingModel.travellers. It is saved only as
//      a pending aadhaarModel doc (tnr set, no travellerId, postBooking:
//      true). It reaches Tour Bookings ONLY through Raise Manage Booking →
//      approval — same as a walk-in group's co-traveller.
//   2. getAadhaarBookings — those pending docs are shown on the real
//      booking's card (with the Raise Manage Booking button). Once Manage
//      Booking is approved and the traveller is in the real booking, the
//      real entry is shown instead.
//   3. markCancelled — sets t.inRealBooking (traveller's name exists in the
//      real booking = Manage Booking approved). Frontend hides Edit/Remove/
//      Raise Manage Booking and shows "Added to booking" when true. Rejected
//      → not in real booking → button visible again.
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { createWorker } from "tesseract.js";
import sharp from "sharp";
import fs from "fs";
import os from "os";
// Pure-WASM PDF renderer — turns a PDF Aadhaar upload's first page into a
// PNG before sharp/Tesseract touch it. A raw PDF must NEVER reach
// worker.recognize() (crashes the whole Node process).
import mupdf from "mupdf";
// archiver is plain CommonJS — createRequire avoids the ESM default-export
// interop problem on some Node versions.
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const archiver = require("archiver");
import aadhaarModel from "../models/aadhaarModel.js";
// Read-only use for pricing/cancellation lookups (plus the narrowly scoped
// writes noted at each call site).
import tourBookingModel from "../models/tourBookingmodel.js";
// Read-only — pricing fields only (computePackageAmount).
import tourModel from "../models/tourModel.js";
// Read-only — Cancellation Requested / Rejected / Cancelled badges.
import cancellationModel from "../models/cancellationModel.js";

let workerPromise;
function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker("eng").then(async (worker) => {
      // PSM 6 — single uniform block of text, reads Aadhaar cards far more
      // reliably than the default auto layout.
      await worker.setParameters({ tessedit_pageseg_mode: "6" });
      return worker;
    });
  }
  return workerPromise;
}

// Upscale + grayscale + normalize + sharpen before OCR. Falls back to the
// original file if preprocessing fails.
async function preprocessForOcr(filePath) {
  const outPath = `${filePath}-ocr.png`;
  const image = sharp(filePath, { density: 300 }).rotate(); // auto-orient via EXIF
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

// A PDF always starts with "%PDF-" — check content, not extension.
function isPdfFile(filePath) {
  const fd = fs.openSync(filePath, "r");
  try {
    const head = Buffer.alloc(5);
    const bytesRead = fs.readSync(fd, head, 0, 5, 0);
    return bytesRead === 5 && head.toString("latin1") === "%PDF-";
  } finally {
    fs.closeSync(fd);
  }
}

// Renders page 1 of a PDF to a PNG (~300 DPI) with mupdf. Throws on a
// corrupt/password-protected PDF — caller must NOT fall back to OCR-ing
// the raw PDF.
function pdfFirstPageToPngFile(pdfPath) {
  const buffer = fs.readFileSync(pdfPath);
  const doc = mupdf.Document.openDocument(buffer, "application/pdf");
  try {
    const page = doc.loadPage(0);
    try {
      const matrix = mupdf.Matrix.scale(300 / 72, 300 / 72);
      const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);
      try {
        const outPath = `${pdfPath}-page1.png`;
        fs.writeFileSync(outPath, pixmap.asPNG());
        return outPath;
      } finally {
        pixmap.destroy();
      }
    } finally {
      page.destroy();
    }
  } finally {
    doc.destroy();
  }
}

function removeTempUploads(req) {
  const files = [];
  if (req.file) files.push(req.file);
  if (Array.isArray(req.files)) files.push(...req.files);
  else if (req.files && typeof req.files === "object") {
    Object.values(req.files).forEach((arr) => Array.isArray(arr) && files.push(...arr));
  }
  for (const f of files) {
    if (f?.path) fs.unlink(f.path, () => { });
  }
}
const withTempCleanup = (handler) => async (req, res) => {
  try {
    return await handler(req, res);
  } finally {
    removeTempUploads(req);
  }
};


async function readImageText(filePath) {
  const worker = await getWorker();

  // PDF → PNG FIRST, unconditionally.
  let sourcePath = filePath;
  let pdfPngPath = null;
  if (isPdfFile(filePath)) {
    try {
      pdfPngPath = pdfFirstPageToPngFile(filePath);
      sourcePath = pdfPngPath;
    } catch (err) {
      console.error("PDF-to-image conversion failed:", err.message);
      throw new Error("Could not read this PDF — it may be corrupted or password-protected. Try a clear photo instead.");
    }
  }

  let ocrPath = sourcePath;
  let preprocessed = false;
  try {
    ocrPath = await preprocessForOcr(sourcePath);
    preprocessed = true;
  } catch (err) {
    console.error("OCR preprocess failed, reading original image instead:", err.message);
    ocrPath = sourcePath; // always a real raster image here — never the raw PDF
  }
  try {
    const { data: { text } } = await worker.recognize(ocrPath);
    return text;
  } finally {
    if (pdfPngPath) {
      fs.unlink(pdfPngPath, () => { });
    }
    if (preprocessed) {
      fs.unlink(ocrPath, () => { });
    }
  }
}

// Backfill helper — re-OCR an already-uploaded Aadhaar image just for its
// number. Used only by exportActiveTravellersPdfData.
async function ocrAadhaarNumberFromUrl(url) {
  const tmpPath = `${os.tmpdir()}/aadhaar-backfill-${Date.now()}-${Math.round(Math.random() * 1e6)}.jpg`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not download image (HTTP ${response.status})`);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(tmpPath, buffer);
  try {
    const text = await readImageText(tmpPath);
    return extractAadhaarNumber(text);
  } finally {
    fs.unlink(tmpPath, () => { });
  }
}

// Plain edit-distance (gender word only).
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

// Exact match first; otherwise fuzzy-match tokens against FEMALE/MALE/
// TRANSGENDER (OCR often reads "FEMALZ", "FEMAIE", etc).
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

// e-Aadhaar PDF detection — the postal "To" line is e-PDF-only, so it's
// required alongside the letterhead/enrolment text; VTC:+PIN Code: labels
// are self-sufficient.
function isEAadhaarPdfText(text) {
  const hasToLine = /^\s*to\b/im.test(text);
  return (
    (hasToLine && /Unique\s*Identification\s*Authority/i.test(text)) ||
    (hasToLine && /Enrolment\s*(No|Number)/i.test(text)) ||
    (/VTC\s*[:\-]/i.test(text) && /PIN\s*Code\s*[:\-]/i.test(text))
  );
}

// UIDAI boilerplate vocabulary that gets interleaved with the real
// name/address on e-Aadhaar PDF OCR.
const UIDAI_BOILERPLATE_WORDS = new Set([
  "aadhaar", "maadhaar", "government", "india", "unique", "identification",
  "authority", "proof", "identity", "citizenship", "verify", "verified",
  "secure", "offline", "online", "authentication", "code", "scanning",
  "scanner", "app", "apps", "stores", "store", "using", "letter",
  "electronically", "generated", "information", "valid", "throughout",
  "country", "helps", "avail", "various", "non", "services", "service",
  "keep", "your", "mobile", "number", "email", "id", "updated", "carry",
  "smart", "phone", "use", "signature", "not", "download", "enrolment",
  "enrollment", "date", "issue", "address", "gender", "male", "female",
  "transgender", "year", "years", "birth", "dob", "vid", "uidai", "help",
  "www", "gov", "com", "in", "entities", "seeking", "obligated", "seek",
  "consent", "documents", "document", "support", "after", "every", "from",
  "holder", "based", "specified", "regulations", "submitted", "should",
  "be", "through", "either", "appointed", "agency", "qr", "xml", "reader",
  "available", "and", "or", "of", "is", "a", "to", "the", "this", "that",
  "no", "on", "by", "for", "with", "benefits", "ensure", "security",
  "when", "lock", "unlock", "biometrics", "feature", "digitally", "signed",
]);

// Rejects regional-script OCR noise misread as Latin letters.
function looksLikeRealWord(token) {
  const lower = token.toLowerCase();
  const vowels = (lower.match(/[aeiou]/g) || []).length;
  if (vowels / lower.length < 0.25) return false;
  if (/[^aeiou]{3,}/.test(lower)) return false;
  return true;
}

function classifyNameToken(token) {
  if (/^[a-z]/.test(token)) return "noise";
  if (UIDAI_BOILERPLATE_WORDS.has(token.toLowerCase())) return "noise";
  if (token.length === 1) return "word"; // a bare initial like "R"
  if (!looksLikeRealWord(token)) return "noise";
  return "word";
}

// Longest unbroken run of name-like tokens in one OCR line.
function bestNameSegmentInLine(line) {
  const tokens = line.match(/[A-Za-z]+/g) || [];
  let best = [];
  let current = [];
  const isBetter = (a, b) =>
    a.length !== b.length ? a.length > b.length : a.join("").length > b.join("").length;
  for (const tok of tokens) {
    if (classifyNameToken(tok) === "word") {
      current.push(tok);
    } else {
      if (current.length && isBetter(current, best)) best = current;
      current = [];
    }
  }
  if (current.length && isBetter(current, best)) best = current;
  return best;
}

function extractNameFromEAadhaarPdf(lines) {
  const isBetter = (a, b) =>
    a.length !== b.length ? a.length > b.length : a.join("").length > b.join("").length;
  // Name sits within the first few lines after "To".
  const toIdx = lines.findIndex((l, i) => i < 40 && /^to\b/i.test(l));
  let winner = [];
  if (toIdx !== -1) {
    for (let i = toIdx + 1; i <= Math.min(lines.length - 1, toIdx + 3); i++) {
      const seg = bestNameSegmentInLine(lines[i]);
      if (seg.length && isBetter(seg, winner)) winner = seg;
    }
  }
  // Fallback: name printed again just above DOB.
  if (winner.length === 0) {
    const dobIdx = lines.findIndex((l) => /DOB\s*[:\/]/i.test(l));
    if (dobIdx !== -1) {
      for (let i = Math.max(0, dobIdx - 2); i < dobIdx; i++) {
        const seg = bestNameSegmentInLine(lines[i]);
        if (seg.length && isBetter(seg, winner)) winner = seg;
      }
    }
  }
  const picked = winner.slice(0, 2);
  return picked
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// Keeps just the leading real-address words of one OCR line, stopping at
// boilerplate merged onto its end.
function addressLineLeadingRun(line) {
  const rawWords = line.split(/\s+/).filter(Boolean);
  const kept = [];
  for (const w of rawWords) {
    if (w === "-") { kept.push(w); continue; }
    if (/^\d+([/-]\d+)*$/.test(w)) { kept.push(w); continue; }
    const letters = w.replace(/[^A-Za-z]/g, "");
    if (!letters) break;
    if (/^[a-z]/.test(letters)) break;
    if (UIDAI_BOILERPLATE_WORDS.has(letters.toLowerCase())) break;
    kept.push(w.match(/^[A-Za-z0-9]+/)?.[0] || letters);
  }
  return kept.join(" ").trim();
}

// Unlabeled e-Aadhaar layout: "To" block up to the 6-digit PIN line.
function extractAddressFallbackFromToBlock(lines, toIdx, name) {
  if (toIdx === -1) return "";
  let pinLineIdx = -1;
  const maxScan = Math.min(lines.length - 1, toIdx + 20);
  for (let i = toIdx + 1; i <= maxScan; i++) {
    if (/\b\d{6}\b/.test(lines[i])) {
      pinLineIdx = i;
      break;
    }
  }
  if (pinLineIdx === -1) return "";
  const relevant = [];
  for (let i = toIdx + 1; i <= pinLineIdx; i++) {
    const line = lines[i];
    if (/\b[SDWC]\s*\/?\s*O\b\s*[:.]?/i.test(line)) continue; // S/O, D/O, W/O, C/O
    const clean = addressLineLeadingRun(line);
    if (clean) relevant.push(clean);
  }
  let joined = relevant.join(", ");
  if (name) {
    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    joined = joined.replace(new RegExp(escapeRegex(name), "gi"), "").trim();
    const upperName = name.toUpperCase();
    if (upperName !== name) joined = joined.replace(new RegExp(escapeRegex(upperName), "gi"), "").trim();
  }
  return cleanAddressNoise(joined.replace(/,\s*,/g, ",").replace(/^[\s,]+|[\s,]+$/g, ""));
}

function parseEAadhaarPdf(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const name = extractNameFromEAadhaarPdf(lines);
  const nameParts = name.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || firstName;

  const get = (re) => {
    const m = text.match(re);
    return m ? m[1].replace(/\s{2,}/g, " ").trim() : "";
  };
  const vtc = get(/VTC\s*[:\-]?\s*([A-Za-z .]+?)\s*,/i);
  const po = get(/\bPO\s*[:\-]?\s*([A-Za-z .]+?)\s*,/i);
  const district = get(/District\s*[:\-]?\s*([A-Za-z .]+?)\s*,/i);
  const stateLabel = get(/State\s*[:\-]?\s*([A-Za-z .]+?)\s*,/i);
  const pin = get(/PIN\s*Code\s*[:\-]?\s*(\d{6})/i);

  const toIdx = lines.findIndex((l, i) => i < 40 && /^to\b/i.test(l));
  const vtcIdx = lines.findIndex((l) => /VTC\s*[:\-]/i.test(l));
  let street = "";
  if (toIdx !== -1 && vtcIdx !== -1 && vtcIdx > toIdx) {
    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    street = cleanAddressNoise(lines.slice(toIdx + 1, vtcIdx).join(", "));
    if (name) {
      street = street.replace(new RegExp(escapeRegex(name), "gi"), "").trim();
      const upperName = name.toUpperCase();
      if (upperName !== name) {
        street = street.replace(new RegExp(escapeRegex(upperName), "gi"), "").trim();
      }
    }
    street = street.replace(/^[\s,]+/, "").replace(/[\s,]+$/, "").trim();
  }

  let address = [street, vtc, district, stateLabel, pin].filter(Boolean).join(", ");
  if (!address) {
    address = extractAddressFallbackFromToBlock(lines, toIdx, name);
  }
  const addressParts = splitAddressComponents(address);
  const mobileMatch = text.match(/Mobile\s*[:\-]?\s*(\d{10})/i);

  return { firstName, lastName, address, addressParts, phone: mobileMatch ? mobileMatch[1] : "" };
}

function parseAadhaarText(text = "") {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const dobMatch = text.match(/(?:DOB|D\.O\.B|Date of Birth)\s*[:\-]?\s*(\d{2}[/\-]\d{2}[/\-]\d{4})/i);
  const yobMatch = text.match(/(?:Year of Birth|YOB)\s*[:\-]?\s*(\d{4})/i);
  let age = "", dob = "";
  if (dobMatch) { dob = dobMatch[1]; age = calcAge(dob); }
  else if (yobMatch) { age = new Date().getFullYear() - Number(yobMatch[1]); }
  const gender = detectGender(text);

  if (isEAadhaarPdfText(text)) {
    const e = parseEAadhaarPdf(text);
    const phone = e.phone || extractPhone(text);
    const aadhaarNumber = extractAadhaarNumber(text);
    return {
      firstName: e.firstName,
      lastName: e.lastName,
      age,
      dob,
      gender,
      address: e.address,
      phone,
      aadhaarNumber,
      ...e.addressParts,
    };
  }

  let fullName = "";
  const dobIdx = lines.findIndex((l) => /DOB|D\.O\.B|Year of Birth|YOB|Date of Birth/i.test(l));
  // Scan a window above DOB and keep the line with the most Title-Case
  // words (regional-script OCR noise is almost never Title Case).
  const NAME_SCAN_WINDOW = 6;
  let bestScore = -1;
  let bestCandidate = "";
  for (let i = dobIdx - 1; i >= Math.max(0, dobIdx - 1 - NAME_SCAN_WINDOW); i--) {
    const line = lines[i];
    if (/government|india|authority|unique identification/i.test(line)) continue;
    // Skip "Father : X" / S/O / D/O / W/O / C/O lines.
    if (/father|\b[sdwc]\/o\b/i.test(line)) continue;
    const runs = line.match(/[A-Za-z][A-Za-z .]*/g) || [];
    const words = runs
      .flatMap((r) => r.trim().split(/\s+/))
      .filter((w) => w.length > 1);
    if (words.length === 0) continue;

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
  // Single-name card → Last Name = First Name.
  if (!lastName) {
    lastName = firstName;
  }
  const phone = extractPhone(text);
  const address = extractAddress(text);
  const addressParts = splitAddressComponents(address);
  const aadhaarNumber = extractAadhaarNumber(text);
  return { firstName, lastName, age, dob, gender, address, phone, aadhaarNumber, ...addressParts };
}

// Mobile number — tolerates an internal space/hyphen.
function extractPhone(text = "") {
  const match = text.match(/\b([6-9]\d{4})[\s-]?(\d{5})\b/);
  return match ? `${match[1]}${match[2]}` : "";
}

// 12-digit Aadhaar number (never starts with 0/1), returned as "XXXX XXXX XXXX".
function extractAadhaarNumber(text = "") {
  const candidates = text.match(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g) || [];
  for (const raw of candidates) {
    const digits = raw.replace(/[\s-]/g, "");
    if (digits.length === 12 && /^[2-9]/.test(digits)) {
      return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
    }
  }
  return "";
}

// Strips background-pattern OCR noise from the address block.
function cleanAddressNoise(addr = "") {
  if (!addr) return addr;
  const NOISE_CHARS = /[=£§~|_^*{}[\]<>]/;
  const tokens = addr.split(/(\s+)/);
  const kept = [];
  for (const w of tokens) {
    if (w === "" || /^\s+$/.test(w)) { kept.push(w); continue; }
    const bare = w.replace(/[.,;:]/g, "");
    if (!bare) continue;
    if (NOISE_CHARS.test(w)) continue;
    if (/^[A-Za-z]$/.test(bare)) continue;
    if (/^[a-z]{2,5}$/.test(bare)) continue;
    kept.push(w);
  }
  return kept
    .join("")
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,]+/, "")
    .replace(/[\s,]+$/, "")
    .trim();
}

const INDIAN_STATES_UTS = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal", "Delhi", "Jammu And Kashmir", "Ladakh", "Puducherry",
  "Chandigarh", "Andaman And Nicobar Islands", "Lakshadweep",
  "Dadra And Nagar Haveli And Daman And Diu",
];
// Best-effort split of one address string into Line1/Line2/City/State/Pincode.
function splitAddressComponents(addr = "") {
  const out = { addressLine1: "", addressLine2: "", city: "", state: "", pincode: "" };
  if (!addr) return out;

  let segments = addr.split(",").map((s) => s.trim()).filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i--) {
    const m = segments[i].match(/\b(\d{6})\b/);
    if (!m) continue;
    out.pincode = m[1];
    const rest = (segments[i].slice(0, m.index) + segments[i].slice(m.index + m[1].length)).trim();
    if (!rest || /^[A-Z]{1,4}$/.test(rest)) {
      segments.splice(i, 1);
    } else {
      segments[i] = rest;
    }
    break;
  }

  // Fuzzy state match on the trailing segment (longest names first).
  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const sortedStates = [...INDIAN_STATES_UTS].sort((a, b) => b.length - a.length);
  for (const state of sortedStates) {
    const words = state.split(" ").map(escapeRegex);
    const re = new RegExp(`^${words.join("[^,]*")}$`, "i");
    if (segments.length && re.test(segments[segments.length - 1])) {
      out.state = state;
      segments = segments.slice(0, -1);
      break;
    }
  }

  // City deliberately NOT auto-filled (usually the district).
  if (segments.length <= 1) {
    out.addressLine1 = segments.join(", ");
  } else {
    const mid = Math.ceil(segments.length / 2);
    out.addressLine1 = segments.slice(0, mid).join(", ");
    out.addressLine2 = segments.slice(mid).join(", ");
  }

  return out;
}

// Address — progressively looser fallbacks, all anchored on the 6-digit PIN.
function extractAddress(text = "") {
  let match = text.match(/Address[:\s]*([\s\S]*?\b\d{6}\b)/i);
  if (match) return cleanAddressNoise(match[1].replace(/\s*\n\s*/g, ", ").trim());

  match = text.match(/\b[SDWC]\/O[:\s]*([\s\S]*?\b\d{6}\b)/i);
  if (match) return cleanAddressNoise(match[1].replace(/\s*\n\s*/g, ", ").trim());

  match = text.match(/\b\d{6}\b/);
  if (match) {
    const idx = text.indexOf(match[0]);
    const before = text.slice(0, idx + match[0].length);
    const lines = before.split("\n").map((l) => l.trim()).filter(Boolean);
    return cleanAddressNoise(lines.slice(-6).join(", "));
  }

  return "";
}
function mergeSides(front, back) {
  const addrSource = back.address ? back : front.address ? front : back;
  return {
    firstName: front.firstName || back.firstName || "",
    lastName: front.lastName || back.lastName || "",
    age: front.age || back.age || "",
    dob: front.dob || back.dob || "",
    gender: front.gender || back.gender || "",
    phone: front.phone || back.phone || "",
    aadhaarNumber: front.aadhaarNumber || back.aadhaarNumber || "",
    address: back.address || front.address || "",
    addressLine1: addrSource.addressLine1 || "",
    addressLine2: addrSource.addressLine2 || "",
    city: addrSource.city || "",
    state: addrSource.state || "",
    pincode: addrSource.pincode || "",
  };
}

// POST /ocr/aadhaar — multipart: front (required), back (optional)
export const extractAadhaar = withTempCleanup(async (req, res) => {
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
});

// POST /ocr/payment-screenshot — OCR amount first, typed amount as fallback.
export const uploadPaymentScreenshot = withTempCleanup(async (req, res) => {
  try {
    const file = req.file;
    const { type, amount } = req.body;
    if (!file) return res.status(400).json({ success: false, message: "Screenshot image is required" });
    if (!["advance", "balance", "partial"].includes(type)) {
      return res.status(400).json({ success: false, message: "type must be advance, balance or partial" });
    }
    if (amount !== undefined && amount !== "" && (isNaN(Number(amount)) || Number(amount) <= 0)) {
      return res.status(400).json({ success: false, message: "Amount, if entered, must be a positive number." });
    }
    const upload = await cloudinary.uploader.upload(file.path, { folder: "payment-screenshots", resource_type: "image" });

    // let ocrAmount = null;
    // try {
    //   const text = await readImageText(file.path);
    //   ocrAmount = extractPaymentAmount(text);
    // } catch (err) {
    //   console.error("Payment screenshot OCR failed, falling back to typed amount:", err.message);
    // }
    // const finalAmount = ocrAmount ?? (amount ? Number(amount) : null);

    // The amount the admin typed always wins. OCR is only a fallback when
    // the box was left empty (it can misread "₹10,000" as "310000").
    const typedAmount = amount !== undefined && amount !== "" ? Number(amount) : null;
    let ocrAmount = null;
    if (typedAmount === null) {
      try {
        const text = await readImageText(file.path);
        ocrAmount = extractPaymentAmount(text);
      } catch (err) {
        console.error("Payment screenshot OCR failed:", err.message);
      }
    }
    const finalAmount = typedAmount ?? ocrAmount;

    return res.status(200).json({
      success: true,
      type,
      url: upload.secure_url,
      amount: finalAmount,
      // amountSource: ocrAmount !== null ? "ocr" : amount ? "manual" : "none",
      amountSource: typedAmount !== null ? "manual" : ocrAmount !== null ? "ocr" : "none",
    });
  } catch (error) {
    console.error("uploadPaymentScreenshot error:", error);
    return res.status(500).json({ success: false, message: "Upload failed.", error: error.message });
  }
});

export const saveBookingNotes = async (req, res) => {
  try {
    const { tourId, packageType, packageKind, variantPackageIndex, boardingPoint, deboardingPoint, addons, remarks, raisedBy } = req.body;

    if (!tourId) {
      return res.status(400).json({ success: false, message: "tourId is required" });
    }

    const doc = await aadhaarModel.create({
      type: "bookingNotes",
      tourId,
      packageType: packageType || "",
      packageKind: packageKind === "variant" ? "variant" : packageKind === "main" ? "main" : "",
      variantPackageIndex:
        packageKind === "variant" && variantPackageIndex !== undefined && variantPackageIndex !== null
          ? Number(variantPackageIndex)
          : null,
      boardingPoint: boardingPoint || "",
      deboardingPoint: deboardingPoint || "",
      addons: addons || "",
      remarks: remarks || "",
      uploadedBy: "admin",
      raisedBy: raisedBy
        ? { name: raisedBy.name || "", employeeId: raisedBy.employeeId || "" }
        : undefined,
    });

    return res.status(201).json({ success: true, note: doc });
  } catch (error) {
    console.error("saveBookingNotes error:", error);
    return res.status(500).json({ success: false, message: "Could not save booking notes.", error: error.message });
  }
};

// POST /ocr/save-aadhaar-upload — "Save Booking" on the Aadhaar Upload page.
// Creates every aadhaarModel doc for one walk-in capture, all sharing one
// groupId. Only an Advance Payment screenshot is hard-required.
export const saveAadhaarUpload = async (req, res) => {
  try {
    const {
      tourId,
      packageType,
      packageKind,
      variantPackageIndex,
      boardingPoint,
      deboardingPoint,
      addons,
      addonsDetail,
      remarks,
      raisedBy,
      traveller,
      coTravellers,
      advanceScreenshot, // legacy single-object shape
      advanceScreenshots, // current shape
    } = req.body;

    const hasAdvanceScreenshot =
      (Array.isArray(advanceScreenshots) && advanceScreenshots.some((s) => s?.url)) ||
      !!advanceScreenshot?.url;
    if (!hasAdvanceScreenshot) {
      return res.status(400).json({
        success: false,
        message: "Attach the Advance Payment screenshot before creating this booking",
      });
    }

    const groupId = new mongoose.Types.ObjectId().toString();
    const parsed = {
      firstName: traveller.firstName || "",
      lastName: traveller.lastName || "",
      age: traveller.age || null,
      dob: traveller.dob || "",
      gender: traveller.gender || "",
      address: traveller.address || "",
      addressLine1: traveller.addressLine1 || "",
      addressLine2: traveller.addressLine2 || "",
      city: traveller.city || "",
      state: traveller.state || "",
      pincode: traveller.pincode || "",
      phone: traveller.phone || "",
      aadhaarNumber: traveller.aadhaarNumber || "",
      title: traveller.title || "",
      sharingType: traveller.sharingType || "",
    };

    const docs = [
      {
        groupId,
        type: "aadhaarFront",
        isCoTraveller: false,
        url: traveller.front?.url || "",
        ocrText: traveller.front?.ocrText || "",
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

    if (Array.isArray(coTravellers)) {
      for (const ct of coTravellers) {
        // Skip only a totally blank row.
        if (!ct?.front?.url && !ct?.firstName?.trim()) continue;
        docs.push({
          groupId,
          type: "aadhaarFront",
          isCoTraveller: true,
          url: ct.front?.url || "",
          ocrText: ct.front?.ocrText || "",
          parsed: {
            firstName: ct.firstName || "",
            lastName: ct.lastName || "",
            age: ct.age || null,
            dob: ct.dob || "",
            gender: ct.gender || "",
            address: ct.address || "",
            addressLine1: ct.addressLine1 || "",
            addressLine2: ct.addressLine2 || "",
            city: ct.city || "",
            state: ct.state || "",
            pincode: ct.pincode || "",
            phone: ct.phone || "",
            aadhaarNumber: ct.aadhaarNumber || "",
            title: ct.title || "",
            sharingType: ct.sharingType || "",
          },
          uploadedBy: "admin",
        });
      }
    }

    const advanceList = Array.isArray(advanceScreenshots)
      ? advanceScreenshots
      : advanceScreenshot?.url
        ? [advanceScreenshot]
        : [];
    for (const shot of advanceList) {
      if (!shot?.url) continue;
      docs.push({
        groupId,
        type: "paymentAdvance",
        url: shot.url,
        amount: shot.amount ?? null,
        remarks: shot.remarks || "",
        uploadedBy: "admin",
      });
    }

    docs.push({
      groupId,
      type: "bookingNotes",
      tourId,
      packageType: packageType || "",
      packageKind: packageKind === "variant" ? "variant" : packageKind === "main" ? "main" : "",
      variantPackageIndex:
        packageKind === "variant" && variantPackageIndex !== undefined && variantPackageIndex !== null
          ? Number(variantPackageIndex)
          : null,
      boardingPoint: boardingPoint || "",
      deboardingPoint: deboardingPoint || "",
      addons: addons || "",
      addonsDetail: Array.isArray(addonsDetail) ? addonsDetail : [],
      remarks: remarks || "",
      uploadedBy: "admin",
      raisedBy: { name: raisedBy?.name || "", employeeId: raisedBy?.employeeId || "" },
    });

    const created = await aadhaarModel.insertMany(docs);

    return res.status(201).json({ success: true, groupId, docs: created });
  } catch (error) {
    console.error("saveAadhaarUpload error:", error);
    return res.status(500).json({ success: false, message: "Could not save this booking.", error: error.message });
  }
};

// Compare phones by last 10 digits so formatting differences don't block
// the auto-match.
const normalizePhone = (p) => String(p || "").replace(/\D/g, "").slice(-10);

// Auto-links a walk-in group to the real booking Create Booking produced
// for it: same tour, same contact mobile, booked at/after the group.
async function autoMatchTnrForGroup(group) {
  if (group.tnr || !group.tourId || !group.main?.phone) {
    console.log(
      `[autoMatchTnr] skip group ${group.groupId}: tourId=${!!group.tourId} phone=${group.main?.phone || "none"}`,
    );
    return null;
  }

  try {
    const claimedTnrs = await aadhaarModel.distinct("tnr", { tnr: { $nin: [null, ""] } });
    const wantPhone = normalizePhone(group.main.phone);

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

// What a walk-in group's package SHOULD cost (same age-bracket +
// sharingType formula as adminAddBooking, + addons). null when it can't be
// priced reliably.
function computePackageAmount(tourDoc, mainTraveller, coTravellers, bookingNotes) {
  if (!tourDoc || !mainTraveller) return null;

  let selectedPackage = tourDoc;
  if (bookingNotes?.packageKind === "variant") {
    if (bookingNotes.variantPackageIndex === null || bookingNotes.variantPackageIndex === undefined) {
      return null;
    }
    selectedPackage = tourDoc.variantPackage?.[bookingNotes.variantPackageIndex];
    if (!selectedPackage) return null;
  } else if (bookingNotes?.packageKind !== "main") {
    return null;
  }

  const travellers = [mainTraveller, ...(coTravellers || [])];
  let total = 0;
  for (const t of travellers) {
    const age = Number(t.age);
    if (isNaN(age) || age < 1) continue;
    if (age >= 11) {
      total += Number(selectedPackage.advanceAmount?.adult) || 0;
      if (t.sharingType === "double") total += Number(selectedPackage.balanceDouble) || 0;
      else if (t.sharingType === "triple") total += Number(selectedPackage.balanceTriple) || 0;
    } else if (age >= 6 && age <= 10) {
      total += Number(selectedPackage.advanceAmount?.child) || 0;
      if (t.sharingType === "withBerth") total += Number(selectedPackage.balanceChildWithBerth) || 0;
      else if (t.sharingType === "withoutBerth") total += Number(selectedPackage.balanceChildWithoutBerth) || 0;
    }
  }

  const addonsTotal = (bookingNotes?.addonsDetail || []).reduce((s, a) => s + (Number(a.amount) || 0), 0);
  total += addonsTotal;

  return total;
}

// GET /ocr/bookings — All Bookings tab.
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
          raisedBy: null,
          main: null,
          coTravellers: [],
          payments: { advance: [], balance: [], partial: [] },
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
          packageKind: d.packageKind || "",
          variantPackageIndex:
            d.variantPackageIndex === undefined ? null : d.variantPackageIndex,
          boardingPoint: d.boardingPoint,
          deboardingPoint: d.deboardingPoint,
          addons: d.addons,
          addonsDetail: d.addonsDetail || [],
          remarks: d.remarks,
        };
        g.raisedBy = d.raisedBy?.name
          ? { name: d.raisedBy.name, employeeId: d.raisedBy.employeeId || "" }
          : null;
      } else if (d.type === "aadhaarFront") {
        const traveller = {
          _id: d._id,
          aadhaarDocId: d._id,
          ...d.parsed,
          url: d.url,
          ocrText: d.ocrText,
          // Only true for someone added via "Add Co-Traveller" after the
          // group already had a tnr — gates "Raise Manage Booking".
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
        g.payments.advance.push({ _id: d._id, url: d.url, amount: d.amount, createdAt: d.createdAt, remarks: d.remarks || "" });
      } else if (d.type === "paymentBalance") {
        g.payments.balance.push({ _id: d._id, url: d.url, amount: d.amount, createdAt: d.createdAt, remarks: d.remarks || "" });
      } else if (d.type === "paymentPartial") {
        g.payments.partial.push({ _id: d._id, url: d.url, amount: d.amount, createdAt: d.createdAt, remarks: d.remarks || "" });
      }
    }

    let bookings = Object.values(groups);

    // Auto-link tnr for groups that don't have one yet.
    for (const b of bookings) {
      if (!b.tnr) {
        const matched = await autoMatchTnrForGroup(b);
        if (matched) b.tnr = matched;
      }
    }

    // Fold orphaned groupId:null payment docs back into their group by tnr.
    const tnrsForOrphanSweep = [...new Set(bookings.map((b) => b.tnr).filter(Boolean))];
    if (tnrsForOrphanSweep.length) {
      const orphanPaymentDocs = await aadhaarModel
        .find({
          tnr: { $in: tnrsForOrphanSweep },
          groupId: null,
          type: { $in: ["paymentAdvance", "paymentBalance", "paymentPartial"] },
        })
        .lean();
      if (orphanPaymentDocs.length) {
        const bookingByTnrForSweep = new Map(bookings.map((b) => [b.tnr, b]));
        for (const d of orphanPaymentDocs) {
          const b = bookingByTnrForSweep.get(d.tnr);
          if (!b) continue;
          const entry = { _id: d._id, url: d.url, amount: d.amount, createdAt: d.createdAt, remarks: d.remarks || "" };
          if (d.type === "paymentAdvance") b.payments.advance.push(entry);
          else if (d.type === "paymentBalance") b.payments.balance.push(entry);
          else if (d.type === "paymentPartial") b.payments.partial.push(entry);
        }
      }
    }

    // ── Every other real booking (USER online / Create-Booking-page ADMIN) ──
    const groupedTnrs = new Set(bookings.map((b) => b.tnr).filter(Boolean));
    const ungroupedRealDocs = await tourBookingModel
      .find(groupedTnrs.size ? { tnr: { $nin: [...groupedTnrs] } } : {})
      .select("tnr tourId createdBy contact travellers payment bookingDate")
      .populate("tourId", "title")
      .lean();

    const ungroupedRealTnrs = ungroupedRealDocs.map((d) => d.tnr).filter(Boolean);
    const ungroupedProofDocs = ungroupedRealTnrs.length
      ? await aadhaarModel.find({ tnr: { $in: ungroupedRealTnrs }, groupId: null }).lean()
      : [];
    const proofsByTnr = new Map();
    for (const d of ungroupedProofDocs) {
      if (!proofsByTnr.has(d.tnr)) proofsByTnr.set(d.tnr, []);
      proofsByTnr.get(d.tnr).push(d);
    }

    const nameKey = (x) => [x?.firstName, x?.lastName].filter(Boolean).join(" ").trim().toLowerCase();

    for (const rb of ungroupedRealDocs) {
      if (!rb.tnr) continue;
      const proofs = proofsByTnr.get(rb.tnr) || [];
      const aadhaarByTraveller = new Map();
      const payments = { advance: [], balance: [], partial: [] };
      // Co-travellers added via Aadhaar on this card whose Raise Manage
      // Booking is NOT yet approved — they are not in rb.travellers yet.
      const pendingCtDocs = [];
      for (const d of proofs) {
        if (d.type === "aadhaarFront" && d.postBooking && !d.travellerId) {
          pendingCtDocs.push(d);
          continue;
        }
        if (d.type === "aadhaarFront" || d.type === "aadhaarBack") {
          const key = String(d.travellerId);
          if (!aadhaarByTraveller.has(key)) aadhaarByTraveller.set(key, { front: null, back: null, frontDocId: null });
          const entry = aadhaarByTraveller.get(key);
          if (d.type === "aadhaarFront") {
            entry.front = { url: d.url, ocrText: d.ocrText };
            entry.frontDocId = d._id;
          } else {
            entry.back = { url: d.url };
          }
        } else if (d.type === "paymentAdvance") {
          payments.advance.push({ _id: d._id, url: d.url, amount: d.amount, createdAt: d.createdAt, remarks: d.remarks || "" });
        } else if (d.type === "paymentBalance") {
          payments.balance.push({ _id: d._id, url: d.url, amount: d.amount, createdAt: d.createdAt, remarks: d.remarks || "" });
        } else if (d.type === "paymentPartial") {
          payments.partial.push({ _id: d._id, url: d.url, amount: d.amount, createdAt: d.createdAt, remarks: d.remarks || "" });
        }
      }

      // travellers[0] is the main traveller, everyone after is a co-traveller.
      const mainT = (rb.travellers || [])[0] || null;
      const coTs = (rb.travellers || []).slice(1);
      const proofFor = (t) => aadhaarByTraveller.get(String(t._id)) || { front: null, back: null };

      // Any (non-pending) aadhaarFront doc under this tnr as the group-delete key.
      const anyFrontDocId =
        proofs.find((d) => d.type === "aadhaarFront" && !(d.postBooking && !d.travellerId))?._id || null;

      const main = mainT
        ? {
          _id: mainT._id,
          aadhaarDocId: anyFrontDocId,
          title: mainT.title,
          firstName: mainT.firstName,
          lastName: mainT.lastName,
          age: mainT.age,
          gender: mainT.gender,
          sharingType: mainT.sharingType,
          phone: rb.contact?.mobile,
          aadhaarNumber: mainT.aadhaarNumber,
          front: proofFor(mainT).front,
          back: proofFor(mainT).back,
        }
        : null;

      const coTravellers = coTs.map((t) => {
        const proof = proofFor(t);
        return {
          _id: t._id,
          aadhaarDocId: proof.frontDocId || null,
          title: t.title,
          firstName: t.firstName,
          lastName: t.lastName,
          age: t.age,
          gender: t.gender,
          sharingType: t.sharingType,
          aadhaarNumber: t.aadhaarNumber,
          url: proof.front?.url || null,
          ocrText: proof.front?.ocrText || "",
          back: proof.back,
          postBooking: !!t.addedPostBooking,
        };
      });

      // Pending co-travellers → shown with the Raise Manage Booking button.
      // Once approved, Manage Booking puts them in rb.travellers — then the
      // same-name real entry is shown instead ("Added to booking" via
      // markCancelled) and this pending doc only lends it its Aadhaar.
      for (const d of pendingCtDocs) {
        const p = d.parsed || {};
        const approved = coTravellers.find((c) => nameKey(c) === nameKey(p));
        if (approved) {
          approved.postBooking = true;
          if (!approved.url && d.url) {
            approved.url = d.url;
            approved.ocrText = d.ocrText || "";
          }
          if (!approved.aadhaarDocId) approved.aadhaarDocId = d._id;
          continue;
        }
        coTravellers.push({
          _id: d._id,
          aadhaarDocId: d._id,
          title: p.title,
          firstName: p.firstName,
          lastName: p.lastName,
          age: p.age,
          gender: p.gender,
          sharingType: p.sharingType,
          aadhaarNumber: p.aadhaarNumber,
          url: d.url || null,
          ocrText: d.ocrText || "",
          back: null,
          postBooking: true,
        });
      }

      // Real bookings already know their exact price.
      const directPackageAmount =
        (Number(rb.payment?.advance?.amount) || 0) + (Number(rb.payment?.balance?.amount) || 0);

      bookings.push({
        groupId: `real-${rb._id}`,
        tnr: rb.tnr,
        tourId: rb.tourId?._id || rb.tourId || null,
        tourTitle: rb.tourId?.title || "",
        bookingNotes: null,
        raisedBy: null,
        main,
        coTravellers,
        payments,
        createdAt: rb.bookingDate,
        _directPackageAmount: directPackageAmount,
      });
    }

    bookings = bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Guest-group info ("same guest, different TNR").
    const tnrs = bookings.map((b) => b.tnr).filter(Boolean);
    const guestGroups = tnrs.length
      ? await aadhaarModel.find({ type: "guestLink", guestTnrs: { $in: tnrs } }).lean()
      : [];
    for (const b of bookings) {
      if (!b.tnr) continue;
      const group = guestGroups.find((g) => (g.guestTnrs || []).includes(b.tnr));
      b.guestGroup = group
        ? {
          _id: group._id,
          label: group.remarks || "",
          otherTnrs: group.guestTnrs.filter((t) => t !== b.tnr),
        }
        : null;
    }

    // Payment summary — package amount vs every uploaded screenshot.
    const tourIds = [...new Set(bookings.map((b) => b.tourId).filter(Boolean).map(String))];
    const tourDocs = tourIds.length
      ? await tourModel
        .find({ _id: { $in: tourIds } })
        .select("price advanceAmount balanceDouble balanceTriple balanceChildWithBerth balanceChildWithoutBerth variantPackage")
        .lean()
      : [];
    const tourById = new Map(tourDocs.map((t) => [String(t._id), t]));

    // Once a walk-in group has a TNR, its real tourBookingModel booking is
    // the source of truth for the price (advance + balance, which already
    // include add-ons/changes made at Create Booking or Manage Booking) —
    // the bookingNotes estimate is only used before a TNR exists.
    const pricedTnrs = bookings.map((b) => b.tnr).filter(Boolean);
    const pricedDocs = pricedTnrs.length
      ? await tourBookingModel.find({ tnr: { $in: pricedTnrs } }).select("tnr payment").lean()
      : [];
    const realPriceByTnr = new Map(
      pricedDocs.map((d) => [
        d.tnr,
        (Number(d.payment?.advance?.amount) || 0) + (Number(d.payment?.balance?.amount) || 0),
      ]),
    );
    // What the real booking itself records as received (advance/balance
    // marked paid — e.g. after a cancellation is approved and balance is
    // settled to ₹0). Screenshots can lag behind this, so the larger of the
    // two is treated as paid.
    const realPaidByTnr = new Map(
      pricedDocs.map((d) => [
        d.tnr,
        (d.payment?.advance?.paid ? Number(d.payment?.advance?.amount) || 0 : 0) +
        (d.payment?.balance?.paid ? Number(d.payment?.balance?.amount) || 0 : 0),
      ]),
    );

    for (const b of bookings) {
      let packageAmount;
      const realPrice = b.tnr ? realPriceByTnr.get(b.tnr) : undefined;
      if (typeof b._directPackageAmount === "number") {
        packageAmount = b._directPackageAmount;
        delete b._directPackageAmount;
      } else if (realPrice > 0) {
        packageAmount = realPrice;
      } else {
        const tourDoc = b.tourId ? tourById.get(String(b.tourId)) : null;
        packageAmount = computePackageAmount(tourDoc, b.main, b.coTravellers, b.bookingNotes);
      }

      if (packageAmount === null) {
        b.paymentSummary = null;
        continue;
      }

      const screenshotsPaid =
        (b.payments.advance || []).reduce((s, p) => s + (Number(p.amount) || 0), 0) +
        b.payments.balance.reduce((s, p) => s + (Number(p.amount) || 0), 0) +
        b.payments.partial.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const bookingPaid = b.tnr ? realPaidByTnr.get(b.tnr) || 0 : 0;
      const amountPaid = Math.max(screenshotsPaid, bookingPaid);

      const balanceRemaining = Math.max(0, packageAmount - amountPaid);
      b.paymentSummary = {
        packageAmount,
        amountPaid,
        balanceRemaining,
        fullyPaid: amountPaid >= packageAmount,
      };
    }

    // Admin/User badge + cancellation status + "Added to booking" flag,
    // all read from the REAL tourBookingModel booking.
    const linkedTnrs = bookings.map((b) => b.tnr).filter(Boolean);
    const realBookingDocs = linkedTnrs.length
      ? await tourBookingModel.find({ tnr: { $in: linkedTnrs } }).select("tnr createdBy cancelled travellers").lean()
      : [];
    const realBookingByTnr = new Map(realBookingDocs.map((d) => [d.tnr, d]));

    const normName = (t) => [t?.firstName, t?.lastName].filter(Boolean).join(" ").trim().toLowerCase();

    const cancellationDocs = linkedTnrs.length
      ? await cancellationModel
        .find({ tnr: { $in: linkedTnrs } })
        .select("tnr travellerIds raisedBy approvedBy rejectedAt createdAt")
        .sort({ createdAt: 1 })
        .lean()
      : [];
    // Last one wins (oldest → newest).
    const cancelDocByTnrTraveller = new Map();
    for (const doc of cancellationDocs) {
      for (const tid of doc.travellerIds || []) {
        cancelDocByTnrTraveller.set(`${doc.tnr}::${tid}`, doc);
      }
    }

    for (const b of bookings) {
      const real = b.tnr ? realBookingByTnr.get(b.tnr) : null;
      b.createdBy = real?.createdBy || "admin";

      if (!real) continue;
      const wholeCancelled = !!(real.cancelled?.byAdmin || real.cancelled?.byTraveller);
      const realTravellerByName = new Map((real.travellers || []).map((t) => [normName(t), t]));

      const markCancelled = (t) => {
        if (!t) return t;
        const realT = realTravellerByName.get(normName(t));
        const cancelDoc = realT ? cancelDocByTnrTraveller.get(`${b.tnr}::${realT._id}`) : null;

        let status = null;
        if (cancelDoc) {
          status = cancelDoc.approvedBy ? "cancelled" : cancelDoc.raisedBy ? "request" : "rejected";
        } else if (
          wholeCancelled ||
          realT?.cancelled?.viaTripCancel ||
          realT?.cancelled?.byAdmin
        ) {
          // Whole-trip cancel / older cancellation / direct admin-cancel —
          // treat as an approved cancellation.
          status = "cancelled";
        } else if (realT?.cancelled?.byTraveller) {
          // byTraveller alone = pending cancellation request.
          status = "request";
        }

        // Already in the REAL booking (Tour Bookings)? → Raise Manage
        // Booking was approved → frontend hides Edit/Remove/Raise and shows
        // "Added to booking". Not there yet (or rejected) → button visible.
        t.inRealBooking = !!realT;

        t.cancelStatus = status; // null | "request" | "rejected" | "cancelled"
        // Aadhaar ZIP filter only cares about approved cancellations.
        t.cancelled = status === "cancelled";
        return t;
      };
      if (b.main) markCancelled(b.main);
      b.coTravellers = (b.coTravellers || []).map(markCancelled);
    }

    return res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error("getAadhaarBookings error:", error);
    return res.status(500).json({ success: false, message: "Could not fetch bookings.", error: error.message });
  }
};

// POST /api/tour/guest/link — body: { tnr, linkToTnr, label? }. Overlapping
// guest groups always merge into ONE.
export const linkGuestTnr = async (req, res) => {
  try {
    const tnr = (req.body.tnr || "").trim().toUpperCase();
    const linkToTnr = (req.body.linkToTnr || "").trim().toUpperCase();
    if (!tnr || !linkToTnr) {
      return res.status(400).json({ success: false, message: "Both tnr and linkToTnr are required" });
    }
    if (tnr === linkToTnr) {
      return res.status(400).json({ success: false, message: "Cannot link a booking to itself" });
    }
    if (!(await tourBookingModel.exists({ tnr }))) {
      return res.status(404).json({ success: false, message: `No booking found with TNR ${tnr}` });
    }
    if (!(await tourBookingModel.exists({ tnr: linkToTnr }))) {
      return res.status(404).json({ success: false, message: `No booking found with TNR ${linkToTnr}` });
    }

    const existingGroups = await aadhaarModel.find({
      type: "guestLink",
      guestTnrs: { $in: [tnr, linkToTnr] },
    });

    const mergedTnrs = new Set([tnr, linkToTnr]);
    existingGroups.forEach((g) => (g.guestTnrs || []).forEach((t) => mergedTnrs.add(t)));

    let label = (req.body.label || "").trim();
    if (!label) {
      label = existingGroups.find((g) => g.remarks)?.remarks || "";
    }

    if (existingGroups.length) {
      await aadhaarModel.deleteMany({ _id: { $in: existingGroups.map((g) => g._id) } });
    }

    const saved = await aadhaarModel.create({
      type: "guestLink",
      tnr,
      guestTnrs: Array.from(mergedTnrs),
      remarks: label,
    });

    return res.status(200).json({ success: true, guestGroup: saved });
  } catch (error) {
    console.error("linkGuestTnr error:", error);
    return res.status(500).json({ success: false, message: "Could not link guest.", error: error.message });
  }
};

// POST /api/tour/guest/unlink — body: { tnr }.
export const unlinkGuestTnr = async (req, res) => {
  try {
    const tnr = (req.body.tnr || "").trim().toUpperCase();
    if (!tnr) return res.status(400).json({ success: false, message: "tnr is required" });

    const group = await aadhaarModel.findOne({ type: "guestLink", guestTnrs: tnr });
    if (!group) {
      return res.status(404).json({ success: false, message: "This booking isn't linked to any guest group." });
    }

    const remaining = group.guestTnrs.filter((t) => t !== tnr);
    if (remaining.length < 2) {
      await aadhaarModel.deleteOne({ _id: group._id });
    } else {
      group.guestTnrs = remaining;
      if (group.tnr === tnr) group.tnr = remaining[0];
      await group.save();
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("unlinkGuestTnr error:", error);
    return res.status(500).json({ success: false, message: "Could not unlink guest.", error: error.message });
  }
};

// POST /ocr/add-co-traveller — adds ONE more traveller (Aadhaar front only).
// NEVER writes to tourBookingModel: the traveller reaches Tour Bookings only
// via Raise Manage Booking → approval.
export const addCoTraveller = async (req, res) => {
  try {
    const {
      groupId, tnr, title, firstName, lastName, age, dob, gender, sharingType, phone,
      address, addressLine1, addressLine2, city, state, pincode, front, aadhaarNumber,
    } = req.body;

    if (!groupId && !tnr) {
      return res.status(400).json({ success: false, message: "groupId or tnr is required" });
    }

    const parsedFields = {
      firstName: firstName || "",
      lastName: lastName || "",
      age: age || null,
      dob: dob || "",
      gender: gender || "",
      address: address || "",
      addressLine1: addressLine1 || "",
      addressLine2: addressLine2 || "",
      city: city || "",
      state: state || "",
      pincode: pincode || "",
      phone: phone || "",
      aadhaarNumber: aadhaarNumber || "",
      title: title || "",
      sharingType: sharingType || "",
    };

    // ── Real booking (tnr path — USER online / Create-Booking-page ADMIN) ──
    // Saved ONLY as a pending aadhaarModel doc (tnr set, no travellerId,
    // postBooking: true). getAadhaarBookings shows it on the card with the
    // Raise Manage Booking button until Manage Booking approval puts the
    // traveller into the real booking.
    if (!groupId && tnr) {
      const booking = await tourBookingModel.findOne({ tnr: tnr.trim().toUpperCase() }).select("tnr");
      if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found for this tnr." });
      }

      const frontDoc = await aadhaarModel.create({
        tnr: booking.tnr,
        type: "aadhaarFront",
        isCoTraveller: true,
        postBooking: true,
        url: front?.url || "",
        ocrText: front?.ocrText || "",
        parsed: parsedFields,
        uploadedBy: "admin",
      });

      return res.status(201).json({ success: true, traveller: frontDoc });
    }

    // ── Walk-in group (groupId path) ──
    const existing = await aadhaarModel.findOne({ groupId }).select("tnr");

    const doc = await aadhaarModel.create({
      groupId,
      tnr: existing?.tnr || "",
      // Added AFTER the booking got a tnr → gets "Raise Manage Booking".
      postBooking: !!existing?.tnr,
      type: "aadhaarFront",
      isCoTraveller: true,
      url: front?.url || "",
      ocrText: front?.ocrText || "",
      parsed: parsedFields,
      uploadedBy: "admin",
    });

    return res.status(201).json({ success: true, traveller: doc });
  } catch (error) {
    console.error("addCoTraveller error:", error);
    return res.status(500).json({ success: false, message: "Could not add co-traveller.", error: error.message });
  }
};

// POST /api/tour/edit-traveller — body: { docId, ...fields }. Blocked once
// the booking has a tnr, EXCEPT for a post-booking added traveller.
export const editAadhaarTraveller = async (req, res) => {
  try {
    const { docId } = req.body;
    if (!docId) return res.status(400).json({ success: false, message: "docId is required" });
    const doc = await aadhaarModel.findOne({ _id: docId, type: "aadhaarFront" });
    if (!doc) {
      return res.status(404).json({ success: false, message: "Traveller not found." });
    }
    let isPostBookingAdd = !!doc.postBooking;
    if (doc.tnr && doc.travellerId && !isPostBookingAdd) {
      const parentBooking = await tourBookingModel.findOne(
        { tnr: doc.tnr, "travellers._id": doc.travellerId },
        { "travellers.$": 1 },
      );
      isPostBookingAdd = !!parentBooking?.travellers?.[0]?.addedPostBooking;
    }
    if (doc.tnr && !isPostBookingAdd) {
      return res.status(400).json({
        success: false,
        message: "This booking already has a TNR — edit it through Raise Manage Booking instead.",
      });
    }

    const editable = [
      "title", "firstName", "lastName", "age", "gender", "sharingType", "phone",
      "address", "addressLine1", "addressLine2", "city", "state", "pincode",
      "aadhaarNumber",
    ];
    const parsed = { ...(doc.parsed || {}) };
    editable.forEach((f) => {
      if (req.body[f] !== undefined) parsed[f] = req.body[f];
    });
    doc.parsed = parsed;
    await doc.save();

    // Older post-booking travellers that were pushed straight into the real
    // booking — mirror the edit onto that subdocument too.
    if (doc.travellerId) {
      const travellerFields = ["title", "firstName", "lastName", "age", "gender", "sharingType", "aadhaarNumber"];
      const $set = {};
      travellerFields.forEach((f) => {
        if (req.body[f] !== undefined) $set[`travellers.$.${f}`] = req.body[f];
      });
      if (Object.keys($set).length) {
        await tourBookingModel.updateOne({ tnr: doc.tnr, "travellers._id": doc.travellerId }, { $set });
      }
    }

    return res.status(200).json({ success: true, traveller: { _id: doc._id, ...parsed } });
  } catch (error) {
    console.error("editAadhaarTraveller error:", error);
    return res.status(500).json({ success: false, message: "Could not update traveller.", error: error.message });
  }
};

// Cloudinary public_id from a secure_url (best-effort).
function extractCloudinaryPublicId(url = "") {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
  return match ? match[1] : null;
}

async function destroyCloudinaryFile(url) {
  const publicId = extractCloudinaryPublicId(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (err) {
    console.error(`destroyCloudinaryFile: could not destroy ${publicId}:`, err.message);
  }
}

// POST /api/tour/delete-traveller — body: { docId }.
//   Co-traveller → removes that one traveller's doc(s) + files.
//   Main traveller → clears files for every traveller in the booking
//   (extracted data kept).
export const deleteAadhaarTraveller = async (req, res) => {
  try {
    const { docId } = req.body;
    if (!docId) return res.status(400).json({ success: false, message: "docId is required" });
    const doc = await aadhaarModel.findOne({ _id: docId, type: "aadhaarFront" });
    if (!doc) {
      return res.status(404).json({ success: false, message: "Traveller not found." });
    }

    // Older post-booking co-traveller that was pushed straight into the real
    // booking — pull them back out of travellers[] too.
    if (doc.travellerId && doc.tnr) {
      const parentBooking = await tourBookingModel.findOne(
        { tnr: doc.tnr, "travellers._id": doc.travellerId },
        { "travellers.$": 1 },
      );
      const travellerRecord = parentBooking?.travellers?.[0];
      const isPostBookingAdd = !!(doc.postBooking || travellerRecord?.addedPostBooking);

      if (isPostBookingAdd) {
        const pullResult = await tourBookingModel.updateOne(
          { tnr: doc.tnr },
          { $pull: { travellers: { _id: doc.travellerId } } },
        );
        const relatedDocs = await aadhaarModel.find({
          tnr: doc.tnr,
          travellerId: doc.travellerId,
          type: { $in: ["aadhaarFront", "aadhaarBack"] },
        });
        for (const d of relatedDocs) {
          if (d.url) await destroyCloudinaryFile(d.url);
        }
        await aadhaarModel.deleteMany({ _id: { $in: relatedDocs.map((d) => d._id) } });
        return res.status(200).json({
          success: true,
          clearedCount: relatedDocs.length,
          removedTraveller: pullResult.modifiedCount > 0,
        });
      }
    }

    if (doc.isCoTraveller) {
      // No travellerId (walk-in co-traveller / pending co-traveller) →
      // scope to this exact doc, never the whole group.
      const scopeMatch = doc.travellerId
        ? (doc.groupId
          ? { groupId: doc.groupId, travellerId: doc.travellerId }
          : { tnr: doc.tnr, travellerId: doc.travellerId })
        : { _id: doc._id };
      const docs = await aadhaarModel.find({ ...scopeMatch, type: { $in: ["aadhaarFront", "aadhaarBack"] } });

      for (const d of docs) {
        if (d.url) await destroyCloudinaryFile(d.url);
        if (d.front?.url) await destroyCloudinaryFile(d.front.url);
        if (d.back?.url) await destroyCloudinaryFile(d.back.url);
      }
      await aadhaarModel.deleteMany({ _id: { $in: docs.map((d) => d._id) } });

      return res.status(200).json({ success: true, clearedCount: docs.length, removedTraveller: docs.length > 0 });
    }

    // MAIN traveller — clear (not delete) every traveller's files.
    const groupMatch = doc.tnr
      ? (doc.groupId ? { groupId: doc.groupId } : { tnr: doc.tnr })
      : { groupId: doc.groupId };
    const docs = await aadhaarModel.find({ ...groupMatch, type: { $in: ["aadhaarFront", "aadhaarBack"] } });

    for (const d of docs) {
      if (d.url) await destroyCloudinaryFile(d.url);
      if (d.front?.url) await destroyCloudinaryFile(d.front.url);
      if (d.back?.url) await destroyCloudinaryFile(d.back.url);
    }

    const ids = docs.map((d) => d._id);
    await aadhaarModel.updateMany({ _id: { $in: ids } }, { $set: { url: null, front: null, back: null } });

    return res.status(200).json({ success: true, clearedCount: ids.length, deletedGroup: true });
  } catch (error) {
    console.error("deleteAadhaarTraveller error:", error);
    return res.status(500).json({ success: false, message: "Could not delete Aadhaar files.", error: error.message });
  }
};

// GET /api/tour/download-all-aadhaar?docId=<docId> — ZIP of the raw files.
export const downloadAllAadhaarZip = async (req, res) => {
  try {
    const docId = req.query.docId || req.body.docId;
    if (!docId) return res.status(400).json({ success: false, message: "docId is required" });
    const doc = await aadhaarModel.findOne({ _id: docId, type: "aadhaarFront" });
    if (!doc) return res.status(404).json({ success: false, message: "Traveller not found." });

    let docs;
    if (doc.isCoTraveller) {
      docs = [doc];
    } else {
      const groupMatch = doc.tnr
        ? (doc.groupId ? { groupId: doc.groupId } : { tnr: doc.tnr })
        : { groupId: doc.groupId };
      docs = await aadhaarModel.find({ ...groupMatch, type: "aadhaarFront" });
    }

    const filesToZip = [];
    docs.forEach((d, idx) => {
      const parsed = d.parsed || {};
      const label = [parsed.firstName, parsed.lastName].filter(Boolean).join("_") || `Traveller${idx + 1}`;
      const safeLabel = label.replace(/[^A-Za-z0-9_-]/g, "") || `Traveller${idx + 1}`;
      const extFromUrl = (url) => {
        const match = url.split("?")[0].match(/\.([A-Za-z0-9]+)$/);
        return match ? match[1] : "jpg";
      };
      if (d.front?.url) {
        filesToZip.push({ url: d.front.url, filename: `${idx + 1}-${safeLabel}-Front.${extFromUrl(d.front.url)}` });
      }
      if (d.back?.url) {
        filesToZip.push({ url: d.back.url, filename: `${idx + 1}-${safeLabel}-Back.${extFromUrl(d.back.url)}` });
      }
    });

    if (filesToZip.length === 0) {
      return res.status(404).json({ success: false, message: "No Aadhaar files uploaded for this booking yet." });
    }

    const zipName = doc.tnr ? `Aadhaar-${doc.tnr}.zip` : `Aadhaar-Draft-${doc.groupId}.zip`;
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => {
      console.error("downloadAllAadhaarZip archive error:", err);
      if (!res.headersSent) res.status(500).end();
    });
    archive.pipe(res);

    for (const f of filesToZip) {
      try {
        const response = await fetch(f.url);
        if (!response.ok) {
          console.error(`downloadAllAadhaarZip: could not fetch ${f.url} (status ${response.status})`);
          continue;
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        archive.append(buffer, { name: f.filename });
      } catch (err) {
        console.error(`downloadAllAadhaarZip: failed to fetch ${f.url}:`, err.message);
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error("downloadAllAadhaarZip error:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Could not build the Aadhaar ZIP.", error: error.message });
    }
  }
};

// Payment amount from a UPI/bank screenshot: spaced "hero" digit line first
// (immune to the ₹-glyph misread), then ₹/Rs/INR marker, then bare
// comma-grouped numbers.
function extractPaymentAmount(text = "") {
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

  // const bareNumbers = [...text.matchAll(/\b\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?\b/g)]
  //   .map((m) => Number(m[0].replace(/,/g, "")))
  //   .filter((n) => !Number.isNaN(n) && n > 0);
  // GPay/PhonePe print amounts in Indian grouping ("10,000", "1,10,000").
  // Tesseract often reads the "₹" glyph as a leading "3" (or "2"/"7"), so
  // "₹10,000" comes out as "310,000" — which is NOT valid Indian grouping.
  // When dropping that one leading digit makes it valid, drop it.
  const isIndianGrouped = (s) => /^\d{1,2}(?:,\d{2})*,\d{3}$/.test(s);
  const fixRupeeGlyph = (raw) => {
    const [intPart, dec = ""] = raw.split(".");
    if (isIndianGrouped(intPart)) return raw;
    if (/^[237]/.test(intPart) && isIndianGrouped(intPart.slice(1))) {
      return intPart.slice(1) + (dec ? `.${dec}` : "");
    }
    return raw;
  };
  const bareNumbers = [...text.matchAll(/\b\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?\b/g)]
    .map((m) => Number(fixRupeeGlyph(m[0]).replace(/,/g, "")))
    .filter((n) => !Number.isNaN(n) && n > 0);
  const result = bareNumbers.length > 0 ? Math.max(...bareNumbers) : null;
  console.log(
    `[extractPaymentAmount] no hero line, no ₹/Rs/INR marker; bare comma-grouped candidate(s): [${bareNumbers.join(", ")}] → using ${result}. Raw OCR text: ${JSON.stringify(text)}`,
  );
  return result;
}

// POST /ocr/upload-group-payment — saves a payment screenshot straight into
// aadhaarModel against the group (or tnr for a real booking).
export const uploadGroupPayment = withTempCleanup(async (req, res) => {
  try {
    const file = req.file;
    const { groupId, tnr, type, amount, remarks } = req.body;

    if (!file) return res.status(400).json({ success: false, message: "Screenshot image is required" });
    if (!groupId && !tnr) return res.status(400).json({ success: false, message: "groupId or tnr is required" });
    if (!["advance", "balance", "partial"].includes(type)) {
      return res.status(400).json({ success: false, message: "type must be advance, balance or partial" });
    }
    if (amount !== undefined && amount !== "" && (isNaN(Number(amount)) || Number(amount) <= 0)) {
      return res.status(400).json({ success: false, message: "Amount, if entered, must be a positive number." });
    }

    const upload = await cloudinary.uploader.upload(file.path, { folder: "payment-screenshots", resource_type: "image" });
    let resolvedGroupId = null;
    let resolvedTnr = tnr ? tnr.trim().toUpperCase() : "";
    if (groupId) {
      const existing = await aadhaarModel.findOne({ groupId }).select("tnr");
      if (existing) {
        resolvedGroupId = groupId;
        resolvedTnr = existing.tnr || resolvedTnr;
      } else if (resolvedTnr) {
        // Recover the real groupId by tnr instead of orphaning the doc.
        const byTnr = await aadhaarModel.findOne({ tnr: resolvedTnr, groupId: { $ne: null } }).select("groupId");
        if (byTnr?.groupId) resolvedGroupId = byTnr.groupId;
      }
    }

    // let ocrAmount = null;
    // try {
    //   const text = await readImageText(file.path);
    //   ocrAmount = extractPaymentAmount(text);
    // } catch (err) {
    //   console.error("Payment screenshot OCR failed, falling back to typed amount:", err.message);
    // }
    // const finalAmount = ocrAmount ?? (amount ? Number(amount) : null);
    // const docType = type === "advance" ? "paymentAdvance" : type === "balance" ? "paymentBalance" : "paymentPartial";
    const typedAmount = amount !== undefined && amount !== "" ? Number(amount) : null;
    let ocrAmount = null;
    if (typedAmount === null) {
      try {
        const text = await readImageText(file.path);
        ocrAmount = extractPaymentAmount(text);
      } catch (err) {
        console.error("Payment screenshot OCR failed:", err.message);
      }
    }
    const finalAmount = typedAmount ?? ocrAmount;
    const docType = type === "advance" ? "paymentAdvance" : type === "balance" ? "paymentBalance" : "paymentPartial";


    // Duplicate guard — same amount + type against the same booking within 2 min.
    const dupWindowStart = new Date(Date.now() - 2 * 60 * 1000);
    const dupScope = resolvedGroupId ? { groupId: resolvedGroupId } : { tnr: resolvedTnr };
    const recentDup = await aadhaarModel.findOne({
      ...dupScope,
      type: docType,
      amount: finalAmount,
      createdAt: { $gte: dupWindowStart },
    });
    if (recentDup) {
      await destroyCloudinaryFile(upload.secure_url);
      return res.status(200).json({
        success: true,
        payment: recentDup,
        duplicate: true,
        // amountSource: ocrAmount !== null ? "ocr" : amount ? "manual" : "none",
        amountSource: typedAmount !== null ? "manual" : ocrAmount !== null ? "ocr" : "none",
      });
    }

    const doc = await aadhaarModel.create({
      groupId: resolvedGroupId,
      tnr: resolvedTnr,
      type: docType,
      url: upload.secure_url,
      amount: finalAmount,
      remarks: remarks?.trim() || "",
      uploadedBy: "admin",
    });

    return res.status(201).json({
      success: true,
      payment: doc,
      // amountSource: ocrAmount !== null ? "ocr" : amount ? "manual" : "none",
      amountSource: typedAmount !== null ? "manual" : ocrAmount !== null ? "ocr" : "none",
    });
  } catch (error) {
    console.error("uploadGroupPayment error:", error);
    return res.status(500).json({ success: false, message: "Upload failed.", error: error.message });
  }
});

// POST /delete-group-payment — body: { docId }. Never touches
// tourBookingModel.payment or invoices.
export const deleteGroupPayment = async (req, res) => {
  try {
    const { docId } = req.body;
    if (!docId) return res.status(400).json({ success: false, message: "docId is required" });

    const doc = await aadhaarModel.findOne({
      _id: docId,
      type: { $in: ["paymentAdvance", "paymentBalance", "paymentPartial"] },
    });
    if (!doc) {
      return res.status(404).json({ success: false, message: "Payment screenshot not found." });
    }

    await aadhaarModel.deleteOne({ _id: doc._id });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("deleteGroupPayment error:", error);
    return res.status(500).json({ success: false, message: "Could not delete payment screenshot.", error: error.message });
  }
};

// ─────────────── Payment Tasks dashboard ───────────────
const buildBookingDetails = (b, extra = {}) => {
  if (!b) return null;
  return {
    email: b.contact?.email || "",
    mobile: b.contact?.mobile || "",
    bookingType: b.bookingType || "",
    bookingDate: b.bookingDate,
    isTripCompleted: !!b.isTripCompleted,
    isBookingCompleted: !!b.isBookingCompleted,
    manageBooking: !!b.manageBooking,
    gvCancellationPool: b.gvCancellationPool ?? null,
    irctcCancellationPool: b.irctcCancellationPool ?? null,
    travellers: b.travellers || [],
    billingAddress: b.billingAddress || {},
    payment: b.payment || {},
    receipts: b.receipts || {},
    advanceAdminRemarks: b.advanceAdminRemarks || [],
    adminRemarks: b.adminRemarks || [],
    creationRemarks: extra.creationRemarks || "",
    paymentHistory: extra.paymentHistory || [],
    paymentTotals: extra.paymentTotals || { advancePaid: 0, partialPaid: 0, balancePaid: 0 },
  };
};

const BOOKING_DETAIL_SELECT =
  "tnr tourId travellers payment bookingDate contact bookingType " +
  "isTripCompleted isBookingCompleted manageBooking gvCancellationPool " +
  "irctcCancellationPool billingAddress receipts advanceAdminRemarks adminRemarks";

const computePaymentTotals = (history) => {
  const sum = (type) =>
    history
      .filter((h) => h.type === type)
      .reduce((s, h) => s + (Number(h.amount) || 0), 0);
  return {
    advancePaid: sum("paymentAdvance"),
    partialPaid: sum("paymentPartial"),
    balancePaid: sum("paymentBalance"),
  };
};

export const getPaymentTasks = async (req, res) => {
  try {
    const allBookingsNeedingAdvance = await tourBookingModel
      .find({ "payment.advance.paid": { $ne: true } })
      .populate({ path: "tourId", model: "tour", select: "title" })
      .select(BOOKING_DETAIL_SELECT)
      .sort({ bookingDate: -1 })
      .lean();

    const advanceTnrs = allBookingsNeedingAdvance.map((b) => b.tnr).filter(Boolean);
    const advanceClearedDocs = advanceTnrs.length
      ? await aadhaarModel
        .find({ type: "advanceTaskCleared", tnr: { $in: advanceTnrs } })
        .select("tnr")
        .lean()
      : [];
    const advanceClearedTnrs = new Set(advanceClearedDocs.map((d) => d.tnr));

    const advanceScreenshotDocs = advanceTnrs.length
      ? await aadhaarModel
        .find({ type: "paymentAdvance", tnr: { $in: advanceTnrs } })
        .select("tnr")
        .lean()
      : [];
    const tnrsWithAdvanceScreenshot = new Set(advanceScreenshotDocs.map((d) => d.tnr));

    const bookingsNeedingAdvance = allBookingsNeedingAdvance.filter(
      (b) => !advanceClearedTnrs.has(b.tnr) && tnrsWithAdvanceScreenshot.has(b.tnr),
    );

    const screenshotDocs = await aadhaarModel
      .find({ type: { $in: ["paymentPartial", "paymentBalance"] }, taskCleared: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean();

    const groupIds = [...new Set(screenshotDocs.map((d) => d.groupId).filter(Boolean))];
    const mainDocs = groupIds.length
      ? await aadhaarModel
        .find({ type: "aadhaarFront", isCoTraveller: false, groupId: { $in: groupIds } })
        .lean()
      : [];
    const bookingNotesDocs = groupIds.length
      ? await aadhaarModel
        .find({ type: "bookingNotes", groupId: { $in: groupIds } })
        .populate({ path: "tourId", model: "tour", select: "title" })
        .lean()
      : [];
    const mainByGroup = new Map(mainDocs.map((d) => [d.groupId, d]));
    const notesByGroup = new Map(bookingNotesDocs.map((d) => [d.groupId, d]));

    const screenshotTnrs = [
      ...new Set(screenshotDocs.map((d) => d.tnr).filter(Boolean)),
    ];
    const linkedBookings = screenshotTnrs.length
      ? await tourBookingModel
        .find({ tnr: { $in: screenshotTnrs } })
        .populate({ path: "tourId", model: "tour", select: "title" })
        .select(BOOKING_DETAIL_SELECT)
        .lean()
      : [];
    const bookingByTnr = new Map(linkedBookings.map((b) => [b.tnr, b]));

    const allTnrs = [
      ...new Set([
        ...bookingsNeedingAdvance.map((b) => b.tnr).filter(Boolean),
        ...screenshotTnrs,
      ]),
    ];
    const allPaymentDocs = allTnrs.length
      ? await aadhaarModel
        .find({
          type: { $in: ["paymentAdvance", "paymentPartial", "paymentBalance"] },
          tnr: { $in: allTnrs },
        })
        .select("tnr type amount url createdAt taskCleared remarks")
        .sort({ createdAt: 1 })
        .lean()
      : [];
    const paymentHistoryByTnr = new Map();
    for (const d of allPaymentDocs) {
      if (!paymentHistoryByTnr.has(d.tnr)) paymentHistoryByTnr.set(d.tnr, []);
      paymentHistoryByTnr.get(d.tnr).push({
        docId: d._id,
        type: d.type,
        amount: d.amount,
        url: d.url || "",
        uploadedAt: d.createdAt,
        taskCleared: !!d.taskCleared,
        remarks: d.remarks || "",
      });
    }
    const bookingNotesByTnrDocs = allTnrs.length
      ? await aadhaarModel
        .find({ type: "bookingNotes", tnr: { $in: allTnrs } })
        .select("tnr remarks")
        .lean()
      : [];
    const creationRemarksByTnr = new Map(
      bookingNotesByTnrDocs.map((d) => [d.tnr, d.remarks || ""]),
    );
    const extraForTnr = (tnr) => {
      const history = (tnr && paymentHistoryByTnr.get(tnr)) || [];
      return {
        creationRemarks: (tnr && creationRemarksByTnr.get(tnr)) || "",
        paymentHistory: history,
        paymentTotals: computePaymentTotals(history),
      };
    };

    const advanceTasks = bookingsNeedingAdvance.map((b) => {
      const main = (b.travellers || []).find((t) => !t.isCoTraveller) || b.travellers?.[0];
      return {
        tnr: b.tnr,
        tourTitle: b.tourId?.title || "",
        mainName: [main?.title, main?.firstName, main?.lastName].filter(Boolean).join(" ") || "Unnamed traveller",
        amount: b.payment?.advance?.amount ?? null,
        bookingDate: b.bookingDate,
        booking: buildBookingDetails(b, extraForTnr(b.tnr)),
      };
    });

    const screenshotToTask = (d) => {
      const main = mainByGroup.get(d.groupId);
      const notes = notesByGroup.get(d.groupId);
      const mainName = main
        ? [main.parsed?.title, main.parsed?.firstName, main.parsed?.lastName].filter(Boolean).join(" ") || "Unnamed traveller"
        : "Unnamed traveller";
      const linkedBooking = d.tnr ? bookingByTnr.get(d.tnr) : null;
      return {
        docId: d._id,
        tnr: d.tnr || "",
        tourTitle: notes?.tourId?.title || linkedBooking?.tourId?.title || "",
        mainName,
        amount: d.amount,
        uploadedAt: d.createdAt,
        screenshotUrl: d.url || "",
        booking: buildBookingDetails(linkedBooking, extraForTnr(d.tnr)),
      };
    };

    const partialTasks = screenshotDocs.filter((d) => d.type === "paymentPartial").map(screenshotToTask);
    const balanceTasks = screenshotDocs.filter((d) => d.type === "paymentBalance").map(screenshotToTask);

    return res.status(200).json({ success: true, advanceTasks, partialTasks, balanceTasks });
  } catch (error) {
    console.error("getPaymentTasks error:", error);
    return res.status(500).json({ success: false, message: "Could not fetch payment tasks.", error: error.message });
  }
};

// POST /payment-tasks/mark-done — body: { docId }. Purely a to-do checkbox.
export const markPaymentTaskDone = async (req, res) => {
  try {
    const { docId } = req.body;
    if (!docId) return res.status(400).json({ success: false, message: "docId is required" });

    const doc = await aadhaarModel.findOneAndUpdate(
      { _id: docId, type: { $in: ["paymentPartial", "paymentBalance"] } },
      { $set: { taskCleared: true } },
      { new: true },
    );
    if (!doc) {
      return res.status(404).json({ success: false, message: "Payment task not found." });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("markPaymentTaskDone error:", error);
    return res.status(500).json({ success: false, message: "Could not mark this task done.", error: error.message });
  }
};

// POST /payment-tasks/mark-advance-done — body: { tnr }. Purely a to-do
// checkbox; never touches payment.advance.
export const markAdvanceTaskDone = async (req, res) => {
  try {
    const { tnr } = req.body;
    if (!tnr) return res.status(400).json({ success: false, message: "tnr is required" });

    await aadhaarModel.findOneAndUpdate(
      { type: "advanceTaskCleared", tnr },
      { $setOnInsert: { type: "advanceTaskCleared", tnr, uploadedBy: "admin" } },
      { upsert: true, new: true },
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("markAdvanceTaskDone error:", error);
    return res.status(500).json({ success: false, message: "Could not mark this task done.", error: error.message });
  }
};

// ═══════════════════════ "User Bookings" tab ═══════════════════════

// GET /ocr/user-bookings?tourId=...&email= (email optional)
export const searchUserBookings = async (req, res) => {
  try {
    const { tourId, email } = req.query;
    if (!tourId) return res.status(400).json({ success: false, message: "tourId is required" });

    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const query = { tourId, createdBy: "user" };
    if (email && email.trim()) {
      query["contact.email"] = new RegExp(`^${escapeRegex(email.trim())}$`, "i");
    }
    const bookings = await tourBookingModel
      .find(query)
      .select("tnr travellers contact bookingDate payment cancelled")
      .sort({ bookingDate: -1 })
      .lean();

    const tnrs = bookings.map((b) => b.tnr).filter(Boolean);
    const proofDocs = tnrs.length
      ? await aadhaarModel.find({ tnr: { $in: tnrs } }).lean()
      : [];
    const docsByTnr = new Map();
    for (const d of proofDocs) {
      if (!docsByTnr.has(d.tnr)) docsByTnr.set(d.tnr, []);
      docsByTnr.get(d.tnr).push(d);
    }

    const cancellationDocs = tnrs.length
      ? await cancellationModel
        .find({ tnr: { $in: tnrs } })
        .select("tnr travellerIds raisedBy approvedBy rejectedAt createdAt")
        .sort({ createdAt: 1 })
        .lean()
      : [];
    const cancelDocByTnrTraveller = new Map();
    for (const doc of cancellationDocs) {
      for (const tid of doc.travellerIds || []) {
        cancelDocByTnrTraveller.set(`${doc.tnr}::${tid}`, doc);
      }
    }
    const cancelStatusFor = (b, t) => {
      const cancelDoc = cancelDocByTnrTraveller.get(`${b.tnr}::${t._id}`);
      if (cancelDoc) return cancelDoc.approvedBy ? "cancelled" : cancelDoc.raisedBy ? "request" : "rejected";
      const wholeCancelled = !!(b.cancelled?.byAdmin || b.cancelled?.byTraveller);
      if (wholeCancelled || t.cancelled?.viaTripCancel || t.cancelled?.byAdmin) {
        return "cancelled";
      }
      if (t.cancelled?.byTraveller) {
        return "request";
      }
      return null;
    };

    return res.status(200).json({
      success: true,
      bookings: bookings.map((b) => {
        const proofs = docsByTnr.get(b.tnr) || [];
        const aadhaarByTraveller = new Map();
        const payments = { advance: [], balance: [], partial: [] };
        for (const d of proofs) {
          if (d.type === "aadhaarFront" || d.type === "aadhaarBack") {
            const key = String(d.travellerId);
            if (!aadhaarByTraveller.has(key)) aadhaarByTraveller.set(key, { front: null, back: null });
            const entry = aadhaarByTraveller.get(key);
            if (d.type === "aadhaarFront") entry.front = { url: d.url, uploadedAt: d.createdAt };
            else entry.back = { url: d.url, uploadedAt: d.createdAt };
          } else if (d.type === "paymentAdvance") {
            payments.advance.push({ _id: d._id, url: d.url, amount: d.amount, uploadedAt: d.createdAt, remarks: d.remarks || "" });
          } else if (d.type === "paymentBalance") {
            payments.balance.push({ _id: d._id, url: d.url, amount: d.amount, uploadedAt: d.createdAt, remarks: d.remarks || "" });
          } else if (d.type === "paymentPartial") {
            payments.partial.push({ _id: d._id, url: d.url, amount: d.amount, uploadedAt: d.createdAt, remarks: d.remarks || "" });
          }
        }

        const packageAmount = (Number(b.payment?.advance?.amount) || 0) + (Number(b.payment?.balance?.amount) || 0);
        const screenshotsPaid =
          payments.advance.reduce((s, p) => s + (Number(p.amount) || 0), 0) +
          payments.balance.reduce((s, p) => s + (Number(p.amount) || 0), 0) +
          payments.partial.reduce((s, p) => s + (Number(p.amount) || 0), 0);
        const bookingPaid =
          (b.payment?.advance?.paid ? Number(b.payment?.advance?.amount) || 0 : 0) +
          (b.payment?.balance?.paid ? Number(b.payment?.balance?.amount) || 0 : 0);
        const amountPaid = Math.max(screenshotsPaid, bookingPaid);
        const balanceRemaining = Math.max(0, packageAmount - amountPaid);

        return {
          tnr: b.tnr,
          bookingDate: b.bookingDate,
          contact: b.contact,
          travellers: (b.travellers || []).map((t, idx) => ({
            _id: t._id,
            title: t.title,
            firstName: t.firstName,
            lastName: t.lastName,
            age: t.age,
            gender: t.gender,
            isCoTraveller: idx > 0,
            hasAadhaar: !!t.aadhaarId,
            aadhaar: aadhaarByTraveller.get(String(t._id)) || { front: null, back: null },
            cancelStatus: cancelStatusFor(b, t),
          })),
          payments,
          paymentSummary: {
            packageAmount,
            amountPaid,
            balanceRemaining,
            fullyPaid: packageAmount > 0 && amountPaid >= packageAmount,
          },
        };
      }),
    });
  } catch (error) {
    console.error("searchUserBookings error:", error);
    return res.status(500).json({ success: false, message: "Could not search online bookings.", error: error.message });
  }
};

// POST /ocr/user-bookings/upload-aadhaar — attaches Aadhaar to ONE existing
// traveller (real booking), or to an existing walk-in / pending
// co-traveller aadhaarModel doc (fallback).
export const uploadUserTravellerAadhaar = async (req, res) => {
  try {
    const { tnr, travellerId, front, back, parsed } = req.body;
    if (!tnr) return res.status(400).json({ success: false, message: "tnr is required" });
    if (!travellerId) return res.status(400).json({ success: false, message: "travellerId is required" });

    const booking = await tourBookingModel.findOne({
      tnr: tnr.trim().toUpperCase(),
      "travellers._id": travellerId,
    });

    if (!booking) {
      // FALLBACK — travellerId is an existing aadhaarModel doc's own _id.
      const existingDoc = await aadhaarModel.findOne({
        _id: travellerId,
        tnr: tnr.trim().toUpperCase(),
      });
      if (!existingDoc) {
        return res.status(404).json({ success: false, message: "Booking/traveller not found for this tnr." });
      }

      existingDoc.url = front?.url || existingDoc.url || "";
      existingDoc.ocrText = front?.ocrText || existingDoc.ocrText || "";
      existingDoc.parsed = { ...(existingDoc.parsed || {}), ...(parsed || {}) };
      await existingDoc.save();

      if (back?.url) {
        await aadhaarModel.create({
          groupId: existingDoc.groupId,
          tnr: existingDoc.tnr,
          type: "aadhaarBack",
          isCoTraveller: !!existingDoc.isCoTraveller,
          postBooking: existingDoc.postBooking,
          url: back.url,
          ocrText: back.ocrText || "",
          parsed: parsed || {},
          uploadedBy: "admin",
        });
      }

      return res.status(201).json({ success: true, traveller: existingDoc });
    }
    const traveller = booking.travellers.id(travellerId);

    const frontDoc = await aadhaarModel.create({
      tnr: booking.tnr,
      travellerId,
      type: "aadhaarFront",
      isCoTraveller: !!traveller.isCoTraveller,
      url: front?.url || "",
      ocrText: front?.ocrText || "",
      parsed: parsed || {},
      uploadedBy: "admin",
    });

    if (back?.url) {
      await aadhaarModel.create({
        tnr: booking.tnr,
        travellerId,
        type: "aadhaarBack",
        isCoTraveller: !!traveller.isCoTraveller,
        url: back.url,
        ocrText: back.ocrText || "",
        parsed: parsed || {},
        uploadedBy: "admin",
      });
    }

    await tourBookingModel.updateOne(
      { _id: booking._id, "travellers._id": travellerId },
      {
        $set: {
          "travellers.$.aadhaarId": frontDoc._id,
          "travellers.$.aadhaarNumber": parsed?.aadhaarNumber || "",
        },
      },
    );

    return res.status(201).json({ success: true, traveller: frontDoc });
  } catch (error) {
    console.error("uploadUserTravellerAadhaar error:", error);
    return res.status(500).json({ success: false, message: "Could not save Aadhaar for this traveller.", error: error.message });
  }
};

// POST /bookings/export-active-travellers — body: { tnrs?: string[] }.
export const exportActiveTravellersPdfData = async (req, res) => {
  try {
    const { tnrs } = req.body || {};
    const filter =
      Array.isArray(tnrs) && tnrs.length > 0
        ? { tnr: { $in: tnrs.map((t) => String(t).trim().toUpperCase()) } }
        : {};

    const bookings = await tourBookingModel.find(filter);
    const rows = [];

    for (const booking of bookings) {
      let bookingChanged = false;

      const aadhaarDocs = await aadhaarModel
        .find({ tnr: booking.tnr, type: "aadhaarFront" })
        .sort({ createdAt: 1 });
      const byTravellerId = new Map();
      const mainDocs = [];
      const coDocs = [];
      for (const d of aadhaarDocs) {
        if (d.travellerId) byTravellerId.set(String(d.travellerId), d);
        else if (d.isCoTraveller) coDocs.push(d);
        else mainDocs.push(d);
      }

      let coIndex = 0;
      for (let i = 0; i < (booking.travellers || []).length; i++) {
        const t = booking.travellers[i];
        const isMain = i === 0;
        const matchedById = byTravellerId.get(String(t._id));
        const positionalDoc = isMain ? mainDocs[0] : coDocs[coIndex];
        if (!isMain && !matchedById) coIndex++;

        const isCancelled = t.cancelled?.byAdmin || t.cancelled?.byTraveller;
        if (isCancelled) continue;

        let aadhaarNumber = t.aadhaarNumber || "";
        let aDoc = null;
        if (!aadhaarNumber && t.aadhaarId) {
          try {
            aDoc = await aadhaarModel.findById(t.aadhaarId);
          } catch (lookupErr) {
            console.error(
              "aadhaarModel lookup by aadhaarId failed during PDF export for traveller",
              t._id?.toString(),
              lookupErr.message,
            );
          }
        }
        if (!aadhaarNumber && !aDoc) {
          aDoc = matchedById || positionalDoc || null;
        }

        if (!aadhaarNumber && aDoc) {
          aadhaarNumber = aDoc.parsed?.aadhaarNumber || "";

          if (!aadhaarNumber && aDoc.url) {
            try {
              aadhaarNumber = await ocrAadhaarNumberFromUrl(aDoc.url);
            } catch (ocrErr) {
              console.error(
                "Aadhaar-number backfill OCR failed for traveller",
                t._id?.toString(),
                ocrErr.message,
              );
            }
          }

          if (aadhaarNumber && aDoc.parsed?.aadhaarNumber !== aadhaarNumber) {
            aDoc.parsed = { ...(aDoc.parsed || {}), aadhaarNumber };
            await aDoc.save();
          }
        }

        if (aadhaarNumber) {
          t.aadhaarNumber = aadhaarNumber;
          bookingChanged = true;
        }

        rows.push({
          tnr: booking.tnr,
          name: `${t.firstName || ""} ${t.lastName || ""}`.trim() || "Unknown",
          age: t.age ?? "",
          gender: t.gender || "",
          aadhaarNumber: aadhaarNumber || "Not Available",
        });
      }

      if (bookingChanged) {
        await booking.save();
      }
    }

    return res.status(200).json({ success: true, travellers: rows });
  } catch (error) {
    console.error("exportActiveTravellersPdfData error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not prepare the active travellers list.",
      error: error.message,
    });
  }
};

// POST /ocr/user-bookings/upload-payment — multipart: screenshot; body:
// { tnr, type, amount }. Never touches payment.advance/balance.paid.
export const uploadUserBookingPayment = withTempCleanup(async (req, res) => {
  try {
    const file = req.file;
    const { tnr, type, amount, remarks } = req.body;
    if (!file) return res.status(400).json({ success: false, message: "Screenshot image is required" });
    if (!tnr) return res.status(400).json({ success: false, message: "tnr is required" });
    if (!["advance", "balance", "partial"].includes(type)) {
      return res.status(400).json({ success: false, message: "type must be advance, balance or partial" });
    }
    if (amount !== undefined && amount !== "" && (isNaN(Number(amount)) || Number(amount) <= 0)) {
      return res.status(400).json({ success: false, message: "Amount, if entered, must be a positive number." });
    }

    const booking = await tourBookingModel.findOne({ tnr: tnr.trim().toUpperCase(), createdBy: "user" }).select("tnr");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Online booking not found for this tnr." });
    }

    const upload = await cloudinary.uploader.upload(file.path, { folder: "payment-screenshots", resource_type: "image" });

    // let ocrAmount = null;
    // try {
    //   const text = await readImageText(file.path);
    //   ocrAmount = extractPaymentAmount(text);
    // } catch (err) {
    //   console.error("Payment screenshot OCR failed, falling back to typed amount:", err.message);
    // }
    // const finalAmount = ocrAmount ?? (amount ? Number(amount) : null);
    const typedAmount = amount !== undefined && amount !== "" ? Number(amount) : null;
    let ocrAmount = null;
    if (typedAmount === null) {
      try {
        const text = await readImageText(file.path);
        ocrAmount = extractPaymentAmount(text);
      } catch (err) {
        console.error("Payment screenshot OCR failed:", err.message);
      }
    }
    const finalAmount = typedAmount ?? ocrAmount;


    const doc = await aadhaarModel.create({
      tnr: booking.tnr,
      type: type === "advance" ? "paymentAdvance" : type === "balance" ? "paymentBalance" : "paymentPartial",
      url: upload.secure_url,
      amount: finalAmount,
      remarks: remarks?.trim() || "",
      uploadedBy: "admin",
    });

    return res.status(201).json({
      success: true,
      payment: doc,
      // amountSource: ocrAmount !== null ? "ocr" : amount ? "manual" : "none",
      amountSource: typedAmount !== null ? "manual" : ocrAmount !== null ? "ocr" : "none",
    });
  } catch (error) {
    console.error("uploadUserBookingPayment error:", error);
    return res.status(500).json({ success: false, message: "Upload failed.", error: error.message });
  }
});

// POST /ocr/link-tnr — manual fallback when auto-match can't find the tnr.
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