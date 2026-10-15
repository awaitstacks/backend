// // // // middlewares/multer.js
// // // import multer from "multer";
// // // import path from "path";
// // // import fs from "fs"; // ← ADD THIS IMPORT

// // // // ────────────────────────────────────────────────
// // // // Existing code (DO NOT TOUCH)
// // // // ────────────────────────────────────────────────
// // // const storage = multer.diskStorage({
// // //   filename: (req, file, callback) => {
// // //     callback(null, file.originalname);
// // //   },
// // // });

// // // const upload = multer({ storage });

// // // const tourUpload = upload.fields([
// // //   { name: "mapImage", maxCount: 1 },
// // //   { name: "titleImage", maxCount: 1 },
// // //   { name: "galleryImages", maxCount: 3 },
// // // ]);

// // // // ────────────────────────────────────────────────
// // // // Dedicated multer for payment QR uploads – auto-create folder
// // // // ────────────────────────────────────────────────
// // // const paymentQrDir = "uploads/temp/payment-qr/";

// // // // Auto-create folder if missing (safe & idempotent)
// // // if (!fs.existsSync(paymentQrDir)) {
// // //   fs.mkdirSync(paymentQrDir, { recursive: true });
// // //   console.log(`Created missing upload folder: ${paymentQrDir}`);
// // // }

// // // const paymentQrStorage = multer.diskStorage({
// // //   destination: (req, file, cb) => {
// // //     cb(null, paymentQrDir);
// // //   },
// // //   filename: (req, file, cb) => {
// // //     const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
// // //     cb(null, uniqueName);
// // //   },
// // // });

// // // const paymentFileFilter = (req, file, cb) => {
// // //   if (file.mimetype.startsWith("image/")) {
// // //     cb(null, true);
// // //   } else {
// // //     cb(new Error("Only image files are allowed for QR code"), false);
// // //   }
// // // };

// // // const paymentQrUpload = multer({
// // //   storage: paymentQrStorage,
// // //   fileFilter: paymentFileFilter,
// // //   limits: { fileSize: 5 * 1024 * 1024 },
// // // }).single("qrImage");

// // // export { upload, tourUpload, paymentQrUpload };


// // // middlewares/multer.js
// // import multer from "multer";
// // import path from "path";
// // import fs from "fs"; // ← ADD THIS IMPORT

// // // ────────────────────────────────────────────────
// // // Existing code (DO NOT TOUCH)
// // // ────────────────────────────────────────────────
// // const storage = multer.diskStorage({
// //   filename: (req, file, callback) => {
// //     callback(null, file.originalname);
// //   },
// // });

// // const upload = multer({ storage });

// // const tourUpload = upload.fields([
// //   { name: "mapImage", maxCount: 1 },
// //   { name: "titleImage", maxCount: 1 },
// //   { name: "galleryImages", maxCount: 3 },
// // ]);

// // // ────────────────────────────────────────────────
// // // Dedicated multer for payment QR uploads – auto-create folder
// // // ────────────────────────────────────────────────
// // const paymentQrDir = "uploads/temp/payment-qr/";

// // // Auto-create folder if missing (safe & idempotent)
// // if (!fs.existsSync(paymentQrDir)) {
// //   fs.mkdirSync(paymentQrDir, { recursive: true });
// //   console.log(`Created missing upload folder: ${paymentQrDir}`);
// // }

// // const paymentQrStorage = multer.diskStorage({
// //   destination: (req, file, cb) => {
// //     cb(null, paymentQrDir);
// //   },
// //   filename: (req, file, cb) => {
// //     const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
// //     cb(null, uniqueName);
// //   },
// // });

// // const paymentFileFilter = (req, file, cb) => {
// //   if (file.mimetype.startsWith("image/")) {
// //     cb(null, true);
// //   } else {
// //     cb(new Error("Only image files are allowed for QR code"), false);
// //   }
// // };

// // const paymentQrUpload = multer({
// //   storage: paymentQrStorage,
// //   fileFilter: paymentFileFilter,
// //   limits: { fileSize: 5 * 1024 * 1024 },
// // }).single("qrImage");

// // // ────────────────────────────────────────────────
// // // Dedicated multer for staff photo uploads – auto-create folder
// // // ────────────────────────────────────────────────
// // const staffPhotoDir = "uploads/temp/staff-photo/";

