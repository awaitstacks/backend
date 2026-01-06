import mongoose from "mongoose";

const manageBookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  tourId: { type: mongoose.Schema.Types.ObjectId, ref: "tour", required: true },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "tourBooking",
    required: true,
  },

  userData: { type: Object, required: true },
  tourData: { type: Object, required: true },

  // === TRAVELLERS (with explicit _id) ===
  travellers: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // ← Explicit
      title: { type: String, required: true },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      age: { type: Number, required: true },
      gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
        required: true,
      },
      sharingType: {
        type: String,
        enum: ["double", "triple", "withBerth", "withoutBerth"],
        required: true,
      },
      packageType: {
        type: String,
        enum: ["main", "variant"],
        default: "main",
        required: true,
      },
      variantPackageIndex: { type: Number, default: null },
      selectedAddon: {
        name: { type: String },
        price: { type: Number },
      },
      boardingPoint: {
        stationCode: { type: String },
        stationName: { type: String },
      },
      deboardingPoint: {
        stationCode: { type: String },
        stationName: { type: String },
      },
      trainSeats: [
        {
          trainName: { type: String },
          seatNo: { type: String },
        },
      ],
      flightSeats: [
        {
          flightName: { type: String },
          seatNo: { type: String },
        },
      ],
      staffRemarks: { type: String },
      remarks: { type: String },
      cancelled: {
        byAdmin: { type: Boolean, default: false },
        byTraveller: { type: Boolean, default: false },
        cancelledAt: { type: Date },
        releaseddAt: { type: Date },
        reason: { type: String },
      },
    },
  ],

  billingAddress: {
    addressLine1: { type: String },
    addressLine2: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: { type: String, default: "India" },
  },

  contact: {
    email: {
      type: String,
      required: true,
      match: [/.+@.+\..+/, "Please enter a valid email address"],
    },
    mobile: {
      type: String,
      required: true,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"],
    },
  },

  bookingType: {
    type: String,
    enum: ["online", "offline"],
    required: true,
  },

  payment: {
    advance: {
      amount: { type: Number, required: true },
      paid: { type: Boolean, default: false },
      paymentVerified: { type: Boolean, default: false },
      paidAt: { type: Date },
    },
    balance: {
      amount: { type: Number, required: true },
      paid: { type: Boolean, default: false },
      paymentVerified: { type: Boolean, default: false },
      paidAt: { type: Date },
    },
  },

  receipts: {
    advanceReceiptSent: { type: Boolean, default: false },
    advanceReceiptSentAt: { type: Date },
    balanceReceiptSent: { type: Boolean, default: false },
    balanceReceiptSentAt: { type: Date },
  },

  isTripCompleted: { type: Boolean, default: false },
  isBookingCompleted: { type: Boolean, default: false },

  cancelled: {
    byAdmin: { type: Boolean, default: false },
    byTraveller: { type: Boolean, default: false },
    cancelledAt: { type: Date },
    releaseddAt: { type: Date },
    reason: { type: String },
  },

  bookingDate: { type: Date, default: Date.now },
  gvCancellationPool: { type: Number },
  irctcCancellationPool: { type: Number },
  manageBooking: { type: Boolean, default: false },

  adminRemarks: [
    {
      remark: { type: String },
      amount: { type: Number, default: 0 },
      addedAt: { type: Date, default: Date.now },
    },
  ],

  approvedBy: {
    type: Boolean,
    default: false,
    approveddAt: { type: Date, default: Date.now },
  },
  raisedBy: {
    type: Boolean,
    default: false,
    raisedAt: { type: Date, default: Date.now },
  },

  updatableAdvance: { type: Number },
  updatedAdvance: { type: Number },
  updatableBalance: { type: Number },
  updatedBalance: { type: Number },
});

// Index for performance
manageBookingSchema.index({ bookingId: 1, approvedBy: 1 });

const manageBookingModel =
  mongoose.models.manageBooking ||
  mongoose.model("manageBooking", manageBookingSchema);

export default manageBookingModel;
