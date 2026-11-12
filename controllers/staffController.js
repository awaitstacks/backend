
// // import { v2 as cloudinary } from "cloudinary";
// // import fs from "fs";
// // import staffModel from "../models/staffProfileModel.js";
// // // ══════════════════════════════════════════════════════════════════════════════
// // // STAFF PROFILES (admin only) — basic, contact & study details
// // // ══════════════════════════════════════════════════════════════════════════════

// // // Plain text fields copied from req.body (trimmed)
// // const STAFF_TEXT_FIELDS = [
// //   "fullName", "employeeId", "designation", "department", "reportingManager",
// //   "status", "gender", "maritalStatus", "staffType",
// //   "mobileNumber", "alternateNumber", "whatsappNumber", "email", "currentAddress", "permanentAddress",
// //   "emergencyName", "emergencyRelation", "emergencyNumber",
// //   "qualification", "specialization", "collegeOrUniversity", "yearOfPassing", "experience",
// //   "aadharNumber", "panNumber",
// //   "bankAccountNumber", "bankIfscCode", "bankAccountName", "bankBranchName",
// //   "bankBranchCode", "bankSwiftCode", "bankAccountType",
// //   "relievingReason",
// // ];

// // // No field is mandatory — every profile can be created with as little or as
// // // much information as is available at the time.
// // const STAFF_REQUIRED_FIELDS = {};

// // // Form-data sends lists as: repeated keys (array), JSON string, or "a, b, c" text.
// // // All three end up as a clean array.
// // const parseList = (value, splitter) => {
// //   let list = value;
// //   if (typeof value === "string") {
// //     const text = value.trim();
// //     if (text.startsWith("[")) {
// //       try {
// //         list = JSON.parse(text);
// //       } catch {
// //         list = text.split(splitter);
// //       }
// //     } else {
// //       list = text.split(splitter);
// //     }
// //   }
// //   if (!Array.isArray(list)) list = [];
// //   return list.map((item) => String(item).trim()).filter(Boolean);
// // };

// // // Enum-restricted fields — Mongoose rejects "" for these (it must be one of
// // // the listed options, or left out entirely so the schema default applies).
// // // A "Select" dropdown left untouched sends "", so that must be dropped here
// // // rather than saved as the literal empty string.
// // const STAFF_ENUM_FIELDS = new Set(["gender", "maritalStatus", "status", "staffType", "bankAccountType"]);

// // // Only fields that were actually sent are returned, so update works as a partial update
// // const buildStaffData = (body = {}) => {
// //   const data = {};

// //   STAFF_TEXT_FIELDS.forEach((field) => {
// //     if (body[field] === undefined) return;
// //     const value = body[field] === null ? "" : String(body[field]).trim();
// //     // Empty employeeId → let the auto-code apply. Empty enum fields → let
// //     // the schema default apply, instead of saving "" and failing enum
// //     // validation.
// //     if (!value && (field === "employeeId" || STAFF_ENUM_FIELDS.has(field))) return;
// //     data[field] = value;
// //   });

// //   if (body.dateOfJoining !== undefined) data.dateOfJoining = body.dateOfJoining || null;
// //   if (body.dateOfBirth !== undefined) data.dateOfBirth = body.dateOfBirth || null;
// //   // relievedOn is a Date — same pattern as the other date fields
// //   if (body.relievedOn !== undefined) data.relievedOn = body.relievedOn || null;
// //   if (body.age !== undefined) {
// //     const n = body.age === "" || body.age === null ? null : Number(body.age);
// //     data.age = Number.isNaN(n) ? null : n;
// //   }
// //   if (body.sameAsCurrent !== undefined) {
// //     data.sameAsCurrent = body.sameAsCurrent === true || body.sameAsCurrent === "true";
// //   }
// //   if (body.skills !== undefined) data.skills = parseList(body.skills, ",");

// //   return data;
// // };

// // // Checks the required fields directly against the incoming body (not just
// // // buildStaffData's output) so a field left out or sent blank is always
// // // caught, and returns a { field: message } map the UI can attach per-input.
// // const validateRequired = (body = {}, { partial = false } = {}) => {
// //   const errors = {};
// //   Object.entries(STAFF_REQUIRED_FIELDS).forEach(([field, message]) => {
// //     const sent = body[field] !== undefined;
// //     if (!sent && partial) return; // update(): omitted fields are left as-is
// //     const value = String(body[field] ?? "").trim();
// //     if (!value) errors[field] = message;
// //   });
// //   return errors;
// // };

// // // multer saves files to disk BEFORE the controller runs, so temp files must
// // // be removed whatever the outcome (validation error, 404, upload failure).
// // const cleanupTempFiles = (req, res) => {
// //   const files = [
// //     ...(req.files?.photo || []),
// //     ...(req.files?.resume || []),
// //   ];
// //   if (!files.length) return;
// //   res.once("close", () => {
// //     files.forEach((f) => fs.promises.unlink(f.path).catch(() => {}));
// //   });
// // };

// // // Upload a multer temp file to Cloudinary, returns the secure URL
// // const uploadToCloudinary = async (file, folder, resourceType) => {
// //   const result = await cloudinary.uploader.upload(file.path, {
// //     folder,
// //     resource_type: resourceType,
// //   });
// //   return result.secure_url;
// // };
// // const uploadStaffPhoto = (file) => uploadToCloudinary(file, "staff/photos", "image");
// // const uploadStaffResume = (file) => uploadToCloudinary(file, "staff/resumes", "raw");

// // // Never fails the request — just logs
// // const deleteFromCloudinary = async (url, folder, resourceType) => {
// //   if (!url) return;
// //   try {
// //     const fileName = url.split("/").pop().split(/[?#]/)[0];
// //     const publicId = resourceType === "raw" ? fileName : fileName.split(".")[0];
// //     await cloudinary.uploader.destroy(`${folder}/${publicId}`, { resource_type: resourceType });
// //   } catch (cloudErr) {
// //     console.warn(`Failed to delete ${folder} asset from Cloudinary:`, cloudErr);
// //   }
// // };
// // const deleteStaffPhoto = (url) => deleteFromCloudinary(url, "staff/photos", "image");
// // const deleteStaffResume = (url) => deleteFromCloudinary(url, "staff/resumes", "raw");

