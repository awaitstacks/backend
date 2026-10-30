import jwt from "jsonwebtoken";
import staffModel from "../models/staffProfileModel.js";
import "../models/staffRoleModel.js";
import authTour from "./authTour.js";
import authAdmin from "./authAdmin.js";

// stoken → staff (active + login ON + role irundha mattum)
const loadStaff = async (stoken) => {
  const decoded = jwt.verify(stoken, process.env.STAFF_JWT_SECRET);
  if (decoded.type !== "staff") return null;
  const staff = await staffModel.findById(decoded.id).populate("role", "name tabs");
  if (!staff || staff.status === "Inactive" || !staff.loginEnabled || !staff.role) return null;
  return staff;
};

// Staff check
const staffGate = (tabKey) => async (req, res, next) => {
  try {
    const staff = await loadStaff(req.headers.stoken);
    if (!staff) {
      return res.status(401).json({ success: false, message: "Your login is disabled or expired. Please login again." });
    }
    const tabs = staff.role?.tabs || [];
    if (tabKey && !tabs.includes(tabKey)) {
      return res.status(403).json({ success: false, message: "You don't have access to this section." });
    }
    req.staff = staff;
    req.userType = "staff";
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token. Please login again." });
  }
};

// Staff ku mattum routes (My Profile)
const authStaff = (req, res, next) => {
  if (!req.headers.stoken) {
    return res.status(401).json({ success: false, message: "Not Authorized. Please login again." });
  }
  return staffGate()(req, res, next);
};

// Tour Admin → UNGA PAZHAYA authTour apdiye | Staff (stoken mattum) → staffGate
const authTourOrStaff = (tabKey) => (req, res, next) => {
  const { ttoken, stoken } = req.headers;
  if (stoken && !ttoken) return staffGate(tabKey)(req, res, next);
  return authTour(req, res, next);
};

// Admin → UNGA PAZHAYA authAdmin apdiye | Staff (stoken mattum) → staffGate
const authAdminOrStaff = (tabKey) => (req, res, next) => {
  const { atoken, stoken } = req.headers;
  if (stoken && !atoken) return staffGate(tabKey)(req, res, next);
  return authAdmin(req, res, next);
};

export { authStaff, authTourOrStaff, authAdminOrStaff };