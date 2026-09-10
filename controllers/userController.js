// import validator from "validator";
// import bcrypt from "bcrypt";
// import mongoose from "mongoose";
// import userModel from "../models/userModel.js";
// import tourModel from "../models/tourModel.js";
// import jwt from "jsonwebtoken";
// import { v2 as cloudinary } from "cloudinary";
// import { verifyGoogleToken } from "../middlewares/googleUserAuth.js";
// import razorpay from "razorpay";
// import crypto from "crypto";
// import tourBookingModel from "../models/tourBookingmodel.js";
// import TourVehicle from "../models/tourVehicleModel.js";
// import PaymentMethod from "../models/paymentModel.js";
// import enquiryModel from "../models/enquiryModel.js";


// // API for Google Sign-In / Sign-Up
// const googleSignIn = async (req, res) => {
//   try {
//     const { idToken } = req.body;

//     if (!idToken) {
//       return res.status(400).json({
//         success: false,
//         message: "Google tokens is required",
//       });
//     }

//     // Verify the Google token
//     const payload = await verifyGoogleToken(idToken);

//     if (!payload.email_verified) {
//       return res.status(400).json({
//         success: false,
//         message: "Google email not verified",
//       });
//     }

//     const { email, name, picture, sub: googleId } = payload;

//     // Check if user already exists by email
//     let user = await userModel.findOne({ email });

//     if (!user) {
//       // New user → auto register
//       const randomPassword = Math.random().toString(36);
//       const hashedPassword = await bcrypt.hash(randomPassword, 10); // ✅
//       user = new userModel({
//         name: name || "Google User",
//         email,
//         password: hashedPassword, // dummy password (never used)
//         image: picture || "",
//         googleId, // optional: store google sub for future reference
//       });
//       await user.save();
//     } else {
//       // Existing user → just log them in (optional: update name/image)
//       if (!user.googleId) user.googleId = googleId;
//       user.name = user.name || name;
//       user.image = user.image || picture;
//       await user.save();
//     }

//     // Generate JWT token
//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: "30d",
//     });

//     res.json({
//       success: true,
//       token,
//       message: "Google login successful",
//     });
//   } catch (error) {
//     res.status(401).json({
//       success: false,
//       message: "Google authentication failed",
//     });
//   }
// };
// const registerUser = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;
//     const existingUser = await userModel.findOne({ email });
//     if (existingUser) {
//       return res.json({ success: false, message: "Email already registered" });
//     }

//     if (!name || !password || !email)
//       return res.json({ success: false, message: "Missing details" });
//     if (!validator.isEmail(email)) {
//       return res.json({
//         success: false,
//         message: "Enter a valid email please",
//       });
//     }
//     //Validating strong password
//     if (password.length < 8) {
//       return res.json({
//         success: false,
//         message: "Enter a strong password",
//       });
//     }
//     //Hashing user password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);
//     const userData = {
//       name,
//       email,
//       password: hashedPassword,
//     };
//     const newUser = new userModel(userData);

//     const user = await newUser.save();

//     //Creating token process
//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
//     res.json({ success: true, token });
//   } catch (error) {
//     res.json({ success: false, message: error.message });
//   }
// };

