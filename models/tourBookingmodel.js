// import mongoose from "mongoose";

// const tourBookingSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
//   tourId: { type: mongoose.Schema.Types.ObjectId, ref: "tour", required: true },
//   tnr: {
//     type: String,
//     unique: true, // ← very important for production safety
//     sparse: true, // allows existing docs without tnr to stay valid
//     trim: true,
//     uppercase: true,
//     minlength: 6,
//     maxlength: 6,
//   },

//   userData: { type: Object, required: true },
//   tourData: { type: Object, required: true },

//   travellers: [
//     {
//       title: { type: String, required: true },
//       firstName: { type: String, required: true },
//       lastName: { type: String, required: true },
//       age: { type: Number, required: true },
//       gender: {
//         type: String,
//         enum: ["Male", "Female", "Other"],
//         required: true,
//       },
//       sharingType: {
//         type: String,
//         enum: ["double", "triple", "withBerth", "withoutBerth"],
//         required: true,
//       },
//       packageType: {
//         type: String,
//         enum: ["main", "variant"],
//         default: "main",
//         required: true,
//       },
//       variantPackageIndex: {
//         type: Number,
//         default: null,
//       },
//       selectedAddon: {
//         name: { type: String },
//         price: { type: Number },
//       },
//       boardingPoint: {
//         stationCode: { type: String },
//         stationName: { type: String },
//       },
//       deboardingPoint: {
//         stationCode: { type: String },
//         stationName: { type: String },
//       },
//       trainSeats: [
//         {
//           trainName: { type: String },
//           seatNo: { type: String },
//         },
//       ],
//       flightSeats: [
//         {
//           flightName: { type: String },
//           seatNo: { type: String },
//         },
//       ],

//       seatNumber: {
//         type: String,
//         default: null,
//         trim: true,
//       },
//       seatLocked: {
//         type: Boolean,
//         default: false,
//       },
//       seatLockedAt: { type: Date },
//       vehicleId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "tourVehicle",
//         default: null,
//       },
//       vehicleName: {
//         type: String,
//         default: null,
//         trim: true,
//       },

//       staffRemarks: { type: String },
//       remarks: { type: String },
//       cancelled: {
//         byAdmin: { type: Boolean, default: false },
//         byTraveller: { type: Boolean, default: false },
//         cancelledAt: { type: Date },
//         releaseddAt: { type: Date },
//         reason: { type: String },
//       },
//     },
//   ],

//   billingAddress: {
//     addressLine1: { type: String },
//     addressLine2: { type: String },
//     city: { type: String },
//     state: { type: String },
//     pincode: { type: String },
//     country: { type: String, default: "India" },
//   },

//   contact: {
//     email: {
//       type: String,
//       required: true,
//       match: [/.+@.+\..+/, "Please enter a valid email address"],
//     },
//     mobile: {
//       type: String,
//       required: true,
//       trim: true,
//       match: [/^[\d+\-\s()]{7,25}$/, "Invalid phone number format"],
//     },
//   },

//   bookingType: {
//     type: String,
//     enum: ["online", "offline"],
//     required: true,
//   },

//   payment: {
//     advance: {
//       amount: { type: Number, required: true },
//       paid: { type: Boolean, default: false },
//       paymentVerified: { type: Boolean, default: false },
//       paidAt: { type: Date },
//     },
//     balance: {
//       amount: { type: Number, required: true },
//       paid: { type: Boolean, default: false },
//       paymentVerified: { type: Boolean, default: false },
//       paidAt: { type: Date },
//     },
//   },
//   receipts: {
//     advanceReceiptSent: { type: Boolean, default: false },
//     advanceReceiptSentAt: { type: Date },
//     balanceReceiptSent: { type: Boolean, default: false },
//     balanceReceiptSentAt: { type: Date },
//   },
//   isTripCompleted: { type: Boolean, default: false },
//   isBookingCompleted: { type: Boolean, default: false },

//   cancelled: {
//     byAdmin: { type: Boolean, default: false },
//     byTraveller: { type: Boolean, default: false },
//     cancelledAt: { type: Date },
//     releaseddAt: { type: Date },
//     reason: { type: String },
//   },

//   bookingDate: { type: Date, default: Date.now },
//   gvCancellationPool: { type: Number },
//   irctcCancellationPool: { type: Number },
//   manageBooking: { type: Boolean, default: false },

//   // New independent field - specifically for advance payment related admin remarks
//   advanceAdminRemarks: [
//     {
//       remark: { type: String },
//       amount: { type: Number, default: 0 },
//       addedAt: { type: Date, default: Date.now },
//     },
//   ],