// // // Turns any mongoose/duplicate-key error into { message, errors: {field: msg} }
// // // so the frontend can show the message next to the exact field that failed,
// // // instead of one generic banner.
// // const staffErrorResponse = (res, error, fallbackMessage) => {
// //   if (error.code === 11000) {
// //     const field = Object.keys(error.keyPattern || {})[0] || "employeeId";
// //     return res.status(409).json({
// //       success: false,
// //       message: field === "employeeId" ? "That employee ID is already in use" : `That ${field} is already in use`,
// //       errors: { [field]: "Already in use — try a different value" },
// //     });
// //   }
// //   if (error.name === "ValidationError") {
// //     const errors = {};
// //     Object.values(error.errors).forEach((e) => { errors[e.path] = e.message; });
// //     return res.status(400).json({ success: false, message: "Please check the highlighted fields", errors });
// //   }
// //   return res.status(500).json({ success: false, message: fallbackMessage, error: error.message });
// // };

// // // ──────────────────────────────────────────────────────────────────────────────
// // // POST /api/tour/staff/create   (multipart/form-data — "photo" and/or "resume")
// // // employeeId is optional — EMP0001 style code is auto-generated. If two
// // // requests land at the same instant and the generated code collides, this
// // // retries a couple of times with a freshly generated code instead of
// // // surfacing a confusing "already exists" error for something the user never
// // // typed themselves.
// // // ──────────────────────────────────────────────────────────────────────────────
// // const createStaff = async (req, res) => {
// //   cleanupTempFiles(req, res);
// //   let uploadedPhoto = null;
// //   let uploadedResume = null;
// //   try {
// //     const fieldErrors = validateRequired(req.body);
// //     if (Object.keys(fieldErrors).length) {
// //       return res.status(400).json({ success: false, message: "Please fill all required fields", errors: fieldErrors });
// //     }

// //     const data = buildStaffData(req.body);
// //     const photoFile = req.files?.photo?.[0];
// //     const resumeFile = req.files?.resume?.[0];

// //     if (photoFile) {
// //       try {
// //         uploadedPhoto = await uploadStaffPhoto(photoFile);
// //         data.photo = uploadedPhoto;
// //       } catch (uploadErr) {
// //         console.error("Cloudinary photo upload failed:", uploadErr);
// //         return res.status(500).json({ success: false, message: "Failed to upload staff photo" });
// //       }
// //     }
// //     if (resumeFile) {
// //       try {
// //         uploadedResume = await uploadStaffResume(resumeFile);
// //         data.resume = uploadedResume;
// //       } catch (uploadErr) {
// //         console.error("Cloudinary resume upload failed:", uploadErr);
// //         return res.status(500).json({ success: false, message: "Failed to upload resume" });
// //       }
// //     }

// //     const userTypedOwnId = Boolean(data.employeeId);
// //     let staff;
// //     const maxAttempts = userTypedOwnId ? 1 : 3;
// //     for (let attempt = 1; attempt <= maxAttempts; attempt++) {
// //       try {
// //         staff = await staffModel.create(data);
// //         break;
// //       } catch (err) {
// //         const isEmployeeIdClash =
// //           err.code === 11000 && Object.keys(err.keyPattern || {})[0] === "employeeId";
// //         if (isEmployeeIdClash && !userTypedOwnId && attempt < maxAttempts) {
// //           continue; // regenerate a fresh code on the next loop and retry
// //         }
// //         throw err;
// //       }
// //     }

// //     return res.status(201).json({
// //       success: true,
// //       message: `Staff added! Employee ID: ${staff.employeeId}`,
// //       data: staff,
// //       employeeId: staff.employeeId,
// //     });
// //   } catch (error) {
// //     if (uploadedPhoto) await deleteStaffPhoto(uploadedPhoto); // don't leave orphan files
// //     if (uploadedResume) await deleteStaffResume(uploadedResume);
// //     console.error("createStaff error:", error);
// //     return staffErrorResponse(res, error, "Failed to add staff");
// //   }
// // };

// // // ──────────────────────────────────────────────────────────────────────────────
// // // GET /api/tour/staff/all
// // // ──────────────────────────────────────────────────────────────────────────────
// // const getAllStaff = async (req, res) => {
// //   try {
// //     const staff = await staffModel
// //       .find()
// //       .collation({ locale: "en", strength: 2 }) // case-insensitive A-Z
// //       .sort({ employeeId: 1 });
// //     return res.status(200).json({ success: true, data: staff });
// //   } catch (error) {
// //     return res.status(500).json({ success: false, message: error.message });
// //   }
// // };

// // // GET BY ID — GET /api/tour/staff/:id
// // const getStaffById = async (req, res) => {
// //   try {
// //     const staff = await staffModel.findById(req.params.id);
// //     if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });
// //     return res.status(200).json({ success: true, data: staff });
// //   } catch (error) {
// //     return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
// //   }
// // };

// // // ──────────────────────────────────────────────────────────────────────────────
// // // UPDATE — PUT /api/tour/staff/:id/update   (multipart/form-data)
// // // Send only what changed. A new "photo"/"resume" file replaces the old one;
// // // removePhoto=true / removeResume=true clears it.
// // // ──────────────────────────────────────────────────────────────────────────────
// // const updateStaff = async (req, res) => {
// //   cleanupTempFiles(req, res);
// //   let uploadedPhoto = null;
// //   let uploadedResume = null;
// //   try {
// //     const staff = await staffModel.findById(req.params.id);
// //     if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });

// //     // Required fields can be omitted (partial update), but not blanked out
// //     const fieldErrors = validateRequired(req.body, { partial: true });
// //     if (Object.keys(fieldErrors).length) {
// //       return res.status(400).json({ success: false, message: "Please check the highlighted fields", errors: fieldErrors });
// //     }

// //     const data = buildStaffData(req.body);
// //     const photoFile = req.files?.photo?.[0];
// //     const resumeFile = req.files?.resume?.[0];

// //     let oldPhoto = null;
// //     if (photoFile) {
// //       try {
// //         uploadedPhoto = await uploadStaffPhoto(photoFile);
// //         oldPhoto = staff.photo;
// //         data.photo = uploadedPhoto;
// //       } catch (uploadErr) {
// //         console.error("Cloudinary photo upload failed:", uploadErr);
// //         return res.status(500).json({ success: false, message: "Failed to upload new staff photo" });
// //       }
// //     } else if (req.body?.removePhoto === true || req.body?.removePhoto === "true") {
// //       oldPhoto = staff.photo;
// //       data.photo = null;
// //     }

