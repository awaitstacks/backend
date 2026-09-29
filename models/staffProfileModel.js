// // import mongoose from "mongoose";

// // // ────────────────────────────────────────────────
// // // Employment history — ovvoru join / relieve um oru "stint"
// // //   { joinedOn, relievedOn (null = ippo work panraanga), relievingReason }
// // // ────────────────────────────────────────────────
// // const employmentStintSchema = new mongoose.Schema(
// //   {
// //     joinedOn: { type: Date, required: true },
// //     relievedOn: { type: Date, default: null },
// //     relievingReason: { type: String, trim: true, default: "" },
// //   },
// //   { _id: true },
// // );

// // const staffSchema = new mongoose.Schema(
// //   {
// //     // ---------- Basic details ----------
// //     fullName: { type: String, required: true, trim: true },
// //     // Auto-generated (EMP0001, EMP0002...) when not sent
// //     employeeId: {
// //       type: String,
// //       unique: true,
// //       sparse: true,
// //       trim: true,
// //       uppercase: true,
// //     },
// //     photo: { type: String, trim: true, default: null },
// //     designation: { type: String, required: true, trim: true },
// //     department: { type: String, trim: true },
// //     reportingManager: { type: String, trim: true },
// //     dateOfJoining: { type: Date, default: null }, // ← eppavum CURRENT joining date
// //     dateOfBirth: { type: Date, default: null },
// //     gender: {
// //       type: String,
// //       enum: ["Male", "Female", "Other"],
// //       default: null,
// //     },
// //     age: { type: Number, default: null },
// //     maritalStatus: {
// //       type: String,
// //       enum: ["Single", "Married", "Divorced", "Widowed"],
// //       default: null,
// //     },
// //     // Active / Inactive toggle
// //     status: {
// //       type: String,
// //       enum: ["Active", "Inactive"],
// //       default: "Active",
// //     },
// //     // Which side of the team this profile belongs to — lets admin & field
// //     // (tour manager) profiles be created the same way but filtered/told apart
// //     staffType: {
// //       type: String,
// //       enum: ["Admin Staff", "Field Staff"],
// //       default: "Admin Staff",
// //     },

// //     // ---------- Relieve / rejoin ----------
// //     // Inactive aana bodhu — kadaisi relieving date + reason
// //     relievedOn: { type: Date, default: null },
// //     relievingReason: { type: String, trim: true, default: "" },
// //     // Ellaa join → relieve um, pazhasu mudhal la (kadaisi = current)
// //     employmentHistory: { type: [employmentStintSchema], default: [] },

// //     // ---------- Contact details ----------
// //     mobileNumber: { type: String, required: true, trim: true },
// //     alternateNumber: { type: String, trim: true },
// //     whatsappNumber: { type: String, trim: true },
// //     email: {
// //       type: String,
// //       trim: true,
// //       lowercase: true,
// //     },
// //     currentAddress: { type: String, trim: true },
// //     // When true, permanentAddress is copied from currentAddress on save
// //     sameAsCurrent: { type: Boolean, default: false },
// //     permanentAddress: { type: String, trim: true },
// //     emergencyName: { type: String, trim: true },
// //     emergencyRelation: { type: String, trim: true },
// //     emergencyNumber: { type: String, trim: true },

// //     // ---------- Study details ----------
// //     qualification: { type: String, trim: true },
// //     specialization: { type: String, trim: true }, // subject
// //     collegeOrUniversity: { type: String, trim: true },
// //     yearOfPassing: { type: String, trim: true },
// //     experience: { type: String, trim: true }, // Working experience
// //     skills: { type: [String], default: [] }, // MS Office, Tally, Typing...
// //   },
// //   { timestamps: true }
// // );

// // // ════════════════════════════════════════════════════════════════
// // //  Employment history logic — save() um findByIdAndUpdate um idha use pannum
// // // ════════════════════════════════════════════════════════════════
// // const toDate = (v) => {
// //   if (!v) return null;
// //   const d = new Date(v);
// //   return Number.isNaN(d.getTime()) ? null : d;
// // };
// // const sameDay = (a, b) => {
// //   const x = toDate(a);
// //   const y = toDate(b);
// //   return !!x && !!y && x.toISOString().slice(0, 10) === y.toISOString().slice(0, 10);
// // };

