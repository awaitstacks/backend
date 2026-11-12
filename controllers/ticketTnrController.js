import aadhaarModel from "../models/aadhaarModel.js";
import tourBookingModel from "../models/tourBookingmodel.js";
import tourModel from "../models/tourModel.js";
import staffModel from "../models/staffProfileModel.js";
import "../models/staffRoleModel.js";
import mongoose from "mongoose";
import Query from "../models/queryModel.js";

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/tour/queries/tnr-lookup/:tnr      (Tour Admin + Staff)
// GET /api/touradmin/queries/tnr-lookup/:tnr (Admin + Staff)
// Ticket raise form la TNR potta: endha booking, traveller yaar, booking yaar eduthaanga
// (Create Booking / Aadhaar upload la "Raised by" la irukura staff) → "Raised to" auto fill.
// Read-only — edhuvum maathaadhu.
// ══════════════════════════════════════════════════════════════════════════════
const fullName = (p) => [p?.firstName, p?.lastName].filter(Boolean).join(" ").trim();

const lookupTicketTnr = async (req, res) => {
  try {
    const tnr = String(req.params.tnr || "").trim().toUpperCase();
    if (!/^[A-Z0-9]{4,12}$/.test(tnr)) {
      return res.status(400).json({ success: false, message: "Enter a valid TNR" });
    }

    const [docs, booking] = await Promise.all([
      aadhaarModel
        .find({ tnr })
        .select("type parsed raisedBy tourId isCoTraveller createdAt")
        .sort({ createdAt: 1 })
        .lean(),
      tourBookingModel.findOne({ tnr }).lean().catch(() => null),
    ]);

    if (!docs.length && !booking) {
      return res.status(404).json({ success: false, message: `No booking found for TNR ${tnr}` });
    }

    // Booking eduththa staff — Aadhaar / Create Booking la save aana "Raised by"
    const raisedDoc = docs.find((d) => d.raisedBy?.employeeId || d.raisedBy?.name);
    const bookedBy = raisedDoc
      ? { name: raisedDoc.raisedBy.name || "", employeeId: raisedDoc.raisedBy.employeeId || "" }
      : null;

    let staff = null;
    if (bookedBy?.employeeId) {
      staff = await staffModel
        .findOne({ employeeId: bookedBy.employeeId.toUpperCase() })
        .select("fullName employeeId designation status role")
        .populate("role", "name")
        .lean();
    }

    // Traveller name — main traveller Aadhaar, illana booking
    const mainFront =
      docs.find((d) => d.type === "aadhaarFront" && !d.isCoTraveller) || docs.find((d) => d.type === "aadhaarFront");
    const travellerName =
      fullName(mainFront?.parsed) || fullName(booking?.travellers?.[0]) || booking?.userData?.name || "";

    // Tour name
    const tourId = docs.find((d) => d.tourId)?.tourId || booking?.tourId || null;
    let tourTitle = booking?.tourData?.title || "";
    if (!tourTitle && tourId) {
      const tour = await tourModel.findById(tourId).select("title").lean().catch(() => null);
      tourTitle = tour?.title || "";
    }

    return res.status(200).json({
      success: true,
      tnr,
      tourTitle,
      travellerName,
      bookedBy, // { name, employeeId } | null (online customer booking na null)
      staff: staff
        ? {
          _id: staff._id,
          fullName: staff.fullName,
          employeeId: staff.employeeId,
          designation: staff.designation || "",
          role: staff.role ? { _id: staff.role._id, name: staff.role.name } : null,
          active: staff.status !== "Inactive",
        }
        : null,
    });
  } catch (err) {
    console.error("lookupTicketTnr error:", err);
    return res.status(500).json({ success: false, message: "Could not look up this TNR" });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// Raise / edit pannum podhu: TNR irundhu "Raised to" empty na mattum = andha booking eduththa staff.
// Form la vera person / team select pannirundha adhe save aagum.
// Aadhaar upload la "Raised by" (employeeId) → staff profile.
// Staff kandupidikka mudiyalaana (online booking) → form la select panna staff apdiye.
// Route la multer (queryUpload) KU APPURAM podanum.
// ══════════════════════════════════════════════════════════════════════════════
const forceRaisedToFromTnr = async (req, res, next) => {
  try {
    const tnr = String(req.body?.tnr || "").trim().toUpperCase();
    if (!tnr) return next();
    // Team ku raise panna, illa form la "Raised to" select pannirundha — adhe dhaan (yaaru ku venaalum)
    if (req.userType === "staff" && req.body?.raisedToRole) return next();
    if (req.body?.raisedTo) return next();

    const doc = await aadhaarModel
      .findOne({ tnr, "raisedBy.employeeId": { $nin: ["", null] } })
      .select("raisedBy")
      .sort({ createdAt: 1 })
      .lean();
    if (!doc) return next();

    const staff = await staffModel
      .findOne({ employeeId: doc.raisedBy.employeeId.toUpperCase(), status: { $ne: "Inactive" } })
      .select("_id")
      .lean();
    if (!staff) return next();

    // "Raised to" empty ah irundha mattum booking eduththavanga (avangale raise panna illa)
    if (String(staff._id) !== String(req.body.raisedBy)) req.body.raisedTo = String(staff._id);
    return next();
  } catch (err) {
    console.error("forceRaisedToFromTnr error:", err);
    return next();
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// Ticket list la TNR pakkathula tour name + traveller name kaatta.
// List load aagum podhu ore thadava ellaa TNR kum thedum (DB la edhuvum save pannaadhu,
// so pazhaya tickets kum varum). Edhavadhu fail aanaa list apdiye varum.
// ══════════════════════════════════════════════════════════════════════════════
const attachTnrDetails = async (queries = []) => {
  try {
    const tnrs = [...new Set(queries.map((q) => String(q.tnr || "").toUpperCase()).filter(Boolean))];
    if (!tnrs.length) return queries;

    const [docs, bookings] = await Promise.all([
      aadhaarModel
        .find({ tnr: { $in: tnrs }, type: "aadhaarFront" })
        .select("tnr parsed tourId isCoTraveller createdAt")
        .sort({ createdAt: 1 })
        .lean(),
      tourBookingModel.find({ tnr: { $in: tnrs } }).lean().catch(() => []),
    ]);

    const info = {};
    tnrs.forEach((t) => (info[t] = { tourTitle: "", travellerName: "", tourId: null }));

    bookings.forEach((b) => {
      const i = info[String(b.tnr || "").toUpperCase()];
      if (!i) return;
      i.tourTitle = i.tourTitle || b?.tourData?.title || "";
      i.travellerName = i.travellerName || fullName(b?.travellers?.[0]) || b?.userData?.name || "";
      i.tourId = i.tourId || b?.tourId || null;
    });
    // Main traveller mudhal, illana yaaraavadhu oru traveller
    [false, true].forEach((co) =>
      docs.forEach((d) => {
        const i = info[d.tnr];
        if (!i) return;
        if (!i.travellerName && !!d.isCoTraveller === co) i.travellerName = fullName(d.parsed);
        i.tourId = i.tourId || d.tourId || null;
      }),
    );

    const needTour = [...new Set(Object.values(info).filter((i) => !i.tourTitle && i.tourId).map((i) => String(i.tourId)))];
    if (needTour.length) {
      const tours = await tourModel.find({ _id: { $in: needTour } }).select("title").lean().catch(() => []);
      const titles = Object.fromEntries(tours.map((t) => [String(t._id), t.title || ""]));
      Object.values(info).forEach((i) => {
        if (!i.tourTitle && i.tourId) i.tourTitle = titles[String(i.tourId)] || "";
      });
    }

    return queries.map((q) => {
      const i = q.tnr ? info[String(q.tnr).toUpperCase()] : null;
      return i && (i.tourTitle || i.travellerName)
        ? { ...q, tnrInfo: { tourTitle: i.tourTitle, travellerName: i.travellerName } }
        : q;
    });
  } catch (err) {
    console.error("attachTnrDetails error:", err);
    return queries;
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// Team ticket PICK — status routes la (pickup / processing / close / reject) authTour KU APPURAM.
// Staff login mattum: team ku raise aana ticket ah team la oruthar touch pannuna
// "Raised to" = avanga (atomic — rendu per ore neram click pannaalum onnu dhaan jeyikkum).
// Apram micha team members list la irundhu adhu maraiyum.
// Admin / Tour admin ku edhuvum pannaadhu — next() mattum.
// ══════════════════════════════════════════════════════════════════════════════
const claimTeamTicket = async (req, res, next) => {
  try {
    if (!(req.userType === "staff" && req.staff)) return next();
    const queryId = req.claimQueryId || req.params?.queryId || req.params?.id;
    if (!mongoose.isValidObjectId(queryId)) return next();

    const me = String(req.staff._id);
    const myRole = String(req.staff.role?._id || req.staff.role || "");
    const q = await Query.findById(queryId).select("raisedBy raisedTo raisedToRole raisedByStaffLogin delegatedCount").lean();
    if (!q) return res.status(404).json({ success: false, message: "Query not found" });

    const isTeamOpen = !!q.raisedToRole && !q.raisedTo;
    const inScope =
      (q.raisedByStaffLogin || q.delegatedCount > 0) &&
      (String(q.raisedBy) === me || String(q.raisedTo) === me || (isTeamOpen && String(q.raisedToRole) === myRole));
    if (!inScope) return res.status(404).json({ success: false, message: "Query not found" });
    if (!isTeamOpen) return next();

    if (String(q.raisedBy) === me) {
      return res.status(403).json({
        success: false,
        message: "You raised this ticket — someone in the team has to pick it up.",
      });
    }
    const claimed = await Query.findOneAndUpdate(
      { _id: queryId, raisedTo: null, raisedToRole: q.raisedToRole },
      { $set: { raisedTo: req.staff._id } },
      { new: true },
    )
      .select("_id")
      .lean();
    if (!claimed) {
      const now = await Query.findById(queryId).select("raisedTo").populate("raisedTo", "fullName").lean();
      return res.status(409).json({
        success: false,
        message: `${now?.raisedTo?.fullName || "Someone in your team"} already picked up this ticket.`,
      });
    }
    return next();
  } catch (err) {
    console.error("claimTeamTicket error:", err);
    return res.status(500).json({ success: false, message: "Could not pick up this ticket" });
  }
};

export { lookupTicketTnr, forceRaisedToFromTnr, attachTnrDetails, claimTeamTicket };