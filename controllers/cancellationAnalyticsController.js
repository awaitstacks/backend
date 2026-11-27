// ════════════════════════════════════════════════════════════════
//  cancellationAnalyticsController.js — Cancellation Analytics page ku data
//  Read only — edhuvum save / update pannaadhu. DB migration illa.
//
//  Ovvoru cancellation request kum:
//    • booking (TNR, contact, payment), tour (per), cancel aana travellers
//    • category:  "advance" = cancel panna podhu advance mattum (balance paid illa)
//                 "full"    = cancel panna podhu balance um paid
//                 (TNR ku illa — ovvoru cancellation request kum thaniya)
//    • tier     : noOfDays vechu cancelRule la endha tier match aachu
//    • approve aana cancellations mattum
//    • tourBooking dhaan MAIN: cancel aana travellers, tour, contact, date, AMOUNT
//      (GV / IRCTC = booking pool — Tour Info / Sales Dashboard / Invoice adhe numbers)
//    • Cancellation model la irundhu TIER (noOfDays) + Advance / Fully paid mattum
//      — traveller _id vechu match. Booking delete aana record → skip
//    • Trip cancel (whole tour cancel) la GV / IRCTC cancellation irundhaa adhuvum
//      "Trip cancelled" nu thaniya row ah serum
// ════════════════════════════════════════════════════════════════
import cancellationModel from "../models/cancellationModel.js";
import tourBookingModel from "../models/tourBookingmodel.js";
import tourModel from "../models/tourModel.js";
import cancelRuleModel from "../models/cancelRuleModel.js";
import { attachBookedBy } from "../utils/bookedBy.js"; // yaaru booking pottaanga (All Bookings / Tour Bookings adhe logic)

const idStr = (v) => (v ? String(v._id || v) : "");

// noOfDays → endha tier (cancelCalculation la irukura matchPercentage maadhiriye)
// Label: "0–6 days", "1 day", "0 days", "60–120 days"
// Chart la illaadha days (e.g. advance la 120 mela) → "Above 120 days",
// percentage 100 (cancel controller um match illana 100% dhaan edukkudhu)
const dayWord = (n) => `${n} day${Number(n) === 1 ? "" : "s"}`;
const tierLabel = (from, to) => {
  if (to === undefined || to === null) return `${from}+ days`;
  if (Number(from) === Number(to)) return dayWord(from);
  return `${from}–${to} days`;
};
const findTier = (days, tiers = []) => {
  const d = Number(days || 0);
  for (const t of tiers || []) {
    const from = t.fromDays ?? 0;
    const to = t.toDays ?? Infinity;
    if (d >= from && d <= to) {
      return {
        key: `${from}-${t.toDays ?? "max"}`,
        label: tierLabel(from, t.toDays),
        percentage: Number(t.percentage ?? 100),
        fromDays: from,
      };
    }
  }
  const maxTo = Math.max(-1, ...(tiers || []).map((t) => Number(t.toDays ?? -1)));
  return maxTo >= 0 && d > maxTo
    ? { key: "above", label: `Above ${dayWord(maxTo)}`, percentage: 100, fromDays: maxTo + 1 }
    : { key: "none", label: "Not in chart", percentage: 100, fromDays: 99999 };
};