// // /**
// //  * prev = DB la irukura staff (status, dateOfJoining, relievedOn, employmentHistory, createdAt)
// //  * next = puthu values (status, dateOfJoining, relievedOn, relievingReason)
// //  * Return: DB la set panna vendiya fields
// //  */
// // export function computeEmployment(prev, next) {
// //   const history = (prev.employmentHistory || []).map((h) => ({
// //     joinedOn: toDate(h.joinedOn),
// //     relievedOn: toDate(h.relievedOn),
// //     relievingReason: h.relievingReason || "",
// //   }));

// //   // Pazhaya staff — history illana ippo irukura details la irundhu first stint
// //   if (!history.length) {
// //     history.push({
// //       joinedOn: toDate(prev.dateOfJoining) || toDate(prev.createdAt) || new Date(),
// //       relievedOn: prev.status === "Inactive" ? toDate(prev.relievedOn) || toDate(prev.updatedAt) || new Date() : null,
// //       relievingReason: prev.status === "Inactive" ? prev.relievingReason || "" : "",
// //     });
// //   }

// //   const current = history[history.length - 1];
// //   const wasActive = prev.status !== "Inactive";
// //   const nowActive = next.status !== "Inactive";
// //   const newJoin = toDate(next.dateOfJoining);
// //   const out = {};

// //   if (wasActive && !nowActive) {
// //     // ── RELIEVE: current stint close ──
// //     current.relievedOn = toDate(next.relievedOn) || new Date();
// //     current.relievingReason = String(next.relievingReason || "").trim();
// //     out.relievedOn = current.relievedOn;
// //     out.relievingReason = current.relievingReason;
// //   } else if (!wasActive && nowActive) {
// //     // ── REJOIN: pazhaya stint apdiye, puthu stint add ──
// //     const joinedOn = newJoin && !sameDay(newJoin, prev.dateOfJoining) ? newJoin : new Date();
// //     if (!current.relievedOn) current.relievedOn = toDate(prev.relievedOn) || joinedOn;
// //     history.push({ joinedOn, relievedOn: null, relievingReason: "" });
// //     out.dateOfJoining = joinedOn;
// //     out.relievedOn = null;
// //     out.relievingReason = "";
// //   } else if (nowActive && newJoin && !sameDay(newJoin, current.joinedOn)) {
// //     // ── Active la irukkum bodhu joining date correct panraanga ──
// //     current.joinedOn = newJoin;
// //   } else if (!nowActive && next.relievedOn && !sameDay(next.relievedOn, current.relievedOn)) {
// //     // ── Inactive la irukkum bodhu relieving date / reason correct ──
// //     current.relievedOn = toDate(next.relievedOn);
// //     if (next.relievingReason !== undefined) current.relievingReason = String(next.relievingReason).trim();
// //     out.relievedOn = current.relievedOn;
// //     out.relievingReason = current.relievingReason;
// //   }

// //   out.employmentHistory = history;
// //   return out;
// // }

// // // Loaded doc oda pazhaya values ah nyabagam vechukka (save() ku)
// // staffSchema.post("init", function () {
// //   this.$locals.prevEmployment = {
// //     status: this.status,
// //     dateOfJoining: this.dateOfJoining,
// //     relievedOn: this.relievedOn,
// //     relievingReason: this.relievingReason,
// //     createdAt: this.createdAt,
// //     updatedAt: this.updatedAt,
// //     employmentHistory: (this.employmentHistory || []).map((h) => (h.toObject ? h.toObject() : h)),
// //   };
// // });

// // // ── save() / create() ──
// // staffSchema.pre("save", function () {
// //   if (this.isNew) {
// //     if (!this.employmentHistory?.length) {
// //       this.employmentHistory = [
// //         {
// //           joinedOn: this.dateOfJoining || new Date(),
// //           relievedOn: this.status === "Inactive" ? this.relievedOn || new Date() : null,
// //           relievingReason: this.status === "Inactive" ? this.relievingReason || "" : "",
// //         },
// //       ];
// //     }
// //     return;
// //   }
// //   const prev = this.$locals.prevEmployment;
// //   const touched = ["status", "dateOfJoining", "relievedOn", "relievingReason"].some((k) => this.isModified(k));
// //   if (!prev || (!touched && this.employmentHistory?.length)) return;

// //   const result = computeEmployment(prev, {
// //     status: this.status,
// //     dateOfJoining: this.dateOfJoining,
// //     relievedOn: this.relievedOn,
// //     relievingReason: this.relievingReason,
// //   });
// //   Object.assign(this, result);
// // });

