// // ══════════════════════════════════════════════════════════════════════════════
// // EMPLOYEE PERFORMANCE — hike decide panna (Admin panel / CEO tab)
// //   GET /api/touradmin/employee-performance?from=YYYY-MM-DD&to=YYYY-MM-DD&employee=<key>
// //
// //   Tickets  : raise panna, assign aanadhu, close / reject, forward, reopen, replies, edits
// //   Bookings : booking create panna login (Booked by) wise —
// //              total = active + cancelled + rejected, advance / balance paid, cancellation amount (GV + IRCTC)
// //   FIT      : pick up, rate share, accept (sales value), close, cancel, reject, forward
// //
// //   employee=<key> kuduththaa andha aal oda details list um (tickets / bookings / FIT).
// //   Key: "staff:<id>" | "touradmin" | "admin" | "user" | "name:<employeeId or name>"
// // Read only — edhaiyum maathaadhu.
// // ══════════════════════════════════════════════════════════════════════════════
// import mongoose from "mongoose";
// import Query from "../models/queryModel.js";
// import tourBookingModel from "../models/tourBookingmodel.js";
// import cancellationModel from "../models/cancellationModel.js";
// import enquiryModel from "../models/enquiryModel.js";
// import staffModel from "../models/staffProfileModel.js";
// import "../models/staffRoleModel.js";
// import { attachBookedBy } from "../utils/bookedBy.js";

// // ─── Helpers ──────────────────────────────────────────────────
// const IST = "+05:30";
// const dayStart = (d) => (d ? new Date(`${d}T00:00:00${IST}`) : null);
// const dayEnd = (d) => (d ? new Date(`${d}T23:59:59.999${IST}`) : null);
// const inRange = (at, from, to) => {
//   if (!from && !to) return true;
//   if (!at) return false;
//   const t = new Date(at).getTime();
//   return (!from || t >= from.getTime()) && (!to || t <= to.getTime());
// };
// const dateFilter = (field, from, to) =>
//   from || to ? { [field]: { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) } } : {};
// const sid = (v) => (v ? String(v._id || v) : "");
// const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// // whoRaised / owner snapshot → employee key
// const keyOfWho = (w) => {
//   if (!w) return null;
//   if (w.unknown) return "unknown"; // pazhaya booking — yaar login nu record illa
//   if (w.type === "staff") {
//     if (w.staffId) return `staff:${sid(w.staffId)}`;
//     const n = w.employeeId || w.name;
//     return n ? `name:${n}` : null;
//   }
//   if (w.type === "touradmin") return "touradmin";
//   if (w.type === "admin") return "admin";
//   if (w.type === "user") return "user";
//   return null;
// };

// // ─── Employee list (staff + Tour admin + Admin) ───────────────
// const loadEmployees = async () => {
//   const staff = await staffModel
//     .find()
//     .select("fullName employeeId designation department status loginEnabled role photo")
//     .populate("role", "name")
//     .lean();
//   const map = new Map();
//   staff.forEach((s) =>
//     map.set(`staff:${s._id}`, {
//       key: `staff:${s._id}`,
//       type: "staff",
//       staffId: s._id,
//       name: s.fullName || "",
//       employeeId: s.employeeId || "",
//       role: s.role?.name || s.designation || "",
//       status: s.status === "Inactive" || s.loginEnabled === false ? "Inactive" : "Active",
//       photo: s.photo || "",
//     }),
//   );
//   map.set("touradmin", { key: "touradmin", type: "touradmin", name: "Tour admin", employeeId: "", role: "", status: "Active" });
//   map.set("admin", { key: "admin", type: "admin", name: "Admin", employeeId: "", role: "", status: "Active" });
//   map.set("unknown", { key: "unknown", type: "unknown", name: "Not recorded", employeeId: "", role: "Old bookings — login not saved", status: "" });
//   return map;
// };
// // Aadhaar upload (Create Booking auto) la "Raised by" staff — { name, employeeId } mattum save aagum.
// // Adha Staff Profile oda employeeId (illana peyar) vachu staff ku map pannrom — Aadhaar upload page maadhiriye.
// const resolveKey = (emps, key) => {
//   if (!key || !key.startsWith("name:")) return key;
//   const v = key.slice(5).trim().toLowerCase();
//   for (const e of emps.values()) {
//     if (e.type === "staff" && e.staffId && ((e.employeeId && e.employeeId.toLowerCase() === v) || (e.name && e.name.trim().toLowerCase() === v))) return e.key;
//   }
//   return key;
// };
// // Staff profile illaadha aal (delete aanavanga / pazhaya name mattum) — list la serkka
// const ensureEmp = (emps, key, who) => {
//   if (!key || emps.has(key)) return;
//   if (key === "user") { emps.set(key, { key, type: "user", name: "Website (customer)", employeeId: "", role: "", status: "" }); return; }
//   emps.set(key, {
//     key,
//     type: who?.type || "staff",
//     name: who?.name || (key === "user" ? "Website (customer)" : key.startsWith("staff:") ? "Removed staff" : key.replace(/^name:/, "")),
//     employeeId: who?.employeeId || "",
//     role: who?.role || "",
//     status: key === "user" ? "" : "Removed",
//   });
// };

// // ══════════════════════════ TICKETS ══════════════════════════
// const ticketStats = async (emps, from, to, wantKey) => {
//   const tickets = await Query.find(dateFilter("createdAt", from, to))
//     .select("ticketNo subject queryType status raisedBy raisedTo raisedToRole raisedVia raisedByStaffLogin createdAt pickupAt processingAt closedAt rejectedAt replies.staff replies.byStaffLogin replies.createdAt replies.editedAt editHistory.kind editHistory.editedAt delegations reopens reopenCount tnr")
//     .populate("raisedBy", "fullName employeeId")
//     .populate("raisedTo", "fullName employeeId")
//     .populate("raisedToRole", "name")
//     .lean();

//   const blank = () => ({
//     raised: 0, assigned: 0, open: 0, inProgress: 0, closed: 0, rejected: 0,
//     forwardedOut: 0, forwardedIn: 0, reopenedBy: 0, replies: 0, repliesEdited: 0, ticketEdits: 0,
//     closeHours: [], // avg kanakku ku
//   });
//   const stats = new Map();
//   const st = (key) => {
//     if (!stats.has(key)) stats.set(key, blank());
//     return stats.get(key);
//   };
//   const details = [];

//   for (const t of tickets) {
//     // Staff portal la theriyura tickets mattum staff kanakku ku (avanga "Raised by me" / "Assigned to me" la varradhu):
//     //   staff login la raise aanadhu, illa forward aagi vandhadhu. Admin / Tour admin page la raise panni
//     //   staff peyar select pannadhu staff portal la theriyaadhu — adhu avanga velai illa.
//     const onPortal = !!t.raisedByStaffLogin || (t.delegations || []).length > 0;
//     const raiserKey = t.raisedByStaffLogin && t.raisedBy?._id ? `staff:${t.raisedBy._id}` : null;
//     const assigneeKey = onPortal && t.raisedTo?._id ? `staff:${t.raisedTo._id}` : null;
//     const touched = new Set();

