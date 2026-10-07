import mongoose from "mongoose";

const aadhaarSchema = new mongoose.Schema(
  {
    tnr: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },
    travellerId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    type: {
      type: String,
      enum: [
        "aadhaarFront",
        "aadhaarBack",
        "paymentAdvance",
        "paymentBalance",
        "paymentPartial",
      ],
      required: true,
    },
    isCoTraveller: { type: Boolean, default: false },
    ocrText: { type: String, default: "" },
    parsed: {
      firstName: { type: String, default: "" },
      lastName: { type: String, default: "" },
      age: { type: Number, default: null },
      dob: { type: String, default: "" },
      gender: { type: String, default: "" },
      address: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
    amount: { type: Number, default: null },
    url: { type: String, required: true },
    uploadedBy: {
      type: String,
      enum: ["user", "admin"],
      default: "admin",
    },
  },
  { timestamps: true },
);

aadhaarSchema.index({ tnr: 1, type: 1 });

const aadhaarModel =
  mongoose.models.aadhaar || mongoose.model("aadhaar", aadhaarSchema);

export default aadhaarModel;