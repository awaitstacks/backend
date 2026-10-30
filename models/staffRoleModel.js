import mongoose from "mongoose";

// Staff roles — Tour Admin (HR) create pannuvaanga.
// tabs = indha role ku theriyura tab keys (eg: ["bookings", "enquiry", "queries"])
const staffRoleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true, default: "" },
    tabs: { type: [String], default: [] },
  },
  { timestamps: true }
);

const staffRoleModel =
  mongoose.models.staffRole || mongoose.model("staffRole", staffRoleSchema);
export default staffRoleModel;