//     if (raiserKey) {
//       ensureEmp(emps, raiserKey, { type: "staff", name: t.raisedBy.fullName, employeeId: t.raisedBy.employeeId });
//       st(raiserKey).raised += 1;
//       // Staff portal ticket la edit = raise pannavanga dhaan
//       if (t.raisedByStaffLogin) st(raiserKey).ticketEdits += (t.editHistory || []).filter((h) => h.kind === "query").length;
//       touched.add(raiserKey);
//     }
//     if (assigneeKey) {
//       ensureEmp(emps, assigneeKey, { type: "staff", name: t.raisedTo.fullName, employeeId: t.raisedTo.employeeId });
//       const s = st(assigneeKey);
//       s.assigned += 1;
//       if (t.status === "open") s.open += 1;
//       else if (t.status === "pickup" || t.status === "processing") s.inProgress += 1;
//       else if (t.status === "close") {
//         s.closed += 1;
//         if (t.closedAt && t.createdAt) s.closeHours.push((new Date(t.closedAt) - new Date(t.createdAt)) / 36e5);
//       } else if (t.status === "reject") s.rejected += 1;
//       touched.add(assigneeKey);
//     }
//     (t.delegations || []).forEach((d) => {
//       const out = d.from?.type === "staff" && d.from.staffId ? `staff:${sid(d.from.staffId)}` : keyOfWho(d.by);
//       if (out) { ensureEmp(emps, out, d.from?.type === "staff" ? d.from : d.by); st(out).forwardedOut += 1; touched.add(out); }
//       if (d.to?.type === "staff" && d.to.staffId) {
//         const inn = `staff:${sid(d.to.staffId)}`;
//         ensureEmp(emps, inn, d.to);
//         st(inn).forwardedIn += 1;
//         touched.add(inn);
//       }
//     });
//     (t.reopens || []).forEach((r) => {
//       const k = keyOfWho(r.by);
//       if (k) { ensureEmp(emps, k, r.by); st(k).reopenedBy += 1; touched.add(k); }
//     });
//     (t.replies || []).forEach((r) => {
//       if (!r.staff) return;
//       const k = `staff:${sid(r.staff)}`;
//       st(k).replies += 1;
//       if (r.editedAt) st(k).repliesEdited += 1;
//       touched.add(k);
//     });

//     const ALL = wantKey === "*"; // "*" = ellaa staff records um (filter panni paakka)
//     if (wantKey && (ALL ? onPortal : touched.has(wantKey))) {
//       const myReplies = (t.replies || []).filter((r) => r.staff && `staff:${sid(r.staff)}` === wantKey).length;
//       details.push({
//         _id: t._id,
//         ticketNo: t.ticketNo || "",
//         subject: t.subject,
//         queryType: t.queryType,
//         status: t.status,
//         tnr: t.tnr || "",
//         createdAt: t.createdAt,
//         closedAt: t.closedAt || null,
//         raisedBy: t.raisedBy?.fullName || "",
//         raisedTo: t.raisedTo?.fullName || (t.raisedToRole?.name ? `${t.raisedToRole.name} team` : ""),
//         raisedByKey: raiserKey || "",
//         raisedToKey: assigneeKey || "",
//         roles: ALL ? [] : [
//           raiserKey === wantKey ? "Raised" : null,
//           assigneeKey === wantKey ? "Assigned" : null,
//           (t.delegations || []).some((d) => d.from?.staffId && `staff:${sid(d.from.staffId)}` === wantKey) ? "Forwarded" : null,
//           (t.reopens || []).some((r) => keyOfWho(r.by) === wantKey) ? "Reopened" : null,
//           myReplies ? `${myReplies} replies` : null,
//         ].filter(Boolean),
//         edits: (t.editHistory || []).filter((h) => h.kind === "query").length,
//       });
//     }
//   }

//   const rows = [...stats.entries()].map(([key, s]) => {
//     const { closeHours, ...rest } = s;
//     return {
//       key,
//       ...rest,
//       closeRate: s.assigned ? Math.round((s.closed / s.assigned) * 100) : 0,
//       avgCloseHours: closeHours.length ? Math.round((closeHours.reduce((a, b) => a + b, 0) / closeHours.length) * 10) / 10 : null,
//     };
//   });
//   details.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//   return { rows, details };
// };

// // ══════════════════════════ TOUR BOOKINGS ══════════════════════════
// // Traveller status: byAdmin + byTraveller = Cancelled · byAdmin mattum = Rejected · onnum illa = Active
// const bookingState = (b) => {
//   const tr = b.travellers || [];
//   let cancelled = 0, rejected = 0, requested = 0;
//   tr.forEach((t) => {
//     const c = t.cancelled || {};
//     if (c.viaTripCancel || (c.byAdmin && c.byTraveller)) cancelled += 1; // trip cancel aanadhum Cancelled
//     else if (c.byAdmin && !c.byTraveller) rejected += 1;
//     else if (c.byTraveller && !c.byAdmin) requested += 1; // cancellation request — innum approve aagala
//   });
//   const active = tr.length - cancelled - rejected - requested;
//   // Booking level: oru traveller aavadhu active → Active; illana request irundhaa → Cancellation requested;
//   // ellaam rejected → Rejected; illana Cancelled
//   const state = !tr.length || active > 0 ? "active"
//     : requested > 0 ? "cancelRequested"
//       : rejected === tr.length ? "rejected" : "cancelled";
//   return { state, travellers: tr.length, activeTr: active, cancelledTr: cancelled, rejectedTr: rejected, requestedTr: requested };
// };
// // Kaasu "received" la count aagura states — Active + Cancellation requested
// const MONEY_STATES = new Set(["active", "cancelRequested"]);
// // Thani staff login / Aadhaar employee ID map aana bookings mattum (Tour admin, Admin, Website, pazhaya shared login venaam)
// const isStaffKey = (k) => typeof k === "string" && (k.startsWith("staff:") || k.startsWith("name:"));

// const bookingStats = async (emps, from, to, wantKey) => {
//   const bookings = await tourBookingModel
//     .find(dateFilter("bookingDate", from, to))
//     .select("tnr bookingDate createdBy createdByWho userId userData.name userData.email tourData.title tourId travellers.cancelled payment gvCancellationPool irctcCancellationPool")
//     .lean();
//   await attachBookedBy(bookings);

