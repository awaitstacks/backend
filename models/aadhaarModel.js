// // // // // import mongoose from "mongoose";

// // // // // const aadhaarSchema = new mongoose.Schema(
// // // // //   {
// // // // //     tnr: {
// // // // //       type: String,
// // // // //       trim: true,
// // // // //       uppercase: true,
// // // // //       index: true,
// // // // //     },
// // // // //     travellerId: {
// // // // //       type: mongoose.Schema.Types.ObjectId,
// // // // //       default: null,
// // // // //     },
// // // // //     type: {
// // // // //       type: String,
// // // // //       enum: [
// // // // //         "aadhaarFront",
// // // // //         "aadhaarBack",
// // // // //         "paymentAdvance",
// // // // //         "paymentBalance",
// // // // //         "paymentPartial",
// // // // //       ],
// // // // //       required: true,
// // // // //     },
// // // // //     isCoTraveller: { type: Boolean, default: false },
// // // // //     ocrText: { type: String, default: "" },
// // // // //     parsed: {
// // // // //       firstName: { type: String, default: "" },
// // // // //       lastName: { type: String, default: "" },
// // // // //       age: { type: Number, default: null },
// // // // //       dob: { type: String, default: "" },
// // // // //       gender: { type: String, default: "" },
// // // // //       address: { type: String, default: "" },
// // // // //       phone: { type: String, default: "" },
// // // // //     },
// // // // //     amount: { type: Number, default: null },
// // // // //     url: { type: String, required: true },
// // // // //     uploadedBy: {
// // // // //       type: String,
// // // // //       enum: ["user", "admin"],
// // // // //       default: "admin",
// // // // //     },
// // // // //   },
// // // // //   { timestamps: true },
// // // // // );

// // // // // aadhaarSchema.index({ tnr: 1, type: 1 });

// // // // // const aadhaarModel =
// // // // //   mongoose.models.aadhaar || mongoose.model("aadhaar", aadhaarSchema);

// // // // // export default aadhaarModel;

// // // // import mongoose from "mongoose";

// // // // const aadhaarSchema = new mongoose.Schema(
// // // //   {
// // // //     tnr: {
// // // //       type: String,
// // // //       trim: true,
// // // //       uppercase: true,
// // // //       index: true,
// // // //     },
// // // //     travellerId: {
// // // //       type: mongoose.Schema.Types.ObjectId,
// // // //       default: null,
// // // //     },
// // // //     type: {
// // // //       type: String,
// // // //       enum: [
// // // //         "aadhaarFront",
// // // //         "aadhaarBack",
// // // //         "paymentAdvance",
// // // //         "paymentBalance",
// // // //         "paymentPartial",
// // // //         "bookingNotes", // Aadhaar Upload page's typed Package/Boarding/
// // // //         // Deboarding/Add-ons/Remarks — saved here, NOT onto
// // // //         // tourBookingModel. CreateBooking.jsx fills those properly via
// // // //         // dropdowns against the tour's real data.
// // // //       ],
// // // //       required: true,
// // // //     },
// // // //     isCoTraveller: { type: Boolean, default: false },
// // // //     ocrText: { type: String, default: "" },
// // // //     parsed: {
// // // //       firstName: { type: String, default: "" },
// // // //       lastName: { type: String, default: "" },
// // // //       age: { type: Number, default: null },
// // // //       dob: { type: String, default: "" },
// // // //       gender: { type: String, default: "" },
// // // //       address: { type: String, default: "" },
// // // //       phone: { type: String, default: "" },
// // // //     },
// // // //     amount: { type: Number, default: null },
// // // //     url: {
// // // //       type: String,
// // // //       // Only aadhaarFront/aadhaarBack/payment* docs carry an uploaded
// // // //       // image — a "bookingNotes" doc is plain typed text, no file.
// // // //       required: function () {
// // // //         return this.type !== "bookingNotes";
// // // //       },
// // // //     },
// // // //     uploadedBy: {
// // // //       type: String,
// // // //       enum: ["user", "admin"],
// // // //       default: "admin",
// // // //     },

