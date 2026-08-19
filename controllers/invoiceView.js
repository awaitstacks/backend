// /**
//  * invoiceView.js
//  * --------------------------------------
//  * Pure function — no DB writes here. Takes a `booking` (tourBookingModel
//  * doc) and its `tour` (tourModel doc, fetched fresh via booking.tourId —
//  * NOT the stale tourData snapshot stored on the booking) and returns the
//  * exact object the Receipt/Invoice page renders.
//  *
//  * KEY RULES:
//  *
//  * 1. invoiceNumber only exists once advance is paid — generated and stored
//  *    on the booking itself the first time advance.paid flips true (see
//  *    the markOfflineAdvancePaid patch below). If it's missing here, the
//  *    frontend button simply doesn't render — no separate flag needed.
//  *
//  * 2. GST is reverse-calculated from tour.price.* (which is GST-inclusive)
//  *    using tour.gst (defaults to 0, from the live tour document):
//  *      amountExGst = inclusivePrice / (1 + gst/100)
//  *      gstTotal    = inclusivePrice - amountExGst
//  *      cgst = sgst = gstTotal / 2
//  *    "Rate" on the invoice is the ex-GST unit price.
//  *
//  * 3. booking.adminRemarks (general ledger, NOT advanceAdminRemarks):
//  *      - amount > 0 → extra invoice line item (0% GST), adds to grand total
//  *      - amount < 0 → a "payment" entry (discount/adjustment), adds to
//  *        Amount Paid and reduces Due Amount
//  *
//  *    advanceAdminRemarks with amount < 0 ARE re-applied here as payment
//  *    entries too (e.g. "PARTIAL BALANCE PAID" style refunds/adjustments
//  *    logged against the advance side) — see buildPayments below.
//  *
//  * 4. status flips to "Paid" the instant (grandTotal - amountPaid) <= 0.
//  *    That's what drives the Receipt → Invoice swap on the button/title.
//  *
//  * ── sourceRef ────────────────────────────────────────────────────────────
//  * Every item/payment this file generates carries a `sourceRef` tag:
//  *   - "base:<sharingType>"   → auto sharing-group line item
//  *   - "ar:<adminRemarkId>"   → derived from an adminRemarks[] entry
//  *   - "aar:<remarkId>"       → derived from an advanceAdminRemarks[] entry
//  *   - "advance" / "balance"  → the two payment ledger entries
//  *
//  * This tag is how tourController.js's syncInvoiceWithBooking() tells
//  * "auto-generated, always refresh from the live booking" items apart from
//  * manually-added items/payments (which have no sourceRef and are always
//  * preserved untouched). Do not remove/rename these tags without also
//  * updating that merge logic.
//  */

// export const currencyRound = (n) => Math.round(Number(n || 0) * 100) / 100;

// const splitGst = (inclusiveAmount, gstRate) => {
//   const amountExGst = currencyRound(inclusiveAmount / (1 + gstRate / 100));
//   const gstTotal = currencyRound(inclusiveAmount - amountExGst);
//   const cgst = currencyRound(gstTotal / 2);
//   const sgst = currencyRound(gstTotal - cgst);
//   return { amountExGst, cgst, sgst };
// };

// const SHARING_PRICE_KEY = {
//   double: "doubleSharing",
//   triple: "tripleSharing",
//   withBerth: "childWithBerth",
//   withoutBerth: "childWithoutBerth",
// };

// const buildBaseItems = (booking, tour) => {
//   const gstRate = tour?.gst || 0;
//   const tourTitle = tour?.title || "TOUR BOOKING";

//   const groups = {};
//   (booking.travellers || []).forEach((t) => {
//     if (t.cancelled?.byTraveller || t.cancelled?.byAdmin) return; // skip cancelled
//     const key = t.sharingType || "default";
//     groups[key] = groups[key] || [];
//     groups[key].push(t);
//   });

//   return Object.entries(groups).map(([sharingType, travellers]) => {
//     const qty = travellers.length;
//     const priceKey = SHARING_PRICE_KEY[sharingType];
//     const packageForTraveller = (t) =>
//       t.packageType === "variant" && tour?.variantPackage?.[t.variantPackageIndex]
//         ? tour.variantPackage[t.variantPackageIndex]
//         : tour;

//     // Sum inclusive price across this group (handles mixed main/variant packages)
//     const inclusiveTotal = travellers.reduce((sum, t) => {
//       const pkg = packageForTraveller(t);
//       return sum + (pkg?.price?.[priceKey] || 0);
//     }, 0);

//     const { amountExGst, cgst, sgst } = splitGst(inclusiveTotal, gstRate);
//     const rate = qty > 0 ? currencyRound(amountExGst / qty) : 0;

//     const label =
//       sharingType === "withBerth"
//         ? "CHILD FARE"
//         : sharingType === "withoutBerth"
//           ? "CHILD FARE (WITHOUT BERTH)"
//           : `${tourTitle} [${sharingType.toUpperCase()} SHARING]`;

//     return {
//       description: label,
//       subDescription: `TNR: ${booking.tnr || "—"}`,
//       sourceRef: `base:${sharingType}`,
//       gstRate,
//       quantity: qty,
//       rate,
//       amount: amountExGst,
//       cgst,
//       sgst,
//       total: currencyRound(amountExGst + cgst + sgst),
//     };
//   });
// };

// const buildExtraItemsFromRemarks = (booking) =>
//   (booking.adminRemarks || [])
//     .filter((r) => (r.amount || 0) > 0)
//     .map((r) => ({
//       description: r.remark || "Additional Charge",
//       subDescription: "",
//       sourceRef: `ar:${r._id}`,
//       gstRate: 0,
//       quantity: 1,
//       rate: r.amount,
//       amount: r.amount,
//       cgst: 0,
//       sgst: 0,
//       total: r.amount,
//     }));

