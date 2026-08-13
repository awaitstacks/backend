
// migrations/addIsLegacyAddonsFlag.js
//
// SAFE VERSION — no full DB backup needed.
// Before changing anything, this script:
//   1. Finds which tours will be affected
//   2. Saves their IDs + full trainDetails/flightDetails/variantPackage
//      snapshot to a local JSON file (migrations/affected-tours-<timestamp>.json)
//   3. Then applies the change
//
// If something goes wrong, run with --undo and pass the same log file to
// revert exactly those tours back to their pre-migration state.
//
// Usage:
//   node migrations/addIsLegacyAddonsFlag.js            → run migration
//   node migrations/addIsLegacyAddonsFlag.js --undo migrations/affected-tours-XXXX.json
//
// Make sure MONGODB_URI (or MONGO_URI) is set in your .env before running.

import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import tourModel from "../models/tourModel.js";

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL || process.env.MONGODB_URL;

const runMigration = async () => {
  if (!MONGODB_URL) {
    console.error("❌ MONGODB_URL not found in .env");
    process.exit(1);
  }

  const isUndo = process.argv[2] === "--undo";
  const undoFile = process.argv[3];

  try {
    await mongoose.connect(MONGODB_URL);
    console.log("✅ Connected to MongoDB");

    // ═══════════════════════════════════════════════════════════
    // UNDO MODE — revert exactly the tours this script touched
    // ════════════════════════════════════════════
    if (isUndo) {
      if (!undoFile || !fs.existsSync(undoFile)) {
        console.error(
          "❌ Please provide a valid log file: node migrations/addIsLegacyAddonsFlag.js --undo migrations/affected-tours-XXXX.json",
        );
        process.exit(1);
      }

      const log = JSON.parse(fs.readFileSync(undoFile, "utf-8"));

      // Undo Step A: remove isLegacyAddons field from tours we set it on
      const undoA = await tourModel.updateMany(
        { _id: { $in: log.legacyFlagAddedTo } },
        { $unset: { isLegacyAddons: "" } },
      );
      console.log(
        `↩️  Removed isLegacyAddons field from ${undoA.modifiedCount} tour(s)`,
      );

      // Undo Step B: restore each tour's trainDetails/flightDetails/
      // variantPackage from the snapshot saved in the log.
      let restoredCount = 0;
      for (const snap of log.snapshots || []) {
        await tourModel.findByIdAndUpdate(snap._id, {
          $set: {
            trainDetails: snap.trainDetails,
            flightDetails: snap.flightDetails,
            variantPackage: snap.variantPackage,
          },
        });
        restoredCount++;
      }
      console.log(
        `↩️  Restored original trainDetails/flightDetails/variantPackage on ${restoredCount} tour(s)`,
      );

      console.log("🎉 Undo completed successfully");
      process.exit(0);
    }

    // ═══════════════════════════════════════════════════════════
    // FORWARD MODE — apply the migration, logging everything first
    // ═══════════════════════════════════════════════════════════

    // ── Step A candidates: tours missing isLegacyAddons ──
    const legacyCandidates = await tourModel
      .find({ isLegacyAddons: { $exists: false } })
      .select("_id")
      .lean();
    const legacyFlagAddedTo = legacyCandidates.map((t) => t._id.toString());

    // ── Step B candidates + full snapshot (for undo) of every tour,
    // BEFORE we touch anything ──
    const allTours = await tourModel.find({}).lean();
    const snapshots = allTours.map((t) => ({
      _id: t._id.toString(),
      trainDetails: t.trainDetails || [],
      flightDetails: t.flightDetails || [],
      variantPackage: t.variantPackage || [],
    }));

    // ── Write the log FIRST, before making any changes ──
    const logDir = path.join(process.cwd(), "migrations");
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(logDir, `affected-tours-${Date.now()}.json`);
    fs.writeFileSync(
      logPath,
      JSON.stringify({ legacyFlagAddedTo, snapshots }, null, 2),
    );
    console.log(`📝 Saved pre-change snapshot to: ${logPath}`);
    console.log(
      `   (${legacyFlagAddedTo.length} tours will get isLegacyAddons: true)`,
    );
    console.log(
      `   (${snapshots.length} tours' train/flight data snapshotted)`,
    );
    console.log(
      "   Keep this file safe — you can undo with:\n" +
        `   node migrations/addIsLegacyAddonsFlag.js --undo ${logPath}\n`,
    );

    // ── Now actually apply the changes ──
    const result = await tourModel.updateMany(
      { isLegacyAddons: { $exists: false } },
      { $set: { isLegacyAddons: true } },
    );
    console.log(
      `✅ Set isLegacyAddons: true on ${result.modifiedCount} tour(s)`,
    );

    let fixedCount = 0;
    for (const tour of allTours) {
      let changed = false;

      const fixList = (list) => {
        if (!Array.isArray(list)) return list;
        return list.map((item) => {
          if (!Array.isArray(item.addons)) {
            changed = true;
            return { ...item, addons: [] };
          }
          return item;
        });
      };

      const newTrainDetails = fixList(tour.trainDetails);
      const newFlightDetails = fixList(tour.flightDetails);
      const newVariantPackage = Array.isArray(tour.variantPackage)
        ? tour.variantPackage.map((v) => ({
            ...v,
            trainDetails: fixList(v.trainDetails),
            flightDetails: fixList(v.flightDetails),
          }))
        : tour.variantPackage;

      if (changed) {
        await tourModel.findByIdAndUpdate(tour._id, {
          $set: {
            trainDetails: newTrainDetails,
            flightDetails: newFlightDetails,
            variantPackage: newVariantPackage,
          },
        });
        fixedCount++;
      }
    }

    console.log(
      `✅ Backfilled addons: [] on trainDetails/flightDetails for ${fixedCount} tour(s)`,
    );

    console.log("🎉 Migration completed successfully");
    console.log(
      `\n💡 If anything looks wrong, undo with:\n   node migrations/addIsLegacyAddonsFlag.js --undo ${logPath}`,
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

runMigration();