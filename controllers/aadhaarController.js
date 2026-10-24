
// import mongoose from "mongoose";
// import { v2 as cloudinary } from "cloudinary";
// import { createWorker } from "tesseract.js";
// import sharp from "sharp";
// import fs from "fs";
// import os from "os";
// import zlib from "zlib";
// // Pure-WASM PDF renderer — turns a PDF Aadhaar upload's first page into a
// // PNG before sharp/Tesseract touch it. A raw PDF must NEVER reach
// // worker.recognize() (crashes the whole Node process).
// import mupdf from "mupdf";
// // archiver is plain CommonJS — createRequire avoids the ESM default-export
// // interop problem on some Node versions.
// import { createRequire } from "module";
// const require = createRequire(import.meta.url);
// const archiver = require("archiver");
// // Pure-JS QR reader for the Aadhaar Secure QR / old XML QR.
// const jsQR = require("jsqr");
// import aadhaarModel from "../models/aadhaarModel.js";
// // Read-only use for pricing/cancellation lookups (plus the narrowly scoped
// // writes noted at each call site).
// import tourBookingModel from "../models/tourBookingmodel.js";
// // Read-only — pricing fields only (computePackageAmount).
// import tourModel from "../models/tourModel.js";
// // Read-only — Cancellation Requested / Rejected / Cancelled badges.
// import cancellationModel from "../models/cancellationModel.js";
 
// let workerPromise;
// function getWorker() {
//   if (!workerPromise) {
//     workerPromise = createWorker("eng").then(async (worker) => {
//       // PSM 6 — single uniform block of text, reads Aadhaar cards far more
//       // reliably than the default auto layout.
//       await worker.setParameters({ tessedit_pageseg_mode: "6" });
//       return worker;
//     });
//   }
//   return workerPromise;
// }

// // ── Card language ──────────────────────────────────────────────────────
// // The OCR must know the card's regional script to recognise it as that
// // script (and then delete it). Loading every language at once is very slow,
// // so each extraction loads English + ONE language, chosen from the
// // pincode (main traveller's back side) or the main traveller's state
// // (co-traveller, front only). Default: Tamil.
// const SUPPORTED_CARD_LANGS = ["tam", "tel", "kan", "mal", "hin"];
// const DEFAULT_CARD_LANG = "tam";

// // First two digits of an Indian PIN → state → card language.
// function langFromPincode(pin = "") {
//   const p = String(pin).match(/\b([1-9]\d)\d{4}\b/);
//   if (!p) return "";
//   const n = Number(p[1]);
//   if (n >= 60 && n <= 64) return "tam"; // Tamil Nadu, Puducherry
//   if (n >= 67 && n <= 69) return "mal"; // Kerala
//   if (n >= 56 && n <= 59) return "kan"; // Karnataka
//   if (n >= 50 && n <= 53) return "tel"; // Telangana, Andhra Pradesh
//   // Hindi-belt states (Delhi, UP, Bihar, MP, Rajasthan, Haryana, …) and
//   // Maharashtra (Devanagari script).
//   if ((n >= 11 && n <= 13) || (n >= 17 && n <= 34) || (n >= 40 && n <= 49) || (n >= 80 && n <= 85)) return "hin";
//   return "";
// }

// const STATE_LANG = {
//   "tamil nadu": "tam", puducherry: "tam", pondicherry: "tam",
//   kerala: "mal", lakshadweep: "mal",
//   karnataka: "kan",
//   telangana: "tel", "andhra pradesh": "tel",
//   delhi: "hin", "uttar pradesh": "hin", bihar: "hin", "madhya pradesh": "hin",
//   rajasthan: "hin", haryana: "hin", jharkhand: "hin", chhattisgarh: "hin",
//   uttarakhand: "hin", "himachal pradesh": "hin", maharashtra: "hin", chandigarh: "hin",
// };
// function langFromState(state = "") {
//   const key = String(state).toLowerCase().replace(/\s+/g, " ").trim();
//   if (!key) return "";
//   if (STATE_LANG[key]) return STATE_LANG[key];
//   const hit = Object.keys(STATE_LANG).find((k) => key.includes(k));
//   return hit ? STATE_LANG[hit] : "";
// }

// // A name we trust: every non-initial word is Title Case ("Shanthi
// // Ranganathan", "S K Brindha"). OCR junk from a wrong-language read is
// // usually ALL CAPS or mixed ("EMHE JHIGEOIT", "THe").
// function nameLooksSolid(p = {}) {
//   const words = `${p.firstName || ""} ${p.lastName || ""}`.split(/\s+/).filter((w) => w.length > 1);
//   return words.length > 0 && words.every((w) => /^[A-Z][a-z]{2,}$/.test(w));
// }

// // One cached OCR worker per language (English + that language).
// const aadhaarWorkers = {};
// function getAadhaarWorker(lang = DEFAULT_CARD_LANG) {
//   const l = SUPPORTED_CARD_LANGS.includes(lang) ? lang : DEFAULT_CARD_LANG;
//   if (!aadhaarWorkers[l]) {
//     aadhaarWorkers[l] = createWorker(["eng", l])
//       .then(async (worker) => {
//         await worker.setParameters({ tessedit_pageseg_mode: "6" });
//         return worker;
//       })
//       .catch((err) => {
//         console.error(`[aadhaarOcr] "${l}" OCR unavailable, using English only:`, err.message);
//         delete aadhaarWorkers[l];
//         return getWorker();
//       });
//   }
//   return aadhaarWorkers[l];
// }

// // Keeps only English (ASCII) text: Tamil/Hindi characters are removed,
// // and lines left with no real letters are dropped.
// function englishOnly(text = "") {
//   return text
//     .split("\n")
//     .map((l) => l.replace(/[^\x00-\x7F]+/g, " ").replace(/\s{2,}/g, " ").trim())
//     .filter((l) => /[A-Za-z0-9]/.test(l))
//     .join("\n");
// }

// // ── PaddleOCR (second reader) ───────────────────────────────────────────
// // Runs on this server (ONNX), nothing is sent outside. Reads faded/blurred
// // English text that Tesseract misses ("Sivaswami M S", "Hinduja Devaraj").
// // Both readers run and the better value per field is kept
// // (mergeOcrParses). Optional: if @gutenye/ocr-node or the English model in
// // data/paddle/ is missing, Tesseract alone is used as before.
// let paddleReady = null;
// function getPaddle() {
//   if (!paddleReady) {
//     paddleReady = (async () => {
//       const rec = new URL("../data/paddle/en_PP-OCRv4_rec.onnx", import.meta.url);
//       const dict = new URL("../data/paddle/en_dict.txt", import.meta.url);
//       if (!fs.existsSync(rec) || !fs.existsSync(dict)) {
//         console.error("[aadhaarOcr] PaddleOCR English model missing in data/paddle — Tesseract only");
//         return null;
//       }
//       const mod = await import("@gutenye/ocr-node");
//       const Ocr = mod.default || mod;
//       return Ocr.create({
//         models: { recognitionPath: decodeURIComponent(rec.pathname), dictionaryPath: decodeURIComponent(dict.pathname) },
//       });
//     })().catch((err) => {
//       console.error("[aadhaarOcr] PaddleOCR not available — Tesseract only:", String(err?.message || err).slice(0, 200));
//       return null;
//     });
//   }
//   return paddleReady;
// }

// // PaddleOCR prints "," as "." and drops spaces after ":" / "," —
// // put them back so the same parsers work on its text.
// function normalizePaddleText(text = "") {
//   return text
//     .split("\n")
//     .map((l) =>
//       l
//         .replace(/\bD0B\b/g, "DOB")
//         .replace(/\bY0B\b/g, "YOB")
//         // "Sankar.560.VILLAGE" → "Sankar, 560, VILLAGE"; keeps "S.K" initials and "No.15".
//         .replace(/\b([A-Za-z]{3,}|\d+)\.(?=[A-Z0-9])/g, (m, w) => (/^no$/i.test(w) ? m : `${w}, `))
//         .replace(/,(?=\S)/g, ", ")
//         .replace(/:(?=[A-Za-z0-9])/g, ": ")
//         .replace(/(Birth|DOB|YOB)(?=\d)/gi, "$1 "),
//     )
//     .join("\n");
// }

// async function readPaddleText(filePath) {
//   if (isPdfFile(filePath) && englishOnly(pdfTextLayer(filePath)).length > 80) return ""; // exact text already
//   const ocr = await getPaddle();
//   if (!ocr) return "";
//   let pdfPng = null;
//   const out = `${filePath}-paddle.png`;
//   try {
//     let src = filePath;
//     if (isPdfFile(filePath)) {
//       pdfPng = pdfFirstPageToPngFile(filePath);
//       src = pdfPng;
//     }
//     await sharp(src).rotate().resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }).png().toFile(out);
//     const res = await ocr.detect(out);
//     const items = (Array.isArray(res) ? res : res?.texts || [])
//       .filter((t) => t && t.text)
//       .sort((a, b) => (a.box?.[0]?.[1] ?? 0) - (b.box?.[0]?.[1] ?? 0) || (a.box?.[0]?.[0] ?? 0) - (b.box?.[0]?.[0] ?? 0));
//     return normalizePaddleText(englishOnly(items.map((t) => t.text).join("\n")));
//   } catch (err) {
//     console.error("[aadhaarOcr] PaddleOCR read failed:", String(err?.message || err).slice(0, 200));
//     return "";
//   } finally {
//     fs.unlink(out, () => {});
//     if (pdfPng) fs.unlink(pdfPng, () => {});
//   }
// }

// // Best of Tesseract (a) and PaddleOCR (b), field by field.
// function mergeOcrParses(a = {}, b = {}) {
//   if (!b || !Object.keys(b).length) return a;
//   const nameWords = (p) => [...new Set(`${p.firstName || ""} ${p.lastName || ""}`.split(/\s+/).filter(Boolean))];
//   const nameScore = (p) => {
//     const w = nameWords(p);
//     if (!w.length) return 0;
//     return (nameLooksSolid(p) ? 100 : 0) + w.join("").length + 5 * (w.length - 1);
//   };
//   const out = { ...a };
//   if (nameScore(b) > nameScore(a)) {
//     out.firstName = b.firstName;
//     out.lastName = b.lastName;
//   }
//   // Digits: PaddleOCR reads them more reliably; Tesseract fills gaps.
//   if (b.dob) { out.dob = b.dob; out.age = b.age || a.age; } else if (!a.dob && b.age) out.age = b.age;
//   if (!out.age && b.age) out.age = b.age;
//   out.gender = a.gender || b.gender || "";
//   out.aadhaarNumber = b.aadhaarNumber || a.aadhaarNumber || "";
//   out.phone = a.phone || b.phone || "";
//   // Address: the read that found more of state / pincode / city.
//   const addrScore = (p) => (p.state ? 2 : 0) + (/^\d{6}$/.test(p.pincode || "") ? 2 : 0) + (p.city ? 1 : 0) + (p.addressLine1 ? 1 : 0);
//   if (addrScore(b) > addrScore(a)) {
//     for (const k of ["address", "addressLine1", "addressLine2", "city", "state", "pincode"]) out[k] = b[k] || "";
//   }
//   return out;
// }

// async function readAadhaarText(filePath, lang = DEFAULT_CARD_LANG) {
//   // e-Aadhaar PDF downloaded from UIDAI has real text inside — read that
//   // directly (exact letters, no OCR guessing). Scanned PDFs have no text
//   // layer, so they still go through OCR.
//   if (isPdfFile(filePath)) {
//     const layer = englishOnly(pdfTextLayer(filePath));
//     if (layer.length > 80 && /aadhaar|address|DOB|VTC|PIN\s*Code/i.test(layer)) {
//       console.log("[aadhaarOcr] read PDF text layer (no OCR)");
//       return layer;
//     }
//   }
//   const raw = await readImageText(filePath, getAadhaarWorker(lang), { cardCrop: true });
//   return englishOnly(raw);
// }

// // Text printed inside a PDF (page 1), line by line. "" if there is none,
// // or the PDF can't be opened.
// function pdfTextLayer(pdfPath) {
//   let doc = null, page = null, st = null;
//   try {
//     doc = mupdf.Document.openDocument(fs.readFileSync(pdfPath), "application/pdf");
//     page = doc.loadPage(0);
//     st = page.toStructuredText("preserve-whitespace");
//     return st.asText() || "";
//   } catch (err) {
//     console.error("[aadhaarOcr] PDF text layer read failed:", err.message);
//     return "";
//   } finally {
//     try { st?.destroy(); } catch { /* ignore */ }
//     try { page?.destroy(); } catch { /* ignore */ }
//     try { doc?.destroy(); } catch { /* ignore */ }
//   }
// }
 
// // Upscale + grayscale + normalize + sharpen before OCR. Falls back to the
// // original file if preprocessing fails.
// // Where the card sits in a photo: the area with text/edges, ignoring the
// // plain wall/table around it. Returns fractions {x0,x1,y0,y1} or null.
// async function findCardBox(filePath) {
//   try {
//     const { data, info } = await sharp(filePath).rotate()
//       .resize({ width: 300, height: 300, fit: "inside" })
//       .grayscale().blur(0.6).raw().toBuffer({ resolveWithObject: true });
//     const w = info.width, h = info.height;
//     const rows = new Array(h).fill(0), cols = new Array(w).fill(0);
//     for (let y = 1; y < h - 1; y++) {
//       for (let x = 1; x < w - 1; x++) {
//         const i = y * w + x;
//         const g = Math.abs(data[i + 1] - data[i - 1]) + Math.abs(data[i + w] - data[i - w]);
//         if (g > 40) { rows[y]++; cols[x]++; }
//       }
//     }
//     const span = (arr) => {
//       const tot = arr.reduce((a, b) => a + b, 0);
//       if (tot < 50) return null;
//       let acc = 0, lo = 0, hi = arr.length - 1;
//       for (let i = 0; i < arr.length; i++) { acc += arr[i]; if (acc >= tot * 0.01) { lo = i; break; } }
//       acc = 0;
//       for (let i = arr.length - 1; i >= 0; i--) { acc += arr[i]; if (acc >= tot * 0.01) { hi = i; break; } }
//       return [lo / arr.length, (hi + 1) / arr.length];
//     };
//     const r = span(rows), c = span(cols);
//     return r && c ? { x0: c[0], x1: c[1], y0: r[0], y1: r[1] } : null;
//   } catch {
//     return null;
//   }
// }

// async function preprocessForOcr(filePath, { cardCrop = false } = {}) {
//   const outPath = `${filePath}-ocr.png`;
//   let image = sharp(filePath, { density: 300 }).rotate(); // auto-orient via EXIF
//   const metadata = await image.metadata();
//   let srcWidth = metadata.width || 0;
//   // Card photographed small in the middle of a big photo (wall/table all
//   // around)? Crop to the card and enlarge it — tiny text is what makes
//   // OCR miss the name. Close-up photos and scans are left as they are.
//   // Aadhaar photos only — payment screenshots keep the old processing.
//   const box = cardCrop ? await findCardBox(filePath) : null;
//   if (box && (box.x1 - box.x0) * (box.y1 - box.y0) < 0.5 && metadata.width && metadata.height) {
//     const pad = 0.05;
//     const oriented = metadata.orientation >= 5 ? { W: metadata.height, H: metadata.width } : { W: metadata.width, H: metadata.height };
//     const left = Math.max(0, Math.floor((box.x0 - pad) * oriented.W));
//     const top = Math.max(0, Math.floor((box.y0 - pad) * oriented.H));
//     const width = Math.min(oriented.W - left, Math.ceil((box.x1 - box.x0 + 2 * pad) * oriented.W));
//     const height = Math.min(oriented.H - top, Math.ceil((box.y1 - box.y0 + 2 * pad) * oriented.H));
//     if (width > 50 && height > 50) {
//       const cropped = await sharp(filePath, { density: 300 }).rotate().extract({ left, top, width, height }).toBuffer();
//       image = sharp(cropped);
//       srcWidth = width;
//       console.log("[aadhaarOcr] card is small in the photo — cropped to it before reading");
//     }
//   }
//   const targetWidth = cardCrop ? Math.max(srcWidth, srcWidth < 1600 ? 2200 : 1600) : Math.max(srcWidth, 1600);
//   await image
//     .resize({ width: targetWidth, withoutEnlargement: false })
//     .grayscale()
//     .normalize()
//     .sharpen()
//     .toFile(outPath);
//   return outPath;
// }
 
// // A PDF always starts with "%PDF-" — check content, not extension.
// function isPdfFile(filePath) {
//   const fd = fs.openSync(filePath, "r");
//   try {
//     const head = Buffer.alloc(5);
//     const bytesRead = fs.readSync(fd, head, 0, 5, 0);
//     return bytesRead === 5 && head.toString("latin1") === "%PDF-";
//   } finally {
//     fs.closeSync(fd);
//   }
// }
 
// // Renders page 1 of a PDF to a PNG (~300 DPI) with mupdf. Throws on a
// // corrupt/password-protected PDF — caller must NOT fall back to OCR-ing
// // the raw PDF.
// // Page 2 of a 2-page Aadhaar PDF (front on page 1, back on page 2) as a
// // PNG, or null when the PDF has only one page.
// function pdfSecondPageToPngFile(pdfPath, dpi = 300) {
//   let doc = null;
//   try {
//     doc = mupdf.Document.openDocument(fs.readFileSync(pdfPath), "application/pdf");
//     if (doc.countPages() < 2) return null;
//     const page = doc.loadPage(1);
//     try {
//       const pixmap = page.toPixmap(mupdf.Matrix.scale(dpi / 72, dpi / 72), mupdf.ColorSpace.DeviceRGB, false, true);
//       try {
//         const outPath = `${pdfPath}-page2.png`;
//         fs.writeFileSync(outPath, pixmap.asPNG());
//         return outPath;
//       } finally {
//         pixmap.destroy();
//       }
//     } finally {
//       page.destroy();
//     }
//   } catch (err) {
//     console.error("[aadhaarOcr] could not read page 2 of PDF:", err.message);
//     return null;
//   } finally {
//     try { doc?.destroy(); } catch { /* ignore */ }
//   }
// }

// function pdfFirstPageToPngFile(pdfPath, dpi = 300) {
//   const buffer = fs.readFileSync(pdfPath);
//   const doc = mupdf.Document.openDocument(buffer, "application/pdf");
//   try {
//     const page = doc.loadPage(0);
//     try {
//       const matrix = mupdf.Matrix.scale(dpi / 72, dpi / 72);
//       const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);
//       try {
//         const outPath = `${pdfPath}-page1.png`;
//         fs.writeFileSync(outPath, pixmap.asPNG());
//         return outPath;
//       } finally {
//         pixmap.destroy();
//       }
//     } finally {
//       page.destroy();
//     }
//   } finally {
//     doc.destroy();
//   }
// }
 
// function removeTempUploads(req) {
//   const files = [];
//   if (req.file) files.push(req.file);
//   if (Array.isArray(req.files)) files.push(...req.files);
//   else if (req.files && typeof req.files === "object") {
//     Object.values(req.files).forEach((arr) => Array.isArray(arr) && files.push(...arr));
//   }
//   for (const f of files) {
//     if (f?.path) fs.unlink(f.path, () => { });
//   }
// }
// const withTempCleanup = (handler) => async (req, res) => {
//   try {
//     return await handler(req, res);
//   } finally {
//     removeTempUploads(req);
//   }
// };
 
 
// async function readImageText(filePath, workerPromiseOverride, ocrOpts = {}) {
//   const worker = await (workerPromiseOverride || getWorker());
 
//   // PDF → PNG FIRST, unconditionally.
//   let sourcePath = filePath;
//   let pdfPngPath = null;
//   if (isPdfFile(filePath)) {
//     try {
//       pdfPngPath = pdfFirstPageToPngFile(filePath);
//       sourcePath = pdfPngPath;
//     } catch (err) {
//       console.error("PDF-to-image conversion failed:", err.message);
//       throw new Error("Could not read this PDF — it may be corrupted or password-protected. Try a clear photo instead.");
//     }
//   }
 
//   let ocrPath = sourcePath;
//   let preprocessed = false;
//   try {
//     ocrPath = await preprocessForOcr(sourcePath, ocrOpts);
//     preprocessed = true;
//   } catch (err) {
//     console.error("OCR preprocess failed, reading original image instead:", err.message);
//     ocrPath = sourcePath; // always a real raster image here — never the raw PDF
//   }
//   try {
//     const { data: { text } } = await worker.recognize(ocrPath);
//     return text;
//   } finally {
//     if (pdfPngPath) {
//       fs.unlink(pdfPngPath, () => { });
//     }
//     if (preprocessed) {
//       fs.unlink(ocrPath, () => { });
//     }
//   }
// }
 
// // Backfill helper — re-OCR an already-uploaded Aadhaar image just for its
// // number. Used only by exportActiveTravellersPdfData.
// async function ocrAadhaarNumberFromUrl(url) {
//   const tmpPath = `${os.tmpdir()}/aadhaar-backfill-${Date.now()}-${Math.round(Math.random() * 1e6)}.jpg`;
//   const response = await fetch(url);
//   if (!response.ok) throw new Error(`Could not download image (HTTP ${response.status})`);
//   const buffer = Buffer.from(await response.arrayBuffer());
//   fs.writeFileSync(tmpPath, buffer);
//   try {
//     const text = await readImageText(tmpPath);
//     return extractAadhaarNumber(text);
//   } finally {
//     fs.unlink(tmpPath, () => { });
//   }
// }
 
// // Plain edit-distance (gender word only).
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
 
// // Exact match first; otherwise fuzzy-match tokens against FEMALE/MALE/
// // TRANSGENDER (OCR often reads "FEMALZ", "FEMAIE", etc).
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
 
// // e-Aadhaar PDF detection — the postal "To" line is e-PDF-only, so it's
// // required alongside the letterhead/enrolment text; VTC:+PIN Code: labels
// // are self-sufficient.
// function isEAadhaarPdfText(text) {
//   const hasToLine = /^\s*to\b/im.test(text);
//   return (
//     (hasToLine && /Unique\s*Identification\s*Authority/i.test(text)) ||
//     (hasToLine && /Enrolment\s*(No|Number)/i.test(text)) ||
//     (/VTC\s*[:\-]/i.test(text) && /PIN\s*Code\s*[:\-]/i.test(text))
//   );
// }
 
// // UIDAI boilerplate vocabulary that gets interleaved with the real
// // name/address on e-Aadhaar PDF OCR.
// const UIDAI_BOILERPLATE_WORDS = new Set([
//   "aadhaar", "maadhaar", "government", "india", "unique", "identification",
//   "authority", "proof", "identity", "citizenship", "verify", "verified",
//   "secure", "offline", "online", "authentication", "code", "scanning",
//   "scanner", "app", "apps", "stores", "store", "using", "letter",
//   "electronically", "generated", "information", "valid", "throughout",
//   "country", "helps", "avail", "various", "non", "services", "service",
//   "keep", "your", "mobile", "number", "email", "id", "updated", "carry",
//   "smart", "phone", "use", "signature", "not", "download", "enrolment",
//   "enrollment", "date", "issue", "address", "gender", "male", "female",
//   "transgender", "year", "years", "birth", "dob", "vid", "uidai", "help",
//   "www", "gov", "com", "in", "entities", "seeking", "obligated", "seek",
//   "consent", "documents", "document", "support", "after", "every", "from",
//   "holder", "based", "specified", "regulations", "submitted", "should",
//   "be", "through", "either", "appointed", "agency", "qr", "xml", "reader",
//   "available", "and", "or", "of", "is", "a", "to", "the", "this", "that",
//   "no", "on", "by", "for", "with", "benefits", "ensure", "security",
//   "when", "lock", "unlock", "biometrics", "feature", "digitally", "signed",
// ]);
 
// // Rejects regional-script OCR noise misread as Latin letters.
// function looksLikeRealWord(token) {
//   const lower = token.toLowerCase();
//   const vowels = (lower.match(/[aeiou]/g) || []).length;
//   if (vowels / lower.length < 0.25) return false;
//   if (/[^aeiou]{3,}/.test(lower)) return false;
//   return true;
// }
 
// function classifyNameToken(token) {
//   if (/^[a-z]/.test(token)) return "noise";
//   if (UIDAI_BOILERPLATE_WORDS.has(token.toLowerCase())) return "noise";
//   if (token.length === 1) return "word"; // a bare initial like "R"
//   if (!looksLikeRealWord(token)) return "noise";
//   return "word";
// }
 
// // Longest unbroken run of name-like tokens in one OCR line.
// function bestNameSegmentInLine(line) {
//   const tokens = line.match(/[A-Za-z]+/g) || [];
//   let best = [];
//   let current = [];
//   const isBetter = (a, b) =>
//     a.length !== b.length ? a.length > b.length : a.join("").length > b.join("").length;
//   for (const tok of tokens) {
//     if (classifyNameToken(tok) === "word") {
//       current.push(tok);
//     } else {
//       if (current.length && isBetter(current, best)) best = current;
//       current = [];
//     }
//   }
//   if (current.length && isBetter(current, best)) best = current;
//   return best;
// }
 
// // e-Aadhaar letter name. The letter prints:
// //     To
// //     Gomathi K R            ← holder's name
// //     W/o Nagaraju B,        ← husband/father — NEVER the holder's name
// //     Vill No 121 ...
// // and again in the cut-out card above "DOB:". So: (1) the line just above
// // the first S/O-W/O-D/O-C/O line, (2) the name above DOB / the DOB date,
// // (3) the lines after "To", always skipping relation lines.
// const RELATION_LINE_RE = /^\W*[SDWC]\s*\/\s*O\b/i;
// function extractNameFromEAadhaarPdf(lines, dob = "") {
//   const relIdx = lines.findIndex((l, i) => i < 40 && RELATION_LINE_RE.test(l));
//   if (relIdx > 0) {
//     let best = { words: [], score: 0 };
//     for (let i = relIdx - 1; i >= Math.max(0, relIdx - 2); i--) {
//       if (/^to\b|enrol|authority|government/i.test(lines[i])) break;
//       const run = bestNameRunInLine(lines[i]);
//       if (run.score > best.score) best = run;
//     }
//     if (best.score) return best.words.join(" ");
//   }

//   let anchor = lines.findIndex((l) => /DOB\s*[:\/]|Date of Birth/i.test(l));
//   if (anchor === -1 && dob) anchor = lines.findIndex((l) => l.includes(dob));
//   const aboveDob = pickNameAboveDob(lines, anchor);
//   if (aboveDob) return aboveDob;

//   const toIdx = lines.findIndex((l, i) => i < 40 && /^to\b/i.test(l));
//   if (toIdx !== -1) {
//     let best = { words: [], score: 0 };
//     for (let i = toIdx + 1; i <= Math.min(lines.length - 1, toIdx + 3); i++) {
//       if (RELATION_LINE_RE.test(lines[i])) break;
//       const run = bestNameRunInLine(lines[i]);
//       if (run.score > best.score) best = run;
//     }
//     if (best.score) return best.words.join(" ");
//   }
//   return "";
// }

// // OCR misspells state names on the letter ("Kamataka", "Kerla") — snap a
// // word that's 1–2 letters away from a single-word state to that state.
// function fixStateTypos(text = "") {
//   const single = INDIAN_STATES_UTS.filter((x) => !x.includes(" ") && x.length >= 6);
//   return text.replace(/\b[A-Za-z]{6,}\b/g, (w) => {
//     const lw = w.toLowerCase();
//     for (const st of single) {
//       const ls = st.toLowerCase();
//       if (lw === ls) return w;
//       if (Math.abs(lw.length - ls.length) > 2) continue;
//       if (levenshtein(lw, ls) <= (ls.length >= 8 ? 2 : 1)) return st;
//     }
//     return w;
//   });
// }

// // One printed letter line, minus OCR border junk ("Office, |", "B, 1").
// // A word worth keeping in a letter address line: "W/O:", "#202",
// // "No.12", "3rd", Title/CAPS words, or a single capital initial ("G").
// function isLetterAddressToken(t) {
//   const core = t.replace(/[,.;:]+$/, "");
//   if (!core) return false;
//   if (/^[SDWC]\/O:?$/i.test(core)) return true;
//   if (/^#?\d+[A-Za-z]?([/\-]\d+[A-Za-z]?)*$/.test(core)) return true;
//   if (/^No\.?\d+/i.test(core)) return true;
//   if (/^\d+(st|nd|rd|th)$/i.test(core)) return true;
//   if (/^[A-Z]$/.test(core)) return true;
//   if (/^[A-Z][a-z]+$/.test(core) || /^[A-Z]{2,}$/.test(core)) return core.length <= 3 || looksLikeIndianWord(core);
//   return false;
// }
// function cleanLetterLine(line = "") {
//   // The right-hand column (UIDAI instructions) gets glued onto the same
//   // OCR line after a " | ", " ! " or " i " — cut there.
//   line = line.split(/\s[|!i]\s|\s[|!]$|\si$/)[0];
//   const kept = line.split(/\s+/).filter(isLetterAddressToken);
//   // Line with no real word or house number = pure junk ("es =) o% Ed").
//   if (!kept.some((t) => /[A-Za-z]{3,}|\d/.test(t))) return "";
//   return kept.join(" ")
//     .replace(/[|!=£§~_^*{}[\]<>]/g, " ")
//     .replace(/(^|\s)[.:;'"`]+(?=\s|$)/g, " ")
//     .replace(/,\s*[A-Za-z0-9]\s*$/, ",")
//     .replace(/\s{2,}/g, " ")
//     .replace(/^[\s,.]+|[\s,]+$/g, "")
//     .trim();
// }

// // Keeps just the leading real-address words of one OCR line, stopping at
// // boilerplate merged onto its end.
// function addressLineLeadingRun(line) {
//   const rawWords = line.split(/\s+/).filter(Boolean);
//   const kept = [];
//   for (const w of rawWords) {
//     if (w === "-") { kept.push(w); continue; }
//     if (/^\d+([/-]\d+)*$/.test(w)) { kept.push(w); continue; }
//     const letters = w.replace(/[^A-Za-z]/g, "");
//     if (!letters) break;
//     if (/^[a-z]/.test(letters)) break;
//     if (UIDAI_BOILERPLATE_WORDS.has(letters.toLowerCase())) break;
//     kept.push(w.match(/^[A-Za-z0-9]+/)?.[0] || letters);
//   }
//   return kept.join(" ").trim();
// }
 
