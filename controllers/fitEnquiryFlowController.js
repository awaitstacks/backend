// ══════════════════════════════════════════════════════════════════════════════
// FIT Enquiry — Zones + Pickup (zone oda) + Forward + yaar vela seyyalaam (gate)
//
//  • Zone: pala states → "Zone 1", "Zone 2" … (ore state pala zone la irukkalaam)
//  • Pickup: zone select panni dhaan. Pick pannadhum andha staff login la mattum.
//  • Forward: Person / Team, reason kandippaa, stage maaraadhu. Closed / Cancelled la illa.
//  • Visibility (staff): pick aagaadhadhu ellarukkum; pick / forward aanadhu andha aal (illa team) ku mattum.
//    Admin / Tour admin: ellaam.
//  • Pazhaya enquiries: owner field illa → pickedUpBy vachu (staff pick pannadhu andha staff ku mattum).
// ══════════════════════════════════════════════════════════════════════════════
import mongoose from "mongoose";
import enquiryModel, { fitZoneModel } from "../models/enquiryModel.js"; // Zone model um indha file la
import staffModel from "../models/staffProfileModel.js";
import "../models/staffRoleModel.js";
import whoRaised from "../utils/whoRaised.js";

export const INDIA_REGIONS = [
  // 28 states
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  // 8 union territories
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

const isStaffReq = (req) => req.userType === "staff" && !!req.staff;
const roleOf = (req) => req.staff?.role?._id || req.staff?.role || null;
const sameId = (a, b) => !!a && !!b && String(a) === String(b);
const clean = (who) => {
  if (!who) return null;
  const { at, ...rest } = who; // eslint-disable-line no-unused-vars
  return rest;
};

// Ippo yaar kitta irukku — owner (pudhu) illana pazhaya pickedUpBy
export const ownerOf = (e) => e?.owner || (e?.isPickedUp && e?.pickedUpBy ? e.pickedUpBy : null);
const stageOf = (e) => {
  if (e.status === "pending") return e.isRatePassed ? "ratePassed" : e.isPickedUp ? "pickup" : "pending";
  if (e.status === "accepted") return e.isCancelled ? "cancelled" : e.isClosed ? "closed" : "accepted";
  return e.status;
};
const STAGE_TEXT = { pending: "Pending", pickup: "Picked up", ratePassed: "Rate shared", accepted: "Accepted", closed: "Closed", cancelled: "Cancelled", rejected: "Rejected" };

// Staff ku theriya vendiyadhu: pick aagaadhadhu (yaarukkum forward aagaadhadhu) + enakku + en team ku
const staffEnquiryScope = (req) => {
  const me = req.staff._id;
  const role = roleOf(req);
  return {
    $or: [
      // Yaarukkum assign aagaadhadhu — yaarum endha action um pannaadhadhu (ellarukkum common)
      { owner: null, isPickedUp: { $ne: true } },
      { "owner.type": "staff", "owner.staffId": me },
      { owner: null, isPickedUp: true, "pickedUpBy.staffId": me }, // pazhaya enquiries
      ...(role ? [{ "owner.type": "team", "owner.teamId": role }] : []),
    ],
  };
};

// ─── Enquiry yaar login la (owner) — kadaisi-aa vela senja login ───
// Endha login la irundhu action aacho (Staff / Tour admin / Admin) — avanga login la mattum theriyum.
// actionLog + pazhaya fields (pickedUpBy, cancelledBy, cancelEditedBy) ellaam paarthu kadaisi aal.
//   • Travel date mudinju AUTO reject → yaarum pannala → ellarukkum common.
//   • Pick aagaadha Pending ah oru login reject pannadhu → andha login ku mattum.
//     Adha Reopen pannaa → thirumba ellarukkum common.
//   • Pick / rate share / forward aagi reject → avanga kitta; Reopen um avanga kitta dhaan.
// Forward aanadhu (delegatedCount > 0) — forward aana aal kitta, thirumba forward pannra varai (thodaadhu).
const WORK_ACTIONS = ["pickedUp", "rateShared", "rateCleared", "accepted", "closed", "cancelled", "cancelEdited", "rejected", "reopened"];
const WHO_TYPES = ["staff", "touradmin", "admin"];
const validWho = (by) => by && WHO_TYPES.includes(by.type) && (by.type !== "staff" || by.staffId);
// Ippo yaar kitta irukkanum (null = ellarukkum common)
const desiredOwner = (d) => {
  const events = (d.actionLog || []).filter((a) => WORK_ACTIONS.includes(a.action)).map((a) => ({ action: a.action, by: a.by, at: a.at }));
  if (d.pickedUpBy) events.push({ action: "pickedUp", by: d.pickedUpBy, at: d.pickedUpAt });
  if (d.cancelledBy) events.push({ action: "cancelled", by: d.cancelledBy, at: d.cancelledAt });
  if (d.cancelEditedBy) events.push({ action: "cancelEdited", by: d.cancelEditedBy, at: d.cancelEditedAt });
  const list = events.filter((x) => validWho(x.by)).sort((x, y) => new Date(x.at || 0) - new Date(y.at || 0));
  if (!list.length) return null;
  const last = list[list.length - 1];
  if (last.action === "reopened") {
    // Pick aagaadha Pending reopen → ellarukkum. Illana reopen ku munnaadi vela senja aal kitta.
    if (!d.isPickedUp && !d.isRatePassed && d.status === "pending") return null;
    const prev = [...list].reverse().find((x) => x.action !== "reopened" && x.action !== "rejected");
    return prev ? prev.by : last.by;
  }
  return last.by;
};
const sameOwner = (a, b) =>
  !!a && !!b && a.type === b.type && String(a.staffId || "") === String(b.staffId || "");
const backfillOwners = async () => {
  const docs = await enquiryModel
    .find({ delegatedCount: { $not: { $gt: 0 } } }) // forward aanadhu thodaadhu
    .select("owner status isPickedUp isRatePassed actionLog pickedUpBy pickedUpAt cancelledBy cancelledAt cancelEditedBy cancelEditedAt")
    .lean();
  for (const d of docs) {
    const want = desiredOwner(d);
    if (!want && d.owner) {
      await enquiryModel.updateOne({ _id: d._id, delegatedCount: { $not: { $gt: 0 } } }, { $set: { owner: null } }, { strict: false });
    } else if (want && !sameOwner(d.owner, want)) {
      await enquiryModel.updateOne({ _id: d._id, delegatedCount: { $not: { $gt: 0 } } }, { $set: { owner: clean(want) } }, { strict: false });
    }
  }
};

// ─── GET /api/tour/enquiry/all — staff na avangaluku theriya vendiyadhu mattum ───
export const getAllEnquiriesScoped = async (req, res) => {
  try {
    await backfillOwners().catch((err) => console.error("backfillOwners:", err.message));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Travel date poiduchu — PENDING stage la mattum auto reject (yaarum pick pannaadhadhu).
    // Picked up / Rate shared / Accepted … stages auto reject aagaadhu.
    await enquiryModel.updateMany(
      {
        status: "pending",
        isPickedUp: { $ne: true },
        isRatePassed: { $ne: true },
        preferredTravelDate: { $lt: today },
        skipAutoReject: { $ne: true },
      },
      { $set: { status: "rejected", previousStatus: "pending", rejectedAt: new Date() } },
    );
    const filter = isStaffReq(req) ? staffEnquiryScope(req) : {};
    const enquiries = await enquiryModel.find(filter).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: enquiries });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Gate: stage button / edit — andha enquiry yaar kitta irukko avanga (illa Tour admin) mattum ───
// Team ku forward aanadhu na, team la first click pannavanga ku assign aagum (matha team members ku maraiyum).
const NO_CLAIM = ["edit", "reopen"]; // Reopen — list load la (backfill) yaar kitta nu decide aagum
export const enquiryGate = (action) => async (req, res, next) => {
  try {
    if (!isStaffReq(req)) {
      // Tour admin — ellaa stage um. Common enquiry la action panna Tour admin kitta (staff ku maraiyum). Edit na illa.
      if (!NO_CLAIM.includes(action)) {
        await enquiryModel.updateOne({ _id: req.params.id, owner: null }, { $set: { owner: clean(await whoRaised(req)) } }, { strict: false });
      }
      return next();
    }
    const e = await enquiryModel.findById(req.params.id).lean();
    if (!e) return res.status(404).json({ success: false, message: "Enquiry not found" });
    const owner = ownerOf(e);
    const me = req.staff._id;

    // Yaarukkum assign aagaadha enquiry (common) — staff action panna udane avangaluku assign (matha staff ku maraiyum).
    // Edit / Reopen pannaa assign aagaadhu.
    if (!owner) {
      if (!NO_CLAIM.includes(action)) {
        await enquiryModel.updateOne({ _id: e._id, owner: null }, { $set: { owner: clean(await whoRaised(req)) } }, { strict: false });
      }
      return next();
    }
    if (owner.type === "staff" && sameId(owner.staffId, me)) return next();

    // En team ku forward aanadhu → first click enakku
    if (owner.type === "team" && sameId(owner.teamId, roleOf(req))) {
      const who = clean(await whoRaised(req));
      const claimed = await enquiryModel.findOneAndUpdate(
        { _id: e._id, "owner.type": "team", "owner.teamId": owner.teamId },
        { $set: { owner: who } },
        { new: true, strict: false },
      ).lean();
      if (claimed) return next();
      const now = await enquiryModel.findById(e._id).select("owner").lean();
      const by = now?.owner;
      return res.status(409).json({
        success: false,
        message: `${by?.name || "Someone"}${by?.employeeId ? ` (${by.employeeId})` : ""} already took this enquiry.`,
      });
    }

    const name = owner.type === "team" ? `${owner.name} team` : owner.name || (owner.type === "touradmin" ? "Tour admin" : "someone else");
    return res.status(403).json({ success: false, message: `This enquiry is with ${name}. Only they can ${action === "edit" ? "edit" : "work on"} it.` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PUT /api/tour/enquiry/:id/pickup   body: { zoneIds: [..] }  (pazhaya { zoneId } um ok) ───
// Oru zone-aavadhu select panni dhaan pickup (pala zones um select pannalaam).
// Pick pannadhum andha staff login la mattum theriyum.
export const pickupEnquiryZone = async (req, res) => {
  try {
    const raw = Array.isArray(req.body?.zoneIds) ? req.body.zoneIds : req.body?.zoneId ? [req.body.zoneId] : [];
    const ids = [...new Set(raw.map(String))].filter((id) => mongoose.isValidObjectId(id));
    if (!ids.length) {
      return res.status(400).json({ success: false, message: "Choose at least one zone to pick up this enquiry" });
    }
    const found = await fitZoneModel.find({ _id: { $in: ids } }).sort({ seq: 1 }).lean();
    if (found.length !== ids.length) {
      return res.status(400).json({ success: false, message: "A selected zone was not found — it may have been deleted. Refresh and try again." });
    }

    const e = await enquiryModel.findById(req.params.id).lean();
    if (!e) return res.status(404).json({ success: false, message: "Enquiry not found" });
    if (e.status !== "pending") return res.status(400).json({ success: false, message: "Only pending enquiries can be picked up" });
    if (e.isPickedUp) {
      return res.status(409).json({ success: false, message: `Already picked up by ${e.pickedUpBy?.name || "someone"}` });
    }

    const who = await whoRaised(req);
    const at = new Date();
    const match = { _id: e._id, status: "pending", isPickedUp: { $ne: true } };
    if (isStaffReq(req)) {
      // Staff: yaarukkum assign aagaadhadhu / enakku forward aanadhu / en team ku forward aanadhu
      const role = roleOf(req);
      match.$or = [
        { owner: null },
        { "owner.type": "staff", "owner.staffId": req.staff._id },
        ...(role ? [{ "owner.type": "team", "owner.teamId": role }] : []),
      ];
    }
    // Pala zones → ore snapshot: name "Zone 1, Zone 2", states ellaam (duplicate illaama), list la thani thani
    const zoneSnap = {
      zoneIds: found.map((z) => z._id),
      name: found.map((z) => z.name).join(", "),
      states: [...new Set(found.flatMap((z) => z.states || []))],
      list: found.map((z) => ({ zoneId: z._id, name: z.name, states: z.states || [], districts: z.districts || {} })),
    };
    const result = await enquiryModel.updateOne(
      match,
      {
        $set: { isPickedUp: true, pickedUpBy: who, pickedUpAt: at, owner: clean(who), zone: zoneSnap },
        $push: { actionLog: { action: "pickedUp", by: who, at, zone: zoneSnap.name } },
      },
      { strict: false },
    );
    if (!result.modifiedCount) {
      const now = await enquiryModel.findById(e._id).select("pickedUpBy owner").lean();
      const by = now?.pickedUpBy || now?.owner;
      return res.status(409).json({ success: false, message: `${by?.name || "Someone else"} already took this enquiry` });
    }
    return res.status(200).json({ success: true, message: `Picked up · ${zoneSnap.name}` });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// ─── PUT /api/tour/enquiry/:id/forward   body: { toStaff? | toTeam?, reason } ───
// Ella stage la um (Closed / Cancelled thavira). Stage maaraadhu — pudhu aal adhe stage la irundhu continue.
export const forwardEnquiry = async (req, res) => {
  try {
    const reason = String(req.body?.reason || "").trim().slice(0, 1000);
    const toStaff = req.body?.toStaff ? String(req.body.toStaff) : "";
    const toTeam = req.body?.toTeam ? String(req.body.toTeam) : "";
    if (!reason) return res.status(400).json({ success: false, message: "Give a reason for forwarding" });
    if (!toStaff && !toTeam) return res.status(400).json({ success: false, message: "Choose a person or a team" });
    if ((toStaff && !mongoose.isValidObjectId(toStaff)) || (toTeam && !mongoose.isValidObjectId(toTeam))) {
      return res.status(400).json({ success: false, message: "Invalid person or team" });
    }

    const e = await enquiryModel.findById(req.params.id).lean();
    if (!e) return res.status(404).json({ success: false, message: "Enquiry not found" });
    const stage = stageOf(e);
    if (stage === "closed" || stage === "cancelled" || stage === "rejected") { // Rejected la Reopen mattum
      return res.status(400).json({ success: false, message: `${STAGE_TEXT[stage]} enquiries can't be forwarded` });
    }

    const owner = ownerOf(e);
    if (isStaffReq(req)) {
      const me = req.staff._id;
      const ok = !owner || (owner.type === "staff" && sameId(owner.staffId, me)) || (owner.type === "team" && sameId(owner.teamId, roleOf(req)));
      if (!ok) return res.status(403).json({ success: false, message: `This enquiry is with ${owner.name || "someone else"} — only they can forward it` });
    }

    let to;
    if (toStaff) {
      if (owner?.type === "staff" && sameId(owner.staffId, toStaff)) {
        return res.status(400).json({ success: false, message: "This enquiry is already with that person" });
      }
      if (isStaffReq(req) && sameId(req.staff._id, toStaff)) {
        return res.status(400).json({ success: false, message: "You can't forward to yourself" });
      }
      const s = await staffModel.findById(toStaff).select("fullName employeeId status loginEnabled").lean();
      if (!s || s.status === "Inactive" || !s.loginEnabled) {
        return res.status(400).json({ success: false, message: `${s?.fullName || "That staff member"} is inactive or their login is off — choose someone else` });
      }
      to = { type: "staff", staffId: s._id, name: s.fullName || "", employeeId: s.employeeId || "" };
    } else {
      const t = await mongoose.model("staffRole").findById(toTeam).select("name").lean();
      if (!t) return res.status(400).json({ success: false, message: "Team not found" });
      // Forward panravanga thavira oru active (login ON) aal-aavadhu team la irukkanum
      const others = await staffModel.countDocuments({
        role: t._id, status: { $ne: "Inactive" }, loginEnabled: true,
        ...(isStaffReq(req) ? { _id: { $ne: req.staff._id } } : {}),
      });
      if (!others) return res.status(400).json({ success: false, message: `No one else in the ${t.name} team is active right now — choose a person instead` });
      to = { type: "team", teamId: t._id, name: t.name || "" };
    }

    const by = await whoRaised(req);
    const at = new Date();
    const from = owner
      ? owner.type === "team"
        ? { type: "team", teamId: owner.teamId, name: owner.name || "" }
        : { type: owner.type, staffId: owner.staffId || null, name: owner.name || (owner.type === "touradmin" ? "Tour admin" : ""), employeeId: owner.employeeId || "" }
      : null;

    await enquiryModel.updateOne(
      { _id: e._id },
      {
        $set: { owner: to, delegatedAt: at },
        $push: {
          delegations: { from, to, reason, stage, by, at },
          actionLog: { action: "forwarded", by, at, to: to.type === "team" ? `${to.name} team` : to.name },
        },
        $inc: { delegatedCount: 1 },
      },
      { strict: false },
    );
    return res.status(200).json({ success: true, message: `Forwarded to ${to.type === "team" ? `${to.name} team` : to.name}` });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

// ══════════════════════════════ ZONES ══════════════════════════════
const cleanStates = (list) => [...new Set((Array.isArray(list) ? list : []).map(String))].filter((s) => INDIA_REGIONS.includes(s));
// { state: [district…] } — select panna states ku mattum; [] / illana full state
const cleanDistricts = (raw, states) => {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  states.forEach((st) => {
    const list = Array.isArray(raw[st]) ? raw[st] : [];
    const clean = [...new Set(list.map((d) => String(d).trim()).filter(Boolean))].slice(0, 200);
    if (clean.length) out[st] = clean;
  });
  return out;
};

// Vera zone la already irukkura states
const takenElsewhere = async (states, exceptId = null) => {
  const clash = await fitZoneModel
    .find({ states: { $in: states }, ...(exceptId ? { _id: { $ne: exceptId } } : {}) })
    .select("name states")
    .lean();
  const out = [];
  clash.forEach((z) => z.states.filter((s) => states.includes(s)).forEach((s) => out.push(`${s} (${z.name})`)));
  return out;
};

// GET /api/tour/fit-zones
export const listFitZones = async (req, res) => {
  try {
    const zones = await fitZoneModel.find().sort({ seq: 1 }).lean();
    return res.status(200).json({ success: true, data: zones, regions: INDIA_REGIONS });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/tour/fit-zones   body: { states: [...] } → "Zone N" auto
export const createFitZone = async (req, res) => {
  try {
    const states = cleanStates(req.body?.states);
    if (!states.length) return res.status(400).json({ success: false, message: "Select at least one state" });
    const districts = cleanDistricts(req.body?.districts, states);
    const noDist = states.filter((st) => !districts[st]);
    if (noDist.length) return res.status(400).json({ success: false, message: `Select districts for ${noDist.join(", ")}` });
    // Ore state pala zone la irukkalaam — clash check illa

    const who = await whoRaised(req);
    let zone;
    for (let attempt = 0; attempt < 5 && !zone; attempt += 1) {
      const last = await fitZoneModel.findOne().sort({ seq: -1 }).select("seq").lean();
      const seq = (last?.seq || 0) + 1;
      try {
        zone = await fitZoneModel.create({ seq, name: `Zone ${seq}`, states, districts, createdBy: who });
      } catch (err) {
        if (err?.code !== 11000 || attempt === 4) throw err; // rendu per same time create pannaa next number
      }
    }
    return res.status(201).json({ success: true, message: `${zone.name} created`, data: zone });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/tour/fit-zones/:id   body: { states: [...] }
export const updateFitZone = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid zone" });
    const states = cleanStates(req.body?.states);
    if (!states.length) return res.status(400).json({ success: false, message: "A zone needs at least one state" });
    const districts = cleanDistricts(req.body?.districts, states);
    const noDist = states.filter((st) => !districts[st]);
    if (noDist.length) return res.status(400).json({ success: false, message: `Select districts for ${noDist.join(", ")}` });
    // Ore state pala zone la irukkalaam — clash check illa
    const zone = await fitZoneModel.findByIdAndUpdate(
      req.params.id,
      { $set: { states, districts, updatedBy: await whoRaised(req) } },
      { new: true },
    ).lean();
    if (!zone) return res.status(404).json({ success: false, message: "Zone not found" });
    return res.status(200).json({ success: true, message: `${zone.name} updated`, data: zone });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/tour/fit-zones/:id — already pick aana enquiries la zone (snapshot) apdiye irukkum
export const deleteFitZone = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid zone" });
    const zone = await fitZoneModel.findByIdAndDelete(req.params.id).lean();
    if (!zone) return res.status(404).json({ success: false, message: "Zone not found" });
    return res.status(200).json({ success: true, message: `${zone.name} deleted` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};