// const buildPayments = (booking) => {
//   const payments = [];

//   if (booking.payment?.advance?.paid) {
//     payments.push({
//       date: booking.payment.advance.paidAt,
//       amountReceived: booking.payment.advance.amount,
//       sourceRef: "advance",
//     });
//   }
//   if (booking.payment?.balance?.paid) {
//     payments.push({
//       date: booking.payment.balance.paidAt,
//       amountReceived: booking.payment.balance.amount,
//       sourceRef: "balance",
//     });
//   }

//   // Negative adminRemarks act like a "payment" — a discount/adjustment
//   // that reduces what's still owed.
//   (booking.adminRemarks || [])
//     .filter((r) => (r.amount || 0) < 0)
//     .forEach((r) => {
//       payments.push({
//         date: r.addedAt,
//         amountReceived: Math.abs(r.amount),
//         sourceRef: `ar:${r._id}`,
//       });
//     });

//   // advance-side remarks (e.g. "PARTIAL BALANCE PAID" / refund) — same
//   // treatment as negative adminRemarks above.
//   (booking.advanceAdminRemarks || [])
//     .filter((r) => (r.amount || 0) < 0)
//     .forEach((r) => {
//       payments.push({
//         date: r.addedAt,
//         amountReceived: Math.abs(r.amount),
//         sourceRef: `aar:${r._id}`,
//       });
//     });

//   return payments;
// };


// const buildAddonItems = (booking) =>
//   (booking.travellers || [])
//     .filter((t) => !t.cancelled?.byTraveller && !t.cancelled?.byAdmin) // skip cancelled
//     .filter((t) => t.selectedAddon?.name && Number(t.selectedAddon?.price) > 0)
//     .map((t) => ({
//       description: t.selectedAddon.name,
//       subDescription: "Add-on",
//       sourceRef: `addon:${t._id}`,
//       gstRate: 0,
//       quantity: 1,
//       rate: Number(t.selectedAddon.price) || 0,
//       amount: Number(t.selectedAddon.price) || 0,
//       cgst: 0,
//       sgst: 0,
//       total: Number(t.selectedAddon.price) || 0,
//     }));


// const buildCancellationPoolItems = (booking) => {
//   const items = [];

//   const gv = Number(booking.gvCancellationPool || 0);
//   if (gv !== 0) {
//     items.push({
//       description: "GV Cancellation Pool",
//       subDescription: `TNR: ${booking.tnr || "—"}`,
//       sourceRef: "gvpool",
//       gstRate: 0,
//       quantity: 1,
//       rate: gv,
//       amount: gv,
//       cgst: 0,
//       sgst: 0,
//       total: gv,
//     });
//   }

//   const irctc = Number(booking.irctcCancellationPool || 0);
//   if (irctc !== 0) {
//     items.push({
//       description: "IRCTC Cancellation Pool",
//       subDescription: `TNR: ${booking.tnr || "—"}`,
//       sourceRef: "irctcpool",
//       gstRate: 0,
//       quantity: 1,
//       rate: irctc,
//       amount: irctc,
//       cgst: 0,
//       sgst: 0,
//       total: irctc,
//     });
//   }

//   return items;
// };

// export const buildInvoiceView = (booking, tour) => {
//   // No invoice number yet = advance hasn't been paid. Frontend should not
//   // render the Receipt button in this case.
//   if (!booking.invoiceNumber) {
//     return null;
//   }

//   const baseItems = buildBaseItems(booking, tour);
//   const addonItems = buildAddonItems(booking);        // ← ADD THIS
//   const poolItems = buildCancellationPoolItems(booking);   // ← ADD THIS

//   const extraItems = buildExtraItemsFromRemarks(booking);
//   const items = [...baseItems, ...addonItems, ...poolItems, ...extraItems];   // ← UPDATED
//   const amountSum = currencyRound(items.reduce((s, i) => s + i.amount, 0));
//   const cgstSum = currencyRound(items.reduce((s, i) => s + i.cgst, 0));
//   const sgstSum = currencyRound(items.reduce((s, i) => s + i.sgst, 0));
//   const grandTotal = currencyRound(items.reduce((s, i) => s + i.total, 0));

//   const payments = buildPayments(booking);
//   const amountPaid = currencyRound(
//     payments.reduce((s, p) => s + p.amountReceived, 0),
//   );

//   const dueAmount = currencyRound(grandTotal - amountPaid);
//   const isFullyPaid = dueAmount <= 0;
//   const status = isFullyPaid ? "Paid" : "Part Paid";

//   return {
//     invoiceNumber: booking.invoiceNumber,
//     purchaseDate: booking.bookingDate,
//     dueDate: tour?.lastBookingDate, // trip start date, stored on the tour itself
//     tourCode: tour?.title, // shows the TOUR NAME here, not the batch/category

//     billedBy: {
//       companyName: "GV - TOUR PLANNERS LLP",
//       addressLine1: "15/4, Nehru street, Jaihindpuram",
//       city: "Madurai",
//       state: "Tamil Nadu",
//       country: "India",
//       pincode: "625011",
//       gstin: "33AAYFG5132F1ZC",
//       pan: "AAYFG5132F",
//       tan: "MRIG03766A",
//       phone: "+91 90039 98648",
//     },

//     billedTo: {
//       name:
//         `${booking.travellers?.[0]?.firstName || ""} ${booking.travellers?.[0]?.lastName || ""}`.trim() ||
//         booking.userData?.name,
//       addressLine1: booking.billingAddress?.addressLine1,
//       addressLine2: booking.billingAddress?.addressLine2,
//       city: booking.billingAddress?.city,
//       state: booking.billingAddress?.state,
//       country: booking.billingAddress?.country,
//       pincode: booking.billingAddress?.pincode,
//       phone: booking.contact?.mobile,
//     },

