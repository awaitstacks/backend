import multer from "multer";

const storage = multer.diskStorage({
  filename: (req, file, callback) => {
    callback(null, file.originalname);
  },
});

const upload = multer({ storage });

// ✅ For tours with multiple fields
const tourUpload = upload.fields([
  { name: "mapImage", maxCount: 1 },
  { name: "titleImage", maxCount: 1 },
  { name: "galleryImages", maxCount: 3 },
]);

export { upload, tourUpload };
