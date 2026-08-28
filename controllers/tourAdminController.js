// // import mongoose from "mongoose";

// // import { v2 as cloudinary } from "cloudinary";
// // import jwt from "jsonwebtoken";

// // import tourModel from "../models/tourModel.js";
// // import userModel from "../models/userModel.js";
// // import Terms from "../models/termModel.js";
// // import tourBookingModel from "../models/tourBookingmodel.js";
// // import cancelRuleModel from "../models/cancelRuleModel.js";
// // import cancellationModel from "../models/cancellationModel.js";
// // import tourRoomAllocationModel from "../models/roomModel.js";
// // import manageBookingModel from "../models/manageBookingModel.js";
// // import TourVehicle from "../models/tourVehicleModel.js";
// // import PaymentMethod from "../models/paymentModel.js";

// // // controllers/adminController.js   (or wherever your admin controllers live)

// // // Helper function to generate 6-char TNR in format: AAA9AA
// // function generateTNR() {
// //   const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
// //   const digits = "0123456789";

// //   // Position 1-2: uppercase letters
// //   let code =
// //     letters.charAt(Math.floor(Math.random() * letters.length)) +
// //     letters.charAt(Math.floor(Math.random() * letters.length));

// //   // Position 3-4: digits
// //   code +=
// //     digits.charAt(Math.floor(Math.random() * digits.length)) +
// //     digits.charAt(Math.floor(Math.random() * digits.length));

// //   // Position 5-6: uppercase letters
// //   code +=
// //     letters.charAt(Math.floor(Math.random() * letters.length)) +
// //     letters.charAt(Math.floor(Math.random() * letters.length));

// //   return code;
// // }

// // async function generateMissingTNRs(req, res) {
// //   try {
// //     // 1. Find all bookings without tnr
// //     const bookingsWithoutTNR = await tourBookingModel
// //       .find({ tnr: { $exists: false } })
// //       .select("_id tnr bookingDate contact.email userId")
// //       .lean();

// //     const count = bookingsWithoutTNR.length;

// //     if (count === 0) {
// //       return res.status(200).json({
// //         success: true,
// //         message: "No bookings are missing TNR. All bookings already have one.",
// //         processed: 0,
// //         totalChecked: await tourBookingModel.countDocuments(),
// //       });
// //     }

// //     console.log(`Found ${count} bookings without TNR → starting generation...`);

// //     let successCount = 0;
// //     let collisionCount = 0;
// //     let failed = [];

// //     // Process in smaller batches to avoid memory issues
// //     for (const booking of bookingsWithoutTNR) {
// //       let attempts = 0;
// //       let tnr = null;

// //       while (attempts < 15) {
// //         const candidate = generateTNR();

// //         // Check if this TNR already exists
// //         const conflict = await tourBookingModel.exists({ tnr: candidate });

// //         if (!conflict) {
// //           tnr = candidate;
// //           break;
// //         }

// //         collisionCount++;
// //         attempts++;
// //       }

// //       if (!tnr) {
// //         failed.push({
// //           bookingId: booking._id.toString(),
// //           reason: "Could not generate unique TNR after 15 attempts",
// //         });
// //         continue;
// //       }

// //       // Update the booking
// //       await tourBookingModel.updateOne({ _id: booking._id }, { $set: { tnr } });

// //       successCount++;

// //       // Optional: log first few for debugging
// //       if (successCount <= 5) {
// //         console.log(`Assigned TNR ${tnr} to booking ${booking._id}`);
// //       }
// //     }

// //     const message =
// //       successCount === count
// //         ? `Successfully generated TNR for all ${count} missing bookings.`
// //         : `Processed ${count} bookings: ${successCount} updated, ${failed.length} failed.`;

// //     return res.status(200).json({
// //       success: true,
// //       message,
// //       summary: {
// //         totalMissing: count,
// //         successfullyUpdated: successCount,
// //         collisionsDuringGeneration: collisionCount,
// //         failed: failed.length,
// //       },
// //       failedBookings: failed.length > 0 ? failed : undefined,
// //     });
// //   } catch (error) {
// //     console.error("generateMissingTNRs failed:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Failed to generate missing TNRs",
// //       error: error.message,
// //     });
// //   }
// // }
// // //API for the admin login
// // const loginAdmin = async (req, res) => {
// //   try {
// //     const { email, password } = req.body;
// //     if (
// //       email === process.env.ADMIN_EMAIL &&
// //       password === process.env.ADMIN_PASSWORD
// //     ) {
// //       const token = jwt.sign(email + password, process.env.JWT_SECRET);
// //       res.json({
// //         success: true,
// //         token,
// //       });
// //     } else {
// //       res.json({
// //         success: false,
// //         message: "Invalid credentials",
// //       });
// //     }
// //   } catch (error) {
// //     console.log(error);
// //     res.json({
// //       success: false,
// //       message: error.message,
// //     });
// //   }
// // };

// // //THIS CONTROLLER IS USED IN TOUR CONTROLERS AND DATA PAGE
// // const allTours = async (req, res) => {
// //   try {
// //     const tours = await tourModel.find({}).select("-password");
// //     res.json({ success: true, tours });
// //   } catch (error) {
// //     console.log(error);
// //     res.json({
// //       success: false,
// //       message: error.message,
// //     });
// //   }
// // };
// // //CHANGES THE AVAILABLITY OF TOUR
// // const changeTourAvailability = async (req, res) => {
// //   try {
// //     const { tourId } = req.body; // ✅ Use tourId here

// //     const tourData = await tourModel.findById(tourId);

// //     if (!tourData) {
// //       return res.json({ success: false, message: "Tour not found" });
// //     }

// //     await tourModel.findByIdAndUpdate(tourId, {
// //       available: !tourData.available,
// //     });

// //     res.json({ success: true, message: "Availability changed" });
// //   } catch (error) {
// //     console.log(error);
// //     res.json({
// //       success: false,
// //       message: error.message,
// //     });
// //   }
// // };

// // //Add tour controller
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

// // const tourAdminDashboard = async (req, res) => {
// //   try {
// //     const tours = await tourModel.find({});
// //     const users = await userModel.find({});
// //     const bookings = await tourBookingModel.find({});
// //     const dashData = {
// //       tours: tours.length,
// //       bookings: bookings.length,
// //       users: users.length,
// //       latestAppointments: bookings.reverse().slice(0, 5),
// //     };
// //     res.json({ success: true, dashData });
// //   } catch (error) {
// //     console.log(error);
// //     res.json({
// //       success: false,
// //       message: error.message,
// //     });
// //   }
// // };

// // //API to get all BOOKINGS

// // const bookingsAdmin = async (req, res) => {
// //   try {
// //     const bookings = await tourBookingModel.find({});
// //     res.json({ success: true, bookings });
// //   } catch (error) {
// //     console.log(error);
// //     res.json({
// //       success: false,
// //       message: error.message,
// //     });
// //   }
// // };

// // //WORKS SAME LIKE BOOKINGS ADMIN BUT LINKED TO CONTEXT SO NEEDED
// // const getBookings = async (req, res) => {
// //   try {
// //     console.log("Logged-in tour operator ID:", req.tourOperator?._id); // ← add this
// //     const bookings = await tourBookingModel
// //       .find({})
// //       .populate({
// //         path: "userId",
// //         select: "name email mobile", // Only needed user fields
// //       })
// //       .populate({
// //         path: "tourId",
// //         select: "title destination startDate endDate available", // Tour details
// //       })
// //       .sort({ bookingDate: -1 }) // Latest bookings first
// //       .lean(); // Better performance for large data
// //     console.log("Total bookings found in DB:", bookings.length); // ← add this

// //     if (!bookings || bookings.length === 0) {
// //       return res.status(200).json({
// //         success: true,
// //         message: "No bookings found in the system.",
// //         total: 0,
// //         bookings: [],
// //       });
// //     }

// //     // Optional: Add quick stats
// //     const totalBookings = bookings.length;
// //     const totalEarnings = bookings.reduce((sum, b) => {
// //       let earnings = 0;
// //       if (b.payment?.advance?.paid) earnings += b.payment.advance.amount || 0;
// //       if (b.payment?.balance?.paid) earnings += b.payment.balance.amount || 0;
// //       return sum + earnings;
// //     }, 0);

// //     const completedBookings = bookings.filter(
// //       (b) => b.isBookingCompleted,
// //     ).length;
// //     const pendingBookings = totalBookings - completedBookings;

// //     res.status(200).json({
// //       success: true,
// //       totalBookings,
// //       totalEarnings,
// //       completedBookings,
// //       pendingBookings,
// //       bookings,
// //     });
// //   } catch (error) {
// //     console.error("Error in getBookings:", error);
// //     res.status(500).json({
// //       success: false,
// //       message: "Failed to fetch all bookings",
// //       error: error.message,
// //     });
// //   }
// // };

// // //ALL CONTROLLERS RELATED TO CANCLLATION START FROM HERE

// // // GET (with auto-create default)
// // const getCancellationChart = async (req, res) => {
// //   try {
// //     let chart = await cancelRuleModel.findOne();

// //     if (!chart) {
// //       chart = await cancelRuleModel.create({
// //         gv: {
// //           advancePaid: {
// //             tiers: [{ fromDays: 30, toDays: 15, percentage: 50 }],
// //           },
// //           fullyPaid: { tiers: [{ fromDays: 30, toDays: 15, percentage: 100 }] },
// //         },
// //         irctc: [
// //           { classType: "SL", noOfDays: 7, fixedAmount: 60, percentage: 50 },
// //         ],
// //       });
// //     }

// //     res.status(200).json({ success: true, data: chart });
// //   } catch (error) {
// //     console.error("Error:", error);
// //     res.status(500).json({ success: false, message: "Failed to fetch chart" });
// //   }
// // };

// // // UPDATE CANCELLATION CHART (or create if not exists)
// // const upsertCancellationChart = async (req, res) => {
// //   try {
// //     const { gv, irctc } = req.body;
// //     let chart = await cancelRuleModel.findOne();

// //     if (chart) {
// //       chart.gv = gv ?? chart.gv;
// //       chart.irctc = irctc ?? chart.irctc;
// //       chart = await chart.save();
// //     } else {
// //       chart = await cancelRuleModel.create({ gv, irctc });
// //     }

// //     res.status(200).json({
// //       success: true,
// //       message: "Updated",
// //       data: chart,
// //     });
// //   } catch (error) {
// //     console.error("Upsert error:", error);
// //     res.status(500).json({ success: false, message: "Failed to update" });
// //   }
// // };

// // const getCancellations = async (req, res) => {
// //   try {
// //     // 1. Find cancellation docs that are RAISED but NOT YET APPROVED
// //     const pendingCancellations = await cancellationModel
// //       .find({
// //         raisedBy: true,
// //         $or: [{ approvedBy: { $exists: false } }, { approvedBy: false }],
// //       })
// //       .select("-__v")
// //       .lean();

// //     if (!pendingCancellations.length) {
// //       return res.json({ success: true, data: [] });
// //     }

// //     // 2. Extract TNRs (instead of bookingIds)
// //     const tnrs = [
// //       ...new Set(pendingCancellations.map((c) => c.tnr).filter(Boolean)),
// //     ];

// //     // 3. Fetch bookings by TNR + filter travellers on server side
// //     const bookings = await tourBookingModel
// //       .find({ tnr: { $in: tnrs } })
// //       .select("tnr travellers cancelled")
// //       .lean();

// //     // Helper: does the booking contain a traveller cancelled **by traveller only** OR **by admin only**?
// //     const hasValidTravellerCancellation = (booking) => {
// //       return booking.travellers.some(
// //         (t) =>
// //           (t.cancelled?.byTraveller === true &&
// //             t.cancelled?.byAdmin === false) ||
// //           (t.cancelled?.byAdmin === true &&
// //             t.cancelled?.byTraveller === false) ||
// //           (t.cancelled?.byAdmin === true && t.cancelled?.byTraveller === true),
// //       );
// //     };

// //     const validTnrs = bookings
// //       .filter(hasValidTravellerCancellation)
// //       .map((b) => b.tnr);

// //     // 4. Keep only cancellation docs whose TNR passed the traveller check
// //     const result = pendingCancellations.filter(
// //       (c) => c.tnr && validTnrs.includes(c.tnr),
// //     );

// //     // 5. Populate booking & traveller data for the frontend (using TNR)
// //     const enriched = await Promise.all(
// //       result.map(async (c) => {
// //         const booking = await tourBookingModel
// //           .findOne({ tnr: c.tnr })
// //           .select(
// //             "tnr userId tourId travellers contact bookingDate payment adminRemarks",
// //           )
// //           .populate({
// //             path: "travellers",
// //             match: {
// //               $or: [
// //                 { "cancelled.byTraveller": true, "cancelled.byAdmin": false },
// //               ],
// //             },
// //             select: "title firstName lastName age gender sharingType cancelled",
// //           })
// //           .lean();

// //         return { ...c, booking };
// //       }),
// //     );

// //     res.json({ success: true, data: enriched });
// //   } catch (err) {
// //     console.error("getCancellations error:", err);
// //     res.status(500).json({ success: false, message: err.message });
// //   }
// // };

// // const approveCancellation = async (req, res) => {
// //   const session = await mongoose.startSession();
// //   session.startTransaction();

// //   try {
// //     const { tnr, travellerIds, cancellationId } = req.body;

// //     if (!tnr || !travellerIds || !cancellationId) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "tnr, travellerIds, and cancellationId are required",
// //       });
// //     }

// //     const normalizedTnr = tnr.trim().toUpperCase();

// //     const cancellation = await cancellationModel
// //       .findOne({
// //         _id: cancellationId,
// //         tnr: normalizedTnr,
// //         raisedBy: true,
// //         approvedBy: { $ne: true },
// //       })
// //       .session(session);

// //     if (!cancellation) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Cancellation request not found or already processed",
// //       });
// //     }

// //     const booking = await tourBookingModel
// //       .findOne({ tnr: normalizedTnr })
// //       .select(
// //         "tnr travellers gvCancellationPool irctcCancellationPool cancellationRequest payment contact.mobile",
// //       )
// //       .session(session);

// //     if (!booking) throw new Error("Booking not found");

// //     // === PENDING TRAVELLERS ===
// //     const pendingTravellers = (booking.travellers || []).filter(
// //       (t) => t.cancelled?.byTraveller === true && t.cancelled?.byAdmin !== true,
// //     );

// //     const pendingCount = pendingTravellers.length;
// //     const requestedCount = (cancellation.travellerIds || []).length;

// //     // Build name list
// //     const getName = (t) =>
// //       `${t.title || ""} ${t.firstName || ""} ${t.lastName || ""}`.trim() ||
// //       "Unknown Traveller";

// //     const pendingNames = pendingTravellers.map(getName);
// //     const requestedNames = (cancellation.travellerIds || []).map((id) => {
// //       const t = booking.travellers.find(
// //         (trav) => trav._id.toString() === id.toString(),
// //       );
// //       return t ? getName(t) : `Deleted Traveller (ID: ${id})`;
// //     });

// //     // === COUNT MISMATCH ===
// //     if (pendingCount !== requestedCount) {
// //       return res.status(400).json({
// //         success: false,
// //         message: `CANCELLATION BLOCKED: Traveller count mismatch

// // User requested : ${pendingCount} traveller(s)
// // Admin calculated : ${requestedCount} traveller(s)

// // User requested: ${pendingNames.join(", ") || "None"}
// // But Admin worked: ${requestedNames.join(", ") || "None"}

// // Kindly reject this and raise new request`,
// //         details: {
// //           pendingTravellers: pendingTravellers.map((t) => ({
// //             name: getName(t),
// //             id: t._id.toString(),
// //             age: t.age,
// //             gender: t.gender,
// //           })),
// //           requestedTravellers: requestedNames,
// //           pendingCount,
// //           requestedCount,
// //         },
// //       });
// //     }

// //     // === ID MISMATCH ===
// //     const pendingIds = pendingTravellers.map((t) => t._id.toString()).sort();
// //     const requestIds = (cancellation.travellerIds || [])
// //       .map((id) => id.toString())
// //       .sort();

// //     const idsMatch =
// //       pendingIds.length === requestIds.length &&
// //       pendingIds.every((id, i) => id === requestIds[i]);

// //     if (!idsMatch) {
// //       return res.status(400).json({
// //         success: false,
// //         message: `SECURITY BLOCKED: Wrong travellers detected!

// // User requested:
// // → ${pendingNames.join("\n→ ") || "None"}

// // But Admin worked:
// // → ${requestedNames.join("\n→ ") || "None"}

// // Kindly reject this and raise new request`,
// //         details: {
// //           pendingTravellers: pendingTravellers.map((t) => ({
// //             name: getName(t),
// //             id: t._id.toString(),
// //           })),
// //           requestedTravellers: requestedNames.map((name, i) => ({
// //             name,
// //             id: requestIds[i],
// //           })),
// //           securityNote: "Only exact matching travellers can be cancelled",
// //         },
// //       });
// //     }

// //     // === ALL GOOD — APPROVE ===
// //     const gvAdd =
// //       (cancellation.gvCancellationAmount || 0) +
// //       (cancellation.remarksAmount || 0);
// //     const irctcAdd = cancellation.irctcCancellationAmount || 0;

// //     const newGvPool = (booking.gvCancellationPool || 0) + gvAdd;
// //     const newIrctcPool = (booking.irctcCancellationPool || 0) + irctcAdd;
// //     const finalBalance = Math.max(0, cancellation.updatedBalance || 0);

// //     const setObj = {
// //       gvCancellationPool: newGvPool,
// //       irctcCancellationPool: newIrctcPool,
// //       cancellationRequest: false,
// //       cancellationReceipt: true,
// //       "payment.balance.amount": Number(finalBalance),
// //     };

// //     if (finalBalance === 0) {
// //       setObj["payment.balance.paid"] = true;
// //       setObj["payment.balance.paymentVerified"] = true;
// //       setObj["payment.balance.paidAt"] = new Date();
// //     }

// //     // === Prepare arrayFilters for positional updates ===
// //     const arrayFilters = [];

// //     // === NEW: Clear seat lock & seat number for approved travellers ===
// //     pendingTravellers.forEach((t, i) => {
// //       const elemKey = `elem${i}`;
// //       setObj[`travellers.$[${elemKey}].cancelled.byAdmin`] = true;
// //       setObj[`travellers.$[${elemKey}].cancelled.cancelledAt`] = new Date();

// //       // Clear seat allocation
// //       setObj[`travellers.$[${elemKey}].seatNumber`] = null;
// //       setObj[`travellers.$[${elemKey}].seatLocked`] = false;
// //       setObj[`travellers.$[${elemKey}].seatLockedAt`] = null;

// //       // Add filter for this traveller's _id
// //       arrayFilters.push({ [`${elemKey}._id`]: t._id });
// //     });

// //     // === Update booking with all changes ===
// //     await tourBookingModel.updateOne(
// //       { tnr: normalizedTnr },
// //       { $set: setObj },
// //       { arrayFilters, session, new: true },
// //     );

// //     // === NEW: Remove from bookedSeats in tourVehicleModel ===
// //     for (const traveller of pendingTravellers) {
// //       const seatNumber = traveller.seatNumber;
// //       if (!seatNumber) continue; // no seat was locked

// //       // Find the vehicle that has this exact seat booked for this booking
// //       const vehicle = await TourVehicle.findOne(
// //         {
// //           "bookedSeats.seatNumber": seatNumber,
// //           "bookedSeats.bookingId": booking._id,
// //           "bookedSeats.travellerIndex": booking.travellers.indexOf(traveller),
// //         },
// //         { _id: 1, bookedSeats: 1 },
// //       ).session(session);

// //       if (vehicle) {
// //         // Remove the matching booked seat entry
// //         await TourVehicle.updateOne(
// //           { _id: vehicle._id },
// //           {
// //             $pull: {
// //               bookedSeats: {
// //                 seatNumber: seatNumber,
// //                 bookingId: booking._id,
// //               },
// //             },
// //           },
// //           { session },
// //         );
// //       }
// //     }

// //     // Approve the cancellation record
// //     await cancellationModel.findByIdAndUpdate(
// //       cancellationId,
// //       { approvedBy: true, approvedAt: new Date(), raisedBy: false },
// //       { session },
// //     );

// //     await session.commitTransaction();

// //     return res.json({
// //       success: true,
// //       message: `Cancellation approved successfully!

// // Cancelled: ${pendingNames.join(", ")}

// // New balance: ₹${finalBalance} ${finalBalance === 0 ? "(Fully Paid)" : ""}`,
// //       data: {
// //         cancelledTravellers: pendingNames,
// //         cancelledCount: pendingCount,
// //         newBalance: finalBalance,
// //         balancePaid: finalBalance === 0,
// //         tnr: normalizedTnr,
// //         seatsReleased: pendingTravellers
// //           .map((t) => t.seatNumber)
// //           .filter(Boolean),
// //       },
// //     });
// //   } catch (err) {
// //     await session.abortTransaction();
// //     console.error("approveCancellation error:", err);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Server error during approval. Please try again.",
// //     });
// //   } finally {
// //     session.endSession();
// //   }
// // };

// // const rejectCancellation = async (req, res) => {
// //   const session = await mongoose.startSession();
// //   session.startTransaction();

// //   try {
// //     const { tnr, travellerIds, cancellationId } = req.body;

// //     // === VALIDATION ===
// //     if (
// //       !tnr ||
// //       !cancellationId ||
// //       !Array.isArray(travellerIds) ||
// //       travellerIds.length === 0
// //     ) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "tnr, cancellationId, and travellerIds array are required",
// //       });
// //     }

// //     const normalizedTnr = tnr.trim().toUpperCase();

// //     const cancellation = await cancellationModel
// //       .findOne({
// //         _id: cancellationId,
// //         tnr: normalizedTnr,
// //         raisedBy: true,
// //       })
// //       .session(session);

// //     if (!cancellation) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Cancellation request not found or already processed",
// //       });
// //     }

// //     // Ensure all requested travellerIds are part of this cancellation
// //     const cancellationTravellerIds = cancellation.travellerIds.map((id) =>
// //       id.toString(),
// //     );
// //     const missing = travellerIds.filter(
// //       (id) => !cancellationTravellerIds.includes(id.toString()),
// //     );
// //     if (missing.length > 0) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Some travellerIds do not belong to this cancellation",
// //         missing,
// //       });
// //     }

// //     // === ONLY UPDATE CANCELLATION MODEL ===
// //     await cancellationModel.findByIdAndUpdate(
// //       cancellationId,
// //       {
// //         raisedBy: false,
// //         approvedBy: false,
// //         rejectedAt: new Date(),
// //       },
// //       { session },
// //     );

// //     // === Clear cancellationRequest in main booking ===
// //     await tourBookingModel.updateOne(
// //       { tnr: normalizedTnr },
// //       { $set: { cancellationRequest: false } },
// //       { session },
// //     );

// //     await session.commitTransaction();

// //     return res.json({
// //       success: true,
// //       message: "Cancellation request rejected successfully",
// //       data: {
// //         tnr: normalizedTnr,
// //         travellerIds,
// //         cancellationId,
// //         cancellationRequestCleared: true,
// //         rejectedAt: new Date(),
// //       },
// //     });
// //   } catch (err) {
// //     await session.abortTransaction();
// //     console.error("rejectCancellation error:", err);
// //     return res.status(500).json({ success: false, message: err.message });
// //   } finally {
// //     session.endSession();
// //   }
// // };
// // //REJECTING CANCELLATION IN DASHBOARD SO THAT USER END WILL GET UPDATED
// // const bookingRelease = async (req, res) => {
// //   try {
// //     const { tnr, travellerIds = [] } = req.body;

// //     // 1. Validate input
// //     if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Valid 6-character TNR is required",
// //       });
// //     }

// //     if (!Array.isArray(travellerIds) || travellerIds.length === 0) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "travellerIds[] array is required and cannot be empty",
// //       });
// //     }

// //     // Normalize TNR (uppercase, trim)
// //     const normalizedTnr = tnr.trim().toUpperCase();

// //     // 2. Fetch booking by TNR
// //     const booking = await tourBookingModel.findOne({ tnr: normalizedTnr });
// //     if (!booking) {
// //       return res.status(404).json({
// //         success: false,
// //         message: `Booking with TNR ${normalizedTnr} not found`,
// //       });
// //     }

// //     const releasedTravellers = [];
// //     const notFoundTravellers = [];
// //     const notEligibleTravellers = [];

// //     const idsSet = new Set(travellerIds.map(String));

// //     // 3. Process travellers
// //     booking.travellers = booking.travellers.map((traveller) => {
// //       const travellerIdStr = String(traveller._id);

// //       if (idsSet.has(travellerIdStr)) {
// //         const { cancelled } = traveller;

// //         // Only release if cancelled by traveller AND NOT by admin
// //         if (cancelled?.byTraveller && !cancelled?.byAdmin) {
// //           traveller.cancelled.byTraveller = false;
// //           traveller.cancelled.releasedAt = new Date();
// //           traveller.cancelled.releasedBy = "admin"; // optional: track who released
// //           releasedTravellers.push(travellerIdStr);
// //         } else {
// //           notEligibleTravellers.push(travellerIdStr);
// //         }
// //       }

// //       return traveller;
// //     });

// //     // 4. Identify any travellerIds that weren't found in this booking
// //     travellerIds.forEach((id) => {
// //       if (!booking.travellers.some((t) => String(t._id) === String(id))) {
// //         notFoundTravellers.push(id);
// //       }
// //     });

// //     // 5. If nothing was released, return detailed failure
// //     if (releasedTravellers.length === 0) {
// //       return res.status(400).json({
// //         success: false,
// //         message:
// //           "No travellers were released. Only traveller-initiated cancellations (not admin-rejected) can be released.",
// //         details: {
// //           notFoundTravellers,
// //           notEligibleTravellers,
// //         },
// //       });
// //     }

// //     // 6. Save updated booking
// //     await booking.save();

// //     // 7. Success response
// //     res.json({
// //       success: true,
// //       message: `Released ${releasedTravellers.length} traveller(s) successfully`,
// //       tnr: normalizedTnr,
// //       releasedTravellers,
// //       notFoundTravellers,
// //       notEligibleTravellers,
// //     });
// //   } catch (error) {
// //     console.error("bookingRelease error:", error);
// //     res.status(500).json({
// //       success: false,
// //       message: error.message || "Server error during release",
// //     });
// //   }
// // };

// // //DANZOR ZONE FUNCTION------DONT TOUCH THIS

// // // const addMissingFieldsToAllBookings = async (req, res) => {
// // //   try {
// // //     const totalBookings = await tourBookingModel.countDocuments();

// // //     // ─── Step 1: Add all missing fields ───────────────────────────────
// // //     const result = await tourBookingModel.updateMany(
// // //       {
// // //         $or: [
// // //           { manageBooking: { $exists: false } },
// // //           { advanceAdminRemarks: { $exists: false } },
// // //           { cancellationRequest: { $exists: false } },
// // //           { cancellationReceipt: { $exists: false } },
// // //           { manageBookingReceipt: { $exists: false } },
// // //           { emergencyContact: { $exists: false } },
// // //           { termsAgreed: { $exists: false } },
// // //           { termsAgreedAt: { $exists: false } },
// // //           { "travellers.seatNumber": { $exists: false } },
// // //           { "travellers.seatLocked": { $exists: false } },
// // //           { "travellers.vehicleId": { $exists: false } },
// // //           { "travellers.vehicleName": { $exists: false } },
// // //           // ✅ NEW — cancellation pool fields
// // //           { gvCancellationPool: { $exists: false } },
// // //           { irctcCancellationPool: { $exists: false } },
// // //         ],
// // //       },
// // //       {
// // //         $set: {
// // //           manageBooking: false,
// // //           advanceAdminRemarks: [],
// // //           cancellationRequest: false,
// // //           cancellationReceipt: false,
// // //           manageBookingReceipt: false,
// // //           emergencyContact: null,
// // //           termsAgreed: false,
// // //           termsAgreedAt: null,
// // //           "travellers.$[].seatNumber": null,
// // //           "travellers.$[].seatLocked": false,
// // //           "travellers.$[].seatLockedAt": null,
// // //           "travellers.$[].vehicleId": null,
// // //           "travellers.$[].vehicleName": null,
// // //         },
// // //       },
// // //     );

// // //     // ─── Step 2: cancellation pool — SEPARATE updateMany ──────────────
// // //     // ✅ Separate ஆ பண்றோம் — already value இருக்கற docs overwrite ஆகாம இருக்கும்
// // //     const poolResult = await tourBookingModel.updateMany(
// // //       {
// // //         $or: [
// // //           { gvCancellationPool: { $exists: false } },
// // //           { irctcCancellationPool: { $exists: false } },
// // //         ],
// // //       },
// // //       {
// // //         $set: {
// // //           gvCancellationPool: 0,
// // //           irctcCancellationPool: 0,
// // //         },
// // //       },
// // //     );

// // //     res.status(200).json({
// // //       success: true,
// // //       message: "Migration completed successfully!",
// // //       data: {
// // //         totalBookings,
// // //         step1: {
// // //           matchedCount: result.matchedCount,
// // //           modifiedCount: result.modifiedCount,
// // //           fieldsEnsured: [
// // //             "manageBooking",
// // //             "advanceAdminRemarks",
// // //             "cancellationRequest",
// // //             "cancellationReceipt",
// // //             "manageBookingReceipt",
// // //             "emergencyContact",
// // //             "termsAgreed",
// // //             "termsAgreedAt",
// // //             "travellers.seatNumber",
// // //             "travellers.seatLocked",
// // //             "travellers.seatLockedAt",
// // //             "travellers.vehicleId",
// // //             "travellers.vehicleName",
// // //           ],
// // //         },
// // //         step2: {
// // //           matchedCount: poolResult.matchedCount,
// // //           modifiedCount: poolResult.modifiedCount,
// // //           fieldsEnsured: [
// // //             "gvCancellationPool → 0 (only missing docs)",
// // //             "irctcCancellationPool → 0 (only missing docs)",
// // //           ],
// // //           note: "Existing cancellation pool values were NOT overwritten ✅",
// // //         },
// // //       },
// // //     });
// // //   } catch (error) {
// // //     console.error("Migration failed:", error);
// // //     res.status(500).json({
// // //       success: false,
// // //       message: "Migration failed",
// // //       error: error.message,
// // //     });
// // //   }
// // // };


// // //MANAGE BOOKING RELATED CONTROLLER GET PENDING APPROVALS
// // const getPendingApprovals = async (req, res) => {
// //   try {
// //     const pendingBookings = await manageBookingModel
// //       .find({
// //         manageBooking: true,
// //         raisedBy: true,
// //       })
// //       .populate({
// //         path: "userId",
// //         select: "name email mobile",
// //       })
// //       .populate({
// //         path: "tourId",
// //         select: "title destination startDate endDate thumbnail",
// //       })
// //       .populate({
// //         path: "bookingId",
// //         select:
// //           "tnr travellers contact bookingType payment receipts bookingDate gvCancellationPool irctcCancellationPool adminRemarks",
// //         populate: {
// //           path: "tourId",
// //           select: "title",
// //         },
// //       })
// //       .sort({ bookingDate: -1 })
// //       .select("-__v")
// //       .lean();

// //     // Ensure travellers in original booking also have _id
// //     pendingBookings.forEach((mb) => {
// //       if (mb.bookingId?.travellers) {
// //         mb.bookingId.travellers = mb.bookingId.travellers.map((t) => ({
// //           ...t,
// //           _id: t._id || new mongoose.Types.ObjectId(), // fallback (should never happen)
// //         }));
// //       }
// //     });

// //     return res.status(200).json({
// //       success: true,
// //       message:
// //         pendingBookings.length > 0
// //           ? "Pending approvals fetched successfully."
// //           : "No pending approvals found.",
// //       count: pendingBookings.length,
// //       data: pendingBookings,
// //     });
// //   } catch (error) {
// //     console.error("Error in getPendingApprovals:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Failed to fetch pending approvals.",
// //       error: error.message,
// //     });
// //   }
// // };

// // //APPROVE THE BOOKING UPDATE REQUEST IN THE MANAGE BOOKING APPROVALS PAGE

// // const approveBookingUpdate = async (req, res) => {
// //   try {
// //     const { bookingId } = req.body;

// //     if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Valid bookingId is required",
// //       });
// //     }

// //     // Step 1: Find pending manageBooking request
// //     const manageBooking = await manageBookingModel
// //       .findOne({ bookingId, approvedBy: false, raisedBy: true })
// //       .lean();

// //     if (!manageBooking) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "No pending update request found for this booking",
// //       });
// //     }

// //     if (manageBooking.approvedBy) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "This update has already been approved",
// //       });
// //     }

// //     // Validate amounts
// //     if (
// //       manageBooking.updatedAdvance === undefined ||
// //       manageBooking.updatedBalance === undefined
// //     ) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "updatedAdvance and updatedBalance are required",
// //       });
// //     }

// //     // Step 2: Prepare update for tourBooking
// //     const updateData = {
// //       $set: {
// //         "payment.advance.amount": manageBooking.updatedAdvance,
// //         "payment.balance.amount": manageBooking.updatedBalance,
// //         travellers: manageBooking.travellers,
// //         contact: manageBooking.contact,
// //         billingAddress: manageBooking.billingAddress,
// //         adminRemarks: manageBooking.adminRemarks || [],
// //         manageBooking: false,
// //         manageBookingReceipt: true,
// //       },
// //     };

// //     // Only if travellers were reduced in this request → reset paid flags + receipt flags
// //     if (manageBooking.travellersReduced === true) {
// //       updateData.$set["payment.advance.paid"] = false;
// //       updateData.$set["payment.advance.paymentVerified"] = false; // optional clean-up
// //       updateData.$set["receipts.advanceReceiptSent"] = false;
// //       updateData.$set["receipts.advanceReceiptSentAt"] = null;
// //     }

// //     // Step 3: Apply update to original booking
// //     const updatedTourBooking = await tourBookingModel.findByIdAndUpdate(
// //       bookingId,
// //       updateData,
// //       { new: true, runValidators: true },
// //     );

// //     if (!updatedTourBooking) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Original booking not found",
// //       });
// //     }

// //     // Step 4: Mark manageBooking as approved
// //     await manageBookingModel.findOneAndUpdate(
// //       { _id: manageBooking._id },
// //       { $set: { approvedBy: true, raisedBy: false, manageBooking: false } },
// //     );

// //     return res.status(200).json({
// //       success: true,
// //       message: "Booking update approved and applied successfully",
// //       data: {
// //         updatedBooking: updatedTourBooking,
// //         approvedRequestId: manageBooking._id,
// //       },
// //     });
// //   } catch (error) {
// //     console.error("Error in approveBookingUpdate:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Internal server error",
// //       error: error.message,
// //     });
// //   }
// // };
// // //REJECT THE BOOKING UPDATE REQUEST IN THE MANAGE BOOKING APPROVALS PAGE
// // const rejectBookingUpdate = async (req, res) => {
// //   try {
// //     const { bookingId, remark } = req.body; // remark is optional

// //     // --- 1. Validate bookingId ---
// //     if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Valid bookingId is required",
// //       });
// //     }

// //     // --- 2. Find the pending manageBooking request ---
// //     const manageBooking = await manageBookingModel
// //       .findOne({
// //         bookingId,
// //         approvedBy: false,
// //         manageBooking: true,
// //       })
// //       .lean();

// //     if (!manageBooking) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "No pending update request found for this booking",
// //       });
// //     }

// //     // --- 3. Prepare update: reject the request ---
// //     const updatePayload = {
// //       $set: {
// //         manageBooking: false,
// //         raisedBy: false,
// //         // Optional: mark as rejected (you can add a field if needed)
// //       },
// //       $push: {
// //         adminRemarks: {
// //           remark: remark || "Update request rejected by admin",
// //           amount: 0,
// //           addedAt: new Date(),
// //         },
// //       },
// //     };

// //     // --- 4. Apply the update ---
// //     const updated = await manageBookingModel.findByIdAndUpdate(
// //       manageBooking._id,
// //       updatePayload,
// //       { new: true, runValidators: true },
// //     );

// //     // --- 5. Success response ---
// //     return res.status(200).json({
// //       success: true,
// //       message: "Booking update request rejected successfully",
// //       data: {
// //         rejectedRequestId: updated._id,
// //         bookingId: updated.bookingId,
// //       },
// //     });
// //   } catch (error) {
// //     console.error("rejectBookingUpdate error:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Internal server error",
// //       error: error.message,
// //     });
// //   }
// // };

// // //GET ALL USERS DATA FOR ALL USERS PAGE
// // const getAllUsers = async (req, res) => {
// //   try {
// //     const users = await userModel
// //       .find({})
// //       .select("name email phone address gender dob image createdAt")
// //       .sort({ createdAt: -1 })
// //       .lean();

// //     // ← ADD: _id timestamp fallback for users without createdAt
// //     const enriched = users.map(u => ({
// //       ...u,
// //       createdAt: u.createdAt || u._id.getTimestamp(),
// //     }));

// //     res.json({
// //       success: true,
// //       total: enriched.length,
// //       users: enriched,
// //     });
// //   } catch (error) {
// //     console.error("Error fetching users:", error);
// //     res.status(500).json({ success: false, message: "Failed to fetch users" });
// //   }
// // };

// // const adminBookingsTour = async (req, res) => {
// //   try {
// //     // Get the tourId from the URL parameter
// //     const tourId = req.params.tourId;

// //     if (!tourId) {
// //       return res
// //         .status(400)
// //         .json({ success: false, message: "Tour ID is missing" });
// //     }

// //     const bookings = await tourBookingModel
// //       .find({ tourId })
// //       .populate({
// //         path: "userId",
// //         model: "user",
// //         select: "-password",
// //       })
// //       .populate({
// //         path: "tourId",
// //         model: "tour",
// //       });

// //     res.json({
// //       success: true,
// //       total: bookings.length,
// //       bookings,
// //     });
// //   } catch (error) {
// //     console.error("Error fetching bookings:", error);
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // };

// // const adminTourList = async (req, res) => {
// //   try {
// //     const tours = await tourModel
// //       .find({})
// //       .sort({
// //         // 1. lastBookingDate year (descending) – newest year first
// //         lastBookingDate: -1,
// //         // 2. same year la irundha createdAt newest first
// //         createdAt: -1,
// //       })
// //       .lean();

// //     res.json({
// //       success: true,
// //       total: tours.length,
// //       tours,
// //     });
// //   } catch (error) {
// //     console.error("Error in tourList:", error);
// //     res.status(500).json({
// //       success: false,
// //       message: "Failed to fetch all tours",
// //       error: error.message,
// //     });
// //   }
// // };

// // //ADMIN ROOM LIST HELPER FUNCTION AND CONTROLLERS

// // // === Helper Functions ===
// // const getBasicTravelerInfo = (t) => ({
// //   title: t.title,
// //   firstName: t.firstName,
// //   lastName: t.lastName,
// //   age: t.age,
// //   gender: t.gender,
// //   sharingType: t.sharingType,
// // });
// // const assignRoomNumbers = (rooms) =>
// //   rooms.map((r, i) => ({ ...r, roomNumber: i + 1 }));

// // const adminAllotRooms = async (req, res) => {
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

// //     // singleRooms.forEach((single) => {
// //     //   const occupant = single.room.occupants[0];
// //     //   const gender = occupant.gender.toLowerCase();
// //     //   const original = occupant.sharingType;
// //     //   if (original === "triple") tripleSingles[gender].push(single);
// //     //   else if (original === "double") doubleSingles[gender].push(single);
// //     // });
// //     singleRooms.forEach((single) => {
// //       const occupant = single.room.occupants[0];
// //       const gender = (occupant.gender || "").toLowerCase();
// //       const original = occupant.sharingType;

// //       if (gender === "male" || gender === "female") {
// //         if (original === "triple") tripleSingles[gender].push(single);
// //         else if (original === "double") doubleSingles[gender].push(single);
// //       } else {
// //         // unknown/missing gender — keep it as its own single room instead of crashing
// //         rawRoomEntries[single.entryIndex].rooms.push(single.room);
// //       }
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

// // //Rejects booking from booking rejection section
// // const bookingRejectAdmin = async (req, res) => {
// //   try {
// //     const { tnr, travellerIds = [] } = req.body;

// //     // Validate input
// //     if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Valid 6-character TNR is required",
// //       });
// //     }

// //     if (!Array.isArray(travellerIds) || travellerIds.length === 0) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "travellerIds[] array is required and cannot be empty",
// //       });
// //     }

// //     const normalizedTnr = tnr.trim().toUpperCase();

// //     // Fetch booking by TNR
// //     const booking = await tourBookingModel.findOne({ tnr: normalizedTnr });
// //     if (!booking) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Booking not found with this TNR",
// //       });
// //     }

// //     // Extract balance prices
// //     const balanceDouble = Number(booking.tourData?.balanceDouble) || 0;
// //     const balanceTriple = Number(booking.tourData?.balanceTriple) || 0;

// //     // Payment status (used for deduction logic only)
// //     const advancePaid =
// //       booking.payment.advance.paid && booking.payment.advance.paymentVerified;
// //     const balancePaid =
// //       booking.payment.balance.paid && booking.payment.balance.paymentVerified;

// //     // Normalize traveller IDs
// //     const idsSet = new Set(travellerIds.map(String));

// //     // Check for travellers that block rejection
// //     const cancelledByTraveller = [];
// //     const alreadyRejectedTravellers = [];
// //     const missingTravellers = [];

// //     travellerIds.forEach((id) => {
// //       const traveller = booking.travellers.find(
// //         (t) => String(t._id) === String(id),
// //       );
// //       if (!traveller) {
// //         missingTravellers.push(id);
// //       } else if (traveller.cancelled.byTraveller) {
// //         cancelledByTraveller.push(id);
// //       } else if (traveller.cancelled.byAdmin) {
// //         alreadyRejectedTravellers.push(id);
// //       }
// //     });

// //     // Strict mode: Block if any blocking conditions exist
// //     if (
// //       cancelledByTraveller.length > 0 ||
// //       alreadyRejectedTravellers.length === travellerIds.length ||
// //       missingTravellers.length === travellerIds.length
// //     ) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Rejection not allowed due to invalid traveller state.",
// //         cancelledByTraveller,
// //         alreadyRejected: alreadyRejectedTravellers,
// //         missingTravellers,
// //       });
// //     }

// //     // Proceed with valid travellers
// //     let totalDeduction = 0;
// //     const rejectedTravellers = [];

// //     booking.travellers = booking.travellers.map((traveller) => {
// //       const travellerIdStr = String(traveller._id);

// //       if (idsSet.has(travellerIdStr)) {
// //         traveller.cancelled.byAdmin = true;
// //         traveller.cancelled.cancelledAt = new Date();

// //         rejectedTravellers.push(traveller);

// //         // Deduct only if advance paid AND balance not paid
// //         if (advancePaid && !balancePaid) {
// //           if (traveller.sharingType === "double") {
// //             totalDeduction += balanceDouble;
// //           } else if (traveller.sharingType === "triple") {
// //             totalDeduction += balanceTriple;
// //           }
// //         }
// //       }

// //       return traveller;
// //     });

// //     // Update balance only if deduction is applicable
// //     if (totalDeduction > 0) {
// //       booking.payment.balance.amount = Math.max(
// //         booking.payment.balance.amount - totalDeduction,
// //         0,
// //       );
// //     }

// //     await booking.save();

// //     res.json({
// //       success: true,
// //       message: "Traveller(s) rejected successfully",
// //       updatedBalance: booking.payment.balance.amount,
// //       rejectedTravellers: rejectedTravellers.map((t) => String(t._id)),
// //       tnr: normalizedTnr,
// //     });
// //   } catch (error) {
// //     console.error("bookingRejectAdmin error:", error);
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // };
// // // Add this new function

// // const deleteBookingByTNR = async (req, res) => {
// //   try {
// //     const { tnr } = req.body;

// //     if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Valid 6-character TNR is required",
// //       });
// //     }

// //     const normalizedTNR = tnr.trim().toUpperCase();

// //     const booking = await tourBookingModel.findOne({ tnr: normalizedTNR });

// //     if (!booking) {
// //       return res.status(404).json({
// //         success: false,
// //         message: `No booking found with TNR ${normalizedTNR}`,
// //       });
// //     }

// //     // Optional: Prevent deletion if already paid / completed / etc.
// //     if (booking.payment?.balance?.paid) {
// //       return res.status(403).json({
// //         success: false,
// //         message:
// //           "Cannot delete this booking — balance payment has already been made.",
// //       });
// //     }

// //     if (booking.isBookingCompleted) {
// //       return res.status(403).json({
// //         success: false,
// //         message: "Cannot delete completed bookings.",
// //       });
// //     }

// //     // Actually delete
// //     await tourBookingModel.deleteOne({ tnr: normalizedTNR });

// //     return res.json({
// //       success: true,
// //       message: `Booking with TNR ${normalizedTNR} has been permanently deleted.`,
// //       deletedTNR: normalizedTNR,
// //     });
// //   } catch (error) {
// //     console.error("deleteBookingByTNR error:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Server error while deleting booking",
// //       error: error.message,
// //     });
// //   }
// // };

// // const addTermsPoints = async (req, res) => {
// //   try {
// //     const { points } = req.body;

// //     // Basic input validation
// //     if (!points || !Array.isArray(points) || points.length === 0) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Please send an array of points (at least one item required)",
// //       });
// //     }

// //     // Find or create the current active terms document
// //     let termsDoc = await Terms.findOne({ isCurrent: true });

// //     if (!termsDoc) {
// //       // First time → create initial document
// //       termsDoc = new Terms({
// //         version: "1.0",
// //         effectiveFrom: new Date(),
// //         isCurrent: true,
// //         points: [],
// //         // lastUpdatedBy: req.user?._id || null,   ← removed / commented
// //         changeSummary: "Initial Terms & Conditions created (first time)",
// //       });
// //     }

// //     // Calculate next order number
// //     let nextOrder = 1;
// //     if (termsDoc.points.length > 0) {
// //       const orders = termsDoc.points.map((p) => p.order || 0);
// //       nextOrder = Math.max(...orders) + 1;
// //     }

// //     // Prepare and validate new points
// //     const newPoints = [];

// //     for (let i = 0; i < points.length; i++) {
// //       const input = points[i];

// //       let text = "";
// //       let internalNote = "";

// //       if (typeof input === "string") {
// //         text = input.trim();
// //       } else if (typeof input === "object" && input !== null) {
// //         text = (input.text || "").trim();
// //         internalNote = (input.internalNote || "").trim();
// //       }

// //       if (!text || text.length < 10) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Point #${i + 1} is invalid: text must be at least 10 characters`,
// //         });
// //       }

// //       newPoints.push({
// //         order: nextOrder + i,
// //         text,
// //         active: true,
// //         internalNote,
// //         createdAt: new Date(),
// //       });
// //     }

// //     // Append new points
// //     termsDoc.points.push(...newPoints);

// //     // Update metadata — removed dependency on req.user
// //     // termsDoc.lastUpdatedBy = req.user?._id || null;   ← commented out
// //     termsDoc.lastUpdatedAt = new Date();
// //     termsDoc.changeSummary = `Added ${newPoints.length} new point(s) - ${new Date().toISOString().split("T")[0]} (admin action)`;

// //     // Save
// //     await termsDoc.save();

// //     // Prepare clean response (only active & sorted points)
// //     const activeSortedPoints = termsDoc.points
// //       .filter((p) => p.active === true)
// //       .sort((a, b) => a.order - b.order)
// //       .map((p) => ({
// //         order: p.order,
// //         text: p.text,
// //         // internalNote is intentionally NOT sent to frontend
// //       }));

// //     return res.status(200).json({
// //       success: true,
// //       message: `Successfully added ${newPoints.length} point(s)`,
// //       data: {
// //         version: termsDoc.version,
// //         effectiveFrom: termsDoc.effectiveFrom,
// //         totalActivePoints: activeSortedPoints.length,
// //         points: activeSortedPoints,
// //       },
// //     });
// //   } catch (error) {
// //     console.error("addTermsPoints error:", error);

// //     return res.status(500).json({
// //       success: false,
// //       message: "Failed to add terms points",
// //       error: error.message,
// //     });
// //   }
// // };

// // const deleteTermsPoint = async (req, res) => {
// //   try {
// //     const { pointId } = req.params;

// //     if (!mongoose.Types.ObjectId.isValid(pointId)) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Invalid point ID format",
// //       });
// //     }

// //     // Find current active terms document
// //     const termsDoc = await Terms.findOne({ isCurrent: true });

// //     if (!termsDoc) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "No active terms document found",
// //       });
// //     }

// //     // Find the point by its _id
// //     const point = termsDoc.points.id(pointId);

// //     if (!point) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Point not found in current terms",
// //       });
// //     }

// //     // Deactivate instead of pull/remove (preserves history)
// //     point.active = false;
// //     point.updatedAt = new Date();

// //     // Update metadata
// //     termsDoc.lastUpdatedAt = new Date();
// //     termsDoc.changeSummary = `Deactivated point #${point.order} - ${new Date().toISOString().split("T")[0]}`;
// //     // termsDoc.lastUpdatedBy = req.user._id;  // uncomment when auth is fixed

// //     await termsDoc.save();

// //     // Prepare clean response (active points only)
// //     const activeSortedPoints = termsDoc.points
// //       .filter((p) => p.active === true)
// //       .sort((a, b) => a.order - b.order)
// //       .map((p) => ({
// //         order: p.order,
// //         text: p.text,
// //       }));

// //     return res.status(200).json({
// //       success: true,
// //       message: `Point #${point.order} deactivated successfully`,
// //       data: {
// //         version: termsDoc.version,
// //         totalActivePoints: activeSortedPoints.length,
// //         points: activeSortedPoints,
// //       },
// //     });
// //   } catch (error) {
// //     console.error("deleteTermsPoint error:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Failed to deactivate terms point",
// //       error: error.message,
// //     });
// //   }
// // };

// // // controllers/tourAdminController.js (or termsController.js)

// // // Import your Terms model (adjust path if needed)

// // const getCurrentTerms = async (req, res) => {
// //   try {
// //     // Find the current active version
// //     const termsDoc = await Terms.findOne({ isCurrent: true })
// //       .select("version effectiveFrom points") // only needed fields
// //       .lean(); // faster, plain JS object

// //     if (!termsDoc) {
// //       return res.status(200).json({
// //         success: true,
// //         message: "No terms & conditions defined yet",
// //         data: {
// //           version: "N/A",
// //           effectiveFrom: null,
// //           points: [],
// //         },
// //       });
// //     }

// //     // Filter active points and sort by order
// //     const activePoints = termsDoc.points
// //       .filter((p) => p.active === true)
// //       .sort((a, b) => a.order - b.order)
// //       .map((p) => ({
// //         _id: p._id.toString(),
// //         order: p.order,
// //         text: p.text,
// //       }));

// //     return res.status(200).json({
// //       success: true,
// //       message: "Current terms & conditions fetched",
// //       data: {
// //         version: termsDoc.version,
// //         effectiveFrom: termsDoc.effectiveFrom,
// //         totalActivePoints: activePoints.length,
// //         points: activePoints,
// //       },
// //     });
// //   } catch (error) {
// //     console.error("getCurrentTerms error:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Failed to fetch terms & conditions",
// //       error: error.message,
// //     });
// //   }
// // };

// // const submitTermsAgreement = async (req, res) => {
// //   try {
// //     const { tnr } = req.params;
// //     const { emergencyContact, termsAgreed } = req.body;

// //     // Validation
// //     if (!tnr || tnr.length !== 6 || !/^[A-Z0-9]{6}$/.test(tnr)) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Invalid TNR format",
// //       });
// //     }

// //     if (
// //       !emergencyContact ||
// //       !/^[\d+\-\s()]{7,25}$/.test(emergencyContact.trim())
// //     ) {
// //       return res.status(400).json({
// //         success: false,
// //         message:
// //           "Please enter a valid emergency contact number (7–25 characters: digits, +, -, spaces, parentheses allowed)",
// //       });
// //     }

// //     if (!termsAgreed) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "You must agree to the terms and conditions",
// //       });
// //     }

// //     // Find booking by TNR
// //     const booking = await tourBookingModel.findOne({ tnr: tnr.toUpperCase() });

// //     if (!booking) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Booking not found with this TNR",
// //       });
// //     }

// //     // Check if already agreed
// //     if (booking.termsAgreed) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Terms already agreed for this booking",
// //       });
// //     }

// //     // Update booking
// //     booking.emergencyContact = emergencyContact;
// //     booking.termsAgreed = true;
// //     booking.termsAgreedAt = new Date();

// //     await booking.save();

// //     return res.status(200).json({
// //       success: true,
// //       message: "Terms agreed successfully. Thank you!",
// //       data: {
// //         tnr: booking.tnr,
// //         emergencyContact: booking.emergencyContact,
// //         termsAgreed: booking.termsAgreed,
// //         termsAgreedAt: booking.termsAgreedAt,
// //       },
// //     });
// //   } catch (error) {
// //     console.error("submitTermsAgreement error:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Failed to submit terms agreement",
// //       error: error.message,
// //     });
// //   }
// // };
// // const getBookingSummaryByTNR = async (req, res) => {
// //   try {
// //     const { tnr } = req.params;

// //     const booking = await tourBookingModel
// //       .findOne({ tnr: tnr.toUpperCase() })
// //       .select(
// //         "tnr tourData.title travellers emergencyContact termsAgreed termsAgreedAt",
// //       )
// //       .lean();

// //     if (!booking) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Booking not found",
// //       });
// //     }

// //     const travellers = booking.travellers || [];

// //     // Gender counts
// //     const males = travellers.filter(
// //       (t) => t.gender?.toLowerCase() === "male",
// //     ).length;

// //     const females = travellers.filter(
// //       (t) => t.gender?.toLowerCase() === "female",
// //     ).length;

// //     // Child detection (age < 12)
// //     const children = travellers.filter((t) => t.age < 12);

// //     const childrenWithBerth = children.filter(
// //       (t) => t.sharingType === "withBerth",
// //     ).length;

// //     const childrenWithoutBerth = children.filter(
// //       (t) => t.sharingType === "withoutBerth",
// //     ).length;

// //     return res.status(200).json({
// //       success: true,
// //       data: {
// //         tnr: booking.tnr,
// //         tourTitle: booking.tourData?.title || "N/A",
// //         totalTravellers: travellers.length,
// //         males,
// //         females,
// //         children: {
// //           total: children.length,
// //           withBerth: childrenWithBerth,
// //           withoutBerth: childrenWithoutBerth,
// //         },
// //         // Return full travellers array so frontend can show names
// //         travellers: travellers.map((t) => ({
// //           firstName: t.firstName || "",
// //           lastName: t.lastName || "",
// //           title: t.title || "",
// //           age: t.age,
// //           gender: t.gender,
// //           sharingType: t.sharingType,
// //         })),
// //         emergencyContact: booking.emergencyContact || null,
// //         termsAgreed: booking.termsAgreed || false,
// //         termsAgreedAt: booking.termsAgreedAt || null,
// //       },
// //     });
// //   } catch (err) {
// //     console.error("getBookingSummaryByTNR error:", err);
// //     res.status(500).json({
// //       success: false,
// //       message: "Server error",
// //       error: err.message,
// //     });
// //   }
// // };
// // //SAM related controllers
// // const adminCreateTourVehicle = async (req, res) => {
// //   try {
// //     const { tourId } = req.params;
// //     const {
// //       vehicleName,
// //       registrationNumber,
// //       leaderRow = [], // frontend sends dynamic array
// //       passengerRows = [],
// //       allowSeatSelection = false,
// //     } = req.body;

// //     if (!vehicleName?.trim()) {
// //       return res
// //         .status(400)
// //         .json({ success: false, message: "Vehicle name is required" });
// //     }

// //     // Validate leaderRow only if provided
// //     if (leaderRow.length > 0) {
// //       if (
// //         !Array.isArray(leaderRow) ||
// //         leaderRow.length < 1 ||
// //         leaderRow.length > 5
// //       ) {
// //         return res.status(400).json({
// //           success: false,
// //           message: "leaderRow must have between 1 and 5 seats (or omit it)",
// //         });
// //       }
// //       if (
// //         !leaderRow.every((s) => typeof s === "string" && s.startsWith("LS"))
// //       ) {
// //         return res.status(400).json({
// //           success: false,
// //           message: "Each leader seat label must start with 'LS'",
// //         });
// //       }
// //     }

// //     const vehicleData = {
// //       tourId,
// //       vehicleName: vehicleName.trim(),
// //       registrationNumber: registrationNumber?.trim() || undefined,
// //       leaderRow: leaderRow.length > 0 ? leaderRow : undefined, // let pre-save hook handle default
// //       passengerRows,
// //       allowSeatSelection,
// //     };

// //     const vehicle = new TourVehicle(vehicleData);
// //     await vehicle.save();

// //     // Return full object including virtual seatLayout
// //     return res.status(201).json({
// //       success: true,
// //       message: "Tour vehicle created",
// //       vehicle: vehicle.toObject({ virtuals: true }), // includes seatLayout
// //     });
// //   } catch (err) {
// //     console.error(err);
// //     if (err.name === "ValidationError") {
// //       return res.status(400).json({ success: false, message: err.message });
// //     }
// //     return res
// //       .status(500)
// //       .json({ success: false, message: "Server error", error: err.message });
// //   }
// // };
// // const adminUpdateTourVehicle = async (req, res) => {
// //   try {
// //     const { tourId, vehicleId } = req.params;

// //     if (
// //       !mongoose.Types.ObjectId.isValid(vehicleId) ||
// //       !mongoose.Types.ObjectId.isValid(tourId)
// //     ) {
// //       return res
// //         .status(400)
// //         .json({ success: false, message: "Invalid ID format" });
// //     }

// //     const updateData = {};

// //     if (req.body.vehicleName?.trim()) {
// //       updateData.vehicleName = req.body.vehicleName.trim();
// //     }
// //     if (req.body.registrationNumber !== undefined) {
// //       updateData.registrationNumber =
// //         req.body.registrationNumber?.trim() || null;
// //     }
// //     if (req.body.leaderRow) {
// //       if (
// //         !Array.isArray(req.body.leaderRow) ||
// //         req.body.leaderRow.length < 1 ||
// //         req.body.leaderRow.length > 5
// //       ) {
// //         return res.status(400).json({
// //           success: false,
// //           message: "leaderRow must have between 1 and 5 seats",
// //         });
// //       }
// //       if (
// //         !req.body.leaderRow.every(
// //           (s) => typeof s === "string" && s.startsWith("LS"),
// //         )
// //       ) {
// //         return res.status(400).json({
// //           success: false,
// //           message: "Each leader seat label must start with 'LS'",
// //         });
// //       }
// //       updateData.leaderRow = req.body.leaderRow;
// //     }
// //     if (req.body.passengerRows) {
// //       if (
// //         !Array.isArray(req.body.passengerRows) ||
// //         req.body.passengerRows.length === 0
// //       ) {
// //         return res.status(400).json({
// //           success: false,
// //           message: "passengerRows must be non-empty array",
// //         });
// //       }
// //       updateData.passengerRows = req.body.passengerRows;

// //       // ── Recalculate computed fields manually (pre-save doesn't run on findOneAndUpdate) ──
// //       const passengerCount = updateData.passengerRows.length;
// //       const seatsPerRow =
// //         passengerCount > 0 ? updateData.passengerRows[0].length : 0;

// //       updateData.seatsPerRow = seatsPerRow;
// //       updateData.passengerRowCount = passengerCount;
// //       updateData.totalSeats = seatsPerRow * passengerCount; // only C + D seats, LS excluded
// //     }
// //     if (typeof req.body.allowSeatSelection === "boolean") {
// //       updateData.allowSeatSelection = req.body.allowSeatSelection;
// //     }

// //     if (Object.keys(updateData).length === 0) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "No valid fields provided for update",
// //       });
// //     }

// //     const updated = await TourVehicle.findOneAndUpdate(
// //       { _id: vehicleId, tourId },
// //       { $set: updateData },
// //       { new: true, runValidators: true },
// //     );

// //     if (!updated) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Vehicle not found or does not belong to this tour",
// //       });
// //     }

// //     // Use toObject with virtuals — lean() strips them
// //     return res.json({
// //       success: true,
// //       message: "Vehicle updated successfully",
// //       vehicle: updated.toObject({ virtuals: true }),
// //     });
// //   } catch (err) {
// //     console.error(err);
// //     if (err.name === "ValidationError") {
// //       return res.status(400).json({ success: false, message: err.message });
// //     }
// //     return res
// //       .status(500)
// //       .json({ success: false, message: "Server error", error: err.message });
// //   }
// // };

// // const adminToggleVehicleSeatSelection = async (req, res) => {
// //   try {
// //     const { tourId, vehicleId } = req.params;
// //     const { allowSeatSelection } = req.body;

// //     if (typeof allowSeatSelection !== "boolean") {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Field "allowSeatSelection" must be boolean',
// //       });
// //     }

// //     const vehicle = await TourVehicle.findOneAndUpdate(
// //       { _id: vehicleId, tourId },
// //       { $set: { allowSeatSelection } },
// //       { new: true, runValidators: true },
// //     );

// //     if (!vehicle) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Vehicle not found or does not belong to this tour",
// //       });
// //     }

// //     return res.json({
// //       success: true,
// //       message: `Seat selection ${allowSeatSelection ? "enabled" : "disabled"} successfully`,
// //       vehicle,
// //     });
// //   } catch (err) {
// //     console.error(err);
// //     return res
// //       .status(500)
// //       .json({ success: false, message: "Server error", error: err.message });
// //   }
// // };

// // const adminGetTourVehicles = async (req, res) => {
// //   try {
// //     const { tourId } = req.params;

// //     if (!mongoose.Types.ObjectId.isValid(tourId)) {
// //       return res
// //         .status(400)
// //         .json({ success: false, message: "Invalid tour ID" });
// //     }

// //     const vehicles = await TourVehicle.find({ tourId })
// //       .select(
// //         "vehicleName registrationNumber totalSeats leaderRow passengerRows passengerRowCount seatsPerRow allowSeatSelection bookedSeats createdAt",
// //       )
// //       .sort({ createdAt: 1 })
// //       .lean();

// //     const enriched = vehicles.map((v) => ({
// //       ...v,
// //       bookedSeatsCount: v.bookedSeats?.length || 0,
// //       bookedSeatNumbers:
// //         v.bookedSeats?.map((bs) => bs.seatNumber).filter(Boolean) || [], // ← This is what makes seat numbers visible
// //     }));

// //     return res.json({
// //       success: true,
// //       count: enriched.length,
// //       vehicles: enriched,
// //     });
// //   } catch (err) {
// //     console.error(err);
// //     return res.status(500).json({ success: false, message: "Server error" });
// //   }
// // };
// // const adminDeleteTourVehicle = async (req, res) => {
// //   const session = await mongoose.startSession();
// //   session.startTransaction();

// //   try {
// //     const { tourId, vehicleId } = req.params;

// //     if (
// //       !mongoose.Types.ObjectId.isValid(vehicleId) ||
// //       !mongoose.Types.ObjectId.isValid(tourId)
// //     ) {
// //       return res
// //         .status(400)
// //         .json({ success: false, message: "Invalid ID format" });
// //     }

// //     // 1. Find the vehicle
// //     const vehicle = await TourVehicle.findOne({
// //       _id: vehicleId,
// //       tourId,
// //     }).session(session);

// //     if (!vehicle) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Vehicle not found or does not belong to this tour",
// //       });
// //     }

// //     // 2. Optional: Warn/log if there are booked seats
// //     const bookedCount = vehicle.bookedSeats?.length || 0;
// //     if (bookedCount > 0) {
// //       console.warn(
// //         `Deleting vehicle ${vehicleId} with ${bookedCount} booked seats`,
// //       );
// //       // You can still proceed, or add force param later if needed
// //     }

// //     // 3. Collect all bookings that have seats on this vehicle
// //     const bookingIds = vehicle.bookedSeats.map((bs) => bs.bookingId);

// //     if (bookingIds.length > 0) {
// //       // 4. Clear seat info from all affected bookings
// //       await tourBookingModel.updateMany(
// //         { _id: { $in: bookingIds } },
// //         {
// //           $set: {
// //             "travellers.$[elem].seatNumber": null,
// //             "travellers.$[elem].seatLocked": false,
// //             "travellers.$[elem].seatLockedAt": null,
// //           },
// //         },
// //         {
// //           arrayFilters: [
// //             {
// //               "elem.seatNumber": {
// //                 $in: vehicle.bookedSeats.map((bs) => bs.seatNumber),
// //               },
// //             },
// //           ],
// //           session,
// //         },
// //       );
// //     }

// //     // 5. Delete the vehicle
// //     await TourVehicle.deleteOne({ _id: vehicleId, tourId }).session(session);

// //     await session.commitTransaction();

// //     return res.json({
// //       success: true,
// //       message: "Vehicle deleted successfully",
// //       affectedBookings: bookingIds.length,
// //       bookedSeatsCleared: bookedCount,
// //     });
// //   } catch (err) {
// //     await session.abortTransaction();
// //     console.error("deleteTourVehicle error:", err);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Server error during vehicle deletion",
// //       error: err.message,
// //     });
// //   } finally {
// //     session.endSession();
// //   }
// // };

// // const getAllPaymentMethods = async (req, res) => {
// //   try {
// //     const methods = await PaymentMethod.find({})
// //       .sort({ type: 1, createdAt: -1 })
// //       .lean();

// //     // Enrich response (optional fields + isActive flag)
// //     const enriched = methods.map((m) => ({
// //       ...m,
// //       isActive: true, // you can add real logic later (e.g., based on date or flag)
// //       qrImage: m.qrImage || null,
// //     }));

// //     return res.status(200).json({
// //       success: true,
// //       count: enriched.length,
// //       paymentMethods: enriched,
// //     });
// //   } catch (error) {
// //     console.error("getAllPaymentMethods error:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Failed to fetch payment methods",
// //       error: error.message,
// //     });
// //   }
// // };
// // const adminFetchTourVehicleSeatOverview = async (req, res) => {
// //   try {
// //     const { tourId } = req.params;

// //     if (!mongoose.isValidObjectId(tourId)) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Invalid tour ID format",
// //       });
// //     }

// //     // 1. Fetch relevant bookings
// //     const bookings = await tourBookingModel
// //       .find({
// //         tourId: new mongoose.Types.ObjectId(tourId),
// //       })
// //       .select(
// //         "tnr " +
// //         "travellers.firstName travellers.lastName " +
// //         "travellers.vehicleId travellers.vehicleName " +
// //         "travellers.seatNumber travellers.seatLocked " +
// //         "travellers.cancelled",
// //       )
// //       .lean();

// //     if (!bookings || bookings.length === 0) {
// //       return res.json({
// //         success: true,
// //         tourId,
// //         totalBookings: 0,
// //         totalTravellers: 0,
// //         vehicles: [],
// //         message: "No bookings found for this tour",
// //       });
// //     }

// //     // 2. Collect vehicle IDs only from travellers with seat + not cancelled
// //     const vehicleIds = new Set();
// //     bookings.forEach((booking) => {
// //       booking.travellers?.forEach((traveller) => {
// //         const hasSeat =
// //           traveller.seatNumber && String(traveller.seatNumber).trim() !== "";
// //         if (
// //           !traveller.cancelled?.byAdmin &&
// //           !traveller.cancelled?.byTraveller &&
// //           hasSeat &&
// //           traveller.vehicleId
// //         ) {
// //           vehicleIds.add(traveller.vehicleId.toString());
// //         }
// //       });
// //     });

// //     // 3. Load only relevant vehicles – FIXED fields to match schema (vehicleName + totalSeats)
// //     const vehicles = await TourVehicle.find({
// //       _id: {
// //         $in: [...vehicleIds].map((id) => new mongoose.Types.ObjectId(id)),
// //       },
// //     })
// //       .select("vehicleName totalSeats") // ← Changed to match schema
// //       .lean();

// //     const vehicleMap = new Map();
// //     vehicles.forEach((vehicle) => {
// //       const idStr = vehicle._id.toString();
// //       vehicleMap.set(idStr, {
// //         vehicleId: idStr,
// //         vehicleName: vehicle.vehicleName || "Unnamed Vehicle",
// //         capacity: Number(vehicle.totalSeats) || 0, // ← Use totalSeats from schema
// //         bookedSeats: 0,
// //         remainingSeats: 0,
// //         travellers: [],
// //       });
// //     });

// //     // 4. Process only travellers with seatNumber
// //     const unassigned = {
// //       vehicleName: "Not Assigned",
// //       vehicleId: null,
// //       capacity: null,
// //       bookedSeats: 0,
// //       remainingSeats: null,
// //       travellers: [],
// //     };

// //     let totalTravellersCount = 0;

// //     bookings.forEach((booking) => {
// //       booking.travellers?.forEach((traveller) => {
// //         // Skip if:
// //         // - cancelled, or
// //         // - no seat number assigned
// //         const hasSeat =
// //           traveller.seatNumber && String(traveller.seatNumber).trim() !== "";
// //         if (
// //           traveller.cancelled?.byAdmin ||
// //           traveller.cancelled?.byTraveller ||
// //           !hasSeat
// //         ) {
// //           return;
// //         }

// //         totalTravellersCount++;

// //         const travellerData = {
// //           tnr: booking.tnr || "(no TNR)",
// //           name:
// //             [traveller.firstName, traveller.lastName]
// //               .filter(Boolean)
// //               .join(" ")
// //               .trim() || "(no name)",
// //           seat: traveller.seatNumber || "—", // already checked above
// //           locked: traveller.seatLocked === true ? "Yes" : "No",
// //         };

// //         if (traveller.vehicleId) {
// //           const vid = traveller.vehicleId.toString();
// //           const veh = vehicleMap.get(vid);

// //           if (veh) {
// //             veh.travellers.push(travellerData);
// //             veh.bookedSeats += 1;
// //           } else {
// //             // orphaned vehicle reference → treat as unassigned
// //             unassigned.travellers.push(travellerData);
// //             unassigned.bookedSeats += 1;
// //           }
// //         } else {
// //           unassigned.travellers.push(travellerData);
// //           unassigned.bookedSeats += 1;
// //         }
// //       });
// //     });

// //     // 5. Prepare final list
// //     const resultVehicles = [...vehicleMap.values()];

// //     // Sort vehicles by name
// //     resultVehicles.sort((a, b) => a.vehicleName.localeCompare(b.vehicleName));

// //     // Unassigned at the end (only if has booked travellers)
// //     if (unassigned.travellers.length > 0) {
// //       resultVehicles.push(unassigned);
// //     }

// //     // 6. Calculate remaining seats
// //     resultVehicles.forEach((v) => {
// //       if (v.capacity !== null && typeof v.capacity === "number") {
// //         v.remainingSeats = Math.max(0, v.capacity - v.bookedSeats);
// //       }
// //     });

// //     return res.json({
// //       success: true,
// //       tourId,
// //       totalBookings: bookings.length,
// //       totalTravellers: totalTravellersCount, // ← only seated travellers
// //       vehicles: resultVehicles,
// //     });
// //   } catch (error) {
// //     console.error("getTourVehicleSeatOverview error:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Error fetching vehicle & seat allocation overview",
// //       error: error.message,
// //     });
// //   }
// // };

// // // ════════════════════════════════════════════════════════════════
// // //  ANALYTICS — replace existing analytics section in touradminController.js
// // //
// // //  RANGE FILTER SUPPORT ADDED:
// // //  - year / month        -> existing single-value filters (unchanged behaviour)
// // //  - fromYear / toYear    -> year RANGE (e.g. 2025–2029), inclusive both ends
// // //  - fromMonth / toMonth  -> month RANGE (e.g. Jan–Jun = 1–6), inclusive,
// // //                            applied INDEPENDENTLY within each matched year
// // //                            (NOT a single cross-year date span)
// // //
// // //  Combining rules (confirmed):
// // //  - year range + month range are independent AND filters.
// // //    e.g. fromYear=2025&toYear=2029&fromMonth=1&toMonth=6 means:
// // //    "tours whose departure falls in Jan–Jun of ANY year from 2025–2029"
// // //  - If both single (year/month) AND range (fromYear.../fromMonth...) params
// // //    are sent, range params take priority (single values are legacy/back-compat).
// // //
// // //  ── TRAVELLER STATUS DEFINITIONS (confirmed, single source of truth) ──
// // //  Active            = payment.advance.paid = true  AND byAdmin ≠ true AND byTraveller ≠ true
// // //  Unverified        = payment.advance.paid ≠ true  AND byAdmin ≠ true
// // //                       (an unpaid traveller who was separately
// // //                       rejected/cancelled by admin shows up as
// // //                       Rejected/Cancelled, NOT Unverified)
// // //  Cancellation req. = payment.advance.paid = true  AND byTraveller = true AND byAdmin ≠ true
// // //  Cancelled         = byAdmin = true AND byTraveller = true
// // //  Rejected          = byAdmin = true AND byTraveller ≠ true
// // //
// // //  These 5 sets are mutually exclusive and collectively exhaustive over all
// // //  travellers in a booking — every traveller falls into exactly one bucket:
// // //    - byAdmin = true  -> Cancelled or Rejected (split by byTraveller)
// // //    - byAdmin ≠ true, advance.paid = true, byTraveller = true  -> Cancellation request
// // //    - byAdmin ≠ true, advance.paid = true, byTraveller ≠ true  -> Active
// // //    - byAdmin ≠ true, advance.paid ≠ true                      -> Unverified
// // // ════════════════════════════════════════════════════════════════

// // // ─── Helper: tour departure date filter (single OR range) ──────────────
// // function buildTourDateQuery({ year, month, fromYear, toYear, fromMonth, toMonth }) {
// //   const q = {};
// //   const exprClauses = [];

// //   const hasYearRange = fromYear || toYear;
// //   const hasMonthRange = fromMonth || toMonth;

// //   if (hasYearRange) {
// //     const fy = fromYear ? parseInt(fromYear) : null;
// //     const ty = toYear ? parseInt(toYear) : null;
// //     const yearExpr = { $year: "$lastBookingDate" };
// //     if (fy !== null) exprClauses.push({ $gte: [yearExpr, fy] });
// //     if (ty !== null) exprClauses.push({ $lte: [yearExpr, ty] });
// //   }

// //   if (hasMonthRange) {
// //     const fm = fromMonth ? parseInt(fromMonth) : 1;
// //     const tm = toMonth ? parseInt(toMonth) : 12;
// //     const monthExpr = { $month: "$lastBookingDate" };
// //     if (fm <= tm) {
// //       // Normal range within a year, e.g. Jan(1)–Jun(6)
// //       exprClauses.push({ $gte: [monthExpr, fm] });
// //       exprClauses.push({ $lte: [monthExpr, tm] });
// //     } else {
// //       // Wrap-around range, e.g. Nov(11)–Feb(2) -> month >= 11 OR month <= 2
// //       exprClauses.push({ $or: [{ $gte: [monthExpr, fm] }, { $lte: [monthExpr, tm] }] });
// //     }
// //   }

// //   if (exprClauses.length) {
// //     q.$expr = exprClauses.length === 1 ? exprClauses[0] : { $and: exprClauses };
// //     return q;
// //   }

// //   // ── Legacy single year/month (back-compat, used when no range params sent) ──
// //   if (year && month) {
// //     const y = parseInt(year), m = parseInt(month);
// //     q.lastBookingDate = { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) };
// //   } else if (year) {
// //     const y = parseInt(year);
// //     q.lastBookingDate = { $gte: new Date(`${y}-01-01`), $lt: new Date(`${y + 1}-01-01`) };
// //   } else if (month) {
// //     q.$expr = { $eq: [{ $month: "$lastBookingDate" }, parseInt(month)] };
// //   }
// //   return q;
// // }


// // // ════════════════════════════════════════════════════════════════
// // //  Updated helper functions for tour list table
// // //  Replace in touradminController.js
// // // ════════════════════════════════════════════════════════════════

// // // ─── Helper: booking stats per tourId ────────────────────────
// // async function getBookingStatsByTourIds(tourIds) {
// //   if (!tourIds.length) return [];
// //   return tourBookingModel.aggregate([
// //     { $match: { tourId: { $in: tourIds } } },
// //     {
// //       $group: {
// //         _id: "$tourId",
// //         totalTNR: { $sum: 1 },

// //         // ── Travellers (active) ──
// //         // Includes: never-cancelled + cancel-request-pending + unverified travellers
// //         // Excludes: travellers where byAdmin=true (covers both "cancelled" and "rejected")
// //         totalTravellers: {
// //           $sum: {
// //             $size: {
// //               $filter: {
// //                 input: "$travellers", as: "t",
// //                 cond: { $ne: ["$$t.cancelled.byAdmin", true] }
// //               }
// //             }
// //           }
// //         },

// //         // ── Cancelled Travellers (new column) = cancelled + rejected combined ──
// //         // cancelled: byAdmin=true AND byTraveller=true
// //         // rejected:  byAdmin=true AND byTraveller≠true
// //         // combined condition: byAdmin=true (covers both cases)
// //         cancelledTravellers: {
// //           $sum: {
// //             $size: {
// //               $filter: {
// //                 input: "$travellers", as: "t",
// //                 cond: { $eq: ["$$t.cancelled.byAdmin", true] }
// //               }
// //             }
// //           }
// //         },

// //         // ── Gender: same group as totalTravellers (byAdmin ≠ true) ──
// //         totalFemale: {
// //           $sum: {
// //             $size: {
// //               $filter: {
// //                 input: "$travellers", as: "t",
// //                 cond: {
// //                   $and: [
// //                     { $eq: ["$$t.gender", "Female"] },
// //                     { $gt: ["$$t.age", 10] },
// //                     { $ne: ["$$t.cancelled.byAdmin", true] }
// //                   ]
// //                 }
// //               }
// //             }
// //           }
// //         },
// //         totalMale: {
// //           $sum: {
// //             $size: {
// //               $filter: {
// //                 input: "$travellers", as: "t",
// //                 cond: {
// //                   $and: [
// //                     { $eq: ["$$t.gender", "Male"] },
// //                     { $gt: ["$$t.age", 10] },
// //                     { $ne: ["$$t.cancelled.byAdmin", true] }
// //                   ]
// //                 }
// //               }
// //             }
// //           }
// //         },
// //         totalChild: {
// //           $sum: {
// //             $size: {
// //               $filter: {
// //                 input: "$travellers", as: "t",
// //                 cond: {
// //                   $and: [
// //                     { $in: ["$$t.sharingType", ["withBerth", "withoutBerth"]] },
// //                     { $ne: ["$$t.cancelled.byAdmin", true] }
// //                   ]
// //                 }
// //               }
// //             }
// //           }
// //         },

// //         // ── Card-expand breakdown (for mobile TourCard) ──
// //         // Unverified = advance NOT paid, AND byAdmin ≠ true (excludes
// //         // travellers who were separately rejected/cancelled by admin —
// //         // those show up under Rejected/Cancelled instead).
// //         unverifiedTravellers: {
// //           $sum: {
// //             $cond: [
// //               { $ne: ["$payment.advance.paid", true] },
// //               {
// //                 $size: {
// //                   $filter: {
// //                     input: "$travellers", as: "t",
// //                     cond: { $ne: ["$$t.cancelled.byAdmin", true] }
// //                   }
// //                 }
// //               },
// //               0
// //             ]
// //           }
// //         },

// //         // Active: advance PAID + byAdmin≠true AND byTraveller≠true
// //         activeTravellers: {
// //           $sum: {
// //             $cond: [
// //               { $eq: ["$payment.advance.paid", true] },
// //               {
// //                 $size: {
// //                   $filter: {
// //                     input: "$travellers", as: "t",
// //                     cond: {
// //                       $and: [
// //                         { $ne: ["$$t.cancelled.byAdmin", true] },
// //                         { $ne: ["$$t.cancelled.byTraveller", true] },
// //                       ]
// //                     }
// //                   }
// //                 }
// //               },
// //               0
// //             ]
// //           }
// //         },

// //         // Cancellation request: advance PAID + byTraveller=true AND byAdmin≠true
// //         // (advance.paid=true is REQUIRED — a traveller can only request
// //         // cancellation on a booking they've actually paid the advance for.
// //         // Without this condition, an unpaid+byTraveller=true traveller would
// //         // be double-counted here AND in unverifiedTravellers above.)
// //         cancellationRequestTravellers: {
// //           $sum: {
// //             $cond: [
// //               { $eq: ["$payment.advance.paid", true] },
// //               {
// //                 $size: {
// //                   $filter: {
// //                     input: "$travellers", as: "t",
// //                     cond: {
// //                       $and: [
// //                         { $eq: ["$$t.cancelled.byTraveller", true] },
// //                         { $ne: ["$$t.cancelled.byAdmin", true] },
// //                       ]
// //                     }
// //                   }
// //                 }
// //               },
// //               0
// //             ]
// //           }
// //         },

// //         fullyCancelledTravellers: {
// //           $sum: {
// //             $size: {
// //               $filter: {
// //                 input: "$travellers", as: "t",
// //                 cond: {
// //                   $and: [
// //                     { $eq: ["$$t.cancelled.byAdmin", true] },
// //                     { $eq: ["$$t.cancelled.byTraveller", true] },
// //                   ]
// //                 }
// //               }
// //             }
// //           }
// //         },
// //         rejectedTravellers: {
// //           $sum: {
// //             $size: {
// //               $filter: {
// //                 input: "$travellers", as: "t",
// //                 cond: {
// //                   $and: [
// //                     { $eq: ["$$t.cancelled.byAdmin", true] },
// //                     { $ne: ["$$t.cancelled.byTraveller", true] },
// //                   ]
// //                 }
// //               }
// //             }
// //           }
// //         },

// //         // ── Tour status ──
// //         isCompleted: { $max: { $cond: ["$isTripCompleted", 1, 0] } },

// //         // ── Cancellation pools ──
// //         gvPool: { $sum: { $ifNull: ["$gvCancellationPool", 0] } },
// //         irctcPool: { $sum: { $ifNull: ["$irctcCancellationPool", 0] } },
// //       }
// //     }
// //   ]);
// // }

// // // ─── Helper: merge tour + booking data ───────────────────────
// // function mergeTourBooking(allTours, bookingData) {
// //   const bookingMap = {};
// //   bookingData.forEach(b => { bookingMap[b._id?.toString()] = b; });

// //   return allTours.map(t => {
// //     const id = t._id.toString();
// //     const b = bookingMap[id] || {};
// //     return {
// //       _id: id,
// //       tourName: t.title || "—",
// //       tourType: t.batch || "—",
// //       available: t.available ?? null,
// //       departureDate: t.lastBookingDate || null,
// //       totalTNR: b.totalTNR || 0,
// //       totalTravellers: b.totalTravellers || 0,
// //       cancelledTravellers: b.cancelledTravellers || 0,        // NEW column
// //       totalFemale: b.totalFemale || 0,
// //       totalMale: b.totalMale || 0,
// //       totalChild: b.totalChild || 0,
// //       // breakdown — used by mobile card expand view
// //       unverifiedTravellers: b.unverifiedTravellers || 0,
// //       activeTravellers: b.activeTravellers || 0,
// //       cancellationRequestTravellers: b.cancellationRequestTravellers || 0,
// //       fullyCancelledTravellers: b.fullyCancelledTravellers || 0,
// //       rejectedTravellers: b.rejectedTravellers || 0,
// //       isCompleted: b.isCompleted ?? 0,
// //       gvPool: b.gvPool || 0,
// //       irctcPool: b.irctcPool || 0,
// //     };
// //   });
// // }

// // // ════════════════════════════════════════════════════════════════
// // //  Sanity check (run manually in DB to verify):
// // //  totalTravellers + cancelledTravellers === sum of all travellers in booking
// // //  (because totalTravellers uses byAdmin≠true, cancelledTravellers uses byAdmin=true
// // //   — these are complementary sets with zero overlap and zero gap)
// // // ════════════════════════════════════════════════════════════════


// // function emptyStats() {
// //   return {
// //     totalTours: 0,
// //     totalBookings: 0, unverifiedBookings: 0, activeBookings: 0,
// //     completedBookings: 0, fullyCancelledBookings: 0, rejectedBookings: 0,
// //     totalTravellers: 0, activeTravellers: 0, cancelledTravellers: 0,
// //     cancellationRequestTravellers: 0, rejectedTravellers: 0,
// //     totalFemale: 0, totalMale: 0, totalChild: 0,
// //     totalGVPool: 0, totalIRCTCPool: 0, totalCancelAmount: 0,
// //   };
// // }


// // // ════════════════════════════════════════════════════════════════
// // //  1. SUMMARY
// // //  GET /api/touradmin/analytics-summary
// // //     ?year=&month=&tourId=
// // //     ?fromYear=&toYear=&fromMonth=&toMonth=&tourId=   (range mode)
// // // ════════════════════════════════════════════════════════════════
// // const getAnalyticsSummary = async (req, res) => {
// //   try {
// //     const { year, month, tourId, fromYear, toYear, fromMonth, toMonth } = req.query;
// //     const tourIds = tourId ? tourId.split(",") : [];

// //     const tourQuery = buildTourDateQuery({ year, month, fromYear, toYear, fromMonth, toMonth });
// //     if (tourIds.length) {
// //       tourQuery._id = { $in: tourIds.map(id => new mongoose.Types.ObjectId(id)) };
// //     }

// //     let matchTourIds = [];
// //     const hasAnyDateFilter = year || month || fromYear || toYear || fromMonth || toMonth || tourIds.length;
// //     if (hasAnyDateFilter) {
// //       const tours = await tourModel.find(tourQuery, { _id: 1 }).lean();
// //       matchTourIds = tours.map(t => t._id);
// //       if (!matchTourIds.length) {
// //         return res.status(200).json({ success: true, data: emptyStats() });
// //       }
// //     }

// //     const bookingMatch = matchTourIds.length ? { tourId: { $in: matchTourIds } } : {};

// //     // ── Helper expressions ──────────────────────────────────────

// //     const allCancelledExpr = {
// //       $and: [
// //         { $gt: [{ $size: "$travellers" }, 0] },
// //         {
// //           $eq: [
// //             { $size: "$travellers" },
// //             {
// //               $size: {
// //                 $filter: {
// //                   input: "$travellers", as: "t",
// //                   cond: {
// //                     $and: [
// //                       { $eq: ["$$t.cancelled.byAdmin", true] },
// //                       { $eq: ["$$t.cancelled.byTraveller", true] },
// //                     ]
// //                   }
// //                 }
// //               }
// //             }
// //           ]
// //         }
// //       ]
// //     };

// //     const allRejectedExpr = {
// //       $and: [
// //         { $gt: [{ $size: "$travellers" }, 0] },
// //         {
// //           $eq: [
// //             { $size: "$travellers" },
// //             {
// //               $size: {
// //                 $filter: {
// //                   input: "$travellers", as: "t",
// //                   cond: {
// //                     $and: [
// //                       { $eq: ["$$t.cancelled.byAdmin", true] },
// //                       { $ne: ["$$t.cancelled.byTraveller", true] },
// //                     ]
// //                   }
// //                 }
// //               }
// //             }
// //           ]
// //         }
// //       ]
// //     };

// //     const [stats] = await tourBookingModel.aggregate([
// //       { $match: bookingMatch },
// //       {
// //         $group: {
// //           _id: null,

// //           totalBookings: { $sum: 1 },

// //           unverifiedBookings: {
// //             $sum: {
// //               $cond: [{
// //                 $and: [
// //                   { $ne: ["$payment.advance.paid", true] },
// //                   { $not: allCancelledExpr },
// //                   { $not: allRejectedExpr },
// //                 ]
// //               }, 1, 0]
// //             }
// //           },

// //           activeBookings: {
// //             $sum: {
// //               $cond: [{
// //                 $and: [
// //                   { $eq: ["$payment.advance.paid", true] },
// //                   { $ne: ["$payment.balance.paid", true] },
// //                   { $not: allCancelledExpr },
// //                   { $not: allRejectedExpr },
// //                 ]
// //               }, 1, 0]
// //             }
// //           },

// //           completedBookings: {
// //             $sum: {
// //               $cond: [{
// //                 $and: [
// //                   { $eq: ["$payment.advance.paid", true] },
// //                   { $eq: ["$payment.balance.paid", true] },
// //                   { $not: allCancelledExpr },
// //                   { $not: allRejectedExpr },
// //                 ]
// //               }, 1, 0]
// //             }
// //           },

// //           fullyCancelledBookings: {
// //             $sum: { $cond: [allCancelledExpr, 1, 0] }
// //           },

// //           rejectedBookings: {
// //             $sum: { $cond: [allRejectedExpr, 1, 0] }
// //           },

// //           // ── Travellers ──────────────────────────────────────────

// //           totalTravellers: { $sum: { $size: "$travellers" } },

// //           // Unverified = advance NOT paid, AND byAdmin ≠ true (excludes
// //           // travellers who were separately rejected/cancelled by admin).
// //           unverifiedTravellers: {
// //             $sum: {
// //               $cond: [
// //                 { $ne: ["$payment.advance.paid", true] },
// //                 {
// //                   $size: {
// //                     $filter: {
// //                       input: "$travellers", as: "t",
// //                       cond: { $ne: ["$$t.cancelled.byAdmin", true] }
// //                     }
// //                   }
// //                 },
// //                 0
// //               ]
// //             }
// //           },

// //           // Active traveller: advance PAID + byAdmin=false AND byTraveller=false
// //           activeTravellers: {
// //             $sum: {
// //               $cond: [
// //                 { $eq: ["$payment.advance.paid", true] },
// //                 {
// //                   $size: {
// //                     $filter: {
// //                       input: "$travellers", as: "t",
// //                       cond: {
// //                         $and: [
// //                           { $ne: ["$$t.cancelled.byAdmin", true] },
// //                           { $ne: ["$$t.cancelled.byTraveller", true] },
// //                         ]
// //                       }
// //                     }
// //                   }
// //                 },
// //                 0
// //               ]
// //             }
// //           },

// //           // Cancelled traveller: byAdmin=true AND byTraveller=true
// //           cancelledTravellers: {
// //             $sum: {
// //               $size: {
// //                 $filter: {
// //                   input: "$travellers", as: "t",
// //                   cond: {
// //                     $and: [
// //                       { $eq: ["$$t.cancelled.byAdmin", true] },
// //                       { $eq: ["$$t.cancelled.byTraveller", true] },
// //                     ]
// //                   }
// //                 }
// //               }
// //             }
// //           },

// //           // Cancel request: advance PAID + byTraveller=true AND byAdmin=false
// //           // (advance.paid=true required — see definitions block at top of file)
// //           cancellationRequestTravellers: {
// //             $sum: {
// //               $cond: [
// //                 { $eq: ["$payment.advance.paid", true] },
// //                 {
// //                   $size: {
// //                     $filter: {
// //                       input: "$travellers", as: "t",
// //                       cond: {
// //                         $and: [
// //                           { $eq: ["$$t.cancelled.byTraveller", true] },
// //                           { $ne: ["$$t.cancelled.byAdmin", true] },
// //                         ]
// //                       }
// //                     }
// //                   }
// //                 },
// //                 0
// //               ]
// //             }
// //           },

// //           // Rejected traveller: byAdmin=true AND byTraveller=false
// //           rejectedTravellers: {
// //             $sum: {
// //               $size: {
// //                 $filter: {
// //                   input: "$travellers", as: "t",
// //                   cond: {
// //                     $and: [
// //                       { $eq: ["$$t.cancelled.byAdmin", true] },
// //                       { $ne: ["$$t.cancelled.byTraveller", true] },
// //                     ]
// //                   }
// //                 }
// //               }
// //             }
// //           },

// //           // ── Gender (advance paid + NOT cancelled) ────────────────

// //           totalFemale: {
// //             $sum: {
// //               $cond: [
// //                 { $eq: ["$payment.advance.paid", true] },
// //                 {
// //                   $size: {
// //                     $filter: {
// //                       input: "$travellers", as: "t",
// //                       cond: {
// //                         $and: [
// //                           { $eq: ["$$t.gender", "Female"] },
// //                           { $gt: ["$$t.age", 10] },
// //                           { $ne: ["$$t.cancelled.byAdmin", true] },
// //                           { $ne: ["$$t.cancelled.byTraveller", true] },
// //                         ]
// //                       }
// //                     }
// //                   }
// //                 },
// //                 0
// //               ]
// //             }
// //           },

// //           totalMale: {
// //             $sum: {
// //               $cond: [
// //                 { $eq: ["$payment.advance.paid", true] },
// //                 {
// //                   $size: {
// //                     $filter: {
// //                       input: "$travellers", as: "t",
// //                       cond: {
// //                         $and: [
// //                           { $eq: ["$$t.gender", "Male"] },
// //                           { $gt: ["$$t.age", 10] },
// //                           { $ne: ["$$t.cancelled.byAdmin", true] },
// //                           { $ne: ["$$t.cancelled.byTraveller", true] },
// //                         ]
// //                       }
// //                     }
// //                   }
// //                 },
// //                 0
// //               ]
// //             }
// //           },

// //           totalChild: {
// //             $sum: {
// //               $cond: [
// //                 { $eq: ["$payment.advance.paid", true] },
// //                 {
// //                   $size: {
// //                     $filter: {
// //                       input: "$travellers", as: "t",
// //                       cond: {
// //                         $and: [
// //                           { $in: ["$$t.sharingType", ["withBerth", "withoutBerth"]] },
// //                           { $ne: ["$$t.cancelled.byAdmin", true] },
// //                           { $ne: ["$$t.cancelled.byTraveller", true] },
// //                         ]
// //                       }
// //                     }
// //                   }
// //                 },
// //                 0
// //               ]
// //             }
// //           },

// //           // ── Cancellation amounts ─────────────────────────────────

// //           totalGVPool: { $sum: { $ifNull: ["$gvCancellationPool", 0] } },
// //           totalIRCTCPool: { $sum: { $ifNull: ["$irctcCancellationPool", 0] } },
// //         }
// //       },
// //       {
// //         $project: {
// //           _id: 0,
// //           totalBookings: 1,
// //           unverifiedBookings: 1,
// //           activeBookings: 1,
// //           completedBookings: 1,
// //           fullyCancelledBookings: 1,
// //           rejectedBookings: 1,
// //           totalTravellers: 1,
// //           unverifiedTravellers: 1,
// //           activeTravellers: 1,
// //           cancelledTravellers: 1,
// //           cancellationRequestTravellers: 1,
// //           rejectedTravellers: 1,
// //           totalFemale: 1,
// //           totalMale: 1,
// //           totalChild: 1,
// //           totalGVPool: 1,
// //           totalIRCTCPool: 1,
// //           totalCancelAmount: { $add: ["$totalGVPool", "$totalIRCTCPool"] },
// //         }
// //       }
// //     ]);

// //     return res.status(200).json({
// //       success: true,
// //       data: {
// //         totalTours: matchTourIds.length || (await tourModel.countDocuments()),
// //         totalBookings: stats?.totalBookings || 0,
// //         unverifiedBookings: stats?.unverifiedBookings || 0,
// //         activeBookings: stats?.activeBookings || 0,
// //         completedBookings: stats?.completedBookings || 0,
// //         fullyCancelledBookings: stats?.fullyCancelledBookings || 0,
// //         rejectedBookings: stats?.rejectedBookings || 0,
// //         totalTravellers: stats?.totalTravellers || 0,
// //         unverifiedTravellers: stats?.unverifiedTravellers || 0,
// //         activeTravellers: stats?.activeTravellers || 0,
// //         cancelledTravellers: stats?.cancelledTravellers || 0,
// //         cancellationRequestTravellers: stats?.cancellationRequestTravellers || 0,
// //         rejectedTravellers: stats?.rejectedTravellers || 0,
// //         totalFemale: stats?.totalFemale || 0,
// //         totalMale: stats?.totalMale || 0,
// //         totalChild: stats?.totalChild || 0,
// //         totalGVPool: stats?.totalGVPool || 0,
// //         totalIRCTCPool: stats?.totalIRCTCPool || 0,
// //         totalCancelAmount: stats?.totalCancelAmount || 0,
// //       }
// //     });
// //   } catch (err) {
// //     return res.status(500).json({ success: false, message: err.message });
// //   }
// // };


// // // ════════════════════════════════════════════════════════════════
// // //  2. YEAR-WISE — travellers + traveller status + tour status
// // //  GET /api/touradmin/analytics-year-wise
// // //     ?fromYear=&toYear=   (optional — restrict which years are returned)
// // // ════════════════════════════════════════════════════════════════
// // const getAnalyticsYearWise = async (req, res) => {
// //   try {
// //     const { fromYear, toYear } = req.query;

// //     const yearMatch = {};
// //     if (fromYear || toYear) {
// //       const yearExpr = { $year: "$lastBookingDate" };
// //       const clauses = [];
// //       if (fromYear) clauses.push({ $gte: [yearExpr, parseInt(fromYear)] });
// //       if (toYear) clauses.push({ $lte: [yearExpr, parseInt(toYear)] });
// //       yearMatch.$expr = clauses.length === 1 ? clauses[0] : { $and: clauses };
// //     }

// //     const toursByYear = await tourModel.aggregate([
// //       ...(Object.keys(yearMatch).length ? [{ $match: yearMatch }] : []),
// //       { $group: { _id: { $year: "$lastBookingDate" }, tourIds: { $push: "$_id" }, tourCount: { $sum: 1 } } },
// //       { $sort: { _id: 1 } }
// //     ]);

// //     const result = await Promise.all(toursByYear.map(async (yr) => {
// //       const [stats] = await tourBookingModel.aggregate([
// //         { $match: { tourId: { $in: yr.tourIds } } },
// //         {
// //           $group: {
// //             _id: null,
// //             travellers: { $sum: { $size: "$travellers" } },
// //             bookings: { $sum: 1 },

// //             // Active: advance PAID + byAdmin≠true AND byTraveller≠true
// //             activeTravellers: {
// //               $sum: {
// //                 $cond: [
// //                   { $eq: ["$payment.advance.paid", true] },
// //                   {
// //                     $size: {
// //                       $filter: {
// //                         input: "$travellers", as: "t",
// //                         cond: {
// //                           $and: [
// //                             { $ne: ["$$t.cancelled.byAdmin", true] },
// //                             { $ne: ["$$t.cancelled.byTraveller", true] },
// //                           ]
// //                         }
// //                       }
// //                     }
// //                   },
// //                   0
// //                 ]
// //               }
// //             },
// //             cancelledTravellers: {
// //               $sum: {
// //                 $size: {
// //                   $filter: {
// //                     input: "$travellers", as: "t",
// //                     cond: {
// //                       $and: [
// //                         { $eq: ["$$t.cancelled.byAdmin", true] },
// //                         { $eq: ["$$t.cancelled.byTraveller", true] },
// //                       ]
// //                     }
// //                   }
// //                 }
// //               }
// //             },
// //             rejectedTravellers: {
// //               $sum: {
// //                 $size: {
// //                   $filter: {
// //                     input: "$travellers", as: "t",
// //                     cond: {
// //                       $and: [
// //                         { $eq: ["$$t.cancelled.byAdmin", true] },
// //                         { $ne: ["$$t.cancelled.byTraveller", true] },
// //                       ]
// //                     }
// //                   }
// //                 }
// //               }
// //             },

// //             // Unverified: advance NOT paid, AND byAdmin ≠ true (excludes
// //             // travellers who were separately rejected/cancelled by admin).
// //             unverifiedTravellers: {
// //               $sum: {
// //                 $cond: [
// //                   { $ne: ["$payment.advance.paid", true] },
// //                   {
// //                     $size: {
// //                       $filter: {
// //                         input: "$travellers", as: "t",
// //                         cond: { $ne: ["$$t.cancelled.byAdmin", true] }
// //                       }
// //                     }
// //                   },
// //                   0
// //                 ]
// //               }
// //             },

// //             // Cancel request: advance PAID + byTraveller=true AND byAdmin≠true
// //             cancellationRequestTravellers: {
// //               $sum: {
// //                 $cond: [
// //                   { $eq: ["$payment.advance.paid", true] },
// //                   {
// //                     $size: {
// //                       $filter: {
// //                         input: "$travellers", as: "t",
// //                         cond: {
// //                           $and: [
// //                             { $eq: ["$$t.cancelled.byTraveller", true] },
// //                             { $ne: ["$$t.cancelled.byAdmin", true] },
// //                           ]
// //                         }
// //                       }
// //                     }
// //                   },
// //                   0
// //                 ]
// //               }
// //             },

// //             completedBookings: {
// //               $sum: {
// //                 $cond: [{
// //                   $and: [
// //                     { $eq: ["$payment.advance.paid", true] },
// //                     { $eq: ["$payment.balance.paid", true] },
// //                   ]
// //                 }, 1, 0]
// //               }
// //             },
// //             activeBookings: {
// //               $sum: {
// //                 $cond: [{
// //                   $and: [
// //                     { $eq: ["$payment.advance.paid", true] },
// //                     { $ne: ["$payment.balance.paid", true] },
// //                   ]
// //                 }, 1, 0]
// //               }
// //             },
// //             unverifiedBookings: {
// //               $sum: { $cond: [{ $ne: ["$payment.advance.paid", true] }, 1, 0] }
// //             },
// //           }
// //         }
// //       ]);

// //       const toursThisYear = await tourModel.find(
// //         { _id: { $in: yr.tourIds } },
// //         { available: 1, _id: 0 }
// //       ).lean();
// //       const availableTours = toursThisYear.filter(t => t.available !== false).length;
// //       const soldoutTours = toursThisYear.filter(t => t.available === false).length;

// //       return {
// //         _id: yr._id,
// //         tourCount: yr.tourCount,
// //         availableTours,
// //         soldoutTours,
// //         travellers: stats?.travellers || 0,
// //         bookings: stats?.bookings || 0,
// //         activeTravellers: stats?.activeTravellers || 0,
// //         cancelledTravellers: stats?.cancelledTravellers || 0,
// //         rejectedTravellers: stats?.rejectedTravellers || 0,
// //         unverifiedTravellers: stats?.unverifiedTravellers || 0,
// //         cancellationRequestTravellers: stats?.cancellationRequestTravellers || 0,
// //         completedBookings: stats?.completedBookings || 0,
// //         activeBookings: stats?.activeBookings || 0,
// //         unverifiedBookings: stats?.unverifiedBookings || 0,
// //       };
// //     }));

// //     return res.status(200).json({ success: true, data: result });
// //   } catch (err) {
// //     return res.status(500).json({ success: false, message: err.message });
// //   }
// // };

// // // ════════════════════════════════════════════════════════════════
// // //  3. MONTH-WISE — travellers + traveller status + tour status
// // //  GET /api/touradmin/analytics-month-wise?year=2026
// // //     ?fromYear=&toYear=&fromMonth=&toMonth=   (range mode — overrides ?year=)
// // //     When a year RANGE is given, returns one entry per {year, month} pair
// // //     across ALL matched years, each restricted to the month range.
// // // ════════════════════════════════════════════════════════════════
// // const getAnalyticsMonthWise = async (req, res) => {
// //   try {
// //     const { year, month, fromYear, toYear, fromMonth, toMonth } = req.query;

// //     const hasYearRange = fromYear || toYear;
// //     const hasMonthRange = fromMonth || toMonth;

// //     const tourMatch = {};
// //     const exprClauses = [];

// //     if (hasYearRange) {
// //       const yearExpr = { $year: "$lastBookingDate" };
// //       if (fromYear) exprClauses.push({ $gte: [yearExpr, parseInt(fromYear)] });
// //       if (toYear) exprClauses.push({ $lte: [yearExpr, parseInt(toYear)] });
// //     } else if (year && month) {
// //       const y = parseInt(year), m = parseInt(month);
// //       tourMatch.lastBookingDate = { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) };
// //     } else if (year) {
// //       const y = parseInt(year);
// //       tourMatch.lastBookingDate = { $gte: new Date(`${y}-01-01`), $lt: new Date(`${y + 1}-01-01`) };
// //     } else if (!hasMonthRange) {
// //       // No filters at all -> default to current year (legacy behaviour)
// //       const y = new Date().getFullYear();
// //       tourMatch.lastBookingDate = { $gte: new Date(`${y}-01-01`), $lt: new Date(`${y + 1}-01-01`) };
// //     }

// //     if (hasMonthRange) {
// //       const fm = fromMonth ? parseInt(fromMonth) : 1;
// //       const tm = toMonth ? parseInt(toMonth) : 12;
// //       const monthExpr = { $month: "$lastBookingDate" };
// //       if (fm <= tm) {
// //         exprClauses.push({ $gte: [monthExpr, fm] });
// //         exprClauses.push({ $lte: [monthExpr, tm] });
// //       } else {
// //         exprClauses.push({ $or: [{ $gte: [monthExpr, fm] }, { $lte: [monthExpr, tm] }] });
// //       }
// //     } else if (month && !year) {
// //       exprClauses.push({ $eq: [{ $month: "$lastBookingDate" }, parseInt(month)] });
// //     }

// //     if (exprClauses.length) {
// //       tourMatch.$expr = exprClauses.length === 1 ? exprClauses[0] : { $and: exprClauses };
// //     }

// //     const toursByGroup = await tourModel.aggregate([
// //       { $match: tourMatch },
// //       {
// //         $group: {
// //           _id: { year: { $year: "$lastBookingDate" }, month: { $month: "$lastBookingDate" } },
// //           tourIds: { $push: "$_id" },
// //           tourCount: { $sum: 1 },
// //         }
// //       },
// //       { $sort: { "_id.year": 1, "_id.month": 1 } }
// //     ]);

// //     const result = await Promise.all(toursByGroup.map(async (grp) => {
// //       const [stats] = await tourBookingModel.aggregate([
// //         { $match: { tourId: { $in: grp.tourIds } } },
// //         {
// //           $group: {
// //             _id: null,
// //             travellers: { $sum: { $size: "$travellers" } },
// //             bookings: { $sum: 1 },

// //             // Active: advance PAID + byAdmin≠true AND byTraveller≠true
// //             activeTravellers: {
// //               $sum: {
// //                 $cond: [
// //                   { $eq: ["$payment.advance.paid", true] },
// //                   {
// //                     $size: {
// //                       $filter: {
// //                         input: "$travellers", as: "t",
// //                         cond: {
// //                           $and: [
// //                             { $ne: ["$$t.cancelled.byAdmin", true] },
// //                             { $ne: ["$$t.cancelled.byTraveller", true] },
// //                           ]
// //                         }
// //                       }
// //                     }
// //                   },
// //                   0
// //                 ]
// //               }
// //             },
// //             cancelledTravellers: {
// //               $sum: {
// //                 $size: {
// //                   $filter: {
// //                     input: "$travellers", as: "t",
// //                     cond: {
// //                       $and: [
// //                         { $eq: ["$$t.cancelled.byAdmin", true] },
// //                         { $eq: ["$$t.cancelled.byTraveller", true] },
// //                       ]
// //                     }
// //                   }
// //                 }
// //               }
// //             },
// //             rejectedTravellers: {
// //               $sum: {
// //                 $size: {
// //                   $filter: {
// //                     input: "$travellers", as: "t",
// //                     cond: {
// //                       $and: [
// //                         { $eq: ["$$t.cancelled.byAdmin", true] },
// //                         { $ne: ["$$t.cancelled.byTraveller", true] },
// //                       ]
// //                     }
// //                   }
// //                 }
// //               }
// //             },

// //             // Unverified: advance NOT paid, AND byAdmin ≠ true (excludes
// //             // travellers who were separately rejected/cancelled by admin).
// //             unverifiedTravellers: {
// //               $sum: {
// //                 $cond: [
// //                   { $ne: ["$payment.advance.paid", true] },
// //                   {
// //                     $size: {
// //                       $filter: {
// //                         input: "$travellers", as: "t",
// //                         cond: { $ne: ["$$t.cancelled.byAdmin", true] }
// //                       }
// //                     }
// //                   },
// //                   0
// //                 ]
// //               }
// //             },

// //             // Cancel request: advance PAID + byTraveller=true AND byAdmin≠true
// //             cancellationRequestTravellers: {
// //               $sum: {
// //                 $cond: [
// //                   { $eq: ["$payment.advance.paid", true] },
// //                   {
// //                     $size: {
// //                       $filter: {
// //                         input: "$travellers", as: "t",
// //                         cond: {
// //                           $and: [
// //                             { $eq: ["$$t.cancelled.byTraveller", true] },
// //                             { $ne: ["$$t.cancelled.byAdmin", true] },
// //                           ]
// //                         }
// //                       }
// //                     }
// //                   },
// //                   0
// //                 ]
// //               }
// //             },

// //             completedBookings: {
// //               $sum: {
// //                 $cond: [{
// //                   $and: [
// //                     { $eq: ["$payment.advance.paid", true] },
// //                     { $eq: ["$payment.balance.paid", true] },
// //                   ]
// //                 }, 1, 0]
// //               }
// //             },
// //             activeBookings: {
// //               $sum: {
// //                 $cond: [{
// //                   $and: [
// //                     { $eq: ["$payment.advance.paid", true] },
// //                     { $ne: ["$payment.balance.paid", true] },
// //                   ]
// //                 }, 1, 0]
// //               }
// //             },
// //             unverifiedBookings: {
// //               $sum: { $cond: [{ $ne: ["$payment.advance.paid", true] }, 1, 0] }
// //             },

// //             gvPool: { $sum: { $ifNull: ["$gvCancellationPool", 0] } },
// //             irctcPool: { $sum: { $ifNull: ["$irctcCancellationPool", 0] } },
// //           }
// //         }
// //       ]);

// //       const toursThisMonth = await tourModel.find(
// //         { _id: { $in: grp.tourIds } },
// //         { available: 1, _id: 0 }
// //       ).lean();
// //       const availableTours = toursThisMonth.filter(t => t.available !== false).length;
// //       const soldoutTours = toursThisMonth.filter(t => t.available === false).length;

// //       return {
// //         year: grp._id.year,
// //         month: grp._id.month,
// //         tourCount: grp.tourCount,
// //         availableTours,
// //         soldoutTours,
// //         travellers: stats?.travellers || 0,
// //         bookings: stats?.bookings || 0,
// //         activeTravellers: stats?.activeTravellers || 0,
// //         cancelledTravellers: stats?.cancelledTravellers || 0,
// //         rejectedTravellers: stats?.rejectedTravellers || 0,
// //         unverifiedTravellers: stats?.unverifiedTravellers || 0,
// //         cancellationRequestTravellers: stats?.cancellationRequestTravellers || 0,
// //         completedBookings: stats?.completedBookings || 0,
// //         activeBookings: stats?.activeBookings || 0,
// //         unverifiedBookings: stats?.unverifiedBookings || 0,
// //         gvPool: stats?.gvPool || 0,
// //         irctcPool: stats?.irctcPool || 0,
// //       };
// //     }));

// //     return res.status(200).json({ success: true, data: result });
// //   } catch (err) {
// //     return res.status(500).json({ success: false, message: err.message });
// //   }
// // };

// // // ════════════════════════════════════════════════════════════════
// // //  4. CANCELLATION — year-wise + month-wise GV & IRCTC
// // //  GET /api/touradmin/analytics-cancellation?view=year|month&year=2026
// // //     ?view=year&fromYear=&toYear=                       (range mode)
// // //     ?view=month&fromYear=&toYear=&fromMonth=&toMonth=   (range mode)
// // // ════════════════════════════════════════════════════════════════
// // const getAnalyticsCancellation = async (req, res) => {
// //   try {
// //     const { view = "year", year, fromYear, toYear, fromMonth, toMonth } = req.query;
// //     const hasYearRange = fromYear || toYear;
// //     const hasMonthRange = fromMonth || toMonth;

// //     if (view === "month") {
// //       const tourMatch = {};
// //       const exprClauses = [];

// //       if (hasYearRange) {
// //         const yearExpr = { $year: "$lastBookingDate" };
// //         if (fromYear) exprClauses.push({ $gte: [yearExpr, parseInt(fromYear)] });
// //         if (toYear) exprClauses.push({ $lte: [yearExpr, parseInt(toYear)] });
// //       } else {
// //         const y = parseInt(year) || new Date().getFullYear();
// //         tourMatch.lastBookingDate = { $gte: new Date(`${y}-01-01`), $lt: new Date(`${y + 1}-01-01`) };
// //       }

// //       if (hasMonthRange) {
// //         const fm = fromMonth ? parseInt(fromMonth) : 1;
// //         const tm = toMonth ? parseInt(toMonth) : 12;
// //         const monthExpr = { $month: "$lastBookingDate" };
// //         if (fm <= tm) {
// //           exprClauses.push({ $gte: [monthExpr, fm] });
// //           exprClauses.push({ $lte: [monthExpr, tm] });
// //         } else {
// //           exprClauses.push({ $or: [{ $gte: [monthExpr, fm] }, { $lte: [monthExpr, tm] }] });
// //         }
// //       }

// //       if (exprClauses.length) {
// //         tourMatch.$expr = exprClauses.length === 1 ? exprClauses[0] : { $and: exprClauses };
// //       }

// //       const groupKey = hasYearRange
// //         ? { year: { $year: "$lastBookingDate" }, month: { $month: "$lastBookingDate" } }
// //         : { $month: "$lastBookingDate" };

// //       const toursByMonth = await tourModel.aggregate([
// //         { $match: tourMatch },
// //         {
// //           $group: {
// //             _id: groupKey,
// //             tourIds: { $push: "$_id" },
// //           }
// //         },
// //         { $sort: { _id: 1 } }
// //       ]);

// //       const result = await Promise.all(toursByMonth.map(async (mo) => {
// //         const [stats] = await tourBookingModel.aggregate([
// //           { $match: { tourId: { $in: mo.tourIds } } },
// //           {
// //             $group: {
// //               _id: null,
// //               gvPool: { $sum: { $ifNull: ["$gvCancellationPool", 0] } },
// //               irctcPool: { $sum: { $ifNull: ["$irctcCancellationPool", 0] } },
// //             }
// //           }
// //         ]);
// //         const baseEntry = hasYearRange
// //           ? { _id: mo._id.month, year: mo._id.year }
// //           : { _id: mo._id, year: parseInt(year) || new Date().getFullYear() };
// //         return { ...baseEntry, gvPool: stats?.gvPool || 0, irctcPool: stats?.irctcPool || 0 };
// //       }));

// //       return res.status(200).json({ success: true, data: result });
// //     }

// //     // Year-wise (default)
// //     const yearMatch = {};
// //     if (hasYearRange) {
// //       const yearExpr = { $year: "$lastBookingDate" };
// //       const clauses = [];
// //       if (fromYear) clauses.push({ $gte: [yearExpr, parseInt(fromYear)] });
// //       if (toYear) clauses.push({ $lte: [yearExpr, parseInt(toYear)] });
// //       yearMatch.$expr = clauses.length === 1 ? clauses[0] : { $and: clauses };
// //     }

// //     const toursByYear = await tourModel.aggregate([
// //       ...(Object.keys(yearMatch).length ? [{ $match: yearMatch }] : []),
// //       { $group: { _id: { $year: "$lastBookingDate" }, tourIds: { $push: "$_id" } } },
// //       { $sort: { _id: 1 } }
// //     ]);

// //     const result = await Promise.all(toursByYear.map(async (yr) => {
// //       const [stats] = await tourBookingModel.aggregate([
// //         {
// //           $match: {
// //             tourId: { $in: yr.tourIds }, $or: [
// //               { gvCancellationPool: { $gt: 0 } },
// //               { irctcCancellationPool: { $gt: 0 } },
// //             ]
// //           }
// //         },
// //         {
// //           $group: {
// //             _id: null,
// //             gvPool: { $sum: { $ifNull: ["$gvCancellationPool", 0] } },
// //             irctcPool: { $sum: { $ifNull: ["$irctcCancellationPool", 0] } },
// //           }
// //         }
// //       ]);
// //       return { _id: yr._id, gvPool: stats?.gvPool || 0, irctcPool: stats?.irctcPool || 0 };
// //     }));

// //     return res.status(200).json({ success: true, data: result });
// //   } catch (err) {
// //     return res.status(500).json({ success: false, message: err.message });
// //   }
// // };

// // // ════════════════════════════════════════════════════════════════
// // //  5. TOUR LIST TABLE
// // //  GET /api/touradmin/analytics-tour-list?year=&month=&type=&status=&tourId=
// // //     ?fromYear=&toYear=&fromMonth=&toMonth=&type=&status=&tourId=  (range mode)
// // // ════════════════════════════════════════════════════════════════
// // const getAnalyticsTourList = async (req, res) => {
// //   try {
// //     const { year, month, type, status, tourId, fromYear, toYear, fromMonth, toMonth } = req.query;
// //     const tourIds = tourId ? tourId.split(",") : [];

// //     const tourQuery = buildTourDateQuery({ year, month, fromYear, toYear, fromMonth, toMonth });
// //     if (tourIds.length) {
// //       tourQuery._id = { $in: tourIds.map(id => new mongoose.Types.ObjectId(id)) };
// //     }
// //     if (type) tourQuery.batch = { $regex: type, $options: "i" };

// //     const allTours = await tourModel.find(
// //       tourQuery,
// //       { title: 1, batch: 1, available: 1, lastBookingDate: 1 }
// //     ).sort({ lastBookingDate: -1 }).lean();

// //     if (!allTours.length) return res.status(200).json({ success: true, data: [] });

// //     const allTourIds = allTours.map(t => t._id);
// //     const bookingData = await getBookingStatsByTourIds(allTourIds);
// //     let result = mergeTourBooking(allTours, bookingData);

// //     if (status) {
// //       result = result.filter(t => {
// //         if (status === "Completed") return t.isCompleted === 1;
// //         if (status === "Soldout") return t.isCompleted === 0 && t.available === false;
// //         if (status === "Available") return t.isCompleted === 0 && t.available !== false;
// //         return true;
// //       });
// //     }

// //     return res.status(200).json({ success: true, data: result });
// //   } catch (err) {
// //     return res.status(500).json({ success: false, message: err.message });
// //   }
// // };

// // // ════════════════════════════════════════════════════════════════
// // //  6. TOUR SEARCH
// // //  GET /api/touradmin/analytics-search?q=KER&year=2026&month=8
// // //     ?q=&fromYear=&toYear=&fromMonth=&toMonth=&status=   (range mode)
// // // ════════════════════════════════════════════════════════════════
// // const searchAnalyticsTours = async (req, res) => {
// //   try {
// //     const { q, year, month, status, fromYear, toYear, fromMonth, toMonth } = req.query;
// //     if (!q) return res.status(400).json({ success: false, message: "Query 'q' required" });

// //     const tourQuery = {
// //       title: { $regex: `^${q}`, $options: "i" },
// //       ...buildTourDateQuery({ year, month, fromYear, toYear, fromMonth, toMonth }),
// //     };

// //     const tourDocs = await tourModel.find(
// //       tourQuery,
// //       { title: 1, batch: 1, available: 1, lastBookingDate: 1 }
// //     ).limit(30).lean();

// //     if (!tourDocs.length) return res.status(200).json({ success: true, data: [] });

// //     const allTourIds = tourDocs.map(t => t._id);
// //     const bookingData = await getBookingStatsByTourIds(allTourIds);
// //     let result = mergeTourBooking(tourDocs, bookingData);

// //     if (status) {
// //       result = result.filter(t => {
// //         if (status === "Completed") return t.isCompleted === 1;
// //         if (status === "Active") return t.isCompleted === 0;
// //         return true;
// //       });
// //     }

// //     return res.status(200).json({ success: true, data: result });
// //   } catch (err) {
// //     return res.status(500).json({ success: false, message: err.message });
// //   }
// // };

// // export {
// //   loginAdmin,
// //   allTours,
// //   changeTourAvailability,
// //   addTour,
// //   tourAdminDashboard,
// //   bookingsAdmin,
// //   getBookings,
// //   getCancellationChart,
// //   upsertCancellationChart,
// //   getCancellations,
// //   approveCancellation,
// //   rejectCancellation,
// //   bookingRelease,
// //   // addMissingFieldsToAllBookings,
// //   getPendingApprovals,
// //   approveBookingUpdate,
// //   rejectBookingUpdate,
// //   getAllUsers,
// //   adminBookingsTour,
// //   adminTourList,
// //   adminAllotRooms,
// //   bookingRejectAdmin,
// //   generateMissingTNRs,
// //   addTermsPoints,
// //   deleteTermsPoint,
// //   getCurrentTerms,
// //   submitTermsAgreement,
// //   getBookingSummaryByTNR,
// //   adminCreateTourVehicle,
// //   adminUpdateTourVehicle,
// //   adminToggleVehicleSeatSelection,
// //   adminGetTourVehicles,
// //   adminDeleteTourVehicle,
// //   getAllPaymentMethods,
// //   adminFetchTourVehicleSeatOverview,
// //   deleteBookingByTNR,
// //   // ─── Export — add these to existing export {} block ──────────
// //   getAnalyticsSummary,
// //   getAnalyticsYearWise,
// //   getAnalyticsMonthWise,
// //   getAnalyticsCancellation,
// //   getAnalyticsTourList,
// //   searchAnalyticsTours,

// // };

// import mongoose from "mongoose";

// import { v2 as cloudinary } from "cloudinary";
// import jwt from "jsonwebtoken";

// import tourModel from "../models/tourModel.js";
// import userModel from "../models/userModel.js";
// import Terms from "../models/termModel.js";
// import tourBookingModel from "../models/tourBookingmodel.js";
// import cancelRuleModel from "../models/cancelRuleModel.js";
// import cancellationModel from "../models/cancellationModel.js";
// import tourRoomAllocationModel from "../models/roomModel.js";
// import manageBookingModel from "../models/manageBookingModel.js";
// import TourVehicle from "../models/tourVehicleModel.js";
// import PaymentMethod from "../models/paymentModel.js";

// // controllers/adminController.js   (or wherever your admin controllers live)

// // Helper function to generate 6-char TNR in format: AAA9AA
// function generateTNR() {
//   const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
//   const digits = "0123456789";

//   // Position 1-2: uppercase letters
//   let code =
//     letters.charAt(Math.floor(Math.random() * letters.length)) +
//     letters.charAt(Math.floor(Math.random() * letters.length));

//   // Position 3-4: digits
//   code +=
//     digits.charAt(Math.floor(Math.random() * digits.length)) +
//     digits.charAt(Math.floor(Math.random() * digits.length));

//   // Position 5-6: uppercase letters
//   code +=
//     letters.charAt(Math.floor(Math.random() * letters.length)) +
//     letters.charAt(Math.floor(Math.random() * letters.length));

//   return code;
// }

// async function generateMissingTNRs(req, res) {
//   try {
//     // 1. Find all bookings without tnr
//     const bookingsWithoutTNR = await tourBookingModel
//       .find({ tnr: { $exists: false } })
//       .select("_id tnr bookingDate contact.email userId")
//       .lean();

//     const count = bookingsWithoutTNR.length;

//     if (count === 0) {
//       return res.status(200).json({
//         success: true,
//         message: "No bookings are missing TNR. All bookings already have one.",
//         processed: 0,
//         totalChecked: await tourBookingModel.countDocuments(),
//       });
//     }

//     console.log(`Found ${count} bookings without TNR → starting generation...`);

//     let successCount = 0;
//     let collisionCount = 0;
//     let failed = [];

//     // Process in smaller batches to avoid memory issues
//     for (const booking of bookingsWithoutTNR) {
//       let attempts = 0;
//       let tnr = null;

//       while (attempts < 15) {
//         const candidate = generateTNR();

//         // Check if this TNR already exists
//         const conflict = await tourBookingModel.exists({ tnr: candidate });

//         if (!conflict) {
//           tnr = candidate;
//           break;
//         }

//         collisionCount++;
//         attempts++;
//       }

//       if (!tnr) {
//         failed.push({
//           bookingId: booking._id.toString(),
//           reason: "Could not generate unique TNR after 15 attempts",
//         });
//         continue;
//       }

//       // Update the booking
//       await tourBookingModel.updateOne({ _id: booking._id }, { $set: { tnr } });

//       successCount++;

//       // Optional: log first few for debugging
//       if (successCount <= 5) {
//         console.log(`Assigned TNR ${tnr} to booking ${booking._id}`);
//       }
//     }

//     const message =
//       successCount === count
//         ? `Successfully generated TNR for all ${count} missing bookings.`
//         : `Processed ${count} bookings: ${successCount} updated, ${failed.length} failed.`;

//     return res.status(200).json({
//       success: true,
//       message,
//       summary: {
//         totalMissing: count,
//         successfullyUpdated: successCount,
//         collisionsDuringGeneration: collisionCount,
//         failed: failed.length,
//       },
//       failedBookings: failed.length > 0 ? failed : undefined,
//     });
//   } catch (error) {
//     console.error("generateMissingTNRs failed:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to generate missing TNRs",
//       error: error.message,
//     });
//   }
// }
// //API for the admin login
// const loginAdmin = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (
//       email === process.env.ADMIN_EMAIL &&
//       password === process.env.ADMIN_PASSWORD
//     ) {
//       const token = jwt.sign(email + password, process.env.JWT_SECRET);
//       res.json({
//         success: true,
//         token,
//       });
//     } else {
//       res.json({
//         success: false,
//         message: "Invalid credentials",
//       });
//     }
//   } catch (error) {
//     console.log(error);
//     res.json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// //THIS CONTROLLER IS USED IN TOUR CONTROLERS AND DATA PAGE
// const allTours = async (req, res) => {
//   try {
//     const tours = await tourModel.find({}).select("-password");
//     res.json({ success: true, tours });
//   } catch (error) {
//     console.log(error);
//     res.json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
// //CHANGES THE AVAILABLITY OF TOUR
// const changeTourAvailability = async (req, res) => {
//   try {
//     const { tourId } = req.body; // ✅ Use tourId here

//     const tourData = await tourModel.findById(tourId);

//     if (!tourData) {
//       return res.json({ success: false, message: "Tour not found" });
//     }

//     await tourModel.findByIdAndUpdate(tourId, {
//       available: !tourData.available,
//     });

//     res.json({ success: true, message: "Availability changed" });
//   } catch (error) {
//     console.log(error);
//     res.json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// //Add tour controller
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

// const tourAdminDashboard = async (req, res) => {
//   try {
//     const tours = await tourModel.find({});
//     const users = await userModel.find({});
//     const bookings = await tourBookingModel.find({});
//     const dashData = {
//       tours: tours.length,
//       bookings: bookings.length,
//       users: users.length,
//       latestAppointments: bookings.reverse().slice(0, 5),
//     };
//     res.json({ success: true, dashData });
//   } catch (error) {
//     console.log(error);
//     res.json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// //API to get all BOOKINGS

// const bookingsAdmin = async (req, res) => {
//   try {
//     const bookings = await tourBookingModel.find({});
//     res.json({ success: true, bookings });
//   } catch (error) {
//     console.log(error);
//     res.json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// //WORKS SAME LIKE BOOKINGS ADMIN BUT LINKED TO CONTEXT SO NEEDED
// const getBookings = async (req, res) => {
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
//     console.error("Error in getBookings:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch all bookings",
//       error: error.message,
//     });
//   }
// };

// //ALL CONTROLLERS RELATED TO CANCLLATION START FROM HERE

// // GET (with auto-create default)
// const getCancellationChart = async (req, res) => {
//   try {
//     let chart = await cancelRuleModel.findOne();

//     if (!chart) {
//       chart = await cancelRuleModel.create({
//         gv: {
//           advancePaid: {
//             tiers: [{ fromDays: 30, toDays: 15, percentage: 50 }],
//           },
//           fullyPaid: { tiers: [{ fromDays: 30, toDays: 15, percentage: 100 }] },
//         },
//         irctc: [
//           { classType: "SL", noOfDays: 7, fixedAmount: 60, percentage: 50 },
//         ],
//       });
//     }

//     res.status(200).json({ success: true, data: chart });
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ success: false, message: "Failed to fetch chart" });
//   }
// };

// // UPDATE CANCELLATION CHART (or create if not exists)
// const upsertCancellationChart = async (req, res) => {
//   try {
//     const { gv, irctc } = req.body;
//     let chart = await cancelRuleModel.findOne();

//     if (chart) {
//       chart.gv = gv ?? chart.gv;
//       chart.irctc = irctc ?? chart.irctc;
//       chart = await chart.save();
//     } else {
//       chart = await cancelRuleModel.create({ gv, irctc });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Updated",
//       data: chart,
//     });
//   } catch (error) {
//     console.error("Upsert error:", error);
//     res.status(500).json({ success: false, message: "Failed to update" });
//   }
// };

// const getCancellations = async (req, res) => {
//   try {
//     // 1. Find cancellation docs that are RAISED but NOT YET APPROVED
//     const pendingCancellations = await cancellationModel
//       .find({
//         raisedBy: true,
//         $or: [{ approvedBy: { $exists: false } }, { approvedBy: false }],
//       })
//       .select("-__v")
//       .lean();

//     if (!pendingCancellations.length) {
//       return res.json({ success: true, data: [] });
//     }

//     // 2. Extract TNRs (instead of bookingIds)
//     const tnrs = [
//       ...new Set(pendingCancellations.map((c) => c.tnr).filter(Boolean)),
//     ];

//     // 3. Fetch bookings by TNR + filter travellers on server side
//     const bookings = await tourBookingModel
//       .find({ tnr: { $in: tnrs } })
//       .select("tnr travellers cancelled")
//       .lean();

//     // Helper: does the booking contain a traveller cancelled **by traveller only** OR **by admin only**?
//     const hasValidTravellerCancellation = (booking) => {
//       return booking.travellers.some(
//         (t) =>
//           (t.cancelled?.byTraveller === true &&
//             t.cancelled?.byAdmin === false) ||
//           (t.cancelled?.byAdmin === true &&
//             t.cancelled?.byTraveller === false) ||
//           (t.cancelled?.byAdmin === true && t.cancelled?.byTraveller === true),
//       );
//     };

//     const validTnrs = bookings
//       .filter(hasValidTravellerCancellation)
//       .map((b) => b.tnr);

//     // 4. Keep only cancellation docs whose TNR passed the traveller check
//     const result = pendingCancellations.filter(
//       (c) => c.tnr && validTnrs.includes(c.tnr),
//     );

//     // 5. Populate booking & traveller data for the frontend (using TNR)
//     const enriched = await Promise.all(
//       result.map(async (c) => {
//         const booking = await tourBookingModel
//           .findOne({ tnr: c.tnr })
//           .select(
//             "tnr userId tourId travellers contact bookingDate payment adminRemarks",
//           )
//           .populate({
//             path: "travellers",
//             match: {
//               $or: [
//                 { "cancelled.byTraveller": true, "cancelled.byAdmin": false },
//               ],
//             },
//             select: "title firstName lastName age gender sharingType cancelled",
//           })
//           .lean();

//         return { ...c, booking };
//       }),
//     );

//     res.json({ success: true, data: enriched });
//   } catch (err) {
//     console.error("getCancellations error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// const approveCancellation = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { tnr, travellerIds, cancellationId } = req.body;

//     if (!tnr || !travellerIds || !cancellationId) {
//       return res.status(400).json({
//         success: false,
//         message: "tnr, travellerIds, and cancellationId are required",
//       });
//     }

//     const normalizedTnr = tnr.trim().toUpperCase();

//     const cancellation = await cancellationModel
//       .findOne({
//         _id: cancellationId,
//         tnr: normalizedTnr,
//         raisedBy: true,
//         approvedBy: { $ne: true },
//       })
//       .session(session);

//     if (!cancellation) {
//       return res.status(404).json({
//         success: false,
//         message: "Cancellation request not found or already processed",
//       });
//     }

//     const booking = await tourBookingModel
//       .findOne({ tnr: normalizedTnr })
//       .select(
//         "tnr travellers gvCancellationPool irctcCancellationPool cancellationRequest payment contact.mobile",
//       )
//       .session(session);

//     if (!booking) throw new Error("Booking not found");

//     // === PENDING TRAVELLERS ===
//     const pendingTravellers = (booking.travellers || []).filter(
//       (t) => t.cancelled?.byTraveller === true && t.cancelled?.byAdmin !== true,
//     );

//     const pendingCount = pendingTravellers.length;
//     const requestedCount = (cancellation.travellerIds || []).length;

//     // Build name list
//     const getName = (t) =>
//       `${t.title || ""} ${t.firstName || ""} ${t.lastName || ""}`.trim() ||
//       "Unknown Traveller";

//     const pendingNames = pendingTravellers.map(getName);
//     const requestedNames = (cancellation.travellerIds || []).map((id) => {
//       const t = booking.travellers.find(
//         (trav) => trav._id.toString() === id.toString(),
//       );
//       return t ? getName(t) : `Deleted Traveller (ID: ${id})`;
//     });

//     // === COUNT MISMATCH ===
//     if (pendingCount !== requestedCount) {
//       return res.status(400).json({
//         success: false,
//         message: `CANCELLATION BLOCKED: Traveller count mismatch

// User requested : ${pendingCount} traveller(s)
// Admin calculated : ${requestedCount} traveller(s)

// User requested: ${pendingNames.join(", ") || "None"}
// But Admin worked: ${requestedNames.join(", ") || "None"}

// Kindly reject this and raise new request`,
//         details: {
//           pendingTravellers: pendingTravellers.map((t) => ({
//             name: getName(t),
//             id: t._id.toString(),
//             age: t.age,
//             gender: t.gender,
//           })),
//           requestedTravellers: requestedNames,
//           pendingCount,
//           requestedCount,
//         },
//       });
//     }

//     // === ID MISMATCH ===
//     const pendingIds = pendingTravellers.map((t) => t._id.toString()).sort();
//     const requestIds = (cancellation.travellerIds || [])
//       .map((id) => id.toString())
//       .sort();

//     const idsMatch =
//       pendingIds.length === requestIds.length &&
//       pendingIds.every((id, i) => id === requestIds[i]);

//     if (!idsMatch) {
//       return res.status(400).json({
//         success: false,
//         message: `SECURITY BLOCKED: Wrong travellers detected!

// User requested:
// → ${pendingNames.join("\n→ ") || "None"}

// But Admin worked:
// → ${requestedNames.join("\n→ ") || "None"}

// Kindly reject this and raise new request`,
//         details: {
//           pendingTravellers: pendingTravellers.map((t) => ({
//             name: getName(t),
//             id: t._id.toString(),
//           })),
//           requestedTravellers: requestedNames.map((name, i) => ({
//             name,
//             id: requestIds[i],
//           })),
//           securityNote: "Only exact matching travellers can be cancelled",
//         },
//       });
//     }

//     // === ALL GOOD — APPROVE ===
//     // IMPORTANT: cancellation.gvCancellationAmount / irctcCancellationAmount
//     // are NOT "just this cancellation's amount" — the raise-request step
//     // (raiseCancellation controller) already folds the booking's PRIOR
//     // cumulative pool into these fields before saving (existingGvPool /
//     // existingIrctcPool), so they already represent the FULL running
//     // total for every traveller cancelled on this booking so far.
//     //
//     // Adding them on top of booking.gvCancellationPool here DOUBLE-COUNTS
//     // every earlier cancellation. Example: traveller A approved alone →
//     // pool becomes 1000. Traveller B's cancellation record is then raised
//     // with gvCancellationAmount = 3000 (already = B's own deduction +
//     // the existing 1000 from A). If approving B's request ADDS 3000 to
//     // the already-1000 pool, the pool becomes 4000 — wrong. It should
//     // simply become 3000, since B's record already IS the full total.
//     //
//     // So the booking's pool fields must be REPLACED with the approved
//     // record's values, never added to.
//     const newGvPool =
//       (cancellation.gvCancellationAmount || 0) +
//       (cancellation.remarksAmount || 0);
//     const newIrctcPool = cancellation.irctcCancellationAmount || 0;
//     const finalBalance = Math.max(0, cancellation.updatedBalance || 0);

//     const setObj = {
//       gvCancellationPool: newGvPool,
//       irctcCancellationPool: newIrctcPool,
//       cancellationRequest: false,
//       cancellationReceipt: true,
//       "payment.balance.amount": Number(finalBalance),
//     };

//     if (finalBalance === 0) {
//       setObj["payment.balance.paid"] = true;
//       setObj["payment.balance.paymentVerified"] = true;
//       setObj["payment.balance.paidAt"] = new Date();
//     }

//     // === Prepare arrayFilters for positional updates ===
//     const arrayFilters = [];

//     // === NEW: Clear seat lock & seat number for approved travellers ===
//     pendingTravellers.forEach((t, i) => {
//       const elemKey = `elem${i}`;
//       setObj[`travellers.$[${elemKey}].cancelled.byAdmin`] = true;
//       setObj[`travellers.$[${elemKey}].cancelled.cancelledAt`] = new Date();

//       // Clear seat allocation
//       setObj[`travellers.$[${elemKey}].seatNumber`] = null;
//       setObj[`travellers.$[${elemKey}].seatLocked`] = false;
//       setObj[`travellers.$[${elemKey}].seatLockedAt`] = null;

//       // Add filter for this traveller's _id
//       arrayFilters.push({ [`${elemKey}._id`]: t._id });
//     });

//     // === Update booking with all changes ===
//     await tourBookingModel.updateOne(
//       { tnr: normalizedTnr },
//       { $set: setObj },
//       { arrayFilters, session, new: true },
//     );

//     // === NEW: Remove from bookedSeats in tourVehicleModel ===
//     for (const traveller of pendingTravellers) {
//       const seatNumber = traveller.seatNumber;
//       if (!seatNumber) continue; // no seat was locked

//       // Find the vehicle that has this exact seat booked for this booking
//       const vehicle = await TourVehicle.findOne(
//         {
//           "bookedSeats.seatNumber": seatNumber,
//           "bookedSeats.bookingId": booking._id,
//           "bookedSeats.travellerIndex": booking.travellers.indexOf(traveller),
//         },
//         { _id: 1, bookedSeats: 1 },
//       ).session(session);

//       if (vehicle) {
//         // Remove the matching booked seat entry
//         await TourVehicle.updateOne(
//           { _id: vehicle._id },
//           {
//             $pull: {
//               bookedSeats: {
//                 seatNumber: seatNumber,
//                 bookingId: booking._id,
//               },
//             },
//           },
//           { session },
//         );
//       }
//     }

//     // Approve the cancellation record
//     await cancellationModel.findByIdAndUpdate(
//       cancellationId,
//       { approvedBy: true, approvedAt: new Date(), raisedBy: false },
//       { session },
//     );

//     await session.commitTransaction();

//     return res.json({
//       success: true,
//       message: `Cancellation approved successfully!

// Cancelled: ${pendingNames.join(", ")}

// New balance: ₹${finalBalance} ${finalBalance === 0 ? "(Fully Paid)" : ""}`,
//       data: {
//         cancelledTravellers: pendingNames,
//         cancelledCount: pendingCount,
//         newBalance: finalBalance,
//         balancePaid: finalBalance === 0,
//         tnr: normalizedTnr,
//         seatsReleased: pendingTravellers
//           .map((t) => t.seatNumber)
//           .filter(Boolean),
//       },
//     });
//   } catch (err) {
//     await session.abortTransaction();
//     console.error("approveCancellation error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error during approval. Please try again.",
//     });
//   } finally {
//     session.endSession();
//   }
// };

// const rejectCancellation = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { tnr, travellerIds, cancellationId } = req.body;

//     // === VALIDATION ===
//     if (
//       !tnr ||
//       !cancellationId ||
//       !Array.isArray(travellerIds) ||
//       travellerIds.length === 0
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "tnr, cancellationId, and travellerIds array are required",
//       });
//     }

//     const normalizedTnr = tnr.trim().toUpperCase();

//     const cancellation = await cancellationModel
//       .findOne({
//         _id: cancellationId,
//         tnr: normalizedTnr,
//         raisedBy: true,
//       })
//       .session(session);

//     if (!cancellation) {
//       return res.status(404).json({
//         success: false,
//         message: "Cancellation request not found or already processed",
//       });
//     }

//     // Ensure all requested travellerIds are part of this cancellation
//     const cancellationTravellerIds = cancellation.travellerIds.map((id) =>
//       id.toString(),
//     );
//     const missing = travellerIds.filter(
//       (id) => !cancellationTravellerIds.includes(id.toString()),
//     );
//     if (missing.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Some travellerIds do not belong to this cancellation",
//         missing,
//       });
//     }

//     // === ONLY UPDATE CANCELLATION MODEL ===
//     await cancellationModel.findByIdAndUpdate(
//       cancellationId,
//       {
//         raisedBy: false,
//         approvedBy: false,
//         rejectedAt: new Date(),
//       },
//       { session },
//     );

//     // === Clear cancellationRequest in main booking ===
//     await tourBookingModel.updateOne(
//       { tnr: normalizedTnr },
//       { $set: { cancellationRequest: false } },
//       { session },
//     );

//     await session.commitTransaction();

//     return res.json({
//       success: true,
//       message: "Cancellation request rejected successfully",
//       data: {
//         tnr: normalizedTnr,
//         travellerIds,
//         cancellationId,
//         cancellationRequestCleared: true,
//         rejectedAt: new Date(),
//       },
//     });
//   } catch (err) {
//     await session.abortTransaction();
//     console.error("rejectCancellation error:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   } finally {
//     session.endSession();
//   }
// };
// //REJECTING CANCELLATION IN DASHBOARD SO THAT USER END WILL GET UPDATED
// const bookingRelease = async (req, res) => {
//   try {
//     const { tnr, travellerIds = [] } = req.body;

//     // 1. Validate input
//     if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid 6-character TNR is required",
//       });
//     }

//     if (!Array.isArray(travellerIds) || travellerIds.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "travellerIds[] array is required and cannot be empty",
//       });
//     }

//     // Normalize TNR (uppercase, trim)
//     const normalizedTnr = tnr.trim().toUpperCase();

//     // 2. Fetch booking by TNR
//     const booking = await tourBookingModel.findOne({ tnr: normalizedTnr });
//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: `Booking with TNR ${normalizedTnr} not found`,
//       });
//     }

//     const releasedTravellers = [];
//     const notFoundTravellers = [];
//     const notEligibleTravellers = [];

//     const idsSet = new Set(travellerIds.map(String));

//     // 3. Process travellers
//     booking.travellers = booking.travellers.map((traveller) => {
//       const travellerIdStr = String(traveller._id);

//       if (idsSet.has(travellerIdStr)) {
//         const { cancelled } = traveller;

//         // Only release if cancelled by traveller AND NOT by admin
//         if (cancelled?.byTraveller && !cancelled?.byAdmin) {
//           traveller.cancelled.byTraveller = false;
//           traveller.cancelled.releasedAt = new Date();
//           traveller.cancelled.releasedBy = "admin"; // optional: track who released
//           releasedTravellers.push(travellerIdStr);
//         } else {
//           notEligibleTravellers.push(travellerIdStr);
//         }
//       }

//       return traveller;
//     });

//     // 4. Identify any travellerIds that weren't found in this booking
//     travellerIds.forEach((id) => {
//       if (!booking.travellers.some((t) => String(t._id) === String(id))) {
//         notFoundTravellers.push(id);
//       }
//     });

//     // 5. If nothing was released, return detailed failure
//     if (releasedTravellers.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "No travellers were released. Only traveller-initiated cancellations (not admin-rejected) can be released.",
//         details: {
//           notFoundTravellers,
//           notEligibleTravellers,
//         },
//       });
//     }

//     // 6. Save updated booking
//     await booking.save();

//     // 7. Success response
//     res.json({
//       success: true,
//       message: `Released ${releasedTravellers.length} traveller(s) successfully`,
//       tnr: normalizedTnr,
//       releasedTravellers,
//       notFoundTravellers,
//       notEligibleTravellers,
//     });
//   } catch (error) {
//     console.error("bookingRelease error:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message || "Server error during release",
//     });
//   }
// };

// //DANZOR ZONE FUNCTION------DONT TOUCH THIS

// // const addMissingFieldsToAllBookings = async (req, res) => {
// //   try {
// //     const totalBookings = await tourBookingModel.countDocuments();

// //     // ─── Step 1: Add all missing fields ───────────────────────────────
// //     const result = await tourBookingModel.updateMany(
// //       {
// //         $or: [
// //           { manageBooking: { $exists: false } },
// //           { advanceAdminRemarks: { $exists: false } },
// //           { cancellationRequest: { $exists: false } },
// //           { cancellationReceipt: { $exists: false } },
// //           { manageBookingReceipt: { $exists: false } },
// //           { emergencyContact: { $exists: false } },
// //           { termsAgreed: { $exists: false } },
// //           { termsAgreedAt: { $exists: false } },
// //           { "travellers.seatNumber": { $exists: false } },
// //           { "travellers.seatLocked": { $exists: false } },
// //           { "travellers.vehicleId": { $exists: false } },
// //           { "travellers.vehicleName": { $exists: false } },
// //           // ✅ NEW — cancellation pool fields
// //           { gvCancellationPool: { $exists: false } },
// //           { irctcCancellationPool: { $exists: false } },
// //         ],
// //       },
// //       {
// //         $set: {
// //           manageBooking: false,
// //           advanceAdminRemarks: [],
// //           cancellationRequest: false,
// //           cancellationReceipt: false,
// //           manageBookingReceipt: false,
// //           emergencyContact: null,
// //           termsAgreed: false,
// //           termsAgreedAt: null,
// //           "travellers.$[].seatNumber": null,
// //           "travellers.$[].seatLocked": false,
// //           "travellers.$[].seatLockedAt": null,
// //           "travellers.$[].vehicleId": null,
// //           "travellers.$[].vehicleName": null,
// //         },
// //       },
// //     );

// //     // ─── Step 2: cancellation pool — SEPARATE updateMany ──────────────
// //     // ✅ Separate ஆ பண்றோம் — already value இருக்கற docs overwrite ஆகாம இருக்கும்
// //     const poolResult = await tourBookingModel.updateMany(
// //       {
// //         $or: [
// //           { gvCancellationPool: { $exists: false } },
// //           { irctcCancellationPool: { $exists: false } },
// //         ],
// //       },
// //       {
// //         $set: {
// //           gvCancellationPool: 0,
// //           irctcCancellationPool: 0,
// //         },
// //       },
// //     );

// //     res.status(200).json({
// //       success: true,
// //       message: "Migration completed successfully!",
// //       data: {
// //         totalBookings,
// //         step1: {
// //           matchedCount: result.matchedCount,
// //           modifiedCount: result.modifiedCount,
// //           fieldsEnsured: [
// //             "manageBooking",
// //             "advanceAdminRemarks",
// //             "cancellationRequest",
// //             "cancellationReceipt",
// //             "manageBookingReceipt",
// //             "emergencyContact",
// //             "termsAgreed",
// //             "termsAgreedAt",
// //             "travellers.seatNumber",
// //             "travellers.seatLocked",
// //             "travellers.seatLockedAt",
// //             "travellers.vehicleId",
// //             "travellers.vehicleName",
// //           ],
// //         },
// //         step2: {
// //           matchedCount: poolResult.matchedCount,
// //           modifiedCount: poolResult.modifiedCount,
// //           fieldsEnsured: [
// //             "gvCancellationPool → 0 (only missing docs)",
// //             "irctcCancellationPool → 0 (only missing docs)",
// //           ],
// //           note: "Existing cancellation pool values were NOT overwritten ✅",
// //         },
// //       },
// //     });
// //   } catch (error) {
// //     console.error("Migration failed:", error);
// //     res.status(500).json({
// //       success: false,
// //       message: "Migration failed",
// //       error: error.message,
// //     });
// //   }
// // };


// //MANAGE BOOKING RELATED CONTROLLER GET PENDING APPROVALS
// const getPendingApprovals = async (req, res) => {
//   try {
//     const pendingBookings = await manageBookingModel
//       .find({
//         manageBooking: true,
//         raisedBy: true,
//       })
//       .populate({
//         path: "userId",
//         select: "name email mobile",
//       })
//       .populate({
//         path: "tourId",
//         select: "title destination startDate endDate thumbnail",
//       })
//       .populate({
//         path: "bookingId",
//         select:
//           "tnr travellers contact bookingType payment receipts bookingDate gvCancellationPool irctcCancellationPool adminRemarks",
//         populate: {
//           path: "tourId",
//           select: "title",
//         },
//       })
//       .sort({ bookingDate: -1 })
//       .select("-__v")
//       .lean();

//     // Ensure travellers in original booking also have _id
//     pendingBookings.forEach((mb) => {
//       if (mb.bookingId?.travellers) {
//         mb.bookingId.travellers = mb.bookingId.travellers.map((t) => ({
//           ...t,
//           _id: t._id || new mongoose.Types.ObjectId(), // fallback (should never happen)
//         }));
//       }
//     });

//     return res.status(200).json({
//       success: true,
//       message:
//         pendingBookings.length > 0
//           ? "Pending approvals fetched successfully."
//           : "No pending approvals found.",
//       count: pendingBookings.length,
//       data: pendingBookings,
//     });
//   } catch (error) {
//     console.error("Error in getPendingApprovals:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch pending approvals.",
//       error: error.message,
//     });
//   }
// };

// //APPROVE THE BOOKING UPDATE REQUEST IN THE MANAGE BOOKING APPROVALS PAGE

// const approveBookingUpdate = async (req, res) => {
//   try {
//     const { bookingId } = req.body;

//     if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid bookingId is required",
//       });
//     }

//     // Step 1: Find pending manageBooking request
//     const manageBooking = await manageBookingModel
//       .findOne({ bookingId, approvedBy: false, raisedBy: true })
//       .lean();

//     if (!manageBooking) {
//       return res.status(404).json({
//         success: false,
//         message: "No pending update request found for this booking",
//       });
//     }

//     if (manageBooking.approvedBy) {
//       return res.status(400).json({
//         success: false,
//         message: "This update has already been approved",
//       });
//     }

//     // Validate amounts
//     if (
//       manageBooking.updatedAdvance === undefined ||
//       manageBooking.updatedBalance === undefined
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "updatedAdvance and updatedBalance are required",
//       });
//     }

//     // Step 2: Prepare update for tourBooking
//     const updateData = {
//       $set: {
//         "payment.advance.amount": manageBooking.updatedAdvance,
//         "payment.balance.amount": manageBooking.updatedBalance,
//         travellers: manageBooking.travellers,
//         contact: manageBooking.contact,
//         billingAddress: manageBooking.billingAddress,
//         adminRemarks: manageBooking.adminRemarks || [],
//         manageBooking: false,
//         manageBookingReceipt: true,
//       },
//     };

//     // Only if travellers were reduced in this request → reset paid flags + receipt flags
//     if (manageBooking.travellersReduced === true) {
//       updateData.$set["payment.advance.paid"] = false;
//       updateData.$set["payment.advance.paymentVerified"] = false; // optional clean-up
//       updateData.$set["receipts.advanceReceiptSent"] = false;
//       updateData.$set["receipts.advanceReceiptSentAt"] = null;
//     }

//     // Step 3: Apply update to original booking
//     const updatedTourBooking = await tourBookingModel.findByIdAndUpdate(
//       bookingId,
//       updateData,
//       { new: true, runValidators: true },
//     );

//     if (!updatedTourBooking) {
//       return res.status(404).json({
//         success: false,
//         message: "Original booking not found",
//       });
//     }

//     // Step 4: Mark manageBooking as approved
//     await manageBookingModel.findOneAndUpdate(
//       { _id: manageBooking._id },
//       { $set: { approvedBy: true, raisedBy: false, manageBooking: false } },
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Booking update approved and applied successfully",
//       data: {
//         updatedBooking: updatedTourBooking,
//         approvedRequestId: manageBooking._id,
//       },
//     });
//   } catch (error) {
//     console.error("Error in approveBookingUpdate:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };
// //REJECT THE BOOKING UPDATE REQUEST IN THE MANAGE BOOKING APPROVALS PAGE
// const rejectBookingUpdate = async (req, res) => {
//   try {
//     const { bookingId, remark } = req.body; // remark is optional

//     // --- 1. Validate bookingId ---
//     if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid bookingId is required",
//       });
//     }

//     // --- 2. Find the pending manageBooking request ---
//     const manageBooking = await manageBookingModel
//       .findOne({
//         bookingId,
//         approvedBy: false,
//         manageBooking: true,
//       })
//       .lean();

//     if (!manageBooking) {
//       return res.status(404).json({
//         success: false,
//         message: "No pending update request found for this booking",
//       });
//     }

//     // --- 3. Prepare update: reject the request ---
//     const updatePayload = {
//       $set: {
//         manageBooking: false,
//         raisedBy: false,
//         // Optional: mark as rejected (you can add a field if needed)
//       },
//       $push: {
//         adminRemarks: {
//           remark: remark || "Update request rejected by admin",
//           amount: 0,
//           addedAt: new Date(),
//         },
//       },
//     };

//     // --- 4. Apply the update ---
//     const updated = await manageBookingModel.findByIdAndUpdate(
//       manageBooking._id,
//       updatePayload,
//       { new: true, runValidators: true },
//     );

//     // --- 5. Success response ---
//     return res.status(200).json({
//       success: true,
//       message: "Booking update request rejected successfully",
//       data: {
//         rejectedRequestId: updated._id,
//         bookingId: updated.bookingId,
//       },
//     });
//   } catch (error) {
//     console.error("rejectBookingUpdate error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

// //GET ALL USERS DATA FOR ALL USERS PAGE
// const getAllUsers = async (req, res) => {
//   try {
//     const users = await userModel
//       .find({})
//       .select("name email phone address gender dob image createdAt")
//       .sort({ createdAt: -1 })
//       .lean();

//     // ← ADD: _id timestamp fallback for users without createdAt
//     const enriched = users.map(u => ({
//       ...u,
//       createdAt: u.createdAt || u._id.getTimestamp(),
//     }));

//     res.json({
//       success: true,
//       total: enriched.length,
//       users: enriched,
//     });
//   } catch (error) {
//     console.error("Error fetching users:", error);
//     res.status(500).json({ success: false, message: "Failed to fetch users" });
//   }
// };

// const adminBookingsTour = async (req, res) => {
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

// const adminTourList = async (req, res) => {
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

// //ADMIN ROOM LIST HELPER FUNCTION AND CONTROLLERS

// // === Helper Functions ===
// const getBasicTravelerInfo = (t) => ({
//   title: t.title,
//   firstName: t.firstName,
//   lastName: t.lastName,
//   age: t.age,
//   gender: t.gender,
//   sharingType: t.sharingType,
// });
// const assignRoomNumbers = (rooms) =>
//   rooms.map((r, i) => ({ ...r, roomNumber: i + 1 }));

// const adminAllotRooms = async (req, res) => {
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

// //Rejects booking from booking rejection section
// const bookingRejectAdmin = async (req, res) => {
//   try {
//     const { tnr, travellerIds = [] } = req.body;

//     // Validate input
//     if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid 6-character TNR is required",
//       });
//     }

//     if (!Array.isArray(travellerIds) || travellerIds.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "travellerIds[] array is required and cannot be empty",
//       });
//     }

//     const normalizedTnr = tnr.trim().toUpperCase();

//     // Fetch booking by TNR
//     const booking = await tourBookingModel.findOne({ tnr: normalizedTnr });
//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found with this TNR",
//       });
//     }

//     // Extract balance prices
//     const balanceDouble = Number(booking.tourData?.balanceDouble) || 0;
//     const balanceTriple = Number(booking.tourData?.balanceTriple) || 0;

//     // Payment status (used for deduction logic only)
//     const advancePaid =
//       booking.payment.advance.paid && booking.payment.advance.paymentVerified;
//     const balancePaid =
//       booking.payment.balance.paid && booking.payment.balance.paymentVerified;

//     // Normalize traveller IDs
//     const idsSet = new Set(travellerIds.map(String));

//     // Check for travellers that block rejection
//     const cancelledByTraveller = [];
//     const alreadyRejectedTravellers = [];
//     const missingTravellers = [];

//     travellerIds.forEach((id) => {
//       const traveller = booking.travellers.find(
//         (t) => String(t._id) === String(id),
//       );
//       if (!traveller) {
//         missingTravellers.push(id);
//       } else if (traveller.cancelled.byTraveller) {
//         cancelledByTraveller.push(id);
//       } else if (traveller.cancelled.byAdmin) {
//         alreadyRejectedTravellers.push(id);
//       }
//     });

//     // Strict mode: Block if any blocking conditions exist
//     if (
//       cancelledByTraveller.length > 0 ||
//       alreadyRejectedTravellers.length === travellerIds.length ||
//       missingTravellers.length === travellerIds.length
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Rejection not allowed due to invalid traveller state.",
//         cancelledByTraveller,
//         alreadyRejected: alreadyRejectedTravellers,
//         missingTravellers,
//       });
//     }

//     // Proceed with valid travellers
//     let totalDeduction = 0;
//     const rejectedTravellers = [];

//     booking.travellers = booking.travellers.map((traveller) => {
//       const travellerIdStr = String(traveller._id);

//       if (idsSet.has(travellerIdStr)) {
//         traveller.cancelled.byAdmin = true;
//         traveller.cancelled.cancelledAt = new Date();

//         rejectedTravellers.push(traveller);

//         // Deduct only if advance paid AND balance not paid
//         if (advancePaid && !balancePaid) {
//           if (traveller.sharingType === "double") {
//             totalDeduction += balanceDouble;
//           } else if (traveller.sharingType === "triple") {
//             totalDeduction += balanceTriple;
//           }
//         }
//       }

//       return traveller;
//     });

//     // Update balance only if deduction is applicable
//     if (totalDeduction > 0) {
//       booking.payment.balance.amount = Math.max(
//         booking.payment.balance.amount - totalDeduction,
//         0,
//       );
//     }

//     await booking.save();

//     res.json({
//       success: true,
//       message: "Traveller(s) rejected successfully",
//       updatedBalance: booking.payment.balance.amount,
//       rejectedTravellers: rejectedTravellers.map((t) => String(t._id)),
//       tnr: normalizedTnr,
//     });
//   } catch (error) {
//     console.error("bookingRejectAdmin error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
// // Add this new function

// const deleteBookingByTNR = async (req, res) => {
//   try {
//     const { tnr } = req.body;

//     if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid 6-character TNR is required",
//       });
//     }

//     const normalizedTNR = tnr.trim().toUpperCase();

//     const booking = await tourBookingModel.findOne({ tnr: normalizedTNR });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: `No booking found with TNR ${normalizedTNR}`,
//       });
//     }

//     // Optional: Prevent deletion if already paid / completed / etc.
//     if (booking.payment?.balance?.paid) {
//       return res.status(403).json({
//         success: false,
//         message:
//           "Cannot delete this booking — balance payment has already been made.",
//       });
//     }

//     if (booking.isBookingCompleted) {
//       return res.status(403).json({
//         success: false,
//         message: "Cannot delete completed bookings.",
//       });
//     }

//     // Actually delete
//     await tourBookingModel.deleteOne({ tnr: normalizedTNR });

//     return res.json({
//       success: true,
//       message: `Booking with TNR ${normalizedTNR} has been permanently deleted.`,
//       deletedTNR: normalizedTNR,
//     });
//   } catch (error) {
//     console.error("deleteBookingByTNR error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while deleting booking",
//       error: error.message,
//     });
//   }
// };

// const addTermsPoints = async (req, res) => {
//   try {
//     const { points } = req.body;

//     // Basic input validation
//     if (!points || !Array.isArray(points) || points.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Please send an array of points (at least one item required)",
//       });
//     }

//     // Find or create the current active terms document
//     let termsDoc = await Terms.findOne({ isCurrent: true });

//     if (!termsDoc) {
//       // First time → create initial document
//       termsDoc = new Terms({
//         version: "1.0",
//         effectiveFrom: new Date(),
//         isCurrent: true,
//         points: [],
//         // lastUpdatedBy: req.user?._id || null,   ← removed / commented
//         changeSummary: "Initial Terms & Conditions created (first time)",
//       });
//     }

//     // Calculate next order number
//     let nextOrder = 1;
//     if (termsDoc.points.length > 0) {
//       const orders = termsDoc.points.map((p) => p.order || 0);
//       nextOrder = Math.max(...orders) + 1;
//     }

//     // Prepare and validate new points
//     const newPoints = [];

//     for (let i = 0; i < points.length; i++) {
//       const input = points[i];

//       let text = "";
//       let internalNote = "";

//       if (typeof input === "string") {
//         text = input.trim();
//       } else if (typeof input === "object" && input !== null) {
//         text = (input.text || "").trim();
//         internalNote = (input.internalNote || "").trim();
//       }

//       if (!text || text.length < 10) {
//         return res.status(400).json({
//           success: false,
//           message: `Point #${i + 1} is invalid: text must be at least 10 characters`,
//         });
//       }

//       newPoints.push({
//         order: nextOrder + i,
//         text,
//         active: true,
//         internalNote,
//         createdAt: new Date(),
//       });
//     }

//     // Append new points
//     termsDoc.points.push(...newPoints);

//     // Update metadata — removed dependency on req.user
//     // termsDoc.lastUpdatedBy = req.user?._id || null;   ← commented out
//     termsDoc.lastUpdatedAt = new Date();
//     termsDoc.changeSummary = `Added ${newPoints.length} new point(s) - ${new Date().toISOString().split("T")[0]} (admin action)`;

//     // Save
//     await termsDoc.save();

//     // Prepare clean response (only active & sorted points)
//     const activeSortedPoints = termsDoc.points
//       .filter((p) => p.active === true)
//       .sort((a, b) => a.order - b.order)
//       .map((p) => ({
//         order: p.order,
//         text: p.text,
//         // internalNote is intentionally NOT sent to frontend
//       }));

//     return res.status(200).json({
//       success: true,
//       message: `Successfully added ${newPoints.length} point(s)`,
//       data: {
//         version: termsDoc.version,
//         effectiveFrom: termsDoc.effectiveFrom,
//         totalActivePoints: activeSortedPoints.length,
//         points: activeSortedPoints,
//       },
//     });
//   } catch (error) {
//     console.error("addTermsPoints error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to add terms points",
//       error: error.message,
//     });
//   }
// };

// const deleteTermsPoint = async (req, res) => {
//   try {
//     const { pointId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(pointId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid point ID format",
//       });
//     }

//     // Find current active terms document
//     const termsDoc = await Terms.findOne({ isCurrent: true });

//     if (!termsDoc) {
//       return res.status(404).json({
//         success: false,
//         message: "No active terms document found",
//       });
//     }

//     // Find the point by its _id
//     const point = termsDoc.points.id(pointId);

//     if (!point) {
//       return res.status(404).json({
//         success: false,
//         message: "Point not found in current terms",
//       });
//     }

//     // Deactivate instead of pull/remove (preserves history)
//     point.active = false;
//     point.updatedAt = new Date();

//     // Update metadata
//     termsDoc.lastUpdatedAt = new Date();
//     termsDoc.changeSummary = `Deactivated point #${point.order} - ${new Date().toISOString().split("T")[0]}`;
//     // termsDoc.lastUpdatedBy = req.user._id;  // uncomment when auth is fixed

//     await termsDoc.save();

//     // Prepare clean response (active points only)
//     const activeSortedPoints = termsDoc.points
//       .filter((p) => p.active === true)
//       .sort((a, b) => a.order - b.order)
//       .map((p) => ({
//         order: p.order,
//         text: p.text,
//       }));

//     return res.status(200).json({
//       success: true,
//       message: `Point #${point.order} deactivated successfully`,
//       data: {
//         version: termsDoc.version,
//         totalActivePoints: activeSortedPoints.length,
//         points: activeSortedPoints,
//       },
//     });
//   } catch (error) {
//     console.error("deleteTermsPoint error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to deactivate terms point",
//       error: error.message,
//     });
//   }
// };

// // controllers/tourAdminController.js (or termsController.js)

// // Import your Terms model (adjust path if needed)

// const getCurrentTerms = async (req, res) => {
//   try {
//     // Find the current active version
//     const termsDoc = await Terms.findOne({ isCurrent: true })
//       .select("version effectiveFrom points") // only needed fields
//       .lean(); // faster, plain JS object

//     if (!termsDoc) {
//       return res.status(200).json({
//         success: true,
//         message: "No terms & conditions defined yet",
//         data: {
//           version: "N/A",
//           effectiveFrom: null,
//           points: [],
//         },
//       });
//     }

//     // Filter active points and sort by order
//     const activePoints = termsDoc.points
//       .filter((p) => p.active === true)
//       .sort((a, b) => a.order - b.order)
//       .map((p) => ({
//         _id: p._id.toString(),
//         order: p.order,
//         text: p.text,
//       }));

//     return res.status(200).json({
//       success: true,
//       message: "Current terms & conditions fetched",
//       data: {
//         version: termsDoc.version,
//         effectiveFrom: termsDoc.effectiveFrom,
//         totalActivePoints: activePoints.length,
//         points: activePoints,
//       },
//     });
//   } catch (error) {
//     console.error("getCurrentTerms error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch terms & conditions",
//       error: error.message,
//     });
//   }
// };

// const submitTermsAgreement = async (req, res) => {
//   try {
//     const { tnr } = req.params;
//     const { emergencyContact, termsAgreed } = req.body;

//     // Validation
//     if (!tnr || tnr.length !== 6 || !/^[A-Z0-9]{6}$/.test(tnr)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid TNR format",
//       });
//     }

//     if (
//       !emergencyContact ||
//       !/^[\d+\-\s()]{7,25}$/.test(emergencyContact.trim())
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Please enter a valid emergency contact number (7–25 characters: digits, +, -, spaces, parentheses allowed)",
//       });
//     }

//     if (!termsAgreed) {
//       return res.status(400).json({
//         success: false,
//         message: "You must agree to the terms and conditions",
//       });
//     }

//     // Find booking by TNR
//     const booking = await tourBookingModel.findOne({ tnr: tnr.toUpperCase() });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found with this TNR",
//       });
//     }

//     // Check if already agreed
//     if (booking.termsAgreed) {
//       return res.status(400).json({
//         success: false,
//         message: "Terms already agreed for this booking",
//       });
//     }

//     // Update booking
//     booking.emergencyContact = emergencyContact;
//     booking.termsAgreed = true;
//     booking.termsAgreedAt = new Date();

//     await booking.save();

//     return res.status(200).json({
//       success: true,
//       message: "Terms agreed successfully. Thank you!",
//       data: {
//         tnr: booking.tnr,
//         emergencyContact: booking.emergencyContact,
//         termsAgreed: booking.termsAgreed,
//         termsAgreedAt: booking.termsAgreedAt,
//       },
//     });
//   } catch (error) {
//     console.error("submitTermsAgreement error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to submit terms agreement",
//       error: error.message,
//     });
//   }
// };
// const getBookingSummaryByTNR = async (req, res) => {
//   try {
//     const { tnr } = req.params;

//     const booking = await tourBookingModel
//       .findOne({ tnr: tnr.toUpperCase() })
//       .select(
//         "tnr tourData.title travellers emergencyContact termsAgreed termsAgreedAt",
//       )
//       .lean();

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found",
//       });
//     }

//     const travellers = booking.travellers || [];

//     // Gender counts
//     const males = travellers.filter(
//       (t) => t.gender?.toLowerCase() === "male",
//     ).length;

//     const females = travellers.filter(
//       (t) => t.gender?.toLowerCase() === "female",
//     ).length;

//     // Child detection (age < 12)
//     const children = travellers.filter((t) => t.age < 12);

//     const childrenWithBerth = children.filter(
//       (t) => t.sharingType === "withBerth",
//     ).length;

//     const childrenWithoutBerth = children.filter(
//       (t) => t.sharingType === "withoutBerth",
//     ).length;

//     return res.status(200).json({
//       success: true,
//       data: {
//         tnr: booking.tnr,
//         tourTitle: booking.tourData?.title || "N/A",
//         totalTravellers: travellers.length,
//         males,
//         females,
//         children: {
//           total: children.length,
//           withBerth: childrenWithBerth,
//           withoutBerth: childrenWithoutBerth,
//         },
//         // Return full travellers array so frontend can show names
//         travellers: travellers.map((t) => ({
//           firstName: t.firstName || "",
//           lastName: t.lastName || "",
//           title: t.title || "",
//           age: t.age,
//           gender: t.gender,
//           sharingType: t.sharingType,
//         })),
//         emergencyContact: booking.emergencyContact || null,
//         termsAgreed: booking.termsAgreed || false,
//         termsAgreedAt: booking.termsAgreedAt || null,
//       },
//     });
//   } catch (err) {
//     console.error("getBookingSummaryByTNR error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: err.message,
//     });
//   }
// };
// //SAM related controllers
// const adminCreateTourVehicle = async (req, res) => {
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
// const adminUpdateTourVehicle = async (req, res) => {
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

// const adminToggleVehicleSeatSelection = async (req, res) => {
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

// const adminGetTourVehicles = async (req, res) => {
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
// const adminDeleteTourVehicle = async (req, res) => {
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
// const adminFetchTourVehicleSeatOverview = async (req, res) => {
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

// // ════════════════════════════════════════════════════════════════
// //  ANALYTICS — replace existing analytics section in touradminController.js
// //
// //  RANGE FILTER SUPPORT ADDED:
// //  - year / month        -> existing single-value filters (unchanged behaviour)
// //  - fromYear / toYear    -> year RANGE (e.g. 2025–2029), inclusive both ends
// //  - fromMonth / toMonth  -> month RANGE (e.g. Jan–Jun = 1–6), inclusive,
// //                            applied INDEPENDENTLY within each matched year
// //                            (NOT a single cross-year date span)
// //
// //  Combining rules (confirmed):
// //  - year range + month range are independent AND filters.
// //    e.g. fromYear=2025&toYear=2029&fromMonth=1&toMonth=6 means:
// //    "tours whose departure falls in Jan–Jun of ANY year from 2025–2029"
// //  - If both single (year/month) AND range (fromYear.../fromMonth...) params
// //    are sent, range params take priority (single values are legacy/back-compat).
// //
// //  ── TRAVELLER STATUS DEFINITIONS (confirmed, single source of truth) ──
// //  Active            = payment.advance.paid = true  AND byAdmin ≠ true AND byTraveller ≠ true
// //  Unverified        = payment.advance.paid ≠ true  AND byAdmin ≠ true
// //                       (an unpaid traveller who was separately
// //                       rejected/cancelled by admin shows up as
// //                       Rejected/Cancelled, NOT Unverified)
// //  Cancellation req. = payment.advance.paid = true  AND byTraveller = true AND byAdmin ≠ true
// //  Cancelled         = byAdmin = true AND byTraveller = true
// //  Rejected          = byAdmin = true AND byTraveller ≠ true
// //
// //  These 5 sets are mutually exclusive and collectively exhaustive over all
// //  travellers in a booking — every traveller falls into exactly one bucket:
// //    - byAdmin = true  -> Cancelled or Rejected (split by byTraveller)
// //    - byAdmin ≠ true, advance.paid = true, byTraveller = true  -> Cancellation request
// //    - byAdmin ≠ true, advance.paid = true, byTraveller ≠ true  -> Active
// //    - byAdmin ≠ true, advance.paid ≠ true                      -> Unverified
// // ════════════════════════════════════════════════════════════════

// // ─── Helper: tour departure date filter (single OR range) ──────────────
// function buildTourDateQuery({ year, month, fromYear, toYear, fromMonth, toMonth }) {
//   const q = {};
//   const exprClauses = [];

//   const hasYearRange = fromYear || toYear;
//   const hasMonthRange = fromMonth || toMonth;

//   if (hasYearRange) {
//     const fy = fromYear ? parseInt(fromYear) : null;
//     const ty = toYear ? parseInt(toYear) : null;
//     const yearExpr = { $year: "$lastBookingDate" };
//     if (fy !== null) exprClauses.push({ $gte: [yearExpr, fy] });
//     if (ty !== null) exprClauses.push({ $lte: [yearExpr, ty] });
//   }

//   if (hasMonthRange) {
//     const fm = fromMonth ? parseInt(fromMonth) : 1;
//     const tm = toMonth ? parseInt(toMonth) : 12;
//     const monthExpr = { $month: "$lastBookingDate" };
//     if (fm <= tm) {
//       // Normal range within a year, e.g. Jan(1)–Jun(6)
//       exprClauses.push({ $gte: [monthExpr, fm] });
//       exprClauses.push({ $lte: [monthExpr, tm] });
//     } else {
//       // Wrap-around range, e.g. Nov(11)–Feb(2) -> month >= 11 OR month <= 2
//       exprClauses.push({ $or: [{ $gte: [monthExpr, fm] }, { $lte: [monthExpr, tm] }] });
//     }
//   }

//   if (exprClauses.length) {
//     q.$expr = exprClauses.length === 1 ? exprClauses[0] : { $and: exprClauses };
//     return q;
//   }

//   // ── Legacy single year/month (back-compat, used when no range params sent) ──
//   if (year && month) {
//     const y = parseInt(year), m = parseInt(month);
//     q.lastBookingDate = { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) };
//   } else if (year) {
//     const y = parseInt(year);
//     q.lastBookingDate = { $gte: new Date(`${y}-01-01`), $lt: new Date(`${y + 1}-01-01`) };
//   } else if (month) {
//     q.$expr = { $eq: [{ $month: "$lastBookingDate" }, parseInt(month)] };
//   }
//   return q;
// }


// // ════════════════════════════════════════════════════════════════
// //  Updated helper functions for tour list table
// //  Replace in touradminController.js
// // ════════════════════════════════════════════════════════════════

// // ─── Helper: booking stats per tourId ────────────────────────
// async function getBookingStatsByTourIds(tourIds) {
//   if (!tourIds.length) return [];
//   return tourBookingModel.aggregate([
//     { $match: { tourId: { $in: tourIds } } },
//     {
//       $group: {
//         _id: "$tourId",
//         totalTNR: { $sum: 1 },

//         // ── Travellers (active) ──
//         // Includes: never-cancelled + cancel-request-pending + unverified travellers
//         // Excludes: travellers where byAdmin=true (covers both "cancelled" and "rejected")
//         totalTravellers: {
//           $sum: {
//             $size: {
//               $filter: {
//                 input: "$travellers", as: "t",
//                 cond: { $ne: ["$$t.cancelled.byAdmin", true] }
//               }
//             }
//           }
//         },

//         // ── Cancelled Travellers (new column) = cancelled + rejected combined ──
//         // cancelled: byAdmin=true AND byTraveller=true
//         // rejected:  byAdmin=true AND byTraveller≠true
//         // combined condition: byAdmin=true (covers both cases)
//         cancelledTravellers: {
//           $sum: {
//             $size: {
//               $filter: {
//                 input: "$travellers", as: "t",
//                 cond: { $eq: ["$$t.cancelled.byAdmin", true] }
//               }
//             }
//           }
//         },

//         // ── Gender: same group as totalTravellers (byAdmin ≠ true) ──
//         totalFemale: {
//           $sum: {
//             $size: {
//               $filter: {
//                 input: "$travellers", as: "t",
//                 cond: {
//                   $and: [
//                     { $eq: ["$$t.gender", "Female"] },
//                     { $gt: ["$$t.age", 10] },
//                     { $ne: ["$$t.cancelled.byAdmin", true] }
//                   ]
//                 }
//               }
//             }
//           }
//         },
//         totalMale: {
//           $sum: {
//             $size: {
//               $filter: {
//                 input: "$travellers", as: "t",
//                 cond: {
//                   $and: [
//                     { $eq: ["$$t.gender", "Male"] },
//                     { $gt: ["$$t.age", 10] },
//                     { $ne: ["$$t.cancelled.byAdmin", true] }
//                   ]
//                 }
//               }
//             }
//           }
//         },
//         totalChild: {
//           $sum: {
//             $size: {
//               $filter: {
//                 input: "$travellers", as: "t",
//                 cond: {
//                   $and: [
//                     { $in: ["$$t.sharingType", ["withBerth", "withoutBerth"]] },
//                     { $ne: ["$$t.cancelled.byAdmin", true] }
//                   ]
//                 }
//               }
//             }
//           }
//         },

//         // ── Card-expand breakdown (for mobile TourCard) ──
//         // Unverified = advance NOT paid, AND byAdmin ≠ true (excludes
//         // travellers who were separately rejected/cancelled by admin —
//         // those show up under Rejected/Cancelled instead).
//         unverifiedTravellers: {
//           $sum: {
//             $cond: [
//               { $ne: ["$payment.advance.paid", true] },
//               {
//                 $size: {
//                   $filter: {
//                     input: "$travellers", as: "t",
//                     cond: { $ne: ["$$t.cancelled.byAdmin", true] }
//                   }
//                 }
//               },
//               0
//             ]
//           }
//         },

//         // Active: advance PAID + byAdmin≠true AND byTraveller≠true
//         activeTravellers: {
//           $sum: {
//             $cond: [
//               { $eq: ["$payment.advance.paid", true] },
//               {
//                 $size: {
//                   $filter: {
//                     input: "$travellers", as: "t",
//                     cond: {
//                       $and: [
//                         { $ne: ["$$t.cancelled.byAdmin", true] },
//                         { $ne: ["$$t.cancelled.byTraveller", true] },
//                       ]
//                     }
//                   }
//                 }
//               },
//               0
//             ]
//           }
//         },

//         // Cancellation request: advance PAID + byTraveller=true AND byAdmin≠true
//         // (advance.paid=true is REQUIRED — a traveller can only request
//         // cancellation on a booking they've actually paid the advance for.
//         // Without this condition, an unpaid+byTraveller=true traveller would
//         // be double-counted here AND in unverifiedTravellers above.)
//         cancellationRequestTravellers: {
//           $sum: {
//             $cond: [
//               { $eq: ["$payment.advance.paid", true] },
//               {
//                 $size: {
//                   $filter: {
//                     input: "$travellers", as: "t",
//                     cond: {
//                       $and: [
//                         { $eq: ["$$t.cancelled.byTraveller", true] },
//                         { $ne: ["$$t.cancelled.byAdmin", true] },
//                       ]
//                     }
//                   }
//                 }
//               },
//               0
//             ]
//           }
//         },

//         fullyCancelledTravellers: {
//           $sum: {
//             $size: {
//               $filter: {
//                 input: "$travellers", as: "t",
//                 cond: {
//                   $and: [
//                     { $eq: ["$$t.cancelled.byAdmin", true] },
//                     { $eq: ["$$t.cancelled.byTraveller", true] },
//                   ]
//                 }
//               }
//             }
//           }
//         },
//         rejectedTravellers: {
//           $sum: {
//             $size: {
//               $filter: {
//                 input: "$travellers", as: "t",
//                 cond: {
//                   $and: [
//                     { $eq: ["$$t.cancelled.byAdmin", true] },
//                     { $ne: ["$$t.cancelled.byTraveller", true] },
//                   ]
//                 }
//               }
//             }
//           }
//         },

//         // ── Tour status ──
//         isCompleted: { $max: { $cond: ["$isTripCompleted", 1, 0] } },

//         // ── Cancellation pools ──
//         gvPool: { $sum: { $ifNull: ["$gvCancellationPool", 0] } },
//         irctcPool: { $sum: { $ifNull: ["$irctcCancellationPool", 0] } },
//       }
//     }
//   ]);
// }

// // ─── Helper: merge tour + booking data ───────────────────────
// function mergeTourBooking(allTours, bookingData) {
//   const bookingMap = {};
//   bookingData.forEach(b => { bookingMap[b._id?.toString()] = b; });

//   return allTours.map(t => {
//     const id = t._id.toString();
//     const b = bookingMap[id] || {};
//     return {
//       _id: id,
//       tourName: t.title || "—",
//       tourType: t.batch || "—",
//       available: t.available ?? null,
//       departureDate: t.lastBookingDate || null,
//       totalTNR: b.totalTNR || 0,
//       totalTravellers: b.totalTravellers || 0,
//       cancelledTravellers: b.cancelledTravellers || 0,        // NEW column
//       totalFemale: b.totalFemale || 0,
//       totalMale: b.totalMale || 0,
//       totalChild: b.totalChild || 0,
//       // breakdown — used by mobile card expand view
//       unverifiedTravellers: b.unverifiedTravellers || 0,
//       activeTravellers: b.activeTravellers || 0,
//       cancellationRequestTravellers: b.cancellationRequestTravellers || 0,
//       fullyCancelledTravellers: b.fullyCancelledTravellers || 0,
//       rejectedTravellers: b.rejectedTravellers || 0,
//       isCompleted: b.isCompleted ?? 0,
//       gvPool: b.gvPool || 0,
//       irctcPool: b.irctcPool || 0,
//     };
//   });
// }

// // ════════════════════════════════════════════════════════════════
// //  Sanity check (run manually in DB to verify):
// //  totalTravellers + cancelledTravellers === sum of all travellers in booking
// //  (because totalTravellers uses byAdmin≠true, cancelledTravellers uses byAdmin=true
// //   — these are complementary sets with zero overlap and zero gap)
// // ════════════════════════════════════════════════════════════════


// function emptyStats() {
//   return {
//     totalTours: 0,
//     totalBookings: 0, unverifiedBookings: 0, activeBookings: 0,
//     completedBookings: 0, fullyCancelledBookings: 0, rejectedBookings: 0,
//     totalTravellers: 0, activeTravellers: 0, cancelledTravellers: 0,
//     cancellationRequestTravellers: 0, rejectedTravellers: 0,
//     totalFemale: 0, totalMale: 0, totalChild: 0,
//     totalGVPool: 0, totalIRCTCPool: 0, totalCancelAmount: 0,
//   };
// }


// // ════════════════════════════════════════════════════════════════
// //  1. SUMMARY
// //  GET /api/touradmin/analytics-summary
// //     ?year=&month=&tourId=
// //     ?fromYear=&toYear=&fromMonth=&toMonth=&tourId=   (range mode)
// // ════════════════════════════════════════════════════════════════
// const getAnalyticsSummary = async (req, res) => {
//   try {
//     const { year, month, tourId, fromYear, toYear, fromMonth, toMonth } = req.query;
//     const tourIds = tourId ? tourId.split(",") : [];

//     const tourQuery = buildTourDateQuery({ year, month, fromYear, toYear, fromMonth, toMonth });
//     if (tourIds.length) {
//       tourQuery._id = { $in: tourIds.map(id => new mongoose.Types.ObjectId(id)) };
//     }

//     let matchTourIds = [];
//     const hasAnyDateFilter = year || month || fromYear || toYear || fromMonth || toMonth || tourIds.length;
//     if (hasAnyDateFilter) {
//       const tours = await tourModel.find(tourQuery, { _id: 1 }).lean();
//       matchTourIds = tours.map(t => t._id);
//       if (!matchTourIds.length) {
//         return res.status(200).json({ success: true, data: emptyStats() });
//       }
//     }

//     const bookingMatch = matchTourIds.length ? { tourId: { $in: matchTourIds } } : {};

//     // ── Helper expressions ──────────────────────────────────────

//     const allCancelledExpr = {
//       $and: [
//         { $gt: [{ $size: "$travellers" }, 0] },
//         {
//           $eq: [
//             { $size: "$travellers" },
//             {
//               $size: {
//                 $filter: {
//                   input: "$travellers", as: "t",
//                   cond: {
//                     $and: [
//                       { $eq: ["$$t.cancelled.byAdmin", true] },
//                       { $eq: ["$$t.cancelled.byTraveller", true] },
//                     ]
//                   }
//                 }
//               }
//             }
//           ]
//         }
//       ]
//     };

//     const allRejectedExpr = {
//       $and: [
//         { $gt: [{ $size: "$travellers" }, 0] },
//         {
//           $eq: [
//             { $size: "$travellers" },
//             {
//               $size: {
//                 $filter: {
//                   input: "$travellers", as: "t",
//                   cond: {
//                     $and: [
//                       { $eq: ["$$t.cancelled.byAdmin", true] },
//                       { $ne: ["$$t.cancelled.byTraveller", true] },
//                     ]
//                   }
//                 }
//               }
//             }
//           ]
//         }
//       ]
//     };

//     const [stats] = await tourBookingModel.aggregate([
//       { $match: bookingMatch },
//       {
//         $group: {
//           _id: null,

//           totalBookings: { $sum: 1 },

//           unverifiedBookings: {
//             $sum: {
//               $cond: [{
//                 $and: [
//                   { $ne: ["$payment.advance.paid", true] },
//                   { $not: allCancelledExpr },
//                   { $not: allRejectedExpr },
//                 ]
//               }, 1, 0]
//             }
//           },

//           activeBookings: {
//             $sum: {
//               $cond: [{
//                 $and: [
//                   { $eq: ["$payment.advance.paid", true] },
//                   { $ne: ["$payment.balance.paid", true] },
//                   { $not: allCancelledExpr },
//                   { $not: allRejectedExpr },
//                 ]
//               }, 1, 0]
//             }
//           },

//           completedBookings: {
//             $sum: {
//               $cond: [{
//                 $and: [
//                   { $eq: ["$payment.advance.paid", true] },
//                   { $eq: ["$payment.balance.paid", true] },
//                   { $not: allCancelledExpr },
//                   { $not: allRejectedExpr },
//                 ]
//               }, 1, 0]
//             }
//           },

//           fullyCancelledBookings: {
//             $sum: { $cond: [allCancelledExpr, 1, 0] }
//           },

//           rejectedBookings: {
//             $sum: { $cond: [allRejectedExpr, 1, 0] }
//           },

//           // ── Travellers ──────────────────────────────────────────

//           totalTravellers: { $sum: { $size: "$travellers" } },

//           // Unverified = advance NOT paid, AND byAdmin ≠ true (excludes
//           // travellers who were separately rejected/cancelled by admin).
//           unverifiedTravellers: {
//             $sum: {
//               $cond: [
//                 { $ne: ["$payment.advance.paid", true] },
//                 {
//                   $size: {
//                     $filter: {
//                       input: "$travellers", as: "t",
//                       cond: { $ne: ["$$t.cancelled.byAdmin", true] }
//                     }
//                   }
//                 },
//                 0
//               ]
//             }
//           },

//           // Active traveller: advance PAID + byAdmin=false AND byTraveller=false
//           activeTravellers: {
//             $sum: {
//               $cond: [
//                 { $eq: ["$payment.advance.paid", true] },
//                 {
//                   $size: {
//                     $filter: {
//                       input: "$travellers", as: "t",
//                       cond: {
//                         $and: [
//                           { $ne: ["$$t.cancelled.byAdmin", true] },
//                           { $ne: ["$$t.cancelled.byTraveller", true] },
//                         ]
//                       }
//                     }
//                   }
//                 },
//                 0
//               ]
//             }
//           },

//           // Cancelled traveller: byAdmin=true AND byTraveller=true
//           cancelledTravellers: {
//             $sum: {
//               $size: {
//                 $filter: {
//                   input: "$travellers", as: "t",
//                   cond: {
//                     $and: [
//                       { $eq: ["$$t.cancelled.byAdmin", true] },
//                       { $eq: ["$$t.cancelled.byTraveller", true] },
//                     ]
//                   }
//                 }
//               }
//             }
//           },

//           // Cancel request: advance PAID + byTraveller=true AND byAdmin=false
//           // (advance.paid=true required — see definitions block at top of file)
//           cancellationRequestTravellers: {
//             $sum: {
//               $cond: [
//                 { $eq: ["$payment.advance.paid", true] },
//                 {
//                   $size: {
//                     $filter: {
//                       input: "$travellers", as: "t",
//                       cond: {
//                         $and: [
//                           { $eq: ["$$t.cancelled.byTraveller", true] },
//                           { $ne: ["$$t.cancelled.byAdmin", true] },
//                         ]
//                       }
//                     }
//                   }
//                 },
//                 0
//               ]
//             }
//           },

//           // Rejected traveller: byAdmin=true AND byTraveller=false
//           rejectedTravellers: {
//             $sum: {
//               $size: {
//                 $filter: {
//                   input: "$travellers", as: "t",
//                   cond: {
//                     $and: [
//                       { $eq: ["$$t.cancelled.byAdmin", true] },
//                       { $ne: ["$$t.cancelled.byTraveller", true] },
//                     ]
//                   }
//                 }
//               }
//             }
//           },

//           // ── Gender (advance paid + NOT cancelled) ────────────────

//           totalFemale: {
//             $sum: {
//               $cond: [
//                 { $eq: ["$payment.advance.paid", true] },
//                 {
//                   $size: {
//                     $filter: {
//                       input: "$travellers", as: "t",
//                       cond: {
//                         $and: [
//                           { $eq: ["$$t.gender", "Female"] },
//                           { $gt: ["$$t.age", 10] },
//                           { $ne: ["$$t.cancelled.byAdmin", true] },
//                           { $ne: ["$$t.cancelled.byTraveller", true] },
//                         ]
//                       }
//                     }
//                   }
//                 },
//                 0
//               ]
//             }
//           },

//           totalMale: {
//             $sum: {
//               $cond: [
//                 { $eq: ["$payment.advance.paid", true] },
//                 {
//                   $size: {
//                     $filter: {
//                       input: "$travellers", as: "t",
//                       cond: {
//                         $and: [
//                           { $eq: ["$$t.gender", "Male"] },
//                           { $gt: ["$$t.age", 10] },
//                           { $ne: ["$$t.cancelled.byAdmin", true] },
//                           { $ne: ["$$t.cancelled.byTraveller", true] },
//                         ]
//                       }
//                     }
//                   }
//                 },
//                 0
//               ]
//             }
//           },

//           totalChild: {
//             $sum: {
//               $cond: [
//                 { $eq: ["$payment.advance.paid", true] },
//                 {
//                   $size: {
//                     $filter: {
//                       input: "$travellers", as: "t",
//                       cond: {
//                         $and: [
//                           { $in: ["$$t.sharingType", ["withBerth", "withoutBerth"]] },
//                           { $ne: ["$$t.cancelled.byAdmin", true] },
//                           { $ne: ["$$t.cancelled.byTraveller", true] },
//                         ]
//                       }
//                     }
//                   }
//                 },
//                 0
//               ]
//             }
//           },

//           // ── Cancellation amounts ─────────────────────────────────

//           totalGVPool: { $sum: { $ifNull: ["$gvCancellationPool", 0] } },
//           totalIRCTCPool: { $sum: { $ifNull: ["$irctcCancellationPool", 0] } },
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           totalBookings: 1,
//           unverifiedBookings: 1,
//           activeBookings: 1,
//           completedBookings: 1,
//           fullyCancelledBookings: 1,
//           rejectedBookings: 1,
//           totalTravellers: 1,
//           unverifiedTravellers: 1,
//           activeTravellers: 1,
//           cancelledTravellers: 1,
//           cancellationRequestTravellers: 1,
//           rejectedTravellers: 1,
//           totalFemale: 1,
//           totalMale: 1,
//           totalChild: 1,
//           totalGVPool: 1,
//           totalIRCTCPool: 1,
//           totalCancelAmount: { $add: ["$totalGVPool", "$totalIRCTCPool"] },
//         }
//       }
//     ]);

//     return res.status(200).json({
//       success: true,
//       data: {
//         totalTours: matchTourIds.length || (await tourModel.countDocuments()),
//         totalBookings: stats?.totalBookings || 0,
//         unverifiedBookings: stats?.unverifiedBookings || 0,
//         activeBookings: stats?.activeBookings || 0,
//         completedBookings: stats?.completedBookings || 0,
//         fullyCancelledBookings: stats?.fullyCancelledBookings || 0,
//         rejectedBookings: stats?.rejectedBookings || 0,
//         totalTravellers: stats?.totalTravellers || 0,
//         unverifiedTravellers: stats?.unverifiedTravellers || 0,
//         activeTravellers: stats?.activeTravellers || 0,
//         cancelledTravellers: stats?.cancelledTravellers || 0,
//         cancellationRequestTravellers: stats?.cancellationRequestTravellers || 0,
//         rejectedTravellers: stats?.rejectedTravellers || 0,
//         totalFemale: stats?.totalFemale || 0,
//         totalMale: stats?.totalMale || 0,
//         totalChild: stats?.totalChild || 0,
//         totalGVPool: stats?.totalGVPool || 0,
//         totalIRCTCPool: stats?.totalIRCTCPool || 0,
//         totalCancelAmount: stats?.totalCancelAmount || 0,
//       }
//     });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };


// // ════════════════════════════════════════════════════════════════
// //  2. YEAR-WISE — travellers + traveller status + tour status
// //  GET /api/touradmin/analytics-year-wise
// //     ?fromYear=&toYear=   (optional — restrict which years are returned)
// // ════════════════════════════════════════════════════════════════
// const getAnalyticsYearWise = async (req, res) => {
//   try {
//     const { fromYear, toYear } = req.query;

//     const yearMatch = {};
//     if (fromYear || toYear) {
//       const yearExpr = { $year: "$lastBookingDate" };
//       const clauses = [];
//       if (fromYear) clauses.push({ $gte: [yearExpr, parseInt(fromYear)] });
//       if (toYear) clauses.push({ $lte: [yearExpr, parseInt(toYear)] });
//       yearMatch.$expr = clauses.length === 1 ? clauses[0] : { $and: clauses };
//     }

//     const toursByYear = await tourModel.aggregate([
//       ...(Object.keys(yearMatch).length ? [{ $match: yearMatch }] : []),
//       { $group: { _id: { $year: "$lastBookingDate" }, tourIds: { $push: "$_id" }, tourCount: { $sum: 1 } } },
//       { $sort: { _id: 1 } }
//     ]);

//     const result = await Promise.all(toursByYear.map(async (yr) => {
//       const [stats] = await tourBookingModel.aggregate([
//         { $match: { tourId: { $in: yr.tourIds } } },
//         {
//           $group: {
//             _id: null,
//             travellers: { $sum: { $size: "$travellers" } },
//             bookings: { $sum: 1 },

//             // Active: advance PAID + byAdmin≠true AND byTraveller≠true
//             activeTravellers: {
//               $sum: {
//                 $cond: [
//                   { $eq: ["$payment.advance.paid", true] },
//                   {
//                     $size: {
//                       $filter: {
//                         input: "$travellers", as: "t",
//                         cond: {
//                           $and: [
//                             { $ne: ["$$t.cancelled.byAdmin", true] },
//                             { $ne: ["$$t.cancelled.byTraveller", true] },
//                           ]
//                         }
//                       }
//                     }
//                   },
//                   0
//                 ]
//               }
//             },
//             cancelledTravellers: {
//               $sum: {
//                 $size: {
//                   $filter: {
//                     input: "$travellers", as: "t",
//                     cond: {
//                       $and: [
//                         { $eq: ["$$t.cancelled.byAdmin", true] },
//                         { $eq: ["$$t.cancelled.byTraveller", true] },
//                       ]
//                     }
//                   }
//                 }
//               }
//             },
//             rejectedTravellers: {
//               $sum: {
//                 $size: {
//                   $filter: {
//                     input: "$travellers", as: "t",
//                     cond: {
//                       $and: [
//                         { $eq: ["$$t.cancelled.byAdmin", true] },
//                         { $ne: ["$$t.cancelled.byTraveller", true] },
//                       ]
//                     }
//                   }
//                 }
//               }
//             },

//             // Unverified: advance NOT paid, AND byAdmin ≠ true (excludes
//             // travellers who were separately rejected/cancelled by admin).
//             unverifiedTravellers: {
//               $sum: {
//                 $cond: [
//                   { $ne: ["$payment.advance.paid", true] },
//                   {
//                     $size: {
//                       $filter: {
//                         input: "$travellers", as: "t",
//                         cond: { $ne: ["$$t.cancelled.byAdmin", true] }
//                       }
//                     }
//                   },
//                   0
//                 ]
//               }
//             },

//             // Cancel request: advance PAID + byTraveller=true AND byAdmin≠true
//             cancellationRequestTravellers: {
//               $sum: {
//                 $cond: [
//                   { $eq: ["$payment.advance.paid", true] },
//                   {
//                     $size: {
//                       $filter: {
//                         input: "$travellers", as: "t",
//                         cond: {
//                           $and: [
//                             { $eq: ["$$t.cancelled.byTraveller", true] },
//                             { $ne: ["$$t.cancelled.byAdmin", true] },
//                           ]
//                         }
//                       }
//                     }
//                   },
//                   0
//                 ]
//               }
//             },

//             completedBookings: {
//               $sum: {
//                 $cond: [{
//                   $and: [
//                     { $eq: ["$payment.advance.paid", true] },
//                     { $eq: ["$payment.balance.paid", true] },
//                   ]
//                 }, 1, 0]
//               }
//             },
//             activeBookings: {
//               $sum: {
//                 $cond: [{
//                   $and: [
//                     { $eq: ["$payment.advance.paid", true] },
//                     { $ne: ["$payment.balance.paid", true] },
//                   ]
//                 }, 1, 0]
//               }
//             },
//             unverifiedBookings: {
//               $sum: { $cond: [{ $ne: ["$payment.advance.paid", true] }, 1, 0] }
//             },
//           }
//         }
//       ]);

//       const toursThisYear = await tourModel.find(
//         { _id: { $in: yr.tourIds } },
//         { available: 1, _id: 0 }
//       ).lean();
//       const availableTours = toursThisYear.filter(t => t.available !== false).length;
//       const soldoutTours = toursThisYear.filter(t => t.available === false).length;

//       return {
//         _id: yr._id,
//         tourCount: yr.tourCount,
//         availableTours,
//         soldoutTours,
//         travellers: stats?.travellers || 0,
//         bookings: stats?.bookings || 0,
//         activeTravellers: stats?.activeTravellers || 0,
//         cancelledTravellers: stats?.cancelledTravellers || 0,
//         rejectedTravellers: stats?.rejectedTravellers || 0,
//         unverifiedTravellers: stats?.unverifiedTravellers || 0,
//         cancellationRequestTravellers: stats?.cancellationRequestTravellers || 0,
//         completedBookings: stats?.completedBookings || 0,
//         activeBookings: stats?.activeBookings || 0,
//         unverifiedBookings: stats?.unverifiedBookings || 0,
//       };
//     }));

//     return res.status(200).json({ success: true, data: result });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ════════════════════════════════════════════════════════════════
// //  3. MONTH-WISE — travellers + traveller status + tour status
// //  GET /api/touradmin/analytics-month-wise?year=2026
// //     ?fromYear=&toYear=&fromMonth=&toMonth=   (range mode — overrides ?year=)
// //     When a year RANGE is given, returns one entry per {year, month} pair
// //     across ALL matched years, each restricted to the month range.
// // ════════════════════════════════════════════════════════════════
// const getAnalyticsMonthWise = async (req, res) => {
//   try {
//     const { year, month, fromYear, toYear, fromMonth, toMonth } = req.query;

//     const hasYearRange = fromYear || toYear;
//     const hasMonthRange = fromMonth || toMonth;

//     const tourMatch = {};
//     const exprClauses = [];

//     if (hasYearRange) {
//       const yearExpr = { $year: "$lastBookingDate" };
//       if (fromYear) exprClauses.push({ $gte: [yearExpr, parseInt(fromYear)] });
//       if (toYear) exprClauses.push({ $lte: [yearExpr, parseInt(toYear)] });
//     } else if (year && month) {
//       const y = parseInt(year), m = parseInt(month);
//       tourMatch.lastBookingDate = { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) };
//     } else if (year) {
//       const y = parseInt(year);
//       tourMatch.lastBookingDate = { $gte: new Date(`${y}-01-01`), $lt: new Date(`${y + 1}-01-01`) };
//     } else if (!hasMonthRange) {
//       // No filters at all -> default to current year (legacy behaviour)
//       const y = new Date().getFullYear();
//       tourMatch.lastBookingDate = { $gte: new Date(`${y}-01-01`), $lt: new Date(`${y + 1}-01-01`) };
//     }

//     if (hasMonthRange) {
//       const fm = fromMonth ? parseInt(fromMonth) : 1;
//       const tm = toMonth ? parseInt(toMonth) : 12;
//       const monthExpr = { $month: "$lastBookingDate" };
//       if (fm <= tm) {
//         exprClauses.push({ $gte: [monthExpr, fm] });
//         exprClauses.push({ $lte: [monthExpr, tm] });
//       } else {
//         exprClauses.push({ $or: [{ $gte: [monthExpr, fm] }, { $lte: [monthExpr, tm] }] });
//       }
//     } else if (month && !year) {
//       exprClauses.push({ $eq: [{ $month: "$lastBookingDate" }, parseInt(month)] });
//     }

//     if (exprClauses.length) {
//       tourMatch.$expr = exprClauses.length === 1 ? exprClauses[0] : { $and: exprClauses };
//     }

//     const toursByGroup = await tourModel.aggregate([
//       { $match: tourMatch },
//       {
//         $group: {
//           _id: { year: { $year: "$lastBookingDate" }, month: { $month: "$lastBookingDate" } },
//           tourIds: { $push: "$_id" },
//           tourCount: { $sum: 1 },
//         }
//       },
//       { $sort: { "_id.year": 1, "_id.month": 1 } }
//     ]);

//     const result = await Promise.all(toursByGroup.map(async (grp) => {
//       const [stats] = await tourBookingModel.aggregate([
//         { $match: { tourId: { $in: grp.tourIds } } },
//         {
//           $group: {
//             _id: null,
//             travellers: { $sum: { $size: "$travellers" } },
//             bookings: { $sum: 1 },

//             // Active: advance PAID + byAdmin≠true AND byTraveller≠true
//             activeTravellers: {
//               $sum: {
//                 $cond: [
//                   { $eq: ["$payment.advance.paid", true] },
//                   {
//                     $size: {
//                       $filter: {
//                         input: "$travellers", as: "t",
//                         cond: {
//                           $and: [
//                             { $ne: ["$$t.cancelled.byAdmin", true] },
//                             { $ne: ["$$t.cancelled.byTraveller", true] },
//                           ]
//                         }
//                       }
//                     }
//                   },
//                   0
//                 ]
//               }
//             },
//             cancelledTravellers: {
//               $sum: {
//                 $size: {
//                   $filter: {
//                     input: "$travellers", as: "t",
//                     cond: {
//                       $and: [
//                         { $eq: ["$$t.cancelled.byAdmin", true] },
//                         { $eq: ["$$t.cancelled.byTraveller", true] },
//                       ]
//                     }
//                   }
//                 }
//               }
//             },
//             rejectedTravellers: {
//               $sum: {
//                 $size: {
//                   $filter: {
//                     input: "$travellers", as: "t",
//                     cond: {
//                       $and: [
//                         { $eq: ["$$t.cancelled.byAdmin", true] },
//                         { $ne: ["$$t.cancelled.byTraveller", true] },
//                       ]
//                     }
//                   }
//                 }
//               }
//             },

//             // Unverified: advance NOT paid, AND byAdmin ≠ true (excludes
//             // travellers who were separately rejected/cancelled by admin).
//             unverifiedTravellers: {
//               $sum: {
//                 $cond: [
//                   { $ne: ["$payment.advance.paid", true] },
//                   {
//                     $size: {
//                       $filter: {
//                         input: "$travellers", as: "t",
//                         cond: { $ne: ["$$t.cancelled.byAdmin", true] }
//                       }
//                     }
//                   },
//                   0
//                 ]
//               }
//             },

//             // Cancel request: advance PAID + byTraveller=true AND byAdmin≠true
//             cancellationRequestTravellers: {
//               $sum: {
//                 $cond: [
//                   { $eq: ["$payment.advance.paid", true] },
//                   {
//                     $size: {
//                       $filter: {
//                         input: "$travellers", as: "t",
//                         cond: {
//                           $and: [
//                             { $eq: ["$$t.cancelled.byTraveller", true] },
//                             { $ne: ["$$t.cancelled.byAdmin", true] },
//                           ]
//                         }
//                       }
//                     }
//                   },
//                   0
//                 ]
//               }
//             },

//             completedBookings: {
//               $sum: {
//                 $cond: [{
//                   $and: [
//                     { $eq: ["$payment.advance.paid", true] },
//                     { $eq: ["$payment.balance.paid", true] },
//                   ]
//                 }, 1, 0]
//               }
//             },
//             activeBookings: {
//               $sum: {
//                 $cond: [{
//                   $and: [
//                     { $eq: ["$payment.advance.paid", true] },
//                     { $ne: ["$payment.balance.paid", true] },
//                   ]
//                 }, 1, 0]
//               }
//             },
//             unverifiedBookings: {
//               $sum: { $cond: [{ $ne: ["$payment.advance.paid", true] }, 1, 0] }
//             },

//             gvPool: { $sum: { $ifNull: ["$gvCancellationPool", 0] } },
//             irctcPool: { $sum: { $ifNull: ["$irctcCancellationPool", 0] } },
//           }
//         }
//       ]);

//       const toursThisMonth = await tourModel.find(
//         { _id: { $in: grp.tourIds } },
//         { available: 1, _id: 0 }
//       ).lean();
//       const availableTours = toursThisMonth.filter(t => t.available !== false).length;
//       const soldoutTours = toursThisMonth.filter(t => t.available === false).length;

//       return {
//         year: grp._id.year,
//         month: grp._id.month,
//         tourCount: grp.tourCount,
//         availableTours,
//         soldoutTours,
//         travellers: stats?.travellers || 0,
//         bookings: stats?.bookings || 0,
//         activeTravellers: stats?.activeTravellers || 0,
//         cancelledTravellers: stats?.cancelledTravellers || 0,
//         rejectedTravellers: stats?.rejectedTravellers || 0,
//         unverifiedTravellers: stats?.unverifiedTravellers || 0,
//         cancellationRequestTravellers: stats?.cancellationRequestTravellers || 0,
//         completedBookings: stats?.completedBookings || 0,
//         activeBookings: stats?.activeBookings || 0,
//         unverifiedBookings: stats?.unverifiedBookings || 0,
//         gvPool: stats?.gvPool || 0,
//         irctcPool: stats?.irctcPool || 0,
//       };
//     }));

//     return res.status(200).json({ success: true, data: result });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ════════════════════════════════════════════════════════════════
// //  4. CANCELLATION — year-wise + month-wise GV & IRCTC
// //  GET /api/touradmin/analytics-cancellation?view=year|month&year=2026
// //     ?view=year&fromYear=&toYear=                       (range mode)
// //     ?view=month&fromYear=&toYear=&fromMonth=&toMonth=   (range mode)
// // ════════════════════════════════════════════════════════════════
// const getAnalyticsCancellation = async (req, res) => {
//   try {
//     const { view = "year", year, fromYear, toYear, fromMonth, toMonth } = req.query;
//     const hasYearRange = fromYear || toYear;
//     const hasMonthRange = fromMonth || toMonth;

//     if (view === "month") {
//       const tourMatch = {};
//       const exprClauses = [];

//       if (hasYearRange) {
//         const yearExpr = { $year: "$lastBookingDate" };
//         if (fromYear) exprClauses.push({ $gte: [yearExpr, parseInt(fromYear)] });
//         if (toYear) exprClauses.push({ $lte: [yearExpr, parseInt(toYear)] });
//       } else {
//         const y = parseInt(year) || new Date().getFullYear();
//         tourMatch.lastBookingDate = { $gte: new Date(`${y}-01-01`), $lt: new Date(`${y + 1}-01-01`) };
//       }

//       if (hasMonthRange) {
//         const fm = fromMonth ? parseInt(fromMonth) : 1;
//         const tm = toMonth ? parseInt(toMonth) : 12;
//         const monthExpr = { $month: "$lastBookingDate" };
//         if (fm <= tm) {
//           exprClauses.push({ $gte: [monthExpr, fm] });
//           exprClauses.push({ $lte: [monthExpr, tm] });
//         } else {
//           exprClauses.push({ $or: [{ $gte: [monthExpr, fm] }, { $lte: [monthExpr, tm] }] });
//         }
//       }

//       if (exprClauses.length) {
//         tourMatch.$expr = exprClauses.length === 1 ? exprClauses[0] : { $and: exprClauses };
//       }

//       const groupKey = hasYearRange
//         ? { year: { $year: "$lastBookingDate" }, month: { $month: "$lastBookingDate" } }
//         : { $month: "$lastBookingDate" };

//       const toursByMonth = await tourModel.aggregate([
//         { $match: tourMatch },
//         {
//           $group: {
//             _id: groupKey,
//             tourIds: { $push: "$_id" },
//           }
//         },
//         { $sort: { _id: 1 } }
//       ]);

//       const result = await Promise.all(toursByMonth.map(async (mo) => {
//         const [stats] = await tourBookingModel.aggregate([
//           { $match: { tourId: { $in: mo.tourIds } } },
//           {
//             $group: {
//               _id: null,
//               gvPool: { $sum: { $ifNull: ["$gvCancellationPool", 0] } },
//               irctcPool: { $sum: { $ifNull: ["$irctcCancellationPool", 0] } },
//             }
//           }
//         ]);
//         const baseEntry = hasYearRange
//           ? { _id: mo._id.month, year: mo._id.year }
//           : { _id: mo._id, year: parseInt(year) || new Date().getFullYear() };
//         return { ...baseEntry, gvPool: stats?.gvPool || 0, irctcPool: stats?.irctcPool || 0 };
//       }));

//       return res.status(200).json({ success: true, data: result });
//     }

//     // Year-wise (default)
//     const yearMatch = {};
//     if (hasYearRange) {
//       const yearExpr = { $year: "$lastBookingDate" };
//       const clauses = [];
//       if (fromYear) clauses.push({ $gte: [yearExpr, parseInt(fromYear)] });
//       if (toYear) clauses.push({ $lte: [yearExpr, parseInt(toYear)] });
//       yearMatch.$expr = clauses.length === 1 ? clauses[0] : { $and: clauses };
//     }

//     const toursByYear = await tourModel.aggregate([
//       ...(Object.keys(yearMatch).length ? [{ $match: yearMatch }] : []),
//       { $group: { _id: { $year: "$lastBookingDate" }, tourIds: { $push: "$_id" } } },
//       { $sort: { _id: 1 } }
//     ]);

//     const result = await Promise.all(toursByYear.map(async (yr) => {
//       const [stats] = await tourBookingModel.aggregate([
//         {
//           $match: {
//             tourId: { $in: yr.tourIds }, $or: [
//               { gvCancellationPool: { $gt: 0 } },
//               { irctcCancellationPool: { $gt: 0 } },
//             ]
//           }
//         },
//         {
//           $group: {
//             _id: null,
//             gvPool: { $sum: { $ifNull: ["$gvCancellationPool", 0] } },
//             irctcPool: { $sum: { $ifNull: ["$irctcCancellationPool", 0] } },
//           }
//         }
//       ]);
//       return { _id: yr._id, gvPool: stats?.gvPool || 0, irctcPool: stats?.irctcPool || 0 };
//     }));

//     return res.status(200).json({ success: true, data: result });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ════════════════════════════════════════════════════════════════
// //  5. TOUR LIST TABLE
// //  GET /api/touradmin/analytics-tour-list?year=&month=&type=&status=&tourId=
// //     ?fromYear=&toYear=&fromMonth=&toMonth=&type=&status=&tourId=  (range mode)
// // ════════════════════════════════════════════════════════════════
// const getAnalyticsTourList = async (req, res) => {
//   try {
//     const { year, month, type, status, tourId, fromYear, toYear, fromMonth, toMonth } = req.query;
//     const tourIds = tourId ? tourId.split(",") : [];

//     const tourQuery = buildTourDateQuery({ year, month, fromYear, toYear, fromMonth, toMonth });
//     if (tourIds.length) {
//       tourQuery._id = { $in: tourIds.map(id => new mongoose.Types.ObjectId(id)) };
//     }
//     if (type) tourQuery.batch = { $regex: type, $options: "i" };

//     const allTours = await tourModel.find(
//       tourQuery,
//       { title: 1, batch: 1, available: 1, lastBookingDate: 1 }
//     ).sort({ lastBookingDate: -1 }).lean();

//     if (!allTours.length) return res.status(200).json({ success: true, data: [] });

//     const allTourIds = allTours.map(t => t._id);
//     const bookingData = await getBookingStatsByTourIds(allTourIds);
//     let result = mergeTourBooking(allTours, bookingData);

//     if (status) {
//       result = result.filter(t => {
//         if (status === "Completed") return t.isCompleted === 1;
//         if (status === "Soldout") return t.isCompleted === 0 && t.available === false;
//         if (status === "Available") return t.isCompleted === 0 && t.available !== false;
//         return true;
//       });
//     }

//     return res.status(200).json({ success: true, data: result });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ════════════════════════════════════════════════════════════════
// //  6. TOUR SEARCH
// //  GET /api/touradmin/analytics-search?q=KER&year=2026&month=8
// //     ?q=&fromYear=&toYear=&fromMonth=&toMonth=&status=   (range mode)
// // ════════════════════════════════════════════════════════════════
// const searchAnalyticsTours = async (req, res) => {
//   try {
//     const { q, year, month, status, fromYear, toYear, fromMonth, toMonth } = req.query;
//     if (!q) return res.status(400).json({ success: false, message: "Query 'q' required" });

//     const tourQuery = {
//       title: { $regex: `^${q}`, $options: "i" },
//       ...buildTourDateQuery({ year, month, fromYear, toYear, fromMonth, toMonth }),
//     };

//     const tourDocs = await tourModel.find(
//       tourQuery,
//       { title: 1, batch: 1, available: 1, lastBookingDate: 1 }
//     ).limit(30).lean();

//     if (!tourDocs.length) return res.status(200).json({ success: true, data: [] });

//     const allTourIds = tourDocs.map(t => t._id);
//     const bookingData = await getBookingStatsByTourIds(allTourIds);
//     let result = mergeTourBooking(tourDocs, bookingData);

//     if (status) {
//       result = result.filter(t => {
//         if (status === "Completed") return t.isCompleted === 1;
//         if (status === "Active") return t.isCompleted === 0;
//         return true;
//       });
//     }

//     return res.status(200).json({ success: true, data: result });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

// export {
//   loginAdmin,
//   allTours,
//   changeTourAvailability,
//   addTour,
//   tourAdminDashboard,
//   bookingsAdmin,
//   getBookings,
//   getCancellationChart,
//   upsertCancellationChart,
//   getCancellations,
//   approveCancellation,
//   rejectCancellation,
//   bookingRelease,
//   // addMissingFieldsToAllBookings,
//   getPendingApprovals,
//   approveBookingUpdate,
//   rejectBookingUpdate,
//   getAllUsers,
//   adminBookingsTour,
//   adminTourList,
//   adminAllotRooms,
//   bookingRejectAdmin,
//   generateMissingTNRs,
//   addTermsPoints,
//   deleteTermsPoint,
//   getCurrentTerms,
//   submitTermsAgreement,
//   getBookingSummaryByTNR,
//   adminCreateTourVehicle,
//   adminUpdateTourVehicle,
//   adminToggleVehicleSeatSelection,
//   adminGetTourVehicles,
//   adminDeleteTourVehicle,
//   getAllPaymentMethods,
//   adminFetchTourVehicleSeatOverview,
//   deleteBookingByTNR,
//   // ─── Export — add these to existing export {} block ──────────
//   getAnalyticsSummary,
//   getAnalyticsYearWise,
//   getAnalyticsMonthWise,
//   getAnalyticsCancellation,
//   getAnalyticsTourList,
//   searchAnalyticsTours,

// };

// import mongoose from "mongoose";

// import { v2 as cloudinary } from "cloudinary";
// import jwt from "jsonwebtoken";

// import tourModel from "../models/tourModel.js";
// import userModel from "../models/userModel.js";
// import Terms from "../models/termModel.js";
// import tourBookingModel from "../models/tourBookingmodel.js";
// import cancelRuleModel from "../models/cancelRuleModel.js";
// import cancellationModel from "../models/cancellationModel.js";
// import tourRoomAllocationModel from "../models/roomModel.js";
// import manageBookingModel from "../models/manageBookingModel.js";
// import TourVehicle from "../models/tourVehicleModel.js";
// import PaymentMethod from "../models/paymentModel.js";

// // controllers/adminController.js   (or wherever your admin controllers live)

// // Helper function to generate 6-char TNR in format: AAA9AA
// function generateTNR() {
//   const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
//   const digits = "0123456789";

//   // Position 1-2: uppercase letters
//   let code =
//     letters.charAt(Math.floor(Math.random() * letters.length)) +
//     letters.charAt(Math.floor(Math.random() * letters.length));

//   // Position 3-4: digits
//   code +=
//     digits.charAt(Math.floor(Math.random() * digits.length)) +
//     digits.charAt(Math.floor(Math.random() * digits.length));

//   // Position 5-6: uppercase letters
//   code +=
//     letters.charAt(Math.floor(Math.random() * letters.length)) +
//     letters.charAt(Math.floor(Math.random() * letters.length));

//   return code;
// }

// async function generateMissingTNRs(req, res) {
//   try {
//     // 1. Find all bookings without tnr
//     const bookingsWithoutTNR = await tourBookingModel
//       .find({ tnr: { $exists: false } })
//       .select("_id tnr bookingDate contact.email userId")
//       .lean();

//     const count = bookingsWithoutTNR.length;

//     if (count === 0) {
//       return res.status(200).json({
//         success: true,
//         message: "No bookings are missing TNR. All bookings already have one.",
//         processed: 0,
//         totalChecked: await tourBookingModel.countDocuments(),
//       });
//     }

//     console.log(`Found ${count} bookings without TNR → starting generation...`);

//     let successCount = 0;
//     let collisionCount = 0;
//     let failed = [];

//     // Process in smaller batches to avoid memory issues
//     for (const booking of bookingsWithoutTNR) {
//       let attempts = 0;
//       let tnr = null;

//       while (attempts < 15) {
//         const candidate = generateTNR();

//         // Check if this TNR already exists
//         const conflict = await tourBookingModel.exists({ tnr: candidate });

//         if (!conflict) {
//           tnr = candidate;
//           break;
//         }

//         collisionCount++;
//         attempts++;
//       }

//       if (!tnr) {
//         failed.push({
//           bookingId: booking._id.toString(),
//           reason: "Could not generate unique TNR after 15 attempts",
//         });
//         continue;
//       }

//       // Update the booking
//       await tourBookingModel.updateOne({ _id: booking._id }, { $set: { tnr } });

//       successCount++;

//       // Optional: log first few for debugging
//       if (successCount <= 5) {
//         console.log(`Assigned TNR ${tnr} to booking ${booking._id}`);
//       }
//     }

//     const message =
//       successCount === count
//         ? `Successfully generated TNR for all ${count} missing bookings.`
//         : `Processed ${count} bookings: ${successCount} updated, ${failed.length} failed.`;

//     return res.status(200).json({
//       success: true,
//       message,
//       summary: {
//         totalMissing: count,
//         successfullyUpdated: successCount,
//         collisionsDuringGeneration: collisionCount,
//         failed: failed.length,
//       },
//       failedBookings: failed.length > 0 ? failed : undefined,
//     });
//   } catch (error) {
//     console.error("generateMissingTNRs failed:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to generate missing TNRs",
//       error: error.message,
//     });
//   }
// }
// //API for the admin login
// const loginAdmin = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (
//       email === process.env.ADMIN_EMAIL &&
//       password === process.env.ADMIN_PASSWORD
//     ) {
//       const token = jwt.sign(email + password, process.env.JWT_SECRET);
//       res.json({
//         success: true,
//         token,
//       });
//     } else {
//       res.json({
//         success: false,
//         message: "Invalid credentials",
//       });
//     }
//   } catch (error) {
//     console.log(error);
//     res.json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// //THIS CONTROLLER IS USED IN TOUR CONTROLERS AND DATA PAGE
// const allTours = async (req, res) => {
//   try {
//     const tours = await tourModel.find({}).select("-password");
//     res.json({ success: true, tours });
//   } catch (error) {
//     console.log(error);
//     res.json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
// //CHANGES THE AVAILABLITY OF TOUR
// const changeTourAvailability = async (req, res) => {
//   try {
//     const { tourId } = req.body; // ✅ Use tourId here

//     const tourData = await tourModel.findById(tourId);

//     if (!tourData) {
//       return res.json({ success: false, message: "Tour not found" });
//     }

//     await tourModel.findByIdAndUpdate(tourId, {
//       available: !tourData.available,
//     });

//     res.json({ success: true, message: "Availability changed" });
//   } catch (error) {
//     console.log(error);
//     res.json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// //Add tour controller
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

// const tourAdminDashboard = async (req, res) => {
//   try {
//     const tours = await tourModel.find({});
//     const users = await userModel.find({});
//     const bookings = await tourBookingModel.find({});
//     const dashData = {
//       tours: tours.length,
//       bookings: bookings.length,
//       users: users.length,
//       latestAppointments: bookings.reverse().slice(0, 5),
//     };
//     res.json({ success: true, dashData });
//   } catch (error) {
//     console.log(error);
//     res.json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// //API to get all BOOKINGS

// const bookingsAdmin = async (req, res) => {
//   try {
//     const bookings = await tourBookingModel.find({});
//     res.json({ success: true, bookings });
//   } catch (error) {
//     console.log(error);
//     res.json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// //WORKS SAME LIKE BOOKINGS ADMIN BUT LINKED TO CONTEXT SO NEEDED
// const getBookings = async (req, res) => {
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
//     console.error("Error in getBookings:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch all bookings",
//       error: error.message,
//     });
//   }
// };

// //ALL CONTROLLERS RELATED TO CANCLLATION START FROM HERE

// // GET (with auto-create default)
// const getCancellationChart = async (req, res) => {
//   try {
//     let chart = await cancelRuleModel.findOne();

//     if (!chart) {
//       chart = await cancelRuleModel.create({
//         gv: {
//           advancePaid: {
//             tiers: [{ fromDays: 30, toDays: 15, percentage: 50 }],
//           },
//           fullyPaid: { tiers: [{ fromDays: 30, toDays: 15, percentage: 100 }] },
//         },
//         irctc: [
//           { classType: "SL", noOfDays: 7, fixedAmount: 60, percentage: 50 },
//         ],
//       });
//     }

//     res.status(200).json({ success: true, data: chart });
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ success: false, message: "Failed to fetch chart" });
//   }
// };

// // UPDATE CANCELLATION CHART (or create if not exists)
// const upsertCancellationChart = async (req, res) => {
//   try {
//     const { gv, irctc } = req.body;
//     let chart = await cancelRuleModel.findOne();

//     if (chart) {
//       chart.gv = gv ?? chart.gv;
//       chart.irctc = irctc ?? chart.irctc;
//       chart = await chart.save();
//     } else {
//       chart = await cancelRuleModel.create({ gv, irctc });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Updated",
//       data: chart,
//     });
//   } catch (error) {
//     console.error("Upsert error:", error);
//     res.status(500).json({ success: false, message: "Failed to update" });
//   }
// };

// const getCancellations = async (req, res) => {
//   try {
//     // 1. Find cancellation docs that are RAISED but NOT YET APPROVED
//     const pendingCancellations = await cancellationModel
//       .find({
//         raisedBy: true,
//         $or: [{ approvedBy: { $exists: false } }, { approvedBy: false }],
//       })
//       .select("-__v")
//       .lean();

//     if (!pendingCancellations.length) {
//       return res.json({ success: true, data: [] });
//     }

//     // 2. Extract TNRs (instead of bookingIds)
//     const tnrs = [
//       ...new Set(pendingCancellations.map((c) => c.tnr).filter(Boolean)),
//     ];

//     // 3. Fetch bookings by TNR + filter travellers on server side
//     const bookings = await tourBookingModel
//       .find({ tnr: { $in: tnrs } })
//       .select("tnr travellers cancelled")
//       .lean();

//     // Helper: does the booking contain a traveller cancelled **by traveller only** OR **by admin only**?
//     const hasValidTravellerCancellation = (booking) => {
//       return booking.travellers.some(
//         (t) =>
//           (t.cancelled?.byTraveller === true &&
//             t.cancelled?.byAdmin === false) ||
//           (t.cancelled?.byAdmin === true &&
//             t.cancelled?.byTraveller === false) ||
//           (t.cancelled?.byAdmin === true && t.cancelled?.byTraveller === true),
//       );
//     };

//     const validTnrs = bookings
//       .filter(hasValidTravellerCancellation)
//       .map((b) => b.tnr);

//     // 4. Keep only cancellation docs whose TNR passed the traveller check
//     const result = pendingCancellations.filter(
//       (c) => c.tnr && validTnrs.includes(c.tnr),
//     );

//     // 5. Populate booking & traveller data for the frontend (using TNR)
//     const enriched = await Promise.all(
//       result.map(async (c) => {
//         const booking = await tourBookingModel
//           .findOne({ tnr: c.tnr })
//           .select(
//             "tnr userId tourId travellers contact bookingDate payment adminRemarks",
//           )
//           .populate({
//             path: "travellers",
//             match: {
//               $or: [
//                 { "cancelled.byTraveller": true, "cancelled.byAdmin": false },
//               ],
//             },
//             select: "title firstName lastName age gender sharingType cancelled",
//           })
//           .lean();

//         return { ...c, booking };
//       }),
//     );

//     res.json({ success: true, data: enriched });
//   } catch (err) {
//     console.error("getCancellations error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// const approveCancellation = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { tnr, travellerIds, cancellationId } = req.body;

//     if (!tnr || !travellerIds || !cancellationId) {
//       return res.status(400).json({
//         success: false,
//         message: "tnr, travellerIds, and cancellationId are required",
//       });
//     }

//     const normalizedTnr = tnr.trim().toUpperCase();

//     const cancellation = await cancellationModel
//       .findOne({
//         _id: cancellationId,
//         tnr: normalizedTnr,
//         raisedBy: true,
//         approvedBy: { $ne: true },
//       })
//       .session(session);

//     if (!cancellation) {
//       return res.status(404).json({
//         success: false,
//         message: "Cancellation request not found or already processed",
//       });
//     }

//     const booking = await tourBookingModel
//       .findOne({ tnr: normalizedTnr })
//       .select(
//         "tnr travellers gvCancellationPool irctcCancellationPool cancellationRequest payment contact.mobile",
//       )
//       .session(session);

//     if (!booking) throw new Error("Booking not found");

//     // === PENDING TRAVELLERS ===
//     const pendingTravellers = (booking.travellers || []).filter(
//       (t) => t.cancelled?.byTraveller === true && t.cancelled?.byAdmin !== true,
//     );

//     const pendingCount = pendingTravellers.length;
//     const requestedCount = (cancellation.travellerIds || []).length;

//     // Build name list
//     const getName = (t) =>
//       `${t.title || ""} ${t.firstName || ""} ${t.lastName || ""}`.trim() ||
//       "Unknown Traveller";

//     const pendingNames = pendingTravellers.map(getName);
//     const requestedNames = (cancellation.travellerIds || []).map((id) => {
//       const t = booking.travellers.find(
//         (trav) => trav._id.toString() === id.toString(),
//       );
//       return t ? getName(t) : `Deleted Traveller (ID: ${id})`;
//     });

//     // === COUNT MISMATCH ===
//     if (pendingCount !== requestedCount) {
//       return res.status(400).json({
//         success: false,
//         message: `CANCELLATION BLOCKED: Traveller count mismatch

// User requested : ${pendingCount} traveller(s)
// Admin calculated : ${requestedCount} traveller(s)

// User requested: ${pendingNames.join(", ") || "None"}
// But Admin worked: ${requestedNames.join(", ") || "None"}

// Kindly reject this and raise new request`,
//         details: {
//           pendingTravellers: pendingTravellers.map((t) => ({
//             name: getName(t),
//             id: t._id.toString(),
//             age: t.age,
//             gender: t.gender,
//           })),
//           requestedTravellers: requestedNames,
//           pendingCount,
//           requestedCount,
//         },
//       });
//     }

//     // === ID MISMATCH ===
//     const pendingIds = pendingTravellers.map((t) => t._id.toString()).sort();
//     const requestIds = (cancellation.travellerIds || [])
//       .map((id) => id.toString())
//       .sort();

//     const idsMatch =
//       pendingIds.length === requestIds.length &&
//       pendingIds.every((id, i) => id === requestIds[i]);

//     if (!idsMatch) {
//       return res.status(400).json({
//         success: false,
//         message: `SECURITY BLOCKED: Wrong travellers detected!

// User requested:
// → ${pendingNames.join("\n→ ") || "None"}

// But Admin worked:
// → ${requestedNames.join("\n→ ") || "None"}

// Kindly reject this and raise new request`,
//         details: {
//           pendingTravellers: pendingTravellers.map((t) => ({
//             name: getName(t),
//             id: t._id.toString(),
//           })),
//           requestedTravellers: requestedNames.map((name, i) => ({
//             name,
//             id: requestIds[i],
//           })),
//           securityNote: "Only exact matching travellers can be cancelled",
//         },
//       });
//     }

//     // === ALL GOOD — APPROVE ===
//     const gvAdd =
//       (cancellation.gvCancellationAmount || 0) +
//       (cancellation.remarksAmount || 0);
//     const irctcAdd = cancellation.irctcCancellationAmount || 0;

//     const newGvPool = (booking.gvCancellationPool || 0) + gvAdd;
//     const newIrctcPool = (booking.irctcCancellationPool || 0) + irctcAdd;
//     const finalBalance = Math.max(0, cancellation.updatedBalance || 0);

//     const setObj = {
//       gvCancellationPool: newGvPool,
//       irctcCancellationPool: newIrctcPool,
//       cancellationRequest: false,
//       cancellationReceipt: true,
//       "payment.balance.amount": Number(finalBalance),
//     };

//     if (finalBalance === 0) {
//       setObj["payment.balance.paid"] = true;
//       setObj["payment.balance.paymentVerified"] = true;
//       setObj["payment.balance.paidAt"] = new Date();
//     }

//     // === Prepare arrayFilters for positional updates ===
//     const arrayFilters = [];

//     // === NEW: Clear seat lock & seat number for approved travellers ===
//     pendingTravellers.forEach((t, i) => {
//       const elemKey = `elem${i}`;
//       setObj[`travellers.$[${elemKey}].cancelled.byAdmin`] = true;
//       setObj[`travellers.$[${elemKey}].cancelled.cancelledAt`] = new Date();

//       // Clear seat allocation
//       setObj[`travellers.$[${elemKey}].seatNumber`] = null;
//       setObj[`travellers.$[${elemKey}].seatLocked`] = false;
//       setObj[`travellers.$[${elemKey}].seatLockedAt`] = null;

//       // Add filter for this traveller's _id
//       arrayFilters.push({ [`${elemKey}._id`]: t._id });
//     });

//     // === Update booking with all changes ===
//     await tourBookingModel.updateOne(
//       { tnr: normalizedTnr },
//       { $set: setObj },
//       { arrayFilters, session, new: true },
//     );

//     // === NEW: Remove from bookedSeats in tourVehicleModel ===
//     for (const traveller of pendingTravellers) {
//       const seatNumber = traveller.seatNumber;
//       if (!seatNumber) continue; // no seat was locked

//       // Find the vehicle that has this exact seat booked for this booking
//       const vehicle = await TourVehicle.findOne(
//         {
//           "bookedSeats.seatNumber": seatNumber,
//           "bookedSeats.bookingId": booking._id,
//           "bookedSeats.travellerIndex": booking.travellers.indexOf(traveller),
//         },
//         { _id: 1, bookedSeats: 1 },
//       ).session(session);

//       if (vehicle) {
//         // Remove the matching booked seat entry
//         await TourVehicle.updateOne(
//           { _id: vehicle._id },
//           {
//             $pull: {
//               bookedSeats: {
//                 seatNumber: seatNumber,
//                 bookingId: booking._id,
//               },
//             },
//           },
//           { session },
//         );
//       }
//     }

//     // Approve the cancellation record
//     await cancellationModel.findByIdAndUpdate(
//       cancellationId,
//       { approvedBy: true, approvedAt: new Date(), raisedBy: false },
//       { session },
//     );

//     await session.commitTransaction();

//     return res.json({
//       success: true,
//       message: `Cancellation approved successfully!

// Cancelled: ${pendingNames.join(", ")}

// New balance: ₹${finalBalance} ${finalBalance === 0 ? "(Fully Paid)" : ""}`,
//       data: {
//         cancelledTravellers: pendingNames,
//         cancelledCount: pendingCount,
//         newBalance: finalBalance,
//         balancePaid: finalBalance === 0,
//         tnr: normalizedTnr,
//         seatsReleased: pendingTravellers
//           .map((t) => t.seatNumber)
//           .filter(Boolean),
//       },
//     });
//   } catch (err) {
//     await session.abortTransaction();
//     console.error("approveCancellation error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server error during approval. Please try again.",
//     });
//   } finally {
//     session.endSession();
//   }
// };

// const rejectCancellation = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { tnr, travellerIds, cancellationId } = req.body;

//     // === VALIDATION ===
//     if (
//       !tnr ||
//       !cancellationId ||
//       !Array.isArray(travellerIds) ||
//       travellerIds.length === 0
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "tnr, cancellationId, and travellerIds array are required",
//       });
//     }

//     const normalizedTnr = tnr.trim().toUpperCase();

//     const cancellation = await cancellationModel
//       .findOne({
//         _id: cancellationId,
//         tnr: normalizedTnr,
//         raisedBy: true,
//       })
//       .session(session);

//     if (!cancellation) {
//       return res.status(404).json({
//         success: false,
//         message: "Cancellation request not found or already processed",
//       });
//     }

//     // Ensure all requested travellerIds are part of this cancellation
//     const cancellationTravellerIds = cancellation.travellerIds.map((id) =>
//       id.toString(),
//     );
//     const missing = travellerIds.filter(
//       (id) => !cancellationTravellerIds.includes(id.toString()),
//     );
//     if (missing.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Some travellerIds do not belong to this cancellation",
//         missing,
//       });
//     }

//     // === ONLY UPDATE CANCELLATION MODEL ===
//     await cancellationModel.findByIdAndUpdate(
//       cancellationId,
//       {
//         raisedBy: false,
//         approvedBy: false,
//         rejectedAt: new Date(),
//       },
//       { session },
//     );

//     // === Clear cancellationRequest in main booking ===
//     await tourBookingModel.updateOne(
//       { tnr: normalizedTnr },
//       { $set: { cancellationRequest: false } },
//       { session },
//     );

//     await session.commitTransaction();

//     return res.json({
//       success: true,
//       message: "Cancellation request rejected successfully",
//       data: {
//         tnr: normalizedTnr,
//         travellerIds,
//         cancellationId,
//         cancellationRequestCleared: true,
//         rejectedAt: new Date(),
//       },
//     });
//   } catch (err) {
//     await session.abortTransaction();
//     console.error("rejectCancellation error:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   } finally {
//     session.endSession();
//   }
// };
// //REJECTING CANCELLATION IN DASHBOARD SO THAT USER END WILL GET UPDATED
// const bookingRelease = async (req, res) => {
//   try {
//     const { tnr, travellerIds = [] } = req.body;

//     // 1. Validate input
//     if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid 6-character TNR is required",
//       });
//     }

//     if (!Array.isArray(travellerIds) || travellerIds.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "travellerIds[] array is required and cannot be empty",
//       });
//     }

//     // Normalize TNR (uppercase, trim)
//     const normalizedTnr = tnr.trim().toUpperCase();

//     // 2. Fetch booking by TNR
//     const booking = await tourBookingModel.findOne({ tnr: normalizedTnr });
//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: `Booking with TNR ${normalizedTnr} not found`,
//       });
//     }

//     const releasedTravellers = [];
//     const notFoundTravellers = [];
//     const notEligibleTravellers = [];

//     const idsSet = new Set(travellerIds.map(String));

//     // 3. Process travellers
//     booking.travellers = booking.travellers.map((traveller) => {
//       const travellerIdStr = String(traveller._id);

//       if (idsSet.has(travellerIdStr)) {
//         const { cancelled } = traveller;

//         // Only release if cancelled by traveller AND NOT by admin
//         if (cancelled?.byTraveller && !cancelled?.byAdmin) {
//           traveller.cancelled.byTraveller = false;
//           traveller.cancelled.releasedAt = new Date();
//           traveller.cancelled.releasedBy = "admin"; // optional: track who released
//           releasedTravellers.push(travellerIdStr);
//         } else {
//           notEligibleTravellers.push(travellerIdStr);
//         }
//       }

//       return traveller;
//     });

//     // 4. Identify any travellerIds that weren't found in this booking
//     travellerIds.forEach((id) => {
//       if (!booking.travellers.some((t) => String(t._id) === String(id))) {
//         notFoundTravellers.push(id);
//       }
//     });

//     // 5. If nothing was released, return detailed failure
//     if (releasedTravellers.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "No travellers were released. Only traveller-initiated cancellations (not admin-rejected) can be released.",
//         details: {
//           notFoundTravellers,
//           notEligibleTravellers,
//         },
//       });
//     }

//     // 6. Save updated booking
//     await booking.save();

//     // 7. Success response
//     res.json({
//       success: true,
//       message: `Released ${releasedTravellers.length} traveller(s) successfully`,
//       tnr: normalizedTnr,
//       releasedTravellers,
//       notFoundTravellers,
//       notEligibleTravellers,
//     });
//   } catch (error) {
//     console.error("bookingRelease error:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message || "Server error during release",
//     });
//   }
// };

// //DANZOR ZONE FUNCTION------DONT TOUCH THIS

// // const addMissingFieldsToAllBookings = async (req, res) => {
// //   try {
// //     const totalBookings = await tourBookingModel.countDocuments();

// //     // ─── Step 1: Add all missing fields ───────────────────────────────
// //     const result = await tourBookingModel.updateMany(
// //       {
// //         $or: [
// //           { manageBooking: { $exists: false } },
// //           { advanceAdminRemarks: { $exists: false } },
// //           { cancellationRequest: { $exists: false } },
// //           { cancellationReceipt: { $exists: false } },
// //           { manageBookingReceipt: { $exists: false } },
// //           { emergencyContact: { $exists: false } },
// //           { termsAgreed: { $exists: false } },
// //           { termsAgreedAt: { $exists: false } },
// //           { "travellers.seatNumber": { $exists: false } },
// //           { "travellers.seatLocked": { $exists: false } },
// //           { "travellers.vehicleId": { $exists: false } },
// //           { "travellers.vehicleName": { $exists: false } },
// //           // ✅ NEW — cancellation pool fields
// //           { gvCancellationPool: { $exists: false } },
// //           { irctcCancellationPool: { $exists: false } },
// //         ],
// //       },
// //       {
// //         $set: {
// //           manageBooking: false,
// //           advanceAdminRemarks: [],
// //           cancellationRequest: false,
// //           cancellationReceipt: false,
// //           manageBookingReceipt: false,
// //           emergencyContact: null,
// //           termsAgreed: false,
// //           termsAgreedAt: null,
// //           "travellers.$[].seatNumber": null,
// //           "travellers.$[].seatLocked": false,
// //           "travellers.$[].seatLockedAt": null,
// //           "travellers.$[].vehicleId": null,
// //           "travellers.$[].vehicleName": null,
// //         },
// //       },
// //     );

// //     // ─── Step 2: cancellation pool — SEPARATE updateMany ──────────────
// //     // ✅ Separate ஆ பண்றோம் — already value இருக்கற docs overwrite ஆகாம இருக்கும்
// //     const poolResult = await tourBookingModel.updateMany(
// //       {
// //         $or: [
// //           { gvCancellationPool: { $exists: false } },
// //           { irctcCancellationPool: { $exists: false } },
// //         ],
// //       },
// //       {
// //         $set: {
// //           gvCancellationPool: 0,
// //           irctcCancellationPool: 0,
// //         },
// //       },
// //     );

// //     res.status(200).json({
// //       success: true,
// //       message: "Migration completed successfully!",
// //       data: {
// //         totalBookings,
// //         step1: {
// //           matchedCount: result.matchedCount,
// //           modifiedCount: result.modifiedCount,
// //           fieldsEnsured: [
// //             "manageBooking",
// //             "advanceAdminRemarks",
// //             "cancellationRequest",
// //             "cancellationReceipt",
// //             "manageBookingReceipt",
// //             "emergencyContact",
// //             "termsAgreed",
// //             "termsAgreedAt",
// //             "travellers.seatNumber",
// //             "travellers.seatLocked",
// //             "travellers.seatLockedAt",
// //             "travellers.vehicleId",
// //             "travellers.vehicleName",
// //           ],
// //         },
// //         step2: {
// //           matchedCount: poolResult.matchedCount,
// //           modifiedCount: poolResult.modifiedCount,
// //           fieldsEnsured: [
// //             "gvCancellationPool → 0 (only missing docs)",
// //             "irctcCancellationPool → 0 (only missing docs)",
// //           ],
// //           note: "Existing cancellation pool values were NOT overwritten ✅",
// //         },
// //       },
// //     });
// //   } catch (error) {
// //     console.error("Migration failed:", error);
// //     res.status(500).json({
// //       success: false,
// //       message: "Migration failed",
// //       error: error.message,
// //     });
// //   }
// // };


// //MANAGE BOOKING RELATED CONTROLLER GET PENDING APPROVALS
// const getPendingApprovals = async (req, res) => {
//   try {
//     const pendingBookings = await manageBookingModel
//       .find({
//         manageBooking: true,
//         raisedBy: true,
//       })
//       .populate({
//         path: "userId",
//         select: "name email mobile",
//       })
//       .populate({
//         path: "tourId",
//         select: "title destination startDate endDate thumbnail",
//       })
//       .populate({
//         path: "bookingId",
//         select:
//           "tnr travellers contact bookingType payment receipts bookingDate gvCancellationPool irctcCancellationPool adminRemarks",
//         populate: {
//           path: "tourId",
//           select: "title",
//         },
//       })
//       .sort({ bookingDate: -1 })
//       .select("-__v")
//       .lean();

//     // Ensure travellers in original booking also have _id
//     pendingBookings.forEach((mb) => {
//       if (mb.bookingId?.travellers) {
//         mb.bookingId.travellers = mb.bookingId.travellers.map((t) => ({
//           ...t,
//           _id: t._id || new mongoose.Types.ObjectId(), // fallback (should never happen)
//         }));
//       }
//     });

//     return res.status(200).json({
//       success: true,
//       message:
//         pendingBookings.length > 0
//           ? "Pending approvals fetched successfully."
//           : "No pending approvals found.",
//       count: pendingBookings.length,
//       data: pendingBookings,
//     });
//   } catch (error) {
//     console.error("Error in getPendingApprovals:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch pending approvals.",
//       error: error.message,
//     });
//   }
// };

// //APPROVE THE BOOKING UPDATE REQUEST IN THE MANAGE BOOKING APPROVALS PAGE

// const approveBookingUpdate = async (req, res) => {
//   try {
//     const { bookingId } = req.body;

//     if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid bookingId is required",
//       });
//     }

//     // Step 1: Find pending manageBooking request
//     const manageBooking = await manageBookingModel
//       .findOne({ bookingId, approvedBy: false, raisedBy: true })
//       .lean();

//     if (!manageBooking) {
//       return res.status(404).json({
//         success: false,
//         message: "No pending update request found for this booking",
//       });
//     }

//     if (manageBooking.approvedBy) {
//       return res.status(400).json({
//         success: false,
//         message: "This update has already been approved",
//       });
//     }

//     // Validate amounts
//     if (
//       manageBooking.updatedAdvance === undefined ||
//       manageBooking.updatedBalance === undefined
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "updatedAdvance and updatedBalance are required",
//       });
//     }

//     // Step 2: Prepare update for tourBooking
//     const updateData = {
//       $set: {
//         "payment.advance.amount": manageBooking.updatedAdvance,
//         "payment.balance.amount": manageBooking.updatedBalance,
//         travellers: manageBooking.travellers,
//         contact: manageBooking.contact,
//         billingAddress: manageBooking.billingAddress,
//         adminRemarks: manageBooking.adminRemarks || [],
//         manageBooking: false,
//         manageBookingReceipt: true,
//       },
//     };

//     // Only if travellers were reduced in this request → reset paid flags + receipt flags
//     if (manageBooking.travellersReduced === true) {
//       updateData.$set["payment.advance.paid"] = false;
//       updateData.$set["payment.advance.paymentVerified"] = false; // optional clean-up
//       updateData.$set["receipts.advanceReceiptSent"] = false;
//       updateData.$set["receipts.advanceReceiptSentAt"] = null;
//     }

//     // Step 3: Apply update to original booking
//     const updatedTourBooking = await tourBookingModel.findByIdAndUpdate(
//       bookingId,
//       updateData,
//       { new: true, runValidators: true },
//     );

//     if (!updatedTourBooking) {
//       return res.status(404).json({
//         success: false,
//         message: "Original booking not found",
//       });
//     }

//     // Step 4: Mark manageBooking as approved
//     await manageBookingModel.findOneAndUpdate(
//       { _id: manageBooking._id },
//       { $set: { approvedBy: true, raisedBy: false, manageBooking: false } },
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Booking update approved and applied successfully",
//       data: {
//         updatedBooking: updatedTourBooking,
//         approvedRequestId: manageBooking._id,
//       },
//     });
//   } catch (error) {
//     console.error("Error in approveBookingUpdate:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };
// //REJECT THE BOOKING UPDATE REQUEST IN THE MANAGE BOOKING APPROVALS PAGE
// const rejectBookingUpdate = async (req, res) => {
//   try {
//     const { bookingId, remark } = req.body; // remark is optional

//     // --- 1. Validate bookingId ---
//     if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid bookingId is required",
//       });
//     }

//     // --- 2. Find the pending manageBooking request ---
//     const manageBooking = await manageBookingModel
//       .findOne({
//         bookingId,
//         approvedBy: false,
//         manageBooking: true,
//       })
//       .lean();

//     if (!manageBooking) {
//       return res.status(404).json({
//         success: false,
//         message: "No pending update request found for this booking",
//       });
//     }

//     // --- 3. Prepare update: reject the request ---
//     const updatePayload = {
//       $set: {
//         manageBooking: false,
//         raisedBy: false,
//         // Optional: mark as rejected (you can add a field if needed)
//       },
//       $push: {
//         adminRemarks: {
//           remark: remark || "Update request rejected by admin",
//           amount: 0,
//           addedAt: new Date(),
//         },
//       },
//     };

//     // --- 4. Apply the update ---
//     const updated = await manageBookingModel.findByIdAndUpdate(
//       manageBooking._id,
//       updatePayload,
//       { new: true, runValidators: true },
//     );

//     // --- 5. Success response ---
//     return res.status(200).json({
//       success: true,
//       message: "Booking update request rejected successfully",
//       data: {
//         rejectedRequestId: updated._id,
//         bookingId: updated.bookingId,
//       },
//     });
//   } catch (error) {
//     console.error("rejectBookingUpdate error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

// //GET ALL USERS DATA FOR ALL USERS PAGE
// const getAllUsers = async (req, res) => {
//   try {
//     const users = await userModel
//       .find({})
//       .select("name email phone address gender dob image createdAt")
//       .sort({ createdAt: -1 })
//       .lean();

//     // ← ADD: _id timestamp fallback for users without createdAt
//     const enriched = users.map(u => ({
//       ...u,
//       createdAt: u.createdAt || u._id.getTimestamp(),
//     }));

//     res.json({
//       success: true,
//       total: enriched.length,
//       users: enriched,
//     });
//   } catch (error) {
//     console.error("Error fetching users:", error);
//     res.status(500).json({ success: false, message: "Failed to fetch users" });
//   }
// };

// const adminBookingsTour = async (req, res) => {
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

// const adminTourList = async (req, res) => {
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

// //ADMIN ROOM LIST HELPER FUNCTION AND CONTROLLERS

// // === Helper Functions ===
// const getBasicTravelerInfo = (t) => ({
//   title: t.title,
//   firstName: t.firstName,
//   lastName: t.lastName,
//   age: t.age,
//   gender: t.gender,
//   sharingType: t.sharingType,
// });
// const assignRoomNumbers = (rooms) =>
//   rooms.map((r, i) => ({ ...r, roomNumber: i + 1 }));

// const adminAllotRooms = async (req, res) => {
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

// //Rejects booking from booking rejection section
// const bookingRejectAdmin = async (req, res) => {
//   try {
//     const { tnr, travellerIds = [] } = req.body;

//     // Validate input
//     if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid 6-character TNR is required",
//       });
//     }

//     if (!Array.isArray(travellerIds) || travellerIds.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "travellerIds[] array is required and cannot be empty",
//       });
//     }

//     const normalizedTnr = tnr.trim().toUpperCase();

//     // Fetch booking by TNR
//     const booking = await tourBookingModel.findOne({ tnr: normalizedTnr });
//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found with this TNR",
//       });
//     }

//     // Extract balance prices
//     const balanceDouble = Number(booking.tourData?.balanceDouble) || 0;
//     const balanceTriple = Number(booking.tourData?.balanceTriple) || 0;

//     // Payment status (used for deduction logic only)
//     const advancePaid =
//       booking.payment.advance.paid && booking.payment.advance.paymentVerified;
//     const balancePaid =
//       booking.payment.balance.paid && booking.payment.balance.paymentVerified;

//     // Normalize traveller IDs
//     const idsSet = new Set(travellerIds.map(String));

//     // Check for travellers that block rejection
//     const cancelledByTraveller = [];
//     const alreadyRejectedTravellers = [];
//     const missingTravellers = [];

//     travellerIds.forEach((id) => {
//       const traveller = booking.travellers.find(
//         (t) => String(t._id) === String(id),
//       );
//       if (!traveller) {
//         missingTravellers.push(id);
//       } else if (traveller.cancelled.byTraveller) {
//         cancelledByTraveller.push(id);
//       } else if (traveller.cancelled.byAdmin) {
//         alreadyRejectedTravellers.push(id);
//       }
//     });

//     // Strict mode: Block if any blocking conditions exist
//     if (
//       cancelledByTraveller.length > 0 ||
//       alreadyRejectedTravellers.length === travellerIds.length ||
//       missingTravellers.length === travellerIds.length
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Rejection not allowed due to invalid traveller state.",
//         cancelledByTraveller,
//         alreadyRejected: alreadyRejectedTravellers,
//         missingTravellers,
//       });
//     }

//     // Proceed with valid travellers
//     let totalDeduction = 0;
//     const rejectedTravellers = [];

//     booking.travellers = booking.travellers.map((traveller) => {
//       const travellerIdStr = String(traveller._id);

//       if (idsSet.has(travellerIdStr)) {
//         traveller.cancelled.byAdmin = true;
//         traveller.cancelled.cancelledAt = new Date();

//         rejectedTravellers.push(traveller);

//         // Deduct only if advance paid AND balance not paid
//         if (advancePaid && !balancePaid) {
//           if (traveller.sharingType === "double") {
//             totalDeduction += balanceDouble;
//           } else if (traveller.sharingType === "triple") {
//             totalDeduction += balanceTriple;
//           }
//         }
//       }

//       return traveller;
//     });

//     // Update balance only if deduction is applicable
//     if (totalDeduction > 0) {
//       booking.payment.balance.amount = Math.max(
//         booking.payment.balance.amount - totalDeduction,
//         0,
//       );
//     }

//     await booking.save();

//     res.json({
//       success: true,
//       message: "Traveller(s) rejected successfully",
//       updatedBalance: booking.payment.balance.amount,
//       rejectedTravellers: rejectedTravellers.map((t) => String(t._id)),
//       tnr: normalizedTnr,
//     });
//   } catch (error) {
//     console.error("bookingRejectAdmin error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
// // Add this new function

// const deleteBookingByTNR = async (req, res) => {
//   try {
//     const { tnr } = req.body;

//     if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid 6-character TNR is required",
//       });
//     }

//     const normalizedTNR = tnr.trim().toUpperCase();

//     const booking = await tourBookingModel.findOne({ tnr: normalizedTNR });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: `No booking found with TNR ${normalizedTNR}`,
//       });
//     }

//     // Optional: Prevent deletion if already paid / completed / etc.
//     if (booking.payment?.balance?.paid) {
//       return res.status(403).json({
//         success: false,
//         message:
//           "Cannot delete this booking — balance payment has already been made.",
//       });
//     }

//     if (booking.isBookingCompleted) {
//       return res.status(403).json({
//         success: false,
//         message: "Cannot delete completed bookings.",
//       });
//     }

//     // Actually delete
//     await tourBookingModel.deleteOne({ tnr: normalizedTNR });

//     return res.json({
//       success: true,
//       message: `Booking with TNR ${normalizedTNR} has been permanently deleted.`,
//       deletedTNR: normalizedTNR,
//     });
//   } catch (error) {
//     console.error("deleteBookingByTNR error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while deleting booking",
//       error: error.message,
//     });
//   }
// };

// const addTermsPoints = async (req, res) => {
//   try {
//     const { points } = req.body;

//     // Basic input validation
//     if (!points || !Array.isArray(points) || points.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Please send an array of points (at least one item required)",
//       });
//     }

//     // Find or create the current active terms document
//     let termsDoc = await Terms.findOne({ isCurrent: true });

//     if (!termsDoc) {
//       // First time → create initial document
//       termsDoc = new Terms({
//         version: "1.0",
//         effectiveFrom: new Date(),
//         isCurrent: true,
//         points: [],
//         // lastUpdatedBy: req.user?._id || null,   ← removed / commented
//         changeSummary: "Initial Terms & Conditions created (first time)",
//       });
//     }

//     // Calculate next order number
//     let nextOrder = 1;
//     if (termsDoc.points.length > 0) {
//       const orders = termsDoc.points.map((p) => p.order || 0);
//       nextOrder = Math.max(...orders) + 1;
//     }

//     // Prepare and validate new points
//     const newPoints = [];

//     for (let i = 0; i < points.length; i++) {
//       const input = points[i];

//       let text = "";
//       let internalNote = "";

//       if (typeof input === "string") {
//         text = input.trim();
//       } else if (typeof input === "object" && input !== null) {
//         text = (input.text || "").trim();
//         internalNote = (input.internalNote || "").trim();
//       }

//       if (!text || text.length < 10) {
//         return res.status(400).json({
//           success: false,
//           message: `Point #${i + 1} is invalid: text must be at least 10 characters`,
//         });
//       }

//       newPoints.push({
//         order: nextOrder + i,
//         text,
//         active: true,
//         internalNote,
//         createdAt: new Date(),
//       });
//     }

//     // Append new points
//     termsDoc.points.push(...newPoints);

//     // Update metadata — removed dependency on req.user
//     // termsDoc.lastUpdatedBy = req.user?._id || null;   ← commented out
//     termsDoc.lastUpdatedAt = new Date();
//     termsDoc.changeSummary = `Added ${newPoints.length} new point(s) - ${new Date().toISOString().split("T")[0]} (admin action)`;

//     // Save
//     await termsDoc.save();

//     // Prepare clean response (only active & sorted points)
//     const activeSortedPoints = termsDoc.points
//       .filter((p) => p.active === true)
//       .sort((a, b) => a.order - b.order)
//       .map((p) => ({
//         order: p.order,
//         text: p.text,
//         // internalNote is intentionally NOT sent to frontend
//       }));

//     return res.status(200).json({
//       success: true,
//       message: `Successfully added ${newPoints.length} point(s)`,
//       data: {
//         version: termsDoc.version,
//         effectiveFrom: termsDoc.effectiveFrom,
//         totalActivePoints: activeSortedPoints.length,
//         points: activeSortedPoints,
//       },
//     });
//   } catch (error) {
//     console.error("addTermsPoints error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to add terms points",
//       error: error.message,
//     });
//   }
// };

// const deleteTermsPoint = async (req, res) => {
//   try {
//     const { pointId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(pointId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid point ID format",
//       });
//     }

//     // Find current active terms document
//     const termsDoc = await Terms.findOne({ isCurrent: true });

//     if (!termsDoc) {
//       return res.status(404).json({
//         success: false,
//         message: "No active terms document found",
//       });
//     }

//     // Find the point by its _id
//     const point = termsDoc.points.id(pointId);

//     if (!point) {
//       return res.status(404).json({
//         success: false,
//         message: "Point not found in current terms",
//       });
//     }

//     // Deactivate instead of pull/remove (preserves history)
//     point.active = false;
//     point.updatedAt = new Date();

//     // Update metadata
//     termsDoc.lastUpdatedAt = new Date();
//     termsDoc.changeSummary = `Deactivated point #${point.order} - ${new Date().toISOString().split("T")[0]}`;
//     // termsDoc.lastUpdatedBy = req.user._id;  // uncomment when auth is fixed

//     await termsDoc.save();

//     // Prepare clean response (active points only)
//     const activeSortedPoints = termsDoc.points
//       .filter((p) => p.active === true)
//       .sort((a, b) => a.order - b.order)
//       .map((p) => ({
//         order: p.order,
//         text: p.text,
//       }));

//     return res.status(200).json({
//       success: true,
//       message: `Point #${point.order} deactivated successfully`,
//       data: {
//         version: termsDoc.version,
//         totalActivePoints: activeSortedPoints.length,
//         points: activeSortedPoints,
//       },
//     });
//   } catch (error) {
//     console.error("deleteTermsPoint error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to deactivate terms point",
//       error: error.message,
//     });
//   }
// };

// // controllers/tourAdminController.js (or termsController.js)

// // Import your Terms model (adjust path if needed)

// const getCurrentTerms = async (req, res) => {
//   try {
//     // Find the current active version
//     const termsDoc = await Terms.findOne({ isCurrent: true })
//       .select("version effectiveFrom points") // only needed fields
//       .lean(); // faster, plain JS object

//     if (!termsDoc) {
//       return res.status(200).json({
//         success: true,
//         message: "No terms & conditions defined yet",
//         data: {
//           version: "N/A",
//           effectiveFrom: null,
//           points: [],
//         },
//       });
//     }

//     // Filter active points and sort by order
//     const activePoints = termsDoc.points
//       .filter((p) => p.active === true)
//       .sort((a, b) => a.order - b.order)
//       .map((p) => ({
//         _id: p._id.toString(),
//         order: p.order,
//         text: p.text,
//       }));

//     return res.status(200).json({
//       success: true,
//       message: "Current terms & conditions fetched",
//       data: {
//         version: termsDoc.version,
//         effectiveFrom: termsDoc.effectiveFrom,
//         totalActivePoints: activePoints.length,
//         points: activePoints,
//       },
//     });
//   } catch (error) {
//     console.error("getCurrentTerms error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch terms & conditions",
//       error: error.message,
//     });
//   }
// };

// const submitTermsAgreement = async (req, res) => {
//   try {
//     const { tnr } = req.params;
//     const { emergencyContact, termsAgreed } = req.body;

//     // Validation
//     if (!tnr || tnr.length !== 6 || !/^[A-Z0-9]{6}$/.test(tnr)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid TNR format",
//       });
//     }

//     if (
//       !emergencyContact ||
//       !/^[\d+\-\s()]{7,25}$/.test(emergencyContact.trim())
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Please enter a valid emergency contact number (7–25 characters: digits, +, -, spaces, parentheses allowed)",
//       });
//     }

//     if (!termsAgreed) {
//       return res.status(400).json({
//         success: false,
//         message: "You must agree to the terms and conditions",
//       });
//     }

//     // Find booking by TNR
//     const booking = await tourBookingModel.findOne({ tnr: tnr.toUpperCase() });

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found with this TNR",
//       });
//     }

//     // Check if already agreed
//     if (booking.termsAgreed) {
//       return res.status(400).json({
//         success: false,
//         message: "Terms already agreed for this booking",
//       });
//     }

//     // Update booking
//     booking.emergencyContact = emergencyContact;
//     booking.termsAgreed = true;
//     booking.termsAgreedAt = new Date();

//     await booking.save();

//     return res.status(200).json({
//       success: true,
//       message: "Terms agreed successfully. Thank you!",
//       data: {
//         tnr: booking.tnr,
//         emergencyContact: booking.emergencyContact,
//         termsAgreed: booking.termsAgreed,
//         termsAgreedAt: booking.termsAgreedAt,
//       },
//     });
//   } catch (error) {
//     console.error("submitTermsAgreement error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to submit terms agreement",
//       error: error.message,
//     });
//   }
// };
// const getBookingSummaryByTNR = async (req, res) => {
//   try {
//     const { tnr } = req.params;

//     const booking = await tourBookingModel
//       .findOne({ tnr: tnr.toUpperCase() })
//       .select(
//         "tnr tourData.title travellers emergencyContact termsAgreed termsAgreedAt",
//       )
//       .lean();

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found",
//       });
//     }

//     const travellers = booking.travellers || [];

//     // Gender counts
//     const males = travellers.filter(
//       (t) => t.gender?.toLowerCase() === "male",
//     ).length;

//     const females = travellers.filter(
//       (t) => t.gender?.toLowerCase() === "female",
//     ).length;

//     // Child detection (age < 12)
//     const children = travellers.filter((t) => t.age < 12);

//     const childrenWithBerth = children.filter(
//       (t) => t.sharingType === "withBerth",
//     ).length;

//     const childrenWithoutBerth = children.filter(
//       (t) => t.sharingType === "withoutBerth",
//     ).length;

//     return res.status(200).json({
//       success: true,
//       data: {
//         tnr: booking.tnr,
//         tourTitle: booking.tourData?.title || "N/A",
//         totalTravellers: travellers.length,
//         males,
//         females,
//         children: {
//           total: children.length,
//           withBerth: childrenWithBerth,
//           withoutBerth: childrenWithoutBerth,
//         },
//         // Return full travellers array so frontend can show names
//         travellers: travellers.map((t) => ({
//           firstName: t.firstName || "",
//           lastName: t.lastName || "",
//           title: t.title || "",
//           age: t.age,
//           gender: t.gender,
//           sharingType: t.sharingType,
//         })),
//         emergencyContact: booking.emergencyContact || null,
//         termsAgreed: booking.termsAgreed || false,
//         termsAgreedAt: booking.termsAgreedAt || null,
//       },
//     });
//   } catch (err) {
//     console.error("getBookingSummaryByTNR error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: err.message,
//     });
//   }
// };
// //SAM related controllers
// const adminCreateTourVehicle = async (req, res) => {
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
// const adminUpdateTourVehicle = async (req, res) => {
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

// const adminToggleVehicleSeatSelection = async (req, res) => {
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

// const adminGetTourVehicles = async (req, res) => {
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
// const adminDeleteTourVehicle = async (req, res) => {
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
// const adminFetchTourVehicleSeatOverview = async (req, res) => {
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

// // ════════════════════════════════════════════════════════════════
// //  ANALYTICS — replace existing analytics section in touradminController.js
// //
// //  RANGE FILTER SUPPORT ADDED:
// //  - year / month        -> existing single-value filters (unchanged behaviour)
// //  - fromYear / toYear    -> year RANGE (e.g. 2025–2029), inclusive both ends
// //  - fromMonth / toMonth  -> month RANGE (e.g. Jan–Jun = 1–6), inclusive,
// //                            applied INDEPENDENTLY within each matched year
// //                            (NOT a single cross-year date span)
// //
// //  Combining rules (confirmed):
// //  - year range + month range are independent AND filters.
// //    e.g. fromYear=2025&toYear=2029&fromMonth=1&toMonth=6 means:
// //    "tours whose departure falls in Jan–Jun of ANY year from 2025–2029"
// //  - If both single (year/month) AND range (fromYear.../fromMonth...) params
// //    are sent, range params take priority (single values are legacy/back-compat).
// //
// //  ── TRAVELLER STATUS DEFINITIONS (confirmed, single source of truth) ──
// //  Active            = payment.advance.paid = true  AND byAdmin ≠ true AND byTraveller ≠ true
// //  Unverified        = payment.advance.paid ≠ true  AND byAdmin ≠ true
// //                       (an unpaid traveller who was separately
// //                       rejected/cancelled by admin shows up as
// //                       Rejected/Cancelled, NOT Unverified)
// //  Cancellation req. = payment.advance.paid = true  AND byTraveller = true AND byAdmin ≠ true
// //  Cancelled         = byAdmin = true AND byTraveller = true
// //  Rejected          = byAdmin = true AND byTraveller ≠ true
// //
// //  These 5 sets are mutually exclusive and collectively exhaustive over all
// //  travellers in a booking — every traveller falls into exactly one bucket:
// //    - byAdmin = true  -> Cancelled or Rejected (split by byTraveller)
// //    - byAdmin ≠ true, advance.paid = true, byTraveller = true  -> Cancellation request
// //    - byAdmin ≠ true, advance.paid = true, byTraveller ≠ true  -> Active
// //    - byAdmin ≠ true, advance.paid ≠ true                      -> Unverified
// // ════════════════════════════════════════════════════════════════

// // ─── Helper: tour departure date filter (single OR range) ──────────────
// function buildTourDateQuery({ year, month, fromYear, toYear, fromMonth, toMonth }) {
//   const q = {};
//   const exprClauses = [];

//   const hasYearRange = fromYear || toYear;
//   const hasMonthRange = fromMonth || toMonth;

//   if (hasYearRange) {
//     const fy = fromYear ? parseInt(fromYear) : null;
//     const ty = toYear ? parseInt(toYear) : null;
//     const yearExpr = { $year: "$lastBookingDate" };
//     if (fy !== null) exprClauses.push({ $gte: [yearExpr, fy] });
//     if (ty !== null) exprClauses.push({ $lte: [yearExpr, ty] });
//   }

//   if (hasMonthRange) {
//     const fm = fromMonth ? parseInt(fromMonth) : 1;
//     const tm = toMonth ? parseInt(toMonth) : 12;
//     const monthExpr = { $month: "$lastBookingDate" };
//     if (fm <= tm) {
//       // Normal range within a year, e.g. Jan(1)–Jun(6)
//       exprClauses.push({ $gte: [monthExpr, fm] });
//       exprClauses.push({ $lte: [monthExpr, tm] });
//     } else {
//       // Wrap-around range, e.g. Nov(11)–Feb(2) -> month >= 11 OR month <= 2
//       exprClauses.push({ $or: [{ $gte: [monthExpr, fm] }, { $lte: [monthExpr, tm] }] });
//     }
//   }

//   if (exprClauses.length) {
//     q.$expr = exprClauses.length === 1 ? exprClauses[0] : { $and: exprClauses };
//     return q;
//   }

//   // ── Legacy single year/month (back-compat, used when no range params sent) ──
//   if (year && month) {
//     const y = parseInt(year), m = parseInt(month);
//     q.lastBookingDate = { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) };
//   } else if (year) {
//     const y = parseInt(year);
//     q.lastBookingDate = { $gte: new Date(`${y}-01-01`), $lt: new Date(`${y + 1}-01-01`) };
//   } else if (month) {
//     q.$expr = { $eq: [{ $month: "$lastBookingDate" }, parseInt(month)] };
//   }
//   return q;
// }


// // ════════════════════════════════════════════════════════════════
// //  Updated helper functions for tour list table
// //  Replace in touradminController.js
// // ════════════════════════════════════════════════════════════════

// // ─── Helper: booking stats per tourId ────────────────────────
// async function getBookingStatsByTourIds(tourIds) {
//   if (!tourIds.length) return [];
//   return tourBookingModel.aggregate([
//     { $match: { tourId: { $in: tourIds } } },
//     {
//       $group: {
//         _id: "$tourId",
//         totalTNR: { $sum: 1 },

//         // ── Travellers (active) ──
//         // Includes: never-cancelled + cancel-request-pending + unverified travellers
//         // Excludes: travellers where byAdmin=true (covers both "cancelled" and "rejected")
//         totalTravellers: {
//           $sum: {
//             $size: {
//               $filter: {
//                 input: "$travellers", as: "t",
//                 cond: { $ne: ["$$t.cancelled.byAdmin", true] }
//               }
//             }
//           }
//         },

//         // ── Cancelled Travellers (new column) = cancelled + rejected combined ──
//         // cancelled: byAdmin=true AND byTraveller=true
//         // rejected:  byAdmin=true AND byTraveller≠true
//         // combined condition: byAdmin=true (covers both cases)
//         cancelledTravellers: {
//           $sum: {
//             $size: {
//               $filter: {
//                 input: "$travellers", as: "t",
//                 cond: { $eq: ["$$t.cancelled.byAdmin", true] }
//               }
//             }
//           }
//         },

//         // ── Gender: same group as totalTravellers (byAdmin ≠ true) ──
//         totalFemale: {
//           $sum: {
//             $size: {
//               $filter: {
//                 input: "$travellers", as: "t",
//                 cond: {
//                   $and: [
//                     { $eq: ["$$t.gender", "Female"] },
//                     { $gt: ["$$t.age", 10] },
//                     { $ne: ["$$t.cancelled.byAdmin", true] }
//                   ]
//                 }
//               }
//             }
//           }
//         },
//         totalMale: {
//           $sum: {
//             $size: {
//               $filter: {
//                 input: "$travellers", as: "t",
//                 cond: {
//                   $and: [
//                     { $eq: ["$$t.gender", "Male"] },
//                     { $gt: ["$$t.age", 10] },
//                     { $ne: ["$$t.cancelled.byAdmin", true] }
//                   ]
//                 }
//               }
//             }
//           }
//         },
//         totalChild: {
//           $sum: {
//             $size: {
//               $filter: {
//                 input: "$travellers", as: "t",
//                 cond: {
//                   $and: [
//                     { $in: ["$$t.sharingType", ["withBerth", "withoutBerth"]] },
//                     { $ne: ["$$t.cancelled.byAdmin", true] }
//                   ]
//                 }
//               }
//             }
//           }
//         },

//         // ── Card-expand breakdown (for mobile TourCard) ──
//         // Unverified = advance NOT paid, AND byAdmin ≠ true (excludes
//         // travellers who were separately rejected/cancelled by admin —
//         // those show up under Rejected/Cancelled instead).
//         unverifiedTravellers: {
//           $sum: {
//             $cond: [
//               { $ne: ["$payment.advance.paid", true] },
//               {
//                 $size: {
//                   $filter: {
//                     input: "$travellers", as: "t",
//                     cond: { $ne: ["$$t.cancelled.byAdmin", true] }
//                   }
//                 }
//               },
//               0
//             ]
//           }
//         },

//         // Active: advance PAID + byAdmin≠true AND byTraveller≠true
//         activeTravellers: {
//           $sum: {
//             $cond: [
//               { $eq: ["$payment.advance.paid", true] },
//               {
//                 $size: {
//                   $filter: {
//                     input: "$travellers", as: "t",
//                     cond: {
//                       $and: [
//                         { $ne: ["$$t.cancelled.byAdmin", true] },
//                         { $ne: ["$$t.cancelled.byTraveller", true] },
//                       ]
//                     }
//                   }
//                 }
//               },
//               0
//             ]
//           }
//         },

//         // Cancellation request: advance PAID + byTraveller=true AND byAdmin≠true
//         // (advance.paid=true is REQUIRED — a traveller can only request
//         // cancellation on a booking they've actually paid the advance for.
//         // Without this condition, an unpaid+byTraveller=true traveller would
//         // be double-counted here AND in unverifiedTravellers above.)
//         cancellationRequestTravellers: {
//           $sum: {
//             $cond: [
//               { $eq: ["$payment.advance.paid", true] },
//               {
//                 $size: {
//                   $filter: {
//                     input: "$travellers", as: "t",
//                     cond: {
//                       $and: [
//                         { $eq: ["$$t.cancelled.byTraveller", true] },
//                         { $ne: ["$$t.cancelled.byAdmin", true] },
//                       ]
//                     }
//                   }
//                 }
//               },
//               0
//             ]
//           }
//         },

//         fullyCancelledTravellers: {
//           $sum: {
//             $size: {
//               $filter: {
//                 input: "$travellers", as: "t",
//                 cond: {
//                   $and: [
//                     { $eq: ["$$t.cancelled.byAdmin", true] },
//                     { $eq: ["$$t.cancelled.byTraveller", true] },
//                   ]
//                 }
//               }
//             }
//           }
//         },
//         rejectedTravellers: {
//           $sum: {
//             $size: {
//               $filter: {
//                 input: "$travellers", as: "t",
//                 cond: {
//                   $and: [
//                     { $eq: ["$$t.cancelled.byAdmin", true] },
//                     { $ne: ["$$t.cancelled.byTraveller", true] },
//                   ]
//                 }
//               }
//             }
//           }
//         },

//         // ── Tour status ──
//         isCompleted: { $max: { $cond: ["$isTripCompleted", 1, 0] } },

//         // ── Cancellation pools ──
//         gvPool: { $sum: { $ifNull: ["$gvCancellationPool", 0] } },
//         irctcPool: { $sum: { $ifNull: ["$irctcCancellationPool", 0] } },
//       }
//     }
//   ]);
// }

// // ─── Helper: merge tour + booking data ───────────────────────
// function mergeTourBooking(allTours, bookingData) {
//   const bookingMap = {};
//   bookingData.forEach(b => { bookingMap[b._id?.toString()] = b; });

//   return allTours.map(t => {
//     const id = t._id.toString();
//     const b = bookingMap[id] || {};
//     return {
//       _id: id,
//       tourName: t.title || "—",
//       tourType: t.batch || "—",
//       available: t.available ?? null,
//       departureDate: t.lastBookingDate || null,
//       totalTNR: b.totalTNR || 0,
//       totalTravellers: b.totalTravellers || 0,
//       cancelledTravellers: b.cancelledTravellers || 0,        // NEW column
//       totalFemale: b.totalFemale || 0,
//       totalMale: b.totalMale || 0,
//       totalChild: b.totalChild || 0,
//       // breakdown — used by mobile card expand view
//       unverifiedTravellers: b.unverifiedTravellers || 0,
//       activeTravellers: b.activeTravellers || 0,
//       cancellationRequestTravellers: b.cancellationRequestTravellers || 0,
//       fullyCancelledTravellers: b.fullyCancelledTravellers || 0,
//       rejectedTravellers: b.rejectedTravellers || 0,
//       isCompleted: b.isCompleted ?? 0,
//       gvPool: b.gvPool || 0,
//       irctcPool: b.irctcPool || 0,
//     };
//   });
// }

// // ════════════════════════════════════════════════════════════════
// //  Sanity check (run manually in DB to verify):
// //  totalTravellers + cancelledTravellers === sum of all travellers in booking
// //  (because totalTravellers uses byAdmin≠true, cancelledTravellers uses byAdmin=true
// //   — these are complementary sets with zero overlap and zero gap)
// // ════════════════════════════════════════════════════════════════


// function emptyStats() {
//   return {
//     totalTours: 0,
//     totalBookings: 0, unverifiedBookings: 0, activeBookings: 0,
//     completedBookings: 0, fullyCancelledBookings: 0, rejectedBookings: 0,
//     totalTravellers: 0, activeTravellers: 0, cancelledTravellers: 0,
//     cancellationRequestTravellers: 0, rejectedTravellers: 0,
//     totalFemale: 0, totalMale: 0, totalChild: 0,
//     totalGVPool: 0, totalIRCTCPool: 0, totalCancelAmount: 0,
//   };
// }


// // ════════════════════════════════════════════════════════════════
// //  1. SUMMARY
// //  GET /api/touradmin/analytics-summary
// //     ?year=&month=&tourId=
// //     ?fromYear=&toYear=&fromMonth=&toMonth=&tourId=   (range mode)
// // ════════════════════════════════════════════════════════════════
// const getAnalyticsSummary = async (req, res) => {
//   try {
//     const { year, month, tourId, fromYear, toYear, fromMonth, toMonth } = req.query;
//     const tourIds = tourId ? tourId.split(",") : [];

//     const tourQuery = buildTourDateQuery({ year, month, fromYear, toYear, fromMonth, toMonth });
//     if (tourIds.length) {
//       tourQuery._id = { $in: tourIds.map(id => new mongoose.Types.ObjectId(id)) };
//     }

//     let matchTourIds = [];
//     const hasAnyDateFilter = year || month || fromYear || toYear || fromMonth || toMonth || tourIds.length;
//     if (hasAnyDateFilter) {
//       const tours = await tourModel.find(tourQuery, { _id: 1 }).lean();
//       matchTourIds = tours.map(t => t._id);
//       if (!matchTourIds.length) {
//         return res.status(200).json({ success: true, data: emptyStats() });
//       }
//     }

//     const bookingMatch = matchTourIds.length ? { tourId: { $in: matchTourIds } } : {};

//     // ── Helper expressions ──────────────────────────────────────

//     const allCancelledExpr = {
//       $and: [
//         { $gt: [{ $size: "$travellers" }, 0] },
//         {
//           $eq: [
//             { $size: "$travellers" },
//             {
//               $size: {
//                 $filter: {
//                   input: "$travellers", as: "t",
//                   cond: {
//                     $and: [
//                       { $eq: ["$$t.cancelled.byAdmin", true] },
//                       { $eq: ["$$t.cancelled.byTraveller", true] },
//                     ]
//                   }
//                 }
//               }
//             }
//           ]
//         }
//       ]
//     };

//     const allRejectedExpr = {
//       $and: [
//         { $gt: [{ $size: "$travellers" }, 0] },
//         {
//           $eq: [
//             { $size: "$travellers" },
//             {
//               $size: {
//                 $filter: {
//                   input: "$travellers", as: "t",
//                   cond: {
//                     $and: [
//                       { $eq: ["$$t.cancelled.byAdmin", true] },
//                       { $ne: ["$$t.cancelled.byTraveller", true] },
//                     ]
//                   }
//                 }
//               }
//             }
//           ]
//         }
//       ]
//     };

//     const [stats] = await tourBookingModel.aggregate([
//       { $match: bookingMatch },
//       {
//         $group: {
//           _id: null,

//           totalBookings: { $sum: 1 },

//           unverifiedBookings: {
//             $sum: {
//               $cond: [{
//                 $and: [
//                   { $ne: ["$payment.advance.paid", true] },
//                   { $not: allCancelledExpr },
//                   { $not: allRejectedExpr },
//                 ]
//               }, 1, 0]
//             }
//           },

//           activeBookings: {
//             $sum: {
//               $cond: [{
//                 $and: [
//                   { $eq: ["$payment.advance.paid", true] },
//                   { $ne: ["$payment.balance.paid", true] },
//                   { $not: allCancelledExpr },
//                   { $not: allRejectedExpr },
//                 ]
//               }, 1, 0]
//             }
//           },

//           completedBookings: {
//             $sum: {
//               $cond: [{
//                 $and: [
//                   { $eq: ["$payment.advance.paid", true] },
//                   { $eq: ["$payment.balance.paid", true] },
//                   { $not: allCancelledExpr },
//                   { $not: allRejectedExpr },
//                 ]
//               }, 1, 0]
//             }
//           },

//           fullyCancelledBookings: {
//             $sum: { $cond: [allCancelledExpr, 1, 0] }
//           },

//           rejectedBookings: {
//             $sum: { $cond: [allRejectedExpr, 1, 0] }
//           },

//           // ── Travellers ──────────────────────────────────────────

//           totalTravellers: { $sum: { $size: "$travellers" } },

//           // Unverified = advance NOT paid, AND byAdmin ≠ true (excludes
//           // travellers who were separately rejected/cancelled by admin).
//           unverifiedTravellers: {
//             $sum: {
//               $cond: [
//                 { $ne: ["$payment.advance.paid", true] },
//                 {
//                   $size: {
//                     $filter: {
//                       input: "$travellers", as: "t",
//                       cond: { $ne: ["$$t.cancelled.byAdmin", true] }
//                     }
//                   }
//                 },
//                 0
//               ]
//             }
//           },

//           // Active traveller: advance PAID + byAdmin=false AND byTraveller=false
//           activeTravellers: {
//             $sum: {
//               $cond: [
//                 { $eq: ["$payment.advance.paid", true] },
//                 {
//                   $size: {
//                     $filter: {
//                       input: "$travellers", as: "t",
//                       cond: {
//                         $and: [
//                           { $ne: ["$$t.cancelled.byAdmin", true] },
//                           { $ne: ["$$t.cancelled.byTraveller", true] },
//                         ]
//                       }
//                     }
//                   }
//                 },
//                 0
//               ]
//             }
//           },

//           // Cancelled traveller: byAdmin=true AND byTraveller=true
//           cancelledTravellers: {
//             $sum: {
//               $size: {
//                 $filter: {
//                   input: "$travellers", as: "t",
//                   cond: {
//                     $and: [
//                       { $eq: ["$$t.cancelled.byAdmin", true] },
//                       { $eq: ["$$t.cancelled.byTraveller", true] },
//                     ]
//                   }
//                 }
//               }
//             }
//           },

//           // Cancel request: advance PAID + byTraveller=true AND byAdmin=false
//           // (advance.paid=true required — see definitions block at top of file)
//           cancellationRequestTravellers: {
//             $sum: {
//               $cond: [
//                 { $eq: ["$payment.advance.paid", true] },
//                 {
//                   $size: {
//                     $filter: {
//                       input: "$travellers", as: "t",
//                       cond: {
//                         $and: [
//                           { $eq: ["$$t.cancelled.byTraveller", true] },
//                           { $ne: ["$$t.cancelled.byAdmin", true] },
//                         ]
//                       }
//                     }
//                   }
//                 },
//                 0
//               ]
//             }
//           },

//           // Rejected traveller: byAdmin=true AND byTraveller=false
//           rejectedTravellers: {
//             $sum: {
//               $size: {
//                 $filter: {
//                   input: "$travellers", as: "t",
//                   cond: {
//                     $and: [
//                       { $eq: ["$$t.cancelled.byAdmin", true] },
//                       { $ne: ["$$t.cancelled.byTraveller", true] },
//                     ]
//                   }
//                 }
//               }
//             }
//           },

//           // ── Gender (advance paid + NOT cancelled) ────────────────

//           totalFemale: {
//             $sum: {
//               $cond: [
//                 { $eq: ["$payment.advance.paid", true] },
//                 {
//                   $size: {
//                     $filter: {
//                       input: "$travellers", as: "t",
//                       cond: {
//                         $and: [
//                           { $eq: ["$$t.gender", "Female"] },
//                           { $gt: ["$$t.age", 10] },
//                           { $ne: ["$$t.cancelled.byAdmin", true] },
//                           { $ne: ["$$t.cancelled.byTraveller", true] },
//                         ]
//                       }
//                     }
//                   }
//                 },
//                 0
//               ]
//             }
//           },

//           totalMale: {
//             $sum: {
//               $cond: [
//                 { $eq: ["$payment.advance.paid", true] },
//                 {
//                   $size: {
//                     $filter: {
//                       input: "$travellers", as: "t",
//                       cond: {
//                         $and: [
//                           { $eq: ["$$t.gender", "Male"] },
//                           { $gt: ["$$t.age", 10] },
//                           { $ne: ["$$t.cancelled.byAdmin", true] },
//                           { $ne: ["$$t.cancelled.byTraveller", true] },
//                         ]
//                       }
//                     }
//                   }
//                 },
//                 0
//               ]
//             }
//           },

//           totalChild: {
//             $sum: {
//               $cond: [
//                 { $eq: ["$payment.advance.paid", true] },
//                 {
//                   $size: {
//                     $filter: {
//                       input: "$travellers", as: "t",
//                       cond: {
//                         $and: [
//                           { $in: ["$$t.sharingType", ["withBerth", "withoutBerth"]] },
//                           { $ne: ["$$t.cancelled.byAdmin", true] },
//                           { $ne: ["$$t.cancelled.byTraveller", true] },
//                         ]
//                       }
//                     }
//                   }
//                 },
//                 0
//               ]
//             }
//           },

//           // ── Cancellation amounts ─────────────────────────────────

//           totalGVPool: { $sum: { $ifNull: ["$gvCancellationPool", 0] } },
//           totalIRCTCPool: { $sum: { $ifNull: ["$irctcCancellationPool", 0] } },
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           totalBookings: 1,
//           unverifiedBookings: 1,
//           activeBookings: 1,
//           completedBookings: 1,
//           fullyCancelledBookings: 1,
//           rejectedBookings: 1,
//           totalTravellers: 1,
//           unverifiedTravellers: 1,
//           activeTravellers: 1,
//           cancelledTravellers: 1,
//           cancellationRequestTravellers: 1,
//           rejectedTravellers: 1,
//           totalFemale: 1,
//           totalMale: 1,
//           totalChild: 1,
//           totalGVPool: 1,
//           totalIRCTCPool: 1,
//           totalCancelAmount: { $add: ["$totalGVPool", "$totalIRCTCPool"] },
//         }
//       }
//     ]);

//     return res.status(200).json({
//       success: true,
//       data: {
//         totalTours: matchTourIds.length || (await tourModel.countDocuments()),
//         totalBookings: stats?.totalBookings || 0,
//         unverifiedBookings: stats?.unverifiedBookings || 0,
//         activeBookings: stats?.activeBookings || 0,
//         completedBookings: stats?.completedBookings || 0,
//         fullyCancelledBookings: stats?.fullyCancelledBookings || 0,
//         rejectedBookings: stats?.rejectedBookings || 0,
//         totalTravellers: stats?.totalTravellers || 0,
//         unverifiedTravellers: stats?.unverifiedTravellers || 0,
//         activeTravellers: stats?.activeTravellers || 0,
//         cancelledTravellers: stats?.cancelledTravellers || 0,
//         cancellationRequestTravellers: stats?.cancellationRequestTravellers || 0,
//         rejectedTravellers: stats?.rejectedTravellers || 0,
//         totalFemale: stats?.totalFemale || 0,
//         totalMale: stats?.totalMale || 0,
//         totalChild: stats?.totalChild || 0,
//         totalGVPool: stats?.totalGVPool || 0,
//         totalIRCTCPool: stats?.totalIRCTCPool || 0,
//         totalCancelAmount: stats?.totalCancelAmount || 0,
//       }
//     });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };


// // ════════════════════════════════════════════════════════════════
// //  2. YEAR-WISE — travellers + traveller status + tour status
// //  GET /api/touradmin/analytics-year-wise
// //     ?fromYear=&toYear=   (optional — restrict which years are returned)
// // ════════════════════════════════════════════════════════════════
// const getAnalyticsYearWise = async (req, res) => {
//   try {
//     const { fromYear, toYear } = req.query;

//     const yearMatch = {};
//     if (fromYear || toYear) {
//       const yearExpr = { $year: "$lastBookingDate" };
//       const clauses = [];
//       if (fromYear) clauses.push({ $gte: [yearExpr, parseInt(fromYear)] });
//       if (toYear) clauses.push({ $lte: [yearExpr, parseInt(toYear)] });
//       yearMatch.$expr = clauses.length === 1 ? clauses[0] : { $and: clauses };
//     }

//     const toursByYear = await tourModel.aggregate([
//       ...(Object.keys(yearMatch).length ? [{ $match: yearMatch }] : []),
//       { $group: { _id: { $year: "$lastBookingDate" }, tourIds: { $push: "$_id" }, tourCount: { $sum: 1 } } },
//       { $sort: { _id: 1 } }
//     ]);

//     const result = await Promise.all(toursByYear.map(async (yr) => {
//       const [stats] = await tourBookingModel.aggregate([
//         { $match: { tourId: { $in: yr.tourIds } } },
//         {
//           $group: {
//             _id: null,
//             travellers: { $sum: { $size: "$travellers" } },
//             bookings: { $sum: 1 },

//             // Active: advance PAID + byAdmin≠true AND byTraveller≠true
//             activeTravellers: {
//               $sum: {
//                 $cond: [
//                   { $eq: ["$payment.advance.paid", true] },
//                   {
//                     $size: {
//                       $filter: {
//                         input: "$travellers", as: "t",
//                         cond: {
//                           $and: [
//                             { $ne: ["$$t.cancelled.byAdmin", true] },
//                             { $ne: ["$$t.cancelled.byTraveller", true] },
//                           ]
//                         }
//                       }
//                     }
//                   },
//                   0
//                 ]
//               }
//             },
//             cancelledTravellers: {
//               $sum: {
//                 $size: {
//                   $filter: {
//                     input: "$travellers", as: "t",
//                     cond: {
//                       $and: [
//                         { $eq: ["$$t.cancelled.byAdmin", true] },
//                         { $eq: ["$$t.cancelled.byTraveller", true] },
//                       ]
//                     }
//                   }
//                 }
//               }
//             },
//             rejectedTravellers: {
//               $sum: {
//                 $size: {
//                   $filter: {
//                     input: "$travellers", as: "t",
//                     cond: {
//                       $and: [
//                         { $eq: ["$$t.cancelled.byAdmin", true] },
//                         { $ne: ["$$t.cancelled.byTraveller", true] },
//                       ]
//                     }
//                   }
//                 }
//               }
//             },

//             // Unverified: advance NOT paid, AND byAdmin ≠ true (excludes
//             // travellers who were separately rejected/cancelled by admin).
//             unverifiedTravellers: {
//               $sum: {
//                 $cond: [
//                   { $ne: ["$payment.advance.paid", true] },
//                   {
//                     $size: {
//                       $filter: {
//                         input: "$travellers", as: "t",
//                         cond: { $ne: ["$$t.cancelled.byAdmin", true] }
//                       }
//                     }
//                   },
//                   0
//                 ]
//               }
//             },

//             // Cancel request: advance PAID + byTraveller=true AND byAdmin≠true
//             cancellationRequestTravellers: {
//               $sum: {
//                 $cond: [
//                   { $eq: ["$payment.advance.paid", true] },
//                   {
//                     $size: {
//                       $filter: {
//                         input: "$travellers", as: "t",
//                         cond: {
//                           $and: [
//                             { $eq: ["$$t.cancelled.byTraveller", true] },
//                             { $ne: ["$$t.cancelled.byAdmin", true] },
//                           ]
//                         }
//                       }
//                     }
//                   },
//                   0
//                 ]
//               }
//             },

//             completedBookings: {
//               $sum: {
//                 $cond: [{
//                   $and: [
//                     { $eq: ["$payment.advance.paid", true] },
//                     { $eq: ["$payment.balance.paid", true] },
//                   ]
//                 }, 1, 0]
//               }
//             },
//             activeBookings: {
//               $sum: {
//                 $cond: [{
//                   $and: [
//                     { $eq: ["$payment.advance.paid", true] },
//                     { $ne: ["$payment.balance.paid", true] },
//                   ]
//                 }, 1, 0]
//               }
//             },
//             unverifiedBookings: {
//               $sum: { $cond: [{ $ne: ["$payment.advance.paid", true] }, 1, 0] }
//             },
//           }
//         }
//       ]);

//       const toursThisYear = await tourModel.find(
//         { _id: { $in: yr.tourIds } },
//         { available: 1, _id: 0 }
//       ).lean();
//       const availableTours = toursThisYear.filter(t => t.available !== false).length;
//       const soldoutTours = toursThisYear.filter(t => t.available === false).length;

//       return {
//         _id: yr._id,
//         tourCount: yr.tourCount,
//         availableTours,
//         soldoutTours,
//         travellers: stats?.travellers || 0,
//         bookings: stats?.bookings || 0,
//         activeTravellers: stats?.activeTravellers || 0,
//         cancelledTravellers: stats?.cancelledTravellers || 0,
//         rejectedTravellers: stats?.rejectedTravellers || 0,
//         unverifiedTravellers: stats?.unverifiedTravellers || 0,
//         cancellationRequestTravellers: stats?.cancellationRequestTravellers || 0,
//         completedBookings: stats?.completedBookings || 0,
//         activeBookings: stats?.activeBookings || 0,
//         unverifiedBookings: stats?.unverifiedBookings || 0,
//       };
//     }));

//     return res.status(200).json({ success: true, data: result });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ════════════════════════════════════════════════════════════════
// //  3. MONTH-WISE — travellers + traveller status + tour status
// //  GET /api/touradmin/analytics-month-wise?year=2026
// //     ?fromYear=&toYear=&fromMonth=&toMonth=   (range mode — overrides ?year=)
// //     When a year RANGE is given, returns one entry per {year, month} pair
// //     across ALL matched years, each restricted to the month range.
// // ════════════════════════════════════════════════════════════════
// const getAnalyticsMonthWise = async (req, res) => {
//   try {
//     const { year, month, fromYear, toYear, fromMonth, toMonth } = req.query;

//     const hasYearRange = fromYear || toYear;
//     const hasMonthRange = fromMonth || toMonth;

//     const tourMatch = {};
//     const exprClauses = [];

//     if (hasYearRange) {
//       const yearExpr = { $year: "$lastBookingDate" };
//       if (fromYear) exprClauses.push({ $gte: [yearExpr, parseInt(fromYear)] });
//       if (toYear) exprClauses.push({ $lte: [yearExpr, parseInt(toYear)] });
//     } else if (year && month) {
//       const y = parseInt(year), m = parseInt(month);
//       tourMatch.lastBookingDate = { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) };
//     } else if (year) {
//       const y = parseInt(year);
//       tourMatch.lastBookingDate = { $gte: new Date(`${y}-01-01`), $lt: new Date(`${y + 1}-01-01`) };
//     } else if (!hasMonthRange) {
//       // No filters at all -> default to current year (legacy behaviour)
//       const y = new Date().getFullYear();
//       tourMatch.lastBookingDate = { $gte: new Date(`${y}-01-01`), $lt: new Date(`${y + 1}-01-01`) };
//     }

//     if (hasMonthRange) {
//       const fm = fromMonth ? parseInt(fromMonth) : 1;
//       const tm = toMonth ? parseInt(toMonth) : 12;
//       const monthExpr = { $month: "$lastBookingDate" };
//       if (fm <= tm) {
//         exprClauses.push({ $gte: [monthExpr, fm] });
//         exprClauses.push({ $lte: [monthExpr, tm] });
//       } else {
//         exprClauses.push({ $or: [{ $gte: [monthExpr, fm] }, { $lte: [monthExpr, tm] }] });
//       }
//     } else if (month && !year) {
//       exprClauses.push({ $eq: [{ $month: "$lastBookingDate" }, parseInt(month)] });
//     }

//     if (exprClauses.length) {
//       tourMatch.$expr = exprClauses.length === 1 ? exprClauses[0] : { $and: exprClauses };
//     }

//     const toursByGroup = await tourModel.aggregate([
//       { $match: tourMatch },
//       {
//         $group: {
//           _id: { year: { $year: "$lastBookingDate" }, month: { $month: "$lastBookingDate" } },
//           tourIds: { $push: "$_id" },
//           tourCount: { $sum: 1 },
//         }
//       },
//       { $sort: { "_id.year": 1, "_id.month": 1 } }
//     ]);

//     const result = await Promise.all(toursByGroup.map(async (grp) => {
//       const [stats] = await tourBookingModel.aggregate([
//         { $match: { tourId: { $in: grp.tourIds } } },
//         {
//           $group: {
//             _id: null,
//             travellers: { $sum: { $size: "$travellers" } },
//             bookings: { $sum: 1 },

//             // Active: advance PAID + byAdmin≠true AND byTraveller≠true
//             activeTravellers: {
//               $sum: {
//                 $cond: [
//                   { $eq: ["$payment.advance.paid", true] },
//                   {
//                     $size: {
//                       $filter: {
//                         input: "$travellers", as: "t",
//                         cond: {
//                           $and: [
//                             { $ne: ["$$t.cancelled.byAdmin", true] },
//                             { $ne: ["$$t.cancelled.byTraveller", true] },
//                           ]
//                         }
//                       }
//                     }
//                   },
//                   0
//                 ]
//               }
//             },
//             cancelledTravellers: {
//               $sum: {
//                 $size: {
//                   $filter: {
//                     input: "$travellers", as: "t",
//                     cond: {
//                       $and: [
//                         { $eq: ["$$t.cancelled.byAdmin", true] },
//                         { $eq: ["$$t.cancelled.byTraveller", true] },
//                       ]
//                     }
//                   }
//                 }
//               }
//             },
//             rejectedTravellers: {
//               $sum: {
//                 $size: {
//                   $filter: {
//                     input: "$travellers", as: "t",
//                     cond: {
//                       $and: [
//                         { $eq: ["$$t.cancelled.byAdmin", true] },
//                         { $ne: ["$$t.cancelled.byTraveller", true] },
//                       ]
//                     }
//                   }
//                 }
//               }
//             },

//             // Unverified: advance NOT paid, AND byAdmin ≠ true (excludes
//             // travellers who were separately rejected/cancelled by admin).
//             unverifiedTravellers: {
//               $sum: {
//                 $cond: [
//                   { $ne: ["$payment.advance.paid", true] },
//                   {
//                     $size: {
//                       $filter: {
//                         input: "$travellers", as: "t",
//                         cond: { $ne: ["$$t.cancelled.byAdmin", true] }
//                       }
//                     }
//                   },
//                   0
//                 ]
//               }
//             },

//             // Cancel request: advance PAID + byTraveller=true AND byAdmin≠true
//             cancellationRequestTravellers: {
//               $sum: {
//                 $cond: [
//                   { $eq: ["$payment.advance.paid", true] },
//                   {
//                     $size: {
//                       $filter: {
//                         input: "$travellers", as: "t",
//                         cond: {
//                           $and: [
//                             { $eq: ["$$t.cancelled.byTraveller", true] },
//                             { $ne: ["$$t.cancelled.byAdmin", true] },
//                           ]
//                         }
//                       }
//                     }
//                   },
//                   0
//                 ]
//               }
//             },

//             completedBookings: {
//               $sum: {
//                 $cond: [{
//                   $and: [
//                     { $eq: ["$payment.advance.paid", true] },
//                     { $eq: ["$payment.balance.paid", true] },
//                   ]
//                 }, 1, 0]
//               }
//             },
//             activeBookings: {
//               $sum: {
//                 $cond: [{
//                   $and: [
//                     { $eq: ["$payment.advance.paid", true] },
//                     { $ne: ["$payment.balance.paid", true] },
//                   ]
//                 }, 1, 0]
//               }
//             },
//             unverifiedBookings: {
//               $sum: { $cond: [{ $ne: ["$payment.advance.paid", true] }, 1, 0] }
//             },

//             gvPool: { $sum: { $ifNull: ["$gvCancellationPool", 0] } },
//             irctcPool: { $sum: { $ifNull: ["$irctcCancellationPool", 0] } },
//           }
//         }
//       ]);

//       const toursThisMonth = await tourModel.find(
//         { _id: { $in: grp.tourIds } },
//         { available: 1, _id: 0 }
//       ).lean();
//       const availableTours = toursThisMonth.filter(t => t.available !== false).length;
//       const soldoutTours = toursThisMonth.filter(t => t.available === false).length;

//       return {
//         year: grp._id.year,
//         month: grp._id.month,
//         tourCount: grp.tourCount,
//         availableTours,
//         soldoutTours,
//         travellers: stats?.travellers || 0,
//         bookings: stats?.bookings || 0,
//         activeTravellers: stats?.activeTravellers || 0,
//         cancelledTravellers: stats?.cancelledTravellers || 0,
//         rejectedTravellers: stats?.rejectedTravellers || 0,
//         unverifiedTravellers: stats?.unverifiedTravellers || 0,
//         cancellationRequestTravellers: stats?.cancellationRequestTravellers || 0,
//         completedBookings: stats?.completedBookings || 0,
//         activeBookings: stats?.activeBookings || 0,
//         unverifiedBookings: stats?.unverifiedBookings || 0,
//         gvPool: stats?.gvPool || 0,
//         irctcPool: stats?.irctcPool || 0,
//       };
//     }));

//     return res.status(200).json({ success: true, data: result });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ════════════════════════════════════════════════════════════════
// //  4. CANCELLATION — year-wise + month-wise GV & IRCTC
// //  GET /api/touradmin/analytics-cancellation?view=year|month&year=2026
// //     ?view=year&fromYear=&toYear=                       (range mode)
// //     ?view=month&fromYear=&toYear=&fromMonth=&toMonth=   (range mode)
// // ════════════════════════════════════════════════════════════════
// const getAnalyticsCancellation = async (req, res) => {
//   try {
//     const { view = "year", year, fromYear, toYear, fromMonth, toMonth } = req.query;
//     const hasYearRange = fromYear || toYear;
//     const hasMonthRange = fromMonth || toMonth;

//     if (view === "month") {
//       const tourMatch = {};
//       const exprClauses = [];

//       if (hasYearRange) {
//         const yearExpr = { $year: "$lastBookingDate" };
//         if (fromYear) exprClauses.push({ $gte: [yearExpr, parseInt(fromYear)] });
//         if (toYear) exprClauses.push({ $lte: [yearExpr, parseInt(toYear)] });
//       } else {
//         const y = parseInt(year) || new Date().getFullYear();
//         tourMatch.lastBookingDate = { $gte: new Date(`${y}-01-01`), $lt: new Date(`${y + 1}-01-01`) };
//       }

//       if (hasMonthRange) {
//         const fm = fromMonth ? parseInt(fromMonth) : 1;
//         const tm = toMonth ? parseInt(toMonth) : 12;
//         const monthExpr = { $month: "$lastBookingDate" };
//         if (fm <= tm) {
//           exprClauses.push({ $gte: [monthExpr, fm] });
//           exprClauses.push({ $lte: [monthExpr, tm] });
//         } else {
//           exprClauses.push({ $or: [{ $gte: [monthExpr, fm] }, { $lte: [monthExpr, tm] }] });
//         }
//       }

//       if (exprClauses.length) {
//         tourMatch.$expr = exprClauses.length === 1 ? exprClauses[0] : { $and: exprClauses };
//       }

//       const groupKey = hasYearRange
//         ? { year: { $year: "$lastBookingDate" }, month: { $month: "$lastBookingDate" } }
//         : { $month: "$lastBookingDate" };

//       const toursByMonth = await tourModel.aggregate([
//         { $match: tourMatch },
//         {
//           $group: {
//             _id: groupKey,
//             tourIds: { $push: "$_id" },
//           }
//         },
//         { $sort: { _id: 1 } }
//       ]);

//       const result = await Promise.all(toursByMonth.map(async (mo) => {
//         const [stats] = await tourBookingModel.aggregate([
//           { $match: { tourId: { $in: mo.tourIds } } },
//           {
//             $group: {
//               _id: null,
//               gvPool: { $sum: { $ifNull: ["$gvCancellationPool", 0] } },
//               irctcPool: { $sum: { $ifNull: ["$irctcCancellationPool", 0] } },
//             }
//           }
//         ]);
//         const baseEntry = hasYearRange
//           ? { _id: mo._id.month, year: mo._id.year }
//           : { _id: mo._id, year: parseInt(year) || new Date().getFullYear() };
//         return { ...baseEntry, gvPool: stats?.gvPool || 0, irctcPool: stats?.irctcPool || 0 };
//       }));

//       return res.status(200).json({ success: true, data: result });
//     }

//     // Year-wise (default)
//     const yearMatch = {};
//     if (hasYearRange) {
//       const yearExpr = { $year: "$lastBookingDate" };
//       const clauses = [];
//       if (fromYear) clauses.push({ $gte: [yearExpr, parseInt(fromYear)] });
//       if (toYear) clauses.push({ $lte: [yearExpr, parseInt(toYear)] });
//       yearMatch.$expr = clauses.length === 1 ? clauses[0] : { $and: clauses };
//     }

//     const toursByYear = await tourModel.aggregate([
//       ...(Object.keys(yearMatch).length ? [{ $match: yearMatch }] : []),
//       { $group: { _id: { $year: "$lastBookingDate" }, tourIds: { $push: "$_id" } } },
//       { $sort: { _id: 1 } }
//     ]);

//     const result = await Promise.all(toursByYear.map(async (yr) => {
//       const [stats] = await tourBookingModel.aggregate([
//         {
//           $match: {
//             tourId: { $in: yr.tourIds }, $or: [
//               { gvCancellationPool: { $gt: 0 } },
//               { irctcCancellationPool: { $gt: 0 } },
//             ]
//           }
//         },
//         {
//           $group: {
//             _id: null,
//             gvPool: { $sum: { $ifNull: ["$gvCancellationPool", 0] } },
//             irctcPool: { $sum: { $ifNull: ["$irctcCancellationPool", 0] } },
//           }
//         }
//       ]);
//       return { _id: yr._id, gvPool: stats?.gvPool || 0, irctcPool: stats?.irctcPool || 0 };
//     }));

//     return res.status(200).json({ success: true, data: result });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ════════════════════════════════════════════════════════════════
// //  5. TOUR LIST TABLE
// //  GET /api/touradmin/analytics-tour-list?year=&month=&type=&status=&tourId=
// //     ?fromYear=&toYear=&fromMonth=&toMonth=&type=&status=&tourId=  (range mode)
// // ════════════════════════════════════════════════════════════════
// const getAnalyticsTourList = async (req, res) => {
//   try {
//     const { year, month, type, status, tourId, fromYear, toYear, fromMonth, toMonth } = req.query;
//     const tourIds = tourId ? tourId.split(",") : [];

//     const tourQuery = buildTourDateQuery({ year, month, fromYear, toYear, fromMonth, toMonth });
//     if (tourIds.length) {
//       tourQuery._id = { $in: tourIds.map(id => new mongoose.Types.ObjectId(id)) };
//     }
//     if (type) tourQuery.batch = { $regex: type, $options: "i" };

//     const allTours = await tourModel.find(
//       tourQuery,
//       { title: 1, batch: 1, available: 1, lastBookingDate: 1 }
//     ).sort({ lastBookingDate: -1 }).lean();

//     if (!allTours.length) return res.status(200).json({ success: true, data: [] });

//     const allTourIds = allTours.map(t => t._id);
//     const bookingData = await getBookingStatsByTourIds(allTourIds);
//     let result = mergeTourBooking(allTours, bookingData);

//     if (status) {
//       result = result.filter(t => {
//         if (status === "Completed") return t.isCompleted === 1;
//         if (status === "Soldout") return t.isCompleted === 0 && t.available === false;
//         if (status === "Available") return t.isCompleted === 0 && t.available !== false;
//         return true;
//       });
//     }

//     return res.status(200).json({ success: true, data: result });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ════════════════════════════════════════════════════════════════
// //  6. TOUR SEARCH
// //  GET /api/touradmin/analytics-search?q=KER&year=2026&month=8
// //     ?q=&fromYear=&toYear=&fromMonth=&toMonth=&status=   (range mode)
// // ════════════════════════════════════════════════════════════════
// const searchAnalyticsTours = async (req, res) => {
//   try {
//     const { q, year, month, status, fromYear, toYear, fromMonth, toMonth } = req.query;
//     if (!q) return res.status(400).json({ success: false, message: "Query 'q' required" });

//     const tourQuery = {
//       title: { $regex: `^${q}`, $options: "i" },
//       ...buildTourDateQuery({ year, month, fromYear, toYear, fromMonth, toMonth }),
//     };

//     const tourDocs = await tourModel.find(
//       tourQuery,
//       { title: 1, batch: 1, available: 1, lastBookingDate: 1 }
//     ).limit(30).lean();

//     if (!tourDocs.length) return res.status(200).json({ success: true, data: [] });

//     const allTourIds = tourDocs.map(t => t._id);
//     const bookingData = await getBookingStatsByTourIds(allTourIds);
//     let result = mergeTourBooking(tourDocs, bookingData);

//     if (status) {
//       result = result.filter(t => {
//         if (status === "Completed") return t.isCompleted === 1;
//         if (status === "Active") return t.isCompleted === 0;
//         return true;
//       });
//     }

//     return res.status(200).json({ success: true, data: result });
//   } catch (err) {
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

// export {
//   loginAdmin,
//   allTours,
//   changeTourAvailability,
//   addTour,
//   tourAdminDashboard,
//   bookingsAdmin,
//   getBookings,
//   getCancellationChart,
//   upsertCancellationChart,
//   getCancellations,
//   approveCancellation,
//   rejectCancellation,
//   bookingRelease,
//   // addMissingFieldsToAllBookings,
//   getPendingApprovals,
//   approveBookingUpdate,
//   rejectBookingUpdate,
//   getAllUsers,
//   adminBookingsTour,
//   adminTourList,
//   adminAllotRooms,
//   bookingRejectAdmin,
//   generateMissingTNRs,
//   addTermsPoints,
//   deleteTermsPoint,
//   getCurrentTerms,
//   submitTermsAgreement,
//   getBookingSummaryByTNR,
//   adminCreateTourVehicle,
//   adminUpdateTourVehicle,
//   adminToggleVehicleSeatSelection,
//   adminGetTourVehicles,
//   adminDeleteTourVehicle,
//   getAllPaymentMethods,
//   adminFetchTourVehicleSeatOverview,
//   deleteBookingByTNR,
//   // ─── Export — add these to existing export {} block ──────────
//   getAnalyticsSummary,
//   getAnalyticsYearWise,
//   getAnalyticsMonthWise,
//   getAnalyticsCancellation,
//   getAnalyticsTourList,
//   searchAnalyticsTours,

// };

import mongoose from "mongoose";

import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";

import tourModel from "../models/tourModel.js";
import userModel from "../models/userModel.js";
import Terms from "../models/termModel.js";
import tourBookingModel from "../models/tourBookingmodel.js";
import cancelRuleModel from "../models/cancelRuleModel.js";
import cancellationModel from "../models/cancellationModel.js";
import tourRoomAllocationModel from "../models/roomModel.js";
import manageBookingModel from "../models/manageBookingModel.js";
import TourVehicle from "../models/tourVehicleModel.js";
import PaymentMethod from "../models/paymentModel.js";

// controllers/adminController.js   (or wherever your admin controllers live)

// Helper function to generate 6-char TNR in format: AAA9AA
function generateTNR() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const digits = "0123456789";

    // Position 1-2: uppercase letters
    let code =
        letters.charAt(Math.floor(Math.random() * letters.length)) +
        letters.charAt(Math.floor(Math.random() * letters.length));

    // Position 3-4: digits
    code +=
        digits.charAt(Math.floor(Math.random() * digits.length)) +
        digits.charAt(Math.floor(Math.random() * digits.length));

    // Position 5-6: uppercase letters
    code +=
        letters.charAt(Math.floor(Math.random() * letters.length)) +
        letters.charAt(Math.floor(Math.random() * letters.length));

    return code;
}

async function generateMissingTNRs(req, res) {
    try {
        // 1. Find all bookings without tnr
        const bookingsWithoutTNR = await tourBookingModel
            .find({ tnr: { $exists: false } })
            .select("_id tnr bookingDate contact.email userId")
            .lean();

        const count = bookingsWithoutTNR.length;

        if (count === 0) {
            return res.status(200).json({
                success: true,
                message: "No bookings are missing TNR. All bookings already have one.",
                processed: 0,
                totalChecked: await tourBookingModel.countDocuments(),
            });
        }

        console.log(`Found ${count} bookings without TNR → starting generation...`);

        let successCount = 0;
        let collisionCount = 0;
        let failed = [];

        // Process in smaller batches to avoid memory issues
        for (const booking of bookingsWithoutTNR) {
            let attempts = 0;
            let tnr = null;

            while (attempts < 15) {
                const candidate = generateTNR();

                // Check if this TNR already exists
                const conflict = await tourBookingModel.exists({ tnr: candidate });

                if (!conflict) {
                    tnr = candidate;
                    break;
                }

                collisionCount++;
                attempts++;
            }

            if (!tnr) {
                failed.push({
                    bookingId: booking._id.toString(),
                    reason: "Could not generate unique TNR after 15 attempts",
                });
                continue;
            }

            // Update the booking
            await tourBookingModel.updateOne({ _id: booking._id }, { $set: { tnr } });

            successCount++;

            // Optional: log first few for debugging
            if (successCount <= 5) {
                console.log(`Assigned TNR ${tnr} to booking ${booking._id}`);
            }
        }

        const message =
            successCount === count
                ? `Successfully generated TNR for all ${count} missing bookings.`
                : `Processed ${count} bookings: ${successCount} updated, ${failed.length} failed.`;

        return res.status(200).json({
            success: true,
            message,
            summary: {
                totalMissing: count,
                successfullyUpdated: successCount,
                collisionsDuringGeneration: collisionCount,
                failed: failed.length,
            },
            failedBookings: failed.length > 0 ? failed : undefined,
        });
    } catch (error) {
        console.error("generateMissingTNRs failed:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate missing TNRs",
            error: error.message,
        });
    }
}
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

//THIS CONTROLLER IS USED IN TOUR CONTROLERS AND DATA PAGE
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
//CHANGES THE AVAILABLITY OF TOUR
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

//Add tour controller
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
                                    ticketOpenDate: t.ticketOpenDate
                                        ? new Date(t.ticketOpenDate)
                                        : null,
                                    tripType: t.tripType || "",
                                    addons: Array.isArray(t.addons)
                                        ? t.addons
                                            .filter((a) => a && a.name)
                                            .map((a) => ({
                                                name: a.name || "",
                                                amount: Number(a.amount) || 0,
                                            }))
                                        : [],
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
                                    tripType: f.tripType || "",
                                    addons: Array.isArray(f.addons)
                                        ? f.addons
                                            .filter((a) => a && a.name)
                                            .map((a) => ({
                                                name: a.name || "",
                                                amount: Number(a.amount) || 0,
                                            }))
                                        : [],
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
                    tripType: t.tripType || "",
                    addons: Array.isArray(t.addons)
                        ? t.addons
                            .filter((a) => a && a.name)
                            .map((a) => ({
                                name: a.name || "",
                                amount: Number(a.amount) || 0,
                            }))
                        : [],
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
                    tripType: f.tripType || "",
                    addons: Array.isArray(f.addons)
                        ? f.addons
                            .filter((a) => a && a.name)
                            .map((a) => ({
                                name: a.name || "",
                                amount: Number(a.amount) || 0,
                            }))
                        : [],
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

//API to get all BOOKINGS

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

//WORKS SAME LIKE BOOKINGS ADMIN BUT LINKED TO CONTEXT SO NEEDED
const getBookings = async (req, res) => {
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
        console.error("Error in getBookings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch all bookings",
            error: error.message,
        });
    }
};

//ALL CONTROLLERS RELATED TO CANCLLATION START FROM HERE

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

// UPDATE CANCELLATION CHART (or create if not exists)
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

const getCancellations = async (req, res) => {
    try {
        // 1. Find cancellation docs that are RAISED but NOT YET APPROVED
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

        // 2. Extract TNRs (instead of bookingIds)
        const tnrs = [
            ...new Set(pendingCancellations.map((c) => c.tnr).filter(Boolean)),
        ];

        // 3. Fetch bookings by TNR + filter travellers on server side
        const bookings = await tourBookingModel
            .find({ tnr: { $in: tnrs } })
            .select("tnr travellers cancelled")
            .lean();

        // Helper: does the booking contain a traveller cancelled **by traveller only** OR **by admin only**?
        const hasValidTravellerCancellation = (booking) => {
            return booking.travellers.some(
                (t) =>
                    (t.cancelled?.byTraveller === true &&
                        t.cancelled?.byAdmin === false) ||
                    (t.cancelled?.byAdmin === true &&
                        t.cancelled?.byTraveller === false) ||
                    (t.cancelled?.byAdmin === true && t.cancelled?.byTraveller === true),
            );
        };

        const validTnrs = bookings
            .filter(hasValidTravellerCancellation)
            .map((b) => b.tnr);

        // 4. Keep only cancellation docs whose TNR passed the traveller check
        const result = pendingCancellations.filter(
            (c) => c.tnr && validTnrs.includes(c.tnr),
        );

        // 5. Populate booking & traveller data for the frontend (using TNR)
        const enriched = await Promise.all(
            result.map(async (c) => {
                const booking = await tourBookingModel
                    .findOne({ tnr: c.tnr })
                    .select(
                        "tnr userId tourId travellers contact bookingDate payment adminRemarks",
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
            }),
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
        const { tnr, travellerIds, cancellationId } = req.body;

        if (!tnr || !travellerIds || !cancellationId) {
            return res.status(400).json({
                success: false,
                message: "tnr, travellerIds, and cancellationId are required",
            });
        }

        const normalizedTnr = tnr.trim().toUpperCase();

        const cancellation = await cancellationModel
            .findOne({
                _id: cancellationId,
                tnr: normalizedTnr,
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
            .findOne({ tnr: normalizedTnr })
            .select(
                "tnr travellers gvCancellationPool irctcCancellationPool cancellationRequest payment contact.mobile",
            )
            .session(session);

        if (!booking) throw new Error("Booking not found");

        // === PENDING TRAVELLERS ===
        const pendingTravellers = (booking.travellers || []).filter(
            (t) => t.cancelled?.byTraveller === true && t.cancelled?.byAdmin !== true,
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
                (trav) => trav._id.toString() === id.toString(),
            );
            return t ? getName(t) : `Deleted Traveller (ID: ${id})`;
        });

        // === COUNT MISMATCH ===
        if (pendingCount !== requestedCount) {
            return res.status(400).json({
                success: false,
                message: `CANCELLATION BLOCKED: Traveller count mismatch

User requested : ${pendingCount} traveller(s)
Admin calculated : ${requestedCount} traveller(s)

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
        // IMPORTANT: cancellation.gvCancellationAmount / irctcCancellationAmount
        // are NOT "just this cancellation's amount" — the raise-request step
        // (raiseCancellation controller) already folds the booking's PRIOR
        // cumulative pool into these fields before saving (existingGvPool /
        // existingIrctcPool), so they already represent the FULL running
        // total for every traveller cancelled on this booking so far.
        //
        // Adding them on top of booking.gvCancellationPool here DOUBLE-COUNTS
        // every earlier cancellation. Example: traveller A approved alone →
        // pool becomes 1000. Traveller B's cancellation record is then raised
        // with gvCancellationAmount = 3000 (already = B's own deduction +
        // the existing 1000 from A). If approving B's request ADDS 3000 to
        // the already-1000 pool, the pool becomes 4000 — wrong. It should
        // simply become 3000, since B's record already IS the full total.
        //
        // So the booking's pool fields must be REPLACED with the approved
        // record's values, never added to.
        const newGvPool =
            (cancellation.gvCancellationAmount || 0) +
            (cancellation.remarksAmount || 0);
        const newIrctcPool = cancellation.irctcCancellationAmount || 0;
        const finalBalance = Math.max(0, cancellation.updatedBalance || 0);

        const setObj = {
            gvCancellationPool: newGvPool,
            irctcCancellationPool: newIrctcPool,
            cancellationRequest: false,
            cancellationReceipt: true,
            "payment.balance.amount": Number(finalBalance),
        };

        if (finalBalance === 0) {
            setObj["payment.balance.paid"] = true;
            setObj["payment.balance.paymentVerified"] = true;
            setObj["payment.balance.paidAt"] = new Date();
        }

        // === Prepare arrayFilters for positional updates ===
        const arrayFilters = [];

        // === NEW: Clear seat lock & seat number for approved travellers ===
        pendingTravellers.forEach((t, i) => {
            const elemKey = `elem${i}`;
            setObj[`travellers.$[${elemKey}].cancelled.byAdmin`] = true;
            setObj[`travellers.$[${elemKey}].cancelled.cancelledAt`] = new Date();

            // Clear seat allocation
            setObj[`travellers.$[${elemKey}].seatNumber`] = null;
            setObj[`travellers.$[${elemKey}].seatLocked`] = false;
            setObj[`travellers.$[${elemKey}].seatLockedAt`] = null;

            // Add filter for this traveller's _id
            arrayFilters.push({ [`${elemKey}._id`]: t._id });
        });

        // === Update booking with all changes ===
        await tourBookingModel.updateOne(
            { tnr: normalizedTnr },
            { $set: setObj },
            { arrayFilters, session, new: true },
        );

        // === NEW: Remove from bookedSeats in tourVehicleModel ===
        for (const traveller of pendingTravellers) {
            const seatNumber = traveller.seatNumber;
            if (!seatNumber) continue; // no seat was locked

            // Find the vehicle that has this exact seat booked for this booking
            const vehicle = await TourVehicle.findOne(
                {
                    "bookedSeats.seatNumber": seatNumber,
                    "bookedSeats.bookingId": booking._id,
                    "bookedSeats.travellerIndex": booking.travellers.indexOf(traveller),
                },
                { _id: 1, bookedSeats: 1 },
            ).session(session);

            if (vehicle) {
                // Remove the matching booked seat entry
                await TourVehicle.updateOne(
                    { _id: vehicle._id },
                    {
                        $pull: {
                            bookedSeats: {
                                seatNumber: seatNumber,
                                bookingId: booking._id,
                            },
                        },
                    },
                    { session },
                );
            }
        }

        // Approve the cancellation record
        await cancellationModel.findByIdAndUpdate(
            cancellationId,
            { approvedBy: true, approvedAt: new Date(), raisedBy: false },
            { session },
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
                tnr: normalizedTnr,
                seatsReleased: pendingTravellers
                    .map((t) => t.seatNumber)
                    .filter(Boolean),
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
        const { tnr, travellerIds, cancellationId } = req.body;

        // === VALIDATION ===
        if (
            !tnr ||
            !cancellationId ||
            !Array.isArray(travellerIds) ||
            travellerIds.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "tnr, cancellationId, and travellerIds array are required",
            });
        }

        const normalizedTnr = tnr.trim().toUpperCase();

        const cancellation = await cancellationModel
            .findOne({
                _id: cancellationId,
                tnr: normalizedTnr,
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
            id.toString(),
        );
        const missing = travellerIds.filter(
            (id) => !cancellationTravellerIds.includes(id.toString()),
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
            { session },
        );

        // === Clear cancellationRequest in main booking ===
        await tourBookingModel.updateOne(
            { tnr: normalizedTnr },
            { $set: { cancellationRequest: false } },
            { session },
        );

        await session.commitTransaction();

        return res.json({
            success: true,
            message: "Cancellation request rejected successfully",
            data: {
                tnr: normalizedTnr,
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
//REJECTING CANCELLATION IN DASHBOARD SO THAT USER END WILL GET UPDATED
const bookingRelease = async (req, res) => {
    try {
        const { tnr, travellerIds = [] } = req.body;

        // 1. Validate input
        if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
            return res.status(400).json({
                success: false,
                message: "Valid 6-character TNR is required",
            });
        }

        if (!Array.isArray(travellerIds) || travellerIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "travellerIds[] array is required and cannot be empty",
            });
        }

        // Normalize TNR (uppercase, trim)
        const normalizedTnr = tnr.trim().toUpperCase();

        // 2. Fetch booking by TNR
        const booking = await tourBookingModel.findOne({ tnr: normalizedTnr });
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `Booking with TNR ${normalizedTnr} not found`,
            });
        }

        const releasedTravellers = [];
        const notFoundTravellers = [];
        const notEligibleTravellers = [];

        const idsSet = new Set(travellerIds.map(String));

        // 3. Process travellers
        booking.travellers = booking.travellers.map((traveller) => {
            const travellerIdStr = String(traveller._id);

            if (idsSet.has(travellerIdStr)) {
                const { cancelled } = traveller;

                // Only release if cancelled by traveller AND NOT by admin
                if (cancelled?.byTraveller && !cancelled?.byAdmin) {
                    traveller.cancelled.byTraveller = false;
                    traveller.cancelled.releasedAt = new Date();
                    traveller.cancelled.releasedBy = "admin"; // optional: track who released
                    releasedTravellers.push(travellerIdStr);
                } else {
                    notEligibleTravellers.push(travellerIdStr);
                }
            }

            return traveller;
        });

        // 4. Identify any travellerIds that weren't found in this booking
        travellerIds.forEach((id) => {
            if (!booking.travellers.some((t) => String(t._id) === String(id))) {
                notFoundTravellers.push(id);
            }
        });

        // 5. If nothing was released, return detailed failure
        if (releasedTravellers.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    "No travellers were released. Only traveller-initiated cancellations (not admin-rejected) can be released.",
                details: {
                    notFoundTravellers,
                    notEligibleTravellers,
                },
            });
        }

        // 6. Save updated booking
        await booking.save();

        // 7. Success response
        res.json({
            success: true,
            message: `Released ${releasedTravellers.length} traveller(s) successfully`,
            tnr: normalizedTnr,
            releasedTravellers,
            notFoundTravellers,
            notEligibleTravellers,
        });
    } catch (error) {
        console.error("bookingRelease error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server error during release",
        });
    }
};

//DANZOR ZONE FUNCTION------DONT TOUCH THIS

// const addMissingFieldsToAllBookings = async (req, res) => {
//   try {
//     const totalBookings = await tourBookingModel.countDocuments();

//     // ─── Step 1: Add all missing fields ───────────────────────────────
//     const result = await tourBookingModel.updateMany(
//       {
//         $or: [
//           { manageBooking: { $exists: false } },
//           { advanceAdminRemarks: { $exists: false } },
//           { cancellationRequest: { $exists: false } },
//           { cancellationReceipt: { $exists: false } },
//           { manageBookingReceipt: { $exists: false } },
//           { emergencyContact: { $exists: false } },
//           { termsAgreed: { $exists: false } },
//           { termsAgreedAt: { $exists: false } },
//           { "travellers.seatNumber": { $exists: false } },
//           { "travellers.seatLocked": { $exists: false } },
//           { "travellers.vehicleId": { $exists: false } },
//           { "travellers.vehicleName": { $exists: false } },
//           // ✅ NEW — cancellation pool fields
//           { gvCancellationPool: { $exists: false } },
//           { irctcCancellationPool: { $exists: false } },
//         ],
//       },
//       {
//         $set: {
//           manageBooking: false,
//           advanceAdminRemarks: [],
//           cancellationRequest: false,
//           cancellationReceipt: false,
//           manageBookingReceipt: false,
//           emergencyContact: null,
//           termsAgreed: false,
//           termsAgreedAt: null,
//           "travellers.$[].seatNumber": null,
//           "travellers.$[].seatLocked": false,
//           "travellers.$[].seatLockedAt": null,
//           "travellers.$[].vehicleId": null,
//           "travellers.$[].vehicleName": null,
//         },
//       },
//     );

//     // ─── Step 2: cancellation pool — SEPARATE updateMany ──────────────
//     // ✅ Separate ஆ பண்றோம் — already value இருக்கற docs overwrite ஆகாம இருக்கும்
//     const poolResult = await tourBookingModel.updateMany(
//       {
//         $or: [
//           { gvCancellationPool: { $exists: false } },
//           { irctcCancellationPool: { $exists: false } },
//         ],
//       },
//       {
//         $set: {
//           gvCancellationPool: 0,
//           irctcCancellationPool: 0,
//         },
//       },
//     );

//     res.status(200).json({
//       success: true,
//       message: "Migration completed successfully!",
//       data: {
//         totalBookings,
//         step1: {
//           matchedCount: result.matchedCount,
//           modifiedCount: result.modifiedCount,
//           fieldsEnsured: [
//             "manageBooking",
//             "advanceAdminRemarks",
//             "cancellationRequest",
//             "cancellationReceipt",
//             "manageBookingReceipt",
//             "emergencyContact",
//             "termsAgreed",
//             "termsAgreedAt",
//             "travellers.seatNumber",
//             "travellers.seatLocked",
//             "travellers.seatLockedAt",
//             "travellers.vehicleId",
//             "travellers.vehicleName",
//           ],
//         },
//         step2: {
//           matchedCount: poolResult.matchedCount,
//           modifiedCount: poolResult.modifiedCount,
//           fieldsEnsured: [
//             "gvCancellationPool → 0 (only missing docs)",
//             "irctcCancellationPool → 0 (only missing docs)",
//           ],
//           note: "Existing cancellation pool values were NOT overwritten ✅",
//         },
//       },
//     });
//   } catch (error) {
//     console.error("Migration failed:", error);
//     res.status(500).json({
//       success: false,
//       message: "Migration failed",
//       error: error.message,
//     });
//   }
// };


//MANAGE BOOKING RELATED CONTROLLER GET PENDING APPROVALS
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
                    "tnr travellers contact bookingType payment receipts bookingDate gvCancellationPool irctcCancellationPool adminRemarks",
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

//APPROVE THE BOOKING UPDATE REQUEST IN THE MANAGE BOOKING APPROVALS PAGE

const approveBookingUpdate = async (req, res) => {
    try {
        const { bookingId } = req.body;

        if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({
                success: false,
                message: "Valid bookingId is required",
            });
        }

        // Step 1: Find pending manageBooking request
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
                travellers: manageBooking.travellers,
                contact: manageBooking.contact,
                billingAddress: manageBooking.billingAddress,
                adminRemarks: manageBooking.adminRemarks || [],
                manageBooking: false,
                manageBookingReceipt: true,
            },
        };

        // Only if travellers were reduced in this request → reset paid flags + receipt flags
        if (manageBooking.travellersReduced === true) {
            updateData.$set["payment.advance.paid"] = false;
            updateData.$set["payment.advance.paymentVerified"] = false; // optional clean-up
            updateData.$set["receipts.advanceReceiptSent"] = false;
            updateData.$set["receipts.advanceReceiptSentAt"] = null;
        }

        // Step 3: Apply update to original booking
        const updatedTourBooking = await tourBookingModel.findByIdAndUpdate(
            bookingId,
            updateData,
            { new: true, runValidators: true },
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
            { $set: { approvedBy: true, raisedBy: false, manageBooking: false } },
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
//REJECT THE BOOKING UPDATE REQUEST IN THE MANAGE BOOKING APPROVALS PAGE
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
            { new: true, runValidators: true },
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

//GET ALL USERS DATA FOR ALL USERS PAGE
const getAllUsers = async (req, res) => {
    try {
        const users = await userModel
            .find({})
            .select("name email phone address gender dob image createdAt")
            .sort({ createdAt: -1 })
            .lean();

        // ← ADD: _id timestamp fallback for users without createdAt
        const enriched = users.map(u => ({
            ...u,
            createdAt: u.createdAt || u._id.getTimestamp(),
        }));

        res.json({
            success: true,
            total: enriched.length,
            users: enriched,
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
};

const adminBookingsTour = async (req, res) => {
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

const adminTourList = async (req, res) => {
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

//ADMIN ROOM LIST HELPER FUNCTION AND CONTROLLERS

// === Helper Functions ===
const getBasicTravelerInfo = (t) => ({
    title: t.title,
    firstName: t.firstName,
    lastName: t.lastName,
    age: t.age,
    gender: t.gender,
    sharingType: t.sharingType,
});
const assignRoomNumbers = (rooms) =>
    rooms.map((r, i) => ({ ...r, roomNumber: i + 1 }));

const adminAllotRooms = async (req, res) => {
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
            .sort((a, b) => a.contactMobile.localeCompare(b.contactMobile))
            .map((g) => ({
                contactMobile: g.contactMobile,
                bookingIds: Array.from(g.bookingIds),
                rooms: g.rooms.map((r) => ({ ...r, roomNumber: globalRoomCounter++ })),
            }));

        // === Check existing finalized allocation ===
        const existing = await tourRoomAllocationModel.findOne({
            tourId: objectTourId,
        });

        const manualGuests = existing?.manuallyAddedRooms?.guests || [];
        const manualLeaders = existing?.manuallyAddedRooms?.leaders || [];

        manualGuests.forEach((room) => { room.roomNumber = globalRoomCounter++; });
        manualLeaders.forEach((room) => { room.roomNumber = globalRoomCounter++; });

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

//Rejects booking from booking rejection section
const bookingRejectAdmin = async (req, res) => {
    try {
        const { tnr, travellerIds = [] } = req.body;

        // Validate input
        if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
            return res.status(400).json({
                success: false,
                message: "Valid 6-character TNR is required",
            });
        }

        if (!Array.isArray(travellerIds) || travellerIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "travellerIds[] array is required and cannot be empty",
            });
        }

        const normalizedTnr = tnr.trim().toUpperCase();

        // Fetch booking by TNR
        const booking = await tourBookingModel.findOne({ tnr: normalizedTnr });
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found with this TNR",
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

        // Normalize traveller IDs
        const idsSet = new Set(travellerIds.map(String));

        // Check for travellers that block rejection
        const cancelledByTraveller = [];
        const alreadyRejectedTravellers = [];
        const missingTravellers = [];

        travellerIds.forEach((id) => {
            const traveller = booking.travellers.find(
                (t) => String(t._id) === String(id),
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
                0,
            );
        }

        await booking.save();

        res.json({
            success: true,
            message: "Traveller(s) rejected successfully",
            updatedBalance: booking.payment.balance.amount,
            rejectedTravellers: rejectedTravellers.map((t) => String(t._id)),
            tnr: normalizedTnr,
        });
    } catch (error) {
        console.error("bookingRejectAdmin error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// Add this new function

const deleteBookingByTNR = async (req, res) => {
    try {
        const { tnr } = req.body;

        if (!tnr || typeof tnr !== "string" || tnr.trim().length !== 6) {
            return res.status(400).json({
                success: false,
                message: "Valid 6-character TNR is required",
            });
        }

        const normalizedTNR = tnr.trim().toUpperCase();

        const booking = await tourBookingModel.findOne({ tnr: normalizedTNR });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: `No booking found with TNR ${normalizedTNR}`,
            });
        }

        // Optional: Prevent deletion if already paid / completed / etc.
        if (booking.payment?.balance?.paid) {
            return res.status(403).json({
                success: false,
                message:
                    "Cannot delete this booking — balance payment has already been made.",
            });
        }

        if (booking.isBookingCompleted) {
            return res.status(403).json({
                success: false,
                message: "Cannot delete completed bookings.",
            });
        }

        // Actually delete
        await tourBookingModel.deleteOne({ tnr: normalizedTNR });

        return res.json({
            success: true,
            message: `Booking with TNR ${normalizedTNR} has been permanently deleted.`,
            deletedTNR: normalizedTNR,
        });
    } catch (error) {
        console.error("deleteBookingByTNR error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while deleting booking",
            error: error.message,
        });
    }
};

const addTermsPoints = async (req, res) => {
    try {
        const { points } = req.body;

        // Basic input validation
        if (!points || !Array.isArray(points) || points.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please send an array of points (at least one item required)",
            });
        }

        // Find or create the current active terms document
        let termsDoc = await Terms.findOne({ isCurrent: true });

        if (!termsDoc) {
            // First time → create initial document
            termsDoc = new Terms({
                version: "1.0",
                effectiveFrom: new Date(),
                isCurrent: true,
                points: [],
                // lastUpdatedBy: req.user?._id || null,   ← removed / commented
                changeSummary: "Initial Terms & Conditions created (first time)",
            });
        }

        // Calculate next order number
        let nextOrder = 1;
        if (termsDoc.points.length > 0) {
            const orders = termsDoc.points.map((p) => p.order || 0);
            nextOrder = Math.max(...orders) + 1;
        }

        // Prepare and validate new points
        const newPoints = [];

        for (let i = 0; i < points.length; i++) {
            const input = points[i];

            let text = "";
            let internalNote = "";

            if (typeof input === "string") {
                text = input.trim();
            } else if (typeof input === "object" && input !== null) {
                text = (input.text || "").trim();
                internalNote = (input.internalNote || "").trim();
            }

            if (!text || text.length < 10) {
                return res.status(400).json({
                    success: false,
                    message: `Point #${i + 1} is invalid: text must be at least 10 characters`,
                });
            }

            newPoints.push({
                order: nextOrder + i,
                text,
                active: true,
                internalNote,
                createdAt: new Date(),
            });
        }

        // Append new points
        termsDoc.points.push(...newPoints);

        // Update metadata — removed dependency on req.user
        // termsDoc.lastUpdatedBy = req.user?._id || null;   ← commented out
        termsDoc.lastUpdatedAt = new Date();
        termsDoc.changeSummary = `Added ${newPoints.length} new point(s) - ${new Date().toISOString().split("T")[0]} (admin action)`;

        // Save
        await termsDoc.save();

        // Prepare clean response (only active & sorted points)
        const activeSortedPoints = termsDoc.points
            .filter((p) => p.active === true)
            .sort((a, b) => a.order - b.order)
            .map((p) => ({
                order: p.order,
                text: p.text,
                // internalNote is intentionally NOT sent to frontend
            }));

        return res.status(200).json({
            success: true,
            message: `Successfully added ${newPoints.length} point(s)`,
            data: {
                version: termsDoc.version,
                effectiveFrom: termsDoc.effectiveFrom,
                totalActivePoints: activeSortedPoints.length,
                points: activeSortedPoints,
            },
        });
    } catch (error) {
        console.error("addTermsPoints error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add terms points",
            error: error.message,
        });
    }
};

const deleteTermsPoint = async (req, res) => {
    try {
        const { pointId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(pointId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid point ID format",
            });
        }

        // Find current active terms document
        const termsDoc = await Terms.findOne({ isCurrent: true });

        if (!termsDoc) {
            return res.status(404).json({
                success: false,
                message: "No active terms document found",
            });
        }

        // Find the point by its _id
        const point = termsDoc.points.id(pointId);

        if (!point) {
            return res.status(404).json({
                success: false,
                message: "Point not found in current terms",
            });
        }

        // Deactivate instead of pull/remove (preserves history)
        point.active = false;
        point.updatedAt = new Date();

        // Update metadata
        termsDoc.lastUpdatedAt = new Date();
        termsDoc.changeSummary = `Deactivated point #${point.order} - ${new Date().toISOString().split("T")[0]}`;
        // termsDoc.lastUpdatedBy = req.user._id;  // uncomment when auth is fixed

        await termsDoc.save();

        // Prepare clean response (active points only)
        const activeSortedPoints = termsDoc.points
            .filter((p) => p.active === true)
            .sort((a, b) => a.order - b.order)
            .map((p) => ({
                order: p.order,
                text: p.text,
            }));

        return res.status(200).json({
            success: true,
            message: `Point #${point.order} deactivated successfully`,
            data: {
                version: termsDoc.version,
                totalActivePoints: activeSortedPoints.length,
                points: activeSortedPoints,
            },
        });
    } catch (error) {
        console.error("deleteTermsPoint error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to deactivate terms point",
            error: error.message,
        });
    }
};

// controllers/tourAdminController.js (or termsController.js)

// Import your Terms model (adjust path if needed)

const getCurrentTerms = async (req, res) => {
    try {
        // Find the current active version
        const termsDoc = await Terms.findOne({ isCurrent: true })
            .select("version effectiveFrom points") // only needed fields
            .lean(); // faster, plain JS object

        if (!termsDoc) {
            return res.status(200).json({
                success: true,
                message: "No terms & conditions defined yet",
                data: {
                    version: "N/A",
                    effectiveFrom: null,
                    points: [],
                },
            });
        }

        // Filter active points and sort by order
        const activePoints = termsDoc.points
            .filter((p) => p.active === true)
            .sort((a, b) => a.order - b.order)
            .map((p) => ({
                _id: p._id.toString(),
                order: p.order,
                text: p.text,
            }));

        return res.status(200).json({
            success: true,
            message: "Current terms & conditions fetched",
            data: {
                version: termsDoc.version,
                effectiveFrom: termsDoc.effectiveFrom,
                totalActivePoints: activePoints.length,
                points: activePoints,
            },
        });
    } catch (error) {
        console.error("getCurrentTerms error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch terms & conditions",
            error: error.message,
        });
    }
};

const submitTermsAgreement = async (req, res) => {
    try {
        const { tnr } = req.params;
        const { emergencyContact, termsAgreed } = req.body;

        // Validation
        if (!tnr || tnr.length !== 6 || !/^[A-Z0-9]{6}$/.test(tnr)) {
            return res.status(400).json({
                success: false,
                message: "Invalid TNR format",
            });
        }

        if (
            !emergencyContact ||
            !/^[\d+\-\s()]{7,25}$/.test(emergencyContact.trim())
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid emergency contact number (7–25 characters: digits, +, -, spaces, parentheses allowed)",
            });
        }

        if (!termsAgreed) {
            return res.status(400).json({
                success: false,
                message: "You must agree to the terms and conditions",
            });
        }

        // Find booking by TNR
        const booking = await tourBookingModel.findOne({ tnr: tnr.toUpperCase() });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found with this TNR",
            });
        }

        // Check if already agreed
        if (booking.termsAgreed) {
            return res.status(400).json({
                success: false,
                message: "Terms already agreed for this booking",
            });
        }

        // Update booking
        booking.emergencyContact = emergencyContact;
        booking.termsAgreed = true;
        booking.termsAgreedAt = new Date();

        await booking.save();

        return res.status(200).json({
            success: true,
            message: "Terms agreed successfully. Thank you!",
            data: {
                tnr: booking.tnr,
                emergencyContact: booking.emergencyContact,
                termsAgreed: booking.termsAgreed,
                termsAgreedAt: booking.termsAgreedAt,
            },
        });
    } catch (error) {
        console.error("submitTermsAgreement error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to submit terms agreement",
            error: error.message,
        });
    }
};
const getBookingSummaryByTNR = async (req, res) => {
    try {
        const { tnr } = req.params;

        const booking = await tourBookingModel
            .findOne({ tnr: tnr.toUpperCase() })
            .select(
                "tnr tourData.title travellers emergencyContact termsAgreed termsAgreedAt",
            )
            .lean();

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        const travellers = booking.travellers || [];

        // Gender counts
        const males = travellers.filter(
            (t) => t.gender?.toLowerCase() === "male",
        ).length;

        const females = travellers.filter(
            (t) => t.gender?.toLowerCase() === "female",
        ).length;

        // Child detection (age < 12)
        const children = travellers.filter((t) => t.age < 12);

        const childrenWithBerth = children.filter(
            (t) => t.sharingType === "withBerth",
        ).length;

        const childrenWithoutBerth = children.filter(
            (t) => t.sharingType === "withoutBerth",
        ).length;

        return res.status(200).json({
            success: true,
            data: {
                tnr: booking.tnr,
                tourTitle: booking.tourData?.title || "N/A",
                totalTravellers: travellers.length,
                males,
                females,
                children: {
                    total: children.length,
                    withBerth: childrenWithBerth,
                    withoutBerth: childrenWithoutBerth,
                },
                // Return full travellers array so frontend can show names
                travellers: travellers.map((t) => ({
                    firstName: t.firstName || "",
                    lastName: t.lastName || "",
                    title: t.title || "",
                    age: t.age,
                    gender: t.gender,
                    sharingType: t.sharingType,
                })),
                emergencyContact: booking.emergencyContact || null,
                termsAgreed: booking.termsAgreed || false,
                termsAgreedAt: booking.termsAgreedAt || null,
            },
        });
    } catch (err) {
        console.error("getBookingSummaryByTNR error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message,
        });
    }
};
//SAM related controllers
const adminCreateTourVehicle = async (req, res) => {
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
const adminUpdateTourVehicle = async (req, res) => {
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

const adminToggleVehicleSeatSelection = async (req, res) => {
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

const adminGetTourVehicles = async (req, res) => {
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
const adminDeleteTourVehicle = async (req, res) => {
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
const adminFetchTourVehicleSeatOverview = async (req, res) => {
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

// ════════════════════════════════════════════════════════════════
//  ANALYTICS — replace existing analytics section in touradminController.js
//
//  RANGE FILTER SUPPORT ADDED:
//  - year / month        -> existing single-value filters (unchanged behaviour)
//  - fromYear / toYear    -> year RANGE (e.g. 2025–2029), inclusive both ends
//  - fromMonth / toMonth  -> month RANGE (e.g. Jan–Jun = 1–6), inclusive,
//                            applied INDEPENDENTLY within each matched year
//                            (NOT a single cross-year date span)
//
//  Combining rules (confirmed):
//  - year range + month range are independent AND filters.
//    e.g. fromYear=2025&toYear=2029&fromMonth=1&toMonth=6 means:
//    "tours whose departure falls in Jan–Jun of ANY year from 2025–2029"
//  - If both single (year/month) AND range (fromYear.../fromMonth...) params
//    are sent, range params take priority (single values are legacy/back-compat).
//
//  ── TRAVELLER STATUS DEFINITIONS (confirmed, single source of truth) ──
//  Active            = payment.advance.paid = true  AND byAdmin ≠ true AND byTraveller ≠ true
//  Unverified        = payment.advance.paid ≠ true  AND byAdmin ≠ true
//                       (an unpaid traveller who was separately
//                       rejected/cancelled by admin shows up as
//                       Rejected/Cancelled, NOT Unverified)
//  Cancellation req. = payment.advance.paid = true  AND byTraveller = true AND byAdmin ≠ true
//  Cancelled         = byAdmin = true AND byTraveller = true
//  Rejected          = byAdmin = true AND byTraveller ≠ true
//
//  These 5 sets are mutually exclusive and collectively exhaustive over all
//  travellers in a booking — every traveller falls into exactly one bucket:
//    - byAdmin = true  -> Cancelled or Rejected (split by byTraveller)
//    - byAdmin ≠ true, advance.paid = true, byTraveller = true  -> Cancellation request
//    - byAdmin ≠ true, advance.paid = true, byTraveller ≠ true  -> Active
//    - byAdmin ≠ true, advance.paid ≠ true                      -> Unverified
// ════════════════════════════════════════════════════════════════

// ─── Helper: tour departure date filter (single OR range) ──────────────
function buildTourDateQuery({ year, month, fromYear, toYear, fromMonth, toMonth }) {
    const q = {};
    const exprClauses = [];

    const hasYearRange = fromYear || toYear;
    const hasMonthRange = fromMonth || toMonth;

    if (hasYearRange) {
        const fy = fromYear ? parseInt(fromYear) : null;
        const ty = toYear ? parseInt(toYear) : null;
        const yearExpr = { $year: "$lastBookingDate" };
        if (fy !== null) exprClauses.push({ $gte: [yearExpr, fy] });
        if (ty !== null) exprClauses.push({ $lte: [yearExpr, ty] });
    }

    if (hasMonthRange) {
        const fm = fromMonth ? parseInt(fromMonth) : 1;
        const tm = toMonth ? parseInt(toMonth) : 12;
        const monthExpr = { $month: "$lastBookingDate" };
        if (fm <= tm) {
            // Normal range within a year, e.g. Jan(1)–Jun(6)
            exprClauses.push({ $gte: [monthExpr, fm] });
            exprClauses.push({ $lte: [monthExpr, tm] });
        } else {
            // Wrap-around range, e.g. Nov(11)–Feb(2) -> month >= 11 OR month <= 2
            exprClauses.push({ $or: [{ $gte: [monthExpr, fm] }, { $lte: [monthExpr, tm] }] });
        }
    }

    if (exprClauses.length) {
        q.$expr = exprClauses.length === 1 ? exprClauses[0] : { $and: exprClauses };
        return q;
    }

    // ── Legacy single year/month (back-compat, used when no range params sent) ──
    if (year && month) {
        const y = parseInt(year), m = parseInt(month);
        q.lastBookingDate = { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) };
    } else if (year) {
        const y = parseInt(year);
        q.lastBookingDate = { $gte: new Date(`${y}-01-01`), $lt: new Date(`${y + 1}-01-01`) };
    } else if (month) {
        q.$expr = { $eq: [{ $month: "$lastBookingDate" }, parseInt(month)] };
    }
    return q;
}


// ════════════════════════════════════════════════════════════════
//  Updated helper functions for tour list table
//  Replace in touradminController.js
// ════════════════════════════════════════════════════════════════

// ─── Helper: booking stats per tourId ────────────────────────
async function getBookingStatsByTourIds(tourIds) {
    if (!tourIds.length) return [];
    return tourBookingModel.aggregate([
        { $match: { tourId: { $in: tourIds } } },
        {
            $group: {
                _id: "$tourId",
                totalTNR: { $sum: 1 },

                // ── Travellers (active) ──
                // Includes: never-cancelled + cancel-request-pending + unverified travellers
                // Excludes: travellers where byAdmin=true (covers both "cancelled" and "rejected")
                totalTravellers: {
                    $sum: {
                        $size: {
                            $filter: {
                                input: "$travellers", as: "t",
                                cond: { $ne: ["$$t.cancelled.byAdmin", true] }
                            }
                        }
                    }
                },

                // ── Cancelled Travellers (new column) = cancelled + rejected combined ──
                // cancelled: byAdmin=true AND byTraveller=true
                // rejected:  byAdmin=true AND byTraveller≠true
                // combined condition: byAdmin=true (covers both cases)
                cancelledTravellers: {
                    $sum: {
                        $size: {
                            $filter: {
                                input: "$travellers", as: "t",
                                cond: { $eq: ["$$t.cancelled.byAdmin", true] }
                            }
                        }
                    }
                },

                // ── Gender: same group as totalTravellers (byAdmin ≠ true) ──
                totalFemale: {
                    $sum: {
                        $size: {
                            $filter: {
                                input: "$travellers", as: "t",
                                cond: {
                                    $and: [
                                        { $eq: ["$$t.gender", "Female"] },
                                        { $gt: ["$$t.age", 10] },
                                        { $ne: ["$$t.cancelled.byAdmin", true] }
                                    ]
                                }
                            }
                        }
                    }
                },
                totalMale: {
                    $sum: {
                        $size: {
                            $filter: {
                                input: "$travellers", as: "t",
                                cond: {
                                    $and: [
                                        { $eq: ["$$t.gender", "Male"] },
                                        { $gt: ["$$t.age", 10] },
                                        { $ne: ["$$t.cancelled.byAdmin", true] }
                                    ]
                                }
                            }
                        }
                    }
                },
                totalChild: {
                    $sum: {
                        $size: {
                            $filter: {
                                input: "$travellers", as: "t",
                                cond: {
                                    $and: [
                                        { $in: ["$$t.sharingType", ["withBerth", "withoutBerth"]] },
                                        { $ne: ["$$t.cancelled.byAdmin", true] }
                                    ]
                                }
                            }
                        }
                    }
                },

                // ── Card-expand breakdown (for mobile TourCard) ──
                // Unverified = advance NOT paid, AND byAdmin ≠ true (excludes
                // travellers who were separately rejected/cancelled by admin —
                // those show up under Rejected/Cancelled instead).
                unverifiedTravellers: {
                    $sum: {
                        $cond: [
                            { $ne: ["$payment.advance.paid", true] },
                            {
                                $size: {
                                    $filter: {
                                        input: "$travellers", as: "t",
                                        cond: { $ne: ["$$t.cancelled.byAdmin", true] }
                                    }
                                }
                            },
                            0
                        ]
                    }
                },

                // Active: advance PAID + byAdmin≠true AND byTraveller≠true
                activeTravellers: {
                    $sum: {
                        $cond: [
                            { $eq: ["$payment.advance.paid", true] },
                            {
                                $size: {
                                    $filter: {
                                        input: "$travellers", as: "t",
                                        cond: {
                                            $and: [
                                                { $ne: ["$$t.cancelled.byAdmin", true] },
                                                { $ne: ["$$t.cancelled.byTraveller", true] },
                                            ]
                                        }
                                    }
                                }
                            },
                            0
                        ]
                    }
                },

                // Cancellation request: advance PAID + byTraveller=true AND byAdmin≠true
                // (advance.paid=true is REQUIRED — a traveller can only request
                // cancellation on a booking they've actually paid the advance for.
                // Without this condition, an unpaid+byTraveller=true traveller would
                // be double-counted here AND in unverifiedTravellers above.)
                cancellationRequestTravellers: {
                    $sum: {
                        $cond: [
                            { $eq: ["$payment.advance.paid", true] },
                            {
                                $size: {
                                    $filter: {
                                        input: "$travellers", as: "t",
                                        cond: {
                                            $and: [
                                                { $eq: ["$$t.cancelled.byTraveller", true] },
                                                { $ne: ["$$t.cancelled.byAdmin", true] },
                                            ]
                                        }
                                    }
                                }
                            },
                            0
                        ]
                    }
                },

                fullyCancelledTravellers: {
                    $sum: {
                        $size: {
                            $filter: {
                                input: "$travellers", as: "t",
                                cond: {
                                    $and: [
                                        { $eq: ["$$t.cancelled.byAdmin", true] },
                                        { $eq: ["$$t.cancelled.byTraveller", true] },
                                    ]
                                }
                            }
                        }
                    }
                },
                rejectedTravellers: {
                    $sum: {
                        $size: {
                            $filter: {
                                input: "$travellers", as: "t",
                                cond: {
                                    $and: [
                                        { $eq: ["$$t.cancelled.byAdmin", true] },
                                        { $ne: ["$$t.cancelled.byTraveller", true] },
                                    ]
                                }
                            }
                        }
                    }
                },

                // ── Tour status ──
                isCompleted: { $max: { $cond: ["$isTripCompleted", 1, 0] } },

                // ── Cancellation pools ──
                gvPool: { $sum: { $ifNull: ["$gvCancellationPool", 0] } },
                irctcPool: { $sum: { $ifNull: ["$irctcCancellationPool", 0] } },
            }
        }
    ]);
}

// ─── Helper: merge tour + booking data ───────────────────────
function mergeTourBooking(allTours, bookingData) {
    const bookingMap = {};
    bookingData.forEach(b => { bookingMap[b._id?.toString()] = b; });

    return allTours.map(t => {
        const id = t._id.toString();
        const b = bookingMap[id] || {};
        return {
            _id: id,
            tourName: t.title || "—",
            tourType: t.batch || "—",
            available: t.available ?? null,
            departureDate: t.lastBookingDate || null,
            totalTNR: b.totalTNR || 0,
            totalTravellers: b.totalTravellers || 0,
            cancelledTravellers: b.cancelledTravellers || 0,        // NEW column
            totalFemale: b.totalFemale || 0,
            totalMale: b.totalMale || 0,
            totalChild: b.totalChild || 0,
            // breakdown — used by mobile card expand view
            unverifiedTravellers: b.unverifiedTravellers || 0,
            activeTravellers: b.activeTravellers || 0,
            cancellationRequestTravellers: b.cancellationRequestTravellers || 0,
            fullyCancelledTravellers: b.fullyCancelledTravellers || 0,
            rejectedTravellers: b.rejectedTravellers || 0,
            isCompleted: b.isCompleted ?? 0,
            gvPool: b.gvPool || 0,
            irctcPool: b.irctcPool || 0,
        };
    });
}

// ════════════════════════════════════════════════════════════════
//  Sanity check (run manually in DB to verify):
//  totalTravellers + cancelledTravellers === sum of all travellers in booking
//  (because totalTravellers uses byAdmin≠true, cancelledTravellers uses byAdmin=true
//   — these are complementary sets with zero overlap and zero gap)
// ════════════════════════════════════════════════════════════════


function emptyStats() {
    return {
        totalTours: 0,
        totalBookings: 0, unverifiedBookings: 0, activeBookings: 0,
        completedBookings: 0, fullyCancelledBookings: 0, rejectedBookings: 0,
        totalTravellers: 0, activeTravellers: 0, cancelledTravellers: 0,
        cancellationRequestTravellers: 0, rejectedTravellers: 0,
        totalFemale: 0, totalMale: 0, totalChild: 0,
        totalGVPool: 0, totalIRCTCPool: 0, totalCancelAmount: 0,
    };
}


// ════════════════════════════════════════════════════════════════
//  1. SUMMARY
//  GET /api/touradmin/analytics-summary
//     ?year=&month=&tourId=
//     ?fromYear=&toYear=&fromMonth=&toMonth=&tourId=   (range mode)
// ════════════════════════════════════════════════════════════════
const getAnalyticsSummary = async (req, res) => {
    try {
        const { year, month, tourId, fromYear, toYear, fromMonth, toMonth } = req.query;
        const tourIds = tourId ? tourId.split(",") : [];

        const tourQuery = buildTourDateQuery({ year, month, fromYear, toYear, fromMonth, toMonth });
        if (tourIds.length) {
            tourQuery._id = { $in: tourIds.map(id => new mongoose.Types.ObjectId(id)) };
        }

        let matchTourIds = [];
        const hasAnyDateFilter = year || month || fromYear || toYear || fromMonth || toMonth || tourIds.length;
        if (hasAnyDateFilter) {
            const tours = await tourModel.find(tourQuery, { _id: 1 }).lean();
            matchTourIds = tours.map(t => t._id);
            if (!matchTourIds.length) {
                return res.status(200).json({ success: true, data: emptyStats() });
            }
        }

        const bookingMatch = matchTourIds.length ? { tourId: { $in: matchTourIds } } : {};

        // ── Helper expressions ──────────────────────────────────────

        const allCancelledExpr = {
            $and: [
                { $gt: [{ $size: "$travellers" }, 0] },
                {
                    $eq: [
                        { $size: "$travellers" },
                        {
                            $size: {
                                $filter: {
                                    input: "$travellers", as: "t",
                                    cond: {
                                        $and: [
                                            { $eq: ["$$t.cancelled.byAdmin", true] },
                                            { $eq: ["$$t.cancelled.byTraveller", true] },
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            ]
        };

        const allRejectedExpr = {
            $and: [
                { $gt: [{ $size: "$travellers" }, 0] },
                {
                    $eq: [
                        { $size: "$travellers" },
                        {
                            $size: {
                                $filter: {
                                    input: "$travellers", as: "t",
                                    cond: {
                                        $and: [
                                            { $eq: ["$$t.cancelled.byAdmin", true] },
                                            { $ne: ["$$t.cancelled.byTraveller", true] },
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            ]
        };

        const [stats] = await tourBookingModel.aggregate([
            { $match: bookingMatch },
            {
                $group: {
                    _id: null,

                    totalBookings: { $sum: 1 },

                    unverifiedBookings: {
                        $sum: {
                            $cond: [{
                                $and: [
                                    { $ne: ["$payment.advance.paid", true] },
                                    { $not: allCancelledExpr },
                                    { $not: allRejectedExpr },
                                ]
                            }, 1, 0]
                        }
                    },

                    activeBookings: {
                        $sum: {
                            $cond: [{
                                $and: [
                                    { $eq: ["$payment.advance.paid", true] },
                                    { $ne: ["$payment.balance.paid", true] },
                                    { $not: allCancelledExpr },
                                    { $not: allRejectedExpr },
                                ]
                            }, 1, 0]
                        }
                    },

                    completedBookings: {
                        $sum: {
                            $cond: [{
                                $and: [
                                    { $eq: ["$payment.advance.paid", true] },
                                    { $eq: ["$payment.balance.paid", true] },
                                    { $not: allCancelledExpr },
                                    { $not: allRejectedExpr },
                                ]
                            }, 1, 0]
                        }
                    },

                    fullyCancelledBookings: {
                        $sum: { $cond: [allCancelledExpr, 1, 0] }
                    },

                    rejectedBookings: {
                        $sum: { $cond: [allRejectedExpr, 1, 0] }
                    },

                    // ── Travellers ──────────────────────────────────────────

                    totalTravellers: { $sum: { $size: "$travellers" } },

                    // Unverified = advance NOT paid, AND byAdmin ≠ true (excludes
                    // travellers who were separately rejected/cancelled by admin).
                    unverifiedTravellers: {
                        $sum: {
                            $cond: [
                                { $ne: ["$payment.advance.paid", true] },
                                {
                                    $size: {
                                        $filter: {
                                            input: "$travellers", as: "t",
                                            cond: { $ne: ["$$t.cancelled.byAdmin", true] }
                                        }
                                    }
                                },
                                0
                            ]
                        }
                    },

                    // Active traveller: advance PAID + byAdmin=false AND byTraveller=false
                    activeTravellers: {
                        $sum: {
                            $cond: [
                                { $eq: ["$payment.advance.paid", true] },
                                {
                                    $size: {
                                        $filter: {
                                            input: "$travellers", as: "t",
                                            cond: {
                                                $and: [
                                                    { $ne: ["$$t.cancelled.byAdmin", true] },
                                                    { $ne: ["$$t.cancelled.byTraveller", true] },
                                                ]
                                            }
                                        }
                                    }
                                },
                                0
                            ]
                        }
                    },

                    // Cancelled traveller: byAdmin=true AND byTraveller=true
                    cancelledTravellers: {
                        $sum: {
                            $size: {
                                $filter: {
                                    input: "$travellers", as: "t",
                                    cond: {
                                        $and: [
                                            { $eq: ["$$t.cancelled.byAdmin", true] },
                                            { $eq: ["$$t.cancelled.byTraveller", true] },
                                        ]
                                    }
                                }
                            }
                        }
                    },

                    // Cancel request: advance PAID + byTraveller=true AND byAdmin=false
                    // (advance.paid=true required — see definitions block at top of file)
                    cancellationRequestTravellers: {
                        $sum: {
                            $cond: [
                                { $eq: ["$payment.advance.paid", true] },
                                {
                                    $size: {
                                        $filter: {
                                            input: "$travellers", as: "t",
                                            cond: {
                                                $and: [
                                                    { $eq: ["$$t.cancelled.byTraveller", true] },
                                                    { $ne: ["$$t.cancelled.byAdmin", true] },
                                                ]
                                            }
                                        }
                                    }
                                },
                                0
                            ]
                        }
                    },

                    // Rejected traveller: byAdmin=true AND byTraveller=false
                    rejectedTravellers: {
                        $sum: {
                            $size: {
                                $filter: {
                                    input: "$travellers", as: "t",
                                    cond: {
                                        $and: [
                                            { $eq: ["$$t.cancelled.byAdmin", true] },
                                            { $ne: ["$$t.cancelled.byTraveller", true] },
                                        ]
                                    }
                                }
                            }
                        }
                    },

                    // ── Gender (advance paid + NOT cancelled) ────────────────

                    totalFemale: {
                        $sum: {
                            $cond: [
                                { $eq: ["$payment.advance.paid", true] },
                                {
                                    $size: {
                                        $filter: {
                                            input: "$travellers", as: "t",
                                            cond: {
                                                $and: [
                                                    { $eq: ["$$t.gender", "Female"] },
                                                    { $gt: ["$$t.age", 10] },
                                                    { $ne: ["$$t.cancelled.byAdmin", true] },
                                                    { $ne: ["$$t.cancelled.byTraveller", true] },
                                                ]
                                            }
                                        }
                                    }
                                },
                                0
                            ]
                        }
                    },

                    totalMale: {
                        $sum: {
                            $cond: [
                                { $eq: ["$payment.advance.paid", true] },
                                {
                                    $size: {
                                        $filter: {
                                            input: "$travellers", as: "t",
                                            cond: {
                                                $and: [
                                                    { $eq: ["$$t.gender", "Male"] },
                                                    { $gt: ["$$t.age", 10] },
                                                    { $ne: ["$$t.cancelled.byAdmin", true] },
                                                    { $ne: ["$$t.cancelled.byTraveller", true] },
                                                ]
                                            }
                                        }
                                    }
                                },
                                0
                            ]
                        }
                    },

                    totalChild: {
                        $sum: {
                            $cond: [
                                { $eq: ["$payment.advance.paid", true] },
                                {
                                    $size: {
                                        $filter: {
                                            input: "$travellers", as: "t",
                                            cond: {
                                                $and: [
                                                    { $in: ["$$t.sharingType", ["withBerth", "withoutBerth"]] },
                                                    { $ne: ["$$t.cancelled.byAdmin", true] },
                                                    { $ne: ["$$t.cancelled.byTraveller", true] },
                                                ]
                                            }
                                        }
                                    }
                                },
                                0
                            ]
                        }
                    },

                    // ── Cancellation amounts ─────────────────────────────────

                    totalGVPool: { $sum: { $ifNull: ["$gvCancellationPool", 0] } },
                    totalIRCTCPool: { $sum: { $ifNull: ["$irctcCancellationPool", 0] } },
                }
            },
            {
                $project: {
                    _id: 0,
                    totalBookings: 1,
                    unverifiedBookings: 1,
                    activeBookings: 1,
                    completedBookings: 1,
                    fullyCancelledBookings: 1,
                    rejectedBookings: 1,
                    totalTravellers: 1,
                    unverifiedTravellers: 1,
                    activeTravellers: 1,
                    cancelledTravellers: 1,
                    cancellationRequestTravellers: 1,
                    rejectedTravellers: 1,
                    totalFemale: 1,
                    totalMale: 1,
                    totalChild: 1,
                    totalGVPool: 1,
                    totalIRCTCPool: 1,
                    totalCancelAmount: { $add: ["$totalGVPool", "$totalIRCTCPool"] },
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            data: {
                totalTours: matchTourIds.length || (await tourModel.countDocuments()),
                totalBookings: stats?.totalBookings || 0,
                unverifiedBookings: stats?.unverifiedBookings || 0,
                activeBookings: stats?.activeBookings || 0,
                completedBookings: stats?.completedBookings || 0,
                fullyCancelledBookings: stats?.fullyCancelledBookings || 0,
                rejectedBookings: stats?.rejectedBookings || 0,
                totalTravellers: stats?.totalTravellers || 0,
                unverifiedTravellers: stats?.unverifiedTravellers || 0,
                activeTravellers: stats?.activeTravellers || 0,
                cancelledTravellers: stats?.cancelledTravellers || 0,
                cancellationRequestTravellers: stats?.cancellationRequestTravellers || 0,
                rejectedTravellers: stats?.rejectedTravellers || 0,
                totalFemale: stats?.totalFemale || 0,
                totalMale: stats?.totalMale || 0,
                totalChild: stats?.totalChild || 0,
                totalGVPool: stats?.totalGVPool || 0,
                totalIRCTCPool: stats?.totalIRCTCPool || 0,
                totalCancelAmount: stats?.totalCancelAmount || 0,
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};


// ════════════════════════════════════════════════════════════════
//  2. YEAR-WISE — travellers + traveller status + tour status
//  GET /api/touradmin/analytics-year-wise
//     ?fromYear=&toYear=   (optional — restrict which years are returned)
// ════════════════════════════════════════════════════════════════
const getAnalyticsYearWise = async (req, res) => {
    try {
        const { fromYear, toYear } = req.query;

        const yearMatch = {};
        if (fromYear || toYear) {
            const yearExpr = { $year: "$lastBookingDate" };
            const clauses = [];
            if (fromYear) clauses.push({ $gte: [yearExpr, parseInt(fromYear)] });
            if (toYear) clauses.push({ $lte: [yearExpr, parseInt(toYear)] });
            yearMatch.$expr = clauses.length === 1 ? clauses[0] : { $and: clauses };
        }

        const toursByYear = await tourModel.aggregate([
            ...(Object.keys(yearMatch).length ? [{ $match: yearMatch }] : []),
            { $group: { _id: { $year: "$lastBookingDate" }, tourIds: { $push: "$_id" }, tourCount: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        const result = await Promise.all(toursByYear.map(async (yr) => {
            const [stats] = await tourBookingModel.aggregate([
                { $match: { tourId: { $in: yr.tourIds } } },
                {
                    $group: {
                        _id: null,
                        travellers: { $sum: { $size: "$travellers" } },
                        bookings: { $sum: 1 },

                        // Active: advance PAID + byAdmin≠true AND byTraveller≠true
                        activeTravellers: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$payment.advance.paid", true] },
                                    {
                                        $size: {
                                            $filter: {
                                                input: "$travellers", as: "t",
                                                cond: {
                                                    $and: [
                                                        { $ne: ["$$t.cancelled.byAdmin", true] },
                                                        { $ne: ["$$t.cancelled.byTraveller", true] },
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    0
                                ]
                            }
                        },
                        cancelledTravellers: {
                            $sum: {
                                $size: {
                                    $filter: {
                                        input: "$travellers", as: "t",
                                        cond: {
                                            $and: [
                                                { $eq: ["$$t.cancelled.byAdmin", true] },
                                                { $eq: ["$$t.cancelled.byTraveller", true] },
                                            ]
                                        }
                                    }
                                }
                            }
                        },
                        rejectedTravellers: {
                            $sum: {
                                $size: {
                                    $filter: {
                                        input: "$travellers", as: "t",
                                        cond: {
                                            $and: [
                                                { $eq: ["$$t.cancelled.byAdmin", true] },
                                                { $ne: ["$$t.cancelled.byTraveller", true] },
                                            ]
                                        }
                                    }
                                }
                            }
                        },

                        // Unverified: advance NOT paid, AND byAdmin ≠ true (excludes
                        // travellers who were separately rejected/cancelled by admin).
                        unverifiedTravellers: {
                            $sum: {
                                $cond: [
                                    { $ne: ["$payment.advance.paid", true] },
                                    {
                                        $size: {
                                            $filter: {
                                                input: "$travellers", as: "t",
                                                cond: { $ne: ["$$t.cancelled.byAdmin", true] }
                                            }
                                        }
                                    },
                                    0
                                ]
                            }
                        },

                        // Cancel request: advance PAID + byTraveller=true AND byAdmin≠true
                        cancellationRequestTravellers: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$payment.advance.paid", true] },
                                    {
                                        $size: {
                                            $filter: {
                                                input: "$travellers", as: "t",
                                                cond: {
                                                    $and: [
                                                        { $eq: ["$$t.cancelled.byTraveller", true] },
                                                        { $ne: ["$$t.cancelled.byAdmin", true] },
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    0
                                ]
                            }
                        },

                        completedBookings: {
                            $sum: {
                                $cond: [{
                                    $and: [
                                        { $eq: ["$payment.advance.paid", true] },
                                        { $eq: ["$payment.balance.paid", true] },
                                    ]
                                }, 1, 0]
                            }
                        },
                        activeBookings: {
                            $sum: {
                                $cond: [{
                                    $and: [
                                        { $eq: ["$payment.advance.paid", true] },
                                        { $ne: ["$payment.balance.paid", true] },
                                    ]
                                }, 1, 0]
                            }
                        },
                        unverifiedBookings: {
                            $sum: { $cond: [{ $ne: ["$payment.advance.paid", true] }, 1, 0] }
                        },
                    }
                }
            ]);

            const toursThisYear = await tourModel.find(
                { _id: { $in: yr.tourIds } },
                { available: 1, _id: 0 }
            ).lean();
            const availableTours = toursThisYear.filter(t => t.available !== false).length;
            const soldoutTours = toursThisYear.filter(t => t.available === false).length;

            return {
                _id: yr._id,
                tourCount: yr.tourCount,
                availableTours,
                soldoutTours,
                travellers: stats?.travellers || 0,
                bookings: stats?.bookings || 0,
                activeTravellers: stats?.activeTravellers || 0,
                cancelledTravellers: stats?.cancelledTravellers || 0,
                rejectedTravellers: stats?.rejectedTravellers || 0,
                unverifiedTravellers: stats?.unverifiedTravellers || 0,
                cancellationRequestTravellers: stats?.cancellationRequestTravellers || 0,
                completedBookings: stats?.completedBookings || 0,
                activeBookings: stats?.activeBookings || 0,
                unverifiedBookings: stats?.unverifiedBookings || 0,
            };
        }));

        return res.status(200).json({ success: true, data: result });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ════════════════════════════════════════════════════════════════
//  3. MONTH-WISE — travellers + traveller status + tour status
//  GET /api/touradmin/analytics-month-wise?year=2026
//     ?fromYear=&toYear=&fromMonth=&toMonth=   (range mode — overrides ?year=)
//     When a year RANGE is given, returns one entry per {year, month} pair
//     across ALL matched years, each restricted to the month range.
// ════════════════════════════════════════════════════════════════
const getAnalyticsMonthWise = async (req, res) => {
    try {
        const { year, month, fromYear, toYear, fromMonth, toMonth } = req.query;

        const hasYearRange = fromYear || toYear;
        const hasMonthRange = fromMonth || toMonth;

        const tourMatch = {};
        const exprClauses = [];

        if (hasYearRange) {
            const yearExpr = { $year: "$lastBookingDate" };
            if (fromYear) exprClauses.push({ $gte: [yearExpr, parseInt(fromYear)] });
            if (toYear) exprClauses.push({ $lte: [yearExpr, parseInt(toYear)] });
        } else if (year && month) {
            const y = parseInt(year), m = parseInt(month);
            tourMatch.lastBookingDate = { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) };
        } else if (year) {
            const y = parseInt(year);
            tourMatch.lastBookingDate = { $gte: new Date(`${y}-01-01`), $lt: new Date(`${y + 1}-01-01`) };
        } else if (!hasMonthRange) {
            // No filters at all -> default to current year (legacy behaviour)
            const y = new Date().getFullYear();
            tourMatch.lastBookingDate = { $gte: new Date(`${y}-01-01`), $lt: new Date(`${y + 1}-01-01`) };
        }

        if (hasMonthRange) {
            const fm = fromMonth ? parseInt(fromMonth) : 1;
            const tm = toMonth ? parseInt(toMonth) : 12;
            const monthExpr = { $month: "$lastBookingDate" };
            if (fm <= tm) {
                exprClauses.push({ $gte: [monthExpr, fm] });
                exprClauses.push({ $lte: [monthExpr, tm] });
            } else {
                exprClauses.push({ $or: [{ $gte: [monthExpr, fm] }, { $lte: [monthExpr, tm] }] });
            }
        } else if (month && !year) {
            exprClauses.push({ $eq: [{ $month: "$lastBookingDate" }, parseInt(month)] });
        }

        if (exprClauses.length) {
            tourMatch.$expr = exprClauses.length === 1 ? exprClauses[0] : { $and: exprClauses };
        }

        const toursByGroup = await tourModel.aggregate([
            { $match: tourMatch },
            {
                $group: {
                    _id: { year: { $year: "$lastBookingDate" }, month: { $month: "$lastBookingDate" } },
                    tourIds: { $push: "$_id" },
                    tourCount: { $sum: 1 },
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const result = await Promise.all(toursByGroup.map(async (grp) => {
            const [stats] = await tourBookingModel.aggregate([
                { $match: { tourId: { $in: grp.tourIds } } },
                {
                    $group: {
                        _id: null,
                        travellers: { $sum: { $size: "$travellers" } },
                        bookings: { $sum: 1 },

                        // Active: advance PAID + byAdmin≠true AND byTraveller≠true
                        activeTravellers: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$payment.advance.paid", true] },
                                    {
                                        $size: {
                                            $filter: {
                                                input: "$travellers", as: "t",
                                                cond: {
                                                    $and: [
                                                        { $ne: ["$$t.cancelled.byAdmin", true] },
                                                        { $ne: ["$$t.cancelled.byTraveller", true] },
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    0
                                ]
                            }
                        },
                        cancelledTravellers: {
                            $sum: {
                                $size: {
                                    $filter: {
                                        input: "$travellers", as: "t",
                                        cond: {
                                            $and: [
                                                { $eq: ["$$t.cancelled.byAdmin", true] },
                                                { $eq: ["$$t.cancelled.byTraveller", true] },
                                            ]
                                        }
                                    }
                                }
                            }
                        },
                        rejectedTravellers: {
                            $sum: {
                                $size: {
                                    $filter: {
                                        input: "$travellers", as: "t",
                                        cond: {
                                            $and: [
                                                { $eq: ["$$t.cancelled.byAdmin", true] },
                                                { $ne: ["$$t.cancelled.byTraveller", true] },
                                            ]
                                        }
                                    }
                                }
                            }
                        },

                        // Unverified: advance NOT paid, AND byAdmin ≠ true (excludes
                        // travellers who were separately rejected/cancelled by admin).
                        unverifiedTravellers: {
                            $sum: {
                                $cond: [
                                    { $ne: ["$payment.advance.paid", true] },
                                    {
                                        $size: {
                                            $filter: {
                                                input: "$travellers", as: "t",
                                                cond: { $ne: ["$$t.cancelled.byAdmin", true] }
                                            }
                                        }
                                    },
                                    0
                                ]
                            }
                        },

                        // Cancel request: advance PAID + byTraveller=true AND byAdmin≠true
                        cancellationRequestTravellers: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$payment.advance.paid", true] },
                                    {
                                        $size: {
                                            $filter: {
                                                input: "$travellers", as: "t",
                                                cond: {
                                                    $and: [
                                                        { $eq: ["$$t.cancelled.byTraveller", true] },
                                                        { $ne: ["$$t.cancelled.byAdmin", true] },
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    0
                                ]
                            }
                        },

                        completedBookings: {
                            $sum: {
                                $cond: [{
                                    $and: [
                                        { $eq: ["$payment.advance.paid", true] },
                                        { $eq: ["$payment.balance.paid", true] },
                                    ]
                                }, 1, 0]
                            }
                        },
                        activeBookings: {
                            $sum: {
                                $cond: [{
                                    $and: [
                                        { $eq: ["$payment.advance.paid", true] },
                                        { $ne: ["$payment.balance.paid", true] },
                                    ]
                                }, 1, 0]
                            }
                        },
                        unverifiedBookings: {
                            $sum: { $cond: [{ $ne: ["$payment.advance.paid", true] }, 1, 0] }
                        },

                        gvPool: { $sum: { $ifNull: ["$gvCancellationPool", 0] } },
                        irctcPool: { $sum: { $ifNull: ["$irctcCancellationPool", 0] } },
                    }
                }
            ]);

            const toursThisMonth = await tourModel.find(
                { _id: { $in: grp.tourIds } },
                { available: 1, _id: 0 }
            ).lean();
            const availableTours = toursThisMonth.filter(t => t.available !== false).length;
            const soldoutTours = toursThisMonth.filter(t => t.available === false).length;

            return {
                year: grp._id.year,
                month: grp._id.month,
                tourCount: grp.tourCount,
                availableTours,
                soldoutTours,
                travellers: stats?.travellers || 0,
                bookings: stats?.bookings || 0,
                activeTravellers: stats?.activeTravellers || 0,
                cancelledTravellers: stats?.cancelledTravellers || 0,
                rejectedTravellers: stats?.rejectedTravellers || 0,
                unverifiedTravellers: stats?.unverifiedTravellers || 0,
                cancellationRequestTravellers: stats?.cancellationRequestTravellers || 0,
                completedBookings: stats?.completedBookings || 0,
                activeBookings: stats?.activeBookings || 0,
                unverifiedBookings: stats?.unverifiedBookings || 0,
                gvPool: stats?.gvPool || 0,
                irctcPool: stats?.irctcPool || 0,
            };
        }));

        return res.status(200).json({ success: true, data: result });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ════════════════════════════════════════════════════════════════
//  4. CANCELLATION — year-wise + month-wise GV & IRCTC
//  GET /api/touradmin/analytics-cancellation?view=year|month&year=2026
//     ?view=year&fromYear=&toYear=                       (range mode)
//     ?view=month&fromYear=&toYear=&fromMonth=&toMonth=   (range mode)
// ════════════════════════════════════════════════════════════════
const getAnalyticsCancellation = async (req, res) => {
    try {
        const { view = "year", year, fromYear, toYear, fromMonth, toMonth } = req.query;
        const hasYearRange = fromYear || toYear;
        const hasMonthRange = fromMonth || toMonth;

        if (view === "month") {
            const tourMatch = {};
            const exprClauses = [];

            if (hasYearRange) {
                const yearExpr = { $year: "$lastBookingDate" };
                if (fromYear) exprClauses.push({ $gte: [yearExpr, parseInt(fromYear)] });
                if (toYear) exprClauses.push({ $lte: [yearExpr, parseInt(toYear)] });
            } else {
                const y = parseInt(year) || new Date().getFullYear();
                tourMatch.lastBookingDate = { $gte: new Date(`${y}-01-01`), $lt: new Date(`${y + 1}-01-01`) };
            }

            if (hasMonthRange) {
                const fm = fromMonth ? parseInt(fromMonth) : 1;
                const tm = toMonth ? parseInt(toMonth) : 12;
                const monthExpr = { $month: "$lastBookingDate" };
                if (fm <= tm) {
                    exprClauses.push({ $gte: [monthExpr, fm] });
                    exprClauses.push({ $lte: [monthExpr, tm] });
                } else {
                    exprClauses.push({ $or: [{ $gte: [monthExpr, fm] }, { $lte: [monthExpr, tm] }] });
                }
            }

            if (exprClauses.length) {
                tourMatch.$expr = exprClauses.length === 1 ? exprClauses[0] : { $and: exprClauses };
            }

            const groupKey = hasYearRange
                ? { year: { $year: "$lastBookingDate" }, month: { $month: "$lastBookingDate" } }
                : { $month: "$lastBookingDate" };

            const toursByMonth = await tourModel.aggregate([
                { $match: tourMatch },
                {
                    $group: {
                        _id: groupKey,
                        tourIds: { $push: "$_id" },
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            const result = await Promise.all(toursByMonth.map(async (mo) => {
                const [stats] = await tourBookingModel.aggregate([
                    { $match: { tourId: { $in: mo.tourIds } } },
                    {
                        $group: {
                            _id: null,
                            gvPool: { $sum: { $ifNull: ["$gvCancellationPool", 0] } },
                            irctcPool: { $sum: { $ifNull: ["$irctcCancellationPool", 0] } },
                        }
                    }
                ]);
                const baseEntry = hasYearRange
                    ? { _id: mo._id.month, year: mo._id.year }
                    : { _id: mo._id, year: parseInt(year) || new Date().getFullYear() };
                return { ...baseEntry, gvPool: stats?.gvPool || 0, irctcPool: stats?.irctcPool || 0 };
            }));

            return res.status(200).json({ success: true, data: result });
        }

        // Year-wise (default)
        const yearMatch = {};
        if (hasYearRange) {
            const yearExpr = { $year: "$lastBookingDate" };
            const clauses = [];
            if (fromYear) clauses.push({ $gte: [yearExpr, parseInt(fromYear)] });
            if (toYear) clauses.push({ $lte: [yearExpr, parseInt(toYear)] });
            yearMatch.$expr = clauses.length === 1 ? clauses[0] : { $and: clauses };
        }

        const toursByYear = await tourModel.aggregate([
            ...(Object.keys(yearMatch).length ? [{ $match: yearMatch }] : []),
            { $group: { _id: { $year: "$lastBookingDate" }, tourIds: { $push: "$_id" } } },
            { $sort: { _id: 1 } }
        ]);

        const result = await Promise.all(toursByYear.map(async (yr) => {
            const [stats] = await tourBookingModel.aggregate([
                {
                    $match: {
                        tourId: { $in: yr.tourIds }, $or: [
                            { gvCancellationPool: { $gt: 0 } },
                            { irctcCancellationPool: { $gt: 0 } },
                        ]
                    }
                },
                {
                    $group: {
                        _id: null,
                        gvPool: { $sum: { $ifNull: ["$gvCancellationPool", 0] } },
                        irctcPool: { $sum: { $ifNull: ["$irctcCancellationPool", 0] } },
                    }
                }
            ]);
            return { _id: yr._id, gvPool: stats?.gvPool || 0, irctcPool: stats?.irctcPool || 0 };
        }));

        return res.status(200).json({ success: true, data: result });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ════════════════════════════════════════════════════════════════
//  5. TOUR LIST TABLE
//  GET /api/touradmin/analytics-tour-list?year=&month=&type=&status=&tourId=
//     ?fromYear=&toYear=&fromMonth=&toMonth=&type=&status=&tourId=  (range mode)
// ════════════════════════════════════════════════════════════════
const getAnalyticsTourList = async (req, res) => {
    try {
        const { year, month, type, status, tourId, fromYear, toYear, fromMonth, toMonth } = req.query;
        const tourIds = tourId ? tourId.split(",") : [];

        const tourQuery = buildTourDateQuery({ year, month, fromYear, toYear, fromMonth, toMonth });
        if (tourIds.length) {
            tourQuery._id = { $in: tourIds.map(id => new mongoose.Types.ObjectId(id)) };
        }
        if (type) tourQuery.batch = { $regex: type, $options: "i" };

        const allTours = await tourModel.find(
            tourQuery,
            { title: 1, batch: 1, available: 1, lastBookingDate: 1 }
        ).sort({ lastBookingDate: -1 }).lean();

        if (!allTours.length) return res.status(200).json({ success: true, data: [] });

        const allTourIds = allTours.map(t => t._id);
        const bookingData = await getBookingStatsByTourIds(allTourIds);
        let result = mergeTourBooking(allTours, bookingData);

        if (status) {
            result = result.filter(t => {
                if (status === "Completed") return t.isCompleted === 1;
                if (status === "Soldout") return t.isCompleted === 0 && t.available === false;
                if (status === "Available") return t.isCompleted === 0 && t.available !== false;
                return true;
            });
        }

        return res.status(200).json({ success: true, data: result });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ════════════════════════════════════════════════════════════════
//  6. TOUR SEARCH
//  GET /api/touradmin/analytics-search?q=KER&year=2026&month=8
//     ?q=&fromYear=&toYear=&fromMonth=&toMonth=&status=   (range mode)
// ════════════════════════════════════════════════════════════════
const searchAnalyticsTours = async (req, res) => {
    try {
        const { q, year, month, status, fromYear, toYear, fromMonth, toMonth } = req.query;
        if (!q) return res.status(400).json({ success: false, message: "Query 'q' required" });

        const tourQuery = {
            title: { $regex: `^${q}`, $options: "i" },
            ...buildTourDateQuery({ year, month, fromYear, toYear, fromMonth, toMonth }),
        };

        const tourDocs = await tourModel.find(
            tourQuery,
            { title: 1, batch: 1, available: 1, lastBookingDate: 1 }
        ).limit(30).lean();

        if (!tourDocs.length) return res.status(200).json({ success: true, data: [] });

        const allTourIds = tourDocs.map(t => t._id);
        const bookingData = await getBookingStatsByTourIds(allTourIds);
        let result = mergeTourBooking(tourDocs, bookingData);

        if (status) {
            result = result.filter(t => {
                if (status === "Completed") return t.isCompleted === 1;
                if (status === "Active") return t.isCompleted === 0;
                return true;
            });
        }

        return res.status(200).json({ success: true, data: result });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * POST /api/tour/:tourId/close-bookings
 * Sets bookingClosed: true — the customer-facing TourBooking.jsx page
 * blocks NEW bookings for this tour (see the frontend change: it checks
 * tourInfo.bookingClosed the same way it already checks
 * tourInfo.available). Does NOT touch any existing traveller/booking —
 * only blocks new ones.
 */
const closeTourBookings = async (req, res) => {
    try {
        const { tourId } = req.params;

        const tour = await tourModel.findByIdAndUpdate(
            tourId,
            { bookingClosed: true },
            { new: true },
        );

        if (!tour) {
            return res
                .status(404)
                .json({ success: false, message: "Tour not found" });
        }

        return res.status(200).json({
            success: true,
            message: `Bookings closed for "${tour.title}". New bookings are now blocked.`,
            tour,
        });
    } catch (err) {
        console.error("closeTourBookings error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * POST /api/tour/:tourId/reopen-bookings
 * Reverses closeTourBookings — sets bookingClosed: false again.
 */
const reopenTourBookings = async (req, res) => {
    try {
        const { tourId } = req.params;

        const tour = await tourModel.findByIdAndUpdate(
            tourId,
            { bookingClosed: false },
            { new: true },
        );

        if (!tour) {
            return res
                .status(404)
                .json({ success: false, message: "Tour not found" });
        }

        return res.status(200).json({
            success: true,
            message: `Bookings reopened for "${tour.title}".`,
            tour,
        });
    } catch (err) {
        console.error("reopenTourBookings error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * POST /api/tour/:tourId/cancel-trip
 *
 * Replaces the previous updateMany-based version. Loops bookings for
 * this tour so we can track, PER BOOKING, how many of its travellers
 * were bulk-cancelled by this action — stored in a new field
 * `tripCancelledTravellerCount` on tourBookingModel (add this to the
 * schema: `tripCancelledTravellerCount: { type: Number, default: 0 }`).
 *
 * Does NOT touch the existing single-traveller cancellation
 * request/approval flow (cancellationModel, approveCancellation, etc.)
 * at all — that continues to work exactly as before, with its own
 * GV/IRCTC charge calculation. This function only ever SKIPS travellers
 * who are already fully cancelled (cancelled.byTraveller AND
 * cancelled.byAdmin both true) — their existing charge/record is left
 * completely untouched, whichever flow created it.
 */
const cancelEntireTrip = async (req, res) => {
    try {
        const { tourId } = req.params;

        const tour = await tourModel.findById(tourId);
        if (!tour) {
            return res
                .status(404)
                .json({ success: false, message: "Tour not found" });
        }

        const bookings = await tourBookingModel.find({ tourId });

        let totalBookingsModified = 0;
        let totalTravellersCancelled = 0;

        for (const booking of bookings) {
            let newlyCancelledCount = 0;

            booking.travellers.forEach((t) => {
                const alreadyFullyCancelled =
                    t.cancelled?.byTraveller === true && t.cancelled?.byAdmin === true;

                if (!alreadyFullyCancelled) {
                    // No GV/IRCTC charge applied here — this is a bulk admin trip
                    // cancellation, not a real per-traveller cancellation request.
                    t.cancelled = t.cancelled || {};
                    t.cancelled.byTraveller = true;
                    t.cancelled.byAdmin = true;
                    t.cancelled.viaTripCancel = true;
                    newlyCancelledCount += 1;
                }
                // else: leave completely as-is — this traveller already has a
                // real (charged) cancellation from the normal flow.
            });

            if (newlyCancelledCount > 0) {
                booking.tripCancelledTravellerCount =
                    (booking.tripCancelledTravellerCount || 0) + newlyCancelledCount;

                await booking.save();
                totalBookingsModified += 1;
                totalTravellersCancelled += newlyCancelledCount;
            }
        }

        tour.tripCancelled = true;
        tour.available = false;
        await tour.save();

        return res.status(200).json({
            success: true,
            message: `Trip "${tour.title}" cancelled — ${totalBookingsModified} booking(s) updated, ${totalTravellersCancelled} traveller(s) cancelled (no charge).`,
            tour,
            bookingsModified: totalBookingsModified,
            travellersCancelled: totalTravellersCancelled,
        });
    } catch (err) {
        console.error("cancelEntireTrip error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};


export {
    loginAdmin,
    allTours,
    changeTourAvailability,
    addTour,
    tourAdminDashboard,
    bookingsAdmin,
    getBookings,
    getCancellationChart,
    upsertCancellationChart,
    getCancellations,
    approveCancellation,
    rejectCancellation,
    bookingRelease,
    // addMissingFieldsToAllBookings,
    getPendingApprovals,
    approveBookingUpdate,
    rejectBookingUpdate,
    getAllUsers,
    adminBookingsTour,
    adminTourList,
    adminAllotRooms,
    bookingRejectAdmin,
    generateMissingTNRs,
    addTermsPoints,
    deleteTermsPoint,
    getCurrentTerms,
    submitTermsAgreement,
    getBookingSummaryByTNR,
    adminCreateTourVehicle,
    adminUpdateTourVehicle,
    adminToggleVehicleSeatSelection,
    adminGetTourVehicles,
    adminDeleteTourVehicle,
    getAllPaymentMethods,
    adminFetchTourVehicleSeatOverview,
    deleteBookingByTNR,
    // ─── Export — add these to existing export {} block ──────────
    getAnalyticsSummary,
    getAnalyticsYearWise,
    getAnalyticsMonthWise,
    getAnalyticsCancellation,
    getAnalyticsTourList,
    searchAnalyticsTours,
    closeTourBookings,
    reopenTourBookings,
    cancelEntireTrip,

};