//     countryOfSupply: "India",
//     placeOfSupply: "Tamil Nadu (33)",

//     items,

//     totals: {
//       amount: amountSum,
//       cgst: cgstSum,
//       sgst: sgstSum,
//       roundOff: currencyRound(grandTotal - (amountSum + cgstSum + sgstSum)),
//       grandTotal,
//     },

//     payments,
//     amountPaid,
//     dueAmount: Math.max(0, dueAmount),
//     status,
//   };
// };


/**
 * invoiceView.js
 * --------------------------------------
 * Pure function — no DB writes here. Takes a `booking` (tourBookingModel
 * doc) and its `tour` (tourModel doc, fetched fresh via booking.tourId —
 * NOT the stale tourData snapshot stored on the booking) and returns the
 * exact object the Receipt/Invoice page renders.
 *
 * KEY RULES:
 *
 * 1. invoiceNumber only exists once advance is paid — generated and stored
 *    on the booking itself the first time advance.paid flips true (see
 *    the markOfflineAdvancePaid patch below). If it's missing here, the
 *    frontend button simply doesn't render — no separate flag needed.
 *
 * 2. GST is reverse-calculated from tour.price.* (which is GST-inclusive)
 *    using tour.gst (defaults to 0, from the live tour document):
 *      amountExGst = inclusivePrice / (1 + gst/100)
 *      gstTotal    = inclusivePrice - amountExGst
 *      cgst = sgst = gstTotal / 2
 *    "Rate" on the invoice is the ex-GST unit price.
 *
 * 3. booking.adminRemarks (general ledger, NOT advanceAdminRemarks):
 *      - amount > 0 → extra invoice line item (0% GST), adds to grand total
 *      - amount < 0 → a "payment" entry (discount/adjustment), adds to
 *        Amount Paid and reduces Due Amount
 *
 *    advanceAdminRemarks with amount < 0 ARE re-applied here as payment
 *    entries too (e.g. "PARTIAL BALANCE PAID" style refunds/adjustments
 *    logged against the advance side) — see buildPayments below.
 *
 * 4. status flips to "Paid" the instant (grandTotal - amountPaid) <= 0.
 *    That's what drives the Receipt → Invoice swap on the button/title.
 *
 * 5. selectedAddon.price on a traveller can be NEGATIVE (e.g. "WITHOUT
 *    TRAIN LESS" — a discount off the package price because the
 *    traveller opted out of train travel). Negative addons are NOT
 *    filtered out — they show up as their own line item (with a negative
 *    amount/total) so the description stays visible on the invoice, and
 *    the negative total naturally reduces the grand total during the
 *    items.reduce() sum. See buildAddonItems below.
 *
 * ── sourceRef ────────────────────────────────────────────────────────────
 * Every item/payment this file generates carries a `sourceRef` tag:
 *   - "base:<sharingType>"   → auto sharing-group line item
 *   - "ar:<adminRemarkId>"   → derived from an adminRemarks[] entry
 *   - "aar:<remarkId>"       → derived from an advanceAdminRemarks[] entry
 *   - "addon:<travellerId>"  → derived from a traveller's selectedAddon
 *   - "gvpool" / "irctcpool" → derived from the booking's cancellation pools
 *   - "advance" / "balance"  → the two payment ledger entries
 *
 * This tag is how tourController.js's syncInvoiceWithBooking() tells
 * "auto-generated, always refresh from the live booking" items apart from
 * manually-added items/payments (which have no sourceRef and are always
 * preserved untouched). Do not remove/rename these tags without also
 * updating that merge logic.
 */

// export const currencyRound = (n) => Math.round(Number(n || 0) * 100) / 100;

// const splitGst = (inclusiveAmount, gstRate) => {
//   const amountExGst = currencyRound(inclusiveAmount / (1 + gstRate / 100));
//   const gstTotal = currencyRound(inclusiveAmount - amountExGst);
//   const cgst = currencyRound(gstTotal / 2);
//   const sgst = currencyRound(gstTotal - cgst);
//   return { amountExGst, cgst, sgst };
// };

// const SHARING_PRICE_KEY = {
//   double: "doubleSharing",
//   triple: "tripleSharing",
//   withBerth: "childWithBerth",
//   withoutBerth: "childWithoutBerth",
// };

// const buildBaseItems = (booking, tour) => {
//   const gstRate = tour?.gst || 0;
//   const tourTitle = tour?.title || "TOUR BOOKING";

//   const groups = {};
//   (booking.travellers || []).forEach((t) => {
//     if (t.cancelled?.byTraveller || t.cancelled?.byAdmin) return;
//     const key = t.sharingType || "default";
//     groups[key] = groups[key] || [];
//     groups[key].push(t);
//   });

//   let tnrShown = false;

//   return Object.entries(groups).map(([sharingType, travellers]) => {
//     const qty = travellers.length;
//     const priceKey = SHARING_PRICE_KEY[sharingType];
//     const packageForTraveller = (t) =>
//       t.packageType === "variant" && tour?.variantPackage?.[t.variantPackageIndex]
//         ? tour.variantPackage[t.variantPackageIndex]
//         : tour;

//     // Group identical negative addons (same name + same per-person price)
//     // so "UP AND DOWN WITHOUT TRAIN LESS" for 2 travellers shows as ONE
//     // line with a count and combined total, instead of one line per
//     // traveller.
//     const discountGroups = {};
//     const inclusiveTotal = travellers.reduce((sum, t) => {
//       const pkg = packageForTraveller(t);
//       const base = pkg?.price?.[priceKey] || 0;
//       const addonPrice = Number(t.selectedAddon?.price) || 0;

