import tourBookingModel from "../models/tourBookingmodel.js";
import tourModel from "../models/tourModel.js";
import cancellationModel from "../models/cancellationModel.js";
import mongoose from "mongoose";

const CancelRule =
  mongoose.models.cancelrulemodel || mongoose.model("cancelrulemodel");

// ---------- HELPER FUNCTIONS (Unchanged) ----------
const daysBetween = (dateA, dateB) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor(
    (Date.UTC(dateB.getFullYear(), dateB.getMonth(), dateB.getDate()) -
      Date.UTC(dateA.getFullYear(), dateA.getMonth(), dateA.getDate())) /
      msPerDay
  );
};

const getTravellerAdvanceAmount = (traveller, tourData) => {
  const isChild = traveller.age < 12;
  const packType = traveller.packageType || "main";
  const vIndex = traveller.variantPackageIndex ?? 0;

  if (packType === "variant") {
    const variant = tourData.variantPackage?.[vIndex];
    if (variant?.advanceAmount) {
      return isChild
        ? Number(variant.advanceAmount.child || 0)
        : Number(variant.advanceAmount.adult || 0);
    }
  }
  return isChild
    ? Number(tourData.advanceAmount?.child || 0)
    : Number(tourData.advanceAmount?.adult || 0);
};

const getTravellerPackageBasePrice = (traveller, tourData) => {
  const packType = traveller.packageType || "main";
  const vIndex = traveller.variantPackageIndex ?? 0;
  const mapSharing = (sharing) => {
    switch ((sharing || "").toLowerCase()) {
      case "double":
        return "doubleSharing";
      case "triple":
        return "tripleSharing";
      case "withberth":
        return "childWithBerth";
      case "withoutberth":
        return "childWithoutBerth";
      default:
        return null;
    }
  };
  const field = mapSharing(traveller.sharingType);

  if (packType === "variant") {
    const variant = tourData.variantPackage?.[vIndex];
    if (variant?.price && field) return Number(variant.price[field] || 0);
  } else {
    if (tourData.price && field) return Number(tourData.price[field] || 0);
  }
  return 0;
};

const getTravellerFullPackageCost = (traveller, tourData) => {
  const base = getTravellerPackageBasePrice(traveller, tourData);
  const addon = Number(traveller.selectedAddon?.price || 0);
  const customAddons = (traveller.customAddons || []).reduce(
    (sum, a) => sum + Number(a?.price || 0),
    0
  );
  return Number((base + addon + customAddons).toFixed(2));
};

const matchPercentage = (daysBefore, tiers = []) => {
  if (daysBefore > 60) return 0;
  for (const t of tiers) {
    if (
      daysBefore >= (t.fromDays ?? 0) &&
      daysBefore <= (t.toDays ?? Infinity)
    ) {
      return Number(t.percentage ?? 100);
    }
  }
  return 100;
};

const sumNumeric = (val) => {
  if (Array.isArray(val)) return val.reduce((s, v) => s + Number(v || 0), 0);
  if (typeof val === "object" && val !== null)
    return Object.values(val).reduce((s, v) => s + Number(v || 0), 0);
  return Number(val || 0);
};

