// backend/utils/bookedBy.js
// Booking yaaru pottaanga (Booked by) — Admin "Get Bookings" page ku.
import aadhaarModel from "../models/aadhaarModel.js";

export const attachBookedBy = async (bookings) => {
  const tnrs = bookings.map((b) => b.tnr).filter(Boolean);
  const notesRaisedByTnr = new Map();
  if (tnrs.length) {
    const tnrDocs = await aadhaarModel
      .find({ tnr: { $in: tnrs }, groupId: { $ne: null } })
      .select("tnr groupId")
      .lean();
    const tnrByGroup = new Map(tnrDocs.map((d) => [String(d.groupId), d.tnr]));
    if (tnrByGroup.size) {
      const notesDocs = await aadhaarModel
        .find({ type: "bookingNotes", groupId: { $in: [...tnrByGroup.keys()] } })
        .select("groupId raisedBy createdAt")
        .lean();
      for (const n of notesDocs) {
        const t = tnrByGroup.get(String(n.groupId));
        if (t && n.raisedBy?.name && !notesRaisedByTnr.has(t)) {
          notesRaisedByTnr.set(t, { type: "staff", name: n.raisedBy.name, employeeId: n.raisedBy.employeeId || "", at: n.createdAt || null });
        }
      }
    }
  }
  for (const b of bookings) {
    if (b.createdBy === "user") {
      b.bookedBy = { type: "user", name: b.userData?.name || b.userId?.name || "", email: b.userData?.email || b.userId?.email || "", at: b.bookingDate || null };
    } else if (b.createdByWho?.name || b.createdByWho?.type) {
      b.bookedBy = b.createdByWho;
    } else if (notesRaisedByTnr.has(b.tnr)) {
      b.bookedBy = notesRaisedByTnr.get(b.tnr);
    } else {
      b.bookedBy = { type: "admin", name: "Admin", unknown: true, at: b.bookingDate || null };
    }
  }
  return bookings;
};

export default attachBookedBy;