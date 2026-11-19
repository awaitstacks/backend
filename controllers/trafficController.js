// // // // controllers/trafficController.js
// // // // Customer website traffic — public "track" (login venaam) + Admin report.
// // // // Routes: routes/tourAdminRoute.js (/api/touradmin/traffic/track, /api/touradmin/traffic/report)
// // // import jwt from "jsonwebtoken";
// // // import mongoose from "mongoose";
// // // import visitModel from "../models/visitModel.js";
// // // import userModel from "../models/userModel.js"; // customer (per / email / phone)

// // // const IST = "+05:30";
// // // const BOT_RX = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp\/|preview|headless|lighthouse|pingdom|uptime|curl|wget|python|axios|node-fetch/i;

// // // // ─── helpers ───
// // // const clip = (v, n = 300) => String(v ?? "").slice(0, n);
// // // const maskIp = (ip) => {
// // //   const s = String(ip || "").replace(/^::ffff:/, "").trim();
// // //   if (/^\d+\.\d+\.\d+\.\d+$/.test(s)) return s.split(".").slice(0, 2).join(".") + ".x.x";
// // //   if (s.includes(":")) return s.split(":").slice(0, 3).join(":") + ":…";
// // //   return "";
// // // };
// // // const clientIp = (req) => String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "";
// // // const parseUa = (ua = "") => {
// // //   const device = /ipad|tablet|(android(?!.*mobile))/i.test(ua) ? "Tablet" : /mobi|iphone|android/i.test(ua) ? "Mobile" : "Desktop";
// // //   const browser = /edg\//i.test(ua) ? "Edge" : /opr\/|opera/i.test(ua) ? "Opera" : /samsungbrowser/i.test(ua) ? "Samsung" : /chrome|crios/i.test(ua) ? "Chrome" : /firefox|fxios/i.test(ua) ? "Firefox" : /safari/i.test(ua) ? "Safari" : "Other";
// // //   const os = /windows/i.test(ua) ? "Windows" : /iphone|ipad|ios/i.test(ua) ? "iOS" : /android/i.test(ua) ? "Android" : /mac os/i.test(ua) ? "macOS" : /linux/i.test(ua) ? "Linux" : "Other";
// // //   return { device, browser, os };
// // // };
// // // const SOURCE_RULES = [
// // //   [/google\./i, "Google"], [/bing\./i, "Bing"], [/yahoo\./i, "Yahoo"], [/duckduckgo/i, "DuckDuckGo"],
// // //   [/instagram|l\.instagram/i, "Instagram"], [/facebook|fb\.com|m\.facebook|l\.facebook/i, "Facebook"],
// // //   [/whatsapp|wa\.me|l\.wl\.co/i, "WhatsApp"], [/youtube|youtu\.be/i, "YouTube"],
// // //   [/t\.co|twitter|x\.com/i, "X / Twitter"], [/linkedin/i, "LinkedIn"],
// // // ];
// // // const sourceOf = (referrer, utmSource, ownHost) => {
// // //   if (utmSource) return clip(utmSource, 40);
// // //   if (!referrer) return "Direct";
// // //   let host = "";
// // //   try { host = new URL(referrer).hostname.replace(/^www\./, ""); } catch { return "Direct"; }
// // //   if (!host || (ownHost && host.endsWith(ownHost))) return "Direct";
// // //   const hit = SOURCE_RULES.find(([rx]) => rx.test(host));
// // //   return hit ? hit[1] : host;
// // // };

// // // // Customer token → user id (login aana customer). Token save aagaadhu — id mattum.
// // // const userIdFromToken = (tok) => {
// // //   if (!tok || typeof tok !== "string" || tok.length > 2000) return null;
// // //   try {
// // //     const d = jwt.verify(tok, process.env.JWT_SECRET); // userController: jwt.sign({ id: user._id }, JWT_SECRET)
// // //     const id = d && typeof d === "object" ? d.id || d._id || d.userId : null;
// // //     return id && mongoose.isValidObjectId(String(id)) ? String(id) : null;
// // //   } catch (err) {
// // //     if (process.env.NODE_ENV !== "production") console.warn("traffic: customer token not valid —", err.message);
// // //     return null;
// // //   }
// // // };
// // // const userModelRef = () => userModel;
// // // const usersById = async (ids) => {
// // //   const M = userModelRef();
// // //   const list = [...new Set(ids.filter((x) => x && mongoose.isValidObjectId(String(x))).map(String))];
// // //   if (!M || !list.length) return new Map();
// // //   const docs = await M.find({ _id: { $in: list } }).select("name email phone").lean();
// // //   return new Map(docs.map((u) => [String(u._id), { name: u.name || "", email: u.email || "", phone: u.phone || "" }]));
// // // };

// // // // visitorId → userId (eppovaavadhu login aana browser). Ore customer oda pala devices ah serkka.
// // // const linkMap = async (visitorIds) => {
// // //   const ids = [...new Set(visitorIds.filter(Boolean))];
// // //   if (!ids.length) return new Map();
// // //   const rows = await visitModel.aggregate([
// // //     { $match: { visitorId: { $in: ids }, userId: { $ne: null } } },
// // //     { $sort: { at: -1 } },
// // //     { $group: { _id: "$visitorId", userId: { $first: "$userId" } } },
// // //   ]);
// // //   return new Map(rows.map((r) => [r._id, r.userId]));
// // // };
// // // // Oru aal key — login aana customer na "u:<userId>", illana browser "v:<visitorId>"
// // // const personKey = (visitorId, links) => (links.get(visitorId) ? `u:${links.get(visitorId)}` : `v:${visitorId}`);

// // // // Oru aal mudhal thadavai eppo vandhaanga (all time) — New / Returning ku.
// // // // Login aana customer na avanga ellaa devices um serthu.
// // // const firstSeenOf = async (visitorIds, links) => {
// // //   const ids = [...new Set(visitorIds.filter(Boolean))];
// // //   const uids = [...new Set(ids.map((v) => links.get(v)).filter(Boolean))];
// // //   const [byV, byU] = await Promise.all([
// // //     ids.length ? visitModel.aggregate([{ $match: { visitorId: { $in: ids } } }, { $group: { _id: "$visitorId", at: { $min: "$at" } } }]) : [],
// // //     uids.length ? visitModel.aggregate([{ $match: { userId: { $in: uids } } }, { $group: { _id: "$userId", at: { $min: "$at" } } }]) : [],
// // //   ]);
// // //   const vMin = new Map(byV.map((r) => [r._id, r.at]));
// // //   const uMin = new Map(byU.map((r) => [String(r._id), r.at]));
// // //   const out = new Map(); // personKey → first seen
// // //   ids.forEach((v) => {
// // //     const key = personKey(v, links);
// // //     const cands = [vMin.get(v), links.get(v) ? uMin.get(String(links.get(v))) : null, out.get(key)].filter(Boolean);
// // //     if (cands.length) out.set(key, new Date(Math.min(...cands.map((d) => new Date(d).getTime()))));
// // //   });
// // //   return out;
// // // };

// // // // Romba adhigam request (oru IP la nimishathukku 120 mel) — ignore
// // // const hits = new Map();
// // // const tooMany = (key) => {
// // //   const now = Date.now();
// // //   const h = hits.get(key) || { n: 0, t: now };
// // //   if (now - h.t > 60000) { h.n = 0; h.t = now; }
// // //   h.n += 1;
// // //   hits.set(key, h);
// // //   if (hits.size > 5000) hits.clear();
// // //   return h.n > 120;
// // // };

// // // // ─── POST /api/touradmin/traffic/track  (public — login venaam) ───
// // // export const trackVisit = async (req, res) => {
// // //   try {
// // //     const ua = String(req.headers["user-agent"] || "");
// // //     if (!ua || BOT_RX.test(ua)) return res.status(204).end();
// // //     const ip = clientIp(req);
// // //     if (tooMany(ip)) return res.status(204).end();

// // //     const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
// // //     const visitorId = clip(b.visitorId, 64);
// // //     if (!visitorId) return res.status(204).end();
// // //     let ownHost = "";
// // //     try { ownHost = new URL(String(req.headers.origin || "")).hostname.replace(/^www\./, ""); } catch { /* */ }

// // //     const type = ["pageview", "click", "event"].includes(b.type) ? b.type : "pageview";
// // //     const name = clip(b.name, 80).trim();
// // //     if (type !== "pageview" && !name) return res.status(204).end();
// // //     // props — flat, chinna values mattum (max 10 keys)
// // //     let props = null;
// // //     if (b.props && typeof b.props === "object" && !Array.isArray(b.props)) {
// // //       props = {};
// // //       Object.keys(b.props).slice(0, 10).forEach((k) => {
// // //         const v = b.props[k];
// // //         if (["string", "number", "boolean"].includes(typeof v)) props[clip(k, 30)] = typeof v === "string" ? clip(v, 120) : v;
// // //       });
// // //       if (!Object.keys(props).length) props = null;
// // //     }
// // //     const utm = b.utm && typeof b.utm === "object"
// // //       ? { source: clip(b.utm.source, 60), medium: clip(b.utm.medium, 60), campaign: clip(b.utm.campaign, 80) }
// // //       : null;
// // //     const userId = userIdFromToken(b.utoken);
// // //     await visitModel.create({
// // //       visitorId,
// // //       sessionId: clip(b.sessionId, 64),
// // //       type,
// // //       name,
// // //       props,
// // //       path: clip(b.path || "/", 300),
// // //       title: clip(b.title, 200),
// // //       referrer: clip(b.referrer, 300),
// // //       source: sourceOf(b.referrer, utm?.source, ownHost),
// // //       utm: utm && (utm.source || utm.medium || utm.campaign) ? utm : null,
// // //       ...parseUa(ua),
// // //       screen: clip(b.screen, 20),
// // //       lang: clip(b.lang, 20),
// // //       ip: maskIp(ip),
// // //       firstVisit: !!b.isNew,
// // //       isLoggedIn: !!b.isLoggedIn || !!userId,
// // //       userId,
// // //       at: new Date(),
// // //     });
// // //     return res.status(204).end();
// // //   } catch {
// // //     return res.status(204).end(); // tracking fail aanaalum customer site ku edhuvum theriyakoodaadhu
// // //   }
// // // };

// // // // Query → { match, from, to, who } (IST date range + guest / loggedIn / all)
// // // const rangeOf = (q) => {
// // //   const today = new Date(Date.now() + 5.5 * 36e5).toISOString().slice(0, 10);
// // //   const from = /^\d{4}-\d{2}-\d{2}$/.test(q.from || "") ? q.from : today;
// // //   const to = /^\d{4}-\d{2}-\d{2}$/.test(q.to || "") ? q.to : today;
// // //   const who = ["guest", "loggedIn", "all"].includes(q.who) ? q.who : "guest";
// // //   const match = { at: { $gte: new Date(`${from}T00:00:00${IST}`), $lte: new Date(`${to}T23:59:59.999${IST}`) } };
// // //   if (who === "guest") match.isLoggedIn = { $ne: true };
// // //   if (who === "loggedIn") match.isLoggedIn = true;
// // //   return { match, from, to, who };
// // // };
// // // // ─── Extra filters: source / device / browser / page / search (name, email, phone, visitor ID) ───
// // // const escRx = (t) => String(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// // // const applyFilters = async (match, q = {}) => {
// // //   const and = [];
// // //   const one = (v) => clip(v, 120).trim();
// // //   if (one(q.source)) and.push({ source: one(q.source) });
// // //   if (one(q.device)) and.push({ device: one(q.device) });
// // //   if (one(q.browser)) and.push({ browser: one(q.browser) });
// // //   if (one(q.os)) and.push({ os: one(q.os) });
// // //   // NOTE: "page" = pagination number, so page filter "path" nu varum
// // //   if (one(q.path)) {
// // //     const pg = one(q.path) === "/" ? "/" : one(q.path).replace(/\/+$/, "");
// // //     and.push({ path: new RegExp(`^${escRx(pg)}(\\?.*)?$`) });
// // //   }
// // //   if (one(q.event)) and.push({ type: "event", name: one(q.event) });
// // //   if (q.isNew === "1") and.push({ firstVisit: true });
// // //   const term = one(q.q);
// // //   if (term) {
// // //     const rx = new RegExp(escRx(term), "i");
// // //     const users = await userModel.find({ $or: [{ name: rx }, { email: rx }, { phone: rx }] }).select("_id").limit(200).lean();
// // //     const uids = users.map((u) => String(u._id));
// // //     // andha customer login panna browsers (guest records um varanum)
// // //     const vids = uids.length ? await visitModel.distinct("visitorId", { userId: { $in: uids } }) : [];
// // //     // "Visitor A23801" maadhiri ID kuduthaa
// // //     const idPart = term.replace(/^visitor\s*/i, "").replace(/[^a-z0-9]/gi, "");
// // //     const or = [];
// // //     if (uids.length) or.push({ userId: { $in: uids } });
// // //     if (vids.length) or.push({ visitorId: { $in: vids } });
// // //     if (idPart.length >= 4) or.push({ visitorId: new RegExp(`${idPart.split("").map(escRx).join("[^a-z0-9]*")}$`, "i") });
// // //     and.push(or.length ? { $or: or } : { _id: null }); // edhuvum match aagala na empty
// // //   }
// // //   if (and.length) match.$and = [...(match.$and || []), ...and];
// // //   return match;
// // // };

// // // // "Visitor A1B2C3" — visitorId la irundhu chinna per
// // // const shortId = (id) => String(id || "").replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase() || "—";

// // // // ─── GET /api/touradmin/traffic/report?from=YYYY-MM-DD&to=YYYY-MM-DD&who=guest|loggedIn|all&page=1 ───
// // // export const trafficReport = async (req, res) => {
// // //   try {
// // //     const today = new Date(Date.now() + 5.5 * 36e5).toISOString().slice(0, 10);
// // //     const from = /^\d{4}-\d{2}-\d{2}$/.test(req.query.from || "") ? req.query.from : today;
// // //     const to = /^\d{4}-\d{2}-\d{2}$/.test(req.query.to || "") ? req.query.to : today;
// // //     const who = ["guest", "loggedIn", "all"].includes(req.query.who) ? req.query.who : "guest";
// // //     const page = Math.max(1, parseInt(req.query.page, 10) || 1);
// // //     const PAGE = 50;

// // //     const match = { at: { $gte: new Date(`${from}T00:00:00${IST}`), $lte: new Date(`${to}T23:59:59.999${IST}`) } };
// // //     if (who === "guest") match.isLoggedIn = { $ne: true };
// // //     if (who === "loggedIn") match.isLoggedIn = true;
// // //     const baseMatch = { ...match }; // filter dropdown options ku (extra filter illaama)
// // //     await applyFilters(match, req.query);

// // //     const PV = { type: { $in: ["pageview", null] } }; // pazhaya records la type illa = pageview
// // //     const kind = ["pageview", "click", "event"].includes(req.query.kind) ? req.query.kind : "";
// // //     const dayExpr = { $dateToString: { format: "%Y-%m-%d", date: "$at", timezone: IST } };
// // //     const top = (field, limit = 10) => [
// // //       { $group: { _id: `$${field}`, views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
// // //       { $project: { _id: 0, key: "$_id", views: 1, visitors: { $size: "$visitors" } } },
// // //       { $sort: { views: -1 } },
// // //       { $limit: limit },
// // //     ];

// // //     const [agg] = await visitModel.aggregate([
// // //       { $match: match },
// // //       {
// // //         $facet: {
// // //           totals: [
// // //             { $match: PV },
// // //             {
// // //               $group: {
// // //                 _id: null,
// // //                 views: { $sum: 1 },
// // //                 visitors: { $addToSet: "$visitorId" },
// // //                 sessions: { $addToSet: "$sessionId" },
// // //                 newVisitors: { $addToSet: { $cond: ["$firstVisit", "$visitorId", null] } },
// // //               },
// // //             },
// // //             { $project: { _id: 0, views: 1, visitors: { $size: "$visitors" }, sessions: { $size: "$sessions" }, newVisitors: { $size: { $filter: { input: "$newVisitors", cond: { $ne: ["$$this", null] } } } } } },
// // //           ],
// // //           daily: [
// // //             { $match: PV },
// // //             { $group: { _id: dayExpr, views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
// // //             { $project: { _id: 0, day: "$_id", views: 1, visitors: { $size: "$visitors" } } },
// // //             { $sort: { day: 1 } },
// // //           ],
// // //           pages: [
// // //             { $match: PV },
// // //             { $sort: { at: -1 } },
// // //             // ?utm_source=… maadhiri query string illaama ore page aa group pannum
// // //             { $group: { _id: { $arrayElemAt: [{ $split: [{ $ifNull: ["$path", "/"] }, "?"] }, 0] }, views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" }, title: { $first: "$title" } } },
// // //             { $project: { _id: 0, key: "$_id", title: 1, views: 1, visitors: { $size: "$visitors" } } },
// // //             { $sort: { views: -1 } },
// // //             { $limit: 15 },
// // //           ],
// // //           hourly: [
// // //             { $match: PV },
// // //             { $group: { _id: { $hour: { date: "$at", timezone: IST } }, views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
// // //             { $project: { _id: 0, hour: "$_id", views: 1, visitors: { $size: "$visitors" } } },
// // //             { $sort: { hour: 1 } },
// // //           ],
// // //           sources: [{ $match: PV }, ...top("source", 10)],
// // //           devices: [{ $match: PV }, ...top("device", 5)],
// // //           browsers: [{ $match: PV }, ...top("browser", 6)],
// // //           clicks: [{ $match: { type: "click" } }, ...top("name", 15)],
// // //           events: [{ $match: { type: "event" } }, ...top("name", 20)],
// // //           list: [
// // //             ...(kind ? [{ $match: kind === "pageview" ? PV : { type: kind } }] : []),
// // //             { $sort: { at: -1 } },
// // //             { $skip: (page - 1) * PAGE },
// // //             { $limit: PAGE },
// // //             { $project: { _id: 1, at: 1, userId: 1, type: 1, name: 1, props: 1, path: 1, title: 1, source: 1, device: 1, browser: 1, os: 1, ip: 1, firstVisit: 1, isLoggedIn: 1, visitorId: 1 } },
// // //           ],
// // //         },
// // //       },
// // //     ]);

// // //     // Ippo site la irukkuravanga — kadaisi 5 nimisham
// // //     const liveMatch = { ...match, at: { $gte: new Date(Date.now() - 5 * 60000) } };
// // //     const liveIds = await visitModel.distinct("visitorId", liveMatch);
// // //     // Login aana customer oda pala devices = oru aal
// // //     const pvIds = await visitModel.distinct("visitorId", { ...match, ...PV });
// // //     const links = await linkMap([...pvIds, ...liveIds]);
// // //     const people = new Set(pvIds.map((v) => personKey(v, links))).size;
// // //     const livePeople = new Set(liveIds.map((v) => personKey(v, links))).size;