// //     let oldResume = null;
// //     if (resumeFile) {
// //       try {
// //         uploadedResume = await uploadStaffResume(resumeFile);
// //         oldResume = staff.resume;
// //         data.resume = uploadedResume;
// //       } catch (uploadErr) {
// //         console.error("Cloudinary resume upload failed:", uploadErr);
// //         return res.status(500).json({ success: false, message: "Failed to upload new resume" });
// //       }
// //     } else if (req.body?.removeResume === true || req.body?.removeResume === "true") {
// //       oldResume = staff.resume;
// //       data.resume = null;
// //     }

// //     staff.set(data);
// //     const updated = await staff.save(); // save() so validation + address sync hook run

// //     if (oldPhoto) await deleteStaffPhoto(oldPhoto);
// //     if (oldResume) await deleteStaffResume(oldResume);

// //     return res.status(200).json({ success: true, message: "Staff updated successfully", data: updated });
// //   } catch (error) {
// //     if (uploadedPhoto) await deleteStaffPhoto(uploadedPhoto);
// //     if (uploadedResume) await deleteStaffResume(uploadedResume);
// //     console.error("updateStaff error:", error);
// //     return staffErrorResponse(res, error, "Failed to update staff");
// //   }
// // };

// // // ──────────────────────────────────────────────────────────────────────────────
// // // DELETE — DELETE /api/tour/staff/:id/delete
// // // ──────────────────────────────────────────────────────────────────────────────
// // const deleteStaff = async (req, res) => {
// //   try {
// //     const staff = await staffModel.findByIdAndDelete(req.params.id);
// //     if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });

// //     if (staff.photo) await deleteStaffPhoto(staff.photo);
// //     if (staff.resume) await deleteStaffResume(staff.resume);

// //     return res.status(200).json({ success: true, message: "Staff deleted successfully" });
// //   } catch (error) {
// //     console.error("deleteStaff error:", error);
// //     return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
// //   }
// // };

// // export {
// //   createStaff,
// //   getAllStaff,
// //   getStaffById,
// //   updateStaff,
// //   deleteStaff,
// // };


// import { v2 as cloudinary } from "cloudinary";
// import fs from "fs";
// import bcrypt from "bcryptjs";
// import mongoose from "mongoose";
// import staffModel from "../models/staffProfileModel.js";
// import staffRoleModel from "../models/staffRoleModel.js";
// // ══════════════════════════════════════════════════════════════════════════════
// // STAFF PROFILES (admin only) — basic, contact & study details
// // ══════════════════════════════════════════════════════════════════════════════

// // Plain text fields copied from req.body (trimmed)
// const STAFF_TEXT_FIELDS = [
//   "fullName", "employeeId", "designation", "department", "reportingManager",
//   "status", "gender", "maritalStatus", "staffType",
//   "mobileNumber", "alternateNumber", "whatsappNumber", "email", "currentAddress", "permanentAddress",
//   "emergencyName", "emergencyRelation", "emergencyNumber",
//   "qualification", "specialization", "collegeOrUniversity", "yearOfPassing", "experience",
//   "aadharNumber", "panNumber",
//   "bankAccountNumber", "bankIfscCode", "bankAccountName", "bankBranchName",
//   "bankBranchCode", "bankSwiftCode", "bankAccountType",
//   "relievingReason",
// ];

// // No field is mandatory — every profile can be created with as little or as
// // much information as is available at the time.
// const STAFF_REQUIRED_FIELDS = {};

// // Form-data sends lists as: repeated keys (array), JSON string, or "a, b, c" text.
// // All three end up as a clean array.
// const parseList = (value, splitter) => {
//   let list = value;
//   if (typeof value === "string") {
//     const text = value.trim();
//     if (text.startsWith("[")) {
//       try {
//         list = JSON.parse(text);
//       } catch {
//         list = text.split(splitter);
//       }
//     } else {
//       list = text.split(splitter);
//     }
//   }
//   if (!Array.isArray(list)) list = [];
//   return list.map((item) => String(item).trim()).filter(Boolean);
// };

// // Enum-restricted fields — Mongoose rejects "" for these (it must be one of
// // the listed options, or left out entirely so the schema default applies).
// // A "Select" dropdown left untouched sends "", so that must be dropped here
// // rather than saved as the literal empty string.
// const STAFF_ENUM_FIELDS = new Set(["gender", "maritalStatus", "status", "staffType", "bankAccountType"]);

// // Only fields that were actually sent are returned, so update works as a partial update
// const buildStaffData = (body = {}) => {
//   const data = {};

//   STAFF_TEXT_FIELDS.forEach((field) => {
//     if (body[field] === undefined) return;
//     const value = body[field] === null ? "" : String(body[field]).trim();
//     // Empty employeeId → let the auto-code apply. Empty enum fields → let
//     // the schema default apply, instead of saving "" and failing enum
//     // validation.
//     if (!value && (field === "employeeId" || STAFF_ENUM_FIELDS.has(field))) return;
//     data[field] = value;
//   });

//   if (body.dateOfJoining !== undefined) data.dateOfJoining = body.dateOfJoining || null;
//   if (body.dateOfBirth !== undefined) data.dateOfBirth = body.dateOfBirth || null;
//   // relievedOn is a Date — same pattern as the other date fields
//   if (body.relievedOn !== undefined) data.relievedOn = body.relievedOn || null;
//   if (body.age !== undefined) {
//     const n = body.age === "" || body.age === null ? null : Number(body.age);
//     data.age = Number.isNaN(n) ? null : n;
//   }
//   if (body.sameAsCurrent !== undefined) {
//     data.sameAsCurrent = body.sameAsCurrent === true || body.sameAsCurrent === "true";
//   }
//   if (body.skills !== undefined) data.skills = parseList(body.skills, ",");

//   return data;
// };

// // ──────────────────────────────────────────────────────────────────────────────
// // Staff portal login fields — HR Staff Profile form la set pannuvaanga
// //   username, password (hash aagum), role (roleId), loginEnabled
// // existing = update pannum podhu DB la irukura staff (password select pannirukanum)
// // Returns { data, errors } — errors irundha save panna koodadhu
// // ──────────────────────────────────────────────────────────────────────────────
// const buildLoginData = async (body = {}, existing = null) => {
//   const data = {};
//   const errors = {};