// // // ── findByIdAndUpdate / findOneAndUpdate / updateOne ──
// // staffSchema.pre(["findOneAndUpdate", "updateOne"], async function () {
// //   const update = this.getUpdate() || {};
// //   const src = update.$set || update;
// //   const keys = ["status", "dateOfJoining", "relievedOn", "relievingReason"];
// //   if (!keys.some((k) => Object.prototype.hasOwnProperty.call(src, k))) return;

// //   const prev = await this.model
// //     .findOne(this.getQuery())
// //     .select("status dateOfJoining relievedOn relievingReason employmentHistory createdAt updatedAt")
// //     .lean();
// //   if (!prev) return;

// //   const pick = (k) => (Object.prototype.hasOwnProperty.call(src, k) ? src[k] : prev[k]);
// //   const result = computeEmployment(prev, {
// //     status: pick("status"),
// //     dateOfJoining: pick("dateOfJoining"),
// //     relievedOn: Object.prototype.hasOwnProperty.call(src, "relievedOn") ? src.relievedOn : undefined,
// //     relievingReason: Object.prototype.hasOwnProperty.call(src, "relievingReason") ? src.relievingReason : undefined,
// //   });

// //   if (update.$set) Object.assign(update.$set, result);
// //   else Object.assign(update, result);
// //   this.setUpdate(update);
// // });

// // // Auto-generate employeeId when staff is first created + sync permanent address
// // staffSchema.pre("save", async function (next) {
// //   if (this.sameAsCurrent) {
// //     this.permanentAddress = this.currentAddress;
// //   }

// //   if (this.isNew && !this.employeeId) {
// //     const last = await mongoose.model("staff")
// //       .findOne({ employeeId: { $exists: true, $ne: null } })
// //       .sort({ employeeId: -1 })
// //       .select("employeeId");

// //     let nextNum = 1;
// //     if (last?.employeeId) {
// //       const num = parseInt(last.employeeId.replace("EMP", ""), 10);
// //       if (!isNaN(num)) nextNum = num + 1;
// //     }
// //     this.employeeId = `GVEMP${String(nextNum).padStart(3, "0")}`;
// //   }
// //   next();
// // });

// // const staffModel = mongoose.models.staff || mongoose.model("staff", staffSchema);
// // export default staffModel;``

// import mongoose from "mongoose";

// const staffSchema = new mongoose.Schema(
//   {
//     // ---------- Basic details ----------
//     fullName: { type: String, trim: true },
//     // Auto-generated (EMP0001, EMP0002...) when not sent
//     employeeId: {
//       type: String,
//       unique: true,
//       sparse: true,
//       trim: true,
//       uppercase: true,
//     },
//     photo: { type: String, trim: true, default: null },
//     resume: { type: String, trim: true, default: null },
//     designation: { type: String, trim: true },
//     department: { type: String, trim: true },
//     reportingManager: { type: String, trim: true },
//     dateOfJoining: { type: Date, default: null },
//     dateOfBirth: { type: Date, default: null },
//     gender: {
//       type: String,
//       enum: ["Male", "Female", "Other"],
//       default: null,
//     },
//     age: { type: Number, default: null },
//     maritalStatus: {
//       type: String,
//       enum: ["Single", "Married", "Divorced", "Widowed"],
//       default: null,
//     },
//     // Active / Inactive toggle
//     status: {
//       type: String,
//       enum: ["Active", "Inactive"],
//       default: "Active",
//     },
//     // Which side of the team this profile belongs to — lets admin & field
//     // (tour manager) profiles be created the same way but filtered/told apart
//     staffType: {
//       type: String,
//       enum: ["Admin Staff", "Field Staff"],
//       default: "Admin Staff",
//     },

//     // ---------- Contact details ----------
//     mobileNumber: { type: String, trim: true },
//     alternateNumber: { type: String, trim: true },
//     whatsappNumber: { type: String, trim: true },
//     email: {
//       type: String,
//       trim: true,
//       lowercase: true,
//     },
//     currentAddress: { type: String, trim: true },
//     // When true, permanentAddress is copied from currentAddress on save
//     sameAsCurrent: { type: Boolean, default: false },
//     permanentAddress: { type: String, trim: true },
//     emergencyName: { type: String, trim: true },
//     emergencyRelation: { type: String, trim: true },
//     emergencyNumber: { type: String, trim: true },