// // //     const totals = agg?.totals?.[0] || { views: 0, visitors: 0, sessions: 0, newVisitors: 0 };
// // //     totals.devices = totals.visitors; // browsers / devices
// // //     totals.visitors = people; // aal (login aana customer devices serthu)
// // //     // New = indha period la dhaan mudhal thadavai vandhaanga (eppovum, endha device la um); matha ellaarum Returning
// // //     const firstSeen = await firstSeenOf(pvIds, links);
// // //     const rangeStart = match.at.$gte;
// // //     totals.newVisitors = [...new Set(pvIds.map((v) => personKey(v, links)))].filter((k) => firstSeen.get(k) && firstSeen.get(k) >= rangeStart).length;
// // //     // Login aana customer na per kaattalaam
// // //     const listUsers = await usersById((agg?.list || []).map((x) => x.userId));
// // //     (agg?.list || []).forEach((x) => { const u = x.userId && listUsers.get(String(x.userId)); if (u) x.user = u; });
// // //     // Filter dropdown ku — indha date range la irukkura values
// // //     const [optSources, optDevices, optBrowsers, optOs, optPages, optEvents] = await Promise.all([
// // //       visitModel.distinct("source", baseMatch),
// // //       visitModel.distinct("device", baseMatch),
// // //       visitModel.distinct("browser", baseMatch),
// // //       visitModel.distinct("os", baseMatch),
// // //       visitModel.aggregate([
// // //         { $match: { ...baseMatch, ...PV } },
// // //         { $group: { _id: { $arrayElemAt: [{ $split: [{ $ifNull: ["$path", "/"] }, "?"] }, 0] }, n: { $sum: 1 }, title: { $first: "$title" } } },
// // //         { $sort: { n: -1 } },
// // //         { $limit: 60 },
// // //       ]),
// // //       visitModel.distinct("name", { ...baseMatch, type: "event" }),
// // //     ]);
// // //     const clean = (a) => a.filter(Boolean).map(String).sort((x, y) => x.localeCompare(y));
// // //     const options = {
// // //       sources: clean(optSources),
// // //       devices: clean(optDevices),
// // //       browsers: clean(optBrowsers),
// // //       os: clean(optOs),
// // //       pages: optPages.map((p) => ({ path: p._id || "/", title: p.title || "", views: p.n })),
// // //       events: clean(optEvents),
// // //     };
// // //     return res.status(200).json({
// // //       success: true,
// // //       options,
// // //       range: { from, to, who },
// // //       live: livePeople,
// // //       totals,
// // //       daily: agg?.daily || [],
// // //       pages: agg?.pages || [],
// // //       sources: agg?.sources || [],
// // //       devices: agg?.devices || [],
// // //       browsers: agg?.browsers || [],
// // //       hourly: agg?.hourly || [],
// // //       clicks: agg?.clicks || [],
// // //       events: agg?.events || [],
// // //       list: agg?.list || [],
// // //       page,
// // //       pageSize: PAGE,
// // //       hasMore: (agg?.list || []).length === PAGE,
// // //     });
// // //   } catch (error) {
// // //     return res.status(500).json({ success: false, message: error.message });
// // //   }
// // // };

// // // // ─── GET /api/touradmin/traffic/visitors?from&to&who&page — ovvoru aal um thani row ───
// // // // Login aana customer → avanga ellaa devices um ore row. Guest → browser wise.
// // // const buildVisitors = async (query, { all = false } = {}) => {
// // //     const { match } = rangeOf(query);
// // //     await applyFilters(match, query);
// // //     const page = all ? 1 : Math.max(1, parseInt(query.page, 10) || 1);
// // //     const PAGE = all ? 5000 : 30;
// // //     const liveSince = new Date(Date.now() - 5 * 60000);
// // //     const perBrowser = await visitModel.aggregate([
// // //       { $match: match },
// // //       { $sort: { at: 1 } },
// // //       {
// // //         $group: {
// // //           _id: "$visitorId",
// // //           firstAt: { $first: "$at" },
// // //           lastAt: { $last: "$at" },
// // //           views: { $sum: { $cond: [{ $in: ["$type", ["pageview", null]] }, 1, 0] } },
// // //           clicks: { $sum: { $cond: [{ $eq: ["$type", "click"] }, 1, 0] } },
// // //           events: { $sum: { $cond: [{ $eq: ["$type", "event"] }, 1, 0] } },
// // //           sessions: { $addToSet: "$sessionId" },
// // //           source: { $first: "$source" },
// // //           sources: { $push: "$source" },
// // //           device: { $last: "$device" },
// // //           browser: { $last: "$browser" },
// // //           os: { $last: "$os" },
// // //           ip: { $last: "$ip" },
// // //           lastPath: { $last: "$path" },
// // //           lastTitle: { $last: "$title" },
// // //           firstVisit: { $max: "$firstVisit" },
// // //           isLoggedIn: { $max: "$isLoggedIn" },
// // //           eventNames: { $addToSet: { $cond: [{ $eq: ["$type", "event"] }, "$name", null] } },
// // //         },
// // //       },
// // //     ]);

// // //     // Login link (indha range la illanaalum, vera naal login pannirundhaa)
// // //     const links = await linkMap(perBrowser.map((r) => r._id));
// // //     const people = new Map();
// // //     for (const r of perBrowser) {
// // //       const key = personKey(r._id, links);
// // //       const p = people.get(key);
// // //       const dev = { visitorId: r._id, device: r.device, browser: r.browser, os: r.os };
// // //       if (!p) {
// // //         people.set(key, {
// // //           key,
// // //           visitorId: r._id,
// // //           userId: links.get(r._id) || null,
// // //           firstAt: r.firstAt,
// // //           lastAt: r.lastAt,
// // //           views: r.views,
// // //           clicks: r.clicks,
// // //           events: r.events,
// // //           sessions: new Set((r.sessions || []).filter(Boolean)),
// // //           source: r.source,
// // //           srcList: [{ at: r.firstAt, list: r.sources || [] }],
// // //           device: r.device,
// // //           browser: r.browser,
// // //           os: r.os,
// // //           ip: r.ip,
// // //           lastPath: r.lastPath,
// // //           lastTitle: r.lastTitle,
// // //           firstVisit: !!r.firstVisit,
// // //           isLoggedIn: !!r.isLoggedIn,
// // //           eventNames: new Set((r.eventNames || []).filter(Boolean)),
// // //           devices: [dev],
// // //         });
// // //         continue;
// // //       }
// // //       p.views += r.views;
// // //       p.clicks += r.clicks;
// // //       p.events += r.events;
// // //       (r.sessions || []).filter(Boolean).forEach((x) => p.sessions.add(x));
// // //       (r.eventNames || []).filter(Boolean).forEach((x) => p.eventNames.add(x));
// // //       p.devices.push(dev);
// // //       p.srcList.push({ at: r.firstAt, list: r.sources || [] });
// // //       p.firstVisit = p.firstVisit || !!r.firstVisit;
// // //       p.isLoggedIn = p.isLoggedIn || !!r.isLoggedIn;
// // //       if (r.firstAt < p.firstAt) { p.firstAt = r.firstAt; p.source = r.source; }
// // //       if (r.lastAt > p.lastAt) {
// // //         Object.assign(p, { lastAt: r.lastAt, visitorId: r._id, device: r.device, browser: r.browser, os: r.os, ip: r.ip, lastPath: r.lastPath, lastTitle: r.lastTitle });
// // //       }
// // //     }

// // //     const everyone = [...people.values()].sort((x, y) => new Date(y.lastAt) - new Date(x.lastAt));
// // //     const total = everyone.length;
// // //     const pageRows = everyone.slice((page - 1) * PAGE, page * PAGE);
// // //     const users = await usersById(pageRows.map((r) => r.userId));
// // //     const seen = await firstSeenOf(perBrowser.map((r) => r._id), links);
// // //     const list = pageRows.map((r) => ({
// // //       visitorId: r.visitorId, // journey ku (customer na ellaa devices um varum)
// // //       label: `Visitor ${shortId(r.visitorId)}`,
// // //       user: (r.userId && users.get(String(r.userId))) || null,
// // //       linkedLater: !!r.userId && !r.isLoggedIn, // indha filter la guest visits mattum; adhe aal vera samayam login pannirukkaanga
// // //       firstAt: r.firstAt,
// // //       lastAt: r.lastAt,
// // //       live: new Date(r.lastAt) >= liveSince,
// // //       views: r.views,
// // //       clicks: r.clicks,
// // //       events: r.events,
// // //       sessions: r.sessions.size,
// // //       source: r.source,
// // //       sources: [...new Set(r.srcList.sort((a, b) => new Date(a.at) - new Date(b.at)).flatMap((x) => x.list).filter(Boolean))],
// // //       device: r.device,
// // //       browser: r.browser,
// // //       os: r.os,
// // //       ip: r.ip,
// // //       lastPath: r.lastPath,
// // //       lastTitle: r.lastTitle,
// // //       firstVisit: !!(seen.get(r.key) && seen.get(r.key) >= match.at.$gte), // New = indha period la mudhal thadavai
// // //       firstSeenAt: seen.get(r.key) || null,
// // //       isLoggedIn: r.isLoggedIn,
// // //       eventNames: [...r.eventNames],
// // //       devices: r.devices.map((d) => ({ ...d, label: `${d.device} · ${d.browser}` })),
// // //       durationSec: Math.max(0, Math.round((new Date(r.lastAt) - new Date(r.firstAt)) / 1000)),
// // //     }));
// // //     return { total, page, pageSize: PAGE, hasMore: page * PAGE < total, list };
// // // };

// // // export const trafficVisitors = async (req, res) => {
// // //   try {
// // //     const out = await buildVisitors(req.query);
// // //     return res.status(200).json({ success: true, ...out });
// // //   } catch (error) {
// // //     return res.status(500).json({ success: false, message: error.message });
// // //   }
// // // };

// // // // ─── GET /api/touradmin/traffic/export?what=visitors|activity&…filters → CSV (Excel la open aagum) ───
// // // const csvCell = (v) => {
// // //   const t = v === null || v === undefined ? "" : String(v);
// // //   const safe = /^[=+\-@]/.test(t) ? `'${t}` : t; // Excel formula injection thadukka
// // //   return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
// // // };
// // // const toCsv = (head, rows) => "\uFEFF" + [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
// // // const istText = (d) => (d ? new Date(new Date(d).getTime() + 5.5 * 36e5).toISOString().replace("T", " ").slice(0, 19) : "");

// // // export const trafficExport = async (req, res) => {
// // //   try {
// // //     const what = req.query.what === "activity" ? "activity" : "visitors";
// // //     const { from, to } = rangeOf(req.query);
// // //     let csv;
// // //     if (what === "visitors") {
// // //       const { list } = await buildVisitors(req.query, { all: true });
// // //       csv = toCsv(
// // //         ["Visitor", "Name", "Email", "Phone", "Logged in", "New / Returning", "Sources", "Devices", "Pages", "Clicks", "Stage events", "Visits", "Time spent (min)", "First seen (IST)", "Last seen (IST)", "Last page", "IP (partly hidden)"],
// // //         list.map((v) => [
// // //           v.label, v.user?.name || "", v.user?.email || "", v.user?.phone || "",
// // //           v.user ? "Yes" : "No", v.firstVisit ? "New" : "Returning",
// // //           (v.sources?.length ? v.sources : [v.source]).join(" | "),
// // //           v.devices.map((d) => d.label).join(" | "),
// // //           v.views, v.clicks, (v.eventNames || []).join(" | "), v.sessions,
// // //           Math.round(v.durationSec / 60), istText(v.firstAt), istText(v.lastAt), v.lastPath, v.ip,
// // //         ])
// // //       );
// // //     } else {
// // //       const { match } = rangeOf(req.query);
// // //       await applyFilters(match, req.query);
// // //       const kind = req.query.kind;
// // //       if (kind === "pageview") match.type = { $in: ["pageview", null] };
// // //       else if (kind === "click" || kind === "event") match.type = kind;
// // //       const rows = await visitModel.find(match).sort({ at: -1 }).limit(20000).lean();
// // //       const users = await usersById(rows.map((r) => r.userId));
// // //       csv = toCsv(
// // //         ["Time (IST)", "Type", "What", "Page", "Visitor", "Name", "Email", "Phone", "Source", "Device", "Browser", "OS", "IP (partly hidden)"],
// // //         rows.map((r) => {
// // //           const u = r.userId && users.get(String(r.userId));
// // //           const type = r.type || "pageview";
// // //           return [istText(r.at), type, type === "pageview" ? r.title || r.path : r.name, r.path, `Visitor ${shortId(r.visitorId)}`, u?.name || "", u?.email || "", u?.phone || "", r.source, r.device, r.browser, r.os, r.ip];
// // //         })
// // //       );
// // //     }
// // //     res.setHeader("Content-Type", "text/csv; charset=utf-8");
// // //     res.setHeader("Content-Disposition", `attachment; filename="website-${what}-${from}-to-${to}.csv"`);
// // //     return res.status(200).send(csv);
// // //   } catch (error) {
// // //     return res.status(500).json({ success: false, message: error.message });
// // //   }
// // // };

// // // // ─── GET /api/touradmin/traffic/visitor/:visitorId — andha aal enna enna panninaanga (journey) ───
// // // export const trafficVisitorJourney = async (req, res) => {
// // //   try {
// // //     const visitorId = clip(req.params.visitorId, 64);
// // //     if (!visitorId) return res.status(400).json({ success: false, message: "Visitor not found" });
// // //     // Login aana customer na avanga ellaa devices (browsers) um serthu
// // //     const uid0 = (await linkMap([visitorId])).get(visitorId) || null;
// // //     const allIds = uid0 ? await visitModel.distinct("visitorId", { userId: uid0 }) : [visitorId];
// // //     if (!allIds.includes(visitorId)) allIds.push(visitorId);
// // //     const items = await visitModel
// // //       .find({ visitorId: { $in: allIds } })
// // //       .sort({ at: 1 })
// // //       .limit(1000)
// // //       .select("at type name props path title source referrer device browser os screen ip sessionId isLoggedIn firstVisit userId visitorId")
// // //       .lean();
// // //     if (!items.length) return res.status(404).json({ success: false, message: "Visitor not found" });
// // //     const first = items[0];
// // //     const last = items[items.length - 1];
// // //     const uid = [...items].reverse().find((i) => i.userId)?.userId || null;
// // //     const jUser = uid ? (await usersById([uid])).get(String(uid)) || null : null;
// // //     return res.status(200).json({
// // //       success: true,
// // //       visitor: {
// // //         visitorId,
// // //         label: `Visitor ${shortId(visitorId)}`,
// // //         user: jUser,
// // //         firstAt: first.at,
// // //         lastAt: last.at,
// // //         source: first.source,
// // //         referrer: first.referrer || "",
// // //         device: last.device,
// // //         browser: last.browser,
// // //         os: last.os,
// // //         screen: last.screen,
// // //         ip: last.ip,
// // //         isLoggedIn: items.some((i) => i.isLoggedIn),
// // //         sessions: new Set(items.map((i) => i.sessionId).filter(Boolean)).size,
// // //         devices: [...new Map(items.map((i) => [i.visitorId, `${i.device} · ${i.browser} · ${i.os}`])).values()],
// // //         views: items.filter((i) => !i.type || i.type === "pageview").length,
// // //         clicks: items.filter((i) => i.type === "click").length,
// // //         events: items.filter((i) => i.type === "event").length,
// // //       },
// // //       items: items.map(({ _id, ...rest }) => rest), // eslint-disable-line no-unused-vars
// // //     });
// // //   } catch (error) {
// // //     return res.status(500).json({ success: false, message: error.message });
// // //   }
// // // };

// // // controllers/trafficController.js
// // // Customer website traffic — public "track" (login venaam) + Admin report.
// // // Routes: routes/tourAdminRoute.js (/api/touradmin/traffic/track, /api/touradmin/traffic/report)
// // import jwt from "jsonwebtoken";
// // import mongoose from "mongoose";
// // import visitModel from "../models/visitModel.js";
// // import userModel from "../models/userModel.js"; // customer (per / email / phone)

// // const IST = "+05:30";
// // const BOT_RX = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp\/|preview|headless|lighthouse|pingdom|uptime|curl|wget|python|axios|node-fetch/i;

// // // ─── helpers ───
// // const clip = (v, n = 300) => String(v ?? "").slice(0, n);
// // const maskIp = (ip) => {
// //   const s = String(ip || "").replace(/^::ffff:/, "").trim();
// //   if (/^\d+\.\d+\.\d+\.\d+$/.test(s)) return s.split(".").slice(0, 2).join(".") + ".x.x";
// //   if (s.includes(":")) return s.split(":").slice(0, 3).join(":") + ":…";
// //   return "";
// // };
// // const clientIp = (req) => String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "";
// // const parseUa = (ua = "") => {
// //   const device = /ipad|tablet|(android(?!.*mobile))/i.test(ua) ? "Tablet" : /mobi|iphone|android/i.test(ua) ? "Mobile" : "Desktop";
// //   const browser = /edg\//i.test(ua) ? "Edge" : /opr\/|opera/i.test(ua) ? "Opera" : /samsungbrowser/i.test(ua) ? "Samsung" : /chrome|crios/i.test(ua) ? "Chrome" : /firefox|fxios/i.test(ua) ? "Firefox" : /safari/i.test(ua) ? "Safari" : "Other";
// //   const os = /windows/i.test(ua) ? "Windows" : /iphone|ipad|ios/i.test(ua) ? "iOS" : /android/i.test(ua) ? "Android" : /mac os/i.test(ua) ? "macOS" : /linux/i.test(ua) ? "Linux" : "Other";
// //   return { device, browser, os };
// // };
// // const SOURCE_RULES = [
// //   [/google\./i, "Google"], [/bing\./i, "Bing"], [/yahoo\./i, "Yahoo"], [/duckduckgo/i, "DuckDuckGo"],
// //   [/instagram|l\.instagram/i, "Instagram"], [/facebook|fb\.com|m\.facebook|l\.facebook/i, "Facebook"],
// //   [/whatsapp|wa\.me|l\.wl\.co/i, "WhatsApp"], [/youtube|youtu\.be/i, "YouTube"],
// //   [/t\.co|twitter|x\.com/i, "X / Twitter"], [/linkedin/i, "LinkedIn"],
// // ];
// // const sourceOf = (referrer, utmSource, ownHost) => {
// //   if (utmSource) return clip(utmSource, 40);
// //   if (!referrer) return "Direct";
// //   let host = "";
// //   try { host = new URL(referrer).hostname.replace(/^www\./, ""); } catch { return "Direct"; }
// //   if (!host || (ownHost && host.endsWith(ownHost))) return "Direct";
// //   const hit = SOURCE_RULES.find(([rx]) => rx.test(host));
// //   return hit ? hit[1] : host;
// // };