//       if (addonPrice < 0 && t.selectedAddon?.name) {
//         const key = `${t.selectedAddon.name}::${addonPrice}`;
//         if (!discountGroups[key]) {
//           discountGroups[key] = {
//             name: t.selectedAddon.name,
//             perPersonAmount: Math.abs(addonPrice),
//             count: 0,
//           };
//         }
//         discountGroups[key].count += 1;
//         return sum + base + addonPrice;
//       }
//       return sum + base;
//     }, 0);

//     const discountLines = Object.values(discountGroups).map((g) => {
//       const total = g.perPersonAmount * g.count;
//       return g.count > 1
//         ? `${g.name} (LESS ${g.perPersonAmount} INR x ${g.count} = ${total} INR)`
//         : `${g.name} (LESS ${g.perPersonAmount} INR)`;
//     });

//     const { amountExGst, cgst, sgst } = splitGst(inclusiveTotal, gstRate);
//     const rate = qty > 0 ? currencyRound(amountExGst / qty) : 0;

//     const label =
//       sharingType === "withBerth"
//         ? "CHILD FARE"
//         : sharingType === "withoutBerth"
//           ? "CHILD FARE (WITHOUT BERTH)"
//           : `${tourTitle} [${sharingType.toUpperCase()} SHARING]`;

//     const subDescriptionLines = [];
//     if (!tnrShown) {
//       subDescriptionLines.push(`TNR: ${booking.tnr || "—"}`);
//       tnrShown = true;
//     }
//     subDescriptionLines.push(...discountLines);

//     return {
//       description: label,
//       subDescription: subDescriptionLines.join("\n"),
//       sourceRef: `base:${sharingType}`,
//       gstRate,
//       quantity: qty,
//       rate,
//       amount: amountExGst,
//       cgst,
//       sgst,
//       total: currencyRound(amountExGst + cgst + sgst),
//     };
//   });
// };

// const buildExtraItemsFromRemarks = (booking) =>
//   (booking.adminRemarks || [])
//     .filter((r) => (r.amount || 0) > 0)
//     .map((r) => ({
//       description: r.remark || "Additional Charge",
//       subDescription: "",
//       sourceRef: `ar:${r._id}`,
//       gstRate: 0,
//       quantity: 1,
//       rate: r.amount,
//       amount: r.amount,
//       cgst: 0,
//       sgst: 0,
//       total: r.amount,
//     }));

// const buildPayments = (booking) => {
//   const payments = [];

//   if (booking.payment?.advance?.paid) {
//     payments.push({
//       date: booking.payment.advance.paidAt,
//       amountReceived: booking.payment.advance.amount,
//       sourceRef: "advance",
//     });
//   }
//   if (booking.payment?.balance?.paid) {
//     payments.push({
//       date: booking.payment.balance.paidAt,
//       amountReceived: booking.payment.balance.amount,
//       sourceRef: "balance",
//     });
//   }

//   // Negative adminRemarks act like a "payment" — a discount/adjustment
//   // that reduces what's still owed.
//   (booking.adminRemarks || [])
//     .filter((r) => (r.amount || 0) < 0)
//     .forEach((r) => {
//       payments.push({
//         date: r.addedAt,
//         amountReceived: Math.abs(r.amount),
//         sourceRef: `ar:${r._id}`,
//       });
//     });

//   // advance-side remarks (e.g. "PARTIAL BALANCE PAID" / refund) — same
//   // treatment as negative adminRemarks above.
//   (booking.advanceAdminRemarks || [])
//     .filter((r) => (r.amount || 0) < 0)
//     .forEach((r) => {
//       payments.push({
//         date: r.addedAt,
//         amountReceived: Math.abs(r.amount),
//         sourceRef: `aar:${r._id}`,
//       });
//     });

//   return payments;
// };

// // Groups identical addons (same name + same price) across travellers into
// // ONE line item with quantity = number of travellers who have it, instead
// // of one row per traveller. Keeps the invoice clean when many travellers
// // pick the same add-on.
// const buildAddonItems = (booking) => {
//   const groups = {};

//   (booking.travellers || [])
//     .filter((t) => !t.cancelled?.byTraveller && !t.cancelled?.byAdmin)
//     .filter((t) => t.selectedAddon?.name && Number(t.selectedAddon?.price) > 0)
//     .forEach((t) => {
//       const name = t.selectedAddon.name;
//       const price = Number(t.selectedAddon.price) || 0;
//       // key on name+price so genuinely different-priced addons with the
//       // same name don't get merged incorrectly
//       const key = `${name}::${price}`;

//       if (!groups[key]) {
//         groups[key] = {
//           name,
//           price,
//           travellerIds: [],
//         };
//       }
//       groups[key].travellerIds.push(t._id);
//     });

//   return Object.values(groups).map((g) => {
//     const qty = g.travellerIds.length;
//     const amount = currencyRound(g.price * qty);
//     return {
//       description: g.name,
//       subDescription: "",
//       sourceRef: `addon:${g.travellerIds.join(",")}`,
//       gstRate: 0,
//       quantity: qty,
//       rate: g.price,
//       amount,
//       cgst: 0,
//       sgst: 0,
//       total: amount,
//     };
//   });
// };
// // Amount comes from tourBookingModel (booking.gvCancellationPool /
// // booking.irctcCancellationPool) — a fixed TOTAL amount stored on the
// // booking itself. The TRAVELLER COUNT comes from the SEPARATE
// // cancellationModel collection — count of travellerIds across all
// // cancellation records for this booking. We divide amount by that count
// // to get a per-person rate, then show Qty × Rate = same total.
// //
// // Example: booking.gvCancellationPool = 3000, cancellationModel has
// // 2 travellerIds total for this booking → rate = 3000/2 = 1500,
// // invoice row = Qty 2, Rate ₹1,500, Amount ₹3,000.
// const buildCancellationPoolItems = (booking, cancellations) => {
//   const items = [];
//   const list = Array.isArray(cancellations) ? cancellations : [];