// ---------- MAIN CONTROLLER ----------
export const cancelBookingController = async (req, res) => {
  try {
    const { id: bookingId } = req.params;
    const {
      cancellationDate,
      cancelledTravellerIndexes = [],
      extraRemarkAmount = 0,
      remark = "",
      irctcCancellationAmount = 0,
      trainCancellations = {},
      flightCancellations = {},
    } = req.body;

    // Validation
    if (!bookingId || !cancellationDate) {
      return res
        .status(400)
        .json({ message: "bookingId & cancellationDate required" });
    }

    const cancellationDt = new Date(cancellationDate);
    if (isNaN(cancellationDt)) {
      return res.status(400).json({ message: "Invalid cancellationDate" });
    }

    // Fetch booking and tour data
    const booking = await tourBookingModel.findById(bookingId).lean();
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const tour = booking.tourId
      ? await tourModel.findById(booking.tourId).lean()
      : null;
    const tourData = tour || booking.tourData || {};
    if (!tourData.lastBookingDate) {
      return res.status(400).json({ message: "Tour lastBookingDate missing" });
    }

    const travellers = booking.travellers || [];
    const cancelledTravellers = cancelledTravellerIndexes
      .map((i) => travellers[i])
      .filter(Boolean);
    if (!cancelledTravellers.length) {
      return res.status(400).json({ message: "No valid travellers selected" });
    }

    // Check advance payment
    const advancePaid = booking.payment?.advance?.paid === true;
    if (!advancePaid) {
      return res
        .status(400)
        .json({ message: "Cannot proceed without advance payment" });
    }

    const daysBefore = Math.max(
      0,
      daysBetween(cancellationDt, new Date(tourData.lastBookingDate))
    );
    const advanceAmount = Number(booking.payment?.advance?.amount || 0);
    const balanceAmount = Number(booking.payment?.balance?.amount || 0);
    const paymentVerified = booking.paymentVerified === true;
    const balancePaidFlag = booking.payment?.balance?.paid === true;

    const negativeAdminSum = (booking.adminRemarks || [])
      .filter((r) => Number(r.amount) < 0)
      .reduce((sum, r) => sum + Math.abs(Number(r.amount)), 0);
    const positiveAdminSum = (booking.adminRemarks || [])
      .filter((r) => Number(r.amount) > 0)
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const irctcTotal =
      Number(irctcCancellationAmount || 0) +
      sumNumeric(trainCancellations) +
      sumNumeric(flightCancellations);
    const remarksAmount = Number(extraRemarkAmount || 0);

    const cancelRule = await CancelRule.findOne().lean();
    if (!cancelRule?.gv) {
      return res
        .status(500)
        .json({ message: "Cancellation rules not configured" });
    }

    const existingGvPool = Number(booking.gvCancellationPool || 0);
    const existingIrctcPool = Number(booking.irctcCancellationPool || 0);
    const travellerIds = cancelledTravellers.map((t) => t._id).filter(Boolean);
    const hasApprovedCancellation = travellers.some(
      (t) => t.cancelled?.byTraveller && t.cancelled?.byAdmin
    );

    const updateBooking = { $set: { cancellationRequest: true } };
    let cancellationDoc;

    // CASE 1: Advance Paid, Balance Zero, Paid and Verified
    if (advancePaid && balanceAmount === 0 && balancePaidFlag) {
      // 1. GV Cancellation Amount (Advance Paid Rules)
      let gvCancellationAmount = 0;
      cancelledTravellers.forEach((t) => {
        const adv = getTravellerAdvanceAmount(t, tourData);
        const pct = matchPercentage(
          daysBefore,
          cancelRule.gv.advancePaid?.tiers
        );
        gvCancellationAmount += (adv * pct) / 100;
      });
      gvCancellationAmount = Number(gvCancellationAmount.toFixed(2));

      // 2. IRCTC Cancellation Amount
      const irctcCancellationAmount = irctcTotal;

      // 3. Remarks Amount
      const remarksAmountFinal = remarksAmount;

      // 4. Cancelled Traveller Total Package Cost
      const cancelledFullCost = cancelledTravellers.reduce(
        (sum, t) => sum + getTravellerFullPackageCost(t, tourData),
        0
      );

      // 5. Total Cancellation Amount
      const totalCancellationAmount = Number(
        (
          gvCancellationAmount +
          irctcCancellationAmount +
          remarksAmountFinal
        ).toFixed(2)
      );

      // 6. Refund Amount
      const refundAmount = Number(
        (cancelledFullCost - totalCancellationAmount).toFixed(2)
      );
      const netAmountPaid = Number(
        (advanceAmount + negativeAdminSum).toFixed(2)
      );

      cancellationDoc = new cancellationModel({
        bookingId: booking._id,
        travellerIds,
        travellerIndexes: cancelledTravellerIndexes,
        netAmountPaid,
        noOfDays: daysBefore,
        gvCancellationAmount,
        irctcCancellationAmount,
        remarksAmount: remarksAmountFinal,
        bookingBalanceManagementAmount: 0,
        totalCancellationAmount,
        preBalanceAmount: cancelledFullCost,
        updatedBalance: 0,
        refundAmount: refundAmount > 0 ? refundAmount : 0,
        remarkText: remark || "Cancellation (Balance Zero + Verified)",
        raisedBy: true,
        approvedBy: false,
      });
    }
    // CASE 2: Advance Paid, Balance > 0, Unpaid, More Than One Traveller
    else if (
      advancePaid &&
      balanceAmount > 0 &&
      !balancePaidFlag &&
      travellers.length > 1
    ) {
      // 1. Net Amount Paid = Advance + (positive value from negative admin remarks)
      const netAmountPaid = Number(
        (advanceAmount + negativeAdminSum).toFixed(2)
      );

      // C. Sum of active travellers' full package cost (with addons)
      // Active = not already cancelled (by both) OR currently being cancelled → excluded
      const activeTravellers = travellers.filter((t, idx) => {
        const alreadyCancelled =
          (t.cancelled?.byTraveller && t.cancelled?.byAdmin) === true;
        const currentlyCancelling = cancelledTravellerIndexes.includes(idx);
        return !alreadyCancelled && !currentlyCancelling;
      });

      const activeTravellersCost = activeTravellers.reduce(
        (sum, t) => sum + getTravellerFullPackageCost(t, tourData),
        0
      );

      // D. GV Cancellation Amount = New GV deduction (from advance rules) + existing GV pool
      let newGvFromAdvance = 0;
      cancelledTravellers.forEach((t) => {
        const adv = getTravellerAdvanceAmount(t, tourData);
        const pct = matchPercentage(
          daysBefore,
          cancelRule.gv.advancePaid?.tiers
        );
        newGvFromAdvance += (adv * pct) / 100;
      });
      const gvCancellationAmount = Number(
        (newGvFromAdvance + existingGvPool).toFixed(2)
      );

      // E. IRCTC Cancellation = Provided IRCTC + existing IRCTC pool
      const irctcCancellationAmount = Number(
        (irctcTotal + existingIrctcPool).toFixed(2)
      );

      // F. Remarks Amount (no pool addition)
      const remarksAmountFinal = remarksAmount;

      // G. Positive admin remarks (extra charges)
      const bookingBalanceManagementAmount = positiveAdminSum;

      // 2. Pre-Balance Amount = Active Cost + All Deductions
      const preBalanceAmount = Number(
        (
          activeTravellersCost +
          gvCancellationAmount +
          irctcCancellationAmount +
          remarksAmountFinal +
          bookingBalanceManagementAmount
        ).toFixed(2)
      );

      // 3. Final calculation
      const difference = Number((preBalanceAmount - netAmountPaid).toFixed(2));
      const updatedBalance = difference >= 0 ? difference : 0;
      const refundAmount = difference < 0 ? Math.abs(difference) : 0;

      cancellationDoc = new cancellationModel({
        bookingId: booking._id,
        travellerIds,
        travellerIndexes: cancelledTravellerIndexes,
        netAmountPaid,
        noOfDays: daysBefore,
        gvCancellationAmount,
        irctcCancellationAmount,
        remarksAmount: remarksAmountFinal,
        bookingBalanceManagementAmount,
        totalCancellationAmount: Number(
          (
            gvCancellationAmount +
            irctcCancellationAmount +
            remarksAmountFinal +
            bookingBalanceManagementAmount
          ).toFixed(2)
        ),
        preBalanceAmount,
        updatedBalance,
        refundAmount,
        remarkText:
          remark ||
          "Cancellation (Advance Only - Partial, Multiple Travellers)",
        raisedBy: true,
        approvedBy: false,
      });
    }
    // CASE 3: Advance Paid, Balance > 0, Unpaid, Only One Traveller
    else if (
      advancePaid &&
      balanceAmount > 0 &&
      !balancePaidFlag &&
      travellers.length === 1
    ) {
      // 1. Net Amount Paid
      const netAmountPaid = Number(
        (advanceAmount + negativeAdminSum).toFixed(2)
      );

      // D. GV Cancellation Amount
      let gvCancellationAmount = 0;
      cancelledTravellers.forEach((t) => {
        const adv = getTravellerAdvanceAmount(t, tourData);
        const pct = matchPercentage(
          daysBefore,
          cancelRule.gv.advancePaid?.tiers
        );
        gvCancellationAmount += (adv * pct) / 100;
      });
      gvCancellationAmount = Number(gvCancellationAmount.toFixed(2));

      // E. IRCTC Cancellation Amount
      const irctcCancellationAmount = irctcTotal;

      // F. Remarks Amount
      const remarksAmountFinal = remarksAmount;

      // G. Positive Admin Remarks
      const bookingBalanceManagementAmount = positiveAdminSum;

      // 2. Pre Balance Amount
      const preBalanceAmount = Number(
        (
          gvCancellationAmount +
          irctcCancellationAmount +
          remarksAmountFinal +
          bookingBalanceManagementAmount
        ).toFixed(2)
      );

      // 3. Updated Balance / Refund Amount
      const updatedBalanceRaw = Number(
        (preBalanceAmount - netAmountPaid).toFixed(2)
      );
      const updatedBalance = updatedBalanceRaw >= 0 ? updatedBalanceRaw : 0;
      const refundAmount =
        updatedBalanceRaw < 0 ? Math.abs(updatedBalanceRaw) : 0;

      cancellationDoc = new cancellationModel({
        bookingId: booking._id,
        travellerIds,
        travellerIndexes: cancelledTravellerIndexes,
        netAmountPaid,
        noOfDays: daysBefore,
        gvCancellationAmount,
        irctcCancellationAmount,
        remarksAmount: remarksAmountFinal,
        bookingBalanceManagementAmount,
        totalCancellationAmount: preBalanceAmount,
        preBalanceAmount,
        updatedBalance,
        refundAmount,
        remarkText: remark || "Cancellation (Advance Only - Single Traveller)",
        raisedBy: true,
        approvedBy: false,
      });
    }
    // CASE 4: Advance Paid, Balance > 0, Paid and Verified, Only One Traveller
    else if (
      advancePaid &&
      balanceAmount > 0 &&
      balancePaidFlag &&
      travellers.length === 1
    ) {
      // A. Total Package Price
      const preBalanceAmount = cancelledTravellers.reduce(
        (sum, t) => sum + getTravellerFullPackageCost(t, tourData),
        0
      );

      // B. Positive Admin Remarks
      const bookingBalanceManagementAmount = positiveAdminSum;

      // C. GV Cancellation Amount (Fully Paid Rules)
      let gvCancellationAmount = 0;
      cancelledTravellers.forEach((t) => {
        const price = getTravellerPackageBasePrice(t, tourData);
        const pct = matchPercentage(daysBefore, cancelRule.gv.fullyPaid?.tiers);
        gvCancellationAmount += (price * pct) / 100;
      });
      gvCancellationAmount = Number(gvCancellationAmount.toFixed(2));

      // D. IRCTC Cancellation Amount
      const irctcCancellationAmount = irctcTotal;

      // E. Remarks Amount
      const remarksAmountFinal = remarksAmount;

      // Updated Balance
      const updatedBalanceRaw = Number(
        (
          preBalanceAmount -
          bookingBalanceManagementAmount -
          gvCancellationAmount -
          irctcCancellationAmount -
          remarksAmountFinal
        ).toFixed(2)
      );
      const updatedBalance =
        updatedBalanceRaw < 0 ? Math.abs(updatedBalanceRaw) : 0;
      const refundAmount = updatedBalanceRaw >= 0 ? updatedBalanceRaw : 0;
      const netAmountPaid = Number(
        (advanceAmount + balanceAmount + negativeAdminSum).toFixed(2)
      );

      cancellationDoc = new cancellationModel({
        bookingId: booking._id,
        travellerIds,
        travellerIndexes: cancelledTravellerIndexes,
        netAmountPaid,
        noOfDays: daysBefore,
        gvCancellationAmount,
        irctcCancellationAmount,
        remarksAmount: remarksAmountFinal,
        bookingBalanceManagementAmount,
        totalCancellationAmount: Number(
          (
            bookingBalanceManagementAmount +
            gvCancellationAmount +
            irctcCancellationAmount +
            remarksAmountFinal
          ).toFixed(2)
        ),
        preBalanceAmount,
        updatedBalance,
        refundAmount,
        remarkText: remark || "Cancellation (Fully Paid - Single Traveller)",
        raisedBy: true,
        approvedBy: false,
      });
    }
    // CASE 5: Advance Paid, Balance > 0, Paid and Verified, More Than One Traveller
    else if (
      advancePaid &&
      balanceAmount > 0 &&
      balancePaidFlag &&
      travellers.length > 1
    ) {
      // A. Total Package Price
      const preBalanceAmount = cancelledTravellers.reduce(
        (sum, t) => sum + getTravellerFullPackageCost(t, tourData),
        0
      );

      // B. Positive Admin Remarks
      const bookingBalanceManagementAmount = hasApprovedCancellation
        ? 0
        : positiveAdminSum;

      // C. GV Cancellation Amount (Fully Paid Rules)
      let gvCancellationAmount = 0;
      cancelledTravellers.forEach((t) => {
        const price = getTravellerPackageBasePrice(t, tourData);
        const pct = matchPercentage(daysBefore, cancelRule.gv.fullyPaid?.tiers);
        gvCancellationAmount += (price * pct) / 100;
      });
      gvCancellationAmount = Number(gvCancellationAmount.toFixed(2));

      // D. IRCTC Cancellation Amount
      const irctcCancellationAmount = irctcTotal;

      // E. Remarks Amount
      const remarksAmountFinal = remarksAmount;

      // Updated Balance
      const totalDeduction = hasApprovedCancellation
        ? gvCancellationAmount + irctcCancellationAmount + remarksAmountFinal
        : bookingBalanceManagementAmount +
          gvCancellationAmount +
          irctcCancellationAmount +
          remarksAmountFinal;
      const updatedBalanceRaw = Number(
        (preBalanceAmount - totalDeduction).toFixed(2)
      );
      const updatedBalance =
        updatedBalanceRaw < 0 ? Math.abs(updatedBalanceRaw) : updatedBalanceRaw;
      const refundAmount = updatedBalanceRaw >= 0 ? updatedBalanceRaw : 0;
      const netAmountPaid = Number(
        (advanceAmount + balanceAmount + negativeAdminSum).toFixed(2)
      );

      cancellationDoc = new cancellationModel({
        bookingId: booking._id,
        travellerIds,
        travellerIndexes: cancelledTravellerIndexes,
        netAmountPaid,
        noOfDays: daysBefore,
        gvCancellationAmount,
        irctcCancellationAmount,
        remarksAmount: remarksAmountFinal,
        bookingBalanceManagementAmount,
        totalCancellationAmount: Number(totalDeduction.toFixed(2)),
        preBalanceAmount,
        updatedBalance,
        refundAmount,
        remarkText:
          remark ||
          `Cancellation (Fully Paid - Multiple Travellers${
            hasApprovedCancellation ? " with Prior Cancellation" : ""
          })`,
        raisedBy: true,
        approvedBy: false,
      });
    } else {
      return res
        .status(400)
        .json({ message: "Invalid booking payment status" });
    }

    // Save cancellation and update booking
    await cancellationDoc.save();
    await tourBookingModel.findByIdAndUpdate(booking._id, updateBooking);

    return res.json({
      success: true,
      message: cancellationDoc.remarkText,
      data: cancellationDoc,
    });
  } catch (err) {
    console.error("cancelBookingController error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

export default cancelBookingController;