//   // Approve aana cancellation records — GV / IRCTC amount
//   const tnrs = bookings.map((b) => b.tnr).filter(Boolean);
//   const cancels = tnrs.length
//     ? await cancellationModel
//         .find({ tnr: { $in: tnrs }, approvedBy: true })
//         .select("tnr gvCancellationAmount irctcCancellationAmount totalCancellationAmount refundAmount")
//         .lean()
//     : [];
//   const cancelByTnr = new Map();
//   cancels.forEach((c) => {
//     const cur = cancelByTnr.get(c.tnr) || { gv: 0, irctc: 0, total: 0, refund: 0 };
//     cur.gv += num(c.gvCancellationAmount);
//     cur.irctc += num(c.irctcCancellationAmount);
//     cur.total += num(c.totalCancellationAmount);
//     cur.refund += num(c.refundAmount);
//     cancelByTnr.set(c.tnr, cur);
//   });

//   const blank = () => ({
//     total: 0, active: 0, cancelRequested: 0, cancelled: 0, rejected: 0, travellers: 0,
//     advancePaid: 0, advanceAmount: 0, balancePaid: 0, balanceAmount: 0,
//     advancePending: 0, balancePending: 0,
//     gvCancellation: 0, irctcCancellation: 0, cancellationTotal: 0, refund: 0,
//   });
//   const stats = new Map();
//   const details = [];

//   for (const b of bookings) {
//     const key = resolveKey(emps, keyOfWho(b.bookedBy) || (b.createdBy === "user" ? "user" : "admin"));
//     if (!isStaffKey(key)) continue;
//     ensureEmp(emps, key, b.bookedBy);
//     if (!stats.has(key)) stats.set(key, blank());
//     const s = stats.get(key);
//     const bs = bookingState(b);
//     const adv = b.payment?.advance || {};
//     const bal = b.payment?.balance || {};
//     const rec = cancelByTnr.get(b.tnr) || { gv: 0, irctc: 0, total: 0, refund: 0 };
//     // GV / IRCTC cancellation — Tour Booking la irukkura pool (ovvoru cancellation um serndhu) dhaan main.
//     // Pool illaadha pazhaya bookings ku cancellation records la irundhu. Rendum serkkala (double aagum).
//     const c = {
//       gv: b.gvCancellationPool != null ? num(b.gvCancellationPool) : rec.gv,
//       irctc: b.irctcCancellationPool != null ? num(b.irctcCancellationPool) : rec.irctc,
//       refund: rec.refund,
//     };

//     s.total += 1;
//     s[bs.state] += 1;
//     s.travellers += bs.travellers;
//     const counts = MONEY_STATES.has(bs.state);
//     if (adv.paid && counts) { s.advancePaid += 1; s.advanceAmount += num(adv.amount); } else if (!adv.paid && bs.state === "active") s.advancePending += 1;
//     // Cancellation la balance adjust aagi 0 / minus aanaa (refund la equalize) — "paid" nu irundhaalum
//     // kaasu vandhadhu illa. Balance amount > 0 + paid na mattum "Balance paid" la count.
//     if (bal.paid && num(bal.amount) > 0 && counts) { s.balancePaid += 1; s.balanceAmount += num(bal.amount); }
//     else if (!bal.paid && bs.state === "active") s.balancePending += 1;
//     s.gvCancellation += c.gv;
//     s.irctcCancellation += c.irctc;
//     s.cancellationTotal += c.gv + c.irctc;
//     s.refund += c.refund; // customer ku thirumba kudukka vendiya / kudutha amount (approve aana cancellation)

//     if (wantKey && (wantKey === "*" || key === wantKey)) {
//       details.push({
//         empKey: key,
//         tnr: b.tnr || "",
//         bookingDate: b.bookingDate,
//         tour: b.tourData?.title || "",
//         customer: b.userData?.name || "",
//         state: bs.state,
//         travellers: bs.travellers,
//         activeTr: bs.activeTr,
//         cancelledTr: bs.cancelledTr,
//         rejectedTr: bs.rejectedTr,
//         requestedTr: bs.requestedTr,
//         advance: { amount: num(adv.amount), paid: !!adv.paid, paidAt: adv.paidAt || null },
//         balance: { amount: num(bal.amount), paid: !!bal.paid && num(bal.amount) > 0, adjusted: !!bal.paid && num(bal.amount) <= 0, paidAt: bal.paidAt || null },
//         gvCancellation: c.gv,
//         irctcCancellation: c.irctc,
//         refund: c.refund,
//       });
//     }
//   }
//   const rows = [...stats.entries()].map(([key, s]) => ({ key, ...s }));
//   details.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
//   return { rows, details };
// };

// // ══════════════════════════ FIT ENQUIRIES ══════════════════════════
// const FIT_ACTIONS = {
//   created: "raised", pickedUp: "pickedUp", rateShared: "rateShared", accepted: "accepted",
//   closed: "closed", cancelled: "cancelled", rejected: "rejected", reopened: "reopened", forwarded: "forwarded",
// };
// const fitStats = async (emps, from, to, wantKey) => {
//   const enquiries = await enquiryModel
//     .find()
//     .select("fitCode fullName destination status isPickedUp isRatePassed isClosed isCancelled salesValue cancellationCharge actionLog pickedUpBy pickedUpAt cancelledBy cancelledAt owner createdAt preferredTravelDate zone delegations")
//     .lean();

//   const blank = () => ({
//     raised: 0, pickedUp: 0, rateShared: 0, accepted: 0, salesValue: 0, closed: 0, cancelled: 0,
//     cancellationCharge: 0, rejected: 0, reopened: 0, forwarded: 0, withMe: 0,
//   });
//   const stats = new Map();
//   const st = (key) => {
//     if (!stats.has(key)) stats.set(key, blank());
//     return stats.get(key);
//   };
//   const details = [];

//   for (const e of enquiries) {
//     const log = Array.isArray(e.actionLog) ? [...e.actionLog] : [];
//     // Pazhaya enquiries — log illaadha pickup / cancel
//     if (e.pickedUpBy && !log.some((a) => a.action === "pickedUp")) log.push({ action: "pickedUp", by: e.pickedUpBy, at: e.pickedUpAt });
//     if (e.cancelledBy && !log.some((a) => a.action === "cancelled")) log.push({ action: "cancelled", by: e.cancelledBy, at: e.cancelledAt });

//     const mine = new Set();
//     log.forEach((a) => {
//       const field = FIT_ACTIONS[a.action];
//       if (!field || !inRange(a.at, from, to)) return;
//       const k = resolveKey(emps, keyOfWho(a.by));
//       if (!k) return;
//       ensureEmp(emps, k, a.by);
//       const s = st(k);
//       s[field] += 1;
//       if (a.action === "accepted") s.salesValue += num(e.salesValue);
//       if (a.action === "cancelled") s.cancellationCharge += num(e.cancellationCharge);
//       mine.add(k);
//     });
//     // Ippo yaar kitta irukku (date filter illa — current)
//     const ownerKey = resolveKey(emps, keyOfWho(e.owner || (e.isPickedUp ? e.pickedUpBy : null)));
//     if (ownerKey) { ensureEmp(emps, ownerKey, e.owner || e.pickedUpBy); st(ownerKey).withMe += 1; }