//   // Username — empty anuppuna ignore (pazhaya username apdiye irukkum)
//   if (body.username !== undefined && body.username !== null) {
//     const u = String(body.username).trim().toLowerCase();
//     if (u) {
//       if (!/^[a-z0-9._-]{3,30}$/.test(u)) {
//         errors.username = "3–30 characters, letters/numbers/. _ - only";
//       } else {
//         data.username = u;
//       }
//     }
//   }

//   // Password — anuppuna mattum (empty = maathala). Set pannadhum reset request clear
//   if (body.password !== undefined && body.password !== null && String(body.password) !== "") {
//     const pwd = String(body.password);
//     if (pwd.length < 6) {
//       errors.password = "At least 6 characters";
//     } else {
//       data.password = await bcrypt.hash(pwd, 10);
//       data.resetRequested = false;
//       data.resetRequestedAt = null;
//     }
//   }

//   // Role — "" anuppuna role remove
//   if (body.role !== undefined) {
//     const roleId = body.role === null ? "" : String(body.role).trim();
//     if (!roleId) {
//       data.role = null;
//     } else if (!mongoose.isValidObjectId(roleId)) {
//       errors.role = "Select a valid role";
//     } else {
//       const role = await staffRoleModel.findById(roleId).select("_id").lean();
//       if (!role) errors.role = "Selected role not found";
//       else data.role = role._id;
//     }
//   }

//   if (body.loginEnabled !== undefined) {
//     data.loginEnabled = body.loginEnabled === true || body.loginEnabled === "true";
//   }

//   // Login ON pannanum na username + password rendum venum
//   const enabled = data.loginEnabled ?? existing?.loginEnabled ?? false;
//   if (enabled) {
//     if (!(data.username || existing?.username) && !errors.username) {
//       errors.username = "Username is required to enable login";
//     }
//     if (!(data.password || existing?.password) && !errors.password) {
//       errors.password = "Password is required to enable login";
//     }
//   }

//   return { data, errors };
// };

// // Response la password hash poga koodadhu
// const toSafeStaff = (doc) => {
//   const obj = doc?.toObject ? doc.toObject() : { ...doc };
//   delete obj.password;
//   return obj;
// };

// // Checks the required fields directly against the incoming body (not just
// // buildStaffData's output) so a field left out or sent blank is always
// // caught, and returns a { field: message } map the UI can attach per-input.
// const validateRequired = (body = {}, { partial = false } = {}) => {
//   const errors = {};
//   Object.entries(STAFF_REQUIRED_FIELDS).forEach(([field, message]) => {
//     const sent = body[field] !== undefined;
//     if (!sent && partial) return; // update(): omitted fields are left as-is
//     const value = String(body[field] ?? "").trim();
//     if (!value) errors[field] = message;
//   });
//   return errors;
// };

// // multer saves files to disk BEFORE the controller runs, so temp files must
// // be removed whatever the outcome (validation error, 404, upload failure).
// const cleanupTempFiles = (req, res) => {
//   const files = [
//     ...(req.files?.photo || []),
//     ...(req.files?.resume || []),
//   ];
//   if (!files.length) return;
//   res.once("close", () => {
//     files.forEach((f) => fs.promises.unlink(f.path).catch(() => {}));
//   });
// };

// // Upload a multer temp file to Cloudinary, returns the secure URL
// const uploadToCloudinary = async (file, folder, resourceType) => {
//   const result = await cloudinary.uploader.upload(file.path, {
//     folder,
//     resource_type: resourceType,
//   });
//   return result.secure_url;
// };
// const uploadStaffPhoto = (file) => uploadToCloudinary(file, "staff/photos", "image");
// const uploadStaffResume = (file) => uploadToCloudinary(file, "staff/resumes", "raw");

// // Never fails the request — just logs
// const deleteFromCloudinary = async (url, folder, resourceType) => {
//   if (!url) return;
//   try {
//     const fileName = url.split("/").pop().split(/[?#]/)[0];
//     const publicId = resourceType === "raw" ? fileName : fileName.split(".")[0];
//     await cloudinary.uploader.destroy(`${folder}/${publicId}`, { resource_type: resourceType });
//   } catch (cloudErr) {
//     console.warn(`Failed to delete ${folder} asset from Cloudinary:`, cloudErr);
//   }
// };
// const deleteStaffPhoto = (url) => deleteFromCloudinary(url, "staff/photos", "image");
// const deleteStaffResume = (url) => deleteFromCloudinary(url, "staff/resumes", "raw");

// // Turns any mongoose/duplicate-key error into { message, errors: {field: msg} }
// // so the frontend can show the message next to the exact field that failed,
// // instead of one generic banner.
// const staffErrorResponse = (res, error, fallbackMessage) => {
//   if (error.code === 11000) {
//     const field = Object.keys(error.keyPattern || {})[0] || "employeeId";
//     return res.status(409).json({
//       success: false,
//       message:
//         field === "employeeId"
//           ? "That employee ID is already in use"
//           : field === "username"
//             ? "That username is already taken"
//             : `That ${field} is already in use`,
//       errors: { [field]: "Already in use — try a different value" },
//     });
//   }
//   if (error.name === "ValidationError") {
//     const errors = {};
//     Object.values(error.errors).forEach((e) => { errors[e.path] = e.message; });
//     return res.status(400).json({ success: false, message: "Please check the highlighted fields", errors });
//   }
//   return res.status(500).json({ success: false, message: fallbackMessage, error: error.message });
// };

// // ──────────────────────────────────────────────────────────────────────────────
// // POST /api/tour/staff/create   (multipart/form-data — "photo" and/or "resume")
// // employeeId is optional — EMP0001 style code is auto-generated. If two
// // requests land at the same instant and the generated code collides, this
// // retries a couple of times with a freshly generated code instead of
// // surfacing a confusing "already exists" error for something the user never
// // typed themselves.
// // ──────────────────────────────────────────────────────────────────────────────
// const createStaff = async (req, res) => {
//   cleanupTempFiles(req, res);
//   let uploadedPhoto = null;
//   let uploadedResume = null;
//   try {
//     const fieldErrors = validateRequired(req.body);
//     if (Object.keys(fieldErrors).length) {
//       return res.status(400).json({ success: false, message: "Please fill all required fields", errors: fieldErrors });
//     }

//     const data = buildStaffData(req.body);