//     // ---------- Study details ----------
//     qualification: { type: String, trim: true },
//     specialization: { type: String, trim: true }, // subject
//     collegeOrUniversity: { type: String, trim: true },
//     yearOfPassing: { type: String, trim: true },
//     experience: { type: String, trim: true }, // Working experience
//     skills: { type: [String], default: [] }, // MS Office, Tally, Typing...

//     // ---------- Identity documents ----------
//     aadharNumber: {
//       type: String,
//       trim: true,
//       validate: {
//         validator: (v) => !v || /^\d{12}$/.test(v),
//         message: "Aadhar number must be exactly 12 digits",
//       },
//     },
//     panNumber: {
//       type: String,
//       trim: true,
//       uppercase: true,
//       validate: {
//         validator: (v) => !v || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v),
//         message: "Enter a valid PAN number (e.g. ABCDE1234F)",
//       },
//     },

//     // ---------- Bank details ----------
//     bankAccountNumber: { type: String, trim: true },
//     bankIfscCode: {
//       type: String,
//       trim: true,
//       uppercase: true,
//       validate: {
//         validator: (v) => !v || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v),
//         message: "Enter a valid IFSC code (e.g. HDFC0001234)",
//       },
//     },
//     bankAccountName: { type: String, trim: true },
//     bankBranchName: { type: String, trim: true },
//     bankBranchCode: { type: String, trim: true },
//     bankSwiftCode: { type: String, trim: true, uppercase: true },
//     bankAccountType: {
//       type: String,
//       enum: ["Savings", "Current", "Salary", "BSBDA / Zero Balance", "NRI Account"],
//       default: null,
//     },
//   },
//   { timestamps: true }
// );

// // Auto-generate employeeId when staff is first created + sync permanent address
// staffSchema.pre("save", async function (next) {
//   if (this.sameAsCurrent) {
//     this.permanentAddress = this.currentAddress;
//   }

//   if (this.isNew && !this.employeeId) {
//     // Only look at IDs that actually match our GVEMP### pattern — a stray
//     // manually typed ID must never throw off the auto-numbering. padStart
//     // never truncates, so 999 → 1000 rolls over to a 4-digit code on its
//     // own with no error.
//     const docs = await mongoose.model("staff")
//       .find({ employeeId: { $regex: /^GVEMP\d+$/i } })
//       .select("employeeId")
//       .lean();

//     let maxNum = 0;
//     docs.forEach((d) => {
//       const match = /^GVEMP(\d+)$/i.exec(d.employeeId || "");
//       if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
//     });
//     this.employeeId = `GVEMP${String(maxNum + 1).padStart(3, "0")}`;
//   }
//   next();
// });

// const staffModel = mongoose.models.staff || mongoose.model("staff", staffSchema);
// export default staffModel;

import mongoose from "mongoose";

// ────────────────────────────────────────────────
// Employment history — ovvoru join / relieve um oru "stint"
//   { joinedOn, relievedOn (null = ippo work panraanga), relievingReason }
// ────────────────────────────────────────────────
const employmentStintSchema = new mongoose.Schema(
  {
    joinedOn: { type: Date, required: true },
    relievedOn: { type: Date, default: null },
    relievingReason: { type: String, trim: true, default: "" },
  },
  { _id: true },
);