//     const ALL = wantKey === "*";
//     // Forward history — indha employee forward pannadhu (fwdOut) / indha employee ku vandhadhu (fwdIn)
//     const fwdOut = [];
//     const fwdIn = [];
//     if (wantKey && !ALL) {
//       (Array.isArray(e.delegations) ? e.delegations : []).forEach((d) => {
//         if (!d || !inRange(d.at, from, to)) return;
//         const toKey = d.to?.type === "team" ? "" : resolveKey(emps, keyOfWho(d.to)) || "";
//         const toLabel = d.to?.type === "team" ? `${d.to?.name || ""} team` : d.to?.name || "";
//         const byKey = resolveKey(emps, keyOfWho(d.by)) || "";
//         if (byKey === wantKey) fwdOut.push({ key: toKey, label: toLabel, at: d.at || null });
//         if (toKey === wantKey) fwdIn.push({ key: byKey, label: d.by?.name || "", at: d.at || null });
//       });
//     }
//     // ALL: ellaa enquiries um (indha dates la vandhadhu, illa indha dates la yaaravadhu vela senjadhu)
//     if (wantKey && (ALL ? mine.size > 0 || inRange(e.createdAt, from, to) : mine.has(wantKey) || ownerKey === wantKey || fwdOut.length || fwdIn.length)) {
//       const stage =
//         e.status === "pending" ? (e.isRatePassed ? "Rate shared" : e.isPickedUp ? "Picked up" : "Pending")
//           : e.status === "accepted" ? (e.isCancelled ? "Cancelled" : e.isClosed ? "Closed" : "Accepted")
//             : "Rejected";
//       details.push({
//         _id: e._id,
//         fitCode: e.fitCode || "",
//         name: e.fullName || "",
//         destination: e.destination || "",
//         stage,
//         salesValue: num(e.salesValue),
//         zone: e.zone?.name || "",
//         createdAt: e.createdAt,
//         withMe: ALL ? false : ownerKey === wantKey,
//         ownerKey: ownerKey || "",
//         fwdOut,
//         fwdIn,
//         actions: log
//           .filter((a) => FIT_ACTIONS[a.action] && inRange(a.at, from, to) && (ALL || resolveKey(emps, keyOfWho(a.by)) === wantKey))
//           .sort((x, y) => new Date(x.at || 0) - new Date(y.at || 0))
//           .map((a) => ({ action: a.action, at: a.at || null, by: resolveKey(emps, keyOfWho(a.by)) || "" })),
//       });
//     }
//   }
//   const rows = [...stats.entries()].map(([key, s]) => ({ key, ...s }));
//   details.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//   return { rows, details };
// };

// // ─── GET /api/touradmin/employee-performance ───────────────────
// export const getEmployeePerformance = async (req, res) => {
//   try {
//     const { from: f, to: t, employee = "" } = req.query || {};
//     const tab = req.perfTab ?? (req.query?.tab || ""); // fit-performance / employee-performance route set pannum
//     const okDate = (d) => !d || /^\d{4}-\d{2}-\d{2}$/.test(d);
//     if (!okDate(f) || !okDate(t)) return res.status(400).json({ success: false, message: "Dates must be YYYY-MM-DD" });
//     let from = dayStart(f);
//     const to = dayEnd(t);
//     const wantKey = String(employee || "").slice(0, 80) || null;
//     if (wantKey && wantKey !== "*" && wantKey.startsWith("staff:") && !mongoose.isValidObjectId(wantKey.slice(6))) {
//       return res.status(400).json({ success: false, message: "Invalid employee" });
//     }

//     const emps = await loadEmployees();
//     // Staff thani login eppo aarambichadhu — .env STAFF_TICKETS_FROM, illana mudhal staff-portal ticket date.
//     // Adhukku munnaadi ellaam shared Tour admin / Admin login la — oru person ku credit panna mudiyaadhu.
//     let staffSince = process.env.STAFF_TICKETS_FROM || null;
//     if (!staffSince) {
//       const first = await Query.findOne({ raisedByStaffLogin: true }).sort({ createdAt: 1 }).select("createdAt").lean();
//       if (first?.createdAt) {
//         const d = new Date(new Date(first.createdAt).getTime() + 5.5 * 36e5); // IST date
//         staffSince = d.toISOString().slice(0, 10);
//       }
//     }
//     // Date clamp illa — staff ku map aagura ellaa velai um (Aadhaar upload la staff select pannadhu um) count aagum.
//     // Yaar nu theriyaadha / common login velai "shared" rows la — frontend "Staff only" la maraiyum.
//     // tab kuduththaa andha tab mattum (fast); illana moonum
//     const want = (x) => !tab || String(tab).split(",").includes(x);
//     const [tickets, bookings, fit] = await Promise.all([
//       want("tickets") ? ticketStats(emps, from, to, wantKey) : null,
//       want("bookings") ? bookingStats(emps, from, to, wantKey) : null,
//       want("fit") ? fitStats(emps, from, to, wantKey) : null,
//     ]);

//     return res.status(200).json({
//       success: true,
//       range: { from: from ? new Date(from.getTime() + 5.5 * 36e5).toISOString().slice(0, 10) : null, to: t || null },
//       staffSince,
//       employees: [...emps.values()],
//       tickets,
//       bookings,
//       fit,
//     });
//   } catch (err) {
//     console.error("getEmployeePerformance error:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

// // ─── GET /api/touradmin/fit-performance — FIT mattum (thani page / thani tab) ───
// export const getFitPerformance = (req, res) => {
//   req.perfTab = "fit";
//   return getEmployeePerformance(req, res);
// };

// // /employee-performance la FIT illa (adhu thani page) — tab=fit kettaalum tickets + bookings mattum
// export const getStaffPerformance = (req, res) => {
//   const t = req.query?.tab;
//   req.perfTab = t === "tickets" || t === "bookings" ? t : "tickets,bookings";
//   return getEmployeePerformance(req, res);
// };

// export default getEmployeePerformance;

// ══════════════════════════════════════════════════════════════════════════════
// EMPLOYEE PERFORMANCE — hike decide panna (Admin panel / CEO tab)
//   GET /api/touradmin/employee-performance?from=YYYY-MM-DD&to=YYYY-MM-DD&employee=<key>
//
//   Tickets  : raise panna, assign aanadhu, close / reject, forward, reopen, replies, edits
//   Bookings : booking create panna login (Booked by) wise —
//              total = active + cancelled + rejected, advance / balance paid, cancellation amount (GV + IRCTC)
//   FIT      : pick up, rate share, accept (sales value), close, cancel, reject, forward
//
//   employee=<key> kuduththaa andha aal oda details list um (tickets / bookings / FIT).
//   Key: "staff:<id>" | "touradmin" | "admin" | "user" | "name:<employeeId or name>"
// Read only — edhaiyum maathaadhu.
// ══════════════════════════════════════════════════════════════════════════════
import mongoose from "mongoose";
import Query from "../models/queryModel.js";
import tourBookingModel from "../models/tourBookingmodel.js";
import cancellationModel from "../models/cancellationModel.js";
import enquiryModel from "../models/enquiryModel.js";
import staffModel from "../models/staffProfileModel.js";
import "../models/staffRoleModel.js";
import { attachBookedBy } from "../utils/bookedBy.js";

