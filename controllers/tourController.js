import tourModel from "../models/tourModel.js";

import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import tourBookingModel from "../models/tourBookingmodel.js";
import cancellationModel from "../models/cancellationModel.js";
import manageBookingModel from "../models/manageBookingModel.js";
import tourRoomAllocationModel from "../models/roomModel.js";
import mongoose from "mongoose"; // Added missing import

const changeTourAvailability = async (req, res) => {
  try {
    const { tourId } = req.body; // ✅ Use tourId here

    const tourData = await tourModel.findById(tourId);

    if (!tourData) {
      return res.json({ success: false, message: "Tour not found" });
    }

    await tourModel.findByIdAndUpdate(tourId, {
      available: !tourData.available,
    });

    res.json({ success: true, message: "Availability changed" });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

const tourList = async (req, res) => {
  try {
    const tours = await tourModel.find({});
    res.json({ success: true, tours });
  } catch (error) {
    console.log("Error fetching tours", error);

    res.json({ success: false, message: error.message });
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
    const { bookingId, tourId } = req.body; // Destructure tourId from the request body

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is missing. Please provide a valid booking ID.",
      });
    }

    if (!tourId) {
      return res.status(400).json({
        success: false,
        message: "Tour ID is missing. Please provide a valid tour ID.",
      });
    }

    // 1. Fetch booking
    const booking = await tourBookingModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "No booking found with the provided booking ID.",
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
          traveller.cancelled?.byTraveller !== true)
    );

    if (!allTravellersCancelledValid) {
      // 5. Check for travellers with only traveller cancellation
      const travellerCancellationIssues = booking.travellers.filter(
        (traveller) =>
          traveller.cancelled?.byTraveller === true &&
          traveller.cancelled?.byAdmin !== true
      );

      if (travellerCancellationIssues.length > 0) {
        const cancelledTravellersList = travellerCancellationIssues
          .map(
            (t) =>
              `Traveller name: ${t.firstName || "Unnamed"} ${t.lastName || ""}`
          )
          .join(", ");

        return res.json({
          success: false,
          message: `Cancellation in request for the traveller: ${cancelledTravellersList}`,
        });
      }

      // 6. Payment + Receipt checks (only if not all travellers meet cancellation conditions)
      const { advance, balance } = booking.payment;
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
    }

    // 7. Mark booking as completed
    booking.isBookingCompleted = true;
    booking.bookingCompletedAt = new Date();

    await booking.save({ validateModifiedOnly: true });

    return res.json({
      success: true,
      message: "Booking marked as completed successfully.",
    });
  } catch (error) {
    console.error("bookingComplete error:", error);
    return res.json({
      success: false,
      message: `An unexpected error occurred: ${error.message}`,
    });
  }
};