//   // total distinct cancelled traveller count across all cancellation
//   // records tied to this booking
//   const cancelledTravellerCount = list.reduce(
//     (sum, c) => sum + ((c.travellerIds || []).length || 0),
//     0,
//   );

//   const buildRow = (totalAmount, label, sourceRefPrefix) => {
//     if (!totalAmount || cancelledTravellerCount <= 0) return;

//     const rate = currencyRound(totalAmount / cancelledTravellerCount);
//     items.push({
//       description: label,
//       subDescription: "",
//       sourceRef: `${sourceRefPrefix}:${booking._id}`,
//       gstRate: 0,
//       quantity: cancelledTravellerCount,
//       rate,
//       amount: totalAmount,
//       cgst: 0,
//       sgst: 0,
//       total: totalAmount,
//     });
//   };

//   buildRow(Number(booking.gvCancellationPool || 0), "GV Cancellation Pool", "gvpool");
//   buildRow(Number(booking.irctcCancellationPool || 0), "IRCTC Cancellation Pool", "irctcpool");

//   return items;
// };

// export const buildInvoiceView = (booking, tour, cancellations = []) => {
//   // No invoice number yet = advance hasn't been paid. Frontend should not
//   // render the Receipt button in this case.
//   if (!booking.invoiceNumber) {
//     return null;
//   }

//   const baseItems = buildBaseItems(booking, tour);
//   const addonItems = buildAddonItems(booking);
//   const poolItems = buildCancellationPoolItems(booking, cancellations);
//   const extraItems = buildExtraItemsFromRemarks(booking);
//   const items = [...baseItems, ...addonItems, ...poolItems, ...extraItems];

//   const amountSum = currencyRound(items.reduce((s, i) => s + i.amount, 0));
//   const cgstSum = currencyRound(items.reduce((s, i) => s + i.cgst, 0));
//   const sgstSum = currencyRound(items.reduce((s, i) => s + i.sgst, 0));
//   const grandTotal = currencyRound(items.reduce((s, i) => s + i.total, 0));

//   const payments = buildPayments(booking);
//   const amountPaid = currencyRound(
//     payments.reduce((s, p) => s + p.amountReceived, 0),
//   );

//   const dueAmount = currencyRound(grandTotal - amountPaid);
//   const isFullyPaid = dueAmount <= 0;
//   const status = isFullyPaid ? "Paid" : "Part Paid";

//   return {
//     invoiceNumber: booking.invoiceNumber,
//     purchaseDate: booking.bookingDate,
//     dueDate: tour?.lastBookingDate, // trip start date, stored on the tour itself
//     tourCode: tour?.title, // shows the TOUR NAME here, not the batch/category

//     billedBy: {
//       companyName: "GV - TOUR PLANNERS LLP",
//       addressLine1: "15/4, Nehru street, Jaihindpuram",
//       city: "Madurai",
//       state: "Tamil Nadu",
//       country: "India",
//       pincode: "625011",
//       gstin: "33AAYFG5132F1ZC",
//       pan: "AAYFG5132F",
//       tan: "MRIG03766A",
//       phone: "+91 90039 98648",
//     },

//     billedTo: {
//       name:
//         `${booking.travellers?.[0]?.firstName || ""} ${booking.travellers?.[0]?.lastName || ""}`.trim() ||
//         booking.userData?.name,
//       addressLine1: booking.billingAddress?.addressLine1,
//       addressLine2: booking.billingAddress?.addressLine2,
//       city: booking.billingAddress?.city,
//       state: booking.billingAddress?.state,
//       country: booking.billingAddress?.country,
//       pincode: booking.billingAddress?.pincode,
//       phone: booking.contact?.mobile,
//     },

//     countryOfSupply: "India",
//     placeOfSupply: "Tamil Nadu (33)",

//     items,

//     totals: {
//       amount: amountSum,
//       cgst: cgstSum,
//       sgst: sgstSum,
//       roundOff: currencyRound(grandTotal - (amountSum + cgstSum + sgstSum)),
//       grandTotal,
//     },

//     payments,
//     amountPaid,
//     dueAmount: Math.max(0, dueAmount),
//     status,
//   };
// };

