import mongoose from "mongoose";

import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";

import tourModel from "../models/tourModel.js";
import userModel from "../models/userModel.js";

import tourBookingModel from "../models/tourBookingmodel.js";
import cancelRuleModel from "../models/cancelRuleModel.js";
import cancellationModel from "../models/cancellationModel.js";
import manageBookingModel from "../models/manageBookingModel.js";

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
      galleryImages.map((img) => uploadImage(img))
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

    // Parse addons
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

    // Parse boarding and deboarding points
    let parsedBoardingPoints = [];
    let parsedDeboardingPoints = [];
    try {
      parsedBoardingPoints = parseArrayField(
        boardingPoints,
        "boardingPoints"
      ).map((b) => ({
        stationCode: b.stationCode || "",
        stationName: b.stationName || "",
      }));
      parsedDeboardingPoints = parseArrayField(
        deboardingPoints,
        "deboardingPoints"
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
                    ticketOpenDate: t.ticketOpenDate
                      ? new Date(t.ticketOpenDate)
                      : null,
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
            ticketOpenDate: t.ticketOpenDate
              ? new Date(t.ticketOpenDate)
              : null,
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

//API for the admin login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(email + password, process.env.JWT_SECRET);
      res.json({
        success: true,
        token,
      });
    } else {
      res.json({
        success: false,
        message: "Invalid credentials",
      });
    }
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};
const allTours = async (req, res) => {
  try {
    const tours = await tourModel.find({}).select("-password");
    res.json({ success: true, tours });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

//API to get all appointments list

const bookingsAdmin = async (req, res) => {
  try {
    const bookings = await tourBookingModel.find({});
    res.json({ success: true, bookings });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

const bookingRejectAdmin = async (req, res) => {
  try {
    const { tourBookingId, travellerIds = [] } = req.body;

    // Validate input
    if (
      !tourBookingId ||
      !Array.isArray(travellerIds) ||
      travellerIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "tourBookingId and travellerIds[] are required",
      });
    }

    // Fetch booking
    const booking = await tourBookingModel.findById(tourBookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Extract balance prices
    const balanceDouble = Number(booking.tourData?.balanceDouble) || 0;
    const balanceTriple = Number(booking.tourData?.balanceTriple) || 0;

    // Payment status (used for deduction logic only)
    const advancePaid =
      booking.payment.advance.paid && booking.payment.advance.paymentVerified;
    const balancePaid =
      booking.payment.balance.paid && booking.payment.balance.paymentVerified;

    // Normalize IDs
    const idsSet = new Set(travellerIds.map(String));

    // Check for travellers that block rejection
    const cancelledByTraveller = [];
    const alreadyRejectedTravellers = [];
    const missingTravellers = [];

    travellerIds.forEach((id) => {
      const traveller = booking.travellers.find(
        (t) => String(t._id) === String(id)
      );
      if (!traveller) {
        missingTravellers.push(id);
      } else if (traveller.cancelled.byTraveller) {
        cancelledByTraveller.push(id);
      } else if (traveller.cancelled.byAdmin) {
        alreadyRejectedTravellers.push(id);
      }
    });

    // Strict mode: Block if any blocking conditions exist
    if (
      cancelledByTraveller.length > 0 ||
      alreadyRejectedTravellers.length === travellerIds.length ||
      missingTravellers.length === travellerIds.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Rejection not allowed due to invalid traveller state.",
        cancelledByTraveller,
        alreadyRejected: alreadyRejectedTravellers,
        missingTravellers,
      });
    }

    // Proceed with valid travellers
    let totalDeduction = 0;
    const rejectedTravellers = [];

    booking.travellers = booking.travellers.map((traveller) => {
      const travellerIdStr = String(traveller._id);

      if (idsSet.has(travellerIdStr)) {
        traveller.cancelled.byAdmin = true;
        traveller.cancelled.cancelledAt = new Date();

        rejectedTravellers.push(traveller);

        // Deduct only if advance paid AND balance not paid
        if (advancePaid && !balancePaid) {
          if (traveller.sharingType === "double") {
            totalDeduction += balanceDouble;
          } else if (traveller.sharingType === "triple") {
            totalDeduction += balanceTriple;
          }
        }
      }

      return traveller;
    });

    // Update balance only if deduction is applicable
    if (totalDeduction > 0) {
      booking.payment.balance.amount = Math.max(
        booking.payment.balance.amount - totalDeduction,
        0
      );
    }

    await booking.save();

    res.json({
      success: true,
      message: "Traveller(s) rejected successfully",
      updatedBalance: booking.payment.balance.amount,
      rejectedTravellers: rejectedTravellers.map((t) => String(t._id)),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const bookingCancelAdmin = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { tourBookingId, travellerIds = [] } = req.body;

    if (
      !tourBookingId ||
      !Array.isArray(travellerIds) ||
      travellerIds.length === 0
    ) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "tourBookingId and travellerIds[] are required",
      });
    }

    const booking = await tourBookingModel
      .findById(tourBookingId)
      .session(session);
    if (!booking) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Prices & payment state
    const balanceDouble = Number(booking.tourData?.balanceDouble) || 0;
    const balanceTriple = Number(booking.tourData?.balanceTriple) || 0;
    const advancePaid =
      booking.payment.advance.paid && booking.payment.advance.paymentVerified;
    const balancePaid =
      booking.payment.balance.paid && booking.payment.balance.paymentVerified;

    // ❗ New check: Advance must be paid before allowing admin cancellation
    if (!advancePaid) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message:
          "User has not completed advance payment, cancellation cannot proceed.",
      });
    }

    // Normalise to string IDs
    const idsSet = new Set(travellerIds.map(String));

    // Check that all provided travellers exist on this booking
    const targetTravellers = booking.travellers.filter((t) =>
      idsSet.has(String(t._id))
    );
    const missingIds = travellerIds.filter(
      (id) => !booking.travellers.some((t) => String(t._id) === String(id))
    );
    if (missingIds.length > 0) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Some travellerIds do not belong to this booking",
        missingTravellerIds: missingIds,
      });
    }

    // Strict rule: every target must have been cancelled by the user first
    const notCancelledByUser = targetTravellers.filter(
      (t) => !t.cancelled?.byTraveller
    );
    const alreadyAdminCancelled = targetTravellers.filter(
      (t) => t.cancelled?.byAdmin
    );

    if (notCancelledByUser.length > 0 || alreadyAdminCancelled.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message:
          "Admin cancellation allowed only for travellers cancelled by user and not already admin-cancelled.",
        details: {
          notCancelledByUser: notCancelledByUser.map((t) => String(t._id)),
          alreadyCancelledByAdmin: alreadyAdminCancelled.map((t) =>
            String(t._id)
          ),
        },
      });
    }

    // Apply admin cancellation + compute deduction
    let totalDeduction = 0;
    const now = new Date();

    booking.travellers.forEach((t) => {
      if (idsSet.has(String(t._id))) {
        t.cancelled.byAdmin = true;
        t.cancelled.cancelledAt = now;

        if (!balancePaid) {
          if (t.sharingType === "double") totalDeduction += balanceDouble;
          else if (t.sharingType === "triple") totalDeduction += balanceTriple;
        }
      }
    });

    if (totalDeduction > 0) {
      booking.payment.balance.amount = Math.max(
        booking.payment.balance.amount - totalDeduction,
        0
      );
    }

    await booking.save({ session });
    await session.commitTransaction();

    return res.json({
      success: true,
      message: "Admin cancellation completed",
      updatedBalance: booking.payment.balance.amount,
      cancelledTravellers: targetTravellers.map((t) => String(t._id)),
    });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

