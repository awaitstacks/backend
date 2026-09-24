import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    // ---------- Basic details ----------
    fullName: { type: String, required: true, trim: true },
    // Auto-generated (EMP0001, EMP0002...) when not sent
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    photo: { type: String, trim: true, default: null },
    designation: { type: String, required: true, trim: true },
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

    // ---------- Contact details ----------
    mobileNumber: { type: String, required: true, trim: true },
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
  },
  { timestamps: true }
);

// Auto-generate employeeId when staff is first created + sync permanent address
staffSchema.pre("save", async function (next) {
  if (this.sameAsCurrent) {
    this.permanentAddress = this.currentAddress;
  }

  if (this.isNew && !this.employeeId) {
    const last = await mongoose.model("staff")
      .findOne({ employeeId: { $exists: true, $ne: null } })
      .sort({ employeeId: -1 })
      .select("employeeId");

    let nextNum = 1;
    if (last?.employeeId) {
      const num = parseInt(last.employeeId.replace("EMP", ""), 10);
      if (!isNaN(num)) nextNum = num + 1;
    }
    this.employeeId = `GVEMP${String(nextNum).padStart(3, "0")}`;
  }
  next();
});

const staffModel = mongoose.models.staff || mongoose.model("staff", staffSchema);
export default staffModel;