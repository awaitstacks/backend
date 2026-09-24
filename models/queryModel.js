// models/queryModel.js
// ONE model — query type um idhukulla dhaan store aagum
import mongoose from "mongoose";

// NOTE: unga StaffProfile model register panna name idhu illana maathunga
const STAFF_REF = "StaffProfile";

export const QUERY_STATUS = ["open", "processing", "closed", "rejected"];

// ────────────────────────────────────────────────
// Attachment (image / pdf) — Cloudinary la store aagum
// ────────────────────────────────────────────────
const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true }, // Cloudinary secure URL
    publicId: { type: String, required: true },
    resourceType: { type: String, enum: ["image", "raw"], required: true },
    fileType: { type: String, enum: ["image", "pdf"], required: true },
    fileName: { type: String, trim: true },
    size: { type: Number }, // bytes
  },
  { _id: true },
);

const querySchema = new mongoose.Schema(
  {
    // e.g. "Payment", "Booking", "Refund"
    // Filter dropdown ku Query.distinct("queryType") la irundhu varum
    queryType: {
      type: String,
      trim: true,
      required: [true, "Query type is required"],
      minlength: [2, "Query type must be at least 2 characters long"],
    },

    subject: {
      type: String,
      trim: true,
      required: [true, "Subject is required"],
      minlength: [3, "Subject must be at least 3 characters long"],
    },

    // Text box content
    description: {
      type: String,
      trim: true,
      default: "",
    },

    attachments: {
      type: [attachmentSchema],
      default: [],
      validate: [(v) => v.length <= 5, "Maximum 5 attachments allowed"],
    },

    // ────────────────────────────────────────────────
    // Staff (StaffProfile)
    // ────────────────────────────────────────────────
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: STAFF_REF,
      required: [true, "Raised by is required"],
    },

    raisedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: STAFF_REF,
      required: [true, "Raised to is required"],
    },

    // Admin raise pannum bodhu default "open"
    status: {
      type: String,
      enum: QUERY_STATUS,
      default: "open",
    },

    // Admin "Mark pickup" — naan indha query ah paathutten nu solla
    pickedUp: { type: Boolean, default: false },
    pickedUpAt: { type: Date, default: null },

    processingAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    rejectReason: { type: String, trim: true, default: "" },
  },
  {
    timestamps: true,
  },
);

querySchema.index({ status: 1, createdAt: -1 });
querySchema.index({ queryType: 1, createdAt: -1 });
querySchema.index({ raisedTo: 1, status: 1 });
querySchema.index({ pickedUp: 1, createdAt: -1 });

const Query = mongoose.model("Query", querySchema);

export default Query;