// // // Customer token → user id (login aana customer). Token save aagaadhu — id mattum.
// // const userIdFromToken = (tok) => {
// //   if (!tok || typeof tok !== "string" || tok.length > 2000) return null;
// //   try {
// //     const d = jwt.verify(tok, process.env.JWT_SECRET); // userController: jwt.sign({ id: user._id }, JWT_SECRET)
// //     const id = d && typeof d === "object" ? d.id || d._id || d.userId : null;
// //     return id && mongoose.isValidObjectId(String(id)) ? String(id) : null;
// //   } catch (err) {
// //     if (process.env.NODE_ENV !== "production") console.warn("traffic: customer token not valid —", err.message);
// //     return null;
// //   }
// // };
// // const userModelRef = () => userModel;
// // const usersById = async (ids) => {
// //   const M = userModelRef();
// //   const list = [...new Set(ids.filter((x) => x && mongoose.isValidObjectId(String(x))).map(String))];
// //   if (!M || !list.length) return new Map();
// //   const docs = await M.find({ _id: { $in: list } }).select("name email phone").lean();
// //   return new Map(docs.map((u) => [String(u._id), { name: u.name || "", email: u.email || "", phone: u.phone || "" }]));
// // };

// // // visitorId → userId (eppovaavadhu login aana browser). Ore customer oda pala devices ah serkka.
// // const linkMap = async (visitorIds) => {
// //   const ids = [...new Set(visitorIds.filter(Boolean))];
// //   if (!ids.length) return new Map();
// //   const rows = await visitModel.aggregate([
// //     { $match: { visitorId: { $in: ids }, userId: { $ne: null } } },
// //     { $sort: { at: -1 } },
// //     { $group: { _id: "$visitorId", userId: { $first: "$userId" } } },
// //   ]);
// //   return new Map(rows.map((r) => [r._id, r.userId]));
// // };
// // // Oru aal key — login aana customer na "u:<userId>", illana browser "v:<visitorId>"
// // const personKey = (visitorId, links) => (links.get(visitorId) ? `u:${links.get(visitorId)}` : `v:${visitorId}`);

// // // Oru aal mudhal thadavai eppo vandhaanga (all time) — New / Returning ku.
// // // Login aana customer na avanga ellaa devices um serthu.
// // const firstSeenOf = async (visitorIds, links) => {
// //   const ids = [...new Set(visitorIds.filter(Boolean))];
// //   const uids = [...new Set(ids.map((v) => links.get(v)).filter(Boolean))];
// //   const [byV, byU] = await Promise.all([
// //     ids.length ? visitModel.aggregate([{ $match: { visitorId: { $in: ids } } }, { $group: { _id: "$visitorId", at: { $min: "$at" } } }]) : [],
// //     uids.length ? visitModel.aggregate([{ $match: { userId: { $in: uids } } }, { $group: { _id: "$userId", at: { $min: "$at" } } }]) : [],
// //   ]);
// //   const vMin = new Map(byV.map((r) => [r._id, r.at]));
// //   const uMin = new Map(byU.map((r) => [String(r._id), r.at]));
// //   const out = new Map(); // personKey → first seen
// //   ids.forEach((v) => {
// //     const key = personKey(v, links);
// //     const cands = [vMin.get(v), links.get(v) ? uMin.get(String(links.get(v))) : null, out.get(key)].filter(Boolean);
// //     if (cands.length) out.set(key, new Date(Math.min(...cands.map((d) => new Date(d).getTime()))));
// //   });
// //   return out;
// // };

// // // ─── LIVE (YouTube "watching now" maadhiri) ───
// // // Customer site tab open + paarththutte irundhaa 20 sec ku oru "ping" varum. DB la save aagaadhu, memory la mattum.
// // // Tab close / vera tab poonaa ping nirkkum → 45 sec la Live la irundhu poyidum.
// // let lastWrite = Date.now(); // kadaisi-aa DB la visit save aana neram (memory)
// // const LIVE_MS = 45000;
// // const liveMap = new Map(); // visitorId → { at, loggedIn }
// // const markLive = (visitorId, loggedIn) => {
// //   liveMap.set(visitorId, { at: Date.now(), loggedIn: !!loggedIn });
// //   if (liveMap.size > 20000) liveMap.clear();
// // };
// // const liveNow = (who) => {
// //   const cut = Date.now() - LIVE_MS;
// //   const out = [];
// //   for (const [vid, x] of liveMap) {
// //     if (x.at < cut) { liveMap.delete(vid); continue; }
// //     if (who === "guest" && x.loggedIn) continue;
// //     if (who === "loggedIn" && !x.loggedIn) continue;
// //     out.push(vid);
// //   }
// //   return out;
// // };

// // // Romba adhigam request (oru IP la nimishathukku 120 mel) — ignore
// // const hits = new Map();
// // const tooMany = (key) => {
// //   const now = Date.now();
// //   const h = hits.get(key) || { n: 0, t: now };
// //   if (now - h.t > 60000) { h.n = 0; h.t = now; }
// //   h.n += 1;
// //   hits.set(key, h);
// //   if (hits.size > 5000) hits.clear();
// //   return h.n > 120;
// // };

// // // ─── POST /api/touradmin/traffic/track  (public — login venaam) ───
// // export const trackVisit = async (req, res) => {
// //   try {
// //     const ua = String(req.headers["user-agent"] || "");
// //     if (!ua || BOT_RX.test(ua)) return res.status(204).end();
// //     const ip = clientIp(req);
// //     if (tooMany(ip)) return res.status(204).end();

// //     const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
// //     const visitorId = clip(b.visitorId, 64);
// //     if (!visitorId) return res.status(204).end();
// //     // Live ping / tab close — DB la podaadhu
// //     if (b.type === "bye") { liveMap.delete(visitorId); return res.status(204).end(); }
// //     if (b.type === "ping") { markLive(visitorId, b.isLoggedIn); return res.status(204).end(); }
// //     markLive(visitorId, b.isLoggedIn);
// //     let ownHost = "";
// //     try { ownHost = new URL(String(req.headers.origin || "")).hostname.replace(/^www\./, ""); } catch { /* */ }

// //     const type = ["pageview", "click", "event"].includes(b.type) ? b.type : "pageview";
// //     const name = clip(b.name, 80).trim();
// //     if (type !== "pageview" && !name) return res.status(204).end();
// //     // props — flat, chinna values mattum (max 10 keys)
// //     let props = null;
// //     if (b.props && typeof b.props === "object" && !Array.isArray(b.props)) {
// //       props = {};
// //       Object.keys(b.props).slice(0, 10).forEach((k) => {
// //         const v = b.props[k];
// //         if (["string", "number", "boolean"].includes(typeof v)) props[clip(k, 30)] = typeof v === "string" ? clip(v, 120) : v;
// //       });
// //       if (!Object.keys(props).length) props = null;
// //     }
// //     const utm = b.utm && typeof b.utm === "object"
// //       ? { source: clip(b.utm.source, 60), medium: clip(b.utm.medium, 60), campaign: clip(b.utm.campaign, 80) }
// //       : null;
// //     const userId = userIdFromToken(b.utoken);
// //     lastWrite = Date.now(); // pudhu data vandhuchu — admin page refresh aaganum
// //     await visitModel.create({
// //       visitorId,
// //       sessionId: clip(b.sessionId, 64),
// //       type,
// //       name,
// //       props,
// //       path: clip(b.path || "/", 300),
// //       title: clip(b.title, 200),
// //       referrer: clip(b.referrer, 300),
// //       source: sourceOf(b.referrer, utm?.source, ownHost),
// //       utm: utm && (utm.source || utm.medium || utm.campaign) ? utm : null,
// //       ...parseUa(ua),
// //       screen: clip(b.screen, 20),
// //       lang: clip(b.lang, 20),
// //       ip: maskIp(ip),
// //       firstVisit: !!b.isNew,
// //       isLoggedIn: !!b.isLoggedIn || !!userId,
// //       userId,
// //       at: new Date(),
// //     });
// //     return res.status(204).end();
// //   } catch {
// //     return res.status(204).end(); // tracking fail aanaalum customer site ku edhuvum theriyakoodaadhu
// //   }
// // };

// // // Query → { match, from, to, who } (IST date range + guest / loggedIn / all)
// // const rangeOf = (q) => {
// //   const today = new Date(Date.now() + 5.5 * 36e5).toISOString().slice(0, 10);
// //   const from = /^\d{4}-\d{2}-\d{2}$/.test(q.from || "") ? q.from : today;
// //   const to = /^\d{4}-\d{2}-\d{2}$/.test(q.to || "") ? q.to : today;
// //   const who = ["guest", "loggedIn", "all"].includes(q.who) ? q.who : "guest";
// //   const match = { at: { $gte: new Date(`${from}T00:00:00${IST}`), $lte: new Date(`${to}T23:59:59.999${IST}`) } };
// //   if (who === "guest") match.isLoggedIn = { $ne: true };
// //   if (who === "loggedIn") match.isLoggedIn = true;
// //   return { match, from, to, who };
// // };
// // // ─── Extra filters: source / device / browser / page / search (name, email, phone, visitor ID) ───
// // const escRx = (t) => String(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// // const applyFilters = async (match, q = {}) => {
// //   const and = [];
// //   const one = (v) => clip(v, 120).trim();
// //   if (one(q.source)) and.push({ source: one(q.source) });
// //   if (one(q.device)) and.push({ device: one(q.device) });
// //   if (one(q.browser)) and.push({ browser: one(q.browser) });
// //   if (one(q.os)) and.push({ os: one(q.os) });
// //   // NOTE: "page" = pagination number, so page filter "path" nu varum
// //   if (one(q.path)) {
// //     const pg = one(q.path) === "/" ? "/" : one(q.path).replace(/\/+$/, "");
// //     and.push({ path: new RegExp(`^${escRx(pg)}(\\?.*)?$`) });
// //   }
// //   if (one(q.event)) and.push({ type: "event", name: one(q.event) });
// //   if (q.isNew === "1") and.push({ firstVisit: true });
// //   const term = one(q.q);
// //   if (term) {
// //     const rx = new RegExp(escRx(term), "i");
// //     const users = await userModel.find({ $or: [{ name: rx }, { email: rx }, { phone: rx }] }).select("_id").limit(200).lean();
// //     const uids = users.map((u) => String(u._id));
// //     // andha customer login panna browsers (guest records um varanum)
// //     const vids = uids.length ? await visitModel.distinct("visitorId", { userId: { $in: uids } }) : [];
// //     // "Visitor A23801" maadhiri ID kuduthaa
// //     const idPart = term.replace(/^visitor\s*/i, "").replace(/[^a-z0-9]/gi, "");
// //     const or = [];
// //     if (uids.length) or.push({ userId: { $in: uids } });
// //     if (vids.length) or.push({ visitorId: { $in: vids } });
// //     if (idPart.length >= 4) or.push({ visitorId: new RegExp(`${idPart.split("").map(escRx).join("[^a-z0-9]*")}$`, "i") });
// //     and.push(or.length ? { $or: or } : { _id: null }); // edhuvum match aagala na empty
// //   }
// //   if (and.length) match.$and = [...(match.$and || []), ...and];
// //   return match;
// // };

// // // "Visitor A1B2C3" — visitorId la irundhu chinna per
// // const shortId = (id) => String(id || "").replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase() || "—";

// // // ─── GET /api/touradmin/traffic/report?from=YYYY-MM-DD&to=YYYY-MM-DD&who=guest|loggedIn|all&page=1 ───
// // const reportCore = async (req, res) => {
// //   try {
// //     const today = new Date(Date.now() + 5.5 * 36e5).toISOString().slice(0, 10);
// //     const from = /^\d{4}-\d{2}-\d{2}$/.test(req.query.from || "") ? req.query.from : today;
// //     const to = /^\d{4}-\d{2}-\d{2}$/.test(req.query.to || "") ? req.query.to : today;
// //     const who = ["guest", "loggedIn", "all"].includes(req.query.who) ? req.query.who : "guest";
// //     const page = Math.max(1, parseInt(req.query.page, 10) || 1);
// //     const PAGE = 50;

// //     const match = { at: { $gte: new Date(`${from}T00:00:00${IST}`), $lte: new Date(`${to}T23:59:59.999${IST}`) } };
// //     if (who === "guest") match.isLoggedIn = { $ne: true };
// //     if (who === "loggedIn") match.isLoggedIn = true;
// //     const baseMatch = { ...match }; // filter dropdown options ku (extra filter illaama)
// //     await applyFilters(match, req.query);

// //     const PV = { type: { $in: ["pageview", null] } }; // pazhaya records la type illa = pageview
// //     const kind = ["pageview", "click", "event"].includes(req.query.kind) ? req.query.kind : "";
// //     const dayExpr = { $dateToString: { format: "%Y-%m-%d", date: "$at", timezone: IST } };
// //     const top = (field, limit = 10) => [
// //       { $group: { _id: `$${field}`, views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
// //       { $project: { _id: 0, key: "$_id", views: 1, visitors: 1 } }, // ids — keezha aal (person) aa maathuvom
// //       { $sort: { views: -1 } },
// //       { $limit: limit },
// //     ];

// //     const [agg] = await visitModel.aggregate([
// //       { $match: match },
// //       {
// //         $facet: {
// //           totals: [
// //             { $match: PV },
// //             {
// //               $group: {
// //                 _id: null,
// //                 views: { $sum: 1 },
// //                 visitors: { $addToSet: "$visitorId" },
// //                 sessions: { $addToSet: "$sessionId" },
// //                 newVisitors: { $addToSet: { $cond: ["$firstVisit", "$visitorId", null] } },
// //               },
// //             },
// //             { $project: { _id: 0, views: 1, visitors: { $size: "$visitors" }, sessions: { $size: "$sessions" }, newVisitors: { $size: { $filter: { input: "$newVisitors", cond: { $ne: ["$$this", null] } } } } } },
// //           ],
// //           daily: [
// //             { $match: PV },
// //             { $group: { _id: dayExpr, views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
// //             { $project: { _id: 0, day: "$_id", views: 1, visitors: 1 } },
// //             { $sort: { day: 1 } },
// //           ],
// //           pages: [
// //             { $match: PV },
// //             { $sort: { at: -1 } },
// //             // ?utm_source=… maadhiri query string illaama ore page aa group pannum
// //             { $group: { _id: { $arrayElemAt: [{ $split: [{ $ifNull: ["$path", "/"] }, "?"] }, 0] }, views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" }, title: { $first: "$title" } } },
// //             { $project: { _id: 0, key: "$_id", title: 1, views: 1, visitors: 1 } },
// //             { $sort: { views: -1 } },
// //             { $limit: 300 },
// //           ],
// //           hourly: [
// //             { $match: PV },
// //             { $group: { _id: { $hour: { date: "$at", timezone: IST } }, views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
// //             { $project: { _id: 0, hour: "$_id", views: 1, visitors: 1 } },
// //             { $sort: { hour: 1 } },
// //           ],
// //           sources: [{ $match: PV }, ...top("source", 10)],
// //           devices: [{ $match: PV }, ...top("device", 5)],
// //           browsers: [{ $match: PV }, ...top("browser", 6)],
// //           clicks: [{ $match: { type: "click" } }, ...top("name", 15)],
// //           events: [{ $match: { type: "event" } }, ...top("name", 20)],
// //           list: [
// //             ...(kind ? [{ $match: kind === "pageview" ? PV : { type: kind } }] : []),
// //             { $sort: { at: -1 } },
// //             { $skip: (page - 1) * PAGE },
// //             { $limit: PAGE },
// //             { $project: { _id: 1, at: 1, userId: 1, type: 1, name: 1, props: 1, path: 1, title: 1, source: 1, device: 1, browser: 1, os: 1, ip: 1, firstVisit: 1, isLoggedIn: 1, visitorId: 1 } },
// //           ],
// //         },
// //       },
// //     ]);

// //     // Ippo site la irukkuravanga — kadaisi 5 nimisham
// //     const liveIds = liveNow(who); // ippo site la tab open aa irukkuravanga
// //     // Login aana customer oda pala devices = oru aal
// //     const pvIds = await visitModel.distinct("visitorId", { ...match, ...PV });
// //     // ellaa list la um vandha visitor ids — login aana customer oda pala browsers = oru aal
// //     const facetIds = new Set();
// //     ["daily", "pages", "hourly", "sources", "devices", "browsers", "clicks", "events"].forEach((k) =>
// //       (agg?.[k] || []).forEach((r) => (r.visitors || []).forEach((v) => facetIds.add(v))));
// //     const links = await linkMap([...pvIds, ...liveIds, ...facetIds]);
// //     const toPeople = (rows) => (rows || []).map((r) => ({ ...r, visitors: new Set((r.visitors || []).map((v) => personKey(v, links))).size }));
// //     // Top pages: /booking/<id1>, /booking/<id2> → ore "Booking" (query string, id ellaam thookkidum)
// //     const normPath = (p) => (String(p || "/").replace(/[?#].*$/, "").replace(/\/[a-f0-9]{24}(?=\/|$)/gi, "").replace(/\/+$/, "") || "/");
// //     const pageMap = new Map();
// //     (agg?.pages || []).forEach((r) => {
// //       const k = normPath(r.key);
// //       const cur = pageMap.get(k) || { key: k, title: r.title, views: 0, ids: new Set() };
// //       cur.views += r.views;
// //       (r.visitors || []).forEach((v) => cur.ids.add(v));
// //       pageMap.set(k, cur);
// //     });
// //     const pagesOut = [...pageMap.values()]
// //       .map((r) => ({ key: r.key, title: r.key === "/" ? r.title : "", views: r.views, visitors: new Set([...r.ids].map((v) => personKey(v, links))).size }))
// //       .sort((a, b) => b.views - a.views)
// //       .slice(0, 15);
// //     const people = new Set(pvIds.map((v) => personKey(v, links))).size;
// //     const livePeople = new Set(liveIds.map((v) => personKey(v, links))).size;