// // // //     // ── "bookingNotes" type only — admin-typed, free text, reference-only.
// // // //     // Never matched against the tour's own boardingPoints/deboardingPoints/
// // // //     // variantPackage/addons; the real booking's structured values are
// // // //     // picked separately on CreateBooking.jsx and saved to tourBookingModel.
// // // //     tourId: {
// // // //       type: mongoose.Schema.Types.ObjectId,
// // // //       ref: "tour",
// // // //       default: null,
// // // //     },
// // // //     packageType: { type: String, default: "" },
// // // //     boardingPoint: { type: String, default: "" },
// // // //     deboardingPoint: { type: String, default: "" },
// // // //     addons: { type: String, default: "" },
// // // //     remarks: { type: String, default: "" },
// // // //   },
// // // //   { timestamps: true },
// // // // );

// // // // aadhaarSchema.index({ tnr: 1, type: 1 });
// // // // aadhaarSchema.index({ tourId: 1, type: 1 });

// // // // const aadhaarModel =
// // // //   mongoose.models.aadhaar || mongoose.model("aadhaar", aadhaarSchema);

// // // // export default aadhaarModel;

// // // import mongoose from "mongoose";
 
// // // const aadhaarSchema = new mongoose.Schema(
// // //   {
// // //     tnr: {
// // //       type: String,
// // //       trim: true,
// // //       uppercase: true,
// // //       index: true,
// // //     },
// // //     // Ties together every doc created from ONE "Save Booking" click on the
// // //     // Aadhaar Upload page (aadhaarFront + aadhaarBack + paymentAdvance +
// // //     // bookingNotes), before a real tnr exists yet. The All Bookings page
// // //     // will fetch a walk-in booking's pieces by groupId; once it's actually
// // //     // created and gets a tnr, these docs get tnr/travellerId filled in too.
// // //     groupId: {
// // //       type: String,
// // //       index: true,
// // //       default: null,
// // //     },
// // //     travellerId: {
// // //       type: mongoose.Schema.Types.ObjectId,
// // //       default: null,
// // //     },
// // //     type: {
// // //       type: String,
// // //       enum: [
// // //         "aadhaarFront",
// // //         "aadhaarBack",
// // //         "paymentAdvance",
// // //         "paymentBalance",
// // //         "paymentPartial",
// // //         "bookingNotes", // Aadhaar Upload page's typed Package/Boarding/
// // //         // Deboarding/Add-ons/Remarks — saved here, NOT onto
// // //         // tourBookingModel. CreateBooking.jsx fills those properly via
// // //         // dropdowns against the tour's real data.
// // //       ],
// // //       required: true,
// // //     },
// // //     isCoTraveller: { type: Boolean, default: false },
// // //     ocrText: { type: String, default: "" },
// // //     parsed: {
// // //       firstName: { type: String, default: "" },
// // //       lastName: { type: String, default: "" },
// // //       age: { type: Number, default: null },
// // //       dob: { type: String, default: "" },
// // //       gender: { type: String, default: "" },
// // //       address: { type: String, default: "" },
// // //       phone: { type: String, default: "" },
// // //       // Not from OCR — the admin's own picks on the Aadhaar Upload page
// // //       // (title, sharing type), carried alongside the OCR'd identity so a
// // //       // saved aadhaarFront doc has the complete, admin-confirmed traveller.
// // //       title: { type: String, default: "" },
// // //       sharingType: { type: String, default: "" },
// // //     },
// // //     amount: { type: Number, default: null },
// // //     url: {
// // //       type: String,
// // //       // Only aadhaarFront/aadhaarBack/payment* docs carry an uploaded
// // //       // image — a "bookingNotes" doc is plain typed text, no file.
// // //       required: function () {
// // //         return this.type !== "bookingNotes";
// // //       },
// // //     },
// // //     uploadedBy: {
// // //       type: String,
// // //       enum: ["user", "admin"],
// // //       default: "admin",
// // //     },
 