/**
 * invoiceView.js
 * --------------------------------------
 * Pure function — no DB writes here. Takes a `booking` (tourBookingModel
 * doc) and its `tour` (tourModel doc, fetched fresh via booking.tourId —
 * NOT the stale tourData snapshot stored on the booking) and returns the
 * exact object the Receipt/Invoice page renders.
 *
 * KEY RULES:
 *
 * 1. invoiceNumber only exists once advance is paid — generated and stored
 *    on the booking itself the first time advance.paid flips true (see
 *    the markOfflineAdvancePaid patch below). If it's missing here, the
 *    frontend button simply doesn't render — no separate flag needed.
 *
 * 2. GST is reverse-calculated from tour.price.* (which is GST-inclusive)
 *    using tour.gst (defaults to 0, from the live tour document):
 *      amountExGst = inclusivePrice / (1 + gst/100)
 *      gstTotal    = inclusivePrice - amountExGst
 *      cgst = sgst = gstTotal / 2
 *    "Rate" on the invoice is the ex-GST unit price.
 *
 * 3. booking.adminRemarks (general ledger, NOT advanceAdminRemarks):
 *      - amount > 0 → extra invoice line item (0% GST), adds to grand total
 *      - amount < 0 → a "payment" entry (discount/adjustment), adds to
 *        Amount Paid and reduces Due Amount
 *
 *    advanceAdminRemarks with amount < 0 ARE re-applied here as payment
 *    entries too (e.g. "PARTIAL BALANCE PAID" style refunds/adjustments
 *    logged against the advance side) — see buildPayments below.
 *
 * 4. status flips to "Paid" the instant (grandTotal - amountPaid) <= 0.
 *    That's what drives the Receipt → Invoice swap on the button/title.
 *
 * 5. Each traveller can carry MULTIPLE addons in `selectedAddons[]`
 *    (train-leg and/or flight-leg addons, e.g. an "UP" train addon and a
 *    separate "DOWN" flight addon). Every addon entry is billed as its
 *    OWN line — they are never merged just because the name/price match,
 *    unless they're genuinely the same leg (see addonLegKey below).
 *
 *    Legacy bookings may still carry the old singular `selectedAddon`
 *    field instead of the array — addonsOf() normalizes both shapes.
 *
 *    Negative addon amounts (e.g. "WITHOUT TRAIN LESS" — a discount off
 *    the package price because the traveller opted out of train travel)
 *    are NOT filtered out — they show up as their own line item (with a
 *    negative amount/total) so the description stays visible on the
 *    invoice, and the negative total naturally reduces the grand total
 *    during the items.reduce() sum. See buildAddonItems below.
 *
 * ── sourceRef ────────────────────────────────────────────────────────────
 * Every item/payment this file generates carries a `sourceRef` tag:
 *   - "base:<sharingType>"        → auto sharing-group line item
 *   - "ar:<adminRemarkId>"        → derived from an adminRemarks[] entry
 *   - "aar:<remarkId>"            → derived from an advanceAdminRemarks[] entry
 *   - "addon:<addonEntryId,...>"  → derived from traveller selectedAddons
 *                                    entries (one or more addon sub-doc
 *                                    _ids grouped into this line)
 *   - "gvpool" / "irctcpool"      → derived from the booking's cancellation pools
 *   - "advance" / "balance"       → the two payment ledger entries
 *
 * This tag is how tourController.js's syncInvoiceWithBooking() tells
 * "auto-generated, always refresh from the live booking" items apart from
 * manually-added items/payments (which have no sourceRef and are always
 * preserved untouched). Do not remove/rename these tags without also
 * updating that merge logic.
 */

export const currencyRound = (n) => Math.round(Number(n || 0) * 100) / 100;

const splitGst = (inclusiveAmount, gstRate) => {
  const amountExGst = currencyRound(inclusiveAmount / (1 + gstRate / 100));
  const gstTotal = currencyRound(inclusiveAmount - amountExGst);
  const cgst = currencyRound(gstTotal / 2);
  const sgst = currencyRound(gstTotal - cgst);
  return { amountExGst, cgst, sgst };
};

const SHARING_PRICE_KEY = {
  double: "doubleSharing",
  triple: "tripleSharing",
  withBerth: "childWithBerth",
  withoutBerth: "childWithoutBerth",
};

// ── addon helpers ───────────────────────────────────────────────────────

// Normalizes a traveller's addons to an array, regardless of whether the
// booking doc still has the old singular `selectedAddon` or the new
// `selectedAddons[]`.
const addonsOf = (t) =>
  Array.isArray(t.selectedAddons)
    ? t.selectedAddons
    : t.selectedAddon
      ? [t.selectedAddon]
      : [];

// Human-readable leg label for a train/flight addon, shown as the small
// gray SUBTITLE under the addon name (bold), same visual slot as
// "TNR: UD50GY", e.g.:
//   "MIDDLE-HAMSAFER(34567)"
//   "UP-IndiGo(AI202)"
// Falls back to just the tripType, or null if there's nothing travel-
// specific on this addon (a plain non-travel addon) — in which case no
// subtitle line is shown at all.
const describeAddonLeg = (addon) => {
  if (addon?.trainNo || addon?.trainName) {
    const parts = [];
    if (addon.tripType) parts.push(addon.tripType);
    if (addon.trainName) parts.push(addon.trainName);
    const label = parts.join("-");
    return addon.trainNo ? `${label}(${addon.trainNo})` : label;
  }
  if (addon?.flightNo || addon?.airline) {
    const parts = [];
    if (addon.tripType) parts.push(addon.tripType);
    if (addon.airline) parts.push(addon.airline);
    const label = parts.join("-");
    return addon.flightNo ? `${label}(${addon.flightNo})` : label;
  }
  if (addon?.tripType) return addon.tripType;
  return null;
};

// Identifies WHICH leg an addon belongs to, so two addons with the same
// name+amount but different train/flight legs are never merged into one
// invoice row.
const addonLegKey = (addon) =>
  [
    addon?.trainIndex ?? "",
    addon?.flightIndex ?? "",
    addon?.tripIndex ?? "",
    addon?.tripType ?? "",
  ].join("|");

const addonAmount = (addon) => Number(addon?.amount ?? addon?.price) || 0;

