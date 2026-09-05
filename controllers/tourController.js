// import mongoose from "mongoose"; // Added missing import
// import jwt from "jsonwebtoken";
// import { v2 as cloudinary } from "cloudinary";

// import tourModel from "../models/tourModel.js";
// import tourBookingModel from "../models/tourBookingmodel.js";
// import cancellationModel from "../models/cancellationModel.js";
// import manageBookingModel from "../models/manageBookingModel.js";
// import tourRoomAllocationModel from "../models/roomModel.js";
// import TourVehicle from "../models/tourVehicleModel.js";
// import PaymentMethod from "../models/paymentModel.js";
// import BalanceMethod from "../models/balanceReminderModel.js";
// import enquiryModel from "../models/enquiryModel.js";
// import { buildInvoiceView, currencyRound } from "./invoiceView.js";
// import invoiceModel from "../models/invoiceModel.js"; // ← the new separate model

// // Whenever booking data that affects invoice totals changes (admin remarks,
// // advance/balance shifts, payment status), the previously saved (edited)
// // invoice snapshot is now stale. Delete it so the next GET /invoice/:tnr
// // rebuilds fresh via buildInvoiceView — same as manual "revert" flow.

// // const freezeEditedEntries = (incoming, freshAuto) => {
// //   const freshItemMap = new Map((freshAuto.items || []).map((i) => [i.sourceRef, i]));
// //   const freshPaymentMap = new Map((freshAuto.payments || []).map((p) => [p.sourceRef, p]));

// //   const items = (incoming.items || []).map((item) => {
// //     if (!item.sourceRef) return item; // already manual
// //     const fresh = freshItemMap.get(item.sourceRef);
// //     const changed =
// //       !fresh ||
// //       fresh.description !== item.description ||
// //       fresh.subDescription !== item.subDescription ||
// //       Number(fresh.gstRate) !== Number(item.gstRate) ||
// //       Number(fresh.quantity) !== Number(item.quantity) ||
// //       Number(fresh.rate) !== Number(item.rate);
// //     return changed ? { ...item, sourceRef: null } : item;
// //   });

// //   const payments = (incoming.payments || []).map((p) => {
// //     if (!p.sourceRef) return p; // already manual
// //     const fresh = freshPaymentMap.get(p.sourceRef);
// //     const changed =
// //       !fresh ||
// //       Number(fresh.amountReceived) !== Number(p.amountReceived) ||
// //       new Date(fresh.date || 0).getTime() !== new Date(p.date || 0).getTime();
// //     return changed ? { ...p, sourceRef: null } : p;
// //   });

// //   return { ...incoming, items, payments };
// // };
// // // Merges a fresh (auto) list into a saved list while PRESERVING the saved
// // // list's row order. Existing rows (manual or still-synced) keep their
// // // position; only brand-new auto entries get appended at the end.
// // const mergeInOrder = (savedList, freshList, deletedRefs) => {
// //   const freshMap = new Map((freshList || []).map((i) => [i.sourceRef, i]));
// //   const savedRefsPresent = new Set(
// //     (savedList || []).map((i) => i.sourceRef).filter(Boolean),
// //   );

// //   const merged = (savedList || [])
// //     .map((i) => {
// //       if (!i.sourceRef) return i; // manual (edited) — as-is, same position
// //       if (deletedRefs.has(i.sourceRef)) return null;
// //       const fresh = freshMap.get(i.sourceRef);
// //       return fresh || null; // still auto-synced — refresh value, SAME position
// //     })
// //     .filter(Boolean);

// //   const newEntries = (freshList || []).filter(
// //     (i) => !savedRefsPresent.has(i.sourceRef) && !deletedRefs.has(i.sourceRef),
// //   );

// //   return [...merged, ...newEntries]; // brand-new auto rows → append at end only
// // };
// // const syncInvoiceWithBooking = (savedInvoice, booking, tour, cancellations = []) => {
// //   const freshAuto = buildInvoiceView(booking, tour, cancellations);
// //   if (!freshAuto) return savedInvoice;

// //   const deletedRefs = new Set(savedInvoice.deletedSourceRefs || []);

// //   const mergedItems = mergeInOrder(savedInvoice.items, freshAuto.items, deletedRefs);
// //   const mergedPayments = mergeInOrder(savedInvoice.payments, freshAuto.payments, deletedRefs);

// //   // ...rest stays exactly the same

// //   const amountSum = currencyRound(mergedItems.reduce((s, i) => s + (i.amount || 0), 0));
// //   const cgstSum = currencyRound(mergedItems.reduce((s, i) => s + (i.cgst || 0), 0));
// //   const sgstSum = currencyRound(mergedItems.reduce((s, i) => s + (i.sgst || 0), 0));
// //   const roundOff = Number(savedInvoice.totals?.roundOff || 0);
// //   const grandTotal = currencyRound(amountSum + cgstSum + sgstSum + roundOff);

// //   const amountPaid = currencyRound(mergedPayments.reduce((s, p) => s + (p.amountReceived || 0), 0));
// //   const dueAmount = Math.max(0, currencyRound(grandTotal - amountPaid));
// //   const status = dueAmount <= 0 ? "Paid" : "Part Paid";

// //   return {
// //     ...savedInvoice,
// //     items: mergedItems,
// //     payments: mergedPayments,
// //     deletedSourceRefs: savedInvoice.deletedSourceRefs || [],
// //     totals: { amount: amountSum, cgst: cgstSum, sgst: sgstSum, roundOff, grandTotal },
// //     amountPaid,
// //     dueAmount,
// //     status,
// //   };
// // };

// // // ── Route handler — GET /api/tour/invoice/:tnr ───────────────────────────
// // const getBookingInvoice = async (req, res) => {
// //   try {
// //     const { tnr } = req.params;

// //     if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Valid 6-character TNR is required",
// //       });
// //     }

// //     const normalizedTnr = tnr.trim().toUpperCase();

// //     const booking = await tourBookingModel
// //       .findOne({ tnr: normalizedTnr })
// //       .lean();

// //     if (!booking) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Booking not found with this TNR",
// //       });
// //     }

// //     // Fetch the LIVE tour doc (not the stale tourData snapshot on the
// //     // booking), so gst / price always reflect current tour settings.
// //     const tour = await tourModel.findById(booking.tourId).lean();

// //     if (!tour) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Tour not found for this booking",
// //       });
// //     }

// //     // Fetch all cancellation records tied to this booking — these hold
// //     // the travellerIds needed to work out GV/IRCTC cancellation pool
// //     // quantity on the invoice (see buildCancellationPoolItems).
// //     // Fetch all cancellation records tied to this booking — matched by TNR,
// //     // same pattern as getCancellationsByBooking, since bookingId may not be
// //     // reliably populated on every cancellation record.
// //     const cancellations = await cancellationModel
// //       .find({ tnr: normalizedTnr })
// //       .lean();

// //     const savedInvoice = await invoiceModel.findOne({ tnr: normalizedTnr }).lean();

// //     let invoice;
// //     if (!savedInvoice) {
// //       invoice = buildInvoiceView(booking, tour, cancellations);
// //     } else {
// //       invoice = syncInvoiceWithBooking(savedInvoice, booking, tour, cancellations);
// //       if (invoice) {
// //         // Keep the saved doc's synced values up to date too, so any other
// //         // code path reading straight from invoiceModel sees the same data.
// //         await invoiceModel.findOneAndUpdate(
// //           { tnr: normalizedTnr },
// //           { $set: invoice },
// //           { new: false },
// //         );
// //       }
// //     }

// //     return res.status(200).json({
// //       success: true,
// //       invoice, // null if advance not yet paid
// //     });
// //   } catch (error) {
// //     console.error("getBookingInvoice error:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Server error while building invoice",
// //       error: error.message,
// //     });
// //   }
// // };
// // // PUT /api/tour/invoice/:tnr
// // // Saves the admin's edited invoice into the SEPARATE invoice collection —
// // // tourBookingModel is never touched by this.
// // const updateBookingInvoice = async (req, res) => {
// //   try {
// //     const { tnr } = req.params;
// //     const { invoice } = req.body;

// //     if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Valid 6-character TNR is required",
// //       });
// //     }

// //     if (!invoice || typeof invoice !== "object") {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Invoice data is required",
// //       });
// //     }

// //     const normalizedTnr = tnr.trim().toUpperCase();

// //     const booking = await tourBookingModel.findOne({ tnr: normalizedTnr });

// //     if (!booking) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Booking not found with this TNR",
// //       });
// //     }

// //     if (!booking.invoiceNumber) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Cannot edit invoice before advance is paid",
// //       });
// //     }

// //     const tour = await tourModel.findById(booking.tourId).lean();

// //     // ← ADDED: fetch cancellations, same as getBookingInvoice does
// //     const cancellations = await cancellationModel
// //       .find({ tnr: normalizedTnr })
// //       .lean();

// //     const freshAuto =
// //       buildInvoiceView(booking.toObject ? booking.toObject() : booking, tour, cancellations) || {
// //         items: [],
// //         payments: [],
// //       };

// //     // ...rest stays exactly the same

// //     // Any auto item/payment whose value the admin actually changed gets
// //     // frozen (sourceRef cleared) so it stops auto-syncing from now on.
// //     const frozenInvoice = freezeEditedEntries(invoice, freshAuto);

// //     // Any auto sourceRef that existed in freshAuto but is MISSING from the
// //     // admin's saved item/payment list was deliberately removed — track it
// //     // so future syncs never regenerate it again.
// //     const incomingItemRefs = new Set(
// //       (frozenInvoice.items || []).map((i) => i.sourceRef).filter(Boolean),
// //     );
// //     const incomingPaymentRefs = new Set(
// //       (frozenInvoice.payments || []).map((p) => p.sourceRef).filter(Boolean),
// //     );

// //     const newlyDeletedRefs = [
// //       ...freshAuto.items.filter((i) => !incomingItemRefs.has(i.sourceRef)).map((i) => i.sourceRef),
// //       ...freshAuto.payments.filter((p) => !incomingPaymentRefs.has(p.sourceRef)).map((p) => p.sourceRef),
// //     ];

// //     const existing = await invoiceModel.findOne({ tnr: normalizedTnr }).lean();
// //     const deletedSourceRefs = Array.from(
// //       new Set([...(existing?.deletedSourceRefs || []), ...newlyDeletedRefs]),
// //     );

// //     const saved = await invoiceModel.findOneAndUpdate(
// //       { tnr: normalizedTnr },
// //       {
// //         ...frozenInvoice,
// //         tnr: normalizedTnr,
// //         bookingId: booking._id,
// //         invoiceNumber: booking.invoiceNumber,
// //         deletedSourceRefs,
// //       },
// //       { upsert: true, new: true, runValidators: true },
// //     );

// //     return res.status(200).json({
// //       success: true,
// //       message: "Invoice saved successfully",
// //       invoice: saved,
// //     });
// //   } catch (error) {
// //     console.error("updateBookingInvoice error:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Server error while saving invoice",
// //       error: error.message,
// //     });
// //   }
// // };

// // // DELETE /api/tour/invoice/:tnr
// // // Removes the saved (edited) invoice document. Does NOT touch
// // // tourBookingModel at all — invoiceNumber stays exactly as it is.
// // // After this, GET /api/tour/invoice/:tnr goes back to auto-calculating
// // // the invoice fresh from travellers/tourData, same as before any edit.
// // const deleteBookingInvoice = async (req, res) => {
// //   try {
// //     const { tnr } = req.params;

// //     if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Valid 6-character TNR is required",
// //       });
// //     }

// //     const normalizedTnr = tnr.trim().toUpperCase();

// //     const deleted = await invoiceModel.findOneAndDelete({ tnr: normalizedTnr });

// //     if (!deleted) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "No saved edit found for this invoice",
// //       });
// //     }

// //     return res.status(200).json({
// //       success: true,
// //       message: "Saved invoice edit removed — reverted to auto-calculated",
// //     });
// //   } catch (error) {
// //     console.error("deleteBookingInvoice error:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Server error while deleting invoice",
// //       error: error.message,
// //     });
// //   }
// // };

// const freezeEditedEntries = (incoming, freshAuto) => {
//   const freshItemMap = new Map((freshAuto.items || []).map((i) => [i.sourceRef, i]));
//   const freshPaymentMap = new Map((freshAuto.payments || []).map((p) => [p.sourceRef, p]));

//   const items = (incoming.items || []).map((item) => {
//     if (!item.sourceRef) return item; // already manual
//     const fresh = freshItemMap.get(item.sourceRef);
//     const changed =
//       !fresh ||
//       fresh.description !== item.description ||
//       fresh.subDescription !== item.subDescription ||
//       Number(fresh.gstRate) !== Number(item.gstRate) ||
//       Number(fresh.quantity) !== Number(item.quantity) ||
//       Number(fresh.rate) !== Number(item.rate);
//     return changed ? { ...item, sourceRef: null } : item;
//   });

//   const payments = (incoming.payments || []).map((p) => {
//     if (!p.sourceRef) return p; // already manual
//     const fresh = freshPaymentMap.get(p.sourceRef);
//     const changed =
//       !fresh ||
//       Number(fresh.amountReceived) !== Number(p.amountReceived) ||
//       new Date(fresh.date || 0).getTime() !== new Date(p.date || 0).getTime();
//     return changed ? { ...p, sourceRef: null } : p;
//   });

//   return { ...incoming, items, payments };
// };
// // Merges a fresh (auto) list into a saved list while PRESERVING the saved
// // list's row order. Existing rows (manual or still-synced) keep their
// // position; only brand-new auto entries get appended at the end.
// const mergeInOrder = (savedList, freshList, deletedRefs) => {
//   const freshMap = new Map((freshList || []).map((i) => [i.sourceRef, i]));
//   const savedRefsPresent = new Set(
//     (savedList || []).map((i) => i.sourceRef).filter(Boolean),
//   );

//   const merged = (savedList || [])
//     .map((i) => {
//       if (!i.sourceRef) return i; // manual (edited) — as-is, same position
//       if (deletedRefs.has(i.sourceRef)) return null;
//       const fresh = freshMap.get(i.sourceRef);
//       return fresh || null; // still auto-synced — refresh value, SAME position
//     })
//     .filter(Boolean);

//   const newEntries = (freshList || []).filter(
//     (i) => !savedRefsPresent.has(i.sourceRef) && !deletedRefs.has(i.sourceRef),
//   );

//   return [...merged, ...newEntries]; // brand-new auto rows → append at end only
// };
// const syncInvoiceWithBooking = (savedInvoice, booking, tour, cancellations = []) => {
//   const freshAuto = buildInvoiceView(booking, tour, cancellations);
//   if (!freshAuto) return savedInvoice;

//   const deletedRefs = new Set(savedInvoice.deletedSourceRefs || []);

//   const mergedItems = mergeInOrder(savedInvoice.items, freshAuto.items, deletedRefs);
//   const mergedPayments = mergeInOrder(savedInvoice.payments, freshAuto.payments, deletedRefs);

//   // ...rest stays exactly the same

//   const amountSum = currencyRound(mergedItems.reduce((s, i) => s + (i.amount || 0), 0));
//   const cgstSum = currencyRound(mergedItems.reduce((s, i) => s + (i.cgst || 0), 0));
//   const sgstSum = currencyRound(mergedItems.reduce((s, i) => s + (i.sgst || 0), 0));
//   const roundOff = Number(savedInvoice.totals?.roundOff || 0);
//   const grandTotal = currencyRound(amountSum + cgstSum + sgstSum + roundOff);

//   const amountPaid = currencyRound(mergedPayments.reduce((s, p) => s + (p.amountReceived || 0), 0));
//   const rawDue = currencyRound(grandTotal - amountPaid);
//   const dueAmount = Math.max(0, rawDue);
//   // Overpayment (e.g. total dropped after a cancellation/adjustment but
//   // the customer had already paid the old, higher total) → surface as a
//   // refund owed, same rule as buildInvoiceView.
//   const refundAmount = rawDue < 0 ? currencyRound(Math.abs(rawDue)) : 0;
//   const status = dueAmount <= 0 ? "Paid" : "Part Paid";

//   return {
//     ...savedInvoice,
//     items: mergedItems,
//     payments: mergedPayments,
//     deletedSourceRefs: savedInvoice.deletedSourceRefs || [],
//     totals: { amount: amountSum, cgst: cgstSum, sgst: sgstSum, roundOff, grandTotal },
//     amountPaid,
//     dueAmount,
//     refundAmount,
//     status,
//   };
// };

// // ── Route handler — GET /api/tour/invoice/:tnr ───────────────────────────
// const getBookingInvoice = async (req, res) => {
//   try {
//     const { tnr } = req.params;

//     if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid 6-character TNR is required",
//       });
//     }

//     const normalizedTnr = tnr.trim().toUpperCase();

//     const booking = await tourBookingModel
//       .findOne({ tnr: normalizedTnr })
//       .lean();

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found with this TNR",
//       });
//     }

//     // Fetch the LIVE tour doc (not the stale tourData snapshot on the
//     // booking), so gst / price always reflect current tour settings.
//     const tour = await tourModel.findById(booking.tourId).lean();

//     if (!tour) {
//       return res.status(404).json({
//         success: false,
//         message: "Tour not found for this booking",
//       });
//     }

//     // Fetch all cancellation records tied to this booking — these hold
//     // the travellerIds needed to work out GV/IRCTC cancellation pool
//     // quantity on the invoice (see buildCancellationPoolItems).
//     // Fetch all cancellation records tied to this booking — matched by TNR,
//     // same pattern as getCancellationsByBooking, since bookingId may not be
//     // reliably populated on every cancellation record.
//     const cancellations = await cancellationModel
//       .find({ tnr: normalizedTnr })
//       .lean();

//     const savedInvoice = await invoiceModel.findOne({ tnr: normalizedTnr }).lean();

//     let invoice;
//     if (!savedInvoice) {
//       invoice = buildInvoiceView(booking, tour, cancellations);
//     } else {
//       invoice = syncInvoiceWithBooking(savedInvoice, booking, tour, cancellations);
//       if (invoice) {
//         // Keep the saved doc's synced values up to date too, so any other
//         // code path reading straight from invoiceModel sees the same data.
//         await invoiceModel.findOneAndUpdate(
//           { tnr: normalizedTnr },
//           { $set: invoice },
//           { new: false },
//         );
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       invoice, // null if advance not yet paid
//     });
//   } catch (error) {
//     console.error("getBookingInvoice error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while building invoice",
//       error: error.message,
//     });
//   }
// };
// // PUT /api/tour/invoice/:tnr
// // Saves the admin's edited invoice into the SEPARATE invoice collection —
// // tourBookingModel is never touched by this.
// const updateBookingInvoice = async (req, res) => {
//   try {
//     const { tnr } = req.params;
//     const { invoice } = req.body;

//     if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid 6-character TNR is required",
//       });
//     }

//     if (!invoice || typeof invoice !== "object") {
//       return res.status(400).json({
//         success: false,
//         message: "Invoice data is required",
//       });
//     }

//     const normalizedTnr = tnr.trim().toUpperCase();

//     const booking = await tourBookingModel.findOne({ tnr: normalizedTnr });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found with this TNR",
//       });
//     }

//     if (!booking.invoiceNumber) {
//       return res.status(400).json({
//         success: false,
//         message: "Cannot edit invoice before advance is paid",
//       });
//     }

//     const tour = await tourModel.findById(booking.tourId).lean();

//     // ← ADDED: fetch cancellations, same as getBookingInvoice does
//     const cancellations = await cancellationModel
//       .find({ tnr: normalizedTnr })
//       .lean();

//     const freshAuto =
//       buildInvoiceView(booking.toObject ? booking.toObject() : booking, tour, cancellations) || {
//         items: [],
//         payments: [],
//       };

//     // ...rest stays exactly the same

//     // Any auto item/payment whose value the admin actually changed gets
//     // frozen (sourceRef cleared) so it stops auto-syncing from now on.
//     const frozenInvoice = freezeEditedEntries(invoice, freshAuto);

//     // Any auto sourceRef that existed in freshAuto but is MISSING from the
//     // admin's saved item/payment list was deliberately removed — track it
//     // so future syncs never regenerate it again.
//     const incomingItemRefs = new Set(
//       (frozenInvoice.items || []).map((i) => i.sourceRef).filter(Boolean),
//     );
//     const incomingPaymentRefs = new Set(
//       (frozenInvoice.payments || []).map((p) => p.sourceRef).filter(Boolean),
//     );

//     const newlyDeletedRefs = [
//       ...freshAuto.items.filter((i) => !incomingItemRefs.has(i.sourceRef)).map((i) => i.sourceRef),
//       ...freshAuto.payments.filter((p) => !incomingPaymentRefs.has(p.sourceRef)).map((p) => p.sourceRef),
//     ];

//     const existing = await invoiceModel.findOne({ tnr: normalizedTnr }).lean();
//     const deletedSourceRefs = Array.from(
//       new Set([...(existing?.deletedSourceRefs || []), ...newlyDeletedRefs]),
//     );

//     const saved = await invoiceModel.findOneAndUpdate(
//       { tnr: normalizedTnr },
//       {
//         ...frozenInvoice,
//         tnr: normalizedTnr,
//         bookingId: booking._id,
//         invoiceNumber: booking.invoiceNumber,
//         deletedSourceRefs,
//       },
//       { upsert: true, new: true, runValidators: true },
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Invoice saved successfully",
//       invoice: saved,
//     });
//   } catch (error) {
//     console.error("updateBookingInvoice error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while saving invoice",
//       error: error.message,
//     });
//   }
// };

// // DELETE /api/tour/invoice/:tnr
// // Removes the saved (edited) invoice document. Does NOT touch
// // tourBookingModel at all — invoiceNumber stays exactly as it is.
// // After this, GET /api/tour/invoice/:tnr goes back to auto-calculating
// // the invoice fresh from travellers/tourData, same as before any edit.
// const deleteBookingInvoice = async (req, res) => {
//   try {
//     const { tnr } = req.params;

//     if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid 6-character TNR is required",
//       });
//     }

//     const normalizedTnr = tnr.trim().toUpperCase();

//     const deleted = await invoiceModel.findOneAndDelete({ tnr: normalizedTnr });

//     if (!deleted) {
//       return res.status(404).json({
//         success: false,
//         message: "No saved edit found for this invoice",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Saved invoice edit removed — reverted to auto-calculated",
//     });
//   } catch (error) {
//     console.error("deleteBookingInvoice error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while deleting invoice",
//       error: error.message,
//     });
//   }
// };

// const tourList = async (req, res) => {
//   try {
//     const tours = await tourModel
//       .find({})
//       .sort({
//         // 1. lastBookingDate year (descending) – newest year first
//         lastBookingDate: -1,
//         // 2. same year la irundha createdAt newest first
//         createdAt: -1,
//       })
//       .lean();

//     res.json({
//       success: true,
//       total: tours.length,
//       tours,
//     });
//   } catch (error) {
//     console.error("Error in tourList:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch all tours",
//       error: error.message,
//     });
//   }
// };

// const loginTour = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (
//       email === process.env.TOUR_EMAIL &&
//       password === process.env.TOUR_PASSWORD
//     ) {
//       const token = jwt.sign(email + password, process.env.JWT_SECRET);
//       return res.json({
//         success: true,
//         token,
//         message: "Tour login successful",
//       });
//     }

//     res.json({
//       success: false,
//       message: "Invalid credentials",
//     });
//   } catch (error) {
//     console.error("Tour login error:", error);
//     res.json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// const bookingsTour = async (req, res) => {
//   try {
//     // Get the tourId from the URL parameter
//     const tourId = req.params.tourId;

//     if (!tourId) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Tour ID is missing" });
//     }

//     const bookings = await tourBookingModel
//       .find({ tourId })
//       .populate({
//         path: "userId",
//         model: "user",
//         select: "-password",
//       })
//       .populate({
//         path: "tourId",
//         model: "tour",
//       });

//     res.json({
//       success: true,
//       total: bookings.length,
//       bookings,
//     });
//   } catch (error) {
//     console.error("Error fetching bookings:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };


// const bookingComplete = async (req, res) => {
//   try {
//     const { tnr, tourId } = req.body;

//     if (!tnr) {
//       return res.status(400).json({
//         success: false,
//         message: "TNR is missing. Please provide a valid TNR.",
//       });
//     }

//     if (!tourId) {
//       return res.status(400).json({
//         success: false,
//         message: "Tour ID is missing. Please provide a valid tour ID.",
//       });
//     }

//     // 1. Fetch booking by TNR (case-insensitive)
//     const booking = await tourBookingModel.findOne({
//       tnr: tnr.trim().toUpperCase(),
//     });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "No booking found with the provided TNR.",
//       });
//     }

//     // 2. Ensure the booking belongs to this tour
//     if (booking.tourId.toString() !== tourId) {
//       return res.status(403).json({
//         success: false,
//         message:
//           "You are not authorized to modify this booking. It belongs to another tour.",
//       });
//     }

//     // 3. Check if already marked as completed
//     if (booking.isBookingCompleted) {
//       return res.json({
//         success: false,
//         message: "This booking is already marked as completed.",
//       });
//     }

//     // 4. Check cancellation conditions
//     const allTravellersCancelledValid = booking.travellers.every(
//       (traveller) =>
//         (traveller.cancelled?.byTraveller === true &&
//           traveller.cancelled?.byAdmin === true) ||
//         (traveller.cancelled?.byAdmin === true &&
//           traveller.cancelled?.byTraveller !== true),
//     );

//     if (!allTravellersCancelledValid) {
//       // 5. Check for travellers with only traveller cancellation (pending approval)
//       const travellerCancellationIssues = booking.travellers.filter(
//         (traveller) =>
//           traveller.cancelled?.byTraveller === true &&
//           traveller.cancelled?.byAdmin !== true,
//       );

//       if (travellerCancellationIssues.length > 0) {
//         const cancelledTravellersList = travellerCancellationIssues
//           .map((t) => `${t.firstName || "Unnamed"} ${t.lastName || ""}`)
//           .join(", ");

//         return res.json({
//           success: false,
//           message: `Cancellation request pending for traveller(s): ${cancelledTravellersList}`,
//         });
//       }

//       // 6. Payment + Receipt checks (only if not all travellers meet cancellation conditions)
//       const { advance, balance } = booking.payment || {};
//       const { receipts } = booking;

//       // Advance checks
//       if (!advance?.paid) {
//         return res.json({
//           success: false,
//           message: "Advance payment has not been made.",
//         });
//       }
//       if (!advance?.paymentVerified) {
//         return res.json({
//           success: false,
//           message: "Advance payment is pending verification.",
//         });
//       }
//       if (!receipts?.advanceReceiptSent) {
//         return res.json({
//           success: false,
//           message: "Advance receipt has not been sent.",
//         });
//       }

//       // Balance checks
//       if (!balance?.paid) {
//         return res.json({
//           success: false,
//           message: "Balance payment has not been made.",
//         });
//       }
//       if (!balance?.paymentVerified) {
//         return res.json({
//           success: false,
//           message: "Balance payment is pending verification.",
//         });
//       }
//       if (!receipts?.balanceReceiptSent) {
//         return res.json({
//           success: false,
//           message: "Balance receipt has not been sent.",
//         });
//       }

//       if (booking.isTripCompleted) {
//         return res.json({
//           success: false,
//           message: "Modified receipt has not been sent.",
//         });
//       }
//     }

//     // 7. Mark booking as completed
//     booking.isBookingCompleted = true;
//     booking.bookingCompletedAt = new Date();

//     await booking.save({ validateModifiedOnly: true });

//     return res.json({
//       success: true,
//       message: "Booking marked as completed successfully.",
//       booking: {
//         tnr: booking.tnr,
//         isBookingCompleted: booking.isBookingCompleted,
//         bookingCompletedAt: booking.bookingCompletedAt,
//         // Add only necessary fields — avoid sending full sensitive data
//       },
//     });
//   } catch (error) {
//     console.error("bookingComplete error:", error);
//     return res.json({
//       success: false,
//       message: `An unexpected error occurred: ${error.message}`,
//     });
//   }

// };


// const TaskBookingComplete = async (req, res) => {
//   try {
//     const { tnr } = req.body;

//     if (!tnr) {
//       return res.status(400).json({
//         success: false,
//         message: "TNR is required.",
//       });
//     }

//     // Find booking by TNR (case-insensitive)
//     const booking = await tourBookingModel.findOne({
//       tnr: tnr.trim().toUpperCase(),
//     });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found with this TNR.",
//       });
//     }

//     if (booking.isBookingCompleted) {
//       return res.json({
//         success: false,
//         message: "This booking is already marked as completed.",
//       });
//     }

//     const allTravellersCancelledValid = booking.travellers.every(
//       (traveller) =>
//         (traveller.cancelled?.byTraveller === true &&
//           traveller.cancelled?.byAdmin === true) ||
//         (traveller.cancelled?.byAdmin === true &&
//           traveller.cancelled?.byTraveller !== true),
//     );

//     if (!allTravellersCancelledValid) {
//       const travellerCancellationIssues = booking.travellers.filter(
//         (traveller) =>
//           traveller.cancelled?.byTraveller === true &&
//           traveller.cancelled?.byAdmin !== true,
//       );

//       if (travellerCancellationIssues.length > 0) {
//         const cancelledTravellersList = travellerCancellationIssues
//           .map((t) => `${t.firstName || "Unnamed"} ${t.lastName || ""}`)
//           .join(", ");

//         return res.json({
//           success: false,
//           message: `Cancellation request pending for traveller(s): ${cancelledTravellersList}`,
//         });
//       }

//       const { advance, balance } = booking.payment || {};
//       const { receipts } = booking;

//       if (!advance?.paid) {
//         return res.json({
//           success: false,
//           message: "Advance payment not made.",
//         });
//       }
//       if (!advance?.paymentVerified) {
//         return res.json({
//           success: false,
//           message: "Advance payment not verified.",
//         });
//       }
//       if (!receipts?.advanceReceiptSent) {
//         return res.json({
//           success: false,
//           message: "Advance receipt not sent.",
//         });
//       }

//       if (!balance?.paid) {
//         return res.json({
//           success: false,
//           message: "Balance payment not made.",
//         });
//       }
//       if (!balance?.paymentVerified) {
//         return res.json({
//           success: false,
//           message: "Balance payment not verified.",
//         });
//       }
//       if (!receipts?.balanceReceiptSent) {
//         return res.json({
//           success: false,
//           message: "Balance receipt not sent.",
//         });
//       }

//       if (booking.isTripCompleted) {
//         return res.json({
//           success: false,
//           message: "Modified receipt pending.",
//         });
//       }
//     }

//     // Mark as completed
//     booking.isBookingCompleted = true;
//     booking.bookingCompletedAt = new Date();

//     await booking.save({ validateModifiedOnly: true });

//     return res.status(200).json({
//       success: true,
//       message: "Booking marked as completed successfully.",
//       booking: {
//         tnr: booking.tnr,
//         isBookingCompleted: booking.isBookingCompleted,
//         bookingCompletedAt: booking.bookingCompletedAt,
//         // Include only safe/minimal fields needed by frontend
//       },
//     });
//   } catch (error) {
//     console.error("TaskBookingComplete error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while completing booking.",
//       error: error.message,
//     });
//   }
// };
// const markOfflineAdvancePaid = async (req, res) => {
//   try {
//     const { tnr, tourId } = req.body;

//     if (!tnr) {
//       return res.status(400).json({
//         success: false,
//         message: "TNR is required",
//       });
//     }

//     if (!tourId) {
//       return res.status(400).json({
//         success: false,
//         message: "tourId is required",
//       });
//     }

//     // Fetch booking by TNR (case-insensitive lookup)
//     const normalizedTnr = tnr.trim().toUpperCase();
//     const booking = await tourBookingModel.findOne({
//       tnr: normalizedTnr,
//     });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found with this TNR",
//       });
//     }

//     // Ensure booking belongs to the selected tour
//     if (booking.tourId.toString() !== tourId) {
//       return res.status(403).json({
//         success: false,
//         message: "Unauthorized to modify this booking",
//       });
//     }

//     // 1. Only offline bookings
//     if (booking.bookingType !== "offline") {
//       return res.status(400).json({
//         success: false,
//         message: "Only offline bookings can be marked as advance paid",
//       });
//     }

//     // 2. Cancellation checks – whole-booking + individual level
//     const totalTravellers = booking.travellers.length;
//     if (totalTravellers === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No travellers found in booking",
//       });
//     }

//     // Count various cancellation states
//     const pendingTravellerCancellationCount = booking.travellers.filter(
//       (t) =>
//         t.cancelled?.byTraveller === true && t.cancelled?.byAdmin === false,
//     ).length;

//     const approvedByAdminCount = booking.travellers.filter(
//       (t) => t.cancelled?.byTraveller === true && t.cancelled?.byAdmin === true,
//     ).length;

//     const rejectedByAdminCount = booking.travellers.filter(
//       (t) => t.cancelled?.byAdmin === true,
//     ).length;

//     // NEW CONDITION: Even if ONE traveller has pending cancellation request
//     if (pendingTravellerCancellationCount >= 1) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Some travellers have requested cancellation. Cannot mark advance as paid until resolved.",
//       });
//     }

//     // A. All travellers fully cancelled + approved by admin
//     if (approvedByAdminCount === totalTravellers) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Booking already cancelled by traveller and approved by admin, cannot proceed",
//       });
//     }

//     // B. All travellers rejected by admin
//     if (rejectedByAdminCount === totalTravellers) {
//       return res.status(400).json({
//         success: false,
//         message: "Booking already rejected by admin",
//       });
//     }

//     // 3. Payment checks
//     const { advance, balance } = booking.payment;

//     if (advance?.paid && balance?.paid) {
//       return res.status(400).json({
//         success: false,
//         message: "Advance and balance are already completed",
//       });
//     }

//     if (advance?.paid) {
//       return res.status(400).json({
//         success: false,
//         message: "Advance payment is already marked as completed",
//       });
//     }

//     // 4. Mark advance as paid
//     booking.payment.advance.paid = true;
//     booking.payment.advance.paymentVerified = true;
//     booking.payment.advance.paidAt = new Date();

//     await booking.save({ validateModifiedOnly: true });

//     return res.status(200).json({
//       success: true,
//       message: "Offline booking advance marked as paid successfully",
//       booking: {
//         tnr: booking.tnr,
//         _id: booking._id, // optional – keep if frontend still needs it
//         tourId: booking.tourId,
//         bookingType: booking.bookingType,
//         payment: booking.payment,
//         // ... add other fields you want to return
//       },
//     });
//   } catch (error) {
//     console.error("markOfflineAdvancePaid error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Something went wrong",
//     });
//   }
// };
// const markOfflineBalancePaid = async (req, res) => {
//   try {
//     const { tnr, tourId } = req.body;

//     if (!tnr) {
//       return res.status(400).json({
//         success: false,
//         message: "TNR is required",
//       });
//     }

//     if (!tourId) {
//       return res.status(400).json({
//         success: false,
//         message: "tourId is required",
//       });
//     }

//     // Fetch booking by TNR (case-insensitive)
//     const normalizedTnr = tnr.trim().toUpperCase();
//     const booking = await tourBookingModel.findOne({
//       tnr: normalizedTnr,
//     });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found with this TNR",
//       });
//     }

//     // Ensure the booking belongs to the selected tour
//     if (booking.tourId.toString() !== tourId) {
//       return res.status(403).json({
//         success: false,
//         message: "Unauthorized to modify this booking",
//       });
//     }

//     // 1. Check if booking type is offline
//     if (booking.bookingType !== "offline") {
//       return res.status(400).json({
//         success: false,
//         message: "Only offline bookings can be marked as balance paid",
//       });
//     }

//     // 2. Check cancellation conditions
//     const allTravellersCancelledValid = booking.travellers.every(
//       (traveller) =>
//         (traveller.cancelled?.byTraveller === true &&
//           traveller.cancelled?.byAdmin === true) ||
//         (traveller.cancelled?.byAdmin === true &&
//           traveller.cancelled?.byTraveller !== true),
//     );

//     if (!allTravellersCancelledValid) {
//       // 3. Check for travellers with only traveller cancellation (pending approval)
//       const travellerCancellationIssues = booking.travellers.filter(
//         (traveller) =>
//           traveller.cancelled?.byTraveller === true &&
//           traveller.cancelled?.byAdmin !== true,
//       );

//       if (travellerCancellationIssues.length > 0) {
//         const cancelledTravellersList = travellerCancellationIssues
//           .map(
//             (t) =>
//               `Traveller name: ${t.firstName || "Unnamed"} ${t.lastName || ""}`,
//           )
//           .join(", ");

//         return res.status(400).json({
//           success: false,
//           message: `Cancellation in request for the traveller: ${cancelledTravellersList}. Resolve before marking balance paid.`,
//         });
//       }

//       // 4. Payment checks (only if not all travellers meet cancellation conditions)
//       const { advance, balance } = booking.payment;

//       if (advance?.paid && balance?.paid) {
//         return res.status(400).json({
//           success: false,
//           message: "Advance and balance are already completed",
//         });
//       }

//       if (balance?.paid) {
//         return res.status(400).json({
//           success: false,
//           message: "Balance payment is already marked as completed",
//         });
//       }

//       // Ensure advance is paid, verified, and advance receipt sent
//       if (!advance?.paid || !advance?.paymentVerified) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Advance payment must be paid and verified before marking balance as paid",
//         });
//       }

//       if (!booking.receipts?.advanceReceiptSent) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Advance receipt must be sent before marking balance as paid",
//         });
//       }
//     }

//     // 5. Mark balance as paid
//     booking.payment.balance.paid = true;
//     booking.payment.balance.paymentVerified = true;
//     booking.payment.balance.paidAt = new Date();

//     await booking.save({ validateModifiedOnly: true });

//     return res.status(200).json({
//       success: true,
//       message: "Offline booking balance marked as paid successfully",
//       booking: {
//         tnr: booking.tnr,
//         // Include only necessary fields (avoid sending full sensitive data)
//         tourId: booking.tourId,
//         bookingType: booking.bookingType,
//         payment: booking.payment,
//         receipts: booking.receipts,
//       },
//     });
//   } catch (error) {
//     console.error("markOfflineBalancePaid error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Something went wrong",
//     });
//   }
// };

// // Update traveller-specific data in a booking
// const updateTraveller = async (req, res) => {
//   try {
//     const { bookingId, travellerId, trainSeats, flightSeats, staffRemarks } =
//       req.body;

//     const updatedBooking = await tourBookingModel.findOneAndUpdate(
//       { _id: bookingId, "travellers._id": travellerId },
//       {
//         $set: {
//           "travellers.$.trainSeats": trainSeats,
//           "travellers.$.flightSeats": flightSeats,
//           "travellers.$.staffRemarks": staffRemarks,
//         },
//       },
//       { new: true },
//     );

//     if (!updatedBooking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking or traveller not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Traveller details updated successfully",
//       booking: updatedBooking,
//     });
//   } catch (error) {
//     console.error("Error updating traveller details:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// // New Controller Function
// const tourDashboard = async (req, res) => {
//   try {
//     // Get the tourId from the URL parameter
//     const tourId = req.params.tourId;

//     if (!tourId) {
//       return res.status(400).json({
//         success: false,
//         message: "tourId is required",
//       });
//     }

//     // Fetch all bookings for the specified tourId
//     const bookings = await tourBookingModel.find({ tourId });

//     if (!bookings || bookings.length === 0) {
//       // You can decide whether to send a 404 or a 200 with an empty array
//       return res.status(200).json({
//         success: true,
//         data: {
//           totalEarnings: 0,
//           totalTravellers: 0,
//           totalUsers: 0,
//           bookings: [],
//         },
//       });
//     }

//     let totalEarnings = 0;
//     let totalTravellers = 0;
//     let uniqueUsers = new Set();

//     bookings.forEach((booking) => {
//       if (booking.payment?.advance?.paid && booking.payment?.balance?.paid) {
//         totalEarnings +=
//           booking.payment.advance.amount + booking.payment.balance.amount;
//       }
//       if (Array.isArray(booking.travellers)) {
//         totalTravellers += booking.travellers.length;
//       }
//       if (booking.userId) {
//         uniqueUsers.add(booking.userId.toString());
//       }
//     });

//     res.json({
//       success: true,
//       data: {
//         totalEarnings,
//         totalTravellers,
//         totalUsers: uniqueUsers.size,
//         bookings,
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// const tourProfile = async (req, res) => {
//   try {
//     const { tourId } = req.params; // Get tourId from URL parameters

//     if (!tourId) {
//       return res.status(400).json({
//         success: false,
//         message: "Tour ID is missing from the URL.",
//       });
//     }

//     const tourProfileData = await tourModel
//       .findById(tourId)
//       .select("-password");

//     if (!tourProfileData) {
//       return res.status(404).json({
//         success: false,
//         message: "Tour profile not found.",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       tourProfileData,
//     });
//   } catch (error) {
//     console.error("tourProfile error:", error);
//     res.status(500).json({
//       success: false,
//       message: "An unexpected error occurred.",
//     });
//   }
// };

// // const updateTourProfile = async (req, res) => {
// //   try {
// //     const { tourId } = req.body; // Get tourId from the request body
// //     if (!tourId) {
// //       return res.json({ success: false, message: "Tour ID is missing" });
// //     }

// //     const tour = await tourModel.findById(tourId);
// //     if (!tour) {
// //       return res.json({ success: false, message: "Tour not found" });
// //     }

// //     // 1. Destructure and get files
// //     const { titleImage, mapImage, galleryImages } = req.files || {};

// //     // 2. Image upload helper
// //     const uploadImage = async (file) => {
// //       const result = await cloudinary.uploader.upload(file.path, {
// //         resource_type: "image",
// //       });
// //       return result.secure_url;
// //     };

// //     let updateFields = {};

// //     // 3. Process images
// //     if (titleImage) {
// //       updateFields.titleImage = await uploadImage(titleImage[0]);
// //     }
// //     if (mapImage) {
// //       updateFields.mapImage = await uploadImage(mapImage[0]);
// //     }
// //     if (galleryImages) {
// //       if (galleryImages.length !== 3) {
// //         return res.json({
// //           success: false,
// //           message: "Please upload exactly 3 gallery images",
// //         });
// //       }
// //       updateFields.galleryImages = await Promise.all(
// //         galleryImages.map((img) => uploadImage(img)),
// //       );
// //     }

// //     // 4. Get and parse all body fields, including nested ones
// //     const {
// //       title,
// //       batch,
// //       duration,
// //       price,
// //       destination,
// //       sightseeing,
// //       itinerary,
// //       includes,
// //       excludes,
// //       trainDetails,
// //       flightDetails,
// //       lastBookingDate,
// //       completedTripsCount,
// //       available,
// //       advanceAmount,
// //       addons,
// //       boardingPoints,
// //       deboardingPoints,
// //       remarks,
// //       variantPackage,
// //       gst, // New field: GST percentage
// //     } = req.body;

// //     // 5. Use existing data as a fallback for calculations
// //     let parsedPrice = tour.price;
// //     if (price) {
// //       try {
// //         parsedPrice = JSON.parse(price);
// //         updateFields.price = parsedPrice;
// //       } catch {
// //         return res.json({ success: false, message: "Invalid JSON in price" });
// //       }
// //     }

// //     let parsedAdvanceAmount = tour.advanceAmount;
// //     if (advanceAmount) {
// //       try {
// //         parsedAdvanceAmount = JSON.parse(advanceAmount);
// //         updateFields.advanceAmount = parsedAdvanceAmount;
// //       } catch {
// //         return res.json({
// //           success: false,
// //           message: "Invalid JSON in advanceAmount",
// //         });
// //       }
// //     }

// //     if (gst !== undefined && gst !== "") {
// //       const parsedGst = Number(gst);
// //       if (isNaN(parsedGst) || parsedGst < 0) {
// //         return res.json({ success: false, message: "Invalid GST value" });
// //       }
// //       updateFields.gst = parsedGst;
// //     }

// //     // 6. Recalculate balances for main tour using the most current data

// //     // 6. Recalculate balances for main tour using the most current data
// //     if (parsedPrice && parsedAdvanceAmount) {
// //       const adultAdvance = Number(parsedAdvanceAmount.adult) || 0;
// //       const childAdvance = Number(parsedAdvanceAmount.child) || 0;

// //       updateFields.balanceDouble =
// //         Number(parsedPrice.doubleSharing) - adultAdvance;
// //       updateFields.balanceTriple =
// //         Number(parsedPrice.tripleSharing) - adultAdvance;
// //       updateFields.balanceChildWithBerth =
// //         Number(parsedPrice.childWithBerth || 0) - childAdvance;
// //       updateFields.balanceChildWithoutBerth =
// //         Number(parsedPrice.childWithoutBerth || 0) - childAdvance;
// //     }

// //     // 7. Handle variantPackage array
// //     if (variantPackage) {
// //       try {
// //         const parsedVariantPackage = JSON.parse(variantPackage);
// //         if (!Array.isArray(parsedVariantPackage)) {
// //           return res.json({
// //             success: false,
// //             message: "variantPackage must be an array",
// //           });
// //         }

// //         // Validate and process each variant package
// //         updateFields.variantPackage = parsedVariantPackage.map((variant) => {
// //           // Initialize defaults
// //           const variantPrice = variant.price || {};
// //           const variantAdvanceAmount = variant.advanceAmount || {};

// //           // Calculate balances for this variant
// //           const adultAdvance = Number(variantAdvanceAmount.adult) || 0;
// //           const childAdvance = Number(variantAdvanceAmount.child) || 0;

// //           return {
// //             ...variant,
// //             balanceDouble:
// //               Number(variantPrice.doubleSharing || 0) - adultAdvance,
// //             balanceTriple:
// //               Number(variantPrice.tripleSharing || 0) - adultAdvance,
// //             balanceChildWithBerth:
// //               Number(variantPrice.childWithBerth || 0) - childAdvance,
// //             balanceChildWithoutBerth:
// //               Number(variantPrice.childWithoutBerth || 0) - childAdvance,
// //             // Ensure nested arrays are properly formatted
// //             destination: Array.isArray(variant.destination)
// //               ? variant.destination
// //               : [],
// //             sightseeing: Array.isArray(variant.sightseeing)
// //               ? variant.sightseeing
// //               : [],
// //             itinerary: Array.isArray(variant.itinerary)
// //               ? variant.itinerary
// //               : [],
// //             includes: Array.isArray(variant.includes) ? variant.includes : [],
// //             excludes: Array.isArray(variant.excludes) ? variant.excludes : [],
// //             trainDetails: Array.isArray(variant.trainDetails)
// //               ? variant.trainDetails.map((train) => ({
// //                 trainNo: train.trainNo || "",
// //                 trainName: train.trainName || "",
// //                 fromCode: train.fromCode || "",
// //                 fromStation: train.fromStation || "",
// //                 toCode: train.toCode || "",
// //                 toStation: train.toStation || "",
// //                 class: train.class || "",
// //                 departureTime: train.departureTime || "",
// //                 arrivalTime: train.arrivalTime || "",
// //                 ticketOpenDate: train.ticketOpenDate || null,
// //               }))
// //               : [],
// //             flightDetails: Array.isArray(variant.flightDetails)
// //               ? variant.flightDetails.map((flight) => ({
// //                 airline: flight.airline || "",
// //                 flightNo: flight.flightNo || "",
// //                 fromCode: flight.fromCode || "",
// //                 fromAirport: flight.fromAirport || "",
// //                 toCode: flight.toCode || "",
// //                 toAirport: flight.toAirport || "",
// //                 class: flight.class || "",
// //                 departureTime: flight.departureTime || "",
// //                 arrivalTime: flight.arrivalTime || "",
// //               }))
// //               : [],
// //             addons: Array.isArray(variant.addons)
// //               ? variant.addons.map((addon) => ({
// //                 name: addon.name || "",
// //                 amount: Number(addon.amount) || 0,
// //               }))
// //               : [],
// //             boardingPoints: Array.isArray(variant.boardingPoints)
// //               ? variant.boardingPoints.map((bp) => ({
// //                 stationCode: bp.stationCode || "",
// //                 stationName: bp.stationName || "",
// //               }))
// //               : [],
// //             deboardingPoints: Array.isArray(variant.deboardingPoints)
// //               ? variant.deboardingPoints.map((dp) => ({
// //                 stationCode: dp.stationCode || "",
// //                 stationName: dp.stationName || "",
// //               }))
// //               : [],
// //           };
// //         });
// //       } catch {
// //         return res.json({
// //           success: false,
// //           message: "Invalid JSON in variantPackage",
// //         });
// //       }
// //     }

// //     // 8. Update other fields
// //     if (title) updateFields.title = title;
// //     if (remarks) updateFields.remarks = remarks;
// //     if (batch) updateFields.batch = batch;
// //     if (lastBookingDate) updateFields.lastBookingDate = lastBookingDate;
// //     if (typeof available !== "undefined") updateFields.available = available;

// //     if (duration) {
// //       try {
// //         const parsed = JSON.parse(duration);
// //         const days = Number(parsed.days);
// //         const nights = Number(parsed.nights);
// //         if (isNaN(days) || isNaN(nights)) {
// //           return res.json({
// //             success: false,
// //             message: "Invalid duration format",
// //           });
// //         }
// //         updateFields.duration = { days, nights };
// //       } catch {
// //         return res.json({
// //           success: false,
// //           message: "Invalid JSON in duration",
// //         });
// //       }
// //     }

// //     if (completedTripsCount) {
// //       const trips = Number(completedTripsCount);
// //       if (isNaN(trips) || trips < 0) {
// //         return res.json({
// //           success: false,
// //           message: "Invalid completedTripsCount",
// //         });
// //       }
// //       updateFields.completedTripsCount = trips;
// //     }

// //     // 9. Handle all optional arrays
// //     const optionalArrays = {
// //       destination,
// //       sightseeing,
// //       itinerary,
// //       includes,
// //       excludes,
// //       trainDetails,
// //       flightDetails,
// //       addons,
// //       boardingPoints,
// //       deboardingPoints,
// //     };

// //     for (let key in optionalArrays) {
// //       if (optionalArrays[key]) {
// //         try {
// //           const parsedArray = JSON.parse(optionalArrays[key]);
// //           if (!Array.isArray(parsedArray)) throw new Error();

// //           if (key === "addons") {
// //             updateFields[key] = parsedArray.map((a) => ({
// //               name: a.name || "",
// //               amount: Number(a.amount) || 0,
// //             }));
// //           } else if (key === "boardingPoints" || key === "deboardingPoints") {
// //             updateFields[key] = parsedArray.map((a) => ({
// //               stationCode: a.stationCode || "",
// //               stationName: a.stationName || "",
// //             }));
// //           } else {
// //             updateFields[key] = parsedArray;
// //           }
// //         } catch {
// //           return res.json({
// //             success: false,
// //             message: `Invalid JSON in ${key}`,
// //           });
// //         }
// //       }
// //     }

// //     // 10. Final update
// //     await tourModel.findByIdAndUpdate(tourId, { $set: updateFields });

// //     res.json({ success: true, message: "Tour updated successfully" });
// //   } catch (error) {
// //     console.error("Update Tour Error:", error);
// //     res.json({ success: false, message: error.message });
// //   }
// // };

// const updateTourProfile = async (req, res) => {
//   try {
//     const { tourId } = req.body; // Get tourId from the request body
//     if (!tourId) {
//       return res.json({ success: false, message: "Tour ID is missing" });
//     }

//     const tour = await tourModel.findById(tourId);
//     if (!tour) {
//       return res.json({ success: false, message: "Tour not found" });
//     }

//     // 1. Destructure and get files
//     const { titleImage, mapImage, galleryImages } = req.files || {};

//     // 2. Image upload helper
//     const uploadImage = async (file) => {
//       const result = await cloudinary.uploader.upload(file.path, {
//         resource_type: "image",
//       });
//       return result.secure_url;
//     };

//     let updateFields = {};

//     // 3. Process images
//     if (titleImage) {
//       updateFields.titleImage = await uploadImage(titleImage[0]);
//     }
//     if (mapImage) {
//       updateFields.mapImage = await uploadImage(mapImage[0]);
//     }
//     if (galleryImages) {
//       if (galleryImages.length !== 3) {
//         return res.json({
//           success: false,
//           message: "Please upload exactly 3 gallery images",
//         });
//       }
//       updateFields.galleryImages = await Promise.all(
//         galleryImages.map((img) => uploadImage(img)),
//       );
//     }

//     // 4. Get and parse all body fields, including nested ones
//     const {
//       title,
//       batch,
//       duration,
//       price,
//       destination,
//       sightseeing,
//       itinerary,
//       includes,
//       excludes,
//       trainDetails,
//       flightDetails,
//       lastBookingDate,
//       completedTripsCount,
//       available,
//       advanceAmount,
//       addons,
//       boardingPoints,
//       deboardingPoints,
//       remarks,
//       variantPackage,
//       gst, // GST percentage
//     } = req.body;

//     // ── NEW: helper to parse train/flight addons sub-array ──
//     const parseAddonsArray = (arr) => {
//       if (!Array.isArray(arr)) return [];
//       return arr.map((a) => ({
//         name: a.name || "",
//         amount: Number(a.amount) || 0,
//       }));
//     };

//     // 5. Use existing data as a fallback for calculations
//     let parsedPrice = tour.price;
//     if (price) {
//       try {
//         parsedPrice = JSON.parse(price);
//         updateFields.price = parsedPrice;
//       } catch {
//         return res.json({ success: false, message: "Invalid JSON in price" });
//       }
//     }

//     let parsedAdvanceAmount = tour.advanceAmount;
//     if (advanceAmount) {
//       try {
//         parsedAdvanceAmount = JSON.parse(advanceAmount);
//         updateFields.advanceAmount = parsedAdvanceAmount;
//       } catch {
//         return res.json({
//           success: false,
//           message: "Invalid JSON in advanceAmount",
//         });
//       }
//     }

//     if (gst !== undefined && gst !== "") {
//       const parsedGst = Number(gst);
//       if (isNaN(parsedGst) || parsedGst < 0) {
//         return res.json({ success: false, message: "Invalid GST value" });
//       }
//       updateFields.gst = parsedGst;
//     }

//     // 6. Recalculate balances for main tour using the most current data
//     if (parsedPrice && parsedAdvanceAmount) {
//       const adultAdvance = Number(parsedAdvanceAmount.adult) || 0;
//       const childAdvance = Number(parsedAdvanceAmount.child) || 0;

//       updateFields.balanceDouble =
//         Number(parsedPrice.doubleSharing) - adultAdvance;
//       updateFields.balanceTriple =
//         Number(parsedPrice.tripleSharing) - adultAdvance;
//       updateFields.balanceChildWithBerth =
//         Number(parsedPrice.childWithBerth || 0) - childAdvance;
//       updateFields.balanceChildWithoutBerth =
//         Number(parsedPrice.childWithoutBerth || 0) - childAdvance;
//     }

//     // 7. Handle variantPackage array
//     if (variantPackage) {
//       try {
//         const parsedVariantPackage = JSON.parse(variantPackage);
//         if (!Array.isArray(parsedVariantPackage)) {
//           return res.json({
//             success: false,
//             message: "variantPackage must be an array",
//           });
//         }

//         // Validate and process each variant package
//         updateFields.variantPackage = parsedVariantPackage.map((variant) => {
//           // Initialize defaults
//           const variantPrice = variant.price || {};
//           const variantAdvanceAmount = variant.advanceAmount || {};

//           // Calculate balances for this variant
//           const adultAdvance = Number(variantAdvanceAmount.adult) || 0;
//           const childAdvance = Number(variantAdvanceAmount.child) || 0;

//           return {
//             ...variant,
//             balanceDouble:
//               Number(variantPrice.doubleSharing || 0) - adultAdvance,
//             balanceTriple:
//               Number(variantPrice.tripleSharing || 0) - adultAdvance,
//             balanceChildWithBerth:
//               Number(variantPrice.childWithBerth || 0) - childAdvance,
//             balanceChildWithoutBerth:
//               Number(variantPrice.childWithoutBerth || 0) - childAdvance,
//             // Ensure nested arrays are properly formatted
//             destination: Array.isArray(variant.destination)
//               ? variant.destination
//               : [],
//             sightseeing: Array.isArray(variant.sightseeing)
//               ? variant.sightseeing
//               : [],
//             itinerary: Array.isArray(variant.itinerary)
//               ? variant.itinerary
//               : [],
//             includes: Array.isArray(variant.includes) ? variant.includes : [],
//             excludes: Array.isArray(variant.excludes) ? variant.excludes : [],
//             trainDetails: Array.isArray(variant.trainDetails)
//               ? variant.trainDetails.map((train) => ({
//                 trainNo: train.trainNo || "",
//                 trainName: train.trainName || "",
//                 fromCode: train.fromCode || "",
//                 fromStation: train.fromStation || "",
//                 toCode: train.toCode || "",
//                 toStation: train.toStation || "",
//                 class: train.class || "",
//                 departureTime: train.departureTime || "",
//                 arrivalTime: train.arrivalTime || "",
//                 ticketOpenDate: train.ticketOpenDate || null,
//                 tripType: train.tripType || "", // ← NEW
//                 addons: parseAddonsArray(train.addons),
//               }))
//               : [],
//             flightDetails: Array.isArray(variant.flightDetails)
//               ? variant.flightDetails.map((flight) => ({
//                 airline: flight.airline || "",
//                 flightNo: flight.flightNo || "",
//                 fromCode: flight.fromCode || "",
//                 fromAirport: flight.fromAirport || "",
//                 toCode: flight.toCode || "",
//                 toAirport: flight.toAirport || "",
//                 class: flight.class || "",
//                 departureTime: flight.departureTime || "",
//                 arrivalTime: flight.arrivalTime || "",
//                 // ── NEW: flight-wise addons for this variant ──
//                 addons: parseAddonsArray(flight.addons),
//               }))
//               : [],
//             addons: Array.isArray(variant.addons)
//               ? variant.addons.map((addon) => ({
//                 name: addon.name || "",
//                 amount: Number(addon.amount) || 0,
//               }))
//               : [],
//             boardingPoints: Array.isArray(variant.boardingPoints)
//               ? variant.boardingPoints.map((bp) => ({
//                 stationCode: bp.stationCode || "",
//                 stationName: bp.stationName || "",
//               }))
//               : [],
//             deboardingPoints: Array.isArray(variant.deboardingPoints)
//               ? variant.deboardingPoints.map((dp) => ({
//                 stationCode: dp.stationCode || "",
//                 stationName: dp.stationName || "",
//               }))
//               : [],
//           };
//         });
//       } catch {
//         return res.json({
//           success: false,
//           message: "Invalid JSON in variantPackage",
//         });
//       }
//     }

//     // 8. Update other fields
//     if (title) updateFields.title = title;
//     if (remarks) updateFields.remarks = remarks;
//     if (batch) updateFields.batch = batch;
//     if (lastBookingDate) updateFields.lastBookingDate = lastBookingDate;
//     if (typeof available !== "undefined") updateFields.available = available;

//     if (duration) {
//       try {
//         const parsed = JSON.parse(duration);
//         const days = Number(parsed.days);
//         const nights = Number(parsed.nights);
//         if (isNaN(days) || isNaN(nights)) {
//           return res.json({
//             success: false,
//             message: "Invalid duration format",
//           });
//         }
//         updateFields.duration = { days, nights };
//       } catch {
//         return res.json({
//           success: false,
//           message: "Invalid JSON in duration",
//         });
//       }
//     }

//     if (completedTripsCount) {
//       const trips = Number(completedTripsCount);
//       if (isNaN(trips) || trips < 0) {
//         return res.json({
//           success: false,
//           message: "Invalid completedTripsCount",
//         });
//       }
//       updateFields.completedTripsCount = trips;
//     }

//     // 9. Handle all optional arrays
//     const optionalArrays = {
//       destination,
//       sightseeing,
//       itinerary,
//       includes,
//       excludes,
//       trainDetails,
//       flightDetails,
//       addons,
//       boardingPoints,
//       deboardingPoints,
//     };

//     for (let key in optionalArrays) {
//       if (optionalArrays[key]) {
//         try {
//           const parsedArray = JSON.parse(optionalArrays[key]);
//           if (!Array.isArray(parsedArray)) throw new Error();

//           if (key === "addons") {
//             updateFields[key] = parsedArray.map((a) => ({
//               name: a.name || "",
//               amount: Number(a.amount) || 0,
//             }));
//           } else if (key === "boardingPoints" || key === "deboardingPoints") {
//             updateFields[key] = parsedArray.map((a) => ({
//               stationCode: a.stationCode || "",
//               stationName: a.stationName || "",
//             }));
//           } else if (key === "trainDetails" || key === "flightDetails") {
//             // ── if/else — attach addons; tripType carries through via spread ──
//             updateFields[key] = parsedArray.map((item) => ({
//               ...item, // tripType already included here automatically
//               addons: parseAddonsArray(item.addons),
//             }));
//           } else {
//             updateFields[key] = parsedArray;
//           }
//         } catch {
//           return res.json({
//             success: false,
//             message: `Invalid JSON in ${key}`,
//           });
//         }
//       }
//     }

//     // 10. Final update
//     await tourModel.findByIdAndUpdate(tourId, { $set: updateFields });

//     res.json({ success: true, message: "Tour updated successfully" });
//   } catch (error) {
//     console.error("Update Tour Error:", error);
//     res.json({ success: false, message: error.message });
//   }
// };

// const markAdvanceReceiptSent = async (req, res) => {
//   try {
//     const { tnr, tourId } = req.body;

//     if (!tnr) {
//       return res.status(400).json({
//         success: false,
//         message: "TNR is required",
//       });
//     }

//     if (!tourId) {
//       return res.status(400).json({
//         success: false,
//         message: "tourId is required",
//       });
//     }

//     // Fetch booking by TNR (case-insensitive)
//     const booking = await tourBookingModel.findOne({
//       tnr: tnr.trim().toUpperCase(),
//     });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found with this TNR",
//       });
//     }

//     // Ensure booking belongs to the selected tour
//     if (booking.tourId.toString() !== tourId) {
//       return res.status(403).json({
//         success: false,
//         message: "Unauthorized to modify this booking",
//       });
//     }

//     // Mark receipt as sent
//     booking.receipts.advanceReceiptSent = true;
//     booking.receipts.advanceReceiptSentAt = new Date();

//     await booking.save({ validateModifiedOnly: true });

//     return res.status(200).json({
//       success: true,
//       message: "Advance receipt marked as sent successfully",
//       booking: {
//         tnr: booking.tnr,
//         receipts: booking.receipts,
//         // Add only necessary fields — avoid exposing full booking data
//       },
//     });
//   } catch (error) {
//     console.error("markAdvanceReceiptSent error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Something went wrong",
//     });
//   }
// };

// const taskMarkAdvanceReceiptSent = async (req, res) => {
//   try {
//     const { tnr } = req.body;

//     if (!tnr) {
//       return res.status(400).json({
//         success: false,
//         message: "TNR is required",
//       });
//     }

//     // Find booking by TNR (case-insensitive)
//     const booking = await tourBookingModel.findOne({
//       tnr: tnr.trim().toUpperCase(),
//     });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found with this TNR",
//       });
//     }

//     // Optional: you could add authorization check here if needed
//     // e.g. check if req.user can modify this booking

//     booking.receipts.advanceReceiptSent = true;
//     booking.receipts.advanceReceiptSentAt = new Date();

//     await booking.save({ validateModifiedOnly: true });

//     return res.status(200).json({
//       success: true,
//       message: "Advance receipt marked as sent successfully",
//       booking: {
//         tnr: booking.tnr,
//         _id: booking._id, // optional - include if frontend still needs it
//         receipts: booking.receipts,
//         // You can add more fields if needed
//       },
//     });
//   } catch (error) {
//     console.error("taskMarkAdvanceReceiptSent error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Something went wrong",
//     });
//   }
// };
// const markBalanceReceiptSent = async (req, res) => {
//   try {
//     const { tnr, tourId } = req.body;

//     if (!tnr) {
//       return res.status(400).json({
//         success: false,
//         message: "TNR is required",
//       });
//     }

//     if (!tourId) {
//       return res.status(400).json({
//         success: false,
//         message: "tourId is required",
//       });
//     }

//     // Fetch booking by TNR (case-insensitive)
//     const booking = await tourBookingModel.findOne({
//       tnr: tnr.trim().toUpperCase(),
//     });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found with this TNR",
//       });
//     }

//     // Ensure booking belongs to the selected tour
//     if (booking.tourId.toString() !== tourId) {
//       return res.status(403).json({
//         success: false,
//         message: "Unauthorized to modify this booking",
//       });
//     }

//     // Mark receipt as sent
//     booking.receipts.balanceReceiptSent = true;
//     booking.receipts.balanceReceiptSentAt = new Date();

//     await booking.save({ validateModifiedOnly: true });

//     return res.status(200).json({
//       success: true,
//       message: "Balance receipt marked as sent successfully",
//       booking: {
//         tnr: booking.tnr,
//         receipts: booking.receipts,
//         // Add only necessary fields — avoid exposing full booking data
//       },
//     });
//   } catch (error) {
//     console.error("markBalanceReceiptSent error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Something went wrong",
//     });
//   }
// };

// const taskMarkBalanceReceiptSent = async (req, res) => {
//   try {
//     const { tnr } = req.body;

//     if (!tnr) {
//       return res.status(400).json({
//         success: false,
//         message: "TNR is required",
//       });
//     }

//     // Find booking by TNR (case-insensitive lookup)
//     const booking = await tourBookingModel.findOne({
//       tnr: tnr.trim().toUpperCase(),
//     });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found with this TNR",
//       });
//     }

//     // Optional: Add authorization check if needed
//     // Example: if (req.user.role !== 'admin' && booking.userId.toString() !== req.user._id.toString()) { ... }

//     // Mark receipt as sent
//     booking.receipts.balanceReceiptSent = true;
//     booking.receipts.balanceReceiptSentAt = new Date();

//     await booking.save({ validateModifiedOnly: true });

//     return res.status(200).json({
//       success: true,
//       message: "Balance receipt marked as sent successfully",
//       booking: {
//         tnr: booking.tnr,
//         receipts: booking.receipts,
//         // Add only necessary fields — avoid sending full sensitive data
//       },
//     });
//   } catch (error) {
//     console.error("taskMarkBalanceReceiptSent error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Something went wrong",
//     });
//   }
// };
// const viewTourBalance = async (req, res) => {
//   try {
//     const { tnr } = req.params;

//     // ─── Validate TNR ──────────────────────────────────────────────────
//     if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid 6-character TNR is required",
//       });
//     }

//     const normalizedTnr = tnr.trim().toUpperCase();

//     // ─── Find booking by TNR ───────────────────────────────────────────
//     const booking = await tourBookingModel
//       .findOne({ tnr: normalizedTnr })
//       .select("tnr payment.advance payment.balance adminRemarks")
//       .lean();

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: `No booking found with TNR: ${normalizedTnr}`,
//       });
//     }

//     // ─── Response ──────────────────────────────────────────────────────
//     return res.status(200).json({
//       success: true,
//       message: "Booking balance details retrieved successfully",
//       data: {
//         tnr: booking.tnr, // return the canonical uppercase version
//         bookingId: booking._id.toString(), // optional: include for internal reference
//         advance: booking.payment?.advance || {},
//         balance: booking.payment?.balance || {},
//         adminRemarks: booking.adminRemarks || [],
//       },
//     });
//   } catch (error) {
//     console.error("Error retrieving tour balance:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

// const viewTourAdvance = async (req, res) => {
//   try {
//     const { tnr } = req.params; // TNR from URL params

//     // Validate TNR
//     if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid 6-character TNR is required",
//       });
//     }

//     const normalizedTnr = tnr.trim().toUpperCase();

//     // Find booking by TNR, select only needed fields
//     const booking = await tourBookingModel
//       .findOne({ tnr: normalizedTnr })
//       .select(
//         "payment.advance payment.balance advanceAdminRemarks isTripCompleted",
//       )
//       .lean();

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found with this TNR",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Advance payment details and remarks retrieved successfully",
//       data: {
//         tnr: normalizedTnr,
//         advance: {
//           amount: booking.payment.advance.amount,
//           paid: booking.payment.advance.paid,
//           paymentVerified: booking.payment.advance.paymentVerified,
//           paidAt: booking.payment.advance.paidAt || null,
//         },
//         advanceAdminRemarks: booking.advanceAdminRemarks || [],
//         isTripCompleted: booking.isTripCompleted,
//       },
//     });
//   } catch (error) {
//     console.error("Error retrieving tour advance details:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };


// const updateTourBalance = async (req, res) => {
//   try {
//     const { tnr } = req.params;
//     const { updates } = req.body;

//     if (!tnr || tnr.trim().length !== 6) {
//       return res.status(400).json({ success: false, message: "Valid 6-character TNR required" });
//     }

//     const normalizedTnr = tnr.trim().toUpperCase();
//     const booking = await tourBookingModel.findOne({ tnr: normalizedTnr });

//     if (!booking) {
//       return res.status(404).json({ success: false, message: "Booking not found" });
//     }

//     let totalChange = 0;

//     for (const update of updates) {
//       const amount = Number(update.amount);
//       if (isNaN(amount)) continue;

//       // CORRECT LOGIC
//       booking.payment.balance.amount += amount;   // + ve = add, - ve = minus
//       totalChange += amount;

//       booking.adminRemarks.push({
//         remark: (update.remarks || "").trim() || "No remark",
//         amount: amount,
//         addedAt: new Date(),
//       });
//     }

//     booking.isTripCompleted = true;
//     await booking.save();

//     return res.status(200).json({
//       success: true,
//       message: "Balance updated with correct calculation",
//       data: {
//         tnr: booking.tnr,
//         advance: booking.payment?.advance || {},
//         balance: booking.payment?.balance || {},
//         adminRemarks: booking.adminRemarks || [],
//       }
//     });
//   } catch (error) {
//     console.error("updateTourBalance error:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// const updateTourAdvance = async (req, res) => {
//   try {
//     const { tnr } = req.params;
//     const { updates } = req.body;

//     if (!tnr || tnr.trim().length !== 6) {
//       return res.status(400).json({ success: false, message: "Valid 6-character TNR required" });
//     }

//     const normalizedTnr = tnr.trim().toUpperCase();
//     const booking = await tourBookingModel.findOne({ tnr: normalizedTnr });

//     if (!booking) {
//       return res.status(404).json({ success: false, message: "Booking not found" });
//     }

//     let totalShifted = 0;

//     for (const update of updates) {
//       const amount = Number(update.amount);
//       if (isNaN(amount) || amount <= 0) continue;

//       // ✅ FINAL CORRECT LOGIC
//       booking.payment.advance.amount -= amount;   // Advance - 
//       booking.payment.balance.amount += amount;   // Balance +

//       totalShifted += amount;

//       booking.advanceAdminRemarks.push({
//         remark: (update.remarks || "").trim() || "Amount shifted from advance to balance",
//         amount: amount,
//         addedAt: new Date(),
//       });
//     }

//     booking.isTripCompleted = true;
//     await booking.save();

//     return res.status(200).json({
//       success: true,
//       message: "Amount shifted successfully",
//       data: {
//         tnr: booking.tnr,
//         advance: booking.payment?.advance || {},
//         balance: booking.payment?.balance || {},
//         advanceAdminRemarks: booking.advanceAdminRemarks || [],
//       }
//     });
//   } catch (error) {
//     console.error("updateTourAdvance error:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };


// // ====================== IMPROVED UPDATE BALANCE REMARK ======================
// const updateBalanceRemark = async (req, res) => {
//   try {
//     const { tnr } = req.params;
//     const { remarkIndex, remark, amount } = req.body;

//     if (!tnr || tnr.trim().length !== 6) {
//       return res.status(400).json({ success: false, message: "Valid 6-character TNR required" });
//     }
//     if (typeof remarkIndex !== "number" || remarkIndex < 0) {
//       return res.status(400).json({ success: false, message: "Valid remarkIndex required" });
//     }

//     const normalizedTnr = tnr.trim().toUpperCase();
//     const booking = await tourBookingModel.findOne({ tnr: normalizedTnr });

//     if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
//     if (!booking.adminRemarks || !booking.adminRemarks[remarkIndex]) {
//       return res.status(404).json({ success: false, message: "Remark not found" });
//     }

//     const oldAmount = Number(booking.adminRemarks[remarkIndex].amount) || 0;
//     const newAmount = Number(amount) || 0;

//     // Update remark
//     booking.adminRemarks[remarkIndex].remark = (remark || "").trim() || "No remark";
//     booking.adminRemarks[remarkIndex].amount = newAmount;
//     booking.adminRemarks[remarkIndex].addedAt = new Date(); // optional: update timestamp

//     // AUTO RECALCULATE BALANCE
//     const difference = newAmount - oldAmount;
//     booking.payment.balance.amount += difference;

//     await booking.save();

//     return res.status(200).json({
//       success: true,
//       message: "Balance remark updated and balance recalculated",
//       adminRemarks: booking.adminRemarks,
//       currentBalance: booking.payment.balance.amount
//     });
//   } catch (error) {
//     console.error("updateBalanceRemark error:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ====================== IMPROVED UPDATE ADVANCE REMARK ======================
// // ====================== FINAL CORRECT updateAdvanceRemark ======================
// const updateAdvanceRemark = async (req, res) => {
//   try {
//     const { tnr } = req.params;
//     const { remarkIndex, remark, amount } = req.body;

//     if (!tnr || tnr.trim().length !== 6) {
//       return res.status(400).json({ success: false, message: "Valid 6-character TNR required" });
//     }
//     if (typeof remarkIndex !== "number" || remarkIndex < 0) {
//       return res.status(400).json({ success: false, message: "Valid remarkIndex required" });
//     }

//     const normalizedTnr = tnr.trim().toUpperCase();
//     const booking = await tourBookingModel.findOne({ tnr: normalizedTnr });

//     if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
//     if (!booking.advanceAdminRemarks || !booking.advanceAdminRemarks[remarkIndex]) {
//       return res.status(404).json({ success: false, message: "Remark not found" });
//     }

//     const oldAmount = Number(booking.advanceAdminRemarks[remarkIndex].amount) || 0;
//     const newAmount = Number(amount) || 0;

//     // Update remark
//     booking.advanceAdminRemarks[remarkIndex].remark = (remark || "").trim() || "No remark";
//     booking.advanceAdminRemarks[remarkIndex].amount = newAmount;
//     booking.advanceAdminRemarks[remarkIndex].addedAt = new Date();

//     // ✅ DIFFERENCE CALCULATION (VERY IMPORTANT)
//     const difference = newAmount - oldAmount;

//     booking.payment.advance.amount -= difference;   // Advance adjust
//     booking.payment.balance.amount += difference;   // Balance adjust

//     await booking.save();

//     return res.status(200).json({
//       success: true,
//       message: "Advance remark updated with correct recalculation",
//       data: {
//         tnr: booking.tnr,
//         advance: booking.payment?.advance || {},
//         balance: booking.payment?.balance || {},
//         advanceAdminRemarks: booking.advanceAdminRemarks || [],
//       }
//     });
//   } catch (error) {
//     console.error("updateAdvanceRemark error:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ====================== DELETE BALANCE REMARK ======================
// const deleteBalanceRemark = async (req, res) => {
//   try {
//     const { tnr } = req.params;
//     const { remarkIndex } = req.body;

//     if (!tnr || tnr.trim().length !== 6) {
//       return res.status(400).json({ success: false, message: "Valid TNR required" });
//     }
//     if (typeof remarkIndex !== "number" || remarkIndex < 0) {
//       return res.status(400).json({ success: false, message: "Valid remarkIndex required" });
//     }

//     const normalizedTnr = tnr.trim().toUpperCase();
//     const booking = await tourBookingModel.findOne({ tnr: normalizedTnr });

//     if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
//     if (!booking.adminRemarks || !booking.adminRemarks[remarkIndex]) {
//       return res.status(404).json({ success: false, message: "Remark not found" });
//     }

//     const deletedAmount = Number(booking.adminRemarks[remarkIndex].amount) || 0;

//     booking.adminRemarks.splice(remarkIndex, 1);

//     // AUTO RECALCULATE BALANCE
//     booking.payment.balance.amount -= deletedAmount;

//     await booking.save();

//     return res.status(200).json({
//       success: true,
//       message: "Balance remark deleted and balance recalculated",
//       adminRemarks: booking.adminRemarks,
//       currentBalance: booking.payment.balance.amount
//     });
//   } catch (error) {
//     console.error("deleteBalanceRemark error:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ====================== DELETE ADVANCE REMARK ======================
// const deleteAdvanceRemark = async (req, res) => {
//   try {
//     const { tnr } = req.params;
//     const { remarkIndex } = req.body;

//     if (!tnr || tnr.trim().length !== 6) {
//       return res.status(400).json({ success: false, message: "Valid TNR required" });
//     }
//     if (typeof remarkIndex !== "number" || remarkIndex < 0) {
//       return res.status(400).json({ success: false, message: "Valid remarkIndex required" });
//     }

//     const normalizedTnr = tnr.trim().toUpperCase();
//     const booking = await tourBookingModel.findOne({ tnr: normalizedTnr });

//     if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
//     if (!booking.advanceAdminRemarks || !booking.advanceAdminRemarks[remarkIndex]) {
//       return res.status(404).json({ success: false, message: "Remark not found" });
//     }

//     const deletedAmount = Number(booking.advanceAdminRemarks[remarkIndex].amount) || 0;

//     booking.advanceAdminRemarks.splice(remarkIndex, 1);

//     // Reverse the shift
//     booking.payment.advance.amount += deletedAmount;   // Add back to Advance
//     booking.payment.balance.amount -= deletedAmount;   // Remove from Balance

//     await booking.save();

//     return res.status(200).json({
//       success: true,
//       message: "Advance remark deleted with correct recalculation",
//       data: {
//         tnr: booking.tnr,
//         advance: booking.payment?.advance || {},
//         balance: booking.payment?.balance || {},
//         advanceAdminRemarks: booking.advanceAdminRemarks || [],
//       }
//     });
//   } catch (error) {
//     console.error("deleteAdvanceRemark error:", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// const updateModifyReceipt = async (req, res) => {
//   try {
//     const { tnr, tourId } = req.body;

//     if (!tnr) {
//       return res.status(400).json({
//         success: false,
//         message: "TNR is required",
//       });
//     }

//     if (!tourId) {
//       return res.status(400).json({
//         success: false,
//         message: "tourId is required",
//       });
//     }

//     // Fetch booking by TNR (case-insensitive lookup)
//     const booking = await tourBookingModel.findOne({
//       tnr: tnr.trim().toUpperCase(),
//     });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found with this TNR",
//       });
//     }

//     // Ensure booking belongs to the selected tour
//     if (booking.tourId.toString() !== tourId) {
//       return res.status(403).json({
//         success: false,
//         message: "Unauthorized to modify this booking",
//       });
//     }

//     // Set isTripCompleted to false (mark as not completed)
//     booking.isTripCompleted = false;

//     // Save the updated booking
//     await booking.save({ validateModifiedOnly: true });

//     return res.status(200).json({
//       success: true,
//       message: "Trip completion status marked as not completed successfully",
//       booking: {
//         tnr: booking.tnr,
//         isTripCompleted: booking.isTripCompleted,
//         // Only return minimal necessary fields
//       },
//     });
//   } catch (error) {
//     console.error("updateModifyReceipt error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Something went wrong",
//     });
//   }
// };

// const taskMarkModifyReceipt = async (req, res) => {
//   try {
//     const { tnr } = req.body;

//     if (!tnr) {
//       return res.status(400).json({
//         success: false,
//         message: "TNR is required",
//       });
//     }

//     // Find booking by TNR (case-insensitive lookup)
//     const booking = await tourBookingModel.findOne({
//       tnr: tnr.trim().toUpperCase(),
//     });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found with this TNR",
//       });
//     }

//     // Optional: Add authorization check if needed
//     // Example: if (req.user.role !== 'admin' && booking.userId.toString() !== req.user._id.toString()) {
//     //   return res.status(403).json({ success: false, message: "Unauthorized" });
//     // }

//     // Set isTripCompleted to false (meaning trip is not completed yet)
//     booking.isTripCompleted = false;

//     await booking.save({ validateModifiedOnly: true });

//     return res.status(200).json({
//       success: true,
//       message: "Trip completion status marked as not completed successfully",
//       booking: {
//         tnr: booking.tnr,
//         isTripCompleted: booking.isTripCompleted,
//         // Include only necessary fields — avoid sending full sensitive data
//       },
//     });
//   } catch (error) {
//     console.error("taskMarkModifyReceipt error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Something went wrong",
//     });
//   }
// };

// // controllers/tourController.js
// const viewBooking = async (req, res) => {
//   try {
//     const { tnr } = req.params; // Changed from bookingId to tnr
//     const tToken = req.header("ttoken");

//     if (!tToken) {
//       return res
//         .status(401)
//         .json({ success: false, message: "Not Authorized." });
//     }

//     let decoded;
//     try {
//       decoded = jwt.verify(tToken, process.env.JWT_SECRET);
//     } catch (error) {
//       return res
//         .status(401)
//         .json({ success: false, message: "Invalid token." });
//     }

//     // Validate TNR format (6 uppercase letters/digits)
//     if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid or missing TNR (must be exactly 6 characters)",
//       });
//     }

//     const normalizedTnr = tnr.trim().toUpperCase();

//     // Find booking by TNR
//     const booking = await tourBookingModel
//       .findOne({ tnr: normalizedTnr })
//       .populate("userId", "name email mobile")
//       .lean();

//     if (!booking) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Booking not found with this TNR" });
//     }

//     // Fetch full tour data
//     const tour = await tourModel.findById(booking.tourId).lean();
//     if (!tour) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Tour not found" });
//     }

//     // booking.tourFull = tour;

//     // return res.json({
//     //   success: true,
//     //   data: booking,
//     // });
//     booking.tourFull = tour;

//     // ── Live-correct gvCancellationPool / irctcCancellationPool ──
//     const approvedCancellations = await cancellationModel
//       .find({ tnr: normalizedTnr, approvedBy: true })
//       .lean();

//     if (approvedCancellations.length > 0) {
//       const latestApproved = approvedCancellations.reduce((best, c) => {
//         if (!best) return c;
//         const cDate = new Date(c.approvedAt || c.createdAt || c.updatedAt || 0).getTime();
//         const bestDate = new Date(best.approvedAt || best.createdAt || best.updatedAt || 0).getTime();
//         return cDate > bestDate ? c : best;
//       }, null);

//       booking.gvCancellationPool =
//         (Number(latestApproved.gvCancellationAmount) || 0) +
//         (Number(latestApproved.remarksAmount) || 0);
//       booking.irctcCancellationPool =
//         Number(latestApproved.irctcCancellationAmount) || 0;
//     }

//     return res.json({
//       success: true,
//       data: booking,
//     });
//   } catch (error) {
//     console.error("viewBooking error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while fetching booking details.",
//       error: error.message,
//     });
//   }
// };
// const getCancellationsByBooking = async (req, res) => {
//   try {
//     const { tnr } = req.params;
//     const { limit = 20 } = req.query;

//     // Validate TNR
//     if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid 6-character TNR is required",
//       });
//     }

//     const normalizedTnr = tnr.trim().toUpperCase();

//     const numericLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);

//     // Find cancellations for this booking using TNR
//     const cancellations = await cancellationModel
//       .find({ tnr: normalizedTnr }) // ← changed from bookingId to tnr
//       .sort({ createdAt: -1 })
//       .limit(numericLimit)
//       .lean();

//     return res.status(200).json({
//       success: true,
//       count: cancellations.length,
//       results: cancellations,
//     });
//   } catch (err) {
//     console.error("getCancellationsByBooking error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while fetching cancellations",
//     });
//   }
// };
// // const updateBookingBalance = async (req, res) => {
// //   try {
// //     const { bookingId } = req.params;
// //     const { updates = {} } = req.body;

// //     console.log(`[updateBookingBalance] Processing bookingId: ${bookingId}`);
// //     console.log(
// //       `[updateBookingBalance] Received updates keys:`,
// //       Object.keys(updates),
// //     );

// //     if (!mongoose.Types.ObjectId.isValid(bookingId)) {
// //       return res
// //         .status(400)
// //         .json({ success: false, message: "Invalid bookingId" });
// //     }

// //     const original = await tourBookingModel
// //       .findById(bookingId)
// //       .populate("tourId")
// //       .lean();

// //     if (!original) {
// //       return res
// //         .status(404)
// //         .json({ success: false, message: "Booking not found" });
// //     }

// //     const tour = original.tourId;

// //     console.log(
// //       `[ORIGINAL] Advance paid: ${original.payment?.advance?.paid}, amount: ${original.payment?.advance?.amount || 0}`,
// //     );
// //     console.log(
// //       `[ORIGINAL] Balance paid: ${original.payment?.balance?.paid}, amount: ${original.payment?.balance?.amount || 0}`,
// //     );

// //     // Early blocks
// //     const hasPendingTravellerCancellation = original.travellers.some(
// //       (t) => t.cancelled?.byTraveller === true && !t.cancelled?.byAdmin,
// //     );

// //     if (hasPendingTravellerCancellation) {
// //       console.log("[BLOCK] Pending traveller cancellation → blocked");
// //       return res.status(400).json({
// //         success: false,
// //         message: "Pending traveller cancellation request.",
// //         reason: "pending_traveller_cancellation",
// //       });
// //     }

// //     if (original.cancellationRequest === true) {
// //       console.log("[BLOCK] Pending full cancellation → blocked");
// //       return res.status(400).json({
// //         success: false,
// //         message: "Pending full cancellation request.",
// //         reason: "pending_full_cancellation",
// //       });
// //     }

// //     const advancePaid = original.payment?.advance?.paid ?? false;
// //     const balancePaid = original.payment?.balance?.paid ?? false;
// //     const fullyPaid = advancePaid && balancePaid;

// //     // ────────────────────────────────────────────────
// //     // CASE 5: Fully paid → only boarding/deboarding
// //     // ────────────────────────────────────────────────
// //     if (fullyPaid) {
// //       console.log(
// //         "[CASE 5] Fully paid → restricting to boarding/deboarding only",
// //       );

// //       const restrictedTravellers = original.travellers.map((origT, i) => {
// //         const updT = updates.travellers?.[i];
// //         if (!updT) return origT;
// //         return {
// //           ...origT,
// //           boardingPoint: updT.boardingPoint || origT.boardingPoint,
// //           deboardingPoint: updT.deboardingPoint || origT.deboardingPoint,
// //         };
// //       });

// //       const merged = { ...original, travellers: restrictedTravellers };

// //       // ────────────────────────────────────────────────────────────────
// //       // FIXED: Do NOT use ...merged here — it copies the original _id!
// //       // Explicitly list only the fields we want (new _id will be auto-generated)
// //       // ────────────────────────────────────────────────────────────────
// //       const manageDoc = {
// //         userId: merged.userId,
// //         tourId: tour._id,
// //         bookingId: original._id,

// //         userData: merged.userData,
// //         tourData: merged.tourData,
// //         travellers: merged.travellers,
// //         contact: merged.contact,
// //         billingAddress: merged.billingAddress,
// //         bookingType: merged.bookingType,
// //         payment: merged.payment,
// //         receipts: merged.receipts,

// //         isTripCompleted: merged.isTripCompleted,
// //         isBookingCompleted: merged.isBookingCompleted,
// //         cancelled: merged.cancelled,

// //         bookingDate: merged.bookingDate,
// //         gvCancellationPool: merged.gvCancellationPool,
// //         irctcCancellationPool: merged.irctcCancellationPool,

// //         adminRemarks: merged.adminRemarks || [],

// //         manageBooking: true,
// //         approvedBy: false,
// //         raisedBy: true,
// //         raisedAt: new Date(Date.now() + 5.5 * 60 * 60 * 1000),

// //         // If you have this flag:
// //         travellersReduced: false, // or your logic — usually false in fully-paid case

// //         updatableAdvance: original.payment.advance.amount || 0,
// //         updatedAdvance: original.payment.advance.amount || 0,
// //         updatableBalance: original.payment.balance.amount || 0,
// //         updatedBalance: original.payment.balance.amount || 0,
// //       };

// //       const saved = await manageBookingModel.create(manageDoc);

// //       console.log(
// //         "[CASE 5] Created manage doc with locked values → new _id:",
// //         saved._id,
// //       );

// //       return res.status(201).json({
// //         success: true,
// //         message: "Manage booking raised (boarding/deboarding only)",
// //         warning: "Fully paid → package & addons locked",
// //         data: saved,
// //       });
// //     }
// //     // Merge updates + preserve cancelled flags
// //     const mergedTravellers = (updates.travellers || original.travellers).map(
// //       (newT) => {
// //         const origT = original.travellers.find(
// //           (o) => o._id?.toString() === newT._id?.toString(),
// //         );
// //         if (origT?.cancelled) {
// //           return { ...newT, cancelled: { ...origT.cancelled } };
// //         }
// //         return newT;
// //       },
// //     );

// //     const merged = {
// //       ...original,
// //       ...updates,
// //       travellers: mergedTravellers,
// //       contact: { ...original.contact, ...(updates.contact || {}) },
// //       billingAddress: {
// //         ...original.billingAddress,
// //         ...(updates.billingAddress || {}),
// //       },
// //     };

// //     const getPackage = (t) => {
// //       return t.packageType === "main"
// //         ? tour
// //         : (tour.variantPackage?.[t.variantPackageIndex] ?? tour);
// //     };

// //     const activeTravellers = merged.travellers.filter(
// //       (t) => !t.cancelled?.byTraveller && !t.cancelled?.byAdmin,
// //     );

// //     // Identify newly added travellers
// //     const originalTravellerIds = new Set(
// //       original.travellers.filter((t) => t._id).map((t) => t._id.toString()),
// //     );

// //     const newAddedTravellers = activeTravellers.filter((t) => {
// //       if (!t._id) return true;
// //       return !originalTravellerIds.has(t._id.toString());
// //     });

// //     console.log(
// //       `[NEW TRAVELLERS DETECTED] Count: ${newAddedTravellers.length}`,
// //     );

// //     // ────────────────────────────────────────────────
// //     // Calculate A, B, D, T
// //     // ────────────────────────────────────────────────
// //     let A = 0,
// //       B = 0,
// //       D = 0,
// //       T = 0; // T = total current full package price of active travellers

// //     activeTravellers.forEach((t) => {
// //       const pkg = getPackage(t);
// //       let advanceVal = 0;
// //       let balanceVal = 0;
// //       let fullPackagePrice = 0;

// //       if (t.sharingType === "double" || t.sharingType === "triple") {
// //         advanceVal = pkg?.advanceAmount?.adult || 0;
// //         balanceVal =
// //           t.sharingType === "double"
// //             ? pkg?.balanceDouble || 0
// //             : pkg?.balanceTriple || 0;
// //         fullPackagePrice =
// //           t.sharingType === "double"
// //             ? pkg?.price?.doubleSharing || 0
// //             : pkg?.price?.tripleSharing || 0;
// //       } else if (
// //         t.sharingType === "withBerth" ||
// //         t.sharingType === "withoutBerth"
// //       ) {
// //         advanceVal = pkg?.advanceAmount?.child || 0;
// //         balanceVal =
// //           t.sharingType === "withBerth"
// //             ? pkg?.balanceChildWithBerth || 0
// //             : pkg?.balanceChildWithoutBerth || 0;
// //         fullPackagePrice =
// //           t.sharingType === "withBerth"
// //             ? pkg?.price?.childWithBerth || 0
// //             : pkg?.price?.childWithoutBerth || 0;
// //       }

// //       A += advanceVal;
// //       B += balanceVal;
// //       D += t.selectedAddon?.price || 0;
// //       T += fullPackagePrice;
// //     });

// //     // ────────────────────────────────────────────────
// //     // Calculate J & K → only new travellers
// //     // ────────────────────────────────────────────────
// //     let J = 0,
// //       K = 0;

// //     newAddedTravellers.forEach((t) => {
// //       const pkg = getPackage(t);
// //       let packagePrice = 0;

// //       if (t.sharingType === "double")
// //         packagePrice = pkg?.price?.doubleSharing || 0;
// //       else if (t.sharingType === "triple")
// //         packagePrice = pkg?.price?.tripleSharing || 0;
// //       else if (t.sharingType === "withBerth")
// //         packagePrice = pkg?.price?.childWithBerth || 0;
// //       else if (t.sharingType === "withoutBerth")
// //         packagePrice = pkg?.price?.childWithoutBerth || 0;

// //       J += packagePrice;
// //       K += t.selectedAddon?.price || 0;
// //     });

// //     // ────────────────────────────────────────────────
// //     // Other variables
// //     // ────────────────────────────────────────────────
// //     const C = original.payment?.advance?.amount || 0;
// //     const I = original.payment?.balance?.amount || 0;

// //     const E = (merged.adminRemarks || [])
// //       .filter((r) => (r.amount || 0) > 0)
// //       .reduce((sum, r) => sum + (r.amount || 0), 0);

// //     const F = Math.abs(
// //       (merged.adminRemarks || [])
// //         .filter((r) => (r.amount || 0) < 0)
// //         .reduce((sum, r) => sum + (r.amount || 0), 0),
// //     );

// //     const G = merged.gvCancellationPool || 0;
// //     const H = merged.irctcCancellationPool || 0;

// //     // ────────────────────────────────────────────────
// //     // Logging — added T
// //     // ────────────────────────────────────────────────
// //     console.log("┌──────────────────────────────────────────────┐");
// //     console.log("│         CALCULATED VARIABLES                 │");
// //     console.log("├──────────────────────────────────────────────┤");
// //     console.log(`│ A (total advance)     = ₹${A}`);
// //     console.log(`│ B (total balance portion) = ₹${B}`);
// //     console.log(`│ T (total full package price) = ₹${T}`);
// //     console.log(`│ C (paid advance)      = ₹${C}`);
// //     console.log(`│ I (paid balance)      = ₹${I}`);
// //     console.log(`│ D (total addons)      = ₹${D}`);
// //     console.log(`│ J (new pkg full price)= ₹${J}`);
// //     console.log(`│ K (new addons)        = ₹${K}`);
// //     console.log(`│ E (pos remarks)       = ₹${E}`);
// //     console.log(`│ F (neg remarks abs)   = ₹${F}`);
// //     console.log(`│ G (GV pool)           = ₹${G}`);
// //     console.log(`│ H (IRCTC pool)        = ₹${H}`);
// //     console.log("└──────────────────────────────────────────────┘");

// //     const originalActiveCount = original.travellers.filter(
// //       (t) => !t.cancelled?.byTraveller && !t.cancelled?.byAdmin,
// //     ).length;
// //     const currentActiveCount = activeTravellers.length;

// //     const travellerReduced = currentActiveCount < originalActiveCount;
// //     const travellerAdded = currentActiveCount > originalActiveCount;
// //     const countSame = currentActiveCount === originalActiveCount;

// //     console.log(
// //       `[TRAVELLERS] Original active: ${originalActiveCount} → Current: ${currentActiveCount}`,
// //     );
// //     console.log(
// //       `[CHANGE] Reduced=${travellerReduced} | Added=${travellerAdded} | Same=${countSame}`,
// //     );

// //     // ────────────────────────────────────────────────
// //     // Calculation logic — updated Case 1 to use T instead of B
// //     // ────────────────────────────────────────────────
// //     let updatableAdvance = 0;
// //     let updatedAdvance = 0;
// //     let updatableBalance = 0;
// //     let updatedBalance = 0;

// //     let appliedCase = "unknown";

// //     if (advancePaid && !balancePaid) {
// //       if (travellerAdded) {
// //         appliedCase = "Case 3 - travellers added";
// //         updatableAdvance = updatedAdvance = C;
// //         updatableBalance = T + D + E + G + H; // ← YOUR NEW FORMULA
// //         updatedBalance = updatableBalance - (updatedAdvance + F); // ← YOUR NEW FORMULA
// //       } else if (countSame) {
// //         // Case 1 - same count, existing travellers edited
// //         appliedCase = "Case 1 - same count (existing edited)";
// //         updatableAdvance = updatedAdvance = C;
// //         updatableBalance = T + D + E + G + H;
// //         updatedBalance = updatableBalance - (C + F);
// //       } else if (travellerReduced) {
// //         appliedCase = "Case 2 - travellers reduced (advance paid)";
// //         updatableAdvance = A;
// //         updatedAdvance = A + D;
// //         updatableBalance = B;
// //         updatedBalance = B;
// //       }
// //     } else {
// //       // No advance paid
// //       appliedCase = travellerReduced
// //         ? "Case 2 variant (no advance + reduced)"
// //         : "Case 4";
// //       updatableAdvance = A;
// //       updatedAdvance = A + D;
// //       updatableBalance = B;
// //       updatedBalance = B;
// //     }

// //     console.log(`[APPLIED CASE] ${appliedCase}`);
// //     console.log(`[RESULT] updatableAdvance   = ${updatableAdvance}`);
// //     console.log(`[RESULT] updatedAdvance     = ${updatedAdvance}`);
// //     console.log(`[RESULT] updatableBalance   = ${updatableBalance}`);
// //     console.log(`[RESULT] updatedBalance     = ${updatedBalance}`);
// //     // ────────────────────────────────────────────────
// //     // Create manage booking document
// //     // ────────────────────────────────────────────────
// //     const manageDoc = {
// //       userId: merged.userId,
// //       tourId: tour._id,
// //       bookingId: original._id,
// //       userData: merged.userData,
// //       tourData: merged.tourData,
// //       travellers: merged.travellers,
// //       contact: merged.contact,
// //       billingAddress: merged.billingAddress,
// //       bookingType: merged.bookingType,
// //       payment: merged.payment,
// //       receipts: merged.receipts,
// //       isTripCompleted: merged.isTripCompleted,
// //       isBookingCompleted: merged.isBookingCompleted,
// //       cancelled: merged.cancelled,
// //       bookingDate: merged.bookingDate,
// //       gvCancellationPool: merged.gvCancellationPool,
// //       irctcCancellationPool: merged.irctcCancellationPool,
// //       adminRemarks: merged.adminRemarks || [],
// //       manageBooking: true,
// //       approvedBy: false,
// //       raisedBy: true,
// //       raisedAt: new Date(Date.now() + 5.5 * 60 * 60 * 1000),

// //       // ────────────────────────────────────────────────────────────────
// //       // travellersReduced = true ONLY when:
// //       //   1. Traveller count actually reduced
// //       //   2. AND (advance paid & balance unpaid) OR (both unpaid)
// //       // ────────────────────────────────────────────────────────────────
// //       travellersReduced:
// //         travellerReduced === true &&
// //         ((advancePaid && !balancePaid) || // advance paid + balance unpaid
// //           (!advancePaid && !balancePaid)), // both unpaid

// //       updatableAdvance,
// //       updatedAdvance,
// //       updatableBalance,
// //       updatedBalance,
// //     };

// //     const saved = await manageBookingModel.create(manageDoc);

// //     console.log(`[SUCCESS] Manage booking created → _id: ${saved._id}`);
// //     console.log(
// //       `[FLAG] travellersReduced set to: ${manageDoc.travellersReduced} (reduced=${travellerReduced}, advancePaid=${advancePaid}, balancePaid=${balancePaid})`,
// //     );

// //     return res.status(201).json({
// //       success: true,
// //       message: `Manage booking raised (${appliedCase})`,
// //       warning: travellerReduced
// //         ? "Traveller count reduced"
// //         : travellerAdded
// //           ? "New travellers added"
// //           : null,
// //       data: saved,
// //     });
// //   } catch (err) {
// //     console.error("[ERROR] updateBookingBalance failed:", err);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Server error",
// //       error: err.message,
// //     });
// //   }
// // };

// const updateBookingBalance = async (req, res) => {
//   try {
//     const { bookingId } = req.params;
//     const { updates = {} } = req.body;

//     console.log(`[updateBookingBalance] Processing bookingId: ${bookingId}`);
//     console.log(
//       `[updateBookingBalance] Received updates keys:`,
//       Object.keys(updates),
//     );

//     if (!mongoose.Types.ObjectId.isValid(bookingId)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid bookingId" });
//     }

//     const original = await tourBookingModel
//       .findById(bookingId)
//       .populate("tourId")
//       .lean();

//     if (!original) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Booking not found" });
//     }

//     const tour = original.tourId;

//     console.log(
//       `[ORIGINAL] Advance paid: ${original.payment?.advance?.paid}, amount: ${original.payment?.advance?.amount || 0}`,
//     );
//     console.log(
//       `[ORIGINAL] Balance paid: ${original.payment?.balance?.paid}, amount: ${original.payment?.balance?.amount || 0}`,
//     );

//     // Early blocks
//     const hasPendingTravellerCancellation = original.travellers.some(
//       (t) => t.cancelled?.byTraveller === true && !t.cancelled?.byAdmin,
//     );

//     if (hasPendingTravellerCancellation) {
//       console.log("[BLOCK] Pending traveller cancellation → blocked");
//       return res.status(400).json({
//         success: false,
//         message: "Pending traveller cancellation request.",
//         reason: "pending_traveller_cancellation",
//       });
//     }

//     if (original.cancellationRequest === true) {
//       console.log("[BLOCK] Pending full cancellation → blocked");
//       return res.status(400).json({
//         success: false,
//         message: "Pending full cancellation request.",
//         reason: "pending_full_cancellation",
//       });
//     }

//     const advancePaid = original.payment?.advance?.paid ?? false;
//     const balancePaid = original.payment?.balance?.paid ?? false;
//     const fullyPaid = advancePaid && balancePaid;

//     // ────────────────────────────────────────────────
//     // CASE 5: Fully paid → only boarding/deboarding
//     // ────────────────────────────────────────────────
//     if (fullyPaid) {
//       console.log(
//         "[CASE 5] Fully paid → restricting to boarding/deboarding only",
//       );

//       const restrictedTravellers = original.travellers.map((origT, i) => {
//         const updT = updates.travellers?.[i];
//         if (!updT) return origT;
//         return {
//           ...origT,
//           boardingPoint: updT.boardingPoint || origT.boardingPoint,
//           deboardingPoint: updT.deboardingPoint || origT.deboardingPoint,
//         };
//       });

//       const merged = { ...original, travellers: restrictedTravellers };

//       // ────────────────────────────────────────────────────────────────
//       // FIXED: Do NOT use ...merged here — it copies the original _id!
//       // Explicitly list only the fields we want (new _id will be auto-generated)
//       // ────────────────────────────────────────────────────────────────
//       const manageDoc = {
//         userId: merged.userId,
//         tourId: tour._id,
//         bookingId: original._id,

//         userData: merged.userData,
//         tourData: merged.tourData,
//         travellers: merged.travellers,
//         contact: merged.contact,
//         billingAddress: merged.billingAddress,
//         bookingType: merged.bookingType,
//         payment: merged.payment,
//         receipts: merged.receipts,

//         isTripCompleted: merged.isTripCompleted,
//         isBookingCompleted: merged.isBookingCompleted,
//         cancelled: merged.cancelled,

//         bookingDate: merged.bookingDate,
//         gvCancellationPool: merged.gvCancellationPool,
//         irctcCancellationPool: merged.irctcCancellationPool,

//         adminRemarks: merged.adminRemarks || [],

//         manageBooking: true,
//         approvedBy: false,
//         raisedBy: true,
//         raisedAt: new Date(Date.now() + 5.5 * 60 * 60 * 1000),

//         // If you have this flag:
//         travellersReduced: false, // or your logic — usually false in fully-paid case

//         updatableAdvance: original.payment.advance.amount || 0,
//         updatedAdvance: original.payment.advance.amount || 0,
//         updatableBalance: original.payment.balance.amount || 0,
//         updatedBalance: original.payment.balance.amount || 0,
//       };

//       const saved = await manageBookingModel.create(manageDoc);

//       console.log(
//         "[CASE 5] Created manage doc with locked values → new _id:",
//         saved._id,
//       );

//       return res.status(201).json({
//         success: true,
//         message: "Manage booking raised (boarding/deboarding only)",
//         warning: "Fully paid → package & addons locked",
//         data: saved,
//       });
//     }
//     // Merge updates + preserve cancelled flags
//     const mergedTravellers = (updates.travellers || original.travellers).map(
//       (newT) => {
//         const origT = original.travellers.find(
//           (o) => o._id?.toString() === newT._id?.toString(),
//         );
//         if (origT?.cancelled) {
//           return { ...newT, cancelled: { ...origT.cancelled } };
//         }
//         return newT;
//       },
//     );

//     const merged = {
//       ...original,
//       ...updates,
//       travellers: mergedTravellers,
//       contact: { ...original.contact, ...(updates.contact || {}) },
//       billingAddress: {
//         ...original.billingAddress,
//         ...(updates.billingAddress || {}),
//       },
//     };

//     const getPackage = (t) => {
//       return t.packageType === "main"
//         ? tour
//         : (tour.variantPackage?.[t.variantPackageIndex] ?? tour);
//     };

//     // ────────────────────────────────────────────────
//     // Addon amount for a traveller — supports BOTH shapes:
//     //   - OLD (flat, old bookings):        t.selectedAddon?.price
//     //   - NEW (train/flight-wise, new bookings): sum of
//     //         t.selectedAddons[].amount
//     // Whichever is populated for that traveller is used — no
//     // double counting, no change to any other part of the
//     // calculation below (A, B, T, C, I, E, F, G, H, case logic,
//     // manageDoc) — this ONLY changes where D and K get their
//     // rupee value from.
//     // ────────────────────────────────────────────────
//     const getTravellerAddonTotal = (t) => {
//       if (Array.isArray(t.selectedAddons) && t.selectedAddons.length > 0) {
//         return t.selectedAddons.reduce(
//           (sum, a) => sum + (Number(a.amount) || 0),
//           0,
//         );
//       }
//       return Number(t.selectedAddon?.price) || 0;
//     };

//     const activeTravellers = merged.travellers.filter(
//       (t) => !t.cancelled?.byTraveller && !t.cancelled?.byAdmin,
//     );

//     // Identify newly added travellers
//     const originalTravellerIds = new Set(
//       original.travellers.filter((t) => t._id).map((t) => t._id.toString()),
//     );

//     const newAddedTravellers = activeTravellers.filter((t) => {
//       if (!t._id) return true;
//       return !originalTravellerIds.has(t._id.toString());
//     });

//     console.log(
//       `[NEW TRAVELLERS DETECTED] Count: ${newAddedTravellers.length}`,
//     );

//     // ────────────────────────────────────────────────
//     // Calculate A, B, D, T
//     // ────────────────────────────────────────────────
//     let A = 0,
//       B = 0,
//       D = 0,
//       T = 0; // T = total current full package price of active travellers

//     activeTravellers.forEach((t) => {
//       const pkg = getPackage(t);
//       let advanceVal = 0;
//       let balanceVal = 0;
//       let fullPackagePrice = 0;

//       if (t.sharingType === "double" || t.sharingType === "triple") {
//         advanceVal = pkg?.advanceAmount?.adult || 0;
//         balanceVal =
//           t.sharingType === "double"
//             ? pkg?.balanceDouble || 0
//             : pkg?.balanceTriple || 0;
//         fullPackagePrice =
//           t.sharingType === "double"
//             ? pkg?.price?.doubleSharing || 0
//             : pkg?.price?.tripleSharing || 0;
//       } else if (
//         t.sharingType === "withBerth" ||
//         t.sharingType === "withoutBerth"
//       ) {
//         advanceVal = pkg?.advanceAmount?.child || 0;
//         balanceVal =
//           t.sharingType === "withBerth"
//             ? pkg?.balanceChildWithBerth || 0
//             : pkg?.balanceChildWithoutBerth || 0;
//         fullPackagePrice =
//           t.sharingType === "withBerth"
//             ? pkg?.price?.childWithBerth || 0
//             : pkg?.price?.childWithoutBerth || 0;
//       }

//       A += advanceVal;
//       B += balanceVal;
//       D += getTravellerAddonTotal(t);
//       T += fullPackagePrice;
//     });

//     // ────────────────────────────────────────────────
//     // Calculate J & K → only new travellers
//     // ────────────────────────────────────────────────
//     let J = 0,
//       K = 0;

//     newAddedTravellers.forEach((t) => {
//       const pkg = getPackage(t);
//       let packagePrice = 0;

//       if (t.sharingType === "double")
//         packagePrice = pkg?.price?.doubleSharing || 0;
//       else if (t.sharingType === "triple")
//         packagePrice = pkg?.price?.tripleSharing || 0;
//       else if (t.sharingType === "withBerth")
//         packagePrice = pkg?.price?.childWithBerth || 0;
//       else if (t.sharingType === "withoutBerth")
//         packagePrice = pkg?.price?.childWithoutBerth || 0;

//       J += packagePrice;
//       K += getTravellerAddonTotal(t);
//     });

//     // ────────────────────────────────────────────────
//     // Other variables
//     // ────────────────────────────────────────────────
//     const C = original.payment?.advance?.amount || 0;
//     const I = original.payment?.balance?.amount || 0;

//     const E = (merged.adminRemarks || [])
//       .filter((r) => (r.amount || 0) > 0)
//       .reduce((sum, r) => sum + (r.amount || 0), 0);

//     const F = Math.abs(
//       (merged.adminRemarks || [])
//         .filter((r) => (r.amount || 0) < 0)
//         .reduce((sum, r) => sum + (r.amount || 0), 0),
//     );

//     const G = merged.gvCancellationPool || 0;
//     const H = merged.irctcCancellationPool || 0;

//     // ────────────────────────────────────────────────
//     // Logging — added T
//     // ────────────────────────────────────────────────
//     console.log("┌──────────────────────────────────────────────┐");
//     console.log("│         CALCULATED VARIABLES                 │");
//     console.log("├──────────────────────────────────────────────┤");
//     console.log(`│ A (total advance)     = ₹${A}`);
//     console.log(`│ B (total balance portion) = ₹${B}`);
//     console.log(`│ T (total full package price) = ₹${T}`);
//     console.log(`│ C (paid advance)      = ₹${C}`);
//     console.log(`│ I (paid balance)      = ₹${I}`);
//     console.log(`│ D (total addons)      = ₹${D}`);
//     console.log(`│ J (new pkg full price)= ₹${J}`);
//     console.log(`│ K (new addons)        = ₹${K}`);
//     console.log(`│ E (pos remarks)       = ₹${E}`);
//     console.log(`│ F (neg remarks abs)   = ₹${F}`);
//     console.log(`│ G (GV pool)           = ₹${G}`);
//     console.log(`│ H (IRCTC pool)        = ₹${H}`);
//     console.log("└──────────────────────────────────────────────┘");

//     const originalActiveCount = original.travellers.filter(
//       (t) => !t.cancelled?.byTraveller && !t.cancelled?.byAdmin,
//     ).length;
//     const currentActiveCount = activeTravellers.length;

//     const travellerReduced = currentActiveCount < originalActiveCount;
//     const travellerAdded = currentActiveCount > originalActiveCount;
//     const countSame = currentActiveCount === originalActiveCount;

//     console.log(
//       `[TRAVELLERS] Original active: ${originalActiveCount} → Current: ${currentActiveCount}`,
//     );
//     console.log(
//       `[CHANGE] Reduced=${travellerReduced} | Added=${travellerAdded} | Same=${countSame}`,
//     );

//     // ────────────────────────────────────────────────
//     // Calculation logic — updated Case 1 to use T instead of B
//     // ────────────────────────────────────────────────
//     let updatableAdvance = 0;
//     let updatedAdvance = 0;
//     let updatableBalance = 0;
//     let updatedBalance = 0;

//     let appliedCase = "unknown";

//     if (advancePaid && !balancePaid) {
//       if (travellerAdded) {
//         appliedCase = "Case 3 - travellers added";
//         updatableAdvance = updatedAdvance = C;
//         updatableBalance = T + D + E + G + H; // ← YOUR NEW FORMULA
//         updatedBalance = updatableBalance - (updatedAdvance + F); // ← YOUR NEW FORMULA
//       } else if (countSame) {
//         // Case 1 - same count, existing travellers edited
//         appliedCase = "Case 1 - same count (existing edited)";
//         updatableAdvance = updatedAdvance = C;
//         updatableBalance = T + D + E + G + H;
//         updatedBalance = updatableBalance - (C + F);
//       } else if (travellerReduced) {
//         appliedCase = "Case 2 - travellers reduced (advance paid)";
//         updatableAdvance = A;
//         updatedAdvance = A + D;
//         updatableBalance = B;
//         updatedBalance = B;
//       }
//     } else {
//       // No advance paid
//       appliedCase = travellerReduced
//         ? "Case 2 variant (no advance + reduced)"
//         : "Case 4";
//       updatableAdvance = A;
//       updatedAdvance = A + D;
//       updatableBalance = B;
//       updatedBalance = B;
//     }

//     console.log(`[APPLIED CASE] ${appliedCase}`);
//     console.log(`[RESULT] updatableAdvance   = ${updatableAdvance}`);
//     console.log(`[RESULT] updatedAdvance     = ${updatedAdvance}`);
//     console.log(`[RESULT] updatableBalance   = ${updatableBalance}`);
//     console.log(`[RESULT] updatedBalance     = ${updatedBalance}`);
//     // ────────────────────────────────────────────────
//     // Create manage booking document
//     // ────────────────────────────────────────────────
//     const manageDoc = {
//       userId: merged.userId,
//       tourId: tour._id,
//       bookingId: original._id,
//       userData: merged.userData,
//       tourData: merged.tourData,
//       travellers: merged.travellers,
//       contact: merged.contact,
//       billingAddress: merged.billingAddress,
//       bookingType: merged.bookingType,
//       payment: merged.payment,
//       receipts: merged.receipts,
//       isTripCompleted: merged.isTripCompleted,
//       isBookingCompleted: merged.isBookingCompleted,
//       cancelled: merged.cancelled,
//       bookingDate: merged.bookingDate,
//       gvCancellationPool: merged.gvCancellationPool,
//       irctcCancellationPool: merged.irctcCancellationPool,
//       adminRemarks: merged.adminRemarks || [],
//       manageBooking: true,
//       approvedBy: false,
//       raisedBy: true,
//       raisedAt: new Date(Date.now() + 5.5 * 60 * 60 * 1000),

//       // ────────────────────────────────────────────────────────────────
//       // travellersReduced = true ONLY when:
//       //   1. Traveller count actually reduced
//       //   2. AND (advance paid & balance unpaid) OR (both unpaid)
//       // ────────────────────────────────────────────────────────────────
//       travellersReduced:
//         travellerReduced === true &&
//         ((advancePaid && !balancePaid) || // advance paid + balance unpaid
//           (!advancePaid && !balancePaid)), // both unpaid

//       updatableAdvance,
//       updatedAdvance,
//       updatableBalance,
//       updatedBalance,
//     };

//     const saved = await manageBookingModel.create(manageDoc);

//     console.log(`[SUCCESS] Manage booking created → _id: ${saved._id}`);
//     console.log(
//       `[FLAG] travellersReduced set to: ${manageDoc.travellersReduced} (reduced=${travellerReduced}, advancePaid=${advancePaid}, balancePaid=${balancePaid})`,
//     );

//     return res.status(201).json({
//       success: true,
//       message: `Manage booking raised (${appliedCase})`,
//       warning: travellerReduced
//         ? "Traveller count reduced"
//         : travellerAdded
//           ? "New travellers added"
//           : null,
//       data: saved,
//     });
//   } catch (err) {
//     console.error("[ERROR] updateBookingBalance failed:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: err.message,
//     });
//   }
// };

// const getManagedBookingsHistory = async (req, res) => {
//   try {
//     // Fetch all manageBooking documents with populated references
//     const history = await manageBookingModel
//       .find({})
//       .populate({
//         path: "userId",
//         select: "name email mobile", // Only needed user fields
//       })
//       .populate({
//         path: "tourId",
//         select: "title destination startDate endDate",
//       })
//       .populate({
//         path: "bookingId",
//         select:
//           "bookingDate payment.advance.amount payment.balance.amount travellers",
//       })
//       .sort({ createdAt: -1 }) // Latest first
//       .lean(); // Use lean for performance (returns plain JS objects)

//     // If no records
//     if (!history || history.length === 0) {
//       return res.status(200).json({
//         success: true,
//         message: "No manage-booking history found.",
//         data: [],
//         count: 0,
//       });
//     }

//     // Optional: Transform or enrich data if needed
//     const enrichedHistory = history.map((entry) => {
//       const original = entry.bookingId;

//       return {
//         _id: entry._id,
//         raisedAt: entry.bookingDate || entry.createdAt,
//         raisedBy: entry.raisedBy,
//         approvedBy: entry.approvedBy,

//         // User Info
//         user: {
//           _id: entry.userId?._id,
//           name: entry.userId?.name || "Unknown",
//           email: entry.userId?.email || "N/A",
//           mobile: entry.userId?.mobile || "N/A",
//         },

//         // Tour Info
//         tour: {
//           _id: entry.tourId?._id,
//           title: entry.tourId?.title || "Unknown Tour",
//           destination: entry.tourId?.destination || "N/A",
//           dates: entry.tourId
//             ? `${entry.tourId.startDate} to ${entry.tourId.endDate}`
//             : "N/A",
//         },

//         // Original Booking Reference
//         originalBooking: original
//           ? {
//             _id: original._id,
//             bookingDate: original.bookingDate,
//             advancePaid: original.payment?.advance?.amount || 0,
//             balanceDue: original.payment?.balance?.amount || 0,
//             totalTravellers: original.travellers?.length || 0,
//           }
//           : null,

//         // Requested Updates
//         requested: {
//           updatableAdvance: entry.updatableAdvance || 0,
//           updatedAdvance: entry.updatedAdvance || 0,
//           updatableBalance: entry.updatableBalance || 0,
//           updatedBalance: entry.updatedBalance || 0,
//         },

//         // Admin Remarks
//         adminRemarks: entry.adminRemarks || [],

//         // Status
//         status: entry.approvedBy
//           ? "APPROVED"
//           : entry.raisedBy
//             ? "PENDING"
//             : "DRAFT",
//       };
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Manage-booking history fetched successfully",
//       data: enrichedHistory,
//       count: enrichedHistory.length,
//     });
//   } catch (err) {
//     console.error("getManagedBookingsHistory error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch manage-booking history",
//       error: err.message,
//     });
//   }
// };
// ////vinoth
// // const allotRooms = async (req, res) => {
// //   try {
// //     const { tourId } = req.params;
// //     if (!tourId || !mongoose.Types.ObjectId.isValid(tourId)) {
// //       return res.status(400).json({ error: "Valid tourId is required" });
// //     }

// //     const objectTourId = new mongoose.Types.ObjectId(tourId);

// //     const bookings = await tourBookingModel
// //       .find({
// //         tourId: objectTourId,
// //         "cancelled.byAdmin": false,
// //         "cancelled.byTraveller": false,
// //       })
// //       .lean();

// //     if (bookings.length === 0) {
// //       return res.json({
// //         tourId,
// //         unpaidGuests: [],
// //         roomAllocations: [],
// //         message: "No active bookings found for this tour.",
// //       });
// //     }

// //     // === Separate paid and unpaid ===
// //     const paidBookings = bookings.filter(
// //       (b) => b.payment.advance.paid && b.payment.advance.paymentVerified,
// //     );

// //     const unpaidBookings = bookings.filter(
// //       (b) => !b.payment.advance.paid || !b.payment.advance.paymentVerified,
// //     );

// //     const unpaidGuests = [];
// //     unpaidBookings.forEach((booking) => {
// //       booking.travellers.forEach((traveller) => {
// //         if (!traveller.cancelled.byAdmin && !traveller.cancelled.byTraveller) {
// //           unpaidGuests.push({
// //             bookingId: booking._id.toString(),
// //             ...getBasicTravelerInfo(traveller),
// //           });
// //         }
// //       });
// //     });

// //     const rawRoomEntries = [];

// //     // Track allocated travellers to prevent duplicates
// //     const allocatedTravellerIds = new Set();

// //     const createOccupant = (t, mobile) => ({
// //       firstName: t.firstName,
// //       lastName: t.lastName,
// //       gender: t.gender,
// //       mobile,
// //       travellerId: t._id?.toString(),
// //       sharingType: t.sharingType,
// //       originalIndex: t.originalIndex, // Preserve original order
// //     });

// //     // === Step 1: Group by mobile number (Family/Friends - Case 6) ===
// //     const mobileGroups = new Map();

// //     paidBookings.forEach((booking) => {
// //       const active = booking.travellers.filter(
// //         (t) => !t.cancelled.byAdmin && !t.cancelled.byTraveller,
// //       );
// //       // Preserve original order in travellers array
// //       active.forEach((t, index) => {
// //         t.originalIndex = index; // Add original index for sorting later
// //       });
// //       const mobile = booking.contact.mobile;

// //       if (!mobileGroups.has(mobile)) mobileGroups.set(mobile, []);
// //       active.forEach((t) => {
// //         mobileGroups.get(mobile).push({
// //           traveller: t,
// //           bookingId: booking._id.toString(),
// //         });
// //       });
// //     });

// //     // === Step 2: Process each mobile group ===
// //     for (const [mobile, groupItems] of mobileGroups) {
// //       // Sort groupItems by original traveller index to maintain order
// //       groupItems.sort(
// //         (a, b) => a.traveller.originalIndex - b.traveller.originalIndex,
// //       );

// //       const travellers = groupItems.map((i) => i.traveller);
// //       const bookingIds = [...new Set(groupItems.map((i) => i.bookingId))];

// //       if (travellers.length === 0) continue;

// //       const sharingTypes = [...new Set(travellers.map((t) => t.sharingType))];
// //       const isUniformSharing =
// //         sharingTypes.length === 1 &&
// //         ["double", "triple"].includes(sharingTypes[0]);

// //       const isMarriedCouple =
// //         travellers.length === 2 &&
// //         travellers[0].gender !== travellers[1].gender &&
// //         travellers.every((t) => t.sharingType === "double");

// //       const rooms = [];

// //       // === Husband & Wife Rule ===
// //       if (isMarriedCouple) {
// //         rooms.push({
// //           sharingType: "double",
// //           occupants: travellers.map((t) => createOccupant(t, mobile)),
// //         });
// //       }
// //       // === Other cases: Mixed or Uniform sharing — allocate full groups in original order ===
// //       else {
// //         // Group by sharing type while maintaining order
// //         const bySharing = {};
// //         travellers.forEach((t) => {
// //           const key = t.sharingType;
// //           if (!bySharing[key]) bySharing[key] = [];
// //           bySharing[key].push(t);
// //         });

// //         Object.keys(bySharing).forEach((type) => {
// //           if (!["double", "triple"].includes(type)) return;

// //           const list = bySharing[type];
// //           const capacity = type === "double" ? 2 : 3;

// //           let i = 0;
// //           while (i < list.length) {
// //             const remaining = list.length - i;
// //             if (remaining >= capacity) {
// //               const group = list.slice(i, i + capacity);
// //               rooms.push({
// //                 sharingType: type,
// //                 occupants: group.map((t) => createOccupant(t, mobile)),
// //               });
// //               i += capacity;
// //             } else {
// //               i += remaining; // Leave remainder
// //             }
// //           }
// //         });

// //         // Add children in original order to first adult room
// //         const children = travellers.filter(
// //           (t) =>
// //             t.sharingType === "withBerth" || t.sharingType === "withoutBerth",
// //         );
// //         if (children.length > 0 && rooms.length > 0) {
// //           children.forEach((child) => {
// //             rooms[0].occupants.push(createOccupant(child, mobile));
// //           });
// //           rooms.forEach((room) => {
// //             const total = room.occupants.length;
// //             if (total > 3) room.sharingType = "quad";
// //             else if (total > 2) room.sharingType = "triple";
// //           });
// //         }
// //       }

// //       if (rooms.length > 0) {
// //         rawRoomEntries.push({
// //           bookingId: bookingIds[0],
// //           contactMobile: mobile,
// //           rooms: assignRoomNumbers(rooms),
// //         });

// //         rooms.forEach((room) => {
// //           room.occupants.forEach((occ) => {
// //             if (occ.travellerId) allocatedTravellerIds.add(occ.travellerId);
// //           });
// //         });
// //       }
// //     }

// //     // === Step 3: Global pooling for remainders (preserve order within same sharing/gender) ===
// //     const remainderPool = {};

// //     paidBookings.forEach((booking) => {
// //       booking.travellers.forEach((t, index) => {
// //         if (
// //           !t.cancelled.byAdmin &&
// //           !t.cancelled.byTraveller &&
// //           t._id &&
// //           !allocatedTravellerIds.has(t._id.toString()) &&
// //           ["double", "triple"].includes(t.sharingType)
// //         ) {
// //           t.originalIndex = index; // Preserve order
// //           const key = `${t.sharingType}-${t.gender}`;
// //           if (!remainderPool[key]) remainderPool[key] = [];
// //           remainderPool[key].push({
// //             traveller: t,
// //             mobile: booking.contact.mobile,
// //             bookingId: booking._id.toString(),
// //           });
// //         }
// //       });
// //     });

// //     Object.keys(remainderPool).forEach((key) => {
// //       const [sharingType, gender] = key.split("-");
// //       const capacity = sharingType === "double" ? 2 : 3;
// //       let list = remainderPool[key];
// //       if (list.length === 0) return;

// //       // Sort by original traveller index to keep order as much as possible
// //       list.sort(
// //         (a, b) => a.traveller.originalIndex - b.traveller.originalIndex,
// //       );

// //       const rooms = [];
// //       let i = 0;
// //       while (i < list.length) {
// //         const take = Math.min(capacity, list.length - i);
// //         const occupants = list
// //           .slice(i, i + take)
// //           .map((item) => createOccupant(item.traveller, item.mobile));
// //         rooms.push({
// //           sharingType:
// //             take === capacity ? sharingType : take === 2 ? "double" : "single",
// //           occupants,
// //         });
// //         i += take;
// //       }

// //       if (rooms.length > 0) {
// //         rawRoomEntries.push({
// //           bookingId: list[0].bookingId,
// //           contactMobile: list[0].mobile,
// //           rooms: assignRoomNumbers(rooms),
// //         });

// //         rooms.forEach((room) => {
// //           room.occupants.forEach((occ) => {
// //             if (occ.travellerId) allocatedTravellerIds.add(occ.travellerId);
// //           });
// //         });
// //       }
// //     });

// //     // === Step 4: Final single room reduction (same gender only) ===
// //     const singleRooms = [];
// //     rawRoomEntries.forEach((entry, entryIndex) => {
// //       entry.rooms = entry.rooms.filter((room) => {
// //         if (room.sharingType === "single") {
// //           singleRooms.push({
// //             entryIndex,
// //             room,
// //             contactMobile: entry.contactMobile,
// //             bookingId: entry.bookingId,
// //           });
// //           return false;
// //         }
// //         return true;
// //       });
// //     });

// //     const tripleSingles = { male: [], female: [] };
// //     const doubleSingles = { male: [], female: [] };

// //     singleRooms.forEach((single) => {
// //       const occupant = single.room.occupants[0];
// //       const gender = occupant.gender.toLowerCase();
// //       const original = occupant.sharingType;
// //       if (original === "triple") tripleSingles[gender].push(single);
// //       else if (original === "double") doubleSingles[gender].push(single);
// //     });

// //     ["male", "female"].forEach((gender) => {
// //       while (
// //         tripleSingles[gender].length > 0 &&
// //         doubleSingles[gender].length > 0
// //       ) {
// //         const tripleSingle = tripleSingles[gender].pop();
// //         const doubleSingle = doubleSingles[gender].pop();

// //         const newRoom = {
// //           sharingType: "double",
// //           occupants: [
// //             ...tripleSingle.room.occupants,
// //             ...doubleSingle.room.occupants,
// //           ],
// //         };

// //         rawRoomEntries[tripleSingle.entryIndex].rooms.push(newRoom);
// //       }

// //       tripleSingles[gender].forEach((r) =>
// //         rawRoomEntries[r.entryIndex].rooms.push(r.room),
// //       );
// //       doubleSingles[gender].forEach((r) =>
// //         rawRoomEntries[r.entryIndex].rooms.push(r.room),
// //       );
// //     });

// //     // === Final Grouping by Mobile ===
// //     const mobileMap = new Map();
// //     rawRoomEntries.forEach((entry) => {
// //       const mobile = entry.contactMobile || "0000000000";
// //       if (!mobileMap.has(mobile)) {
// //         mobileMap.set(mobile, {
// //           contactMobile: mobile,
// //           bookingIds: new Set(),
// //           rooms: [],
// //         });
// //       }
// //       const g = mobileMap.get(mobile);
// //       g.bookingIds.add(entry.bookingId);
// //       g.rooms.push(...entry.rooms);
// //     });

// //     const groupedByMobile = Array.from(mobileMap.values())
// //       .map((g) => ({
// //         contactMobile: g.contactMobile,
// //         bookingIds: Array.from(g.bookingIds),
// //         rooms: g.rooms.map((r, i) => ({ ...r, roomNumber: i + 1 })),
// //       }))
// //       .sort((a, b) => a.contactMobile.localeCompare(b.contactMobile));

// //     // === Check existing finalized allocation ===
// //     const existing = await tourRoomAllocationModel.findOne({
// //       tourId: objectTourId,
// //     });

// //     if (existing && existing.isFinalized) {
// //       const flat = existing.groupedByMobile.flatMap((g) =>
// //         g.rooms.map((r) => ({
// //           contactMobile: g.contactMobile,
// //           bookingIds: g.bookingIds,
// //           roomNumber: r.roomNumber,
// //           sharingType: r.sharingType,
// //           occupants: r.occupants.map((o) => ({
// //             firstName: o.firstName,
// //             lastName: o.lastName,
// //             gender: o.gender,
// //           })),
// //         })),
// //       );

// //       return res.json({
// //         tourId,
// //         unpaidGuests,
// //         roomAllocations: flat,
// //         groupedByMobile: existing.groupedByMobile,
// //         totalRooms: flat.length,
// //         totalGroups: existing.groupedByMobile.length,
// //         saved: false,
// //         message: "Finalized allocation displayed with updated unpaid guests.",
// //       });
// //     }

// //     // === Save new allocation ===
// //     await tourRoomAllocationModel.findOneAndUpdate(
// //       { tourId: objectTourId },
// //       {
// //         tourId: objectTourId,
// //         groupedByMobile,
// //         grouped: true,
// //         isFinalized: false,
// //       },
// //       { upsert: true, new: true },
// //     );

// //     const responseRooms = groupedByMobile.flatMap((g) =>
// //       g.rooms.map((r) => ({
// //         contactMobile: g.contactMobile,
// //         bookingIds: g.bookingIds,
// //         roomNumber: r.roomNumber,
// //         sharingType: r.sharingType,
// //         occupants: r.occupants.map((o) => ({
// //           firstName: o.firstName,
// //           lastName: o.lastName,
// //           gender: o.gender,
// //         })),
// //       })),
// //     );

// //     res.json({
// //       tourId,
// //       unpaidGuests,
// //       roomAllocations: responseRooms,
// //       groupedByMobile,
// //       totalRooms: responseRooms.length,
// //       totalGroups: groupedByMobile.length,
// //       saved: true,
// //       message:
// //         "Room allotment completed successfully (travellers in original order).",
// //     });
// //   } catch (error) {
// //     console.error("Room allotment error:", error);
// //     res.status(500).json({ error: error.message || "Internal server error" });
// //   }
// // };

// const allotRooms = async (req, res) => {
//   try {
//     const { tourId } = req.params;
//     if (!tourId || !mongoose.Types.ObjectId.isValid(tourId)) {
//       return res.status(400).json({ error: "Valid tourId is required" });
//     }

//     const objectTourId = new mongoose.Types.ObjectId(tourId);

//     const bookings = await tourBookingModel
//       .find({
//         tourId: objectTourId,
//         "cancelled.byAdmin": false,
//         "cancelled.byTraveller": false,
//       })
//       .lean();

//     if (bookings.length === 0) {
//       return res.json({
//         tourId,
//         unpaidGuests: [],
//         roomAllocations: [],
//         message: "No active bookings found for this tour.",
//       });
//     }

//     // === Separate paid and unpaid ===
//     const paidBookings = bookings.filter(
//       (b) => b.payment.advance.paid && b.payment.advance.paymentVerified,
//     );

//     const unpaidBookings = bookings.filter(
//       (b) => !b.payment.advance.paid || !b.payment.advance.paymentVerified,
//     );

//     const unpaidGuests = [];
//     unpaidBookings.forEach((booking) => {
//       booking.travellers.forEach((traveller) => {
//         if (!traveller.cancelled.byAdmin && !traveller.cancelled.byTraveller) {
//           unpaidGuests.push({
//             bookingId: booking._id.toString(),
//             ...getBasicTravelerInfo(traveller),
//           });
//         }
//       });
//     });

//     const rawRoomEntries = [];

//     // Track allocated travellers to prevent duplicates
//     const allocatedTravellerIds = new Set();

//     const createOccupant = (t, mobile) => ({
//       firstName: t.firstName,
//       lastName: t.lastName,
//       gender: t.gender,
//       mobile,
//       travellerId: t._id?.toString(),
//       sharingType: t.sharingType,
//       originalIndex: t.originalIndex, // Preserve original order
//     });

//     // === Step 1: Group by mobile number (Family/Friends - Case 6) ===
//     const mobileGroups = new Map();

//     paidBookings.forEach((booking) => {
//       const active = booking.travellers.filter(
//         (t) => !t.cancelled.byAdmin && !t.cancelled.byTraveller,
//       );
//       // Preserve original order in travellers array
//       active.forEach((t, index) => {
//         t.originalIndex = index; // Add original index for sorting later
//       });
//       const mobile = booking.contact.mobile;

//       if (!mobileGroups.has(mobile)) mobileGroups.set(mobile, []);
//       active.forEach((t) => {
//         mobileGroups.get(mobile).push({
//           traveller: t,
//           bookingId: booking._id.toString(),
//         });
//       });
//     });

//     // === Step 2: Process each mobile group ===
//     for (const [mobile, groupItems] of mobileGroups) {
//       // Sort groupItems by original traveller index to maintain order
//       groupItems.sort(
//         (a, b) => a.traveller.originalIndex - b.traveller.originalIndex,
//       );

//       const travellers = groupItems.map((i) => i.traveller);
//       const bookingIds = [...new Set(groupItems.map((i) => i.bookingId))];

//       if (travellers.length === 0) continue;

//       const sharingTypes = [...new Set(travellers.map((t) => t.sharingType))];
//       const isUniformSharing =
//         sharingTypes.length === 1 &&
//         ["double", "triple"].includes(sharingTypes[0]);

//       const isMarriedCouple =
//         travellers.length === 2 &&
//         travellers[0].gender !== travellers[1].gender &&
//         travellers.every((t) => t.sharingType === "double");

//       const rooms = [];

//       // === Husband & Wife Rule ===
//       if (isMarriedCouple) {
//         rooms.push({
//           sharingType: "double",
//           occupants: travellers.map((t) => createOccupant(t, mobile)),
//         });
//       }
//       // === Other cases: Mixed or Uniform sharing — allocate full groups in original order ===
//       else {
//         // Group by sharing type while maintaining order
//         const bySharing = {};
//         travellers.forEach((t) => {
//           const key = t.sharingType;
//           if (!bySharing[key]) bySharing[key] = [];
//           bySharing[key].push(t);
//         });

//         Object.keys(bySharing).forEach((type) => {
//           if (!["double", "triple"].includes(type)) return;

//           const list = bySharing[type];
//           const capacity = type === "double" ? 2 : 3;

//           let i = 0;
//           while (i < list.length) {
//             const remaining = list.length - i;
//             if (remaining >= capacity) {
//               const group = list.slice(i, i + capacity);
//               rooms.push({
//                 sharingType: type,
//                 occupants: group.map((t) => createOccupant(t, mobile)),
//               });
//               i += capacity;
//             } else {
//               i += remaining; // Leave remainder
//             }
//           }
//         });

//         // Add children in original order to first adult room
//         const children = travellers.filter(
//           (t) =>
//             t.sharingType === "withBerth" || t.sharingType === "withoutBerth",
//         );
//         if (children.length > 0 && rooms.length > 0) {
//           children.forEach((child) => {
//             rooms[0].occupants.push(createOccupant(child, mobile));
//           });
//           rooms.forEach((room) => {
//             const total = room.occupants.length;
//             if (total > 3) room.sharingType = "quad";
//             else if (total > 2) room.sharingType = "triple";
//           });
//         }
//       }

//       if (rooms.length > 0) {
//         rawRoomEntries.push({
//           bookingId: bookingIds[0],
//           contactMobile: mobile,
//           rooms: assignRoomNumbers(rooms),
//         });

//         rooms.forEach((room) => {
//           room.occupants.forEach((occ) => {
//             if (occ.travellerId) allocatedTravellerIds.add(occ.travellerId);
//           });
//         });
//       }
//     }

//     // === Step 3: Global pooling for remainders (preserve order within same sharing/gender) ===
//     const remainderPool = {};

//     paidBookings.forEach((booking) => {
//       booking.travellers.forEach((t, index) => {
//         if (
//           !t.cancelled.byAdmin &&
//           !t.cancelled.byTraveller &&
//           t._id &&
//           !allocatedTravellerIds.has(t._id.toString()) &&
//           ["double", "triple"].includes(t.sharingType)
//         ) {
//           t.originalIndex = index; // Preserve order
//           const key = `${t.sharingType}-${t.gender}`;
//           if (!remainderPool[key]) remainderPool[key] = [];
//           remainderPool[key].push({
//             traveller: t,
//             mobile: booking.contact.mobile,
//             bookingId: booking._id.toString(),
//           });
//         }
//       });
//     });

//     Object.keys(remainderPool).forEach((key) => {
//       const [sharingType, gender] = key.split("-");
//       const capacity = sharingType === "double" ? 2 : 3;
//       let list = remainderPool[key];
//       if (list.length === 0) return;

//       // Sort by original traveller index to keep order as much as possible
//       list.sort(
//         (a, b) => a.traveller.originalIndex - b.traveller.originalIndex,
//       );

//       const rooms = [];
//       let i = 0;
//       while (i < list.length) {
//         const take = Math.min(capacity, list.length - i);
//         const occupants = list
//           .slice(i, i + take)
//           .map((item) => createOccupant(item.traveller, item.mobile));
//         rooms.push({
//           sharingType:
//             take === capacity ? sharingType : take === 2 ? "double" : "single",
//           occupants,
//         });
//         i += take;
//       }

//       if (rooms.length > 0) {
//         rawRoomEntries.push({
//           bookingId: list[0].bookingId,
//           contactMobile: list[0].mobile,
//           rooms: assignRoomNumbers(rooms),
//         });

//         rooms.forEach((room) => {
//           room.occupants.forEach((occ) => {
//             if (occ.travellerId) allocatedTravellerIds.add(occ.travellerId);
//           });
//         });
//       }
//     });

//     // === Step 4: Final single room reduction (same gender only) ===
//     const singleRooms = [];
//     rawRoomEntries.forEach((entry, entryIndex) => {
//       entry.rooms = entry.rooms.filter((room) => {
//         if (room.sharingType === "single") {
//           singleRooms.push({
//             entryIndex,
//             room,
//             contactMobile: entry.contactMobile,
//             bookingId: entry.bookingId,
//           });
//           return false;
//         }
//         return true;
//       });
//     });

//     const tripleSingles = { male: [], female: [] };
//     const doubleSingles = { male: [], female: [] };

//     // singleRooms.forEach((single) => {
//     //   const occupant = single.room.occupants[0];
//     //   const gender = occupant.gender.toLowerCase();
//     //   const original = occupant.sharingType;
//     //   if (original === "triple") tripleSingles[gender].push(single);
//     //   else if (original === "double") doubleSingles[gender].push(single);
//     // });

//     singleRooms.forEach((single) => {
//       const occupant = single.room.occupants[0];
//       const gender = (occupant.gender || "").toLowerCase();
//       const original = occupant.sharingType;

//       if (gender === "male" || gender === "female") {
//         if (original === "triple") tripleSingles[gender].push(single);
//         else if (original === "double") doubleSingles[gender].push(single);
//       } else {
//         // unknown/missing gender — keep it as its own single room instead of crashing
//         rawRoomEntries[single.entryIndex].rooms.push(single.room);
//       }
//     });

//     ["male", "female"].forEach((gender) => {
//       while (
//         tripleSingles[gender].length > 0 &&
//         doubleSingles[gender].length > 0
//       ) {
//         const tripleSingle = tripleSingles[gender].pop();
//         const doubleSingle = doubleSingles[gender].pop();

//         const newRoom = {
//           sharingType: "double",
//           occupants: [
//             ...tripleSingle.room.occupants,
//             ...doubleSingle.room.occupants,
//           ],
//         };

//         rawRoomEntries[tripleSingle.entryIndex].rooms.push(newRoom);
//       }

//       tripleSingles[gender].forEach((r) =>
//         rawRoomEntries[r.entryIndex].rooms.push(r.room),
//       );
//       doubleSingles[gender].forEach((r) =>
//         rawRoomEntries[r.entryIndex].rooms.push(r.room),
//       );
//     });

//     // === Final Grouping by Mobile ===
//     const mobileMap = new Map();
//     rawRoomEntries.forEach((entry) => {
//       const mobile = entry.contactMobile || "0000000000";
//       if (!mobileMap.has(mobile)) {
//         mobileMap.set(mobile, {
//           contactMobile: mobile,
//           bookingIds: new Set(),
//           rooms: [],
//         });
//       }
//       const g = mobileMap.get(mobile);
//       g.bookingIds.add(entry.bookingId);
//       g.rooms.push(...entry.rooms);
//     });


//     let globalRoomCounter = 1;

//     const groupedByMobile = Array.from(mobileMap.values())
//       .sort((a, b) => a.contactMobile.localeCompare(b.contactMobile)) // ✅ sort first
//       .map((g) => ({
//         contactMobile: g.contactMobile,
//         bookingIds: Array.from(g.bookingIds),
//         rooms: g.rooms.map((r) => ({ ...r, roomNumber: globalRoomCounter++ })),
//       }));
//     // ✅ removed .sort() from end

//     // === Check existing finalized allocation ===
//     const existing = await tourRoomAllocationModel.findOne({
//       tourId: objectTourId,
//     });
//     const manualGuests = existing?.manuallyAddedRooms?.guests || [];
//     const manualLeaders = existing?.manuallyAddedRooms?.leaders || [];

//     manualGuests.forEach(room => { room.roomNumber = globalRoomCounter++; });
//     manualLeaders.forEach(room => { room.roomNumber = globalRoomCounter++; });


//     if (existing && existing.isFinalized) {
//       const flat = existing.groupedByMobile.flatMap((g) =>
//         g.rooms.map((r) => ({
//           contactMobile: g.contactMobile,
//           bookingIds: g.bookingIds,
//           roomNumber: r.roomNumber,
//           sharingType: r.sharingType,
//           occupants: r.occupants.map((o) => ({
//             firstName: o.firstName,
//             lastName: o.lastName,
//             gender: o.gender,
//           })),
//         })),
//       );

//       return res.json({
//         tourId,
//         unpaidGuests,
//         roomAllocations: flat,
//         groupedByMobile: existing.groupedByMobile,
//         totalRooms: flat.length,
//         totalGroups: existing.groupedByMobile.length,
//         saved: false,
//         message: "Finalized allocation displayed with updated unpaid guests.",
//       });
//     }

//     // === Save new allocation ===
//     await tourRoomAllocationModel.findOneAndUpdate(
//       { tourId: objectTourId },
//       {
//         tourId: objectTourId,
//         groupedByMobile,
//         "manuallyAddedRooms.guests": manualGuests,
//         "manuallyAddedRooms.leaders": manualLeaders,
//         grouped: true,
//         isFinalized: false,
//       },
//       { upsert: true, new: true },
//     );



//     const responseRooms = groupedByMobile.flatMap((g) =>
//       g.rooms.map((r) => ({
//         contactMobile: g.contactMobile,
//         bookingIds: g.bookingIds,
//         roomNumber: r.roomNumber,
//         sharingType: r.sharingType,
//         occupants: r.occupants.map((o) => ({
//           firstName: o.firstName,
//           lastName: o.lastName,
//           gender: o.gender,
//         })),
//       })),
//     );

//     res.json({
//       tourId,
//       unpaidGuests,
//       roomAllocations: responseRooms,
//       groupedByMobile,
//       totalRooms: responseRooms.length,
//       totalGroups: groupedByMobile.length,
//       saved: true,
//       message:
//         "Room allotment completed successfully (travellers in original order).",
//     });
//   } catch (error) {
//     console.error("Room allotment error:", error);
//     res.status(500).json({ error: error.message || "Internal server error" });
//   }
// };



// // === Helper Functions ===
// const getBasicTravelerInfo = (t) => ({
//   title: t.title,
//   firstName: t.firstName,
//   lastName: t.lastName,
//   age: t.age,
//   gender: t.gender,
//   sharingType: t.sharingType,
// });

// const getSharingTypeFromSize = (size) => {
//   if (size === 1) return "single";
//   if (size === 2) return "double";
//   if (size === 3) return "triple";
//   return "quad";
// };



// const assignRoomNumbers = (rooms) =>
//   rooms.map((r, i) => ({ ...r, roomNumber: i + 1 }));


// // ==================== VIEW BOTH ROOMS (GUESTS FIRST) ====================
// const getManualRooms = async (req, res) => {
//   try {
//     const { tourId } = req.params;

//     if (!tourId || !mongoose.Types.ObjectId.isValid(tourId)) {
//       return res.status(400).json({ error: "Valid tourId is required" });
//     }

//     const objectTourId = new mongoose.Types.ObjectId(tourId);

//     const allocation = await tourRoomAllocationModel.findOne({
//       tourId: objectTourId,
//     }).lean();

//     if (!allocation) {
//       return res.json({
//         success: true,
//         leaders: [],
//         guests: [],
//         allManualRooms: [],
//         totalManualRooms: 0,
//         message: "No manual rooms found.",
//       });
//     }

//     const leaders = allocation.manuallyAddedRooms?.leaders || [];
//     const guests = allocation.manuallyAddedRooms?.guests || [];

//     // ✅ Guests First, Leaders Last
//     const allManualRooms = [...guests, ...leaders];

//     res.json({
//       success: true,
//       leaders,
//       guests,
//       allManualRooms,           // Guests first → Leaders last
//       totalManualRooms: allManualRooms.length,
//       totalLeaders: leaders.length,
//       totalGuests: guests.length,
//       message: "Manual rooms fetched successfully.",
//     });

//   } catch (error) {
//     console.error("Get Manual Rooms Error:", error);
//     res.status(500).json({ error: error.message || "Internal server error" });
//   }
// };

// const addGuestRoom = async (req, res) => {
//   try {
//     const { tourId } = req.params;
//     const { sharingType, mobile, occupants } = req.body;

//     if (!tourId || !mongoose.Types.ObjectId.isValid(tourId)) {
//       return res.status(400).json({ error: "Valid tourId is required" });
//     }

//     if (!sharingType || !mobile || !occupants || !Array.isArray(occupants) || occupants.length === 0) {
//       return res.status(400).json({ error: "sharingType, mobile, occupants are required" });
//     }

//     const objectTourId = new mongoose.Types.ObjectId(tourId);

//     // Auto Calculate Next Room Number
//     const existing = await tourRoomAllocationModel.findOne({ tourId: objectTourId });

//     let nextRoomNumber = 1;
//     if (existing) {
//       const systemCount = existing.groupedByMobile?.reduce((acc, group) => acc + (group.rooms?.length || 0), 0) || 0;
//       const leaderCount = existing.manuallyAddedRooms?.leaders?.length || 0;
//       const guestCount = existing.manuallyAddedRooms?.guests?.length || 0;
//       nextRoomNumber = systemCount + leaderCount + guestCount + 1;
//     }

//     // Capacity Validation
//     const occupantCount = occupants.length;
//     const maxCapacity = sharingType === "single" ? 1 : sharingType === "double" ? 2 : sharingType === "triple" ? 3 : 4;

//     if (occupantCount > maxCapacity || occupantCount === 0) {
//       return res.status(400).json({ error: `Invalid occupant count for ${sharingType} room.` });
//     }

//     const newRoom = {
//       roomNumber: nextRoomNumber,
//       sharingType: sharingType.toLowerCase(),
//       mobile: mobile.trim(),
//       occupants,
//       type: "guest",
//       addedAt: new Date()
//     };

//     const updatedDoc = await tourRoomAllocationModel.findOneAndUpdate(
//       { tourId: objectTourId },
//       {
//         $push: { "manuallyAddedRooms.guests": newRoom },
//         $setOnInsert: {
//           tourId: objectTourId,
//           groupedByMobile: [],
//           bookings: [],
//           grouped: true,
//           isFinalized: false
//         }
//       },
//       { upsert: true, new: true, runValidators: true }
//     );

//     res.status(201).json({
//       success: true,
//       message: `Guest Room added successfully as Room ${nextRoomNumber}`,
//       room: newRoom,
//       totalGuestRooms: updatedDoc.manuallyAddedRooms?.guests?.length || 0
//     });

//   } catch (error) {
//     console.error("Add Guest Room Error:", error);
//     res.status(500).json({ error: error.message || "Internal server error" });
//   }
// };

// // ==================== ADD LEADER ROOM ====================
// const addLeaderRoom = async (req, res) => {
//   try {
//     const { tourId } = req.params;
//     const { sharingType, mobile, occupants } = req.body;

//     if (!tourId || !mongoose.Types.ObjectId.isValid(tourId)) {
//       return res.status(400).json({ error: "Valid tourId is required" });
//     }

//     if (!sharingType || !mobile || !occupants || !Array.isArray(occupants) || occupants.length === 0) {
//       return res.status(400).json({ error: "sharingType, mobile, occupants are required" });
//     }

//     const objectTourId = new mongoose.Types.ObjectId(tourId);

//     // Auto Calculate Next Room Number
//     const existing = await tourRoomAllocationModel.findOne({ tourId: objectTourId });

//     let nextRoomNumber = 1;
//     if (existing) {
//       const systemCount = existing.groupedByMobile?.reduce((acc, group) => acc + (group.rooms?.length || 0), 0) || 0;
//       const leaderCount = existing.manuallyAddedRooms?.leaders?.length || 0;
//       const guestCount = existing.manuallyAddedRooms?.guests?.length || 0;
//       nextRoomNumber = systemCount + leaderCount + guestCount + 1;
//     }

//     const occupantCount = occupants.length;
//     const maxCapacity = sharingType === "single" ? 1 : sharingType === "double" ? 2 : sharingType === "triple" ? 3 : 4;

//     if (occupantCount > maxCapacity || occupantCount === 0) {
//       return res.status(400).json({ error: `Invalid occupant count for ${sharingType} room.` });
//     }

//     const newRoom = {
//       roomNumber: nextRoomNumber,
//       sharingType: sharingType.toLowerCase(),
//       mobile: mobile.trim(),
//       occupants,
//       type: "leader",
//       addedAt: new Date()
//     };

//     const updatedDoc = await tourRoomAllocationModel.findOneAndUpdate(
//       { tourId: objectTourId },
//       {
//         $push: { "manuallyAddedRooms.leaders": newRoom },
//         $setOnInsert: {
//           tourId: objectTourId,
//           groupedByMobile: [],
//           bookings: [],
//           grouped: true,
//           isFinalized: false
//         }
//       },
//       { upsert: true, new: true, runValidators: true }
//     );

//     res.status(201).json({
//       success: true,
//       message: `Leader Room added successfully as Room ${nextRoomNumber}`,
//       room: newRoom,
//       totalLeaderRooms: updatedDoc.manuallyAddedRooms?.leaders?.length || 0
//     });

//   } catch (error) {
//     console.error("Add Leader Room Error:", error);
//     res.status(500).json({ error: error.message || "Internal server error" });
//   }
// };


// const deleteLeaderRoom = async (req, res) => {
//   try {
//     const { tourId, roomId } = req.params;

//     if (!tourId || !mongoose.Types.ObjectId.isValid(tourId)) {
//       return res.status(400).json({ error: "Valid tourId is required" });
//     }

//     if (!roomId) {
//       return res.status(400).json({ error: "roomId is required" });
//     }

//     const objectTourId = new mongoose.Types.ObjectId(tourId);

//     const updatedDoc = await tourRoomAllocationModel.findOneAndUpdate(
//       { tourId: objectTourId },
//       {
//         $pull: {
//           "manuallyAddedRooms.leaders": { _id: new mongoose.Types.ObjectId(roomId) }
//         }
//       },
//       { new: true }
//     );

//     if (!updatedDoc) {
//       return res.status(404).json({ error: "Tour allocation not found" });
//     }

//     res.status(200).json({
//       success: true,
//       message: `Leader Room deleted successfully`,
//       totalLeaderRooms: updatedDoc.manuallyAddedRooms?.leaders?.length || 0
//     });

//   } catch (error) {
//     console.error("Delete Leader Room Error:", error);
//     res.status(500).json({ error: error.message || "Internal server error" });
//   }
// };


// const getToursByYear = async (req, res) => {
//   try {
//     const { year } = req.params;

//     let query = {};

//     // Handle "all" case
//     if (year !== "all") {
//       if (!year || isNaN(year) || year.length !== 4) {
//         return res.status(400).json({
//           success: false,
//           message: "Please provide a valid 4-digit year or 'all'",
//         });
//       }

//       const yearNum = parseInt(year);
//       const start = new Date(`${yearNum}-01-01T00:00:00.000Z`);
//       const end = new Date(`${yearNum}-12-31T23:59:59.999Z`);

//       query = {
//         $or: [
//           { lastBookingDate: { $gte: start, $lte: end } },
//           {
//             lastBookingDate: { $exists: false },
//             batch: { $regex: yearNum.toString(), $options: "i" },
//           },
//         ],
//       };
//     }

//     // Fetch tours
//     const allTours = await tourModel
//       .find(query)
//       .sort({ lastBookingDate: -1, createdAt: -1 })
//       .lean();

//     // Split into available & sold out
//     const availableTours = allTours.filter((t) => t.available === true);
//     const soldOutTours = allTours.filter((t) => t.available === false);

//     res.json({
//       success: true,
//       requestedYear: year === "all" ? "All Years" : parseInt(year),
//       totalTours: allTours.length,
//       availableCount: availableTours.length,
//       soldOutCount: soldOutTours.length,
//       availableTours, // Available always come first
//       soldOutTours, // Sold out come after
//     });
//   } catch (error) {
//     console.error("Error in getToursByYear:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while fetching tours",
//       error: error.message,
//     });
//   }
// };

// const getAvailableTourYears = async (req, res) => {
//   try {
//     // Primary: years from lastBookingDate
//     const yearsFromDate = await tourModel.aggregate([
//       {
//         $group: {
//           _id: { $year: "$lastBookingDate" },
//         },
//       },
//       { $match: { _id: { $ne: null } } },
//       { $sort: { _id: -1 } }, // Newest first
//     ]);

//     let yearList = yearsFromDate.map((item) => item._id);

//     // Fallback: extract from batch if no dates found
//     if (yearList.length === 0) {
//       const batchYears = await tourModel.distinct("batch");
//       yearList = [
//         ...new Set(
//           batchYears.map((b) => b?.match(/\d{4}/)?.[0]).filter(Boolean),
//         ),
//       ].sort((a, b) => b - a);
//     }

//     res.json({
//       success: true,
//       count: yearList.length,
//       years: yearList, // e.g. [2026, 2025, 2024, ...]
//     });
//   } catch (error) {
//     console.error("Error in getAvailableTourYears:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch available years",
//       error: error.message,
//     });
//   }
// };

// // Get ALL bookings (no tourId filter)
// const getAllBookings = async (req, res) => {
//   try {
//     console.log("Logged-in tour operator ID:", req.tourOperator?._id); // ← add this
//     const bookings = await tourBookingModel
//       .find({})
//       .populate({
//         path: "userId",
//         select: "name email mobile", // Only needed user fields
//       })
//       .populate({
//         path: "tourId",
//         select: "title destination startDate endDate available", // Tour details
//       })
//       .sort({ bookingDate: -1 }) // Latest bookings first
//       .lean(); // Better performance for large data
//     console.log("Total bookings found in DB:", bookings.length); // ← add this

//     if (!bookings || bookings.length === 0) {
//       return res.status(200).json({
//         success: true,
//         message: "No bookings found in the system.",
//         total: 0,
//         bookings: [],
//       });
//     }

//     // Optional: Add quick stats
//     const totalBookings = bookings.length;
//     const totalEarnings = bookings.reduce((sum, b) => {
//       let earnings = 0;
//       if (b.payment?.advance?.paid) earnings += b.payment.advance.amount || 0;
//       if (b.payment?.balance?.paid) earnings += b.payment.balance.amount || 0;
//       return sum + earnings;
//     }, 0);

//     const completedBookings = bookings.filter(
//       (b) => b.isBookingCompleted,
//     ).length;
//     const pendingBookings = totalBookings - completedBookings;

//     res.status(200).json({
//       success: true,
//       totalBookings,
//       totalEarnings,
//       completedBookings,
//       pendingBookings,
//       bookings,
//     });
//   } catch (error) {
//     console.error("Error in getAllBookings:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch all bookings",
//       error: error.message,
//     });
//   }
// };

// // Mark cancellation receipt as generated/sent
// const taskMarkCancellationReceipt = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { tnr } = req.body;

//     if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid 6-character TNR is required",
//       });
//     }

//     const normalizedTnr = tnr.trim().toUpperCase();

//     const updatedBooking = await tourBookingModel.updateOne(
//       { tnr: normalizedTnr },
//       { $set: { cancellationReceipt: false } },
//       { session, new: true },
//     );

//     if (updatedBooking.matchedCount === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found with this TNR",
//       });
//     }

//     await session.commitTransaction();

//     return res.status(200).json({
//       success: true,
//       message: "Cancellation receipt marked successfully",
//       data: {
//         tnr: normalizedTnr,
//         cancellationReceipt: false,
//       },
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     console.error("taskMarkCancellationReceipt error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message,
//     });
//   } finally {
//     session.endSession();
//   }
// };

// const taskMarkManageBookingReceipt = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { tnr } = req.body;

//     if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid 6-character TNR is required",
//       });
//     }

//     const normalizedTnr = tnr.trim().toUpperCase();

//     const updatedBooking = await tourBookingModel.updateOne(
//       { tnr: normalizedTnr },
//       { $set: { manageBookingReceipt: false } },
//       { session, new: true },
//     );

//     if (updatedBooking.matchedCount === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found with this TNR",
//       });
//     }

//     await session.commitTransaction();

//     return res.status(200).json({
//       success: true,
//       message: "Manage booking receipt marked successfully",
//       data: {
//         tnr: normalizedTnr,
//         manageBookingReceipt: false,
//       },
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     console.error("taskMarkManageBookingReceipt error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message,
//     });
//   } finally {
//     session.endSession();
//   }
// };
// const createTourVehicle = async (req, res) => {
//   try {
//     const { tourId } = req.params;
//     const {
//       vehicleName,
//       registrationNumber,
//       leaderRow = [], // frontend sends dynamic array
//       passengerRows = [],
//       allowSeatSelection = false,
//     } = req.body;

//     if (!vehicleName?.trim()) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Vehicle name is required" });
//     }

//     // Validate leaderRow only if provided
//     if (leaderRow.length > 0) {
//       if (
//         !Array.isArray(leaderRow) ||
//         leaderRow.length < 1 ||
//         leaderRow.length > 5
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: "leaderRow must have between 1 and 5 seats (or omit it)",
//         });
//       }
//       if (
//         !leaderRow.every((s) => typeof s === "string" && s.startsWith("LS"))
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: "Each leader seat label must start with 'LS'",
//         });
//       }
//     }

//     const vehicleData = {
//       tourId,
//       vehicleName: vehicleName.trim(),
//       registrationNumber: registrationNumber?.trim() || undefined,
//       leaderRow: leaderRow.length > 0 ? leaderRow : undefined, // let pre-save hook handle default
//       passengerRows,
//       allowSeatSelection,
//     };

//     const vehicle = new TourVehicle(vehicleData);
//     await vehicle.save();

//     // Return full object including virtual seatLayout
//     return res.status(201).json({
//       success: true,
//       message: "Tour vehicle created",
//       vehicle: vehicle.toObject({ virtuals: true }), // includes seatLayout
//     });
//   } catch (err) {
//     console.error(err);
//     if (err.name === "ValidationError") {
//       return res.status(400).json({ success: false, message: err.message });
//     }
//     return res
//       .status(500)
//       .json({ success: false, message: "Server error", error: err.message });
//   }
// };
// const updateTourVehicle = async (req, res) => {
//   try {
//     const { tourId, vehicleId } = req.params;

//     if (
//       !mongoose.Types.ObjectId.isValid(vehicleId) ||
//       !mongoose.Types.ObjectId.isValid(tourId)
//     ) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid ID format" });
//     }

//     const updateData = {};

//     if (req.body.vehicleName?.trim()) {
//       updateData.vehicleName = req.body.vehicleName.trim();
//     }
//     if (req.body.registrationNumber !== undefined) {
//       updateData.registrationNumber =
//         req.body.registrationNumber?.trim() || null;
//     }
//     if (req.body.leaderRow) {
//       if (
//         !Array.isArray(req.body.leaderRow) ||
//         req.body.leaderRow.length < 1 ||
//         req.body.leaderRow.length > 5
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: "leaderRow must have between 1 and 5 seats",
//         });
//       }
//       if (
//         !req.body.leaderRow.every(
//           (s) => typeof s === "string" && s.startsWith("LS"),
//         )
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: "Each leader seat label must start with 'LS'",
//         });
//       }
//       updateData.leaderRow = req.body.leaderRow;
//     }
//     if (req.body.passengerRows) {
//       if (
//         !Array.isArray(req.body.passengerRows) ||
//         req.body.passengerRows.length === 0
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: "passengerRows must be non-empty array",
//         });
//       }
//       updateData.passengerRows = req.body.passengerRows;

//       // ── Recalculate computed fields manually (pre-save doesn't run on findOneAndUpdate) ──
//       const passengerCount = updateData.passengerRows.length;
//       const seatsPerRow =
//         passengerCount > 0 ? updateData.passengerRows[0].length : 0;

//       updateData.seatsPerRow = seatsPerRow;
//       updateData.passengerRowCount = passengerCount;
//       updateData.totalSeats = seatsPerRow * passengerCount; // only C + D seats, LS excluded
//     }
//     if (typeof req.body.allowSeatSelection === "boolean") {
//       updateData.allowSeatSelection = req.body.allowSeatSelection;
//     }

//     if (Object.keys(updateData).length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No valid fields provided for update",
//       });
//     }

//     const updated = await TourVehicle.findOneAndUpdate(
//       { _id: vehicleId, tourId },
//       { $set: updateData },
//       { new: true, runValidators: true },
//     );

//     if (!updated) {
//       return res.status(404).json({
//         success: false,
//         message: "Vehicle not found or does not belong to this tour",
//       });
//     }

//     // Use toObject with virtuals — lean() strips them
//     return res.json({
//       success: true,
//       message: "Vehicle updated successfully",
//       vehicle: updated.toObject({ virtuals: true }),
//     });
//   } catch (err) {
//     console.error(err);
//     if (err.name === "ValidationError") {
//       return res.status(400).json({ success: false, message: err.message });
//     }
//     return res
//       .status(500)
//       .json({ success: false, message: "Server error", error: err.message });
//   }
// };

// const toggleVehicleSeatSelection = async (req, res) => {
//   try {
//     const { tourId, vehicleId } = req.params;
//     const { allowSeatSelection } = req.body;

//     if (typeof allowSeatSelection !== "boolean") {
//       return res.status(400).json({
//         success: false,
//         message: 'Field "allowSeatSelection" must be boolean',
//       });
//     }

//     const vehicle = await TourVehicle.findOneAndUpdate(
//       { _id: vehicleId, tourId },
//       { $set: { allowSeatSelection } },
//       { new: true, runValidators: true },
//     );

//     if (!vehicle) {
//       return res.status(404).json({
//         success: false,
//         message: "Vehicle not found or does not belong to this tour",
//       });
//     }

//     return res.json({
//       success: true,
//       message: `Seat selection ${allowSeatSelection ? "enabled" : "disabled"} successfully`,
//       vehicle,
//     });
//   } catch (err) {
//     console.error(err);
//     return res
//       .status(500)
//       .json({ success: false, message: "Server error", error: err.message });
//   }
// };

// const getTourVehicles = async (req, res) => {
//   try {
//     const { tourId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(tourId)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid tour ID" });
//     }

//     const vehicles = await TourVehicle.find({ tourId })
//       .select(
//         "vehicleName registrationNumber totalSeats leaderRow passengerRows passengerRowCount seatsPerRow allowSeatSelection bookedSeats createdAt",
//       )
//       .sort({ createdAt: 1 })
//       .lean();

//     const enriched = vehicles.map((v) => ({
//       ...v,
//       bookedSeatsCount: v.bookedSeats?.length || 0,
//       bookedSeatNumbers:
//         v.bookedSeats?.map((bs) => bs.seatNumber).filter(Boolean) || [], // ← This is what makes seat numbers visible
//     }));

//     return res.json({
//       success: true,
//       count: enriched.length,
//       vehicles: enriched,
//     });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// };
// const deleteTourVehicle = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { tourId, vehicleId } = req.params;

//     if (
//       !mongoose.Types.ObjectId.isValid(vehicleId) ||
//       !mongoose.Types.ObjectId.isValid(tourId)
//     ) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid ID format" });
//     }

//     // 1. Find the vehicle
//     const vehicle = await TourVehicle.findOne({
//       _id: vehicleId,
//       tourId,
//     }).session(session);

//     if (!vehicle) {
//       return res.status(404).json({
//         success: false,
//         message: "Vehicle not found or does not belong to this tour",
//       });
//     }

//     // 2. Optional: Warn/log if there are booked seats
//     const bookedCount = vehicle.bookedSeats?.length || 0;
//     if (bookedCount > 0) {
//       console.warn(
//         `Deleting vehicle ${vehicleId} with ${bookedCount} booked seats`,
//       );
//       // You can still proceed, or add force param later if needed
//     }

//     // 3. Collect all bookings that have seats on this vehicle
//     const bookingIds = vehicle.bookedSeats.map((bs) => bs.bookingId);

//     if (bookingIds.length > 0) {
//       // 4. Clear seat info from all affected bookings
//       await tourBookingModel.updateMany(
//         { _id: { $in: bookingIds } },
//         {
//           $set: {
//             "travellers.$[elem].seatNumber": null,
//             "travellers.$[elem].seatLocked": false,
//             "travellers.$[elem].seatLockedAt": null,
//           },
//         },
//         {
//           arrayFilters: [
//             {
//               "elem.seatNumber": {
//                 $in: vehicle.bookedSeats.map((bs) => bs.seatNumber),
//               },
//             },
//           ],
//           session,
//         },
//       );
//     }

//     // 5. Delete the vehicle
//     await TourVehicle.deleteOne({ _id: vehicleId, tourId }).session(session);

//     await session.commitTransaction();

//     return res.json({
//       success: true,
//       message: "Vehicle deleted successfully",
//       affectedBookings: bookingIds.length,
//       bookedSeatsCleared: bookedCount,
//     });
//   } catch (err) {
//     await session.abortTransaction();
//     console.error("deleteTourVehicle error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error during vehicle deletion",
//       error: err.message,
//     });
//   } finally {
//     session.endSession();
//   }
// };
// // const addTour = async (req, res) => {
// //   try {
// //     const {
// //       title,
// //       batch,
// //       duration,
// //       price,
// //       destination,
// //       sightseeing,
// //       itinerary,
// //       includes,
// //       excludes,
// //       trainDetails,
// //       flightDetails,
// //       lastBookingDate,
// //       completedTripsCount,
// //       available,
// //       advanceAmount,
// //       addons,
// //       remarks,
// //       boardingPoints,
// //       deboardingPoints,
// //       variantPackage,
// //       gst,
// //     } = req.body;

// //     // Image handling
// //     const files = req.files || {};
// //     const titleImage = files.titleImage?.[0];
// //     const mapImage = files.mapImage?.[0];
// //     const galleryImages = files.galleryImages || [];

// //     // Validate required fields
// //     if (
// //       !title ||
// //       !batch ||
// //       !duration ||
// //       !price ||
// //       !destination ||
// //       !sightseeing ||
// //       !itinerary ||
// //       !includes ||
// //       !excludes ||
// //       !titleImage ||
// //       !mapImage ||
// //       galleryImages.length === 0 ||
// //       !lastBookingDate ||
// //       !advanceAmount ||
// //       !boardingPoints ||
// //       !deboardingPoints
// //     ) {
// //       return res.json({
// //         success: false,
// //         message: "Missing required tour details",
// //       });
// //     }

// //     // Image upload function
// //     const uploadImage = async (file) => {
// //       const result = await cloudinary.uploader.upload(file.path, {
// //         resource_type: "image",
// //       });
// //       return result.secure_url;
// //     };

// //     // Upload images
// //     const titleImageUrl = await uploadImage(titleImage);
// //     const mapImageUrl = await uploadImage(mapImage);
// //     const galleryImageUrls = await Promise.all(
// //       galleryImages.map((img) => uploadImage(img)),
// //     );

// //     // Parse and validate fields
// //     let parsedDuration, parsedPrice, parsedAdvance;
// //     try {
// //       parsedDuration = JSON.parse(duration);
// //       parsedPrice = JSON.parse(price);
// //       parsedAdvance = JSON.parse(advanceAmount);
// //     } catch {
// //       return res.json({
// //         success: false,
// //         message: "Invalid JSON format for duration, price, or advanceAmount",
// //       });
// //     }

// //     // Validate main tour price and advance amounts
// //     const doubleSharing = Number(parsedPrice.doubleSharing);
// //     const tripleSharing = Number(parsedPrice.tripleSharing);
// //     const childWithBerth = Number(parsedPrice.childWithBerth) || 0;
// //     const childWithoutBerth = Number(parsedPrice.childWithoutBerth) || 0;
// //     const advanceAdult = Number(parsedAdvance.adult) || 0;
// //     const advanceChild = Number(parsedAdvance.child) || 0;

// //     if (
// //       isNaN(doubleSharing) ||
// //       isNaN(tripleSharing) ||
// //       isNaN(advanceAdult) ||
// //       isNaN(advanceChild)
// //     ) {
// //       return res.json({
// //         success: false,
// //         message: "Invalid number in price or advance amount",
// //       });
// //     }

// //     const parsedGst = gst !== undefined && gst !== "" ? Number(gst) : 0;
// //     if (isNaN(parsedGst) || parsedGst < 0) {
// //       return res.json({
// //         success: false,
// //         message: "Invalid GST value",
// //       });
// //     }

// //     // Calculate balances for main tour

// //     // Calculate balances for main tour
// //     const balanceDouble = doubleSharing - advanceAdult;
// //     const balanceTriple = tripleSharing - advanceAdult;
// //     const balanceChildWithBerth =
// //       childWithBerth > 0 ? childWithBerth - advanceChild : null;
// //     const balanceChildWithoutBerth =
// //       childWithoutBerth > 0 ? childWithoutBerth - advanceChild : null;

// //     // Parse arrays safely
// //     const parseArrayField = (field, fieldName) => {
// //       try {
// //         const parsed = JSON.parse(field);
// //         if (!Array.isArray(parsed)) {
// //           throw new Error(`Invalid format for ${fieldName}`);
// //         }
// //         return parsed;
// //       } catch {
// //         throw new Error(`Invalid format for ${fieldName}`);
// //       }
// //     };

// //     // Parse addons
// //     let parsedAddons = [];
// //     if (addons) {
// //       try {
// //         const temp = JSON.parse(addons);
// //         if (Array.isArray(temp)) {
// //           parsedAddons = temp.map((a) => ({
// //             name: a.name || "",
// //             amount: Number(a.amount) || 0,
// //           }));
// //         }
// //       } catch {
// //         return res.json({
// //           success: false,
// //           message: "Invalid format for addons",
// //         });
// //       }
// //     }

// //     // Parse boarding and deboarding points
// //     let parsedBoardingPoints = [];
// //     let parsedDeboardingPoints = [];
// //     try {
// //       parsedBoardingPoints = parseArrayField(
// //         boardingPoints,
// //         "boardingPoints",
// //       ).map((b) => ({
// //         stationCode: b.stationCode || "",
// //         stationName: b.stationName || "",
// //       }));
// //       parsedDeboardingPoints = parseArrayField(
// //         deboardingPoints,
// //         "deboardingPoints",
// //       ).map((b) => ({
// //         stationCode: b.stationCode || "",
// //         stationName: b.stationName || "",
// //       }));
// //     } catch (error) {
// //       return res.json({
// //         success: false,
// //         message: error.message,
// //       });
// //     }

// //     // Parse variantPackage
// //     let parsedVariants = [];
// //     if (variantPackage) {
// //       try {
// //         const temp = JSON.parse(variantPackage);
// //         if (Array.isArray(temp)) {
// //           parsedVariants = temp.map((v) => {
// //             const vpPrice = v.price || {};
// //             const vpAdvance = v.advanceAmount || {};
// //             const vpDuration = v.duration || {};

// //             const vpDouble = Number(vpPrice.doubleSharing) || 0;
// //             const vpTriple = Number(vpPrice.tripleSharing) || 0;
// //             const vpChildWithBerth = Number(vpPrice.childWithBerth) || 0;
// //             const vpChildWithoutBerth = Number(vpPrice.childWithoutBerth) || 0;
// //             const vpAdvanceAdult = Number(vpAdvance.adult) || 0;
// //             const vpAdvanceChild = Number(vpAdvance.child) || 0;

// //             return {
// //               duration: {
// //                 days: Number(vpDuration.days) || 0,
// //                 nights: Number(vpDuration.nights) || 0,
// //               },
// //               price: {
// //                 doubleSharing: vpDouble,
// //                 tripleSharing: vpTriple,
// //                 childWithBerth: vpChildWithBerth,
// //                 childWithoutBerth: vpChildWithoutBerth,
// //               },
// //               advanceAmount: {
// //                 adult: vpAdvanceAdult,
// //                 child: vpAdvanceChild,
// //               },
// //               balanceDouble: vpDouble - vpAdvanceAdult,
// //               balanceTriple: vpTriple - vpAdvanceAdult,
// //               balanceChildWithBerth:
// //                 vpChildWithBerth > 0 ? vpChildWithBerth - vpAdvanceChild : null,
// //               balanceChildWithoutBerth:
// //                 vpChildWithoutBerth > 0
// //                   ? vpChildWithoutBerth - vpAdvanceChild
// //                   : null,
// //               destination: Array.isArray(v.destination) ? v.destination : [],
// //               sightseeing: Array.isArray(v.sightseeing) ? v.sightseeing : [],
// //               itinerary: Array.isArray(v.itinerary) ? v.itinerary : [],
// //               includes: Array.isArray(v.includes) ? v.includes : [],
// //               excludes: Array.isArray(v.excludes) ? v.excludes : [],
// //               trainDetails: Array.isArray(v.trainDetails)
// //                 ? v.trainDetails.map((t) => ({
// //                   trainNo: t.trainNo || "",
// //                   trainName: t.trainName || "",
// //                   fromCode: t.fromCode || "",
// //                   fromStation: t.fromStation || "",
// //                   toCode: t.toCode || "",
// //                   toStation: t.toStation || "",
// //                   class: t.class || "",
// //                   departureTime: t.departureTime || "",
// //                   arrivalTime: t.arrivalTime || "",
// //                   ticketOpenDate: t.ticketOpenDate
// //                     ? new Date(t.ticketOpenDate)
// //                     : null,
// //                 }))
// //                 : [],
// //               flightDetails: Array.isArray(v.flightDetails)
// //                 ? v.flightDetails.map((f) => ({
// //                   airline: f.airline || "",
// //                   flightNo: f.flightNo || "",
// //                   fromCode: f.fromCode || "",
// //                   fromAirport: f.fromAirport || "",
// //                   toCode: f.toCode || "",
// //                   toAirport: f.toAirport || "",
// //                   class: f.class || "",
// //                   departureTime: f.departureTime || "",
// //                   arrivalTime: f.arrivalTime || "",
// //                 }))
// //                 : [],
// //               addons: Array.isArray(v.addons)
// //                 ? v.addons.map((a) => ({
// //                   name: a.name || "",
// //                   amount: Number(a.amount) || 0,
// //                 }))
// //                 : [],
// //               remarks: v.remarks || "",
// //               boardingPoints: Array.isArray(v.boardingPoints)
// //                 ? v.boardingPoints.map((b) => ({
// //                   stationCode: b.stationCode || "",
// //                   stationName: b.stationName || "",
// //                 }))
// //                 : [],
// //               deboardingPoints: Array.isArray(v.deboardingPoints)
// //                 ? v.deboardingPoints.map((b) => ({
// //                   stationCode: b.stationCode || "",
// //                   stationName: b.stationName || "",
// //                 }))
// //                 : [],
// //               lastBookingDate: v.lastBookingDate
// //                 ? new Date(v.lastBookingDate)
// //                 : null,
// //             };
// //           });
// //         }
// //       } catch {
// //         return res.json({
// //           success: false,
// //           message: "Invalid format for variantPackage",
// //         });
// //       }
// //     }

// //     // Create tour data object
// //     const tourData = {
// //       title,
// //       batch,
// //       duration: {
// //         days: Number(parsedDuration.days) || 0,
// //         nights: Number(parsedDuration.nights) || 0,
// //       },
// //       price: {
// //         doubleSharing,
// //         tripleSharing,
// //         childWithBerth,
// //         childWithoutBerth,
// //       },
// //       gst: parsedGst,
// //       advanceAmount: {
// //         adult: advanceAdult,
// //         child: advanceChild,
// //       },
// //       balanceDouble,
// //       balanceTriple,
// //       balanceChildWithBerth,
// //       balanceChildWithoutBerth,
// //       destination: parseArrayField(destination, "destination"),
// //       sightseeing: parseArrayField(sightseeing, "sightseeing"),
// //       itinerary: parseArrayField(itinerary, "itinerary"),
// //       includes: parseArrayField(includes, "includes"),
// //       excludes: parseArrayField(excludes, "excludes"),
// //       trainDetails: trainDetails
// //         ? parseArrayField(trainDetails, "trainDetails").map((t) => ({
// //           trainNo: t.trainNo || "",
// //           trainName: t.trainName || "",
// //           fromCode: t.fromCode || "",
// //           fromStation: t.fromStation || "",
// //           toCode: t.toCode || "",
// //           toStation: t.toStation || "",
// //           class: t.class || "",
// //           departureTime: t.departureTime || "",
// //           arrivalTime: t.arrivalTime || "",
// //           ticketOpenDate: t.ticketOpenDate
// //             ? new Date(t.ticketOpenDate)
// //             : null,
// //         }))
// //         : [],
// //       flightDetails: flightDetails
// //         ? parseArrayField(flightDetails, "flightDetails").map((f) => ({
// //           airline: f.airline || "",
// //           flightNo: f.flightNo || "",
// //           fromCode: f.fromCode || "",
// //           fromAirport: f.fromAirport || "",
// //           toCode: f.toCode || "",
// //           toAirport: f.toAirport || "",
// //           class: f.class || "",
// //           departureTime: f.departureTime || "",
// //           arrivalTime: f.arrivalTime || "",
// //         }))
// //         : [],
// //       addons: parsedAddons,
// //       remarks: remarks || "",
// //       boardingPoints: parsedBoardingPoints,
// //       deboardingPoints: parsedDeboardingPoints,
// //       titleImage: titleImageUrl,
// //       mapImage: mapImageUrl,
// //       galleryImages: galleryImageUrls,
// //       lastBookingDate: new Date(lastBookingDate),
// //       completedTripsCount: Number(completedTripsCount) || 0,
// //       available: available ?? true,
// //       variantPackage: parsedVariants,
// //     };

// //     // Save tour to database
// //     const newTour = new tourModel(tourData);
// //     await newTour.save();

// //     res.json({
// //       success: true,
// //       message: "Tour added successfully",
// //       data: newTour,
// //     });
// //   } catch (error) {
// //     console.error(error);
// //     res.json({ success: false, message: error.message });
// //   }
// // };


// const addTour = async (req, res) => {
//   try {
//     const {
//       title,
//       batch,
//       duration,
//       price,
//       destination,
//       sightseeing,
//       itinerary,
//       includes,
//       excludes,
//       trainDetails,
//       flightDetails,
//       lastBookingDate,
//       completedTripsCount,
//       available,
//       advanceAmount,
//       addons,
//       remarks,
//       boardingPoints,
//       deboardingPoints,
//       variantPackage,
//       gst,
//     } = req.body;

//     // Image handling
//     const files = req.files || {};
//     const titleImage = files.titleImage?.[0];
//     const mapImage = files.mapImage?.[0];
//     const galleryImages = files.galleryImages || [];

//     // Validate required fields
//     if (
//       !title ||
//       !batch ||
//       !duration ||
//       !price ||
//       !destination ||
//       !sightseeing ||
//       !itinerary ||
//       !includes ||
//       !excludes ||
//       !titleImage ||
//       !mapImage ||
//       galleryImages.length === 0 ||
//       !lastBookingDate ||
//       !advanceAmount ||
//       !boardingPoints ||
//       !deboardingPoints
//     ) {
//       return res.json({
//         success: false,
//         message: "Missing required tour details",
//       });
//     }

//     // Image upload function
//     const uploadImage = async (file) => {
//       const result = await cloudinary.uploader.upload(file.path, {
//         resource_type: "image",
//       });
//       return result.secure_url;
//     };

//     // Upload images
//     const titleImageUrl = await uploadImage(titleImage);
//     const mapImageUrl = await uploadImage(mapImage);
//     const galleryImageUrls = await Promise.all(
//       galleryImages.map((img) => uploadImage(img)),
//     );

//     // Parse and validate fields
//     let parsedDuration, parsedPrice, parsedAdvance;
//     try {
//       parsedDuration = JSON.parse(duration);
//       parsedPrice = JSON.parse(price);
//       parsedAdvance = JSON.parse(advanceAmount);
//     } catch {
//       return res.json({
//         success: false,
//         message: "Invalid JSON format for duration, price, or advanceAmount",
//       });
//     }

//     // Validate main tour price and advance amounts
//     const doubleSharing = Number(parsedPrice.doubleSharing);
//     const tripleSharing = Number(parsedPrice.tripleSharing);
//     const childWithBerth = Number(parsedPrice.childWithBerth) || 0;
//     const childWithoutBerth = Number(parsedPrice.childWithoutBerth) || 0;
//     const advanceAdult = Number(parsedAdvance.adult) || 0;
//     const advanceChild = Number(parsedAdvance.child) || 0;

//     if (
//       isNaN(doubleSharing) ||
//       isNaN(tripleSharing) ||
//       isNaN(advanceAdult) ||
//       isNaN(advanceChild)
//     ) {
//       return res.json({
//         success: false,
//         message: "Invalid number in price or advance amount",
//       });
//     }

//     const parsedGst = gst !== undefined && gst !== "" ? Number(gst) : 0;
//     if (isNaN(parsedGst) || parsedGst < 0) {
//       return res.json({
//         success: false,
//         message: "Invalid GST value",
//       });
//     }

//     // Calculate balances for main tour
//     const balanceDouble = doubleSharing - advanceAdult;
//     const balanceTriple = tripleSharing - advanceAdult;
//     const balanceChildWithBerth =
//       childWithBerth > 0 ? childWithBerth - advanceChild : null;
//     const balanceChildWithoutBerth =
//       childWithoutBerth > 0 ? childWithoutBerth - advanceChild : null;

//     // Parse arrays safely
//     const parseArrayField = (field, fieldName) => {
//       try {
//         const parsed = JSON.parse(field);
//         if (!Array.isArray(parsed)) {
//           throw new Error(`Invalid format for ${fieldName}`);
//         }
//         return parsed;
//       } catch {
//         throw new Error(`Invalid format for ${fieldName}`);
//       }
//     };

//     // Parse addons (old flat list)
//     let parsedAddons = [];
//     if (addons) {
//       try {
//         const temp = JSON.parse(addons);
//         if (Array.isArray(temp)) {
//           parsedAddons = temp.map((a) => ({
//             name: a.name || "",
//             amount: Number(a.amount) || 0,
//           }));
//         }
//       } catch {
//         return res.json({
//           success: false,
//           message: "Invalid format for addons",
//         });
//       }
//     }

//     // ── NEW: helper to parse train/flight addons sub-array ──
//     const parseAddonsArray = (arr) => {
//       if (!Array.isArray(arr)) return [];
//       return arr.map((a) => ({
//         name: a.name || "",
//         amount: Number(a.amount) || 0,
//       }));
//     };

//     // Parse boarding and deboarding points
//     let parsedBoardingPoints = [];
//     let parsedDeboardingPoints = [];
//     try {
//       parsedBoardingPoints = parseArrayField(
//         boardingPoints,
//         "boardingPoints",
//       ).map((b) => ({
//         stationCode: b.stationCode || "",
//         stationName: b.stationName || "",
//       }));
//       parsedDeboardingPoints = parseArrayField(
//         deboardingPoints,
//         "deboardingPoints",
//       ).map((b) => ({
//         stationCode: b.stationCode || "",
//         stationName: b.stationName || "",
//       }));
//     } catch (error) {
//       return res.json({
//         success: false,
//         message: error.message,
//       });
//     }

//     // Parse variantPackage
//     let parsedVariants = [];
//     if (variantPackage) {
//       try {
//         const temp = JSON.parse(variantPackage);
//         if (Array.isArray(temp)) {
//           parsedVariants = temp.map((v) => {
//             const vpPrice = v.price || {};
//             const vpAdvance = v.advanceAmount || {};
//             const vpDuration = v.duration || {};

//             const vpDouble = Number(vpPrice.doubleSharing) || 0;
//             const vpTriple = Number(vpPrice.tripleSharing) || 0;
//             const vpChildWithBerth = Number(vpPrice.childWithBerth) || 0;
//             const vpChildWithoutBerth = Number(vpPrice.childWithoutBerth) || 0;
//             const vpAdvanceAdult = Number(vpAdvance.adult) || 0;
//             const vpAdvanceChild = Number(vpAdvance.child) || 0;

//             return {
//               duration: {
//                 days: Number(vpDuration.days) || 0,
//                 nights: Number(vpDuration.nights) || 0,
//               },
//               price: {
//                 doubleSharing: vpDouble,
//                 tripleSharing: vpTriple,
//                 childWithBerth: vpChildWithBerth,
//                 childWithoutBerth: vpChildWithoutBerth,
//               },
//               advanceAmount: {
//                 adult: vpAdvanceAdult,
//                 child: vpAdvanceChild,
//               },
//               balanceDouble: vpDouble - vpAdvanceAdult,
//               balanceTriple: vpTriple - vpAdvanceAdult,
//               balanceChildWithBerth:
//                 vpChildWithBerth > 0 ? vpChildWithBerth - vpAdvanceChild : null,
//               balanceChildWithoutBerth:
//                 vpChildWithoutBerth > 0
//                   ? vpChildWithoutBerth - vpAdvanceChild
//                   : null,
//               destination: Array.isArray(v.destination) ? v.destination : [],
//               sightseeing: Array.isArray(v.sightseeing) ? v.sightseeing : [],
//               itinerary: Array.isArray(v.itinerary) ? v.itinerary : [],
//               includes: Array.isArray(v.includes) ? v.includes : [],
//               excludes: Array.isArray(v.excludes) ? v.excludes : [],
//               trainDetails: Array.isArray(v.trainDetails)
//                 ? v.trainDetails.map((t) => ({
//                   trainNo: t.trainNo || "",
//                   trainName: t.trainName || "",
//                   fromCode: t.fromCode || "",
//                   fromStation: t.fromStation || "",
//                   toCode: t.toCode || "",
//                   toStation: t.toStation || "",
//                   class: t.class || "",
//                   departureTime: t.departureTime || "",
//                   arrivalTime: t.arrivalTime || "",
//                   ticketOpenDate: t.ticketOpenDate ? new Date(t.ticketOpenDate) : null,
//                   tripType: t.tripType || "", // ← NEW
//                   addons: parseAddonsArray(t.addons),
//                 }))
//                 : [],
//               flightDetails: Array.isArray(v.flightDetails)
//                 ? v.flightDetails.map((f) => ({
//                   airline: f.airline || "",
//                   flightNo: f.flightNo || "",
//                   fromCode: f.fromCode || "",
//                   fromAirport: f.fromAirport || "",
//                   toCode: f.toCode || "",
//                   toAirport: f.toAirport || "",
//                   class: f.class || "",
//                   departureTime: f.departureTime || "",
//                   arrivalTime: f.arrivalTime || "",
//                   // ── NEW: flight-wise addons for this variant ──
//                   addons: parseAddonsArray(f.addons),
//                 }))
//                 : [],
//               addons: Array.isArray(v.addons)
//                 ? v.addons.map((a) => ({
//                   name: a.name || "",
//                   amount: Number(a.amount) || 0,
//                 }))
//                 : [],
//               remarks: v.remarks || "",
//               boardingPoints: Array.isArray(v.boardingPoints)
//                 ? v.boardingPoints.map((b) => ({
//                   stationCode: b.stationCode || "",
//                   stationName: b.stationName || "",
//                 }))
//                 : [],
//               deboardingPoints: Array.isArray(v.deboardingPoints)
//                 ? v.deboardingPoints.map((b) => ({
//                   stationCode: b.stationCode || "",
//                   stationName: b.stationName || "",
//                 }))
//                 : [],
//               lastBookingDate: v.lastBookingDate
//                 ? new Date(v.lastBookingDate)
//                 : null,
//             };
//           });
//         }
//       } catch {
//         return res.json({
//           success: false,
//           message: "Invalid format for variantPackage",
//         });
//       }
//     }

//     // Create tour data object
//     const tourData = {
//       title,
//       batch,
//       duration: {
//         days: Number(parsedDuration.days) || 0,
//         nights: Number(parsedDuration.nights) || 0,
//       },
//       price: {
//         doubleSharing,
//         tripleSharing,
//         childWithBerth,
//         childWithoutBerth,
//       },
//       gst: parsedGst,
//       advanceAmount: {
//         adult: advanceAdult,
//         child: advanceChild,
//       },
//       balanceDouble,
//       balanceTriple,
//       balanceChildWithBerth,
//       balanceChildWithoutBerth,
//       destination: parseArrayField(destination, "destination"),
//       sightseeing: parseArrayField(sightseeing, "sightseeing"),
//       itinerary: parseArrayField(itinerary, "itinerary"),
//       includes: parseArrayField(includes, "includes"),
//       excludes: parseArrayField(excludes, "excludes"),
//       trainDetails: trainDetails
//         ? parseArrayField(trainDetails, "trainDetails").map((t) => ({
//           trainNo: t.trainNo || "",
//           trainName: t.trainName || "",
//           fromCode: t.fromCode || "",
//           fromStation: t.fromStation || "",
//           toCode: t.toCode || "",
//           toStation: t.toStation || "",
//           class: t.class || "",
//           departureTime: t.departureTime || "",
//           arrivalTime: t.arrivalTime || "",
//           ticketOpenDate: t.ticketOpenDate ? new Date(t.ticketOpenDate) : null,
//           tripType: t.tripType || "", // ← NEW: free-text note
//           addons: parseAddonsArray(t.addons),
//         }))
//         : [],
//       flightDetails: flightDetails
//         ? parseArrayField(flightDetails, "flightDetails").map((f) => ({
//           airline: f.airline || "",
//           flightNo: f.flightNo || "",
//           fromCode: f.fromCode || "",
//           fromAirport: f.fromAirport || "",
//           toCode: f.toCode || "",
//           toAirport: f.toAirport || "",
//           class: f.class || "",
//           departureTime: f.departureTime || "",
//           arrivalTime: f.arrivalTime || "",
//           // ── NEW: flight-wise addons ──
//           addons: parseAddonsArray(f.addons),
//         }))
//         : [],
//       addons: parsedAddons,
//       remarks: remarks || "",
//       boardingPoints: parsedBoardingPoints,
//       deboardingPoints: parsedDeboardingPoints,
//       titleImage: titleImageUrl,
//       mapImage: mapImageUrl,
//       galleryImages: galleryImageUrls,
//       lastBookingDate: new Date(lastBookingDate),
//       completedTripsCount: Number(completedTripsCount) || 0,
//       available: available ?? true,
//       variantPackage: parsedVariants,
//     };

//     // Save tour to database
//     const newTour = new tourModel(tourData);
//     await newTour.save();

//     res.json({
//       success: true,
//       message: "Tour added successfully",
//       data: newTour,
//     });
//   } catch (error) {
//     console.error(error);
//     res.json({ success: false, message: error.message });
//   }
// };





// const getAllPaymentMethods = async (req, res) => {
//   try {
//     const methods = await PaymentMethod.find({})
//       .sort({ type: 1, createdAt: -1 })
//       .lean();

//     // Enrich response (optional fields + isActive flag)
//     const enriched = methods.map((m) => ({
//       ...m,
//       isActive: true, // you can add real logic later (e.g., based on date or flag)
//       qrImage: m.qrImage || null,
//     }));

//     return res.status(200).json({
//       success: true,
//       count: enriched.length,
//       paymentMethods: enriched,
//     });
//   } catch (error) {
//     console.error("getAllPaymentMethods error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch payment methods",
//       error: error.message,
//     });
//   }
// };

// // ──────────────────────────────────────────────────────────────────────────────
// // POST /api/tour/payment-methods
// // Create new payment method (Bank or UPI/QR)
// // ──────────────────────────────────────────────────────────────────────────────
// const createPaymentMethod = async (req, res) => {
//   try {
//     const type = req.body?.type?.trim();

//     if (!type || !["bank", "upi"].includes(type)) {
//       return res.status(400).json({
//         success: false,
//         message: "Type must be either 'bank' or 'upi'",
//       });
//     }

//     let paymentData = { type };

//     if (type === "bank") {
//       const {
//         bankName,
//         branchName,
//         accountNumber,
//         ifsc,
//         swift = "",
//         beneficiary,
//         accountType,
//       } = req.body;

//       // Required fields validation
//       if (
//         !bankName?.trim() ||
//         !branchName?.trim() ||
//         !accountNumber?.trim() ||
//         !ifsc?.trim() ||
//         !beneficiary?.trim() ||
//         !accountType?.trim()
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "All bank fields (bankName, branchName, accountNumber, IFSC, beneficiary, accountType) are required",
//         });
//       }

//       paymentData = {
//         ...paymentData,
//         bankName: bankName.trim(),
//         branchName: branchName.trim(),
//         accountNumber: accountNumber.trim(),
//         ifsc: ifsc.trim().toUpperCase(),
//         swift: swift.trim() || undefined,
//         beneficiary: beneficiary.trim(),
//         accountType: accountType.trim(),
//       };
//     } else if (type === "upi") {
//       const { upiId, phone } = req.body;

//       if (!upiId?.trim() || !phone?.trim()) {
//         return res.status(400).json({
//           success: false,
//           message: "UPI ID and Phone number are required for UPI",
//         });
//       }

//       if (!/^[0-9]{10}$/.test(phone.trim())) {
//         return res.status(400).json({
//           success: false,
//           message: "Phone number must be exactly 10 digits",
//         });
//       }

//       paymentData = {
//         ...paymentData,
//         upiId: upiId.trim(),
//         phone: phone.trim(),
//       };

//       // Handle QR code upload (optional)
//       if (req.file) {
//         try {
//           const result = await cloudinary.uploader.upload(req.file.path, {
//             folder: "tour-payments/qr",
//             resource_type: "image",
//           });
//           paymentData.qrImage = result.secure_url;
//         } catch (uploadErr) {
//           console.error("Cloudinary upload failed:", uploadErr);
//           return res.status(500).json({
//             success: false,
//             message: "Failed to upload QR code image",
//           });
//         }
//       }
//     }

//     const newMethod = await PaymentMethod.create(paymentData);

//     return res.status(201).json({
//       success: true,
//       message: `${type === "bank" ? "Bank" : "UPI"} payment method created successfully`,
//       paymentMethod: newMethod,
//     });
//   } catch (error) {
//     console.error("createPaymentMethod error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to create payment method",
//       error: error.message,
//     });
//   }
// };



// // ──────────────────────────────────────────────────────────────────────────────
// // PUT /api/tour/payment-methods/:id
// // Update existing payment method
// // ──────────────────────────────────────────────────────────────────────────────
// const updatePaymentMethod = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const type = req.body?.type?.trim();

//     if (!type || !["bank", "upi"].includes(type)) {
//       return res.status(400).json({
//         success: false,
//         message: "Type must be 'bank' or 'upi'",
//       });
//     }

//     const updateData = { type };

//     if (type === "bank") {
//       const {
//         bankName,
//         branchName,
//         accountNumber,
//         ifsc,
//         swift,
//         beneficiary,
//         accountType,
//       } = req.body;

//       // Required fields validation (allow partial updates, but check if provided)
//       if (bankName !== undefined && !bankName.trim()) {
//         return res.status(400).json({
//           success: false,
//           message: "Bank name cannot be empty",
//         });
//       }
//       if (branchName !== undefined && !branchName.trim()) {
//         return res.status(400).json({
//           success: false,
//           message: "Branch name cannot be empty",
//         });
//       }

//       // Only update fields that are sent in request
//       if (bankName !== undefined) updateData.bankName = bankName.trim();
//       if (branchName !== undefined) updateData.branchName = branchName.trim();
//       if (accountNumber !== undefined)
//         updateData.accountNumber = accountNumber.trim();
//       if (ifsc !== undefined) updateData.ifsc = ifsc.trim().toUpperCase();
//       if (swift !== undefined) updateData.swift = swift.trim() || undefined;
//       if (beneficiary !== undefined)
//         updateData.beneficiary = beneficiary.trim();
//       if (accountType !== undefined)
//         updateData.accountType = accountType.trim();
//     } else if (type === "upi") {
//       const { upiId, phone } = req.body;

//       if (upiId !== undefined && !upiId.trim()) {
//         return res.status(400).json({
//           success: false,
//           message: "UPI ID cannot be empty",
//         });
//       }
//       if (phone !== undefined && !/^[0-9]{10}$/.test(phone.trim())) {
//         return res.status(400).json({
//           success: false,
//           message: "Phone number must be exactly 10 digits",
//         });
//       }

//       if (upiId !== undefined) updateData.upiId = upiId.trim();
//       if (phone !== undefined) updateData.phone = phone.trim();

//       // Optional: replace QR only if a new file is uploaded
//       if (req.file) {
//         try {
//           const result = await cloudinary.uploader.upload(req.file.path, {
//             folder: "tour-payments/qr",
//             resource_type: "image",
//           });
//           updateData.qrImage = result.secure_url;
//         } catch (uploadErr) {
//           console.error("Cloudinary upload failed:", uploadErr);
//           return res.status(500).json({
//             success: false,
//             message: "Failed to upload new QR code image",
//           });
//         }
//       }
//     }

//     const updated = await PaymentMethod.findByIdAndUpdate(id, updateData, {
//       new: true,
//       runValidators: true,
//     });

//     if (!updated) {
//       return res.status(404).json({
//         success: false,
//         message: "Payment method not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Payment method updated successfully",
//       paymentMethod: updated,
//     });
//   } catch (error) {
//     console.error("updatePaymentMethod error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to update payment method",
//       error: error.message,
//     });
//   }
// };
// // ──────────────────────────────────────────────────────────────────────────────
// // DELETE /api/payment-methods/:id
// // Delete a payment method
// // ──────────────────────────────────────────────────────────────────────────────
// const deletePaymentMethod = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const deleted = await PaymentMethod.findByIdAndDelete(id);

//     if (!deleted) {
//       return res.status(404).json({
//         success: false,
//         message: "Payment method not found",
//       });
//     }

//     // Optional: delete QR image from Cloudinary if exists
//     if (deleted.qrImage) {
//       try {
//         const publicId = deleted.qrImage.split("/").pop().split(".")[0];
//         await cloudinary.uploader.destroy(`tour-payments/qr/${publicId}`);
//       } catch (cloudErr) {
//         console.warn("Failed to delete QR from Cloudinary:", cloudErr);
//         // Do not fail the request — just log
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Payment method deleted successfully",
//     });
//   } catch (error) {
//     console.error("deletePaymentMethod error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to delete payment method",
//       error: error.message,
//     });
//   }
// };

// // ──────────────────────────────────────────────────────────────────────────────
// // GET /api/tour/:tourId/payment-methods
// // Get All Payment Methods for a Specific Tour
// // ──────────────────────────────────────────────────────────────────────────────
// const getTourPaymentMethods = async (req, res) => {
//   try {
//     const { tourId } = req.params;

//     const methods = await BalanceMethod.find({ tourId })
//       .sort({ type: 1, createdAt: -1 })
//       .lean();

//     const enriched = methods.map((m) => ({
//       ...m,
//       isActive: m.isActive !== false,
//       qrImage: m.qrImage || null,
//     }));

//     return res.status(200).json({
//       success: true,
//       count: enriched.length,
//       paymentMethods: enriched,
//     });
//   } catch (error) {
//     console.error("getTourPaymentMethods error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch tour payment methods",
//       error: error.message,
//     });
//   }
// };


// const createTourPaymentMethod = async (req, res) => {
//   try {
//     const { tourId } = req.params;

//     console.log("Received tourId:", tourId);

//     if (!tourId) {
//       return res.status(400).json({
//         success: false,
//         message: "Tour ID is required in URL",
//       });
//     }

//     const tour = await tourModel.findById(tourId);
//     if (!tour) {
//       return res.status(404).json({
//         success: false,
//         message: "Tour not found",
//       });
//     }

//     const type = req.body?.type?.trim().toLowerCase();

//     if (!type || !["bank", "upi"].includes(type)) {
//       return res.status(400).json({
//         success: false,
//         message: "Type must be either 'bank' or 'upi'",
//       });
//     }

//     let paymentData = {
//       tourId,
//       type,
//       isActive: true,
//     };

//     if (type === "bank") {
//       const {
//         bankName, branchName, accountNumber, ifsc, swift = "",
//         beneficiary, accountType,
//       } = req.body;

//       if (
//         !bankName?.trim() || !branchName?.trim() || !accountNumber?.trim() ||
//         !ifsc?.trim() || !beneficiary?.trim() || !accountType?.trim()
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: "All bank fields are required",
//         });
//       }

//       paymentData = {
//         ...paymentData,
//         bankName: bankName.trim(),
//         branchName: branchName.trim(),
//         accountNumber: accountNumber.trim(),
//         ifsc: ifsc.trim().toUpperCase(),
//         swift: swift.trim() || undefined,
//         beneficiary: beneficiary.trim(),
//         accountType: accountType.trim(),
//       };

//     } else if (type === "upi") {
//       const { upiId, phone } = req.body;

//       // Only upiId required, phone is optional
//       if (!upiId?.trim()) {
//         return res.status(400).json({
//           success: false,
//           message: "UPI ID is required",
//         });
//       }

//       // Validate phone format only if provided
//       if (phone?.trim() && !/^[0-9]{10}$/.test(phone.trim())) {
//         return res.status(400).json({
//           success: false,
//           message: "Phone number must be exactly 10 digits",
//         });
//       }

//       paymentData = {
//         ...paymentData,
//         upiId: upiId.trim(),
//         ...(phone?.trim() && { phone: phone.trim() }),
//       };

//       if (req.file) {
//         try {
//           const result = await cloudinary.v2.uploader.upload(req.file.path, {
//             folder: `tour-payments/${tourId}/qr`,
//             resource_type: "image",
//           });
//           paymentData.qrImage = result.secure_url;
//         } catch (uploadErr) {
//           console.error("Cloudinary upload failed:", uploadErr);
//           return res.status(500).json({
//             success: false,
//             message: "Failed to upload QR code image",
//           });
//         }
//       }
//     }

//     const newMethod = await BalanceMethod.create(paymentData);

//     return res.status(201).json({
//       success: true,
//       message: `${type.toUpperCase()} payment method created successfully for this tour`,
//       paymentMethod: newMethod,
//     });

//   } catch (error) {
//     console.error("createTourPaymentMethod error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to create tour payment method",
//       error: error.message,
//     });
//   }
// };

// // ──────────────────────────────────────────────────────────────────────────────
// // UPDATE PAYMENT METHOD - FIXED VERSION
// // ──────────────────────────────────────────────────────────────────────────────
// const updateTourPaymentMethod = async (req, res) => {
//   try {
//     const { tourId, id } = req.params;

//     const tour = await tourModel.findById(tourId);
//     if (!tour) {
//       return res.status(404).json({ success: false, message: "Tour not found" });
//     }

//     const type = (req.body?.type || "").toString().trim();

//     if (type && !["bank", "upi"].includes(type)) {
//       return res.status(400).json({ success: false, message: "Type must be 'bank' or 'upi'" });
//     }

//     const updateData = type ? { type } : {};

//     // === BANK PAYMENT ===
//     if (type === "bank" || req.body.bankName) {
//       const bankName = (req.body.bankName || "").toString().trim();
//       const branchName = (req.body.branchName || "").toString().trim();
//       const accountNumber = (req.body.accountNumber || "").toString().trim();
//       const ifsc = (req.body.ifsc || "").toString().trim();
//       const swift = (req.body.swift || "").toString().trim();
//       const beneficiary = (req.body.beneficiary || "").toString().trim();
//       const accountType = (req.body.accountType || "").toString().trim();

//       if (!bankName) return res.status(400).json({ success: false, message: "Bank name cannot be empty" });
//       if (!branchName) return res.status(400).json({ success: false, message: "Branch name cannot be empty" });

//       updateData.bankName = bankName;
//       updateData.branchName = branchName;
//       updateData.accountNumber = accountNumber;
//       updateData.ifsc = ifsc.toUpperCase();
//       updateData.swift = swift || undefined;
//       updateData.beneficiary = beneficiary;
//       updateData.accountType = accountType;
//     }
//     // === UPI PAYMENT ===
//     else if (type === "upi" || req.body.upiId) {
//       const upiId = (req.body.upiId || "").toString().trim();
//       const phone = (req.body.phone || "").toString().trim();

//       if (!upiId) return res.status(400).json({ success: false, message: "UPI ID cannot be empty" });
//       if (phone && !/^[0-9]{10}$/.test(phone)) {
//         return res.status(400).json({ success: false, message: "Phone number must be exactly 10 digits" });
//       }

//       updateData.upiId = upiId;
//       updateData.phone = phone;

//       if (req.file) {
//         try {
//           const result = await cloudinary.v2.uploader.upload(req.file.path, {
//             folder: `tour-payments/${tourId}/qr`,
//             resource_type: "image",
//           });
//           updateData.qrImage = result.secure_url;
//         } catch (err) {
//           console.error(err);
//           return res.status(500).json({ success: false, message: "QR upload failed" });
//         }
//       }
//     }

//     const updated = await BalanceMethod.findOneAndUpdate(
//       { _id: id, tourId },
//       updateData,
//       { new: true, runValidators: true }
//     ).lean();

//     if (!updated) {
//       return res.status(404).json({ success: false, message: "Payment method not found for this tour" });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Payment method updated successfully",
//       paymentMethod: {
//         ...updated,
//         isActive: updated.isActive !== false,
//         qrImage: updated.qrImage || null,
//       }
//     });

//   } catch (error) {
//     console.error("updateTourPaymentMethod error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to update payment method",
//       error: error.message
//     });
//   }
// };

// // ──────────────────────────────────────────────────────────────────────────────
// // DELETE /api/tour/:tourId/payment-methods/:id
// // Delete Payment Method for a Specific Tour
// // ──────────────────────────────────────────────────────────────────────────────
// const deleteTourPaymentMethod = async (req, res) => {
//   try {
//     const { tourId, id } = req.params;

//     // Verify tour exists (optional but recommended)
//     const tour = await tourModel.findById(tourId);
//     if (!tour) {
//       return res.status(404).json({
//         success: false,
//         message: "Tour not found",
//       });
//     }

//     const deleted = await BalanceMethod.findOneAndDelete({ _id: id, tourId });

//     if (!deleted) {
//       return res.status(404).json({
//         success: false,
//         message: "Payment method not found for this tour",
//       });
//     }

//     // Optional: Delete QR image from Cloudinary
//     if (deleted.qrImage) {
//       try {
//         const publicId = deleted.qrImage.split("/").pop().split(".")[0];
//         const folder = `tour-payments/${tourId}/qr`;
//         await cloudinary.v2.uploader.destroy(`${folder}/${publicId}`);
//       } catch (cloudErr) {
//         console.warn("Failed to delete QR from Cloudinary:", cloudErr);
//         // Don't fail the request
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Payment method deleted successfully",
//     });
//   } catch (error) {
//     console.error("deleteTourPaymentMethod error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to delete payment method",
//       error: error.message,
//     });
//   }
// };

// const getTourVehicleSeatOverview = async (req, res) => {
//   try {
//     const { tourId } = req.params;

//     if (!mongoose.isValidObjectId(tourId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid tour ID format",
//       });
//     }

//     // 1. Fetch relevant bookings
//     const bookings = await tourBookingModel
//       .find({
//         tourId: new mongoose.Types.ObjectId(tourId),
//       })
//       .select(
//         "tnr " +
//         "travellers.firstName travellers.lastName " +
//         "travellers.vehicleId travellers.vehicleName " +
//         "travellers.seatNumber travellers.seatLocked " +
//         "travellers.cancelled",
//       )
//       .lean();

//     if (!bookings || bookings.length === 0) {
//       return res.json({
//         success: true,
//         tourId,
//         totalBookings: 0,
//         totalTravellers: 0,
//         vehicles: [],
//         message: "No bookings found for this tour",
//       });
//     }

//     // 2. Collect vehicle IDs only from travellers with seat + not cancelled
//     const vehicleIds = new Set();
//     bookings.forEach((booking) => {
//       booking.travellers?.forEach((traveller) => {
//         const hasSeat =
//           traveller.seatNumber && String(traveller.seatNumber).trim() !== "";
//         if (
//           !traveller.cancelled?.byAdmin &&
//           !traveller.cancelled?.byTraveller &&
//           hasSeat &&
//           traveller.vehicleId
//         ) {
//           vehicleIds.add(traveller.vehicleId.toString());
//         }
//       });
//     });

//     // 3. Load only relevant vehicles – FIXED fields to match schema (vehicleName + totalSeats)
//     const vehicles = await TourVehicle.find({
//       _id: {
//         $in: [...vehicleIds].map((id) => new mongoose.Types.ObjectId(id)),
//       },
//     })
//       .select("vehicleName totalSeats") // ← Changed to match schema
//       .lean();

//     const vehicleMap = new Map();
//     vehicles.forEach((vehicle) => {
//       const idStr = vehicle._id.toString();
//       vehicleMap.set(idStr, {
//         vehicleId: idStr,
//         vehicleName: vehicle.vehicleName || "Unnamed Vehicle",
//         capacity: Number(vehicle.totalSeats) || 0, // ← Use totalSeats from schema
//         bookedSeats: 0,
//         remainingSeats: 0,
//         travellers: [],
//       });
//     });

//     // 4. Process only travellers with seatNumber
//     const unassigned = {
//       vehicleName: "Not Assigned",
//       vehicleId: null,
//       capacity: null,
//       bookedSeats: 0,
//       remainingSeats: null,
//       travellers: [],
//     };

//     let totalTravellersCount = 0;

//     bookings.forEach((booking) => {
//       booking.travellers?.forEach((traveller) => {
//         // Skip if:
//         // - cancelled, or
//         // - no seat number assigned
//         const hasSeat =
//           traveller.seatNumber && String(traveller.seatNumber).trim() !== "";
//         if (
//           traveller.cancelled?.byAdmin ||
//           traveller.cancelled?.byTraveller ||
//           !hasSeat
//         ) {
//           return;
//         }

//         totalTravellersCount++;

//         const travellerData = {
//           tnr: booking.tnr || "(no TNR)",
//           name:
//             [traveller.firstName, traveller.lastName]
//               .filter(Boolean)
//               .join(" ")
//               .trim() || "(no name)",
//           seat: traveller.seatNumber || "—", // already checked above
//           locked: traveller.seatLocked === true ? "Yes" : "No",
//         };

//         if (traveller.vehicleId) {
//           const vid = traveller.vehicleId.toString();
//           const veh = vehicleMap.get(vid);

//           if (veh) {
//             veh.travellers.push(travellerData);
//             veh.bookedSeats += 1;
//           } else {
//             // orphaned vehicle reference → treat as unassigned
//             unassigned.travellers.push(travellerData);
//             unassigned.bookedSeats += 1;
//           }
//         } else {
//           unassigned.travellers.push(travellerData);
//           unassigned.bookedSeats += 1;
//         }
//       });
//     });

//     // 5. Prepare final list
//     const resultVehicles = [...vehicleMap.values()];

//     // Sort vehicles by name
//     resultVehicles.sort((a, b) => a.vehicleName.localeCompare(b.vehicleName));

//     // Unassigned at the end (only if has booked travellers)
//     if (unassigned.travellers.length > 0) {
//       resultVehicles.push(unassigned);
//     }

//     // 6. Calculate remaining seats
//     resultVehicles.forEach((v) => {
//       if (v.capacity !== null && typeof v.capacity === "number") {
//         v.remainingSeats = Math.max(0, v.capacity - v.bookedSeats);
//       }
//     });

//     return res.json({
//       success: true,
//       tourId,
//       totalBookings: bookings.length,
//       totalTravellers: totalTravellersCount, // ← only seated travellers
//       vehicles: resultVehicles,
//     });
//   } catch (error) {
//     console.error("getTourVehicleSeatOverview error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Error fetching vehicle & seat allocation overview",
//       error: error.message,
//     });
//   }
// };


// const adminCreateEnquiry = async (req, res) => {
//   try {
//     const {
//       fullName, mobileNumber, email, city,
//       destination, tourType, preferredTravelDate, numberOfDays,
//       numberOfNights, // ← ADD
//       adults, children, infants, specialRequests, source,
//     } = req.body;

//     if (!fullName || !mobileNumber || !destination || !tourType) {
//       return res.status(400).json({ success: false, message: "Please fill all required fields" });
//     }

//     const enquiry = await enquiryModel.create({
//       fullName, mobileNumber, email, city,
//       destination, tourType,
//       preferredTravelDate: preferredTravelDate || null,
//       numberOfDays: numberOfDays ? Number(numberOfDays) : null,
//       numberOfNights: numberOfNights ? Number(numberOfNights) : null,
//       adults: adults || 1,
//       children: children || 0,
//       infants: infants || 0,
//       specialRequests,
//       source: source || null,
//       raisedBy: "admin",
//     });

//     return res.status(201).json({
//       success: true,
//       message: `Enquiry created! FIT Code: ${enquiry.fitCode}`,
//       data: enquiry,
//       fitCode: enquiry.fitCode,
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// const getAllEnquiries = async (req, res) => {
//   try {
//     // Auto-reject expired pending enquiries first
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     await enquiryModel.updateMany(
//       { status: "pending", preferredTravelDate: { $lt: today } },
//       { $set: { status: "rejected" } }
//     );

//     const enquiries = await enquiryModel.find().sort({ createdAt: -1 });
//     return res.status(200).json({ success: true, data: enquiries });

//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };
// // GET BY ID — GET /api/tour/enquiry/:id
// const getEnquiryById = async (req, res) => {
//   try {
//     const enquiry = await enquiryModel.findById(req.params.id);
//     if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });
//     return res.status(200).json({ success: true, data: enquiry });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
//   }
// };

// // UPDATE — PUT /api/tour/enquiry/:id/update
// const updateEnquiry = async (req, res) => {
//   try {
//     const enquiry = await enquiryModel.findByIdAndUpdate(
//       req.params.id,
//       { $set: req.body },
//       { new: true, runValidators: false }
//     );
//     if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });
//     return res.status(200).json({ success: true, message: "Enquiry updated successfully", data: enquiry });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
//   }
// };

// // DELETE — DELETE /api/tour/enquiry/:id/delete
// // const deleteEnquiry = async (req, res) => {
// //   try {
// //     const enquiry = await enquiryModel.findByIdAndDelete(req.params.id);
// //     if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });
// //     return res.status(200).json({ success: true, message: "Enquiry deleted successfully" });
// //   } catch (error) {
// //     return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
// //   }
// // };

// // ── TOGGLE "RATE PASSED AND HOLD" — PUT /api/tour/enquiry/:id/rate-passed ──
// // This is a SEPARATE flag from `status` (pending/accepted/rejected). An
// // enquiry stays "pending" in status terms while isRatePassed can
// // independently be true or false. Used to surface enquiries where the
// // rate has been confirmed/passed internally but the booking itself is
// // still on hold pending customer confirmation. Only allowed while the
// // enquiry's status is still "pending" — once accepted or rejected, the
// // flag is locked at whatever value it last had (frontend additionally
// // disables the toggle button once status leaves "pending").
// const toggleRatePassed = async (req, res) => {
//   try {
//     const enquiry = await enquiryModel.findById(req.params.id);
//     if (!enquiry) {
//       return res.status(404).json({ success: false, message: "Enquiry not found" });
//     }
//     if (enquiry.status !== "pending") {
//       return res.status(400).json({
//         success: false,
//         message: "Rate Passed and Hold can only be toggled while the enquiry is still pending",
//       });
//     }

//     enquiry.isRatePassed = !enquiry.isRatePassed;
//     const updated = await enquiry.save({ validateBeforeSave: false });

//     return res.status(200).json({
//       success: true,
//       message: updated.isRatePassed
//         ? "Marked as Rate Passed and Hold"
//         : "Rate Passed and Hold cleared",
//       data: updated,
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
//   }
// };

// const acceptEnquiry = async (req, res) => {
//   try {
//     const { salesValue, fitStates, pickupDate, pickupTime, pickupPlace } = req.body;

//     // Validation — FIT states is OPTIONAL (no longer required to accept).
//     // It's fine for fitStates to be missing, empty, or undefined here;
//     // we simply default it to [] further down before saving.
//     if (!salesValue || isNaN(Number(salesValue)) || Number(salesValue) <= 0) {
//       return res.status(400).json({ success: false, message: "Valid sales value is required" });
//     }
//     if (!pickupDate) {
//       return res.status(400).json({ success: false, message: "Pickup date is required" });
//     }
//     if (!pickupTime) {
//       return res.status(400).json({ success: false, message: "Pickup time is required" });
//     }
//     if (!pickupPlace || !pickupPlace.trim()) {
//       return res.status(400).json({ success: false, message: "Pickup place is required" });
//     }

//     const enquiry = await enquiryModel.findById(req.params.id);
//     if (!enquiry) {
//       return res.status(404).json({ success: false, message: "Enquiry not found" });
//     }
//     if (enquiry.status === "accepted") {
//       return res.status(400).json({ success: false, message: "Enquiry already accepted" });
//     }

//     enquiry.status = "accepted";
//     enquiry.salesValue = Number(salesValue);
//     enquiry.fitStates = Array.isArray(fitStates) ? fitStates : [];
//     enquiry.pickupDate = new Date(pickupDate);
//     enquiry.pickupTime = pickupTime.trim();
//     enquiry.pickupPlace = pickupPlace.trim();
//     enquiry.acceptedAt = new Date();

//     const updated = await enquiry.save({ validateBeforeSave: false });
//     return res.status(200).json({
//       success: true,
//       message: "Enquiry accepted successfully",
//       fitCode: updated.fitCode,
//       data: updated
//     });

//   } catch (error) {
//     console.error("Accept Enquiry Error:", error);
//     return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
//   }
// };

// // REJECT — PUT /api/tour/enquiry/:id/reject
// const rejectEnquiry = async (req, res) => {
//   try {
//     const enquiry = await enquiryModel.findByIdAndUpdate(
//       req.params.id,
//       { status: "rejected" },
//       { new: true }
//     );
//     if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });
//     return res.status(200).json({ success: true, message: "Enquiry rejected", data: enquiry });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };







// export {
//   tourList,
//   loginTour,
//   bookingsTour,
//   bookingComplete,
//   tourDashboard,
//   tourProfile,
//   updateTourProfile,
//   markOfflineAdvancePaid,
//   markOfflineBalancePaid,
//   updateTraveller,
//   markAdvanceReceiptSent,
//   markBalanceReceiptSent,
//   viewTourBalance,
//   viewTourAdvance,
//   updateTourBalance,
//   updateTourAdvance,
//   updateBalanceRemark,
//   updateAdvanceRemark,
//   deleteBalanceRemark,
//   deleteAdvanceRemark,
//   updateModifyReceipt,
//   viewBooking,
//   getBookingInvoice,
//   updateBookingInvoice,
//   deleteBookingInvoice,      // ← ADD THIS LINE
//   getCancellationsByBooking,
//   updateBookingBalance,
//   getManagedBookingsHistory,
//   allotRooms,
//   // ==================== NEW ONES TO ADD ====================
//   getManualRooms,           // View Both Guest + Leader Rooms
//   addGuestRoom,             // Add Guest Room
//   addLeaderRoom,            // Add Leader Room
//   deleteLeaderRoom,
//   // =========================================================


//   getToursByYear,
//   getAvailableTourYears,
//   getAllBookings,
//   TaskBookingComplete,
//   taskMarkModifyReceipt,
//   taskMarkAdvanceReceiptSent,
//   taskMarkBalanceReceiptSent,
//   taskMarkCancellationReceipt,
//   taskMarkManageBookingReceipt,
//   createTourVehicle,
//   updateTourVehicle,
//   toggleVehicleSeatSelection,
//   getTourVehicles,
//   deleteTourVehicle,
//   addTour,
//   getAllPaymentMethods,
//   createPaymentMethod,
//   updatePaymentMethod,
//   deletePaymentMethod,
//   getTourPaymentMethods,
//   createTourPaymentMethod,
//   updateTourPaymentMethod,
//   deleteTourPaymentMethod,
//   getTourVehicleSeatOverview,

//   // ↓ new ones
//   adminCreateEnquiry,
//   getAllEnquiries,
//   getEnquiryById,
//   updateEnquiry,
//   // deleteEnquiry,
//   toggleRatePassed,
//   acceptEnquiry,
//   rejectEnquiry,


// };


import mongoose from "mongoose"; // Added missing import
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";

import tourModel from "../models/tourModel.js";
import tourBookingModel from "../models/tourBookingmodel.js";
import cancellationModel from "../models/cancellationModel.js";
import manageBookingModel from "../models/manageBookingModel.js";
import tourRoomAllocationModel from "../models/roomModel.js";
import TourVehicle from "../models/tourVehicleModel.js";
import PaymentMethod from "../models/paymentModel.js";
import BalanceMethod from "../models/balanceReminderModel.js";
import enquiryModel from "../models/enquiryModel.js";
import { buildInvoiceView, currencyRound } from "./invoiceView.js";
import invoiceModel from "../models/invoiceModel.js"; // ← the new separate model

// Whenever booking data that affects invoice totals changes (admin remarks,
// advance/balance shifts, payment status), the previously saved (edited)
// invoice snapshot is now stale. Delete it so the next GET /invoice/:tnr
// rebuilds fresh via buildInvoiceView — same as manual "revert" flow.

// const freezeEditedEntries = (incoming, freshAuto) => {
//   const freshItemMap = new Map((freshAuto.items || []).map((i) => [i.sourceRef, i]));
//   const freshPaymentMap = new Map((freshAuto.payments || []).map((p) => [p.sourceRef, p]));

//   const items = (incoming.items || []).map((item) => {
//     if (!item.sourceRef) return item; // already manual
//     const fresh = freshItemMap.get(item.sourceRef);
//     const changed =
//       !fresh ||
//       fresh.description !== item.description ||
//       fresh.subDescription !== item.subDescription ||
//       Number(fresh.gstRate) !== Number(item.gstRate) ||
//       Number(fresh.quantity) !== Number(item.quantity) ||
//       Number(fresh.rate) !== Number(item.rate);
//     return changed ? { ...item, sourceRef: null } : item;
//   });

//   const payments = (incoming.payments || []).map((p) => {
//     if (!p.sourceRef) return p; // already manual
//     const fresh = freshPaymentMap.get(p.sourceRef);
//     const changed =
//       !fresh ||
//       Number(fresh.amountReceived) !== Number(p.amountReceived) ||
//       new Date(fresh.date || 0).getTime() !== new Date(p.date || 0).getTime();
//     return changed ? { ...p, sourceRef: null } : p;
//   });

//   return { ...incoming, items, payments };
// };
// // Merges a fresh (auto) list into a saved list while PRESERVING the saved
// // list's row order. Existing rows (manual or still-synced) keep their
// // position; only brand-new auto entries get appended at the end.
// const mergeInOrder = (savedList, freshList, deletedRefs) => {
//   const freshMap = new Map((freshList || []).map((i) => [i.sourceRef, i]));
//   const savedRefsPresent = new Set(
//     (savedList || []).map((i) => i.sourceRef).filter(Boolean),
//   );

//   const merged = (savedList || [])
//     .map((i) => {
//       if (!i.sourceRef) return i; // manual (edited) — as-is, same position
//       if (deletedRefs.has(i.sourceRef)) return null;
//       const fresh = freshMap.get(i.sourceRef);
//       return fresh || null; // still auto-synced — refresh value, SAME position
//     })
//     .filter(Boolean);

//   const newEntries = (freshList || []).filter(
//     (i) => !savedRefsPresent.has(i.sourceRef) && !deletedRefs.has(i.sourceRef),
//   );

//   return [...merged, ...newEntries]; // brand-new auto rows → append at end only
// };
// const syncInvoiceWithBooking = (savedInvoice, booking, tour, cancellations = []) => {
//   const freshAuto = buildInvoiceView(booking, tour, cancellations);
//   if (!freshAuto) return savedInvoice;

//   const deletedRefs = new Set(savedInvoice.deletedSourceRefs || []);

//   const mergedItems = mergeInOrder(savedInvoice.items, freshAuto.items, deletedRefs);
//   const mergedPayments = mergeInOrder(savedInvoice.payments, freshAuto.payments, deletedRefs);

//   // ...rest stays exactly the same

//   const amountSum = currencyRound(mergedItems.reduce((s, i) => s + (i.amount || 0), 0));
//   const cgstSum = currencyRound(mergedItems.reduce((s, i) => s + (i.cgst || 0), 0));
//   const sgstSum = currencyRound(mergedItems.reduce((s, i) => s + (i.sgst || 0), 0));
//   const roundOff = Number(savedInvoice.totals?.roundOff || 0);
//   const grandTotal = currencyRound(amountSum + cgstSum + sgstSum + roundOff);

//   const amountPaid = currencyRound(mergedPayments.reduce((s, p) => s + (p.amountReceived || 0), 0));
//   const dueAmount = Math.max(0, currencyRound(grandTotal - amountPaid));
//   const status = dueAmount <= 0 ? "Paid" : "Part Paid";

//   return {
//     ...savedInvoice,
//     items: mergedItems,
//     payments: mergedPayments,
//     deletedSourceRefs: savedInvoice.deletedSourceRefs || [],
//     totals: { amount: amountSum, cgst: cgstSum, sgst: sgstSum, roundOff, grandTotal },
//     amountPaid,
//     dueAmount,
//     status,
//   };
// };

// // ── Route handler — GET /api/tour/invoice/:tnr ───────────────────────────
// const getBookingInvoice = async (req, res) => {
//   try {
//     const { tnr } = req.params;

//     if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid 6-character TNR is required",
//       });
//     }

//     const normalizedTnr = tnr.trim().toUpperCase();

//     const booking = await tourBookingModel
//       .findOne({ tnr: normalizedTnr })
//       .lean();

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found with this TNR",
//       });
//     }

//     // Fetch the LIVE tour doc (not the stale tourData snapshot on the
//     // booking), so gst / price always reflect current tour settings.
//     const tour = await tourModel.findById(booking.tourId).lean();

//     if (!tour) {
//       return res.status(404).json({
//         success: false,
//         message: "Tour not found for this booking",
//       });
//     }

//     // Fetch all cancellation records tied to this booking — these hold
//     // the travellerIds needed to work out GV/IRCTC cancellation pool
//     // quantity on the invoice (see buildCancellationPoolItems).
//     // Fetch all cancellation records tied to this booking — matched by TNR,
//     // same pattern as getCancellationsByBooking, since bookingId may not be
//     // reliably populated on every cancellation record.
//     const cancellations = await cancellationModel
//       .find({ tnr: normalizedTnr })
//       .lean();

//     const savedInvoice = await invoiceModel.findOne({ tnr: normalizedTnr }).lean();

//     let invoice;
//     if (!savedInvoice) {
//       invoice = buildInvoiceView(booking, tour, cancellations);
//     } else {
//       invoice = syncInvoiceWithBooking(savedInvoice, booking, tour, cancellations);
//       if (invoice) {
//         // Keep the saved doc's synced values up to date too, so any other
//         // code path reading straight from invoiceModel sees the same data.
//         await invoiceModel.findOneAndUpdate(
//           { tnr: normalizedTnr },
//           { $set: invoice },
//           { new: false },
//         );
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       invoice, // null if advance not yet paid
//     });
//   } catch (error) {
//     console.error("getBookingInvoice error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while building invoice",
//       error: error.message,
//     });
//   }
// };
// // PUT /api/tour/invoice/:tnr
// // Saves the admin's edited invoice into the SEPARATE invoice collection —
// // tourBookingModel is never touched by this.
// const updateBookingInvoice = async (req, res) => {
//   try {
//     const { tnr } = req.params;
//     const { invoice } = req.body;

//     if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid 6-character TNR is required",
//       });
//     }

//     if (!invoice || typeof invoice !== "object") {
//       return res.status(400).json({
//         success: false,
//         message: "Invoice data is required",
//       });
//     }

//     const normalizedTnr = tnr.trim().toUpperCase();

//     const booking = await tourBookingModel.findOne({ tnr: normalizedTnr });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found with this TNR",
//       });
//     }

//     if (!booking.invoiceNumber) {
//       return res.status(400).json({
//         success: false,
//         message: "Cannot edit invoice before advance is paid",
//       });
//     }

//     const tour = await tourModel.findById(booking.tourId).lean();

//     // ← ADDED: fetch cancellations, same as getBookingInvoice does
//     const cancellations = await cancellationModel
//       .find({ tnr: normalizedTnr })
//       .lean();

//     const freshAuto =
//       buildInvoiceView(booking.toObject ? booking.toObject() : booking, tour, cancellations) || {
//         items: [],
//         payments: [],
//       };

//     // ...rest stays exactly the same

//     // Any auto item/payment whose value the admin actually changed gets
//     // frozen (sourceRef cleared) so it stops auto-syncing from now on.
//     const frozenInvoice = freezeEditedEntries(invoice, freshAuto);

//     // Any auto sourceRef that existed in freshAuto but is MISSING from the
//     // admin's saved item/payment list was deliberately removed — track it
//     // so future syncs never regenerate it again.
//     const incomingItemRefs = new Set(
//       (frozenInvoice.items || []).map((i) => i.sourceRef).filter(Boolean),
//     );
//     const incomingPaymentRefs = new Set(
//       (frozenInvoice.payments || []).map((p) => p.sourceRef).filter(Boolean),
//     );

//     const newlyDeletedRefs = [
//       ...freshAuto.items.filter((i) => !incomingItemRefs.has(i.sourceRef)).map((i) => i.sourceRef),
//       ...freshAuto.payments.filter((p) => !incomingPaymentRefs.has(p.sourceRef)).map((p) => p.sourceRef),
//     ];

//     const existing = await invoiceModel.findOne({ tnr: normalizedTnr }).lean();
//     const deletedSourceRefs = Array.from(
//       new Set([...(existing?.deletedSourceRefs || []), ...newlyDeletedRefs]),
//     );

//     const saved = await invoiceModel.findOneAndUpdate(
//       { tnr: normalizedTnr },
//       {
//         ...frozenInvoice,
//         tnr: normalizedTnr,
//         bookingId: booking._id,
//         invoiceNumber: booking.invoiceNumber,
//         deletedSourceRefs,
//       },
//       { upsert: true, new: true, runValidators: true },
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Invoice saved successfully",
//       invoice: saved,
//     });
//   } catch (error) {
//     console.error("updateBookingInvoice error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while saving invoice",
//       error: error.message,
//     });
//   }
// };

// // DELETE /api/tour/invoice/:tnr
// // Removes the saved (edited) invoice document. Does NOT touch
// // tourBookingModel at all — invoiceNumber stays exactly as it is.
// // After this, GET /api/tour/invoice/:tnr goes back to auto-calculating
// // the invoice fresh from travellers/tourData, same as before any edit.
// const deleteBookingInvoice = async (req, res) => {
//   try {
//     const { tnr } = req.params;

//     if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid 6-character TNR is required",
//       });
//     }

//     const normalizedTnr = tnr.trim().toUpperCase();

//     const deleted = await invoiceModel.findOneAndDelete({ tnr: normalizedTnr });

//     if (!deleted) {
//       return res.status(404).json({
//         success: false,
//         message: "No saved edit found for this invoice",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Saved invoice edit removed — reverted to auto-calculated",
//     });
//   } catch (error) {
//     console.error("deleteBookingInvoice error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while deleting invoice",
//       error: error.message,
//     });
//   }
// };

const freezeEditedEntries = (incoming, freshAuto) => {
  const freshItemMap = new Map((freshAuto.items || []).map((i) => [i.sourceRef, i]));
  const freshPaymentMap = new Map((freshAuto.payments || []).map((p) => [p.sourceRef, p]));

  const items = (incoming.items || []).map((item) => {
    if (!item.sourceRef) return item; // already manual
    const fresh = freshItemMap.get(item.sourceRef);
    const changed =
      !fresh ||
      fresh.description !== item.description ||
      fresh.subDescription !== item.subDescription ||
      Number(fresh.gstRate) !== Number(item.gstRate) ||
      Number(fresh.quantity) !== Number(item.quantity) ||
      Number(fresh.rate) !== Number(item.rate);
    return changed ? { ...item, sourceRef: null } : item;
  });

  const payments = (incoming.payments || []).map((p) => {
    if (!p.sourceRef) return p; // already manual
    const fresh = freshPaymentMap.get(p.sourceRef);
    const changed =
      !fresh ||
      Number(fresh.amountReceived) !== Number(p.amountReceived) ||
      new Date(fresh.date || 0).getTime() !== new Date(p.date || 0).getTime();
    return changed ? { ...p, sourceRef: null } : p;
  });

  return { ...incoming, items, payments };
};
// Merges a fresh (auto) list into a saved list while PRESERVING the saved
// list's row order. Existing rows (manual or still-synced) keep their
// position; only brand-new auto entries get appended at the end.
// const mergeInOrder = (savedList, freshList, deletedRefs) => {
//   const freshMap = new Map((freshList || []).map((i) => [i.sourceRef, i]));
//   const savedRefsPresent = new Set(
//     (savedList || []).map((i) => i.sourceRef).filter(Boolean),
//   );

//   const merged = (savedList || [])
//     .map((i) => {
//       if (!i.sourceRef) return i; // manual (edited) — as-is, same position
//       if (deletedRefs.has(i.sourceRef)) return null;
//       const fresh = freshMap.get(i.sourceRef);
//       return fresh || null; // still auto-synced — refresh value, SAME position
//     })
//     .filter(Boolean);

//   const newEntries = (freshList || []).filter(
//     (i) => !savedRefsPresent.has(i.sourceRef) && !deletedRefs.has(i.sourceRef),
//   );

//   return [...merged, ...newEntries]; // brand-new auto rows → append at end only
// };

const mergeInOrder = (savedList, freshList, deletedRefs) => {
  const freshMap = new Map((freshList || []).map((i) => [i.sourceRef, i]));

  // Record: for each manual item, which auto sourceRef (if any)
  // immediately preceded it in the OLD saved order.
  const manualAfter = [];
  let lastAutoRef = null;
  (savedList || []).forEach((i) => {
    if (!i.sourceRef) {
      manualAfter.push({ afterRef: lastAutoRef, item: i });
    } else if (!deletedRefs.has(i.sourceRef)) {
      lastAutoRef = i.sourceRef;
    }
  });

  // Auto items: always freshList's own order, refreshed values, minus
  // anything explicitly deleted.
  const autoOrdered = (freshList || []).filter(
    (i) => i.sourceRef && !deletedRefs.has(i.sourceRef),
  );

  const result = [];
  // Manual items with no preceding auto neighbour go first, in their
  // original relative order.
  manualAfter
    .filter((m) => m.afterRef === null)
    .forEach((m) => result.push(m.item));

  autoOrdered.forEach((autoItem) => {
    result.push(freshMap.get(autoItem.sourceRef));
    manualAfter
      .filter((m) => m.afterRef === autoItem.sourceRef)
      .forEach((m) => result.push(m.item));
  });

  return result;
};
const syncInvoiceWithBooking = (savedInvoice, booking, tour, cancellations = []) => {
  const freshAuto = buildInvoiceView(booking, tour, cancellations);
  if (!freshAuto) return savedInvoice;

  const deletedRefs = new Set(savedInvoice.deletedSourceRefs || []);

  const mergedItems = mergeInOrder(savedInvoice.items, freshAuto.items, deletedRefs);
  const mergedPayments = mergeInOrder(savedInvoice.payments, freshAuto.payments, deletedRefs);

  // ...rest stays exactly the same

  const amountSum = currencyRound(mergedItems.reduce((s, i) => s + (i.amount || 0), 0));
  const cgstSum = currencyRound(mergedItems.reduce((s, i) => s + (i.cgst || 0), 0));
  const sgstSum = currencyRound(mergedItems.reduce((s, i) => s + (i.sgst || 0), 0));
  const roundOff = Number(savedInvoice.totals?.roundOff || 0);
  const grandTotal = currencyRound(amountSum + cgstSum + sgstSum + roundOff);

  const amountPaid = currencyRound(mergedPayments.reduce((s, p) => s + (p.amountReceived || 0), 0));
  const rawDue = currencyRound(grandTotal - amountPaid);
  const dueAmount = Math.max(0, rawDue);
  // Overpayment (e.g. total dropped after a cancellation/adjustment but
  // the customer had already paid the old, higher total) → surface as a
  // refund owed, same rule as buildInvoiceView.
  const refundAmount = rawDue < 0 ? currencyRound(Math.abs(rawDue)) : 0;
  const status = dueAmount <= 0 ? "Paid" : "Part Paid";

  return {
    ...savedInvoice,
    items: mergedItems,
    payments: mergedPayments,
    deletedSourceRefs: savedInvoice.deletedSourceRefs || [],
    totals: { amount: amountSum, cgst: cgstSum, sgst: sgstSum, roundOff, grandTotal },
    amountPaid,
    dueAmount,
    refundAmount,
    status,
  };
};

// ── Unfreeze on cancellation (NEW) ──────────────────────────────────────
// A manually-edited base fare / GV pool / IRCTC pool row freezes
// (sourceRef → null) via freezeEditedEntries — that's fine and expected
// during NORMAL invoice editing. But if a cancellation (trip-cancel or
// otherwise) happens AFTER that freeze, the frozen row would silently
// stop reflecting reality forever (see the AO35GP bug). So specifically
// at the moment a cancellation is being resynced (resyncInvoiceForTnr,
// called from cancelEntireTrip), force these 3 categories back to live:
//   1. Strip base:/gvpool:/irctcpool: entries out of deletedSourceRefs.
//   2. Drop any frozen (sourceRef: null) item that LOOKS like a base
//      fare line or a cancellation pool line (matched by description,
//      since the sourceRef that would normally identify it is gone).
// Genuine one-off manual items (e.g. "EXCESS AMOUNT PAID FOR AIRPLANE")
// never match these patterns and are left completely untouched.
const looksLikeBaseFareLine = (desc = "") =>
  /\[.*SHARING\]/i.test(desc) || /CHILD FARE/i.test(desc);
const looksLikePoolLine = (desc = "") =>
  /GV CANCELLATION POOL/i.test(desc) || /IRCTC CANCELLATION POOL/i.test(desc);

const unfreezeCancellationSensitiveItems = (savedInvoice) => {
  const deletedSourceRefs = (savedInvoice.deletedSourceRefs || []).filter(
    (ref) => !/^(base:|gvpool:|irctcpool:)/i.test(ref),
  );

  const items = (savedInvoice.items || []).filter((item) => {
    if (item.sourceRef) return true; // still live-tracked, always keep
    const desc = item.description || "";
    return !(looksLikeBaseFareLine(desc) || looksLikePoolLine(desc));
  });

  return { ...savedInvoice, items, deletedSourceRefs };
};

// ── Eager invoice resync (NEW) ────────────────────────────────────────
// Recomputes and SAVES the invoice for a single booking (by TNR) right
// now, instead of waiting for someone to open the Invoice page (which is
// the only thing that triggered a resync before — see getBookingInvoice
// below). Needed because bulk actions like cancelEntireTrip
// (tourAdminController.js) change traveller cancellation state on
// MANY bookings at once, and nobody may open those invoices for days —
// until then the saved invoiceModel doc stays stale (still billing the
// now-cancelled traveller's fare, no refund reflected). Call this right
// after any code path that changes a booking's traveller cancellation
// state, payment state, or tour price/gst, if that booking already has
// a saved invoice.
//
// Also unfreezes base fare / GV pool / IRCTC pool rows first (see
// unfreezeCancellationSensitiveItems above) — this is the ONLY place
// that happens, so it only ever fires at a genuine cancellation event,
// never during normal invoice viewing/editing.
//
// Safe to call even if no invoice exists yet for this TNR (no-op) or if
// the booking/tour lookup fails (returns null, caller should not treat
// this as fatal — the invoice will still self-correct next time someone
// views it, via getBookingInvoice's own sync).
const resyncInvoiceForTnr = async (tnr) => {
  try {
    if (!tnr) return null;
    const normalizedTnr = tnr.trim().toUpperCase();

    const savedInvoiceRaw = await invoiceModel.findOne({ tnr: normalizedTnr }).lean();
    if (!savedInvoiceRaw) return null; // nothing to resync — invoice not created yet

    const savedInvoice = unfreezeCancellationSensitiveItems(savedInvoiceRaw);

    const booking = await tourBookingModel.findOne({ tnr: normalizedTnr }).lean();
    if (!booking) return null;

    const tour = await tourModel.findById(booking.tourId).lean();
    if (!tour) return null;

    const cancellations = await cancellationModel.find({ tnr: normalizedTnr }).lean();

    const invoice = syncInvoiceWithBooking(savedInvoice, booking, tour, cancellations);
    if (!invoice) return null;

    await invoiceModel.findOneAndUpdate(
      { tnr: normalizedTnr },
      { $set: invoice },
      { new: false },
    );

    return invoice;
  } catch (err) {
    console.error(`resyncInvoiceForTnr(${tnr}) failed:`, err.message);
    return null; // never let an invoice-resync failure break the caller's main action
  }
};

// ── Route handler — GET /api/tour/invoice/:tnr ───────────────────────────
const getBookingInvoice = async (req, res) => {
  try {
    const { tnr } = req.params;

    if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Valid 6-character TNR is required",
      });
    }

    const normalizedTnr = tnr.trim().toUpperCase();

    const booking = await tourBookingModel
      .findOne({ tnr: normalizedTnr })
      .lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found with this TNR",
      });
    }

    // Fetch the LIVE tour doc (not the stale tourData snapshot on the
    // booking), so gst / price always reflect current tour settings.
    const tour = await tourModel.findById(booking.tourId).lean();

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour not found for this booking",
      });
    }

    // Fetch all cancellation records tied to this booking — these hold
    // the travellerIds needed to work out GV/IRCTC cancellation pool
    // quantity on the invoice (see buildCancellationPoolItems).
    // Fetch all cancellation records tied to this booking — matched by TNR,
    // same pattern as getCancellationsByBooking, since bookingId may not be
    // reliably populated on every cancellation record.
    const cancellations = await cancellationModel
      .find({ tnr: normalizedTnr })
      .lean();

    const savedInvoice = await invoiceModel.findOne({ tnr: normalizedTnr }).lean();

    let invoice;
    if (!savedInvoice) {
      invoice = buildInvoiceView(booking, tour, cancellations);
    } else {
      invoice = syncInvoiceWithBooking(savedInvoice, booking, tour, cancellations);
      if (invoice) {
        // Keep the saved doc's synced values up to date too, so any other
        // code path reading straight from invoiceModel sees the same data.
        await invoiceModel.findOneAndUpdate(
          { tnr: normalizedTnr },
          { $set: invoice },
          { new: false },
        );
      }
    }

    return res.status(200).json({
      success: true,
      invoice, // null if advance not yet paid
    });
  } catch (error) {
    console.error("getBookingInvoice error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while building invoice",
      error: error.message,
    });
  }
};
// PUT /api/tour/invoice/:tnr
// Saves the admin's edited invoice into the SEPARATE invoice collection —
// tourBookingModel is never touched by this.
const updateBookingInvoice = async (req, res) => {
  try {
    const { tnr } = req.params;
    const { invoice } = req.body;

    if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Valid 6-character TNR is required",
      });
    }

    if (!invoice || typeof invoice !== "object") {
      return res.status(400).json({
        success: false,
        message: "Invoice data is required",
      });
    }

    const normalizedTnr = tnr.trim().toUpperCase();

    const booking = await tourBookingModel.findOne({ tnr: normalizedTnr });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found with this TNR",
      });
    }

    if (!booking.invoiceNumber) {
      return res.status(400).json({
        success: false,
        message: "Cannot edit invoice before advance is paid",
      });
    }

    const tour = await tourModel.findById(booking.tourId).lean();

    // ← ADDED: fetch cancellations, same as getBookingInvoice does
    const cancellations = await cancellationModel
      .find({ tnr: normalizedTnr })
      .lean();

    const freshAuto =
      buildInvoiceView(booking.toObject ? booking.toObject() : booking, tour, cancellations) || {
        items: [],
        payments: [],
      };

    // ...rest stays exactly the same

    // Any auto item/payment whose value the admin actually changed gets
    // frozen (sourceRef cleared) so it stops auto-syncing from now on.
    const frozenInvoice = freezeEditedEntries(invoice, freshAuto);

    // Any auto sourceRef that existed in freshAuto but is MISSING from the
    // admin's saved item/payment list was deliberately removed — track it
    // so future syncs never regenerate it again.
    const incomingItemRefs = new Set(
      (frozenInvoice.items || []).map((i) => i.sourceRef).filter(Boolean),
    );
    const incomingPaymentRefs = new Set(
      (frozenInvoice.payments || []).map((p) => p.sourceRef).filter(Boolean),
    );

    const newlyDeletedRefs = [
      ...freshAuto.items.filter((i) => !incomingItemRefs.has(i.sourceRef)).map((i) => i.sourceRef),
      ...freshAuto.payments.filter((p) => !incomingPaymentRefs.has(p.sourceRef)).map((p) => p.sourceRef),
    ];

    const existing = await invoiceModel.findOne({ tnr: normalizedTnr }).lean();
    const deletedSourceRefs = Array.from(
      new Set([...(existing?.deletedSourceRefs || []), ...newlyDeletedRefs]),
    );

    const saved = await invoiceModel.findOneAndUpdate(
      { tnr: normalizedTnr },
      {
        ...frozenInvoice,
        tnr: normalizedTnr,
        bookingId: booking._id,
        invoiceNumber: booking.invoiceNumber,
        deletedSourceRefs,
      },
      { upsert: true, new: true, runValidators: true },
    );

    return res.status(200).json({
      success: true,
      message: "Invoice saved successfully",
      invoice: saved,
    });
  } catch (error) {
    console.error("updateBookingInvoice error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while saving invoice",
      error: error.message,
    });
  }
};

// DELETE /api/tour/invoice/:tnr
// Removes the saved (edited) invoice document. Does NOT touch
// tourBookingModel at all — invoiceNumber stays exactly as it is.
// After this, GET /api/tour/invoice/:tnr goes back to auto-calculating
// the invoice fresh from travellers/tourData, same as before any edit.
const deleteBookingInvoice = async (req, res) => {
  try {
    const { tnr } = req.params;

    if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Valid 6-character TNR is required",
      });
    }

    const normalizedTnr = tnr.trim().toUpperCase();

    const deleted = await invoiceModel.findOneAndDelete({ tnr: normalizedTnr });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "No saved edit found for this invoice",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Saved invoice edit removed — reverted to auto-calculated",
    });
  } catch (error) {
    console.error("deleteBookingInvoice error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting invoice",
      error: error.message,
    });
  }
};

const tourList = async (req, res) => {
  try {
    const tours = await tourModel
      .find({})
      .sort({
        // 1. lastBookingDate year (descending) – newest year first
        lastBookingDate: -1,
        // 2. same year la irundha createdAt newest first
        createdAt: -1,
      })
      .lean();

    res.json({
      success: true,
      total: tours.length,
      tours,
    });
  } catch (error) {
    console.error("Error in tourList:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch all tours",
      error: error.message,
    });
  }
};

const loginTour = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email === process.env.TOUR_EMAIL &&
      password === process.env.TOUR_PASSWORD
    ) {
      const token = jwt.sign(email + password, process.env.JWT_SECRET);
      return res.json({
        success: true,
        token,
        message: "Tour login successful",
      });
    }

    res.json({
      success: false,
      message: "Invalid credentials",
    });
  } catch (error) {
    console.error("Tour login error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

const bookingsTour = async (req, res) => {
  try {
    // Get the tourId from the URL parameter
    const tourId = req.params.tourId;

    if (!tourId) {
      return res
        .status(400)
        .json({ success: false, message: "Tour ID is missing" });
    }

    const bookings = await tourBookingModel
      .find({ tourId })
      .populate({
        path: "userId",
        model: "user",
        select: "-password",
      })
      .populate({
        path: "tourId",
        model: "tour",
      });

    res.json({
      success: true,
      total: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


const bookingComplete = async (req, res) => {
  try {
    const { tnr, tourId } = req.body;

    if (!tnr) {
      return res.status(400).json({
        success: false,
        message: "TNR is missing. Please provide a valid TNR.",
      });
    }

    if (!tourId) {
      return res.status(400).json({
        success: false,
        message: "Tour ID is missing. Please provide a valid tour ID.",
      });
    }

    // 1. Fetch booking by TNR (case-insensitive)
    const booking = await tourBookingModel.findOne({
      tnr: tnr.trim().toUpperCase(),
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "No booking found with the provided TNR.",
      });
    }

    // 2. Ensure the booking belongs to this tour
    if (booking.tourId.toString() !== tourId) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to modify this booking. It belongs to another tour.",
      });
    }

    // 3. Check if already marked as completed
    if (booking.isBookingCompleted) {
      return res.json({
        success: false,
        message: "This booking is already marked as completed.",
      });
    }

    // 4. Check cancellation conditions
    const allTravellersCancelledValid = booking.travellers.every(
      (traveller) =>
        (traveller.cancelled?.byTraveller === true &&
          traveller.cancelled?.byAdmin === true) ||
        (traveller.cancelled?.byAdmin === true &&
          traveller.cancelled?.byTraveller !== true),
    );

    if (!allTravellersCancelledValid) {
      // 5. Check for travellers with only traveller cancellation (pending approval)
      const travellerCancellationIssues = booking.travellers.filter(
        (traveller) =>
          traveller.cancelled?.byTraveller === true &&
          traveller.cancelled?.byAdmin !== true,
      );

      if (travellerCancellationIssues.length > 0) {
        const cancelledTravellersList = travellerCancellationIssues
          .map((t) => `${t.firstName || "Unnamed"} ${t.lastName || ""}`)
          .join(", ");

        return res.json({
          success: false,
          message: `Cancellation request pending for traveller(s): ${cancelledTravellersList}`,
        });
      }

      // 6. Payment + Receipt checks (only if not all travellers meet cancellation conditions)
      const { advance, balance } = booking.payment || {};
      const { receipts } = booking;

      // Advance checks
      if (!advance?.paid) {
        return res.json({
          success: false,
          message: "Advance payment has not been made.",
        });
      }
      if (!advance?.paymentVerified) {
        return res.json({
          success: false,
          message: "Advance payment is pending verification.",
        });
      }
      if (!receipts?.advanceReceiptSent) {
        return res.json({
          success: false,
          message: "Advance receipt has not been sent.",
        });
      }

      // Balance checks
      if (!balance?.paid) {
        return res.json({
          success: false,
          message: "Balance payment has not been made.",
        });
      }
      if (!balance?.paymentVerified) {
        return res.json({
          success: false,
          message: "Balance payment is pending verification.",
        });
      }
      if (!receipts?.balanceReceiptSent) {
        return res.json({
          success: false,
          message: "Balance receipt has not been sent.",
        });
      }

      if (booking.isTripCompleted) {
        return res.json({
          success: false,
          message: "Modified receipt has not been sent.",
        });
      }
    }

    // 7. Mark booking as completed
    booking.isBookingCompleted = true;
    booking.bookingCompletedAt = new Date();

    await booking.save({ validateModifiedOnly: true });

    return res.json({
      success: true,
      message: "Booking marked as completed successfully.",
      booking: {
        tnr: booking.tnr,
        isBookingCompleted: booking.isBookingCompleted,
        bookingCompletedAt: booking.bookingCompletedAt,
        // Add only necessary fields — avoid sending full sensitive data
      },
    });
  } catch (error) {
    console.error("bookingComplete error:", error);
    return res.json({
      success: false,
      message: `An unexpected error occurred: ${error.message}`,
    });
  }

};


const TaskBookingComplete = async (req, res) => {
  try {
    const { tnr } = req.body;

    if (!tnr) {
      return res.status(400).json({
        success: false,
        message: "TNR is required.",
      });
    }

    // Find booking by TNR (case-insensitive)
    const booking = await tourBookingModel.findOne({
      tnr: tnr.trim().toUpperCase(),
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found with this TNR.",
      });
    }

    if (booking.isBookingCompleted) {
      return res.json({
        success: false,
        message: "This booking is already marked as completed.",
      });
    }

    const allTravellersCancelledValid = booking.travellers.every(
      (traveller) =>
        (traveller.cancelled?.byTraveller === true &&
          traveller.cancelled?.byAdmin === true) ||
        (traveller.cancelled?.byAdmin === true &&
          traveller.cancelled?.byTraveller !== true),
    );

    if (!allTravellersCancelledValid) {
      const travellerCancellationIssues = booking.travellers.filter(
        (traveller) =>
          traveller.cancelled?.byTraveller === true &&
          traveller.cancelled?.byAdmin !== true,
      );

      if (travellerCancellationIssues.length > 0) {
        const cancelledTravellersList = travellerCancellationIssues
          .map((t) => `${t.firstName || "Unnamed"} ${t.lastName || ""}`)
          .join(", ");

        return res.json({
          success: false,
          message: `Cancellation request pending for traveller(s): ${cancelledTravellersList}`,
        });
      }

      const { advance, balance } = booking.payment || {};
      const { receipts } = booking;

      if (!advance?.paid) {
        return res.json({
          success: false,
          message: "Advance payment not made.",
        });
      }
      if (!advance?.paymentVerified) {
        return res.json({
          success: false,
          message: "Advance payment not verified.",
        });
      }
      if (!receipts?.advanceReceiptSent) {
        return res.json({
          success: false,
          message: "Advance receipt not sent.",
        });
      }

      if (!balance?.paid) {
        return res.json({
          success: false,
          message: "Balance payment not made.",
        });
      }
      if (!balance?.paymentVerified) {
        return res.json({
          success: false,
          message: "Balance payment not verified.",
        });
      }
      if (!receipts?.balanceReceiptSent) {
        return res.json({
          success: false,
          message: "Balance receipt not sent.",
        });
      }

      if (booking.isTripCompleted) {
        return res.json({
          success: false,
          message: "Modified receipt pending.",
        });
      }
    }

    // Mark as completed
    booking.isBookingCompleted = true;
    booking.bookingCompletedAt = new Date();

    await booking.save({ validateModifiedOnly: true });

    return res.status(200).json({
      success: true,
      message: "Booking marked as completed successfully.",
      booking: {
        tnr: booking.tnr,
        isBookingCompleted: booking.isBookingCompleted,
        bookingCompletedAt: booking.bookingCompletedAt,
        // Include only safe/minimal fields needed by frontend
      },
    });
  } catch (error) {
    console.error("TaskBookingComplete error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while completing booking.",
      error: error.message,
    });
  }
};
const markOfflineAdvancePaid = async (req, res) => {
  try {
    const { tnr, tourId } = req.body;

    if (!tnr) {
      return res.status(400).json({
        success: false,
        message: "TNR is required",
      });
    }

    if (!tourId) {
      return res.status(400).json({
        success: false,
        message: "tourId is required",
      });
    }

    // Fetch booking by TNR (case-insensitive lookup)
    const normalizedTnr = tnr.trim().toUpperCase();
    const booking = await tourBookingModel.findOne({
      tnr: normalizedTnr,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found with this TNR",
      });
    }

    // Ensure booking belongs to the selected tour
    if (booking.tourId.toString() !== tourId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to modify this booking",
      });
    }

    // 1. Only offline bookings
    if (booking.bookingType !== "offline") {
      return res.status(400).json({
        success: false,
        message: "Only offline bookings can be marked as advance paid",
      });
    }

    // 2. Cancellation checks – whole-booking + individual level
    const totalTravellers = booking.travellers.length;
    if (totalTravellers === 0) {
      return res.status(400).json({
        success: false,
        message: "No travellers found in booking",
      });
    }

    // Count various cancellation states
    const pendingTravellerCancellationCount = booking.travellers.filter(
      (t) =>
        t.cancelled?.byTraveller === true && t.cancelled?.byAdmin === false,
    ).length;

    const approvedByAdminCount = booking.travellers.filter(
      (t) => t.cancelled?.byTraveller === true && t.cancelled?.byAdmin === true,
    ).length;

    const rejectedByAdminCount = booking.travellers.filter(
      (t) => t.cancelled?.byAdmin === true,
    ).length;

    // NEW CONDITION: Even if ONE traveller has pending cancellation request
    if (pendingTravellerCancellationCount >= 1) {
      return res.status(400).json({
        success: false,
        message:
          "Some travellers have requested cancellation. Cannot mark advance as paid until resolved.",
      });
    }

    // A. All travellers fully cancelled + approved by admin
    if (approvedByAdminCount === totalTravellers) {
      return res.status(400).json({
        success: false,
        message:
          "Booking already cancelled by traveller and approved by admin, cannot proceed",
      });
    }

    // B. All travellers rejected by admin
    if (rejectedByAdminCount === totalTravellers) {
      return res.status(400).json({
        success: false,
        message: "Booking already rejected by admin",
      });
    }

    // 3. Payment checks
    const { advance, balance } = booking.payment;

    if (advance?.paid && balance?.paid) {
      return res.status(400).json({
        success: false,
        message: "Advance and balance are already completed",
      });
    }

    if (advance?.paid) {
      return res.status(400).json({
        success: false,
        message: "Advance payment is already marked as completed",
      });
    }

    // 4. Mark advance as paid
    booking.payment.advance.paid = true;
    booking.payment.advance.paymentVerified = true;
    booking.payment.advance.paidAt = new Date();

    await booking.save({ validateModifiedOnly: true });

    return res.status(200).json({
      success: true,
      message: "Offline booking advance marked as paid successfully",
      booking: {
        tnr: booking.tnr,
        _id: booking._id, // optional – keep if frontend still needs it
        tourId: booking.tourId,
        bookingType: booking.bookingType,
        payment: booking.payment,
        // ... add other fields you want to return
      },
    });
  } catch (error) {
    console.error("markOfflineAdvancePaid error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
const markOfflineBalancePaid = async (req, res) => {
  try {
    const { tnr, tourId } = req.body;

    if (!tnr) {
      return res.status(400).json({
        success: false,
        message: "TNR is required",
      });
    }

    if (!tourId) {
      return res.status(400).json({
        success: false,
        message: "tourId is required",
      });
    }

    // Fetch booking by TNR (case-insensitive)
    const normalizedTnr = tnr.trim().toUpperCase();
    const booking = await tourBookingModel.findOne({
      tnr: normalizedTnr,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found with this TNR",
      });
    }

    // Ensure the booking belongs to the selected tour
    if (booking.tourId.toString() !== tourId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to modify this booking",
      });
    }

    // 1. Check if booking type is offline
    if (booking.bookingType !== "offline") {
      return res.status(400).json({
        success: false,
        message: "Only offline bookings can be marked as balance paid",
      });
    }

    // 2. Check cancellation conditions
    const allTravellersCancelledValid = booking.travellers.every(
      (traveller) =>
        (traveller.cancelled?.byTraveller === true &&
          traveller.cancelled?.byAdmin === true) ||
        (traveller.cancelled?.byAdmin === true &&
          traveller.cancelled?.byTraveller !== true),
    );

    if (!allTravellersCancelledValid) {
      // 3. Check for travellers with only traveller cancellation (pending approval)
      const travellerCancellationIssues = booking.travellers.filter(
        (traveller) =>
          traveller.cancelled?.byTraveller === true &&
          traveller.cancelled?.byAdmin !== true,
      );

      if (travellerCancellationIssues.length > 0) {
        const cancelledTravellersList = travellerCancellationIssues
          .map(
            (t) =>
              `Traveller name: ${t.firstName || "Unnamed"} ${t.lastName || ""}`,
          )
          .join(", ");

        return res.status(400).json({
          success: false,
          message: `Cancellation in request for the traveller: ${cancelledTravellersList}. Resolve before marking balance paid.`,
        });
      }

      // 4. Payment checks (only if not all travellers meet cancellation conditions)
      const { advance, balance } = booking.payment;

      if (advance?.paid && balance?.paid) {
        return res.status(400).json({
          success: false,
          message: "Advance and balance are already completed",
        });
      }

      if (balance?.paid) {
        return res.status(400).json({
          success: false,
          message: "Balance payment is already marked as completed",
        });
      }

      // Ensure advance is paid, verified, and advance receipt sent
      if (!advance?.paid || !advance?.paymentVerified) {
        return res.status(400).json({
          success: false,
          message:
            "Advance payment must be paid and verified before marking balance as paid",
        });
      }

      if (!booking.receipts?.advanceReceiptSent) {
        return res.status(400).json({
          success: false,
          message:
            "Advance receipt must be sent before marking balance as paid",
        });
      }
    }

    // 5. Mark balance as paid
    booking.payment.balance.paid = true;
    booking.payment.balance.paymentVerified = true;
    booking.payment.balance.paidAt = new Date();

    await booking.save({ validateModifiedOnly: true });

    return res.status(200).json({
      success: true,
      message: "Offline booking balance marked as paid successfully",
      booking: {
        tnr: booking.tnr,
        // Include only necessary fields (avoid sending full sensitive data)
        tourId: booking.tourId,
        bookingType: booking.bookingType,
        payment: booking.payment,
        receipts: booking.receipts,
      },
    });
  } catch (error) {
    console.error("markOfflineBalancePaid error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

// Update traveller-specific data in a booking
const updateTraveller = async (req, res) => {
  try {
    const { bookingId, travellerId, trainSeats, flightSeats, staffRemarks } =
      req.body;

    const updatedBooking = await tourBookingModel.findOneAndUpdate(
      { _id: bookingId, "travellers._id": travellerId },
      {
        $set: {
          "travellers.$.trainSeats": trainSeats,
          "travellers.$.flightSeats": flightSeats,
          "travellers.$.staffRemarks": staffRemarks,
        },
      },
      { new: true },
    );

    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking or traveller not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Traveller details updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error updating traveller details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// New Controller Function
const tourDashboard = async (req, res) => {
  try {
    // Get the tourId from the URL parameter
    const tourId = req.params.tourId;

    if (!tourId) {
      return res.status(400).json({
        success: false,
        message: "tourId is required",
      });
    }

    // Fetch all bookings for the specified tourId
    const bookings = await tourBookingModel.find({ tourId });

    if (!bookings || bookings.length === 0) {
      // You can decide whether to send a 404 or a 200 with an empty array
      return res.status(200).json({
        success: true,
        data: {
          totalEarnings: 0,
          totalTravellers: 0,
          totalUsers: 0,
          bookings: [],
        },
      });
    }

    let totalEarnings = 0;
    let totalTravellers = 0;
    let uniqueUsers = new Set();

    bookings.forEach((booking) => {
      if (booking.payment?.advance?.paid && booking.payment?.balance?.paid) {
        totalEarnings +=
          booking.payment.advance.amount + booking.payment.balance.amount;
      }
      if (Array.isArray(booking.travellers)) {
        totalTravellers += booking.travellers.length;
      }
      if (booking.userId) {
        uniqueUsers.add(booking.userId.toString());
      }
    });

    res.json({
      success: true,
      data: {
        totalEarnings,
        totalTravellers,
        totalUsers: uniqueUsers.size,
        bookings,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const tourProfile = async (req, res) => {
  try {
    const { tourId } = req.params; // Get tourId from URL parameters

    if (!tourId) {
      return res.status(400).json({
        success: false,
        message: "Tour ID is missing from the URL.",
      });
    }

    const tourProfileData = await tourModel
      .findById(tourId)
      .select("-password");

    if (!tourProfileData) {
      return res.status(404).json({
        success: false,
        message: "Tour profile not found.",
      });
    }

    res.status(200).json({
      success: true,
      tourProfileData,
    });
  } catch (error) {
    console.error("tourProfile error:", error);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred.",
    });
  }
};

// const updateTourProfile = async (req, res) => {
//   try {
//     const { tourId } = req.body; // Get tourId from the request body
//     if (!tourId) {
//       return res.json({ success: false, message: "Tour ID is missing" });
//     }

//     const tour = await tourModel.findById(tourId);
//     if (!tour) {
//       return res.json({ success: false, message: "Tour not found" });
//     }

//     // 1. Destructure and get files
//     const { titleImage, mapImage, galleryImages } = req.files || {};

//     // 2. Image upload helper
//     const uploadImage = async (file) => {
//       const result = await cloudinary.uploader.upload(file.path, {
//         resource_type: "image",
//       });
//       return result.secure_url;
//     };

//     let updateFields = {};

//     // 3. Process images
//     if (titleImage) {
//       updateFields.titleImage = await uploadImage(titleImage[0]);
//     }
//     if (mapImage) {
//       updateFields.mapImage = await uploadImage(mapImage[0]);
//     }
//     if (galleryImages) {
//       if (galleryImages.length !== 3) {
//         return res.json({
//           success: false,
//           message: "Please upload exactly 3 gallery images",
//         });
//       }
//       updateFields.galleryImages = await Promise.all(
//         galleryImages.map((img) => uploadImage(img)),
//       );
//     }

//     // 4. Get and parse all body fields, including nested ones
//     const {
//       title,
//       batch,
//       duration,
//       price,
//       destination,
//       sightseeing,
//       itinerary,
//       includes,
//       excludes,
//       trainDetails,
//       flightDetails,
//       lastBookingDate,
//       completedTripsCount,
//       available,
//       advanceAmount,
//       addons,
//       boardingPoints,
//       deboardingPoints,
//       remarks,
//       variantPackage,
//       gst, // New field: GST percentage
//     } = req.body;

//     // 5. Use existing data as a fallback for calculations
//     let parsedPrice = tour.price;
//     if (price) {
//       try {
//         parsedPrice = JSON.parse(price);
//         updateFields.price = parsedPrice;
//       } catch {
//         return res.json({ success: false, message: "Invalid JSON in price" });
//       }
//     }

//     let parsedAdvanceAmount = tour.advanceAmount;
//     if (advanceAmount) {
//       try {
//         parsedAdvanceAmount = JSON.parse(advanceAmount);
//         updateFields.advanceAmount = parsedAdvanceAmount;
//       } catch {
//         return res.json({
//           success: false,
//           message: "Invalid JSON in advanceAmount",
//         });
//       }
//     }

//     if (gst !== undefined && gst !== "") {
//       const parsedGst = Number(gst);
//       if (isNaN(parsedGst) || parsedGst < 0) {
//         return res.json({ success: false, message: "Invalid GST value" });
//       }
//       updateFields.gst = parsedGst;
//     }

//     // 6. Recalculate balances for main tour using the most current data

//     // 6. Recalculate balances for main tour using the most current data
//     if (parsedPrice && parsedAdvanceAmount) {
//       const adultAdvance = Number(parsedAdvanceAmount.adult) || 0;
//       const childAdvance = Number(parsedAdvanceAmount.child) || 0;

//       updateFields.balanceDouble =
//         Number(parsedPrice.doubleSharing) - adultAdvance;
//       updateFields.balanceTriple =
//         Number(parsedPrice.tripleSharing) - adultAdvance;
//       updateFields.balanceChildWithBerth =
//         Number(parsedPrice.childWithBerth || 0) - childAdvance;
//       updateFields.balanceChildWithoutBerth =
//         Number(parsedPrice.childWithoutBerth || 0) - childAdvance;
//     }

//     // 7. Handle variantPackage array
//     if (variantPackage) {
//       try {
//         const parsedVariantPackage = JSON.parse(variantPackage);
//         if (!Array.isArray(parsedVariantPackage)) {
//           return res.json({
//             success: false,
//             message: "variantPackage must be an array",
//           });
//         }

//         // Validate and process each variant package
//         updateFields.variantPackage = parsedVariantPackage.map((variant) => {
//           // Initialize defaults
//           const variantPrice = variant.price || {};
//           const variantAdvanceAmount = variant.advanceAmount || {};

//           // Calculate balances for this variant
//           const adultAdvance = Number(variantAdvanceAmount.adult) || 0;
//           const childAdvance = Number(variantAdvanceAmount.child) || 0;

//           return {
//             ...variant,
//             balanceDouble:
//               Number(variantPrice.doubleSharing || 0) - adultAdvance,
//             balanceTriple:
//               Number(variantPrice.tripleSharing || 0) - adultAdvance,
//             balanceChildWithBerth:
//               Number(variantPrice.childWithBerth || 0) - childAdvance,
//             balanceChildWithoutBerth:
//               Number(variantPrice.childWithoutBerth || 0) - childAdvance,
//             // Ensure nested arrays are properly formatted
//             destination: Array.isArray(variant.destination)
//               ? variant.destination
//               : [],
//             sightseeing: Array.isArray(variant.sightseeing)
//               ? variant.sightseeing
//               : [],
//             itinerary: Array.isArray(variant.itinerary)
//               ? variant.itinerary
//               : [],
//             includes: Array.isArray(variant.includes) ? variant.includes : [],
//             excludes: Array.isArray(variant.excludes) ? variant.excludes : [],
//             trainDetails: Array.isArray(variant.trainDetails)
//               ? variant.trainDetails.map((train) => ({
//                 trainNo: train.trainNo || "",
//                 trainName: train.trainName || "",
//                 fromCode: train.fromCode || "",
//                 fromStation: train.fromStation || "",
//                 toCode: train.toCode || "",
//                 toStation: train.toStation || "",
//                 class: train.class || "",
//                 departureTime: train.departureTime || "",
//                 arrivalTime: train.arrivalTime || "",
//                 ticketOpenDate: train.ticketOpenDate || null,
//               }))
//               : [],
//             flightDetails: Array.isArray(variant.flightDetails)
//               ? variant.flightDetails.map((flight) => ({
//                 airline: flight.airline || "",
//                 flightNo: flight.flightNo || "",
//                 fromCode: flight.fromCode || "",
//                 fromAirport: flight.fromAirport || "",
//                 toCode: flight.toCode || "",
//                 toAirport: flight.toAirport || "",
//                 class: flight.class || "",
//                 departureTime: flight.departureTime || "",
//                 arrivalTime: flight.arrivalTime || "",
//               }))
//               : [],
//             addons: Array.isArray(variant.addons)
//               ? variant.addons.map((addon) => ({
//                 name: addon.name || "",
//                 amount: Number(addon.amount) || 0,
//               }))
//               : [],
//             boardingPoints: Array.isArray(variant.boardingPoints)
//               ? variant.boardingPoints.map((bp) => ({
//                 stationCode: bp.stationCode || "",
//                 stationName: bp.stationName || "",
//               }))
//               : [],
//             deboardingPoints: Array.isArray(variant.deboardingPoints)
//               ? variant.deboardingPoints.map((dp) => ({
//                 stationCode: dp.stationCode || "",
//                 stationName: dp.stationName || "",
//               }))
//               : [],
//           };
//         });
//       } catch {
//         return res.json({
//           success: false,
//           message: "Invalid JSON in variantPackage",
//         });
//       }
//     }

//     // 8. Update other fields
//     if (title) updateFields.title = title;
//     if (remarks) updateFields.remarks = remarks;
//     if (batch) updateFields.batch = batch;
//     if (lastBookingDate) updateFields.lastBookingDate = lastBookingDate;
//     if (typeof available !== "undefined") updateFields.available = available;

//     if (duration) {
//       try {
//         const parsed = JSON.parse(duration);
//         const days = Number(parsed.days);
//         const nights = Number(parsed.nights);
//         if (isNaN(days) || isNaN(nights)) {
//           return res.json({
//             success: false,
//             message: "Invalid duration format",
//           });
//         }
//         updateFields.duration = { days, nights };
//       } catch {
//         return res.json({
//           success: false,
//           message: "Invalid JSON in duration",
//         });
//       }
//     }

//     if (completedTripsCount) {
//       const trips = Number(completedTripsCount);
//       if (isNaN(trips) || trips < 0) {
//         return res.json({
//           success: false,
//           message: "Invalid completedTripsCount",
//         });
//       }
//       updateFields.completedTripsCount = trips;
//     }

//     // 9. Handle all optional arrays
//     const optionalArrays = {
//       destination,
//       sightseeing,
//       itinerary,
//       includes,
//       excludes,
//       trainDetails,
//       flightDetails,
//       addons,
//       boardingPoints,
//       deboardingPoints,
//     };

//     for (let key in optionalArrays) {
//       if (optionalArrays[key]) {
//         try {
//           const parsedArray = JSON.parse(optionalArrays[key]);
//           if (!Array.isArray(parsedArray)) throw new Error();

//           if (key === "addons") {
//             updateFields[key] = parsedArray.map((a) => ({
//               name: a.name || "",
//               amount: Number(a.amount) || 0,
//             }));
//           } else if (key === "boardingPoints" || key === "deboardingPoints") {
//             updateFields[key] = parsedArray.map((a) => ({
//               stationCode: a.stationCode || "",
//               stationName: a.stationName || "",
//             }));
//           } else {
//             updateFields[key] = parsedArray;
//           }
//         } catch {
//           return res.json({
//             success: false,
//             message: `Invalid JSON in ${key}`,
//           });
//         }
//       }
//     }

//     // 10. Final update
//     await tourModel.findByIdAndUpdate(tourId, { $set: updateFields });

//     res.json({ success: true, message: "Tour updated successfully" });
//   } catch (error) {
//     console.error("Update Tour Error:", error);
//     res.json({ success: false, message: error.message });
//   }
// };

const updateTourProfile = async (req, res) => {
  try {
    const { tourId } = req.body; // Get tourId from the request body
    if (!tourId) {
      return res.json({ success: false, message: "Tour ID is missing" });
    }

    const tour = await tourModel.findById(tourId);
    if (!tour) {
      return res.json({ success: false, message: "Tour not found" });
    }

    // 1. Destructure and get files
    const { titleImage, mapImage, galleryImages } = req.files || {};

    // 2. Image upload helper
    const uploadImage = async (file) => {
      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: "image",
      });
      return result.secure_url;
    };

    let updateFields = {};

    // 3. Process images
    if (titleImage) {
      updateFields.titleImage = await uploadImage(titleImage[0]);
    }
    if (mapImage) {
      updateFields.mapImage = await uploadImage(mapImage[0]);
    }
    if (galleryImages) {
      if (galleryImages.length !== 3) {
        return res.json({
          success: false,
          message: "Please upload exactly 3 gallery images",
        });
      }
      updateFields.galleryImages = await Promise.all(
        galleryImages.map((img) => uploadImage(img)),
      );
    }

    // 4. Get and parse all body fields, including nested ones
    const {
      title,
      batch,
      duration,
      price,
      destination,
      sightseeing,
      itinerary,
      includes,
      excludes,
      trainDetails,
      flightDetails,
      lastBookingDate,
      completedTripsCount,
      available,
      advanceAmount,
      addons,
      boardingPoints,
      deboardingPoints,
      remarks,
      variantPackage,
      gst, // GST percentage
    } = req.body;

    // ── NEW: helper to parse train/flight addons sub-array ──
    const parseAddonsArray = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr.map((a) => ({
        name: a.name || "",
        amount: Number(a.amount) || 0,
      }));
    };

    // 5. Use existing data as a fallback for calculations
    let parsedPrice = tour.price;
    if (price) {
      try {
        parsedPrice = JSON.parse(price);
        updateFields.price = parsedPrice;
      } catch {
        return res.json({ success: false, message: "Invalid JSON in price" });
      }
    }

    let parsedAdvanceAmount = tour.advanceAmount;
    if (advanceAmount) {
      try {
        parsedAdvanceAmount = JSON.parse(advanceAmount);
        updateFields.advanceAmount = parsedAdvanceAmount;
      } catch {
        return res.json({
          success: false,
          message: "Invalid JSON in advanceAmount",
        });
      }
    }

    if (gst !== undefined && gst !== "") {
      const parsedGst = Number(gst);
      if (isNaN(parsedGst) || parsedGst < 0) {
        return res.json({ success: false, message: "Invalid GST value" });
      }
      updateFields.gst = parsedGst;
    }

    // 6. Recalculate balances for main tour using the most current data
    if (parsedPrice && parsedAdvanceAmount) {
      const adultAdvance = Number(parsedAdvanceAmount.adult) || 0;
      const childAdvance = Number(parsedAdvanceAmount.child) || 0;

      updateFields.balanceDouble =
        Number(parsedPrice.doubleSharing) - adultAdvance;
      updateFields.balanceTriple =
        Number(parsedPrice.tripleSharing) - adultAdvance;
      updateFields.balanceChildWithBerth =
        Number(parsedPrice.childWithBerth || 0) - childAdvance;
      updateFields.balanceChildWithoutBerth =
        Number(parsedPrice.childWithoutBerth || 0) - childAdvance;
    }

    // 7. Handle variantPackage array
    if (variantPackage) {
      try {
        const parsedVariantPackage = JSON.parse(variantPackage);
        if (!Array.isArray(parsedVariantPackage)) {
          return res.json({
            success: false,
            message: "variantPackage must be an array",
          });
        }

        // Validate and process each variant package
        updateFields.variantPackage = parsedVariantPackage.map((variant) => {
          // Initialize defaults
          const variantPrice = variant.price || {};
          const variantAdvanceAmount = variant.advanceAmount || {};

          // Calculate balances for this variant
          const adultAdvance = Number(variantAdvanceAmount.adult) || 0;
          const childAdvance = Number(variantAdvanceAmount.child) || 0;

          return {
            ...variant,
            balanceDouble:
              Number(variantPrice.doubleSharing || 0) - adultAdvance,
            balanceTriple:
              Number(variantPrice.tripleSharing || 0) - adultAdvance,
            balanceChildWithBerth:
              Number(variantPrice.childWithBerth || 0) - childAdvance,
            balanceChildWithoutBerth:
              Number(variantPrice.childWithoutBerth || 0) - childAdvance,
            // Ensure nested arrays are properly formatted
            destination: Array.isArray(variant.destination)
              ? variant.destination
              : [],
            sightseeing: Array.isArray(variant.sightseeing)
              ? variant.sightseeing
              : [],
            itinerary: Array.isArray(variant.itinerary)
              ? variant.itinerary
              : [],
            includes: Array.isArray(variant.includes) ? variant.includes : [],
            excludes: Array.isArray(variant.excludes) ? variant.excludes : [],
            trainDetails: Array.isArray(variant.trainDetails)
              ? variant.trainDetails.map((train) => ({
                trainNo: train.trainNo || "",
                trainName: train.trainName || "",
                fromCode: train.fromCode || "",
                fromStation: train.fromStation || "",
                toCode: train.toCode || "",
                toStation: train.toStation || "",
                class: train.class || "",
                departureTime: train.departureTime || "",
                arrivalTime: train.arrivalTime || "",
                ticketOpenDate: train.ticketOpenDate || null,
                tripType: train.tripType || "", // ← NEW
                addons: parseAddonsArray(train.addons),
              }))
              : [],
            flightDetails: Array.isArray(variant.flightDetails)
              ? variant.flightDetails.map((flight) => ({
                airline: flight.airline || "",
                flightNo: flight.flightNo || "",
                fromCode: flight.fromCode || "",
                fromAirport: flight.fromAirport || "",
                toCode: flight.toCode || "",
                toAirport: flight.toAirport || "",
                class: flight.class || "",
                departureTime: flight.departureTime || "",
                arrivalTime: flight.arrivalTime || "",
                // ── NEW: flight-wise addons for this variant ──
                addons: parseAddonsArray(flight.addons),
              }))
              : [],
            addons: Array.isArray(variant.addons)
              ? variant.addons.map((addon) => ({
                name: addon.name || "",
                amount: Number(addon.amount) || 0,
              }))
              : [],
            boardingPoints: Array.isArray(variant.boardingPoints)
              ? variant.boardingPoints.map((bp) => ({
                stationCode: bp.stationCode || "",
                stationName: bp.stationName || "",
              }))
              : [],
            deboardingPoints: Array.isArray(variant.deboardingPoints)
              ? variant.deboardingPoints.map((dp) => ({
                stationCode: dp.stationCode || "",
                stationName: dp.stationName || "",
              }))
              : [],
          };
        });
      } catch {
        return res.json({
          success: false,
          message: "Invalid JSON in variantPackage",
        });
      }
    }

    // 8. Update other fields
    if (title) updateFields.title = title;
    if (remarks) updateFields.remarks = remarks;
    if (batch) updateFields.batch = batch;
    if (lastBookingDate) updateFields.lastBookingDate = lastBookingDate;
    if (typeof available !== "undefined") updateFields.available = available;

    if (duration) {
      try {
        const parsed = JSON.parse(duration);
        const days = Number(parsed.days);
        const nights = Number(parsed.nights);
        if (isNaN(days) || isNaN(nights)) {
          return res.json({
            success: false,
            message: "Invalid duration format",
          });
        }
        updateFields.duration = { days, nights };
      } catch {
        return res.json({
          success: false,
          message: "Invalid JSON in duration",
        });
      }
    }

    if (completedTripsCount) {
      const trips = Number(completedTripsCount);
      if (isNaN(trips) || trips < 0) {
        return res.json({
          success: false,
          message: "Invalid completedTripsCount",
        });
      }
      updateFields.completedTripsCount = trips;
    }

    // 9. Handle all optional arrays
    const optionalArrays = {
      destination,
      sightseeing,
      itinerary,
      includes,
      excludes,
      trainDetails,
      flightDetails,
      addons,
      boardingPoints,
      deboardingPoints,
    };

    for (let key in optionalArrays) {
      if (optionalArrays[key]) {
        try {
          const parsedArray = JSON.parse(optionalArrays[key]);
          if (!Array.isArray(parsedArray)) throw new Error();

          if (key === "addons") {
            updateFields[key] = parsedArray.map((a) => ({
              name: a.name || "",
              amount: Number(a.amount) || 0,
            }));
          } else if (key === "boardingPoints" || key === "deboardingPoints") {
            updateFields[key] = parsedArray.map((a) => ({
              stationCode: a.stationCode || "",
              stationName: a.stationName || "",
            }));
          } else if (key === "trainDetails" || key === "flightDetails") {
            // ── if/else — attach addons; tripType carries through via spread ──
            updateFields[key] = parsedArray.map((item) => ({
              ...item, // tripType already included here automatically
              addons: parseAddonsArray(item.addons),
            }));
          } else {
            updateFields[key] = parsedArray;
          }
        } catch {
          return res.json({
            success: false,
            message: `Invalid JSON in ${key}`,
          });
        }
      }
    }

    // 10. Final update
    await tourModel.findByIdAndUpdate(tourId, { $set: updateFields });

    res.json({ success: true, message: "Tour updated successfully" });
  } catch (error) {
    console.error("Update Tour Error:", error);
    res.json({ success: false, message: error.message });
  }
};

const markAdvanceReceiptSent = async (req, res) => {
  try {
    const { tnr, tourId } = req.body;

    if (!tnr) {
      return res.status(400).json({
        success: false,
        message: "TNR is required",
      });
    }

    if (!tourId) {
      return res.status(400).json({
        success: false,
        message: "tourId is required",
      });
    }

    // Fetch booking by TNR (case-insensitive)
    const booking = await tourBookingModel.findOne({
      tnr: tnr.trim().toUpperCase(),
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found with this TNR",
      });
    }

    // Ensure booking belongs to the selected tour
    if (booking.tourId.toString() !== tourId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to modify this booking",
      });
    }

    // Mark receipt as sent
    booking.receipts.advanceReceiptSent = true;
    booking.receipts.advanceReceiptSentAt = new Date();

    await booking.save({ validateModifiedOnly: true });

    return res.status(200).json({
      success: true,
      message: "Advance receipt marked as sent successfully",
      booking: {
        tnr: booking.tnr,
        receipts: booking.receipts,
        // Add only necessary fields — avoid exposing full booking data
      },
    });
  } catch (error) {
    console.error("markAdvanceReceiptSent error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const taskMarkAdvanceReceiptSent = async (req, res) => {
  try {
    const { tnr } = req.body;

    if (!tnr) {
      return res.status(400).json({
        success: false,
        message: "TNR is required",
      });
    }

    // Find booking by TNR (case-insensitive)
    const booking = await tourBookingModel.findOne({
      tnr: tnr.trim().toUpperCase(),
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found with this TNR",
      });
    }

    // Optional: you could add authorization check here if needed
    // e.g. check if req.user can modify this booking

    booking.receipts.advanceReceiptSent = true;
    booking.receipts.advanceReceiptSentAt = new Date();

    await booking.save({ validateModifiedOnly: true });

    return res.status(200).json({
      success: true,
      message: "Advance receipt marked as sent successfully",
      booking: {
        tnr: booking.tnr,
        _id: booking._id, // optional - include if frontend still needs it
        receipts: booking.receipts,
        // You can add more fields if needed
      },
    });
  } catch (error) {
    console.error("taskMarkAdvanceReceiptSent error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
const markBalanceReceiptSent = async (req, res) => {
  try {
    const { tnr, tourId } = req.body;

    if (!tnr) {
      return res.status(400).json({
        success: false,
        message: "TNR is required",
      });
    }

    if (!tourId) {
      return res.status(400).json({
        success: false,
        message: "tourId is required",
      });
    }

    // Fetch booking by TNR (case-insensitive)
    const booking = await tourBookingModel.findOne({
      tnr: tnr.trim().toUpperCase(),
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found with this TNR",
      });
    }

    // Ensure booking belongs to the selected tour
    if (booking.tourId.toString() !== tourId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to modify this booking",
      });
    }

    // Mark receipt as sent
    booking.receipts.balanceReceiptSent = true;
    booking.receipts.balanceReceiptSentAt = new Date();

    await booking.save({ validateModifiedOnly: true });

    return res.status(200).json({
      success: true,
      message: "Balance receipt marked as sent successfully",
      booking: {
        tnr: booking.tnr,
        receipts: booking.receipts,
        // Add only necessary fields — avoid exposing full booking data
      },
    });
  } catch (error) {
    console.error("markBalanceReceiptSent error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const taskMarkBalanceReceiptSent = async (req, res) => {
  try {
    const { tnr } = req.body;

    if (!tnr) {
      return res.status(400).json({
        success: false,
        message: "TNR is required",
      });
    }

    // Find booking by TNR (case-insensitive lookup)
    const booking = await tourBookingModel.findOne({
      tnr: tnr.trim().toUpperCase(),
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found with this TNR",
      });
    }

    // Optional: Add authorization check if needed
    // Example: if (req.user.role !== 'admin' && booking.userId.toString() !== req.user._id.toString()) { ... }

    // Mark receipt as sent
    booking.receipts.balanceReceiptSent = true;
    booking.receipts.balanceReceiptSentAt = new Date();

    await booking.save({ validateModifiedOnly: true });

    return res.status(200).json({
      success: true,
      message: "Balance receipt marked as sent successfully",
      booking: {
        tnr: booking.tnr,
        receipts: booking.receipts,
        // Add only necessary fields — avoid sending full sensitive data
      },
    });
  } catch (error) {
    console.error("taskMarkBalanceReceiptSent error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
const viewTourBalance = async (req, res) => {
  try {
    const { tnr } = req.params;

    // ─── Validate TNR ──────────────────────────────────────────────────
    if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Valid 6-character TNR is required",
      });
    }

    const normalizedTnr = tnr.trim().toUpperCase();

    // ─── Find booking by TNR ───────────────────────────────────────────
    const booking = await tourBookingModel
      .findOne({ tnr: normalizedTnr })
      .select("tnr payment.advance payment.balance adminRemarks")
      .lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking found with TNR: ${normalizedTnr}`,
      });
    }

    // ─── Response ──────────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      message: "Booking balance details retrieved successfully",
      data: {
        tnr: booking.tnr, // return the canonical uppercase version
        bookingId: booking._id.toString(), // optional: include for internal reference
        advance: booking.payment?.advance || {},
        balance: booking.payment?.balance || {},
        adminRemarks: booking.adminRemarks || [],
      },
    });
  } catch (error) {
    console.error("Error retrieving tour balance:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const viewTourAdvance = async (req, res) => {
  try {
    const { tnr } = req.params; // TNR from URL params

    // Validate TNR
    if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Valid 6-character TNR is required",
      });
    }

    const normalizedTnr = tnr.trim().toUpperCase();

    // Find booking by TNR, select only needed fields
    const booking = await tourBookingModel
      .findOne({ tnr: normalizedTnr })
      .select(
        "payment.advance payment.balance advanceAdminRemarks isTripCompleted",
      )
      .lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found with this TNR",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Advance payment details and remarks retrieved successfully",
      data: {
        tnr: normalizedTnr,
        advance: {
          amount: booking.payment.advance.amount,
          paid: booking.payment.advance.paid,
          paymentVerified: booking.payment.advance.paymentVerified,
          paidAt: booking.payment.advance.paidAt || null,
        },
        advanceAdminRemarks: booking.advanceAdminRemarks || [],
        isTripCompleted: booking.isTripCompleted,
      },
    });
  } catch (error) {
    console.error("Error retrieving tour advance details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


const updateTourBalance = async (req, res) => {
  try {
    const { tnr } = req.params;
    const { updates } = req.body;

    if (!tnr || tnr.trim().length !== 6) {
      return res.status(400).json({ success: false, message: "Valid 6-character TNR required" });
    }

    const normalizedTnr = tnr.trim().toUpperCase();
    const booking = await tourBookingModel.findOne({ tnr: normalizedTnr });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    let totalChange = 0;

    for (const update of updates) {
      const amount = Number(update.amount);
      if (isNaN(amount)) continue;

      // CORRECT LOGIC
      booking.payment.balance.amount += amount;   // + ve = add, - ve = minus
      totalChange += amount;

      booking.adminRemarks.push({
        remark: (update.remarks || "").trim() || "No remark",
        amount: amount,
        addedAt: new Date(),
      });
    }

    booking.isTripCompleted = true;
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Balance updated with correct calculation",
      data: {
        tnr: booking.tnr,
        advance: booking.payment?.advance || {},
        balance: booking.payment?.balance || {},
        adminRemarks: booking.adminRemarks || [],
      }
    });
  } catch (error) {
    console.error("updateTourBalance error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateTourAdvance = async (req, res) => {
  try {
    const { tnr } = req.params;
    const { updates } = req.body;

    if (!tnr || tnr.trim().length !== 6) {
      return res.status(400).json({ success: false, message: "Valid 6-character TNR required" });
    }

    const normalizedTnr = tnr.trim().toUpperCase();
    const booking = await tourBookingModel.findOne({ tnr: normalizedTnr });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    let totalShifted = 0;

    for (const update of updates) {
      const amount = Number(update.amount);
      if (isNaN(amount) || amount <= 0) continue;

      // ✅ FINAL CORRECT LOGIC
      booking.payment.advance.amount -= amount;   // Advance - 
      booking.payment.balance.amount += amount;   // Balance +

      totalShifted += amount;

      booking.advanceAdminRemarks.push({
        remark: (update.remarks || "").trim() || "Amount shifted from advance to balance",
        amount: amount,
        addedAt: new Date(),
      });
    }

    booking.isTripCompleted = true;
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Amount shifted successfully",
      data: {
        tnr: booking.tnr,
        advance: booking.payment?.advance || {},
        balance: booking.payment?.balance || {},
        advanceAdminRemarks: booking.advanceAdminRemarks || [],
      }
    });
  } catch (error) {
    console.error("updateTourAdvance error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// ====================== IMPROVED UPDATE BALANCE REMARK ======================
const updateBalanceRemark = async (req, res) => {
  try {
    const { tnr } = req.params;
    const { remarkIndex, remark, amount } = req.body;

    if (!tnr || tnr.trim().length !== 6) {
      return res.status(400).json({ success: false, message: "Valid 6-character TNR required" });
    }
    if (typeof remarkIndex !== "number" || remarkIndex < 0) {
      return res.status(400).json({ success: false, message: "Valid remarkIndex required" });
    }

    const normalizedTnr = tnr.trim().toUpperCase();
    const booking = await tourBookingModel.findOne({ tnr: normalizedTnr });

    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    if (!booking.adminRemarks || !booking.adminRemarks[remarkIndex]) {
      return res.status(404).json({ success: false, message: "Remark not found" });
    }

    const oldAmount = Number(booking.adminRemarks[remarkIndex].amount) || 0;
    const newAmount = Number(amount) || 0;

    // Update remark
    booking.adminRemarks[remarkIndex].remark = (remark || "").trim() || "No remark";
    booking.adminRemarks[remarkIndex].amount = newAmount;
    booking.adminRemarks[remarkIndex].addedAt = new Date(); // optional: update timestamp

    // AUTO RECALCULATE BALANCE
    const difference = newAmount - oldAmount;
    booking.payment.balance.amount += difference;

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Balance remark updated and balance recalculated",
      adminRemarks: booking.adminRemarks,
      currentBalance: booking.payment.balance.amount
    });
  } catch (error) {
    console.error("updateBalanceRemark error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== IMPROVED UPDATE ADVANCE REMARK ======================
// ====================== FINAL CORRECT updateAdvanceRemark ======================
const updateAdvanceRemark = async (req, res) => {
  try {
    const { tnr } = req.params;
    const { remarkIndex, remark, amount } = req.body;

    if (!tnr || tnr.trim().length !== 6) {
      return res.status(400).json({ success: false, message: "Valid 6-character TNR required" });
    }
    if (typeof remarkIndex !== "number" || remarkIndex < 0) {
      return res.status(400).json({ success: false, message: "Valid remarkIndex required" });
    }

    const normalizedTnr = tnr.trim().toUpperCase();
    const booking = await tourBookingModel.findOne({ tnr: normalizedTnr });

    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    if (!booking.advanceAdminRemarks || !booking.advanceAdminRemarks[remarkIndex]) {
      return res.status(404).json({ success: false, message: "Remark not found" });
    }

    const oldAmount = Number(booking.advanceAdminRemarks[remarkIndex].amount) || 0;
    const newAmount = Number(amount) || 0;

    // Update remark
    booking.advanceAdminRemarks[remarkIndex].remark = (remark || "").trim() || "No remark";
    booking.advanceAdminRemarks[remarkIndex].amount = newAmount;
    booking.advanceAdminRemarks[remarkIndex].addedAt = new Date();

    // ✅ DIFFERENCE CALCULATION (VERY IMPORTANT)
    const difference = newAmount - oldAmount;

    booking.payment.advance.amount -= difference;   // Advance adjust
    booking.payment.balance.amount += difference;   // Balance adjust

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Advance remark updated with correct recalculation",
      data: {
        tnr: booking.tnr,
        advance: booking.payment?.advance || {},
        balance: booking.payment?.balance || {},
        advanceAdminRemarks: booking.advanceAdminRemarks || [],
      }
    });
  } catch (error) {
    console.error("updateAdvanceRemark error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== DELETE BALANCE REMARK ======================
const deleteBalanceRemark = async (req, res) => {
  try {
    const { tnr } = req.params;
    const { remarkIndex } = req.body;

    if (!tnr || tnr.trim().length !== 6) {
      return res.status(400).json({ success: false, message: "Valid TNR required" });
    }
    if (typeof remarkIndex !== "number" || remarkIndex < 0) {
      return res.status(400).json({ success: false, message: "Valid remarkIndex required" });
    }

    const normalizedTnr = tnr.trim().toUpperCase();
    const booking = await tourBookingModel.findOne({ tnr: normalizedTnr });

    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    if (!booking.adminRemarks || !booking.adminRemarks[remarkIndex]) {
      return res.status(404).json({ success: false, message: "Remark not found" });
    }

    const deletedAmount = Number(booking.adminRemarks[remarkIndex].amount) || 0;

    booking.adminRemarks.splice(remarkIndex, 1);

    // AUTO RECALCULATE BALANCE
    booking.payment.balance.amount -= deletedAmount;

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Balance remark deleted and balance recalculated",
      adminRemarks: booking.adminRemarks,
      currentBalance: booking.payment.balance.amount
    });
  } catch (error) {
    console.error("deleteBalanceRemark error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== DELETE ADVANCE REMARK ======================
const deleteAdvanceRemark = async (req, res) => {
  try {
    const { tnr } = req.params;
    const { remarkIndex } = req.body;

    if (!tnr || tnr.trim().length !== 6) {
      return res.status(400).json({ success: false, message: "Valid TNR required" });
    }
    if (typeof remarkIndex !== "number" || remarkIndex < 0) {
      return res.status(400).json({ success: false, message: "Valid remarkIndex required" });
    }

    const normalizedTnr = tnr.trim().toUpperCase();
    const booking = await tourBookingModel.findOne({ tnr: normalizedTnr });

    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    if (!booking.advanceAdminRemarks || !booking.advanceAdminRemarks[remarkIndex]) {
      return res.status(404).json({ success: false, message: "Remark not found" });
    }

    const deletedAmount = Number(booking.advanceAdminRemarks[remarkIndex].amount) || 0;

    booking.advanceAdminRemarks.splice(remarkIndex, 1);

    // Reverse the shift
    booking.payment.advance.amount += deletedAmount;   // Add back to Advance
    booking.payment.balance.amount -= deletedAmount;   // Remove from Balance

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Advance remark deleted with correct recalculation",
      data: {
        tnr: booking.tnr,
        advance: booking.payment?.advance || {},
        balance: booking.payment?.balance || {},
        advanceAdminRemarks: booking.advanceAdminRemarks || [],
      }
    });
  } catch (error) {
    console.error("deleteAdvanceRemark error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateModifyReceipt = async (req, res) => {
  try {
    const { tnr, tourId } = req.body;

    if (!tnr) {
      return res.status(400).json({
        success: false,
        message: "TNR is required",
      });
    }

    if (!tourId) {
      return res.status(400).json({
        success: false,
        message: "tourId is required",
      });
    }

    // Fetch booking by TNR (case-insensitive lookup)
    const booking = await tourBookingModel.findOne({
      tnr: tnr.trim().toUpperCase(),
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found with this TNR",
      });
    }

    // Ensure booking belongs to the selected tour
    if (booking.tourId.toString() !== tourId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to modify this booking",
      });
    }

    // Set isTripCompleted to false (mark as not completed)
    booking.isTripCompleted = false;

    // Save the updated booking
    await booking.save({ validateModifiedOnly: true });

    return res.status(200).json({
      success: true,
      message: "Trip completion status marked as not completed successfully",
      booking: {
        tnr: booking.tnr,
        isTripCompleted: booking.isTripCompleted,
        // Only return minimal necessary fields
      },
    });
  } catch (error) {
    console.error("updateModifyReceipt error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const taskMarkModifyReceipt = async (req, res) => {
  try {
    const { tnr } = req.body;

    if (!tnr) {
      return res.status(400).json({
        success: false,
        message: "TNR is required",
      });
    }

    // Find booking by TNR (case-insensitive lookup)
    const booking = await tourBookingModel.findOne({
      tnr: tnr.trim().toUpperCase(),
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found with this TNR",
      });
    }

    // Optional: Add authorization check if needed
    // Example: if (req.user.role !== 'admin' && booking.userId.toString() !== req.user._id.toString()) {
    //   return res.status(403).json({ success: false, message: "Unauthorized" });
    // }

    // Set isTripCompleted to false (meaning trip is not completed yet)
    booking.isTripCompleted = false;

    await booking.save({ validateModifiedOnly: true });

    return res.status(200).json({
      success: true,
      message: "Trip completion status marked as not completed successfully",
      booking: {
        tnr: booking.tnr,
        isTripCompleted: booking.isTripCompleted,
        // Include only necessary fields — avoid sending full sensitive data
      },
    });
  } catch (error) {
    console.error("taskMarkModifyReceipt error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

// controllers/tourController.js
const viewBooking = async (req, res) => {
  try {
    const { tnr } = req.params; // Changed from bookingId to tnr
    const tToken = req.header("ttoken");

    if (!tToken) {
      return res
        .status(401)
        .json({ success: false, message: "Not Authorized." });
    }

    let decoded;
    try {
      decoded = jwt.verify(tToken, process.env.JWT_SECRET);
    } catch (error) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token." });
    }

    // Validate TNR format (6 uppercase letters/digits)
    if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing TNR (must be exactly 6 characters)",
      });
    }

    const normalizedTnr = tnr.trim().toUpperCase();

    // Find booking by TNR
    const booking = await tourBookingModel
      .findOne({ tnr: normalizedTnr })
      .populate("userId", "name email mobile")
      .lean();

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found with this TNR" });
    }

    // Fetch full tour data
    const tour = await tourModel.findById(booking.tourId).lean();
    if (!tour) {
      return res
        .status(404)
        .json({ success: false, message: "Tour not found" });
    }

    booking.tourFull = tour;

    // ── Live-correct AND persist gvCancellationPool / irctcCancellationPool ──
    // booking.gvCancellationPool/irctcCancellationPool as stored can be
    // stale or wrong for bookings approved under the old (buggy)
    // approveCancellation logic, which double-counted the pool. The
    // cancellationModel records themselves are the authoritative source
    // (each approved record's gvCancellationAmount/irctcCancellationAmount
    // already represents the full cumulative total up to that approval —
    // see approveCancellation's fix comment). So on every view, recompute
    // from the latest APPROVED cancellation record, WRITE the corrected
    // value back to tourBookingModel (self-healing — every other endpoint
    // that reads the booking directly, e.g. Tour Bookings list, also sees
    // the fix from then on), and reflect it in this response too.
    const approvedCancellations = await cancellationModel
      .find({ tnr: normalizedTnr, approvedBy: true })
      .lean();

    console.log("DEBUG normalizedTnr:", normalizedTnr);
    console.log("DEBUG approvedCancellations count:", approvedCancellations.length);
    console.log("DEBUG approvedCancellations:", JSON.stringify(approvedCancellations, null, 2));

    if (approvedCancellations.length > 0) {
      const latestApproved = approvedCancellations.reduce((best, c) => {
        if (!best) return c;
        const cDate = new Date(
          c.approvedAt || c.createdAt || c.updatedAt || 0,
        ).getTime();
        const bestDate = new Date(
          best.approvedAt || best.createdAt || best.updatedAt || 0,
        ).getTime();
        return cDate > bestDate ? c : best;
      }, null);

      const correctGv =
        (Number(latestApproved.gvCancellationAmount) || 0) +
        (Number(latestApproved.remarksAmount) || 0);
      const correctIrctc = Number(latestApproved.irctcCancellationAmount) || 0;

      if (
        Number(booking.gvCancellationPool || 0) !== correctGv ||
        Number(booking.irctcCancellationPool || 0) !== correctIrctc
      ) {
        await tourBookingModel.updateOne(
          { tnr: normalizedTnr },
          {
            $set: {
              gvCancellationPool: correctGv,
              irctcCancellationPool: correctIrctc,
            },
          },
        );
      }

      booking.gvCancellationPool = correctGv;
      booking.irctcCancellationPool = correctIrctc;
    }

    return res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("viewBooking error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching booking details.",
      error: error.message,
    });
  }
};
const getCancellationsByBooking = async (req, res) => {
  try {
    const { tnr } = req.params;
    const { limit = 20 } = req.query;

    // Validate TNR
    if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Valid 6-character TNR is required",
      });
    }

    const normalizedTnr = tnr.trim().toUpperCase();

    const numericLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);

    // Find cancellations for this booking using TNR
    const cancellations = await cancellationModel
      .find({ tnr: normalizedTnr }) // ← changed from bookingId to tnr
      .sort({ createdAt: -1 })
      .limit(numericLimit)
      .lean();

    return res.status(200).json({
      success: true,
      count: cancellations.length,
      results: cancellations,
    });
  } catch (err) {
    console.error("getCancellationsByBooking error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching cancellations",
    });
  }
};
// const updateBookingBalance = async (req, res) => {
//   try {
//     const { bookingId } = req.params;
//     const { updates = {} } = req.body;

//     console.log(`[updateBookingBalance] Processing bookingId: ${bookingId}`);
//     console.log(
//       `[updateBookingBalance] Received updates keys:`,
//       Object.keys(updates),
//     );

//     if (!mongoose.Types.ObjectId.isValid(bookingId)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid bookingId" });
//     }

//     const original = await tourBookingModel
//       .findById(bookingId)
//       .populate("tourId")
//       .lean();

//     if (!original) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Booking not found" });
//     }

//     const tour = original.tourId;

//     console.log(
//       `[ORIGINAL] Advance paid: ${original.payment?.advance?.paid}, amount: ${original.payment?.advance?.amount || 0}`,
//     );
//     console.log(
//       `[ORIGINAL] Balance paid: ${original.payment?.balance?.paid}, amount: ${original.payment?.balance?.amount || 0}`,
//     );

//     // Early blocks
//     const hasPendingTravellerCancellation = original.travellers.some(
//       (t) => t.cancelled?.byTraveller === true && !t.cancelled?.byAdmin,
//     );

//     if (hasPendingTravellerCancellation) {
//       console.log("[BLOCK] Pending traveller cancellation → blocked");
//       return res.status(400).json({
//         success: false,
//         message: "Pending traveller cancellation request.",
//         reason: "pending_traveller_cancellation",
//       });
//     }

//     if (original.cancellationRequest === true) {
//       console.log("[BLOCK] Pending full cancellation → blocked");
//       return res.status(400).json({
//         success: false,
//         message: "Pending full cancellation request.",
//         reason: "pending_full_cancellation",
//       });
//     }

//     const advancePaid = original.payment?.advance?.paid ?? false;
//     const balancePaid = original.payment?.balance?.paid ?? false;
//     const fullyPaid = advancePaid && balancePaid;

//     // ────────────────────────────────────────────────
//     // CASE 5: Fully paid → only boarding/deboarding
//     // ────────────────────────────────────────────────
//     if (fullyPaid) {
//       console.log(
//         "[CASE 5] Fully paid → restricting to boarding/deboarding only",
//       );

//       const restrictedTravellers = original.travellers.map((origT, i) => {
//         const updT = updates.travellers?.[i];
//         if (!updT) return origT;
//         return {
//           ...origT,
//           boardingPoint: updT.boardingPoint || origT.boardingPoint,
//           deboardingPoint: updT.deboardingPoint || origT.deboardingPoint,
//         };
//       });

//       const merged = { ...original, travellers: restrictedTravellers };

//       // ────────────────────────────────────────────────────────────────
//       // FIXED: Do NOT use ...merged here — it copies the original _id!
//       // Explicitly list only the fields we want (new _id will be auto-generated)
//       // ────────────────────────────────────────────────────────────────
//       const manageDoc = {
//         userId: merged.userId,
//         tourId: tour._id,
//         bookingId: original._id,

//         userData: merged.userData,
//         tourData: merged.tourData,
//         travellers: merged.travellers,
//         contact: merged.contact,
//         billingAddress: merged.billingAddress,
//         bookingType: merged.bookingType,
//         payment: merged.payment,
//         receipts: merged.receipts,

//         isTripCompleted: merged.isTripCompleted,
//         isBookingCompleted: merged.isBookingCompleted,
//         cancelled: merged.cancelled,

//         bookingDate: merged.bookingDate,
//         gvCancellationPool: merged.gvCancellationPool,
//         irctcCancellationPool: merged.irctcCancellationPool,

//         adminRemarks: merged.adminRemarks || [],

//         manageBooking: true,
//         approvedBy: false,
//         raisedBy: true,
//         raisedAt: new Date(Date.now() + 5.5 * 60 * 60 * 1000),

//         // If you have this flag:
//         travellersReduced: false, // or your logic — usually false in fully-paid case

//         updatableAdvance: original.payment.advance.amount || 0,
//         updatedAdvance: original.payment.advance.amount || 0,
//         updatableBalance: original.payment.balance.amount || 0,
//         updatedBalance: original.payment.balance.amount || 0,
//       };

//       const saved = await manageBookingModel.create(manageDoc);

//       console.log(
//         "[CASE 5] Created manage doc with locked values → new _id:",
//         saved._id,
//       );

//       return res.status(201).json({
//         success: true,
//         message: "Manage booking raised (boarding/deboarding only)",
//         warning: "Fully paid → package & addons locked",
//         data: saved,
//       });
//     }
//     // Merge updates + preserve cancelled flags
//     const mergedTravellers = (updates.travellers || original.travellers).map(
//       (newT) => {
//         const origT = original.travellers.find(
//           (o) => o._id?.toString() === newT._id?.toString(),
//         );
//         if (origT?.cancelled) {
//           return { ...newT, cancelled: { ...origT.cancelled } };
//         }
//         return newT;
//       },
//     );

//     const merged = {
//       ...original,
//       ...updates,
//       travellers: mergedTravellers,
//       contact: { ...original.contact, ...(updates.contact || {}) },
//       billingAddress: {
//         ...original.billingAddress,
//         ...(updates.billingAddress || {}),
//       },
//     };

//     const getPackage = (t) => {
//       return t.packageType === "main"
//         ? tour
//         : (tour.variantPackage?.[t.variantPackageIndex] ?? tour);
//     };

//     const activeTravellers = merged.travellers.filter(
//       (t) => !t.cancelled?.byTraveller && !t.cancelled?.byAdmin,
//     );

//     // Identify newly added travellers
//     const originalTravellerIds = new Set(
//       original.travellers.filter((t) => t._id).map((t) => t._id.toString()),
//     );

//     const newAddedTravellers = activeTravellers.filter((t) => {
//       if (!t._id) return true;
//       return !originalTravellerIds.has(t._id.toString());
//     });

//     console.log(
//       `[NEW TRAVELLERS DETECTED] Count: ${newAddedTravellers.length}`,
//     );

//     // ────────────────────────────────────────────────
//     // Calculate A, B, D, T
//     // ────────────────────────────────────────────────
//     let A = 0,
//       B = 0,
//       D = 0,
//       T = 0; // T = total current full package price of active travellers

//     activeTravellers.forEach((t) => {
//       const pkg = getPackage(t);
//       let advanceVal = 0;
//       let balanceVal = 0;
//       let fullPackagePrice = 0;

//       if (t.sharingType === "double" || t.sharingType === "triple") {
//         advanceVal = pkg?.advanceAmount?.adult || 0;
//         balanceVal =
//           t.sharingType === "double"
//             ? pkg?.balanceDouble || 0
//             : pkg?.balanceTriple || 0;
//         fullPackagePrice =
//           t.sharingType === "double"
//             ? pkg?.price?.doubleSharing || 0
//             : pkg?.price?.tripleSharing || 0;
//       } else if (
//         t.sharingType === "withBerth" ||
//         t.sharingType === "withoutBerth"
//       ) {
//         advanceVal = pkg?.advanceAmount?.child || 0;
//         balanceVal =
//           t.sharingType === "withBerth"
//             ? pkg?.balanceChildWithBerth || 0
//             : pkg?.balanceChildWithoutBerth || 0;
//         fullPackagePrice =
//           t.sharingType === "withBerth"
//             ? pkg?.price?.childWithBerth || 0
//             : pkg?.price?.childWithoutBerth || 0;
//       }

//       A += advanceVal;
//       B += balanceVal;
//       D += t.selectedAddon?.price || 0;
//       T += fullPackagePrice;
//     });

//     // ────────────────────────────────────────────────
//     // Calculate J & K → only new travellers
//     // ────────────────────────────────────────────────
//     let J = 0,
//       K = 0;

//     newAddedTravellers.forEach((t) => {
//       const pkg = getPackage(t);
//       let packagePrice = 0;

//       if (t.sharingType === "double")
//         packagePrice = pkg?.price?.doubleSharing || 0;
//       else if (t.sharingType === "triple")
//         packagePrice = pkg?.price?.tripleSharing || 0;
//       else if (t.sharingType === "withBerth")
//         packagePrice = pkg?.price?.childWithBerth || 0;
//       else if (t.sharingType === "withoutBerth")
//         packagePrice = pkg?.price?.childWithoutBerth || 0;

//       J += packagePrice;
//       K += t.selectedAddon?.price || 0;
//     });

//     // ────────────────────────────────────────────────
//     // Other variables
//     // ────────────────────────────────────────────────
//     const C = original.payment?.advance?.amount || 0;
//     const I = original.payment?.balance?.amount || 0;

//     const E = (merged.adminRemarks || [])
//       .filter((r) => (r.amount || 0) > 0)
//       .reduce((sum, r) => sum + (r.amount || 0), 0);

//     const F = Math.abs(
//       (merged.adminRemarks || [])
//         .filter((r) => (r.amount || 0) < 0)
//         .reduce((sum, r) => sum + (r.amount || 0), 0),
//     );

//     const G = merged.gvCancellationPool || 0;
//     const H = merged.irctcCancellationPool || 0;

//     // ────────────────────────────────────────────────
//     // Logging — added T
//     // ────────────────────────────────────────────────
//     console.log("┌──────────────────────────────────────────────┐");
//     console.log("│         CALCULATED VARIABLES                 │");
//     console.log("├──────────────────────────────────────────────┤");
//     console.log(`│ A (total advance)     = ₹${A}`);
//     console.log(`│ B (total balance portion) = ₹${B}`);
//     console.log(`│ T (total full package price) = ₹${T}`);
//     console.log(`│ C (paid advance)      = ₹${C}`);
//     console.log(`│ I (paid balance)      = ₹${I}`);
//     console.log(`│ D (total addons)      = ₹${D}`);
//     console.log(`│ J (new pkg full price)= ₹${J}`);
//     console.log(`│ K (new addons)        = ₹${K}`);
//     console.log(`│ E (pos remarks)       = ₹${E}`);
//     console.log(`│ F (neg remarks abs)   = ₹${F}`);
//     console.log(`│ G (GV pool)           = ₹${G}`);
//     console.log(`│ H (IRCTC pool)        = ₹${H}`);
//     console.log("└──────────────────────────────────────────────┘");

//     const originalActiveCount = original.travellers.filter(
//       (t) => !t.cancelled?.byTraveller && !t.cancelled?.byAdmin,
//     ).length;
//     const currentActiveCount = activeTravellers.length;

//     const travellerReduced = currentActiveCount < originalActiveCount;
//     const travellerAdded = currentActiveCount > originalActiveCount;
//     const countSame = currentActiveCount === originalActiveCount;

//     console.log(
//       `[TRAVELLERS] Original active: ${originalActiveCount} → Current: ${currentActiveCount}`,
//     );
//     console.log(
//       `[CHANGE] Reduced=${travellerReduced} | Added=${travellerAdded} | Same=${countSame}`,
//     );

//     // ────────────────────────────────────────────────
//     // Calculation logic — updated Case 1 to use T instead of B
//     // ────────────────────────────────────────────────
//     let updatableAdvance = 0;
//     let updatedAdvance = 0;
//     let updatableBalance = 0;
//     let updatedBalance = 0;

//     let appliedCase = "unknown";

//     if (advancePaid && !balancePaid) {
//       if (travellerAdded) {
//         appliedCase = "Case 3 - travellers added";
//         updatableAdvance = updatedAdvance = C;
//         updatableBalance = T + D + E + G + H; // ← YOUR NEW FORMULA
//         updatedBalance = updatableBalance - (updatedAdvance + F); // ← YOUR NEW FORMULA
//       } else if (countSame) {
//         // Case 1 - same count, existing travellers edited
//         appliedCase = "Case 1 - same count (existing edited)";
//         updatableAdvance = updatedAdvance = C;
//         updatableBalance = T + D + E + G + H;
//         updatedBalance = updatableBalance - (C + F);
//       } else if (travellerReduced) {
//         appliedCase = "Case 2 - travellers reduced (advance paid)";
//         updatableAdvance = A;
//         updatedAdvance = A + D;
//         updatableBalance = B;
//         updatedBalance = B;
//       }
//     } else {
//       // No advance paid
//       appliedCase = travellerReduced
//         ? "Case 2 variant (no advance + reduced)"
//         : "Case 4";
//       updatableAdvance = A;
//       updatedAdvance = A + D;
//       updatableBalance = B;
//       updatedBalance = B;
//     }

//     console.log(`[APPLIED CASE] ${appliedCase}`);
//     console.log(`[RESULT] updatableAdvance   = ${updatableAdvance}`);
//     console.log(`[RESULT] updatedAdvance     = ${updatedAdvance}`);
//     console.log(`[RESULT] updatableBalance   = ${updatableBalance}`);
//     console.log(`[RESULT] updatedBalance     = ${updatedBalance}`);
//     // ────────────────────────────────────────────────
//     // Create manage booking document
//     // ────────────────────────────────────────────────
//     const manageDoc = {
//       userId: merged.userId,
//       tourId: tour._id,
//       bookingId: original._id,
//       userData: merged.userData,
//       tourData: merged.tourData,
//       travellers: merged.travellers,
//       contact: merged.contact,
//       billingAddress: merged.billingAddress,
//       bookingType: merged.bookingType,
//       payment: merged.payment,
//       receipts: merged.receipts,
//       isTripCompleted: merged.isTripCompleted,
//       isBookingCompleted: merged.isBookingCompleted,
//       cancelled: merged.cancelled,
//       bookingDate: merged.bookingDate,
//       gvCancellationPool: merged.gvCancellationPool,
//       irctcCancellationPool: merged.irctcCancellationPool,
//       adminRemarks: merged.adminRemarks || [],
//       manageBooking: true,
//       approvedBy: false,
//       raisedBy: true,
//       raisedAt: new Date(Date.now() + 5.5 * 60 * 60 * 1000),

//       // ────────────────────────────────────────────────────────────────
//       // travellersReduced = true ONLY when:
//       //   1. Traveller count actually reduced
//       //   2. AND (advance paid & balance unpaid) OR (both unpaid)
//       // ────────────────────────────────────────────────────────────────
//       travellersReduced:
//         travellerReduced === true &&
//         ((advancePaid && !balancePaid) || // advance paid + balance unpaid
//           (!advancePaid && !balancePaid)), // both unpaid

//       updatableAdvance,
//       updatedAdvance,
//       updatableBalance,
//       updatedBalance,
//     };

//     const saved = await manageBookingModel.create(manageDoc);

//     console.log(`[SUCCESS] Manage booking created → _id: ${saved._id}`);
//     console.log(
//       `[FLAG] travellersReduced set to: ${manageDoc.travellersReduced} (reduced=${travellerReduced}, advancePaid=${advancePaid}, balancePaid=${balancePaid})`,
//     );

//     return res.status(201).json({
//       success: true,
//       message: `Manage booking raised (${appliedCase})`,
//       warning: travellerReduced
//         ? "Traveller count reduced"
//         : travellerAdded
//           ? "New travellers added"
//           : null,
//       data: saved,
//     });
//   } catch (err) {
//     console.error("[ERROR] updateBookingBalance failed:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: err.message,
//     });
//   }
// };

const updateBookingBalance = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { updates = {} } = req.body;

    console.log(`[updateBookingBalance] Processing bookingId: ${bookingId}`);
    console.log(
      `[updateBookingBalance] Received updates keys:`,
      Object.keys(updates),
    );

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid bookingId" });
    }

    const original = await tourBookingModel
      .findById(bookingId)
      .populate("tourId")
      .lean();

    if (!original) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    const tour = original.tourId;

    console.log(
      `[ORIGINAL] Advance paid: ${original.payment?.advance?.paid}, amount: ${original.payment?.advance?.amount || 0}`,
    );
    console.log(
      `[ORIGINAL] Balance paid: ${original.payment?.balance?.paid}, amount: ${original.payment?.balance?.amount || 0}`,
    );

    // Early blocks
    const hasPendingTravellerCancellation = original.travellers.some(
      (t) => t.cancelled?.byTraveller === true && !t.cancelled?.byAdmin,
    );

    if (hasPendingTravellerCancellation) {
      console.log("[BLOCK] Pending traveller cancellation → blocked");
      return res.status(400).json({
        success: false,
        message: "Pending traveller cancellation request.",
        reason: "pending_traveller_cancellation",
      });
    }

    if (original.cancellationRequest === true) {
      console.log("[BLOCK] Pending full cancellation → blocked");
      return res.status(400).json({
        success: false,
        message: "Pending full cancellation request.",
        reason: "pending_full_cancellation",
      });
    }

    const advancePaid = original.payment?.advance?.paid ?? false;
    const balancePaid = original.payment?.balance?.paid ?? false;
    const fullyPaid = advancePaid && balancePaid;

    // ────────────────────────────────────────────────
    // CASE 5: Fully paid → only boarding/deboarding
    // ────────────────────────────────────────────────
    if (fullyPaid) {
      console.log(
        "[CASE 5] Fully paid → restricting to boarding/deboarding only",
      );

      const restrictedTravellers = original.travellers.map((origT, i) => {
        const updT = updates.travellers?.[i];
        if (!updT) return origT;
        return {
          ...origT,
          boardingPoint: updT.boardingPoint || origT.boardingPoint,
          deboardingPoint: updT.deboardingPoint || origT.deboardingPoint,
        };
      });

      const merged = { ...original, travellers: restrictedTravellers };

      // ────────────────────────────────────────────────────────────────
      // FIXED: Do NOT use ...merged here — it copies the original _id!
      // Explicitly list only the fields we want (new _id will be auto-generated)
      // ────────────────────────────────────────────────────────────────
      const manageDoc = {
        userId: merged.userId,
        tourId: tour._id,
        bookingId: original._id,

        userData: merged.userData,
        tourData: merged.tourData,
        travellers: merged.travellers,
        contact: merged.contact,
        billingAddress: merged.billingAddress,
        bookingType: merged.bookingType,
        payment: merged.payment,
        receipts: merged.receipts,

        isTripCompleted: merged.isTripCompleted,
        isBookingCompleted: merged.isBookingCompleted,
        cancelled: merged.cancelled,

        bookingDate: merged.bookingDate,
        gvCancellationPool: merged.gvCancellationPool,
        irctcCancellationPool: merged.irctcCancellationPool,

        adminRemarks: merged.adminRemarks || [],

        manageBooking: true,
        approvedBy: false,
        raisedBy: true,
        raisedAt: new Date(Date.now() + 5.5 * 60 * 60 * 1000),

        // If you have this flag:
        travellersReduced: false, // or your logic — usually false in fully-paid case

        updatableAdvance: original.payment.advance.amount || 0,
        updatedAdvance: original.payment.advance.amount || 0,
        updatableBalance: original.payment.balance.amount || 0,
        updatedBalance: original.payment.balance.amount || 0,
      };

      const saved = await manageBookingModel.create(manageDoc);

      console.log(
        "[CASE 5] Created manage doc with locked values → new _id:",
        saved._id,
      );

      return res.status(201).json({
        success: true,
        message: "Manage booking raised (boarding/deboarding only)",
        warning: "Fully paid → package & addons locked",
        data: saved,
      });
    }
    // Merge updates + preserve cancelled flags
    const mergedTravellers = (updates.travellers || original.travellers).map(
      (newT) => {
        const origT = original.travellers.find(
          (o) => o._id?.toString() === newT._id?.toString(),
        );
        if (origT?.cancelled) {
          return { ...newT, cancelled: { ...origT.cancelled } };
        }
        return newT;
      },
    );

    const merged = {
      ...original,
      ...updates,
      travellers: mergedTravellers,
      contact: { ...original.contact, ...(updates.contact || {}) },
      billingAddress: {
        ...original.billingAddress,
        ...(updates.billingAddress || {}),
      },
    };

    const getPackage = (t) => {
      return t.packageType === "main"
        ? tour
        : (tour.variantPackage?.[t.variantPackageIndex] ?? tour);
    };

    // ────────────────────────────────────────────────
    // Addon amount for a traveller — supports BOTH shapes:
    //   - OLD (flat, old bookings):        t.selectedAddon?.price
    //   - NEW (train/flight-wise, new bookings): sum of
    //         t.selectedAddons[].amount
    // Whichever is populated for that traveller is used — no
    // double counting, no change to any other part of the
    // calculation below (A, B, T, C, I, E, F, G, H, case logic,
    // manageDoc) — this ONLY changes where D and K get their
    // rupee value from.
    // ────────────────────────────────────────────────
    const getTravellerAddonTotal = (t) => {
      if (Array.isArray(t.selectedAddons) && t.selectedAddons.length > 0) {
        return t.selectedAddons.reduce(
          (sum, a) => sum + (Number(a.amount) || 0),
          0,
        );
      }
      return Number(t.selectedAddon?.price) || 0;
    };

    const activeTravellers = merged.travellers.filter(
      (t) => !t.cancelled?.byTraveller && !t.cancelled?.byAdmin,
    );

    // Identify newly added travellers
    const originalTravellerIds = new Set(
      original.travellers.filter((t) => t._id).map((t) => t._id.toString()),
    );

    const newAddedTravellers = activeTravellers.filter((t) => {
      if (!t._id) return true;
      return !originalTravellerIds.has(t._id.toString());
    });

    console.log(
      `[NEW TRAVELLERS DETECTED] Count: ${newAddedTravellers.length}`,
    );

    // ────────────────────────────────────────────────
    // Calculate A, B, D, T
    // ────────────────────────────────────────────────
    let A = 0,
      B = 0,
      D = 0,
      T = 0; // T = total current full package price of active travellers

    activeTravellers.forEach((t) => {
      const pkg = getPackage(t);
      let advanceVal = 0;
      let balanceVal = 0;
      let fullPackagePrice = 0;

      if (t.sharingType === "double" || t.sharingType === "triple") {
        advanceVal = pkg?.advanceAmount?.adult || 0;
        balanceVal =
          t.sharingType === "double"
            ? pkg?.balanceDouble || 0
            : pkg?.balanceTriple || 0;
        fullPackagePrice =
          t.sharingType === "double"
            ? pkg?.price?.doubleSharing || 0
            : pkg?.price?.tripleSharing || 0;
      } else if (
        t.sharingType === "withBerth" ||
        t.sharingType === "withoutBerth"
      ) {
        advanceVal = pkg?.advanceAmount?.child || 0;
        balanceVal =
          t.sharingType === "withBerth"
            ? pkg?.balanceChildWithBerth || 0
            : pkg?.balanceChildWithoutBerth || 0;
        fullPackagePrice =
          t.sharingType === "withBerth"
            ? pkg?.price?.childWithBerth || 0
            : pkg?.price?.childWithoutBerth || 0;
      }

      A += advanceVal;
      B += balanceVal;
      D += getTravellerAddonTotal(t);
      T += fullPackagePrice;
    });

    // ────────────────────────────────────────────────
    // Calculate J & K → only new travellers
    // ────────────────────────────────────────────────
    let J = 0,
      K = 0;

    newAddedTravellers.forEach((t) => {
      const pkg = getPackage(t);
      let packagePrice = 0;

      if (t.sharingType === "double")
        packagePrice = pkg?.price?.doubleSharing || 0;
      else if (t.sharingType === "triple")
        packagePrice = pkg?.price?.tripleSharing || 0;
      else if (t.sharingType === "withBerth")
        packagePrice = pkg?.price?.childWithBerth || 0;
      else if (t.sharingType === "withoutBerth")
        packagePrice = pkg?.price?.childWithoutBerth || 0;

      J += packagePrice;
      K += getTravellerAddonTotal(t);
    });

    // ────────────────────────────────────────────────
    // Other variables
    // ────────────────────────────────────────────────
    const C = original.payment?.advance?.amount || 0;
    const I = original.payment?.balance?.amount || 0;

    const E = (merged.adminRemarks || [])
      .filter((r) => (r.amount || 0) > 0)
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const F = Math.abs(
      (merged.adminRemarks || [])
        .filter((r) => (r.amount || 0) < 0)
        .reduce((sum, r) => sum + (r.amount || 0), 0),
    );

    const G = merged.gvCancellationPool || 0;
    const H = merged.irctcCancellationPool || 0;

    // ────────────────────────────────────────────────
    // Logging — added T
    // ────────────────────────────────────────────────
    console.log("┌──────────────────────────────────────────────┐");
    console.log("│         CALCULATED VARIABLES                 │");
    console.log("├──────────────────────────────────────────────┤");
    console.log(`│ A (total advance)     = ₹${A}`);
    console.log(`│ B (total balance portion) = ₹${B}`);
    console.log(`│ T (total full package price) = ₹${T}`);
    console.log(`│ C (paid advance)      = ₹${C}`);
    console.log(`│ I (paid balance)      = ₹${I}`);
    console.log(`│ D (total addons)      = ₹${D}`);
    console.log(`│ J (new pkg full price)= ₹${J}`);
    console.log(`│ K (new addons)        = ₹${K}`);
    console.log(`│ E (pos remarks)       = ₹${E}`);
    console.log(`│ F (neg remarks abs)   = ₹${F}`);
    console.log(`│ G (GV pool)           = ₹${G}`);
    console.log(`│ H (IRCTC pool)        = ₹${H}`);
    console.log("└──────────────────────────────────────────────┘");

    const originalActiveCount = original.travellers.filter(
      (t) => !t.cancelled?.byTraveller && !t.cancelled?.byAdmin,
    ).length;
    const currentActiveCount = activeTravellers.length;

    const travellerReduced = currentActiveCount < originalActiveCount;
    const travellerAdded = currentActiveCount > originalActiveCount;
    const countSame = currentActiveCount === originalActiveCount;

    console.log(
      `[TRAVELLERS] Original active: ${originalActiveCount} → Current: ${currentActiveCount}`,
    );
    console.log(
      `[CHANGE] Reduced=${travellerReduced} | Added=${travellerAdded} | Same=${countSame}`,
    );

    // ────────────────────────────────────────────────
    // Calculation logic — updated Case 1 to use T instead of B
    // ────────────────────────────────────────────────
    let updatableAdvance = 0;
    let updatedAdvance = 0;
    let updatableBalance = 0;
    let updatedBalance = 0;

    let appliedCase = "unknown";

    if (advancePaid && !balancePaid) {
      if (travellerAdded) {
        appliedCase = "Case 3 - travellers added";
        updatableAdvance = updatedAdvance = C;
        updatableBalance = T + D + E + G + H; // ← YOUR NEW FORMULA
        updatedBalance = updatableBalance - (updatedAdvance + F); // ← YOUR NEW FORMULA
      } else if (countSame) {
        // Case 1 - same count, existing travellers edited
        appliedCase = "Case 1 - same count (existing edited)";
        updatableAdvance = updatedAdvance = C;
        updatableBalance = T + D + E + G + H;
        updatedBalance = updatableBalance - (C + F);
      } else if (travellerReduced) {
        appliedCase = "Case 2 - travellers reduced (advance paid)";
        updatableAdvance = A;
        updatedAdvance = A + D;
        updatableBalance = B;
        updatedBalance = B;
      }
    } else {
      // No advance paid
      appliedCase = travellerReduced
        ? "Case 2 variant (no advance + reduced)"
        : "Case 4";
      updatableAdvance = A;
      updatedAdvance = A + D;
      updatableBalance = B;
      updatedBalance = B;
    }

    console.log(`[APPLIED CASE] ${appliedCase}`);
    console.log(`[RESULT] updatableAdvance   = ${updatableAdvance}`);
    console.log(`[RESULT] updatedAdvance     = ${updatedAdvance}`);
    console.log(`[RESULT] updatableBalance   = ${updatableBalance}`);
    console.log(`[RESULT] updatedBalance     = ${updatedBalance}`);
    // ────────────────────────────────────────────────
    // Create manage booking document
    // ────────────────────────────────────────────────
    const manageDoc = {
      userId: merged.userId,
      tourId: tour._id,
      bookingId: original._id,
      userData: merged.userData,
      tourData: merged.tourData,
      travellers: merged.travellers,
      contact: merged.contact,
      billingAddress: merged.billingAddress,
      bookingType: merged.bookingType,
      payment: merged.payment,
      receipts: merged.receipts,
      isTripCompleted: merged.isTripCompleted,
      isBookingCompleted: merged.isBookingCompleted,
      cancelled: merged.cancelled,
      bookingDate: merged.bookingDate,
      gvCancellationPool: merged.gvCancellationPool,
      irctcCancellationPool: merged.irctcCancellationPool,
      adminRemarks: merged.adminRemarks || [],
      manageBooking: true,
      approvedBy: false,
      raisedBy: true,
      raisedAt: new Date(Date.now() + 5.5 * 60 * 60 * 1000),

      // ────────────────────────────────────────────────────────────────
      // travellersReduced = true ONLY when:
      //   1. Traveller count actually reduced
      //   2. AND (advance paid & balance unpaid) OR (both unpaid)
      // ────────────────────────────────────────────────────────────────
      travellersReduced:
        travellerReduced === true &&
        ((advancePaid && !balancePaid) || // advance paid + balance unpaid
          (!advancePaid && !balancePaid)), // both unpaid

      updatableAdvance,
      updatedAdvance,
      updatableBalance,
      updatedBalance,
    };

    const saved = await manageBookingModel.create(manageDoc);

    console.log(`[SUCCESS] Manage booking created → _id: ${saved._id}`);
    console.log(
      `[FLAG] travellersReduced set to: ${manageDoc.travellersReduced} (reduced=${travellerReduced}, advancePaid=${advancePaid}, balancePaid=${balancePaid})`,
    );

    return res.status(201).json({
      success: true,
      message: `Manage booking raised (${appliedCase})`,
      warning: travellerReduced
        ? "Traveller count reduced"
        : travellerAdded
          ? "New travellers added"
          : null,
      data: saved,
    });
  } catch (err) {
    console.error("[ERROR] updateBookingBalance failed:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

const getManagedBookingsHistory = async (req, res) => {
  try {
    // Fetch all manageBooking documents with populated references
    const history = await manageBookingModel
      .find({})
      .populate({
        path: "userId",
        select: "name email mobile", // Only needed user fields
      })
      .populate({
        path: "tourId",
        select: "title destination startDate endDate",
      })
      .populate({
        path: "bookingId",
        select:
          "bookingDate payment.advance.amount payment.balance.amount travellers",
      })
      .sort({ createdAt: -1 }) // Latest first
      .lean(); // Use lean for performance (returns plain JS objects)

    // If no records
    if (!history || history.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No manage-booking history found.",
        data: [],
        count: 0,
      });
    }

    // Optional: Transform or enrich data if needed
    const enrichedHistory = history.map((entry) => {
      const original = entry.bookingId;

      return {
        _id: entry._id,
        raisedAt: entry.bookingDate || entry.createdAt,
        raisedBy: entry.raisedBy,
        approvedBy: entry.approvedBy,

        // User Info
        user: {
          _id: entry.userId?._id,
          name: entry.userId?.name || "Unknown",
          email: entry.userId?.email || "N/A",
          mobile: entry.userId?.mobile || "N/A",
        },

        // Tour Info
        tour: {
          _id: entry.tourId?._id,
          title: entry.tourId?.title || "Unknown Tour",
          destination: entry.tourId?.destination || "N/A",
          dates: entry.tourId
            ? `${entry.tourId.startDate} to ${entry.tourId.endDate}`
            : "N/A",
        },

        // Original Booking Reference
        originalBooking: original
          ? {
            _id: original._id,
            bookingDate: original.bookingDate,
            advancePaid: original.payment?.advance?.amount || 0,
            balanceDue: original.payment?.balance?.amount || 0,
            totalTravellers: original.travellers?.length || 0,
          }
          : null,

        // Requested Updates
        requested: {
          updatableAdvance: entry.updatableAdvance || 0,
          updatedAdvance: entry.updatedAdvance || 0,
          updatableBalance: entry.updatableBalance || 0,
          updatedBalance: entry.updatedBalance || 0,
        },

        // Admin Remarks
        adminRemarks: entry.adminRemarks || [],

        // Status
        status: entry.approvedBy
          ? "APPROVED"
          : entry.raisedBy
            ? "PENDING"
            : "DRAFT",
      };
    });

    return res.status(200).json({
      success: true,
      message: "Manage-booking history fetched successfully",
      data: enrichedHistory,
      count: enrichedHistory.length,
    });
  } catch (err) {
    console.error("getManagedBookingsHistory error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch manage-booking history",
      error: err.message,
    });
  }
};
////vinoth
// const allotRooms = async (req, res) => {
//   try {
//     const { tourId } = req.params;
//     if (!tourId || !mongoose.Types.ObjectId.isValid(tourId)) {
//       return res.status(400).json({ error: "Valid tourId is required" });
//     }

//     const objectTourId = new mongoose.Types.ObjectId(tourId);

//     const bookings = await tourBookingModel
//       .find({
//         tourId: objectTourId,
//         "cancelled.byAdmin": false,
//         "cancelled.byTraveller": false,
//       })
//       .lean();

//     if (bookings.length === 0) {
//       return res.json({
//         tourId,
//         unpaidGuests: [],
//         roomAllocations: [],
//         message: "No active bookings found for this tour.",
//       });
//     }

//     // === Separate paid and unpaid ===
//     const paidBookings = bookings.filter(
//       (b) => b.payment.advance.paid && b.payment.advance.paymentVerified,
//     );

//     const unpaidBookings = bookings.filter(
//       (b) => !b.payment.advance.paid || !b.payment.advance.paymentVerified,
//     );

//     const unpaidGuests = [];
//     unpaidBookings.forEach((booking) => {
//       booking.travellers.forEach((traveller) => {
//         if (!traveller.cancelled.byAdmin && !traveller.cancelled.byTraveller) {
//           unpaidGuests.push({
//             bookingId: booking._id.toString(),
//             ...getBasicTravelerInfo(traveller),
//           });
//         }
//       });
//     });

//     const rawRoomEntries = [];

//     // Track allocated travellers to prevent duplicates
//     const allocatedTravellerIds = new Set();

//     const createOccupant = (t, mobile) => ({
//       firstName: t.firstName,
//       lastName: t.lastName,
//       gender: t.gender,
//       mobile,
//       travellerId: t._id?.toString(),
//       sharingType: t.sharingType,
//       originalIndex: t.originalIndex, // Preserve original order
//     });

//     // === Step 1: Group by mobile number (Family/Friends - Case 6) ===
//     const mobileGroups = new Map();

//     paidBookings.forEach((booking) => {
//       const active = booking.travellers.filter(
//         (t) => !t.cancelled.byAdmin && !t.cancelled.byTraveller,
//       );
//       // Preserve original order in travellers array
//       active.forEach((t, index) => {
//         t.originalIndex = index; // Add original index for sorting later
//       });
//       const mobile = booking.contact.mobile;

//       if (!mobileGroups.has(mobile)) mobileGroups.set(mobile, []);
//       active.forEach((t) => {
//         mobileGroups.get(mobile).push({
//           traveller: t,
//           bookingId: booking._id.toString(),
//         });
//       });
//     });

//     // === Step 2: Process each mobile group ===
//     for (const [mobile, groupItems] of mobileGroups) {
//       // Sort groupItems by original traveller index to maintain order
//       groupItems.sort(
//         (a, b) => a.traveller.originalIndex - b.traveller.originalIndex,
//       );

//       const travellers = groupItems.map((i) => i.traveller);
//       const bookingIds = [...new Set(groupItems.map((i) => i.bookingId))];

//       if (travellers.length === 0) continue;

//       const sharingTypes = [...new Set(travellers.map((t) => t.sharingType))];
//       const isUniformSharing =
//         sharingTypes.length === 1 &&
//         ["double", "triple"].includes(sharingTypes[0]);

//       const isMarriedCouple =
//         travellers.length === 2 &&
//         travellers[0].gender !== travellers[1].gender &&
//         travellers.every((t) => t.sharingType === "double");

//       const rooms = [];

//       // === Husband & Wife Rule ===
//       if (isMarriedCouple) {
//         rooms.push({
//           sharingType: "double",
//           occupants: travellers.map((t) => createOccupant(t, mobile)),
//         });
//       }
//       // === Other cases: Mixed or Uniform sharing — allocate full groups in original order ===
//       else {
//         // Group by sharing type while maintaining order
//         const bySharing = {};
//         travellers.forEach((t) => {
//           const key = t.sharingType;
//           if (!bySharing[key]) bySharing[key] = [];
//           bySharing[key].push(t);
//         });

//         Object.keys(bySharing).forEach((type) => {
//           if (!["double", "triple"].includes(type)) return;

//           const list = bySharing[type];
//           const capacity = type === "double" ? 2 : 3;

//           let i = 0;
//           while (i < list.length) {
//             const remaining = list.length - i;
//             if (remaining >= capacity) {
//               const group = list.slice(i, i + capacity);
//               rooms.push({
//                 sharingType: type,
//                 occupants: group.map((t) => createOccupant(t, mobile)),
//               });
//               i += capacity;
//             } else {
//               i += remaining; // Leave remainder
//             }
//           }
//         });

//         // Add children in original order to first adult room
//         const children = travellers.filter(
//           (t) =>
//             t.sharingType === "withBerth" || t.sharingType === "withoutBerth",
//         );
//         if (children.length > 0 && rooms.length > 0) {
//           children.forEach((child) => {
//             rooms[0].occupants.push(createOccupant(child, mobile));
//           });
//           rooms.forEach((room) => {
//             const total = room.occupants.length;
//             if (total > 3) room.sharingType = "quad";
//             else if (total > 2) room.sharingType = "triple";
//           });
//         }
//       }

//       if (rooms.length > 0) {
//         rawRoomEntries.push({
//           bookingId: bookingIds[0],
//           contactMobile: mobile,
//           rooms: assignRoomNumbers(rooms),
//         });

//         rooms.forEach((room) => {
//           room.occupants.forEach((occ) => {
//             if (occ.travellerId) allocatedTravellerIds.add(occ.travellerId);
//           });
//         });
//       }
//     }

//     // === Step 3: Global pooling for remainders (preserve order within same sharing/gender) ===
//     const remainderPool = {};

//     paidBookings.forEach((booking) => {
//       booking.travellers.forEach((t, index) => {
//         if (
//           !t.cancelled.byAdmin &&
//           !t.cancelled.byTraveller &&
//           t._id &&
//           !allocatedTravellerIds.has(t._id.toString()) &&
//           ["double", "triple"].includes(t.sharingType)
//         ) {
//           t.originalIndex = index; // Preserve order
//           const key = `${t.sharingType}-${t.gender}`;
//           if (!remainderPool[key]) remainderPool[key] = [];
//           remainderPool[key].push({
//             traveller: t,
//             mobile: booking.contact.mobile,
//             bookingId: booking._id.toString(),
//           });
//         }
//       });
//     });

//     Object.keys(remainderPool).forEach((key) => {
//       const [sharingType, gender] = key.split("-");
//       const capacity = sharingType === "double" ? 2 : 3;
//       let list = remainderPool[key];
//       if (list.length === 0) return;

//       // Sort by original traveller index to keep order as much as possible
//       list.sort(
//         (a, b) => a.traveller.originalIndex - b.traveller.originalIndex,
//       );

//       const rooms = [];
//       let i = 0;
//       while (i < list.length) {
//         const take = Math.min(capacity, list.length - i);
//         const occupants = list
//           .slice(i, i + take)
//           .map((item) => createOccupant(item.traveller, item.mobile));
//         rooms.push({
//           sharingType:
//             take === capacity ? sharingType : take === 2 ? "double" : "single",
//           occupants,
//         });
//         i += take;
//       }

//       if (rooms.length > 0) {
//         rawRoomEntries.push({
//           bookingId: list[0].bookingId,
//           contactMobile: list[0].mobile,
//           rooms: assignRoomNumbers(rooms),
//         });

//         rooms.forEach((room) => {
//           room.occupants.forEach((occ) => {
//             if (occ.travellerId) allocatedTravellerIds.add(occ.travellerId);
//           });
//         });
//       }
//     });

//     // === Step 4: Final single room reduction (same gender only) ===
//     const singleRooms = [];
//     rawRoomEntries.forEach((entry, entryIndex) => {
//       entry.rooms = entry.rooms.filter((room) => {
//         if (room.sharingType === "single") {
//           singleRooms.push({
//             entryIndex,
//             room,
//             contactMobile: entry.contactMobile,
//             bookingId: entry.bookingId,
//           });
//           return false;
//         }
//         return true;
//       });
//     });

//     const tripleSingles = { male: [], female: [] };
//     const doubleSingles = { male: [], female: [] };

//     singleRooms.forEach((single) => {
//       const occupant = single.room.occupants[0];
//       const gender = occupant.gender.toLowerCase();
//       const original = occupant.sharingType;
//       if (original === "triple") tripleSingles[gender].push(single);
//       else if (original === "double") doubleSingles[gender].push(single);
//     });

//     ["male", "female"].forEach((gender) => {
//       while (
//         tripleSingles[gender].length > 0 &&
//         doubleSingles[gender].length > 0
//       ) {
//         const tripleSingle = tripleSingles[gender].pop();
//         const doubleSingle = doubleSingles[gender].pop();

//         const newRoom = {
//           sharingType: "double",
//           occupants: [
//             ...tripleSingle.room.occupants,
//             ...doubleSingle.room.occupants,
//           ],
//         };

//         rawRoomEntries[tripleSingle.entryIndex].rooms.push(newRoom);
//       }

//       tripleSingles[gender].forEach((r) =>
//         rawRoomEntries[r.entryIndex].rooms.push(r.room),
//       );
//       doubleSingles[gender].forEach((r) =>
//         rawRoomEntries[r.entryIndex].rooms.push(r.room),
//       );
//     });

//     // === Final Grouping by Mobile ===
//     const mobileMap = new Map();
//     rawRoomEntries.forEach((entry) => {
//       const mobile = entry.contactMobile || "0000000000";
//       if (!mobileMap.has(mobile)) {
//         mobileMap.set(mobile, {
//           contactMobile: mobile,
//           bookingIds: new Set(),
//           rooms: [],
//         });
//       }
//       const g = mobileMap.get(mobile);
//       g.bookingIds.add(entry.bookingId);
//       g.rooms.push(...entry.rooms);
//     });

//     const groupedByMobile = Array.from(mobileMap.values())
//       .map((g) => ({
//         contactMobile: g.contactMobile,
//         bookingIds: Array.from(g.bookingIds),
//         rooms: g.rooms.map((r, i) => ({ ...r, roomNumber: i + 1 })),
//       }))
//       .sort((a, b) => a.contactMobile.localeCompare(b.contactMobile));

//     // === Check existing finalized allocation ===
//     const existing = await tourRoomAllocationModel.findOne({
//       tourId: objectTourId,
//     });

//     if (existing && existing.isFinalized) {
//       const flat = existing.groupedByMobile.flatMap((g) =>
//         g.rooms.map((r) => ({
//           contactMobile: g.contactMobile,
//           bookingIds: g.bookingIds,
//           roomNumber: r.roomNumber,
//           sharingType: r.sharingType,
//           occupants: r.occupants.map((o) => ({
//             firstName: o.firstName,
//             lastName: o.lastName,
//             gender: o.gender,
//           })),
//         })),
//       );

//       return res.json({
//         tourId,
//         unpaidGuests,
//         roomAllocations: flat,
//         groupedByMobile: existing.groupedByMobile,
//         totalRooms: flat.length,
//         totalGroups: existing.groupedByMobile.length,
//         saved: false,
//         message: "Finalized allocation displayed with updated unpaid guests.",
//       });
//     }

//     // === Save new allocation ===
//     await tourRoomAllocationModel.findOneAndUpdate(
//       { tourId: objectTourId },
//       {
//         tourId: objectTourId,
//         groupedByMobile,
//         grouped: true,
//         isFinalized: false,
//       },
//       { upsert: true, new: true },
//     );

//     const responseRooms = groupedByMobile.flatMap((g) =>
//       g.rooms.map((r) => ({
//         contactMobile: g.contactMobile,
//         bookingIds: g.bookingIds,
//         roomNumber: r.roomNumber,
//         sharingType: r.sharingType,
//         occupants: r.occupants.map((o) => ({
//           firstName: o.firstName,
//           lastName: o.lastName,
//           gender: o.gender,
//         })),
//       })),
//     );

//     res.json({
//       tourId,
//       unpaidGuests,
//       roomAllocations: responseRooms,
//       groupedByMobile,
//       totalRooms: responseRooms.length,
//       totalGroups: groupedByMobile.length,
//       saved: true,
//       message:
//         "Room allotment completed successfully (travellers in original order).",
//     });
//   } catch (error) {
//     console.error("Room allotment error:", error);
//     res.status(500).json({ error: error.message || "Internal server error" });
//   }
// };

const allotRooms = async (req, res) => {
  try {
    const { tourId } = req.params;
    if (!tourId || !mongoose.Types.ObjectId.isValid(tourId)) {
      return res.status(400).json({ error: "Valid tourId is required" });
    }

    const objectTourId = new mongoose.Types.ObjectId(tourId);

    const bookings = await tourBookingModel
      .find({
        tourId: objectTourId,
        "cancelled.byAdmin": false,
        "cancelled.byTraveller": false,
      })
      .lean();

    if (bookings.length === 0) {
      return res.json({
        tourId,
        unpaidGuests: [],
        roomAllocations: [],
        message: "No active bookings found for this tour.",
      });
    }

    // === Separate paid and unpaid ===
    const paidBookings = bookings.filter(
      (b) => b.payment.advance.paid && b.payment.advance.paymentVerified,
    );

    const unpaidBookings = bookings.filter(
      (b) => !b.payment.advance.paid || !b.payment.advance.paymentVerified,
    );

    const unpaidGuests = [];
    unpaidBookings.forEach((booking) => {
      booking.travellers.forEach((traveller) => {
        if (!traveller.cancelled.byAdmin && !traveller.cancelled.byTraveller) {
          unpaidGuests.push({
            bookingId: booking._id.toString(),
            ...getBasicTravelerInfo(traveller),
          });
        }
      });
    });

    const rawRoomEntries = [];

    // Track allocated travellers to prevent duplicates
    const allocatedTravellerIds = new Set();

    const createOccupant = (t, mobile) => ({
      firstName: t.firstName,
      lastName: t.lastName,
      gender: t.gender,
      mobile,
      travellerId: t._id?.toString(),
      sharingType: t.sharingType,
      originalIndex: t.originalIndex, // Preserve original order
    });

    // === Step 1: Group by mobile number (Family/Friends - Case 6) ===
    const mobileGroups = new Map();

    paidBookings.forEach((booking) => {
      const active = booking.travellers.filter(
        (t) => !t.cancelled.byAdmin && !t.cancelled.byTraveller,
      );
      // Preserve original order in travellers array
      active.forEach((t, index) => {
        t.originalIndex = index; // Add original index for sorting later
      });
      const mobile = booking.contact.mobile;

      if (!mobileGroups.has(mobile)) mobileGroups.set(mobile, []);
      active.forEach((t) => {
        mobileGroups.get(mobile).push({
          traveller: t,
          bookingId: booking._id.toString(),
        });
      });
    });

    // === Step 2: Process each mobile group ===
    for (const [mobile, groupItems] of mobileGroups) {
      // Sort groupItems by original traveller index to maintain order
      groupItems.sort(
        (a, b) => a.traveller.originalIndex - b.traveller.originalIndex,
      );

      const travellers = groupItems.map((i) => i.traveller);
      const bookingIds = [...new Set(groupItems.map((i) => i.bookingId))];

      if (travellers.length === 0) continue;

      const sharingTypes = [...new Set(travellers.map((t) => t.sharingType))];
      const isUniformSharing =
        sharingTypes.length === 1 &&
        ["double", "triple"].includes(sharingTypes[0]);

      const isMarriedCouple =
        travellers.length === 2 &&
        travellers[0].gender !== travellers[1].gender &&
        travellers.every((t) => t.sharingType === "double");

      const rooms = [];

      // === Husband & Wife Rule ===
      if (isMarriedCouple) {
        rooms.push({
          sharingType: "double",
          occupants: travellers.map((t) => createOccupant(t, mobile)),
        });
      }
      // === Other cases: Mixed or Uniform sharing — allocate full groups in original order ===
      else {
        // Group by sharing type while maintaining order
        const bySharing = {};
        travellers.forEach((t) => {
          const key = t.sharingType;
          if (!bySharing[key]) bySharing[key] = [];
          bySharing[key].push(t);
        });

        Object.keys(bySharing).forEach((type) => {
          if (!["double", "triple"].includes(type)) return;

          const list = bySharing[type];
          const capacity = type === "double" ? 2 : 3;

          let i = 0;
          while (i < list.length) {
            const remaining = list.length - i;
            if (remaining >= capacity) {
              const group = list.slice(i, i + capacity);
              rooms.push({
                sharingType: type,
                occupants: group.map((t) => createOccupant(t, mobile)),
              });
              i += capacity;
            } else {
              i += remaining; // Leave remainder
            }
          }
        });

        // Add children in original order to first adult room
        const children = travellers.filter(
          (t) =>
            t.sharingType === "withBerth" || t.sharingType === "withoutBerth",
        );
        if (children.length > 0 && rooms.length > 0) {
          children.forEach((child) => {
            rooms[0].occupants.push(createOccupant(child, mobile));
          });
          rooms.forEach((room) => {
            const total = room.occupants.length;
            if (total > 3) room.sharingType = "quad";
            else if (total > 2) room.sharingType = "triple";
          });
        }
      }

      if (rooms.length > 0) {
        rawRoomEntries.push({
          bookingId: bookingIds[0],
          contactMobile: mobile,
          rooms: assignRoomNumbers(rooms),
        });

        rooms.forEach((room) => {
          room.occupants.forEach((occ) => {
            if (occ.travellerId) allocatedTravellerIds.add(occ.travellerId);
          });
        });
      }
    }

    // === Step 3: Global pooling for remainders (preserve order within same sharing/gender) ===
    const remainderPool = {};

    paidBookings.forEach((booking) => {
      booking.travellers.forEach((t, index) => {
        if (
          !t.cancelled.byAdmin &&
          !t.cancelled.byTraveller &&
          t._id &&
          !allocatedTravellerIds.has(t._id.toString()) &&
          ["double", "triple"].includes(t.sharingType)
        ) {
          t.originalIndex = index; // Preserve order
          const key = `${t.sharingType}-${t.gender}`;
          if (!remainderPool[key]) remainderPool[key] = [];
          remainderPool[key].push({
            traveller: t,
            mobile: booking.contact.mobile,
            bookingId: booking._id.toString(),
          });
        }
      });
    });

    Object.keys(remainderPool).forEach((key) => {
      const [sharingType, gender] = key.split("-");
      const capacity = sharingType === "double" ? 2 : 3;
      let list = remainderPool[key];
      if (list.length === 0) return;

      // Sort by original traveller index to keep order as much as possible
      list.sort(
        (a, b) => a.traveller.originalIndex - b.traveller.originalIndex,
      );

      const rooms = [];
      let i = 0;
      while (i < list.length) {
        const take = Math.min(capacity, list.length - i);
        const occupants = list
          .slice(i, i + take)
          .map((item) => createOccupant(item.traveller, item.mobile));
        rooms.push({
          sharingType:
            take === capacity ? sharingType : take === 2 ? "double" : "single",
          occupants,
        });
        i += take;
      }

      if (rooms.length > 0) {
        rawRoomEntries.push({
          bookingId: list[0].bookingId,
          contactMobile: list[0].mobile,
          rooms: assignRoomNumbers(rooms),
        });

        rooms.forEach((room) => {
          room.occupants.forEach((occ) => {
            if (occ.travellerId) allocatedTravellerIds.add(occ.travellerId);
          });
        });
      }
    });

    // === Step 4: Final single room reduction (same gender only) ===
    const singleRooms = [];
    rawRoomEntries.forEach((entry, entryIndex) => {
      entry.rooms = entry.rooms.filter((room) => {
        if (room.sharingType === "single") {
          singleRooms.push({
            entryIndex,
            room,
            contactMobile: entry.contactMobile,
            bookingId: entry.bookingId,
          });
          return false;
        }
        return true;
      });
    });

    const tripleSingles = { male: [], female: [] };
    const doubleSingles = { male: [], female: [] };

    // singleRooms.forEach((single) => {
    //   const occupant = single.room.occupants[0];
    //   const gender = occupant.gender.toLowerCase();
    //   const original = occupant.sharingType;
    //   if (original === "triple") tripleSingles[gender].push(single);
    //   else if (original === "double") doubleSingles[gender].push(single);
    // });

    singleRooms.forEach((single) => {
      const occupant = single.room.occupants[0];
      const gender = (occupant.gender || "").toLowerCase();
      const original = occupant.sharingType;

      if (gender === "male" || gender === "female") {
        if (original === "triple") tripleSingles[gender].push(single);
        else if (original === "double") doubleSingles[gender].push(single);
      } else {
        // unknown/missing gender — keep it as its own single room instead of crashing
        rawRoomEntries[single.entryIndex].rooms.push(single.room);
      }
    });

    ["male", "female"].forEach((gender) => {
      while (
        tripleSingles[gender].length > 0 &&
        doubleSingles[gender].length > 0
      ) {
        const tripleSingle = tripleSingles[gender].pop();
        const doubleSingle = doubleSingles[gender].pop();

        const newRoom = {
          sharingType: "double",
          occupants: [
            ...tripleSingle.room.occupants,
            ...doubleSingle.room.occupants,
          ],
        };

        rawRoomEntries[tripleSingle.entryIndex].rooms.push(newRoom);
      }

      tripleSingles[gender].forEach((r) =>
        rawRoomEntries[r.entryIndex].rooms.push(r.room),
      );
      doubleSingles[gender].forEach((r) =>
        rawRoomEntries[r.entryIndex].rooms.push(r.room),
      );
    });

    // === Final Grouping by Mobile ===
    const mobileMap = new Map();
    rawRoomEntries.forEach((entry) => {
      const mobile = entry.contactMobile || "0000000000";
      if (!mobileMap.has(mobile)) {
        mobileMap.set(mobile, {
          contactMobile: mobile,
          bookingIds: new Set(),
          rooms: [],
        });
      }
      const g = mobileMap.get(mobile);
      g.bookingIds.add(entry.bookingId);
      g.rooms.push(...entry.rooms);
    });


    let globalRoomCounter = 1;

    const groupedByMobile = Array.from(mobileMap.values())
      .sort((a, b) => a.contactMobile.localeCompare(b.contactMobile)) // ✅ sort first
      .map((g) => ({
        contactMobile: g.contactMobile,
        bookingIds: Array.from(g.bookingIds),
        rooms: g.rooms.map((r) => ({ ...r, roomNumber: globalRoomCounter++ })),
      }));
    // ✅ removed .sort() from end

    // === Check existing finalized allocation ===
    const existing = await tourRoomAllocationModel.findOne({
      tourId: objectTourId,
    });
    const manualGuests = existing?.manuallyAddedRooms?.guests || [];
    const manualLeaders = existing?.manuallyAddedRooms?.leaders || [];

    manualGuests.forEach(room => { room.roomNumber = globalRoomCounter++; });
    manualLeaders.forEach(room => { room.roomNumber = globalRoomCounter++; });


    if (existing && existing.isFinalized) {
      const flat = existing.groupedByMobile.flatMap((g) =>
        g.rooms.map((r) => ({
          contactMobile: g.contactMobile,
          bookingIds: g.bookingIds,
          roomNumber: r.roomNumber,
          sharingType: r.sharingType,
          occupants: r.occupants.map((o) => ({
            firstName: o.firstName,
            lastName: o.lastName,
            gender: o.gender,
          })),
        })),
      );

      return res.json({
        tourId,
        unpaidGuests,
        roomAllocations: flat,
        groupedByMobile: existing.groupedByMobile,
        totalRooms: flat.length,
        totalGroups: existing.groupedByMobile.length,
        saved: false,
        message: "Finalized allocation displayed with updated unpaid guests.",
      });
    }

    // === Save new allocation ===
    await tourRoomAllocationModel.findOneAndUpdate(
      { tourId: objectTourId },
      {
        tourId: objectTourId,
        groupedByMobile,
        "manuallyAddedRooms.guests": manualGuests,
        "manuallyAddedRooms.leaders": manualLeaders,
        grouped: true,
        isFinalized: false,
      },
      { upsert: true, new: true },
    );



    const responseRooms = groupedByMobile.flatMap((g) =>
      g.rooms.map((r) => ({
        contactMobile: g.contactMobile,
        bookingIds: g.bookingIds,
        roomNumber: r.roomNumber,
        sharingType: r.sharingType,
        occupants: r.occupants.map((o) => ({
          firstName: o.firstName,
          lastName: o.lastName,
          gender: o.gender,
        })),
      })),
    );

    res.json({
      tourId,
      unpaidGuests,
      roomAllocations: responseRooms,
      groupedByMobile,
      totalRooms: responseRooms.length,
      totalGroups: groupedByMobile.length,
      saved: true,
      message:
        "Room allotment completed successfully (travellers in original order).",
    });
  } catch (error) {
    console.error("Room allotment error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};



// === Helper Functions ===
const getBasicTravelerInfo = (t) => ({
  title: t.title,
  firstName: t.firstName,
  lastName: t.lastName,
  age: t.age,
  gender: t.gender,
  sharingType: t.sharingType,
});

const getSharingTypeFromSize = (size) => {
  if (size === 1) return "single";
  if (size === 2) return "double";
  if (size === 3) return "triple";
  return "quad";
};



const assignRoomNumbers = (rooms) =>
  rooms.map((r, i) => ({ ...r, roomNumber: i + 1 }));


// ==================== VIEW BOTH ROOMS (GUESTS FIRST) ====================
const getManualRooms = async (req, res) => {
  try {
    const { tourId } = req.params;

    if (!tourId || !mongoose.Types.ObjectId.isValid(tourId)) {
      return res.status(400).json({ error: "Valid tourId is required" });
    }

    const objectTourId = new mongoose.Types.ObjectId(tourId);

    const allocation = await tourRoomAllocationModel.findOne({
      tourId: objectTourId,
    }).lean();

    if (!allocation) {
      return res.json({
        success: true,
        leaders: [],
        guests: [],
        allManualRooms: [],
        totalManualRooms: 0,
        message: "No manual rooms found.",
      });
    }

    const leaders = allocation.manuallyAddedRooms?.leaders || [];
    const guests = allocation.manuallyAddedRooms?.guests || [];

    // ✅ Guests First, Leaders Last
    const allManualRooms = [...guests, ...leaders];

    res.json({
      success: true,
      leaders,
      guests,
      allManualRooms,           // Guests first → Leaders last
      totalManualRooms: allManualRooms.length,
      totalLeaders: leaders.length,
      totalGuests: guests.length,
      message: "Manual rooms fetched successfully.",
    });

  } catch (error) {
    console.error("Get Manual Rooms Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

const addGuestRoom = async (req, res) => {
  try {
    const { tourId } = req.params;
    const { sharingType, mobile, occupants } = req.body;

    if (!tourId || !mongoose.Types.ObjectId.isValid(tourId)) {
      return res.status(400).json({ error: "Valid tourId is required" });
    }

    if (!sharingType || !mobile || !occupants || !Array.isArray(occupants) || occupants.length === 0) {
      return res.status(400).json({ error: "sharingType, mobile, occupants are required" });
    }

    const objectTourId = new mongoose.Types.ObjectId(tourId);

    // Auto Calculate Next Room Number
    const existing = await tourRoomAllocationModel.findOne({ tourId: objectTourId });

    let nextRoomNumber = 1;
    if (existing) {
      const systemCount = existing.groupedByMobile?.reduce((acc, group) => acc + (group.rooms?.length || 0), 0) || 0;
      const leaderCount = existing.manuallyAddedRooms?.leaders?.length || 0;
      const guestCount = existing.manuallyAddedRooms?.guests?.length || 0;
      nextRoomNumber = systemCount + leaderCount + guestCount + 1;
    }

    // Capacity Validation
    const occupantCount = occupants.length;
    const maxCapacity = sharingType === "single" ? 1 : sharingType === "double" ? 2 : sharingType === "triple" ? 3 : 4;

    if (occupantCount > maxCapacity || occupantCount === 0) {
      return res.status(400).json({ error: `Invalid occupant count for ${sharingType} room.` });
    }

    const newRoom = {
      roomNumber: nextRoomNumber,
      sharingType: sharingType.toLowerCase(),
      mobile: mobile.trim(),
      occupants,
      type: "guest",
      addedAt: new Date()
    };

    const updatedDoc = await tourRoomAllocationModel.findOneAndUpdate(
      { tourId: objectTourId },
      {
        $push: { "manuallyAddedRooms.guests": newRoom },
        $setOnInsert: {
          tourId: objectTourId,
          groupedByMobile: [],
          bookings: [],
          grouped: true,
          isFinalized: false
        }
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json({
      success: true,
      message: `Guest Room added successfully as Room ${nextRoomNumber}`,
      room: newRoom,
      totalGuestRooms: updatedDoc.manuallyAddedRooms?.guests?.length || 0
    });

  } catch (error) {
    console.error("Add Guest Room Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

// ==================== ADD LEADER ROOM ====================
const addLeaderRoom = async (req, res) => {
  try {
    const { tourId } = req.params;
    const { sharingType, mobile, occupants } = req.body;

    if (!tourId || !mongoose.Types.ObjectId.isValid(tourId)) {
      return res.status(400).json({ error: "Valid tourId is required" });
    }

    if (!sharingType || !mobile || !occupants || !Array.isArray(occupants) || occupants.length === 0) {
      return res.status(400).json({ error: "sharingType, mobile, occupants are required" });
    }

    const objectTourId = new mongoose.Types.ObjectId(tourId);

    // Auto Calculate Next Room Number
    const existing = await tourRoomAllocationModel.findOne({ tourId: objectTourId });

    let nextRoomNumber = 1;
    if (existing) {
      const systemCount = existing.groupedByMobile?.reduce((acc, group) => acc + (group.rooms?.length || 0), 0) || 0;
      const leaderCount = existing.manuallyAddedRooms?.leaders?.length || 0;
      const guestCount = existing.manuallyAddedRooms?.guests?.length || 0;
      nextRoomNumber = systemCount + leaderCount + guestCount + 1;
    }

    const occupantCount = occupants.length;
    const maxCapacity = sharingType === "single" ? 1 : sharingType === "double" ? 2 : sharingType === "triple" ? 3 : 4;

    if (occupantCount > maxCapacity || occupantCount === 0) {
      return res.status(400).json({ error: `Invalid occupant count for ${sharingType} room.` });
    }

    const newRoom = {
      roomNumber: nextRoomNumber,
      sharingType: sharingType.toLowerCase(),
      mobile: mobile.trim(),
      occupants,
      type: "leader",
      addedAt: new Date()
    };

    const updatedDoc = await tourRoomAllocationModel.findOneAndUpdate(
      { tourId: objectTourId },
      {
        $push: { "manuallyAddedRooms.leaders": newRoom },
        $setOnInsert: {
          tourId: objectTourId,
          groupedByMobile: [],
          bookings: [],
          grouped: true,
          isFinalized: false
        }
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json({
      success: true,
      message: `Leader Room added successfully as Room ${nextRoomNumber}`,
      room: newRoom,
      totalLeaderRooms: updatedDoc.manuallyAddedRooms?.leaders?.length || 0
    });

  } catch (error) {
    console.error("Add Leader Room Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};


const deleteLeaderRoom = async (req, res) => {
  try {
    const { tourId, roomId } = req.params;

    if (!tourId || !mongoose.Types.ObjectId.isValid(tourId)) {
      return res.status(400).json({ error: "Valid tourId is required" });
    }

    if (!roomId) {
      return res.status(400).json({ error: "roomId is required" });
    }

    const objectTourId = new mongoose.Types.ObjectId(tourId);

    const updatedDoc = await tourRoomAllocationModel.findOneAndUpdate(
      { tourId: objectTourId },
      {
        $pull: {
          "manuallyAddedRooms.leaders": { _id: new mongoose.Types.ObjectId(roomId) }
        }
      },
      { new: true }
    );

    if (!updatedDoc) {
      return res.status(404).json({ error: "Tour allocation not found" });
    }

    res.status(200).json({
      success: true,
      message: `Leader Room deleted successfully`,
      totalLeaderRooms: updatedDoc.manuallyAddedRooms?.leaders?.length || 0
    });

  } catch (error) {
    console.error("Delete Leader Room Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};


const getToursByYear = async (req, res) => {
  try {
    const { year } = req.params;

    let query = {};

    // Handle "all" case
    if (year !== "all") {
      if (!year || isNaN(year) || year.length !== 4) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid 4-digit year or 'all'",
        });
      }

      const yearNum = parseInt(year);
      const start = new Date(`${yearNum}-01-01T00:00:00.000Z`);
      const end = new Date(`${yearNum}-12-31T23:59:59.999Z`);

      query = {
        $or: [
          { lastBookingDate: { $gte: start, $lte: end } },
          {
            lastBookingDate: { $exists: false },
            batch: { $regex: yearNum.toString(), $options: "i" },
          },
        ],
      };
    }

    // Fetch tours
    const allTours = await tourModel
      .find(query)
      .sort({ lastBookingDate: -1, createdAt: -1 })
      .lean();

    // Split into available & sold out
    const availableTours = allTours.filter((t) => t.available === true);
    const soldOutTours = allTours.filter((t) => t.available === false);

    res.json({
      success: true,
      requestedYear: year === "all" ? "All Years" : parseInt(year),
      totalTours: allTours.length,
      availableCount: availableTours.length,
      soldOutCount: soldOutTours.length,
      availableTours, // Available always come first
      soldOutTours, // Sold out come after
    });
  } catch (error) {
    console.error("Error in getToursByYear:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching tours",
      error: error.message,
    });
  }
};

const getAvailableTourYears = async (req, res) => {
  try {
    // Primary: years from lastBookingDate
    const yearsFromDate = await tourModel.aggregate([
      {
        $group: {
          _id: { $year: "$lastBookingDate" },
        },
      },
      { $match: { _id: { $ne: null } } },
      { $sort: { _id: -1 } }, // Newest first
    ]);

    let yearList = yearsFromDate.map((item) => item._id);

    // Fallback: extract from batch if no dates found
    if (yearList.length === 0) {
      const batchYears = await tourModel.distinct("batch");
      yearList = [
        ...new Set(
          batchYears.map((b) => b?.match(/\d{4}/)?.[0]).filter(Boolean),
        ),
      ].sort((a, b) => b - a);
    }

    res.json({
      success: true,
      count: yearList.length,
      years: yearList, // e.g. [2026, 2025, 2024, ...]
    });
  } catch (error) {
    console.error("Error in getAvailableTourYears:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available years",
      error: error.message,
    });
  }
};

// Get ALL bookings (no tourId filter)
const getAllBookings = async (req, res) => {
  try {
    console.log("Logged-in tour operator ID:", req.tourOperator?._id); // ← add this
    const bookings = await tourBookingModel
      .find({})
      .populate({
        path: "userId",
        select: "name email mobile", // Only needed user fields
      })
      .populate({
        path: "tourId",
        select: "title destination startDate endDate available", // Tour details
      })
      .sort({ bookingDate: -1 }) // Latest bookings first
      .lean(); // Better performance for large data
    console.log("Total bookings found in DB:", bookings.length); // ← add this

    if (!bookings || bookings.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No bookings found in the system.",
        total: 0,
        bookings: [],
      });
    }

    // Optional: Add quick stats
    const totalBookings = bookings.length;
    const totalEarnings = bookings.reduce((sum, b) => {
      let earnings = 0;
      if (b.payment?.advance?.paid) earnings += b.payment.advance.amount || 0;
      if (b.payment?.balance?.paid) earnings += b.payment.balance.amount || 0;
      return sum + earnings;
    }, 0);

    const completedBookings = bookings.filter(
      (b) => b.isBookingCompleted,
    ).length;
    const pendingBookings = totalBookings - completedBookings;

    res.status(200).json({
      success: true,
      totalBookings,
      totalEarnings,
      completedBookings,
      pendingBookings,
      bookings,
    });
  } catch (error) {
    console.error("Error in getAllBookings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch all bookings",
      error: error.message,
    });
  }
};

// Mark cancellation receipt as generated/sent
const taskMarkCancellationReceipt = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { tnr } = req.body;

    if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Valid 6-character TNR is required",
      });
    }

    const normalizedTnr = tnr.trim().toUpperCase();

    const updatedBooking = await tourBookingModel.updateOne(
      { tnr: normalizedTnr },
      { $set: { cancellationReceipt: false } },
      { session, new: true },
    );

    if (updatedBooking.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found with this TNR",
      });
    }

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Cancellation receipt marked successfully",
      data: {
        tnr: normalizedTnr,
        cancellationReceipt: false,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("taskMarkCancellationReceipt error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

const taskMarkManageBookingReceipt = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { tnr } = req.body;

    if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Valid 6-character TNR is required",
      });
    }

    const normalizedTnr = tnr.trim().toUpperCase();

    const updatedBooking = await tourBookingModel.updateOne(
      { tnr: normalizedTnr },
      { $set: { manageBookingReceipt: false } },
      { session, new: true },
    );

    if (updatedBooking.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found with this TNR",
      });
    }

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Manage booking receipt marked successfully",
      data: {
        tnr: normalizedTnr,
        manageBookingReceipt: false,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("taskMarkManageBookingReceipt error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};
const createTourVehicle = async (req, res) => {
  try {
    const { tourId } = req.params;
    const {
      vehicleName,
      registrationNumber,
      leaderRow = [], // frontend sends dynamic array
      passengerRows = [],
      allowSeatSelection = false,
    } = req.body;

    if (!vehicleName?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Vehicle name is required" });
    }

    // Validate leaderRow only if provided
    if (leaderRow.length > 0) {
      if (
        !Array.isArray(leaderRow) ||
        leaderRow.length < 1 ||
        leaderRow.length > 5
      ) {
        return res.status(400).json({
          success: false,
          message: "leaderRow must have between 1 and 5 seats (or omit it)",
        });
      }
      if (
        !leaderRow.every((s) => typeof s === "string" && s.startsWith("LS"))
      ) {
        return res.status(400).json({
          success: false,
          message: "Each leader seat label must start with 'LS'",
        });
      }
    }

    const vehicleData = {
      tourId,
      vehicleName: vehicleName.trim(),
      registrationNumber: registrationNumber?.trim() || undefined,
      leaderRow: leaderRow.length > 0 ? leaderRow : undefined, // let pre-save hook handle default
      passengerRows,
      allowSeatSelection,
    };

    const vehicle = new TourVehicle(vehicleData);
    await vehicle.save();

    // Return full object including virtual seatLayout
    return res.status(201).json({
      success: true,
      message: "Tour vehicle created",
      vehicle: vehicle.toObject({ virtuals: true }), // includes seatLayout
    });
  } catch (err) {
    console.error(err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};
const updateTourVehicle = async (req, res) => {
  try {
    const { tourId, vehicleId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(vehicleId) ||
      !mongoose.Types.ObjectId.isValid(tourId)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });
    }

    const updateData = {};

    if (req.body.vehicleName?.trim()) {
      updateData.vehicleName = req.body.vehicleName.trim();
    }
    if (req.body.registrationNumber !== undefined) {
      updateData.registrationNumber =
        req.body.registrationNumber?.trim() || null;
    }
    if (req.body.leaderRow) {
      if (
        !Array.isArray(req.body.leaderRow) ||
        req.body.leaderRow.length < 1 ||
        req.body.leaderRow.length > 5
      ) {
        return res.status(400).json({
          success: false,
          message: "leaderRow must have between 1 and 5 seats",
        });
      }
      if (
        !req.body.leaderRow.every(
          (s) => typeof s === "string" && s.startsWith("LS"),
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Each leader seat label must start with 'LS'",
        });
      }
      updateData.leaderRow = req.body.leaderRow;
    }
    if (req.body.passengerRows) {
      if (
        !Array.isArray(req.body.passengerRows) ||
        req.body.passengerRows.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "passengerRows must be non-empty array",
        });
      }
      updateData.passengerRows = req.body.passengerRows;

      // ── Recalculate computed fields manually (pre-save doesn't run on findOneAndUpdate) ──
      const passengerCount = updateData.passengerRows.length;
      const seatsPerRow =
        passengerCount > 0 ? updateData.passengerRows[0].length : 0;

      updateData.seatsPerRow = seatsPerRow;
      updateData.passengerRowCount = passengerCount;
      updateData.totalSeats = seatsPerRow * passengerCount; // only C + D seats, LS excluded
    }
    if (typeof req.body.allowSeatSelection === "boolean") {
      updateData.allowSeatSelection = req.body.allowSeatSelection;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const updated = await TourVehicle.findOneAndUpdate(
      { _id: vehicleId, tourId },
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found or does not belong to this tour",
      });
    }

    // Use toObject with virtuals — lean() strips them
    return res.json({
      success: true,
      message: "Vehicle updated successfully",
      vehicle: updated.toObject({ virtuals: true }),
    });
  } catch (err) {
    console.error(err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

const toggleVehicleSeatSelection = async (req, res) => {
  try {
    const { tourId, vehicleId } = req.params;
    const { allowSeatSelection } = req.body;

    if (typeof allowSeatSelection !== "boolean") {
      return res.status(400).json({
        success: false,
        message: 'Field "allowSeatSelection" must be boolean',
      });
    }

    const vehicle = await TourVehicle.findOneAndUpdate(
      { _id: vehicleId, tourId },
      { $set: { allowSeatSelection } },
      { new: true, runValidators: true },
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found or does not belong to this tour",
      });
    }

    return res.json({
      success: true,
      message: `Seat selection ${allowSeatSelection ? "enabled" : "disabled"} successfully`,
      vehicle,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

const getTourVehicles = async (req, res) => {
  try {
    const { tourId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tourId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid tour ID" });
    }

    const vehicles = await TourVehicle.find({ tourId })
      .select(
        "vehicleName registrationNumber totalSeats leaderRow passengerRows passengerRowCount seatsPerRow allowSeatSelection bookedSeats createdAt",
      )
      .sort({ createdAt: 1 })
      .lean();

    const enriched = vehicles.map((v) => ({
      ...v,
      bookedSeatsCount: v.bookedSeats?.length || 0,
      bookedSeatNumbers:
        v.bookedSeats?.map((bs) => bs.seatNumber).filter(Boolean) || [], // ← This is what makes seat numbers visible
    }));

    return res.json({
      success: true,
      count: enriched.length,
      vehicles: enriched,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
const deleteTourVehicle = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { tourId, vehicleId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(vehicleId) ||
      !mongoose.Types.ObjectId.isValid(tourId)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });
    }

    // 1. Find the vehicle
    const vehicle = await TourVehicle.findOne({
      _id: vehicleId,
      tourId,
    }).session(session);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found or does not belong to this tour",
      });
    }

    // 2. Optional: Warn/log if there are booked seats
    const bookedCount = vehicle.bookedSeats?.length || 0;
    if (bookedCount > 0) {
      console.warn(
        `Deleting vehicle ${vehicleId} with ${bookedCount} booked seats`,
      );
      // You can still proceed, or add force param later if needed
    }

    // 3. Collect all bookings that have seats on this vehicle
    const bookingIds = vehicle.bookedSeats.map((bs) => bs.bookingId);

    if (bookingIds.length > 0) {
      // 4. Clear seat info from all affected bookings
      await tourBookingModel.updateMany(
        { _id: { $in: bookingIds } },
        {
          $set: {
            "travellers.$[elem].seatNumber": null,
            "travellers.$[elem].seatLocked": false,
            "travellers.$[elem].seatLockedAt": null,
          },
        },
        {
          arrayFilters: [
            {
              "elem.seatNumber": {
                $in: vehicle.bookedSeats.map((bs) => bs.seatNumber),
              },
            },
          ],
          session,
        },
      );
    }

    // 5. Delete the vehicle
    await TourVehicle.deleteOne({ _id: vehicleId, tourId }).session(session);

    await session.commitTransaction();

    return res.json({
      success: true,
      message: "Vehicle deleted successfully",
      affectedBookings: bookingIds.length,
      bookedSeatsCleared: bookedCount,
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("deleteTourVehicle error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during vehicle deletion",
      error: err.message,
    });
  } finally {
    session.endSession();
  }
};
// const addTour = async (req, res) => {
//   try {
//     const {
//       title,
//       batch,
//       duration,
//       price,
//       destination,
//       sightseeing,
//       itinerary,
//       includes,
//       excludes,
//       trainDetails,
//       flightDetails,
//       lastBookingDate,
//       completedTripsCount,
//       available,
//       advanceAmount,
//       addons,
//       remarks,
//       boardingPoints,
//       deboardingPoints,
//       variantPackage,
//       gst,
//     } = req.body;

//     // Image handling
//     const files = req.files || {};
//     const titleImage = files.titleImage?.[0];
//     const mapImage = files.mapImage?.[0];
//     const galleryImages = files.galleryImages || [];

//     // Validate required fields
//     if (
//       !title ||
//       !batch ||
//       !duration ||
//       !price ||
//       !destination ||
//       !sightseeing ||
//       !itinerary ||
//       !includes ||
//       !excludes ||
//       !titleImage ||
//       !mapImage ||
//       galleryImages.length === 0 ||
//       !lastBookingDate ||
//       !advanceAmount ||
//       !boardingPoints ||
//       !deboardingPoints
//     ) {
//       return res.json({
//         success: false,
//         message: "Missing required tour details",
//       });
//     }

//     // Image upload function
//     const uploadImage = async (file) => {
//       const result = await cloudinary.uploader.upload(file.path, {
//         resource_type: "image",
//       });
//       return result.secure_url;
//     };

//     // Upload images
//     const titleImageUrl = await uploadImage(titleImage);
//     const mapImageUrl = await uploadImage(mapImage);
//     const galleryImageUrls = await Promise.all(
//       galleryImages.map((img) => uploadImage(img)),
//     );

//     // Parse and validate fields
//     let parsedDuration, parsedPrice, parsedAdvance;
//     try {
//       parsedDuration = JSON.parse(duration);
//       parsedPrice = JSON.parse(price);
//       parsedAdvance = JSON.parse(advanceAmount);
//     } catch {
//       return res.json({
//         success: false,
//         message: "Invalid JSON format for duration, price, or advanceAmount",
//       });
//     }

//     // Validate main tour price and advance amounts
//     const doubleSharing = Number(parsedPrice.doubleSharing);
//     const tripleSharing = Number(parsedPrice.tripleSharing);
//     const childWithBerth = Number(parsedPrice.childWithBerth) || 0;
//     const childWithoutBerth = Number(parsedPrice.childWithoutBerth) || 0;
//     const advanceAdult = Number(parsedAdvance.adult) || 0;
//     const advanceChild = Number(parsedAdvance.child) || 0;

//     if (
//       isNaN(doubleSharing) ||
//       isNaN(tripleSharing) ||
//       isNaN(advanceAdult) ||
//       isNaN(advanceChild)
//     ) {
//       return res.json({
//         success: false,
//         message: "Invalid number in price or advance amount",
//       });
//     }

//     const parsedGst = gst !== undefined && gst !== "" ? Number(gst) : 0;
//     if (isNaN(parsedGst) || parsedGst < 0) {
//       return res.json({
//         success: false,
//         message: "Invalid GST value",
//       });
//     }

//     // Calculate balances for main tour

//     // Calculate balances for main tour
//     const balanceDouble = doubleSharing - advanceAdult;
//     const balanceTriple = tripleSharing - advanceAdult;
//     const balanceChildWithBerth =
//       childWithBerth > 0 ? childWithBerth - advanceChild : null;
//     const balanceChildWithoutBerth =
//       childWithoutBerth > 0 ? childWithoutBerth - advanceChild : null;

//     // Parse arrays safely
//     const parseArrayField = (field, fieldName) => {
//       try {
//         const parsed = JSON.parse(field);
//         if (!Array.isArray(parsed)) {
//           throw new Error(`Invalid format for ${fieldName}`);
//         }
//         return parsed;
//       } catch {
//         throw new Error(`Invalid format for ${fieldName}`);
//       }
//     };

//     // Parse addons
//     let parsedAddons = [];
//     if (addons) {
//       try {
//         const temp = JSON.parse(addons);
//         if (Array.isArray(temp)) {
//           parsedAddons = temp.map((a) => ({
//             name: a.name || "",
//             amount: Number(a.amount) || 0,
//           }));
//         }
//       } catch {
//         return res.json({
//           success: false,
//           message: "Invalid format for addons",
//         });
//       }
//     }

//     // Parse boarding and deboarding points
//     let parsedBoardingPoints = [];
//     let parsedDeboardingPoints = [];
//     try {
//       parsedBoardingPoints = parseArrayField(
//         boardingPoints,
//         "boardingPoints",
//       ).map((b) => ({
//         stationCode: b.stationCode || "",
//         stationName: b.stationName || "",
//       }));
//       parsedDeboardingPoints = parseArrayField(
//         deboardingPoints,
//         "deboardingPoints",
//       ).map((b) => ({
//         stationCode: b.stationCode || "",
//         stationName: b.stationName || "",
//       }));
//     } catch (error) {
//       return res.json({
//         success: false,
//         message: error.message,
//       });
//     }

//     // Parse variantPackage
//     let parsedVariants = [];
//     if (variantPackage) {
//       try {
//         const temp = JSON.parse(variantPackage);
//         if (Array.isArray(temp)) {
//           parsedVariants = temp.map((v) => {
//             const vpPrice = v.price || {};
//             const vpAdvance = v.advanceAmount || {};
//             const vpDuration = v.duration || {};

//             const vpDouble = Number(vpPrice.doubleSharing) || 0;
//             const vpTriple = Number(vpPrice.tripleSharing) || 0;
//             const vpChildWithBerth = Number(vpPrice.childWithBerth) || 0;
//             const vpChildWithoutBerth = Number(vpPrice.childWithoutBerth) || 0;
//             const vpAdvanceAdult = Number(vpAdvance.adult) || 0;
//             const vpAdvanceChild = Number(vpAdvance.child) || 0;

//             return {
//               duration: {
//                 days: Number(vpDuration.days) || 0,
//                 nights: Number(vpDuration.nights) || 0,
//               },
//               price: {
//                 doubleSharing: vpDouble,
//                 tripleSharing: vpTriple,
//                 childWithBerth: vpChildWithBerth,
//                 childWithoutBerth: vpChildWithoutBerth,
//               },
//               advanceAmount: {
//                 adult: vpAdvanceAdult,
//                 child: vpAdvanceChild,
//               },
//               balanceDouble: vpDouble - vpAdvanceAdult,
//               balanceTriple: vpTriple - vpAdvanceAdult,
//               balanceChildWithBerth:
//                 vpChildWithBerth > 0 ? vpChildWithBerth - vpAdvanceChild : null,
//               balanceChildWithoutBerth:
//                 vpChildWithoutBerth > 0
//                   ? vpChildWithoutBerth - vpAdvanceChild
//                   : null,
//               destination: Array.isArray(v.destination) ? v.destination : [],
//               sightseeing: Array.isArray(v.sightseeing) ? v.sightseeing : [],
//               itinerary: Array.isArray(v.itinerary) ? v.itinerary : [],
//               includes: Array.isArray(v.includes) ? v.includes : [],
//               excludes: Array.isArray(v.excludes) ? v.excludes : [],
//               trainDetails: Array.isArray(v.trainDetails)
//                 ? v.trainDetails.map((t) => ({
//                   trainNo: t.trainNo || "",
//                   trainName: t.trainName || "",
//                   fromCode: t.fromCode || "",
//                   fromStation: t.fromStation || "",
//                   toCode: t.toCode || "",
//                   toStation: t.toStation || "",
//                   class: t.class || "",
//                   departureTime: t.departureTime || "",
//                   arrivalTime: t.arrivalTime || "",
//                   ticketOpenDate: t.ticketOpenDate
//                     ? new Date(t.ticketOpenDate)
//                     : null,
//                 }))
//                 : [],
//               flightDetails: Array.isArray(v.flightDetails)
//                 ? v.flightDetails.map((f) => ({
//                   airline: f.airline || "",
//                   flightNo: f.flightNo || "",
//                   fromCode: f.fromCode || "",
//                   fromAirport: f.fromAirport || "",
//                   toCode: f.toCode || "",
//                   toAirport: f.toAirport || "",
//                   class: f.class || "",
//                   departureTime: f.departureTime || "",
//                   arrivalTime: f.arrivalTime || "",
//                 }))
//                 : [],
//               addons: Array.isArray(v.addons)
//                 ? v.addons.map((a) => ({
//                   name: a.name || "",
//                   amount: Number(a.amount) || 0,
//                 }))
//                 : [],
//               remarks: v.remarks || "",
//               boardingPoints: Array.isArray(v.boardingPoints)
//                 ? v.boardingPoints.map((b) => ({
//                   stationCode: b.stationCode || "",
//                   stationName: b.stationName || "",
//                 }))
//                 : [],
//               deboardingPoints: Array.isArray(v.deboardingPoints)
//                 ? v.deboardingPoints.map((b) => ({
//                   stationCode: b.stationCode || "",
//                   stationName: b.stationName || "",
//                 }))
//                 : [],
//               lastBookingDate: v.lastBookingDate
//                 ? new Date(v.lastBookingDate)
//                 : null,
//             };
//           });
//         }
//       } catch {
//         return res.json({
//           success: false,
//           message: "Invalid format for variantPackage",
//         });
//       }
//     }

//     // Create tour data object
//     const tourData = {
//       title,
//       batch,
//       duration: {
//         days: Number(parsedDuration.days) || 0,
//         nights: Number(parsedDuration.nights) || 0,
//       },
//       price: {
//         doubleSharing,
//         tripleSharing,
//         childWithBerth,
//         childWithoutBerth,
//       },
//       gst: parsedGst,
//       advanceAmount: {
//         adult: advanceAdult,
//         child: advanceChild,
//       },
//       balanceDouble,
//       balanceTriple,
//       balanceChildWithBerth,
//       balanceChildWithoutBerth,
//       destination: parseArrayField(destination, "destination"),
//       sightseeing: parseArrayField(sightseeing, "sightseeing"),
//       itinerary: parseArrayField(itinerary, "itinerary"),
//       includes: parseArrayField(includes, "includes"),
//       excludes: parseArrayField(excludes, "excludes"),
//       trainDetails: trainDetails
//         ? parseArrayField(trainDetails, "trainDetails").map((t) => ({
//           trainNo: t.trainNo || "",
//           trainName: t.trainName || "",
//           fromCode: t.fromCode || "",
//           fromStation: t.fromStation || "",
//           toCode: t.toCode || "",
//           toStation: t.toStation || "",
//           class: t.class || "",
//           departureTime: t.departureTime || "",
//           arrivalTime: t.arrivalTime || "",
//           ticketOpenDate: t.ticketOpenDate
//             ? new Date(t.ticketOpenDate)
//             : null,
//         }))
//         : [],
//       flightDetails: flightDetails
//         ? parseArrayField(flightDetails, "flightDetails").map((f) => ({
//           airline: f.airline || "",
//           flightNo: f.flightNo || "",
//           fromCode: f.fromCode || "",
//           fromAirport: f.fromAirport || "",
//           toCode: f.toCode || "",
//           toAirport: f.toAirport || "",
//           class: f.class || "",
//           departureTime: f.departureTime || "",
//           arrivalTime: f.arrivalTime || "",
//         }))
//         : [],
//       addons: parsedAddons,
//       remarks: remarks || "",
//       boardingPoints: parsedBoardingPoints,
//       deboardingPoints: parsedDeboardingPoints,
//       titleImage: titleImageUrl,
//       mapImage: mapImageUrl,
//       galleryImages: galleryImageUrls,
//       lastBookingDate: new Date(lastBookingDate),
//       completedTripsCount: Number(completedTripsCount) || 0,
//       available: available ?? true,
//       variantPackage: parsedVariants,
//     };

//     // Save tour to database
//     const newTour = new tourModel(tourData);
//     await newTour.save();

//     res.json({
//       success: true,
//       message: "Tour added successfully",
//       data: newTour,
//     });
//   } catch (error) {
//     console.error(error);
//     res.json({ success: false, message: error.message });
//   }
// };


const addTour = async (req, res) => {
  try {
    const {
      title,
      batch,
      duration,
      price,
      destination,
      sightseeing,
      itinerary,
      includes,
      excludes,
      trainDetails,
      flightDetails,
      lastBookingDate,
      completedTripsCount,
      available,
      advanceAmount,
      addons,
      remarks,
      boardingPoints,
      deboardingPoints,
      variantPackage,
      gst,
    } = req.body;

    // Image handling
    const files = req.files || {};
    const titleImage = files.titleImage?.[0];
    const mapImage = files.mapImage?.[0];
    const galleryImages = files.galleryImages || [];

    // Validate required fields
    if (
      !title ||
      !batch ||
      !duration ||
      !price ||
      !destination ||
      !sightseeing ||
      !itinerary ||
      !includes ||
      !excludes ||
      !titleImage ||
      !mapImage ||
      galleryImages.length === 0 ||
      !lastBookingDate ||
      !advanceAmount ||
      !boardingPoints ||
      !deboardingPoints
    ) {
      return res.json({
        success: false,
        message: "Missing required tour details",
      });
    }

    // Image upload function
    const uploadImage = async (file) => {
      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: "image",
      });
      return result.secure_url;
    };

    // Upload images
    const titleImageUrl = await uploadImage(titleImage);
    const mapImageUrl = await uploadImage(mapImage);
    const galleryImageUrls = await Promise.all(
      galleryImages.map((img) => uploadImage(img)),
    );

    // Parse and validate fields
    let parsedDuration, parsedPrice, parsedAdvance;
    try {
      parsedDuration = JSON.parse(duration);
      parsedPrice = JSON.parse(price);
      parsedAdvance = JSON.parse(advanceAmount);
    } catch {
      return res.json({
        success: false,
        message: "Invalid JSON format for duration, price, or advanceAmount",
      });
    }

    // Validate main tour price and advance amounts
    const doubleSharing = Number(parsedPrice.doubleSharing);
    const tripleSharing = Number(parsedPrice.tripleSharing);
    const childWithBerth = Number(parsedPrice.childWithBerth) || 0;
    const childWithoutBerth = Number(parsedPrice.childWithoutBerth) || 0;
    const advanceAdult = Number(parsedAdvance.adult) || 0;
    const advanceChild = Number(parsedAdvance.child) || 0;

    if (
      isNaN(doubleSharing) ||
      isNaN(tripleSharing) ||
      isNaN(advanceAdult) ||
      isNaN(advanceChild)
    ) {
      return res.json({
        success: false,
        message: "Invalid number in price or advance amount",
      });
    }

    const parsedGst = gst !== undefined && gst !== "" ? Number(gst) : 0;
    if (isNaN(parsedGst) || parsedGst < 0) {
      return res.json({
        success: false,
        message: "Invalid GST value",
      });
    }

    // Calculate balances for main tour
    const balanceDouble = doubleSharing - advanceAdult;
    const balanceTriple = tripleSharing - advanceAdult;
    const balanceChildWithBerth =
      childWithBerth > 0 ? childWithBerth - advanceChild : null;
    const balanceChildWithoutBerth =
      childWithoutBerth > 0 ? childWithoutBerth - advanceChild : null;

    // Parse arrays safely
    const parseArrayField = (field, fieldName) => {
      try {
        const parsed = JSON.parse(field);
        if (!Array.isArray(parsed)) {
          throw new Error(`Invalid format for ${fieldName}`);
        }
        return parsed;
      } catch {
        throw new Error(`Invalid format for ${fieldName}`);
      }
    };

    // Parse addons (old flat list)
    let parsedAddons = [];
    if (addons) {
      try {
        const temp = JSON.parse(addons);
        if (Array.isArray(temp)) {
          parsedAddons = temp.map((a) => ({
            name: a.name || "",
            amount: Number(a.amount) || 0,
          }));
        }
      } catch {
        return res.json({
          success: false,
          message: "Invalid format for addons",
        });
      }
    }

    // ── NEW: helper to parse train/flight addons sub-array ──
    const parseAddonsArray = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr.map((a) => ({
        name: a.name || "",
        amount: Number(a.amount) || 0,
      }));
    };

    // Parse boarding and deboarding points
    let parsedBoardingPoints = [];
    let parsedDeboardingPoints = [];
    try {
      parsedBoardingPoints = parseArrayField(
        boardingPoints,
        "boardingPoints",
      ).map((b) => ({
        stationCode: b.stationCode || "",
        stationName: b.stationName || "",
      }));
      parsedDeboardingPoints = parseArrayField(
        deboardingPoints,
        "deboardingPoints",
      ).map((b) => ({
        stationCode: b.stationCode || "",
        stationName: b.stationName || "",
      }));
    } catch (error) {
      return res.json({
        success: false,
        message: error.message,
      });
    }

    // Parse variantPackage
    let parsedVariants = [];
    if (variantPackage) {
      try {
        const temp = JSON.parse(variantPackage);
        if (Array.isArray(temp)) {
          parsedVariants = temp.map((v) => {
            const vpPrice = v.price || {};
            const vpAdvance = v.advanceAmount || {};
            const vpDuration = v.duration || {};

            const vpDouble = Number(vpPrice.doubleSharing) || 0;
            const vpTriple = Number(vpPrice.tripleSharing) || 0;
            const vpChildWithBerth = Number(vpPrice.childWithBerth) || 0;
            const vpChildWithoutBerth = Number(vpPrice.childWithoutBerth) || 0;
            const vpAdvanceAdult = Number(vpAdvance.adult) || 0;
            const vpAdvanceChild = Number(vpAdvance.child) || 0;

            return {
              duration: {
                days: Number(vpDuration.days) || 0,
                nights: Number(vpDuration.nights) || 0,
              },
              price: {
                doubleSharing: vpDouble,
                tripleSharing: vpTriple,
                childWithBerth: vpChildWithBerth,
                childWithoutBerth: vpChildWithoutBerth,
              },
              advanceAmount: {
                adult: vpAdvanceAdult,
                child: vpAdvanceChild,
              },
              balanceDouble: vpDouble - vpAdvanceAdult,
              balanceTriple: vpTriple - vpAdvanceAdult,
              balanceChildWithBerth:
                vpChildWithBerth > 0 ? vpChildWithBerth - vpAdvanceChild : null,
              balanceChildWithoutBerth:
                vpChildWithoutBerth > 0
                  ? vpChildWithoutBerth - vpAdvanceChild
                  : null,
              destination: Array.isArray(v.destination) ? v.destination : [],
              sightseeing: Array.isArray(v.sightseeing) ? v.sightseeing : [],
              itinerary: Array.isArray(v.itinerary) ? v.itinerary : [],
              includes: Array.isArray(v.includes) ? v.includes : [],
              excludes: Array.isArray(v.excludes) ? v.excludes : [],
              trainDetails: Array.isArray(v.trainDetails)
                ? v.trainDetails.map((t) => ({
                  trainNo: t.trainNo || "",
                  trainName: t.trainName || "",
                  fromCode: t.fromCode || "",
                  fromStation: t.fromStation || "",
                  toCode: t.toCode || "",
                  toStation: t.toStation || "",
                  class: t.class || "",
                  departureTime: t.departureTime || "",
                  arrivalTime: t.arrivalTime || "",
                  ticketOpenDate: t.ticketOpenDate ? new Date(t.ticketOpenDate) : null,
                  tripType: t.tripType || "", // ← NEW
                  addons: parseAddonsArray(t.addons),
                }))
                : [],
              flightDetails: Array.isArray(v.flightDetails)
                ? v.flightDetails.map((f) => ({
                  airline: f.airline || "",
                  flightNo: f.flightNo || "",
                  fromCode: f.fromCode || "",
                  fromAirport: f.fromAirport || "",
                  toCode: f.toCode || "",
                  toAirport: f.toAirport || "",
                  class: f.class || "",
                  departureTime: f.departureTime || "",
                  arrivalTime: f.arrivalTime || "",
                  // ── NEW: flight-wise addons for this variant ──
                  addons: parseAddonsArray(f.addons),
                }))
                : [],
              addons: Array.isArray(v.addons)
                ? v.addons.map((a) => ({
                  name: a.name || "",
                  amount: Number(a.amount) || 0,
                }))
                : [],
              remarks: v.remarks || "",
              boardingPoints: Array.isArray(v.boardingPoints)
                ? v.boardingPoints.map((b) => ({
                  stationCode: b.stationCode || "",
                  stationName: b.stationName || "",
                }))
                : [],
              deboardingPoints: Array.isArray(v.deboardingPoints)
                ? v.deboardingPoints.map((b) => ({
                  stationCode: b.stationCode || "",
                  stationName: b.stationName || "",
                }))
                : [],
              lastBookingDate: v.lastBookingDate
                ? new Date(v.lastBookingDate)
                : null,
            };
          });
        }
      } catch {
        return res.json({
          success: false,
          message: "Invalid format for variantPackage",
        });
      }
    }

    // Create tour data object
    const tourData = {
      title,
      batch,
      duration: {
        days: Number(parsedDuration.days) || 0,
        nights: Number(parsedDuration.nights) || 0,
      },
      price: {
        doubleSharing,
        tripleSharing,
        childWithBerth,
        childWithoutBerth,
      },
      gst: parsedGst,
      advanceAmount: {
        adult: advanceAdult,
        child: advanceChild,
      },
      balanceDouble,
      balanceTriple,
      balanceChildWithBerth,
      balanceChildWithoutBerth,
      destination: parseArrayField(destination, "destination"),
      sightseeing: parseArrayField(sightseeing, "sightseeing"),
      itinerary: parseArrayField(itinerary, "itinerary"),
      includes: parseArrayField(includes, "includes"),
      excludes: parseArrayField(excludes, "excludes"),
      trainDetails: trainDetails
        ? parseArrayField(trainDetails, "trainDetails").map((t) => ({
          trainNo: t.trainNo || "",
          trainName: t.trainName || "",
          fromCode: t.fromCode || "",
          fromStation: t.fromStation || "",
          toCode: t.toCode || "",
          toStation: t.toStation || "",
          class: t.class || "",
          departureTime: t.departureTime || "",
          arrivalTime: t.arrivalTime || "",
          ticketOpenDate: t.ticketOpenDate ? new Date(t.ticketOpenDate) : null,
          tripType: t.tripType || "", // ← NEW: free-text note
          addons: parseAddonsArray(t.addons),
        }))
        : [],
      flightDetails: flightDetails
        ? parseArrayField(flightDetails, "flightDetails").map((f) => ({
          airline: f.airline || "",
          flightNo: f.flightNo || "",
          fromCode: f.fromCode || "",
          fromAirport: f.fromAirport || "",
          toCode: f.toCode || "",
          toAirport: f.toAirport || "",
          class: f.class || "",
          departureTime: f.departureTime || "",
          arrivalTime: f.arrivalTime || "",
          // ── NEW: flight-wise addons ──
          addons: parseAddonsArray(f.addons),
        }))
        : [],
      addons: parsedAddons,
      remarks: remarks || "",
      boardingPoints: parsedBoardingPoints,
      deboardingPoints: parsedDeboardingPoints,
      titleImage: titleImageUrl,
      mapImage: mapImageUrl,
      galleryImages: galleryImageUrls,
      lastBookingDate: new Date(lastBookingDate),
      completedTripsCount: Number(completedTripsCount) || 0,
      available: available ?? true,
      variantPackage: parsedVariants,
    };

    // Save tour to database
    const newTour = new tourModel(tourData);
    await newTour.save();

    res.json({
      success: true,
      message: "Tour added successfully",
      data: newTour,
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};





const getAllPaymentMethods = async (req, res) => {
  try {
    const methods = await PaymentMethod.find({})
      .sort({ type: 1, createdAt: -1 })
      .lean();

    // Enrich response (optional fields + isActive flag)
    const enriched = methods.map((m) => ({
      ...m,
      isActive: true, // you can add real logic later (e.g., based on date or flag)
      qrImage: m.qrImage || null,
    }));

    return res.status(200).json({
      success: true,
      count: enriched.length,
      paymentMethods: enriched,
    });
  } catch (error) {
    console.error("getAllPaymentMethods error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment methods",
      error: error.message,
    });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/tour/payment-methods
// Create new payment method (Bank or UPI/QR)
// ──────────────────────────────────────────────────────────────────────────────
const createPaymentMethod = async (req, res) => {
  try {
    const type = req.body?.type?.trim();

    if (!type || !["bank", "upi"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be either 'bank' or 'upi'",
      });
    }

    let paymentData = { type };

    if (type === "bank") {
      const {
        bankName,
        branchName,
        accountNumber,
        ifsc,
        swift = "",
        beneficiary,
        accountType,
      } = req.body;

      // Required fields validation
      if (
        !bankName?.trim() ||
        !branchName?.trim() ||
        !accountNumber?.trim() ||
        !ifsc?.trim() ||
        !beneficiary?.trim() ||
        !accountType?.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "All bank fields (bankName, branchName, accountNumber, IFSC, beneficiary, accountType) are required",
        });
      }

      paymentData = {
        ...paymentData,
        bankName: bankName.trim(),
        branchName: branchName.trim(),
        accountNumber: accountNumber.trim(),
        ifsc: ifsc.trim().toUpperCase(),
        swift: swift.trim() || undefined,
        beneficiary: beneficiary.trim(),
        accountType: accountType.trim(),
      };
    } else if (type === "upi") {
      const { upiId, phone } = req.body;

      if (!upiId?.trim() || !phone?.trim()) {
        return res.status(400).json({
          success: false,
          message: "UPI ID and Phone number are required for UPI",
        });
      }

      if (!/^[0-9]{10}$/.test(phone.trim())) {
        return res.status(400).json({
          success: false,
          message: "Phone number must be exactly 10 digits",
        });
      }

      paymentData = {
        ...paymentData,
        upiId: upiId.trim(),
        phone: phone.trim(),
      };

      // Handle QR code upload (optional)
      if (req.file) {
        try {
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "tour-payments/qr",
            resource_type: "image",
          });
          paymentData.qrImage = result.secure_url;
        } catch (uploadErr) {
          console.error("Cloudinary upload failed:", uploadErr);
          return res.status(500).json({
            success: false,
            message: "Failed to upload QR code image",
          });
        }
      }
    }

    const newMethod = await PaymentMethod.create(paymentData);

    return res.status(201).json({
      success: true,
      message: `${type === "bank" ? "Bank" : "UPI"} payment method created successfully`,
      paymentMethod: newMethod,
    });
  } catch (error) {
    console.error("createPaymentMethod error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create payment method",
      error: error.message,
    });
  }
};



// ──────────────────────────────────────────────────────────────────────────────
// PUT /api/tour/payment-methods/:id
// Update existing payment method
// ──────────────────────────────────────────────────────────────────────────────
const updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;

    const type = req.body?.type?.trim();

    if (!type || !["bank", "upi"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be 'bank' or 'upi'",
      });
    }

    const updateData = { type };

    if (type === "bank") {
      const {
        bankName,
        branchName,
        accountNumber,
        ifsc,
        swift,
        beneficiary,
        accountType,
      } = req.body;

      // Required fields validation (allow partial updates, but check if provided)
      if (bankName !== undefined && !bankName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Bank name cannot be empty",
        });
      }
      if (branchName !== undefined && !branchName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Branch name cannot be empty",
        });
      }

      // Only update fields that are sent in request
      if (bankName !== undefined) updateData.bankName = bankName.trim();
      if (branchName !== undefined) updateData.branchName = branchName.trim();
      if (accountNumber !== undefined)
        updateData.accountNumber = accountNumber.trim();
      if (ifsc !== undefined) updateData.ifsc = ifsc.trim().toUpperCase();
      if (swift !== undefined) updateData.swift = swift.trim() || undefined;
      if (beneficiary !== undefined)
        updateData.beneficiary = beneficiary.trim();
      if (accountType !== undefined)
        updateData.accountType = accountType.trim();
    } else if (type === "upi") {
      const { upiId, phone } = req.body;

      if (upiId !== undefined && !upiId.trim()) {
        return res.status(400).json({
          success: false,
          message: "UPI ID cannot be empty",
        });
      }
      if (phone !== undefined && !/^[0-9]{10}$/.test(phone.trim())) {
        return res.status(400).json({
          success: false,
          message: "Phone number must be exactly 10 digits",
        });
      }

      if (upiId !== undefined) updateData.upiId = upiId.trim();
      if (phone !== undefined) updateData.phone = phone.trim();

      // Optional: replace QR only if a new file is uploaded
      if (req.file) {
        try {
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "tour-payments/qr",
            resource_type: "image",
          });
          updateData.qrImage = result.secure_url;
        } catch (uploadErr) {
          console.error("Cloudinary upload failed:", uploadErr);
          return res.status(500).json({
            success: false,
            message: "Failed to upload new QR code image",
          });
        }
      }
    }

    const updated = await PaymentMethod.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment method updated successfully",
      paymentMethod: updated,
    });
  } catch (error) {
    console.error("updatePaymentMethod error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update payment method",
      error: error.message,
    });
  }
};
// ──────────────────────────────────────────────────────────────────────────────
// DELETE /api/payment-methods/:id
// Delete a payment method
// ──────────────────────────────────────────────────────────────────────────────
const deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await PaymentMethod.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found",
      });
    }

    // Optional: delete QR image from Cloudinary if exists
    if (deleted.qrImage) {
      try {
        const publicId = deleted.qrImage.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`tour-payments/qr/${publicId}`);
      } catch (cloudErr) {
        console.warn("Failed to delete QR from Cloudinary:", cloudErr);
        // Do not fail the request — just log
      }
    }

    return res.status(200).json({
      success: true,
      message: "Payment method deleted successfully",
    });
  } catch (error) {
    console.error("deletePaymentMethod error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete payment method",
      error: error.message,
    });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/tour/:tourId/payment-methods
// Get All Payment Methods for a Specific Tour
// ──────────────────────────────────────────────────────────────────────────────
const getTourPaymentMethods = async (req, res) => {
  try {
    const { tourId } = req.params;

    const methods = await BalanceMethod.find({ tourId })
      .sort({ type: 1, createdAt: -1 })
      .lean();

    const enriched = methods.map((m) => ({
      ...m,
      isActive: m.isActive !== false,
      qrImage: m.qrImage || null,
    }));

    return res.status(200).json({
      success: true,
      count: enriched.length,
      paymentMethods: enriched,
    });
  } catch (error) {
    console.error("getTourPaymentMethods error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tour payment methods",
      error: error.message,
    });
  }
};


const createTourPaymentMethod = async (req, res) => {
  try {
    const { tourId } = req.params;

    console.log("Received tourId:", tourId);

    if (!tourId) {
      return res.status(400).json({
        success: false,
        message: "Tour ID is required in URL",
      });
    }

    const tour = await tourModel.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour not found",
      });
    }

    const type = req.body?.type?.trim().toLowerCase();

    if (!type || !["bank", "upi"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be either 'bank' or 'upi'",
      });
    }

    let paymentData = {
      tourId,
      type,
      isActive: true,
    };

    if (type === "bank") {
      const {
        bankName, branchName, accountNumber, ifsc, swift = "",
        beneficiary, accountType,
      } = req.body;

      if (
        !bankName?.trim() || !branchName?.trim() || !accountNumber?.trim() ||
        !ifsc?.trim() || !beneficiary?.trim() || !accountType?.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "All bank fields are required",
        });
      }

      paymentData = {
        ...paymentData,
        bankName: bankName.trim(),
        branchName: branchName.trim(),
        accountNumber: accountNumber.trim(),
        ifsc: ifsc.trim().toUpperCase(),
        swift: swift.trim() || undefined,
        beneficiary: beneficiary.trim(),
        accountType: accountType.trim(),
      };

    } else if (type === "upi") {
      const { upiId, phone } = req.body;

      // Only upiId required, phone is optional
      if (!upiId?.trim()) {
        return res.status(400).json({
          success: false,
          message: "UPI ID is required",
        });
      }

      // Validate phone format only if provided
      if (phone?.trim() && !/^[0-9]{10}$/.test(phone.trim())) {
        return res.status(400).json({
          success: false,
          message: "Phone number must be exactly 10 digits",
        });
      }

      paymentData = {
        ...paymentData,
        upiId: upiId.trim(),
        ...(phone?.trim() && { phone: phone.trim() }),
      };

      if (req.file) {
        try {
          const result = await cloudinary.v2.uploader.upload(req.file.path, {
            folder: `tour-payments/${tourId}/qr`,
            resource_type: "image",
          });
          paymentData.qrImage = result.secure_url;
        } catch (uploadErr) {
          console.error("Cloudinary upload failed:", uploadErr);
          return res.status(500).json({
            success: false,
            message: "Failed to upload QR code image",
          });
        }
      }
    }

    const newMethod = await BalanceMethod.create(paymentData);

    return res.status(201).json({
      success: true,
      message: `${type.toUpperCase()} payment method created successfully for this tour`,
      paymentMethod: newMethod,
    });

  } catch (error) {
    console.error("createTourPaymentMethod error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create tour payment method",
      error: error.message,
    });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// UPDATE PAYMENT METHOD - FIXED VERSION
// ──────────────────────────────────────────────────────────────────────────────
const updateTourPaymentMethod = async (req, res) => {
  try {
    const { tourId, id } = req.params;

    const tour = await tourModel.findById(tourId);
    if (!tour) {
      return res.status(404).json({ success: false, message: "Tour not found" });
    }

    const type = (req.body?.type || "").toString().trim();

    if (type && !["bank", "upi"].includes(type)) {
      return res.status(400).json({ success: false, message: "Type must be 'bank' or 'upi'" });
    }

    const updateData = type ? { type } : {};

    // === BANK PAYMENT ===
    if (type === "bank" || req.body.bankName) {
      const bankName = (req.body.bankName || "").toString().trim();
      const branchName = (req.body.branchName || "").toString().trim();
      const accountNumber = (req.body.accountNumber || "").toString().trim();
      const ifsc = (req.body.ifsc || "").toString().trim();
      const swift = (req.body.swift || "").toString().trim();
      const beneficiary = (req.body.beneficiary || "").toString().trim();
      const accountType = (req.body.accountType || "").toString().trim();

      if (!bankName) return res.status(400).json({ success: false, message: "Bank name cannot be empty" });
      if (!branchName) return res.status(400).json({ success: false, message: "Branch name cannot be empty" });

      updateData.bankName = bankName;
      updateData.branchName = branchName;
      updateData.accountNumber = accountNumber;
      updateData.ifsc = ifsc.toUpperCase();
      updateData.swift = swift || undefined;
      updateData.beneficiary = beneficiary;
      updateData.accountType = accountType;
    }
    // === UPI PAYMENT ===
    else if (type === "upi" || req.body.upiId) {
      const upiId = (req.body.upiId || "").toString().trim();
      const phone = (req.body.phone || "").toString().trim();

      if (!upiId) return res.status(400).json({ success: false, message: "UPI ID cannot be empty" });
      if (phone && !/^[0-9]{10}$/.test(phone)) {
        return res.status(400).json({ success: false, message: "Phone number must be exactly 10 digits" });
      }

      updateData.upiId = upiId;
      updateData.phone = phone;

      if (req.file) {
        try {
          const result = await cloudinary.v2.uploader.upload(req.file.path, {
            folder: `tour-payments/${tourId}/qr`,
            resource_type: "image",
          });
          updateData.qrImage = result.secure_url;
        } catch (err) {
          console.error(err);
          return res.status(500).json({ success: false, message: "QR upload failed" });
        }
      }
    }

    const updated = await BalanceMethod.findOneAndUpdate(
      { _id: id, tourId },
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: "Payment method not found for this tour" });
    }

    return res.status(200).json({
      success: true,
      message: "Payment method updated successfully",
      paymentMethod: {
        ...updated,
        isActive: updated.isActive !== false,
        qrImage: updated.qrImage || null,
      }
    });

  } catch (error) {
    console.error("updateTourPaymentMethod error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update payment method",
      error: error.message
    });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// DELETE /api/tour/:tourId/payment-methods/:id
// Delete Payment Method for a Specific Tour
// ──────────────────────────────────────────────────────────────────────────────
const deleteTourPaymentMethod = async (req, res) => {
  try {
    const { tourId, id } = req.params;

    // Verify tour exists (optional but recommended)
    const tour = await tourModel.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour not found",
      });
    }

    const deleted = await BalanceMethod.findOneAndDelete({ _id: id, tourId });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found for this tour",
      });
    }

    // Optional: Delete QR image from Cloudinary
    if (deleted.qrImage) {
      try {
        const publicId = deleted.qrImage.split("/").pop().split(".")[0];
        const folder = `tour-payments/${tourId}/qr`;
        await cloudinary.v2.uploader.destroy(`${folder}/${publicId}`);
      } catch (cloudErr) {
        console.warn("Failed to delete QR from Cloudinary:", cloudErr);
        // Don't fail the request
      }
    }

    return res.status(200).json({
      success: true,
      message: "Payment method deleted successfully",
    });
  } catch (error) {
    console.error("deleteTourPaymentMethod error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete payment method",
      error: error.message,
    });
  }
};

const getTourVehicleSeatOverview = async (req, res) => {
  try {
    const { tourId } = req.params;

    if (!mongoose.isValidObjectId(tourId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tour ID format",
      });
    }

    // 1. Fetch relevant bookings
    const bookings = await tourBookingModel
      .find({
        tourId: new mongoose.Types.ObjectId(tourId),
      })
      .select(
        "tnr " +
        "travellers.firstName travellers.lastName " +
        "travellers.vehicleId travellers.vehicleName " +
        "travellers.seatNumber travellers.seatLocked " +
        "travellers.cancelled",
      )
      .lean();

    if (!bookings || bookings.length === 0) {
      return res.json({
        success: true,
        tourId,
        totalBookings: 0,
        totalTravellers: 0,
        vehicles: [],
        message: "No bookings found for this tour",
      });
    }

    // 2. Collect vehicle IDs only from travellers with seat + not cancelled
    const vehicleIds = new Set();
    bookings.forEach((booking) => {
      booking.travellers?.forEach((traveller) => {
        const hasSeat =
          traveller.seatNumber && String(traveller.seatNumber).trim() !== "";
        if (
          !traveller.cancelled?.byAdmin &&
          !traveller.cancelled?.byTraveller &&
          hasSeat &&
          traveller.vehicleId
        ) {
          vehicleIds.add(traveller.vehicleId.toString());
        }
      });
    });

    // 3. Load only relevant vehicles – FIXED fields to match schema (vehicleName + totalSeats)
    const vehicles = await TourVehicle.find({
      _id: {
        $in: [...vehicleIds].map((id) => new mongoose.Types.ObjectId(id)),
      },
    })
      .select("vehicleName totalSeats") // ← Changed to match schema
      .lean();

    const vehicleMap = new Map();
    vehicles.forEach((vehicle) => {
      const idStr = vehicle._id.toString();
      vehicleMap.set(idStr, {
        vehicleId: idStr,
        vehicleName: vehicle.vehicleName || "Unnamed Vehicle",
        capacity: Number(vehicle.totalSeats) || 0, // ← Use totalSeats from schema
        bookedSeats: 0,
        remainingSeats: 0,
        travellers: [],
      });
    });

    // 4. Process only travellers with seatNumber
    const unassigned = {
      vehicleName: "Not Assigned",
      vehicleId: null,
      capacity: null,
      bookedSeats: 0,
      remainingSeats: null,
      travellers: [],
    };

    let totalTravellersCount = 0;

    bookings.forEach((booking) => {
      booking.travellers?.forEach((traveller) => {
        // Skip if:
        // - cancelled, or
        // - no seat number assigned
        const hasSeat =
          traveller.seatNumber && String(traveller.seatNumber).trim() !== "";
        if (
          traveller.cancelled?.byAdmin ||
          traveller.cancelled?.byTraveller ||
          !hasSeat
        ) {
          return;
        }

        totalTravellersCount++;

        const travellerData = {
          tnr: booking.tnr || "(no TNR)",
          name:
            [traveller.firstName, traveller.lastName]
              .filter(Boolean)
              .join(" ")
              .trim() || "(no name)",
          seat: traveller.seatNumber || "—", // already checked above
          locked: traveller.seatLocked === true ? "Yes" : "No",
        };

        if (traveller.vehicleId) {
          const vid = traveller.vehicleId.toString();
          const veh = vehicleMap.get(vid);

          if (veh) {
            veh.travellers.push(travellerData);
            veh.bookedSeats += 1;
          } else {
            // orphaned vehicle reference → treat as unassigned
            unassigned.travellers.push(travellerData);
            unassigned.bookedSeats += 1;
          }
        } else {
          unassigned.travellers.push(travellerData);
          unassigned.bookedSeats += 1;
        }
      });
    });

    // 5. Prepare final list
    const resultVehicles = [...vehicleMap.values()];

    // Sort vehicles by name
    resultVehicles.sort((a, b) => a.vehicleName.localeCompare(b.vehicleName));

    // Unassigned at the end (only if has booked travellers)
    if (unassigned.travellers.length > 0) {
      resultVehicles.push(unassigned);
    }

    // 6. Calculate remaining seats
    resultVehicles.forEach((v) => {
      if (v.capacity !== null && typeof v.capacity === "number") {
        v.remainingSeats = Math.max(0, v.capacity - v.bookedSeats);
      }
    });

    return res.json({
      success: true,
      tourId,
      totalBookings: bookings.length,
      totalTravellers: totalTravellersCount, // ← only seated travellers
      vehicles: resultVehicles,
    });
  } catch (error) {
    console.error("getTourVehicleSeatOverview error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching vehicle & seat allocation overview",
      error: error.message,
    });
  }
};


const adminCreateEnquiry = async (req, res) => {
  try {
    const {
      fullName, mobileNumber, email, city,
      destination, tourType, preferredTravelDate, numberOfDays,
      numberOfNights, // ← ADD
      adults, children, infants, specialRequests, source,
    } = req.body;

    if (!fullName || !mobileNumber || !destination || !tourType) {
      return res.status(400).json({ success: false, message: "Please fill all required fields" });
    }

    const enquiry = await enquiryModel.create({
      fullName, mobileNumber, email, city,
      destination, tourType,
      preferredTravelDate: preferredTravelDate || null,
      numberOfDays: numberOfDays ? Number(numberOfDays) : null,
      numberOfNights: numberOfNights ? Number(numberOfNights) : null,
      adults: adults || 1,
      children: children || 0,
      infants: infants || 0,
      specialRequests,
      source: source || null,
      raisedBy: "admin",
    });

    return res.status(201).json({
      success: true,
      message: `Enquiry created! FIT Code: ${enquiry.fitCode}`,
      data: enquiry,
      fitCode: enquiry.fitCode,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAllEnquiries = async (req, res) => {
  try {
    // Auto-reject expired pending enquiries first
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await enquiryModel.updateMany(
      { status: "pending", preferredTravelDate: { $lt: today } },
      { $set: { status: "rejected" } }
    );

    const enquiries = await enquiryModel.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: enquiries });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
// GET BY ID — GET /api/tour/enquiry/:id
const getEnquiryById = async (req, res) => {
  try {
    const enquiry = await enquiryModel.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });
    return res.status(200).json({ success: true, data: enquiry });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// UPDATE — PUT /api/tour/enquiry/:id/update
const updateEnquiry = async (req, res) => {
  try {
    const enquiry = await enquiryModel.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: false }
    );
    if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });
    return res.status(200).json({ success: true, message: "Enquiry updated successfully", data: enquiry });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// DELETE — DELETE /api/tour/enquiry/:id/delete
// const deleteEnquiry = async (req, res) => {
//   try {
//     const enquiry = await enquiryModel.findByIdAndDelete(req.params.id);
//     if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });
//     return res.status(200).json({ success: true, message: "Enquiry deleted successfully" });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
//   }
// };

// ── TOGGLE "RATE PASSED AND HOLD" — PUT /api/tour/enquiry/:id/rate-passed ──
// This is a SEPARATE flag from `status` (pending/accepted/rejected). An
// enquiry stays "pending" in status terms while isRatePassed can
// independently be true or false. Used to surface enquiries where the
// rate has been confirmed/passed internally but the booking itself is
// still on hold pending customer confirmation. Only allowed while the
// enquiry's status is still "pending" — once accepted or rejected, the
// flag is locked at whatever value it last had (frontend additionally
// disables the toggle button once status leaves "pending").
const toggleRatePassed = async (req, res) => {
  try {
    const enquiry = await enquiryModel.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: "Enquiry not found" });
    }
    if (enquiry.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Rate Passed and Hold can only be toggled while the enquiry is still pending",
      });
    }

    enquiry.isRatePassed = !enquiry.isRatePassed;
    const updated = await enquiry.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: updated.isRatePassed
        ? "Marked as Rate Passed and Hold"
        : "Rate Passed and Hold cleared",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

const acceptEnquiry = async (req, res) => {
  try {
    const { salesValue, fitStates, pickupDate, pickupTime, pickupPlace } = req.body;

    // Validation — FIT states is OPTIONAL (no longer required to accept).
    // It's fine for fitStates to be missing, empty, or undefined here;
    // we simply default it to [] further down before saving.
    if (!salesValue || isNaN(Number(salesValue)) || Number(salesValue) <= 0) {
      return res.status(400).json({ success: false, message: "Valid sales value is required" });
    }
    if (!pickupDate) {
      return res.status(400).json({ success: false, message: "Pickup date is required" });
    }
    if (!pickupTime) {
      return res.status(400).json({ success: false, message: "Pickup time is required" });
    }
    if (!pickupPlace || !pickupPlace.trim()) {
      return res.status(400).json({ success: false, message: "Pickup place is required" });
    }

    const enquiry = await enquiryModel.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: "Enquiry not found" });
    }
    if (enquiry.status === "accepted") {
      return res.status(400).json({ success: false, message: "Enquiry already accepted" });
    }

    enquiry.status = "accepted";
    enquiry.salesValue = Number(salesValue);
    enquiry.fitStates = Array.isArray(fitStates) ? fitStates : [];
    enquiry.pickupDate = new Date(pickupDate);
    enquiry.pickupTime = pickupTime.trim();
    enquiry.pickupPlace = pickupPlace.trim();
    enquiry.acceptedAt = new Date();

    const updated = await enquiry.save({ validateBeforeSave: false });
    return res.status(200).json({
      success: true,
      message: "Enquiry accepted successfully",
      fitCode: updated.fitCode,
      data: updated
    });

  } catch (error) {
    console.error("Accept Enquiry Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// REJECT — PUT /api/tour/enquiry/:id/reject
const rejectEnquiry = async (req, res) => {
  try {
    const enquiry = await enquiryModel.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );
    if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });
    return res.status(200).json({ success: true, message: "Enquiry rejected", data: enquiry });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};







export {
  tourList,
  loginTour,
  bookingsTour,
  bookingComplete,
  tourDashboard,
  tourProfile,
  updateTourProfile,
  markOfflineAdvancePaid,
  markOfflineBalancePaid,
  updateTraveller,
  markAdvanceReceiptSent,
  markBalanceReceiptSent,
  viewTourBalance,
  viewTourAdvance,
  updateTourBalance,
  updateTourAdvance,
  updateBalanceRemark,
  updateAdvanceRemark,
  deleteBalanceRemark,
  deleteAdvanceRemark,
  updateModifyReceipt,
  viewBooking,
  getBookingInvoice,
  resyncInvoiceForTnr,      // ← ADDED: eager invoice resync, for use by other controllers
  updateBookingInvoice,
  deleteBookingInvoice,      // ← ADD THIS LINE
  getCancellationsByBooking,
  updateBookingBalance,
  getManagedBookingsHistory,
  allotRooms,
  // ==================== NEW ONES TO ADD ====================
  getManualRooms,           // View Both Guest + Leader Rooms
  addGuestRoom,             // Add Guest Room
  addLeaderRoom,            // Add Leader Room
  deleteLeaderRoom,
  // =========================================================


  getToursByYear,
  getAvailableTourYears,
  getAllBookings,
  TaskBookingComplete,
  taskMarkModifyReceipt,
  taskMarkAdvanceReceiptSent,
  taskMarkBalanceReceiptSent,
  taskMarkCancellationReceipt,
  taskMarkManageBookingReceipt,
  createTourVehicle,
  updateTourVehicle,
  toggleVehicleSeatSelection,
  getTourVehicles,
  deleteTourVehicle,
  addTour,
  getAllPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getTourPaymentMethods,
  createTourPaymentMethod,
  updateTourPaymentMethod,
  deleteTourPaymentMethod,
  getTourVehicleSeatOverview,

  // ↓ new ones
  adminCreateEnquiry,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiry,
  // deleteEnquiry,
  toggleRatePassed,
  acceptEnquiry,
  rejectEnquiry,


};