//     // Login fields (username / password / role / loginEnabled)
//     const login = await buildLoginData(req.body);
//     if (Object.keys(login.errors).length) {
//       return res.status(400).json({ success: false, message: "Please check the login details", errors: login.errors });
//     }
//     Object.assign(data, login.data);

//     const photoFile = req.files?.photo?.[0];
//     const resumeFile = req.files?.resume?.[0];

//     if (photoFile) {
//       try {
//         uploadedPhoto = await uploadStaffPhoto(photoFile);
//         data.photo = uploadedPhoto;
//       } catch (uploadErr) {
//         console.error("Cloudinary photo upload failed:", uploadErr);
//         return res.status(500).json({ success: false, message: "Failed to upload staff photo" });
//       }
//     }
//     if (resumeFile) {
//       try {
//         uploadedResume = await uploadStaffResume(resumeFile);
//         data.resume = uploadedResume;
//       } catch (uploadErr) {
//         console.error("Cloudinary resume upload failed:", uploadErr);
//         return res.status(500).json({ success: false, message: "Failed to upload resume" });
//       }
//     }

//     const userTypedOwnId = Boolean(data.employeeId);
//     let staff;
//     const maxAttempts = userTypedOwnId ? 1 : 3;
//     for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//       try {
//         staff = await staffModel.create(data);
//         break;
//       } catch (err) {
//         const isEmployeeIdClash =
//           err.code === 11000 && Object.keys(err.keyPattern || {})[0] === "employeeId";
//         if (isEmployeeIdClash && !userTypedOwnId && attempt < maxAttempts) {
//           continue; // regenerate a fresh code on the next loop and retry
//         }
//         throw err;
//       }
//     }

//     return res.status(201).json({
//       success: true,
//       message: `Staff added! Employee ID: ${staff.employeeId}`,
//       data: toSafeStaff(staff),
//       employeeId: staff.employeeId,
//     });
//   } catch (error) {
//     if (uploadedPhoto) await deleteStaffPhoto(uploadedPhoto); // don't leave orphan files
//     if (uploadedResume) await deleteStaffResume(uploadedResume);
//     console.error("createStaff error:", error);
//     return staffErrorResponse(res, error, "Failed to add staff");
//   }
// };

// // ──────────────────────────────────────────────────────────────────────────────
// // GET /api/tour/staff/all
// // ──────────────────────────────────────────────────────────────────────────────
// const getAllStaff = async (req, res) => {
//   try {
//     const staff = await staffModel
//       .find()
//       .populate("role", "name tabs") // card la role name kaatta
//       .collation({ locale: "en", strength: 2 }) // case-insensitive A-Z
//       .sort({ employeeId: 1 });
//     return res.status(200).json({ success: true, data: staff });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// // GET BY ID — GET /api/tour/staff/:id
// const getStaffById = async (req, res) => {
//   try {
//     const staff = await staffModel.findById(req.params.id).populate("role", "name tabs");
//     if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });
//     return res.status(200).json({ success: true, data: staff });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
//   }
// };

// // ──────────────────────────────────────────────────────────────────────────────
// // UPDATE — PUT /api/tour/staff/:id/update   (multipart/form-data)
// // Send only what changed. A new "photo"/"resume" file replaces the old one;
// // removePhoto=true / removeResume=true clears it.
// // ──────────────────────────────────────────────────────────────────────────────
// const updateStaff = async (req, res) => {
//   cleanupTempFiles(req, res);
//   let uploadedPhoto = null;
//   let uploadedResume = null;
//   try {
//     // +password → login enable check ku (response la anuppa maattom)
//     const staff = await staffModel.findById(req.params.id).select("+password");
//     if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });

//     // Required fields can be omitted (partial update), but not blanked out
//     const fieldErrors = validateRequired(req.body, { partial: true });
//     if (Object.keys(fieldErrors).length) {
//       return res.status(400).json({ success: false, message: "Please check the highlighted fields", errors: fieldErrors });
//     }

//     const data = buildStaffData(req.body);

//     // Login fields — anuppuna mattum update (password empty = maathala)
//     const login = await buildLoginData(req.body, staff);
//     if (Object.keys(login.errors).length) {
//       return res.status(400).json({ success: false, message: "Please check the login details", errors: login.errors });
//     }
//     Object.assign(data, login.data);

//     const photoFile = req.files?.photo?.[0];
//     const resumeFile = req.files?.resume?.[0];

//     let oldPhoto = null;
//     if (photoFile) {
//       try {
//         uploadedPhoto = await uploadStaffPhoto(photoFile);
//         oldPhoto = staff.photo;
//         data.photo = uploadedPhoto;
//       } catch (uploadErr) {
//         console.error("Cloudinary photo upload failed:", uploadErr);
//         return res.status(500).json({ success: false, message: "Failed to upload new staff photo" });
//       }
//     } else if (req.body?.removePhoto === true || req.body?.removePhoto === "true") {
//       oldPhoto = staff.photo;
//       data.photo = null;
//     }

//     let oldResume = null;
//     if (resumeFile) {
//       try {
//         uploadedResume = await uploadStaffResume(resumeFile);
//         oldResume = staff.resume;
//         data.resume = uploadedResume;
//       } catch (uploadErr) {
//         console.error("Cloudinary resume upload failed:", uploadErr);
//         return res.status(500).json({ success: false, message: "Failed to upload new resume" });
//       }
//     } else if (req.body?.removeResume === true || req.body?.removeResume === "true") {
//       oldResume = staff.resume;
//       data.resume = null;
//     }

//     staff.set(data);
//     const updated = await staff.save(); // save() so validation + address sync hook run
//     await updated.populate("role", "name tabs");

//     if (oldPhoto) await deleteStaffPhoto(oldPhoto);
//     if (oldResume) await deleteStaffResume(oldResume);

//     return res.status(200).json({ success: true, message: "Staff updated successfully", data: toSafeStaff(updated) });
//   } catch (error) {
//     if (uploadedPhoto) await deleteStaffPhoto(uploadedPhoto);
//     if (uploadedResume) await deleteStaffResume(uploadedResume);
//     console.error("updateStaff error:", error);
//     return staffErrorResponse(res, error, "Failed to update staff");
//   }
// };

// // ──────────────────────────────────────────────────────────────────────────────
// // DELETE — DELETE /api/tour/staff/:id/delete
// // ──────────────────────────────────────────────────────────────────────────────
// const deleteStaff = async (req, res) => {
//   try {
//     const staff = await staffModel.findByIdAndDelete(req.params.id);
//     if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });

//     if (staff.photo) await deleteStaffPhoto(staff.photo);
//     if (staff.resume) await deleteStaffResume(staff.resume);

//     return res.status(200).json({ success: true, message: "Staff deleted successfully" });
//   } catch (error) {
//     console.error("deleteStaff error:", error);
//     return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
//   }
// };

// export {
//   createStaff,
//   getAllStaff,
//   getStaffById,
//   updateStaff,
//   deleteStaff,
// };


import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import staffModel from "../models/staffProfileModel.js";
import staffRoleModel from "../models/staffRoleModel.js";
import Query from "../models/queryModel.js";
import enquiryModel from "../models/enquiryModel.js";
// ══════════════════════════════════════════════════════════════════════════════
// STAFF PROFILES (admin only) — basic, contact & study details
// ══════════════════════════════════════════════════════════════════════════════

// Plain text fields copied from req.body (trimmed)
const STAFF_TEXT_FIELDS = [
  "fullName", "employeeId", "designation", "department", "reportingManager",
  "status", "gender", "maritalStatus", "staffType",
  "mobileNumber", "alternateNumber", "whatsappNumber", "email", "currentAddress", "permanentAddress",
  "emergencyName", "emergencyRelation", "emergencyNumber",
  "qualification", "specialization", "collegeOrUniversity", "yearOfPassing", "experience",
  "aadharNumber", "panNumber",
  "bankAccountNumber", "bankIfscCode", "bankAccountName", "bankBranchName",
  "bankBranchCode", "bankSwiftCode", "bankAccountType",
  "relievingReason",
];

// No field is mandatory — every profile can be created with as little or as
// much information as is available at the time.
const STAFF_REQUIRED_FIELDS = {};

// Form-data sends lists as: repeated keys (array), JSON string, or "a, b, c" text.
// All three end up as a clean array.
const parseList = (value, splitter) => {
  let list = value;
  if (typeof value === "string") {
    const text = value.trim();
    if (text.startsWith("[")) {
      try {
        list = JSON.parse(text);
      } catch {
        list = text.split(splitter);
      }
    } else {
      list = text.split(splitter);
    }
  }
  if (!Array.isArray(list)) list = [];
  return list.map((item) => String(item).trim()).filter(Boolean);
};

// Enum-restricted fields — Mongoose rejects "" for these (it must be one of
// the listed options, or left out entirely so the schema default applies).
// A "Select" dropdown left untouched sends "", so that must be dropped here
// rather than saved as the literal empty string.
const STAFF_ENUM_FIELDS = new Set(["gender", "maritalStatus", "status", "staffType", "bankAccountType"]);

// Only fields that were actually sent are returned, so update works as a partial update
const buildStaffData = (body = {}) => {
  const data = {};

  STAFF_TEXT_FIELDS.forEach((field) => {
    if (body[field] === undefined) return;
    const value = body[field] === null ? "" : String(body[field]).trim();
    // Empty employeeId → let the auto-code apply. Empty enum fields → let
    // the schema default apply, instead of saving "" and failing enum
    // validation.
    if (!value && (field === "employeeId" || STAFF_ENUM_FIELDS.has(field))) return;
    data[field] = value;
  });

  if (body.dateOfJoining !== undefined) data.dateOfJoining = body.dateOfJoining || null;
  if (body.dateOfBirth !== undefined) data.dateOfBirth = body.dateOfBirth || null;
  // relievedOn is a Date — same pattern as the other date fields
  if (body.relievedOn !== undefined) data.relievedOn = body.relievedOn || null;
  if (body.age !== undefined) {
    const n = body.age === "" || body.age === null ? null : Number(body.age);
    data.age = Number.isNaN(n) ? null : n;
  }
  if (body.sameAsCurrent !== undefined) {
    data.sameAsCurrent = body.sameAsCurrent === true || body.sameAsCurrent === "true";
  }
  if (body.skills !== undefined) data.skills = parseList(body.skills, ",");

  return data;
};

// ──────────────────────────────────────────────────────────────────────────────
// Staff portal login fields — HR Staff Profile form la set pannuvaanga
//   username, password (hash aagum), role (roleId), loginEnabled
// existing = update pannum podhu DB la irukura staff (password select pannirukanum)
// Returns { data, errors } — errors irundha save panna koodadhu
// ──────────────────────────────────────────────────────────────────────────────
const buildLoginData = async (body = {}, existing = null) => {
  const data = {};
  const errors = {};

  // Username — empty anuppuna ignore (pazhaya username apdiye irukkum)
  if (body.username !== undefined && body.username !== null) {
    const u = String(body.username).trim().toLowerCase();
    if (u) {
      if (!/^[a-z0-9._-]{3,30}$/.test(u)) {
        errors.username = "3–30 characters, letters/numbers/. _ - only";
      } else {
        data.username = u;
      }
    }
  }

  // Password — anuppuna mattum (empty = maathala). Set pannadhum reset request clear
  if (body.password !== undefined && body.password !== null && String(body.password) !== "") {
    const pwd = String(body.password);
    if (pwd.length < 6) {
      errors.password = "At least 6 characters";
    } else {
      data.password = await bcrypt.hash(pwd, 10);
      data.resetRequested = false;
      data.resetRequestedAt = null;
    }
  }

  // Role — "" anuppuna role remove
  if (body.role !== undefined) {
    const roleId = body.role === null ? "" : String(body.role).trim();
    if (!roleId) {
      data.role = null;
    } else if (!mongoose.isValidObjectId(roleId)) {
      errors.role = "Select a valid role";
    } else {
      const role = await staffRoleModel.findById(roleId).select("_id").lean();
      if (!role) errors.role = "Selected role not found";
      else data.role = role._id;
    }
  }

  if (body.loginEnabled !== undefined) {
    data.loginEnabled = body.loginEnabled === true || body.loginEnabled === "true";
  }

  // Login ON pannanum na username + password rendum venum
  const enabled = data.loginEnabled ?? existing?.loginEnabled ?? false;
  if (enabled) {
    if (!(data.username || existing?.username) && !errors.username) {
      errors.username = "Username is required to enable login";
    }
    if (!(data.password || existing?.password) && !errors.password) {
      errors.password = "Password is required to enable login";
    }
  }

  return { data, errors };
};