// // // Auto-create folder if missing (safe & idempotent)
// // if (!fs.existsSync(staffPhotoDir)) {
// //   fs.mkdirSync(staffPhotoDir, { recursive: true });
// //   console.log(`Created missing upload folder: ${staffPhotoDir}`);
// // }

// // const staffPhotoStorage = multer.diskStorage({
// //   destination: (req, file, cb) => {
// //     cb(null, staffPhotoDir);
// //   },
// //   filename: (req, file, cb) => {
// //     const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
// //     cb(null, uniqueName);
// //   },
// // });

// // const staffPhotoFilter = (req, file, cb) => {
// //   if (file.mimetype.startsWith("image/")) {
// //     cb(null, true);
// //   } else {
// //     cb(new Error("Only image files are allowed for staff photo"), false);
// //   }
// // };

// // const staffPhotoUpload = multer({
// //   storage: staffPhotoStorage,
// //   fileFilter: staffPhotoFilter,
// //   limits: { fileSize: 5 * 1024 * 1024 },
// // }).single("photo");

// // // ────────────────────────────────────────────────
// // // Dedicated multer for query attachments (image / pdf) – auto-create folder
// // // ────────────────────────────────────────────────
// // const queryFileDir = "uploads/temp/query-files/";

// // if (!fs.existsSync(queryFileDir)) {
// //   fs.mkdirSync(queryFileDir, { recursive: true });
// //   console.log(`Created missing upload folder: ${queryFileDir}`);
// // }

// // const queryFileStorage = multer.diskStorage({
// //   destination: (req, file, cb) => {
// //     cb(null, queryFileDir);
// //   },
// //   filename: (req, file, cb) => {
// //     const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
// //     cb(null, uniqueName);
// //   },
// // });

// // // Type (jpg/png/webp/pdf) and 5 MB check controller la nadakkum —
// // // adhanala error JSON ah frontend ku correct ah pogum.
// // // Inga 10 MB safety limit mattum.
// // const queryUpload = multer({
// //   storage: queryFileStorage,
// //   limits: { fileSize: 10 * 1024 * 1024 },
// // }).fields([{ name: "attachments", maxCount: 5 }]);

// // export { upload, tourUpload, paymentQrUpload, staffPhotoUpload, queryUpload };

// // middlewares/multer.js
// import multer from "multer";
// import path from "path";
// import fs from "fs"; // ← ADD THIS IMPORT

// // ────────────────────────────────────────────────
// // Existing code (DO NOT TOUCH)
// // ────────────────────────────────────────────────
// const storage = multer.diskStorage({
//   filename: (req, file, callback) => {
//     callback(null, file.originalname);
//   },
// });

// const upload = multer({ storage });

// const tourUpload = upload.fields([
//   { name: "mapImage", maxCount: 1 },
//   { name: "titleImage", maxCount: 1 },
//   { name: "galleryImages", maxCount: 3 },
// ]);

// // ────────────────────────────────────────────────
// // Dedicated multer for payment QR uploads – auto-create folder
// // ────────────────────────────────────────────────
// const paymentQrDir = "uploads/temp/payment-qr/";

// // Auto-create folder if missing (safe & idempotent)
// if (!fs.existsSync(paymentQrDir)) {
//   fs.mkdirSync(paymentQrDir, { recursive: true });
//   console.log(`Created missing upload folder: ${paymentQrDir}`);
// }

// const paymentQrStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, paymentQrDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
//     cb(null, uniqueName);
//   },
// });

// const paymentFileFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith("image/")) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only image files are allowed for QR code"), false);
//   }
// };

// const paymentQrUpload = multer({
//   storage: paymentQrStorage,
//   fileFilter: paymentFileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 },
// }).single("qrImage");

// // ────────────────────────────────────────────────
// // Dedicated multer for staff photo uploads – auto-create folder
// // ────────────────────────────────────────────────
// const staffPhotoDir = "uploads/temp/staff-photo/";

// // Auto-create folder if missing (safe & idempotent)
// if (!fs.existsSync(staffPhotoDir)) {
//   fs.mkdirSync(staffPhotoDir, { recursive: true });
//   console.log(`Created missing upload folder: ${staffPhotoDir}`);
// }

// const staffPhotoStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, staffPhotoDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
//     cb(null, uniqueName);
//   },
// });