// ─── Helpers ──────────────────────────────────────────────────
const IST = "+05:30";
const dayStart = (d) => (d ? new Date(`${d}T00:00:00${IST}`) : null);
const dayEnd = (d) => (d ? new Date(`${d}T23:59:59.999${IST}`) : null);
const inRange = (at, from, to) => {
  if (!from && !to) return true;
  if (!at) return false;
  const t = new Date(at).getTime();
  return (!from || t >= from.getTime()) && (!to || t <= to.getTime());
};
const dateFilter = (field, from, to) =>
  from || to ? { [field]: { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) } } : {};
const sid = (v) => (v ? String(v._id || v) : "");
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// whoRaised / owner snapshot → employee key
const keyOfWho = (w) => {
  if (!w) return null;
  if (w.unknown) return "unknown"; // pazhaya booking — yaar login nu record illa
  if (w.type === "staff") {
    if (w.staffId) return `staff:${sid(w.staffId)}`;
    const n = w.employeeId || w.name;
    return n ? `name:${n}` : null;
  }
  if (w.type === "touradmin") return "touradmin";
  if (w.type === "admin") return "admin";
  if (w.type === "user") return "user";
  return null;
};

// ─── Employee list (staff + Tour admin + Admin) ───────────────
const loadEmployees = async () => {
  const staff = await staffModel
    .find()
    .select("fullName employeeId designation department status loginEnabled role photo")
    .populate("role", "name")
    .lean();
  const map = new Map();
  staff.forEach((s) =>
    map.set(`staff:${s._id}`, {
      key: `staff:${s._id}`,
      type: "staff",
      staffId: s._id,
      name: s.fullName || "",
      employeeId: s.employeeId || "",
      role: s.role?.name || s.designation || "",
      status: s.status === "Inactive" || s.loginEnabled === false ? "Inactive" : "Active",
      photo: s.photo || "",
    }),
  );
  map.set("touradmin", { key: "touradmin", type: "touradmin", name: "Tour admin", employeeId: "", role: "", status: "Active" });
  map.set("admin", { key: "admin", type: "admin", name: "Admin", employeeId: "", role: "", status: "Active" });
  map.set("unknown", { key: "unknown", type: "unknown", name: "Not recorded", employeeId: "", role: "Old bookings — login not saved", status: "" });
  return map;
};
// Aadhaar upload (Create Booking auto) la "Raised by" staff — { name, employeeId } mattum save aagum.
// Adha Staff Profile oda employeeId (illana peyar) vachu staff ku map pannrom — Aadhaar upload page maadhiriye.
const resolveKey = (emps, key) => {
  if (!key || !key.startsWith("name:")) return key;
  const v = key.slice(5).trim().toLowerCase();
  for (const e of emps.values()) {
    if (e.type === "staff" && e.staffId && ((e.employeeId && e.employeeId.toLowerCase() === v) || (e.name && e.name.trim().toLowerCase() === v))) return e.key;
  }
  return key;
};
// Staff profile illaadha aal (delete aanavanga / pazhaya name mattum) — list la serkka
const ensureEmp = (emps, key, who) => {
  if (!key || emps.has(key)) return;
  if (key === "user") { emps.set(key, { key, type: "user", name: "Website (customer)", employeeId: "", role: "", status: "" }); return; }
  emps.set(key, {
    key,
    type: who?.type || "staff",
    name: who?.name || (key === "user" ? "Website (customer)" : key.startsWith("staff:") ? "Removed staff" : key.replace(/^name:/, "")),
    employeeId: who?.employeeId || "",
    role: who?.role || "",
    status: key === "user" ? "" : "Removed",
  });
};

// ══════════════════════════ TICKETS ══════════════════════════
const ticketStats = async (emps, from, to, wantKey) => {
  const tickets = await Query.find(dateFilter("createdAt", from, to))
    .select("ticketNo subject queryType status raisedBy raisedTo raisedToRole raisedVia raisedByStaffLogin createdAt pickupAt processingAt closedAt rejectedAt replies.staff replies.byStaffLogin replies.createdAt replies.editedAt editHistory.kind editHistory.editedAt delegations reopens reopenCount tnr")
    .populate("raisedBy", "fullName employeeId")
    .populate("raisedTo", "fullName employeeId")
    .populate("raisedToRole", "name")
    .lean();

  const blank = () => ({
    raised: 0, assigned: 0, open: 0, inProgress: 0, closed: 0, rejected: 0,
    forwardedOut: 0, forwardedIn: 0, reopenedBy: 0, replies: 0, repliesEdited: 0, ticketEdits: 0,
    closeHours: [], // avg kanakku ku
  });
  const stats = new Map();
  const st = (key) => {
    if (!stats.has(key)) stats.set(key, blank());
    return stats.get(key);
  };
  const details = [];

  for (const t of tickets) {
    // Staff portal la theriyura tickets mattum staff kanakku ku (avanga "Raised by me" / "Assigned to me" la varradhu):
    //   staff login la raise aanadhu, illa forward aagi vandhadhu. Admin / Tour admin page la raise panni
    //   staff peyar select pannadhu staff portal la theriyaadhu — adhu avanga velai illa.
    const onPortal = !!t.raisedByStaffLogin || (t.delegations || []).length > 0;
    const raiserKey = t.raisedByStaffLogin && t.raisedBy?._id ? `staff:${t.raisedBy._id}` : null;
    const assigneeKey = onPortal && t.raisedTo?._id ? `staff:${t.raisedTo._id}` : null;
    const touched = new Set();

    if (raiserKey) {
      ensureEmp(emps, raiserKey, { type: "staff", name: t.raisedBy.fullName, employeeId: t.raisedBy.employeeId });
      st(raiserKey).raised += 1;
      // Staff portal ticket la edit = raise pannavanga dhaan
      if (t.raisedByStaffLogin) st(raiserKey).ticketEdits += (t.editHistory || []).filter((h) => h.kind === "query").length;
      touched.add(raiserKey);
    }
    if (assigneeKey) {
      ensureEmp(emps, assigneeKey, { type: "staff", name: t.raisedTo.fullName, employeeId: t.raisedTo.employeeId });
      const s = st(assigneeKey);
      s.assigned += 1;
      if (t.status === "open") s.open += 1;
      else if (t.status === "pickup" || t.status === "processing") s.inProgress += 1;
      else if (t.status === "close") {
        s.closed += 1;
        if (t.closedAt && t.createdAt) s.closeHours.push((new Date(t.closedAt) - new Date(t.createdAt)) / 36e5);
      } else if (t.status === "reject") s.rejected += 1;
      touched.add(assigneeKey);
    }
    (t.delegations || []).forEach((d) => {
      const out = d.from?.type === "staff" && d.from.staffId ? `staff:${sid(d.from.staffId)}` : keyOfWho(d.by);
      if (out) { ensureEmp(emps, out, d.from?.type === "staff" ? d.from : d.by); st(out).forwardedOut += 1; touched.add(out); }
      if (d.to?.type === "staff" && d.to.staffId) {
        const inn = `staff:${sid(d.to.staffId)}`;
        ensureEmp(emps, inn, d.to);
        st(inn).forwardedIn += 1;
        touched.add(inn);
      }
    });
    (t.reopens || []).forEach((r) => {
      const k = keyOfWho(r.by);
      if (k) { ensureEmp(emps, k, r.by); st(k).reopenedBy += 1; touched.add(k); }
    });
    (t.replies || []).forEach((r) => {
      if (!r.staff) return;
      const k = `staff:${sid(r.staff)}`;
      st(k).replies += 1;
      if (r.editedAt) st(k).repliesEdited += 1;
      touched.add(k);
    });

    const ALL = wantKey === "*"; // "*" = ellaa staff records um (filter panni paakka)
    if (wantKey && (ALL ? onPortal : touched.has(wantKey))) {
      const myReplies = (t.replies || []).filter((r) => r.staff && `staff:${sid(r.staff)}` === wantKey).length;
      details.push({
        _id: t._id,
        ticketNo: t.ticketNo || "",
        subject: t.subject,
        queryType: t.queryType,
        status: t.status,
        tnr: t.tnr || "",
        createdAt: t.createdAt,
        closedAt: t.closedAt || null,
        raisedBy: t.raisedBy?.fullName || "",
        raisedTo: t.raisedTo?.fullName || (t.raisedToRole?.name ? `${t.raisedToRole.name} team` : ""),
        raisedByKey: raiserKey || "",
        raisedToKey: assigneeKey || "",
        roles: ALL ? [] : [
          raiserKey === wantKey ? "Raised" : null,
          assigneeKey === wantKey ? "Assigned" : null,
          (t.delegations || []).some((d) => d.from?.staffId && `staff:${sid(d.from.staffId)}` === wantKey) ? "Forwarded" : null,
          (t.reopens || []).some((r) => keyOfWho(r.by) === wantKey) ? "Reopened" : null,
          myReplies ? `${myReplies} replies` : null,
        ].filter(Boolean),
        edits: (t.editHistory || []).filter((h) => h.kind === "query").length,
      });
    }
  }

  const rows = [...stats.entries()].map(([key, s]) => {
    const { closeHours, ...rest } = s;
    return {
      key,
      ...rest,
      closeRate: s.assigned ? Math.round((s.closed / s.assigned) * 100) : 0,
      avgCloseHours: closeHours.length ? Math.round((closeHours.reduce((a, b) => a + b, 0) / closeHours.length) * 10) / 10 : null,
    };
  });
  details.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return { rows, details };
};