// //API fpr uder login
// const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await userModel.findOne({ email });
//     if (!user) {
//       return res.json({ success: false, message: "User does not exists" });
//     }
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (isMatch) {
//       const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
//       res.json({ success: true, token });
//     } else {
//       res.json({ success: false, message: "Invalid credentials" });
//     }
//   } catch (error) {
//     res.json({ success: false, message: error.message });
//   }
// };

// //API to get user profile data

// const getProfile = async (req, res) => {
//   try {
//     const userId = req.user._id; // ✅ correct
//     const useData = await userModel.findById(userId).select("-password");

//     res.json({ success: true, user: useData });
//   } catch (error) {
//     res.json({ success: false, message: error.message });
//   }
// };

// //API to update USER Profile
// const updateProfile = async (req, res) => {
//   try {
//     const { name, phone, address, dob, gender } = req.body;
//     const imageFile = req.file;
//     const userId = req.user._id;

//     // Optional: more strict check
//     if (!name || !phone || !gender) {
//       return res.json({ success: false, message: "Required fields missing" });
//     }

//     const updateData = {
//       name,
//       phone,
//       address: address ? JSON.parse(address) : undefined,
//       gender,
//     };

//     // Only set dob if it's sent and looks valid
//     if (dob && dob !== "" && dob !== "Not Selected") {
//       // Optional: validate format here if you want
//       updateData.dob = dob;
//     }

//     await userModel.findByIdAndUpdate(userId, updateData);

//     // image handling remains the same
//     if (imageFile) {
//       const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
//         resource_type: "image",
//       });
//       await userModel.findByIdAndUpdate(userId, {
//         image: imageUpload.secure_url,
//       });
//     }

//     res.json({ success: true, message: "Profile Updated" });
//   } catch (error) {
//     res.json({ success: false, message: error.message });
//   }
// };
// // const addToTrolly = async (req, res) => {
// //   try {
// //     const {
// //       tourId,
// //       travellers = [],
// //       billingAddress,
// //       bookingType,
// //       contact,
// //     } = req.body;
// //     const userId = req.user._id;
// //     const mobile = (contact?.mobile || "").trim();
// //     if (!mobile) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Mobile number is required.",
// //       });
// //     }

// //     if (!/^[\d+\-\s()]{7,25}$/.test(mobile)) {
// //       return res.status(400).json({
// //         success: false,
// //         message:
// //           "Invalid mobile number format. Use digits, +, -, spaces or parentheses.",
// //       });
// //     }
// //     // Validate required fields
// //     if (!tourId) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Tour ID is required.",
// //       });
// //     }

// //     // Fetch the tour
// //     const tour = await tourModel.findById(tourId);
// //     if (!tour) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Tour not found.",
// //       });
// //     }

// //     let totalAdvance = 0;
// //     let totalBalance = 0;
// //     const updatedTravellers = [];

// //     for (const trav of travellers) {
// //       const age = Number(trav.age);

// //       // --- Age-based validation check ---
// //       if (isNaN(age) || age < 1 || (age >= 1 && age <= 5)) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Booking failed: Invalid age for traveller ${trav.firstName || "Unknown"
// //             }. Age must be a number greater than 5.`,
// //         });
// //       }

// //       // --- Package Type Validation ---
// //       if (
// //         !trav.packageType ||
// //         !["main", "variant"].includes(trav.packageType)
// //       ) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Invalid package type for traveller: ${trav.firstName || "Unknown"
// //             }. Must be 'main' or 'variant'.`,
// //         });
// //       }

// //       if (
// //         trav.packageType === "variant" &&
// //         (trav.variantPackageIndex === null || isNaN(trav.variantPackageIndex))
// //       ) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Variant package index is required for traveller: ${trav.firstName || "Unknown"
// //             }.`,
// //         });
// //       }

// //       // Select package data based on traveller's packageType
// //       let selectedPackage = tour;
// //       if (trav.packageType === "variant") {
// //         if (!tour.variantPackage[trav.variantPackageIndex]) {
// //           return res.status(400).json({
// //             success: false,
// //             message: `Variant package at index ${trav.variantPackageIndex
// //               } does not exist for traveller: ${trav.firstName || "Unknown"}.`,
// //           });
// //         }
// //         selectedPackage = tour.variantPackage[trav.variantPackageIndex];
// //       }

// //       // --- Boarding Point Validation ---
// //       if (!trav.boardingPoint) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Boarding point is required for traveller: ${trav.firstName || "Unknown"
// //             }`,
// //         });
// //       }

// //       const validBoarding = selectedPackage.boardingPoints?.find(
// //         (bp) => bp.stationCode === trav.boardingPoint.stationCode,
// //       );

// //       if (!validBoarding) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Invalid boarding point for traveller: ${trav.firstName || "Unknown"
// //             }`,
// //         });
// //       }

// //       const selectedBoarding = {
// //         stationCode: validBoarding.stationCode,
// //         stationName: validBoarding.stationName,
// //       };

// //       // --- Deboarding Point Validation ---
// //       if (!trav.deboardingPoint) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Deboarding point is required for traveller: ${trav.firstName || "Unknown"
// //             }`,
// //         });
// //       }

// //       const validDeboarding = selectedPackage.deboardingPoints?.find(
// //         (dp) => dp.stationCode === trav.deboardingPoint.stationCode,
// //       );

// //       if (!validDeboarding) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Invalid deboarding point for traveller: ${trav.firstName || "Unknown"
// //             }`,
// //         });
// //       }

// //       const selectedDeboarding = {
// //         stationCode: validDeboarding.stationCode,
// //         stationName: validDeboarding.stationName,
// //       };

// //       // --- Add-on Validation ---
// //       let addonPrice = 0;
// //       let selectedAddonData = null;
// //       if (trav.selectedAddon?.name) {
// //         const validAddon = selectedPackage.addons?.find(
// //           (a) => a.name === trav.selectedAddon.name,
// //         );
// //         if (!validAddon) {
// //           return res.status(400).json({
// //             success: false,
// //             message: `Invalid add-on for traveller: ${trav.firstName || "Unknown"
// //               }`,
// //           });
// //         }
// //         addonPrice = Number(validAddon.amount) || 0;
// //         selectedAddonData = {
// //           name: validAddon.name,
// //           price: validAddon.amount,
// //         };
// //       }

// //       let travellerAdvance = 0;
// //       let travellerBalance = 0;

// //       // --- Age-based pricing logic ---
// //       if (age >= 11) {
// //         // Adult pricing (age 11 and above)
// //         travellerAdvance = Number(selectedPackage.advanceAmount?.adult) || 0;
// //         switch (trav.sharingType?.toLowerCase()) {
// //           case "double":
// //             travellerBalance = Number(selectedPackage.balanceDouble) || 0;
// //             break;
// //           case "triple":
// //             travellerBalance = Number(selectedPackage.balanceTriple) || 0;
// //             break;
// //           default:
// //             return res.status(400).json({
// //               success: false,
// //               message: `Invalid sharing type for adult traveller: ${trav.firstName || "Unknown"
// //                 }`,
// //             });
// //         }
// //       } else if (age >= 6 && age <= 10) {
// //         // Child pricing (age 6 to 10)
// //         travellerAdvance = Number(selectedPackage.advanceAmount?.child) || 0;
// //         switch (trav.sharingType?.toLowerCase()) {
// //           case "withberth":
// //             travellerBalance =
// //               Number(selectedPackage.balanceChildWithBerth) || 0;
// //             break;
// //           case "withoutberth":
// //             travellerBalance =
// //               Number(selectedPackage.balanceChildWithoutBerth) || 0;
// //             break;
// //           default:
// //             return res.status(400).json({
// //               success: false,
// //               message: `Invalid sharing type for child traveller: ${trav.firstName || "Unknown"
// //                 }`,
// //             });
// //         }
// //       }

// //       travellerAdvance += addonPrice;
// //       if (isNaN(travellerAdvance) || isNaN(travellerBalance)) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Booking failed: Could not calculate prices for traveller ${trav.firstName || "Unknown"
// //             }. Please check tour prices.`,
// //         });
// //       }

// //       totalAdvance += travellerAdvance;
// //       totalBalance += travellerBalance;

// //       updatedTravellers.push({
// //         ...trav,
// //         boardingPoint: selectedBoarding,
// //         deboardingPoint: selectedDeboarding,
// //         selectedAddon: selectedAddonData,
// //         remarks: trav.remarks || null,
// //         packageType: trav.packageType,
// //         variantPackageIndex:
// //           trav.packageType === "variant" ? trav.variantPackageIndex : null,
// //       });
// //     }

// //     // ────────────────────────────────────────────────
// //     //          TNR GENERATION – AA11AA format
// //     // ────────────────────────────────────────────────
// //     let tnr;
// //     let attempts = 0;
// //     const maxAttempts = 10;
// //     const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
// //     const digits = "0123456789";

// //     while (attempts < maxAttempts) {
// //       tnr =
// //         letters.charAt(Math.floor(Math.random() * letters.length)) +
// //         letters.charAt(Math.floor(Math.random() * letters.length)) +
// //         digits.charAt(Math.floor(Math.random() * digits.length)) +
// //         digits.charAt(Math.floor(Math.random() * digits.length)) +
// //         letters.charAt(Math.floor(Math.random() * letters.length)) +
// //         letters.charAt(Math.floor(Math.random() * letters.length));

// //       const conflict = await tourBookingModel.exists({ tnr });
// //       if (!conflict) {
// //         break;
// //       }
// //       attempts++;
// //     }

// //     if (attempts >= maxAttempts) {
// //       return res.status(503).json({
// //         success: false,
// //         message:
// //           "Unable to generate unique booking reference right now. Please try again in a moment.",
// //       });
// //     }

// //     // Prepare booking data for tourBookingModel
// //     const bookingData = {
// //       userId,
// //       tourId,
// //       tnr, // ← added here
// //       userData: {
// //         id: userId,
// //       },
// //       tourData: {
// //         id: tour._id,
// //         title: tour.title,
// //         titleImage: tour.titleImage,
// //         // Store main package duration and price as default
// //         duration: tour.duration,
// //         price: tour.price,
// //       },
// //       travellers: updatedTravellers,
// //       billingAddress: billingAddress || {},
// //       contact: {
// //         email: contact?.email,
// //         mobile: contact?.mobile,
// //       },
// //       bookingType: bookingType || "online",
// //       payment: {
// //         advance: {
// //           amount: totalAdvance,
// //         },
// //         balance: {
// //           amount: totalBalance,
// //         },
// //       },
// //       status: "pending",
// //       bookingDate: new Date(),
// //       emergencyContact: null,
// //       termsAgreed: false,
// //       termsAgreedAt: null,
// //     };

// //     const newBooking = new tourBookingModel(bookingData);
// //     await newBooking.save();

// //     return res.status(201).json({
// //       success: true,
// //       message: "Booking added to trolley successfully.",
// //       booking: newBooking,
// //     });
// //   } catch (error) {
// //     return res.status(500).json({
// //       success: false,
// //       message: "Internal server error.",
// //     });
// //   }
// // };

// // const addToTrolly = async (req, res) => {
// //   try {
// //     const {
// //       tourId,
// //       travellers = [],
// //       billingAddress,
// //       bookingType,
// //       contact,
// //     } = req.body;

// //     const userId = req.user._id;

// //     // --------------------------------------------------
// //     // MOBILE VALIDATION
// //     // --------------------------------------------------

// //     const mobile = (contact?.mobile || "").trim();

// //     if (!mobile) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Mobile number is required.",
// //       });
// //     }

// //     if (!/^[\d+\-\s()]{7,25}$/.test(mobile)) {
// //       return res.status(400).json({
// //         success: false,
// //         message:
// //           "Invalid mobile number format. Use digits, +, -, spaces or parentheses.",
// //       });
// //     }

// //     // --------------------------------------------------
// //     // TOUR ID VALIDATION
// //     // --------------------------------------------------

// //     if (!tourId) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Tour ID is required.",
// //       });
// //     }

// //     // --------------------------------------------------
// //     // FETCH TOUR
// //     // --------------------------------------------------

// //     const tour = await tourModel.findById(tourId);

// //     if (!tour) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Tour not found.",
// //       });
// //     }

// //     // --------------------------------------------------
// //     // TOTALS
// //     // --------------------------------------------------

// //     let totalAdvance = 0;
// //     let totalBalance = 0;

// //     // This is only for calculation/debugging.
// //     // Booking payment calculation remains same.
// //     let totalAddons = 0;

// //     const updatedTravellers = [];

// //     // ==================================================
// //     // TRAVELLERS
// //     // ==================================================

// //     for (const trav of travellers) {
// //       const age = Number(trav.age);

// //       // ------------------------------------------------
// //       // AGE VALIDATION
// //       // ------------------------------------------------

// //       if (
// //         isNaN(age) ||
// //         age < 1 ||
// //         (age >= 1 && age <= 5)
// //       ) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Booking failed: Invalid age for traveller ${
// //             trav.firstName || "Unknown"
// //           }. Age must be a number greater than 5.`,
// //         });
// //       }

// //       // ------------------------------------------------
// //       // PACKAGE TYPE
// //       // ------------------------------------------------

// //       if (
// //         !trav.packageType ||
// //         !["main", "variant"].includes(
// //           trav.packageType
// //         )
// //       ) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Invalid package type for traveller: ${
// //             trav.firstName || "Unknown"
// //           }. Must be 'main' or 'variant'.`,
// //         });
// //       }

// //       // ------------------------------------------------
// //       // VARIANT PACKAGE
// //       // ------------------------------------------------

// //       if (
// //         trav.packageType === "variant" &&
// //         (trav.variantPackageIndex === null ||
// //           isNaN(trav.variantPackageIndex))
// //       ) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Variant package index is required for traveller: ${
// //             trav.firstName || "Unknown"
// //           }.`,
// //         });
// //       }

// //       // ------------------------------------------------
// //       // SELECT PACKAGE
// //       // ------------------------------------------------

// //       let selectedPackage = tour;

// //       if (trav.packageType === "variant") {
// //         if (
// //           !tour.variantPackage?.[
// //             trav.variantPackageIndex
// //           ]
// //         ) {
// //           return res.status(400).json({
// //             success: false,
// //             message: `Variant package at index ${
// //               trav.variantPackageIndex
// //             } does not exist for traveller: ${
// //               trav.firstName || "Unknown"
// //             }.`,
// //           });
// //         }

// //         selectedPackage =
// //           tour.variantPackage[
// //             trav.variantPackageIndex
// //           ];
// //       }

// //       // =================================================
// //       // BOARDING POINT
// //       // =================================================

// //       if (!trav.boardingPoint) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Boarding point is required for traveller: ${
// //             trav.firstName || "Unknown"
// //           }`,
// //         });
// //       }

// //       const validBoarding =
// //         selectedPackage.boardingPoints?.find(
// //           (bp) =>
// //             bp.stationCode ===
// //             trav.boardingPoint.stationCode
// //         );

// //       if (!validBoarding) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Invalid boarding point for traveller: ${
// //             trav.firstName || "Unknown"
// //           }`,
// //         });
// //       }

// //       const selectedBoarding = {
// //         stationCode: validBoarding.stationCode,
// //         stationName: validBoarding.stationName,
// //       };

// //       // =================================================
// //       // DEBOARDING POINT
// //       // =================================================

// //       if (!trav.deboardingPoint) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Deboarding point is required for traveller: ${
// //             trav.firstName || "Unknown"
// //           }`,
// //         });
// //       }

// //       const validDeboarding =
// //         selectedPackage.deboardingPoints?.find(
// //           (dp) =>
// //             dp.stationCode ===
// //             trav.deboardingPoint.stationCode
// //         );

// //       if (!validDeboarding) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Invalid deboarding point for traveller: ${
// //             trav.firstName || "Unknown"
// //           }`,
// //         });
// //       }

// //       const selectedDeboarding = {
// //         stationCode:
// //           validDeboarding.stationCode,
// //         stationName:
// //           validDeboarding.stationName,
// //       };

// //       // =================================================
// //       // NEW TRAIN ADDONS VALIDATION
// //       // =================================================

// //       let addonPrice = 0;

// //       const selectedAddons = Array.isArray(
// //         trav.selectedAddons
// //       )
// //         ? trav.selectedAddons
// //         : [];

// //       const validatedAddons = [];

// //       for (const selectedAddon of selectedAddons) {
// //         const trainIndex = Number(
// //           selectedAddon.trainIndex
// //         );

// //         // ----------------------------------------------
// //         // TRAIN EXISTS?
// //         // ----------------------------------------------

// //         const train =
// //           selectedPackage.trainDetails?.[
// //             trainIndex
// //           ];

// //         if (!train) {
// //           return res.status(400).json({
// //             success: false,
// //             message: `Invalid train selection for traveller: ${
// //               trav.firstName || "Unknown"
// //             }.`,
// //           });
// //         }

// //         // ----------------------------------------------
// //         // ADDON ID
// //         // ----------------------------------------------

// //         const selectedAddonId =
// //           selectedAddon.addonId;

// //         // ----------------------------------------------
// //         // FIND VALID ADDON FROM TRAIN
// //         // ----------------------------------------------

// //         const validAddon =
// //           train.addons?.find(
// //             (addon) =>
// //               String(
// //                 addon._id ||
// //                   addon.id
// //               ) ===
// //               String(selectedAddonId)
// //           );

// //         if (!validAddon) {
// //           return res.status(400).json({
// //             success: false,
// //             message: `Invalid add-on "${selectedAddon.name || ""}" for traveller: ${
// //               trav.firstName || "Unknown"
// //             }.`,
// //           });
// //         }

// //         const currentAddonPrice =
// //           Number(validAddon.amount) || 0;

// //         addonPrice += currentAddonPrice;

// //         totalAddons += currentAddonPrice;

// //         // ----------------------------------------------
// //         // STORE ONLY VALID TRAIN/ADDON DATA
// //         // ----------------------------------------------

// //         validatedAddons.push({
// //           trainIndex,

// //           trainNo: train.trainNo,

// //           trainName: train.trainName,

// //           tripType: train.tripType,

// //           addonId:
// //             validAddon._id ||
// //             validAddon.id,

// //           name: validAddon.name,

// //           amount: currentAddonPrice,
// //         });
// //       }

// //       // =================================================
// //       // EXISTING PRICE CALCULATION
// //       // =================================================

// //       let travellerAdvance = 0;
// //       let travellerBalance = 0;

// //       // -------------------------------------------------
// //       // ADULT
// //       // -------------------------------------------------

// //       if (age >= 11) {
// //         travellerAdvance =
// //           Number(
// //             selectedPackage.advanceAmount
// //               ?.adult
// //           ) || 0;

// //         switch (
// //           trav.sharingType?.toLowerCase()
// //         ) {
// //           case "double":
// //             travellerBalance =
// //               Number(
// //                 selectedPackage.balanceDouble
// //               ) || 0;
// //             break;

// //           case "triple":
// //             travellerBalance =
// //               Number(
// //                 selectedPackage.balanceTriple
// //               ) || 0;
// //             break;

// //           default:
// //             return res.status(400).json({
// //               success: false,
// //               message: `Invalid sharing type for adult traveller: ${
// //                 trav.firstName || "Unknown"
// //               }.`,
// //             });
// //         }
// //       }

// //       // -------------------------------------------------
// //       // CHILD
// //       // -------------------------------------------------

// //       else if (age >= 6 && age <= 10) {
// //         travellerAdvance =
// //           Number(
// //             selectedPackage.advanceAmount
// //               ?.child
// //           ) || 0;

// //         switch (
// //           trav.sharingType?.toLowerCase()
// //         ) {
// //           case "withberth":
// //             travellerBalance =
// //               Number(
// //                 selectedPackage.balanceChildWithBerth
// //               ) || 0;
// //             break;

// //           case "withoutberth":
// //             travellerBalance =
// //               Number(
// //                 selectedPackage.balanceChildWithoutBerth
// //               ) || 0;
// //             break;

// //           default:
// //             return res.status(400).json({
// //               success: false,
// //               message: `Invalid sharing type for child traveller: ${
// //                 trav.firstName || "Unknown"
// //               }.`,
// //             });
// //         }
// //       }

// //       // =================================================
// //       // ADDONS ONLY ADDED TO ADVANCE
// //       // =================================================

// //       travellerAdvance += addonPrice;

// //       // ------------------------------------------------
// //       // NAN CHECK
// //       // ------------------------------------------------

// //       if (
// //         isNaN(travellerAdvance) ||
// //         isNaN(travellerBalance)
// //       ) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Booking failed: Could not calculate prices for traveller ${
// //             trav.firstName || "Unknown"
// //           }. Please check tour prices.`,
// //         });
// //       }

// //       // ------------------------------------------------
// //       // TOTALS
// //       // ------------------------------------------------

// //       totalAdvance += travellerAdvance;

// //       totalBalance += travellerBalance;

// //       // =================================================
// //       // SAVE TRAVELLER
// //       // =================================================

// //       updatedTravellers.push({
// //         ...trav,

// //         boardingPoint:
// //           selectedBoarding,

// //         deboardingPoint:
// //           selectedDeboarding,

// //         // NEW
// //         selectedAddons:
// //           validatedAddons,

// //         remarks:
// //           trav.remarks || null,

// //         packageType:
// //           trav.packageType,

// //         variantPackageIndex:
// //           trav.packageType === "variant"
// //             ? trav.variantPackageIndex
// //             : null,
// //       });
// //     }

// //     // ==================================================
// //     // TNR GENERATION
// //     // ==================================================

// //     let tnr;

// //     let attempts = 0;

// //     const maxAttempts = 10;

// //     const letters =
// //       "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// //     const digits =
// //       "0123456789";

// //     while (attempts < maxAttempts) {
// //       tnr =
// //         letters.charAt(
// //           Math.floor(
// //             Math.random() *
// //               letters.length
// //           )
// //         ) +
// //         letters.charAt(
// //           Math.floor(
// //             Math.random() *
// //               letters.length
// //           )
// //         ) +
// //         digits.charAt(
// //           Math.floor(
// //             Math.random() *
// //               digits.length
// //           )
// //         ) +
// //         digits.charAt(
// //           Math.floor(
// //             Math.random() *
// //               digits.length
// //           )
// //         ) +
// //         letters.charAt(
// //           Math.floor(
// //             Math.random() *
// //               letters.length
// //           )
// //         ) +
// //         letters.charAt(
// //           Math.floor(
// //             Math.random() *
// //               letters.length
// //           )
// //         );

// //       const conflict =
// //         await tourBookingModel.exists({
// //           tnr,
// //         });

// //       if (!conflict) {
// //         break;
// //       }

// //       attempts++;
// //     }

// //     if (attempts >= maxAttempts) {
// //       return res.status(503).json({
// //         success: false,
// //         message:
// //           "Unable to generate unique booking reference right now. Please try again in a moment.",
// //       });
// //     }

// //     // ==================================================
// //     // BOOKING DATA
// //     // ==================================================

// //     const bookingData = {
// //       userId,

// //       tourId,

// //       tnr,

// //       userData: {
// //         id: userId,
// //       },

// //       tourData: {
// //         id: tour._id,

// //         title: tour.title,

// //         titleImage: tour.titleImage,

// //         duration: tour.duration,

// //         price: tour.price,
// //       },

// //       travellers:
// //         updatedTravellers,

// //       billingAddress:
// //         billingAddress || {},

// //       contact: {
// //         email: contact?.email,

// //         mobile: contact?.mobile,
// //       },

// //       bookingType:
// //         bookingType || "online",

// //       payment: {
// //         advance: {
// //           amount: totalAdvance,
// //         },

// //         balance: {
// //           amount: totalBalance,
// //         },
// //       },

// //       status: "pending",

// //       bookingDate: new Date(),

// //       emergencyContact: null,

// //       termsAgreed: false,

// //       termsAgreedAt: null,
// //     };

// //     // ==================================================
// //     // SAVE
// //     // ==================================================

// //     const newBooking =
// //       new tourBookingModel(
// //         bookingData
// //       );

// //     await newBooking.save();

// //     // ==================================================
// //     // RESPONSE
// //     // ==================================================

// //     return res.status(201).json({
// //       success: true,

// //       message:
// //         "Booking added to trolley successfully.",

// //       booking: newBooking,

// //       // Optional response data
// //       addonsTotal: totalAddons,

// //       advanceAmount: totalAdvance,

// //       balanceAmount: totalBalance,
// //     });
// //   } catch (error) {
// //     console.error(
// //       "ADD TO TROLLY ERROR:",
// //       error
// //     );

// //     return res.status(500).json({
// //       success: false,
// //       message:
// //         "Internal server error.",
// //     });
// //   }
// // };


// // const addToTrolly = async (req, res) => {
// //   try {
// //     const {
// //       tourId,
// //       travellers = [],
// //       billingAddress,
// //       bookingType,
// //       contact,
// //     } = req.body;

// //     const userId = req.user._id;

// //     // --------------------------------------------------
// //     // MOBILE VALIDATION
// //     // --------------------------------------------------

// //     const mobile = (contact?.mobile || "").trim();

// //     if (!mobile) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Mobile number is required.",
// //       });
// //     }

// //     if (!/^[\d+\-\s()]{7,25}$/.test(mobile)) {
// //       return res.status(400).json({
// //         success: false,
// //         message:
// //           "Invalid mobile number format. Use digits, +, -, spaces or parentheses.",
// //       });
// //     }

// //     // --------------------------------------------------
// //     // TOUR ID VALIDATION
// //     // --------------------------------------------------

// //     if (!tourId) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Tour ID is required.",
// //       });
// //     }

// //     // --------------------------------------------------
// //     // FETCH TOUR
// //     // --------------------------------------------------

// //     const tour = await tourModel.findById(tourId);

// //     if (!tour) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Tour not found.",
// //       });
// //     }

// //     // --------------------------------------------------
// //     // TOTALS
// //     // --------------------------------------------------

// //     let totalAdvance = 0;
// //     let totalBalance = 0;

// //     // This is only for calculation/debugging.
// //     // Booking payment calculation remains same.
// //     let totalAddons = 0;

// //     const updatedTravellers = [];

// //     // ==================================================
// //     // TRAVELLERS
// //     // ==================================================

// //     for (const trav of travellers) {
// //       const age = Number(trav.age);

// //       // ------------------------------------------------
// //       // AGE VALIDATION
// //       // ------------------------------------------------

// //       if (
// //         isNaN(age) ||
// //         age < 1 ||
// //         (age >= 1 && age <= 5)
// //       ) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Booking failed: Invalid age for traveller ${
// //             trav.firstName || "Unknown"
// //           }. Age must be a number greater than 5.`,
// //         });
// //       }

// //       // ------------------------------------------------
// //       // PACKAGE TYPE
// //       // ------------------------------------------------

// //       if (
// //         !trav.packageType ||
// //         !["main", "variant"].includes(
// //           trav.packageType
// //         )
// //       ) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Invalid package type for traveller: ${
// //             trav.firstName || "Unknown"
// //           }. Must be 'main' or 'variant'.`,
// //         });
// //       }

// //       // ------------------------------------------------
// //       // VARIANT PACKAGE
// //       // ------------------------------------------------

// //       if (
// //         trav.packageType === "variant" &&
// //         (trav.variantPackageIndex === null ||
// //           isNaN(trav.variantPackageIndex))
// //       ) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Variant package index is required for traveller: ${
// //             trav.firstName || "Unknown"
// //           }.`,
// //         });
// //       }

// //       // ------------------------------------------------
// //       // SELECT PACKAGE
// //       // ------------------------------------------------

// //       let selectedPackage = tour;

// //       if (trav.packageType === "variant") {
// //         if (
// //           !tour.variantPackage?.[
// //             trav.variantPackageIndex
// //           ]
// //         ) {
// //           return res.status(400).json({
// //             success: false,
// //             message: `Variant package at index ${
// //               trav.variantPackageIndex
// //             } does not exist for traveller: ${
// //               trav.firstName || "Unknown"
// //             }.`,
// //           });
// //         }

// //         selectedPackage =
// //           tour.variantPackage[
// //             trav.variantPackageIndex
// //           ];
// //       }

// //       // =================================================
// //       // BOARDING POINT
// //       // =================================================

// //       if (!trav.boardingPoint) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Boarding point is required for traveller: ${
// //             trav.firstName || "Unknown"
// //           }`,
// //         });
// //       }

// //       const validBoarding =
// //         selectedPackage.boardingPoints?.find(
// //           (bp) =>
// //             bp.stationCode ===
// //             trav.boardingPoint.stationCode
// //         );

// //       if (!validBoarding) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Invalid boarding point for traveller: ${
// //             trav.firstName || "Unknown"
// //           }`,
// //         });
// //       }

// //       const selectedBoarding = {
// //         stationCode: validBoarding.stationCode,
// //         stationName: validBoarding.stationName,
// //       };

// //       // =================================================
// //       // DEBOARDING POINT
// //       // =================================================

// //       if (!trav.deboardingPoint) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Deboarding point is required for traveller: ${
// //             trav.firstName || "Unknown"
// //           }`,
// //         });
// //       }

// //       const validDeboarding =
// //         selectedPackage.deboardingPoints?.find(
// //           (dp) =>
// //             dp.stationCode ===
// //             trav.deboardingPoint.stationCode
// //         );

// //       if (!validDeboarding) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Invalid deboarding point for traveller: ${
// //             trav.firstName || "Unknown"
// //           }`,
// //         });
// //       }

// //       const selectedDeboarding = {
// //         stationCode:
// //           validDeboarding.stationCode,
// //         stationName:
// //           validDeboarding.stationName,
// //       };

// //       // =================================================
// //       // NEW TRAIN ADDONS VALIDATION
// //       // =================================================

// //       let addonPrice = 0;

// //       const selectedAddons = Array.isArray(
// //         trav.selectedAddons
// //       )
// //         ? trav.selectedAddons
// //         : [];

// //       const validatedAddons = [];

// //       for (const selectedAddon of selectedAddons) {
// //         const selectedAddonId =
// //           selectedAddon.addonId;

// //         // ----------------------------------------------
// //         // ADDON IS OPTIONAL PER TRAIN/TRIP LEG
// //         // ----------------------------------------------
// //         // Customer may leave a leg as "No Add-on" — that entry arrives
// //         // with no addonId (null/undefined/empty string). This is NOT
// //         // an error, just skip it and move to the next leg. Only entries
// //         // where the customer actually picked an addon get validated.
// //         if (
// //           selectedAddonId === null ||
// //           selectedAddonId === undefined ||
// //           selectedAddonId === ""
// //         ) {
// //           continue;
// //         }

// //         const trainIndex = Number(
// //           selectedAddon.trainIndex
// //         );

// //         // ----------------------------------------------
// //         // TRAIN EXISTS?
// //         // ----------------------------------------------

// //         const train =
// //           selectedPackage.trainDetails?.[
// //             trainIndex
// //           ];

// //         if (!train) {
// //           return res.status(400).json({
// //             success: false,
// //             message: `Invalid train selection for traveller: ${
// //               trav.firstName || "Unknown"
// //             }.`,
// //           });
// //         }

// //         // ----------------------------------------------
// //         // FIND VALID ADDON FROM TRAIN
// //         // ----------------------------------------------

// //         const validAddon =
// //           train.addons?.find(
// //             (addon) =>
// //               String(
// //                 addon._id ||
// //                   addon.id
// //               ) ===
// //               String(selectedAddonId)
// //           );

// //         if (!validAddon) {
// //           return res.status(400).json({
// //             success: false,
// //             message: `Invalid add-on "${selectedAddon.name || ""}" for traveller: ${
// //               trav.firstName || "Unknown"
// //             }.`,
// //           });
// //         }

// //         const currentAddonPrice =
// //           Number(validAddon.amount) || 0;

// //         addonPrice += currentAddonPrice;

// //         totalAddons += currentAddonPrice;

// //         // ----------------------------------------------
// //         // STORE ONLY VALID TRAIN/ADDON DATA
// //         // ----------------------------------------------

// //         validatedAddons.push({
// //           trainIndex,

// //           trainNo: train.trainNo,

// //           trainName: train.trainName,

// //           tripType: train.tripType,

// //           addonId:
// //             validAddon._id ||
// //             validAddon.id,

// //           name: validAddon.name,

// //           amount: currentAddonPrice,
// //         });
// //       }

// //       // =================================================
// //       // EXISTING PRICE CALCULATION
// //       // =================================================

// //       let travellerAdvance = 0;
// //       let travellerBalance = 0;

// //       // -------------------------------------------------
// //       // ADULT
// //       // -------------------------------------------------

// //       if (age >= 11) {
// //         travellerAdvance =
// //           Number(
// //             selectedPackage.advanceAmount
// //               ?.adult
// //           ) || 0;

// //         switch (
// //           trav.sharingType?.toLowerCase()
// //         ) {
// //           case "double":
// //             travellerBalance =
// //               Number(
// //                 selectedPackage.balanceDouble
// //               ) || 0;
// //             break;

// //           case "triple":
// //             travellerBalance =
// //               Number(
// //                 selectedPackage.balanceTriple
// //               ) || 0;
// //             break;

// //           default:
// //             return res.status(400).json({
// //               success: false,
// //               message: `Invalid sharing type for adult traveller: ${
// //                 trav.firstName || "Unknown"
// //               }.`,
// //             });
// //         }
// //       }

// //       // -------------------------------------------------
// //       // CHILD
// //       // -------------------------------------------------

// //       else if (age >= 6 && age <= 10) {
// //         travellerAdvance =
// //           Number(
// //             selectedPackage.advanceAmount
// //               ?.child
// //           ) || 0;

// //         switch (
// //           trav.sharingType?.toLowerCase()
// //         ) {
// //           case "withberth":
// //             travellerBalance =
// //               Number(
// //                 selectedPackage.balanceChildWithBerth
// //               ) || 0;
// //             break;

// //           case "withoutberth":
// //             travellerBalance =
// //               Number(
// //                 selectedPackage.balanceChildWithoutBerth
// //               ) || 0;
// //             break;

// //           default:
// //             return res.status(400).json({
// //               success: false,
// //               message: `Invalid sharing type for child traveller: ${
// //                 trav.firstName || "Unknown"
// //               }.`,
// //             });
// //         }
// //       }

// //       // =================================================
// //       // ADDONS ONLY ADDED TO ADVANCE
// //       // =================================================

// //       travellerAdvance += addonPrice;

// //       // ------------------------------------------------
// //       // NAN CHECK
// //       // ------------------------------------------------

// //       if (
// //         isNaN(travellerAdvance) ||
// //         isNaN(travellerBalance)
// //       ) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Booking failed: Could not calculate prices for traveller ${
// //             trav.firstName || "Unknown"
// //           }. Please check tour prices.`,
// //         });
// //       }

// //       // ------------------------------------------------
// //       // TOTALS
// //       // ------------------------------------------------

// //       totalAdvance += travellerAdvance;

// //       totalBalance += travellerBalance;

// //       // =================================================
// //       // SAVE TRAVELLER
// //       // =================================================

// //       updatedTravellers.push({
// //         ...trav,

// //         boardingPoint:
// //           selectedBoarding,

// //         deboardingPoint:
// //           selectedDeboarding,

// //         // NEW
// //         selectedAddons:
// //           validatedAddons,

// //         remarks:
// //           trav.remarks || null,

// //         packageType:
// //           trav.packageType,

// //         variantPackageIndex:
// //           trav.packageType === "variant"
// //             ? trav.variantPackageIndex
// //             : null,
// //       });
// //     }

// //     // ==================================================
// //     // TNR GENERATION
// //     // ==================================================

// //     let tnr;

// //     let attempts = 0;

// //     const maxAttempts = 10;

// //     const letters =
// //       "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// //     const digits =
// //       "0123456789";

// //     while (attempts < maxAttempts) {
// //       tnr =
// //         letters.charAt(
// //           Math.floor(
// //             Math.random() *
// //               letters.length
// //           )
// //         ) +
// //         letters.charAt(
// //           Math.floor(
// //             Math.random() *
// //               letters.length
// //           )
// //         ) +
// //         digits.charAt(
// //           Math.floor(
// //             Math.random() *
// //               digits.length
// //           )
// //         ) +
// //         digits.charAt(
// //           Math.floor(
// //             Math.random() *
// //               digits.length
// //           )
// //         ) +
// //         letters.charAt(
// //           Math.floor(
// //             Math.random() *
// //               letters.length
// //           )
// //         ) +
// //         letters.charAt(
// //           Math.floor(
// //             Math.random() *
// //               letters.length
// //           )
// //         );

// //       const conflict =
// //         await tourBookingModel.exists({
// //           tnr,
// //         });

// //       if (!conflict) {
// //         break;
// //       }

// //       attempts++;
// //     }

// //     if (attempts >= maxAttempts) {
// //       return res.status(503).json({
// //         success: false,
// //         message:
// //           "Unable to generate unique booking reference right now. Please try again in a moment.",
// //       });
// //     }

// //     // ==================================================
// //     // BOOKING DATA
// //     // ==================================================

// //     const bookingData = {
// //       userId,

// //       tourId,

// //       tnr,

// //       userData: {
// //         id: userId,
// //       },

// //       tourData: {
// //         id: tour._id,

// //         title: tour.title,

// //         titleImage: tour.titleImage,

// //         duration: tour.duration,

// //         price: tour.price,
// //       },

// //       travellers:
// //         updatedTravellers,

// //       billingAddress:
// //         billingAddress || {},

// //       contact: {
// //         email: contact?.email,

// //         mobile: contact?.mobile,
// //       },

// //       bookingType:
// //         bookingType || "online",

// //       payment: {
// //         advance: {
// //           amount: totalAdvance,
// //         },

// //         balance: {
// //           amount: totalBalance,
// //         },
// //       },

// //       status: "pending",

// //       bookingDate: new Date(),

// //       emergencyContact: null,

// //       termsAgreed: false,

// //       termsAgreedAt: null,
// //     };

// //     // ==================================================
// //     // SAVE
// //     // ==================================================

// //     const newBooking =
// //       new tourBookingModel(
// //         bookingData
// //       );

// //     await newBooking.save();

// //     // ==================================================
// //     // RESPONSE
// //     // ==================================================

// //     return res.status(201).json({
// //       success: true,

// //       message:
// //         "Booking added to trolley successfully.",

// //       booking: newBooking,

// //       // Optional response data
// //       addonsTotal: totalAddons,

// //       advanceAmount: totalAdvance,

// //       balanceAmount: totalBalance,
// //     });
// //   } catch (error) {
// //     console.error(
// //       "ADD TO TROLLY ERROR:",
// //       error
// //     );

// //     return res.status(500).json({
// //       success: false,
// //       message:
// //         "Internal server error.",
// //     });
// //   }
// // };


// const addToTrolly = async (req, res) => {
//   try {
//     const {
//       tourId,
//       travellers = [],
//       billingAddress,
//       bookingType,
//       contact,
//     } = req.body;

//     const userId = req.user._id;

//     // --------------------------------------------------
//     // MOBILE VALIDATION
//     // --------------------------------------------------

//     const mobile = (contact?.mobile || "").trim();

//     if (!mobile) {
//       return res.status(400).json({
//         success: false,
//         message: "Mobile number is required.",
//       });
//     }

//     if (!/^[\d+\-\s()]{7,25}$/.test(mobile)) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Invalid mobile number format. Use digits, +, -, spaces or parentheses.",
//       });
//     }

//     // --------------------------------------------------
//     // TOUR ID VALIDATION
//     // --------------------------------------------------

//     if (!tourId) {
//       return res.status(400).json({
//         success: false,
//         message: "Tour ID is required.",
//       });
//     }

//     // --------------------------------------------------
//     // FETCH TOUR
//     // --------------------------------------------------

//     const tour = await tourModel.findById(tourId);

//     if (!tour) {
//       return res.status(404).json({
//         success: false,
//         message: "Tour not found.",
//       });
//     }

//     // --------------------------------------------------
//     // TOTALS
//     // --------------------------------------------------

//     let totalAdvance = 0;
//     let totalBalance = 0;

//     // This is only for calculation/debugging.
//     // Booking payment calculation remains same.
//     let totalAddons = 0;

//     const updatedTravellers = [];

//     // ==================================================
//     // TRAVELLERS
//     // ==================================================

//     for (const trav of travellers) {
//       const age = Number(trav.age);

//       // ------------------------------------------------
//       // AGE VALIDATION
//       // ------------------------------------------------

//       if (
//         isNaN(age) ||
//         age < 1 ||
//         (age >= 1 && age <= 5)
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: `Booking failed: Invalid age for traveller ${
//             trav.firstName || "Unknown"
//           }. Age must be a number greater than 5.`,
//         });
//       }

//       // ------------------------------------------------
//       // PACKAGE TYPE
//       // ------------------------------------------------

//       if (
//         !trav.packageType ||
//         !["main", "variant"].includes(
//           trav.packageType
//         )
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid package type for traveller: ${
//             trav.firstName || "Unknown"
//           }. Must be 'main' or 'variant'.`,
//         });
//       }

//       // ------------------------------------------------
//       // VARIANT PACKAGE
//       // ------------------------------------------------

//       if (
//         trav.packageType === "variant" &&
//         (trav.variantPackageIndex === null ||
//           isNaN(trav.variantPackageIndex))
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: `Variant package index is required for traveller: ${
//             trav.firstName || "Unknown"
//           }.`,
//         });
//       }

//       // ------------------------------------------------
//       // SELECT PACKAGE
//       // ------------------------------------------------

//       let selectedPackage = tour;

//       if (trav.packageType === "variant") {
//         if (
//           !tour.variantPackage?.[
//             trav.variantPackageIndex
//           ]
//         ) {
//           return res.status(400).json({
//             success: false,
//             message: `Variant package at index ${
//               trav.variantPackageIndex
//             } does not exist for traveller: ${
//               trav.firstName || "Unknown"
//             }.`,
//           });
//         }

//         selectedPackage =
//           tour.variantPackage[
//             trav.variantPackageIndex
//           ];
//       }

//       // =================================================
//       // BOARDING POINT
//       // =================================================

//       if (!trav.boardingPoint) {
//         return res.status(400).json({
//           success: false,
//           message: `Boarding point is required for traveller: ${
//             trav.firstName || "Unknown"
//           }`,
//         });
//       }

//       const validBoarding =
//         selectedPackage.boardingPoints?.find(
//           (bp) =>
//             bp.stationCode ===
//             trav.boardingPoint.stationCode
//         );

//       if (!validBoarding) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid boarding point for traveller: ${
//             trav.firstName || "Unknown"
//           }`,
//         });
//       }

//       const selectedBoarding = {
//         stationCode: validBoarding.stationCode,
//         stationName: validBoarding.stationName,
//       };

//       // =================================================
//       // DEBOARDING POINT
//       // =================================================

//       if (!trav.deboardingPoint) {
//         return res.status(400).json({
//           success: false,
//           message: `Deboarding point is required for traveller: ${
//             trav.firstName || "Unknown"
//           }`,
//         });
//       }

//       const validDeboarding =
//         selectedPackage.deboardingPoints?.find(
//           (dp) =>
//             dp.stationCode ===
//             trav.deboardingPoint.stationCode
//         );

//       if (!validDeboarding) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid deboarding point for traveller: ${
//             trav.firstName || "Unknown"
//           }`,
//         });
//       }

//       const selectedDeboarding = {
//         stationCode:
//           validDeboarding.stationCode,
//         stationName:
//           validDeboarding.stationName,
//       };

//       // =================================================
//       // NEW TRAIN ADDONS VALIDATION
//       // =================================================

//       let addonPrice = 0;

//       const selectedAddons = Array.isArray(
//         trav.selectedAddons
//       )
//         ? trav.selectedAddons
//         : [];

//       const validatedAddons = [];

//       for (const selectedAddon of selectedAddons) {
//         const selectedAddonId =
//           selectedAddon.addonId;

//         // ----------------------------------------------
//         // ADDON IS OPTIONAL PER TRAIN/TRIP LEG
//         // ----------------------------------------------
//         // Customer may leave a leg as "No Add-on" — that entry arrives
//         // with no addonId (null/undefined/empty string). This is NOT
//         // an error, just skip it and move to the next leg. Only entries
//         // where the customer actually picked an addon get validated.
//         if (
//           selectedAddonId === null ||
//           selectedAddonId === undefined ||
//           selectedAddonId === ""
//         ) {
//           continue;
//         }

//         // ----------------------------------------------
//         // DECIDE TRAIN vs FLIGHT ENTRY
//         // ----------------------------------------------
//         // Frontend now sends BOTH kinds in the same selectedAddons[]
//         // array: train-keyed entries carry `trainIndex`, flight-keyed
//         // entries carry `flightIndex`. Whichever one is present (and
//         // not null/undefined) tells us which list to validate against.
//         const isFlightAddon =
//           selectedAddon.flightIndex !== undefined &&
//           selectedAddon.flightIndex !== null;

//         let trip;
//         let tripLabel;

//         if (isFlightAddon) {
//           const flightIndex = Number(
//             selectedAddon.flightIndex
//           );

//           trip =
//             selectedPackage.flightDetails?.[
//               flightIndex
//             ];
//           tripLabel = "flight";

//           if (!trip) {
//             return res.status(400).json({
//               success: false,
//               message: `Invalid flight selection for traveller: ${
//                 trav.firstName || "Unknown"
//               }.`,
//             });
//           }
//         } else {
//           const trainIndex = Number(
//             selectedAddon.trainIndex
//           );

//           // ----------------------------------------------
//           // TRAIN EXISTS?
//           // ----------------------------------------------

//           trip =
//             selectedPackage.trainDetails?.[
//               trainIndex
//             ];
//           tripLabel = "train";

//           if (!trip) {
//             return res.status(400).json({
//               success: false,
//               message: `Invalid train selection for traveller: ${
//                 trav.firstName || "Unknown"
//               }.`,
//             });
//           }
//         }

//         // ----------------------------------------------
//         // FIND VALID ADDON FROM TRAIN/FLIGHT
//         // ----------------------------------------------

//         const validAddon =
//           trip.addons?.find(
//             (addon) =>
//               String(
//                 addon._id ||
//                   addon.id
//               ) ===
//               String(selectedAddonId)
//           );

//         if (!validAddon) {
//           return res.status(400).json({
//             success: false,
//             message: `Invalid add-on "${selectedAddon.name || ""}" for traveller: ${
//               trav.firstName || "Unknown"
//             }.`,
//           });
//         }

//         const currentAddonPrice =
//           Number(validAddon.amount) || 0;

//         addonPrice += currentAddonPrice;

//         totalAddons += currentAddonPrice;

//         // ----------------------------------------------
//         // STORE ONLY VALID TRAIN/FLIGHT ADDON DATA
//         // ----------------------------------------------

//         if (isFlightAddon) {
//           validatedAddons.push({
//             flightIndex: Number(selectedAddon.flightIndex),

//             flightNo: trip.flightNo,

//             airline: trip.airline,

//             tripType: trip.tripType,

//             addonId:
//               validAddon._id ||
//               validAddon.id,

//             name: validAddon.name,

//             amount: currentAddonPrice,
//           });
//         } else {
//           validatedAddons.push({
//             trainIndex: Number(selectedAddon.trainIndex),

//             trainNo: trip.trainNo,

//             trainName: trip.trainName,

//             tripType: trip.tripType,

//             addonId:
//               validAddon._id ||
//               validAddon.id,

//             name: validAddon.name,

//             amount: currentAddonPrice,
//           });
//         }
//       }

//       // =================================================
//       // EXISTING PRICE CALCULATION
//       // =================================================

//       let travellerAdvance = 0;
//       let travellerBalance = 0;

//       // -------------------------------------------------
//       // ADULT
//       // -------------------------------------------------

//       if (age >= 11) {
//         travellerAdvance =
//           Number(
//             selectedPackage.advanceAmount
//               ?.adult
//           ) || 0;

//         switch (
//           trav.sharingType?.toLowerCase()
//         ) {
//           case "double":
//             travellerBalance =
//               Number(
//                 selectedPackage.balanceDouble
//               ) || 0;
//             break;

//           case "triple":
//             travellerBalance =
//               Number(
//                 selectedPackage.balanceTriple
//               ) || 0;
//             break;

//           default:
//             return res.status(400).json({
//               success: false,
//               message: `Invalid sharing type for adult traveller: ${
//                 trav.firstName || "Unknown"
//               }.`,
//             });
//         }
//       }

//       // -------------------------------------------------
//       // CHILD
//       // -------------------------------------------------

//       else if (age >= 6 && age <= 10) {
//         travellerAdvance =
//           Number(
//             selectedPackage.advanceAmount
//               ?.child
//           ) || 0;

//         switch (
//           trav.sharingType?.toLowerCase()
//         ) {
//           case "withberth":
//             travellerBalance =
//               Number(
//                 selectedPackage.balanceChildWithBerth
//               ) || 0;
//             break;

//           case "withoutberth":
//             travellerBalance =
//               Number(
//                 selectedPackage.balanceChildWithoutBerth
//               ) || 0;
//             break;

//           default:
//             return res.status(400).json({
//               success: false,
//               message: `Invalid sharing type for child traveller: ${
//                 trav.firstName || "Unknown"
//               }.`,
//             });
//         }
//       }

//       // =================================================
//       // ADDONS ONLY ADDED TO ADVANCE
//       // =================================================

//       travellerAdvance += addonPrice;

//       // ------------------------------------------------
//       // NAN CHECK
//       // ------------------------------------------------

//       if (
//         isNaN(travellerAdvance) ||
//         isNaN(travellerBalance)
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: `Booking failed: Could not calculate prices for traveller ${
//             trav.firstName || "Unknown"
//           }. Please check tour prices.`,
//         });
//       }

//       // ------------------------------------------------
//       // TOTALS
//       // ------------------------------------------------

//       totalAdvance += travellerAdvance;

//       totalBalance += travellerBalance;

//       // =================================================
//       // SAVE TRAVELLER
//       // =================================================

//       updatedTravellers.push({
//         ...trav,

//         boardingPoint:
//           selectedBoarding,

//         deboardingPoint:
//           selectedDeboarding,

//         // NEW
//         selectedAddons:
//           validatedAddons,

//         remarks:
//           trav.remarks || null,

//         packageType:
//           trav.packageType,

//         variantPackageIndex:
//           trav.packageType === "variant"
//             ? trav.variantPackageIndex
//             : null,
//       });
//     }

//     // ==================================================
//     // TNR GENERATION
//     // ==================================================

//     let tnr;

//     let attempts = 0;

//     const maxAttempts = 10;

//     const letters =
//       "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

//     const digits =
//       "0123456789";

//     while (attempts < maxAttempts) {
//       tnr =
//         letters.charAt(
//           Math.floor(
//             Math.random() *
//               letters.length
//           )
//         ) +
//         letters.charAt(
//           Math.floor(
//             Math.random() *
//               letters.length
//           )
//         ) +
//         digits.charAt(
//           Math.floor(
//             Math.random() *
//               digits.length
//           )
//         ) +
//         digits.charAt(
//           Math.floor(
//             Math.random() *
//               digits.length
//           )
//         ) +
//         letters.charAt(
//           Math.floor(
//             Math.random() *
//               letters.length
//           )
//         ) +
//         letters.charAt(
//           Math.floor(
//             Math.random() *
//               letters.length
//           )
//         );

//       const conflict =
//         await tourBookingModel.exists({
//           tnr,
//         });

//       if (!conflict) {
//         break;
//       }

//       attempts++;
//     }

//     if (attempts >= maxAttempts) {
//       return res.status(503).json({
//         success: false,
//         message:
//           "Unable to generate unique booking reference right now. Please try again in a moment.",
//       });
//     }

//     // ==================================================
//     // BOOKING DATA
//     // ==================================================

//     const bookingData = {
//       userId,

//       tourId,

//       tnr,

//       userData: {
//         id: userId,
//       },

//       tourData: {
//         id: tour._id,

//         title: tour.title,

//         titleImage: tour.titleImage,

//         duration: tour.duration,

//         price: tour.price,
//       },

//       travellers:
//         updatedTravellers,

//       billingAddress:
//         billingAddress || {},

//       contact: {
//         email: contact?.email,

//         mobile: contact?.mobile,
//       },

//       bookingType:
//         bookingType || "online",

//       payment: {
//         advance: {
//           amount: totalAdvance,
//         },

//         balance: {
//           amount: totalBalance,
//         },
//       },

//       status: "pending",

//       bookingDate: new Date(),

//       emergencyContact: null,

//       termsAgreed: false,

//       termsAgreedAt: null,
//     };

//     // ==================================================
//     // SAVE
//     // ==================================================

//     const newBooking =
//       new tourBookingModel(
//         bookingData
//       );

//     await newBooking.save();

//     // ==================================================
//     // RESPONSE
//     // ==================================================

//     return res.status(201).json({
//       success: true,

//       message:
//         "Booking added to trolley successfully.",

//       booking: newBooking,

//       // Optional response data
//       addonsTotal: totalAddons,

//       advanceAmount: totalAdvance,

//       balanceAmount: totalBalance,
//     });
//   } catch (error) {
//     console.error(
//       "ADD TO TROLLY ERROR:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Internal server error.",
//     });
//   }
// };


// // Get all tour bookings for a user
// const listTrolly = async (req, res) => {
//   try {
//     const userId = req.user;

//     const bookings = await tourBookingModel
//       .find({ userId })
//       .populate(
//         "tourId",
//         "title duration titleImage advanceAmount doubleSharing tripleSharing",
//       );

//     res.json({ success: true, bookings });
//   } catch (error) {
//     res.json({ success: false, message: error.message });
//   }
// };

// ("use strict");
// const cancelTraveller = async (req, res) => {
//   try {
//     const { tnr, travellerId } = req.body;
//     const userId = req.user?._id;

//     // Validate request body
//     if (!tnr || !travellerId) {
//       return res.status(400).json({
//         success: false,
//         message: "tnr and travellerId are required",
//       });
//     }

//     // Fetch the booking by tnr
//     const bookingData = await tourBookingModel.findOne({
//       tnr: tnr.trim().toUpperCase(),
//     });
//     if (!bookingData) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found with this TNR",
//       });
//     }

//     // Ensure the booking belongs to the logged-in user
//     if (bookingData.userId.toString() !== userId.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: "Unauthorized action – this booking does not belong to you",
//       });
//     }

//     // Check if advance payment is completed
//     const advancePaid =
//       bookingData.payment?.advance?.paid &&
//       bookingData.payment?.advance?.paymentVerified;

//     if (!advancePaid) {
//       return res.status(400).json({
//         success: false,
//         message: "Advance payment not completed, cancellation cannot proceed.",
//       });
//     }

//     // Find the traveller
//     const travellerIndex = bookingData.travellers.findIndex(
//       (traveller) => traveller._id.toString() === String(travellerId),
//     );

//     if (travellerIndex === -1) {
//       return res.status(404).json({
//         success: false,
//         message: "Traveller not found in this booking",
//       });
//     }

//     const traveller = bookingData.travellers[travellerIndex];

//     // Check if already cancelled
//     if (traveller.cancelled?.byTraveller) {
//       return res.status(400).json({
//         success: false,
//         message: "Traveller has already been cancelled",
//       });
//     }

//     // Update cancellation flags
//     traveller.cancelled = {
//       ...traveller.cancelled,
//       byTraveller: true,
//       cancelledAt: new Date(),
//     };

//     await bookingData.save();

//     return res.status(200).json({
//       success: true,
//       message: `Cancellation requested for traveller: ${traveller.firstName} ${traveller.lastName}`,
//       tnr: bookingData.tnr,
//       travellerId: traveller._id,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "An unexpected error occurred",
//       error: error.message,
//     });
//   }
// };

// const razorpayInstance = new razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// // // ===============================
// // // CREATE PAYMENT ORDER
// // // ===============================
// const paymentRazorpay = async (req, res) => {
//   try {
//     const { tnr, paymentType } = req.body; // ← changed

//     if (!tnr) {
//       return res.json({ success: false, message: "TNR is required" });
//     }

//     // Find by tnr field (assuming tnr is a unique string field)
//     const booking = await tourBookingModel.findOne({ tnr });

//     if (!booking) {
//       return res.json({
//         success: false,
//         message: "Booking not found",
//       });
//     }

//     if (
//       booking.cancelled?.byAdmin ||
//       booking.cancelled?.byTraveller ||
//       booking.isBookingCancelled // ← add if you have this flag
//     ) {
//       return res.json({
//         success: false,
//         message: "Booking cancelled or not found",
//       });
//     }

//     if (booking.userId.toString() !== req.user._id.toString()) {
//       return res.json({
//         success: false,
//         message: "Unauthorized action",
//       });
//     }

//     let amountToPay = 0;
//     let paymentKey = "";

//     if (paymentType === "advance") {
//       if (booking.payment?.advance?.paid) {
//         return res.json({ success: false, message: "Advance already paid" });
//       }
//       amountToPay = booking.payment.advance.amount;
//       paymentKey = "advance";
//     } else if (paymentType === "balance") {
//       if (!booking.payment?.advance?.paid) {
//         return res.json({ success: false, message: "Pay advance first" });
//       }
//       if (booking.payment?.balance?.paid) {
//         return res.json({ success: false, message: "Balance already paid" });
//       }
//       amountToPay = booking.payment.balance.amount;
//       paymentKey = "balance";
//     } else {
//       return res.json({ success: false, message: "Invalid payment type" });
//     }

//     // Razorpay order
//     const options = {
//       amount: Math.round(amountToPay * 100), // paise, avoid floating point issues
//       currency: process.env.CURRENCY || "INR",
//       receipt: `${tnr}_${paymentKey}`, // ← better to use tnr here too
//     };

//     const order = await razorpayInstance.orders.create(options);

//     return res.json({
//       success: true,
//       order,
//       // Optional: send these back if frontend needs them
//       amountToPay,
//       paymentType: paymentKey,
//       tnr,
//     });
//   } catch (error) {
//     return res.json({
//       success: false,
//       message: error.message || "Payment initiation failed",
//     });
//   }
// };

// const verifyRazorpay = async (req, res) => {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       tnr,
//       paymentType,
//     } = req.body;

//     // You can send tnr & paymentType from frontend in verify call (safer)

//     // Verify signature
//     const generatedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//       .digest("hex");

//     if (generatedSignature !== razorpay_signature) {
//       return res.json({ success: false, message: "Invalid signature" });
//     }

//     const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);
//     if (!orderInfo || orderInfo.status !== "paid") {
//       return res.json({ success: false, message: "Payment not completed" });
//     }

//     // Prefer using tnr from body (more secure than parsing receipt)
//     let booking;

//     if (tnr) {
//       booking = await tourBookingModel.findOne({ tnr });
//     } else {
//       // fallback – only if you didn't send tnr
//       const [receiptTnr, receiptType] = orderInfo.receipt.split("_");
//       booking = await tourBookingModel.findOne({ tnr: receiptTnr });
//     }

//     if (!booking) {
//       return res.json({ success: false, message: "Booking not found" });
//     }

//     // Update
//     await tourBookingModel.findOneAndUpdate(
//       { tnr: booking.tnr },
//       {
//         $set: {
//           [`payment.${paymentType}.paid`]: true,
//           [`payment.${paymentType}.paidAt`]: new Date(),
//           [`payment.${paymentType}.transactionId`]: razorpay_payment_id,
//           [`payment.${paymentType}.razorpayOrderId`]: razorpay_order_id,
//           [`payment.${paymentType}.status`]: "paid",
//           [`payment.${paymentType}.paymentVerified`]: true,
//         },
//       },
//     );

//     return res.json({
//       success: true,
//       message: "Payment verified successfully.",
//     });
//   } catch (error) {
//     return res.json({ success: false, message: error.message });
//   }
// };
// const getSeatAllocationByTNR = async (req, res) => {
//   try {
//     const { tnr } = req.params; // or req.query.tnr

//     if (!tnr || tnr.length !== 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide a valid 6-digit TNR",
//       });
//     }

//     // Step 1: Find booking by TNR
//     const booking = await tourBookingModel
//       .findOne({ tnr: tnr.toUpperCase() })
//       .select("tourId tnr userData bookingDate")
//       .lean();

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "No booking found with this TNR",
//       });
//     }

//     // Step 2: Find all vehicles for this tour
//     const vehicles = await TourVehicle.find({ tourId: booking.tourId })
//       .select(
//         "vehicleName registrationNumber leaderRow passengerRows totalSeats seatsPerRow passengerRowCount allowSeatSelection bookedSeats",
//       )
//       .lean();

//     if (vehicles.length === 0) {
//       return res.status(200).json({
//         success: true,
//         message: "No vehicles assigned to this tour yet",
//         booking: {
//           tnr: booking.tnr,
//           tourId: booking.tourId,
//         },
//         vehicles: [],
//       });
//     }

//     // Optional: enrich with more readable seat status
//     const enrichedVehicles = vehicles.map((vehicle) => {
//       const bookedSet = new Set(vehicle.bookedSeats.map((b) => b.seatNumber));

//       return {
//         ...vehicle,
//         bookedSeatSet: Array.from(bookedSet), // for frontend highlighting
//         totalBooked: vehicle.bookedSeats.length,
//       };
//     });

//     return res.status(200).json({
//       success: true,
//       booking: {
//         tnr: booking.tnr,
//         tourId: booking.tourId,
//       },
//       vehicles: enrichedVehicles,
//     });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: "Server error while fetching seat allocation",
//       error: err.message,
//     });
//   }
// };
// const getBookingDetailsByTNR = async (req, res) => {
//   try {
//     const { tnr } = req.params;

//     // Basic input validation
//     if (!tnr || tnr.trim().length !== 6 || !/^[A-Z0-9]{6}$/i.test(tnr)) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide a valid 6-digit TNR (alphanumeric)",
//       });
//     }

//     // Find booking - lean() for performance (no Mongoose document overhead)
//     const booking = await tourBookingModel
//       .findOne({ tnr: tnr.toUpperCase() })
//       .populate("userId", "name email mobile") // optional: populate basic user info
//       .populate("tourId", "tourName startDate endDate duration") // optional: populate tour basics
//       .lean();

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: `No booking found with TNR: ${tnr.toUpperCase()}`,
//       });
//     }

//     // Success response - full document returned
//     return res.status(200).json({
//       success: true,
//       message: "Booking details retrieved successfully",
//       booking: {
//         ...booking,
//         // Ensure TNR is always uppercase in response
//         tnr: booking.tnr?.toUpperCase(),
//       },
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Server error while fetching booking details",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };
// const confirmSeatSelection = async (req, res) => {
//   const { tnr } = req.params;
//   const { selections } = req.body;

//   // Basic input validation
//   if (!selections || Object.keys(selections).length === 0) {
//     return res.status(400).json({
//       success: false,
//       message: "No seats selected to confirm",
//     });
//   }

//   if (!tnr || typeof tnr !== "string" || tnr.trim().length < 6) {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid TNR format",
//     });
//   }

//   const normalizedTnr = tnr.trim().toUpperCase();

//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // 1. Find the booking
//     const booking = await tourBookingModel
//       .findOne({ tnr: normalizedTnr })
//       .session(session);

//     if (!booking) {
//       throw new Error("Booking not found with this TNR");
//     }

//     // ────────────────────────────────────────────────
//     // NEW: Check if advance payment is paid
//     // ────────────────────────────────────────────────
//     if (
//       !booking.payment?.advance?.paid ||
//       !booking.payment?.advance?.paymentVerified
//     ) {
//       throw new Error(
//         "Advance payment must be completed and verified before locking seats",
//       );
//     }

//     // 2. Get involved vehicles
//     const vehicleIds = [
//       ...new Set(Object.values(selections).map((s) => s.vehicleId)),
//     ];

//     const vehicles = await TourVehicle.find({
//       _id: { $in: vehicleIds },
//       tourId: booking.tourId,
//     }).session(session);

//     if (vehicles.length !== vehicleIds.length) {
//       throw new Error("One or more selected vehicles not found");
//     }

//     // 3. Check if seat selection is allowed
//     const notAllowedVehicles = vehicles.filter((v) => !v.allowSeatSelection);
//     if (notAllowedVehicles.length > 0) {
//       const names = notAllowedVehicles.map((v) => v.vehicleName).join(", ");
//       throw new Error(
//         `Seat selection is not yet released for vehicle(s): ${names}`,
//       );
//     }

//     // 4. Prepare updates
//     const now = new Date();
//     const travellerUpdates = [];
//     const vehicleBookedSeatsMap = new Map();

//     for (const [idxStr, sel] of Object.entries(selections)) {
//       const travellerIndex = parseInt(idxStr, 10);

//       if (
//         isNaN(travellerIndex) ||
//         travellerIndex < 0 ||
//         travellerIndex >= booking.travellers.length
//       ) {
//         throw new Error(`Invalid traveller index: ${idxStr}`);
//       }

//       const traveller = booking.travellers[travellerIndex];

//       if (traveller.cancelled?.byAdmin || traveller.cancelled?.byTraveller) {
//         throw new Error(
//           `Cannot assign seat to cancelled traveller #${travellerIndex + 1}`,
//         );
//       }

//       if (traveller.seatNumber && traveller.seatLocked) {
//         throw new Error(
//           `Traveller #${travellerIndex + 1} already has a locked seat`,
//         );
//       }

//       const vehicle = vehicles.find((v) => v._id.toString() === sel.vehicleId);
//       const alreadyBooked = vehicle.bookedSeats.some(
//         (bs) => bs.seatNumber === sel.seatLabel,
//       );

//       if (alreadyBooked) {
//         throw new Error(
//           `Seat ${sel.seatLabel} in ${vehicle.vehicleName} is already booked`,
//         );
//       }

//       travellerUpdates.push({
//         index: travellerIndex,
//         seatNumber: sel.seatLabel,
//         seatLocked: true,
//         seatLockedAt: now,
//         vehicleId: sel.vehicleId, // from frontend selections
//         vehicleName: sel.vehicleName,
//       });

//       if (!vehicleBookedSeatsMap.has(sel.vehicleId)) {
//         vehicleBookedSeatsMap.set(sel.vehicleId, []);
//       }

//       vehicleBookedSeatsMap.get(sel.vehicleId).push({
//         seatNumber: sel.seatLabel,
//         bookingId: booking._id,
//         travellerIndex: travellerIndex,
//         lockedAt: now,
//       });
//     }

//     // 5. Apply updates to booking
//     for (const update of travellerUpdates) {
//       const t = booking.travellers[update.index];
//       t.seatNumber = update.seatNumber;
//       t.seatLocked = update.seatLocked;
//       t.seatLockedAt = update.seatLockedAt;
//       t.vehicleId = update.vehicleId;
//       t.vehicleName = update.vehicleName;
//     }

//     await booking.save({ session });

//     // 6. Update vehicles
//     for (const [vehicleId, newEntries] of vehicleBookedSeatsMap) {
//       await TourVehicle.updateOne(
//         { _id: vehicleId },
//         { $push: { bookedSeats: { $each: newEntries } } },
//         { session },
//       );
//     }

//     // 7. Commit transaction
//     await session.commitTransaction();

//     return res.status(200).json({
//       success: true,
//       message: "Seats confirmed and locked successfully",
//       data: {
//         tnr: normalizedTnr,
//         assignedCount: Object.keys(selections).length,
//         timestamp: now.toISOString(),
//       },
//     });
//   } catch (error) {
//     await session.abortTransaction();

//     const message = error.message || "Server error during seat confirmation";

//     let status = 500;
//     if (message.includes("not found")) status = 404;
//     if (
//       message.includes("Invalid") ||
//       message.includes("cancelled") ||
//       message.includes("already has")
//     )
//       status = 400;
//     if (message.includes("already booked")) status = 409;
//     if (message.includes("not yet released")) status = 403;
//     if (message.includes("Advance payment")) status = 403; // or 402 Payment Required

//     return res.status(status).json({
//       success: false,
//       message,
//     });
//   } finally {
//     session.endSession();
//   }
// };
// const getPaymentMethods = async (req, res) => {
//   try {
//     const methods = await PaymentMethod.find({})
//       .sort({ type: 1, createdAt: -1 })
//       .lean();

//     // Optional: enrich response if needed
//     const enriched = methods.map((m) => ({
//       ...m,
//       isActive: true, // you can add logic later
//       qrImage: m.qrImage || null,
//     }));

//     return res.status(200).json({
//       success: true,
//       count: enriched.length,
//       paymentMethods: enriched,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch payment methods",
//       error: error.message,
//     });
//   }
// };



// // const createEnquiry = async (req, res) => {
// //   try {
// //     const {
// //       fullName, mobileNumber, email, city,
// //       destination, tourType, preferredTravelDate, numberOfDays,
// //       adults, children, infants, specialRequests, source,
// //     } = req.body;

// //     if (!fullName || !mobileNumber || !email || !destination || !tourType || !preferredTravelDate || !numberOfDays) {
// //       return res.status(400).json({ success: false, message: "Please fill all required fields including email" });
// //     }

// //     const enquiry = await enquiryModel.create({
// //       fullName, mobileNumber, email, city,
// //       destination, tourType, preferredTravelDate, numberOfDays,
// //       adults: adults || 1,
// //       children: children || 0,
// //       infants: infants || 0,
// //       specialRequests,
// //       source,
// //       raisedBy: "user",
// //     });

// //     return res.status(201).json({
// //       success: true,
// //       message: "Enquiry submitted successfully",
// //       data: enquiry,
// //       fitCode: enquiry.fitCode,
// //     });
// //   } catch (error) {
// //     return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
// //   }
// // };


// const createEnquiry = async (req, res) => {
//   try {
//     const {
//       fullName, mobileNumber, email, city,
//       destination, tourType, preferredTravelDate, numberOfDays,
//       numberOfNights, // ← ADD
//       adults, children, infants, specialRequests, source,
//     } = req.body;

//     if (!fullName || !mobileNumber || !destination || !tourType) {
//       return res.status(400).json({ success: false, message: "Please fill all required fields including email" });
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
//       raisedBy: "user",
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Enquiry submitted successfully",
//       data: enquiry,
//       fitCode: enquiry.fitCode,
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
//   }
// };



// export {
//   registerUser,
//   loginUser,
//   getProfile,
//   updateProfile,
//   addToTrolly,
//   listTrolly,
//   cancelTraveller,
//   paymentRazorpay,
//   verifyRazorpay,
//   googleSignIn,
//   getSeatAllocationByTNR,
//   getBookingDetailsByTNR,
//   confirmSeatSelection,
//   getPaymentMethods,
//   createEnquiry,
// };


import validator from "validator";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import userModel from "../models/userModel.js";
import tourModel from "../models/tourModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import { verifyGoogleToken } from "../middlewares/googleUserAuth.js";
import razorpay from "razorpay";
import crypto from "crypto";
import tourBookingModel from "../models/tourBookingmodel.js";
import TourVehicle from "../models/tourVehicleModel.js";
import PaymentMethod from "../models/paymentModel.js";
import enquiryModel from "../models/enquiryModel.js";


// API for Google Sign-In / Sign-Up
const googleSignIn = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Google tokens is required",
      });
    }

    // Verify the Google token
    const payload = await verifyGoogleToken(idToken);

    if (!payload.email_verified) {
      return res.status(400).json({
        success: false,
        message: "Google email not verified",
      });
    }

    const { email, name, picture, sub: googleId } = payload;

    // Check if user already exists by email
    let user = await userModel.findOne({ email });

    if (!user) {
      // New user → auto register
      const randomPassword = Math.random().toString(36);
      const hashedPassword = await bcrypt.hash(randomPassword, 10); // ✅
      user = new userModel({
        name: name || "Google User",
        email,
        password: hashedPassword, // dummy password (never used)
        image: picture || "",
        googleId, // optional: store google sub for future reference
      });
      await user.save();
    } else {
      // Existing user → just log them in (optional: update name/image)
      if (!user.googleId) user.googleId = googleId;
      user.name = user.name || name;
      user.image = user.image || picture;
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({
      success: true,
      token,
      message: "Google login successful",
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Google authentication failed",
    });
  }
};
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "Email already registered" });
    }

    if (!name || !password || !email)
      return res.json({ success: false, message: "Missing details" });
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Enter a valid email please",
      });
    }
    //Validating strong password
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Enter a strong password",
      });
    }
    //Hashing user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userData = {
      name,
      email,
      password: hashedPassword,
    };
    const newUser = new userModel(userData);

    const user = await newUser.save();

    //Creating token process
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ success: true, token });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