// // Unlabeled e-Aadhaar layout: "To" block up to the 6-digit PIN line.
// function extractAddressFallbackFromToBlock(lines, toIdx, name) {
//   if (toIdx === -1) return "";
//   let pinLineIdx = -1;
//   const maxScan = Math.min(lines.length - 1, toIdx + 20);
//   for (let i = toIdx + 1; i <= maxScan; i++) {
//     if (/\b\d{6}\b/.test(lines[i])) {
//       pinLineIdx = i;
//       break;
//     }
//   }
//   if (pinLineIdx === -1) return "";
//   const relevant = [];
//   for (let i = toIdx + 1; i <= pinLineIdx; i++) {
//     const line = lines[i];
//     if (/\b[SDWC]\s*\/?\s*O\b\s*[:.]?/i.test(line)) continue; // S/O, D/O, W/O, C/O
//     const clean = addressLineLeadingRun(line);
//     if (clean) relevant.push(clean);
//   }
//   let joined = relevant.join(", ");
//   if (name) {
//     const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
//     joined = joined.replace(new RegExp(escapeRegex(name), "gi"), "").trim();
//     const upperName = name.toUpperCase();
//     if (upperName !== name) joined = joined.replace(new RegExp(escapeRegex(upperName), "gi"), "").trim();
//   }
//   return cleanAddressNoise(joined.replace(/,\s*,/g, ",").replace(/^[\s,]+|[\s,]+$/g, ""));
// }
 
// function parseEAadhaarPdf(text) {
//   text = fixStateTypos(text);
//   const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
//   const name = extractNameFromEAadhaarPdf(lines, findDob(text, lines));
//   const { firstName, lastName } = splitIndianName(name);

//   const get = (re) => {
//     const m = text.match(re);
//     return m ? m[1].replace(/\s{2,}/g, " ").trim() : "";
//   };
//   const vtc = get(/VTC\s*[:\-]?\s*([A-Za-z .]+?)\s*(?:,|\n|$)/i);
//   const district = get(/(?<!Sub\s?)District\s*[:\-]?\s*([A-Za-z .]+?)\s*(?:,|\n|$)/i);
//   const stateLabel = get(/State\s*[:\-]?\s*([A-Za-z .]+?)\s*(?:,|\n|$)/i);
//   const pin = get(/PIN\s*Code\s*[:\-]?\s*(\d{6})/i);

//   // Street = from the W/O-S/O line (or the line after "To", minus the
//   // name) down to the "VTC:" line.
//   const toIdx = lines.findIndex((l, i) => i < 40 && /^to\b/i.test(l));
//   const relIdx = lines.findIndex((l, i) => i < 40 && RELATION_LINE_RE.test(l));
//   const vtcIdx = lines.findIndex((l) => /VTC\s*[:\-]/i.test(l));
//   let street = "";
//   const startIdx = relIdx !== -1 ? relIdx : toIdx !== -1 ? toIdx + 1 : -1;
//   if (startIdx !== -1 && vtcIdx > startIdx) {
//     const escapeRegex = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
//     street = lines.slice(startIdx, vtcIdx).map(cleanLetterLine).filter(Boolean).join(", ");
//     if (name && relIdx === -1) street = street.replace(new RegExp(escapeRegex(name), "i"), "");
//     street = street.replace(/,\s*,/g, ",").replace(/^[\s,]+|[\s,]+$/g, "").trim();
//   }

//   let address = [street, vtc, district, stateLabel, pin].filter(Boolean).join(", ");
//   if (!street) {
//     const fallback = extractAddressFallbackFromToBlock(lines, toIdx, name);
//     if (fallback) address = fallback;
//   }
//   const addressParts = splitAddressComponents(address);
//   // The letter labels these, so trust the labels over the generic split.
//   if (district || vtc) addressParts.city = district || vtc;
//   if (stateLabel) {
//     const canon = INDIAN_STATES_UTS.find((x) => x.toLowerCase() === stateLabel.toLowerCase());
//     if (canon) addressParts.state = canon;
//   }
//   if (pin) addressParts.pincode = pin;
//   // Printed letter text is clean — keep it as-is (with "R K", "R T O").
//   if (street) {
//     const town = vtc && vtc.toLowerCase() !== (district || "").toLowerCase() ? vtc : "";
//     addressParts.addressLine1 = [street, town].filter(Boolean).join(", ");
//   }
//   const mobileMatch = text.match(/Mobile\s*[:\-]?\s*(\d{10})/i);

//   return { firstName, lastName, address, addressParts, phone: mobileMatch ? mobileMatch[1] : "" };
// }

// // Shape check for a real word, lenient enough for Indian names/places with
// // consonant clusters ("Shanthi", "Street", "Varalakshmi") but still rejects
// // OCR junk ("rrr", "Hmmsd", "XKQZT").
// function looksLikeIndianWord(bare) {
//   const lower = bare.toLowerCase();
//   const vowels = (lower.match(/[aeiouy]/g) || []).length;
//   if (vowels / lower.length < 0.2) return false;
//   if (/[^aeiouy]{5,}/.test(lower)) return false;
//   if (/(.)\1\1/.test(lower)) return false;
//   return true;
// }

// // ── Name helpers (English-only) ─────────────────────────────────────────
// // Tesseract runs in English only, so Tamil/Hindi text on the card comes out
// // as random Latin junk ("Ny SAN An Sa", "Nc UImbs Beit"). A real English
// // name word is Title Case or ALL CAPS, at least 3 letters and vowel-shaped;
// // a lone capital (with or without a dot) is an initial.
// const NAME_STOP_WORDS = new Set([
//   "government", "india", "aadhaar", "unique", "identification", "authority",
//   "dob", "date", "birth", "year", "male", "female", "transgender", "issue",
//   "proof", "identity", "citizenship", "father", "husband", "mother", "address",
//   "enrolment", "download", "mera", "meri", "pehchaan", "pahchan",
// ]);
// function nameTokenKind(tok) {
//   // Tokens with brackets/digits/symbols glued on ("EMHE)", "[JHIGEOIT",
//   // "S60") are OCR junk, not names.
//   const core = tok.replace(/[.,]+$/, "");
//   if (!/^[A-Za-z]+(\.[A-Za-z]+)*$/.test(core)) return "noise";
//   const bare = core.replace(/\./g, "");
//   if (/^[A-Z]$/.test(bare)) return "initial";
//   if (/^[A-Z][a-z]$/.test(bare) && bare[0].toLowerCase() === bare[1]) return "initial"; // "Vv" → V
//   // "KR", "SK", "MRK" — run-together initials (no vowel, 2–3 capitals).
//   if (/^[A-Z]{2,3}$/.test(bare) && !/[AEIOU]/.test(bare)) return "initials";
//   if (bare.length < 3) return "noise";
//   if (NAME_STOP_WORDS.has(bare.toLowerCase())) return "noise";
//   if (!looksLikeIndianWord(bare)) return "noise";
//   if (/^[A-Z][a-z]+$/.test(bare)) return "title";
//   if (/^[A-Z]+$/.test(bare)) return "caps";
//   return "noise";
// }
// // Best name run in one line: consecutive Title-Case words + initials, or
// // consecutive ALL-CAPS words + initials (never mixed, so caps noise next to
// // a Title-Case name is dropped). Score = letters in real words.
// function bestNameRunInLine(line) {
//   // "S.K.Brindha" → "S. K. Brindha"; then split on spaces only, so junk
//   // like "S60" stays one (rejected) token instead of becoming initial "S".
//   const tokens = line
//     .replace(/([A-Za-z])\.(?=[A-Za-z])/g, "$1. ")
//     // Initials stuck to the name ("SivaswamiMS" → "Sivaswami M S").
//     .replace(/\b([A-Z][a-z]{2,})([A-Z]{1,3})\b/g, (m, w, ini) => `${w} ${ini.split("").join(" ")}`)
//     .split(/\s+/)
//     .filter(Boolean);
//   let best = { words: [], score: 0 };
//   for (const style of ["title", "caps"]) {
//     let cur = [];
//     let score = 0;
//     const flush = () => {
//       // A run made only of initials isn't a name.
//       if (score > 0 && score > best.score) best = { words: cur, score };
//       cur = [];
//       score = 0;
//     };
//     for (const tok of tokens) {
//       const kind = nameTokenKind(tok);
//       if (/^J?[\])]$/.test(tok) && score > 0) {
//         // Initial "J" right after a name is often OCR'd as "]" ("Chandrakala ]").
//         cur.push("J");
//       } else if (kind === "initial") {
//         cur.push(tok.replace(/[.,]/g, "").charAt(0).toUpperCase());
//       } else if (kind === "initials" && score > 0) {
//         // Only after a real name word ("Gomathi KR") — a leading "HB" is
//         // usually OCR junk from the photo/border.
//         cur.push(...tok.replace(/[.,]/g, "").split(""));
//       } else if (kind === style) {
//         const w = tok.replace(/[.,]/g, "");
//         cur.push(w);
//         score += style === "title" ? w.length * 2 : w.length;
//       } else {
//         flush();
//       }
//     }
//     flush();
//   }
//   // Trim stray initials glued on by noise beyond 2 at either end.
//   return best;
// }
// function pickNameAboveDob(lines, dobIdx) {
//   if (dobIdx === -1) return "";
//   let winner = { words: [], score: 0, dist: Infinity };
//   for (let i = dobIdx - 1, dist = 1; i >= Math.max(0, dobIdx - 6); i--, dist++) {
//     const line = lines[i];
//     if (/government|unique identification|authority/i.test(line)) break;
//     if (/father|husband|\b[sdwc]\s*\/\s*o\b/i.test(line)) continue;
//     const run = bestNameRunInLine(line);
//     if (!run.score) continue;
//     // Longer real name wins; on a tie the line closest to DOB wins.
//     if (run.score > winner.score || (run.score === winner.score && dist < winner.dist)) {
//       winner = { ...run, dist };
//     }
//   }
//   return winner.words.join(" ");
// }
// // First / last name rules:
// //   "Balameena"        → Balameena / Balameena
// //   "S.Brindha"        → S / Brindha
// //   "S.K.Brindha"      → S K / Brindha
// //   "Brindha S"        → Brindha / S
// //   "Brindha S K"      → Brindha / S K
// //   "Geetha Sankaram"  → Geetha / Sankaram
// function splitIndianName(fullName = "") {
//   const tokens = fullName.replace(/\./g, ". ").split(/\s+/).map((t) => t.replace(/\./g, "")).filter(Boolean);
//   if (tokens.length === 0) return { firstName: "", lastName: "" };
//   if (tokens.length === 1) return { firstName: tokens[0], lastName: tokens[0] };
//   const isInitial = (t) => /^[A-Za-z]$/.test(t);
//   let lead = 0;
//   while (lead < tokens.length && isInitial(tokens[lead])) lead++;
//   if (lead > 0 && lead < tokens.length) {
//     return { firstName: tokens.slice(0, lead).join(" ").toUpperCase(), lastName: tokens.slice(lead).join(" ") };
//   }
//   let trail = 0;
//   while (trail < tokens.length && isInitial(tokens[tokens.length - 1 - trail])) trail++;
//   if (trail > 0 && trail < tokens.length) {
//     return {
//       firstName: tokens.slice(0, tokens.length - trail).join(" "),
//       lastName: tokens.slice(tokens.length - trail).join(" ").toUpperCase(),
//     };
//   }
//   return { firstName: tokens[0], lastName: tokens.slice(1).join(" ") };
// }
// // DOB even when OCR splits "DOB :" and the date onto different lines.
// function findDob(text, lines) {
//   const labelled = text.match(/(?:DOB|D\.O\.B|Date of Birth)\s*[:\-]?\s*(\d{2}[/\-.]\d{2}[/\-.]\d{4})/i);
//   if (labelled) return labelled[1];
//   // OCR turns "/" into "1", "l", "I" or "|" ("DOB: 29111/1955" = 29/11/1955).
//   const fuzzy = text.match(/(?:DOB|D\.O\.B|Date of Birth)\s*[:\-]?\s*(\d{2})\s*[/\-.1lI|]?\s*(\d{2})\s*[/\-.1lI|]\s*(\d{4})/i);
//   if (fuzzy) {
//     const [, d, m, y] = fuzzy;
//     if (+d >= 1 && +d <= 31 && +m >= 1 && +m <= 12 && +y >= 1900 && +y <= new Date().getFullYear()) {
//       return `${d}/${m}/${y}`;
//     }
//   }
//   const thisYear = new Date().getFullYear();
//   const okYear = (d) => {
//     const y = Number(d.slice(-4));
//     return y >= 1900 && y <= thisYear;
//   };
//   const dobIdx = lines.findIndex((l) => /DOB|D\.O\.B|Date of Birth/i.test(l));
//   if (dobIdx !== -1) {
//     for (const i of [dobIdx, dobIdx - 1, dobIdx + 1, dobIdx - 2, dobIdx + 2]) {
//       const m = lines[i]?.match(/\b(\d{2}[/\-.]\d{2}[/\-.]\d{4})\b/);
//       if (m && okYear(m[1]) && !/issue/i.test(lines[i])) return m[1];
//     }
//   }
//   for (const l of lines) {
//     if (/issue|download|generat/i.test(l)) continue;
//     const m = l.match(/\b(\d{2}[/\-.]\d{2}[/\-.]\d{4})\b/);
//     if (m && okYear(m[1])) return m[1];
//   }
//   return "";
// }

// // OCR writes "S/O" as "S /O", "S|O", "5/0", "S/0" — make it "S/O" so the
// // address start is found and doesn't come out as a stray "O:".
// function normalizeRelation(text = "") {
//   // "Address:" misread ("addrass/O:", "AddresgaW/O:", "Adress") → "Address: "
//   text = text.replace(
//     /\b[Aa][Dd][Dd]?[Rr][AaEe][Ss][Ss]?[a-z]{0,2}?\s*[:;.]?\s*(?=[SDWC]\s*\/\s*O\b|\/\s*O\b|[A-Z0-9])/g,
//     "Address: ",
//   );
//   // Relation letter eaten by the label ("addrass/O: Sankar") — drop the
//   // orphan "/O:" rather than guess S/W/D/C.
//   text = text.replace(/Address:\s*\/\s*[O0]\s*[:.]?\s*/g, "Address: ");
//   text = text.replace(/(^|\n)([^A-Za-z0-9\n]*)([SDWC0])([O0])\s*:/g, (m, nl, pre, c) =>
//     `${nl}${pre}${c === "0" ? "D" : c}/O:`);
//   return text.replace(/(^|[^A-Za-z0-9])([SDWC50])\s*[\/|]\s*([O0])(?=\s*[:.,]|\s)/gi, (m, pre, c, o) =>
//     `${pre}${c === "5" ? "S" : c === "0" ? "D" : c}/${o === "0" ? "O" : o}`);
// }

// // State from the pincode's first digits (India Post zones). Used when OCR
// // couldn't read the state, and to catch a state that disagrees with the PIN.
// const PIN_PREFIX_STATE = [
//   [[11, 11], "Delhi"], [[12, 13], "Haryana"], [[14, 15], "Punjab"], [[17, 17], "Himachal Pradesh"],
//   [[18, 19], "Jammu And Kashmir"], [[30, 34], "Rajasthan"], [[36, 39], "Gujarat"],
//   [[40, 44], "Maharashtra"], [[45, 48], "Madhya Pradesh"], [[49, 49], "Chhattisgarh"],
//   [[50, 50], "Telangana"], [[51, 53], "Andhra Pradesh"], [[56, 59], "Karnataka"],
//   [[60, 64], "Tamil Nadu"], [[67, 69], "Kerala"], [[70, 74], "West Bengal"],
//   [[75, 77], "Odisha"], [[78, 78], "Assam"],
// ];
// // Pincode → [district, state] from the India Post directory, shipped as
// // data/pincodeDistricts.json (~300 KB, loaded once).
// let PIN_TABLE = null;
// function districtFromPincode(pin = "") {
//   if (!/^[1-9]\d{5}$/.test(pin)) return null;
//   if (!PIN_TABLE) {
//     try {
//       PIN_TABLE = JSON.parse(fs.readFileSync(new URL("../data/pincodeDistricts.json", import.meta.url), "utf8"));
//     } catch (err) {
//       console.error("[aadhaarOcr] pincode table missing (data/pincodeDistricts.json):", err.message);
//       PIN_TABLE = { pins: {}, districts: [], states: [] };
//     }
//   }
//   const v = PIN_TABLE.pins[pin];
//   if (v === undefined) return null;
//   return { district: PIN_TABLE.districts[Math.floor(v / 100)], state: PIN_TABLE.states[v % 100] };
// }

// function stateFromPincode(pin = "") {
//   if (!/^[1-9]\d{5}$/.test(pin)) return "";
//   if (/^6050(0|1)\d$/.test(pin) || /^533464$/.test(pin) || /^6091(0|1)\d$/.test(pin)) return "Puducherry";
//   const two = Number(pin.slice(0, 2));
//   const hit = PIN_PREFIX_STATE.find(([[lo, hi]]) => two >= lo && two <= hi);
//   return hit ? hit[1] : "";
// }

// function parseAadhaarText(text = "") {
//   text = normalizeRelation(text);
//   const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
//   const yobMatch = text.match(/(?:Year of Birth|YOB)\s*[:\-]?\s*(\d{4})/i);
//   let age = "", dob = findDob(text, lines);
//   if (dob) { age = calcAge(dob); }
//   else if (yobMatch) { age = new Date().getFullYear() - Number(yobMatch[1]); }
//   const gender = detectGender(text);
 
//   if (isEAadhaarPdfText(text)) {
//     const e = parseEAadhaarPdf(text);
//     const phone = e.phone || extractPhone(text);
//     const aadhaarNumber = extractAadhaarNumber(text);
//     return {
//       firstName: e.firstName,
//       lastName: e.lastName,
//       age,
//       dob,
//       gender,
//       address: e.address,
//       phone,
//       aadhaarNumber,
//       ...e.addressParts,
//     };
//   }
 
//   const dobIdx = lines.findIndex((l) => /DOB|D\.O\.B|Year of Birth|YOB|Date of Birth/i.test(l));
//   // DOB line itself sometimes loses the "DOB" word; fall back to the date line.
//   const anchorIdx = dobIdx !== -1 ? dobIdx : lines.findIndex((l) => dob && l.includes(dob));
//   const fullName = pickNameAboveDob(lines, anchorIdx);
//   const { firstName, lastName } = splitIndianName(fullName);
//   const phone = extractPhone(text);
//   const address = extractAddress(text);
//   const addressParts = splitAddressComponents(address);
//   const aadhaarNumber = extractAadhaarNumber(text);
//   return { firstName, lastName, age, dob, gender, address, phone, aadhaarNumber, ...addressParts };
// }
 
// // Mobile number — tolerates an internal space/hyphen.
// function extractPhone(text = "") {
//   const match = text.match(/\b([6-9]\d{4})[\s-]?(\d{5})\b/);
//   return match ? `${match[1]}${match[2]}` : "";
// }
 
// // 12-digit Aadhaar number (never starts with 0/1), returned as "XXXX XXXX XXXX".
// function extractAadhaarNumber(text = "") {
//   // Skip the 16-digit VID ("VID : 9100 8113 0273 0000") — its first 12
//   // digits look like an Aadhaar number.
//   const cleaned = text
//     .split("\n")
//     .filter((l) => !/\bVID\b/i.test(l))
//     .join("\n");
//   const candidates = cleaned.match(/(?<![\d\s-]\d|\d)\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b(?![\s-]?\d)/g) || [];
//   for (const raw of candidates) {
//     const digits = raw.replace(/[\s-]/g, "");
//     if (digits.length === 12 && /^[2-9]/.test(digits)) {
//       return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
//     }
//   }
//   return "";
// }
 
// // Strips background-pattern OCR noise from the address block.
// function cleanAddressNoise(addr = "") {
//   if (!addr) return addr;
//   const NOISE_CHARS = /[=£§~|_^*{}[\]<>]/;
//   const tokens = addr.split(/(\s+)/);
//   const kept = [];
//   for (const w of tokens) {
//     if (w === "" || /^\s+$/.test(w)) { kept.push(w); continue; }
//     const bare = w.replace(/[.,;:]/g, "");
//     if (!bare) continue;
//     if (NOISE_CHARS.test(w)) continue;
//     if (/^[A-Za-z]$/.test(bare)) continue;
//     if (/^[a-z]{2,5}$/.test(bare)) continue;
//     kept.push(w);
//   }
//   return kept
//     .join("")
//     .replace(/,\s*,/g, ",")
//     .replace(/\s{2,}/g, " ")
//     .replace(/^[\s,]+/, "")
//     .replace(/[\s,]+$/, "")
//     .trim();
// }
 
// const INDIAN_STATES_UTS = [
//   "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
//   "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
//   "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
//   "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
//   "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
//   "West Bengal", "Delhi", "Jammu And Kashmir", "Ladakh", "Puducherry",
//   "Chandigarh", "Andaman And Nicobar Islands", "Lakshadweep",
//   "Dadra And Nagar Haveli And Daman And Diu",
// ];
// // Best-effort split of one address string into Line1/Line2/City/State/Pincode.
// // One word of an address that looks real: a number/house no ("15", "3rd",
// // "No.15", "1/24", "W/O"), a kept abbreviation, or a Title-Case/ALL-CAPS
// // word of 3+ letters that's shaped like a real word. Mixed junk like
// // "A530", "THe", lowercase "ry"/"aan" fails.
// function isGoodAddressToken(t, keepShort) {
//   if (!t) return false;
//   const clean = t.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9.]+$/g, "");
//   if (!clean) return false;
//   if (/^[SDWC]\/O:?$/i.test(t)) return true;
//   if (/^(No\.?)?\d+([/\-]\d+)*(st|nd|rd|th)?\.?$/i.test(clean)) return true;
//   if (/^No\.?\d+/i.test(clean)) return true;
//   const bare = clean.replace(/\./g, "");
//   if (keepShort.has(bare.toLowerCase())) return true;
//   if (bare.length < 3 || /\d/.test(bare)) return false;
//   // Title Case / ALL CAPS words, or lowercase village names of 5+ letters
//   // ("thopanandal") — cards sometimes print those in lowercase.
//   if (!(/^[A-Z][a-z]+$/.test(bare) || /^[A-Z]+$/.test(bare) || /^[a-z]{5,}$/.test(bare))) return false;
//   return looksLikeIndianWord(bare);
// }

// // Splits one OCR'd address into: full street address (one line, not
// // split further), city, state and pincode.
// //   • pincode = last 6-digit number
// //   • state   = Indian state name anywhere in the text, even when OCR junk
// //               sits between its words ("Tamil oo AT Lad, 8 Nadu")
// //   • city    = "DIST:/District:" label if printed, else the segment just
// //               before the state (Aadhaar prints District right before State)
// //   • rest    = everything before the city, junk tokens removed
// function splitAddressComponents(addr = "") {
//   const out = { addressLine1: "", addressLine2: "", city: "", state: "", pincode: "" };
//   if (!addr) return out;
//   let text = addr.replace(/\s*\n\s*/g, ", ");
//   // The real address starts at "C/O:", "S/O:", "W/O:", "D/O:" when the card
//   // prints one — anything OCR'd before it is background/Tamil junk.
//   const relMatch = text.match(/\b[SDWC]\s*\/\s*O\b/i);
//   if (relMatch) text = text.slice(relMatch.index);

//   // Pincode
//   const pins = [...text.matchAll(/\b(\d{6})\b/g)];
//   if (pins.length) {
//     const last = pins[pins.length - 1];
//     out.pincode = last[1];
//     text = text.slice(0, last.index);
//   }

//   // State (longest names first so "West Bengal" beats "Bengal"-like hits)
//   const escapeRegex = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
//   const sortedStates = [...INDIAN_STATES_UTS].sort((x, y) => y.length - x.length);
//   let stateAt = -1;
//   for (const state of sortedStates) {
//     const re = new RegExp(`\\b${state.split(" ").map(escapeRegex).join("[\\s\\S]{0,25}?")}\\b`, "gi");
//     const hits = [...text.matchAll(re)];
//     if (hits.length) {
//       const h = hits[hits.length - 1];
//       if (h.index > stateAt) {
//         stateAt = h.index;
//         out.state = state;
//       }
//     }
//   }
//   // Second line of the state lost ("Kancheepuram, Tamil" + PIN line
//   // unreadable): a distinctive first word is enough.
//   if (stateAt === -1) {
//     const PARTIAL = { tamil: "Tamil Nadu", andhra: "Andhra Pradesh", arunachal: "Arunachal Pradesh",
//       himachal: "Himachal Pradesh", madhya: "Madhya Pradesh", jammu: "Jammu And Kashmir" };
//     const hits = [...text.matchAll(/\b(Tamil|Andhra|Arunachal|Himachal|Madhya|Jammu)\b/gi)];
//     if (hits.length) {
//       const h = hits[hits.length - 1];
//       stateAt = h.index;
//       out.state = PARTIAL[h[1].toLowerCase()];
//     }
//   }
//   if (stateAt !== -1) {
//     // Words on the same line/segment just before the state are junk
//     // ("SOBEENILSE ny Tamil Nadu") — District is printed on its own before it.
//     const cut = text.lastIndexOf(",", stateAt);
//     text = text.slice(0, cut === -1 ? stateAt : cut);
//   }

//   // City from a printed District label
//   const distMatch = text.match(/\b(?:DIST|District)\s*[:.\-]\s*([A-Za-z][A-Za-z .]+?)\s*(?:,|$)/i);
//   if (distMatch) {
//     out.city = distMatch[1].trim();
//     text = text.slice(0, distMatch.index) + text.slice(distMatch.index + distMatch[0].length);
//   }

//   // Clean each comma segment: drop labels (PO:, VTC:, Sub District:),
//   // stray symbols and 2-letter OCR junk; keep "No.15", "3rd", "W/O".
//   const KEEP_SHORT = new Set(["no", "rd", "st", "dr", "nr", "po", "ps", "ho"]);
//   let segments = text
//     .split(",")
//     // Drop a whole segment when most of its words are junk ("ry Ses A530",
//     // "SOBEENILSE ny") — better to lose a little than fill the form with noise.
//     .filter((seg) => {
//       const toks = seg.replace(/\b(?:PO|P\.O|VTC|Sub\s*District|Post)\s*[:.\-]\s*/gi, "").split(/\s+/).filter(Boolean);
//       if (!toks.length) return false;
//       const goodToks = toks.filter((t) => isGoodAddressToken(t, KEEP_SHORT));
//       // Keep if mostly real, or if it has one solid place word ("RR Kidampalayam").
//       return goodToks.length / toks.length >= 0.6 || goodToks.some((t) => /[A-Za-z]{5,}/.test(t));
//     })
//     .map((seg) =>
//       seg
//         .replace(/\b(?:PO|P\.O|VTC|Sub\s*District|Post)\s*[:.\-]\s*/gi, "")
//         .replace(/[+:;|£€$#@!?=~_*^<>{}\[\]§]/g, " ")
//         .split(/\s+/)
//         .filter((t) => isGoodAddressToken(t, KEEP_SHORT))
//         .join(" ")
//         .trim(),
//     )
//     .filter(Boolean);

//   // City from the segment just before the state (only place-name words).
//   if (!out.city && out.state) {
//     for (let i = segments.length - 1; i >= 0; i--) {
//       const seg = segments[i];
//       const ok =
//         /^[A-Za-z][A-Za-z .-]*$/.test(seg) &&
//         (seg.match(/[A-Za-z]{4,}/g) || []).some((w) => /^[A-Z]/.test(w) && looksLikeIndianWord(w));
//       segments.splice(i, 1);
//       if (ok) {
//         out.city = seg;
//         break;
//       }
//     }
//   }
//   if (out.city) {
//     out.city = out.city
//       .split(/\s+/)
//       .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
//       .join(" ");
//   }

//   // Remove repeated segments (e.g. "Vengikkal, Vengikkal") and the city
//   // repeated inside the street part; keep the address as ONE line.
//   const seen = new Set();
//   segments = segments.filter((seg) => {
//     const key = seg.toLowerCase().replace(/[^a-z0-9]/g, "");
//     if (!key || seen.has(key)) return false;
//     seen.add(key);
//     return true;
//   });
//   out.addressLine1 = segments.join(", ");
//   return out;
// }
 
// // Address — progressively looser fallbacks, all anchored on the 6-digit PIN.
// function extractAddress(text = "") {
//   // Front side has no address — only read one when the card says so, else a
//   // random 6-digit number in the noise becomes a fake pincode.
//   if (!/Address|\b[SDWC]\s*\/\s*O\b/i.test(text)) return "";
//   let match = text.match(/Address[:\s]*([\s\S]*?\b\d{6}\b)/i);
//   if (match) return cleanAddressNoise(match[1].replace(/\s*\n\s*/g, ", ").trim());
 
//   match = text.match(/\b[SDWC]\/O[:\s]*([\s\S]*?\b\d{6}\b)/i);
//   if (match) return cleanAddressNoise(match[1].replace(/\s*\n\s*/g, ", ").trim());
 
//   match = text.match(/\b\d{6}\b/);
//   if (match) {
//     const idx = text.indexOf(match[0]);
//     const before = text.slice(0, idx + match[0].length);
//     const lines = before.split("\n").map((l) => l.trim()).filter(Boolean);
//     return cleanAddressNoise(lines.slice(-6).join(", "));
//   }

//   // No PIN read at all (blurred/cut off): take the lines after the
//   // "Address" / S/O-W/O-D/O-C/O label, stopping at the footer.
//   const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
//   const startIdx = lines.findIndex((l) => /Address\s*[:.]|\b[SDWC]\s*\/\s*O\b/i.test(l));
//   if (startIdx !== -1) {
//     const block = [];
//     for (let i = startIdx; i < Math.min(lines.length, startIdx + 6); i++) {
//       if (i > startIdx && /uidai|help@|www\.|1947|\b\d{4}\s?\d{4}\s?\d{4}\b/i.test(lines[i])) break;
//       block.push(i === startIdx ? lines[i].replace(/^.*?(Address\s*[:.]\s*|(?=\b[SDWC]\s*\/\s*O\b))/i, "") : lines[i]);
//     }
//     const joined = cleanAddressNoise(block.join(", "));
//     if (joined) {
//       console.log("[extractAddress] no PIN found — using Address-label block");
//       return joined;
//     }
//   }