// Response la password hash poga koodadhu
const toSafeStaff = (doc) => {
  const obj = doc?.toObject ? doc.toObject() : { ...doc };
  delete obj.password;
  return obj;
};

// Checks the required fields directly against the incoming body (not just
// buildStaffData's output) so a field left out or sent blank is always
// caught, and returns a { field: message } map the UI can attach per-input.
const validateRequired = (body = {}, { partial = false } = {}) => {
  const errors = {};
  Object.entries(STAFF_REQUIRED_FIELDS).forEach(([field, message]) => {
    const sent = body[field] !== undefined;
    if (!sent && partial) return; // update(): omitted fields are left as-is
    const value = String(body[field] ?? "").trim();
    if (!value) errors[field] = message;
  });
  return errors;
};

// multer saves files to disk BEFORE the controller runs, so temp files must
// be removed whatever the outcome (validation error, 404, upload failure).
const cleanupTempFiles = (req, res) => {
  const files = [
    ...(req.files?.photo || []),
    ...(req.files?.resume || []),
  ];
  if (!files.length) return;
  res.once("close", () => {
    files.forEach((f) => fs.promises.unlink(f.path).catch(() => { }));
  });
};

// Upload a multer temp file to Cloudinary, returns the secure URL
const uploadToCloudinary = async (file, folder, resourceType) => {
  const result = await cloudinary.uploader.upload(file.path, {
    folder,
    resource_type: resourceType,
  });
  return result.secure_url;
};
const uploadStaffPhoto = (file) => uploadToCloudinary(file, "staff/photos", "image");
const uploadStaffResume = (file) => uploadToCloudinary(file, "staff/resumes", "raw");