// ══════════════════════════ TOUR BOOKINGS ══════════════════════════
// Traveller status: byAdmin + byTraveller = Cancelled · byAdmin mattum = Rejected · onnum illa = Active
const bookingState = (b) => {
  const tr = b.travellers || [];
  let cancelled = 0, tripCancelled = 0, rejected = 0, requested = 0;
  tr.forEach((t) => {
    const c = t.cancelled || {};
    if (c.viaTripCancel) tripCancelled += 1;
    if (c.byAdmin && c.byTraveller) cancelled += 1; // proper cancellation (admin + traveller)
    else if (c.viaTripCancel) { /* trip cancel — no charge */ }
    else if (c.byAdmin && !c.byTraveller) rejected += 1;
    else if (c.byTraveller && !c.byAdmin) requested += 1; // cancellation request — innum approve aagala
  });
  const tripOnly = tr.filter((t) => t.cancelled?.viaTripCancel && !(t.cancelled?.byAdmin && t.cancelled?.byTraveller)).length;
  const active = tr.length - cancelled - tripOnly - rejected - requested;
  const adv = b.payment?.advance || {};
  const bal = b.payment?.balance || {};
  // Tour admin Sales Analytics (getAnalyticsSummary) la irukkura adhe rule:
  //   ellaa travellers um admin+traveller cancel → Fully cancelled
  //   ellaa travellers um admin reject → Rejected
  //   yaaravadhu trip cancel la (fully cancelled illana) → Trip cancelled
  //   illana payment vechu: advance kattala → Unverified · advance mattum → Active · advance + balance → Completed
  const allCancelled = tr.length > 0 && cancelled === tr.length;
  const allRejected = tr.length > 0 && rejected === tr.length;
  let state;
  if (allCancelled) state = "cancelled";
  else if (allRejected) state = "rejected";
  else if (tripCancelled > 0) state = "tripCancelled";
  else state = adv.paid !== true ? "unverified" : bal.paid === true ? "completed" : "active";
  return { state, travellers: tr.length, activeTr: active, cancelledTr: cancelled + tripOnly, rejectedTr: rejected, requestedTr: requested };
};

// Kaasu "received" la count aagura states
const MONEY_STATES = new Set(["active", "completed"]); // Active + Completed mattum — Unverified / request / cancelled / rejected venaam
// Thani staff login / Aadhaar employee ID map aana bookings mattum (Tour admin, Admin, Website, pazhaya shared login venaam)
const isStaffKey = (k) => typeof k === "string" && (k.startsWith("staff:") || k.startsWith("name:"));