//   return "";
// }
// function mergeSides(front, back) {
//   // Back side normally carries the address; but on an e-Aadhaar letter the
//   // front has the labelled address and the back is UIDAI boilerplate, so
//   // prefer whichever side actually found a state.
//   const hasState = (x) => !!(x.address && x.state);
//   const addrSource = hasState(back) ? back : hasState(front) ? front : back.address ? back : front.address ? front : back;
//   return {
//     firstName: front.firstName || back.firstName || "",
//     lastName: front.lastName || back.lastName || "",
//     age: front.age || back.age || "",
//     dob: front.dob || back.dob || "",
//     gender: front.gender || back.gender || "",
//     phone: front.phone || back.phone || "",
//     aadhaarNumber: front.aadhaarNumber || back.aadhaarNumber || "",
//     address: addrSource.address || "",
//     addressLine1: addrSource.addressLine1 || "",
//     addressLine2: addrSource.addressLine2 || "",
//     city: addrSource.city || "",
//     state: addrSource.state || "",
//     pincode: addrSource.pincode || "",
//   };
// }
 
// // ── Aadhaar QR code ───────────────────────────────────────────────────
// // The QR printed on the card is exact data signed by UIDAI, so when it can
// // be read it beats OCR. Two formats exist:
// //   • Secure QR (2018+): a long decimal number → bytes → gzip → fields
// //     separated by byte 255.
// //   • Old QR (pre-2018): plain XML <PrintLetterBarcodeData name=".." .../>.
// // Only the last 4 digits of the Aadhaar number are in the Secure QR.

// // ZXing (WebAssembly) reads the dense Aadhaar Secure QR far better than
// // jsQR. Loaded lazily from the local package (no CDN); if the package isn't
// // installed, jsQR alone is used.
// let zxingReady = null;
// function getZxing() {
//   if (!zxingReady) {
//     zxingReady = import("zxing-wasm/reader")
//       .then((mod) => {
//         const wasmPath = require.resolve("zxing-wasm/reader/zxing_reader.wasm");
//         mod.prepareZXingModule({ overrides: { wasmBinary: fs.readFileSync(wasmPath) }, fireImmediately: true });
//         return mod;
//       })
//       .catch((err) => {
//         console.error("[aadhaarQr] zxing-wasm not available, using jsQR only:", err.message);
//         return null;
//       });
//   }
//   return zxingReady;
// }
// async function scanQrWithZxing(source) {
//   const zx = await getZxing();
//   if (!zx) return null;
//   try {
//     const { data, info } = await sharp(source).rotate()
//       .resize({ width: 3000, height: 3000, fit: "inside", withoutEnlargement: true })
//       .toColourspace("srgb").ensureAlpha().raw({ depth: "uchar" })
//       .toBuffer({ resolveWithObject: true });
//     const results = await zx.readBarcodes(
//       { data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), width: info.width, height: info.height, colorSpace: "srgb" },
//       { formats: ["QRCode"], tryHarder: true, maxNumberOfSymbols: 4 },
//     );
//     for (const r of results) {
//       const code = { data: r.text || "" };
//       if (r.isValid && isAadhaarQrPayload(code)) return code;
//     }
//   } catch (err) {
//     console.error("[aadhaarQr] zxing read failed:", err.message);
//   }
//   return null;
// }

// async function scanQrFromImage(filePath) {
//   let source = filePath;
//   let tmpPng = null;
//   try {
//     if (isPdfFile(filePath)) {
//       tmpPng = pdfFirstPageToPngFile(filePath, 400);
//       source = tmpPng;
//     }
//     const zxCode = await scanQrWithZxing(source);
//     if (zxCode) return zxCode;
//     const meta = await sharp(source).rotate().metadata();
//     const longSide = Math.max(meta.width || 0, meta.height || 0);
//     // Try a few sizes: dense Secure QRs need resolution, but very large
//     // phone photos decode faster and better when scaled down.
//     const sizes = [...new Set([Math.min(longSide, 2400), 1800, 1300, 900].filter((s) => s > 0 && s <= longSide))];
//     for (const size of sizes) {
//       for (const boost of [false, true]) {
//         let img = sharp(source).rotate().resize({ width: size, height: size, fit: "inside" });
//         if (boost) img = img.grayscale().normalize().sharpen();
//         const { data, info } = await img.toColourspace("srgb").ensureAlpha().raw({ depth: "uchar" }).toBuffer({ resolveWithObject: true });
//         if (data.length !== info.width * info.height * 4) continue;
//         const code = jsQR(new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), info.width, info.height, {
//           inversionAttempts: "attemptBoth",
//         });
//         if (isAadhaarQrPayload(code)) return code;
//       }
//     }
//     // e-Aadhaar letters / full-page scans have 2–3 QR codes on one page,
//     // which confuses the whole-image scan. Scan overlapping tiles instead.
//     return await scanQrTiles(source, meta);
//   } finally {
//     if (tmpPng) fs.unlink(tmpPng, () => {});
//   }
// }

// // Only a long decimal number (Secure QR) or the old XML QR is an Aadhaar
// // QR — a small QR like a website link is ignored so scanning goes on.
// function isAadhaarQrPayload(code) {
//   const txt = (code?.data || "").trim();
//   return /^\d{200,}$/.test(txt) || /PrintLetterBarcodeData/i.test(txt);
// }

// async function scanQrTiles(source, meta) {
//   const W = meta.width || 0, H = meta.height || 0;
//   if (!W || !H) return null;
//   for (const grid of [2, 3]) {
//     const tw = Math.round((W / grid) * 1.5), th = Math.round((H / grid) * 1.5);
//     const stepX = grid > 1 ? (W - Math.min(tw, W)) / (grid - 1) : 0;
//     const stepY = grid > 1 ? (H - Math.min(th, H)) / (grid - 1) : 0;
//     for (let gy = 0; gy < grid; gy++) {
//       for (let gx = 0; gx < grid; gx++) {
//         const left = Math.round(gx * stepX), top = Math.round(gy * stepY);
//         const width = Math.min(tw, W - left), height = Math.min(th, H - top);
//         try {
//           const { data, info } = await sharp(source)
//             .rotate()
//             .extract({ left, top, width, height })
//             .resize({ width: Math.min(width, 1600), height: Math.min(height, 1600), fit: "inside" })
//             .toColourspace("srgb").ensureAlpha().raw({ depth: "uchar" })
//             .toBuffer({ resolveWithObject: true });
//           if (data.length !== info.width * info.height * 4) continue;
//           const code = jsQR(new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), info.width, info.height, {
//             inversionAttempts: "attemptBoth",
//           });
//           if (isAadhaarQrPayload(code)) return code;
//         } catch { /* try next tile */ }
//       }
//     }
//   }
//   return null;
// }

// function decimalStringToBytes(str) {
//   let n = BigInt(str);
//   const bytes = [];
//   while (n > 0n) {
//     bytes.unshift(Number(n & 255n));
//     n >>= 8n;
//   }
//   return Buffer.from(bytes);
// }

// function decompressAny(buf) {
//   for (const fn of [zlib.gunzipSync, zlib.inflateSync, zlib.inflateRawSync]) {
//     try {
//       return fn(buf);
//     } catch {
//       /* try the next format */
//     }
//   }
//   return null;
// }

// function normaliseQrDob(raw = "") {
//   const m = String(raw).match(/^(\d{2})[-/.](\d{2})[-/.](\d{4})$/);
//   if (m) return `${m[1]}/${m[2]}/${m[3]}`;
//   const iso = String(raw).match(/^(\d{4})[-/.](\d{2})[-/.](\d{2})$/);
//   if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
//   return "";
// }

// const QR_GENDER = { M: "Male", F: "Female", T: "Other" };

// // Turns decoded QR fields into the same shape parseAadhaarText returns.
// function qrFieldsToParsed(f) {
//   const { firstName, lastName } = splitIndianName(f.name || "");
//   const dob = normaliseQrDob(f.dob);
//   let age = dob ? calcAge(dob) : "";
//   if (!age && /^\d{4}$/.test(f.yob || "")) age = new Date().getFullYear() - Number(f.yob);
//   const careOf = (f.careof || "").trim();
//   const street = [careOf, f.house, f.street, f.landmark, f.location].map((x) => (x || "").trim()).filter(Boolean);
//   const area = [f.vtc, f.postoffice, f.subdistrict]
//     .map((x) => (x || "").trim())
//     .filter(Boolean)
//     .filter((x, i, arr) => arr.findIndex((y) => y.toLowerCase() === x.toLowerCase()) === i);
//   const city = (f.district || "").trim();
//   const state = (f.state || "").trim();
//   const pincode = (String(f.pincode || "").match(/\d{6}/) || [""])[0];
//   const address = [...street, ...area, city, state, pincode].filter(Boolean).join(", ");
//   return {
//     firstName,
//     lastName,
//     age,
//     dob,
//     gender: QR_GENDER[(f.gender || "").trim().toUpperCase().charAt(0)] || "",
//     address,
//     phone: "",
//     aadhaarLast4: (f.last4 || "").replace(/\D/g, "").slice(-4),
//     // One address line (house/street/area together), as on the OCR side.
//     addressLine1: [...street, ...area].join(", "),
//     addressLine2: "",
//     city,
//     state,
//     pincode,
//   };
// }

// function parseSecureQr(numericText) {
//   if (!/^\d{50,}$/.test(numericText)) return null;
//   const raw = decompressAny(decimalStringToBytes(numericText));
//   if (!raw) return null;
//   const parts = [];
//   let start = 0;
//   for (let i = 0; i < raw.length && parts.length < 20; i++) {
//     if (raw[i] === 255) {
//       parts.push(raw.slice(start, i).toString("utf8"));
//       start = i + 1;
//     }
//   }
//   // V2+ starts with "V2"/"V3"; V1 has no version field.
//   const off = /^V\d$/.test(parts[0] || "") ? 1 : 0;
//   const at = (i) => (parts[i + off] || "").trim();
//   return {
//     referenceId: at(1),
//     last4: at(1).slice(0, 4),
//     name: at(2),
//     dob: at(3),
//     gender: at(4),
//     careof: at(5),
//     district: at(6),
//     landmark: at(7),
//     house: at(8),
//     location: at(9),
//     pincode: at(10),
//     postoffice: at(11),
//     state: at(12),
//     street: at(13),
//     subdistrict: at(14),
//     vtc: at(15),
//   };
// }

// function parseXmlQr(text) {
//   if (!/<\s*PrintLetterBarcodeData/i.test(text)) return null;
//   const attr = (k) => {
//     const m = text.match(new RegExp(`\\b${k}\\s*=\\s*"([^"]*)"`, "i"));
//     return m ? m[1].trim() : "";
//   };
//   return {
//     last4: attr("uid").slice(-4),
//     name: attr("name"),
//     dob: attr("dob"),
//     yob: attr("yob"),
//     gender: attr("gender"),
//     careof: attr("co"),
//     district: attr("dist"),
//     landmark: attr("lm"),
//     house: attr("house"),
//     location: attr("loc"),
//     pincode: attr("pc"),
//     postoffice: attr("po"),
//     state: attr("state"),
//     street: attr("street"),
//     subdistrict: attr("subdist"),
//     vtc: attr("vtc"),
//   };
// }

// // Returns parsed fields from the card's QR, or null when there is no
// // readable Aadhaar QR in the image.
// async function readAadhaarQr(filePath) {
//   try {
//     const code = await scanQrFromImage(filePath);
//     if (!code) return null;
//     const text = (code.data || "").trim();
//     const fields = parseSecureQr(text) || parseXmlQr(text);
//     if (!fields || !fields.name) return null;
//     console.log(`[aadhaarQr] read QR for "${fields.name}"`);
//     return qrFieldsToParsed(fields);
//   } catch (err) {
//     console.error("[aadhaarQr] QR read failed, using OCR only:", err.message);
//     return null;
//   }
// }

// // QR values win; OCR fills whatever the QR doesn't carry (full Aadhaar
// // number, mobile). The OCR'd Aadhaar number is kept only if its last 4
// // digits agree with the QR.
// function mergeQrWithOcr(qr, ocr) {
//   if (!qr) return ocr;
//   const pick = (k) => (qr[k] !== undefined && qr[k] !== "" ? qr[k] : ocr[k] || "");
//   let aadhaarNumber = ocr.aadhaarNumber || "";
//   if (qr.aadhaarLast4 && aadhaarNumber && !aadhaarNumber.replace(/\D/g, "").endsWith(qr.aadhaarLast4)) {
//     aadhaarNumber = "";
//   }
//   return {
//     firstName: pick("firstName"),
//     lastName: pick("lastName"),
//     age: pick("age"),
//     dob: pick("dob"),
//     gender: pick("gender"),
//     phone: ocr.phone || "",
//     aadhaarNumber,
//     address: pick("address"),
//     addressLine1: pick("addressLine1"),
//     addressLine2: pick("addressLine2"),
//     city: pick("city"),
//     state: pick("state"),
//     pincode: pick("pincode"),
//     source: "qr",
//   };
// }

// // POST /ocr/aadhaar — multipart: front (required), back (optional)
// // The whole read (QR + PDF text / OCR + parsing) for one Aadhaar, with no
// // upload and no req/res — used by extractAadhaar and by the accuracy test
// // script (scripts/aadhaarAccuracyTest.js).
// export async function extractAadhaarFromFiles(frontPath, backPath = null, opts = {}) {
//   // One PDF with front on page 1 and back on page 2 (scanned card) — use
//   // page 2 as the back side so the address and QR are read too.
//   let pdfBackTmp = null;
//   if (!backPath && isPdfFile(frontPath)) {
//     pdfBackTmp = pdfSecondPageToPngFile(frontPath);
//     if (pdfBackTmp) {
//       console.log("[aadhaarOcr] PDF has 2 pages — reading page 2 as the back side");
//       backPath = pdfBackTmp;
//     }
//   }
//   try {
//     return await extractAadhaarFromFilesInner(frontPath, backPath, opts);
//   } finally {
//     if (pdfBackTmp) fs.unlink(pdfBackTmp, () => {});
//   }
// }

// async function extractAadhaarFromFilesInner(frontPath, backPath = null, opts = {}) {
//   // Language chosen in the dropdown wins; then the hint; then Tamil.
//   const forcedLang = SUPPORTED_CARD_LANGS.includes(opts.cardLang) ? opts.cardLang : null;
//   const hintLang =
//     forcedLang || langFromPincode(opts.pincode) || langFromState(opts.state) || DEFAULT_CARD_LANG;
//   let cardLang = hintLang;

//   // PaddleOCR runs alongside Tesseract (own threads) — start both sides now.
//   const paddleBackP = backPath ? readPaddleText(backPath) : Promise.resolve("");
//   const paddleFrontP = readPaddleText(frontPath);

//   // Back side first (main traveller): read it, then pick the language
//   // from the pincode/state printed on it. Re-read only if that language
//   // differs from the guess — Tamil cards stay a single pass.
//   let backData = {}, backText = "";
//   if (backPath) {
//     backText = await readAadhaarText(backPath, cardLang);
//     backData = parseAadhaarText(backText);
//     const detected =
//       langFromPincode(backData.pincode) ||
//       langFromPincode((backText.match(/\b[1-9]\d{5}\b/g) || []).slice(-1)[0]) ||
//       langFromState(backData.state);
//     if (!forcedLang && detected && detected !== cardLang) {
//       console.log(`[aadhaarOcr] back side says "${detected}" (pincode ${backData.pincode || "?"}), re-reading`);
//       cardLang = detected;
//       backText = await readAadhaarText(backPath, cardLang);
//       backData = parseAadhaarText(backText);
//     }
//     const paddleBack = await paddleBackP;
//     if (paddleBack) {
//       backData = mergeOcrParses(backData, parseAadhaarText(paddleBack));
//       backText += `\n--- PaddleOCR ---\n${paddleBack}`;
//     }
//   }

//   // Secure QR is usually on the back (newer cards also on the front);
//   // try back first, then front.
//   let qrData = backPath ? await readAadhaarQr(backPath) : null;
//   if (!qrData) qrData = await readAadhaarQr(frontPath);

//   let frontText = await readAadhaarText(frontPath, cardLang);
//   let frontData = parseAadhaarText(frontText);
//   const paddleFront = await paddleFrontP;
//   const paddleFrontData = paddleFront ? parseAadhaarText(paddleFront) : null;
//   if (paddleFrontData) {
//     frontData = mergeOcrParses(frontData, paddleFrontData);
//     frontText += `\n--- PaddleOCR ---\n${paddleFront}`;
//   }

//   // Front only (co-traveller) and the name doesn't look right? The card
//   // may be from another state than the main traveller — try the other
//   // languages one by one and keep the first that gives a clean name.
//   // Skipped when the QR already gave the name.
//   if (!forcedLang && !backPath && !qrData?.firstName && !nameLooksSolid(frontData)) {
//     for (const lang of SUPPORTED_CARD_LANGS.filter((l) => l !== cardLang)) {
//       const text = await readAadhaarText(frontPath, lang);
//       const data = paddleFrontData ? mergeOcrParses(parseAadhaarText(text), paddleFrontData) : parseAadhaarText(text);
//       if (nameLooksSolid(data)) {
//         console.log(`[aadhaarOcr] co-traveller name read with "${lang}" instead of "${cardLang}"`);
//         frontText = text;
//         frontData = data;
//         cardLang = lang;
//         break;
//       }
//     }
//   }
//   const parsed = mergeQrWithOcr(qrData, mergeSides(frontData, backData));
//   const readFrom = qrData ? "qr" : "ocr";
//   const stateMismatch = applyPincodeDistrict(parsed, readFrom);
//   const reviewFields = fieldsToReview(parsed, readFrom, !!backPath);
//   if (stateMismatch) {
//     for (const f of ["state", "city", "pincode"]) if (!reviewFields.includes(f)) reviewFields.push(f);
//   }
//   return { parsed, readFrom, cardLang, frontText, backText, reviewFields };
// }

// const DISTRICT_ALIASES = [
//   ["bengaluru", "bangalore"], ["mysuru", "mysore"], ["chennai", "madras"], ["kolkata", "calcutta"],
//   ["mumbai", "bombay"], ["thiruvananthapuram", "trivandrum"], ["puducherry", "pondicherry"],
//   ["tiruchirappalli", "trichy", "tiruchirapalli"], ["gurugram", "gurgaon"], ["belagavi", "belgaum"],
//   ["kalaburagi", "gulbarga"], ["mangaluru", "mangalore", "dakshina kannada"], ["thoothukudi", "tuticorin"],
//   ["kanchipuram", "kancheepuram"], ["prayagraj", "allahabad"], ["visakhapatnam", "vizag", "vishakhapatnam"],
//   ["vijayapura", "bijapur"], ["shivamogga", "shimoga"], ["tumakuru", "tumkur"], ["hubballi", "hubli", "dharwad"],
//   ["kozhikode", "calicut"], ["thrissur", "trichur"], ["kochi", "cochin", "ernakulam"], ["kollam", "quilon"],
//   ["villupuram", "viluppuram"], ["tiruvallur", "thiruvallur"], ["tiruvannamalai", "thiruvannamalai"],
// ];
// function sameDistrict(a = "", b = "") {
//   const n = (x) => x.toLowerCase().replace(/[^a-z]/g, "");
//   const x = n(a), y = n(b);
//   if (!x || !y) return false;
//   if (x === y || x.includes(y) && x.length - y.length <= 3) return true;
//   if (DISTRICT_ALIASES.some((g) => g.map(n).includes(x) && g.map(n).includes(y))) return true;
//   return levenshtein(x, y) <= Math.max(1, Math.floor(y.length / 5));
// }

// function applyPincodeDistrict(parsed, readFrom) {
//   let stateMismatch = false;
//   // City = DISTRICT and State = state, always from the pincode when the
//   // pincode is a real one (India Post directory). Whatever OCR put in city
//   // that isn't the district (a village/area like "Moongileripatti") goes
//   // back into the address line instead of being lost.
//   const pinInfo = readFrom === "qr" && parsed.city && parsed.state ? null : districtFromPincode(parsed.pincode);
//   if (pinInfo) {
//     const ocrCity = (parsed.city || "").trim();
//     // Card prints the new/local name ("Bengaluru") — same district as the
//     // directory's "Bangalore": keep the card's spelling, nothing left over.
//     if (ocrCity && sameDistrict(ocrCity, pinInfo.district)) {
//       parsed.city = ocrCity;
//       if (parsed.state && parsed.state.toLowerCase() !== pinInfo.state.toLowerCase()) stateMismatch = true;
//       parsed.state = pinInfo.state;
//       return stateMismatch;
//     }
//     const distRe = new RegExp(`\\b${pinInfo.district.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
//     const leftover = ocrCity.replace(distRe, "").replace(/[^A-Za-z0-9 ]+/g, " ").replace(/\s{2,}/g, " ").trim();
//     if (leftover.length >= 3 && !new RegExp(`\\b${leftover}\\b`, "i").test(parsed.addressLine1 || "")) {
//       parsed.addressLine1 = [parsed.addressLine1, leftover].filter(Boolean).join(", ");
//     }
//     parsed.city = pinInfo.district;
//     if (parsed.state && parsed.state.toLowerCase() !== pinInfo.state.toLowerCase()) {
//       stateMismatch = true; // OCR'd state vs pincode disagree — pincode may be misread
//       console.log(`[aadhaarOcr] state "${parsed.state}" ≠ pincode state "${pinInfo.state}" — using pincode`);
//     }
//     parsed.state = pinInfo.state;
//   } else {
//     const pinState = stateFromPincode(parsed.pincode);
//     if (!parsed.state && pinState) parsed.state = pinState;
//     else if (pinState && parsed.state && pinState.toLowerCase() !== parsed.state.toLowerCase()) stateMismatch = true;
//   }
//   return stateMismatch;
// }

// // Fields the admin should double-check (shown in yellow on the page).
// // QR data is UIDAI's own, so only what the QR doesn't carry is flagged.
// function fieldsToReview(p = {}, readFrom = "ocr", hasBack = false) {
//   const out = [];
//   const fromQr = readFrom === "qr";
//   if (!fromQr && !nameLooksSolid(p)) out.push("firstName", "lastName");
//   if (!p.firstName) out.includes("firstName") || out.push("firstName");
//   if (!p.lastName) out.includes("lastName") || out.push("lastName");
//   if (!p.age) out.push("age");
//   if (!p.gender) out.push("gender");
//   if (hasBack || p.addressLine1 || p.pincode) {
//     const line = p.addressLine1 || "";
//     const junk =
//       /[|=~_^*{}<>%]/.test(line) ||
//       /(^|[\s,])[a-z]{1,2}(?=[\s,]|$)/.test(line) ||
//       /(^|\s)[.:;]+(\s|,|$)/.test(line);
//     if (!line || line.length < 12 || (!fromQr && junk)) out.push("addressLine1");
//     if (!p.city) out.push("city");
//     if (!p.state) out.push("state");
//     if (!/^\d{6}$/.test(p.pincode || "")) out.push("pincode");
//     if (!/^\d{10}$/.test(p.phone || "")) out.push("phone");
//   }
//   return out;
// }

// export const extractAadhaar = withTempCleanup(async (req, res) => {
//   try {
//     const frontFile = req.files?.front?.[0];
//     const backFile = req.files?.back?.[0];
//     if (!frontFile) {
//       return res.status(400).json({ success: false, message: "Aadhaar front image is required" });
//     }
//     const { parsed: merged, readFrom, cardLang, frontText, backText, reviewFields } = await extractAadhaarFromFiles(
//       frontFile.path,
//       backFile?.path || null,
//       { cardLang: req.body?.cardLang, pincode: req.body?.pincode, state: req.body?.state },
//     );
//     const backUpload = backFile
//       ? await cloudinary.uploader.upload(backFile.path, { folder: "aadhaar", resource_type: "image" })
//       : null;
//     const frontUpload = await cloudinary.uploader.upload(frontFile.path, { folder: "aadhaar", resource_type: "image" });
//     return res.status(200).json({
//       success: true,
//       parsed: merged,
//       readFrom,
//       reviewFields,
//       cardLang,
//       front: { url: frontUpload.secure_url, ocrText: frontText },
//       back: backUpload ? { url: backUpload.secure_url, ocrText: backText } : null,
//     });
//   } catch (error) {
//     console.error("extractAadhaar error:", error);
//     return res.status(500).json({ success: false, message: "Could not read the Aadhaar image.", error: error.message });
//   }
// });
 
// // POST /ocr/payment-screenshot — OCR amount first, typed amount as fallback.
// export const uploadPaymentScreenshot = withTempCleanup(async (req, res) => {
//   try {
//     const file = req.file;
//     const { type, amount } = req.body;
//     if (!file) return res.status(400).json({ success: false, message: "Screenshot image is required" });
//     if (!["advance", "balance", "partial"].includes(type)) {
//       return res.status(400).json({ success: false, message: "type must be advance, balance or partial" });
//     }
//     if (amount !== undefined && amount !== "" && (isNaN(Number(amount)) || Number(amount) <= 0)) {
//       return res.status(400).json({ success: false, message: "Amount, if entered, must be a positive number." });
//     }
//     const upload = await cloudinary.uploader.upload(file.path, { folder: "payment-screenshots", resource_type: "image" });
 
//     // let ocrAmount = null;
//     // try {
//     //   const text = await readImageText(file.path);
//     //   ocrAmount = extractPaymentAmount(text);
//     // } catch (err) {
//     //   console.error("Payment screenshot OCR failed, falling back to typed amount:", err.message);
//     // }
//     // const finalAmount = ocrAmount ?? (amount ? Number(amount) : null);
 
//     // The amount the admin typed always wins. OCR is only a fallback when
//     // the box was left empty (it can misread "₹10,000" as "310000").
//     const typedAmount = amount !== undefined && amount !== "" ? Number(amount) : null;
//     let ocrAmount = null;
//     if (typedAmount === null) {
//       try {
//         const text = await readImageText(file.path);
//         ocrAmount = extractPaymentAmount(text);
//       } catch (err) {
//         console.error("Payment screenshot OCR failed:", err.message);
//       }
//     }
//     const finalAmount = typedAmount ?? ocrAmount;
 
//     return res.status(200).json({
//       success: true,
//       type,
//       url: upload.secure_url,
//       amount: finalAmount,
//       // amountSource: ocrAmount !== null ? "ocr" : amount ? "manual" : "none",
//       amountSource: typedAmount !== null ? "manual" : ocrAmount !== null ? "ocr" : "none",
//     });
//   } catch (error) {
//     console.error("uploadPaymentScreenshot error:", error);
//     return res.status(500).json({ success: false, message: "Upload failed.", error: error.message });
//   }
// });
 
// export const saveBookingNotes = async (req, res) => {
//   try {
//     const { tourId, packageType, packageKind, variantPackageIndex, boardingPoint, deboardingPoint, addons, remarks, raisedBy } = req.body;
 
//     if (!tourId) {
//       return res.status(400).json({ success: false, message: "tourId is required" });
//     }
 
//     const doc = await aadhaarModel.create({
//       type: "bookingNotes",
//       tourId,
//       packageType: packageType || "",
//       packageKind: packageKind === "variant" ? "variant" : packageKind === "main" ? "main" : "",
//       variantPackageIndex:
//         packageKind === "variant" && variantPackageIndex !== undefined && variantPackageIndex !== null
//           ? Number(variantPackageIndex)
//           : null,
//       boardingPoint: boardingPoint || "",
//       deboardingPoint: deboardingPoint || "",
//       addons: addons || "",
//       remarks: remarks || "",
//       uploadedBy: "admin",
//       raisedBy: raisedBy
//         ? { name: raisedBy.name || "", employeeId: raisedBy.employeeId || "" }
//         : undefined,
//     });
 
//     return res.status(201).json({ success: true, note: doc });
//   } catch (error) {
//     console.error("saveBookingNotes error:", error);
//     return res.status(500).json({ success: false, message: "Could not save booking notes.", error: error.message });
//   }
// };
 
// // POST /ocr/save-aadhaar-upload — "Save Booking" on the Aadhaar Upload page.
// // Creates every aadhaarModel doc for one walk-in capture, all sharing one
// // groupId. Only an Advance Payment screenshot is hard-required.
// export const saveAadhaarUpload = async (req, res) => {
//   try {
//     const {
//       tourId,
//       packageType,
//       packageKind,
//       variantPackageIndex,
//       boardingPoint,
//       deboardingPoint,
//       addons,
//       addonsDetail,
//       remarks,
//       raisedBy,
//       traveller,
//       coTravellers,
//       advanceScreenshot, // legacy single-object shape
//       advanceScreenshots, // current shape
//     } = req.body;
 
//     const hasAdvanceScreenshot =
//       (Array.isArray(advanceScreenshots) && advanceScreenshots.some((s) => s?.url)) ||
//       !!advanceScreenshot?.url;
//     if (!hasAdvanceScreenshot) {
//       return res.status(400).json({
//         success: false,
//         message: "Attach the Advance Payment screenshot before creating this booking",
//       });
//     }
 
//     const groupId = new mongoose.Types.ObjectId().toString();
//     const parsed = {
//       firstName: traveller.firstName || "",
//       lastName: traveller.lastName || "",
//       age: traveller.age || null,
//       dob: traveller.dob || "",
//       gender: traveller.gender || "",
//       address: traveller.address || "",
//       addressLine1: traveller.addressLine1 || "",
//       addressLine2: traveller.addressLine2 || "",
//       city: traveller.city || "",
//       state: traveller.state || "",
//       pincode: traveller.pincode || "",
//       phone: traveller.phone || "",
//       aadhaarNumber: traveller.aadhaarNumber || "",
//       title: traveller.title || "",
//       sharingType: traveller.sharingType || "",
//     };
 
//     const docs = [
//       {
//         groupId,
//         type: "aadhaarFront",
//         isCoTraveller: false,
//         url: traveller.front?.url || "",
//         ocrText: traveller.front?.ocrText || "",
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
 
