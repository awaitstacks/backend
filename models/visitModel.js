// // models/visitModel.js
// // Customer website (gvtourplanners.com) — page visits, button clicks, stage events.
// // Login pannaama vandhavanga (guest) + login pannavanga — isLoggedIn flag la pirikkalaam.
// // Eppavume irukkum — thaane delete aagaadhu.
// import mongoose from "mongoose";

// const visitSchema = new mongoose.Schema(
//   {
//     visitorId: { type: String, index: true }, // browser ku oru ID (localStorage) — same aal thirumba vandhaa same
//     sessionId: { type: String, index: true }, // oru tab / visit ku (sessionStorage)
//     type: { type: String, default: "pageview", index: true }, // pageview / click / event
//     name: { type: String, default: "" }, // click label illa event per (eg. "Enquiry submitted")
//     props: { type: mongoose.Schema.Types.Mixed, default: null }, // event kooda chinna details (tour per etc.)
//     path: { type: String, default: "/" },
//     title: { type: String, default: "" },
//     referrer: { type: String, default: "" },
//     source: { type: String, default: "Direct" }, // Google / Instagram / Facebook / WhatsApp / YouTube / Direct / <utm_source> / <site>
//     utm: { type: mongoose.Schema.Types.Mixed, default: null }, // { source, medium, campaign }
//     device: { type: String, default: "Desktop" }, // Mobile / Tablet / Desktop
//     browser: { type: String, default: "" },
//     os: { type: String, default: "" },
//     screen: { type: String, default: "" },
//     lang: { type: String, default: "" },
//     ip: { type: String, default: "" }, // mask panni (49.204.x.x)
//     firstVisit: { type: Boolean, default: false }, // mudhal visit ah ("isNew" mongoose reserved — adhanaala indha per)
//     isLoggedIn: { type: Boolean, default: false },
//     userId: { type: String, default: null, index: true }, // login aana customer
//     at: { type: Date, default: Date.now },
//   },
//   { versionKey: false },
// );

// visitSchema.index({ at: -1 }); // date filter fast aaga (delete aagaadhu)

// const visitModel = mongoose.models.websiteVisit || mongoose.model("websiteVisit", visitSchema);
// export default visitModel;

// models/visitModel.js
// Customer website (gvtourplanners.com) — page visits, button clicks, stage events.
// Login pannaama vandhavanga (guest) + login pannavanga — isLoggedIn flag la pirikkalaam.
// Eppavume irukkum — thaane delete aagaadhu.
import mongoose from "mongoose";

const visitSchema = new mongoose.Schema(
  {
    visitorId: { type: String, index: true }, // browser ku oru ID (localStorage) — same aal thirumba vandhaa same
    sessionId: { type: String, index: true }, // oru tab / visit ku (sessionStorage)
    type: { type: String, default: "pageview", index: true }, // pageview / click / event
    name: { type: String, default: "" }, // click label illa event per (eg. "Enquiry submitted")
    props: { type: mongoose.Schema.Types.Mixed, default: null }, // event kooda chinna details (tour per etc.)
    path: { type: String, default: "/" },
    title: { type: String, default: "" },
    referrer: { type: String, default: "" },
    source: { type: String, default: "Direct" }, // Google / Instagram / Facebook / WhatsApp / YouTube / Direct / <utm_source> / <site>
    utm: { type: mongoose.Schema.Types.Mixed, default: null }, // { source, medium, campaign }
    device: { type: String, default: "Desktop" }, // Mobile / Tablet / Desktop
    browser: { type: String, default: "" },
    os: { type: String, default: "" },
    screen: { type: String, default: "" },
    lang: { type: String, default: "" },
    ip: { type: String, default: "" }, // mask panni (49.204.x.x)
    firstVisit: { type: Boolean, default: false }, // mudhal visit ah ("isNew" mongoose reserved — adhanaala indha per)
    isLoggedIn: { type: Boolean, default: false },
    userId: { type: String, default: null, index: true }, // customer login aagirundhaa (token la irundhu) — per / email apram edukkalaam
    at: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

visitSchema.index({ at: -1 }); // date filter fast aaga (delete aagaadhu)
// Report / visitors fast aaga (data perusaanaalum page slow aagaadhu)
visitSchema.index({ at: -1, isLoggedIn: 1, type: 1 });
visitSchema.index({ visitorId: 1, at: 1 });
visitSchema.index({ userId: 1, at: 1 });

const visitModel = mongoose.models.websiteVisit || mongoose.model("websiteVisit", visitSchema);
export default visitModel;