const markOfflineAdvancePaid = async (req, res) => {
  try {
    const { bookingId, tourId } = req.body; // Destructure tourId from the request body

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "bookingId is required",
      });
    }

    // Check if tourId is provided
    if (!tourId) {
      return res.status(400).json({
        success: false,
        message: "tourId is required",
      });
    }

    // Fetch booking
    const booking = await tourBookingModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
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
        message: "Only offline bookings can be marked as advance paid",
      });
    }

    // 2. Check traveller cancellation conditions
    const hasTravellerCancelled = booking.travellers.some(
      (traveller) => traveller.cancelled?.byTraveller === true
    );
    const hasAdminCancelled = booking.travellers.some(
      (traveller) => traveller.cancelled?.byAdmin === true
    );

    if (hasTravellerCancelled && hasAdminCancelled) {
      return res.status(400).json({
        success: false,
        message:
          "Booking already cancelled by user and approved by admin, cannot proceed",
      });
    }

    if (hasTravellerCancelled) {
      return res.status(400).json({
        success: false,
        message: "Traveller already requested for cancellation",
      });
    }

    if (hasAdminCancelled) {
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
      booking,
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
    const { bookingId, tourId } = req.body; // Destructure tourId from the request body

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "bookingId is required",
      });
    }

    if (!tourId) {
      return res.status(400).json({
        success: false,
        message: "tourId is required",
      });
    }

    // Fetch booking
    const booking = await tourBookingModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
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
          traveller.cancelled?.byTraveller !== true)
    );

    if (!allTravellersCancelledValid) {
      // 3. Check for travellers with only traveller cancellation
      const travellerCancellationIssues = booking.travellers.filter(
        (traveller) =>
          traveller.cancelled?.byTraveller === true &&
          traveller.cancelled?.byAdmin !== true
      );

      if (travellerCancellationIssues.length > 0) {
        const cancelledTravellersList = travellerCancellationIssues
          .map(
            (t) =>
              `Traveller name: ${t.firstName || "Unnamed"} ${t.lastName || ""}`
          )
          .join(", ");

        return res.status(400).json({
          success: false,
          message: `Cancellation in request for the traveller: ${cancelledTravellersList}`,
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
      booking,
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
      { new: true }
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
        galleryImages.map((img) => uploadImage(img))
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
      variantPackage, // New field: array of variant packages
    } = req.body;

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
    const { bookingId, tourId } = req.body; // Destructure tourId from the request body

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "bookingId is required",
      });
    }

    if (!tourId) {
      return res.status(400).json({
        success: false,
        message: "tourId is required",
      });
    }

    // Fetch booking
    const booking = await tourBookingModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
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
      booking,
    });
  } catch (error) {
    console.error("markAdvanceReceiptSent error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const markBalanceReceiptSent = async (req, res) => {
  try {
    const { bookingId, tourId } = req.body; // Destructure tourId from the request body

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "bookingId is required",
      });
    }

    if (!tourId) {
      return res.status(400).json({
        success: false,
        message: "tourId is required",
      });
    }

    // Fetch booking
    const booking = await tourBookingModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
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
      booking,
    });
  } catch (error) {
    console.error("markBalanceReceiptSent error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const viewTourBalance = async (req, res) => {
  try {
    const { bookingId } = req.params; // Using params for GET request

    // Validate input
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing booking ID",
      });
    }

    // Find the booking by ID, selecting only relevant fields
    const booking = await tourBookingModel
      .findById(bookingId)
      .select("payment.advance payment.balance adminRemarks")
      .lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking balance details retrieved successfully",
      data: {
        bookingId,
        advance: booking.payment.advance,
        balance: booking.payment.balance,
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
    const { bookingId } = req.params; // Using params for GET request

    // Validate input
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing booking ID",
      });
    }

    // Find the booking by ID, selecting only relevant advance-related fields
    const booking = await tourBookingModel
      .findById(bookingId)
      .select("payment.advance payment.balance advanceAdminRemarks ")
      .lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Advance payment details and remarks retrieved successfully",
      data: {
        bookingId,
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
    const { bookingId } = req.params;

    // --- INPUT VALIDATION ---
    if (!req.body || !req.body.updates) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing or does not contain updates",
      });
    }

    const { updates } = req.body;

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing booking ID",
      });
    }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Updates must be a non-empty array",
      });
    }

    for (const update of updates) {
      const { remarks, amount } = update;

      if (amount === undefined || typeof amount !== "number") {
        return res.status(400).json({
          success: false,
          message: "Each update must include a valid amount",
        });
      }

      if (remarks && (typeof remarks !== "string" || remarks.trim() === "")) {
        return res.status(400).json({
          success: false,
          message: "Remarks, if provided, must be a non-empty string",
        });
      }
    }

    // --- FETCH BOOKING ---
    const booking = await tourBookingModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // NEW BLOCK #1: If cancellationRequest is true → Full cancellation pending
    if (booking.cancellationRequest === true) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot update balance: Full booking cancellation request is pending admin approval.",
      });
    }

    // NEW BLOCK #2: If BOTH advance and balance are NOT paid → Block updates
    const advancePaid = booking.payment?.advance?.paid === true;
    const balancePaid = booking.payment?.balance?.paid === true;

    if (!advancePaid && !balancePaid) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot update balance: Neither advance nor balance payment has been received yet.",
      });
    }

    // Existing: Block if traveller applied for cancellation
    const hasTravellerAppliedForCancellation = booking.travellers.some(
      (t) => t.cancelled?.byTraveller === true && t.cancelled?.byAdmin === false
    );

    if (hasTravellerAppliedForCancellation) {
      return res.status(400).json({
        success: false,
        message:
          "One or more travellers have applied for cancellation. Cannot update balance.",
      });
    }

    // Existing: Block if both already paid
    if (advancePaid && balancePaid) {
      return res.status(400).json({
        success: false,
        message: "Cannot update: Advance and balance are both already paid",
      });
    }

    // Existing: All travellers cancelled by admin
    const allTravellersCancelledByAdmin = booking.travellers.every(
      (t) => t.cancelled?.byAdmin === true
    );

    if (allTravellersCancelledByAdmin) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot update: All travellers are cancelled by admin. Booking is closed.",
      });
    }

    // Existing: Prevent negative balance
    const currentBalance = booking.payment?.balance?.amount || 0;
    const totalDeduction = updates
      .filter((u) => u.amount < 0)
      .reduce((sum, u) => sum + Math.abs(u.amount), 0);

    if (currentBalance - totalDeduction < 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot apply updates: Balance would become negative. Current: ₹${currentBalance}, Requested deduction: ₹${totalDeduction}`,
      });
    }

    // --- APPLY UPDATES SAFELY ---
    for (const update of updates) {
      const { remarks, amount } = update;

      // Update balance
      booking.payment.balance.amount += amount;

      // Add to admin remarks
      booking.adminRemarks.push({
        remark: remarks?.trim() || "No remark",
        amount,
        addedAt: new Date(),
      });
    }

    // Mark trip as completed
    booking.isTripCompleted = true;

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Balance and admin remarks updated successfully",
      data: {
        bookingId: booking._id,
        updatedBalance: booking.payment.balance.amount,
        adminRemarks: booking.adminRemarks,
        isTripCompleted: booking.isTripCompleted,
      },
    });
  } catch (error) {
    console.error("Error updating tour balance:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const updateTourAdvance = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // --- INPUT VALIDATION ---
    if (!req.body || !req.body.updates) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing or does not contain updates",
      });
    }

    const { updates } = req.body;

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing booking ID",
      });
    }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Updates must be a non-empty array",
      });
    }

    // Validate each update item
    for (const update of updates) {
      const { remarks, amount } = update;

      if (amount === undefined || typeof amount !== "number" || isNaN(amount)) {
        return res.status(400).json({
          success: false,
          message: "Each update must include a valid 'amount' (number)",
        });
      }

      if (remarks && (typeof remarks !== "string" || remarks.trim() === "")) {
        return res.status(400).json({
          success: false,
          message: "Remarks, if provided, must be a non-empty string",
        });
      }

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message:
            "Amount to shift from advance to balance must be greater than 0",
        });
      }
    }

    // --- FETCH BOOKING ---
    const booking = await tourBookingModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // BLOCK: If advance is already marked as PAID → BLOCK COMPLETELY
    if (booking.payment.advance.paid === true) {
      return res.status(400).json({
        success: false,
        message:
          "Advance already paid. Cannot adjust or shift amount from advance.",
      });
    }

    // BLOCK: Traveller cancellation pending
    const hasTravellerAppliedForCancellation = booking.travellers.some(
      (t) => t.cancelled?.byTraveller === true && t.cancelled?.byAdmin === false
    );

    if (hasTravellerAppliedForCancellation) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot shift advance to balance: One or more travellers have applied for cancellation",
      });
    }

    // BLOCK: If both advance and balance are already fully paid
    const advanceFullyPaid =
      booking.payment.advance.paid === true &&
      booking.payment.advance.paymentVerified === true;
    const balanceFullyPaid = booking.payment.balance.paid === true;

    if (advanceFullyPaid && balanceFullyPaid) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot shift amount: Both advance and balance are already fully paid",
      });
    }

    // BLOCK: If trip is already marked as completed
    if (booking.isTripCompleted === true) {
      return res.status(400).json({
        success: false,
        message: "Cannot shift amount: Trip is already marked as completed",
      });
    }

    // --- APPLY UPDATES: Shift from Advance to Balance ---
    for (const update of updates) {
      const { remarks, amount } = update;

      // Deduct from advance
      booking.payment.advance.amount -= amount;

      // Add to balance
      booking.payment.balance.amount += amount;
      booking.payment.balance.paid = false;
      booking.payment.balance.paymentVerified = false;
      if (booking.payment.balance.paidAt) {
        booking.payment.balance.paidAt = null;
      }

      // Record in advanceAdminRemarks
      booking.advanceAdminRemarks.push({
        remark: remarks?.trim() || "Amount shifted from advance to balance",
        amount: amount,
        addedAt: new Date(),
      });
    }

    // CRITICAL FIX: Tell Mongoose that the array was modified
    booking.markModified("advanceAdminRemarks");

    // Also mark nested payment fields as modified (good practice)
    booking.markModified("payment.advance.amount");
    booking.markModified("payment.balance");

    // Mark trip as completed
    booking.isTripCompleted = true;

    // Save the booking
    await booking.save();

    return res.status(200).json({
      success: true,
      message:
        "Advance amount successfully shifted to balance and trip marked as completed",
      data: {
        bookingId: booking._id,
        updatedAdvanceAmount: booking.payment.advance.amount,
        updatedBalanceAmount: booking.payment.balance.amount,
        advanceAdminRemarks: booking.advanceAdminRemarks,
        isTripCompleted: booking.isTripCompleted,
      },
    });
  } catch (error) {
    console.error("Error in updateTourAdvance:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const updateModifyReceipt = async (req, res) => {
  try {
    const { bookingId, tourId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "bookingId is required",
      });
    }

    if (!tourId) {
      return res.status(400).json({
        success: false,
        message: "tourId is required",
      });
    }

    // Fetch booking
    const booking = await tourBookingModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Ensure booking belongs to the selected tour
    if (booking.tourId.toString() !== tourId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to modify this booking",
      });
    }

    // Set isTripCompleted to false
    booking.isTripCompleted = false;

    // Save the updated booking
    await booking.save({ validateModifiedOnly: true });

    return res.status(200).json({
      success: true,
      message: "Trip completion status marked as not completed successfully",
      booking,
    });
  } catch (error) {
    console.error("updateModifyReceipt error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

// controllers/tourController.js
const viewBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
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

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const booking = await tourBookingModel
      .findById(bookingId)
      .populate("userId", "name email mobile")
      .lean();

    if (!booking)
      return res.status(404).json({ success: false, message: "Not found" });

    const tour = await tourModel.findById(booking.tourId).lean();
    if (!tour)
      return res
        .status(404)
        .json({ success: false, message: "Tour not found" });

    booking.tourFull = tour;

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error("viewBooking error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
const getCancellationsByBooking = async (req, res) => {
  const { bookingId } = req.params;
  const { limit = 20 } = req.query;

  // Validate bookingId
  if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid bookingId" });
  }

  const numericLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);

  try {
    // find cancellations for this booking
    const cancellations = await cancellationModel
      .find({ bookingId: bookingId })
      .sort({ createdAt: -1 })
      .limit(numericLimit)
      .lean();

    // return as array
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

const updateBookingBalance = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { updates = {} } = req.body;

    // ---- 1. Validate ID -------------------------------------------------
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid bookingId" });
    }

    // ---- 2. Load original booking + populate tour + travellers ----------
    const original = await tourBookingModel
      .findById(bookingId)
      .populate("tourId")
      .lean();

    if (!original) {
      return res
        .status(404)
        .json({ success: false, message: "Original booking not found" });
    }

    // BLOCK #1: Traveller-initiated individual cancellation pending
    const hasPendingTravellerCancellation = original.travellers.some(
      (t) => t.cancelled?.byTraveller === true && t.cancelled?.byAdmin === false
    );

    if (hasPendingTravellerCancellation) {
      return res.status(400).json({
        success: false,
        message:
          "Cancellation request already raised by traveller. Manage booking updates are not allowed until admin approves/rejects the cancellation.",
        reason: "pending_traveller_cancellation",
      });
    }

    // BLOCK #2: Full booking cancellation request pending
    if (original.cancellationRequest === true) {
      return res.status(400).json({
        success: false,
        message:
          "This booking has a pending cancellation request. Updates are not allowed until admin approves or rejects it.",
        reason: "pending_full_cancellation",
      });
    }

    // NEW BLOCK #3: Refund already issued (balance < 0) → restrict edits
    const originalBalanceAmount = original.payment?.balance?.amount || 0;
    if (originalBalanceAmount < 0) {
      const restrictedUpdates = {
        travellers: original.travellers.map((origT, i) => {
          const updateT = updates.travellers?.[i];
          if (!updateT) return origT;

          return {
            ...origT,
            boardingPoint: updateT.boardingPoint || origT.boardingPoint,
            deboardingPoint: updateT.deboardingPoint || origT.deboardingPoint,
          };
        }),
      };

      const merged = { ...original, ...restrictedUpdates };

      const manageDoc = {
        userId: merged.userId,
        tourId: original.tourId._id,
        bookingId,
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
        raisedAt: new Date(Date.now() + 5.5 * 60 * 60 * 1000), // IST

        updatableAdvance: original.payment.advance.amount,
        updatedAdvance: original.payment.advance.amount,
        updatableBalance: original.payment.balance.amount,
        updatedBalance: original.payment.balance.amount,
      };

      const saved = await manageBookingModel.create(manageDoc);

      return res.status(201).json({
        success: true,
        message:
          "Refund already processed. Only boarding/deboarding changes are allowed.",
        warning:
          "Due to prior refund issuance, only boarding & deboarding points were updated.",
        data: saved,
      });
    }
    // -------------------------------------------------------------------------

    const tour = original.tourId;

    // ---- Payment Status -------------------------------------------------
    const advancePaid = original.payment?.advance?.paid ?? false;
    const balancePaid = original.payment?.balance?.paid ?? false;

    // ---- CASE: Both advance and balance PAID → ONLY boarding/deboarding allowed
    if (advancePaid && balancePaid) {
      const restrictedUpdates = {
        travellers: original.travellers.map((origT, i) => {
          const updateT = updates.travellers?.[i];
          if (!updateT) return origT;

          return {
            ...origT,
            boardingPoint: updateT.boardingPoint || origT.boardingPoint,
            deboardingPoint: updateT.deboardingPoint || origT.deboardingPoint,
          };
        }),
      };

      const merged = { ...original, ...restrictedUpdates };

      const manageDoc = {
        userId: merged.userId,
        tourId: tour._id,
        bookingId,
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
        raisedAt: new Date(Date.now() + 5.5 * 60 * 60 * 1000), // IST

        updatableAdvance: original.payment.advance.amount,
        updatedAdvance: original.payment.advance.amount,
        updatableBalance: original.payment.balance.amount,
        updatedBalance: original.payment.balance.amount,
      };

      const saved = await manageBookingModel.create(manageDoc);

      return res.status(201).json({
        success: true,
        message: "Manage-booking raised (only boarding/deboarding updated)",
        warning:
          "Full payment received. Only boarding/deboarding changes allowed.",
        data: saved,
      });
    }

    // ---- Normal merge (when not fully paid and balance >= 0) --------------
    const merged = {
      ...original,
      ...updates,
      travellers: original.travellers.map((origT, i) => ({
        ...origT,
        ...(updates.travellers?.[i] || {}),
      })),
      contact: { ...original.contact, ...(updates.contact || {}) },
      billingAddress: {
        ...original.billingAddress,
        ...(updates.billingAddress || {}),
      },
    };

    // ---- Helper Functions (unchanged) ------------------------------------
    const getPackage = (traveller) => {
      return traveller.packageType === "main"
        ? tour
        : tour.variantPackage?.[traveller.variantPackageIndex] ?? tour;
    };

    const getTravellerAdvance = (traveller) => {
      const pkg = getPackage(traveller);
      if (!pkg || !pkg.advanceAmount) return 0;
      const isChild =
        traveller.sharingType === "withBerth" ||
        traveller.sharingType === "withoutBerth";
      return isChild ? pkg.advanceAmount.child : pkg.advanceAmount.adult;
    };

    const getTravellerBalance = (traveller) => {
      const pkg = getPackage(traveller);
      if (!pkg) return 0;
      switch (traveller.sharingType) {
        case "double":
          return pkg.balanceDouble ?? 0;
        case "triple":
          return pkg.balanceTriple ?? 0;
        case "withBerth":
          return pkg.balanceChildWithBerth ?? 0;
        case "withoutBerth":
          return pkg.balanceChildWithoutBerth ?? 0;
        default:
          return 0;
      }
    };

    const getAddonPrice = (traveller) => traveller.selectedAddon?.price ?? 0;

    const activeTravellers = merged.travellers.filter(
      (t) => !t.cancelled?.byAdmin && !t.cancelled?.byTraveller
    );

    let updatableAdvance = 0,
      updatedAdvance = 0,
      updatableBalance = 0,
      updatedBalance = 0;

    // Case: Advance paid, balance not paid
    if (advancePaid && !balancePaid) {
      const originalAdvanceAmount = original.payment?.advance?.amount || 0;
      updatableAdvance = updatedAdvance = originalAdvanceAmount;

      const getTravellerPrice = (traveller) => {
        const pkg = getPackage(traveller);
        if (!pkg) return 0;
        let base = 0;
        switch (traveller.sharingType) {
          case "double":
            base = pkg.price?.doubleSharing ?? 0;
            break;
          case "triple":
            base = pkg.price?.tripleSharing ?? 0;
            break;
          case "withBerth":
            base = pkg.price?.childWithBerth ?? 0;
            break;
          case "withoutBerth":
            base = pkg.price?.childWithoutBerth ?? 0;
            break;
          default:
            base = pkg.price?.doubleSharing ?? 0;
        }
        return base + getAddonPrice(traveller);
      };

      const A = activeTravellers.reduce(
        (sum, t) => sum + getTravellerPrice(t),
        0
      );
      const C =
        (merged.gvCancellationPool || 0) + (merged.irctcCancellationPool || 0);
      const D = (merged.adminRemarks || [])
        .filter((r) => (r.amount || 0) > 0)
        .reduce((sum, r) => sum + r.amount, 0);

      updatableBalance = A + C + D;

      const negativeRemarksTotal = (merged.adminRemarks || [])
        .filter((r) => (r.amount || 0) < 0)
        .reduce((sum, r) => sum + Math.abs(r.amount), 0);

      updatedBalance =
        updatableBalance - originalAdvanceAmount - negativeRemarksTotal;
    }
    // Case: Both unpaid
    else if (!advancePaid && !balancePaid) {
      const A = activeTravellers.reduce(
        (sum, t) => sum + getTravellerAdvance(t),
        0
      );
      const B = activeTravellers.reduce((sum, t) => sum + getAddonPrice(t), 0);
      updatableAdvance = updatedAdvance = A + B;

      const C = activeTravellers.reduce(
        (sum, t) => sum + getTravellerBalance(t),
        0
      );
      updatableBalance = updatedBalance = C;
    }

    // ---- Create manageBooking request -------------------------------------
    const manageDoc = {
      userId: merged.userId,
      tourId: tour._id,
      bookingId,
      userData: merged.userData,
      tourData: merged.tourData,
      travellers: merged.travellers,
      billingAddress: merged.billingAddress,
      contact: merged.contact,
      bookingType: merged.bookingType,
      payment: merged.payment,
      receipts: merged.receipts,
      isTripCompleted: merged.isTripCompleted,
      isBookingCompleted: merged.isBookingCompleted,
      cancelled: merged.cancelled,
      bookingDate: merged.bookingDate,
      gvCancellationPool: merged.gvCancellationPool,
      irctcCancellationPool: merged.irctcCancellationPool,
      manageBooking: true,
      adminRemarks: merged.adminRemarks || [],

      approvedBy: false,
      raisedBy: true,
      raisedAt: new Date(Date.now() + 5.5 * 60 * 60 * 1000), // IST

      updatableAdvance,
      updatedAdvance,
      updatableBalance,
      updatedBalance,
    };

    const saved = await manageBookingModel.create(manageDoc);

    return res.status(201).json({
      success: true,
      message: "Manage-booking raised successfully",
      data: saved,
    });
  } catch (err) {
    console.error("updateBookingBalance error:", err);
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
      (b) => b.payment.advance.paid && b.payment.advance.paymentVerified
    );

    const unpaidBookings = bookings.filter(
      (b) => !b.payment.advance.paid || !b.payment.advance.paymentVerified
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
        (t) => !t.cancelled.byAdmin && !t.cancelled.byTraveller
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
        (a, b) => a.traveller.originalIndex - b.traveller.originalIndex
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
            t.sharingType === "withBerth" || t.sharingType === "withoutBerth"
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
        (a, b) => a.traveller.originalIndex - b.traveller.originalIndex
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

    singleRooms.forEach((single) => {
      const occupant = single.room.occupants[0];
      const gender = occupant.gender.toLowerCase();
      const original = occupant.sharingType;
      if (original === "triple") tripleSingles[gender].push(single);
      else if (original === "double") doubleSingles[gender].push(single);
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
        rawRoomEntries[r.entryIndex].rooms.push(r.room)
      );
      doubleSingles[gender].forEach((r) =>
        rawRoomEntries[r.entryIndex].rooms.push(r.room)
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

    const groupedByMobile = Array.from(mobileMap.values())
      .map((g) => ({
        contactMobile: g.contactMobile,
        bookingIds: Array.from(g.bookingIds),
        rooms: g.rooms.map((r, i) => ({ ...r, roomNumber: i + 1 })),
      }))
      .sort((a, b) => a.contactMobile.localeCompare(b.contactMobile));

    // === Check existing finalized allocation ===
    const existing = await tourRoomAllocationModel.findOne({
      tourId: objectTourId,
    });

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
        }))
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
        grouped: true,
        isFinalized: false,
      },
      { upsert: true, new: true }
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
      }))
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
export {
  tourList,
  changeTourAvailability,
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
  updateModifyReceipt,
  viewBooking,
  getCancellationsByBooking,
  updateBookingBalance,
  getManagedBookingsHistory,
  allotRooms,
};