//     if (Array.isArray(coTravellers)) {
//       for (const ct of coTravellers) {
//         // Skip only a totally blank row.
//         if (!ct?.front?.url && !ct?.firstName?.trim()) continue;
//         docs.push({
//           groupId,
//           type: "aadhaarFront",
//           isCoTraveller: true,
//           url: ct.front?.url || "",
//           ocrText: ct.front?.ocrText || "",
//           parsed: {
//             firstName: ct.firstName || "",
//             lastName: ct.lastName || "",
//             age: ct.age || null,
//             dob: ct.dob || "",
//             gender: ct.gender || "",
//             address: ct.address || "",
//             addressLine1: ct.addressLine1 || "",
//             addressLine2: ct.addressLine2 || "",
//             city: ct.city || "",
//             state: ct.state || "",
//             pincode: ct.pincode || "",
//             phone: ct.phone || "",
//             aadhaarNumber: ct.aadhaarNumber || "",
//             title: ct.title || "",
//             sharingType: ct.sharingType || "",
//           },
//           uploadedBy: "admin",
//         });
//         if (ct.back?.url) {
//           docs.push({
//             groupId,
//             type: "aadhaarBack",
//             isCoTraveller: true,
//             url: ct.back.url,
//             ocrText: ct.back.ocrText || "",
//             parsed: { firstName: ct.firstName || "", lastName: ct.lastName || "" },
//             uploadedBy: "admin",
//           });
//         }
//       }
//     }
 
//     const advanceList = Array.isArray(advanceScreenshots)
//       ? advanceScreenshots
//       : advanceScreenshot?.url
//         ? [advanceScreenshot]
//         : [];
//     for (const shot of advanceList) {
//       if (!shot?.url) continue;
//       docs.push({
//         groupId,
//         type: "paymentAdvance",
//         url: shot.url,
//         amount: shot.amount ?? null,
//         remarks: shot.remarks || "",
//         uploadedBy: "admin",
//       });
//     }
 
//     docs.push({
//       groupId,
//       type: "bookingNotes",
//       tourId,
//       packageType: packageType || "",
//       packageKind: packageKind === "variant" ? "variant" : packageKind === "main" ? "main" : "",
//       variantPackageIndex:
//         packageKind === "variant" && variantPackageIndex !== undefined && variantPackageIndex !== null
//           ? Number(variantPackageIndex)
//           : null,
//       boardingPoint: boardingPoint || "",
//       deboardingPoint: deboardingPoint || "",
//       addons: addons || "",
//       addonsDetail: Array.isArray(addonsDetail) ? addonsDetail : [],
//       remarks: remarks || "",
//       uploadedBy: "admin",
//       raisedBy: { name: raisedBy?.name || "", employeeId: raisedBy?.employeeId || "" },
//     });
 
//     const created = await aadhaarModel.insertMany(docs);
 
//     return res.status(201).json({ success: true, groupId, docs: created });
//   } catch (error) {
//     console.error("saveAadhaarUpload error:", error);
//     return res.status(500).json({ success: false, message: "Could not save this booking.", error: error.message });
//   }
// };
 
// // Compare phones by last 10 digits so formatting differences don't block
// // the auto-match.
// const normalizePhone = (p) => String(p || "").replace(/\D/g, "").slice(-10);
 
// // Auto-links a walk-in group to the real booking Create Booking produced
// // for it: same tour, same contact mobile, booked at/after the group.
// async function autoMatchTnrForGroup(group) {
//   if (group.tnr || !group.tourId || !group.main?.phone) {
//     console.log(
//       `[autoMatchTnr] skip group ${group.groupId}: tourId=${!!group.tourId} phone=${group.main?.phone || "none"}`,
//     );
//     return null;
//   }
 
//   try {
//     const claimedTnrs = await aadhaarModel.distinct("tnr", { tnr: { $nin: [null, ""] } });
//     const wantPhone = normalizePhone(group.main.phone);
 
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
 
// // What a walk-in group's package SHOULD cost (same age-bracket +
// // sharingType formula as adminAddBooking, + addons). null when it can't be
// // priced reliably.
// function computePackageAmount(tourDoc, mainTraveller, coTravellers, bookingNotes) {
//   if (!tourDoc || !mainTraveller) return null;
 
//   let selectedPackage = tourDoc;
//   if (bookingNotes?.packageKind === "variant") {
//     if (bookingNotes.variantPackageIndex === null || bookingNotes.variantPackageIndex === undefined) {
//       return null;
//     }
//     selectedPackage = tourDoc.variantPackage?.[bookingNotes.variantPackageIndex];
//     if (!selectedPackage) return null;
//   } else if (bookingNotes?.packageKind !== "main") {
//     return null;
//   }
 
//   const travellers = [mainTraveller, ...(coTravellers || [])];
//   let total = 0;
//   for (const t of travellers) {
//     const age = Number(t.age);
//     if (isNaN(age) || age < 1) continue;
//     if (age >= 11) {
//       total += Number(selectedPackage.advanceAmount?.adult) || 0;
//       if (t.sharingType === "double") total += Number(selectedPackage.balanceDouble) || 0;
//       else if (t.sharingType === "triple") total += Number(selectedPackage.balanceTriple) || 0;
//     } else if (age >= 6 && age <= 10) {
//       total += Number(selectedPackage.advanceAmount?.child) || 0;
//       if (t.sharingType === "withBerth") total += Number(selectedPackage.balanceChildWithBerth) || 0;
//       else if (t.sharingType === "withoutBerth") total += Number(selectedPackage.balanceChildWithoutBerth) || 0;
//     }
//   }
 
//   const addonsTotal = (bookingNotes?.addonsDetail || []).reduce((s, a) => s + (Number(a.amount) || 0), 0);
//   total += addonsTotal;
 
//   return total;
// }
 
// // GET /ocr/bookings — All Bookings tab.
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
//           raisedBy: null,
//           main: null,
//           coTravellers: [],
//           payments: { advance: [], balance: [], partial: [] },
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
//           packageKind: d.packageKind || "",
//           variantPackageIndex:
//             d.variantPackageIndex === undefined ? null : d.variantPackageIndex,
//           boardingPoint: d.boardingPoint,
//           deboardingPoint: d.deboardingPoint,
//           addons: d.addons,
//           addonsDetail: d.addonsDetail || [],
//           remarks: d.remarks,
//         };
//         g.raisedBy = d.raisedBy?.name
//           ? { name: d.raisedBy.name, employeeId: d.raisedBy.employeeId || "" }
//           : null;
//       } else if (d.type === "aadhaarFront") {
//         const traveller = {
//           _id: d._id,
//           aadhaarDocId: d._id,
//           ...d.parsed,
//           url: d.url,
//           ocrText: d.ocrText,
//           // Only true for someone added via "Add Co-Traveller" after the
//           // group already had a tnr — gates "Raise Manage Booking".
//           postBooking: !!d.postBooking,
//         };
//         if (d.isCoTraveller) g.coTravellers.push(traveller);
//         else g.main = { ...traveller, front: { url: d.url }, back: g.main?.back || null };
//       } else if (d.type === "aadhaarBack") {
//         if (!d.isCoTraveller) {
//           g.main = g.main
//             ? { ...g.main, back: { url: d.url } }
//             : { _id: d._id, ...d.parsed, back: { url: d.url }, front: null };
//         } else {
//           // Optional co-traveller back side (uploaded for a different-state
//           // co-traveller) — attach to the co-traveller with the same name.
//           const nm = (t) => `${t?.firstName || ""} ${t?.lastName || ""}`.trim().toLowerCase();
//           const match = [...g.coTravellers].reverse().find((ct) => nm(ct) && nm(ct) === nm(d.parsed));
//           if (match && !match.back) match.back = { url: d.url };
//         }
//       } else if (d.type === "paymentAdvance") {
//         g.payments.advance.push({ _id: d._id, url: d.url, amount: d.amount, createdAt: d.createdAt, remarks: d.remarks || "" });
//       } else if (d.type === "paymentBalance") {
//         g.payments.balance.push({ _id: d._id, url: d.url, amount: d.amount, createdAt: d.createdAt, remarks: d.remarks || "" });
//       } else if (d.type === "paymentPartial") {
//         g.payments.partial.push({ _id: d._id, url: d.url, amount: d.amount, createdAt: d.createdAt, remarks: d.remarks || "" });
//       }
//     }
 
//     let bookings = Object.values(groups);
 
//     // Auto-link tnr for groups that don't have one yet.
//     for (const b of bookings) {
//       if (!b.tnr) {
//         const matched = await autoMatchTnrForGroup(b);
//         if (matched) b.tnr = matched;
//       }
//     }
 
//     // Fold orphaned groupId:null payment docs back into their group by tnr.
//     const tnrsForOrphanSweep = [...new Set(bookings.map((b) => b.tnr).filter(Boolean))];
//     if (tnrsForOrphanSweep.length) {
//       const orphanPaymentDocs = await aadhaarModel
//         .find({
//           tnr: { $in: tnrsForOrphanSweep },
//           groupId: null,
//           type: { $in: ["paymentAdvance", "paymentBalance", "paymentPartial"] },
//         })
//         .lean();
//       if (orphanPaymentDocs.length) {
//         const bookingByTnrForSweep = new Map(bookings.map((b) => [b.tnr, b]));
//         for (const d of orphanPaymentDocs) {
//           const b = bookingByTnrForSweep.get(d.tnr);
//           if (!b) continue;
//           const entry = { _id: d._id, url: d.url, amount: d.amount, createdAt: d.createdAt, remarks: d.remarks || "" };
//           if (d.type === "paymentAdvance") b.payments.advance.push(entry);
//           else if (d.type === "paymentBalance") b.payments.balance.push(entry);
//           else if (d.type === "paymentPartial") b.payments.partial.push(entry);
//         }
//       }
//     }
 
//     // ── Every other real booking (USER online / Create-Booking-page ADMIN) ──
//     const groupedTnrs = new Set(bookings.map((b) => b.tnr).filter(Boolean));
//     const ungroupedRealDocs = await tourBookingModel
//       .find(groupedTnrs.size ? { tnr: { $nin: [...groupedTnrs] } } : {})
//       .select("tnr tourId createdBy contact travellers payment bookingDate")
//       .populate("tourId", "title")
//       .lean();
 
//     const ungroupedRealTnrs = ungroupedRealDocs.map((d) => d.tnr).filter(Boolean);
//     const ungroupedProofDocs = ungroupedRealTnrs.length
//       ? await aadhaarModel.find({ tnr: { $in: ungroupedRealTnrs }, groupId: null }).lean()
//       : [];
//     const proofsByTnr = new Map();
//     for (const d of ungroupedProofDocs) {
//       if (!proofsByTnr.has(d.tnr)) proofsByTnr.set(d.tnr, []);
//       proofsByTnr.get(d.tnr).push(d);
//     }
 
//     // Letters only — "Senthil " + "Kumar" (stray space) still matches "Senthil Kumar".
//     const nameKey = (x) => [x?.firstName, x?.lastName].filter(Boolean).join("").toLowerCase().replace(/[^a-z]/g, "");
 
//     for (const rb of ungroupedRealDocs) {
//       if (!rb.tnr) continue;
//       const proofs = proofsByTnr.get(rb.tnr) || [];
//       const aadhaarByTraveller = new Map();
//       const payments = { advance: [], balance: [], partial: [] };
//       // Co-travellers added via Aadhaar on this card whose Raise Manage
//       // Booking is NOT yet approved — they are not in rb.travellers yet.
//       const pendingCtDocs = [];
//       for (const d of proofs) {
//         if (d.type === "aadhaarFront" && d.postBooking && !d.travellerId) {
//           pendingCtDocs.push(d);
//           continue;
//         }
//         if (d.type === "aadhaarFront" || d.type === "aadhaarBack") {
//           const key = String(d.travellerId);
//           if (!aadhaarByTraveller.has(key)) aadhaarByTraveller.set(key, { front: null, back: null, frontDocId: null });
//           const entry = aadhaarByTraveller.get(key);
//           if (d.type === "aadhaarFront") {
//             entry.front = { url: d.url, ocrText: d.ocrText };
//             entry.frontDocId = d._id;
//           } else {
//             entry.back = { url: d.url };
//           }
//         } else if (d.type === "paymentAdvance") {
//           payments.advance.push({ _id: d._id, url: d.url, amount: d.amount, createdAt: d.createdAt, remarks: d.remarks || "" });
//         } else if (d.type === "paymentBalance") {
//           payments.balance.push({ _id: d._id, url: d.url, amount: d.amount, createdAt: d.createdAt, remarks: d.remarks || "" });
//         } else if (d.type === "paymentPartial") {
//           payments.partial.push({ _id: d._id, url: d.url, amount: d.amount, createdAt: d.createdAt, remarks: d.remarks || "" });
//         }
//       }
 
//       // travellers[0] is the main traveller, everyone after is a co-traveller.
//       const mainT = (rb.travellers || [])[0] || null;
//       const coTs = (rb.travellers || []).slice(1);
//       const proofFor = (t) => aadhaarByTraveller.get(String(t._id)) || { front: null, back: null };
 
//       // Any (non-pending) aadhaarFront doc under this tnr as the group-delete key.
//       const anyFrontDocId =
//         proofs.find((d) => d.type === "aadhaarFront" && !(d.postBooking && !d.travellerId))?._id || null;
 
//       const main = mainT
//         ? {
//           _id: mainT._id,
//           aadhaarDocId: anyFrontDocId,
//           title: mainT.title,
//           firstName: mainT.firstName,
//           lastName: mainT.lastName,
//           age: mainT.age,
//           gender: mainT.gender,
//           sharingType: mainT.sharingType,
//           phone: rb.contact?.mobile,
//           aadhaarNumber: mainT.aadhaarNumber,
//           front: proofFor(mainT).front,
//           back: proofFor(mainT).back,
//         }
//         : null;
 
//       const coTravellers = coTs.map((t) => {
//         const proof = proofFor(t);
//         return {
//           _id: t._id,
//           aadhaarDocId: proof.frontDocId || null,
//           title: t.title,
//           firstName: t.firstName,
//           lastName: t.lastName,
//           age: t.age,
//           gender: t.gender,
//           sharingType: t.sharingType,
//           aadhaarNumber: t.aadhaarNumber,
//           url: proof.front?.url || null,
//           ocrText: proof.front?.ocrText || "",
//           back: proof.back,
//           postBooking: !!t.addedPostBooking,
//         };
//       });
 
//       // Pending co-travellers → shown with the Raise Manage Booking button.
//       // Once approved, Manage Booking puts them in rb.travellers — then the
//       // same-name real entry is shown instead ("Added to booking" via
//       // markCancelled) and this pending doc only lends it its Aadhaar.
//       for (const d of pendingCtDocs) {
//         const p = d.parsed || {};
//         const approved = coTravellers.find((c) => nameKey(c) === nameKey(p));
//         if (approved) {
//           approved.postBooking = true;
//           if (!approved.url && d.url) {
//             approved.url = d.url;
//             approved.ocrText = d.ocrText || "";
//           }
//           if (!approved.aadhaarDocId) approved.aadhaarDocId = d._id;
//           continue;
//         }
//         coTravellers.push({
//           _id: d._id,
//           aadhaarDocId: d._id,
//           title: p.title,
//           firstName: p.firstName,
//           lastName: p.lastName,
//           age: p.age,
//           gender: p.gender,
//           sharingType: p.sharingType,
//           aadhaarNumber: p.aadhaarNumber,
//           url: d.url || null,
//           ocrText: d.ocrText || "",
//           back: null,
//           postBooking: true,
//         });
//       }
 
//       // Real bookings already know their exact price.
//       const directPackageAmount =
//         (Number(rb.payment?.advance?.amount) || 0) + (Number(rb.payment?.balance?.amount) || 0);
 
//       bookings.push({
//         groupId: `real-${rb._id}`,
//         tnr: rb.tnr,
//         tourId: rb.tourId?._id || rb.tourId || null,
//         tourTitle: rb.tourId?.title || "",
//         bookingNotes: null,
//         raisedBy: null,
//         main,
//         coTravellers,
//         payments,
//         createdAt: rb.bookingDate,
//         _directPackageAmount: directPackageAmount,
//       });
//     }
 
//     bookings = bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
 
//     // Guest-group info ("same guest, different TNR").
//     const tnrs = bookings.map((b) => b.tnr).filter(Boolean);
//     const guestGroups = tnrs.length
//       ? await aadhaarModel.find({ type: "guestLink", guestTnrs: { $in: tnrs } }).lean()
//       : [];
//     for (const b of bookings) {
//       if (!b.tnr) continue;
//       const group = guestGroups.find((g) => (g.guestTnrs || []).includes(b.tnr));
//       b.guestGroup = group
//         ? {
//           _id: group._id,
//           label: group.remarks || "",
//           otherTnrs: group.guestTnrs.filter((t) => t !== b.tnr),
//         }
//         : null;
//     }
 
//     // Payment summary — package amount vs every uploaded screenshot.
//     const tourIds = [...new Set(bookings.map((b) => b.tourId).filter(Boolean).map(String))];
//     const tourDocs = tourIds.length
//       ? await tourModel
//         .find({ _id: { $in: tourIds } })
//         .select("price advanceAmount balanceDouble balanceTriple balanceChildWithBerth balanceChildWithoutBerth variantPackage")
//         .lean()
//       : [];
//     const tourById = new Map(tourDocs.map((t) => [String(t._id), t]));
 
//     // Once a walk-in group has a TNR, its real tourBookingModel booking is
//     // the source of truth for the price (advance + balance, which already
//     // include add-ons/changes made at Create Booking or Manage Booking) —
//     // the bookingNotes estimate is only used before a TNR exists.
//     const pricedTnrs = bookings.map((b) => b.tnr).filter(Boolean);
//     const pricedDocs = pricedTnrs.length
//       ? await tourBookingModel.find({ tnr: { $in: pricedTnrs } }).select("tnr payment").lean()
//       : [];
//     const realPriceByTnr = new Map(
//       pricedDocs.map((d) => [
//         d.tnr,
//         (Number(d.payment?.advance?.amount) || 0) + (Number(d.payment?.balance?.amount) || 0),
//       ]),
//     );
//     // What the real booking itself records as received (advance/balance
//     // marked paid — e.g. after a cancellation is approved and balance is
//     // settled to ₹0). Screenshots can lag behind this, so the larger of the
//     // two is treated as paid.
//     const realPaidByTnr = new Map(
//       pricedDocs.map((d) => [
//         d.tnr,
//         (d.payment?.advance?.paid ? Number(d.payment?.advance?.amount) || 0 : 0) +
//         (d.payment?.balance?.paid ? Number(d.payment?.balance?.amount) || 0 : 0),
//       ]),
//     );
 
//     for (const b of bookings) {
//       let packageAmount;
//       const realPrice = b.tnr ? realPriceByTnr.get(b.tnr) : undefined;
//       if (typeof b._directPackageAmount === "number") {
//         packageAmount = b._directPackageAmount;
//         delete b._directPackageAmount;
//       } else if (realPrice > 0) {
//         packageAmount = realPrice;
//       } else {
//         const tourDoc = b.tourId ? tourById.get(String(b.tourId)) : null;
//         packageAmount = computePackageAmount(tourDoc, b.main, b.coTravellers, b.bookingNotes);
//       }
 
//       if (packageAmount === null) {
//         b.paymentSummary = null;
//         continue;
//       }
 
//       const screenshotsPaid =
//         (b.payments.advance || []).reduce((s, p) => s + (Number(p.amount) || 0), 0) +
//         b.payments.balance.reduce((s, p) => s + (Number(p.amount) || 0), 0) +
//         b.payments.partial.reduce((s, p) => s + (Number(p.amount) || 0), 0);
//       const bookingPaid = b.tnr ? realPaidByTnr.get(b.tnr) || 0 : 0;
//       const amountPaid = Math.max(screenshotsPaid, bookingPaid);
 
//       const balanceRemaining = Math.max(0, packageAmount - amountPaid);
//       b.paymentSummary = {
//         packageAmount,
//         amountPaid,
//         balanceRemaining,
//         fullyPaid: amountPaid >= packageAmount,
//       };
//     }
 
//     // Admin/User badge + cancellation status + "Added to booking" flag,
//     // all read from the REAL tourBookingModel booking.
//     const linkedTnrs = bookings.map((b) => b.tnr).filter(Boolean);
//     const realBookingDocs = linkedTnrs.length
//       ? await tourBookingModel.find({ tnr: { $in: linkedTnrs } }).select("tnr createdBy cancelled travellers").lean()
//       : [];
//     const realBookingByTnr = new Map(realBookingDocs.map((d) => [d.tnr, d]));
 
//     // Letters only — extra/trailing spaces or dots in a saved name ("Senthil "
//     // + "Kumar") must not stop the match with Tour Bookings ("Senthil Kumar").
//     const normName = (t) => [t?.firstName, t?.lastName].filter(Boolean).join("").toLowerCase().replace(/[^a-z]/g, "");
 
//     const cancellationDocs = linkedTnrs.length
//       ? await cancellationModel
//         .find({ tnr: { $in: linkedTnrs } })
//         .select("tnr travellerIds raisedBy approvedBy rejectedAt createdAt")
//         .sort({ createdAt: 1 })
//         .lean()
//       : [];
//     // Last one wins (oldest → newest).
//     const cancelDocByTnrTraveller = new Map();
//     for (const doc of cancellationDocs) {
//       for (const tid of doc.travellerIds || []) {
//         cancelDocByTnrTraveller.set(`${doc.tnr}::${tid}`, doc);
//       }
//     }
 
//     for (const b of bookings) {
//       const real = b.tnr ? realBookingByTnr.get(b.tnr) : null;
//       b.createdBy = real?.createdBy || "admin";
 
//       if (!real) continue;
//       const wholeCancelled = !!(real.cancelled?.byAdmin || real.cancelled?.byTraveller);
//       const realTravellerByName = new Map((real.travellers || []).map((t) => [normName(t), t]));
 
//       const markCancelled = (t) => {
//         if (!t) return t;
//         const realT = realTravellerByName.get(normName(t));
//         const cancelDoc = realT ? cancelDocByTnrTraveller.get(`${b.tnr}::${realT._id}`) : null;
 
//         let status = null;
//         if (cancelDoc) {
//           status = cancelDoc.approvedBy ? "cancelled" : cancelDoc.raisedBy ? "request" : "rejected";
//         } else if (
//           wholeCancelled ||
//           realT?.cancelled?.viaTripCancel ||
//           realT?.cancelled?.byAdmin
//         ) {
//           // Whole-trip cancel / older cancellation / direct admin-cancel —
//           // treat as an approved cancellation.
//           status = "cancelled";
//         } else if (realT?.cancelled?.byTraveller) {
//           // byTraveller alone = pending cancellation request.
//           status = "request";
//         }
 
//         // Already in the REAL booking (Tour Bookings)? → Raise Manage
//         // Booking was approved → frontend hides Edit/Remove/Raise and shows
//         // "Added to booking". Not there yet (or rejected) → button visible.
//         t.inRealBooking = !!realT;
 
//         t.cancelStatus = status; // null | "request" | "rejected" | "cancelled"
//         // Aadhaar ZIP filter only cares about approved cancellations.
//         t.cancelled = status === "cancelled";
//         return t;
//       };
//       if (b.main) markCancelled(b.main);
//       b.coTravellers = (b.coTravellers || []).map(markCancelled);
//     }
 
//     return res.status(200).json({ success: true, bookings });
//   } catch (error) {
//     console.error("getAadhaarBookings error:", error);
//     return res.status(500).json({ success: false, message: "Could not fetch bookings.", error: error.message });
//   }
// };
 
// // POST /api/tour/guest/link — body: { tnr, linkToTnr, label? }. Overlapping
// // guest groups always merge into ONE.
// export const linkGuestTnr = async (req, res) => {
//   try {
//     const tnr = (req.body.tnr || "").trim().toUpperCase();
//     const linkToTnr = (req.body.linkToTnr || "").trim().toUpperCase();
//     if (!tnr || !linkToTnr) {
//       return res.status(400).json({ success: false, message: "Both tnr and linkToTnr are required" });
//     }
//     if (tnr === linkToTnr) {
//       return res.status(400).json({ success: false, message: "Cannot link a booking to itself" });
//     }
//     if (!(await tourBookingModel.exists({ tnr }))) {
//       return res.status(404).json({ success: false, message: `No booking found with TNR ${tnr}` });
//     }
//     if (!(await tourBookingModel.exists({ tnr: linkToTnr }))) {
//       return res.status(404).json({ success: false, message: `No booking found with TNR ${linkToTnr}` });
//     }
 
//     const existingGroups = await aadhaarModel.find({
//       type: "guestLink",
//       guestTnrs: { $in: [tnr, linkToTnr] },
//     });
 
//     const mergedTnrs = new Set([tnr, linkToTnr]);
//     existingGroups.forEach((g) => (g.guestTnrs || []).forEach((t) => mergedTnrs.add(t)));
 
//     let label = (req.body.label || "").trim();
//     if (!label) {
//       label = existingGroups.find((g) => g.remarks)?.remarks || "";
//     }
 
//     if (existingGroups.length) {
//       await aadhaarModel.deleteMany({ _id: { $in: existingGroups.map((g) => g._id) } });
//     }
 
//     const saved = await aadhaarModel.create({
//       type: "guestLink",
//       tnr,
//       guestTnrs: Array.from(mergedTnrs),
//       remarks: label,
//     });
 
//     return res.status(200).json({ success: true, guestGroup: saved });
//   } catch (error) {
//     console.error("linkGuestTnr error:", error);
//     return res.status(500).json({ success: false, message: "Could not link guest.", error: error.message });
//   }
// };
 
// // POST /api/tour/guest/unlink — body: { tnr }.
// export const unlinkGuestTnr = async (req, res) => {
//   try {
//     const tnr = (req.body.tnr || "").trim().toUpperCase();
//     if (!tnr) return res.status(400).json({ success: false, message: "tnr is required" });
 
//     const group = await aadhaarModel.findOne({ type: "guestLink", guestTnrs: tnr });
//     if (!group) {
//       return res.status(404).json({ success: false, message: "This booking isn't linked to any guest group." });
//     }
 
//     const remaining = group.guestTnrs.filter((t) => t !== tnr);
//     if (remaining.length < 2) {
//       await aadhaarModel.deleteOne({ _id: group._id });
//     } else {
//       group.guestTnrs = remaining;
//       if (group.tnr === tnr) group.tnr = remaining[0];
//       await group.save();
//     }
 
//     return res.status(200).json({ success: true });
//   } catch (error) {
//     console.error("unlinkGuestTnr error:", error);
//     return res.status(500).json({ success: false, message: "Could not unlink guest.", error: error.message });
//   }
// };
 
// // POST /ocr/add-co-traveller — adds ONE more traveller (Aadhaar front only).
// // NEVER writes to tourBookingModel: the traveller reaches Tour Bookings only
// // via Raise Manage Booking → approval.
// export const addCoTraveller = async (req, res) => {
//   try {
//     const {
//       groupId, tnr, title, firstName, lastName, age, dob, gender, sharingType, phone,
//       address, addressLine1, addressLine2, city, state, pincode, front, back, aadhaarNumber,
//     } = req.body;
 
//     if (!groupId && !tnr) {
//       return res.status(400).json({ success: false, message: "groupId or tnr is required" });
//     }
 
//     const parsedFields = {
//       firstName: firstName || "",
//       lastName: lastName || "",
//       age: age || null,
//       dob: dob || "",
//       gender: gender || "",
//       address: address || "",
//       addressLine1: addressLine1 || "",
//       addressLine2: addressLine2 || "",
//       city: city || "",
//       state: state || "",
//       pincode: pincode || "",
//       phone: phone || "",
//       aadhaarNumber: aadhaarNumber || "",
//       title: title || "",
//       sharingType: sharingType || "",
//     };
 
//     // ── Real booking (tnr path — USER online / Create-Booking-page ADMIN) ──
//     // Saved ONLY as a pending aadhaarModel doc (tnr set, no travellerId,
//     // postBooking: true). getAadhaarBookings shows it on the card with the
//     // Raise Manage Booking button until Manage Booking approval puts the
//     // traveller into the real booking.
//     if (!groupId && tnr) {
//       const booking = await tourBookingModel.findOne({ tnr: tnr.trim().toUpperCase() }).select("tnr");
//       if (!booking) {
//         return res.status(404).json({ success: false, message: "Booking not found for this tnr." });
//       }
 
//       const frontDoc = await aadhaarModel.create({
//         tnr: booking.tnr,
//         type: "aadhaarFront",
//         isCoTraveller: true,
//         postBooking: true,
//         url: front?.url || "",
//         ocrText: front?.ocrText || "",
//         parsed: parsedFields,
//         uploadedBy: "admin",
//       });
 
//       return res.status(201).json({ success: true, traveller: frontDoc });
//     }
 
//     // ── Walk-in group (groupId path) ──
//     const existing = await aadhaarModel.findOne({ groupId }).select("tnr");
 
//     const doc = await aadhaarModel.create({
//       groupId,
//       tnr: existing?.tnr || "",
//       // Added AFTER the booking got a tnr → gets "Raise Manage Booking".
//       postBooking: !!existing?.tnr,
//       type: "aadhaarFront",
//       isCoTraveller: true,
//       url: front?.url || "",
//       ocrText: front?.ocrText || "",
//       parsed: parsedFields,
//       uploadedBy: "admin",
//     });
//     // Optional back side (different-state co-traveller) — shown on the card
//     // and included in the Aadhaar ZIP.
//     if (back?.url) {
//       await aadhaarModel.create({
//         groupId,
//         tnr: existing?.tnr || "",
//         postBooking: !!existing?.tnr,
//         type: "aadhaarBack",
//         isCoTraveller: true,
//         url: back.url,
//         ocrText: back.ocrText || "",
//         parsed: { firstName: parsedFields.firstName, lastName: parsedFields.lastName },
//         uploadedBy: "admin",
//       });
//     }
 
//     return res.status(201).json({ success: true, traveller: doc });
//   } catch (error) {
//     console.error("addCoTraveller error:", error);
//     return res.status(500).json({ success: false, message: "Could not add co-traveller.", error: error.message });
//   }
// };
 
