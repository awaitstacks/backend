
// import mongoose from "mongoose";

// const enquirySchema = new mongoose.Schema(
//   {
//     fullName: { type: String, required: true, trim: true },
//     mobileNumber: { type: String, required: true, trim: true },
//     email: {
//       type: String,
//       trim: true,
//       lowercase: true,
//     },
//     city: { type: String, trim: true },
//     destination: { type: String, required: true, trim: true },
//     tourType: {
//       type: String,
//       required: true,
//       enum: [
//         "Group tour(fixed departure)", "Customized/Private tour",
//         "Friends", "Family", "Corporate/Team Outing",
//         "Honeymoon", "pilgrimage tour", "Others",
//       ],
//     },
//     preferredTravelDate: { type: Date, default: null },
//     numberOfDays: { type: Number, min: 1, default: null },
//     numberOfNights: { type: Number, min: 0, default: null },
//     adults: { type: Number, default: 1, min: 0 },
//     children: { type: Number, default: 0, min: 0 },
//     infants: { type: Number, default: 0, min: 0 },
//     specialRequests: { type: String, trim: true },
//     source: {
//       type: String,
//       enum: ["Regular", "Google", "Facebook", "Instagram", "YouTube", "Friends & Family", "Whatsapp/Referral", "Others", "admin"],
//       default: null,
//     },
//     status: {
//       type: String,
//       enum: ["pending", "accepted", "rejected"],
//       default: "pending",
//     },
//     // Independent flag — does NOT change `status`. An enquiry can be
//     // status:"pending" AND isRatePassed:true at the same time. Used to
//     // mark enquiries where the rate has been internally confirmed but
//     // the booking is still on hold pending customer confirmation.
//     isRatePassed: { type: Boolean, default: false },
//     fitCode: {
//       type: String,
//       unique: true,
//       sparse: true,
//       trim: true,
//     },
//     fitStates: {
//       type: [String],
//       enum: [
//         "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
//         "Chhattisgarh", "Goa", "Gujarat", "Haryana",
//         "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
//         "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
//         "Mizoram", "Nagaland", "Odisha", "Punjab",
//         "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
//         "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
//       ],
//       default: [],
//     },
//     salesValue: { type: Number, min: 0, default: null },
//     pickupDate: { type: Date, default: null },
//     pickupTime: { type: String, trim: true, default: null },
//     pickupPlace: { type: String, trim: true, default: null },

//     raisedBy: {
//       type: String,
//       enum: ["user", "admin"],
//       default: "user",
//     },
//     acceptedAt: { type: Date, default: null },
//   },
//   { timestamps: true }
// );

// // Auto-generate fitCode when enquiry is first created
// enquirySchema.pre("save", async function (next) {
//   if (this.isNew && !this.fitCode) {
//     const last = await mongoose.model("enquiry")
//       .findOne({ fitCode: { $exists: true, $ne: null } })
//       .sort({ createdAt: -1 })
//       .select("fitCode");

//     let nextNum = 1;
//     if (last?.fitCode) {
//       const num = parseInt(last.fitCode.replace("GVFIT", ""), 10);
//       if (!isNaN(num)) nextNum = num + 1;
//     }
//     this.fitCode = `GVFIT${String(nextNum).padStart(4, "0")}`;
//   }
//   next();
// });

// const enquiryModel = mongoose.models.enquiry || mongoose.model("enquiry", enquirySchema);
// export default enquiryModel;



