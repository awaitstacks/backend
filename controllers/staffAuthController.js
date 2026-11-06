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
const loginStaff = async (req, res) => {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    const staff = await staffModel
      .findOne({ username })
      .select("+password")
      .populate("role", "name tabs");

    // Username thappa ah password thappa ah nu sollaadhu — rendukkum same message
    if (!staff || !staff.password || !(await bcrypt.compare(password, staff.password))) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    if (staff.status === "Inactive" || !staff.loginEnabled) {
      return res.status(403).json({ success: false, message: "Your login is disabled. Please contact HR." });
    }

    await staffModel.updateOne({ _id: staff._id }, { $set: { lastLogin: new Date() } });

    const token = jwt.sign({ id: staff._id, type: "staff" }, process.env.STAFF_JWT_SECRET);

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
const forgotPassword = async (req, res) => {
  const reply = {
    success: true,
    message: "Request sent. HR will contact you with a new password.",
  };
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    if (!username) {
      return res.status(400).json({ success: false, message: "Please enter your username" });
    }

    const staff = await staffModel.findOne({ username }).select("resetRequestedAt").lean();
    if (staff) {
      const last = staff.resetRequestedAt ? new Date(staff.resetRequestedAt).getTime() : 0;
      if (Date.now() - last > RESET_REQUEST_GAP_MS) {
        await staffModel.updateOne(
          { _id: staff._id },
          { $set: { resetRequested: true, resetRequestedAt: new Date() } }
        );
      }
    }

    return res.status(200).json(reply);
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