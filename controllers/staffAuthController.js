import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import staffModel from "../models/staffProfileModel.js";
import "../models/staffRoleModel.js"; // populate("role") ku model register aaganum

// ══════════════════════════════════════════════════════════════════════════════
// STAFF PORTAL (staff.gvtourplanners.com) — staff login, forgot password, my profile
// Staff token → STAFF_JWT_SECRET (Tour Admin JWT_SECRET illa — authTour la pass aagaadhu)
// ══════════════════════════════════════════════════════════════════════════════

const RESET_REQUEST_GAP_MS = 10 * 60 * 1000; // oru staff 10 min ku oru thadava mattum

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/staff/login   { username, password }
// ──────────────────────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────────
// POST /api/staff/login   { username, password }
// Ovvoru case kum thani message — login set aagala / disabled / role illa / password thappu
// ──────────────────────────────────────────────────────────────────────────────
const loginStaff = async (req, res) => {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    // Username illana employee ID (GVEMP003) vechu kooda staff ah kandupidi — enna kuraiyudhu nu solla
    const staff = await staffModel
      .findOne({ $or: [{ username }, { employeeId: username.toUpperCase() }] })
      .select("+password")
      .populate("role", "name tabs");

    if (!staff) {
      return res.status(401).json({ success: false, message: "Incorrect username. Please check and try again." });
    }
    if (staff.status === "Inactive") {
      return res.status(403).json({ success: false, message: "This account is inactive. Please contact HR." });
    }
    if (!staff.username || !staff.password) {
      return res.status(403).json({ success: false, message: "Your login has not been set up yet. Please contact HR." });
    }
    if (staff.username !== username) {
      return res.status(401).json({ success: false, message: "Incorrect username. Please check and try again." });
    }
    if (!(await bcrypt.compare(password, staff.password))) {
      return res.status(401).json({ success: false, message: "Incorrect password. Please try again." });
    }
    if (!staff.loginEnabled) {
      return res.status(403).json({ success: false, message: "Your login is not enabled yet. Please contact HR." });
    }
    if (!staff.role || !(staff.role.tabs || []).length) {
      return res.status(403).json({ success: false, message: "No role has been assigned to your login yet. Please contact HR." });
    }

    await staffModel.updateOne({ _id: staff._id }, { $set: { lastLogin: new Date() } });

    const token = jwt.sign({ id: staff._id, type: "staff" }, process.env.STAFF_JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(200).json({
      success: true,
      token,
      staff: {
        id: staff._id,
        fullName: staff.fullName,
        employeeId: staff.employeeId,
        photo: staff.photo,
        role: staff.role?.name || null,
        tabs: staff.role?.tabs || [],
      },
    });
  } catch (error) {
    console.error("loginStaff error:", error);
    return res.status(500).json({ success: false, message: "Login failed. Please try again." });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/staff/forgot-password   { username }
// Tour Admin Staff Profile la andha staff card highlight aagum.
// Username irukko illaiyo, ore message dhaan (yaarum username guess panna mudiyaadhu)
// ──────────────────────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────────
// POST /api/staff/forgot-password   { username }
// Username thappu na "Incorrect username" — request anuppa koodaadhu.
// Correct na Tour Admin Staff Profile la andha staff card highlight aagum.
// ──────────────────────────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    if (!username) {
      return res.status(400).json({ success: false, message: "Please enter your username" });
    }

    const staff = await staffModel.findOne({ username }).select("resetRequestedAt status").lean();
    if (!staff) {
      return res.status(404).json({ success: false, message: "Incorrect username. Please check and try again." });
    }
    if (staff.status === "Inactive") {
      return res.status(403).json({ success: false, message: "This account is inactive. Please contact HR." });
    }

    const last = staff.resetRequestedAt ? new Date(staff.resetRequestedAt).getTime() : 0;
    if (Date.now() - last > RESET_REQUEST_GAP_MS) {
      await staffModel.updateOne(
        { _id: staff._id },
        { $set: { resetRequested: true, resetRequestedAt: new Date() } }
      );
    }

    return res.status(200).json({ success: true, message: "Request sent. HR will contact you with a new password." });
  } catch (error) {
    console.error("forgotPassword error:", error);
    return res.status(500).json({ success: false, message: "Could not send request. Please try again." });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/staff/me   (authStaff) → My Profile (view only) + tabs
// ──────────────────────────────────────────────────────────────────────────────
const getMyProfile = async (req, res) => {
  try {
    const staff = await staffModel
      .findById(req.staff._id)
      .populate("role", "name tabs")
      .lean();
    if (!staff) return res.status(404).json({ success: false, message: "Profile not found" });

    return res.status(200).json({ success: true, data: staff });
  } catch (error) {
    console.error("getMyProfile error:", error);
    return res.status(500).json({ success: false, message: "Could not load profile" });
  }
};

export { loginStaff, forgotPassword, getMyProfile };