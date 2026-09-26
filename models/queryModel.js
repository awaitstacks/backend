// models/queryModel.js
// ONE model — query type, attachments, replies ellam idhukulla dhaan
import mongoose from "mongoose";

// staffModel.js la mongoose.model("staff", ...) — adhe name
const STAFF_REF = "staff";

// open → pickup → processing → close
//                            ↘ reject  (open / pickup / processing la irundhu)
export const QUERY_STATUS = ["open", "pickup", "processing", "close", "reject"];

// Reply yaar anuppuna
export const REPLY_FROM = ["touradmin", "admin"];

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
    // Attachment 1 = raise pannum bodhu, 2, 3... = ovvoru edit la add aanadhu
    set: { type: Number, default: 1 },
  },
  { _id: true },
);

// ────────────────────────────────────────────────
// Edit history — admin edit pannuna before / after
// ────────────────────────────────────────────────
const editChangeSchema = new mongoose.Schema(
  {
    field: { type: String, required: true }, // subject, description, raisedBy...
    label: { type: String, required: true }, // UI la kaata
    before: { type: String, default: "" },
    after: { type: String, default: "" },
  },
  { _id: false },
);

const editHistorySchema = new mongoose.Schema(
  {
    editedAt: { type: Date, default: Date.now },
    // enna edit: query details / reply edit / reply delete
    kind: { type: String, enum: ["query", "reply-edit", "reply-delete"], default: "query" },
    // yaar pannanga — replies la irukura adhe values
    by: { type: String, enum: REPLY_FROM, default: "touradmin" },
    changes: { type: [editChangeSchema], default: [] },
  },
  { _id: true },
);

// ────────────────────────────────────────────────
// Reply (tour admin ↔ admin conversation)
// ────────────────────────────────────────────────
const replySchema = new mongoose.Schema(
  {
    message: {
      type: String,
      trim: true,
      required: [true, "Reply message is required"],
      maxlength: [2000, "Reply can be at most 2000 characters"],
    },
    from: { type: String, enum: REPLY_FROM, required: true },
    // Optional — yaar reply pannanga nu staff theriyum na
    staff: { type: mongoose.Schema.Types.ObjectId, ref: STAFF_REF, default: null },
    // Edit pannuna time — UI la "(edited)" nu kaata
    editedAt: { type: Date, default: null },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } },
);

const querySchema = new mongoose.Schema(
  {
    // GVTKT001, GVTKT002 ... (raise pannum bodhu auto)
    ticketSeq: { type: Number, unique: true, sparse: true },
    ticketNo: { type: String, trim: true },

    // e.g. "Payment", "Booking", "Refund"
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

    // ────────────────────────────────────────────────
    // Status — raise pannum bodhu "open"
    // ────────────────────────────────────────────────
    status: {
      type: String,
      enum: QUERY_STATUS,
      default: "open",
    },

    pickupAt: { type: Date, default: null },
    processingAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    rejectReason: { type: String, trim: true, default: "" },

    // Close aana apram Reopen pannuna (files, replies ellam apdiye irukum)
    reopenedAt: { type: Date, default: null },
    reopenCount: { type: Number, default: 0 },

    // Edit history (before / after)
    editHistory: { type: [editHistorySchema], default: [] },
    editCount: { type: Number, default: 0 },

    // ────────────────────────────────────────────────
    // Replies
    // ────────────────────────────────────────────────
    replies: {
      type: [replySchema],
      default: [],
    },
    // List page la "puthu reply" kaata — full replies load pannama
    replyCount: { type: Number, default: 0 },
    lastReplyAt: { type: Date, default: null },
    lastReplyFrom: { type: String, enum: [...REPLY_FROM, null], default: null },
  },
  {
    timestamps: true,
  },
);

querySchema.index({ status: 1, createdAt: -1 });
querySchema.index({ queryType: 1, createdAt: -1 });
querySchema.index({ raisedTo: 1, status: 1 });

const Query = mongoose.model("Query", querySchema);

export default Query;