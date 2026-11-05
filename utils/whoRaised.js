// ══════════════════════════════════════════════════════════════════════════════
// Request YAARU, endha login la irundhu anuppunaanga — cancellation maadhiri
// "yaaru panna" nu save panna vendiya idathula use pannalaam.
//   Staff portal (stoken) → { type: "staff", name, staffId, employeeId, role }
//   Tour admin (ttoken)   → { type: "touradmin", name: "Tour admin" }
//   Admin (atoken)        → { type: "admin", name: "Admin" }
//   Website (token)       → { type: "user", name, email }  (booking la irukkura customer)
// Edhavadhu fail aanaalum null — andha request nikkaadhu.
// ══════════════════════════════════════════════════════════════════════════════
import jwt from "jsonwebtoken";
import staffModel from "../models/staffProfileModel.js";
import "../models/staffRoleModel.js";

const findWho = async (req, booking) => {
  try {
    const h = req.headers || {};
    let staff = req.userType === "staff" && req.staff ? req.staff : null;
    if (!staff && h.stoken && !h.ttoken && !h.atoken && process.env.STAFF_JWT_SECRET) {
      const d = jwt.verify(h.stoken, process.env.STAFF_JWT_SECRET);
      if (d?.type === "staff") {
        staff = await staffModel.findById(d.id).select("fullName employeeId role").populate("role", "name").lean();
      }
    }
    if (staff) {
      return {
        type: "staff",
        name: staff.fullName || "",
        staffId: staff._id,
        employeeId: staff.employeeId || "",
        role: staff.role?.name || "",
      };
    }
    if (h.ttoken) return { type: "touradmin", name: "Tour admin" };
    if (h.atoken) return { type: "admin", name: "Admin" };
    if (h.token) {
      return { type: "user", name: booking?.userData?.name || "", email: booking?.userData?.email || "" };
    }
  } catch (err) {
    console.error("whoRaised error:", err.message);
  }
  return null;
};

// { ...yaaru, at: eppo }
const whoRaised = async (req, booking = null) => {
  const who = await findWho(req, booking);
  return who ? { ...who, at: new Date() } : null;
};

export default whoRaised;