// //     const totals = agg?.totals?.[0] || { views: 0, visitors: 0, sessions: 0, newVisitors: 0 };
// //     // Real devices: ore aal oda Desktop · Chrome (normal + incognito) = 1 device; phone la um vandhaa = 2
// //     const devRows = await visitModel.aggregate([
// //       { $match: { ...match, ...PV } },
// //       { $group: { _id: { v: "$visitorId", device: "$device", browser: "$browser" } } },
// //     ]);
// //     totals.devices = new Set(devRows.map((r) => `${personKey(r._id.v, links)}|${r._id.device}|${r._id.browser}`)).size;
// //     totals.visitors = people; // aal (login aana customer devices serthu)
// //     // New = indha period la dhaan mudhal thadavai vandhaanga (eppovum, endha device la um); matha ellaarum Returning
// //     const firstSeen = await firstSeenOf(pvIds, links);
// //     const rangeStart = match.at.$gte;
// //     totals.newVisitors = [...new Set(pvIds.map((v) => personKey(v, links)))].filter((k) => firstSeen.get(k) && firstSeen.get(k) >= rangeStart).length;
// //     // Login aana customer na per kaattalaam
// //     const listUsers = await usersById((agg?.list || []).map((x) => x.userId));
// //     (agg?.list || []).forEach((x) => { const u = x.userId && listUsers.get(String(x.userId)); if (u) x.user = u; });
// //     // Filter dropdown ku — indha date range la irukkura values
// //     const [optSources, optDevices, optBrowsers, optOs, optPages, optEvents] = await Promise.all([
// //       visitModel.distinct("source", baseMatch),
// //       visitModel.distinct("device", baseMatch),
// //       visitModel.distinct("browser", baseMatch),
// //       visitModel.distinct("os", baseMatch),
// //       visitModel.aggregate([
// //         { $match: { ...baseMatch, ...PV } },
// //         { $group: { _id: { $arrayElemAt: [{ $split: [{ $ifNull: ["$path", "/"] }, "?"] }, 0] }, n: { $sum: 1 }, title: { $first: "$title" } } },
// //         { $sort: { n: -1 } },
// //         { $limit: 60 },
// //       ]),
// //       visitModel.distinct("name", { ...baseMatch, type: "event" }),
// //     ]);
// //     const clean = (a) => a.filter(Boolean).map(String).sort((x, y) => x.localeCompare(y));
// //     const options = {
// //       sources: clean(optSources),
// //       devices: clean(optDevices),
// //       browsers: clean(optBrowsers),
// //       os: clean(optOs),
// //       pages: optPages.map((p) => ({ path: p._id || "/", title: p.title || "", views: p.n })),
// //       events: clean(optEvents),
// //     };
// //     return res.status(200).json({
// //       success: true,
// //       options,
// //       range: { from, to, who },
// //       live: livePeople,
// //       totals,
// //       daily: toPeople(agg?.daily),
// //       pages: pagesOut,
// //       sources: toPeople(agg?.sources),
// //       devices: toPeople(agg?.devices),
// //       browsers: toPeople(agg?.browsers),
// //       hourly: toPeople(agg?.hourly),
// //       clicks: toPeople(agg?.clicks),
// //       events: toPeople(agg?.events),
// //       list: agg?.list || [],
// //       page,
// //       pageSize: PAGE,
// //       hasMore: (agg?.list || []).length === PAGE,
// //     });
// //   } catch (error) {
// //     return res.status(500).json({ success: false, message: error.message });
// //   }
// // };

// // // ─── GET /api/touradmin/traffic/visitors?from&to&who&page — ovvoru aal um thani row ───
// // // Login aana customer → avanga ellaa devices um ore row. Guest → browser wise.
// // const buildVisitors = async (query, { all = false } = {}) => {
// //     const { match } = rangeOf(query);
// //     await applyFilters(match, query);
// //     const page = all ? 1 : Math.max(1, parseInt(query.page, 10) || 1);
// //     const PAGE = all ? 5000 : 30;
// //     const liveSet = new Set(liveNow("all"));
// //     const perBrowser = await visitModel.aggregate([
// //       { $match: match },
// //       { $sort: { at: 1 } },
// //       {
// //         $group: {
// //           _id: "$visitorId",
// //           firstAt: { $first: "$at" },
// //           lastAt: { $last: "$at" },
// //           views: { $sum: { $cond: [{ $in: ["$type", ["pageview", null]] }, 1, 0] } },
// //           clicks: { $sum: { $cond: [{ $eq: ["$type", "click"] }, 1, 0] } },
// //           events: { $sum: { $cond: [{ $eq: ["$type", "event"] }, 1, 0] } },
// //           sessions: { $addToSet: "$sessionId" },
// //           source: { $first: "$source" },
// //           sources: { $push: "$source" },
// //           device: { $last: "$device" },
// //           devAll: { $addToSet: { device: "$device", browser: "$browser", os: "$os" } }, // indha browser ID la vandha ella device um
// //           browser: { $last: "$browser" },
// //           os: { $last: "$os" },
// //           ip: { $last: "$ip" },
// //           lastPath: { $last: "$path" },
// //           lastTitle: { $last: "$title" },
// //           firstVisit: { $max: "$firstVisit" },
// //           isLoggedIn: { $max: "$isLoggedIn" },
// //           eventNames: { $addToSet: { $cond: [{ $eq: ["$type", "event"] }, "$name", null] } },
// //         },
// //       },
// //     ]);

// //     // Login link (indha range la illanaalum, vera naal login pannirundhaa)
// //     const links = await linkMap(perBrowser.map((r) => r._id));
// //     const people = new Map();
// //     for (const r of perBrowser) {
// //       const key = personKey(r._id, links);
// //       const p = people.get(key);
// //       const devs = (r.devAll && r.devAll.length ? r.devAll : [{ device: r.device, browser: r.browser, os: r.os }]).map((d) => ({ visitorId: r._id, ...d }));
// //       if (!p) {
// //         people.set(key, {
// //           key,
// //           visitorId: r._id,
// //           userId: links.get(r._id) || null,
// //           firstAt: r.firstAt,
// //           lastAt: r.lastAt,
// //           views: r.views,
// //           clicks: r.clicks,
// //           events: r.events,
// //           sessions: new Set((r.sessions || []).filter(Boolean)),
// //           source: r.source,
// //           srcList: [{ at: r.firstAt, list: r.sources || [] }],
// //           device: r.device,
// //           browser: r.browser,
// //           os: r.os,
// //           ip: r.ip,
// //           lastPath: r.lastPath,
// //           lastTitle: r.lastTitle,
// //           firstVisit: !!r.firstVisit,
// //           isLoggedIn: !!r.isLoggedIn,
// //           eventNames: new Set((r.eventNames || []).filter(Boolean)),
// //           devices: [...devs],
// //         });
// //         continue;
// //       }
// //       p.views += r.views;
// //       p.clicks += r.clicks;
// //       p.events += r.events;
// //       (r.sessions || []).filter(Boolean).forEach((x) => p.sessions.add(x));
// //       (r.eventNames || []).filter(Boolean).forEach((x) => p.eventNames.add(x));
// //       p.devices.push(...devs);
// //       p.srcList.push({ at: r.firstAt, list: r.sources || [] });
// //       p.firstVisit = p.firstVisit || !!r.firstVisit;
// //       p.isLoggedIn = p.isLoggedIn || !!r.isLoggedIn;
// //       if (r.firstAt < p.firstAt) { p.firstAt = r.firstAt; p.source = r.source; }
// //       if (r.lastAt > p.lastAt) {
// //         Object.assign(p, { lastAt: r.lastAt, visitorId: r._id, device: r.device, browser: r.browser, os: r.os, ip: r.ip, lastPath: r.lastPath, lastTitle: r.lastTitle });
// //       }
// //     }

// //     const everyone = [...people.values()].sort((x, y) => new Date(y.lastAt) - new Date(x.lastAt));
// //     const total = everyone.length;
// //     const pageRows = everyone.slice((page - 1) * PAGE, page * PAGE);
// //     const users = await usersById(pageRows.map((r) => r.userId));
// //     const seen = await firstSeenOf(perBrowser.map((r) => r._id), links);
// //     const list = pageRows.map((r) => ({
// //       visitorId: r.visitorId, // journey ku (customer na ellaa devices um varum)
// //       label: `Visitor ${shortId(r.visitorId)}`,
// //       user: (r.userId && users.get(String(r.userId))) || null,
// //       linkedLater: !!r.userId && !r.isLoggedIn, // indha filter la guest visits mattum; adhe aal vera samayam login pannirukkaanga
// //       firstAt: r.firstAt,
// //       lastAt: r.lastAt,
// //       live: r.devices.some((d) => liveSet.has(d.visitorId)),
// //       views: r.views,
// //       clicks: r.clicks,
// //       events: r.events,
// //       sessions: r.sessions.size,
// //       source: r.source,
// //       sources: [...new Set(r.srcList.sort((a, b) => new Date(a.at) - new Date(b.at)).flatMap((x) => x.list).filter(Boolean))],
// //       device: r.device,
// //       browser: r.browser,
// //       os: r.os,
// //       ip: r.ip,
// //       lastPath: r.lastPath,
// //       lastTitle: r.lastTitle,
// //       firstVisit: !!(seen.get(r.key) && seen.get(r.key) >= match.at.$gte), // New = indha period la mudhal thadavai
// //       firstSeenAt: seen.get(r.key) || null,
// //       isLoggedIn: r.isLoggedIn,
// //       eventNames: [...r.eventNames],
// //       devices: r.devices.map((d) => ({ ...d, label: `${d.device} · ${d.browser}` })),
// //       durationSec: Math.max(0, Math.round((new Date(r.lastAt) - new Date(r.firstAt)) / 1000)),
// //     }));
// //     return { total, page, pageSize: PAGE, hasMore: page * PAGE < total, list };
// // };

// // const visitorsCore = async (req, res) => {
// //   try {
// //     const out = await buildVisitors(req.query);
// //     return res.status(200).json({ success: true, ...out });
// //   } catch (error) {
// //     return res.status(500).json({ success: false, message: error.message });
// //   }
// // };

// // // ─── Speed: admin page 5 sec ku oru thadava kekkum — aana heavy query pudhu data vandhaa mattum ───
// // //  • ?since=<lastWrite> anuppi, adhukku apram pudhu visit illana → { unchanged: true, live } (DB query illa, udane)
// // //  • Pudhu data irundhaalum adhe filter ku 10 sec ku oru thadava mattum full query (ella admins um share)
// // const CACHE_MS = 10000;
// // const cache = new Map(); // key → { at, lastWrite, body }
// // const capture = (core, query) => new Promise((resolve, reject) => {
// //   core({ query }, { status: (code) => ({ json: (body) => resolve({ code, body }) }) }).catch(reject);
// // });
// // const cachedRun = async (core, query) => {
// //   const { since, ...q } = query || {};
// //   const key = `${core === reportCore ? "r" : "v"}:${JSON.stringify(Object.keys(q).sort().map((k) => [k, q[k]]))}`;
// //   const hit = cache.get(key);
// //   if (hit && (hit.lastWrite === lastWrite || Date.now() - hit.at < CACHE_MS)) return { code: 200, body: hit.body, cachedLastWrite: hit.lastWrite };
// //   const wrote = lastWrite;
// //   const out = await capture(core, q);
// //   if (out.code === 200 && out.body?.success) {
// //     cache.set(key, { at: Date.now(), lastWrite: wrote, body: out.body });
// //     if (cache.size > 300) cache.delete(cache.keys().next().value);
// //   }
// //   return { ...out, cachedLastWrite: wrote };
// // };
// // const freshLive = async (who) => {
// //   const ids = liveNow(who);
// //   const links = await linkMap(ids);
// //   return { live: new Set(ids.map((v) => personKey(v, links))).size, liveIds: liveNow("all") };
// // };

// // export const trafficReport = async (req, res) => {
// //   try {
// //     const who = ["guest", "loggedIn", "all"].includes(req.query.who) ? req.query.who : "guest";
// //     const { live } = await freshLive(who);
// //     if (req.query.since && Number(req.query.since) === lastWrite) {
// //       return res.status(200).json({ success: true, unchanged: true, live, lastWrite });
// //     }
// //     const out = await cachedRun(reportCore, req.query);
// //     if (out.code !== 200) return res.status(out.code).json(out.body);
// //     return res.status(200).json({ ...out.body, live, lastWrite: out.cachedLastWrite });
// //   } catch (error) {
// //     return res.status(500).json({ success: false, message: error.message });
// //   }
// // };

// // export const trafficVisitors = async (req, res) => {
// //   try {
// //     const { liveIds } = await freshLive("all");
// //     const liveSet = new Set(liveIds);
// //     if (req.query.since && Number(req.query.since) === lastWrite) {
// //       return res.status(200).json({ success: true, unchanged: true, liveIds, lastWrite });
// //     }
// //     const out = await cachedRun(visitorsCore, req.query);
// //     if (out.code !== 200) return res.status(out.code).json(out.body);
// //     const list = (out.body.list || []).map((v) => ({ ...v, live: (v.devices || []).some((d) => liveSet.has(d.visitorId)) }));
// //     return res.status(200).json({ ...out.body, list, lastWrite: out.cachedLastWrite });
// //   } catch (error) {
// //     return res.status(500).json({ success: false, message: error.message });
// //   }
// // };

// // // ─── GET /api/touradmin/traffic/export?what=visitors|activity&…filters → CSV (Excel la open aagum) ───
// // const csvCell = (v) => {
// //   const t = v === null || v === undefined ? "" : String(v);
// //   const safe = /^[=+\-@]/.test(t) ? `'${t}` : t; // Excel formula injection thadukka
// //   return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
// // };
// // const toCsv = (head, rows) => "\uFEFF" + [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
// // const istText = (d) => (d ? new Date(new Date(d).getTime() + 5.5 * 36e5).toISOString().replace("T", " ").slice(0, 19) : "");

// // export const trafficExport = async (req, res) => {
// //   try {
// //     const what = req.query.what === "activity" ? "activity" : "visitors";
// //     const { from, to } = rangeOf(req.query);
// //     let csv;
// //     if (what === "visitors") {
// //       const { list } = await buildVisitors(req.query, { all: true });
// //       csv = toCsv(
// //         ["Visitor", "Name", "Email", "Phone", "Logged in", "New / Returning", "Sources", "Devices", "Pages", "Clicks", "Stage events", "Visits", "Time spent (min)", "First seen (IST)", "Last seen (IST)", "Last page", "IP (partly hidden)"],
// //         list.map((v) => [
// //           v.label, v.user?.name || "", v.user?.email || "", v.user?.phone || "",
// //           v.user ? "Yes" : "No", v.firstVisit ? "New" : "Returning",
// //           (v.sources?.length ? v.sources : [v.source]).join(" | "),
// //           v.devices.map((d) => d.label).join(" | "),
// //           v.views, v.clicks, (v.eventNames || []).join(" | "), v.sessions,
// //           Math.round(v.durationSec / 60), istText(v.firstAt), istText(v.lastAt), v.lastPath, v.ip,
// //         ])
// //       );
// //     } else {
// //       const { match } = rangeOf(req.query);
// //       await applyFilters(match, req.query);
// //       const kind = req.query.kind;
// //       if (kind === "pageview") match.type = { $in: ["pageview", null] };
// //       else if (kind === "click" || kind === "event") match.type = kind;
// //       const rows = await visitModel.find(match).sort({ at: -1 }).limit(20000).lean();
// //       const users = await usersById(rows.map((r) => r.userId));
// //       csv = toCsv(
// //         ["Time (IST)", "Type", "What", "Page", "Visitor", "Name", "Email", "Phone", "Source", "Device", "Browser", "OS", "IP (partly hidden)"],
// //         rows.map((r) => {
// //           const u = r.userId && users.get(String(r.userId));
// //           const type = r.type || "pageview";
// //           return [istText(r.at), type, type === "pageview" ? r.title || r.path : r.name, r.path, `Visitor ${shortId(r.visitorId)}`, u?.name || "", u?.email || "", u?.phone || "", r.source, r.device, r.browser, r.os, r.ip];
// //         })
// //       );
// //     }
// //     res.setHeader("Content-Type", "text/csv; charset=utf-8");
// //     res.setHeader("Content-Disposition", `attachment; filename="website-${what}-${from}-to-${to}.csv"`);
// //     return res.status(200).send(csv);
// //   } catch (error) {
// //     return res.status(500).json({ success: false, message: error.message });
// //   }
// // };

// // // ─── GET /api/touradmin/traffic/visitor/:visitorId — andha aal enna enna panninaanga (journey) ───
// // export const trafficVisitorJourney = async (req, res) => {
// //   try {
// //     const visitorId = clip(req.params.visitorId, 64);
// //     if (!visitorId) return res.status(400).json({ success: false, message: "Visitor not found" });
// //     // Login aana customer na avanga ellaa devices (browsers) um serthu
// //     const uid0 = (await linkMap([visitorId])).get(visitorId) || null;
// //     const allIds = uid0 ? await visitModel.distinct("visitorId", { userId: uid0 }) : [visitorId];
// //     if (!allIds.includes(visitorId)) allIds.push(visitorId);
// //     const items = await visitModel
// //       .find({ visitorId: { $in: allIds } })
// //       .sort({ at: 1 })
// //       .limit(1000)
// //       .select("at type name props path title source referrer device browser os screen ip sessionId isLoggedIn firstVisit userId visitorId")
// //       .lean();
// //     if (!items.length) return res.status(404).json({ success: false, message: "Visitor not found" });
// //     const first = items[0];
// //     const last = items[items.length - 1];
// //     const uid = [...items].reverse().find((i) => i.userId)?.userId || null;
// //     const jUser = uid ? (await usersById([uid])).get(String(uid)) || null : null;
// //     return res.status(200).json({
// //       success: true,
// //       visitor: {
// //         visitorId,
// //         label: `Visitor ${shortId(visitorId)}`,
// //         user: jUser,
// //         firstAt: first.at,
// //         lastAt: last.at,
// //         source: first.source,
// //         referrer: first.referrer || "",
// //         device: last.device,
// //         browser: last.browser,
// //         os: last.os,
// //         screen: last.screen,
// //         ip: last.ip,
// //         isLoggedIn: items.some((i) => i.isLoggedIn),
// //         sessions: new Set(items.map((i) => i.sessionId).filter(Boolean)).size,
// //         devices: [...new Map(items.map((i) => [i.visitorId, `${i.device} · ${i.browser} · ${i.os}`])).values()],
// //         views: items.filter((i) => !i.type || i.type === "pageview").length,
// //         clicks: items.filter((i) => i.type === "click").length,
// //         events: items.filter((i) => i.type === "event").length,
// //       },
// //       items: items.map(({ _id, ...rest }) => rest), // eslint-disable-line no-unused-vars
// //     });
// //   } catch (error) {
// //     return res.status(500).json({ success: false, message: error.message });
// //   }
// // };

// // controllers/trafficController.js
// // Customer website traffic — public "track" (login venaam) + Admin report.
// // Routes: routes/tourAdminRoute.js (/api/touradmin/traffic/track, /api/touradmin/traffic/report)
// import jwt from "jsonwebtoken";
// import mongoose from "mongoose";
// import visitModel from "../models/visitModel.js";
// import userModel from "../models/userModel.js"; // customer (per / email / phone)

// const IST = "+05:30";
// const BOT_RX = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp\/|preview|headless|lighthouse|pingdom|uptime|curl|wget|python|axios|node-fetch/i;