//API fpr uder login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User does not exists" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

//API to get user profile data

const getProfile = async (req, res) => {
  try {
    const userId = req.user._id; // ✅ correct
    const useData = await userModel.findById(userId).select("-password");

    res.json({ success: true, user: useData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

//API to update USER Profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, dob, gender } = req.body;
    const imageFile = req.file;
    const userId = req.user._id;

    // Optional: more strict check
    if (!name || !phone || !gender) {
      return res.json({ success: false, message: "Required fields missing" });
    }

    const updateData = {
      name,
      phone,
      address: address ? JSON.parse(address) : undefined,
      gender,
    };

    // Only set dob if it's sent and looks valid
    if (dob && dob !== "" && dob !== "Not Selected") {
      // Optional: validate format here if you want
      updateData.dob = dob;
    }

    await userModel.findByIdAndUpdate(userId, updateData);

    // image handling remains the same
    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      await userModel.findByIdAndUpdate(userId, {
        image: imageUpload.secure_url,
      });
    }

    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
// const addToTrolly = async (req, res) => {
//   try {
//     const {
//       tourId,
//       travellers = [],
//       billingAddress,
//       bookingType,
//       contact,
//     } = req.body;
//     const userId = req.user._id;
//     const mobile = (contact?.mobile || "").trim();
//     if (!mobile) {
//       return res.status(400).json({
//         success: false,
//         message: "Mobile number is required.",
//       });
//     }

//     if (!/^[\d+\-\s()]{7,25}$/.test(mobile)) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Invalid mobile number format. Use digits, +, -, spaces or parentheses.",
//       });
//     }
//     // Validate required fields
//     if (!tourId) {
//       return res.status(400).json({
//         success: false,
//         message: "Tour ID is required.",
//       });
//     }

//     // Fetch the tour
//     const tour = await tourModel.findById(tourId);
//     if (!tour) {
//       return res.status(404).json({
//         success: false,
//         message: "Tour not found.",
//       });
//     }

//     let totalAdvance = 0;
//     let totalBalance = 0;
//     const updatedTravellers = [];

//     for (const trav of travellers) {
//       const age = Number(trav.age);

//       // --- Age-based validation check ---
//       if (isNaN(age) || age < 1 || (age >= 1 && age <= 5)) {
//         return res.status(400).json({
//           success: false,
//           message: `Booking failed: Invalid age for traveller ${trav.firstName || "Unknown"
//             }. Age must be a number greater than 5.`,
//         });
//       }

//       // --- Package Type Validation ---
//       if (
//         !trav.packageType ||
//         !["main", "variant"].includes(trav.packageType)
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid package type for traveller: ${trav.firstName || "Unknown"
//             }. Must be 'main' or 'variant'.`,
//         });
//       }

//       if (
//         trav.packageType === "variant" &&
//         (trav.variantPackageIndex === null || isNaN(trav.variantPackageIndex))
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: `Variant package index is required for traveller: ${trav.firstName || "Unknown"
//             }.`,
//         });
//       }

//       // Select package data based on traveller's packageType
//       let selectedPackage = tour;
//       if (trav.packageType === "variant") {
//         if (!tour.variantPackage[trav.variantPackageIndex]) {
//           return res.status(400).json({
//             success: false,
//             message: `Variant package at index ${trav.variantPackageIndex
//               } does not exist for traveller: ${trav.firstName || "Unknown"}.`,
//           });
//         }
//         selectedPackage = tour.variantPackage[trav.variantPackageIndex];
//       }

//       // --- Boarding Point Validation ---
//       if (!trav.boardingPoint) {
//         return res.status(400).json({
//           success: false,
//           message: `Boarding point is required for traveller: ${trav.firstName || "Unknown"
//             }`,
//         });
//       }

//       const validBoarding = selectedPackage.boardingPoints?.find(
//         (bp) => bp.stationCode === trav.boardingPoint.stationCode,
//       );

//       if (!validBoarding) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid boarding point for traveller: ${trav.firstName || "Unknown"
//             }`,
//         });
//       }

//       const selectedBoarding = {
//         stationCode: validBoarding.stationCode,
//         stationName: validBoarding.stationName,
//       };

//       // --- Deboarding Point Validation ---
//       if (!trav.deboardingPoint) {
//         return res.status(400).json({
//           success: false,
//           message: `Deboarding point is required for traveller: ${trav.firstName || "Unknown"
//             }`,
//         });
//       }

//       const validDeboarding = selectedPackage.deboardingPoints?.find(
//         (dp) => dp.stationCode === trav.deboardingPoint.stationCode,
//       );

//       if (!validDeboarding) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid deboarding point for traveller: ${trav.firstName || "Unknown"
//             }`,
//         });
//       }

//       const selectedDeboarding = {
//         stationCode: validDeboarding.stationCode,
//         stationName: validDeboarding.stationName,
//       };

//       // --- Add-on Validation ---
//       let addonPrice = 0;
//       let selectedAddonData = null;
//       if (trav.selectedAddon?.name) {
//         const validAddon = selectedPackage.addons?.find(
//           (a) => a.name === trav.selectedAddon.name,
//         );
//         if (!validAddon) {
//           return res.status(400).json({
//             success: false,
//             message: `Invalid add-on for traveller: ${trav.firstName || "Unknown"
//               }`,
//           });
//         }
//         addonPrice = Number(validAddon.amount) || 0;
//         selectedAddonData = {
//           name: validAddon.name,
//           price: validAddon.amount,
//         };
//       }

//       let travellerAdvance = 0;
//       let travellerBalance = 0;

//       // --- Age-based pricing logic ---
//       if (age >= 11) {
//         // Adult pricing (age 11 and above)
//         travellerAdvance = Number(selectedPackage.advanceAmount?.adult) || 0;
//         switch (trav.sharingType?.toLowerCase()) {
//           case "double":
//             travellerBalance = Number(selectedPackage.balanceDouble) || 0;
//             break;
//           case "triple":
//             travellerBalance = Number(selectedPackage.balanceTriple) || 0;
//             break;
//           default:
//             return res.status(400).json({
//               success: false,
//               message: `Invalid sharing type for adult traveller: ${trav.firstName || "Unknown"
//                 }`,
//             });
//         }
//       } else if (age >= 6 && age <= 10) {
//         // Child pricing (age 6 to 10)
//         travellerAdvance = Number(selectedPackage.advanceAmount?.child) || 0;
//         switch (trav.sharingType?.toLowerCase()) {
//           case "withberth":
//             travellerBalance =
//               Number(selectedPackage.balanceChildWithBerth) || 0;
//             break;
//           case "withoutberth":
//             travellerBalance =
//               Number(selectedPackage.balanceChildWithoutBerth) || 0;
//             break;
//           default:
//             return res.status(400).json({
//               success: false,
//               message: `Invalid sharing type for child traveller: ${trav.firstName || "Unknown"
//                 }`,
//             });
//         }
//       }

//       travellerAdvance += addonPrice;
//       if (isNaN(travellerAdvance) || isNaN(travellerBalance)) {
//         return res.status(400).json({
//           success: false,
//           message: `Booking failed: Could not calculate prices for traveller ${trav.firstName || "Unknown"
//             }. Please check tour prices.`,
//         });
//       }

//       totalAdvance += travellerAdvance;
//       totalBalance += travellerBalance;

//       updatedTravellers.push({
//         ...trav,
//         boardingPoint: selectedBoarding,
//         deboardingPoint: selectedDeboarding,
//         selectedAddon: selectedAddonData,
//         remarks: trav.remarks || null,
//         packageType: trav.packageType,
//         variantPackageIndex:
//           trav.packageType === "variant" ? trav.variantPackageIndex : null,
//       });
//     }

//     // ────────────────────────────────────────────────
//     //          TNR GENERATION – AA11AA format
//     // ────────────────────────────────────────────────
//     let tnr;
//     let attempts = 0;
//     const maxAttempts = 10;
//     const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
//     const digits = "0123456789";

//     while (attempts < maxAttempts) {
//       tnr =
//         letters.charAt(Math.floor(Math.random() * letters.length)) +
//         letters.charAt(Math.floor(Math.random() * letters.length)) +
//         digits.charAt(Math.floor(Math.random() * digits.length)) +
//         digits.charAt(Math.floor(Math.random() * digits.length)) +
//         letters.charAt(Math.floor(Math.random() * letters.length)) +
//         letters.charAt(Math.floor(Math.random() * letters.length));

//       const conflict = await tourBookingModel.exists({ tnr });
//       if (!conflict) {
//         break;
//       }
//       attempts++;
//     }

//     if (attempts >= maxAttempts) {
//       return res.status(503).json({
//         success: false,
//         message:
//           "Unable to generate unique booking reference right now. Please try again in a moment.",
//       });
//     }

//     // Prepare booking data for tourBookingModel
//     const bookingData = {
//       userId,
//       tourId,
//       tnr, // ← added here
//       userData: {
//         id: userId,
//       },
//       tourData: {
//         id: tour._id,
//         title: tour.title,
//         titleImage: tour.titleImage,
//         // Store main package duration and price as default
//         duration: tour.duration,
//         price: tour.price,
//       },
//       travellers: updatedTravellers,
//       billingAddress: billingAddress || {},
//       contact: {
//         email: contact?.email,
//         mobile: contact?.mobile,
//       },
//       bookingType: bookingType || "online",
//       payment: {
//         advance: {
//           amount: totalAdvance,
//         },
//         balance: {
//           amount: totalBalance,
//         },
//       },
//       status: "pending",
//       bookingDate: new Date(),
//       emergencyContact: null,
//       termsAgreed: false,
//       termsAgreedAt: null,
//     };

//     const newBooking = new tourBookingModel(bookingData);
//     await newBooking.save();

//     return res.status(201).json({
//       success: true,
//       message: "Booking added to trolley successfully.",
//       booking: newBooking,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error.",
//     });
//   }
// };

// const addToTrolly = async (req, res) => {
//   try {
//     const {
//       tourId,
//       travellers = [],
//       billingAddress,
//       bookingType,
//       contact,
//     } = req.body;

//     const userId = req.user._id;

//     // --------------------------------------------------
//     // MOBILE VALIDATION
//     // --------------------------------------------------

//     const mobile = (contact?.mobile || "").trim();

//     if (!mobile) {
//       return res.status(400).json({
//         success: false,
//         message: "Mobile number is required.",
//       });
//     }

//     if (!/^[\d+\-\s()]{7,25}$/.test(mobile)) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Invalid mobile number format. Use digits, +, -, spaces or parentheses.",
//       });
//     }

//     // --------------------------------------------------
//     // TOUR ID VALIDATION
//     // --------------------------------------------------

//     if (!tourId) {
//       return res.status(400).json({
//         success: false,
//         message: "Tour ID is required.",
//       });
//     }

//     // --------------------------------------------------
//     // FETCH TOUR
//     // --------------------------------------------------

//     const tour = await tourModel.findById(tourId);

//     if (!tour) {
//       return res.status(404).json({
//         success: false,
//         message: "Tour not found.",
//       });
//     }

//     // --------------------------------------------------
//     // TOTALS
//     // --------------------------------------------------

//     let totalAdvance = 0;
//     let totalBalance = 0;

//     // This is only for calculation/debugging.
//     // Booking payment calculation remains same.
//     let totalAddons = 0;

//     const updatedTravellers = [];

//     // ==================================================
//     // TRAVELLERS
//     // ==================================================

//     for (const trav of travellers) {
//       const age = Number(trav.age);

//       // ------------------------------------------------
//       // AGE VALIDATION
//       // ------------------------------------------------

//       if (
//         isNaN(age) ||
//         age < 1 ||
//         (age >= 1 && age <= 5)
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: `Booking failed: Invalid age for traveller ${
//             trav.firstName || "Unknown"
//           }. Age must be a number greater than 5.`,
//         });
//       }

//       // ------------------------------------------------
//       // PACKAGE TYPE
//       // ------------------------------------------------

//       if (
//         !trav.packageType ||
//         !["main", "variant"].includes(
//           trav.packageType
//         )
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid package type for traveller: ${
//             trav.firstName || "Unknown"
//           }. Must be 'main' or 'variant'.`,
//         });
//       }

//       // ------------------------------------------------
//       // VARIANT PACKAGE
//       // ------------------------------------------------

//       if (
//         trav.packageType === "variant" &&
//         (trav.variantPackageIndex === null ||
//           isNaN(trav.variantPackageIndex))
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: `Variant package index is required for traveller: ${
//             trav.firstName || "Unknown"
//           }.`,
//         });
//       }

//       // ------------------------------------------------
//       // SELECT PACKAGE
//       // ------------------------------------------------

//       let selectedPackage = tour;

//       if (trav.packageType === "variant") {
//         if (
//           !tour.variantPackage?.[
//             trav.variantPackageIndex
//           ]
//         ) {
//           return res.status(400).json({
//             success: false,
//             message: `Variant package at index ${
//               trav.variantPackageIndex
//             } does not exist for traveller: ${
//               trav.firstName || "Unknown"
//             }.`,
//           });
//         }

//         selectedPackage =
//           tour.variantPackage[
//             trav.variantPackageIndex
//           ];
//       }

//       // =================================================
//       // BOARDING POINT
//       // =================================================

//       if (!trav.boardingPoint) {
//         return res.status(400).json({
//           success: false,
//           message: `Boarding point is required for traveller: ${
//             trav.firstName || "Unknown"
//           }`,
//         });
//       }

//       const validBoarding =
//         selectedPackage.boardingPoints?.find(
//           (bp) =>
//             bp.stationCode ===
//             trav.boardingPoint.stationCode
//         );

//       if (!validBoarding) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid boarding point for traveller: ${
//             trav.firstName || "Unknown"
//           }`,
//         });
//       }

//       const selectedBoarding = {
//         stationCode: validBoarding.stationCode,
//         stationName: validBoarding.stationName,
//       };

//       // =================================================
//       // DEBOARDING POINT
//       // =================================================

//       if (!trav.deboardingPoint) {
//         return res.status(400).json({
//           success: false,
//           message: `Deboarding point is required for traveller: ${
//             trav.firstName || "Unknown"
//           }`,
//         });
//       }

//       const validDeboarding =
//         selectedPackage.deboardingPoints?.find(
//           (dp) =>
//             dp.stationCode ===
//             trav.deboardingPoint.stationCode
//         );

//       if (!validDeboarding) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid deboarding point for traveller: ${
//             trav.firstName || "Unknown"
//           }`,
//         });
//       }

//       const selectedDeboarding = {
//         stationCode:
//           validDeboarding.stationCode,
//         stationName:
//           validDeboarding.stationName,
//       };

//       // =================================================
//       // NEW TRAIN ADDONS VALIDATION
//       // =================================================

//       let addonPrice = 0;

//       const selectedAddons = Array.isArray(
//         trav.selectedAddons
//       )
//         ? trav.selectedAddons
//         : [];

//       const validatedAddons = [];

//       for (const selectedAddon of selectedAddons) {
//         const trainIndex = Number(
//           selectedAddon.trainIndex
//         );

//         // ----------------------------------------------
//         // TRAIN EXISTS?
//         // ----------------------------------------------

//         const train =
//           selectedPackage.trainDetails?.[
//             trainIndex
//           ];

//         if (!train) {
//           return res.status(400).json({
//             success: false,
//             message: `Invalid train selection for traveller: ${
//               trav.firstName || "Unknown"
//             }.`,
//           });
//         }

//         // ----------------------------------------------
//         // ADDON ID
//         // ----------------------------------------------

//         const selectedAddonId =
//           selectedAddon.addonId;

//         // ----------------------------------------------
//         // FIND VALID ADDON FROM TRAIN
//         // ----------------------------------------------

//         const validAddon =
//           train.addons?.find(
//             (addon) =>
//               String(
//                 addon._id ||
//                   addon.id
//               ) ===
//               String(selectedAddonId)
//           );

//         if (!validAddon) {
//           return res.status(400).json({
//             success: false,
//             message: `Invalid add-on "${selectedAddon.name || ""}" for traveller: ${
//               trav.firstName || "Unknown"
//             }.`,
//           });
//         }

//         const currentAddonPrice =
//           Number(validAddon.amount) || 0;

//         addonPrice += currentAddonPrice;

//         totalAddons += currentAddonPrice;

//         // ----------------------------------------------
//         // STORE ONLY VALID TRAIN/ADDON DATA
//         // ----------------------------------------------

//         validatedAddons.push({
//           trainIndex,

//           trainNo: train.trainNo,

//           trainName: train.trainName,

//           tripType: train.tripType,

//           addonId:
//             validAddon._id ||
//             validAddon.id,

//           name: validAddon.name,

//           amount: currentAddonPrice,
//         });
//       }

//       // =================================================
//       // EXISTING PRICE CALCULATION
//       // =================================================

//       let travellerAdvance = 0;
//       let travellerBalance = 0;

//       // -------------------------------------------------
//       // ADULT
//       // -------------------------------------------------

//       if (age >= 11) {
//         travellerAdvance =
//           Number(
//             selectedPackage.advanceAmount
//               ?.adult
//           ) || 0;

//         switch (
//           trav.sharingType?.toLowerCase()
//         ) {
//           case "double":
//             travellerBalance =
//               Number(
//                 selectedPackage.balanceDouble
//               ) || 0;
//             break;

//           case "triple":
//             travellerBalance =
//               Number(
//                 selectedPackage.balanceTriple
//               ) || 0;
//             break;

//           default:
//             return res.status(400).json({
//               success: false,
//               message: `Invalid sharing type for adult traveller: ${
//                 trav.firstName || "Unknown"
//               }.`,
//             });
//         }
//       }

//       // -------------------------------------------------
//       // CHILD
//       // -------------------------------------------------

//       else if (age >= 6 && age <= 10) {
//         travellerAdvance =
//           Number(
//             selectedPackage.advanceAmount
//               ?.child
//           ) || 0;

//         switch (
//           trav.sharingType?.toLowerCase()
//         ) {
//           case "withberth":
//             travellerBalance =
//               Number(
//                 selectedPackage.balanceChildWithBerth
//               ) || 0;
//             break;

//           case "withoutberth":
//             travellerBalance =
//               Number(
//                 selectedPackage.balanceChildWithoutBerth
//               ) || 0;
//             break;

//           default:
//             return res.status(400).json({
//               success: false,
//               message: `Invalid sharing type for child traveller: ${
//                 trav.firstName || "Unknown"
//               }.`,
//             });
//         }
//       }

//       // =================================================
//       // ADDONS ONLY ADDED TO ADVANCE
//       // =================================================

//       travellerAdvance += addonPrice;

//       // ------------------------------------------------
//       // NAN CHECK
//       // ------------------------------------------------

//       if (
//         isNaN(travellerAdvance) ||
//         isNaN(travellerBalance)
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: `Booking failed: Could not calculate prices for traveller ${
//             trav.firstName || "Unknown"
//           }. Please check tour prices.`,
//         });
//       }

//       // ------------------------------------------------
//       // TOTALS
//       // ------------------------------------------------

//       totalAdvance += travellerAdvance;

//       totalBalance += travellerBalance;

//       // =================================================
//       // SAVE TRAVELLER
//       // =================================================

//       updatedTravellers.push({
//         ...trav,

//         boardingPoint:
//           selectedBoarding,

//         deboardingPoint:
//           selectedDeboarding,

//         // NEW
//         selectedAddons:
//           validatedAddons,

//         remarks:
//           trav.remarks || null,

//         packageType:
//           trav.packageType,

//         variantPackageIndex:
//           trav.packageType === "variant"
//             ? trav.variantPackageIndex
//             : null,
//       });
//     }

//     // ==================================================
//     // TNR GENERATION
//     // ==================================================

//     let tnr;

//     let attempts = 0;

//     const maxAttempts = 10;

//     const letters =
//       "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

//     const digits =
//       "0123456789";

//     while (attempts < maxAttempts) {
//       tnr =
//         letters.charAt(
//           Math.floor(
//             Math.random() *
//               letters.length
//           )
//         ) +
//         letters.charAt(
//           Math.floor(
//             Math.random() *
//               letters.length
//           )
//         ) +
//         digits.charAt(
//           Math.floor(
//             Math.random() *
//               digits.length
//           )
//         ) +
//         digits.charAt(
//           Math.floor(
//             Math.random() *
//               digits.length
//           )
//         ) +
//         letters.charAt(
//           Math.floor(
//             Math.random() *
//               letters.length
//           )
//         ) +
//         letters.charAt(
//           Math.floor(
//             Math.random() *
//               letters.length
//           )
//         );

//       const conflict =
//         await tourBookingModel.exists({
//           tnr,
//         });

//       if (!conflict) {
//         break;
//       }

//       attempts++;
//     }

//     if (attempts >= maxAttempts) {
//       return res.status(503).json({
//         success: false,
//         message:
//           "Unable to generate unique booking reference right now. Please try again in a moment.",
//       });
//     }

//     // ==================================================
//     // BOOKING DATA
//     // ==================================================

//     const bookingData = {
//       userId,

//       tourId,

//       tnr,

//       userData: {
//         id: userId,
//       },

//       tourData: {
//         id: tour._id,

//         title: tour.title,

//         titleImage: tour.titleImage,

//         duration: tour.duration,

//         price: tour.price,
//       },

//       travellers:
//         updatedTravellers,

//       billingAddress:
//         billingAddress || {},

//       contact: {
//         email: contact?.email,

//         mobile: contact?.mobile,
//       },

//       bookingType:
//         bookingType || "online",

//       payment: {
//         advance: {
//           amount: totalAdvance,
//         },

//         balance: {
//           amount: totalBalance,
//         },
//       },

//       status: "pending",

//       bookingDate: new Date(),

//       emergencyContact: null,

//       termsAgreed: false,

//       termsAgreedAt: null,
//     };

//     // ==================================================
//     // SAVE
//     // ==================================================

//     const newBooking =
//       new tourBookingModel(
//         bookingData
//       );

//     await newBooking.save();

//     // ==================================================
//     // RESPONSE
//     // ==================================================

//     return res.status(201).json({
//       success: true,

//       message:
//         "Booking added to trolley successfully.",

//       booking: newBooking,

//       // Optional response data
//       addonsTotal: totalAddons,

//       advanceAmount: totalAdvance,

//       balanceAmount: totalBalance,
//     });
//   } catch (error) {
//     console.error(
//       "ADD TO TROLLY ERROR:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Internal server error.",
//     });
//   }
// };


// const addToTrolly = async (req, res) => {
//   try {
//     const {
//       tourId,
//       travellers = [],
//       billingAddress,
//       bookingType,
//       contact,
//     } = req.body;

//     const userId = req.user._id;

//     // --------------------------------------------------
//     // MOBILE VALIDATION
//     // --------------------------------------------------

//     const mobile = (contact?.mobile || "").trim();

//     if (!mobile) {
//       return res.status(400).json({
//         success: false,
//         message: "Mobile number is required.",
//       });
//     }

//     if (!/^[\d+\-\s()]{7,25}$/.test(mobile)) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Invalid mobile number format. Use digits, +, -, spaces or parentheses.",
//       });
//     }

//     // --------------------------------------------------
//     // TOUR ID VALIDATION
//     // --------------------------------------------------

//     if (!tourId) {
//       return res.status(400).json({
//         success: false,
//         message: "Tour ID is required.",
//       });
//     }

//     // --------------------------------------------------
//     // FETCH TOUR
//     // --------------------------------------------------

//     const tour = await tourModel.findById(tourId);

//     if (!tour) {
//       return res.status(404).json({
//         success: false,
//         message: "Tour not found.",
//       });
//     }

//     // --------------------------------------------------
//     // TOTALS
//     // --------------------------------------------------

//     let totalAdvance = 0;
//     let totalBalance = 0;

//     // This is only for calculation/debugging.
//     // Booking payment calculation remains same.
//     let totalAddons = 0;

//     const updatedTravellers = [];

//     // ==================================================
//     // TRAVELLERS
//     // ==================================================

//     for (const trav of travellers) {
//       const age = Number(trav.age);

//       // ------------------------------------------------
//       // AGE VALIDATION
//       // ------------------------------------------------

//       if (
//         isNaN(age) ||
//         age < 1 ||
//         (age >= 1 && age <= 5)
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: `Booking failed: Invalid age for traveller ${
//             trav.firstName || "Unknown"
//           }. Age must be a number greater than 5.`,
//         });
//       }

//       // ------------------------------------------------
//       // PACKAGE TYPE
//       // ------------------------------------------------

//       if (
//         !trav.packageType ||
//         !["main", "variant"].includes(
//           trav.packageType
//         )
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid package type for traveller: ${
//             trav.firstName || "Unknown"
//           }. Must be 'main' or 'variant'.`,
//         });
//       }

//       // ------------------------------------------------
//       // VARIANT PACKAGE
//       // ------------------------------------------------

//       if (
//         trav.packageType === "variant" &&
//         (trav.variantPackageIndex === null ||
//           isNaN(trav.variantPackageIndex))
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: `Variant package index is required for traveller: ${
//             trav.firstName || "Unknown"
//           }.`,
//         });
//       }

//       // ------------------------------------------------
//       // SELECT PACKAGE
//       // ------------------------------------------------

//       let selectedPackage = tour;

//       if (trav.packageType === "variant") {
//         if (
//           !tour.variantPackage?.[
//             trav.variantPackageIndex
//           ]
//         ) {
//           return res.status(400).json({
//             success: false,
//             message: `Variant package at index ${
//               trav.variantPackageIndex
//             } does not exist for traveller: ${
//               trav.firstName || "Unknown"
//             }.`,
//           });
//         }

//         selectedPackage =
//           tour.variantPackage[
//             trav.variantPackageIndex
//           ];
//       }

//       // =================================================
//       // BOARDING POINT
//       // =================================================

//       if (!trav.boardingPoint) {
//         return res.status(400).json({
//           success: false,
//           message: `Boarding point is required for traveller: ${
//             trav.firstName || "Unknown"
//           }`,
//         });
//       }

//       const validBoarding =
//         selectedPackage.boardingPoints?.find(
//           (bp) =>
//             bp.stationCode ===
//             trav.boardingPoint.stationCode
//         );

//       if (!validBoarding) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid boarding point for traveller: ${
//             trav.firstName || "Unknown"
//           }`,
//         });
//       }

//       const selectedBoarding = {
//         stationCode: validBoarding.stationCode,
//         stationName: validBoarding.stationName,
//       };

//       // =================================================
//       // DEBOARDING POINT
//       // =================================================

//       if (!trav.deboardingPoint) {
//         return res.status(400).json({
//           success: false,
//           message: `Deboarding point is required for traveller: ${
//             trav.firstName || "Unknown"
//           }`,
//         });
//       }

//       const validDeboarding =
//         selectedPackage.deboardingPoints?.find(
//           (dp) =>
//             dp.stationCode ===
//             trav.deboardingPoint.stationCode
//         );

//       if (!validDeboarding) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid deboarding point for traveller: ${
//             trav.firstName || "Unknown"
//           }`,
//         });
//       }

//       const selectedDeboarding = {
//         stationCode:
//           validDeboarding.stationCode,
//         stationName:
//           validDeboarding.stationName,
//       };

//       // =================================================
//       // NEW TRAIN ADDONS VALIDATION
//       // =================================================

//       let addonPrice = 0;

//       const selectedAddons = Array.isArray(
//         trav.selectedAddons
//       )
//         ? trav.selectedAddons
//         : [];

//       const validatedAddons = [];

//       for (const selectedAddon of selectedAddons) {
//         const selectedAddonId =
//           selectedAddon.addonId;

//         // ----------------------------------------------
//         // ADDON IS OPTIONAL PER TRAIN/TRIP LEG
//         // ----------------------------------------------
//         // Customer may leave a leg as "No Add-on" — that entry arrives
//         // with no addonId (null/undefined/empty string). This is NOT
//         // an error, just skip it and move to the next leg. Only entries
//         // where the customer actually picked an addon get validated.
//         if (
//           selectedAddonId === null ||
//           selectedAddonId === undefined ||
//           selectedAddonId === ""
//         ) {
//           continue;
//         }

//         const trainIndex = Number(
//           selectedAddon.trainIndex
//         );

//         // ----------------------------------------------
//         // TRAIN EXISTS?
//         // ----------------------------------------------

//         const train =
//           selectedPackage.trainDetails?.[
//             trainIndex
//           ];

//         if (!train) {
//           return res.status(400).json({
//             success: false,
//             message: `Invalid train selection for traveller: ${
//               trav.firstName || "Unknown"
//             }.`,
//           });
//         }

//         // ----------------------------------------------
//         // FIND VALID ADDON FROM TRAIN
//         // ----------------------------------------------

//         const validAddon =
//           train.addons?.find(
//             (addon) =>
//               String(
//                 addon._id ||
//                   addon.id
//               ) ===
//               String(selectedAddonId)
//           );

//         if (!validAddon) {
//           return res.status(400).json({
//             success: false,
//             message: `Invalid add-on "${selectedAddon.name || ""}" for traveller: ${
//               trav.firstName || "Unknown"
//             }.`,
//           });
//         }

//         const currentAddonPrice =
//           Number(validAddon.amount) || 0;

//         addonPrice += currentAddonPrice;

//         totalAddons += currentAddonPrice;

//         // ----------------------------------------------
//         // STORE ONLY VALID TRAIN/ADDON DATA
//         // ----------------------------------------------

//         validatedAddons.push({
//           trainIndex,

//           trainNo: train.trainNo,

//           trainName: train.trainName,

//           tripType: train.tripType,

//           addonId:
//             validAddon._id ||
//             validAddon.id,

//           name: validAddon.name,

//           amount: currentAddonPrice,
//         });
//       }

//       // =================================================
//       // EXISTING PRICE CALCULATION
//       // =================================================

//       let travellerAdvance = 0;
//       let travellerBalance = 0;

//       // -------------------------------------------------
//       // ADULT
//       // -------------------------------------------------

//       if (age >= 11) {
//         travellerAdvance =
//           Number(
//             selectedPackage.advanceAmount
//               ?.adult
//           ) || 0;

//         switch (
//           trav.sharingType?.toLowerCase()
//         ) {
//           case "double":
//             travellerBalance =
//               Number(
//                 selectedPackage.balanceDouble
//               ) || 0;
//             break;

//           case "triple":
//             travellerBalance =
//               Number(
//                 selectedPackage.balanceTriple
//               ) || 0;
//             break;

//           default:
//             return res.status(400).json({
//               success: false,
//               message: `Invalid sharing type for adult traveller: ${
//                 trav.firstName || "Unknown"
//               }.`,
//             });
//         }
//       }

//       // -------------------------------------------------
//       // CHILD
//       // -------------------------------------------------

//       else if (age >= 6 && age <= 10) {
//         travellerAdvance =
//           Number(
//             selectedPackage.advanceAmount
//               ?.child
//           ) || 0;

//         switch (
//           trav.sharingType?.toLowerCase()
//         ) {
//           case "withberth":
//             travellerBalance =
//               Number(
//                 selectedPackage.balanceChildWithBerth
//               ) || 0;
//             break;

//           case "withoutberth":
//             travellerBalance =
//               Number(
//                 selectedPackage.balanceChildWithoutBerth
//               ) || 0;
//             break;

//           default:
//             return res.status(400).json({
//               success: false,
//               message: `Invalid sharing type for child traveller: ${
//                 trav.firstName || "Unknown"
//               }.`,
//             });
//         }
//       }

//       // =================================================
//       // ADDONS ONLY ADDED TO ADVANCE
//       // =================================================

//       travellerAdvance += addonPrice;

//       // ------------------------------------------------
//       // NAN CHECK
//       // ------------------------------------------------

//       if (
//         isNaN(travellerAdvance) ||
//         isNaN(travellerBalance)
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: `Booking failed: Could not calculate prices for traveller ${
//             trav.firstName || "Unknown"
//           }. Please check tour prices.`,
//         });
//       }

//       // ------------------------------------------------
//       // TOTALS
//       // ------------------------------------------------

//       totalAdvance += travellerAdvance;

//       totalBalance += travellerBalance;

//       // =================================================
//       // SAVE TRAVELLER
//       // =================================================

//       updatedTravellers.push({
//         ...trav,

//         boardingPoint:
//           selectedBoarding,

//         deboardingPoint:
//           selectedDeboarding,

//         // NEW
//         selectedAddons:
//           validatedAddons,

//         remarks:
//           trav.remarks || null,

//         packageType:
//           trav.packageType,

//         variantPackageIndex:
//           trav.packageType === "variant"
//             ? trav.variantPackageIndex
//             : null,
//       });
//     }

//     // ==================================================
//     // TNR GENERATION
//     // ==================================================

//     let tnr;

//     let attempts = 0;

//     const maxAttempts = 10;

//     const letters =
//       "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

//     const digits =
//       "0123456789";

//     while (attempts < maxAttempts) {
//       tnr =
//         letters.charAt(
//           Math.floor(
//             Math.random() *
//               letters.length
//           )
//         ) +
//         letters.charAt(
//           Math.floor(
//             Math.random() *
//               letters.length
//           )
//         ) +
//         digits.charAt(
//           Math.floor(
//             Math.random() *
//               digits.length
//           )
//         ) +
//         digits.charAt(
//           Math.floor(
//             Math.random() *
//               digits.length
//           )
//         ) +
//         letters.charAt(
//           Math.floor(
//             Math.random() *
//               letters.length
//           )
//         ) +
//         letters.charAt(
//           Math.floor(
//             Math.random() *
//               letters.length
//           )
//         );

//       const conflict =
//         await tourBookingModel.exists({
//           tnr,
//         });

//       if (!conflict) {
//         break;
//       }

//       attempts++;
//     }

//     if (attempts >= maxAttempts) {
//       return res.status(503).json({
//         success: false,
//         message:
//           "Unable to generate unique booking reference right now. Please try again in a moment.",
//       });
//     }

//     // ==================================================
//     // BOOKING DATA
//     // ==================================================

//     const bookingData = {
//       userId,

//       tourId,

//       tnr,

//       userData: {
//         id: userId,
//       },

//       tourData: {
//         id: tour._id,

//         title: tour.title,

//         titleImage: tour.titleImage,

//         duration: tour.duration,

//         price: tour.price,
//       },

//       travellers:
//         updatedTravellers,

//       billingAddress:
//         billingAddress || {},

//       contact: {
//         email: contact?.email,

//         mobile: contact?.mobile,
//       },

//       bookingType:
//         bookingType || "online",

//       payment: {
//         advance: {
//           amount: totalAdvance,
//         },

//         balance: {
//           amount: totalBalance,
//         },
//       },

//       status: "pending",

//       bookingDate: new Date(),

//       emergencyContact: null,

//       termsAgreed: false,

//       termsAgreedAt: null,
//     };

//     // ==================================================
//     // SAVE
//     // ==================================================

//     const newBooking =
//       new tourBookingModel(
//         bookingData
//       );

//     await newBooking.save();

//     // ==================================================
//     // RESPONSE
//     // ==================================================

//     return res.status(201).json({
//       success: true,

//       message:
//         "Booking added to trolley successfully.",

//       booking: newBooking,

//       // Optional response data
//       addonsTotal: totalAddons,

//       advanceAmount: totalAdvance,

//       balanceAmount: totalBalance,
//     });
//   } catch (error) {
//     console.error(
//       "ADD TO TROLLY ERROR:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Internal server error.",
//     });
//   }
// };


const addToTrolly = async (req, res) => {
  try {
    const {
      tourId,
      travellers = [],
      billingAddress,
      bookingType,
      contact,
    } = req.body;

    const userId = req.user._id;

    // --------------------------------------------------
    // MOBILE VALIDATION
    // --------------------------------------------------

    const mobile = (contact?.mobile || "").trim();

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required.",
      });
    }

    if (!/^[\d+\-\s()]{7,25}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid mobile number format. Use digits, +, -, spaces or parentheses.",
      });
    }

    // --------------------------------------------------
    // TOUR ID VALIDATION
    // --------------------------------------------------

    if (!tourId) {
      return res.status(400).json({
        success: false,
        message: "Tour ID is required.",
      });
    }

    // --------------------------------------------------
    // FETCH TOUR
    // --------------------------------------------------

    const tour = await tourModel.findById(tourId);

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour not found.",
      });
    }

    // --------------------------------------------------
    // TOTALS
    // --------------------------------------------------

    let totalAdvance = 0;
    let totalBalance = 0;

    // This is only for calculation/debugging.
    // Booking payment calculation remains same.
    let totalAddons = 0;

    const updatedTravellers = [];

    // ==================================================
    // TRAVELLERS
    // ==================================================

    for (const trav of travellers) {
      const age = Number(trav.age);

      // ------------------------------------------------
      // AGE VALIDATION
      // ------------------------------------------------

      if (
        isNaN(age) ||
        age < 1 ||
        (age >= 1 && age <= 5)
      ) {
        return res.status(400).json({
          success: false,
          message: `Booking failed: Invalid age for traveller ${
            trav.firstName || "Unknown"
          }. Age must be a number greater than 5.`,
        });
      }

      // ------------------------------------------------
      // PACKAGE TYPE
      // ------------------------------------------------

      if (
        !trav.packageType ||
        !["main", "variant"].includes(
          trav.packageType
        )
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid package type for traveller: ${
            trav.firstName || "Unknown"
          }. Must be 'main' or 'variant'.`,
        });
      }

      // ------------------------------------------------
      // VARIANT PACKAGE
      // ------------------------------------------------

      if (
        trav.packageType === "variant" &&
        (trav.variantPackageIndex === null ||
          isNaN(trav.variantPackageIndex))
      ) {
        return res.status(400).json({
          success: false,
          message: `Variant package index is required for traveller: ${
            trav.firstName || "Unknown"
          }.`,
        });
      }

      // ------------------------------------------------
      // SELECT PACKAGE
      // ------------------------------------------------

      let selectedPackage = tour;

      if (trav.packageType === "variant") {
        if (
          !tour.variantPackage?.[
            trav.variantPackageIndex
          ]
        ) {
          return res.status(400).json({
            success: false,
            message: `Variant package at index ${
              trav.variantPackageIndex
            } does not exist for traveller: ${
              trav.firstName || "Unknown"
            }.`,
          });
        }

        selectedPackage =
          tour.variantPackage[
            trav.variantPackageIndex
          ];
      }

      // =================================================
      // BOARDING POINT
      // =================================================

      if (!trav.boardingPoint) {
        return res.status(400).json({
          success: false,
          message: `Boarding point is required for traveller: ${
            trav.firstName || "Unknown"
          }`,
        });
      }

      const validBoarding =
        selectedPackage.boardingPoints?.find(
          (bp) =>
            bp.stationCode ===
            trav.boardingPoint.stationCode
        );

      if (!validBoarding) {
        return res.status(400).json({
          success: false,
          message: `Invalid boarding point for traveller: ${
            trav.firstName || "Unknown"
          }`,
        });
      }

      const selectedBoarding = {
        stationCode: validBoarding.stationCode,
        stationName: validBoarding.stationName,
      };

      // =================================================
      // DEBOARDING POINT
      // =================================================

      if (!trav.deboardingPoint) {
        return res.status(400).json({
          success: false,
          message: `Deboarding point is required for traveller: ${
            trav.firstName || "Unknown"
          }`,
        });
      }

      const validDeboarding =
        selectedPackage.deboardingPoints?.find(
          (dp) =>
            dp.stationCode ===
            trav.deboardingPoint.stationCode
        );

      if (!validDeboarding) {
        return res.status(400).json({
          success: false,
          message: `Invalid deboarding point for traveller: ${
            trav.firstName || "Unknown"
          }`,
        });
      }

      const selectedDeboarding = {
        stationCode:
          validDeboarding.stationCode,
        stationName:
          validDeboarding.stationName,
      };

      // =================================================
      // NEW TRAIN ADDONS VALIDATION
      // =================================================

      let addonPrice = 0;

      const selectedAddons = Array.isArray(
        trav.selectedAddons
      )
        ? trav.selectedAddons
        : [];

      const validatedAddons = [];

      for (const selectedAddon of selectedAddons) {
        const selectedAddonId =
          selectedAddon.addonId;

        // ----------------------------------------------
        // ADDON IS OPTIONAL PER TRAIN/TRIP LEG
        // ----------------------------------------------
        // Customer may leave a leg as "No Add-on" — that entry arrives
        // with no addonId (null/undefined/empty string). This is NOT
        // an error, just skip it and move to the next leg. Only entries
        // where the customer actually picked an addon get validated.
        if (
          selectedAddonId === null ||
          selectedAddonId === undefined ||
          selectedAddonId === ""
        ) {
          continue;
        }

        // ----------------------------------------------
        // DECIDE TRAIN vs FLIGHT ENTRY
        // ----------------------------------------------
        // Frontend now sends BOTH kinds in the same selectedAddons[]
        // array: train-keyed entries carry `trainIndex`, flight-keyed
        // entries carry `flightIndex`. Whichever one is present (and
        // not null/undefined) tells us which list to validate against.
        // NOTE: flat (single, non-trip) addons are NOT in this array —
        // they arrive separately as an object on trav.selectedAddon,
        // handled further down after this loop.
        const isFlightAddon =
          selectedAddon.flightIndex !== undefined &&
          selectedAddon.flightIndex !== null;

        let trip;
        let tripLabel;

        if (isFlightAddon) {
          const flightIndex = Number(
            selectedAddon.flightIndex
          );

          trip =
            selectedPackage.flightDetails?.[
              flightIndex
            ];
          tripLabel = "flight";

          if (!trip) {
            // Invalid/stale flight-addon reference (e.g. this tour has
            // no flightDetails configured at all, or the referenced leg
            // no longer exists). Previously this hard-rejected the
            // WHOLE booking — now we just skip this one addon entry
            // (contributes nothing) and let the booking proceed.
            continue;
          }
        } else {
          const trainIndex = Number(
            selectedAddon.trainIndex
          );

          // ----------------------------------------------
          // TRAIN EXISTS?
          // ----------------------------------------------

          trip =
            selectedPackage.trainDetails?.[
              trainIndex
            ];
          tripLabel = "train";

          if (!trip) {
            // Invalid/stale train-addon reference (e.g. this tour has
            // no trainDetails configured at all, or the referenced leg
            // no longer exists). Previously this hard-rejected the
            // WHOLE booking — now we just skip this one addon entry
            // (contributes nothing) and let the booking proceed.
            continue;
          }
        }

        // ----------------------------------------------
        // FIND VALID ADDON FROM TRAIN/FLIGHT
        // ----------------------------------------------

        const validAddon =
          trip.addons?.find(
            (addon) =>
              String(
                addon._id ||
                  addon.id
              ) ===
              String(selectedAddonId)
          );

        if (!validAddon) {
          // The addonId doesn't match any addon actually configured on
          // this trip (stale/removed addon). Skip this one entry rather
          // than blocking the whole booking.
          continue;
        }

        const currentAddonPrice =
          Number(validAddon.amount) || 0;

        addonPrice += currentAddonPrice;

        totalAddons += currentAddonPrice;

        // ----------------------------------------------
        // STORE ONLY VALID TRAIN/FLIGHT ADDON DATA
        // ----------------------------------------------

        if (isFlightAddon) {
          validatedAddons.push({
            flightIndex: Number(selectedAddon.flightIndex),

            flightNo: trip.flightNo,

            airline: trip.airline,

            tripType: trip.tripType,

            addonId:
              validAddon._id ||
              validAddon.id,

            name: validAddon.name,

            amount: currentAddonPrice,
          });
        } else {
          validatedAddons.push({
            trainIndex: Number(selectedAddon.trainIndex),

            trainNo: trip.trainNo,

            trainName: trip.trainName,

            tripType: trip.tripType,

            addonId:
              validAddon._id ||
              validAddon.id,

            name: validAddon.name,

            amount: currentAddonPrice,
          });
        }
      }

      // =================================================
      // FLAT ADDON VALIDATION (old-style single addon —
      // used for tours that have NO trip-wise train/flight
      // addon config, or where the traveller already had a
      // flat addon saved before trip-wise addons existed).
      // This was previously never validated or priced here
      // at all — trav.selectedAddon just passed through raw
      // via the `...trav` spread below with no price added
      // to the traveller's total, and no server-side check
      // against the package's real addon list/price.
      // =================================================

      let validatedFlatAddon = null;

      if (
        trav.selectedAddon &&
        typeof trav.selectedAddon === "object" &&
        trav.selectedAddon.name &&
        String(trav.selectedAddon.name).trim() !== ""
      ) {
        const matchedFlatAddon = (
          selectedPackage.addons || []
        ).find(
          (a) => a.name === trav.selectedAddon.name,
        );

        if (matchedFlatAddon) {
          const flatAddonAmount =
            Number(matchedFlatAddon.amount) || 0;

          validatedFlatAddon = {
            name: matchedFlatAddon.name,
            price: flatAddonAmount,
          };

          addonPrice += flatAddonAmount;
          totalAddons += flatAddonAmount;
        }
        // If the name doesn't match any addon currently configured on
        // the package (stale/removed addon), skip it — same
        // non-fatal-skip principle as the trip-wise addons above,
        // rather than rejecting the whole booking.
      }

      // =================================================
      // EXISTING PRICE CALCULATION
      // =================================================

      let travellerAdvance = 0;
      let travellerBalance = 0;

      // -------------------------------------------------
      // ADULT
      // -------------------------------------------------

      if (age >= 11) {
        travellerAdvance =
          Number(
            selectedPackage.advanceAmount
              ?.adult
          ) || 0;

        switch (
          trav.sharingType?.toLowerCase()
        ) {
          case "double":
            travellerBalance =
              Number(
                selectedPackage.balanceDouble
              ) || 0;
            break;

          case "triple":
            travellerBalance =
              Number(
                selectedPackage.balanceTriple
              ) || 0;
            break;

          default:
            return res.status(400).json({
              success: false,
              message: `Invalid sharing type for adult traveller: ${
                trav.firstName || "Unknown"
              }.`,
            });
        }
      }

      // -------------------------------------------------
      // CHILD
      // -------------------------------------------------

      else if (age >= 6 && age <= 10) {
        travellerAdvance =
          Number(
            selectedPackage.advanceAmount
              ?.child
          ) || 0;

        switch (
          trav.sharingType?.toLowerCase()
        ) {
          case "withberth":
            travellerBalance =
              Number(
                selectedPackage.balanceChildWithBerth
              ) || 0;
            break;

          case "withoutberth":
            travellerBalance =
              Number(
                selectedPackage.balanceChildWithoutBerth
              ) || 0;
            break;

          default:
            return res.status(400).json({
              success: false,
              message: `Invalid sharing type for child traveller: ${
                trav.firstName || "Unknown"
              }.`,
            });
        }
      }

      // =================================================
      // ADDONS ONLY ADDED TO ADVANCE
      // =================================================

      travellerAdvance += addonPrice;

      // ------------------------------------------------
      // NAN CHECK
      // ------------------------------------------------

      if (
        isNaN(travellerAdvance) ||
        isNaN(travellerBalance)
      ) {
        return res.status(400).json({
          success: false,
          message: `Booking failed: Could not calculate prices for traveller ${
            trav.firstName || "Unknown"
          }. Please check tour prices.`,
        });
      }

      // ------------------------------------------------
      // TOTALS
      // ------------------------------------------------

      totalAdvance += travellerAdvance;

      totalBalance += travellerBalance;

      // =================================================
      // SAVE TRAVELLER
      // =================================================

      updatedTravellers.push({
        ...trav,

        boardingPoint:
          selectedBoarding,

        deboardingPoint:
          selectedDeboarding,

        // NEW
        selectedAddons:
          validatedAddons,

        // Server-validated flat addon (name + price re-derived from
        // selectedPackage.addons, not trusted from the client) — null
        // if the traveller didn't pick one, or it didn't match a real
        // addon on this package.
        selectedAddon: validatedFlatAddon,

        remarks:
          trav.remarks || null,

        packageType:
          trav.packageType,

        variantPackageIndex:
          trav.packageType === "variant"
            ? trav.variantPackageIndex
            : null,
      });
    }

    // ==================================================
    // TNR GENERATION
    // ==================================================

    let tnr;

    let attempts = 0;

    const maxAttempts = 10;

    const letters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    const digits =
      "0123456789";

    while (attempts < maxAttempts) {
      tnr =
        letters.charAt(
          Math.floor(
            Math.random() *
              letters.length
          )
        ) +
        letters.charAt(
          Math.floor(
            Math.random() *
              letters.length
          )
        ) +
        digits.charAt(
          Math.floor(
            Math.random() *
              digits.length
          )
        ) +
        digits.charAt(
          Math.floor(
            Math.random() *
              digits.length
          )
        ) +
        letters.charAt(
          Math.floor(
            Math.random() *
              letters.length
          )
        ) +
        letters.charAt(
          Math.floor(
            Math.random() *
              letters.length
          )
        );

      const conflict =
        await tourBookingModel.exists({
          tnr,
        });

      if (!conflict) {
        break;
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      return res.status(503).json({
        success: false,
        message:
          "Unable to generate unique booking reference right now. Please try again in a moment.",
      });
    }

    // ==================================================
    // BOOKING DATA
    // ==================================================

    const bookingData = {
      userId,

      tourId,

      tnr,

      userData: {
        id: userId,
      },

      tourData: {
        id: tour._id,

        title: tour.title,

        titleImage: tour.titleImage,

        duration: tour.duration,

        price: tour.price,
      },

      travellers:
        updatedTravellers,

      billingAddress:
        billingAddress || {},

      contact: {
        email: contact?.email,

        mobile: contact?.mobile,
      },

      bookingType:
        bookingType || "online",

      payment: {
        advance: {
          amount: totalAdvance,
        },

        balance: {
          amount: totalBalance,
        },
      },

      status: "pending",

      bookingDate: new Date(),

      emergencyContact: null,

      termsAgreed: false,

      termsAgreedAt: null,
    };

    // ==================================================
    // SAVE
    // ==================================================

    const newBooking =
      new tourBookingModel(
        bookingData
      );

    await newBooking.save();

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(201).json({
      success: true,

      message:
        "Booking added to trolley successfully.",

      booking: newBooking,

      // Optional response data
      addonsTotal: totalAddons,

      advanceAmount: totalAdvance,

      balanceAmount: totalBalance,
    });
  } catch (error) {
    console.error(
      "ADD TO TROLLY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error.",
    });
  }
};


// Get all tour bookings for a user
const listTrolly = async (req, res) => {
  try {
    const userId = req.user;

    const bookings = await tourBookingModel
      .find({ userId })
      .populate(
        "tourId",
        "title duration titleImage advanceAmount doubleSharing tripleSharing",
      );

    res.json({ success: true, bookings });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

("use strict");
const cancelTraveller = async (req, res) => {
  try {
    const { tnr, travellerId } = req.body;
    const userId = req.user?._id;

    // Validate request body
    if (!tnr || !travellerId) {
      return res.status(400).json({
        success: false,
        message: "tnr and travellerId are required",
      });
    }

    // Fetch the booking by tnr
    const bookingData = await tourBookingModel.findOne({
      tnr: tnr.trim().toUpperCase(),
    });
    if (!bookingData) {
      return res.status(404).json({
        success: false,
        message: "Booking not found with this TNR",
      });
    }

    // Ensure the booking belongs to the logged-in user
    if (bookingData.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized action – this booking does not belong to you",
      });
    }

    // Check if advance payment is completed
    const advancePaid =
      bookingData.payment?.advance?.paid &&
      bookingData.payment?.advance?.paymentVerified;

    if (!advancePaid) {
      return res.status(400).json({
        success: false,
        message: "Advance payment not completed, cancellation cannot proceed.",
      });
    }

    // Find the traveller
    const travellerIndex = bookingData.travellers.findIndex(
      (traveller) => traveller._id.toString() === String(travellerId),
    );

    if (travellerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Traveller not found in this booking",
      });
    }

    const traveller = bookingData.travellers[travellerIndex];

    // Check if already cancelled
    if (traveller.cancelled?.byTraveller) {
      return res.status(400).json({
        success: false,
        message: "Traveller has already been cancelled",
      });
    }

    // Update cancellation flags
    traveller.cancelled = {
      ...traveller.cancelled,
      byTraveller: true,
      cancelledAt: new Date(),
    };

    await bookingData.save();

    return res.status(200).json({
      success: true,
      message: `Cancellation requested for traveller: ${traveller.firstName} ${traveller.lastName}`,
      tnr: bookingData.tnr,
      travellerId: traveller._id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    });
  }
};

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// // ===============================
// // CREATE PAYMENT ORDER
// // ===============================
const paymentRazorpay = async (req, res) => {
  try {
    const { tnr, paymentType } = req.body; // ← changed

    if (!tnr) {
      return res.json({ success: false, message: "TNR is required" });
    }

    // Find by tnr field (assuming tnr is a unique string field)
    const booking = await tourBookingModel.findOne({ tnr });

    if (!booking) {
      return res.json({
        success: false,
        message: "Booking not found",
      });
    }

    if (
      booking.cancelled?.byAdmin ||
      booking.cancelled?.byTraveller ||
      booking.isBookingCancelled // ← add if you have this flag
    ) {
      return res.json({
        success: false,
        message: "Booking cancelled or not found",
      });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.json({
        success: false,
        message: "Unauthorized action",
      });
    }

    let amountToPay = 0;
    let paymentKey = "";

    if (paymentType === "advance") {
      if (booking.payment?.advance?.paid) {
        return res.json({ success: false, message: "Advance already paid" });
      }
      amountToPay = booking.payment.advance.amount;
      paymentKey = "advance";
    } else if (paymentType === "balance") {
      if (!booking.payment?.advance?.paid) {
        return res.json({ success: false, message: "Pay advance first" });
      }
      if (booking.payment?.balance?.paid) {
        return res.json({ success: false, message: "Balance already paid" });
      }
      amountToPay = booking.payment.balance.amount;
      paymentKey = "balance";
    } else {
      return res.json({ success: false, message: "Invalid payment type" });
    }

    // Razorpay order
    const options = {
      amount: Math.round(amountToPay * 100), // paise, avoid floating point issues
      currency: process.env.CURRENCY || "INR",
      receipt: `${tnr}_${paymentKey}`, // ← better to use tnr here too
    };

    const order = await razorpayInstance.orders.create(options);

    return res.json({
      success: true,
      order,
      // Optional: send these back if frontend needs them
      amountToPay,
      paymentType: paymentKey,
      tnr,
    });
  } catch (error) {
    return res.json({
      success: false,
      message: error.message || "Payment initiation failed",
    });
  }
};

const verifyRazorpay = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      tnr,
      paymentType,
    } = req.body;

    // You can send tnr & paymentType from frontend in verify call (safer)

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.json({ success: false, message: "Invalid signature" });
    }

    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);
    if (!orderInfo || orderInfo.status !== "paid") {
      return res.json({ success: false, message: "Payment not completed" });
    }

    // Prefer using tnr from body (more secure than parsing receipt)
    let booking;

    if (tnr) {
      booking = await tourBookingModel.findOne({ tnr });
    } else {
      // fallback – only if you didn't send tnr
      const [receiptTnr, receiptType] = orderInfo.receipt.split("_");
      booking = await tourBookingModel.findOne({ tnr: receiptTnr });
    }

    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    // Update
    await tourBookingModel.findOneAndUpdate(
      { tnr: booking.tnr },
      {
        $set: {
          [`payment.${paymentType}.paid`]: true,
          [`payment.${paymentType}.paidAt`]: new Date(),
          [`payment.${paymentType}.transactionId`]: razorpay_payment_id,
          [`payment.${paymentType}.razorpayOrderId`]: razorpay_order_id,
          [`payment.${paymentType}.status`]: "paid",
          [`payment.${paymentType}.paymentVerified`]: true,
        },
      },
    );

    return res.json({
      success: true,
      message: "Payment verified successfully.",
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
const getSeatAllocationByTNR = async (req, res) => {
  try {
    const { tnr } = req.params; // or req.query.tnr

    if (!tnr || tnr.length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 6-digit TNR",
      });
    }

    // Step 1: Find booking by TNR
    const booking = await tourBookingModel
      .findOne({ tnr: tnr.toUpperCase() })
      .select("tourId tnr userData bookingDate")
      .lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "No booking found with this TNR",
      });
    }

    // Step 2: Find all vehicles for this tour
    const vehicles = await TourVehicle.find({ tourId: booking.tourId })
      .select(
        "vehicleName registrationNumber leaderRow passengerRows totalSeats seatsPerRow passengerRowCount allowSeatSelection bookedSeats",
      )
      .lean();

    if (vehicles.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No vehicles assigned to this tour yet",
        booking: {
          tnr: booking.tnr,
          tourId: booking.tourId,
        },
        vehicles: [],
      });
    }

    // Optional: enrich with more readable seat status
    const enrichedVehicles = vehicles.map((vehicle) => {
      const bookedSet = new Set(vehicle.bookedSeats.map((b) => b.seatNumber));

      return {
        ...vehicle,
        bookedSeatSet: Array.from(bookedSet), // for frontend highlighting
        totalBooked: vehicle.bookedSeats.length,
      };
    });

    return res.status(200).json({
      success: true,
      booking: {
        tnr: booking.tnr,
        tourId: booking.tourId,
      },
      vehicles: enrichedVehicles,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error while fetching seat allocation",
      error: err.message,
    });
  }
};
const getBookingDetailsByTNR = async (req, res) => {
  try {
    const { tnr } = req.params;

    // Basic input validation
    if (!tnr || tnr.trim().length !== 6 || !/^[A-Z0-9]{6}$/i.test(tnr)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 6-digit TNR (alphanumeric)",
      });
    }

    // Find booking - lean() for performance (no Mongoose document overhead)
    const booking = await tourBookingModel
      .findOne({ tnr: tnr.toUpperCase() })
      .populate("userId", "name email mobile") // optional: populate basic user info
      .populate("tourId", "tourName startDate endDate duration") // optional: populate tour basics
      .lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking found with TNR: ${tnr.toUpperCase()}`,
      });
    }

    // Success response - full document returned
    return res.status(200).json({
      success: true,
      message: "Booking details retrieved successfully",
      booking: {
        ...booking,
        // Ensure TNR is always uppercase in response
        tnr: booking.tnr?.toUpperCase(),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while fetching booking details",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
const confirmSeatSelection = async (req, res) => {
  const { tnr } = req.params;
  const { selections } = req.body;

  // Basic input validation
  if (!selections || Object.keys(selections).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No seats selected to confirm",
    });
  }

  if (!tnr || typeof tnr !== "string" || tnr.trim().length < 6) {
    return res.status(400).json({
      success: false,
      message: "Invalid TNR format",
    });
  }

  const normalizedTnr = tnr.trim().toUpperCase();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Find the booking
    const booking = await tourBookingModel
      .findOne({ tnr: normalizedTnr })
      .session(session);

    if (!booking) {
      throw new Error("Booking not found with this TNR");
    }

    // ────────────────────────────────────────────────
    // NEW: Check if advance payment is paid
    // ────────────────────────────────────────────────
    if (
      !booking.payment?.advance?.paid ||
      !booking.payment?.advance?.paymentVerified
    ) {
      throw new Error(
        "Advance payment must be completed and verified before locking seats",
      );
    }

    // 2. Get involved vehicles
    const vehicleIds = [
      ...new Set(Object.values(selections).map((s) => s.vehicleId)),
    ];

    const vehicles = await TourVehicle.find({
      _id: { $in: vehicleIds },
      tourId: booking.tourId,
    }).session(session);

    if (vehicles.length !== vehicleIds.length) {
      throw new Error("One or more selected vehicles not found");
    }

    // 3. Check if seat selection is allowed
    const notAllowedVehicles = vehicles.filter((v) => !v.allowSeatSelection);
    if (notAllowedVehicles.length > 0) {
      const names = notAllowedVehicles.map((v) => v.vehicleName).join(", ");
      throw new Error(
        `Seat selection is not yet released for vehicle(s): ${names}`,
      );
    }

    // 4. Prepare updates
    const now = new Date();
    const travellerUpdates = [];
    const vehicleBookedSeatsMap = new Map();

    for (const [idxStr, sel] of Object.entries(selections)) {
      const travellerIndex = parseInt(idxStr, 10);

      if (
        isNaN(travellerIndex) ||
        travellerIndex < 0 ||
        travellerIndex >= booking.travellers.length
      ) {
        throw new Error(`Invalid traveller index: ${idxStr}`);
      }

      const traveller = booking.travellers[travellerIndex];

      if (traveller.cancelled?.byAdmin || traveller.cancelled?.byTraveller) {
        throw new Error(
          `Cannot assign seat to cancelled traveller #${travellerIndex + 1}`,
        );
      }

      if (traveller.seatNumber && traveller.seatLocked) {
        throw new Error(
          `Traveller #${travellerIndex + 1} already has a locked seat`,
        );
      }

      const vehicle = vehicles.find((v) => v._id.toString() === sel.vehicleId);
      const alreadyBooked = vehicle.bookedSeats.some(
        (bs) => bs.seatNumber === sel.seatLabel,
      );

      if (alreadyBooked) {
        throw new Error(
          `Seat ${sel.seatLabel} in ${vehicle.vehicleName} is already booked`,
        );
      }

      travellerUpdates.push({
        index: travellerIndex,
        seatNumber: sel.seatLabel,
        seatLocked: true,
        seatLockedAt: now,
        vehicleId: sel.vehicleId, // from frontend selections
        vehicleName: sel.vehicleName,
      });

      if (!vehicleBookedSeatsMap.has(sel.vehicleId)) {
        vehicleBookedSeatsMap.set(sel.vehicleId, []);
      }

      vehicleBookedSeatsMap.get(sel.vehicleId).push({
        seatNumber: sel.seatLabel,
        bookingId: booking._id,
        travellerIndex: travellerIndex,
        lockedAt: now,
      });
    }

    // 5. Apply updates to booking
    for (const update of travellerUpdates) {
      const t = booking.travellers[update.index];
      t.seatNumber = update.seatNumber;
      t.seatLocked = update.seatLocked;
      t.seatLockedAt = update.seatLockedAt;
      t.vehicleId = update.vehicleId;
      t.vehicleName = update.vehicleName;
    }

    await booking.save({ session });

    // 6. Update vehicles
    for (const [vehicleId, newEntries] of vehicleBookedSeatsMap) {
      await TourVehicle.updateOne(
        { _id: vehicleId },
        { $push: { bookedSeats: { $each: newEntries } } },
        { session },
      );
    }

    // 7. Commit transaction
    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Seats confirmed and locked successfully",
      data: {
        tnr: normalizedTnr,
        assignedCount: Object.keys(selections).length,
        timestamp: now.toISOString(),
      },
    });
  } catch (error) {
    await session.abortTransaction();

    const message = error.message || "Server error during seat confirmation";

    let status = 500;
    if (message.includes("not found")) status = 404;
    if (
      message.includes("Invalid") ||
      message.includes("cancelled") ||
      message.includes("already has")
    )
      status = 400;
    if (message.includes("already booked")) status = 409;
    if (message.includes("not yet released")) status = 403;
    if (message.includes("Advance payment")) status = 403; // or 402 Payment Required

    return res.status(status).json({
      success: false,
      message,
    });
  } finally {
    session.endSession();
  }
};
const getPaymentMethods = async (req, res) => {
  try {
    const methods = await PaymentMethod.find({})
      .sort({ type: 1, createdAt: -1 })
      .lean();

    // Optional: enrich response if needed
    const enriched = methods.map((m) => ({
      ...m,
      isActive: true, // you can add logic later
      qrImage: m.qrImage || null,
    }));

    return res.status(200).json({
      success: true,
      count: enriched.length,
      paymentMethods: enriched,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment methods",
      error: error.message,
    });
  }
};