// // //     // ── "bookingNotes" type only — admin-typed, free text, reference-only.
// // //     // Never matched against the tour's own boardingPoints/deboardingPoints/
// // //     // variantPackage/addons; the real booking's structured values are
// // //     // picked separately on CreateBooking.jsx and saved to tourBookingModel.
// // //     tourId: {
// // //       type: mongoose.Schema.Types.ObjectId,
// // //       ref: "tour",
// // //       default: null,
// // //     },
// // //     packageType: { type: String, default: "" },
// // //     boardingPoint: { type: String, default: "" },
// // //     deboardingPoint: { type: String, default: "" },
// // //     addons: { type: String, default: "" },
// // //     remarks: { type: String, default: "" },
// // //   },
// // //   { timestamps: true },
// // // );
 
// // // aadhaarSchema.index({ tnr: 1, type: 1 });
// // // aadhaarSchema.index({ tourId: 1, type: 1 });
// // // // groupId's index is already declared via `index: true` on the field above —
// // // // no separate schema.index() needed (that was causing Mongoose's duplicate-
// // // // index warning).
 
// // // const aadhaarModel =
// // //   mongoose.models.aadhaar || mongoose.model("aadhaar", aadhaarSchema);
 
// // // export default aadhaarModel;

// // import mongoose from "mongoose";
 
// // const aadhaarSchema = new mongoose.Schema(
// //   {
// //     tnr: {
// //       type: String,
// //       trim: true,
// //       uppercase: true,
// //       index: true,
// //     },
// //     // Ties together every doc created from ONE "Save Booking" click on the
// //     // Aadhaar Upload page (aadhaarFront + aadhaarBack + paymentAdvance +
// //     // bookingNotes), before a real tnr exists yet. The All Bookings page
// //     // will fetch a walk-in booking's pieces by groupId; once it's actually
// //     // created and gets a tnr, these docs get tnr/travellerId filled in too.
// //     groupId: {
// //       type: String,
// //       index: true,
// //       default: null,
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
// //         "bookingNotes", // Aadhaar Upload page's typed Package/Boarding/
// //         // Deboarding/Add-ons/Remarks — saved here, NOT onto
// //         // tourBookingModel. CreateBooking.jsx fills those properly via
// //         // dropdowns against the tour's real data.
// //       ],
// //       required: true,
// //     },
// //     isCoTraveller: { type: Boolean, default: false },
// //     // True only when this traveller (an aadhaarFront doc) was added via
// //     // "Add Co-Traveller" on the All Bookings tab AFTER the group already
// //     // had a tnr linked — i.e. added post-booking-creation, not part of the
// //     // original Save Booking capture. Only postBooking:true travellers
// //     // should ever show a "Raise Manage Booking" button — everyone who was
// //     // already in the booking when it was created doesn't need one. Stays
// //     // false forever for the original main/co-travellers, even after
// //     // linkGroupTnr backfills `tnr` onto their docs later.
// //     postBooking: { type: Boolean, default: false },
// //     ocrText: { type: String, default: "" },
// //     parsed: {
// //       firstName: { type: String, default: "" },
// //       lastName: { type: String, default: "" },
// //       age: { type: Number, default: null },
// //       dob: { type: String, default: "" },
// //       gender: { type: String, default: "" },
// //       address: { type: String, default: "" },
// //       phone: { type: String, default: "" },
// //       // Not from OCR — the admin's own picks on the Aadhaar Upload page
// //       // (title, sharing type), carried alongside the OCR'd identity so a
// //       // saved aadhaarFront doc has the complete, admin-confirmed traveller.
// //       title: { type: String, default: "" },
// //       sharingType: { type: String, default: "" },
// //     },
// //     amount: { type: Number, default: null },
// //     url: {
// //       type: String,
// //       // Only aadhaarFront/aadhaarBack/payment* docs carry an uploaded
// //       // image — a "bookingNotes" doc is plain typed text, no file.
// //       required: function () {
// //         return this.type !== "bookingNotes";
// //       },
// //     },
// //     uploadedBy: {
// //       type: String,
// //       enum: ["user", "admin"],
// //       default: "admin",
// //     },
 