// // ─── helpers ───
// const clip = (v, n = 300) => String(v ?? "").slice(0, n);
// const maskIp = (ip) => {
//   const s = String(ip || "").replace(/^::ffff:/, "").trim();
//   if (/^\d+\.\d+\.\d+\.\d+$/.test(s)) return s.split(".").slice(0, 2).join(".") + ".x.x";
//   if (s.includes(":")) return s.split(":").slice(0, 3).join(":") + ":…";
//   return "";
// };
// const clientIp = (req) => String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "";
// const parseUa = (ua = "") => {
//   const device = /ipad|tablet|(android(?!.*mobile))/i.test(ua) ? "Tablet" : /mobi|iphone|android/i.test(ua) ? "Mobile" : "Desktop";
//   const browser = /edg\//i.test(ua) ? "Edge" : /opr\/|opera/i.test(ua) ? "Opera" : /samsungbrowser/i.test(ua) ? "Samsung" : /chrome|crios/i.test(ua) ? "Chrome" : /firefox|fxios/i.test(ua) ? "Firefox" : /safari/i.test(ua) ? "Safari" : "Other";
//   const os = /windows/i.test(ua) ? "Windows" : /iphone|ipad|ios/i.test(ua) ? "iOS" : /android/i.test(ua) ? "Android" : /mac os/i.test(ua) ? "macOS" : /linux/i.test(ua) ? "Linux" : "Other";
//   return { device, browser, os };
// };
// const SOURCE_RULES = [
//   [/google\./i, "Google"], [/bing\./i, "Bing"], [/yahoo\./i, "Yahoo"], [/duckduckgo/i, "DuckDuckGo"],
//   [/instagram|l\.instagram/i, "Instagram"], [/facebook|fb\.com|m\.facebook|l\.facebook/i, "Facebook"],
//   [/whatsapp|wa\.me|l\.wl\.co/i, "WhatsApp"], [/youtube|youtu\.be/i, "YouTube"],
//   [/t\.co|twitter|x\.com/i, "X / Twitter"], [/linkedin/i, "LinkedIn"],
// ];
// const sourceOf = (referrer, utmSource, ownHost) => {
//   if (utmSource) return clip(utmSource, 40);
//   if (!referrer) return "Direct";
//   let host = "";
//   try { host = new URL(referrer).hostname.replace(/^www\./, ""); } catch { return "Direct"; }
//   if (!host || (ownHost && host.endsWith(ownHost))) return "Direct";
//   const hit = SOURCE_RULES.find(([rx]) => rx.test(host));
//   return hit ? hit[1] : host;
// };

// // Customer token → user id (login aana customer). Token save aagaadhu — id mattum.
// const userIdFromToken = (tok) => {
//   if (!tok || typeof tok !== "string" || tok.length > 2000) return null;
//   try {
//     const d = jwt.verify(tok, process.env.JWT_SECRET); // userController: jwt.sign({ id: user._id }, JWT_SECRET)
//     const id = d && typeof d === "object" ? d.id || d._id || d.userId : null;
//     return id && mongoose.isValidObjectId(String(id)) ? String(id) : null;
//   } catch (err) {
//     if (process.env.NODE_ENV !== "production") console.warn("traffic: customer token not valid —", err.message);
//     return null;
//   }
// };
// const userModelRef = () => userModel;
// const usersById = async (ids) => {
//   const M = userModelRef();
//   const list = [...new Set(ids.filter((x) => x && mongoose.isValidObjectId(String(x))).map(String))];
//   if (!M || !list.length) return new Map();
//   const docs = await M.find({ _id: { $in: list } }).select("name email phone").lean();
//   return new Map(docs.map((u) => [String(u._id), { name: u.name || "", email: u.email || "", phone: u.phone || "" }]));
// };

// // visitorId → userId (eppovaavadhu login aana browser). Ore customer oda pala devices ah serkka.
// const linkMap = async (visitorIds) => {
//   const ids = [...new Set(visitorIds.filter(Boolean))];
//   if (!ids.length) return new Map();
//   const rows = await visitModel.aggregate([
//     { $match: { visitorId: { $in: ids }, userId: { $ne: null } } },
//     { $sort: { at: -1 } },
//     { $group: { _id: "$visitorId", userId: { $first: "$userId" } } },
//   ]);
//   return new Map(rows.map((r) => [r._id, r.userId]));
// };
// // Oru aal key — login aana customer na "u:<userId>", illana browser "v:<visitorId>"
// const personKey = (visitorId, links) => (links.get(visitorId) ? `u:${links.get(visitorId)}` : `v:${visitorId}`);

// // Oru aal mudhal thadavai eppo vandhaanga (all time) — New / Returning ku.
// // Login aana customer na avanga ellaa devices um serthu.
// const firstSeenOf = async (visitorIds, links) => {
//   const ids = [...new Set(visitorIds.filter(Boolean))];
//   const uids = [...new Set(ids.map((v) => links.get(v)).filter(Boolean))];
//   const [byV, byU] = await Promise.all([
//     ids.length ? visitModel.aggregate([{ $match: { visitorId: { $in: ids } } }, { $group: { _id: "$visitorId", at: { $min: "$at" } } }]) : [],
//     uids.length ? visitModel.aggregate([{ $match: { userId: { $in: uids } } }, { $group: { _id: "$userId", at: { $min: "$at" } } }]) : [],
//   ]);
//   const vMin = new Map(byV.map((r) => [r._id, r.at]));
//   const uMin = new Map(byU.map((r) => [String(r._id), r.at]));
//   const out = new Map(); // personKey → first seen
//   ids.forEach((v) => {
//     const key = personKey(v, links);
//     const cands = [vMin.get(v), links.get(v) ? uMin.get(String(links.get(v))) : null, out.get(key)].filter(Boolean);
//     if (cands.length) out.set(key, new Date(Math.min(...cands.map((d) => new Date(d).getTime()))));
//   });
//   return out;
// };

// // ─── LIVE (YouTube "watching now" maadhiri) ───
// // Customer site tab open + paarththutte irundhaa 20 sec ku oru "ping" varum. DB la save aagaadhu, memory la mattum.
// // Tab close / vera tab poonaa ping nirkkum → 45 sec la Live la irundhu poyidum.
// let lastWrite = Date.now(); // kadaisi-aa DB la visit save aana neram (memory)
// const LIVE_MS = 45000;
// const liveMap = new Map(); // visitorId → { at, loggedIn }
// const markLive = (visitorId, loggedIn) => {
//   liveMap.set(visitorId, { at: Date.now(), loggedIn: !!loggedIn });
//   if (liveMap.size > 20000) liveMap.clear();
// };
// const liveNow = (who) => {
//   const cut = Date.now() - LIVE_MS;
//   const out = [];
//   for (const [vid, x] of liveMap) {
//     if (x.at < cut) { liveMap.delete(vid); continue; }
//     if (who === "guest" && x.loggedIn) continue;
//     if (who === "loggedIn" && !x.loggedIn) continue;
//     out.push(vid);
//   }
//   return out;
// };

// // Romba adhigam request (oru IP la nimishathukku 120 mel) — ignore
// const hits = new Map();
// const tooMany = (key) => {
//   const now = Date.now();
//   const h = hits.get(key) || { n: 0, t: now };
//   if (now - h.t > 60000) { h.n = 0; h.t = now; }
//   h.n += 1;
//   hits.set(key, h);
//   if (hits.size > 5000) hits.clear();
//   return h.n > 120;
// };

// // ─── POST /api/touradmin/traffic/track  (public — login venaam) ───
// export const trackVisit = async (req, res) => {
//   try {
//     const ua = String(req.headers["user-agent"] || "");
//     if (!ua || BOT_RX.test(ua)) return res.status(204).end();
//     const ip = clientIp(req);
//     if (tooMany(ip)) return res.status(204).end();

//     const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
//     const visitorId = clip(b.visitorId, 64);
//     if (!visitorId) return res.status(204).end();
//     // Live ping / tab close — DB la podaadhu
//     if (b.type === "bye") { liveMap.delete(visitorId); return res.status(204).end(); }
//     if (b.type === "ping") { markLive(visitorId, b.isLoggedIn); return res.status(204).end(); }
//     markLive(visitorId, b.isLoggedIn);
//     let ownHost = "";
//     try { ownHost = new URL(String(req.headers.origin || "")).hostname.replace(/^www\./, ""); } catch { /* */ }

//     const type = ["pageview", "click", "event"].includes(b.type) ? b.type : "pageview";
//     const name = clip(b.name, 80).trim();
//     if (type !== "pageview" && !name) return res.status(204).end();
//     // props — flat, chinna values mattum (max 10 keys)
//     let props = null;
//     if (b.props && typeof b.props === "object" && !Array.isArray(b.props)) {
//       props = {};
//       Object.keys(b.props).slice(0, 10).forEach((k) => {
//         const v = b.props[k];
//         if (["string", "number", "boolean"].includes(typeof v)) props[clip(k, 30)] = typeof v === "string" ? clip(v, 120) : v;
//       });
//       if (!Object.keys(props).length) props = null;
//     }
//     const utm = b.utm && typeof b.utm === "object"
//       ? { source: clip(b.utm.source, 60), medium: clip(b.utm.medium, 60), campaign: clip(b.utm.campaign, 80) }
//       : null;
//     const userId = userIdFromToken(b.utoken);
//     lastWrite = Date.now(); // pudhu data vandhuchu — admin page refresh aaganum
//     await visitModel.create({
//       visitorId,
//       sessionId: clip(b.sessionId, 64),
//       type,
//       name,
//       props,
//       path: clip(b.path || "/", 300),
//       title: clip(b.title, 200),
//       referrer: clip(b.referrer, 300),
//       source: sourceOf(b.referrer, utm?.source, ownHost),
//       utm: utm && (utm.source || utm.medium || utm.campaign) ? utm : null,
//       ...parseUa(ua),
//       screen: clip(b.screen, 20),
//       lang: clip(b.lang, 20),
//       ip: maskIp(ip),
//       firstVisit: !!b.isNew,
//       isLoggedIn: !!b.isLoggedIn || !!userId,
//       userId,
//       at: new Date(),
//     });
//     return res.status(204).end();
//   } catch {
//     return res.status(204).end(); // tracking fail aanaalum customer site ku edhuvum theriyakoodaadhu
//   }
// };

// // Query → { match, from, to, who } (IST date range + guest / loggedIn / all)
// const rangeOf = (q) => {
//   const today = new Date(Date.now() + 5.5 * 36e5).toISOString().slice(0, 10);
//   const from = /^\d{4}-\d{2}-\d{2}$/.test(q.from || "") ? q.from : today;
//   const to = /^\d{4}-\d{2}-\d{2}$/.test(q.to || "") ? q.to : today;
//   const who = ["guest", "loggedIn", "all"].includes(q.who) ? q.who : "guest";
//   const match = { at: { $gte: new Date(`${from}T00:00:00${IST}`), $lte: new Date(`${to}T23:59:59.999${IST}`) } };
//   if (who === "guest") match.isLoggedIn = { $ne: true };
//   if (who === "loggedIn") match.isLoggedIn = true;
//   return { match, from, to, who };
// };
// // ─── Extra filters: source / device / browser / page / search (name, email, phone, visitor ID) ───
// const escRx = (t) => String(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// const applyFilters = async (match, q = {}) => {
//   const and = [];
//   const one = (v) => clip(v, 120).trim();
//   if (one(q.source)) and.push({ source: one(q.source) });
//   if (one(q.device)) and.push({ device: one(q.device) });
//   if (one(q.browser)) and.push({ browser: one(q.browser) });
//   if (one(q.os)) and.push({ os: one(q.os) });
//   // NOTE: "page" = pagination number, so page filter "path" nu varum
//   if (one(q.path)) {
//     const pg = one(q.path) === "/" ? "/" : one(q.path).replace(/\/+$/, "");
//     and.push({ path: new RegExp(`^${escRx(pg)}(\\?.*)?$`) });
//   }
//   if (one(q.event)) and.push({ type: "event", name: one(q.event) });
//   if (q.isNew === "1") and.push({ firstVisit: true });
//   const term = one(q.q);
//   if (term) {
//     const rx = new RegExp(escRx(term), "i");
//     const users = await userModel.find({ $or: [{ name: rx }, { email: rx }, { phone: rx }] }).select("_id").limit(200).lean();
//     const uids = users.map((u) => String(u._id));
//     // andha customer login panna browsers (guest records um varanum)
//     const vids = uids.length ? await visitModel.distinct("visitorId", { userId: { $in: uids } }) : [];
//     // "Visitor A23801" maadhiri ID kuduthaa
//     const idPart = term.replace(/^visitor\s*/i, "").replace(/[^a-z0-9]/gi, "");
//     const or = [];
//     if (uids.length) or.push({ userId: { $in: uids } });
//     if (vids.length) or.push({ visitorId: { $in: vids } });
//     if (idPart.length >= 4) or.push({ visitorId: new RegExp(`${idPart.split("").map(escRx).join("[^a-z0-9]*")}$`, "i") });
//     and.push(or.length ? { $or: or } : { _id: null }); // edhuvum match aagala na empty
//   }
//   if (and.length) match.$and = [...(match.$and || []), ...and];
//   return match;
// };

// // "Visitor A1B2C3" — visitorId la irundhu chinna per
// const shortId = (id) => String(id || "").replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase() || "—";

// // ─── GET /api/touradmin/traffic/report?from=YYYY-MM-DD&to=YYYY-MM-DD&who=guest|loggedIn|all&page=1 ───
// const reportCore = async (req, res) => {
//   try {
//     const today = new Date(Date.now() + 5.5 * 36e5).toISOString().slice(0, 10);
//     const from = /^\d{4}-\d{2}-\d{2}$/.test(req.query.from || "") ? req.query.from : today;
//     const to = /^\d{4}-\d{2}-\d{2}$/.test(req.query.to || "") ? req.query.to : today;
//     const who = ["guest", "loggedIn", "all"].includes(req.query.who) ? req.query.who : "guest";
//     const page = Math.max(1, parseInt(req.query.page, 10) || 1);
//     const PAGE = 50;

//     const match = { at: { $gte: new Date(`${from}T00:00:00${IST}`), $lte: new Date(`${to}T23:59:59.999${IST}`) } };
//     if (who === "guest") match.isLoggedIn = { $ne: true };
//     if (who === "loggedIn") match.isLoggedIn = true;
//     const baseMatch = { ...match }; // filter dropdown options ku (extra filter illaama)
//     await applyFilters(match, req.query);

//     const PV = { type: { $in: ["pageview", null] } }; // pazhaya records la type illa = pageview
//     const kind = ["pageview", "click", "event"].includes(req.query.kind) ? req.query.kind : "";
//     const dayExpr = { $dateToString: { format: "%Y-%m-%d", date: "$at", timezone: IST } };
//     const top = (field, limit = 10) => [
//       { $group: { _id: `$${field}`, views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
//       { $project: { _id: 0, key: "$_id", views: 1, visitors: 1 } }, // ids — keezha aal (person) aa maathuvom
//       { $sort: { views: -1 } },
//       { $limit: limit },
//     ];

//     const [agg] = await visitModel.aggregate([
//       { $match: match },
//       {
//         $facet: {
//           totals: [
//             { $match: PV },
//             {
//               $group: {
//                 _id: null,
//                 views: { $sum: 1 },
//                 visitors: { $addToSet: "$visitorId" },
//                 sessions: { $addToSet: "$sessionId" },
//                 newVisitors: { $addToSet: { $cond: ["$firstVisit", "$visitorId", null] } },
//               },
//             },
//             { $project: { _id: 0, views: 1, visitors: { $size: "$visitors" }, sessions: { $size: "$sessions" }, newVisitors: { $size: { $filter: { input: "$newVisitors", cond: { $ne: ["$$this", null] } } } } } },
//           ],
//           daily: [
//             { $match: PV },
//             { $group: { _id: dayExpr, views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
//             { $project: { _id: 0, day: "$_id", views: 1, visitors: 1 } },
//             { $sort: { day: 1 } },
//           ],
//           pages: [
//             { $match: PV },
//             { $sort: { at: -1 } },
//             // ?utm_source=… maadhiri query string illaama ore page aa group pannum
//             { $group: { _id: { $arrayElemAt: [{ $split: [{ $ifNull: ["$path", "/"] }, "?"] }, 0] }, views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" }, title: { $first: "$title" } } },
//             { $project: { _id: 0, key: "$_id", title: 1, views: 1, visitors: 1 } },
//             { $sort: { views: -1 } },
//             { $limit: 300 },
//           ],
//           hourly: [
//             { $match: PV },
//             { $group: { _id: { $hour: { date: "$at", timezone: IST } }, views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
//             { $project: { _id: 0, hour: "$_id", views: 1, visitors: 1 } },
//             { $sort: { hour: 1 } },
//           ],
//           sources: [{ $match: PV }, ...top("source", 10)],
//           devices: [{ $match: PV }, ...top("device", 5)],
//           browsers: [{ $match: PV }, ...top("browser", 6)],
//           clicks: [{ $match: { type: "click" } }, ...top("name", 15)],
//           events: [{ $match: { type: "event" } }, ...top("name", 20)],
//           list: [
//             ...(kind ? [{ $match: kind === "pageview" ? PV : { type: kind } }] : []),
//             { $sort: { at: -1 } },
//             { $skip: (page - 1) * PAGE },
//             { $limit: PAGE },
//             { $project: { _id: 1, at: 1, userId: 1, type: 1, name: 1, props: 1, path: 1, title: 1, source: 1, device: 1, browser: 1, os: 1, ip: 1, firstVisit: 1, isLoggedIn: 1, visitorId: 1 } },
//           ],
//         },
//       },
//     ]);

//     // Ippo site la irukkuravanga — kadaisi 5 nimisham
//     const liveIds = liveNow(who); // ippo site la tab open aa irukkuravanga
//     // Login aana customer oda pala devices = oru aal
//     const pvIds = await visitModel.distinct("visitorId", { ...match, ...PV });
//     // ellaa list la um vandha visitor ids — login aana customer oda pala browsers = oru aal
//     const facetIds = new Set();
//     ["daily", "pages", "hourly", "sources", "devices", "browsers", "clicks", "events"].forEach((k) =>
//       (agg?.[k] || []).forEach((r) => (r.visitors || []).forEach((v) => facetIds.add(v))));
//     const links = await linkMap([...pvIds, ...liveIds, ...facetIds]);
//     const toPeople = (rows) => (rows || []).map((r) => ({ ...r, visitors: new Set((r.visitors || []).map((v) => personKey(v, links))).size }));
//     // Top pages: /booking/<id1>, /booking/<id2> → ore "Booking" (query string, id ellaam thookkidum)
//     const normPath = (p) => (String(p || "/").replace(/[?#].*$/, "").replace(/\/[a-f0-9]{24}(?=\/|$)/gi, "").replace(/\/+$/, "") || "/");
//     const pageMap = new Map();
//     (agg?.pages || []).forEach((r) => {
//       const k = normPath(r.key);
//       const cur = pageMap.get(k) || { key: k, title: r.title, views: 0, ids: new Set() };
//       cur.views += r.views;
//       (r.visitors || []).forEach((v) => cur.ids.add(v));
//       pageMap.set(k, cur);
//     });
//     const pagesOut = [...pageMap.values()]
//       .map((r) => ({ key: r.key, title: r.key === "/" ? r.title : "", views: r.views, visitors: new Set([...r.ids].map((v) => personKey(v, links))).size }))
//       .sort((a, b) => b.views - a.views)
//       .slice(0, 15);
//     const people = new Set(pvIds.map((v) => personKey(v, links))).size;
//     const livePeople = new Set(liveIds.map((v) => personKey(v, links))).size;