// // POST /api/tour/edit-traveller — body: { docId, ...fields }. Blocked once
// // the booking has a tnr, EXCEPT for a post-booking added traveller.
// export const editAadhaarTraveller = async (req, res) => {
//   try {
//     const { docId } = req.body;
//     if (!docId) return res.status(400).json({ success: false, message: "docId is required" });
//     const doc = await aadhaarModel.findOne({ _id: docId, type: "aadhaarFront" });
//     if (!doc) {
//       return res.status(404).json({ success: false, message: "Traveller not found." });
//     }
//     let isPostBookingAdd = !!doc.postBooking;
//     if (doc.tnr && doc.travellerId && !isPostBookingAdd) {
//       const parentBooking = await tourBookingModel.findOne(
//         { tnr: doc.tnr, "travellers._id": doc.travellerId },
//         { "travellers.$": 1 },
//       );
//       isPostBookingAdd = !!parentBooking?.travellers?.[0]?.addedPostBooking;
//     }
//     if (doc.tnr && !isPostBookingAdd) {
//       return res.status(400).json({
//         success: false,
//         message: "This booking already has a TNR — edit it through Raise Manage Booking instead.",
//       });
//     }
 
//     const editable = [
//       "title", "firstName", "lastName", "age", "gender", "sharingType", "phone",
//       "address", "addressLine1", "addressLine2", "city", "state", "pincode",
//       "aadhaarNumber",
//     ];
//     const parsed = { ...(doc.parsed || {}) };
//     editable.forEach((f) => {
//       if (req.body[f] !== undefined) parsed[f] = req.body[f];
//     });
//     doc.parsed = parsed;
//     await doc.save();
 
//     // Older post-booking travellers that were pushed straight into the real
//     // booking — mirror the edit onto that subdocument too.
//     if (doc.travellerId) {
//       const travellerFields = ["title", "firstName", "lastName", "age", "gender", "sharingType", "aadhaarNumber"];
//       const $set = {};
//       travellerFields.forEach((f) => {
//         if (req.body[f] !== undefined) $set[`travellers.$.${f}`] = req.body[f];
//       });
//       if (Object.keys($set).length) {
//         await tourBookingModel.updateOne({ tnr: doc.tnr, "travellers._id": doc.travellerId }, { $set });
//       }
//     }
 
//     return res.status(200).json({ success: true, traveller: { _id: doc._id, ...parsed } });
//   } catch (error) {
//     console.error("editAadhaarTraveller error:", error);
//     return res.status(500).json({ success: false, message: "Could not update traveller.", error: error.message });
//   }
// };
 
// // Cloudinary public_id from a secure_url (best-effort).
// function extractCloudinaryPublicId(url = "") {
//   const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
//   return match ? match[1] : null;
// }
 
// async function destroyCloudinaryFile(url) {
//   const publicId = extractCloudinaryPublicId(url);
//   if (!publicId) return;
//   try {
//     await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
//   } catch (err) {
//     console.error(`destroyCloudinaryFile: could not destroy ${publicId}:`, err.message);
//   }
// }
 
// // POST /api/tour/delete-traveller — body: { docId }.
// //   Co-traveller → removes that one traveller's doc(s) + files.
// //   Main traveller → clears files for every traveller in the booking
// //   (extracted data kept).
// export const deleteAadhaarTraveller = async (req, res) => {
//   try {
//     const { docId } = req.body;
//     if (!docId) return res.status(400).json({ success: false, message: "docId is required" });
//     const doc = await aadhaarModel.findOne({ _id: docId, type: "aadhaarFront" });
//     if (!doc) {
//       return res.status(404).json({ success: false, message: "Traveller not found." });
//     }
 
//     // Older post-booking co-traveller that was pushed straight into the real
//     // booking — pull them back out of travellers[] too.
//     if (doc.travellerId && doc.tnr) {
//       const parentBooking = await tourBookingModel.findOne(
//         { tnr: doc.tnr, "travellers._id": doc.travellerId },
//         { "travellers.$": 1 },
//       );
//       const travellerRecord = parentBooking?.travellers?.[0];
//       const isPostBookingAdd = !!(doc.postBooking || travellerRecord?.addedPostBooking);
 
//       if (isPostBookingAdd) {
//         const pullResult = await tourBookingModel.updateOne(
//           { tnr: doc.tnr },
//           { $pull: { travellers: { _id: doc.travellerId } } },
//         );
//         const relatedDocs = await aadhaarModel.find({
//           tnr: doc.tnr,
//           travellerId: doc.travellerId,
//           type: { $in: ["aadhaarFront", "aadhaarBack"] },
//         });
//         for (const d of relatedDocs) {
//           if (d.url) await destroyCloudinaryFile(d.url);
//         }
//         await aadhaarModel.deleteMany({ _id: { $in: relatedDocs.map((d) => d._id) } });
//         return res.status(200).json({
//           success: true,
//           clearedCount: relatedDocs.length,
//           removedTraveller: pullResult.modifiedCount > 0,
//         });
//       }
//     }
 
//     if (doc.isCoTraveller) {
//       // No travellerId (walk-in co-traveller / pending co-traveller) →
//       // scope to this exact doc, never the whole group.
//       const scopeMatch = doc.travellerId
//         ? (doc.groupId
//           ? { groupId: doc.groupId, travellerId: doc.travellerId }
//           : { tnr: doc.tnr, travellerId: doc.travellerId })
//         : { _id: doc._id };
//       const docs = await aadhaarModel.find({ ...scopeMatch, type: { $in: ["aadhaarFront", "aadhaarBack"] } });
 
//       for (const d of docs) {
//         if (d.url) await destroyCloudinaryFile(d.url);
//         if (d.front?.url) await destroyCloudinaryFile(d.front.url);
//         if (d.back?.url) await destroyCloudinaryFile(d.back.url);
//       }
//       await aadhaarModel.deleteMany({ _id: { $in: docs.map((d) => d._id) } });
 
//       return res.status(200).json({ success: true, clearedCount: docs.length, removedTraveller: docs.length > 0 });
//     }
 
//     // MAIN traveller — clear (not delete) every traveller's files.
//     const groupMatch = doc.tnr
//       ? (doc.groupId ? { groupId: doc.groupId } : { tnr: doc.tnr })
//       : { groupId: doc.groupId };
//     const docs = await aadhaarModel.find({ ...groupMatch, type: { $in: ["aadhaarFront", "aadhaarBack"] } });
 
//     for (const d of docs) {
//       if (d.url) await destroyCloudinaryFile(d.url);
//       if (d.front?.url) await destroyCloudinaryFile(d.front.url);
//       if (d.back?.url) await destroyCloudinaryFile(d.back.url);
//     }
 
//     const ids = docs.map((d) => d._id);
//     await aadhaarModel.updateMany({ _id: { $in: ids } }, { $set: { url: null, front: null, back: null } });
 
//     return res.status(200).json({ success: true, clearedCount: ids.length, deletedGroup: true });
//   } catch (error) {
//     console.error("deleteAadhaarTraveller error:", error);
//     return res.status(500).json({ success: false, message: "Could not delete Aadhaar files.", error: error.message });
//   }
// };
 
// // GET /api/tour/download-all-aadhaar?docId=<docId> — ZIP of the raw files.
// export const downloadAllAadhaarZip = async (req, res) => {
//   try {
//     const docId = req.query.docId || req.body.docId;
//     if (!docId) return res.status(400).json({ success: false, message: "docId is required" });
//     const doc = await aadhaarModel.findOne({ _id: docId, type: "aadhaarFront" });
//     if (!doc) return res.status(404).json({ success: false, message: "Traveller not found." });
 
//     let docs;
//     if (doc.isCoTraveller) {
//       docs = [doc];
//     } else {
//       const groupMatch = doc.tnr
//         ? (doc.groupId ? { groupId: doc.groupId } : { tnr: doc.tnr })
//         : { groupId: doc.groupId };
//       docs = await aadhaarModel.find({ ...groupMatch, type: "aadhaarFront" });
//     }
 
//     const filesToZip = [];
//     docs.forEach((d, idx) => {
//       const parsed = d.parsed || {};
//       const label = [parsed.firstName, parsed.lastName].filter(Boolean).join("_") || `Traveller${idx + 1}`;
//       const safeLabel = label.replace(/[^A-Za-z0-9_-]/g, "") || `Traveller${idx + 1}`;
//       const extFromUrl = (url) => {
//         const match = url.split("?")[0].match(/\.([A-Za-z0-9]+)$/);
//         return match ? match[1] : "jpg";
//       };
//       if (d.front?.url) {
//         filesToZip.push({ url: d.front.url, filename: `${idx + 1}-${safeLabel}-Front.${extFromUrl(d.front.url)}` });
//       }
//       if (d.back?.url) {
//         filesToZip.push({ url: d.back.url, filename: `${idx + 1}-${safeLabel}-Back.${extFromUrl(d.back.url)}` });
//       }
//     });
 
//     if (filesToZip.length === 0) {
//       return res.status(404).json({ success: false, message: "No Aadhaar files uploaded for this booking yet." });
//     }
 
//     const zipName = doc.tnr ? `Aadhaar-${doc.tnr}.zip` : `Aadhaar-Draft-${doc.groupId}.zip`;
//     res.setHeader("Content-Type", "application/zip");
//     res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);
 
//     const archive = archiver("zip", { zlib: { level: 9 } });
//     archive.on("error", (err) => {
//       console.error("downloadAllAadhaarZip archive error:", err);
//       if (!res.headersSent) res.status(500).end();
//     });
//     archive.pipe(res);
 
//     for (const f of filesToZip) {
//       try {
//         const response = await fetch(f.url);
//         if (!response.ok) {
//           console.error(`downloadAllAadhaarZip: could not fetch ${f.url} (status ${response.status})`);
//           continue;
//         }
//         const buffer = Buffer.from(await response.arrayBuffer());
//         archive.append(buffer, { name: f.filename });
//       } catch (err) {
//         console.error(`downloadAllAadhaarZip: failed to fetch ${f.url}:`, err.message);
//       }
//     }
 
//     await archive.finalize();
//   } catch (error) {
//     console.error("downloadAllAadhaarZip error:", error);
//     if (!res.headersSent) {
//       res.status(500).json({ success: false, message: "Could not build the Aadhaar ZIP.", error: error.message });
//     }
//   }
// };
 
// // Payment amount from a UPI/bank screenshot: spaced "hero" digit line first
// // (immune to the ₹-glyph misread), then ₹/Rs/INR marker, then bare
// // comma-grouped numbers.
// function extractPaymentAmount(text = "") {
//   const heroLineMatch = text.match(
//     /(?:^|\n)[ \t]*((?:[\d,.?:;]\s+){2,}[\d,.?:;])[ \t]*(?:\n|$)/,
//   );
//   if (heroLineMatch) {
//     const digits = heroLineMatch[1].replace(/\s+/g, "").replace(/\D/g, "");
//     const heroAmount = digits ? Number(digits) : NaN;
//     if (!Number.isNaN(heroAmount) && heroAmount > 0) {
//       console.log(
//         `[extractPaymentAmount] hero spaced-digit line "${heroLineMatch[1]}" → ${heroAmount}`,
//       );
//       return heroAmount;
//     }
//   }
 
//   const markedMatches = [
//     ...text.matchAll(/(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/gi),
//   ].map((m) => Number(m[1].replace(/,/g, "")));
//   if (markedMatches.length > 0) {
//     const result = Math.max(...markedMatches.filter((n) => !Number.isNaN(n)));
//     console.log(
//       `[extractPaymentAmount] ₹/Rs/INR-marked match(es): [${markedMatches.join(", ")}] → using ${result}`,
//     );
//     return result;
//   }
 
//   // const bareNumbers = [...text.matchAll(/\b\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?\b/g)]
//   //   .map((m) => Number(m[0].replace(/,/g, "")))
//   //   .filter((n) => !Number.isNaN(n) && n > 0);
//   // GPay/PhonePe print amounts in Indian grouping ("10,000", "1,10,000").
//   // Tesseract often reads the "₹" glyph as a leading "3" (or "2"/"7"), so
//   // "₹10,000" comes out as "310,000" — which is NOT valid Indian grouping.
//   // When dropping that one leading digit makes it valid, drop it.
//   const isIndianGrouped = (s) => /^\d{1,2}(?:,\d{2})*,\d{3}$/.test(s);
//   const fixRupeeGlyph = (raw) => {
//     const [intPart, dec = ""] = raw.split(".");
//     if (isIndianGrouped(intPart)) return raw;
//     if (/^[237]/.test(intPart) && isIndianGrouped(intPart.slice(1))) {
//       return intPart.slice(1) + (dec ? `.${dec}` : "");
//     }
//     return raw;
//   };
//   const bareNumbers = [...text.matchAll(/\b\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?\b/g)]
//     .map((m) => Number(fixRupeeGlyph(m[0]).replace(/,/g, "")))
//     .filter((n) => !Number.isNaN(n) && n > 0);
//   const result = bareNumbers.length > 0 ? Math.max(...bareNumbers) : null;
//   console.log(
//     `[extractPaymentAmount] no hero line, no ₹/Rs/INR marker; bare comma-grouped candidate(s): [${bareNumbers.join(", ")}] → using ${result}. Raw OCR text: ${JSON.stringify(text)}`,
//   );
//   return result;
// }
 
// // POST /ocr/upload-group-payment — saves a payment screenshot straight into
// // aadhaarModel against the group (or tnr for a real booking).
// export const uploadGroupPayment = withTempCleanup(async (req, res) => {
//   try {
//     const file = req.file;
//     const { groupId, tnr, type, amount, remarks } = req.body;
 
//     if (!file) return res.status(400).json({ success: false, message: "Screenshot image is required" });
//     if (!groupId && !tnr) return res.status(400).json({ success: false, message: "groupId or tnr is required" });
//     if (!["advance", "balance", "partial"].includes(type)) {
//       return res.status(400).json({ success: false, message: "type must be advance, balance or partial" });
//     }
//     if (amount !== undefined && amount !== "" && (isNaN(Number(amount)) || Number(amount) <= 0)) {
//       return res.status(400).json({ success: false, message: "Amount, if entered, must be a positive number." });
//     }
 
//     const upload = await cloudinary.uploader.upload(file.path, { folder: "payment-screenshots", resource_type: "image" });
//     let resolvedGroupId = null;
//     let resolvedTnr = tnr ? tnr.trim().toUpperCase() : "";
//     if (groupId) {
//       const existing = await aadhaarModel.findOne({ groupId }).select("tnr");
//       if (existing) {
//         resolvedGroupId = groupId;
//         resolvedTnr = existing.tnr || resolvedTnr;
//       } else if (resolvedTnr) {
//         // Recover the real groupId by tnr instead of orphaning the doc.
//         const byTnr = await aadhaarModel.findOne({ tnr: resolvedTnr, groupId: { $ne: null } }).select("groupId");
//         if (byTnr?.groupId) resolvedGroupId = byTnr.groupId;
//       }
//     }
 
//     // let ocrAmount = null;
//     // try {
//     //   const text = await readImageText(file.path);
//     //   ocrAmount = extractPaymentAmount(text);
//     // } catch (err) {
//     //   console.error("Payment screenshot OCR failed, falling back to typed amount:", err.message);
//     // }
//     // const finalAmount = ocrAmount ?? (amount ? Number(amount) : null);
//     // const docType = type === "advance" ? "paymentAdvance" : type === "balance" ? "paymentBalance" : "paymentPartial";
//     const typedAmount = amount !== undefined && amount !== "" ? Number(amount) : null;
//     let ocrAmount = null;
//     if (typedAmount === null) {
//       try {
//         const text = await readImageText(file.path);
//         ocrAmount = extractPaymentAmount(text);
//       } catch (err) {
//         console.error("Payment screenshot OCR failed:", err.message);
//       }
//     }
//     const finalAmount = typedAmount ?? ocrAmount;
//     const docType = type === "advance" ? "paymentAdvance" : type === "balance" ? "paymentBalance" : "paymentPartial";
 
 
//     // No duplicate guard here: two different screenshots can share the same
//     // amount (e.g. two ₹10,000 instalments) and both must be saved.
 
//     const doc = await aadhaarModel.create({
//       groupId: resolvedGroupId,
//       tnr: resolvedTnr,
//       type: docType,
//       url: upload.secure_url,
//       amount: finalAmount,
//       remarks: remarks?.trim() || "",
//       uploadedBy: "admin",
//     });
 
//     return res.status(201).json({
//       success: true,
//       payment: doc,
//       // amountSource: ocrAmount !== null ? "ocr" : amount ? "manual" : "none",
//       amountSource: typedAmount !== null ? "manual" : ocrAmount !== null ? "ocr" : "none",
//     });
//   } catch (error) {
//     console.error("uploadGroupPayment error:", error);
//     return res.status(500).json({ success: false, message: "Upload failed.", error: error.message });
//   }
// });
 
// // POST /delete-group-payment — body: { docId }. Never touches
// // tourBookingModel.payment or invoices.
// export const deleteGroupPayment = async (req, res) => {
//   try {
//     const { docId } = req.body;
//     if (!docId) return res.status(400).json({ success: false, message: "docId is required" });
 
//     const doc = await aadhaarModel.findOne({
//       _id: docId,
//       type: { $in: ["paymentAdvance", "paymentBalance", "paymentPartial"] },
//     });
//     if (!doc) {
//       return res.status(404).json({ success: false, message: "Payment screenshot not found." });
//     }
 
//     await aadhaarModel.deleteOne({ _id: doc._id });
 
//     return res.status(200).json({ success: true });
//   } catch (error) {
//     console.error("deleteGroupPayment error:", error);
//     return res.status(500).json({ success: false, message: "Could not delete payment screenshot.", error: error.message });
//   }
// };
 
// // ─────────────── Payment Tasks dashboard ───────────────
// const buildBookingDetails = (b, extra = {}) => {
//   if (!b) return null;
//   return {
//     email: b.contact?.email || "",
//     mobile: b.contact?.mobile || "",
//     bookingType: b.bookingType || "",
//     bookingDate: b.bookingDate,
//     isTripCompleted: !!b.isTripCompleted,
//     isBookingCompleted: !!b.isBookingCompleted,
//     manageBooking: !!b.manageBooking,
//     gvCancellationPool: b.gvCancellationPool ?? null,
//     irctcCancellationPool: b.irctcCancellationPool ?? null,
//     travellers: b.travellers || [],
//     billingAddress: b.billingAddress || {},
//     payment: b.payment || {},
//     receipts: b.receipts || {},
//     advanceAdminRemarks: b.advanceAdminRemarks || [],
//     adminRemarks: b.adminRemarks || [],
//     creationRemarks: extra.creationRemarks || "",
//     paymentHistory: extra.paymentHistory || [],
//     paymentTotals: extra.paymentTotals || { advancePaid: 0, partialPaid: 0, balancePaid: 0 },
//   };
// };
 
// const BOOKING_DETAIL_SELECT =
//   "tnr tourId travellers payment bookingDate contact bookingType " +
//   "isTripCompleted isBookingCompleted manageBooking gvCancellationPool " +
//   "irctcCancellationPool billingAddress receipts advanceAdminRemarks adminRemarks";
 
// const computePaymentTotals = (history) => {
//   const sum = (type) =>
//     history
//       .filter((h) => h.type === type)
//       .reduce((s, h) => s + (Number(h.amount) || 0), 0);
//   return {
//     advancePaid: sum("paymentAdvance"),
//     partialPaid: sum("paymentPartial"),
//     balancePaid: sum("paymentBalance"),
//   };
// };
 
// export const getPaymentTasks = async (req, res) => {
//   try {
//     const allBookingsNeedingAdvance = await tourBookingModel
//       .find({ "payment.advance.paid": { $ne: true } })
//       .populate({ path: "tourId", model: "tour", select: "title" })
//       .select(BOOKING_DETAIL_SELECT)
//       .sort({ bookingDate: -1 })
//       .lean();
 
//     const advanceTnrs = allBookingsNeedingAdvance.map((b) => b.tnr).filter(Boolean);
//     const advanceClearedDocs = advanceTnrs.length
//       ? await aadhaarModel
//         .find({ type: "advanceTaskCleared", tnr: { $in: advanceTnrs } })
//         .select("tnr")
//         .lean()
//       : [];
//     const advanceClearedTnrs = new Set(advanceClearedDocs.map((d) => d.tnr));
 
//     const advanceScreenshotDocs = advanceTnrs.length
//       ? await aadhaarModel
//         .find({ type: "paymentAdvance", tnr: { $in: advanceTnrs } })
//         .select("tnr")
//         .lean()
//       : [];
//     const tnrsWithAdvanceScreenshot = new Set(advanceScreenshotDocs.map((d) => d.tnr));
 
//     const bookingsNeedingAdvance = allBookingsNeedingAdvance.filter(
//       (b) => !advanceClearedTnrs.has(b.tnr) && tnrsWithAdvanceScreenshot.has(b.tnr),
//     );
 
//     const screenshotDocs = await aadhaarModel
//       .find({ type: { $in: ["paymentPartial", "paymentBalance"] }, taskCleared: { $ne: true } })
//       .sort({ createdAt: -1 })
//       .lean();
 
//     const groupIds = [...new Set(screenshotDocs.map((d) => d.groupId).filter(Boolean))];
//     const mainDocs = groupIds.length
//       ? await aadhaarModel
//         .find({ type: "aadhaarFront", isCoTraveller: false, groupId: { $in: groupIds } })
//         .lean()
//       : [];
//     const bookingNotesDocs = groupIds.length
//       ? await aadhaarModel
//         .find({ type: "bookingNotes", groupId: { $in: groupIds } })
//         .populate({ path: "tourId", model: "tour", select: "title" })
//         .lean()
//       : [];
//     const mainByGroup = new Map(mainDocs.map((d) => [d.groupId, d]));
//     const notesByGroup = new Map(bookingNotesDocs.map((d) => [d.groupId, d]));
 
//     const screenshotTnrs = [
//       ...new Set(screenshotDocs.map((d) => d.tnr).filter(Boolean)),
//     ];
//     const linkedBookings = screenshotTnrs.length
//       ? await tourBookingModel
//         .find({ tnr: { $in: screenshotTnrs } })
//         .populate({ path: "tourId", model: "tour", select: "title" })
//         .select(BOOKING_DETAIL_SELECT)
//         .lean()
//       : [];
//     const bookingByTnr = new Map(linkedBookings.map((b) => [b.tnr, b]));
 
//     const allTnrs = [
//       ...new Set([
//         ...bookingsNeedingAdvance.map((b) => b.tnr).filter(Boolean),
//         ...screenshotTnrs,
//       ]),
//     ];
//     const allPaymentDocs = allTnrs.length
//       ? await aadhaarModel
//         .find({
//           type: { $in: ["paymentAdvance", "paymentPartial", "paymentBalance"] },
//           tnr: { $in: allTnrs },
//         })
//         .select("tnr type amount url createdAt taskCleared remarks")
//         .sort({ createdAt: 1 })
//         .lean()
//       : [];
//     const paymentHistoryByTnr = new Map();
//     for (const d of allPaymentDocs) {
//       if (!paymentHistoryByTnr.has(d.tnr)) paymentHistoryByTnr.set(d.tnr, []);
//       paymentHistoryByTnr.get(d.tnr).push({
//         docId: d._id,
//         type: d.type,
//         amount: d.amount,
//         url: d.url || "",
//         uploadedAt: d.createdAt,
//         taskCleared: !!d.taskCleared,
//         remarks: d.remarks || "",
//       });
//     }
//     const bookingNotesByTnrDocs = allTnrs.length
//       ? await aadhaarModel
//         .find({ type: "bookingNotes", tnr: { $in: allTnrs } })
//         .select("tnr remarks")
//         .lean()
//       : [];
//     const creationRemarksByTnr = new Map(
//       bookingNotesByTnrDocs.map((d) => [d.tnr, d.remarks || ""]),
//     );
//     const extraForTnr = (tnr) => {
//       const history = (tnr && paymentHistoryByTnr.get(tnr)) || [];
//       return {
//         creationRemarks: (tnr && creationRemarksByTnr.get(tnr)) || "",
//         paymentHistory: history,
//         paymentTotals: computePaymentTotals(history),
//       };
//     };
 
//     const advanceTasks = bookingsNeedingAdvance.map((b) => {
//       const main = (b.travellers || []).find((t) => !t.isCoTraveller) || b.travellers?.[0];
//       return {
//         tnr: b.tnr,
//         tourTitle: b.tourId?.title || "",
//         mainName: [main?.title, main?.firstName, main?.lastName].filter(Boolean).join(" ") || "Unnamed traveller",
//         amount: b.payment?.advance?.amount ?? null,
//         bookingDate: b.bookingDate,
//         booking: buildBookingDetails(b, extraForTnr(b.tnr)),
//       };
//     });
 
//     const screenshotToTask = (d) => {
//       const main = mainByGroup.get(d.groupId);
//       const notes = notesByGroup.get(d.groupId);
//       const mainName = main
//         ? [main.parsed?.title, main.parsed?.firstName, main.parsed?.lastName].filter(Boolean).join(" ") || "Unnamed traveller"
//         : "Unnamed traveller";
//       const linkedBooking = d.tnr ? bookingByTnr.get(d.tnr) : null;
//       return {
//         docId: d._id,
//         tnr: d.tnr || "",
//         tourTitle: notes?.tourId?.title || linkedBooking?.tourId?.title || "",
//         mainName,
//         amount: d.amount,
//         uploadedAt: d.createdAt,
//         screenshotUrl: d.url || "",
//         booking: buildBookingDetails(linkedBooking, extraForTnr(d.tnr)),
//       };
//     };
 
//     const partialTasks = screenshotDocs.filter((d) => d.type === "paymentPartial").map(screenshotToTask);
//     const balanceTasks = screenshotDocs.filter((d) => d.type === "paymentBalance").map(screenshotToTask);
 
//     return res.status(200).json({ success: true, advanceTasks, partialTasks, balanceTasks });
//   } catch (error) {
//     console.error("getPaymentTasks error:", error);
//     return res.status(500).json({ success: false, message: "Could not fetch payment tasks.", error: error.message });
//   }
// };
 
// // POST /payment-tasks/mark-done — body: { docId }. Purely a to-do checkbox.
// export const markPaymentTaskDone = async (req, res) => {
//   try {
//     const { docId } = req.body;
//     if (!docId) return res.status(400).json({ success: false, message: "docId is required" });
 
//     const doc = await aadhaarModel.findOneAndUpdate(
//       { _id: docId, type: { $in: ["paymentPartial", "paymentBalance"] } },
//       { $set: { taskCleared: true } },
//       { new: true },
//     );
//     if (!doc) {
//       return res.status(404).json({ success: false, message: "Payment task not found." });
//     }
 
//     return res.status(200).json({ success: true });
//   } catch (error) {
//     console.error("markPaymentTaskDone error:", error);
//     return res.status(500).json({ success: false, message: "Could not mark this task done.", error: error.message });
//   }
// };
 
// // POST /payment-tasks/mark-advance-done — body: { tnr }. Purely a to-do
// // checkbox; never touches payment.advance.
// export const markAdvanceTaskDone = async (req, res) => {
//   try {
//     const { tnr } = req.body;
//     if (!tnr) return res.status(400).json({ success: false, message: "tnr is required" });
 
//     await aadhaarModel.findOneAndUpdate(
//       { type: "advanceTaskCleared", tnr },
//       { $setOnInsert: { type: "advanceTaskCleared", tnr, uploadedBy: "admin" } },
//       { upsert: true, new: true },
//     );
 
//     return res.status(200).json({ success: true });
//   } catch (error) {
//     console.error("markAdvanceTaskDone error:", error);
//     return res.status(500).json({ success: false, message: "Could not mark this task done.", error: error.message });
//   }
// };
 
// // ═══════════════════════ "User Bookings" tab ═══════════════════════
 
// // GET /ocr/user-bookings?tourId=...&email= (email optional)
// export const searchUserBookings = async (req, res) => {
//   try {
//     const { tourId, email } = req.query;
//     if (!tourId) return res.status(400).json({ success: false, message: "tourId is required" });
 
//     const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
//     const query = { tourId, createdBy: "user" };
//     if (email && email.trim()) {
//       query["contact.email"] = new RegExp(`^${escapeRegex(email.trim())}$`, "i");
//     }
//     const bookings = await tourBookingModel
//       .find(query)
//       .select("tnr travellers contact bookingDate payment cancelled")
//       .sort({ bookingDate: -1 })
//       .lean();
 
//     const tnrs = bookings.map((b) => b.tnr).filter(Boolean);
//     const proofDocs = tnrs.length
//       ? await aadhaarModel.find({ tnr: { $in: tnrs } }).lean()
//       : [];
//     const docsByTnr = new Map();
//     for (const d of proofDocs) {
//       if (!docsByTnr.has(d.tnr)) docsByTnr.set(d.tnr, []);
//       docsByTnr.get(d.tnr).push(d);
//     }
 
//     const cancellationDocs = tnrs.length
//       ? await cancellationModel
//         .find({ tnr: { $in: tnrs } })
//         .select("tnr travellerIds raisedBy approvedBy rejectedAt createdAt")
//         .sort({ createdAt: 1 })
//         .lean()
//       : [];
//     const cancelDocByTnrTraveller = new Map();
//     for (const doc of cancellationDocs) {
//       for (const tid of doc.travellerIds || []) {
//         cancelDocByTnrTraveller.set(`${doc.tnr}::${tid}`, doc);
//       }
//     }
//     const cancelStatusFor = (b, t) => {
//       const cancelDoc = cancelDocByTnrTraveller.get(`${b.tnr}::${t._id}`);
//       if (cancelDoc) return cancelDoc.approvedBy ? "cancelled" : cancelDoc.raisedBy ? "request" : "rejected";
//       const wholeCancelled = !!(b.cancelled?.byAdmin || b.cancelled?.byTraveller);
//       if (wholeCancelled || t.cancelled?.viaTripCancel || t.cancelled?.byAdmin) {
//         return "cancelled";
//       }
//       if (t.cancelled?.byTraveller) {
//         return "request";
//       }
//       return null;
//     };
 
