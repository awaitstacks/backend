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
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract"],
      default: "Full-time",
    },
    workLocation: { type: String, trim: true },
    shiftStart: { type: String, trim: true, default: null }, // "09:30"
    shiftEnd: { type: String, trim: true, default: null },   // "18:00"

    // ---------- Contact details ----------
    mobileNumber: { type: String, required: true, trim: true },
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

    // ---------- Job details ----------
    keyResponsibilities: { type: [String], default: [] },
    skills: { type: [String], default: [] }, // MS Office, Tally, Typing...
    qualification: { type: String, trim: true },
    experience: { type: String, trim: true },
    accessLevels: {
      type: [String],
      enum: [
        "Office keys", "Cash counter", "Accounting software",
        "Email and admin panel", "Staff records", "Visitor register",
        "Server room", "Stationery store",
      ],
      default: [],
    },
    otherAccess: { type: String, trim: true },
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
    this.employeeId = `EMP${String(nextNum).padStart(4, "0")}`;
  }
  next();
});

const staffModel = mongoose.models.staff || mongoose.model("staff", staffSchema);
export default staffModel;