const staffSchema = new mongoose.Schema(
  {
    // ---------- Basic details ----------
    fullName: { type: String, trim: true },
    // Auto-generated (EMP0001, EMP0002...) when not sent
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    photo: { type: String, trim: true, default: null },
    resume: { type: String, trim: true, default: null },
    designation: { type: String, trim: true },
    department: { type: String, trim: true },
    reportingManager: { type: String, trim: true },
    dateOfJoining: { type: Date, default: null },
    dateOfBirth: { type: Date, default: null },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: null,
    },
    age: { type: Number, default: null },
    maritalStatus: {
      type: String,
      enum: ["Single", "Married", "Divorced", "Widowed"],
      default: null,
    },
    // Active / Inactive toggle
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    // Which side of the team this profile belongs to — lets admin & field
    // (tour manager) profiles be created the same way but filtered/told apart
    staffType: {
      type: String,
      enum: ["Admin Staff", "Field Staff"],
      default: "Admin Staff",
    },

    // ---------- Relieve / rejoin ----------
    // Inactive aana bodhu — kadaisi relieving date + reason
    relievedOn: { type: Date, default: null },
    relievingReason: { type: String, trim: true, default: "" },
    // Ellaa join → relieve um, pazhasu mudhal la (kadaisi = current)
    employmentHistory: { type: [employmentStintSchema], default: [] },

    // ---------- Contact details ----------
    mobileNumber: { type: String, trim: true },
    alternateNumber: { type: String, trim: true },
    whatsappNumber: { type: String, trim: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    currentAddress: { type: String, trim: true },
    // When true, permanentAddress is copied from currentAddress on save
    sameAsCurrent: { type: Boolean, default: false },
    permanentAddress: { type: String, trim: true },
    emergencyName: { type: String, trim: true },
    emergencyRelation: { type: String, trim: true },
    emergencyNumber: { type: String, trim: true },

    // ---------- Study details ----------
    qualification: { type: String, trim: true },
    specialization: { type: String, trim: true }, // subject
    collegeOrUniversity: { type: String, trim: true },
    yearOfPassing: { type: String, trim: true },
    experience: { type: String, trim: true }, // Working experience
    skills: { type: [String], default: [] }, // MS Office, Tally, Typing...

    // ---------- Identity documents ----------
    aadharNumber: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => !v || /^\d{12}$/.test(v),
        message: "Aadhar number must be exactly 12 digits",
      },
    },
    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
      validate: {
        validator: (v) => !v || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v),
        message: "Enter a valid PAN number (e.g. ABCDE1234F)",
      },
    },

    // ---------- Bank details ----------
    bankAccountNumber: { type: String, trim: true },
    bankIfscCode: {
      type: String,
      trim: true,
      uppercase: true,
      validate: {
        validator: (v) => !v || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v),
        message: "Enter a valid IFSC code (e.g. HDFC0001234)",
      },
    },
    bankAccountName: { type: String, trim: true },
    bankBranchName: { type: String, trim: true },
    bankBranchCode: { type: String, trim: true },
    bankSwiftCode: { type: String, trim: true, uppercase: true },
    bankAccountType: {
      type: String,
      enum: ["Savings", "Current", "Salary", "BSBDA / Zero Balance", "NRI Account"],
      default: null,
    },
  },
  { timestamps: true }
);

// ════════════════════════════════════════════════════════════════
//  Employment history logic — save() um findByIdAndUpdate um idha use pannum
// ════════════════════════════════════════════════════════════════
const toDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const sameDay = (a, b) => {
  const x = toDate(a);
  const y = toDate(b);
  return !!x && !!y && x.toISOString().slice(0, 10) === y.toISOString().slice(0, 10);
};

/**
 * prev = DB la irukura staff (status, dateOfJoining, relievedOn, employmentHistory, createdAt)
 * next = puthu values (status, dateOfJoining, relievedOn, relievingReason)
 * Return: DB la set panna vendiya fields
 */
export function computeEmployment(prev, next) {
  const history = (prev.employmentHistory || []).map((h) => ({
    joinedOn: toDate(h.joinedOn),
    relievedOn: toDate(h.relievedOn),
    relievingReason: h.relievingReason || "",
  }));

  // Pazhaya staff — history illana ippo irukura details la irundhu first stint
  if (!history.length) {
    history.push({
      joinedOn: toDate(prev.dateOfJoining) || toDate(prev.createdAt) || new Date(),
      relievedOn: prev.status === "Inactive" ? toDate(prev.relievedOn) || toDate(prev.updatedAt) || new Date() : null,
      relievingReason: prev.status === "Inactive" ? prev.relievingReason || "" : "",
    });
  }

  const current = history[history.length - 1];
  const wasActive = prev.status !== "Inactive";
  const nowActive = next.status !== "Inactive";
  const newJoin = toDate(next.dateOfJoining);
  const out = {};

  if (wasActive && !nowActive) {
    // ── RELIEVE: current stint close ──
    current.relievedOn = toDate(next.relievedOn) || new Date();
    current.relievingReason = String(next.relievingReason || "").trim();
    out.relievedOn = current.relievedOn;
    out.relievingReason = current.relievingReason;
  } else if (!wasActive && nowActive) {
    // ── REJOIN: pazhaya stint apdiye, puthu stint add ──
    const joinedOn = newJoin && !sameDay(newJoin, prev.dateOfJoining) ? newJoin : new Date();
    if (!current.relievedOn) current.relievedOn = toDate(prev.relievedOn) || joinedOn;
    history.push({ joinedOn, relievedOn: null, relievingReason: "" });
    out.dateOfJoining = joinedOn;
    out.relievedOn = null;
    out.relievingReason = "";
  } else if (nowActive && newJoin && !sameDay(newJoin, current.joinedOn)) {
    // ── Active la irukkum bodhu joining date correct panraanga ──
    current.joinedOn = newJoin;
  } else if (!nowActive && next.relievedOn && !sameDay(next.relievedOn, current.relievedOn)) {
    // ── Inactive la irukkum bodhu relieving date / reason correct ──
    current.relievedOn = toDate(next.relievedOn);
    if (next.relievingReason !== undefined) current.relievingReason = String(next.relievingReason).trim();
    out.relievedOn = current.relievedOn;
    out.relievingReason = current.relievingReason;
  }

  out.employmentHistory = history;
  return out;
}