//     return res.status(200).json({
//       success: true,
//       bookings: bookings.map((b) => {
//         const proofs = docsByTnr.get(b.tnr) || [];
//         const aadhaarByTraveller = new Map();
//         const payments = { advance: [], balance: [], partial: [] };
//         for (const d of proofs) {
//           if (d.type === "aadhaarFront" || d.type === "aadhaarBack") {
//             const key = String(d.travellerId);
//             if (!aadhaarByTraveller.has(key)) aadhaarByTraveller.set(key, { front: null, back: null });
//             const entry = aadhaarByTraveller.get(key);
//             if (d.type === "aadhaarFront") entry.front = { url: d.url, uploadedAt: d.createdAt };
//             else entry.back = { url: d.url, uploadedAt: d.createdAt };
//           } else if (d.type === "paymentAdvance") {
//             payments.advance.push({ _id: d._id, url: d.url, amount: d.amount, uploadedAt: d.createdAt, remarks: d.remarks || "" });
//           } else if (d.type === "paymentBalance") {
//             payments.balance.push({ _id: d._id, url: d.url, amount: d.amount, uploadedAt: d.createdAt, remarks: d.remarks || "" });
//           } else if (d.type === "paymentPartial") {
//             payments.partial.push({ _id: d._id, url: d.url, amount: d.amount, uploadedAt: d.createdAt, remarks: d.remarks || "" });
//           }
//         }
 
//         const packageAmount = (Number(b.payment?.advance?.amount) || 0) + (Number(b.payment?.balance?.amount) || 0);
//         const screenshotsPaid =
//           payments.advance.reduce((s, p) => s + (Number(p.amount) || 0), 0) +
//           payments.balance.reduce((s, p) => s + (Number(p.amount) || 0), 0) +
//           payments.partial.reduce((s, p) => s + (Number(p.amount) || 0), 0);
//         const bookingPaid =
//           (b.payment?.advance?.paid ? Number(b.payment?.advance?.amount) || 0 : 0) +
//           (b.payment?.balance?.paid ? Number(b.payment?.balance?.amount) || 0 : 0);
//         const amountPaid = Math.max(screenshotsPaid, bookingPaid);
//         const balanceRemaining = Math.max(0, packageAmount - amountPaid);
 
//         return {
//           tnr: b.tnr,
//           bookingDate: b.bookingDate,
//           contact: b.contact,
//           travellers: (b.travellers || []).map((t, idx) => ({
//             _id: t._id,
//             title: t.title,
//             firstName: t.firstName,
//             lastName: t.lastName,
//             age: t.age,
//             gender: t.gender,
//             isCoTraveller: idx > 0,
//             hasAadhaar: !!t.aadhaarId,
//             aadhaar: aadhaarByTraveller.get(String(t._id)) || { front: null, back: null },
//             cancelStatus: cancelStatusFor(b, t),
//           })),
//           payments,
//           paymentSummary: {
//             packageAmount,
//             amountPaid,
//             balanceRemaining,
//             fullyPaid: packageAmount > 0 && amountPaid >= packageAmount,
//           },
//         };
//       }),
//     });
//   } catch (error) {
//     console.error("searchUserBookings error:", error);
//     return res.status(500).json({ success: false, message: "Could not search online bookings.", error: error.message });
//   }
// };
 
// // POST /ocr/user-bookings/upload-aadhaar — attaches Aadhaar to ONE existing
// // traveller (real booking), or to an existing walk-in / pending
// // co-traveller aadhaarModel doc (fallback).
// export const uploadUserTravellerAadhaar = async (req, res) => {
//   try {
//     const { tnr, travellerId, front, back, parsed } = req.body;
//     if (!tnr) return res.status(400).json({ success: false, message: "tnr is required" });
//     if (!travellerId) return res.status(400).json({ success: false, message: "travellerId is required" });
 
//     const booking = await tourBookingModel.findOne({
//       tnr: tnr.trim().toUpperCase(),
//       "travellers._id": travellerId,
//     });
 
//     if (!booking) {
//       // FALLBACK — travellerId is an existing aadhaarModel doc's own _id.
//       const existingDoc = await aadhaarModel.findOne({
//         _id: travellerId,
//         tnr: tnr.trim().toUpperCase(),
//       });
//       if (!existingDoc) {
//         return res.status(404).json({ success: false, message: "Booking/traveller not found for this tnr." });
//       }
 
//       existingDoc.url = front?.url || existingDoc.url || "";
//       existingDoc.ocrText = front?.ocrText || existingDoc.ocrText || "";
//       existingDoc.parsed = { ...(existingDoc.parsed || {}), ...(parsed || {}) };
//       await existingDoc.save();
 
//       if (back?.url) {
//         await aadhaarModel.create({
//           groupId: existingDoc.groupId,
//           tnr: existingDoc.tnr,
//           type: "aadhaarBack",
//           isCoTraveller: !!existingDoc.isCoTraveller,
//           postBooking: existingDoc.postBooking,
//           url: back.url,
//           ocrText: back.ocrText || "",
//           parsed: parsed || {},
//           uploadedBy: "admin",
//         });
//       }
 
//       return res.status(201).json({ success: true, traveller: existingDoc });
//     }
//     const traveller = booking.travellers.id(travellerId);
 
//     const frontDoc = await aadhaarModel.create({
//       tnr: booking.tnr,
//       travellerId,
//       type: "aadhaarFront",
//       isCoTraveller: !!traveller.isCoTraveller,
//       url: front?.url || "",
//       ocrText: front?.ocrText || "",
//       parsed: parsed || {},
//       uploadedBy: "admin",
//     });
 
//     if (back?.url) {
//       await aadhaarModel.create({
//         tnr: booking.tnr,
//         travellerId,
//         type: "aadhaarBack",
//         isCoTraveller: !!traveller.isCoTraveller,
//         url: back.url,
//         ocrText: back.ocrText || "",
//         parsed: parsed || {},
//         uploadedBy: "admin",
//       });
//     }
 
//     await tourBookingModel.updateOne(
//       { _id: booking._id, "travellers._id": travellerId },
//       {
//         $set: {
//           "travellers.$.aadhaarId": frontDoc._id,
//           "travellers.$.aadhaarNumber": parsed?.aadhaarNumber || "",
//         },
//       },
//     );
 
//     return res.status(201).json({ success: true, traveller: frontDoc });
//   } catch (error) {
//     console.error("uploadUserTravellerAadhaar error:", error);
//     return res.status(500).json({ success: false, message: "Could not save Aadhaar for this traveller.", error: error.message });
//   }
// };
 
// // POST /bookings/export-active-travellers — body: { tnrs?: string[] }.
// export const exportActiveTravellersPdfData = async (req, res) => {
//   try {
//     const { tnrs } = req.body || {};
//     const filter =
//       Array.isArray(tnrs) && tnrs.length > 0
//         ? { tnr: { $in: tnrs.map((t) => String(t).trim().toUpperCase()) } }
//         : {};
 
//     const bookings = await tourBookingModel.find(filter);
//     const rows = [];
 
//     for (const booking of bookings) {
//       let bookingChanged = false;
 
//       const aadhaarDocs = await aadhaarModel
//         .find({ tnr: booking.tnr, type: "aadhaarFront" })
//         .sort({ createdAt: 1 });
//       const byTravellerId = new Map();
//       const mainDocs = [];
//       const coDocs = [];
//       for (const d of aadhaarDocs) {
//         if (d.travellerId) byTravellerId.set(String(d.travellerId), d);
//         else if (d.isCoTraveller) coDocs.push(d);
//         else mainDocs.push(d);
//       }
 
//       let coIndex = 0;
//       for (let i = 0; i < (booking.travellers || []).length; i++) {
//         const t = booking.travellers[i];
//         const isMain = i === 0;
//         const matchedById = byTravellerId.get(String(t._id));
//         const positionalDoc = isMain ? mainDocs[0] : coDocs[coIndex];
//         if (!isMain && !matchedById) coIndex++;
 
//         const isCancelled = t.cancelled?.byAdmin || t.cancelled?.byTraveller;
//         if (isCancelled) continue;
 
//         let aadhaarNumber = t.aadhaarNumber || "";
//         let aDoc = null;
//         if (!aadhaarNumber && t.aadhaarId) {
//           try {
//             aDoc = await aadhaarModel.findById(t.aadhaarId);
//           } catch (lookupErr) {
//             console.error(
//               "aadhaarModel lookup by aadhaarId failed during PDF export for traveller",
//               t._id?.toString(),
//               lookupErr.message,
//             );
//           }
//         }
//         if (!aadhaarNumber && !aDoc) {
//           aDoc = matchedById || positionalDoc || null;
//         }
 
//         if (!aadhaarNumber && aDoc) {
//           aadhaarNumber = aDoc.parsed?.aadhaarNumber || "";
 
//           if (!aadhaarNumber && aDoc.url) {
//             try {
//               aadhaarNumber = await ocrAadhaarNumberFromUrl(aDoc.url);
//             } catch (ocrErr) {
//               console.error(
//                 "Aadhaar-number backfill OCR failed for traveller",
//                 t._id?.toString(),
//                 ocrErr.message,
//               );
//             }
//           }
 
//           if (aadhaarNumber && aDoc.parsed?.aadhaarNumber !== aadhaarNumber) {
//             aDoc.parsed = { ...(aDoc.parsed || {}), aadhaarNumber };
//             await aDoc.save();
//           }
//         }
 
//         if (aadhaarNumber) {
//           t.aadhaarNumber = aadhaarNumber;
//           bookingChanged = true;
//         }
 
//         rows.push({
//           tnr: booking.tnr,
//           name: `${t.firstName || ""} ${t.lastName || ""}`.trim() || "Unknown",
//           age: t.age ?? "",
//           gender: t.gender || "",
//           aadhaarNumber: aadhaarNumber || "Not Available",
//         });
//       }
 
//       if (bookingChanged) {
//         await booking.save();
//       }
//     }
 
//     return res.status(200).json({ success: true, travellers: rows });
//   } catch (error) {
//     console.error("exportActiveTravellersPdfData error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Could not prepare the active travellers list.",
//       error: error.message,
//     });
//   }
// };
 
// // POST /ocr/user-bookings/upload-payment — multipart: screenshot; body:
// // { tnr, type, amount }. Never touches payment.advance/balance.paid.
// export const uploadUserBookingPayment = withTempCleanup(async (req, res) => {
//   try {
//     const file = req.file;
//     const { tnr, type, amount, remarks } = req.body;
//     if (!file) return res.status(400).json({ success: false, message: "Screenshot image is required" });
//     if (!tnr) return res.status(400).json({ success: false, message: "tnr is required" });
//     if (!["advance", "balance", "partial"].includes(type)) {
//       return res.status(400).json({ success: false, message: "type must be advance, balance or partial" });
//     }
//     if (amount !== undefined && amount !== "" && (isNaN(Number(amount)) || Number(amount) <= 0)) {
//       return res.status(400).json({ success: false, message: "Amount, if entered, must be a positive number." });
//     }
 
//     const booking = await tourBookingModel.findOne({ tnr: tnr.trim().toUpperCase(), createdBy: "user" }).select("tnr");
//     if (!booking) {
//       return res.status(404).json({ success: false, message: "Online booking not found for this tnr." });
//     }
 
//     const upload = await cloudinary.uploader.upload(file.path, { folder: "payment-screenshots", resource_type: "image" });
 
//     // let ocrAmount = null;
//     // try {
//     //   const text = await readImageText(file.path);
//     //   ocrAmount = extractPaymentAmount(text);
//     // } catch (err) {
//     //   console.error("Payment screenshot OCR failed, falling back to typed amount:", err.message);
//     // }
//     // const finalAmount = ocrAmount ?? (amount ? Number(amount) : null);
//     const typedAmount = amount !== undefined && amount !== "" ? Number(amount) : null;
//     let ocrAmount = null;
//     if (typedAmount === null) {
//       try {
//         const text = await readImageText(file.path);
//         ocrAmount = extractPaymentAmount(text);
//       } catch (err) {
//         console.error("Payment screenshot OCR failed:", err.message);
//       }
//     }
//     const finalAmount = typedAmount ?? ocrAmount;
 
 
//     const doc = await aadhaarModel.create({
//       tnr: booking.tnr,
//       type: type === "advance" ? "paymentAdvance" : type === "balance" ? "paymentBalance" : "paymentPartial",
//       url: upload.secure_url,
//       amount: finalAmount,
//       remarks: remarks?.trim() || "",
//       uploadedBy: "admin",
//     });
 
//     return res.status(201).json({
//       success: true,
//       payment: doc,
//       // amountSource: ocrAmount !== null ? "ocr" : amount ? "manual" : "none",
//       amountSource: typedAmount !== null ? "manual" : ocrAmount !== null ? "ocr" : "none",
//     });
//   } catch (error) {
//     console.error("uploadUserBookingPayment error:", error);
//     return res.status(500).json({ success: false, message: "Upload failed.", error: error.message });
//   }
// });
 
// // POST /ocr/link-tnr — manual fallback when auto-match can't find the tnr.
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
 
// // GET /ocr/payment-records?from=YYYY-MM-DD&to=YYYY-MM-DD&type=advance|balance|partial
// // Every payment screenshot saved from the Aadhaar Upload page, newest first.
// export const getPaymentRecords = async (req, res) => {
//   try {
//     const { from, to, type } = req.query;
 
//     const typeMap = { advance: "paymentAdvance", balance: "paymentBalance", partial: "paymentPartial" };
//     const query = {
//       type: typeMap[type] ? typeMap[type] : { $in: ["paymentAdvance", "paymentBalance", "paymentPartial"] },
//     };
//     if (from || to) {
//       query.createdAt = {};
//       if (from) query.createdAt.$gte = new Date(`${from}T00:00:00+05:30`);
//       if (to) query.createdAt.$lte = new Date(`${to}T23:59:59.999+05:30`);
//     }
 
//     const payments = await aadhaarModel
//       .find(query)
//       .select("type amount remarks url createdAt tnr groupId taskCleared uploadedBy")
//       .sort({ createdAt: -1 })
//       .limit(2000)
//       .lean();
 
//     const groupIds = [...new Set(payments.map((p) => p.groupId).filter(Boolean))];
//     const groupDocs = groupIds.length
//       ? await aadhaarModel
//         .find({ groupId: { $in: groupIds }, type: { $in: ["aadhaarFront", "bookingNotes"] } })
//         .select("groupId tnr type isCoTraveller parsed tourId createdAt")
//         .sort({ createdAt: 1 })
//         .lean()
//       : [];
//     const groupInfo = new Map();
//     for (const d of groupDocs) {
//       const g = groupInfo.get(d.groupId) || { name: "", tourId: null, tnr: "" };
//       if (d.tnr) g.tnr = d.tnr;
//       if (d.type === "bookingNotes" && d.tourId) g.tourId = String(d.tourId);
//       if (d.type === "aadhaarFront" && !d.isCoTraveller && !g.name) {
//         g.name = [d.parsed?.title, d.parsed?.firstName, d.parsed?.lastName].filter(Boolean).join(" ");
//       }
//       groupInfo.set(d.groupId, g);
//     }
 
//     const tnrs = [
//       ...new Set(
//         payments
//           .map((p) => p.tnr || (p.groupId ? groupInfo.get(p.groupId)?.tnr : ""))
//           .filter(Boolean),
//       ),
//     ];
//     const realDocs = tnrs.length
//       ? await tourBookingModel.find({ tnr: { $in: tnrs } }).select("tnr tourId travellers createdBy").lean()
//       : [];
//     const realByTnr = new Map(realDocs.map((b) => [b.tnr, b]));
 
//     const tourIds = [
//       ...new Set(
//         [...groupInfo.values()].map((g) => g.tourId)
//           .concat(realDocs.map((b) => (b.tourId ? String(b.tourId) : null)))
//           .filter(Boolean),
//       ),
//     ];
//     const tourDocs = tourIds.length ? await tourModel.find({ _id: { $in: tourIds } }).select("title").lean() : [];
//     const tourTitleById = new Map(tourDocs.map((t) => [String(t._id), t.title || ""]));
 
//     const records = payments.map((p) => {
//       const g = p.groupId ? groupInfo.get(p.groupId) : null;
//       const tnr = p.tnr || g?.tnr || "";
//       const real = tnr ? realByTnr.get(tnr) : null;
//       const firstReal = real?.travellers?.[0];
//       const realName = firstReal
//         ? [firstReal.title, firstReal.firstName, firstReal.lastName].filter(Boolean).join(" ")
//         : "";
//       const tourId = g?.tourId || (real?.tourId ? String(real.tourId) : null);
//       return {
//         _id: p._id,
//         type: p.type === "paymentAdvance" ? "advance" : p.type === "paymentBalance" ? "balance" : "partial",
//         amount: p.amount ?? null,
//         remarks: p.remarks || "",
//         url: p.url,
//         createdAt: p.createdAt,
//         tnr,
//         groupId: p.groupId || null,
//         name: g?.name || realName || "",
//         tourId,
//         tourTitle: tourId ? tourTitleById.get(tourId) || "" : "",
//         bookingSource: real?.createdBy === "user" ? "user" : "admin",
//         taskCleared: !!p.taskCleared,
//       };
//     });
 
//     return res.status(200).json({ success: true, records });
//   } catch (error) {
//     console.error("getPaymentRecords error:", error);
//     return res.status(500).json({ success: false, message: "Could not load payment records.", error: error.message });
//   }
// };


import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { createWorker } from "tesseract.js";
import sharp from "sharp";
import fs from "fs";
import os from "os";
import zlib from "zlib";
// Pure-WASM PDF renderer — turns a PDF Aadhaar upload's first page into a
// PNG before sharp/Tesseract touch it. A raw PDF must NEVER reach
// worker.recognize() (crashes the whole Node process).
import mupdf from "mupdf";
// archiver is plain CommonJS — createRequire avoids the ESM default-export
// interop problem on some Node versions.
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const archiver = require("archiver");
// Pure-JS QR reader for the Aadhaar Secure QR / old XML QR.
const jsQR = require("jsqr");
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

// ── Card language ──────────────────────────────────────────────────────
// The OCR must know the card's regional script to recognise it as that
// script (and then delete it). Loading every language at once is very slow,
// so each extraction loads English + ONE language, chosen from the
// pincode (main traveller's back side) or the main traveller's state
// (co-traveller, front only). Default: Tamil.
const SUPPORTED_CARD_LANGS = ["tam", "tel", "kan", "mal", "hin"];
const DEFAULT_CARD_LANG = "tam";

// First two digits of an Indian PIN → state → card language.
function langFromPincode(pin = "") {
  const p = String(pin).match(/\b([1-9]\d)\d{4}\b/);
  if (!p) return "";
  const n = Number(p[1]);
  if (n >= 60 && n <= 64) return "tam"; // Tamil Nadu, Puducherry
  if (n >= 67 && n <= 69) return "mal"; // Kerala
  if (n >= 56 && n <= 59) return "kan"; // Karnataka
  if (n >= 50 && n <= 53) return "tel"; // Telangana, Andhra Pradesh
  // Hindi-belt states (Delhi, UP, Bihar, MP, Rajasthan, Haryana, …) and
  // Maharashtra (Devanagari script).
  if ((n >= 11 && n <= 13) || (n >= 17 && n <= 34) || (n >= 40 && n <= 49) || (n >= 80 && n <= 85)) return "hin";
  return "";
}

const STATE_LANG = {
  "tamil nadu": "tam", puducherry: "tam", pondicherry: "tam",
  kerala: "mal", lakshadweep: "mal",
  karnataka: "kan",
  telangana: "tel", "andhra pradesh": "tel",
  delhi: "hin", "uttar pradesh": "hin", bihar: "hin", "madhya pradesh": "hin",
  rajasthan: "hin", haryana: "hin", jharkhand: "hin", chhattisgarh: "hin",
  uttarakhand: "hin", "himachal pradesh": "hin", maharashtra: "hin", chandigarh: "hin",
};
function langFromState(state = "") {
  const key = String(state).toLowerCase().replace(/\s+/g, " ").trim();
  if (!key) return "";
  if (STATE_LANG[key]) return STATE_LANG[key];
  const hit = Object.keys(STATE_LANG).find((k) => key.includes(k));
  return hit ? STATE_LANG[hit] : "";
}

// A name we trust: every non-initial word is Title Case ("Shanthi
// Ranganathan", "S K Brindha"). OCR junk from a wrong-language read is
// usually ALL CAPS or mixed ("EMHE JHIGEOIT", "THe").
function nameLooksSolid(p = {}) {
  const words = `${p.firstName || ""} ${p.lastName || ""}`.split(/\s+/).filter((w) => w.length > 1);
  return words.length > 0 && words.every((w) => /^[A-Z][a-z]{2,}$/.test(w));
}

// One cached OCR worker per language (English + that language).
const aadhaarWorkers = {};
function getAadhaarWorker(lang = DEFAULT_CARD_LANG) {
  const l = SUPPORTED_CARD_LANGS.includes(lang) ? lang : DEFAULT_CARD_LANG;
  if (!aadhaarWorkers[l]) {
    aadhaarWorkers[l] = createWorker(["eng", l])
      .then(async (worker) => {
        await worker.setParameters({ tessedit_pageseg_mode: "6" });
        return worker;
      })
      .catch((err) => {
        console.error(`[aadhaarOcr] "${l}" OCR unavailable, using English only:`, err.message);
        delete aadhaarWorkers[l];
        return getWorker();
      });
  }
  return aadhaarWorkers[l];
}

// Keeps only English (ASCII) text: Tamil/Hindi characters are removed,
// and lines left with no real letters are dropped.
function englishOnly(text = "") {
  return text
    .split("\n")
    .map((l) => l.replace(/[^\x00-\x7F]+/g, " ").replace(/\s{2,}/g, " ").trim())
    .filter((l) => /[A-Za-z0-9]/.test(l))
    .join("\n");
}

// ── PaddleOCR (second reader) ───────────────────────────────────────────
// Runs on this server (ONNX), nothing is sent outside. Reads faded/blurred
// English text that Tesseract misses ("Sivaswami M S", "Hinduja Devaraj").
// Both readers run and the better value per field is kept
// (mergeOcrParses). Optional: if @gutenye/ocr-node or the English model in
// data/paddle/ is missing, Tesseract alone is used as before.
let paddleReady = null;
function getPaddle() {
  if (!paddleReady) {
    paddleReady = (async () => {
      const rec = new URL("../data/paddle/en_PP-OCRv4_rec.onnx", import.meta.url);
      const dict = new URL("../data/paddle/en_dict.txt", import.meta.url);
      if (!fs.existsSync(rec) || !fs.existsSync(dict)) {
        console.error("[aadhaarOcr] PaddleOCR English model missing in data/paddle — Tesseract only");
        return null;
      }
      const mod = await import("@gutenye/ocr-node");
      const Ocr = mod.default || mod;
      return Ocr.create({
        models: { recognitionPath: decodeURIComponent(rec.pathname), dictionaryPath: decodeURIComponent(dict.pathname) },
      });
    })().catch((err) => {
      console.error("[aadhaarOcr] PaddleOCR not available — Tesseract only:", String(err?.message || err).slice(0, 200));
      return null;
    });
  }
  return paddleReady;
}

// PaddleOCR prints "," as "." and drops spaces after ":" / "," —
// put them back so the same parsers work on its text.
function normalizePaddleText(text = "") {
  return text
    .split("\n")
    .map((l) =>
      l
        .replace(/\bD0B\b/g, "DOB")
        .replace(/\bY0B\b/g, "YOB")
        // "Sankar.560.VILLAGE" → "Sankar, 560, VILLAGE"; keeps "S.K" initials and "No.15".
        .replace(/\b([A-Za-z]{3,}|\d+)\.(?=[A-Z0-9])/g, (m, w) => (/^no$/i.test(w) ? m : `${w}, `))
        .replace(/,(?=\S)/g, ", ")
        .replace(/:(?=[A-Za-z0-9])/g, ": ")
        .replace(/(Birth|DOB|YOB)(?=\d)/gi, "$1 "),
    )
    .join("\n");
}

async function readPaddleText(filePath) {
  if (isPdfFile(filePath) && englishOnly(pdfTextLayer(filePath)).length > 80) return ""; // exact text already
  const ocr = await getPaddle();
  if (!ocr) return "";
  let pdfPng = null;
  const out = `${filePath}-paddle.png`;
  try {
    let src = filePath;
    if (isPdfFile(filePath)) {
      pdfPng = pdfFirstPageToPngFile(filePath);
      src = pdfPng;
    }
    await sharp(src).rotate().resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }).png().toFile(out);
    const res = await ocr.detect(out);
    const items = (Array.isArray(res) ? res : res?.texts || [])
      .filter((t) => t && t.text)
      .sort((a, b) => (a.box?.[0]?.[1] ?? 0) - (b.box?.[0]?.[1] ?? 0) || (a.box?.[0]?.[0] ?? 0) - (b.box?.[0]?.[0] ?? 0));
    return normalizePaddleText(englishOnly(items.map((t) => t.text).join("\n")));
  } catch (err) {
    console.error("[aadhaarOcr] PaddleOCR read failed:", String(err?.message || err).slice(0, 200));
    return "";
  } finally {
    fs.unlink(out, () => {});
    if (pdfPng) fs.unlink(pdfPng, () => {});
  }
}

// Best of Tesseract (a) and PaddleOCR (b), field by field.
function mergeOcrParses(a = {}, b = {}) {
  if (!b || !Object.keys(b).length) return a;
  const nameWords = (p) => [...new Set(`${p.firstName || ""} ${p.lastName || ""}`.split(/\s+/).filter(Boolean))];
  const nameScore = (p) => {
    const w = nameWords(p);
    if (!w.length) return 0;
    return (nameLooksSolid(p) ? 100 : 0) + w.join("").length + 5 * (w.length - 1);
  };
  const out = { ...a };
  if (nameScore(b) > nameScore(a)) {
    out.firstName = b.firstName;
    out.lastName = b.lastName;
  }
  // Digits: PaddleOCR reads them more reliably; Tesseract fills gaps.
  if (b.dob) { out.dob = b.dob; out.age = b.age || a.age; } else if (!a.dob && b.age) out.age = b.age;
  if (!out.age && b.age) out.age = b.age;
  out.gender = a.gender || b.gender || "";
  out.aadhaarNumber = b.aadhaarNumber || a.aadhaarNumber || "";
  out.phone = a.phone || b.phone || "";
  // Address: the read that found more of state / pincode / city.
  const addrScore = (p) => (p.state ? 2 : 0) + (/^\d{6}$/.test(p.pincode || "") ? 2 : 0) + (p.city ? 1 : 0) + (p.addressLine1 ? 1 : 0);
  if (addrScore(b) > addrScore(a)) {
    for (const k of ["address", "addressLine1", "addressLine2", "city", "state", "pincode"]) out[k] = b[k] || "";
  }
  return out;
}

async function readAadhaarText(filePath, lang = DEFAULT_CARD_LANG) {
  // e-Aadhaar PDF downloaded from UIDAI has real text inside — read that
  // directly (exact letters, no OCR guessing). Scanned PDFs have no text
  // layer, so they still go through OCR.
  if (isPdfFile(filePath)) {
    const layer = englishOnly(pdfTextLayer(filePath));
    if (layer.length > 80 && /aadhaar|address|DOB|VTC|PIN\s*Code/i.test(layer)) {
      console.log("[aadhaarOcr] read PDF text layer (no OCR)");
      return layer;
    }
  }
  const raw = await readImageText(filePath, getAadhaarWorker(lang), { cardCrop: true });
  return englishOnly(raw);
}

// Text printed inside a PDF (page 1), line by line. "" if there is none,
// or the PDF can't be opened.
function pdfTextLayer(pdfPath) {
  let doc = null, page = null, st = null;
  try {
    doc = mupdf.Document.openDocument(fs.readFileSync(pdfPath), "application/pdf");
    page = doc.loadPage(0);
    st = page.toStructuredText("preserve-whitespace");
    return st.asText() || "";
  } catch (err) {
    console.error("[aadhaarOcr] PDF text layer read failed:", err.message);
    return "";
  } finally {
    try { st?.destroy(); } catch { /* ignore */ }
    try { page?.destroy(); } catch { /* ignore */ }
    try { doc?.destroy(); } catch { /* ignore */ }
  }
}
 
// Upscale + grayscale + normalize + sharpen before OCR. Falls back to the
// original file if preprocessing fails.
// Where the card sits in a photo: the area with text/edges, ignoring the
// plain wall/table around it. Returns fractions {x0,x1,y0,y1} or null.
async function findCardBox(filePath) {
  try {
    const { data, info } = await sharp(filePath).rotate()
      .resize({ width: 300, height: 300, fit: "inside" })
      .grayscale().blur(0.6).raw().toBuffer({ resolveWithObject: true });
    const w = info.width, h = info.height;
    const rows = new Array(h).fill(0), cols = new Array(w).fill(0);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const g = Math.abs(data[i + 1] - data[i - 1]) + Math.abs(data[i + w] - data[i - w]);
        if (g > 40) { rows[y]++; cols[x]++; }
      }
    }
    const span = (arr) => {
      const tot = arr.reduce((a, b) => a + b, 0);
      if (tot < 50) return null;
      let acc = 0, lo = 0, hi = arr.length - 1;
      for (let i = 0; i < arr.length; i++) { acc += arr[i]; if (acc >= tot * 0.01) { lo = i; break; } }
      acc = 0;
      for (let i = arr.length - 1; i >= 0; i--) { acc += arr[i]; if (acc >= tot * 0.01) { hi = i; break; } }
      return [lo / arr.length, (hi + 1) / arr.length];
    };
    const r = span(rows), c = span(cols);
    return r && c ? { x0: c[0], x1: c[1], y0: r[0], y1: r[1] } : null;
  } catch {
    return null;
  }
}