// //     // ── "bookingNotes" type only — admin-typed, free text, reference-only.
// //     // Never matched against the tour's own boardingPoints/deboardingPoints/
// //     // variantPackage/addons; the real booking's structured values are
// //     // picked separately on CreateBooking.jsx and saved to tourBookingModel.
// //     tourId: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: "tour",
// //       default: null,
// //     },
// //     packageType: { type: String, default: "" },
// //     boardingPoint: { type: String, default: "" },
// //     deboardingPoint: { type: String, default: "" },
// //     addons: { type: String, default: "" },
// //     // Structured, train/flight-wise breakdown of the same add-ons that
// //     // `addons` above flattens into one comma-joined string — e.g.
// //     // [{ label: "PUNE EXP (12345) - onward", name: "3AC Extra", amount: 500 }].
// //     // `addons` is kept for backward compatibility with bookings saved
// //     // before this field existed; the All Bookings card renders from
// //     // addonsDetail when present and falls back to the plain string
// //     // otherwise.
// //     addonsDetail: {
// //       type: [
// //         {
// //           label: { type: String, default: "" },
// //           name: { type: String, default: "" },
// //           amount: { type: Number, default: 0 },
// //           _id: false,
// //         },
// //       ],
// //       default: [],
// //     },
// //     remarks: { type: String, default: "" },
// //   },
// //   { timestamps: true },
// // );
 
// // aadhaarSchema.index({ tnr: 1, type: 1 });
// // aadhaarSchema.index({ tourId: 1, type: 1 });
// // // groupId's index is already declared via `index: true` on the field above —
// // // no separate schema.index() needed (that was causing Mongoose's duplicate-
// // // index warning).
 
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
//     // Ties together every doc created from ONE "Save Booking" click on the
//     // Aadhaar Upload page (aadhaarFront + aadhaarBack + paymentAdvance +
//     // bookingNotes), before a real tnr exists yet. The All Bookings page
//     // will fetch a walk-in booking's pieces by groupId; once it's actually
//     // created and gets a tnr, these docs get tnr/travellerId filled in too.
//     groupId: {
//       type: String,
//       index: true,
//       default: null,
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
//         "guestLink", // Admin-only marker doc — no image, no OCR. Links 2+
//         // TNRs together as the SAME real guest (e.g. "Vishvanathan" on one
//         // booking, "Jeyandhi" on another — same person). Its tnr field
//         // holds ONE of the linked TNRs (the one this doc was created
//         // from); `guestTnrs` below holds the full linked group (including
//         // that same tnr). `remarks` doubles as this group's optional
//         // free-text label. Never written by OCR/upload flows — only by
//         // linkGuestTnr/unlinkGuestTnr.
//       ],
//       required: true,
//     },
//     // Only set when type === "guestLink": every TNR (uppercased, deduped)
//     // that is the same real guest as this doc's own `tnr`. Kept as a flat
//     // array rather than a separate collection so "this booking's guest
//     // also has these other bookings" is just one more aadhaarModel query.
//     guestTnrs: { type: [String], default: undefined },
//     isCoTraveller: { type: Boolean, default: false },
//     // True only when this traveller (an aadhaarFront doc) was added via
//     // "Add Co-Traveller" on the All Bookings tab AFTER the group already
//     // had a tnr linked — i.e. added post-booking-creation, not part of the
//     // original Save Booking capture. Only postBooking:true travellers
//     // should ever show a "Raise Manage Booking" button — everyone who was
//     // already in the booking when it was created doesn't need one. Stays
//     // false forever for the original main/co-travellers, even after
//     // linkGroupTnr backfills `tnr` onto their docs later.
//     postBooking: { type: Boolean, default: false },
//     ocrText: { type: String, default: "" },
//     parsed: {
//       firstName: { type: String, default: "" },
//       lastName: { type: String, default: "" },
//       age: { type: Number, default: null },
//       dob: { type: String, default: "" },
//       gender: { type: String, default: "" },
//       // One combined line (kept for backward compatibility with bookings
//       // saved before the split fields below existed) plus the split-out
//       // fields the booking form now shows separately. Country is always
//       // "India" and is never stored — every tour/traveller here is
//       // domestic, so it's just shown as a fixed label on the form.
//       address: { type: String, default: "" },
//       addressLine1: { type: String, default: "" },
//       addressLine2: { type: String, default: "" },
//       city: { type: String, default: "" },
//       state: { type: String, default: "" },
//       pincode: { type: String, default: "" },
//       phone: { type: String, default: "" },
//       // Not from OCR — the admin's own picks on the Aadhaar Upload page
//       // (title, sharing type), carried alongside the OCR'd identity so a
//       // saved aadhaarFront doc has the complete, admin-confirmed traveller.
//       title: { type: String, default: "" },
//       sharingType: { type: String, default: "" },
//     },
//     amount: { type: Number, default: null },
//     url: {
//       type: String,
//       // Only aadhaarFront/aadhaarBack/payment* docs carry an uploaded
//       // image — "bookingNotes" is plain typed text and "guestLink" is a
//       // pure marker doc, neither has a file.
//       required: function () {
//         return this.type !== "bookingNotes" && this.type !== "guestLink";
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
//     // packageType (above) is only the display label ("Main Package" /
//     // "Variant 2") shown on the card — it can't be matched back to a real
//     // tour.variantPackage entry. packageKind + variantPackageIndex are the
//     // MACHINE-READABLE pair used for that: packageKind is "main" or
//     // "variant"; variantPackageIndex is that variant's array index on the
//     // tour (null for "main"). Needed to compute this booking's real
//     // package price (see computePackageAmount in aadhaarController.js) —
//     // without the index, a variant package's price can't be looked up at
//     // all since variants can have completely different pricing.
//     packageKind: { type: String, enum: ["main", "variant", ""], default: "" },
//     variantPackageIndex: { type: Number, default: null },
//     boardingPoint: { type: String, default: "" },
//     deboardingPoint: { type: String, default: "" },
//     addons: { type: String, default: "" },
//     // Structured, train/flight-wise breakdown of the same add-ons that
//     // `addons` above flattens into one comma-joined string — e.g.
//     // [{ label: "PUNE EXP (12345) - onward", name: "3AC Extra", amount: 500 }].
//     // `addons` is kept for backward compatibility with bookings saved
//     // before this field existed; the All Bookings card renders from
//     // addonsDetail when present and falls back to the plain string
//     // otherwise.
//     addonsDetail: {
//       type: [
//         {
//           label: { type: String, default: "" },
//           name: { type: String, default: "" },
//           amount: { type: Number, default: 0 },
//           _id: false,
//         },
//       ],
//       default: [],
//     },
//     remarks: { type: String, default: "" },
//     // Which staff member actually raised/saved this booking — picked from
//     // the Staff-Profile directory on the Save Booking form (type:
//     // "bookingNotes" docs only). A plain name+employeeId snapshot, not a
//     // ref — so the All Bookings card still shows who saved it even if that
//     // staff profile is later renamed or deleted.
//     raisedBy: {
//       name: { type: String, default: "" },
//       employeeId: { type: String, default: "" },
//     },
//   },
//   { timestamps: true },
// );
 