// const staffPhotoFilter = (req, file, cb) => {
//   // photo must be an image; resume must be a PDF or Word document
//   if (file.fieldname === "resume") {
//     const okResume =
//       file.mimetype === "application/pdf" ||
//       file.mimetype === "application/msword" ||
//       file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
//     if (okResume) cb(null, true);
//     else cb(new Error("Resume must be a PDF or Word document"), false);
//     return;
//   }
//   if (file.mimetype.startsWith("image/")) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only image files are allowed for staff photo"), false);
//   }
// };

// const staffPhotoUpload = multer({
//   storage: staffPhotoStorage,
//   fileFilter: staffPhotoFilter,
//   limits: { fileSize: 8 * 1024 * 1024 },
// }).fields([
//   { name: "photo", maxCount: 1 },
//   { name: "resume", maxCount: 1 },
// ]);

// // ────────────────────────────────────────────────
// // Dedicated multer for query attachments (image / pdf) – auto-create folder
// // ────────────────────────────────────────────────
// const queryFileDir = "uploads/temp/query-files/";

// if (!fs.existsSync(queryFileDir)) {
//   fs.mkdirSync(queryFileDir, { recursive: true });
//   console.log(`Created missing upload folder: ${queryFileDir}`);
// }

// const queryFileStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, queryFileDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
//     cb(null, uniqueName);
//   },
// });

// // Type (jpg/png/webp/pdf) and 5 MB check controller la nadakkum —
// // adhanala error JSON ah frontend ku correct ah pogum.
// // Inga 10 MB safety limit mattum.
// const queryUpload = multer({
//   storage: queryFileStorage,
//   limits: { fileSize: 10 * 1024 * 1024 },
// }).fields([{ name: "attachments", maxCount: 5 }]);

// // ────────────────────────────────────────────────
// // Dedicated multer for Aadhaar front/back uploads – auto-create folder
// // ────────────────────────────────────────────────
// const aadhaarDir = "uploads/temp/aadhaar/";

// if (!fs.existsSync(aadhaarDir)) {
//   fs.mkdirSync(aadhaarDir, { recursive: true });
//   console.log(`Created missing upload folder: ${aadhaarDir}`);
// }

// const aadhaarStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, aadhaarDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
//     cb(null, uniqueName);
//   },
// });

// const aadhaarFileFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith("image/")) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only image files are allowed for Aadhaar upload"), false);
//   }
// };

// const aadhaarUpload = multer({
//   storage: aadhaarStorage,
//   fileFilter: aadhaarFileFilter,
//   limits: { fileSize: 8 * 1024 * 1024 },
// }).fields([
//   { name: "front", maxCount: 1 },
//   { name: "back", maxCount: 1 },
// ]);

// // ────────────────────────────────────────────────
// // Dedicated multer for payment screenshot uploads – auto-create folder
// // ────────────────────────────────────────────────
// const paymentScreenshotDir = "uploads/temp/payment-screenshot/";

// if (!fs.existsSync(paymentScreenshotDir)) {
//   fs.mkdirSync(paymentScreenshotDir, { recursive: true });
//   console.log(`Created missing upload folder: ${paymentScreenshotDir}`);
// }

// const paymentScreenshotStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, paymentScreenshotDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
//     cb(null, uniqueName);
//   },
// });

// const paymentScreenshotUpload = multer({
//   storage: paymentScreenshotStorage,
//   fileFilter: aadhaarFileFilter, // images only
//   limits: { fileSize: 8 * 1024 * 1024 },
// }).single("screenshot");

// export { upload, tourUpload, paymentQrUpload, staffPhotoUpload, queryUpload, aadhaarUpload, paymentScreenshotUpload };

// (Only the active bottom section of your file is shown/edited here —
// everything above it is your own commented-out history, untouched.)

// middlewares/multer.js
import multer from "multer";
import path from "path";
import fs from "fs"; // ← ADD THIS IMPORT

// ────────────────────────────────────────────────
// Existing code (DO NOT TOUCH)
// ────────────────────────────────────────────────
const storage = multer.diskStorage({
  filename: (req, file, callback) => {
    callback(null, file.originalname);
  },
});

const upload = multer({ storage });

const tourUpload = upload.fields([
  { name: "mapImage", maxCount: 1 },
  { name: "titleImage", maxCount: 1 },
  { name: "galleryImages", maxCount: 3 },
]);