import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    city: { type: String, trim: true },
    destination: { type: String, required: true, trim: true },
    tourType: {
      type: String,
      required: true,
      enum: [
        "Group tour(fixed departure)", "Customized/Private tour",
        "Friends", "Family", "Corporate/Team Outing",
        "Honeymoon", "pilgrimage tour", "Others",
      ],
    },
    preferredTravelDate: { type: Date, default: null },
    numberOfDays: { type: Number, min: 1, default: null },
    numberOfNights: { type: Number, min: 0, default: null },
    adults: { type: Number, default: 1, min: 0 },
    children: { type: Number, default: 0, min: 0 },
    infants: { type: Number, default: 0, min: 0 },
    specialRequests: { type: String, trim: true },
    source: {
      type: String,
      enum: ["Regular", "Google", "Facebook", "Instagram", "YouTube", "Friends & Family", "Whatsapp/Referral", "Others", "admin"],
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    // Independent flag — does NOT change `status`. An enquiry can be
    // status:"pending" AND isRatePassed:true at the same time. Used to
    // mark enquiries where the rate has been internally confirmed but
    // the booking is still on hold pending customer confirmation.
    isRatePassed: { type: Boolean, default: false },

    // ── Close flow ──
    // Same idea as isRatePassed, but on top of status:"accepted".
    // accepted + isClosed:true → shows under the "Closed" filter.
    isClosed: { type: Boolean, default: false },
    closedAt: { type: Date, default: null },

    // ── Reject / Reopen flow ──
    // previousStatus = the status the enquiry had right before it was
    // rejected ("pending" or "accepted"). Reopen restores it; together
    // with isRatePassed / isClosed (left untouched on reject) this brings
    // the enquiry back to the exact same stage.
    previousStatus: { type: String, default: null },
    rejectedAt: { type: Date, default: null },
    reopenedAt: { type: Date, default: null },
    // Set on reopen so getAllEnquiries' auto-reject (past travel date)
    // doesn't immediately reject a reopened enquiry again.
    skipAutoReject: { type: Boolean, default: false },
    fitCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    fitStates: {
      type: [String],
      enum: [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
        "Chhattisgarh", "Goa", "Gujarat", "Haryana",
        "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
        "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
        "Mizoram", "Nagaland", "Odisha", "Punjab",
        "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
        "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
      ],
      default: [],
    },
    salesValue: { type: Number, min: 0, default: null },
    pickupDate: { type: Date, default: null },
    pickupTime: { type: String, trim: true, default: null },
    pickupPlace: { type: String, trim: true, default: null },

    raisedBy: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ── FIT Code counter ─────────────────────────────────────────────────
// Separate tiny collection holding the last used FIT number. $inc is
// atomic, so two enquiries created at the same moment can never get the
// same code, and the number keeps going past 9999 → GVFIT10000,
// GVFIT10001 … (padStart only pads up to 4 digits, it never cuts).
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
const counterModel =
  mongoose.models.counter || mongoose.model("counter", counterSchema);

const getNextFitNumber = async () => {
  // First run only: seed the counter from the highest existing FIT code
  // (numeric max, so GVFIT10000 counts as bigger than GVFIT9999).
  const exists = await counterModel.exists({ _id: "fitCode" });
  if (!exists) {
    const [row] = await mongoose.model("enquiry").aggregate([
      { $match: { fitCode: { $regex: /^GVFIT\d+$/ } } },
      { $group: { _id: null, max: { $max: { $toInt: { $substrCP: ["$fitCode", 5, 20] } } } } },
    ]);
    await counterModel.updateOne(
      { _id: "fitCode" },
      { $setOnInsert: { seq: row?.max || 0 } },
      { upsert: true },
    );
  }

  const counter = await counterModel.findOneAndUpdate(
    { _id: "fitCode" },
    { $inc: { seq: 1 } },
    { new: true },
  );
  return counter.seq;
};

// Auto-generate fitCode when enquiry is first created
enquirySchema.pre("save", async function (next) {
  try {
    if (this.isNew && !this.fitCode) {
      const nextNum = await getNextFitNumber();
      this.fitCode = `GVFIT${String(nextNum).padStart(4, "0")}`;
    }
    next();
  } catch (err) {
    next(err);
  }
});

const enquiryModel = mongoose.models.enquiry || mongoose.model("enquiry", enquirySchema);
export default enquiryModel;