const buildBaseItems = (booking, tour) => {
  const gstRate = tour?.gst || 0;
  const tourTitle = tour?.title || "TOUR BOOKING";

  const groups = {};
  (booking.travellers || []).forEach((t) => {
    if (t.cancelled?.byTraveller || t.cancelled?.byAdmin) return;
    const key = t.sharingType || "default";
    groups[key] = groups[key] || [];
    groups[key].push(t);
  });

  let tnrShown = false;

  return Object.entries(groups).map(([sharingType, travellers]) => {
    const qty = travellers.length;
    const priceKey = SHARING_PRICE_KEY[sharingType];
    const packageForTraveller = (t) =>
      t.packageType === "variant" && tour?.variantPackage?.[t.variantPackageIndex]
        ? tour.variantPackage[t.variantPackageIndex]
        : tour;

    // Group identical negative addons (same name + same per-person price
    // + same train/flight leg) so "UP AND DOWN WITHOUT TRAIN LESS" for 2
    // travellers on the SAME leg shows as ONE line with a count and
    // combined total, instead of one line per traveller. A negative addon
    // on a DIFFERENT leg (e.g. flight instead of train) is kept separate
    // even if the name/price happen to match.
    const discountGroups = {};
    const inclusiveTotal = travellers.reduce((sum, t) => {
      const pkg = packageForTraveller(t);
      const base = pkg?.price?.[priceKey] || 0;

      let travellerTotal = base;
      addonsOf(t).forEach((addon) => {
        const amount = addonAmount(addon);
        if (amount < 0 && addon.name) {
          const leg = describeAddonLeg(addon);
          const key = `${addon.name}::${amount}::${addonLegKey(addon)}`;
          if (!discountGroups[key]) {
            discountGroups[key] = {
              name: addon.name,
              leg,
              perPersonAmount: Math.abs(amount),
              count: 0,
            };
          }
          discountGroups[key].count += 1;
          travellerTotal += amount;
        }
      });
      return sum + travellerTotal;
    }, 0);

    const discountLines = Object.values(discountGroups).flatMap((g) => {
      const total = g.perPersonAmount * g.count;
      const line =
        g.count > 1
          ? `${g.name} (LESS ${g.perPersonAmount} INR x ${g.count} = ${total} INR)`
          : `${g.name} (LESS ${g.perPersonAmount} INR)`;
      return g.leg ? [line, g.leg] : [line];
    });

    const { amountExGst, cgst, sgst } = splitGst(inclusiveTotal, gstRate);
    const rate = qty > 0 ? currencyRound(amountExGst / qty) : 0;

    const label =
      sharingType === "withBerth"
        ? "CHILD FARE"
        : sharingType === "withoutBerth"
          ? "CHILD FARE (WITHOUT BERTH)"
          : `${tourTitle} [${sharingType.toUpperCase()} SHARING]`;

    const subDescriptionLines = [];
    if (!tnrShown) {
      subDescriptionLines.push(`TNR: ${booking.tnr || "—"}`);
      tnrShown = true;
    }
    subDescriptionLines.push(...discountLines);

    return {
      description: label,
      subDescription: subDescriptionLines.join("\n"),
      sourceRef: `base:${sharingType}`,
      gstRate,
      quantity: qty,
      rate,
      amount: amountExGst,
      cgst,
      sgst,
      total: currencyRound(amountExGst + cgst + sgst),
    };
  });
};

const buildExtraItemsFromRemarks = (booking) =>
  (booking.adminRemarks || [])
    .filter((r) => (r.amount || 0) > 0)
    .map((r) => ({
      description: r.remark || "Additional Charge",
      subDescription: "",
      sourceRef: `ar:${r._id}`,
      gstRate: 0,
      quantity: 1,
      rate: r.amount,
      amount: r.amount,
      cgst: 0,
      sgst: 0,
      total: r.amount,
    }));

const buildPayments = (booking) => {
  const payments = [];

  if (booking.payment?.advance?.paid) {
    payments.push({
      date: booking.payment.advance.paidAt,
      amountReceived: booking.payment.advance.amount,
      sourceRef: "advance",
    });
  }
  if (booking.payment?.balance?.paid) {
    payments.push({
      date: booking.payment.balance.paidAt,
      amountReceived: booking.payment.balance.amount,
      sourceRef: "balance",
    });
  }

  // Negative adminRemarks act like a "payment" — a discount/adjustment
  // that reduces what's still owed.
  (booking.adminRemarks || [])
    .filter((r) => (r.amount || 0) < 0)
    .forEach((r) => {
      payments.push({
        date: r.addedAt,
        amountReceived: Math.abs(r.amount),
        sourceRef: `ar:${r._id}`,
      });
    });

  // advance-side remarks (e.g. "PARTIAL BALANCE PAID" / refund) — same
  // treatment as negative adminRemarks above.
  (booking.advanceAdminRemarks || [])
    .filter((r) => (r.amount || 0) < 0)
    .forEach((r) => {
      payments.push({
        date: r.addedAt,
        amountReceived: Math.abs(r.amount),
        sourceRef: `aar:${r._id}`,
      });
    });

  return payments;
};

// Groups identical addons (same name + same amount + same train/flight
// leg) across travellers into ONE line item with quantity = number of
// travellers who have it, instead of one row per traveller. A traveller
// with BOTH a train addon and a flight addon contributes to TWO separate
// groups/lines. Keeps the invoice clean while still billing every leg.
const buildAddonItems = (booking) => {
  const groups = {};

  (booking.travellers || [])
    .filter((t) => !t.cancelled?.byTraveller && !t.cancelled?.byAdmin)
    .forEach((t) => {
      addonsOf(t).forEach((addon) => {
        const price = addonAmount(addon);
        if (!addon?.name || price <= 0) return;

        const leg = describeAddonLeg(addon);
        // key on name+price+leg so e.g. "2AC EXTRA" for the UP train and
        // "2AC EXTRA" for the DOWN train stay as separate invoice lines
        const key = `${addon.name}::${price}::${addonLegKey(addon)}`;

        if (!groups[key]) {
          groups[key] = {
            name: addon.name,
            leg, // shown as the subDescription, not bracketed into the name
            price,
            addonIds: [],
          };
        }
        groups[key].addonIds.push(addon._id);
      });
    });

  return Object.values(groups).map((g) => {
    const qty = g.addonIds.length;
    const amount = currencyRound(g.price * qty);
    return {
      description: g.name,
      subDescription: g.leg || "",
      sourceRef: `addon:${g.addonIds.join(",")}`,
      gstRate: 0,
      quantity: qty,
      rate: g.price,
      amount,
      cgst: 0,
      sgst: 0,
      total: amount,
    };
  });
};

