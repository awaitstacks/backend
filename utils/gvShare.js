// GV Share (Vinoth / Giridhar) — yaaru paakkalaam:
// Tour admin + Admin ellaarum; staff la keezha irukkura employee ID mattum.
// ▼ Vinoth sir, Giri sir staff login Employee ID ingae podunga
const GV_SHARE_EMPLOYEE_IDS = [
  "GVEMP008", // Vinoth K S
  "GVEMP009", // Giridharan 
  
];
const allowedIds = () => GV_SHARE_EMPLOYEE_IDS.map((s) => String(s).trim().toUpperCase()).filter(Boolean);

export const canSeeGvShare = (req) => {
  if (req.userType !== "staff") return true; // Tour admin / Admin
  const id = String(req.staff?.employeeId || "").trim().toUpperCase();
  return !!id && allowedIds().includes(id);
};

// Anuppura data la irundhu gvShare ah eduthudum (paakka koodaadhavanga ku)
export const stripGvShare = (doc) => {
  if (!doc || typeof doc !== "object") return doc;
  const { gvShare, ...rest } = doc; // eslint-disable-line no-unused-vars
  return rest;
};

// Body la vandha gvShare → { vinoth, giridhar } (₹, 0 or more; empty → null)
export const cleanGvShare = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  const num = (v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  const out = { vinoth: num(raw.vinoth), giridhar: num(raw.giridhar) };
  return out.vinoth === null && out.giridhar === null ? null : out;
};