// Indha CANCELLATION raise aana podhu booking advance only ah, fully paid ah?
// TNR level la illa — ovvoru cancellation request kum thaniya paakkum.
//   e.g. 3 traveller, advance mattum → 1 cancel  = Advance only
//        apram balance pay pannittu   → 1 cancel  = Fully paid
//
// 1. Pudhu request — raise pannum podhe "paymentStage" save aagum (cancel controller)
// 2. Default remark text ("Advance Only" / "Fully Paid" / "Balance Zero")
// 3. Pazhaya data — andha request la save aana netAmountPaid:
//      Advance only cases → netAmountPaid = advance + (−ve admin remarks)
//      Fully paid cases   → netAmountPaid = advance + balance + (−ve admin remarks)
//    So advance + −ve remarks ah vida adhigam na = balance um katti irundhaanga.
// ⚠️ booking.payment.balance.paid ah paakkala — approve aagum podhu balance 0
//    aanaa backend adha true nu maathidum, adhanaala adhu nambaadhu.
const categoryOf = (booking, c) => {
  if (c?.paymentStage === "advance" || c?.paymentStage === "full") return c.paymentStage;
  // Road map padi: balance pay pannadhu cancel REQUEST ku munnadi na → Fully paid
  // (approve la balance 0 aagi paidAt set aanaa adhu request ku apram — adha edukkaadhu)
  const balAt = booking?.payment?.balance?.paid === true && booking?.payment?.balance?.paidAt ? new Date(booking.payment.balance.paidAt).getTime() : NaN;
  const reqAt = c?.createdAt ? new Date(c.createdAt).getTime() : NaN;
  if (!Number.isNaN(balAt) && !Number.isNaN(reqAt) && balAt < reqAt) return "full";
  const r = String(c?.remarkText || "");
  if (/fully paid/i.test(r)) return "full";
  if (/advance only|balance zero/i.test(r)) return "advance";
  const p = booking?.payment || {};
  const adv = Number(p.advance?.amount || 0);
  const neg = (booking?.adminRemarks || [])
    .filter((x) => Number(x.amount) < 0)
    .reduce((t, x) => t + Math.abs(Number(x.amount)), 0);
  return Number(c?.netAmountPaid || 0) > adv + neg + 0.5 ? "full" : "advance";
};

// Sales Dashboard (getAnalyticsSummary) la irukura adhe condition:
//   Cancelled   = byAdmin === true && byTraveller === true
//                 (apram trip cancel aanaalum — charge vaangiyaachu — cancelled dhaan)
//   Trip cancel = viaTripCancel === true && byTraveller !== true && byAdmin !== true
const isCancelledTraveller = (t) => t?.cancelled?.byAdmin === true && t?.cancelled?.byTraveller === true;
const isTripTraveller = (t) =>
  t?.cancelled?.viaTripCancel === true && t?.cancelled?.byTraveller !== true && t?.cancelled?.byAdmin !== true;
const travellerInfo = (t) => ({
  id: String(t._id || ""),
  name: [t.title, t.firstName, t.lastName].filter(Boolean).join(" "),
  age: t.age ?? "",
  gender: t.gender || "",
  sharingType: t.sharingType || "",
  packageType: t.packageType || "main",
});
// Tour booking la ippo irukura balance (final)
const bookingBalance = (b) => ({
  updatedBalance: Number(b?.payment?.balance?.amount || 0),
  balancePaid: b?.payment?.balance?.paid === true,
});
const isSpecialTierKey = (k) => k === "trip" || k === "norecord";
const num = (v) => (v === undefined || v === null || isNaN(Number(v)) ? null : Number(v));