async function preprocessForOcr(filePath, { cardCrop = false } = {}) {
  const outPath = `${filePath}-ocr.png`;
  let image = sharp(filePath, { density: 300 }).rotate(); // auto-orient via EXIF
  const metadata = await image.metadata();
  let srcWidth = metadata.width || 0;
  // Card photographed small in the middle of a big photo (wall/table all
  // around)? Crop to the card and enlarge it — tiny text is what makes
  // OCR miss the name. Close-up photos and scans are left as they are.
  // Aadhaar photos only — payment screenshots keep the old processing.
  const box = cardCrop ? await findCardBox(filePath) : null;
  if (box && (box.x1 - box.x0) * (box.y1 - box.y0) < 0.5 && metadata.width && metadata.height) {
    const pad = 0.05;
    const oriented = metadata.orientation >= 5 ? { W: metadata.height, H: metadata.width } : { W: metadata.width, H: metadata.height };
    const left = Math.max(0, Math.floor((box.x0 - pad) * oriented.W));
    const top = Math.max(0, Math.floor((box.y0 - pad) * oriented.H));
    const width = Math.min(oriented.W - left, Math.ceil((box.x1 - box.x0 + 2 * pad) * oriented.W));
    const height = Math.min(oriented.H - top, Math.ceil((box.y1 - box.y0 + 2 * pad) * oriented.H));
    if (width > 50 && height > 50) {
      const cropped = await sharp(filePath, { density: 300 }).rotate().extract({ left, top, width, height }).toBuffer();
      image = sharp(cropped);
      srcWidth = width;
      console.log("[aadhaarOcr] card is small in the photo — cropped to it before reading");
    }
  }
  const targetWidth = cardCrop ? Math.max(srcWidth, srcWidth < 1600 ? 2200 : 1600) : Math.max(srcWidth, 1600);
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
// Page 2 of a 2-page Aadhaar PDF (front on page 1, back on page 2) as a
// PNG, or null when the PDF has only one page.
function pdfSecondPageToPngFile(pdfPath, dpi = 300) {
  let doc = null;
  try {
    doc = mupdf.Document.openDocument(fs.readFileSync(pdfPath), "application/pdf");
    if (doc.countPages() < 2) return null;
    const page = doc.loadPage(1);
    try {
      const pixmap = page.toPixmap(mupdf.Matrix.scale(dpi / 72, dpi / 72), mupdf.ColorSpace.DeviceRGB, false, true);
      try {
        const outPath = `${pdfPath}-page2.png`;
        fs.writeFileSync(outPath, pixmap.asPNG());
        return outPath;
      } finally {
        pixmap.destroy();
      }
    } finally {
      page.destroy();
    }
  } catch (err) {
    console.error("[aadhaarOcr] could not read page 2 of PDF:", err.message);
    return null;
  } finally {
    try { doc?.destroy(); } catch { /* ignore */ }
  }
}

function pdfFirstPageToPngFile(pdfPath, dpi = 300) {
  const buffer = fs.readFileSync(pdfPath);
  const doc = mupdf.Document.openDocument(buffer, "application/pdf");
  try {
    const page = doc.loadPage(0);
    try {
      const matrix = mupdf.Matrix.scale(dpi / 72, dpi / 72);
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
 
 
async function readImageText(filePath, workerPromiseOverride, ocrOpts = {}) {
  const worker = await (workerPromiseOverride || getWorker());
 
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
    ocrPath = await preprocessForOcr(sourcePath, ocrOpts);
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
 
// e-Aadhaar letter name. The letter prints:
//     To
//     Gomathi K R            ← holder's name
//     W/o Nagaraju B,        ← husband/father — NEVER the holder's name
//     Vill No 121 ...
// and again in the cut-out card above "DOB:". So: (1) the line just above
// the first S/O-W/O-D/O-C/O line, (2) the name above DOB / the DOB date,
// (3) the lines after "To", always skipping relation lines.
const RELATION_LINE_RE = /^\W*[SDWC]\s*\/\s*O\b/i;
function extractNameFromEAadhaarPdf(lines, dob = "") {
  const relIdx = lines.findIndex((l, i) => i < 40 && RELATION_LINE_RE.test(l));
  if (relIdx > 0) {
    let best = { words: [], score: 0 };
    for (let i = relIdx - 1; i >= Math.max(0, relIdx - 2); i--) {
      if (/^to\b|enrol|authority|government/i.test(lines[i])) break;
      const run = bestNameRunInLine(lines[i]);
      if (run.score > best.score) best = run;
    }
    if (best.score) return best.words.join(" ");
  }

  let anchor = lines.findIndex((l) => /DOB\s*[:\/]|Date of Birth/i.test(l));
  if (anchor === -1 && dob) anchor = lines.findIndex((l) => l.includes(dob));
  const aboveDob = pickNameAboveDob(lines, anchor);
  if (aboveDob) return aboveDob;

  const toIdx = lines.findIndex((l, i) => i < 40 && /^to\b/i.test(l));
  if (toIdx !== -1) {
    let best = { words: [], score: 0 };
    for (let i = toIdx + 1; i <= Math.min(lines.length - 1, toIdx + 3); i++) {
      if (RELATION_LINE_RE.test(lines[i])) break;
      const run = bestNameRunInLine(lines[i]);
      if (run.score > best.score) best = run;
    }
    if (best.score) return best.words.join(" ");
  }
  return "";
}

// OCR misspells state names on the letter ("Kamataka", "Kerla") — snap a
// word that's 1–2 letters away from a single-word state to that state.
function fixStateTypos(text = "") {
  const single = INDIAN_STATES_UTS.filter((x) => !x.includes(" ") && x.length >= 6);
  return text.replace(/\b[A-Za-z]{6,}\b/g, (w) => {
    const lw = w.toLowerCase();
    for (const st of single) {
      const ls = st.toLowerCase();
      if (lw === ls) return w;
      if (Math.abs(lw.length - ls.length) > 2) continue;
      if (levenshtein(lw, ls) <= (ls.length >= 8 ? 2 : 1)) return st;
    }
    return w;
  });
}

// One printed letter line, minus OCR border junk ("Office, |", "B, 1").
// A word worth keeping in a letter address line: "W/O:", "#202",
// "No.12", "3rd", Title/CAPS words, or a single capital initial ("G").
function isLetterAddressToken(t) {
  const core = t.replace(/[,.;:]+$/, "");
  if (!core) return false;
  if (/^[SDWC]\/O:?$/i.test(core)) return true;
  if (/^#?\d+[A-Za-z]?([/\-]\d+[A-Za-z]?)*$/.test(core)) return true;
  if (/^No\.?\d+/i.test(core)) return true;
  if (/^\d+(st|nd|rd|th)$/i.test(core)) return true;
  if (/^[A-Z]$/.test(core)) return true;
  if (/^[A-Z][a-z]+$/.test(core) || /^[A-Z]{2,}$/.test(core)) return core.length <= 3 || looksLikeIndianWord(core);
  return false;
}
function cleanLetterLine(line = "") {
  // The right-hand column (UIDAI instructions) gets glued onto the same
  // OCR line after a " | ", " ! " or " i " — cut there.
  line = line.split(/\s[|!i]\s|\s[|!]$|\si$/)[0];
  const kept = line.split(/\s+/).filter(isLetterAddressToken);
  // Line with no real word or house number = pure junk ("es =) o% Ed").
  if (!kept.some((t) => /[A-Za-z]{3,}|\d/.test(t))) return "";
  return kept.join(" ")
    .replace(/[|!=£§~_^*{}[\]<>]/g, " ")
    .replace(/(^|\s)[.:;'"`]+(?=\s|$)/g, " ")
    .replace(/,\s*[A-Za-z0-9]\s*$/, ",")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,.]+|[\s,]+$/g, "")
    .trim();
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
  text = fixStateTypos(text);
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const name = extractNameFromEAadhaarPdf(lines, findDob(text, lines));
  const { firstName, lastName } = splitIndianName(name);

  const get = (re) => {
    const m = text.match(re);
    return m ? m[1].replace(/\s{2,}/g, " ").trim() : "";
  };
  const vtc = get(/VTC\s*[:\-]?\s*([A-Za-z .]+?)\s*(?:,|\n|$)/i);
  const district = get(/(?<!Sub\s?)District\s*[:\-]?\s*([A-Za-z .]+?)\s*(?:,|\n|$)/i);
  const stateLabel = get(/State\s*[:\-]?\s*([A-Za-z .]+?)\s*(?:,|\n|$)/i);
  const pin = get(/PIN\s*Code\s*[:\-]?\s*(\d{6})/i);

  // Street = from the W/O-S/O line (or the line after "To", minus the
  // name) down to the "VTC:" line.
  const toIdx = lines.findIndex((l, i) => i < 40 && /^to\b/i.test(l));
  const relIdx = lines.findIndex((l, i) => i < 40 && RELATION_LINE_RE.test(l));
  const vtcIdx = lines.findIndex((l) => /VTC\s*[:\-]/i.test(l));
  let street = "";
  const startIdx = relIdx !== -1 ? relIdx : toIdx !== -1 ? toIdx + 1 : -1;
  if (startIdx !== -1 && vtcIdx > startIdx) {
    const escapeRegex = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    street = lines.slice(startIdx, vtcIdx).map(cleanLetterLine).filter(Boolean).join(", ");
    if (name && relIdx === -1) street = street.replace(new RegExp(escapeRegex(name), "i"), "");
    street = street.replace(/,\s*,/g, ",").replace(/^[\s,]+|[\s,]+$/g, "").trim();
  }

  let address = [street, vtc, district, stateLabel, pin].filter(Boolean).join(", ");
  if (!street) {
    const fallback = extractAddressFallbackFromToBlock(lines, toIdx, name);
    if (fallback) address = fallback;
  }
  const addressParts = splitAddressComponents(address);
  // The letter labels these, so trust the labels over the generic split.
  if (district || vtc) addressParts.city = district || vtc;
  if (stateLabel) {
    const canon = INDIAN_STATES_UTS.find((x) => x.toLowerCase() === stateLabel.toLowerCase());
    if (canon) addressParts.state = canon;
  }
  if (pin) addressParts.pincode = pin;
  // Printed letter text is clean — keep it as-is (with "R K", "R T O").
  if (street) {
    const town = vtc && vtc.toLowerCase() !== (district || "").toLowerCase() ? vtc : "";
    addressParts.addressLine1 = [street, town].filter(Boolean).join(", ");
  }
  const mobileMatch = text.match(/Mobile\s*[:\-]?\s*(\d{10})/i);

  return { firstName, lastName, address, addressParts, phone: mobileMatch ? mobileMatch[1] : "" };
}

// Shape check for a real word, lenient enough for Indian names/places with
// consonant clusters ("Shanthi", "Street", "Varalakshmi") but still rejects
// OCR junk ("rrr", "Hmmsd", "XKQZT").
function looksLikeIndianWord(bare) {
  const lower = bare.toLowerCase();
  const vowels = (lower.match(/[aeiouy]/g) || []).length;
  if (vowels / lower.length < 0.2) return false;
  if (/[^aeiouy]{5,}/.test(lower)) return false;
  if (/(.)\1\1/.test(lower)) return false;
  return true;
}

// ── Name helpers (English-only) ─────────────────────────────────────────
// Tesseract runs in English only, so Tamil/Hindi text on the card comes out
// as random Latin junk ("Ny SAN An Sa", "Nc UImbs Beit"). A real English
// name word is Title Case or ALL CAPS, at least 3 letters and vowel-shaped;
// a lone capital (with or without a dot) is an initial.
const NAME_STOP_WORDS = new Set([
  "government", "india", "aadhaar", "unique", "identification", "authority",
  "dob", "date", "birth", "year", "male", "female", "transgender", "issue",
  "proof", "identity", "citizenship", "father", "husband", "mother", "address",
  "enrolment", "download", "mera", "meri", "pehchaan", "pahchan",
]);
function nameTokenKind(tok) {
  // Tokens with brackets/digits/symbols glued on ("EMHE)", "[JHIGEOIT",
  // "S60") are OCR junk, not names.
  const core = tok.replace(/[.,]+$/, "");
  if (!/^[A-Za-z]+(\.[A-Za-z]+)*$/.test(core)) return "noise";
  const bare = core.replace(/\./g, "");
  if (/^[A-Z]$/.test(bare)) return "initial";
  if (/^[A-Z][a-z]$/.test(bare) && bare[0].toLowerCase() === bare[1]) return "initial"; // "Vv" → V
  // "KR", "SK", "MRK" — run-together initials (no vowel, 2–3 capitals).
  if (/^[A-Z]{2,3}$/.test(bare) && !/[AEIOU]/.test(bare)) return "initials";
  if (bare.length < 3) return "noise";
  if (NAME_STOP_WORDS.has(bare.toLowerCase())) return "noise";
  if (!looksLikeIndianWord(bare)) return "noise";
  if (/^[A-Z][a-z]+$/.test(bare)) return "title";
  if (/^[A-Z]+$/.test(bare)) return "caps";
  return "noise";
}
// Best name run in one line: consecutive Title-Case words + initials, or
// consecutive ALL-CAPS words + initials (never mixed, so caps noise next to
// a Title-Case name is dropped). Score = letters in real words.
function bestNameRunInLine(line) {
  // "S.K.Brindha" → "S. K. Brindha"; then split on spaces only, so junk
  // like "S60" stays one (rejected) token instead of becoming initial "S".
  const tokens = line
    .replace(/([A-Za-z])\.(?=[A-Za-z])/g, "$1. ")
    // Initials stuck to the name ("SivaswamiMS" → "Sivaswami M S").
    .replace(/\b([A-Z][a-z]{2,})([A-Z]{1,3})\b/g, (m, w, ini) => `${w} ${ini.split("").join(" ")}`)
    .split(/\s+/)
    .filter(Boolean);
  let best = { words: [], score: 0 };
  for (const style of ["title", "caps"]) {
    let cur = [];
    let score = 0;
    const flush = () => {
      // A run made only of initials isn't a name.
      if (score > 0 && score > best.score) best = { words: cur, score };
      cur = [];
      score = 0;
    };
    for (const tok of tokens) {
      const kind = nameTokenKind(tok);
      if (/^J?[\])]$/.test(tok) && score > 0) {
        // Initial "J" right after a name is often OCR'd as "]" ("Chandrakala ]").
        cur.push("J");
      } else if (kind === "initial") {
        cur.push(tok.replace(/[.,]/g, "").charAt(0).toUpperCase());
      } else if (kind === "initials" && score > 0) {
        // Only after a real name word ("Gomathi KR") — a leading "HB" is
        // usually OCR junk from the photo/border.
        cur.push(...tok.replace(/[.,]/g, "").split(""));
      } else if (kind === style) {
        const w = tok.replace(/[.,]/g, "");
        cur.push(w);
        score += style === "title" ? w.length * 2 : w.length;
      } else {
        flush();
      }
    }
    flush();
  }
  // Trim stray initials glued on by noise beyond 2 at either end.
  return best;
}
function pickNameAboveDob(lines, dobIdx) {
  if (dobIdx === -1) return "";
  let winner = { words: [], score: 0, dist: Infinity };
  for (let i = dobIdx - 1, dist = 1; i >= Math.max(0, dobIdx - 6); i--, dist++) {
    const line = lines[i];
    if (/government|unique identification|authority/i.test(line)) break;
    if (/father|husband|\b[sdwc]\s*\/\s*o\b/i.test(line)) continue;
    const run = bestNameRunInLine(line);
    if (!run.score) continue;
    // Longer real name wins; on a tie the line closest to DOB wins.
    if (run.score > winner.score || (run.score === winner.score && dist < winner.dist)) {
      winner = { ...run, dist };
    }
  }
  return winner.words.join(" ");
}
// First / last name rules:
//   "Balameena"        → Balameena / Balameena
//   "S.Brindha"        → S / Brindha
//   "S.K.Brindha"      → S K / Brindha
//   "Brindha S"        → Brindha / S
//   "Brindha S K"      → Brindha / S K
//   "Geetha Sankaram"  → Geetha / Sankaram
function splitIndianName(fullName = "") {
  const tokens = fullName.replace(/\./g, ". ").split(/\s+/).map((t) => t.replace(/\./g, "")).filter(Boolean);
  if (tokens.length === 0) return { firstName: "", lastName: "" };
  if (tokens.length === 1) return { firstName: tokens[0], lastName: tokens[0] };
  const isInitial = (t) => /^[A-Za-z]$/.test(t);
  let lead = 0;
  while (lead < tokens.length && isInitial(tokens[lead])) lead++;
  if (lead > 0 && lead < tokens.length) {
    return { firstName: tokens.slice(0, lead).join(" ").toUpperCase(), lastName: tokens.slice(lead).join(" ") };
  }
  let trail = 0;
  while (trail < tokens.length && isInitial(tokens[tokens.length - 1 - trail])) trail++;
  if (trail > 0 && trail < tokens.length) {
    return {
      firstName: tokens.slice(0, tokens.length - trail).join(" "),
      lastName: tokens.slice(tokens.length - trail).join(" ").toUpperCase(),
    };
  }
  return { firstName: tokens[0], lastName: tokens.slice(1).join(" ") };
}
// DOB even when OCR splits "DOB :" and the date onto different lines.
function findDob(text, lines) {
  const labelled = text.match(/(?:DOB|D\.O\.B|Date of Birth)\s*[:\-]?\s*(\d{2}[/\-.]\d{2}[/\-.]\d{4})/i);
  if (labelled) return labelled[1];
  // OCR turns "/" into "1", "l", "I" or "|" ("DOB: 29111/1955" = 29/11/1955).
  const fuzzy = text.match(/(?:DOB|D\.O\.B|Date of Birth)\s*[:\-]?\s*(\d{2})\s*[/\-.1lI|]?\s*(\d{2})\s*[/\-.1lI|]\s*(\d{4})/i);
  if (fuzzy) {
    const [, d, m, y] = fuzzy;
    if (+d >= 1 && +d <= 31 && +m >= 1 && +m <= 12 && +y >= 1900 && +y <= new Date().getFullYear()) {
      return `${d}/${m}/${y}`;
    }
  }
  const thisYear = new Date().getFullYear();
  const okYear = (d) => {
    const y = Number(d.slice(-4));
    return y >= 1900 && y <= thisYear;
  };
  const dobIdx = lines.findIndex((l) => /DOB|D\.O\.B|Date of Birth/i.test(l));
  if (dobIdx !== -1) {
    for (const i of [dobIdx, dobIdx - 1, dobIdx + 1, dobIdx - 2, dobIdx + 2]) {
      const m = lines[i]?.match(/\b(\d{2}[/\-.]\d{2}[/\-.]\d{4})\b/);
      if (m && okYear(m[1]) && !/issue/i.test(lines[i])) return m[1];
    }
  }
  for (const l of lines) {
    if (/issue|download|generat/i.test(l)) continue;
    const m = l.match(/\b(\d{2}[/\-.]\d{2}[/\-.]\d{4})\b/);
    if (m && okYear(m[1])) return m[1];
  }
  return "";
}

// OCR writes "S/O" as "S /O", "S|O", "5/0", "S/0" — make it "S/O" so the
// address start is found and doesn't come out as a stray "O:".
function normalizeRelation(text = "") {
  // "Address:" misread ("addrass/O:", "AddresgaW/O:", "Adress") → "Address: "
  text = text.replace(
    /\b[Aa][Dd][Dd]?[Rr][AaEe][Ss][Ss]?[a-z]{0,2}?\s*[:;.]?\s*(?=[SDWC]\s*\/\s*O\b|\/\s*O\b|[A-Z0-9])/g,
    "Address: ",
  );
  // Relation letter eaten by the label ("addrass/O: Sankar") — drop the
  // orphan "/O:" rather than guess S/W/D/C.
  text = text.replace(/Address:\s*\/\s*[O0]\s*[:.]?\s*/g, "Address: ");
  text = text.replace(/(^|\n)([^A-Za-z0-9\n]*)([SDWC0])([O0])\s*:/g, (m, nl, pre, c) =>
    `${nl}${pre}${c === "0" ? "D" : c}/O:`);
  return text.replace(/(^|[^A-Za-z0-9])([SDWC50])\s*[\/|]\s*([O0])(?=\s*[:.,]|\s)/gi, (m, pre, c, o) =>
    `${pre}${c === "5" ? "S" : c === "0" ? "D" : c}/${o === "0" ? "O" : o}`);
}

// State from the pincode's first digits (India Post zones). Used when OCR
// couldn't read the state, and to catch a state that disagrees with the PIN.
const PIN_PREFIX_STATE = [
  [[11, 11], "Delhi"], [[12, 13], "Haryana"], [[14, 15], "Punjab"], [[17, 17], "Himachal Pradesh"],
  [[18, 19], "Jammu And Kashmir"], [[30, 34], "Rajasthan"], [[36, 39], "Gujarat"],
  [[40, 44], "Maharashtra"], [[45, 48], "Madhya Pradesh"], [[49, 49], "Chhattisgarh"],
  [[50, 50], "Telangana"], [[51, 53], "Andhra Pradesh"], [[56, 59], "Karnataka"],
  [[60, 64], "Tamil Nadu"], [[67, 69], "Kerala"], [[70, 74], "West Bengal"],
  [[75, 77], "Odisha"], [[78, 78], "Assam"],
];
// Pincode → [district, state] from the India Post directory, shipped as
// data/pincodeDistricts.json (~300 KB, loaded once).
let PIN_TABLE = null;
function districtFromPincode(pin = "") {
  if (!/^[1-9]\d{5}$/.test(pin)) return null;
  if (!PIN_TABLE) {
    try {
      PIN_TABLE = JSON.parse(fs.readFileSync(new URL("../data/pincodeDistricts.json", import.meta.url), "utf8"));
    } catch (err) {
      console.error("[aadhaarOcr] pincode table missing (data/pincodeDistricts.json):", err.message);
      PIN_TABLE = { pins: {}, districts: [], states: [] };
    }
  }
  const v = PIN_TABLE.pins[pin];
  if (v === undefined) return null;
  return { district: PIN_TABLE.districts[Math.floor(v / 100)], state: PIN_TABLE.states[v % 100] };
}

function stateFromPincode(pin = "") {
  if (!/^[1-9]\d{5}$/.test(pin)) return "";
  if (/^6050(0|1)\d$/.test(pin) || /^533464$/.test(pin) || /^6091(0|1)\d$/.test(pin)) return "Puducherry";
  const two = Number(pin.slice(0, 2));
  const hit = PIN_PREFIX_STATE.find(([[lo, hi]]) => two >= lo && two <= hi);
  return hit ? hit[1] : "";
}

function parseAadhaarText(text = "") {
  text = normalizeRelation(text);
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const yobMatch = text.match(/(?:Year of Birth|YOB)\s*[:\-]?\s*(\d{4})/i);
  let age = "", dob = findDob(text, lines);
  if (dob) { age = calcAge(dob); }
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
 
  const dobIdx = lines.findIndex((l) => /DOB|D\.O\.B|Year of Birth|YOB|Date of Birth/i.test(l));
  // DOB line itself sometimes loses the "DOB" word; fall back to the date line.
  const anchorIdx = dobIdx !== -1 ? dobIdx : lines.findIndex((l) => dob && l.includes(dob));
  const fullName = pickNameAboveDob(lines, anchorIdx);
  const { firstName, lastName } = splitIndianName(fullName);
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
  // Skip the 16-digit VID ("VID : 9100 8113 0273 0000") — its first 12
  // digits look like an Aadhaar number.
  const cleaned = text
    .split("\n")
    .filter((l) => !/\bVID\b/i.test(l))
    .join("\n");
  const candidates = cleaned.match(/(?<![\d\s-]\d|\d)\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b(?![\s-]?\d)/g) || [];
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
// One word of an address that looks real: a number/house no ("15", "3rd",
// "No.15", "1/24", "W/O"), a kept abbreviation, or a Title-Case/ALL-CAPS
// word of 3+ letters that's shaped like a real word. Mixed junk like
// "A530", "THe", lowercase "ry"/"aan" fails.
function isGoodAddressToken(t, keepShort) {
  if (!t) return false;
  const clean = t.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9.]+$/g, "");
  if (!clean) return false;
  if (/^[SDWC]\/O:?$/i.test(t)) return true;
  if (/^(No\.?)?\d+([/\-]\d+)*(st|nd|rd|th)?\.?$/i.test(clean)) return true;
  if (/^No\.?\d+/i.test(clean)) return true;
  const bare = clean.replace(/\./g, "");
  if (keepShort.has(bare.toLowerCase())) return true;
  if (bare.length < 3 || /\d/.test(bare)) return false;
  // Title Case / ALL CAPS words, or lowercase village names of 5+ letters
  // ("thopanandal") — cards sometimes print those in lowercase.
  if (!(/^[A-Z][a-z]+$/.test(bare) || /^[A-Z]+$/.test(bare) || /^[a-z]{5,}$/.test(bare))) return false;
  return looksLikeIndianWord(bare);
}

// Splits one OCR'd address into: full street address (one line, not
// split further), city, state and pincode.
//   • pincode = last 6-digit number
//   • state   = Indian state name anywhere in the text, even when OCR junk
//               sits between its words ("Tamil oo AT Lad, 8 Nadu")
//   • city    = "DIST:/District:" label if printed, else the segment just
//               before the state (Aadhaar prints District right before State)
//   • rest    = everything before the city, junk tokens removed
function splitAddressComponents(addr = "") {
  const out = { addressLine1: "", addressLine2: "", city: "", state: "", pincode: "" };
  if (!addr) return out;
  let text = addr.replace(/\s*\n\s*/g, ", ");
  // The real address starts at "C/O:", "S/O:", "W/O:", "D/O:" when the card
  // prints one — anything OCR'd before it is background/Tamil junk.
  const relMatch = text.match(/\b[SDWC]\s*\/\s*O\b/i);
  if (relMatch) text = text.slice(relMatch.index);

  // Pincode
  const pins = [...text.matchAll(/\b(\d{6})\b/g)];
  if (pins.length) {
    const last = pins[pins.length - 1];
    out.pincode = last[1];
    text = text.slice(0, last.index);
  }

  // State (longest names first so "West Bengal" beats "Bengal"-like hits)
  const escapeRegex = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const sortedStates = [...INDIAN_STATES_UTS].sort((x, y) => y.length - x.length);
  let stateAt = -1;
  for (const state of sortedStates) {
    const re = new RegExp(`\\b${state.split(" ").map(escapeRegex).join("[\\s\\S]{0,25}?")}\\b`, "gi");
    const hits = [...text.matchAll(re)];
    if (hits.length) {
      const h = hits[hits.length - 1];
      if (h.index > stateAt) {
        stateAt = h.index;
        out.state = state;
      }
    }
  }
  // Second line of the state lost ("Kancheepuram, Tamil" + PIN line
  // unreadable): a distinctive first word is enough.
  if (stateAt === -1) {
    const PARTIAL = { tamil: "Tamil Nadu", andhra: "Andhra Pradesh", arunachal: "Arunachal Pradesh",
      himachal: "Himachal Pradesh", madhya: "Madhya Pradesh", jammu: "Jammu And Kashmir" };
    const hits = [...text.matchAll(/\b(Tamil|Andhra|Arunachal|Himachal|Madhya|Jammu)\b/gi)];
    if (hits.length) {
      const h = hits[hits.length - 1];
      stateAt = h.index;
      out.state = PARTIAL[h[1].toLowerCase()];
    }
  }
  if (stateAt !== -1) {
    // Words on the same line/segment just before the state are junk
    // ("SOBEENILSE ny Tamil Nadu") — District is printed on its own before it.
    const cut = text.lastIndexOf(",", stateAt);
    text = text.slice(0, cut === -1 ? stateAt : cut);
  }

  // City from a printed District label
  const distMatch = text.match(/\b(?:DIST|District)\s*[:.\-]\s*([A-Za-z][A-Za-z .]+?)\s*(?:,|$)/i);
  if (distMatch) {
    out.city = distMatch[1].trim();
    text = text.slice(0, distMatch.index) + text.slice(distMatch.index + distMatch[0].length);
  }

  // Clean each comma segment: drop labels (PO:, VTC:, Sub District:),
  // stray symbols and 2-letter OCR junk; keep "No.15", "3rd", "W/O".
  const KEEP_SHORT = new Set(["no", "rd", "st", "dr", "nr", "po", "ps", "ho"]);
  let segments = text
    .split(",")
    // Drop a whole segment when most of its words are junk ("ry Ses A530",
    // "SOBEENILSE ny") — better to lose a little than fill the form with noise.
    .filter((seg) => {
      const toks = seg.replace(/\b(?:PO|P\.O|VTC|Sub\s*District|Post)\s*[:.\-]\s*/gi, "").split(/\s+/).filter(Boolean);
      if (!toks.length) return false;
      const goodToks = toks.filter((t) => isGoodAddressToken(t, KEEP_SHORT));
      // Keep if mostly real, or if it has one solid place word ("RR Kidampalayam").
      return goodToks.length / toks.length >= 0.6 || goodToks.some((t) => /[A-Za-z]{5,}/.test(t));
    })
    .map((seg) =>
      seg
        .replace(/\b(?:PO|P\.O|VTC|Sub\s*District|Post)\s*[:.\-]\s*/gi, "")
        .replace(/[+:;|£€$#@!?=~_*^<>{}\[\]§]/g, " ")
        .split(/\s+/)
        .filter((t) => isGoodAddressToken(t, KEEP_SHORT))
        .join(" ")
        .trim(),
    )
    .filter(Boolean);

  // City from the segment just before the state (only place-name words).
  if (!out.city && out.state) {
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i];
      const ok =
        /^[A-Za-z][A-Za-z .-]*$/.test(seg) &&
        (seg.match(/[A-Za-z]{4,}/g) || []).some((w) => /^[A-Z]/.test(w) && looksLikeIndianWord(w));
      segments.splice(i, 1);
      if (ok) {
        out.city = seg;
        break;
      }
    }
  }
  if (out.city) {
    out.city = out.city
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  // Remove repeated segments (e.g. "Vengikkal, Vengikkal") and the city
  // repeated inside the street part; keep the address as ONE line.
  const seen = new Set();
  segments = segments.filter((seg) => {
    const key = seg.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  out.addressLine1 = segments.join(", ");
  return out;
}
 
// Address — progressively looser fallbacks, all anchored on the 6-digit PIN.
function extractAddress(text = "") {
  // Front side has no address — only read one when the card says so, else a
  // random 6-digit number in the noise becomes a fake pincode.
  if (!/Address|\b[SDWC]\s*\/\s*O\b/i.test(text)) return "";
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

  // No PIN read at all (blurred/cut off): take the lines after the
  // "Address" / S/O-W/O-D/O-C/O label, stopping at the footer.
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const startIdx = lines.findIndex((l) => /Address\s*[:.]|\b[SDWC]\s*\/\s*O\b/i.test(l));
  if (startIdx !== -1) {
    const block = [];
    for (let i = startIdx; i < Math.min(lines.length, startIdx + 6); i++) {
      if (i > startIdx && /uidai|help@|www\.|1947|\b\d{4}\s?\d{4}\s?\d{4}\b/i.test(lines[i])) break;
      block.push(i === startIdx ? lines[i].replace(/^.*?(Address\s*[:.]\s*|(?=\b[SDWC]\s*\/\s*O\b))/i, "") : lines[i]);
    }
    const joined = cleanAddressNoise(block.join(", "));
    if (joined) {
      console.log("[extractAddress] no PIN found — using Address-label block");
      return joined;
    }
  }

  return "";
}
function mergeSides(front, back) {
  // Back side normally carries the address; but on an e-Aadhaar letter the
  // front has the labelled address and the back is UIDAI boilerplate, so
  // prefer whichever side actually found a state.
  const hasState = (x) => !!(x.address && x.state);
  const addrSource = hasState(back) ? back : hasState(front) ? front : back.address ? back : front.address ? front : back;
  return {
    firstName: front.firstName || back.firstName || "",
    lastName: front.lastName || back.lastName || "",
    age: front.age || back.age || "",
    dob: front.dob || back.dob || "",
    gender: front.gender || back.gender || "",
    phone: front.phone || back.phone || "",
    aadhaarNumber: front.aadhaarNumber || back.aadhaarNumber || "",
    address: addrSource.address || "",
    addressLine1: addrSource.addressLine1 || "",
    addressLine2: addrSource.addressLine2 || "",
    city: addrSource.city || "",
    state: addrSource.state || "",
    pincode: addrSource.pincode || "",
  };
}
 
// ── Aadhaar QR code ───────────────────────────────────────────────────
// The QR printed on the card is exact data signed by UIDAI, so when it can
// be read it beats OCR. Two formats exist:
//   • Secure QR (2018+): a long decimal number → bytes → gzip → fields
//     separated by byte 255.
//   • Old QR (pre-2018): plain XML <PrintLetterBarcodeData name=".." .../>.
// Only the last 4 digits of the Aadhaar number are in the Secure QR.

// ZXing (WebAssembly) reads the dense Aadhaar Secure QR far better than
// jsQR. Loaded lazily from the local package (no CDN); if the package isn't
// installed, jsQR alone is used.
let zxingReady = null;
function getZxing() {
  if (!zxingReady) {
    zxingReady = import("zxing-wasm/reader")
      .then((mod) => {
        const wasmPath = require.resolve("zxing-wasm/reader/zxing_reader.wasm");
        mod.prepareZXingModule({ overrides: { wasmBinary: fs.readFileSync(wasmPath) }, fireImmediately: true });
        return mod;
      })
      .catch((err) => {
        console.error("[aadhaarQr] zxing-wasm not available, using jsQR only:", err.message);
        return null;
      });
  }
  return zxingReady;
}
async function scanQrWithZxing(source) {
  const zx = await getZxing();
  if (!zx) return null;
  try {
    const { data, info } = await sharp(source).rotate()
      .resize({ width: 3000, height: 3000, fit: "inside", withoutEnlargement: true })
      .toColourspace("srgb").ensureAlpha().raw({ depth: "uchar" })
      .toBuffer({ resolveWithObject: true });
    const results = await zx.readBarcodes(
      { data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), width: info.width, height: info.height, colorSpace: "srgb" },
      { formats: ["QRCode"], tryHarder: true, maxNumberOfSymbols: 4 },
    );
    for (const r of results) {
      const code = { data: r.text || "" };
      if (r.isValid && isAadhaarQrPayload(code)) return code;
    }
  } catch (err) {
    console.error("[aadhaarQr] zxing read failed:", err.message);
  }
  return null;
}

async function scanQrFromImage(filePath) {
  let source = filePath;
  let tmpPng = null;
  try {
    if (isPdfFile(filePath)) {
      tmpPng = pdfFirstPageToPngFile(filePath, 400);
      source = tmpPng;
    }
    const zxCode = await scanQrWithZxing(source);
    if (zxCode) return zxCode;
    const meta = await sharp(source).rotate().metadata();
    const longSide = Math.max(meta.width || 0, meta.height || 0);
    // Try a few sizes: dense Secure QRs need resolution, but very large
    // phone photos decode faster and better when scaled down.
    const sizes = [...new Set([Math.min(longSide, 2400), 1800, 1300, 900].filter((s) => s > 0 && s <= longSide))];
    for (const size of sizes) {
      for (const boost of [false, true]) {
        let img = sharp(source).rotate().resize({ width: size, height: size, fit: "inside" });
        if (boost) img = img.grayscale().normalize().sharpen();
        const { data, info } = await img.toColourspace("srgb").ensureAlpha().raw({ depth: "uchar" }).toBuffer({ resolveWithObject: true });
        if (data.length !== info.width * info.height * 4) continue;
        const code = jsQR(new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), info.width, info.height, {
          inversionAttempts: "attemptBoth",
        });
        if (isAadhaarQrPayload(code)) return code;
      }
    }
    // e-Aadhaar letters / full-page scans have 2–3 QR codes on one page,
    // which confuses the whole-image scan. Scan overlapping tiles instead.
    return await scanQrTiles(source, meta);
  } finally {
    if (tmpPng) fs.unlink(tmpPng, () => {});
  }
}

// Only a long decimal number (Secure QR) or the old XML QR is an Aadhaar
// QR — a small QR like a website link is ignored so scanning goes on.
function isAadhaarQrPayload(code) {
  const txt = (code?.data || "").trim();
  return /^\d{200,}$/.test(txt) || /PrintLetterBarcodeData/i.test(txt);
}

async function scanQrTiles(source, meta) {
  const W = meta.width || 0, H = meta.height || 0;
  if (!W || !H) return null;
  for (const grid of [2, 3]) {
    const tw = Math.round((W / grid) * 1.5), th = Math.round((H / grid) * 1.5);
    const stepX = grid > 1 ? (W - Math.min(tw, W)) / (grid - 1) : 0;
    const stepY = grid > 1 ? (H - Math.min(th, H)) / (grid - 1) : 0;
    for (let gy = 0; gy < grid; gy++) {
      for (let gx = 0; gx < grid; gx++) {
        const left = Math.round(gx * stepX), top = Math.round(gy * stepY);
        const width = Math.min(tw, W - left), height = Math.min(th, H - top);
        try {
          const { data, info } = await sharp(source)
            .rotate()
            .extract({ left, top, width, height })
            .resize({ width: Math.min(width, 1600), height: Math.min(height, 1600), fit: "inside" })
            .toColourspace("srgb").ensureAlpha().raw({ depth: "uchar" })
            .toBuffer({ resolveWithObject: true });
          if (data.length !== info.width * info.height * 4) continue;
          const code = jsQR(new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), info.width, info.height, {
            inversionAttempts: "attemptBoth",
          });
          if (isAadhaarQrPayload(code)) return code;
        } catch { /* try next tile */ }
      }
    }
  }
  return null;
}

function decimalStringToBytes(str) {
  let n = BigInt(str);
  const bytes = [];
  while (n > 0n) {
    bytes.unshift(Number(n & 255n));
    n >>= 8n;
  }
  return Buffer.from(bytes);
}

function decompressAny(buf) {
  for (const fn of [zlib.gunzipSync, zlib.inflateSync, zlib.inflateRawSync]) {
    try {
      return fn(buf);
    } catch {
      /* try the next format */
    }
  }
  return null;
}

function normaliseQrDob(raw = "") {
  const m = String(raw).match(/^(\d{2})[-/.](\d{2})[-/.](\d{4})$/);
  if (m) return `${m[1]}/${m[2]}/${m[3]}`;
  const iso = String(raw).match(/^(\d{4})[-/.](\d{2})[-/.](\d{2})$/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return "";
}

const QR_GENDER = { M: "Male", F: "Female", T: "Other" };

// Turns decoded QR fields into the same shape parseAadhaarText returns.
function qrFieldsToParsed(f) {
  const { firstName, lastName } = splitIndianName(f.name || "");
  const dob = normaliseQrDob(f.dob);
  let age = dob ? calcAge(dob) : "";
  if (!age && /^\d{4}$/.test(f.yob || "")) age = new Date().getFullYear() - Number(f.yob);
  const careOf = (f.careof || "").trim();
  const street = [careOf, f.house, f.street, f.landmark, f.location].map((x) => (x || "").trim()).filter(Boolean);
  const area = [f.vtc, f.postoffice, f.subdistrict]
    .map((x) => (x || "").trim())
    .filter(Boolean)
    .filter((x, i, arr) => arr.findIndex((y) => y.toLowerCase() === x.toLowerCase()) === i);
  const city = (f.district || "").trim();
  const state = (f.state || "").trim();
  const pincode = (String(f.pincode || "").match(/\d{6}/) || [""])[0];
  const address = [...street, ...area, city, state, pincode].filter(Boolean).join(", ");
  return {
    firstName,
    lastName,
    age,
    dob,
    gender: QR_GENDER[(f.gender || "").trim().toUpperCase().charAt(0)] || "",
    address,
    phone: "",
    aadhaarLast4: (f.last4 || "").replace(/\D/g, "").slice(-4),
    // One address line (house/street/area together), as on the OCR side.
    addressLine1: [...street, ...area].join(", "),
    addressLine2: "",
    city,
    state,
    pincode,
  };
}

function parseSecureQr(numericText) {
  if (!/^\d{50,}$/.test(numericText)) return null;
  const raw = decompressAny(decimalStringToBytes(numericText));
  if (!raw) return null;
  const parts = [];
  let start = 0;
  for (let i = 0; i < raw.length && parts.length < 20; i++) {
    if (raw[i] === 255) {
      parts.push(raw.slice(start, i).toString("utf8"));
      start = i + 1;
    }
  }
  // V2+ starts with "V2"/"V3"; V1 has no version field.
  const off = /^V\d$/.test(parts[0] || "") ? 1 : 0;
  const at = (i) => (parts[i + off] || "").trim();
  return {
    referenceId: at(1),
    last4: at(1).slice(0, 4),
    name: at(2),
    dob: at(3),
    gender: at(4),
    careof: at(5),
    district: at(6),
    landmark: at(7),
    house: at(8),
    location: at(9),
    pincode: at(10),
    postoffice: at(11),
    state: at(12),
    street: at(13),
    subdistrict: at(14),
    vtc: at(15),
  };
}

function parseXmlQr(text) {
  if (!/<\s*PrintLetterBarcodeData/i.test(text)) return null;
  const attr = (k) => {
    const m = text.match(new RegExp(`\\b${k}\\s*=\\s*"([^"]*)"`, "i"));
    return m ? m[1].trim() : "";
  };
  return {
    last4: attr("uid").slice(-4),
    name: attr("name"),
    dob: attr("dob"),
    yob: attr("yob"),
    gender: attr("gender"),
    careof: attr("co"),
    district: attr("dist"),
    landmark: attr("lm"),
    house: attr("house"),
    location: attr("loc"),
    pincode: attr("pc"),
    postoffice: attr("po"),
    state: attr("state"),
    street: attr("street"),
    subdistrict: attr("subdist"),
    vtc: attr("vtc"),
  };
}

// Returns parsed fields from the card's QR, or null when there is no
// readable Aadhaar QR in the image.
async function readAadhaarQr(filePath) {
  try {
    const code = await scanQrFromImage(filePath);
    if (!code) return null;
    const text = (code.data || "").trim();
    const fields = parseSecureQr(text) || parseXmlQr(text);
    if (!fields || !fields.name) return null;
    console.log(`[aadhaarQr] read QR for "${fields.name}"`);
    return qrFieldsToParsed(fields);
  } catch (err) {
    console.error("[aadhaarQr] QR read failed, using OCR only:", err.message);
    return null;
  }
}

// QR values win; OCR fills whatever the QR doesn't carry (full Aadhaar
// number, mobile). The OCR'd Aadhaar number is kept only if its last 4
// digits agree with the QR.
function mergeQrWithOcr(qr, ocr) {
  if (!qr) return ocr;
  const pick = (k) => (qr[k] !== undefined && qr[k] !== "" ? qr[k] : ocr[k] || "");
  let aadhaarNumber = ocr.aadhaarNumber || "";
  if (qr.aadhaarLast4 && aadhaarNumber && !aadhaarNumber.replace(/\D/g, "").endsWith(qr.aadhaarLast4)) {
    aadhaarNumber = "";
  }
  return {
    firstName: pick("firstName"),
    lastName: pick("lastName"),
    age: pick("age"),
    dob: pick("dob"),
    gender: pick("gender"),
    phone: ocr.phone || "",
    aadhaarNumber,
    address: pick("address"),
    addressLine1: pick("addressLine1"),
    addressLine2: pick("addressLine2"),
    city: pick("city"),
    state: pick("state"),
    pincode: pick("pincode"),
    source: "qr",
  };
}

// POST /ocr/aadhaar — multipart: front (required), back (optional)
// The whole read (QR + PDF text / OCR + parsing) for one Aadhaar, with no
// upload and no req/res — used by extractAadhaar and by the accuracy test
// script (scripts/aadhaarAccuracyTest.js).
export async function extractAadhaarFromFiles(frontPath, backPath = null, opts = {}) {
  // One PDF with front on page 1 and back on page 2 (scanned card) — use
  // page 2 as the back side so the address and QR are read too.
  let pdfBackTmp = null;
  if (!backPath && isPdfFile(frontPath)) {
    pdfBackTmp = pdfSecondPageToPngFile(frontPath);
    if (pdfBackTmp) {
      console.log("[aadhaarOcr] PDF has 2 pages — reading page 2 as the back side");
      backPath = pdfBackTmp;
    }
  }
  try {
    return await extractAadhaarFromFilesInner(frontPath, backPath, opts);
  } finally {
    if (pdfBackTmp) fs.unlink(pdfBackTmp, () => {});
  }
}

async function extractAadhaarFromFilesInner(frontPath, backPath = null, opts = {}) {
  // Language chosen in the dropdown wins; then the hint; then Tamil.
  const forcedLang = SUPPORTED_CARD_LANGS.includes(opts.cardLang) ? opts.cardLang : null;
  const hintLang =
    forcedLang || langFromPincode(opts.pincode) || langFromState(opts.state) || DEFAULT_CARD_LANG;
  let cardLang = hintLang;

  // PaddleOCR runs alongside Tesseract (own threads) — start both sides now.
  const paddleBackP = backPath ? readPaddleText(backPath) : Promise.resolve("");
  const paddleFrontP = readPaddleText(frontPath);

  // Back side first (main traveller): read it, then pick the language
  // from the pincode/state printed on it. Re-read only if that language
  // differs from the guess — Tamil cards stay a single pass.
  let backData = {}, backText = "";
  if (backPath) {
    backText = await readAadhaarText(backPath, cardLang);
    backData = parseAadhaarText(backText);
    const detected =
      langFromPincode(backData.pincode) ||
      langFromPincode((backText.match(/\b[1-9]\d{5}\b/g) || []).slice(-1)[0]) ||
      langFromState(backData.state);
    if (!forcedLang && detected && detected !== cardLang) {
      console.log(`[aadhaarOcr] back side says "${detected}" (pincode ${backData.pincode || "?"}), re-reading`);
      cardLang = detected;
      backText = await readAadhaarText(backPath, cardLang);
      backData = parseAadhaarText(backText);
    }
    const paddleBack = await paddleBackP;
    if (paddleBack) {
      backData = mergeOcrParses(backData, parseAadhaarText(paddleBack));
      backText += `\n--- PaddleOCR ---\n${paddleBack}`;
    }
  }

  // Secure QR is usually on the back (newer cards also on the front);
  // try back first, then front.
  let qrData = backPath ? await readAadhaarQr(backPath) : null;
  if (!qrData) qrData = await readAadhaarQr(frontPath);

  let frontText = await readAadhaarText(frontPath, cardLang);
  let frontData = parseAadhaarText(frontText);
  const paddleFront = await paddleFrontP;
  const paddleFrontData = paddleFront ? parseAadhaarText(paddleFront) : null;
  if (paddleFrontData) {
    frontData = mergeOcrParses(frontData, paddleFrontData);
    frontText += `\n--- PaddleOCR ---\n${paddleFront}`;
  }

  // Front only (co-traveller) and the name doesn't look right? The card
  // may be from another state than the main traveller — try the other
  // languages one by one and keep the first that gives a clean name.
  // Skipped when the QR already gave the name.
  if (!forcedLang && !backPath && !qrData?.firstName && !nameLooksSolid(frontData)) {
    for (const lang of SUPPORTED_CARD_LANGS.filter((l) => l !== cardLang)) {
      const text = await readAadhaarText(frontPath, lang);
      const data = paddleFrontData ? mergeOcrParses(parseAadhaarText(text), paddleFrontData) : parseAadhaarText(text);
      if (nameLooksSolid(data)) {
        console.log(`[aadhaarOcr] co-traveller name read with "${lang}" instead of "${cardLang}"`);
        frontText = text;
        frontData = data;
        cardLang = lang;
        break;
      }
    }
  }
  const parsed = mergeQrWithOcr(qrData, mergeSides(frontData, backData));
  const readFrom = qrData ? "qr" : "ocr";
  const stateMismatch = applyPincodeDistrict(parsed, readFrom);
  const reviewFields = fieldsToReview(parsed, readFrom, !!backPath);
  if (stateMismatch) {
    for (const f of ["state", "city", "pincode"]) if (!reviewFields.includes(f)) reviewFields.push(f);
  }
  return { parsed, readFrom, cardLang, frontText, backText, reviewFields };
}

const DISTRICT_ALIASES = [
  ["bengaluru", "bangalore"], ["mysuru", "mysore"], ["chennai", "madras"], ["kolkata", "calcutta"],
  ["mumbai", "bombay"], ["thiruvananthapuram", "trivandrum"], ["puducherry", "pondicherry"],
  ["tiruchirappalli", "trichy", "tiruchirapalli"], ["gurugram", "gurgaon"], ["belagavi", "belgaum"],
  ["kalaburagi", "gulbarga"], ["mangaluru", "mangalore", "dakshina kannada"], ["thoothukudi", "tuticorin"],
  ["kanchipuram", "kancheepuram"], ["prayagraj", "allahabad"], ["visakhapatnam", "vizag", "vishakhapatnam"],
  ["vijayapura", "bijapur"], ["shivamogga", "shimoga"], ["tumakuru", "tumkur"], ["hubballi", "hubli", "dharwad"],
  ["kozhikode", "calicut"], ["thrissur", "trichur"], ["kochi", "cochin", "ernakulam"], ["kollam", "quilon"],
  ["villupuram", "viluppuram"], ["tiruvallur", "thiruvallur"], ["tiruvannamalai", "thiruvannamalai"],
];
function sameDistrict(a = "", b = "") {
  const n = (x) => x.toLowerCase().replace(/[^a-z]/g, "");
  const x = n(a), y = n(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) && x.length - y.length <= 3) return true;
  if (DISTRICT_ALIASES.some((g) => g.map(n).includes(x) && g.map(n).includes(y))) return true;
  return levenshtein(x, y) <= Math.max(1, Math.floor(y.length / 5));
}

function applyPincodeDistrict(parsed, readFrom) {
  let stateMismatch = false;
  // City = DISTRICT and State = state, always from the pincode when the
  // pincode is a real one (India Post directory). Whatever OCR put in city
  // that isn't the district (a village/area like "Moongileripatti") goes
  // back into the address line instead of being lost.
  const pinInfo = readFrom === "qr" && parsed.city && parsed.state ? null : districtFromPincode(parsed.pincode);
  if (pinInfo) {
    const ocrCity = (parsed.city || "").trim();
    // Card prints the new/local name ("Bengaluru") — same district as the
    // directory's "Bangalore": keep the card's spelling, nothing left over.
    if (ocrCity && sameDistrict(ocrCity, pinInfo.district)) {
      parsed.city = ocrCity;
      if (parsed.state && parsed.state.toLowerCase() !== pinInfo.state.toLowerCase()) stateMismatch = true;
      parsed.state = pinInfo.state;
      return stateMismatch;
    }
    const distRe = new RegExp(`\\b${pinInfo.district.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    const leftover = ocrCity.replace(distRe, "").replace(/[^A-Za-z0-9 ]+/g, " ").replace(/\s{2,}/g, " ").trim();
    if (leftover.length >= 3 && !new RegExp(`\\b${leftover}\\b`, "i").test(parsed.addressLine1 || "")) {
      parsed.addressLine1 = [parsed.addressLine1, leftover].filter(Boolean).join(", ");
    }
    parsed.city = pinInfo.district;
    if (parsed.state && parsed.state.toLowerCase() !== pinInfo.state.toLowerCase()) {
      stateMismatch = true; // OCR'd state vs pincode disagree — pincode may be misread
      console.log(`[aadhaarOcr] state "${parsed.state}" ≠ pincode state "${pinInfo.state}" — using pincode`);
    }
    parsed.state = pinInfo.state;
  } else {
    const pinState = stateFromPincode(parsed.pincode);
    if (!parsed.state && pinState) parsed.state = pinState;
    else if (pinState && parsed.state && pinState.toLowerCase() !== parsed.state.toLowerCase()) stateMismatch = true;
  }
  return stateMismatch;
}

// Fields the admin should double-check (shown in yellow on the page).
// QR data is UIDAI's own, so only what the QR doesn't carry is flagged.
function fieldsToReview(p = {}, readFrom = "ocr", hasBack = false) {
  const out = [];
  const fromQr = readFrom === "qr";
  if (!fromQr && !nameLooksSolid(p)) out.push("firstName", "lastName");
  if (!p.firstName) out.includes("firstName") || out.push("firstName");
  if (!p.lastName) out.includes("lastName") || out.push("lastName");
  if (!p.age) out.push("age");
  if (!p.gender) out.push("gender");
  if (hasBack || p.addressLine1 || p.pincode) {
    const line = p.addressLine1 || "";
    const junk =
      /[|=~_^*{}<>%]/.test(line) ||
      /(^|[\s,])[a-z]{1,2}(?=[\s,]|$)/.test(line) ||
      /(^|\s)[.:;]+(\s|,|$)/.test(line);
    if (!line || line.length < 12 || (!fromQr && junk)) out.push("addressLine1");
    if (!p.city) out.push("city");
    if (!p.state) out.push("state");
    if (!/^\d{6}$/.test(p.pincode || "")) out.push("pincode");
    if (!/^\d{10}$/.test(p.phone || "")) out.push("phone");
  }
  return out;
}

export const extractAadhaar = withTempCleanup(async (req, res) => {
  try {
    const frontFile = req.files?.front?.[0];
    const backFile = req.files?.back?.[0];
    if (!frontFile) {
      return res.status(400).json({ success: false, message: "Aadhaar front image is required" });
    }
    const { parsed: merged, readFrom, cardLang, frontText, backText, reviewFields } = await extractAadhaarFromFiles(
      frontFile.path,
      backFile?.path || null,
      { cardLang: req.body?.cardLang, pincode: req.body?.pincode, state: req.body?.state },
    );
    const backUpload = backFile
      ? await cloudinary.uploader.upload(backFile.path, { folder: "aadhaar", resource_type: "image" })
      : null;
    const frontUpload = await cloudinary.uploader.upload(frontFile.path, { folder: "aadhaar", resource_type: "image" });
    return res.status(200).json({
      success: true,
      parsed: merged,
      readFrom,
      reviewFields,
      cardLang,
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
        if (ct.back?.url) {
          docs.push({
            groupId,
            type: "aadhaarBack",
            isCoTraveller: true,
            url: ct.back.url,
            ocrText: ct.back.ocrText || "",
            parsed: { firstName: ct.firstName || "", lastName: ct.lastName || "" },
            uploadedBy: "admin",
          });
        }
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
  let pricedTravellers = 0; // travellers who pay the package (and so the add-ons)
  for (const t of travellers) {
    const age = Number(t.age);
    if (isNaN(age) || age < 1) continue;
    if (age >= 6) pricedTravellers++;
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
 
  // Add-ons are per person — every co-traveller takes the same add-ons as
  // the main traveller, so the add-on amount counts once per traveller.
  const addonsPerPerson = (bookingNotes?.addonsDetail || []).reduce((s, a) => s + (Number(a.amount) || 0), 0);
  total += addonsPerPerson * pricedTravellers;
 
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
        } else {
          // Optional co-traveller back side (uploaded for a different-state
          // co-traveller) — attach to the co-traveller with the same name.
          const nm = (t) => `${t?.firstName || ""} ${t?.lastName || ""}`.trim().toLowerCase();
          const match = [...g.coTravellers].reverse().find((ct) => nm(ct) && nm(ct) === nm(d.parsed));
          if (match && !match.back) match.back = { url: d.url };
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
 
    // Letters only — "Senthil " + "Kumar" (stray space) still matches "Senthil Kumar".
    const nameKey = (x) => [x?.firstName, x?.lastName].filter(Boolean).join("").toLowerCase().replace(/[^a-z]/g, "");
 
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
 
    // Letters only — extra/trailing spaces or dots in a saved name ("Senthil "
    // + "Kumar") must not stop the match with Tour Bookings ("Senthil Kumar").
    const normName = (t) => [t?.firstName, t?.lastName].filter(Boolean).join("").toLowerCase().replace(/[^a-z]/g, "");
 
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
      address, addressLine1, addressLine2, city, state, pincode, front, back, aadhaarNumber,
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
    // Optional back side (different-state co-traveller) — shown on the card
    // and included in the Aadhaar ZIP.
    if (back?.url) {
      await aadhaarModel.create({
        groupId,
        tnr: existing?.tnr || "",
        postBooking: !!existing?.tnr,
        type: "aadhaarBack",
        isCoTraveller: true,
        url: back.url,
        ocrText: back.ocrText || "",
        parsed: { firstName: parsedFields.firstName, lastName: parsedFields.lastName },
        uploadedBy: "admin",
      });
    }
 
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
 
 
    // No duplicate guard here: two different screenshots can share the same
    // amount (e.g. two ₹10,000 instalments) and both must be saved.
 
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
 
// GET /ocr/payment-records?from=YYYY-MM-DD&to=YYYY-MM-DD&type=advance|balance|partial
// Every payment screenshot saved from the Aadhaar Upload page, newest first.
export const getPaymentRecords = async (req, res) => {
  try {
    const { from, to, type } = req.query;
 
    const typeMap = { advance: "paymentAdvance", balance: "paymentBalance", partial: "paymentPartial" };
    const query = {
      type: typeMap[type] ? typeMap[type] : { $in: ["paymentAdvance", "paymentBalance", "paymentPartial"] },
    };
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(`${from}T00:00:00+05:30`);
      if (to) query.createdAt.$lte = new Date(`${to}T23:59:59.999+05:30`);
    }
 
    const payments = await aadhaarModel
      .find(query)
      .select("type amount remarks url createdAt tnr groupId taskCleared uploadedBy")
      .sort({ createdAt: -1 })
      .limit(2000)
      .lean();
 
    const groupIds = [...new Set(payments.map((p) => p.groupId).filter(Boolean))];
    const groupDocs = groupIds.length
      ? await aadhaarModel
        .find({ groupId: { $in: groupIds }, type: { $in: ["aadhaarFront", "bookingNotes"] } })
        .select("groupId tnr type isCoTraveller parsed tourId createdAt")
        .sort({ createdAt: 1 })
        .lean()
      : [];
    const groupInfo = new Map();
    for (const d of groupDocs) {
      const g = groupInfo.get(d.groupId) || { name: "", tourId: null, tnr: "" };
      if (d.tnr) g.tnr = d.tnr;
      if (d.type === "bookingNotes" && d.tourId) g.tourId = String(d.tourId);
      if (d.type === "aadhaarFront" && !d.isCoTraveller && !g.name) {
        g.name = [d.parsed?.title, d.parsed?.firstName, d.parsed?.lastName].filter(Boolean).join(" ");
      }
      groupInfo.set(d.groupId, g);
    }
 
    const tnrs = [
      ...new Set(
        payments
          .map((p) => p.tnr || (p.groupId ? groupInfo.get(p.groupId)?.tnr : ""))
          .filter(Boolean),
      ),
    ];
    const realDocs = tnrs.length
      ? await tourBookingModel.find({ tnr: { $in: tnrs } }).select("tnr tourId travellers createdBy").lean()
      : [];
    const realByTnr = new Map(realDocs.map((b) => [b.tnr, b]));
 
    const tourIds = [
      ...new Set(
        [...groupInfo.values()].map((g) => g.tourId)
          .concat(realDocs.map((b) => (b.tourId ? String(b.tourId) : null)))
          .filter(Boolean),
      ),
    ];
    const tourDocs = tourIds.length ? await tourModel.find({ _id: { $in: tourIds } }).select("title").lean() : [];
    const tourTitleById = new Map(tourDocs.map((t) => [String(t._id), t.title || ""]));
 
    const records = payments.map((p) => {
      const g = p.groupId ? groupInfo.get(p.groupId) : null;
      const tnr = p.tnr || g?.tnr || "";
      const real = tnr ? realByTnr.get(tnr) : null;
      const firstReal = real?.travellers?.[0];
      const realName = firstReal
        ? [firstReal.title, firstReal.firstName, firstReal.lastName].filter(Boolean).join(" ")
        : "";
      const tourId = g?.tourId || (real?.tourId ? String(real.tourId) : null);
      return {
        _id: p._id,
        type: p.type === "paymentAdvance" ? "advance" : p.type === "paymentBalance" ? "balance" : "partial",
        amount: p.amount ?? null,
        remarks: p.remarks || "",
        url: p.url,
        createdAt: p.createdAt,
        tnr,
        groupId: p.groupId || null,
        name: g?.name || realName || "",
        tourId,
        tourTitle: tourId ? tourTitleById.get(tourId) || "" : "",
        bookingSource: real?.createdBy === "user" ? "user" : "admin",
        taskCleared: !!p.taskCleared,
      };
    });
 
    return res.status(200).json({ success: true, records });
  } catch (error) {
    console.error("getPaymentRecords error:", error);
    return res.status(500).json({ success: false, message: "Could not load payment records.", error: error.message });
  }
};