//     const totals = agg?.totals?.[0] || { views: 0, visitors: 0, sessions: 0, newVisitors: 0 };
//     // Real devices: ore aal oda Desktop · Chrome (normal + incognito) = 1 device; phone la um vandhaa = 2
//     const devRows = await visitModel.aggregate([
//       { $match: { ...match, ...PV } },
//       { $group: { _id: { v: "$visitorId", device: "$device", browser: "$browser" } } },
//     ]);
//     totals.devices = new Set(devRows.map((r) => `${personKey(r._id.v, links)}|${r._id.device}|${r._id.browser}`)).size;
//     totals.visitors = people; // aal (login aana customer devices serthu)
//     // New = indha period la dhaan mudhal thadavai vandhaanga (eppovum, endha device la um); matha ellaarum Returning
//     const firstSeen = await firstSeenOf(pvIds, links);
//     const rangeStart = match.at.$gte;
//     totals.newVisitors = [...new Set(pvIds.map((v) => personKey(v, links)))].filter((k) => firstSeen.get(k) && firstSeen.get(k) >= rangeStart).length;
//     // Login aana customer na per kaattalaam
//     const listUsers = await usersById((agg?.list || []).map((x) => x.userId));
//     (agg?.list || []).forEach((x) => { const u = x.userId && listUsers.get(String(x.userId)); if (u) x.user = u; });
//     // Filter dropdown ku — indha date range la irukkura values
//     const [optSources, optDevices, optBrowsers, optOs, optPages, optEvents] = await Promise.all([
//       visitModel.distinct("source", baseMatch),
//       visitModel.distinct("device", baseMatch),
//       visitModel.distinct("browser", baseMatch),
//       visitModel.distinct("os", baseMatch),
//       visitModel.aggregate([
//         { $match: { ...baseMatch, ...PV } },
//         { $group: { _id: { $arrayElemAt: [{ $split: [{ $ifNull: ["$path", "/"] }, "?"] }, 0] }, n: { $sum: 1 }, title: { $first: "$title" } } },
//         { $sort: { n: -1 } },
//         { $limit: 60 },
//       ]),
//       visitModel.distinct("name", { ...baseMatch, type: "event" }),
//     ]);
//     // ─── New sign-ups (customer accounts) — pazhaya dates um varum. Account create aana neram = _id la irukku ───
//     const oidAt = (d) => mongoose.Types.ObjectId.createFromTime(Math.floor(d.getTime() / 1000));
//     const userRange = { _id: { $gte: oidAt(match.at.$gte), $lte: oidAt(new Date(match.at.$lte.getTime() + 1000)) } };
//     const [signupDaily, signupRecent, signupAll] = await Promise.all([
//       userModel.aggregate([
//         { $match: userRange },
//         { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$_id" }, timezone: IST } }, count: { $sum: 1 } } },
//         { $project: { _id: 0, day: "$_id", count: 1 } },
//         { $sort: { day: 1 } },
//       ]),
//       userModel.find(userRange).sort({ _id: -1 }).limit(8).select("name email phone").lean(),
//       userModel.estimatedDocumentCount(),
//     ]);
//     const signups = {
//       total: signupDaily.reduce((a, r) => a + r.count, 0),
//       allTime: signupAll,
//       daily: signupDaily,
//       recent: signupRecent.map((u) => ({ name: u.name || "", email: u.email || "", phone: u.phone || "", at: u._id.getTimestamp() })),
//     };
//     const clean = (a) => a.filter(Boolean).map(String).sort((x, y) => x.localeCompare(y));
//     const options = {
//       sources: clean(optSources),
//       devices: clean(optDevices),
//       browsers: clean(optBrowsers),
//       os: clean(optOs),
//       pages: optPages.map((p) => ({ path: p._id || "/", title: p.title || "", views: p.n })),
//       events: clean(optEvents),
//     };
//     return res.status(200).json({
//       success: true,
//       options,
//       signups,
//       range: { from, to, who },
//       live: livePeople,
//       totals,
//       daily: toPeople(agg?.daily),
//       pages: pagesOut,
//       sources: toPeople(agg?.sources),
//       devices: toPeople(agg?.devices),
//       browsers: toPeople(agg?.browsers),
//       hourly: toPeople(agg?.hourly),
//       clicks: toPeople(agg?.clicks),
//       events: toPeople(agg?.events),
//       list: agg?.list || [],
//       page,
//       pageSize: PAGE,
//       hasMore: (agg?.list || []).length === PAGE,
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ─── GET /api/touradmin/traffic/visitors?from&to&who&page — ovvoru aal um thani row ───
// // Login aana customer → avanga ellaa devices um ore row. Guest → browser wise.
// const buildVisitors = async (query, { all = false } = {}) => {
//     const { match } = rangeOf(query);
//     await applyFilters(match, query);
//     const page = all ? 1 : Math.max(1, parseInt(query.page, 10) || 1);
//     const PAGE = all ? 5000 : 30;
//     const liveSet = new Set(liveNow("all"));
//     const perBrowser = await visitModel.aggregate([
//       { $match: match },
//       { $sort: { at: 1 } },
//       {
//         $group: {
//           _id: "$visitorId",
//           firstAt: { $first: "$at" },
//           lastAt: { $last: "$at" },
//           views: { $sum: { $cond: [{ $in: ["$type", ["pageview", null]] }, 1, 0] } },
//           clicks: { $sum: { $cond: [{ $eq: ["$type", "click"] }, 1, 0] } },
//           events: { $sum: { $cond: [{ $eq: ["$type", "event"] }, 1, 0] } },
//           sessions: { $addToSet: "$sessionId" },
//           source: { $first: "$source" },
//           sources: { $push: "$source" },
//           device: { $last: "$device" },
//           devAll: { $addToSet: { device: "$device", browser: "$browser", os: "$os" } }, // indha browser ID la vandha ella device um
//           browser: { $last: "$browser" },
//           os: { $last: "$os" },
//           ip: { $last: "$ip" },
//           lastPath: { $last: "$path" },
//           lastTitle: { $last: "$title" },
//           firstVisit: { $max: "$firstVisit" },
//           isLoggedIn: { $max: "$isLoggedIn" },
//           eventNames: { $addToSet: { $cond: [{ $eq: ["$type", "event"] }, "$name", null] } },
//         },
//       },
//     ]);

//     // Login link (indha range la illanaalum, vera naal login pannirundhaa)
//     const links = await linkMap(perBrowser.map((r) => r._id));
//     const people = new Map();
//     for (const r of perBrowser) {
//       const key = personKey(r._id, links);
//       const p = people.get(key);
//       const devs = (r.devAll && r.devAll.length ? r.devAll : [{ device: r.device, browser: r.browser, os: r.os }]).map((d) => ({ visitorId: r._id, ...d }));
//       if (!p) {
//         people.set(key, {
//           key,
//           visitorId: r._id,
//           userId: links.get(r._id) || null,
//           firstAt: r.firstAt,
//           lastAt: r.lastAt,
//           views: r.views,
//           clicks: r.clicks,
//           events: r.events,
//           sessions: new Set((r.sessions || []).filter(Boolean)),
//           source: r.source,
//           srcList: [{ at: r.firstAt, list: r.sources || [] }],
//           device: r.device,
//           browser: r.browser,
//           os: r.os,
//           ip: r.ip,
//           lastPath: r.lastPath,
//           lastTitle: r.lastTitle,
//           firstVisit: !!r.firstVisit,
//           isLoggedIn: !!r.isLoggedIn,
//           eventNames: new Set((r.eventNames || []).filter(Boolean)),
//           devices: [...devs],
//         });
//         continue;
//       }
//       p.views += r.views;
//       p.clicks += r.clicks;
//       p.events += r.events;
//       (r.sessions || []).filter(Boolean).forEach((x) => p.sessions.add(x));
//       (r.eventNames || []).filter(Boolean).forEach((x) => p.eventNames.add(x));
//       p.devices.push(...devs);
//       p.srcList.push({ at: r.firstAt, list: r.sources || [] });
//       p.firstVisit = p.firstVisit || !!r.firstVisit;
//       p.isLoggedIn = p.isLoggedIn || !!r.isLoggedIn;
//       if (r.firstAt < p.firstAt) { p.firstAt = r.firstAt; p.source = r.source; }
//       if (r.lastAt > p.lastAt) {
//         Object.assign(p, { lastAt: r.lastAt, visitorId: r._id, device: r.device, browser: r.browser, os: r.os, ip: r.ip, lastPath: r.lastPath, lastTitle: r.lastTitle });
//       }
//     }

//     const everyone = [...people.values()].sort((x, y) => new Date(y.lastAt) - new Date(x.lastAt));
//     const total = everyone.length;
//     const pageRows = everyone.slice((page - 1) * PAGE, page * PAGE);
//     const users = await usersById(pageRows.map((r) => r.userId));
//     const seen = await firstSeenOf(perBrowser.map((r) => r._id), links);
//     const list = pageRows.map((r) => ({
//       visitorId: r.visitorId, // journey ku (customer na ellaa devices um varum)
//       label: `Visitor ${shortId(r.visitorId)}`,
//       user: (r.userId && users.get(String(r.userId))) || null,
//       linkedLater: !!r.userId && !r.isLoggedIn, // indha filter la guest visits mattum; adhe aal vera samayam login pannirukkaanga
//       firstAt: r.firstAt,
//       lastAt: r.lastAt,
//       live: r.devices.some((d) => liveSet.has(d.visitorId)),
//       views: r.views,
//       clicks: r.clicks,
//       events: r.events,
//       sessions: r.sessions.size,
//       source: r.source,
//       sources: [...new Set(r.srcList.sort((a, b) => new Date(a.at) - new Date(b.at)).flatMap((x) => x.list).filter(Boolean))],
//       device: r.device,
//       browser: r.browser,
//       os: r.os,
//       ip: r.ip,
//       lastPath: r.lastPath,
//       lastTitle: r.lastTitle,
//       firstVisit: !!(seen.get(r.key) && seen.get(r.key) >= match.at.$gte), // New = indha period la mudhal thadavai
//       firstSeenAt: seen.get(r.key) || null,
//       isLoggedIn: r.isLoggedIn,
//       eventNames: [...r.eventNames],
//       devices: r.devices.map((d) => ({ ...d, label: `${d.device} · ${d.browser}` })),
//       durationSec: Math.max(0, Math.round((new Date(r.lastAt) - new Date(r.firstAt)) / 1000)),
//     }));
//     return { total, page, pageSize: PAGE, hasMore: page * PAGE < total, list };
// };

// const visitorsCore = async (req, res) => {
//   try {
//     const out = await buildVisitors(req.query);
//     return res.status(200).json({ success: true, ...out });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ─── Speed: admin page 5 sec ku oru thadava kekkum — aana heavy query pudhu data vandhaa mattum ───
// //  • ?since=<lastWrite> anuppi, adhukku apram pudhu visit illana → { unchanged: true, live } (DB query illa, udane)
// //  • Pudhu data irundhaalum adhe filter ku 10 sec ku oru thadava mattum full query (ella admins um share)
// const CACHE_MS = 10000;
// const cache = new Map(); // key → { at, lastWrite, body }
// const capture = (core, query) => new Promise((resolve, reject) => {
//   core({ query }, { status: (code) => ({ json: (body) => resolve({ code, body }) }) }).catch(reject);
// });
// const cachedRun = async (core, query) => {
//   const { since, ...q } = query || {};
//   const key = `${core === reportCore ? "r" : "v"}:${JSON.stringify(Object.keys(q).sort().map((k) => [k, q[k]]))}`;
//   const hit = cache.get(key);
//   if (hit && (hit.lastWrite === lastWrite || Date.now() - hit.at < CACHE_MS)) return { code: 200, body: hit.body, cachedLastWrite: hit.lastWrite };
//   const wrote = lastWrite;
//   const out = await capture(core, q);
//   if (out.code === 200 && out.body?.success) {
//     cache.set(key, { at: Date.now(), lastWrite: wrote, body: out.body });
//     if (cache.size > 300) cache.delete(cache.keys().next().value);
//   }
//   return { ...out, cachedLastWrite: wrote };
// };
// const freshLive = async (who) => {
//   const ids = liveNow(who);
//   const links = await linkMap(ids);
//   return { live: new Set(ids.map((v) => personKey(v, links))).size, liveIds: liveNow("all") };
// };

// export const trafficReport = async (req, res) => {
//   try {
//     const who = ["guest", "loggedIn", "all"].includes(req.query.who) ? req.query.who : "guest";
//     const { live } = await freshLive(who);
//     if (req.query.since && Number(req.query.since) === lastWrite) {
//       return res.status(200).json({ success: true, unchanged: true, live, lastWrite });
//     }
//     const out = await cachedRun(reportCore, req.query);
//     if (out.code !== 200) return res.status(out.code).json(out.body);
//     return res.status(200).json({ ...out.body, live, lastWrite: out.cachedLastWrite });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// export const trafficVisitors = async (req, res) => {
//   try {
//     const { liveIds } = await freshLive("all");
//     const liveSet = new Set(liveIds);
//     if (req.query.since && Number(req.query.since) === lastWrite) {
//       return res.status(200).json({ success: true, unchanged: true, liveIds, lastWrite });
//     }
//     const out = await cachedRun(visitorsCore, req.query);
//     if (out.code !== 200) return res.status(out.code).json(out.body);
//     const list = (out.body.list || []).map((v) => ({ ...v, live: (v.devices || []).some((d) => liveSet.has(d.visitorId)) }));
//     return res.status(200).json({ ...out.body, list, lastWrite: out.cachedLastWrite });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ─── GET /api/touradmin/traffic/export?what=visitors|activity&…filters → CSV (Excel la open aagum) ───
// const csvCell = (v) => {
//   const t = v === null || v === undefined ? "" : String(v);
//   const safe = /^[=+\-@]/.test(t) ? `'${t}` : t; // Excel formula injection thadukka
//   return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
// };
// const toCsv = (head, rows) => "\uFEFF" + [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
// const istText = (d) => (d ? new Date(new Date(d).getTime() + 5.5 * 36e5).toISOString().replace("T", " ").slice(0, 19) : "");

// export const trafficExport = async (req, res) => {
//   try {
//     const what = req.query.what === "activity" ? "activity" : "visitors";
//     const { from, to } = rangeOf(req.query);
//     let csv;
//     if (what === "visitors") {
//       const { list } = await buildVisitors(req.query, { all: true });
//       csv = toCsv(
//         ["Visitor", "Name", "Email", "Phone", "Logged in", "New / Returning", "Sources", "Devices", "Pages", "Clicks", "Stage events", "Visits", "Time spent (min)", "First seen (IST)", "Last seen (IST)", "Last page", "IP (partly hidden)"],
//         list.map((v) => [
//           v.label, v.user?.name || "", v.user?.email || "", v.user?.phone || "",
//           v.user ? "Yes" : "No", v.firstVisit ? "New" : "Returning",
//           (v.sources?.length ? v.sources : [v.source]).join(" | "),
//           v.devices.map((d) => d.label).join(" | "),
//           v.views, v.clicks, (v.eventNames || []).join(" | "), v.sessions,
//           Math.round(v.durationSec / 60), istText(v.firstAt), istText(v.lastAt), v.lastPath, v.ip,
//         ])
//       );
//     } else {
//       const { match } = rangeOf(req.query);
//       await applyFilters(match, req.query);
//       const kind = req.query.kind;
//       if (kind === "pageview") match.type = { $in: ["pageview", null] };
//       else if (kind === "click" || kind === "event") match.type = kind;
//       const rows = await visitModel.find(match).sort({ at: -1 }).limit(20000).lean();
//       const users = await usersById(rows.map((r) => r.userId));
//       csv = toCsv(
//         ["Time (IST)", "Type", "What", "Page", "Visitor", "Name", "Email", "Phone", "Source", "Device", "Browser", "OS", "IP (partly hidden)"],
//         rows.map((r) => {
//           const u = r.userId && users.get(String(r.userId));
//           const type = r.type || "pageview";
//           return [istText(r.at), type, type === "pageview" ? r.title || r.path : r.name, r.path, `Visitor ${shortId(r.visitorId)}`, u?.name || "", u?.email || "", u?.phone || "", r.source, r.device, r.browser, r.os, r.ip];
//         })
//       );
//     }
//     res.setHeader("Content-Type", "text/csv; charset=utf-8");
//     res.setHeader("Content-Disposition", `attachment; filename="website-${what}-${from}-to-${to}.csv"`);
//     return res.status(200).send(csv);
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ─── GET /api/touradmin/traffic/visitor/:visitorId — andha aal enna enna panninaanga (journey) ───
// export const trafficVisitorJourney = async (req, res) => {
//   try {
//     const visitorId = clip(req.params.visitorId, 64);
//     if (!visitorId) return res.status(400).json({ success: false, message: "Visitor not found" });
//     // Login aana customer na avanga ellaa devices (browsers) um serthu
//     const uid0 = (await linkMap([visitorId])).get(visitorId) || null;
//     const allIds = uid0 ? await visitModel.distinct("visitorId", { userId: uid0 }) : [visitorId];
//     if (!allIds.includes(visitorId)) allIds.push(visitorId);
//     const items = await visitModel
//       .find({ visitorId: { $in: allIds } })
//       .sort({ at: 1 })
//       .limit(1000)
//       .select("at type name props path title source referrer device browser os screen ip sessionId isLoggedIn firstVisit userId visitorId")
//       .lean();
//     if (!items.length) return res.status(404).json({ success: false, message: "Visitor not found" });
//     const first = items[0];
//     const last = items[items.length - 1];
//     const uid = [...items].reverse().find((i) => i.userId)?.userId || null;
//     const jUser = uid ? (await usersById([uid])).get(String(uid)) || null : null;
//     return res.status(200).json({
//       success: true,
//       visitor: {
//         visitorId,
//         label: `Visitor ${shortId(visitorId)}`,
//         user: jUser,
//         firstAt: first.at,
//         lastAt: last.at,
//         source: first.source,
//         referrer: first.referrer || "",
//         device: last.device,
//         browser: last.browser,
//         os: last.os,
//         screen: last.screen,
//         ip: last.ip,
//         isLoggedIn: items.some((i) => i.isLoggedIn),
//         sessions: new Set(items.map((i) => i.sessionId).filter(Boolean)).size,
//         devices: [...new Map(items.map((i) => [i.visitorId, `${i.device} · ${i.browser} · ${i.os}`])).values()],
//         views: items.filter((i) => !i.type || i.type === "pageview").length,
//         clicks: items.filter((i) => i.type === "click").length,
//         events: items.filter((i) => i.type === "event").length,
//       },
//       items: items.map(({ _id, ...rest }) => rest), // eslint-disable-line no-unused-vars
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// controllers/trafficController.js
// Customer website traffic — public "track" (login venaam) + Admin report.
// Routes: routes/tourAdminRoute.js (/api/touradmin/traffic/track, /api/touradmin/traffic/report)
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import visitModel from "../models/visitModel.js";
import userModel from "../models/userModel.js"; // customer (per / email / phone)