//   cancellationReceipt: { type: Boolean, default: false },
//   manageBookingReceipt: { type: Boolean, default: false },

//   // General admin remarks (kept separate)
//   adminRemarks: [
//     {
//       remark: { type: String },
//       amount: { type: Number, default: 0 },
//       addedAt: { type: Date, default: Date.now },
//     },
//   ],
//   cancellationRequest: { type: Boolean, default: false },
//   emergencyContact: {
//     type: String,
//     match: [/^[\d+\-\s()]{7,25}$/, "Invalid phone number format"],
//     default: null, // or "" if you prefer empty string
//   },

//   termsAgreed: {
//     type: Boolean,
//     default: false,
//   },

//   termsAgreedAt: {
//     type: Date,
//     default: null, // null = never agreed / confirmed
//   },
// });

// const tourBookingModel =
//   mongoose.models.tourBooking ||
//   mongoose.model("tourBooking", tourBookingSchema);

// export default tourBookingModel;

// import mongoose from "mongoose";

// const tourBookingSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
//   tourId: { type: mongoose.Schema.Types.ObjectId, ref: "tour", required: true },
//   tnr: {
//     type: String,
//     unique: true, // ← very important for production safety
//     sparse: true, // allows existing docs without tnr to stay valid
//     trim: true,
//     uppercase: true,
//     minlength: 6,
//     maxlength: 6,
//   },

//   // ── NEW FIELD ──────────────────────────────────────────────────────────
//   // Generated once, the first time advance is marked paid (see
//   // markOfflineAdvancePaid in tourController.js). Its presence is what
//   // tells the frontend to show the Receipt/Invoice button.
//   invoiceNumber: {
//     type: String,
//     unique: true,
//     sparse: true,
//     trim: true,
//     uppercase: true,
//   },
//   // ─────────────────────────────────────────────────────────────────────

//   userData: { type: Object, required: true },
//   tourData: { type: Object, required: true },

//   travellers: [
//     {
//       title: { type: String, required: true },
//       firstName: { type: String, required: true },
//       lastName: { type: String, required: true },
//       age: { type: Number, required: true },
//       gender: {
//         type: String,
//         enum: ["Male", "Female", "Other"],
//         required: true,
//       },
//       sharingType: {
//         type: String,
//         enum: ["double", "triple", "withBerth", "withoutBerth"],
//         required: true,
//       },
//       packageType: {
//         type: String,
//         enum: ["main", "variant"],
//         default: "main",
//         required: true,
//       },
//       variantPackageIndex: {
//         type: Number,
//         default: null,
//       },
//       selectedAddon: {
//         name: { type: String },
//         price: { type: Number },
//       },
//       boardingPoint: {
//         stationCode: { type: String },
//         stationName: { type: String },
//       },
//       deboardingPoint: {
//         stationCode: { type: String },
//         stationName: { type: String },
//       },
//       trainSeats: [
//         {
//           trainName: { type: String },
//           seatNo: { type: String },
//         },
//       ],
//       flightSeats: [
//         {
//           flightName: { type: String },
//           seatNo: { type: String },
//         },
//       ],

//       seatNumber: {
//         type: String,
//         default: null,
//         trim: true,
//       },
//       seatLocked: {
//         type: Boolean,
//         default: false,
//       },
//       seatLockedAt: { type: Date },
//       vehicleId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "tourVehicle",
//         default: null,
//       },
//       vehicleName: {
//         type: String,
//         default: null,
//         trim: true,
//       },

//       staffRemarks: { type: String },
//       remarks: { type: String },
//       cancelled: {
//         byAdmin: { type: Boolean, default: false },
//         byTraveller: { type: Boolean, default: false },
//         cancelledAt: { type: Date },
//         releaseddAt: { type: Date },
//         reason: { type: String },
//       },
//     },
//   ],

//   billingAddress: {
//     addressLine1: { type: String },
//     addressLine2: { type: String },
//     city: { type: String },
//     state: { type: String },
//     pincode: { type: String },
//     country: { type: String, default: "India" },
//   },

//   contact: {
//     email: {
//       type: String,
//       required: true,
//       match: [/.+@.+\..+/, "Please enter a valid email address"],
//     },
//     mobile: {
//       type: String,
//       required: true,
//       trim: true,
//       match: [/^[\d+\-\s()]{7,25}$/, "Invalid phone number format"],
//     },
//   },

//   bookingType: {
//     type: String,
//     enum: ["online", "offline"],
//     required: true,
//   },

