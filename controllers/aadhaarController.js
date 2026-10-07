import { v2 as cloudinary } from "cloudinary";
import { createWorker } from "tesseract.js";

let workerPromise;
function getWorker() {
  if (!workerPromise) workerPromise = createWorker("eng");
  return workerPromise;
}
async function readImageText(filePath) {
  const worker = await getWorker();
  const { data: { text } } = await worker.recognize(filePath);
  return text;
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
  const phone = (text.match(/\b[6-9]\d{9}\b/) || [""])[0];
  const addrMatch = text.match(/Address[:\s]*([\s\S]*?\b\d{6}\b)/i);
  const address = addrMatch ? addrMatch[1].replace(/\s*\n\s*/g, ", ").trim() : "";
  return { firstName, lastName, age, dob, gender, address, phone };
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