// aadhaarSchema.index({ tnr: 1, type: 1 });
// aadhaarSchema.index({ tourId: 1, type: 1 });
// // groupId's index is already declared via `index: true` on the field above —
// // no separate schema.index() needed (that was causing Mongoose's duplicate-
// // index warning).
 
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
        "guestLink", // Admin-only marker doc — no image, no OCR. Links 2+
        // TNRs together as the SAME real guest (e.g. "Vishvanathan" on one
        // booking, "Jeyandhi" on another — same person). Its tnr field
        // holds ONE of the linked TNRs (the one this doc was created
        // from); `guestTnrs` below holds the full linked group (including
        // that same tnr). `remarks` doubles as this group's optional
        // free-text label. Never written by OCR/upload flows — only by
        // linkGuestTnr/unlinkGuestTnr.
      ],
      required: true,
    },
    // Only set when type === "guestLink": every TNR (uppercased, deduped)
    // that is the same real guest as this doc's own `tnr`. Kept as a flat
    // array rather than a separate collection so "this booking's guest
    // also has these other bookings" is just one more aadhaarModel query.
    guestTnrs: { type: [String], default: undefined },
    isCoTraveller: { type: Boolean, default: false },
    // True only when this traveller (an aadhaarFront doc) was added via
    // "Add Co-Traveller" on the All Bookings tab AFTER the group already
    // had a tnr linked — i.e. added post-booking-creation, not part of the
    // original Save Booking capture. Only postBooking:true travellers
    // should ever show a "Raise Manage Booking" button — everyone who was
    // already in the booking when it was created doesn't need one. Stays
    // false forever for the original main/co-travellers, even after
    // linkGroupTnr backfills `tnr` onto their docs later.
    postBooking: { type: Boolean, default: false },
    ocrText: { type: String, default: "" },
    parsed: {
      firstName: { type: String, default: "" },
      lastName: { type: String, default: "" },
      age: { type: Number, default: null },
      dob: { type: String, default: "" },
      gender: { type: String, default: "" },
      // One combined line (kept for backward compatibility with bookings
      // saved before the split fields below existed) plus the split-out
      // fields the booking form now shows separately. Country is always
      // "India" and is never stored — every tour/traveller here is
      // domestic, so it's just shown as a fixed label on the form.
      address: { type: String, default: "" },
      addressLine1: { type: String, default: "" },
      addressLine2: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
      phone: { type: String, default: "" },
      // Not from OCR — the admin's own picks on the Aadhaar Upload page
      // (title, sharing type), carried alongside the OCR'd identity so a
      // saved aadhaarFront doc has the complete, admin-confirmed traveller.
      title: { type: String, default: "" },
      sharingType: { type: String, default: "" },
    },
    amount: { type: Number, default: null },
    // "paymentPartial" / "paymentBalance" docs only — the Payment Tasks
    // dashboard's manual "Mark Done" action sets this once the admin has
    // actually processed/reconciled that screenshot. Until then it shows
    // up as a pending task (with its amount + uploaded date/time). Advance
    // has no equivalent field here — that task is driven entirely off
    // tourBookingModel.payment.advance.paid, set by the EXISTING "mark
    // advance paid" action on the Tour Bookings page, so it clears on its
    // own without a separate mark-done step on this dashboard.
    taskCleared: { type: Boolean, default: false },
    url: {
      type: String,
      // Only aadhaarFront/aadhaarBack/payment* docs carry an uploaded
      // image — "bookingNotes" is plain typed text and "guestLink" is a
      // pure marker doc, neither has a file.
      required: function () {
        return this.type !== "bookingNotes" && this.type !== "guestLink";
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
    // packageType (above) is only the display label ("Main Package" /
    // "Variant 2") shown on the card — it can't be matched back to a real
    // tour.variantPackage entry. packageKind + variantPackageIndex are the
    // MACHINE-READABLE pair used for that: packageKind is "main" or
    // "variant"; variantPackageIndex is that variant's array index on the
    // tour (null for "main"). Needed to compute this booking's real
    // package price (see computePackageAmount in aadhaarController.js) —
    // without the index, a variant package's price can't be looked up at
    // all since variants can have completely different pricing.
    packageKind: { type: String, enum: ["main", "variant", ""], default: "" },
    variantPackageIndex: { type: Number, default: null },
    boardingPoint: { type: String, default: "" },
    deboardingPoint: { type: String, default: "" },
    addons: { type: String, default: "" },
    // Structured, train/flight-wise breakdown of the same add-ons that
    // `addons` above flattens into one comma-joined string — e.g.
    // [{ label: "PUNE EXP (12345) - onward", name: "3AC Extra", amount: 500 }].
    // `addons` is kept for backward compatibility with bookings saved
    // before this field existed; the All Bookings card renders from
    // addonsDetail when present and falls back to the plain string
    // otherwise.
    addonsDetail: {
      type: [
        {
          label: { type: String, default: "" },
          name: { type: String, default: "" },
          amount: { type: Number, default: 0 },
          _id: false,
        },
      ],
      default: [],
    },
    remarks: { type: String, default: "" },
    // Which staff member actually raised/saved this booking — picked from
    // the Staff-Profile directory on the Save Booking form (type:
    // "bookingNotes" docs only). A plain name+employeeId snapshot, not a
    // ref — so the All Bookings card still shows who saved it even if that
    // staff profile is later renamed or deleted.
    raisedBy: {
      name: { type: String, default: "" },
      employeeId: { type: String, default: "" },
    },
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
 