// Never fails the request — just logs
const deleteFromCloudinary = async (url, folder, resourceType) => {
  if (!url) return;
  try {
    const fileName = url.split("/").pop().split(/[?#]/)[0];
    const publicId = resourceType === "raw" ? fileName : fileName.split(".")[0];
    await cloudinary.uploader.destroy(`${folder}/${publicId}`, { resource_type: resourceType });
  } catch (cloudErr) {
    console.warn(`Failed to delete ${folder} asset from Cloudinary:`, cloudErr);
  }
};
const deleteStaffPhoto = (url) => deleteFromCloudinary(url, "staff/photos", "image");
const deleteStaffResume = (url) => deleteFromCloudinary(url, "staff/resumes", "raw");

// Turns any mongoose/duplicate-key error into { message, errors: {field: msg} }
// so the frontend can show the message next to the exact field that failed,
// instead of one generic banner.
const staffErrorResponse = (res, error, fallbackMessage) => {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || "employeeId";
    return res.status(409).json({
      success: false,
      message:
        field === "employeeId"
          ? "That employee ID is already in use"
          : field === "username"
            ? "That username is already taken"
            : `That ${field} is already in use`,
      errors: { [field]: "Already in use — try a different value" },
    });
  }
  if (error.name === "ValidationError") {
    const errors = {};
    Object.values(error.errors).forEach((e) => { errors[e.path] = e.message; });
    return res.status(400).json({ success: false, message: "Please check the highlighted fields", errors });
  }
  return res.status(500).json({ success: false, message: fallbackMessage, error: error.message });
};

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/tour/staff/create   (multipart/form-data — "photo" and/or "resume")
// employeeId is optional — EMP0001 style code is auto-generated. If two
// requests land at the same instant and the generated code collides, this
// retries a couple of times with a freshly generated code instead of
// surfacing a confusing "already exists" error for something the user never
// typed themselves.
// ──────────────────────────────────────────────────────────────────────────────
const createStaff = async (req, res) => {
  cleanupTempFiles(req, res);
  let uploadedPhoto = null;
  let uploadedResume = null;
  try {
    const fieldErrors = validateRequired(req.body);
    if (Object.keys(fieldErrors).length) {
      return res.status(400).json({ success: false, message: "Please fill all required fields", errors: fieldErrors });
    }

    const data = buildStaffData(req.body);

    // Login fields (username / password / role / loginEnabled)
    const login = await buildLoginData(req.body);
    if (Object.keys(login.errors).length) {
      return res.status(400).json({ success: false, message: "Please check the login details", errors: login.errors });
    }
    Object.assign(data, login.data);

    const photoFile = req.files?.photo?.[0];
    const resumeFile = req.files?.resume?.[0];

    if (photoFile) {
      try {
        uploadedPhoto = await uploadStaffPhoto(photoFile);
        data.photo = uploadedPhoto;
      } catch (uploadErr) {
        console.error("Cloudinary photo upload failed:", uploadErr);
        return res.status(500).json({ success: false, message: "Failed to upload staff photo" });
      }
    }
    if (resumeFile) {
      try {
        uploadedResume = await uploadStaffResume(resumeFile);
        data.resume = uploadedResume;
      } catch (uploadErr) {
        console.error("Cloudinary resume upload failed:", uploadErr);
        return res.status(500).json({ success: false, message: "Failed to upload resume" });
      }
    }

    const userTypedOwnId = Boolean(data.employeeId);
    let staff;
    const maxAttempts = userTypedOwnId ? 1 : 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        staff = await staffModel.create(data);
        break;
      } catch (err) {
        const isEmployeeIdClash =
          err.code === 11000 && Object.keys(err.keyPattern || {})[0] === "employeeId";
        if (isEmployeeIdClash && !userTypedOwnId && attempt < maxAttempts) {
          continue; // regenerate a fresh code on the next loop and retry
        }
        throw err;
      }
    }

    return res.status(201).json({
      success: true,
      message: `Staff added! Employee ID: ${staff.employeeId}`,
      data: toSafeStaff(staff),
      employeeId: staff.employeeId,
    });
  } catch (error) {
    if (uploadedPhoto) await deleteStaffPhoto(uploadedPhoto); // don't leave orphan files
    if (uploadedResume) await deleteStaffResume(uploadedResume);
    console.error("createStaff error:", error);
    return staffErrorResponse(res, error, "Failed to add staff");
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/tour/staff/all
// ──────────────────────────────────────────────────────────────────────────────
const getAllStaff = async (req, res) => {
  try {
    // Staff site (Raised by / Raised to dropdown): name + designation mattum,
    // bank / Aadhaar maari details staff ku anuppa koodadhu
    if (req.userType === "staff" && !(req.staff?.role?.tabs || []).includes("/staff-profile")) {
      const list = await staffModel
        .find({ status: { $ne: "Inactive" } })
        .select("fullName employeeId designation department status photo role loginEnabled")
        .populate("role", "name") // Raised to dropdown role wise group ku
        .collation({ locale: "en", strength: 2 })
        .sort({ employeeId: 1 });
      return res.status(200).json({ success: true, data: list });
    }

    const staff = await staffModel
      .find()
      .populate("role", "name tabs") // card la role name kaatta
      .collation({ locale: "en", strength: 2 }) // case-insensitive A-Z
      .sort({ employeeId: 1 });
    return res.status(200).json({ success: true, data: staff });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET BY ID — GET /api/tour/staff/:id
const getStaffById = async (req, res) => {
  try {
    const staff = await staffModel.findById(req.params.id).populate("role", "name tabs");
    if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });
    return res.status(200).json({ success: true, data: staff });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// UPDATE — PUT /api/tour/staff/:id/update   (multipart/form-data)
// Send only what changed. A new "photo"/"resume" file replaces the old one;
// removePhoto=true / removeResume=true clears it.
// ──────────────────────────────────────────────────────────────────────────────
const updateStaff = async (req, res) => {
  cleanupTempFiles(req, res);
  let uploadedPhoto = null;
  let uploadedResume = null;
  try {
    // +password → login enable check ku (response la anuppa maattom)
    const staff = await staffModel.findById(req.params.id).select("+password");
    if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });

    // Required fields can be omitted (partial update), but not blanked out
    const fieldErrors = validateRequired(req.body, { partial: true });
    if (Object.keys(fieldErrors).length) {
      return res.status(400).json({ success: false, message: "Please check the highlighted fields", errors: fieldErrors });
    }

    const data = buildStaffData(req.body);

    // Login fields — anuppuna mattum update (password empty = maathala)
    const login = await buildLoginData(req.body, staff);
    if (Object.keys(login.errors).length) {
      return res.status(400).json({ success: false, message: "Please check the login details", errors: login.errors });
    }
    Object.assign(data, login.data);

    const photoFile = req.files?.photo?.[0];
    const resumeFile = req.files?.resume?.[0];

    let oldPhoto = null;
    if (photoFile) {
      try {
        uploadedPhoto = await uploadStaffPhoto(photoFile);
        oldPhoto = staff.photo;
        data.photo = uploadedPhoto;
      } catch (uploadErr) {
        console.error("Cloudinary photo upload failed:", uploadErr);
        return res.status(500).json({ success: false, message: "Failed to upload new staff photo" });
      }
    } else if (req.body?.removePhoto === true || req.body?.removePhoto === "true") {
      oldPhoto = staff.photo;
      data.photo = null;
    }

    let oldResume = null;
    if (resumeFile) {
      try {
        uploadedResume = await uploadStaffResume(resumeFile);
        oldResume = staff.resume;
        data.resume = uploadedResume;
      } catch (uploadErr) {
        console.error("Cloudinary resume upload failed:", uploadErr);
        return res.status(500).json({ success: false, message: "Failed to upload new resume" });
      }
    } else if (req.body?.removeResume === true || req.body?.removeResume === "true") {
      oldResume = staff.resume;
      data.resume = null;
    }

    staff.set(data);
    const updated = await staff.save(); // save() so validation + address sync hook run
    await updated.populate("role", "name tabs");

    if (oldPhoto) await deleteStaffPhoto(oldPhoto);
    if (oldResume) await deleteStaffResume(oldResume);

    return res.status(200).json({ success: true, message: "Staff updated successfully", data: toSafeStaff(updated) });
  } catch (error) {
    if (uploadedPhoto) await deleteStaffPhoto(uploadedPhoto);
    if (uploadedResume) await deleteStaffResume(uploadedResume);
    console.error("updateStaff error:", error);
    return staffErrorResponse(res, error, "Failed to update staff");
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// DELETE — DELETE /api/tour/staff/:id/delete
// ──────────────────────────────────────────────────────────────────────────────
const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid staff id" });
    }
    const oid = new mongoose.Types.ObjectId(id);

    // Ticket history (raised by / raised to) or picked-up enquiry irundhaa delete panna koodadhu
    const hasTickets = await Query.exists({ $or: [{ raisedBy: oid }, { raisedTo: oid }] });
    const hasEnquiries = await enquiryModel.collection.findOne(
      { "pickedUpBy.staffId": { $in: [oid, id] } },
      { projection: { _id: 1 } }
    );
    if (hasTickets || hasEnquiries) {
      return res.status(409).json({
        success: false,
        message: "This staff member has tickets or enquiries in history. Mark them as Inactive (or turn off login) instead of deleting.",
      });
    }

    const staff = await staffModel.findByIdAndDelete(id);
    if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });

    if (staff.photo) await deleteStaffPhoto(staff.photo);
    if (staff.resume) await deleteStaffResume(staff.resume);

    return res.status(200).json({ success: true, message: "Staff deleted successfully" });
  } catch (error) {
    console.error("deleteStaff error:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// ───────── ADD 2: paste this function just ABOVE "export {" at the bottom ─────────
// GET /api/tour/staff/:id/open-work
// Staff ah Inactive pannum bodhu — avanga kitta innum open ah irukura work.
// GET /api/tour/staff/:id/open-work
const getStaffOpenWork = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid staff id" });
    }
    const oid = new mongoose.Types.ObjectId(id);

    const tickets = await Query.find({ raisedTo: oid, status: { $nin: ["close", "reject"] } })
      .select("ticketNo subject status tnr createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const enquiries = await enquiryModel.collection
      .find(
        { status: "pending", isPickedUp: true, "pickedUpBy.staffId": { $in: [oid, id] } },
        { projection: { fullName: 1, fitCode: 1, destination: 1, pickedUpAt: 1 } }
      )
      .sort({ pickedUpAt: -1 })
      .toArray();
    const hasHistory =
      !!(await Query.exists({ $or: [{ raisedBy: oid }, { raisedTo: oid }] })) ||
      !!(await enquiryModel.collection.findOne({ "pickedUpBy.staffId": { $in: [oid, id] } }, { projection: { _id: 1 } }));

    return res.status(200).json({ success: true, tickets, enquiries, total: tickets.length + enquiries.length, hasHistory });
  } catch (error) {
    console.error("getStaffOpenWork error:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

export {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  getStaffOpenWork,

};