const bookingStats = async (emps, from, to, wantKey) => {
  const bookings = await tourBookingModel
    .find(dateFilter("bookingDate", from, to))
    .select("tnr bookingDate createdBy createdByWho userId userData.name userData.email tourData.title tourId travellers.cancelled travellers.title travellers.firstName travellers.lastName payment gvCancellationPool irctcCancellationPool")
    .lean();
  await attachBookedBy(bookings);

  // Approve aana cancellation records — GV / IRCTC amount
  const tnrs = bookings.map((b) => b.tnr).filter(Boolean);
  const cancels = tnrs.length
    ? await cancellationModel
        .find({ tnr: { $in: tnrs }, approvedBy: true })
        .select("tnr gvCancellationAmount irctcCancellationAmount totalCancellationAmount refundAmount")
        .lean()
    : [];
  const cancelByTnr = new Map();
  cancels.forEach((c) => {
    const cur = cancelByTnr.get(c.tnr) || { gv: 0, irctc: 0, total: 0, refund: 0 };
    cur.gv += num(c.gvCancellationAmount);
    cur.irctc += num(c.irctcCancellationAmount);
    cur.total += num(c.totalCancellationAmount);
    cur.refund += num(c.refundAmount);
    cancelByTnr.set(c.tnr, cur);
  });

  const blank = () => ({
    total: 0, active: 0, unverified: 0, completed: 0, cancelRequested: 0, tripCancelled: 0, cancelled: 0, rejected: 0, travellers: 0,
    advancePaid: 0, advanceAmount: 0, balancePaid: 0, balanceAmount: 0,
    advancePending: 0, balancePending: 0,
    gvCancellation: 0, irctcCancellation: 0, cancellationTotal: 0, refund: 0,
  });
  const stats = new Map();
  const details = [];

  for (const b of bookings) {
    const key = resolveKey(emps, keyOfWho(b.bookedBy) || (b.createdBy === "user" ? "user" : "admin"));
    if (!isStaffKey(key)) continue;
    ensureEmp(emps, key, b.bookedBy);
    if (!stats.has(key)) stats.set(key, blank());
    const s = stats.get(key);
    const bs = bookingState(b);
    const adv = b.payment?.advance || {};
    const bal = b.payment?.balance || {};
    const rec = cancelByTnr.get(b.tnr) || { gv: 0, irctc: 0, total: 0, refund: 0 };
    // GV / IRCTC cancellation — Tour Booking la irukkura pool (ovvoru cancellation um serndhu) dhaan main.
    // Pool illaadha pazhaya bookings ku cancellation records la irundhu. Rendum serkkala (double aagum).
    const c = {
      gv: b.gvCancellationPool != null ? num(b.gvCancellationPool) : rec.gv,
      irctc: b.irctcCancellationPool != null ? num(b.irctcCancellationPool) : rec.irctc,
      refund: rec.refund,
    };

    s.total += 1;
    s[bs.state] += 1;
    s.travellers += bs.travellers;
    const counts = MONEY_STATES.has(bs.state);
    if (adv.paid && counts) { s.advancePaid += 1; s.advanceAmount += num(adv.amount); } else if (!adv.paid && bs.state === "unverified") s.advancePending += 1;
    // Cancellation la balance adjust aagi 0 / minus aanaa (refund la equalize) — "paid" nu irundhaalum
    // kaasu vandhadhu illa. Balance amount > 0 + paid na mattum "Balance paid" la count.
    if (bal.paid && num(bal.amount) > 0 && counts) { s.balancePaid += 1; s.balanceAmount += num(bal.amount); }
    else if (!bal.paid && !(num(bal.amount) <= 0) && bs.state === "active") s.balancePending += 1; // advance mattum kattinavanga
    s.gvCancellation += c.gv;
    s.irctcCancellation += c.irctc;
    s.cancellationTotal += c.gv + c.irctc;
    s.refund += c.refund; // customer ku thirumba kudukka vendiya / kudutha amount (approve aana cancellation)

    if (wantKey && (wantKey === "*" || key === wantKey)) {
      details.push({
        empKey: key,
        tnr: b.tnr || "",
        bookingDate: b.bookingDate,
        tour: b.tourData?.title || "",
        // Customer = booking la mudhal traveller (main traveller). userData.name = login account (staff / admin account aagalaam) — adhu venaam
        customer:
          [b.travellers?.[0]?.title, b.travellers?.[0]?.firstName, b.travellers?.[0]?.lastName].filter(Boolean).join(" ").trim() ||
          b.userData?.name ||
          "",
        state: bs.state,
        travellers: bs.travellers,
        activeTr: bs.activeTr,
        cancelledTr: bs.cancelledTr,
        rejectedTr: bs.rejectedTr,
        requestedTr: bs.requestedTr,
        advance: { amount: num(adv.amount), paid: !!adv.paid, paidAt: adv.paidAt || null },
        balance: { amount: num(bal.amount), paid: !!bal.paid && num(bal.amount) > 0, adjusted: !!bal.paid && num(bal.amount) <= 0, paidAt: bal.paidAt || null },
        gvCancellation: c.gv,
        irctcCancellation: c.irctc,
        refund: c.refund,
      });
    }
  }
  const rows = [...stats.entries()].map(([key, s]) => ({ key, ...s }));
  details.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
  return { rows, details };
};