const IST = "+05:30";
const BOT_RX = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp\/|preview|headless|lighthouse|pingdom|uptime|curl|wget|python|axios|node-fetch/i;

// ─── helpers ───
const clip = (v, n = 300) => String(v ?? "").slice(0, n);
const maskIp = (ip) => {
  const s = String(ip || "").replace(/^::ffff:/, "").trim();
  if (/^\d+\.\d+\.\d+\.\d+$/.test(s)) return s.split(".").slice(0, 2).join(".") + ".x.x";
  if (s.includes(":")) return s.split(":").slice(0, 3).join(":") + ":…";
  return "";
};
const clientIp = (req) => String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "";
const parseUa = (ua = "") => {
  const device = /ipad|tablet|(android(?!.*mobile))/i.test(ua) ? "Tablet" : /mobi|iphone|android/i.test(ua) ? "Mobile" : "Desktop";
  const browser = /edg\//i.test(ua) ? "Edge" : /opr\/|opera/i.test(ua) ? "Opera" : /samsungbrowser/i.test(ua) ? "Samsung" : /chrome|crios/i.test(ua) ? "Chrome" : /firefox|fxios/i.test(ua) ? "Firefox" : /safari/i.test(ua) ? "Safari" : "Other";
  const os = /windows/i.test(ua) ? "Windows" : /iphone|ipad|ios/i.test(ua) ? "iOS" : /android/i.test(ua) ? "Android" : /mac os/i.test(ua) ? "macOS" : /linux/i.test(ua) ? "Linux" : "Other";
  return { device, browser, os };
};
const SOURCE_RULES = [
  [/google\./i, "Google"], [/bing\./i, "Bing"], [/yahoo\./i, "Yahoo"], [/duckduckgo/i, "DuckDuckGo"],
  [/instagram|l\.instagram/i, "Instagram"], [/facebook|fb\.com|m\.facebook|l\.facebook/i, "Facebook"],
  [/whatsapp|wa\.me|l\.wl\.co/i, "WhatsApp"], [/youtube|youtu\.be/i, "YouTube"],
  [/t\.co|twitter|x\.com/i, "X / Twitter"], [/linkedin/i, "LinkedIn"],
];
// App ulla irukkura browser (Facebook / Instagram app la link click) — referrer anuppaadhu, aana user-agent la app per irukkum
const IN_APP = [
  [/FBAN|FBAV|FB_IAB|FBIOS|\[FB/i, "Facebook"], [/Instagram/i, "Instagram"], [/LinkedInApp/i, "LinkedIn"],
  [/Snapchat/i, "Snapchat"], [/Twitter|TwitterAndroid/i, "X / Twitter"], [/Pinterest/i, "Pinterest"], [/\bLine\//i, "LINE"],
];
const sourceOf = (referrer, utmSource, ownHost, ua = "") => {
  if (utmSource) return clip(utmSource, 40);
  const app = IN_APP.find(([rx]) => rx.test(ua));
  if (!referrer) return app ? app[1] : "Direct";
  let host = "";
  try { host = new URL(referrer).hostname.replace(/^www\./, ""); } catch { return "Direct"; }
  if (!host || (ownHost && host.endsWith(ownHost))) return app ? app[1] : "Direct";
  const hit = SOURCE_RULES.find(([rx]) => rx.test(host));
  return hit ? hit[1] : host;
};

// Customer token → user id (login aana customer). Token save aagaadhu — id mattum.
const userIdFromToken = (tok) => {
  if (!tok || typeof tok !== "string" || tok.length > 2000) return null;
  try {
    const d = jwt.verify(tok, process.env.JWT_SECRET); // userController: jwt.sign({ id: user._id }, JWT_SECRET)
    const id = d && typeof d === "object" ? d.id || d._id || d.userId : null;
    return id && mongoose.isValidObjectId(String(id)) ? String(id) : null;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.warn("traffic: customer token not valid —", err.message);
    return null;
  }
};
const userModelRef = () => userModel;
const usersById = async (ids) => {
  const M = userModelRef();
  const list = [...new Set(ids.filter((x) => x && mongoose.isValidObjectId(String(x))).map(String))];
  if (!M || !list.length) return new Map();
  const docs = await M.find({ _id: { $in: list } }).select("name email phone").lean();
  return new Map(docs.map((u) => [String(u._id), { name: u.name || "", email: u.email || "", phone: u.phone || "" }]));
};

// visitorId → userId (eppovaavadhu login aana browser). Ore customer oda pala devices ah serkka.
const linkMap = async (visitorIds) => {
  const ids = [...new Set(visitorIds.filter(Boolean))];
  if (!ids.length) return new Map();
  const rows = await visitModel.aggregate([
    { $match: { visitorId: { $in: ids }, userId: { $ne: null } } },
    { $sort: { at: -1 } },
    { $group: { _id: "$visitorId", userId: { $first: "$userId" } } },
  ]);
  return new Map(rows.map((r) => [r._id, r.userId]));
};
// Oru aal key — login aana customer na "u:<userId>", illana browser "v:<visitorId>"
const personKey = (visitorId, links) => (links.get(visitorId) ? `u:${links.get(visitorId)}` : `v:${visitorId}`);

// Oru aal mudhal thadavai eppo vandhaanga (all time) — New / Returning ku.
// Login aana customer na avanga ellaa devices um serthu.
const firstSeenOf = async (visitorIds, links) => {
  const ids = [...new Set(visitorIds.filter(Boolean))];
  const uids = [...new Set(ids.map((v) => links.get(v)).filter(Boolean))];
  const [byV, byU] = await Promise.all([
    ids.length ? visitModel.aggregate([{ $match: { visitorId: { $in: ids } } }, { $group: { _id: "$visitorId", at: { $min: "$at" } } }]) : [],
    uids.length ? visitModel.aggregate([{ $match: { userId: { $in: uids } } }, { $group: { _id: "$userId", at: { $min: "$at" } } }]) : [],
  ]);
  const vMin = new Map(byV.map((r) => [r._id, r.at]));
  const uMin = new Map(byU.map((r) => [String(r._id), r.at]));
  const out = new Map(); // personKey → first seen
  ids.forEach((v) => {
    const key = personKey(v, links);
    const cands = [vMin.get(v), links.get(v) ? uMin.get(String(links.get(v))) : null, out.get(key)].filter(Boolean);
    if (cands.length) out.set(key, new Date(Math.min(...cands.map((d) => new Date(d).getTime()))));
  });
  return out;
};

// ─── LIVE (YouTube "watching now" maadhiri) ───
// Customer site tab open + paarththutte irundhaa 20 sec ku oru "ping" varum. DB la save aagaadhu, memory la mattum.
// Tab close / vera tab poonaa ping nirkkum → 45 sec la Live la irundhu poyidum.
let lastWrite = Date.now(); // kadaisi-aa DB la visit save aana neram (memory)
const LIVE_MS = 45000;
const liveMap = new Map(); // visitorId → { at, loggedIn }
const markLive = (visitorId, loggedIn) => {
  liveMap.set(visitorId, { at: Date.now(), loggedIn: !!loggedIn });
  if (liveMap.size > 20000) liveMap.clear();
};
const liveNow = (who) => {
  const cut = Date.now() - LIVE_MS;
  const out = [];
  for (const [vid, x] of liveMap) {
    if (x.at < cut) { liveMap.delete(vid); continue; }
    if (who === "guest" && x.loggedIn) continue;
    if (who === "loggedIn" && !x.loggedIn) continue;
    out.push(vid);
  }
  return out;
};

// Romba adhigam request (oru IP la nimishathukku 120 mel) — ignore
const hits = new Map();
const tooMany = (key) => {
  const now = Date.now();
  const h = hits.get(key) || { n: 0, t: now };
  if (now - h.t > 60000) { h.n = 0; h.t = now; }
  h.n += 1;
  hits.set(key, h);
  if (hits.size > 5000) hits.clear();
  return h.n > 120;
};

// ─── POST /api/touradmin/traffic/track  (public — login venaam) ───
export const trackVisit = async (req, res) => {
  try {
    const ua = String(req.headers["user-agent"] || "");
    if (!ua || BOT_RX.test(ua)) return res.status(204).end();
    const ip = clientIp(req);
    if (tooMany(ip)) return res.status(204).end();

    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const visitorId = clip(b.visitorId, 64);
    if (!visitorId) return res.status(204).end();
    // Live ping / tab close — DB la podaadhu
    if (b.type === "bye") { liveMap.delete(visitorId); return res.status(204).end(); }
    if (b.type === "ping") { markLive(visitorId, b.isLoggedIn); return res.status(204).end(); }
    markLive(visitorId, b.isLoggedIn);
    let ownHost = "";
    try { ownHost = new URL(String(req.headers.origin || "")).hostname.replace(/^www\./, ""); } catch { /* */ }

    const type = ["pageview", "click", "event"].includes(b.type) ? b.type : "pageview";
    const name = clip(b.name, 80).trim();
    if (type !== "pageview" && !name) return res.status(204).end();
    // props — flat, chinna values mattum (max 10 keys)
    let props = null;
    if (b.props && typeof b.props === "object" && !Array.isArray(b.props)) {
      props = {};
      Object.keys(b.props).slice(0, 10).forEach((k) => {
        const v = b.props[k];
        if (["string", "number", "boolean"].includes(typeof v)) props[clip(k, 30)] = typeof v === "string" ? clip(v, 120) : v;
      });
      if (!Object.keys(props).length) props = null;
    }
    const utm = b.utm && typeof b.utm === "object"
      ? { source: clip(b.utm.source, 60), medium: clip(b.utm.medium, 60), campaign: clip(b.utm.campaign, 80) }
      : null;
    const userId = userIdFromToken(b.utoken);
    lastWrite = Date.now(); // pudhu data vandhuchu — admin page refresh aaganum
    await visitModel.create({
      visitorId,
      sessionId: clip(b.sessionId, 64),
      type,
      name,
      props,
      path: clip(b.path || "/", 300),
      title: clip(b.title, 200),
      referrer: clip(b.referrer, 300),
      source: sourceOf(b.referrer, utm?.source, ownHost, ua),
      utm: utm && (utm.source || utm.medium || utm.campaign) ? utm : null,
      ...parseUa(ua),
      screen: clip(b.screen, 20),
      lang: clip(b.lang, 20),
      ip: maskIp(ip),
      firstVisit: !!b.isNew,
      isLoggedIn: !!b.isLoggedIn || !!userId,
      userId,
      at: new Date(),
    });
    return res.status(204).end();
  } catch {
    return res.status(204).end(); // tracking fail aanaalum customer site ku edhuvum theriyakoodaadhu
  }
};

// Query → { match, from, to, who } (IST date range + guest / loggedIn / all)
const rangeOf = (q) => {
  const today = new Date(Date.now() + 5.5 * 36e5).toISOString().slice(0, 10);
  const from = /^\d{4}-\d{2}-\d{2}$/.test(q.from || "") ? q.from : today;
  const to = /^\d{4}-\d{2}-\d{2}$/.test(q.to || "") ? q.to : today;
  const who = ["guest", "loggedIn", "all"].includes(q.who) ? q.who : "guest";
  const match = { at: { $gte: new Date(`${from}T00:00:00${IST}`), $lte: new Date(`${to}T23:59:59.999${IST}`) } };
  if (who === "guest") match.isLoggedIn = { $ne: true };
  if (who === "loggedIn") match.isLoggedIn = true;
  return { match, from, to, who };
};
// ─── Extra filters: source / device / browser / page / search (name, email, phone, visitor ID) ───
const escRx = (t) => String(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const applyFilters = async (match, q = {}) => {
  const and = [];
  const one = (v) => clip(v, 120).trim();
  if (one(q.source)) and.push({ source: one(q.source) });
  if (one(q.device)) and.push({ device: one(q.device) });
  if (one(q.browser)) and.push({ browser: one(q.browser) });
  if (one(q.os)) and.push({ os: one(q.os) });
  // NOTE: "page" = pagination number, so page filter "path" nu varum
  if (one(q.path)) {
    const pg = one(q.path) === "/" ? "/" : one(q.path).replace(/\/+$/, "");
    and.push({ path: new RegExp(`^${escRx(pg)}(\\?.*)?$`) });
  }
  if (one(q.event)) and.push({ type: "event", name: one(q.event) });
  if (q.isNew === "1") and.push({ firstVisit: true });
  const term = one(q.q);
  if (term) {
    const rx = new RegExp(escRx(term), "i");
    const users = await userModel.find({ $or: [{ name: rx }, { email: rx }, { phone: rx }] }).select("_id").limit(200).lean();
    const uids = users.map((u) => String(u._id));
    // andha customer login panna browsers (guest records um varanum)
    const vids = uids.length ? await visitModel.distinct("visitorId", { userId: { $in: uids } }) : [];
    // "Visitor A23801" maadhiri ID kuduthaa
    const idPart = term.replace(/^visitor\s*/i, "").replace(/[^a-z0-9]/gi, "");
    const or = [];
    if (uids.length) or.push({ userId: { $in: uids } });
    if (vids.length) or.push({ visitorId: { $in: vids } });
    if (idPart.length >= 4) or.push({ visitorId: new RegExp(`${idPart.split("").map(escRx).join("[^a-z0-9]*")}$`, "i") });
    and.push(or.length ? { $or: or } : { _id: null }); // edhuvum match aagala na empty
  }
  if (and.length) match.$and = [...(match.$and || []), ...and];
  return match;
};

// "Visitor A1B2C3" — visitorId la irundhu chinna per
const shortId = (id) => String(id || "").replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase() || "—";

// ─── GET /api/touradmin/traffic/report?from=YYYY-MM-DD&to=YYYY-MM-DD&who=guest|loggedIn|all&page=1 ───
const reportCore = async (req, res) => {
  try {
    const today = new Date(Date.now() + 5.5 * 36e5).toISOString().slice(0, 10);
    const from = /^\d{4}-\d{2}-\d{2}$/.test(req.query.from || "") ? req.query.from : today;
    const to = /^\d{4}-\d{2}-\d{2}$/.test(req.query.to || "") ? req.query.to : today;
    const who = ["guest", "loggedIn", "all"].includes(req.query.who) ? req.query.who : "guest";
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const PAGE = 50;

    const match = { at: { $gte: new Date(`${from}T00:00:00${IST}`), $lte: new Date(`${to}T23:59:59.999${IST}`) } };
    if (who === "guest") match.isLoggedIn = { $ne: true };
    if (who === "loggedIn") match.isLoggedIn = true;
    const baseMatch = { ...match }; // filter dropdown options ku (extra filter illaama)
    await applyFilters(match, req.query);

    const PV = { type: { $in: ["pageview", null] } }; // pazhaya records la type illa = pageview
    const kind = ["pageview", "click", "event"].includes(req.query.kind) ? req.query.kind : "";
    const dayExpr = { $dateToString: { format: "%Y-%m-%d", date: "$at", timezone: IST } };
    const top = (field, limit = 10) => [
      { $group: { _id: `$${field}`, views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
      { $project: { _id: 0, key: "$_id", views: 1, visitors: 1 } }, // ids — keezha aal (person) aa maathuvom
      { $sort: { views: -1 } },
      { $limit: limit },
    ];

    const [agg] = await visitModel.aggregate([
      { $match: match },
      {
        $facet: {
          totals: [
            { $match: PV },
            {
              $group: {
                _id: null,
                views: { $sum: 1 },
                visitors: { $addToSet: "$visitorId" },
                sessions: { $addToSet: "$sessionId" },
                newVisitors: { $addToSet: { $cond: ["$firstVisit", "$visitorId", null] } },
              },
            },
            { $project: { _id: 0, views: 1, visitors: { $size: "$visitors" }, sessions: { $size: "$sessions" }, newVisitors: { $size: { $filter: { input: "$newVisitors", cond: { $ne: ["$$this", null] } } } } } },
          ],
          daily: [
            { $match: PV },
            { $group: { _id: dayExpr, views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
            { $project: { _id: 0, day: "$_id", views: 1, visitors: 1 } },
            { $sort: { day: 1 } },
          ],
          pages: [
            { $match: PV },
            { $sort: { at: -1 } },
            // ?utm_source=… maadhiri query string illaama ore page aa group pannum
            { $group: { _id: { $arrayElemAt: [{ $split: [{ $ifNull: ["$path", "/"] }, "?"] }, 0] }, views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" }, title: { $first: "$title" } } },
            { $project: { _id: 0, key: "$_id", title: 1, views: 1, visitors: 1 } },
            { $sort: { views: -1 } },
            { $limit: 300 },
          ],
          hourly: [
            { $match: PV },
            { $group: { _id: { $hour: { date: "$at", timezone: IST } }, views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
            { $project: { _id: 0, hour: "$_id", views: 1, visitors: 1 } },
            { $sort: { hour: 1 } },
          ],
          sources: [{ $match: PV }, ...top("source", 10)],
          devices: [{ $match: PV }, ...top("device", 5)],
          browsers: [{ $match: PV }, ...top("browser", 6)],
          clicks: [{ $match: { type: "click" } }, ...top("name", 15)],
          events: [{ $match: { type: "event" } }, ...top("name", 20)],
          list: [
            ...(kind ? [{ $match: kind === "pageview" ? PV : { type: kind } }] : []),
            { $sort: { at: -1 } },
            { $skip: (page - 1) * PAGE },
            { $limit: PAGE },
            { $project: { _id: 1, at: 1, userId: 1, type: 1, name: 1, props: 1, path: 1, title: 1, source: 1, device: 1, browser: 1, os: 1, ip: 1, firstVisit: 1, isLoggedIn: 1, visitorId: 1 } },
          ],
        },
      },
    ]);

    // Ippo site la irukkuravanga — kadaisi 5 nimisham
    const liveIds = liveNow(who); // ippo site la tab open aa irukkuravanga
    // Login aana customer oda pala devices = oru aal
    const pvIds = await visitModel.distinct("visitorId", { ...match, ...PV });
    // ellaa list la um vandha visitor ids — login aana customer oda pala browsers = oru aal
    const facetIds = new Set();
    ["daily", "pages", "hourly", "sources", "devices", "browsers", "clicks", "events"].forEach((k) =>
      (agg?.[k] || []).forEach((r) => (r.visitors || []).forEach((v) => facetIds.add(v))));
    const links = await linkMap([...pvIds, ...liveIds, ...facetIds]);
    const toPeople = (rows) => (rows || []).map((r) => ({ ...r, visitors: new Set((r.visitors || []).map((v) => personKey(v, links))).size }));
    // Top pages: /booking/<id1>, /booking/<id2> → ore "Booking" (query string, id ellaam thookkidum)
    const normPath = (p) => (String(p || "/").replace(/[?#].*$/, "").replace(/\/[a-f0-9]{24}(?=\/|$)/gi, "").replace(/\/+$/, "") || "/");
    const pageMap = new Map();
    (agg?.pages || []).forEach((r) => {
      const k = normPath(r.key);
      const cur = pageMap.get(k) || { key: k, title: r.title, views: 0, ids: new Set() };
      cur.views += r.views;
      (r.visitors || []).forEach((v) => cur.ids.add(v));
      pageMap.set(k, cur);
    });
    const pagesOut = [...pageMap.values()]
      .map((r) => ({ key: r.key, title: r.key === "/" ? r.title : "", views: r.views, visitors: new Set([...r.ids].map((v) => personKey(v, links))).size }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 15);
    const people = new Set(pvIds.map((v) => personKey(v, links))).size;
    const livePeople = new Set(liveIds.map((v) => personKey(v, links))).size;

    const totals = agg?.totals?.[0] || { views: 0, visitors: 0, sessions: 0, newVisitors: 0 };
    // Real devices: ore aal oda Desktop · Chrome (normal + incognito) = 1 device; phone la um vandhaa = 2
    const devRows = await visitModel.aggregate([
      { $match: { ...match, ...PV } },
      { $group: { _id: { v: "$visitorId", device: "$device", browser: "$browser" } } },
    ]);
    totals.devices = new Set(devRows.map((r) => `${personKey(r._id.v, links)}|${r._id.device}|${r._id.browser}`)).size;
    totals.visitors = people; // aal (login aana customer devices serthu)
    // New = indha period la dhaan mudhal thadavai vandhaanga (eppovum, endha device la um); matha ellaarum Returning
    const firstSeen = await firstSeenOf(pvIds, links);
    const rangeStart = match.at.$gte;
    totals.newVisitors = [...new Set(pvIds.map((v) => personKey(v, links)))].filter((k) => firstSeen.get(k) && firstSeen.get(k) >= rangeStart).length;
    // Login aana customer na per kaattalaam
    const listUsers = await usersById((agg?.list || []).map((x) => x.userId));
    (agg?.list || []).forEach((x) => { const u = x.userId && listUsers.get(String(x.userId)); if (u) x.user = u; });
    // Filter dropdown ku — indha date range la irukkura values
    const [optSources, optDevices, optBrowsers, optOs, optPages, optEvents] = await Promise.all([
      visitModel.distinct("source", baseMatch),
      visitModel.distinct("device", baseMatch),
      visitModel.distinct("browser", baseMatch),
      visitModel.distinct("os", baseMatch),
      visitModel.aggregate([
        { $match: { ...baseMatch, ...PV } },
        { $group: { _id: { $arrayElemAt: [{ $split: [{ $ifNull: ["$path", "/"] }, "?"] }, 0] }, n: { $sum: 1 }, title: { $first: "$title" } } },
        { $sort: { n: -1 } },
        { $limit: 60 },
      ]),
      visitModel.distinct("name", { ...baseMatch, type: "event" }),
    ]);
    // ─── New sign-ups (customer accounts) — pazhaya dates um varum. Account create aana neram = _id la irukku ───
    const oidAt = (d) => mongoose.Types.ObjectId.createFromTime(Math.floor(d.getTime() / 1000));
    const userRange = { _id: { $gte: oidAt(match.at.$gte), $lte: oidAt(new Date(match.at.$lte.getTime() + 1000)) } };
    const [signupDaily, signupRecent, signupAll] = await Promise.all([
      userModel.aggregate([
        { $match: userRange },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$_id" }, timezone: IST } }, count: { $sum: 1 } } },
        { $project: { _id: 0, day: "$_id", count: 1 } },
        { $sort: { day: 1 } },
      ]),
      userModel.find(userRange).sort({ _id: -1 }).limit(8).select("name email phone").lean(),
      userModel.estimatedDocumentCount(),
    ]);
    const signups = {
      total: signupDaily.reduce((a, r) => a + r.count, 0),
      allTime: signupAll,
      daily: signupDaily,
      recent: signupRecent.map((u) => ({ name: u.name || "", email: u.email || "", phone: u.phone || "", at: u._id.getTimestamp() })),
    };
    const clean = (a) => a.filter(Boolean).map(String).sort((x, y) => x.localeCompare(y));
    const options = {
      sources: clean(optSources),
      devices: clean(optDevices),
      browsers: clean(optBrowsers),
      os: clean(optOs),
      pages: optPages.map((p) => ({ path: p._id || "/", title: p.title || "", views: p.n })),
      events: clean(optEvents),
    };
    return res.status(200).json({
      success: true,
      options,
      signups,
      range: { from, to, who },
      live: livePeople,
      totals,
      daily: toPeople(agg?.daily),
      pages: pagesOut,
      sources: toPeople(agg?.sources),
      devices: toPeople(agg?.devices),
      browsers: toPeople(agg?.browsers),
      hourly: toPeople(agg?.hourly),
      clicks: toPeople(agg?.clicks),
      events: toPeople(agg?.events),
      list: agg?.list || [],
      page,
      pageSize: PAGE,
      hasMore: (agg?.list || []).length === PAGE,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/touradmin/traffic/visitors?from&to&who&page — ovvoru aal um thani row ───
// Login aana customer → avanga ellaa devices um ore row. Guest → browser wise.
const buildVisitors = async (query, { all = false } = {}) => {
    const { match } = rangeOf(query);
    await applyFilters(match, query);
    const page = all ? 1 : Math.max(1, parseInt(query.page, 10) || 1);
    const PAGE = all ? 5000 : 30;
    const liveSet = new Set(liveNow("all"));
    const perBrowser = await visitModel.aggregate([
      { $match: match },
      { $sort: { at: 1 } },
      {
        $group: {
          _id: "$visitorId",
          firstAt: { $first: "$at" },
          lastAt: { $last: "$at" },
          views: { $sum: { $cond: [{ $in: ["$type", ["pageview", null]] }, 1, 0] } },
          clicks: { $sum: { $cond: [{ $eq: ["$type", "click"] }, 1, 0] } },
          events: { $sum: { $cond: [{ $eq: ["$type", "event"] }, 1, 0] } },
          sessions: { $addToSet: "$sessionId" },
          source: { $first: "$source" },
          sources: { $push: "$source" },
          device: { $last: "$device" },
          devAll: { $addToSet: { device: "$device", browser: "$browser", os: "$os" } }, // indha browser ID la vandha ella device um
          browser: { $last: "$browser" },
          os: { $last: "$os" },
          ip: { $last: "$ip" },
          lastPath: { $last: "$path" },
          lastTitle: { $last: "$title" },
          firstVisit: { $max: "$firstVisit" },
          isLoggedIn: { $max: "$isLoggedIn" },
          eventNames: { $addToSet: { $cond: [{ $eq: ["$type", "event"] }, "$name", null] } },
        },
      },
    ]);

    // Login link (indha range la illanaalum, vera naal login pannirundhaa)
    const links = await linkMap(perBrowser.map((r) => r._id));
    const people = new Map();
    for (const r of perBrowser) {
      const key = personKey(r._id, links);
      const p = people.get(key);
      const devs = (r.devAll && r.devAll.length ? r.devAll : [{ device: r.device, browser: r.browser, os: r.os }]).map((d) => ({ visitorId: r._id, ...d }));
      if (!p) {
        people.set(key, {
          key,
          visitorId: r._id,
          userId: links.get(r._id) || null,
          firstAt: r.firstAt,
          lastAt: r.lastAt,
          views: r.views,
          clicks: r.clicks,
          events: r.events,
          sessions: new Set((r.sessions || []).filter(Boolean)),
          source: r.source,
          srcList: [{ at: r.firstAt, list: r.sources || [] }],
          device: r.device,
          browser: r.browser,
          os: r.os,
          ip: r.ip,
          lastPath: r.lastPath,
          lastTitle: r.lastTitle,
          firstVisit: !!r.firstVisit,
          isLoggedIn: !!r.isLoggedIn,
          eventNames: new Set((r.eventNames || []).filter(Boolean)),
          devices: [...devs],
        });
        continue;
      }
      p.views += r.views;
      p.clicks += r.clicks;
      p.events += r.events;
      (r.sessions || []).filter(Boolean).forEach((x) => p.sessions.add(x));
      (r.eventNames || []).filter(Boolean).forEach((x) => p.eventNames.add(x));
      p.devices.push(...devs);
      p.srcList.push({ at: r.firstAt, list: r.sources || [] });
      p.firstVisit = p.firstVisit || !!r.firstVisit;
      p.isLoggedIn = p.isLoggedIn || !!r.isLoggedIn;
      if (r.firstAt < p.firstAt) { p.firstAt = r.firstAt; p.source = r.source; }
      if (r.lastAt > p.lastAt) {
        Object.assign(p, { lastAt: r.lastAt, visitorId: r._id, device: r.device, browser: r.browser, os: r.os, ip: r.ip, lastPath: r.lastPath, lastTitle: r.lastTitle });
      }
    }

    const everyone = [...people.values()].sort((x, y) => new Date(y.lastAt) - new Date(x.lastAt));
    const total = everyone.length;
    const pageRows = everyone.slice((page - 1) * PAGE, page * PAGE);
    const users = await usersById(pageRows.map((r) => r.userId));
    const seen = await firstSeenOf(perBrowser.map((r) => r._id), links);
    const list = pageRows.map((r) => ({
      visitorId: r.visitorId, // journey ku (customer na ellaa devices um varum)
      label: `Visitor ${shortId(r.visitorId)}`,
      user: (r.userId && users.get(String(r.userId))) || null,
      linkedLater: !!r.userId && !r.isLoggedIn, // indha filter la guest visits mattum; adhe aal vera samayam login pannirukkaanga
      firstAt: r.firstAt,
      lastAt: r.lastAt,
      live: r.devices.some((d) => liveSet.has(d.visitorId)),
      views: r.views,
      clicks: r.clicks,
      events: r.events,
      sessions: r.sessions.size,
      source: r.source,
      sources: [...new Set(r.srcList.sort((a, b) => new Date(a.at) - new Date(b.at)).flatMap((x) => x.list).filter(Boolean))],
      device: r.device,
      browser: r.browser,
      os: r.os,
      ip: r.ip,
      lastPath: r.lastPath,
      lastTitle: r.lastTitle,
      firstVisit: !!(seen.get(r.key) && seen.get(r.key) >= match.at.$gte), // New = indha period la mudhal thadavai
      firstSeenAt: seen.get(r.key) || null,
      isLoggedIn: r.isLoggedIn,
      eventNames: [...r.eventNames],
      devices: r.devices.map((d) => ({ ...d, label: `${d.device} · ${d.browser}` })),
      durationSec: Math.max(0, Math.round((new Date(r.lastAt) - new Date(r.firstAt)) / 1000)),
    }));
    return { total, page, pageSize: PAGE, hasMore: page * PAGE < total, list };
};

const visitorsCore = async (req, res) => {
  try {
    const out = await buildVisitors(req.query);
    return res.status(200).json({ success: true, ...out });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Speed: admin page 5 sec ku oru thadava kekkum — aana heavy query pudhu data vandhaa mattum ───
//  • ?since=<lastWrite> anuppi, adhukku apram pudhu visit illana → { unchanged: true, live } (DB query illa, udane)
//  • Pudhu data irundhaalum adhe filter ku 10 sec ku oru thadava mattum full query (ella admins um share)
const CACHE_MS = 10000;
const cache = new Map(); // key → { at, lastWrite, body }
const capture = (core, query) => new Promise((resolve, reject) => {
  core({ query }, { status: (code) => ({ json: (body) => resolve({ code, body }) }) }).catch(reject);
});
const cachedRun = async (core, query) => {
  const { since, ...q } = query || {};
  const key = `${core === reportCore ? "r" : "v"}:${JSON.stringify(Object.keys(q).sort().map((k) => [k, q[k]]))}`;
  const hit = cache.get(key);
  if (hit && (hit.lastWrite === lastWrite || Date.now() - hit.at < CACHE_MS)) return { code: 200, body: hit.body, cachedLastWrite: hit.lastWrite };
  const wrote = lastWrite;
  const out = await capture(core, q);
  if (out.code === 200 && out.body?.success) {
    cache.set(key, { at: Date.now(), lastWrite: wrote, body: out.body });
    if (cache.size > 300) cache.delete(cache.keys().next().value);
  }
  return { ...out, cachedLastWrite: wrote };
};
const freshLive = async (who) => {
  const ids = liveNow(who);
  const links = await linkMap(ids);
  return { live: new Set(ids.map((v) => personKey(v, links))).size, liveIds: liveNow("all") };
};

export const trafficReport = async (req, res) => {
  try {
    const who = ["guest", "loggedIn", "all"].includes(req.query.who) ? req.query.who : "guest";
    const { live } = await freshLive(who);
    if (req.query.since && Number(req.query.since) === lastWrite) {
      return res.status(200).json({ success: true, unchanged: true, live, lastWrite });
    }
    const out = await cachedRun(reportCore, req.query);
    if (out.code !== 200) return res.status(out.code).json(out.body);
    return res.status(200).json({ ...out.body, live, lastWrite: out.cachedLastWrite });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const trafficVisitors = async (req, res) => {
  try {
    const { liveIds } = await freshLive("all");
    const liveSet = new Set(liveIds);
    if (req.query.since && Number(req.query.since) === lastWrite) {
      return res.status(200).json({ success: true, unchanged: true, liveIds, lastWrite });
    }
    const out = await cachedRun(visitorsCore, req.query);
    if (out.code !== 200) return res.status(out.code).json(out.body);
    const list = (out.body.list || []).map((v) => ({ ...v, live: (v.devices || []).some((d) => liveSet.has(d.visitorId)) }));
    return res.status(200).json({ ...out.body, list, lastWrite: out.cachedLastWrite });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/touradmin/traffic/export?what=visitors|activity&…filters → CSV (Excel la open aagum) ───
const csvCell = (v) => {
  const t = v === null || v === undefined ? "" : String(v);
  const safe = /^[=+\-@]/.test(t) ? `'${t}` : t; // Excel formula injection thadukka
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
const toCsv = (head, rows) => "\uFEFF" + [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
const istText = (d) => (d ? new Date(new Date(d).getTime() + 5.5 * 36e5).toISOString().replace("T", " ").slice(0, 19) : "");

export const trafficExport = async (req, res) => {
  try {
    const what = req.query.what === "activity" ? "activity" : "visitors";
    const { from, to } = rangeOf(req.query);
    let csv;
    if (what === "visitors") {
      const { list } = await buildVisitors(req.query, { all: true });
      csv = toCsv(
        ["Visitor", "Name", "Email", "Phone", "Logged in", "New / Returning", "Sources", "Devices", "Pages", "Clicks", "Stage events", "Visits", "Time spent (min)", "First seen (IST)", "Last seen (IST)", "Last page", "IP (partly hidden)"],
        list.map((v) => [
          v.label, v.user?.name || "", v.user?.email || "", v.user?.phone || "",
          v.user ? "Yes" : "No", v.firstVisit ? "New" : "Returning",
          (v.sources?.length ? v.sources : [v.source]).join(" | "),
          v.devices.map((d) => d.label).join(" | "),
          v.views, v.clicks, (v.eventNames || []).join(" | "), v.sessions,
          Math.round(v.durationSec / 60), istText(v.firstAt), istText(v.lastAt), v.lastPath, v.ip,
        ])
      );
    } else {
      const { match } = rangeOf(req.query);
      await applyFilters(match, req.query);
      const kind = req.query.kind;
      if (kind === "pageview") match.type = { $in: ["pageview", null] };
      else if (kind === "click" || kind === "event") match.type = kind;
      const rows = await visitModel.find(match).sort({ at: -1 }).limit(20000).lean();
      const users = await usersById(rows.map((r) => r.userId));
      csv = toCsv(
        ["Time (IST)", "Type", "What", "Page", "Visitor", "Name", "Email", "Phone", "Source", "Device", "Browser", "OS", "IP (partly hidden)"],
        rows.map((r) => {
          const u = r.userId && users.get(String(r.userId));
          const type = r.type || "pageview";
          return [istText(r.at), type, type === "pageview" ? r.title || r.path : r.name, r.path, `Visitor ${shortId(r.visitorId)}`, u?.name || "", u?.email || "", u?.phone || "", r.source, r.device, r.browser, r.os, r.ip];
        })
      );
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="website-${what}-${from}-to-${to}.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/touradmin/traffic/visitor/:visitorId — andha aal enna enna panninaanga (journey) ───
export const trafficVisitorJourney = async (req, res) => {
  try {
    const visitorId = clip(req.params.visitorId, 64);
    if (!visitorId) return res.status(400).json({ success: false, message: "Visitor not found" });
    // Login aana customer na avanga ellaa devices (browsers) um serthu
    const uid0 = (await linkMap([visitorId])).get(visitorId) || null;
    const allIds = uid0 ? await visitModel.distinct("visitorId", { userId: uid0 }) : [visitorId];
    if (!allIds.includes(visitorId)) allIds.push(visitorId);
    const items = await visitModel
      .find({ visitorId: { $in: allIds } })
      .sort({ at: 1 })
      .limit(1000)
      .select("at type name props path title source referrer device browser os screen ip sessionId isLoggedIn firstVisit userId visitorId")
      .lean();
    if (!items.length) return res.status(404).json({ success: false, message: "Visitor not found" });
    const first = items[0];
    const last = items[items.length - 1];
    const uid = [...items].reverse().find((i) => i.userId)?.userId || null;
    const jUser = uid ? (await usersById([uid])).get(String(uid)) || null : null;
    return res.status(200).json({
      success: true,
      visitor: {
        visitorId,
        label: `Visitor ${shortId(visitorId)}`,
        user: jUser,
        firstAt: first.at,
        lastAt: last.at,
        source: first.source,
        referrer: first.referrer || "",
        device: last.device,
        browser: last.browser,
        os: last.os,
        screen: last.screen,
        ip: last.ip,
        isLoggedIn: items.some((i) => i.isLoggedIn),
        sessions: new Set(items.map((i) => i.sessionId).filter(Boolean)).size,
        devices: [...new Map(items.map((i) => [i.visitorId, `${i.device} · ${i.browser} · ${i.os}`])).values()],
        views: items.filter((i) => !i.type || i.type === "pageview").length,
        clicks: items.filter((i) => i.type === "click").length,
        events: items.filter((i) => i.type === "event").length,
      },
      items: items.map(({ _id, ...rest }) => rest), // eslint-disable-line no-unused-vars
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};