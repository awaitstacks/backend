import jwt from "jsonwebtoken";
import staffModel from "../models/staffProfileModel.js";
import "../models/staffRoleModel.js";
import authTour from "./authTour.js";
import authAdmin from "./authAdmin.js";
import { claimTeamTicket } from "../controllers/ticketTnrController.js";

// Ticket status maathura request (Pickup / Processing / Close / Reject) ah?
const STATUS_URL = /\/queries\/([a-f0-9]{24})\/(pickup|processing|close|reject)\/?(\?|$)/i;

// Staff login ku mattum: staffGate apram, team ticket status maathuna → avanga per la pick.
// Routes la edhuvum maatha venaam.
const staffThenClaim = (tabKey) => (req, res, next) =>
  staffGate(tabKey)(req, res, (err) => {
    if (err) return next(err);
    const m = req.method === "PATCH" && STATUS_URL.exec(req.originalUrl || "");
    if (!m) return next();
    req.claimQueryId = m[1];
    return claimTeamTicket(req, res, next);
  });

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
  if (stoken && !ttoken) return staffThenClaim(tabKey)(req, res, next);
  return authTour(req, res, next);
};

// Admin → UNGA PAZHAYA authAdmin apdiye | Staff (stoken mattum) → staffGate
const authAdminOrStaff = (tabKey) => (req, res, next) => {
  const { atoken, stoken } = req.headers;
  if (stoken && !atoken) return staffThenClaim(tabKey)(req, res, next);
  return authAdmin(req, res, next);
};

// ══════════════════════════════════════════════════════════════════════════════
// "Raised by" lock — staff request na, form la enna anuppinaalum login staff dhaan.
// Admin / Tour Admin request ku edhuvum pannaadhu (next() mattum).
// ══════════════════════════════════════════════════════════════════════════════

// Tickets: raisedBy = staff _id. authTour / authAdmin + multer KU APPURAM podanum.
const forceRaisedByStaff = (req, res, next) => {
  if (req.userType === "staff" && req.staff) {
    req.body = req.body || {};
    req.body.raisedBy = String(req.staff._id);
  }
  next();
};

// Create Booking (auto): raisedBy = { name, employeeId }.
// Indha route ku auth illa — stoken irundha mattum check pannum.
const stampStaffRaisedBy = async (req, res, next) => {
  const { stoken, ttoken, atoken } = req.headers;
  if (!stoken || ttoken || atoken) return next();
  try {
    const staff = await loadStaff(stoken);
    if (!staff) {
      return res.status(401).json({ success: false, message: "Your login is disabled or expired. Please login again." });
    }
    req.staff = staff;
    req.userType = "staff";
    req.body = req.body || {};
    req.body.raisedBy = { name: staff.fullName || "", employeeId: staff.employeeId || "" };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token. Please login again." });
  }
};

export { authStaff, authTourOrStaff, authAdminOrStaff, forceRaisedByStaff, stampStaffRaisedBy };