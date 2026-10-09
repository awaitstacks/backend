// // import mongoose from "mongoose";

// // const aadhaarSchema = new mongoose.Schema(
// //   {
// //     tnr: {
// //       type: String,
// //       trim: true,
// //       uppercase: true,
// //       index: true,
// //     },
// //     travellerId: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       default: null,
// //     },
// //     type: {
// //       type: String,
// //       enum: [
// //         "aadhaarFront",
// //         "aadhaarBack",
// //         "paymentAdvance",
// //         "paymentBalance",
// //         "paymentPartial",
// //       ],
// //       required: true,
// //     },
// //     isCoTraveller: { type: Boolean, default: false },
// //     ocrText: { type: String, default: "" },
// //     parsed: {
// //       firstName: { type: String, default: "" },
// //       lastName: { type: String, default: "" },
// //       age: { type: Number, default: null },
// //       dob: { type: String, default: "" },
// //       gender: { type: String, default: "" },
// //       address: { type: String, default: "" },
// //       phone: { type: String, default: "" },
// //     },
// //     amount: { type: Number, default: null },
// //     url: { type: String, required: true },
// //     uploadedBy: {
// //       type: String,
// //       enum: ["user", "admin"],
// //       default: "admin",
// //     },
// //   },
// //   { timestamps: true },
// // );

// // aadhaarSchema.index({ tnr: 1, type: 1 });

// // const aadhaarModel =
// //   mongoose.models.aadhaar || mongoose.model("aadhaar", aadhaarSchema);

// // export default aadhaarModel;

// import mongoose from "mongoose";

// const aadhaarSchema = new mongoose.Schema(
//   {
//     tnr: {
//       type: String,
//       trim: true,
//       uppercase: true,
//       index: true,
//     },
//     travellerId: {
//       type: mongoose.Schema.Types.ObjectId,
//       default: null,
//     },
//     type: {
//       type: String,
//       enum: [
//         "aadhaarFront",
//         "aadhaarBack",
//         "paymentAdvance",
//         "paymentBalance",
//         "paymentPartial",
//         "bookingNotes", // Aadhaar Upload page's typed Package/Boarding/
//         // Deboarding/Add-ons/Remarks — saved here, NOT onto
//         // tourBookingModel. CreateBooking.jsx fills those properly via
//         // dropdowns against the tour's real data.
//       ],
//       required: true,
//     },
//     isCoTraveller: { type: Boolean, default: false },
//     ocrText: { type: String, default: "" },
//     parsed: {
//       firstName: { type: String, default: "" },
//       lastName: { type: String, default: "" },
//       age: { type: Number, default: null },
//       dob: { type: String, default: "" },
//       gender: { type: String, default: "" },
//       address: { type: String, default: "" },
//       phone: { type: String, default: "" },
//     },
//     amount: { type: Number, default: null },
//     url: {
//       type: String,
//       // Only aadhaarFront/aadhaarBack/payment* docs carry an uploaded
//       // image — a "bookingNotes" doc is plain typed text, no file.
//       required: function () {
//         return this.type !== "bookingNotes";
//       },
//     },
//     uploadedBy: {
//       type: String,
//       enum: ["user", "admin"],
//       default: "admin",
//     },

//     // ── "bookingNotes" type only — admin-typed, free text, reference-only.
//     // Never matched against the tour's own boardingPoints/deboardingPoints/
//     // variantPackage/addons; the real booking's structured values are
//     // picked separately on CreateBooking.jsx and saved to tourBookingModel.
//     tourId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "tour",
//       default: null,
//     },
//     packageType: { type: String, default: "" },
//     boardingPoint: { type: String, default: "" },
//     deboardingPoint: { type: String, default: "" },
//     addons: { type: String, default: "" },
//     remarks: { type: String, default: "" },
//   },
//   { timestamps: true },
// );

// aadhaarSchema.index({ tnr: 1, type: 1 });
// aadhaarSchema.index({ tourId: 1, type: 1 });

// const aadhaarModel =
//   mongoose.models.aadhaar || mongoose.model("aadhaar", aadhaarSchema);

// export default aadhaarModel;

import mongoose from "mongoose";
 
const aadhaarSchema = new mongoose.Schema(
  {
    tnr: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },
    // Ties together every doc created from ONE "Save Booking" click on the
    // Aadhaar Upload page (aadhaarFront + aadhaarBack + paymentAdvance +
    // bookingNotes), before a real tnr exists yet. The All Bookings page
    // will fetch a walk-in booking's pieces by groupId; once it's actually
    // created and gets a tnr, these docs get tnr/travellerId filled in too.
    groupId: {
      type: String,
      index: true,
      default: null,
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
        "bookingNotes", // Aadhaar Upload page's typed Package/Boarding/
        // Deboarding/Add-ons/Remarks — saved here, NOT onto
        // tourBookingModel. CreateBooking.jsx fills those properly via
        // dropdowns against the tour's real data.
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
      // Not from OCR — the admin's own picks on the Aadhaar Upload page
      // (title, sharing type), carried alongside the OCR'd identity so a
      // saved aadhaarFront doc has the complete, admin-confirmed traveller.
      title: { type: String, default: "" },
      sharingType: { type: String, default: "" },
    },
    amount: { type: Number, default: null },
    url: {
      type: String,
      // Only aadhaarFront/aadhaarBack/payment* docs carry an uploaded
      // image — a "bookingNotes" doc is plain typed text, no file.
      required: function () {
        return this.type !== "bookingNotes";
      },
    },
    uploadedBy: {
      type: String,
      enum: ["user", "admin"],
      default: "admin",
    },
 
    // ── "bookingNotes" type only — admin-typed, free text, reference-only.
    // Never matched against the tour's own boardingPoints/deboardingPoints/
    // variantPackage/addons; the real booking's structured values are
    // picked separately on CreateBooking.jsx and saved to tourBookingModel.
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tour",
      default: null,
    },
    packageType: { type: String, default: "" },
    boardingPoint: { type: String, default: "" },
    deboardingPoint: { type: String, default: "" },
    addons: { type: String, default: "" },
    remarks: { type: String, default: "" },
  },
  { timestamps: true },
);
 
aadhaarSchema.index({ tnr: 1, type: 1 });
aadhaarSchema.index({ tourId: 1, type: 1 });
// groupId's index is already declared via `index: true` on the field above —
// no separate schema.index() needed (that was causing Mongoose's duplicate-
// index warning).
 
const aadhaarModel =
  mongoose.models.aadhaar || mongoose.model("aadhaar", aadhaarSchema);
 
export default aadhaarModel;