// ══════════════════════════ FIT ENQUIRIES ══════════════════════════
const FIT_ACTIONS = {
  created: "raised", pickedUp: "pickedUp", rateShared: "rateShared", accepted: "accepted",
  closed: "closed", cancelled: "cancelled", rejected: "rejected", reopened: "reopened", forwarded: "forwarded",
};
const fitStats = async (emps, from, to, wantKey) => {
  const enquiries = await enquiryModel
    .find()
    .select("fitCode fullName destination status isPickedUp isRatePassed isClosed isCancelled salesValue cancellationCharge actionLog pickedUpBy pickedUpAt cancelledBy cancelledAt owner createdAt preferredTravelDate zone delegations mobileNumber tourType numberOfDays numberOfNights adults children infants raisedBy pickupDate")
    .lean();

  const blank = () => ({
    raised: 0, pickedUp: 0, rateShared: 0, accepted: 0, salesValue: 0, closed: 0, cancelled: 0,
    cancellationCharge: 0, rejected: 0, reopened: 0, forwarded: 0, withMe: 0,
  });
  const stats = new Map();
  const st = (key) => {
    if (!stats.has(key)) stats.set(key, blank());
    return stats.get(key);
  };
  const details = [];

  for (const e of enquiries) {
    const log = Array.isArray(e.actionLog) ? [...e.actionLog] : [];
    // Pazhaya enquiries — log illaadha pickup / cancel
    if (e.pickedUpBy && !log.some((a) => a.action === "pickedUp")) log.push({ action: "pickedUp", by: e.pickedUpBy, at: e.pickedUpAt });
    if (e.cancelledBy && !log.some((a) => a.action === "cancelled")) log.push({ action: "cancelled", by: e.cancelledBy, at: e.cancelledAt });

    const mine = new Set();
    log.forEach((a) => {
      const field = FIT_ACTIONS[a.action];
      if (!field || !inRange(a.at, from, to)) return;
      const k = resolveKey(emps, keyOfWho(a.by));
      if (!k) return;
      ensureEmp(emps, k, a.by);
      const s = st(k);
      s[field] += 1;
      if (a.action === "accepted") s.salesValue += num(e.salesValue);
      if (a.action === "cancelled") s.cancellationCharge += num(e.cancellationCharge);
      mine.add(k);
    });
    // Ippo yaar kitta irukku (date filter illa — current)
    const ownerKey = resolveKey(emps, keyOfWho(e.owner || (e.isPickedUp ? e.pickedUpBy : null)));
    if (ownerKey) { ensureEmp(emps, ownerKey, e.owner || e.pickedUpBy); st(ownerKey).withMe += 1; }

    const ALL = wantKey === "*";
    // Forward history — indha employee forward pannadhu (fwdOut) / indha employee ku vandhadhu (fwdIn)
    const fwdOut = [];
    const fwdIn = [];
    if (wantKey && !ALL) {
      (Array.isArray(e.delegations) ? e.delegations : []).forEach((d) => {
        if (!d || !inRange(d.at, from, to)) return;
        const toKey = d.to?.type === "team" ? "" : resolveKey(emps, keyOfWho(d.to)) || "";
        const toLabel = d.to?.type === "team" ? `${d.to?.name || ""} team` : d.to?.name || "";
        const byKey = resolveKey(emps, keyOfWho(d.by)) || "";
        if (byKey === wantKey) fwdOut.push({ key: toKey, label: toLabel, at: d.at || null });
        if (toKey === wantKey) fwdIn.push({ key: byKey, label: d.by?.name || "", at: d.at || null });
      });
    }
    // ALL: ellaa enquiries um (indha dates la vandhadhu, illa indha dates la yaaravadhu vela senjadhu)
    if (wantKey && (ALL ? mine.size > 0 || inRange(e.createdAt, from, to) : mine.has(wantKey) || ownerKey === wantKey || fwdOut.length || fwdIn.length)) {
      const stage =
        e.status === "pending" ? (e.isRatePassed ? "Rate shared" : e.isPickedUp ? "Picked up" : "Pending")
          : e.status === "accepted" ? (e.isCancelled ? "Cancelled" : e.isClosed ? "Closed" : "Accepted")
            : "Rejected";
      details.push({
        _id: e._id,
        fitCode: e.fitCode || "",
        name: e.fullName || "",
        destination: e.destination || "",
        stage,
        salesValue: num(e.salesValue),
        zone: e.zone?.name || "",
        createdAt: e.createdAt,
        withMe: ALL ? false : ownerKey === wantKey,
        ownerKey: ownerKey || "",
        mobile: e.mobileNumber || "",
        tourType: e.tourType || "",
        travelDate: e.preferredTravelDate || null,
        pickupDate: e.pickupDate || null,
        days: e.numberOfDays || null,
        nights: e.numberOfNights ?? null,
        pax: num(e.adults) + num(e.children) + num(e.infants),
        raisedVia: e.raisedBy === "admin" ? "Admin" : "User",
        // Yaar raise panna — "created" log la irukkura login; illana website customer / pazhaya shared admin
        raisedByWho: (() => {
          const c = log.find((a) => a.action === "created" && a.by);
          if (c) return { key: resolveKey(emps, keyOfWho(c.by)) || "", name: c.by?.name || (c.by?.type === "touradmin" ? "Tour admin" : c.by?.type === "admin" ? "Admin" : "") };
          return e.raisedBy === "admin" ? { key: "", name: "Admin (old login)" } : { key: "", name: "Website (customer)" };
        })(),
        cancellationCharge: e.isCancelled ? num(e.cancellationCharge) : 0,
        zones: Array.isArray(e.zone?.list) && e.zone.list.length ? e.zone.list.map((z) => z.name).filter(Boolean) : String(e.zone?.name || "").split(",").map((z) => z.trim()).filter(Boolean),
        // Kadaisi action yaar panna (status keezha "by …")
        lastBy: (() => {
          const last = [...log].filter((a) => FIT_ACTIONS[a.action] && a.by).sort((x, y) => new Date(y.at || 0) - new Date(x.at || 0))[0];
          if (!last) return null;
          const k = resolveKey(emps, keyOfWho(last.by));
          return { key: k || "", name: last.by?.name || (last.by?.type === "touradmin" ? "Tour admin" : last.by?.type === "admin" ? "Admin" : ""), action: last.action, at: last.at || null };
        })(),
        fwdOut,
        fwdIn,
        actions: log
          .filter((a) => FIT_ACTIONS[a.action] && inRange(a.at, from, to) && (ALL || resolveKey(emps, keyOfWho(a.by)) === wantKey))
          .sort((x, y) => new Date(x.at || 0) - new Date(y.at || 0))
          .map((a) => ({ action: a.action, at: a.at || null, by: resolveKey(emps, keyOfWho(a.by)) || "" })),
      });
    }
  }
  const rows = [...stats.entries()].map(([key, s]) => ({ key, ...s }));
  details.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return { rows, details };
};

// ─── GET /api/touradmin/employee-performance ───────────────────
export const getEmployeePerformance = async (req, res) => {
  try {
    const { from: f, to: t, employee = "" } = req.query || {};
    const tab = req.perfTab ?? (req.query?.tab || ""); // fit-performance / employee-performance route set pannum
    const okDate = (d) => !d || /^\d{4}-\d{2}-\d{2}$/.test(d);
    if (!okDate(f) || !okDate(t)) return res.status(400).json({ success: false, message: "Dates must be YYYY-MM-DD" });
    let from = dayStart(f);
    const to = dayEnd(t);
    const wantKey = String(employee || "").slice(0, 80) || null;
    if (wantKey && wantKey !== "*" && wantKey.startsWith("staff:") && !mongoose.isValidObjectId(wantKey.slice(6))) {
      return res.status(400).json({ success: false, message: "Invalid employee" });
    }

    const emps = await loadEmployees();
    // Staff thani login eppo aarambichadhu — .env STAFF_TICKETS_FROM, illana mudhal staff-portal ticket date.
    // Adhukku munnaadi ellaam shared Tour admin / Admin login la — oru person ku credit panna mudiyaadhu.
    let staffSince = process.env.STAFF_TICKETS_FROM || null;
    if (!staffSince) {
      const first = await Query.findOne({ raisedByStaffLogin: true }).sort({ createdAt: 1 }).select("createdAt").lean();
      if (first?.createdAt) {
        const d = new Date(new Date(first.createdAt).getTime() + 5.5 * 36e5); // IST date
        staffSince = d.toISOString().slice(0, 10);
      }
    }
    // Date clamp illa — staff ku map aagura ellaa velai um (Aadhaar upload la staff select pannadhu um) count aagum.
    // Yaar nu theriyaadha / common login velai "shared" rows la — frontend "Staff only" la maraiyum.
    // tab kuduththaa andha tab mattum (fast); illana moonum
    const want = (x) => !tab || String(tab).split(",").includes(x);
    const [tickets, bookings, fit] = await Promise.all([
      want("tickets") ? ticketStats(emps, from, to, wantKey) : null,
      want("bookings") ? bookingStats(emps, from, to, wantKey) : null,
      want("fit") ? fitStats(emps, from, to, wantKey) : null,
    ]);

    return res.status(200).json({
      success: true,
      range: { from: from ? new Date(from.getTime() + 5.5 * 36e5).toISOString().slice(0, 10) : null, to: t || null },
      staffSince,
      employees: [...emps.values()],
      tickets,
      bookings,
      fit,
    });
  } catch (err) {
    console.error("getEmployeePerformance error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/touradmin/fit-performance — FIT mattum (thani page / thani tab) ───
export const getFitPerformance = (req, res) => {
  req.perfTab = "fit";
  return getEmployeePerformance(req, res);
};

// /employee-performance la FIT illa (adhu thani page) — tab=fit kettaalum tickets + bookings mattum
export const getStaffPerformance = (req, res) => {
  const t = req.query?.tab;
  req.perfTab = t === "tickets" || t === "bookings" ? t : "tickets,bookings";
  return getEmployeePerformance(req, res);
};

export default getEmployeePerformance;