// const createEnquiry = async (req, res) => {
//   try {
//     const {
//       fullName, mobileNumber, email, city,
//       destination, tourType, preferredTravelDate, numberOfDays,
//       adults, children, infants, specialRequests, source,
//     } = req.body;

//     if (!fullName || !mobileNumber || !email || !destination || !tourType || !preferredTravelDate || !numberOfDays) {
//       return res.status(400).json({ success: false, message: "Please fill all required fields including email" });
//     }

//     const enquiry = await enquiryModel.create({
//       fullName, mobileNumber, email, city,
//       destination, tourType, preferredTravelDate, numberOfDays,
//       adults: adults || 1,
//       children: children || 0,
//       infants: infants || 0,
//       specialRequests,
//       source,
//       raisedBy: "user",
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Enquiry submitted successfully",
//       data: enquiry,
//       fitCode: enquiry.fitCode,
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
//   }
// };


const createEnquiry = async (req, res) => {
  try {
    const {
      fullName, mobileNumber, email, city,
      destination, tourType, preferredTravelDate, numberOfDays,
      numberOfNights, // ← ADD
      adults, children, infants, specialRequests, source,
    } = req.body;

    if (!fullName || !mobileNumber || !destination || !tourType) {
      return res.status(400).json({ success: false, message: "Please fill all required fields including email" });
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
      raisedBy: "user",
    });

    return res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully",
      data: enquiry,
      fitCode: enquiry.fitCode,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};



export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  addToTrolly,
  listTrolly,
  cancelTraveller,
  paymentRazorpay,
  verifyRazorpay,
  googleSignIn,
  getSeatAllocationByTNR,
  getBookingDetailsByTNR,
  confirmSeatSelection,
  getPaymentMethods,
  createEnquiry,
};