//   payment: {
//     advance: {
//       amount: { type: Number, required: true },
//       paid: { type: Boolean, default: false },
//       paymentVerified: { type: Boolean, default: false },
//       paidAt: { type: Date },
//     },
//     balance: {
//       amount: { type: Number, required: true },
//       paid: { type: Boolean, default: false },
//       paymentVerified: { type: Boolean, default: false },
//       paidAt: { type: Date },
//     },
//   },
//   receipts: {
//     advanceReceiptSent: { type: Boolean, default: false },
//     advanceReceiptSentAt: { type: Date },
//     balanceReceiptSent: { type: Boolean, default: false },
//     balanceReceiptSentAt: { type: Date },
//   },
//   isTripCompleted: { type: Boolean, default: false },
//   isBookingCompleted: { type: Boolean, default: false },

//   cancelled: {
//     byAdmin: { type: Boolean, default: false },
//     byTraveller: { type: Boolean, default: false },
//     cancelledAt: { type: Date },
//     releaseddAt: { type: Date },
//     reason: { type: String },
//   },

//   bookingDate: { type: Date, default: Date.now },
//   gvCancellationPool: { type: Number },
//   irctcCancellationPool: { type: Number },
//   manageBooking: { type: Boolean, default: false },

//   // New independent field - specifically for advance payment related admin remarks
//   advanceAdminRemarks: [
//     {
//       remark: { type: String },
//       amount: { type: Number, default: 0 },
//       addedAt: { type: Date, default: Date.now },
//     },
//   ],

//   cancellationReceipt: { type: Boolean, default: false },
//   manageBookingReceipt: { type: Boolean, default: false },

//   // General admin remarks (kept separate)
//   adminRemarks: [
//     {
//       remark: { type: String },
//       amount: { type: Number, default: 0 },
//       addedAt: { type: Date, default: Date.now },
//     },
//   ],
//   cancellationRequest: { type: Boolean, default: false },
//   emergencyContact: {
//     type: String,
//     match: [/^[\d+\-\s()]{7,25}$/, "Invalid phone number format"],
//     default: null, // or "" if you prefer empty string
//   },

//   termsAgreed: {
//     type: Boolean,
//     default: false,
//   },

//   termsAgreedAt: {
//     type: Date,
//     default: null, // null = never agreed / confirmed
//   },
// });

// // ── AUTO-GENERATE INVOICE NUMBER ─────────────────────────────────────────
// // Runs on EVERY save, no matter which controller/flow set
// // payment.advance.paid = true — offline "Mark Advance" button, an online
// // payment gateway success handler, admin manually editing it, etc.
// // This way invoiceNumber logic lives in ONE place instead of being
// // duplicated inside every controller function that can mark advance paid.
// //
// // NOTE: this only runs when the document goes through .save(). If any
// // route updates payment.advance.paid via findOneAndUpdate() directly
// // (skipping .save()), this hook won't fire for that call — make sure
// // every "mark advance paid" flow fetches the doc and calls .save().
// //
// // Invoice numbers are SEQUENTIAL — GVBILL0001, GVBILL0002, ... — same
// // pattern as your enquirySchema's fitCode generator.
// tourBookingSchema.pre("save", async function (next) {
//   if (
//     this.isModified("payment.advance.paid") &&
//     this.payment?.advance?.paid === true &&
//     !this.invoiceNumber
//   ) {
//     const last = await mongoose
//       .model("tourBooking")
//       .findOne({ invoiceNumber: { $exists: true, $ne: null } })
//       .sort({ _id: -1 }) // newest first — _id is time-ordered, no createdAt field needed
//       .select("invoiceNumber");

//     let nextNum = 1;
//     if (last?.invoiceNumber) {
//       const num = parseInt(last.invoiceNumber.replace("GVBILL", ""), 10);
//       if (!isNaN(num)) nextNum = num + 1;
//     }
//     this.invoiceNumber = `GVBILL${String(nextNum).padStart(4, "0")}`;
//   }
//   next();
// });

// const tourBookingModel =
//   mongoose.models.tourBooking ||
//   mongoose.model("tourBooking", tourBookingSchema);

// export default tourBookingModel;

import mongoose from "mongoose";

const tourBookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  tourId: { type: mongoose.Schema.Types.ObjectId, ref: "tour", required: true },
  tnr: {
    type: String,
    unique: true, // ← very important for production safety
    sparse: true, // allows existing docs without tnr to stay valid
    trim: true,
    uppercase: true,
    minlength: 6,
    maxlength: 6,
  },

  // ── NEW FIELD ──────────────────────────────────────────────────────────
  // Generated once, the first time advance is marked paid (see
  // markOfflineAdvancePaid in tourController.js). Its presence is what
  // tells the frontend to show the Receipt/Invoice button.
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true,
  },
  // ─────────────────────────────────────────────────────────────────────

  userData: { type: Object, required: true },
  tourData: { type: Object, required: true },

  travellers: [
    {
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
      variantPackageIndex: {
        type: Number,
        default: null,
      },

      // OLD flat addon — RESTORED. Old bookings save/read a single flat
      // addon here (name + price). This is what makes ManageBooking.jsx's
      // "already has selectedAddon saved → treat as old booking" check
      // actually work — without this field Mongoose was silently
      // dropping the flat addon on save, so old bookings looked "new".
      selectedAddon: {
        name: { type: String },
        price: { type: Number },
      },

      // NEW train/flight-wise addons — used for new bookings whose tour
      // package has per-train/per-flight addons.
      selectedAddons: [
        {
          trainId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
          },

          trainNo: {
            type: String,
            default: null,
          },

          trainName: {
            type: String,
            default: null,
          },

          tripType: {
            type: String,
            default: null,
          },

          addonId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
          },

          name: {
            type: String,
            default: null,
          },

          amount: {
            type: Number,
            default: 0,
          },
        },
      ],
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

      seatNumber: {
        type: String,
        default: null,
        trim: true,
      },
      seatLocked: {
        type: Boolean,
        default: false,
      },
      seatLockedAt: { type: Date },
      vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tourVehicle",
        default: null,
      },
      vehicleName: {
        type: String,
        default: null,
        trim: true,
      },

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
      trim: true,
      match: [/^[\d+\-\s()]{7,25}$/, "Invalid phone number format"],
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

  // New independent field - specifically for advance payment related admin remarks
  advanceAdminRemarks: [
    {
      remark: { type: String },
      amount: { type: Number, default: 0 },
      addedAt: { type: Date, default: Date.now },
    },
  ],

  cancellationReceipt: { type: Boolean, default: false },
  manageBookingReceipt: { type: Boolean, default: false },

  // General admin remarks (kept separate)
  adminRemarks: [
    {
      remark: { type: String },
      amount: { type: Number, default: 0 },
      addedAt: { type: Date, default: Date.now },
    },
  ],
  cancellationRequest: { type: Boolean, default: false },
  emergencyContact: {
    type: String,
    match: [/^[\d+\-\s()]{7,25}$/, "Invalid phone number format"],
    default: null, // or "" if you prefer empty string
  },

  termsAgreed: {
    type: Boolean,
    default: false,
  },

  termsAgreedAt: {
    type: Date,
    default: null, // null = never agreed / confirmed
  },
});

// ── AUTO-GENERATE INVOICE NUMBER ─────────────────────────────────────────
// Runs on EVERY save, no matter which controller/flow set
// payment.advance.paid = true — offline "Mark Advance" button, an online
// payment gateway success handler, admin manually editing it, etc.
// This way invoiceNumber logic lives in ONE place instead of being
// duplicated inside every controller function that can mark advance paid.
//
// NOTE: this only runs when the document goes through .save(). If any
// route updates payment.advance.paid via findOneAndUpdate() directly
// (skipping .save()), this hook won't fire for that call — make sure
// every "mark advance paid" flow fetches the doc and calls .save().
//
// Invoice numbers are SEQUENTIAL — GVBILL0001, GVBILL0002, ... — same
// pattern as your enquirySchema's fitCode generator.
tourBookingSchema.pre("save", async function (next) {
  if (
    this.isModified("payment.advance.paid") &&
    this.payment?.advance?.paid === true &&
    !this.invoiceNumber
  ) {
    const last = await mongoose
      .model("tourBooking")
      .findOne({ invoiceNumber: { $exists: true, $ne: null } })
      .sort({ _id: -1 }) // newest first — _id is time-ordered, no createdAt field needed
      .select("invoiceNumber");

    let nextNum = 1;
    if (last?.invoiceNumber) {
      const num = parseInt(last.invoiceNumber.replace("GVBILL", ""), 10);
      if (!isNaN(num)) nextNum = num + 1;
    }
    this.invoiceNumber = `GVBILL${String(nextNum).padStart(4, "0")}`;
  }
  next();
});

const tourBookingModel =
  mongoose.models.tourBooking ||
  mongoose.model("tourBooking", tourBookingSchema);

export default tourBookingModel;