// Loaded doc oda pazhaya values ah nyabagam vechukka (save() ku)
staffSchema.post("init", function () {
  this.$locals.prevEmployment = {
    status: this.status,
    dateOfJoining: this.dateOfJoining,
    relievedOn: this.relievedOn,
    relievingReason: this.relievingReason,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    employmentHistory: (this.employmentHistory || []).map((h) => (h.toObject ? h.toObject() : h)),
  };
});

// ── save() / create() ──
staffSchema.pre("save", function () {
  if (this.isNew) {
    if (!this.employmentHistory?.length) {
      this.employmentHistory = [
        {
          joinedOn: this.dateOfJoining || new Date(),
          relievedOn: this.status === "Inactive" ? this.relievedOn || new Date() : null,
          relievingReason: this.status === "Inactive" ? this.relievingReason || "" : "",
        },
      ];
    }
    return;
  }
  const prev = this.$locals.prevEmployment;
  const touched = ["status", "dateOfJoining", "relievedOn", "relievingReason"].some((k) => this.isModified(k));
  if (!prev || (!touched && this.employmentHistory?.length)) return;

  const result = computeEmployment(prev, {
    status: this.status,
    dateOfJoining: this.dateOfJoining,
    relievedOn: this.relievedOn,
    relievingReason: this.relievingReason,
  });
  Object.assign(this, result);
});

// ── findByIdAndUpdate / findOneAndUpdate / updateOne (safety net — namma
//    controller save() use pannudhu, aana vera edhavadhu code idha
//    query-based update panna try pannaalum, history correct-ah irukkum) ──
staffSchema.pre(["findOneAndUpdate", "updateOne"], async function () {
  const update = this.getUpdate() || {};
  const src = update.$set || update;
  const keys = ["status", "dateOfJoining", "relievedOn", "relievingReason"];
  if (!keys.some((k) => Object.prototype.hasOwnProperty.call(src, k))) return;

  const prev = await this.model
    .findOne(this.getQuery())
    .select("status dateOfJoining relievedOn relievingReason employmentHistory createdAt updatedAt")
    .lean();
  if (!prev) return;

  const pick = (k) => (Object.prototype.hasOwnProperty.call(src, k) ? src[k] : prev[k]);
  const result = computeEmployment(prev, {
    status: pick("status"),
    dateOfJoining: pick("dateOfJoining"),
    relievedOn: Object.prototype.hasOwnProperty.call(src, "relievedOn") ? src.relievedOn : undefined,
    relievingReason: Object.prototype.hasOwnProperty.call(src, "relievingReason") ? src.relievingReason : undefined,
  });

  if (update.$set) Object.assign(update.$set, result);
  else Object.assign(update, result);
  this.setUpdate(update);
});

// Auto-generate employeeId when staff is first created + sync permanent address
staffSchema.pre("save", async function (next) {
  if (this.sameAsCurrent) {
    this.permanentAddress = this.currentAddress;
  }

  if (this.isNew && !this.employeeId) {
    // Only look at IDs that actually match our GVEMP### pattern — a stray
    // manually typed ID must never throw off the auto-numbering. padStart
    // never truncates, so 999 → 1000 rolls over to a 4-digit code on its
    // own with no error.
    const docs = await mongoose.model("staff")
      .find({ employeeId: { $regex: /^GVEMP\d+$/i } })
      .select("employeeId")
      .lean();

    let maxNum = 0;
    docs.forEach((d) => {
      const match = /^GVEMP(\d+)$/i.exec(d.employeeId || "");
      if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
    });
    this.employeeId = `GVEMP${String(maxNum + 1).padStart(3, "0")}`;
  }
  next();
});

const staffModel = mongoose.models.staff || mongoose.model("staff", staffSchema);
export default staffModel;