const bookingRelease = async (req, res) => {
  try {
    const { tourBookingId, travellerIds = [] } = req.body;

    // Validate input
    if (
      !tourBookingId ||
      !Array.isArray(travellerIds) ||
      travellerIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "tourBookingId and travellerIds[] are required",
      });
    }

    // Fetch booking
    const booking = await tourBookingModel.findById(tourBookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const releasedTravellers = [];
    const notFoundTravellers = [];
    const notEligibleTravellers = [];

    const idsSet = new Set(travellerIds.map(String));

    // Process travellers
    booking.travellers = booking.travellers.map((traveller) => {
      const travellerIdStr = String(traveller._id);

      if (idsSet.has(travellerIdStr)) {
        const { cancelled } = traveller;

        // Only allow release if cancelled.byTraveller = true AND cancelled.byAdmin = false
        if (cancelled.byTraveller && !cancelled.byAdmin) {
          traveller.cancelled.byTraveller = false;
          traveller.cancelled.releasedAt = new Date();
          releasedTravellers.push(travellerIdStr);
        } else {
          notEligibleTravellers.push(travellerIdStr);
        }
      }

      return traveller;
    });

    // Identify travellers not found in booking
    travellerIds.forEach((id) => {
      if (!booking.travellers.some((t) => String(t._id) === String(id))) {
        notFoundTravellers.push(id);
      }
    });

    // If no travellers were released, respond with failure
    if (releasedTravellers.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No travellers released. Only traveller-cancelled (not admin-cancelled) bookings can be released.",
        notFoundTravellers,
        notEligibleTravellers,
      });
    }

    await booking.save();

    res.json({
      success: true,
      message: "Some or all travellers released successfully",
      releasedTravellers,
      notFoundTravellers,
      notEligibleTravellers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const tourAdminDashboard = async (req, res) => {
  try {
    const tours = await tourModel.find({});
    const users = await userModel.find({});
    const bookings = await tourBookingModel.find({});
    const dashData = {
      tours: tours.length,
      bookings: bookings.length,
      users: users.length,
      latestAppointments: bookings.reverse().slice(0, 5),
    };
    res.json({ success: true, dashData });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// GET (with auto-create default)
const getCancellationChart = async (req, res) => {
  try {
    let chart = await cancelRuleModel.findOne();

    if (!chart) {
      chart = await cancelRuleModel.create({
        gv: {
          advancePaid: {
            tiers: [{ fromDays: 30, toDays: 15, percentage: 50 }],
          },
          fullyPaid: { tiers: [{ fromDays: 30, toDays: 15, percentage: 100 }] },
        },
        irctc: [
          { classType: "SL", noOfDays: 7, fixedAmount: 60, percentage: 50 },
        ],
      });
    }

    res.status(200).json({ success: true, data: chart });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch chart" });
  }
};

// UPSERT
const upsertCancellationChart = async (req, res) => {
  try {
    const { gv, irctc } = req.body;
    let chart = await cancelRuleModel.findOne();

    if (chart) {
      chart.gv = gv ?? chart.gv;
      chart.irctc = irctc ?? chart.irctc;
      chart = await chart.save();
    } else {
      chart = await cancelRuleModel.create({ gv, irctc });
    }

    res.status(200).json({
      success: true,
      message: "Updated",
      data: chart,
    });
  } catch (error) {
    console.error("Upsert error:", error);
    res.status(500).json({ success: false, message: "Failed to update" });
  }
};

/**
 * GET /touradmingetcancelrule
 * Returns pending cancellation requests:
 *   - raisedBy = true
 *   - approvedBy = false
 *   - at least one traveller cancelled by the traveller (not by admin)
 */
const getCancellations = async (req, res) => {
  try {
    // 1. Find cancellation docs that are RAISED but NOT YET APPROVED
    //    (approvedBy must be explicitly false or missing)
    const pendingCancellations = await cancellationModel
      .find({
        raisedBy: true,
        $or: [{ approvedBy: { $exists: false } }, { approvedBy: false }],
      })
      .select("-__v")
      .lean();

    if (!pendingCancellations.length) {
      return res.json({ success: true, data: [] });
    }

    // 2. Extract booking IDs
    const bookingIds = [
      ...new Set(pendingCancellations.map((c) => c.bookingId).filter(Boolean)),
    ];

    // 3. Fetch bookings + filter travellers on the server side
    const bookings = await tourBookingModel
      .find({ _id: { $in: bookingIds } })
      .select("travellers cancelled")
      .lean();

    // Helper: does the booking contain a traveller cancelled **by traveller only** OR **by admin only**?
    const hasValidTravellerCancellation = (booking) => {
      return booking.travellers.some(
        (t) =>
          (t.cancelled?.byTraveller === true &&
            t.cancelled?.byAdmin === false) ||
          (t.cancelled?.byAdmin === true && t.cancelled?.byTraveller === false)
      );
    };

    const validBookingIds = bookings
      .filter(hasValidTravellerCancellation)
      .map((b) => b._id.toString());

    // 4. Keep only cancellation docs whose booking passed the traveller check
    const result = pendingCancellations.filter(
      (c) => c.bookingId && validBookingIds.includes(c.bookingId.toString())
    );

    // 5. OPTIONAL: Populate booking & traveller data for the front-end
    const enriched = await Promise.all(
      result.map(async (c) => {
        const booking = await tourBookingModel
          .findById(c.bookingId)
          .select(
            "userId tourId travellers contact bookingDate payment adminRemarks"
          )
          .populate({
            path: "travellers",
            match: {
              $or: [
                { "cancelled.byTraveller": true, "cancelled.byAdmin": false },
              ],
            },
            select: "title firstName lastName age gender sharingType cancelled",
          })
          .lean();

        return { ...c, booking };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error("getCancellations error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const approveCancellation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bookingId, cancellationId } = req.body;

    if (!bookingId || !cancellationId) {
      return res.status(400).json({
        success: false,
        message: "bookingId and cancellationId are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(bookingId) ||
      !mongoose.Types.ObjectId.isValid(cancellationId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid bookingId or cancellationId format",
      });
    }

    const cancellation = await cancellationModel
      .findOne({
        _id: cancellationId,
        bookingId,
        raisedBy: true,
        approvedBy: { $ne: true },
      })
      .session(session);

    if (!cancellation) {
      return res.status(404).json({
        success: false,
        message: "Cancellation request not found or already processed",
      });
    }

    const booking = await tourBookingModel
      .findById(bookingId)
      .select(
        "travellers gvCancellationPool irctcCancellationPool cancellationRequest payment contact.mobile"
      )
      .session(session);

    if (!booking) throw new Error("Booking not found");

    // === PENDING TRAVELLERS ===
    const pendingTravellers = (booking.travellers || []).filter(
      (t) => t.cancelled?.byTraveller === true && t.cancelled?.byAdmin !== true
    );

    const pendingCount = pendingTravellers.length;
    const requestedCount = (cancellation.travellerIds || []).length;

    // Build name list
    const getName = (t) =>
      `${t.title || ""} ${t.firstName || ""} ${t.lastName || ""}`.trim() ||
      "Unknown Traveller";

    const pendingNames = pendingTravellers.map(getName);
    const requestedNames = (cancellation.travellerIds || []).map((id) => {
      const t = booking.travellers.find(
        (t) => t._id.toString() === id.toString()
      );
      return t ? getName(t) : `Deleted Traveller (ID: ${id})`;
    });

    // === COUNT MISMATCH ===
    if (pendingCount !== requestedCount) {
      return res.status(400).json({
        success: false,
        message: `CANCELLATION BLOCKED: Traveller

User requested : ${pendingCount} traveller's
Admin calculated : ${requestedCount} traveller's

User requested: ${pendingNames.join(", ") || "None"}
But Admin worked: ${requestedNames.join(", ") || "None"}

Kindly reject this and raise new request`,
        details: {
          pendingTravellers: pendingTravellers.map((t) => ({
            name: getName(t),
            id: t._id.toString(),
            age: t.age,
            gender: t.gender,
          })),
          requestedTravellers: requestedNames,
          pendingCount,
          requestedCount,
        },
      });
    }

    // === ID MISMATCH ===
    const pendingIds = pendingTravellers.map((t) => t._id.toString()).sort();
    const requestIds = (cancellation.travellerIds || [])
      .map((id) => id.toString())
      .sort();

    const idsMatch =
      pendingIds.length === requestIds.length &&
      pendingIds.every((id, i) => id === requestIds[i]);

    if (!idsMatch) {
      return res.status(400).json({
        success: false,
        message: `SECURITY BLOCKED: Wrong travellers detected!

User requested:
→ ${pendingNames.join("\n→ ") || "None"}

But Admin worked:
→ ${requestedNames.join("\n→ ") || "None"}

Kindly reject this and raise new request`,
        details: {
          pendingTravellers: pendingTravellers.map((t) => ({
            name: getName(t),
            id: t._id.toString(),
          })),
          requestedTravellers: requestedNames.map((name, i) => ({
            name,
            id: requestIds[i],
          })),
          securityNote: "Only exact matching travellers can be cancelled",
        },
      });
    }

    // === ALL GOOD — APPROVE ===
    const gvAdd =
      (cancellation.gvCancellationAmount || 0) +
      (cancellation.remarksAmount || 0);
    const irctcAdd = cancellation.irctcCancellationAmount || 0;

    const newGvPool = (booking.gvCancellationPool || 0) + gvAdd;
    const newIrctcPool = (booking.irctcCancellationPool || 0) + irctcAdd;
    const finalBalance = Math.max(0, cancellation.updatedBalance || 0);

    const setObj = {
      gvCancellationPool: newGvPool,
      irctcCancellationPool: newIrctcPool,
      cancellationRequest: false,
      "payment.balance.amount": Number(finalBalance),
    };

    if (finalBalance === 0) {
      setObj["payment.balance.paid"] = true;
      setObj["payment.balance.paymentVerified"] = true;
      setObj["payment.balance.paidAt"] = new Date();
    }

    const arrayFilters = [];
    pendingTravellers.forEach((t, i) => {
      const elem = `elem${i}`;
      setObj[`travellers.$[${elem}].cancelled.byAdmin`] = true;
      setObj[`travellers.$[${elem}].cancelled.cancelledAt`] = new Date();
      arrayFilters.push({ [`${elem}._id`]: t._id });
    });

    await tourBookingModel.findByIdAndUpdate(
      bookingId,
      { $set: setObj },
      { arrayFilters, session, new: true }
    );

    await cancellationModel.findByIdAndUpdate(
      cancellationId,
      { approvedBy: true, approvedAt: new Date(), raisedBy: false },
      { session }
    );

    await session.commitTransaction();

    return res.json({
      success: true,
      message: `Cancellation approved successfully!

Cancelled: ${pendingNames.join(", ")}

New balance: ₹${finalBalance} ${finalBalance === 0 ? "(Fully Paid)" : ""}`,
      data: {
        cancelledTravellers: pendingNames,
        cancelledCount: pendingCount,
        newBalance: finalBalance,
        balancePaid: finalBalance === 0,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("approveCancellation error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during approval. Please try again.",
    });
  } finally {
    session.endSession();
  }
};
const rejectCancellation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bookingId, travellerIds, cancellationId } = req.body;

    // === VALIDATION ===
    if (
      !bookingId ||
      !cancellationId ||
      !Array.isArray(travellerIds) ||
      travellerIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "bookingId, cancellationId, and travellerIds array are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(bookingId) ||
      !mongoose.Types.ObjectId.isValid(cancellationId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid bookingId or cancellationId",
      });
    }

    const invalidTravellerIds = travellerIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidTravellerIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid travellerId(s)",
        invalidIds: invalidTravellerIds,
      });
    }

    // === FIND CANCELLATION DOCUMENT ===
    const cancellation = await cancellationModel
      .findOne({
        _id: cancellationId,
        bookingId,
        raisedBy: true,
      })
      .session(session);

    if (!cancellation) {
      return res.status(404).json({
        success: false,
        message: "Cancellation request not found or already processed",
      });
    }

    // Ensure all requested travellerIds are part of this cancellation
    const cancellationTravellerIds = cancellation.travellerIds.map((id) =>
      id.toString()
    );
    const missing = travellerIds.filter(
      (id) => !cancellationTravellerIds.includes(id.toString())
    );
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some travellerIds do not belong to this cancellation",
        missing,
      });
    }

    // === ONLY UPDATE CANCELLATION MODEL ===
    await cancellationModel.findByIdAndUpdate(
      cancellationId,
      {
        raisedBy: false,
        approvedBy: false,
        rejectedAt: new Date(),
      },
      { session }
    );

    // === ONLY THIS LINE ADDED: Clear cancellationRequest in main booking ===
    await tourBookingModel.findByIdAndUpdate(
      bookingId,
      { $set: { cancellationRequest: false } },
      { session }
    );
    // ======================================================================

    await session.commitTransaction();

    return res.json({
      success: true,
      message: "Cancellation request rejected successfully",
      data: {
        bookingId,
        travellerIds,
        cancellationId,
        cancellationRequestCleared: true,
        rejectedAt: new Date(),
      },
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("rejectCancellation error:", err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};
const addMissingFieldsToAllBookings = async (req, res) => {
  try {
    const totalBookings = await tourBookingModel.countDocuments();

    const result = await tourBookingModel.updateMany(
      {
        $or: [
          { manageBooking: { $exists: false } },
          { dummyField: { $exists: false } },
          { advanceAdminRemarks: { $exists: false } },
          { cancellationRequest: { $exists: false } },
          // Add future fields here easily
        ],
      },
      {
        $set: {
          manageBooking: false,
          dummyField: {},
          advanceAdminRemarks: [],
          cancellationRequest: false,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Migration completed successfully!",
      data: {
        totalBookings,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        fieldsEnsured: [
          "manageBooking",
          "dummyField",
          "advanceAdminRemarks",
          "cancellationRequest",
        ],
      },
    });
  } catch (error) {
    console.error("Migration failed:", error);
    res.status(500).json({
      success: false,
      message: "Migration failed",
      error: error.message,
    });
  }
};
const getPendingApprovals = async (req, res) => {
  try {
    const pendingBookings = await manageBookingModel
      .find({
        manageBooking: true,
        raisedBy: true,
      })
      .populate({
        path: "userId",
        select: "name email mobile",
      })
      .populate({
        path: "tourId",
        select: "title destination startDate endDate thumbnail",
      })
      .populate({
        path: "bookingId",
        select:
          "travellers contact bookingType payment receipts bookingDate gvCancellationPool irctcCancellationPool adminRemarks",
        populate: {
          path: "tourId",
          select: "title",
        },
      })
      .sort({ bookingDate: -1 })
      .select("-__v")
      .lean();

    // Ensure travellers in original booking also have _id
    pendingBookings.forEach((mb) => {
      if (mb.bookingId?.travellers) {
        mb.bookingId.travellers = mb.bookingId.travellers.map((t) => ({
          ...t,
          _id: t._id || new mongoose.Types.ObjectId(), // fallback (should never happen)
        }));
      }
    });

    return res.status(200).json({
      success: true,
      message:
        pendingBookings.length > 0
          ? "Pending approvals fetched successfully."
          : "No pending approvals found.",
      count: pendingBookings.length,
      data: pendingBookings,
    });
  } catch (error) {
    console.error("Error in getPendingApprovals:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending approvals.",
      error: error.message,
    });
  }
};

const approveBookingUpdate = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Valid bookingId is required",
      });
    }

    // Step 1: Find manageBooking request
    const manageBooking = await manageBookingModel
      .findOne({ bookingId, approvedBy: false, raisedBy: true })
      .lean();

    if (!manageBooking) {
      return res.status(404).json({
        success: false,
        message: "No pending update request found for this booking",
      });
    }

    if (manageBooking.approvedBy) {
      return res.status(400).json({
        success: false,
        message: "This update has already been approved",
      });
    }

    // Validate amounts
    if (
      manageBooking.updatedAdvance === undefined ||
      manageBooking.updatedBalance === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "updatedAdvance and updatedBalance are required",
      });
    }

    // Step 2: Prepare update for tourBooking
    const updateData = {
      $set: {
        "payment.advance.amount": manageBooking.updatedAdvance,
        "payment.balance.amount": manageBooking.updatedBalance,
        travellers: manageBooking.travellers, // ← includes _id
        contact: manageBooking.contact,
        billingAddress: manageBooking.billingAddress,
        adminRemarks: manageBooking.adminRemarks || [],
        manageBooking: false, // reset flag
      },
    };

    // Step 3: Apply update
    const updatedTourBooking = await tourBookingModel.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTourBooking) {
      return res.status(404).json({
        success: false,
        message: "Original booking not found",
      });
    }

    // Step 4: Mark manageBooking as approved
    await manageBookingModel.findOneAndUpdate(
      { _id: manageBooking._id },
      { $set: { approvedBy: true, raisedBy: false, manageBooking: false } }
    );

    return res.status(200).json({
      success: true,
      message: "Booking update approved and applied successfully",
      data: {
        updatedBooking: updatedTourBooking,
        approvedRequestId: manageBooking._id,
      },
    });
  } catch (error) {
    console.error("Error in approveBookingUpdate:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const rejectBookingUpdate = async (req, res) => {
  try {
    const { bookingId, remark } = req.body; // remark is optional

    // --- 1. Validate bookingId ---
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Valid bookingId is required",
      });
    }

    // --- 2. Find the pending manageBooking request ---
    const manageBooking = await manageBookingModel
      .findOne({
        bookingId,
        approvedBy: false,
        manageBooking: true,
      })
      .lean();

    if (!manageBooking) {
      return res.status(404).json({
        success: false,
        message: "No pending update request found for this booking",
      });
    }

    // --- 3. Prepare update: reject the request ---
    const updatePayload = {
      $set: {
        manageBooking: false,
        raisedBy: false,
        // Optional: mark as rejected (you can add a field if needed)
      },
      $push: {
        adminRemarks: {
          remark: remark || "Update request rejected by admin",
          amount: 0,
          addedAt: new Date(),
        },
      },
    };

    // --- 4. Apply the update ---
    const updated = await manageBookingModel.findByIdAndUpdate(
      manageBooking._id,
      updatePayload,
      { new: true, runValidators: true }
    );

    // --- 5. Success response ---
    return res.status(200).json({
      success: true,
      message: "Booking update request rejected successfully",
      data: {
        rejectedRequestId: updated._id,
        bookingId: updated.bookingId,
      },
    });
  } catch (error) {
    console.error("rejectBookingUpdate error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export {
  addMissingFieldsToAllBookings,
  addTour,
  loginAdmin,
  allTours,
  bookingsAdmin,
  bookingCancelAdmin,
  bookingRejectAdmin,
  bookingRelease,
  tourAdminDashboard,
  upsertCancellationChart,
  getCancellationChart,
  getCancellations,
  approveCancellation,
  rejectCancellation,
  getPendingApprovals,
  approveBookingUpdate,
  rejectBookingUpdate,
};