// ────────────────────────────────────────────────
// Dedicated multer for payment QR uploads – auto-create folder
// ────────────────────────────────────────────────
const paymentQrDir = "uploads/temp/payment-qr/";

// Auto-create folder if missing (safe & idempotent)
if (!fs.existsSync(paymentQrDir)) {
  fs.mkdirSync(paymentQrDir, { recursive: true });
  console.log(`Created missing upload folder: ${paymentQrDir}`);
}

const paymentQrStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, paymentQrDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const paymentFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed for QR code"), false);
  }
};

const paymentQrUpload = multer({
  storage: paymentQrStorage,
  fileFilter: paymentFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("qrImage");

// ────────────────────────────────────────────────
// Dedicated multer for staff photo uploads – auto-create folder
// ────────────────────────────────────────────────
const staffPhotoDir = "uploads/temp/staff-photo/";

// Auto-create folder if missing (safe & idempotent)
if (!fs.existsSync(staffPhotoDir)) {
  fs.mkdirSync(staffPhotoDir, { recursive: true });
  console.log(`Created missing upload folder: ${staffPhotoDir}`);
}

const staffPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, staffPhotoDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const staffPhotoFilter = (req, file, cb) => {
  // photo must be an image; resume must be a PDF or Word document
  if (file.fieldname === "resume") {
    const okResume =
      file.mimetype === "application/pdf" ||
      file.mimetype === "application/msword" ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (okResume) cb(null, true);
    else cb(new Error("Resume must be a PDF or Word document"), false);
    return;
  }
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed for staff photo"), false);
  }
};

const staffPhotoUpload = multer({
  storage: staffPhotoStorage,
  fileFilter: staffPhotoFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
}).fields([
  { name: "photo", maxCount: 1 },
  { name: "resume", maxCount: 1 },
]);

// ────────────────────────────────────────────────
// Dedicated multer for query attachments (image / pdf) – auto-create folder
// ────────────────────────────────────────────────
const queryFileDir = "uploads/temp/query-files/";

if (!fs.existsSync(queryFileDir)) {
  fs.mkdirSync(queryFileDir, { recursive: true });
  console.log(`Created missing upload folder: ${queryFileDir}`);
}

const queryFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, queryFileDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Type (jpg/png/webp/pdf) and 5 MB check controller la nadakkum —
// adhanala error JSON ah frontend ku correct ah pogum.
// Inga 10 MB safety limit mattum.
const queryUpload = multer({
  storage: queryFileStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([{ name: "attachments", maxCount: 5 }]);

// ────────────────────────────────────────────────
// Dedicated multer for Aadhaar front/back uploads – auto-create folder
// ────────────────────────────────────────────────
const aadhaarDir = "uploads/temp/aadhaar/";

if (!fs.existsSync(aadhaarDir)) {
  fs.mkdirSync(aadhaarDir, { recursive: true });
  console.log(`Created missing upload folder: ${aadhaarDir}`);
}

const aadhaarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, aadhaarDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Aadhaar front/back now also accepts a PDF (an e-Aadhaar/scanned copy),
// not just a photo — the OCR pipeline (aadhaarController.js) rasterizes
// page 1 of a PDF via sharp before reading it, same as a photo.
const aadhaarFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only image or PDF files are allowed for Aadhaar upload"), false);
  }
};

const aadhaarUpload = multer({
  storage: aadhaarStorage,
  fileFilter: aadhaarFileFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
}).fields([
  { name: "front", maxCount: 1 },
  { name: "back", maxCount: 1 },
]);

// ────────────────────────────────────────────────
// Dedicated multer for payment screenshot uploads – auto-create folder
// ────────────────────────────────────────────────
const paymentScreenshotDir = "uploads/temp/payment-screenshot/";

if (!fs.existsSync(paymentScreenshotDir)) {
  fs.mkdirSync(paymentScreenshotDir, { recursive: true });
  console.log(`Created missing upload folder: ${paymentScreenshotDir}`);
}

const paymentScreenshotStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, paymentScreenshotDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const paymentScreenshotUpload = multer({
  storage: paymentScreenshotStorage,
  fileFilter: aadhaarFileFilter, // images (or PDF) only — shared with Aadhaar's filter above
  limits: { fileSize: 8 * 1024 * 1024 },
}).single("screenshot");

export { upload, tourUpload, paymentQrUpload, staffPhotoUpload, queryUpload, aadhaarUpload, paymentScreenshotUpload };