/**
 * ONE-TIME MIGRATION: fixTripCancelledTravellers.js
 *
 * Fixes historical data written by the OLD (buggy) cancelEntireTrip logic.
 *
 * ── Background ──────────────────────────────────────────────────────
 * The old cancelEntireTrip code did this for every traveller on a
 * trip-cancelled tour:
 *
 *   if (traveller was NOT already byTraveller:true + byAdmin:true) {
 *     set byTraveller:true, byAdmin:true, viaTripCancel:true   ← WRONG
 *   }
 *   // else: left completely untouched (viaTripCancel never added)
 *
 * This produced two problems:
 *   1. Fresh travellers swept up by the bulk trip-cancel got
 *      byTraveller:true / byAdmin:true — they should have stayed FALSE
 *      (they were never individually cancelled/rejected; only
 *      viaTripCancel:true should mark them).
 *   2. Travellers who ALREADY had a genuine, individually-approved
 *      cancellation (via the normal approveCancellation flow) before
 *      the trip got cancelled were left with NO viaTripCancel flag at
 *      all, even though they are legitimately part of a now-cancelled
 *      trip.
 *
 * ── What this script does ───────────────────────────────────────────
 * For every booking under every tripCancelled:true tour:
 *
 *   - For travellers with viaTripCancel:true AND byTraveller:true AND
 *     byAdmin:true (the state the old bug produced): check whether an
 *     APPROVED cancellationModel record exists for that exact
 *     traveller. If NOT → this was a fresh bulk-sweep wrongly flipped
 *     to true/true; correct it to byTraveller:false, byAdmin:false
 *     (viaTripCancel stays true). If an approved record DOES exist →
 *     this is a genuine individual cancellation; leave byTraveller/
 *     byAdmin as true (already correct), viaTripCancel already true.
 *
 *   - For travellers with byTraveller:true AND byAdmin:true AND
 *     viaTripCancel NOT true, on a trip-cancelled tour, WITH an
 *     approved cancellationModel record: add viaTripCancel:true (the
 *     old code's "leave as-is" branch never added this tag).
 *
 * Run once: node fixTripCancelledTravellers.js
 */

import mongoose from "mongoose";
import "dotenv/config";

import tourModel from "../models/tourModel.js";
import tourBookingModel from "../models/tourBookingmodel.js";
import cancellationModel from "../models/cancellationModel.js";

async function run() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("Connected to DB.");

  const cancelledTours = await tourModel
    .find({ tripCancelled: true })
    .select("_id title")
    .lean();

  console.log(`Found ${cancelledTours.length} trip-cancelled tour(s).`);

  let bookingsChecked = 0;
  let bookingsFixed = 0;
  let fixedToFalseFalse = 0; // fresh sweep, wrongly flipped true -> corrected
  let fixedViaTripCancelAdded = 0; // genuine approval, missing viaTripCancel -> added

  for (const tour of cancelledTours) {
    const bookings = await tourBookingModel.find({ tourId: tour._id });

    for (const booking of bookings) {
      bookingsChecked += 1;
      let changed = false;

      // Approved individual-cancellation traveller ids for THIS booking,
      // fetched once per booking (not per traveller).
      const approvedCancellations = await cancellationModel
        .find({ tnr: booking.tnr, approvedBy: true })
        .select("travellerIds")
        .lean();

      const approvedTravellerIds = new Set();
      approvedCancellations.forEach((c) => {
        (c.travellerIds || []).forEach((id) =>
          approvedTravellerIds.add(String(id)),
        );
      });

      booking.travellers.forEach((t) => {
        if (!t.cancelled) return;

        const isViaTripCancel = t.cancelled.viaTripCancel === true;
        const isFullyCancelled =
          t.cancelled.byTraveller === true && t.cancelled.byAdmin === true;
        const hasApprovedRecord = approvedTravellerIds.has(String(t._id));

        if (isViaTripCancel && isFullyCancelled) {
          if (!hasApprovedRecord) {
            // Fresh bulk-sweep traveller, wrongly flipped to true/true
            // by the old bug. Correct it — no real cancellation request
            // ever happened for them.
            t.cancelled.byTraveller = false;
            t.cancelled.byAdmin = false;
            fixedToFalseFalse += 1;
            changed = true;
          }
          // else: genuinely approved before the trip was cancelled —
          // byTraveller/byAdmin true is correct, viaTripCancel true is
          // correct. Nothing to fix.
        } else if (isFullyCancelled && !isViaTripCancel && hasApprovedRecord) {
          // Genuinely individually-approved traveller on a now-
          // trip-cancelled tour who never got tagged viaTripCancel
          // (old code's "leave as-is" branch skipped this entirely).
          t.cancelled.viaTripCancel = true;
          fixedViaTripCancelAdded += 1;
          changed = true;
        }
      });

      if (changed) {
        await booking.save();
        bookingsFixed += 1;
        console.log(`  Fixed booking ${booking.tnr} (tour: ${tour.title})`);
      }
    }
  }

  console.log("\n── Migration summary ─────────────────────────────");
  console.log(`Tours checked:            ${cancelledTours.length}`);
  console.log(`Bookings checked:         ${bookingsChecked}`);
  console.log(`Bookings fixed:           ${bookingsFixed}`);
  console.log(
    `Travellers corrected to byTraveller/byAdmin=false (fresh sweep, wrongly flipped true): ${fixedToFalseFalse}`,
  );
  console.log(
    `Travellers corrected with viaTripCancel added (genuine prior approval, was missing tag): ${fixedViaTripCancelAdded}`,
  );
  console.log("Done.");

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});