export const getCancellationAnalytics = async (req, res) => {
  try {
    // 1. Approve aana cancellation records
    const cancellations = await cancellationModel
      .find({ approvedBy: true })
      .sort({ createdAt: -1 })
      .lean();

    // 2. Bookings — record irukura TNR + trip cancel aana bookings
    const docTnrs = [...new Set(cancellations.map((c) => c.tnr).filter(Boolean))];
    const bookings = await tourBookingModel
      .find({
        $or: [
          { tnr: { $in: docTnrs } },
          { "travellers.cancelled.byAdmin": true }, // cancel aana travellers irukura ellaa booking um
          { "travellers.cancelled.viaTripCancel": true },
          { gvCancellationPool: { $gt: 0 } }, // pool irukura ellaa booking um (Tour Info maadhiri)
          { irctcCancellationPool: { $gt: 0 } },
        ],
      })
      .select("tnr tourId travellers contact userData userId createdBy createdByWho payment adminRemarks advanceAdminRemarks receipts termsAgreedAt bookingDate createdAt gvCancellationPool irctcCancellationPool")
      .lean();
    // Booked by (login wise) — staff / tour admin / admin / customer
    try {
      await attachBookedBy(bookings);
    } catch (e) {
      console.error("cancellation analytics attachBookedBy error:", e.message); // fail aanaalum data varum
    }
    const bookingByTnr = new Map(bookings.filter((b) => b.tnr).map((b) => [b.tnr, b]));

    // 3. Tours — ellaa tours um (filter ku) + per
    const allTours = await tourModel.find({}).select("title").sort({ _id: -1 }).lean();
    const tourName = new Map(allTours.map((t) => [String(t._id), t.title || "Unnamed tour"]));

    const rule = await cancelRuleModel.findOne().lean();
    const tiersFor = {
      advance: rule?.gv?.advancePaid?.tiers || [],
      full: rule?.gv?.fullyPaid?.tiers || [],
    };

    // Booking la irukura ELLAA travellers um — expand la kaatta (yaar cancel, yaar active)
    const allTravellersOf = (b) =>
      (b.travellers || []).map((t) => ({
        ...travellerInfo(t),
        status: isCancelledTraveller(t) ? "cancelled" : isTripTraveller(t) ? "trip" : t?.cancelled?.byTraveller === true ? "requested" : "active",
      }));

    const baseRow = (b) => ({
      tnr: b.tnr,
      bookedBy: b.bookedBy || null, // { type, name, employeeId, role, at, unknown }
      allTravellers: allTravellersOf(b),
      tourId: idStr(b.tourId),
      tourName: tourName.get(idStr(b.tourId)) || "Tour deleted",
      bookingDate: b.bookingDate || b.createdAt || null,
      payment: {
        advance: Number(b.payment?.advance?.amount || 0),
        advancePaid: b.payment?.advance?.paid === true,
        balance: Number(b.payment?.balance?.amount || 0),
        balancePaid: b.payment?.balance?.paid === true,
      },
    });
    // Booking head = booking la mudhal traveller (Tour Bookings page la varra per)
    const headName = (b) => {
      const h = (b.travellers || [])[0];
      return h ? [h.firstName, h.lastName].filter(Boolean).join(" ").trim() : "";
    };
    const contactOf = (b, travellers) => ({
      name: headName(b) || b.userData?.name || travellers[0]?.name || "",
      email: b.contact?.email || b.userData?.email || "",
      mobile: b.contact?.mobile || "",
    });

    const rows = [];
    const usedTrav = new Set(); // record la match aana travellers

    // ── A. Cancellation records — booking um match aaganum ──
    cancellations.forEach((c) => {
      const b = bookingByTnr.get(c.tnr);
      if (!b) return; // booking delete → skip

      const all = b.travellers || [];
      const ids = (c.travellerIds || []).map(String);
      let picked = all.filter((t) => ids.includes(String(t._id)));
      if (!picked.length && Array.isArray(c.travellerIndexes)) {
        picked = c.travellerIndexes.map((i) => all[i]).filter(Boolean);
      }
      picked = picked.filter(isCancelledTraveller); // booking la innum cancel aagi irukkanum
      if (!picked.length) return;
      picked.forEach((t) => usedTrav.add(String(t._id)));

      const category = categoryOf(b, c);
      const travellers = picked.map(travellerInfo);
      rows.push({
        ...baseRow(b),
        _id: String(c._id),
        type: "traveller",
        category,
        // Date — booking la cancel aana date (illana record approve date)
        approvedOn: picked[0]?.cancelled?.cancelledAt || c.approvedAt || c.updatedAt || c.createdAt,
        requestedOn: c.createdAt,
        noOfDays: c.noOfDays ?? 0,
        tier: findTier(c.noOfDays, tiersFor[category] || tiersFor.advance),
        travellers,
        travellerCount: travellers.length,
        contact: contactOf(b, travellers),
        amounts: {
          netAmountPaid: c.netAmountPaid || 0,
          poolAfter: Number(c.gvCancellationAmount || 0) + Number(c.remarksAmount || 0), // approve aana apram GV pool
          irPoolAfter: Number(c.irctcCancellationAmount || 0),
          gv: 0,
          irctc: 0,
          remarks: c.remarksAmount || 0,
          total: 0,
          refund: c.refundAmount || 0,
          // Updated balance = tourBooking la ippo irukura balance (Tour Bookings page adhe)
          // — cancel aana apram partial / full pay pannirundhaa adhuvum serndhu
          ...bookingBalance(b),
          balanceAtCancel: c.updatedBalance || 0, // cancel approve aana podhu (record)
        },
        // Cancellation record la save aana amounts — apdiye (calculation illa)
        rec: {
          gv: Number(c.gvCancellationAmount || 0) + Number(c.remarksAmount || 0),
          irctc: Number(c.irctcCancellationAmount || 0),
          remarks: Number(c.remarksAmount || 0),
          total: c.totalCancellationAmount != null ? Number(c.totalCancellationAmount) : null,
          netAmountPaid: Number(c.netAmountPaid || 0),
          preBalance: c.preBalanceAmount != null ? Number(c.preBalanceAmount) : null,
          updatedBalance: c.updatedBalance != null ? Number(c.updatedBalance) : null,
          refund: Number(c.refundAmount || 0),
        },
        remarkText: c.remarkText || "",
        decidedBy: c.decidedBy || null,
      });
    });

    // ── B. AMOUNT — booking pool dhaan (Tour Info maadhiri) ──────────────
    // Records cumulative (kadaisi record la munnadi cancellation um serndhu
    // irukkum) — raise order la (createdAt) adukki, ovvoru record um koottuna
    // amount = andha row. Meedham (trip cancel / record illaadha cancel) →
    // thaniya row. Ovvoru TNR total = booking gvCancellationPool / irctcCancellationPool.
    const recordsByTnr = new Map();
    rows.forEach((r) => {
      if (!recordsByTnr.has(r.tnr)) recordsByTnr.set(r.tnr, []);
      recordsByTnr.get(r.tnr).push(r);
    });

    const extraRow = (b, type, travs, gv, ir, tier, remark) => {
      const travellers = travs.map(travellerInfo);
      const at = travs[0]?.cancelled?.cancelledAt || b.bookingDate || b.createdAt;
      rows.push({
        ...baseRow(b),
        _id: `${type}-${b.tnr}`,
        type,
        category: b.payment?.balance?.paid === true ? "full" : "advance",
        approvedOn: at,
        requestedOn: null,
        noOfDays: 0,
        tier,
        travellers,
        travellerCount: travellers.length,
        contact: contactOf(b, travellers),
        amounts: { netAmountPaid: 0, gv, irctc: ir, remarks: 0, total: Number((gv + ir).toFixed(2)), refund: 0, ...bookingBalance(b), balanceAtCancel: null },
        remarkText: remark,
        decidedBy: travs[0]?.cancelled?.decidedBy || null,
      });
    };

    bookings.forEach((b) => {
      if (!b.tnr) return;
      const t = (r) => new Date(r.requestedOn || r.approvedOn).getTime() || 0;
      const list = (recordsByTnr.get(b.tnr) || []).sort((x, y) => t(x) - t(y));
      const tripTrav = (b.travellers || []).filter(isTripTraveller);
      const leftTrav = (b.travellers || []).filter((x) => isCancelledTraveller(x) && !usedTrav.has(String(x._id)));
      const poolGv = num(b.gvCancellationPool) ?? 0;
      const poolIr = num(b.irctcCancellationPool) ?? 0;

      // Records — cumulative delta
      let prevGv = 0;
      let prevIr = 0;
      list.forEach((r) => {
        const gvAfter = r.amounts.poolAfter;
        const irAfter = r.amounts.irPoolAfter;
        r.amounts.gv = Number((gvAfter - prevGv).toFixed(2));
        r.amounts.irctc = Number((irAfter - prevIr).toFixed(2));
        prevGv = gvAfter;
        prevIr = irAfter;
      });

      // Meedham — booking pool − records
      const remGv = Number((poolGv - prevGv).toFixed(2));
      const remIr = Number((poolIr - prevIr).toFixed(2));
      const hasRem = remGv !== 0 || remIr !== 0;

      if (tripTrav.length && (remGv > 0 || remIr > 0)) {
        // Trip cancel la GV / IRCTC cancellation irundhaa
        extraRow(b, "trip", tripTrav, remGv, remIr,
          { key: "trip", label: "Trip cancelled", percentage: 0, fromDays: 100000 },
          tripTrav[0].cancelled?.reason || "Whole trip cancelled");
      } else if (leftTrav.length) {
        // Booking la cancel aagirukkaanga, aanaa approve aana record illa
        extraRow(b, "norecord", leftTrav, hasRem ? remGv : 0, hasRem ? remIr : 0,
          { key: "norecord", label: "No cancellation record", percentage: 0, fromDays: 99999 },
          "Cancelled in booking, but no approved cancellation record");
      } else if (list.length && hasRem) {
        // Kadaisi record ah booking pool ku exact ah match
        const last = list[list.length - 1];
        last.amounts.gv = Number((last.amounts.gv + remGv).toFixed(2));
        last.amounts.irctc = Number((last.amounts.irctc + remIr).toFixed(2));
      } else if (remGv > 0 || remIr > 0) {
        // Pool irukku, cancel traveller yaarum illa — amount vittu pogaama
        extraRow(b, "norecord", [], remGv, remIr,
          { key: "norecord", label: "No cancellation record", percentage: 0, fromDays: 99999 },
          "Cancellation amount in booking, but no cancelled traveller found");
      }
      list.forEach((r) => {
        r.amounts.total = Number((r.amounts.gv + r.amounts.irctc).toFixed(2));
      });
    });

    // ── C. Rows: ovvoru cancellation um thani row (traveller / tier / date record la irundhu)
    // AMOUNT ellaam TOUR BOOKING la irundhu — TNR ku ore set (GV / IRCTC pool,
    // Advance, Balance, Net paid). Ore TNR rows aduthu aduthu, 1st → 2nd → 3rd order la.
    const ts = (r) => new Date(r.requestedOn || r.approvedOn).getTime() || 0;
    const byTnr = new Map();
    rows.forEach((r) => {
      r.travellers = r.travellers.map((t) => ({ ...t, tier: r.tier, noOfDays: r.noOfDays, cancelledOn: r.approvedOn }));
      if (!byTnr.has(r.tnr)) byTnr.set(r.tnr, []);
      byTnr.get(r.tnr).push(r);
    });
    const groups = [];
    byTnr.forEach((list, tnr) => {
      list.sort((x, y) => ts(x) - ts(y));
      const b = bookingByTnr.get(tnr);
      const gv = num(b?.gvCancellationPool) ?? 0;
      const ir = num(b?.irctcCancellationPool) ?? 0;
      const advance = Number(b?.payment?.advance?.amount || 0);
      const advancePaid = b?.payment?.advance?.paid === true;
      const balance = Number(b?.payment?.balance?.amount || 0);
      const balancePaid = b?.payment?.balance?.paid === true;
      const recs = list.filter((r) => r.rec);
      const lastRec = recs[recs.length - 1];
      // ── Booking la enna enna nadandhuchu — date order la (road map ku) ──
      const events = [];
      const ev = (date, kind, title, sub, extra = {}) => { if (date || extra.keep) events.push({ date: date || null, kind, title, sub: sub || "", ...extra }); };
      const by = b?.bookedBy;
      ev(b?.bookingDate || b?.createdAt, "book", "Booked", by?.name && !by.unknown ? `by ${by.name}` : "", { keep: true });
      ev(b?.termsAgreedAt, "info", "T&C agreed");
      ev(b?.payment?.advance?.paidAt, "adv", "Advance paid", `₹${Number(b?.payment?.advance?.amount || 0).toLocaleString("en-IN")}`, { keep: b?.payment?.advance?.paid === true });
      ev(b?.receipts?.advanceReceiptSentAt, "info", "Advance receipt sent");
      (b?.advanceAdminRemarks || []).forEach((x) => ev(x.addedAt, "remark", "Advance remark", `${x.remark || ""}${Number(x.amount) ? ` · ${Number(x.amount) > 0 ? "+" : ""}₹${Number(x.amount).toLocaleString("en-IN")}` : ""}`));
      (b?.adminRemarks || []).forEach((x) => ev(x.addedAt, "remark", "Admin remark", `${x.remark || ""}${Number(x.amount) ? ` · ${Number(x.amount) > 0 ? "+" : ""}₹${Number(x.amount).toLocaleString("en-IN")}` : ""}`));
      list.forEach((r, i) => {
        const names = r.travellers.map((t) => t.name).filter(Boolean).join(", ");
        const ord = ["1st", "2nd", "3rd"][i] || `${i + 1}th`;
        if (r.type === "trip") {
          ev(r.approvedOn, "trip", "Trip cancelled", names);
          return;
        }
        if (r.requestedOn) ev(r.requestedOn, "req", `${ord} cancel requested`, names);
        ev(r.approvedOn, "cancel", `${ord} cancel approved`, names, { tier: r.tier, refund: r.rec ? Number(r.rec.refund || 0) : null });
      });
      ev(b?.payment?.balance?.paidAt, "bal", "Balance paid", `₹${Number(b?.payment?.balance?.amount || 0).toLocaleString("en-IN")}`, { keep: b?.payment?.balance?.paid === true });
      ev(b?.receipts?.balanceReceiptSentAt, "info", "Balance receipt sent");
      // date order; date illaadhadhu adhoda munnadi event kitta
      let lastT = 0;
      events.forEach((e, i) => {
        const t = e.date ? new Date(e.date).getTime() : NaN;
        if (!Number.isNaN(t)) lastT = t;
        e.t = Number.isNaN(t) ? lastT + 1 : t;
        e.i = i;
      });
      events.sort((x, y) => (x.t - y.t) || (x.i - y.i));
      events.forEach((e) => { delete e.t; delete e.i; delete e.keep; });

      const bookingAmounts = {
        gv,
        irctc: ir,
        total: Number((gv + ir).toFixed(2)),
        advance,
        advancePaid,
        balance,
        balancePaid,
        netPaid: (advancePaid ? advance : 0) + (balancePaid ? balance : 0),
        // Road map ku — eppo pay pannaanga
        advancePaidAt: b?.payment?.advance?.paidAt || null,
        balancePaidAt: b?.payment?.balance?.paidAt || null,
        // Refund — booking la field illa, kadaisi approve aana cancellation la irundhu
        refund: lastRec ? Number(lastRec.rec.refund || 0) : 0,
        updatedBalance: balance,
      };
      const steps = list.map((r, i) => ({
        no: i + 1,
        date: r.approvedOn,
        category: r.category,
        tier: r.tier,
        noOfDays: r.noOfDays,
        type: r.type,
        travellers: r.travellers.map((t) => ({ id: t.id, name: t.name })),
      }));
      // Oru TNR ku Advance + Fully paid rendu tab layum rows irundhaa, amount ORU tab la
      // mattum (kadaisi cancellation oda tab) — rendu tab um koottinaa double aagaadhu
      const ownerCat = list[list.length - 1].category;
      list.forEach((r, i) => {
        // Indha cancellation la save aana amount (filter potta, andha tier / date ku mattum)
        const own = r.rec
          ? { gv: r.rec.gv, irctc: r.rec.irctc }
          : { gv: Number(r.amounts.gv || 0), irctc: Number(r.amounts.irctc || 0) };
        r.ownAmounts = { gv: Number(own.gv.toFixed(2)), irctc: Number(own.irctc.toFixed(2)), total: Number((own.gv + own.irctc).toFixed(2)) };
        r.tnrRowCount = list.length; // ellaa tab layum sethu indha TNR ku evlo cancellation
        r.amountOwner = r.category === ownerCat;
        r.amountIn = ownerCat;
        r.seq = i + 1;
        r.seqTotal = list.length;
        r.steps = steps;
        r.events = events;
        r.amounts = { ...bookingAmounts };
        delete r.rec;
      });
      groups.push({ last: ts(list[list.length - 1]), list });
    });
    // Pudhu cancellation irukura TNR mela; TNR ulla 1st → 2nd → 3rd
    groups.sort((x, y) => y.last - x.last);
    rows.length = 0;
    groups.forEach((g) => rows.push(...g.list));

    // Sales Dashboard / Tour Info maadhiri — tour delete aana booking ah serkaadhu
    const liveRows = rows.filter((r) => tourName.has(r.tourId));
    rows.length = 0;
    rows.push(...liveRows);

    // Cross-check — Sales Dashboard adhe calculation (ellaa tour booking pool um)
    const tourIds = allTours.map((t) => t._id);
    const [salesPool] = await tourBookingModel.aggregate([
      { $match: { tourId: { $in: tourIds } } },
      { $group: { _id: null, gv: { $sum: { $ifNull: ["$gvCancellationPool", 0] } }, irctc: { $sum: { $ifNull: ["$irctcCancellationPool", 0] } } } },
    ]);

    // Tier list (chart la ellaa tier um order la — 0 count ah irundhaalum)
    const tierList = (cat) =>
      (tiersFor[cat] || []).map((t) => findTier(t.fromDays ?? 0, tiersFor[cat]));

    return res.json({
      success: true,
      data: rows,
      salesCheck: { gv: Number((salesPool?.gv || 0).toFixed(2)), irctc: Number((salesPool?.irctc || 0).toFixed(2)) },
      tours: allTours.map((t) => ({ id: String(t._id), name: t.title || "Unnamed tour" })),
      tiers: { advance: tierList("advance"), full: tierList("full") },
    });
  } catch (err) {
    console.error("getCancellationAnalytics error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

export default getCancellationAnalytics;