// Amount comes from tourBookingModel (booking.gvCancellationPool /
// booking.irctcCancellationPool) — a fixed TOTAL amount stored on the
// booking itself. The TRAVELLER COUNT comes from the SEPARATE
// cancellationModel collection — count of travellerIds across all
// cancellation records for this booking. We divide amount by that count
// to get a per-person rate, then show Qty × Rate = same total.
//
// Example: booking.gvCancellationPool = 3000, cancellationModel has
// 2 travellerIds total for this booking → rate = 3000/2 = 1500,
// invoice row = Qty 2, Rate ₹1,500, Amount ₹3,000.
const buildCancellationPoolItems = (booking, cancellations) => {
  const items = [];
  const list = Array.isArray(cancellations) ? cancellations : [];

  // Only APPROVED cancellation records should count toward the invoice —
  // a REJECTED cancellation request never actually happened from a
  // billing standpoint, so its travellerIds must NOT be counted here.
  // Based on the one real record we've seen, approved cancellations carry
  // approvedBy: true. If your rejection flow ALSO sets approvedBy: true
  // on rejected records (unlikely, but flag it if so), this filter needs
  // a different field — e.g. a status/rejectedBy check instead.
  const approvedList = list.filter((c) => c?.approvedBy === true);

  // total distinct cancelled traveller count across all APPROVED
  // cancellation records tied to this booking
  const cancelledTravellerCount = approvedList.reduce(
    (sum, c) => sum + ((c.travellerIds || []).length || 0),
    0,
  );

  const buildRow = (totalAmount, label, sourceRefPrefix) => {
    if (!totalAmount || cancelledTravellerCount <= 0) return;

    const rate = currencyRound(totalAmount / cancelledTravellerCount);
    items.push({
      description: label,
      subDescription: "",
      sourceRef: `${sourceRefPrefix}:${booking._id}`,
      gstRate: 0,
      quantity: cancelledTravellerCount,
      rate,
      amount: totalAmount,
      cgst: 0,
      sgst: 0,
      total: totalAmount,
    });
  };

  buildRow(Number(booking.gvCancellationPool || 0), "GV Cancellation Pool", "gvpool");
  buildRow(Number(booking.irctcCancellationPool || 0), "IRCTC Cancellation Pool", "irctcpool");

  return items;
};

export const buildInvoiceView = (booking, tour, cancellations = []) => {
  // No invoice number yet = advance hasn't been paid. Frontend should not
  // render the Receipt button in this case.
  if (!booking.invoiceNumber) {
    return null;
  }

  const baseItems = buildBaseItems(booking, tour);
  const addonItems = buildAddonItems(booking);
  const poolItems = buildCancellationPoolItems(booking, cancellations);
  const extraItems = buildExtraItemsFromRemarks(booking);
  const items = [...baseItems, ...addonItems, ...poolItems, ...extraItems];

  const amountSum = currencyRound(items.reduce((s, i) => s + i.amount, 0));
  const cgstSum = currencyRound(items.reduce((s, i) => s + i.cgst, 0));
  const sgstSum = currencyRound(items.reduce((s, i) => s + i.sgst, 0));
  const grandTotal = currencyRound(items.reduce((s, i) => s + i.total, 0));

  const payments = buildPayments(booking);
  const amountPaid = currencyRound(
    payments.reduce((s, p) => s + p.amountReceived, 0),
  );

  const dueAmount = currencyRound(grandTotal - amountPaid);
  const isFullyPaid = dueAmount <= 0;
  const status = isFullyPaid ? "Paid" : "Part Paid";
  // If the customer has paid MORE than the grand total (e.g. after a
  // cancellation/adjustment reduced the total below what was already
  // collected), that overage is money owed BACK to the customer — surface
  // it explicitly as refundAmount instead of silently clamping dueAmount
  // to 0 and losing the information. Only one of dueAmount/refundAmount
  // is ever non-zero at a time.
  const refundAmount = dueAmount < 0 ? currencyRound(Math.abs(dueAmount)) : 0;

  return {
    invoiceNumber: booking.invoiceNumber,
    purchaseDate: booking.bookingDate,
    dueDate: tour?.lastBookingDate, // trip start date, stored on the tour itself
    tourCode: tour?.title, // shows the TOUR NAME here, not the batch/category

    billedBy: {
      companyName: "GV - TOUR PLANNERS LLP",
      addressLine1: "15/4, Nehru street, Jaihindpuram",
      city: "Madurai",
      state: "Tamil Nadu",
      country: "India",
      pincode: "625011",
      gstin: "33AAYFG5132F1ZC",
      pan: "AAYFG5132F",
      tan: "MRIG03766A",
      phone: "+91 90039 98648",
    },

    billedTo: {
      name:
        `${booking.travellers?.[0]?.firstName || ""} ${booking.travellers?.[0]?.lastName || ""}`.trim() ||
        booking.userData?.name,
      addressLine1: booking.billingAddress?.addressLine1,
      addressLine2: booking.billingAddress?.addressLine2,
      city: booking.billingAddress?.city,
      state: booking.billingAddress?.state,
      country: booking.billingAddress?.country,
      pincode: booking.billingAddress?.pincode,
      phone: booking.contact?.mobile,
    },

    countryOfSupply: "India",
    placeOfSupply: "Tamil Nadu (33)",

    items,

    totals: {
      amount: amountSum,
      cgst: cgstSum,
      sgst: sgstSum,
      roundOff: currencyRound(grandTotal - (amountSum + cgstSum + sgstSum)),
      grandTotal,
    },

    payments,
    amountPaid,
    dueAmount: Math.max(0, dueAmount),
    refundAmount,
    status,
  };
};