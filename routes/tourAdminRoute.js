import express from "express";
import {
  // addMissingFieldsToAllBookings,
  addTour,
  allTours,
  approveBookingUpdate,
  approveCancellation,
  bookingRejectAdmin,
  bookingRelease,
  bookingsAdmin,
  getCancellationChart,
  getCancellations,
  getPendingApprovals,
  loginAdmin,
  rejectBookingUpdate,
  rejectCancellation,
  tourAdminDashboard,
  upsertCancellationChart,
  getBookings,
  adminTourList,
  adminBookingsTour,
  changeTourAvailability,
  adminAllotRooms,
  getAllUsers,
  generateMissingTNRs,
  addTermsPoints,
  getCurrentTerms,
  deleteTermsPoint,
  adminCreateTourVehicle,
  adminUpdateTourVehicle,
  adminGetTourVehicles,
  adminDeleteTourVehicle,
  adminToggleVehicleSeatSelection,
  getAllPaymentMethods,
  adminFetchTourVehicleSeatOverview,
  deleteBookingByTNR,
  // ─── Analytics ───────────────────────────────────────────────
  getAnalyticsSummary,
  getAnalyticsYearWise,
  getAnalyticsMonthWise,
  getAnalyticsCancellation,
  getAnalyticsTourList,
  searchAnalyticsTours,
  closeTourBookings,
  reopenTourBookings,
  cancelEntireTrip,
  reopenEntireTrip,
  getQueryTypes,
  raiseQuery,
  updateQuery,
  getAdminQueries,
  getTourAdminReplies,
  addTourAdminReply,
  deleteQuery,
  editTourAdminReply,
  deleteTourAdminReply,
  getTourAdminQuerySync,
  getStaffForQueries,
  getEditHistory,
  reopenQuery,
  adminViewStaff,
  adminViewEnquiries,


} from "../controllers/tourAdminController.js";
// import authAdmin from "../middlewares/authAdmin.js";
import authAdminStrict from "../middlewares/authAdmin.js";
// import { authAdminOrStaff } from "../middlewares/authStaff.js";
import { authAdminOrStaff, forceRaisedByStaff } from "../middlewares/authStaff.js";
import { tourUpload, queryUpload } from "../middlewares/multer.js";
import { getAllEnquiries } from "../controllers/tourController.js";
import { getPaymentTasks, markPaymentTaskDone } from "../controllers/aadhaarController.js";
import { lookupTicketTnr, forceRaisedToFromTnr } from "../controllers/ticketTnrController.js";
import { get } from "mongoose";
// Admin + Staff. IT mattum routes ku authAdminStrict.
const authAdmin = authAdminOrStaff();
const touradminRouter = express.Router();

// ✅ Route: Add a new tour with images
touradminRouter.post("/add-tour", authAdmin, tourUpload, addTour);
touradminRouter.post("/login", loginAdmin);
touradminRouter.post("/all-tours", authAdmin, allTours);
// touradminRouter.post("/generate-missing-tnrs", authAdmin, generateMissingTNRs);
touradminRouter.post("/generate-missing-tnrs", authAdminStrict, generateMissingTNRs);


touradminRouter.post("/reject-bookingadmin", authAdmin, bookingRejectAdmin);
// touradminRouter.post("/delete-booking", authAdmin, deleteBookingByTNR);
// touradminRouter.post("/delete-booking", authAdminStrict, deleteBookingByTNR);
touradminRouter.post("/delete-booking", authAdmin, deleteBookingByTNR);
touradminRouter.post("/release-bookingadmin", authAdmin, bookingRelease);
touradminRouter.post(
  "/change-touravailablity",
  authAdmin,
  changeTourAvailability,
);
touradminRouter.post("/tour/:tourId/close-bookings", authAdmin, closeTourBookings);
touradminRouter.post("/tour/:tourId/reopen-bookings", authAdmin, reopenTourBookings);
touradminRouter.post("/tour/:tourId/cancel-trip", authAdmin, cancelEntireTrip);
touradminRouter.post("/tour/:tourId/reopen-trip", authAdmin, reopenEntireTrip);

touradminRouter.get("/bookings", authAdmin, bookingsAdmin);
touradminRouter.get("/get-bookings", authAdmin, getBookings);
touradminRouter.get("/touradmindashboard", authAdmin, tourAdminDashboard);
touradminRouter.post(
  "/touradmincancelrule",
  authAdmin,
  upsertCancellationChart,
);
touradminRouter.get("/touradmingetcancelrule", authAdmin, getCancellationChart);
touradminRouter.get("/touradmingetcancellations", authAdmin, getCancellations);
touradminRouter.post("/approvecancellation", authAdmin, approveCancellation);
touradminRouter.post("/rejectcancellation", authAdmin, rejectCancellation);
touradminRouter.post("/approvebookingupdate", authAdmin, approveBookingUpdate);
touradminRouter.post("/rejectbookingupdate", authAdmin, rejectBookingUpdate);
touradminRouter.get("/alluser-profile", authAdmin, getAllUsers);
touradminRouter.get("/tourlist", adminTourList);
touradminRouter.get("/adminallot-rooms/:tourId", adminAllotRooms);
touradminRouter.get(
  "/adminbookings-tour/:tourId",
  authAdmin,
  adminBookingsTour,
);

//Crictical
// touradminRouter.post(
//   "/add-missing-fields",
//   authAdmin,
//   addMissingFieldsToAllBookings,
// );
touradminRouter.get("/pending-approvals", authAdmin, getPendingApprovals);

touradminRouter.post("/terms/add-points", addTermsPoints);
touradminRouter.delete("/terms/points/:pointId", deleteTermsPoint);
touradminRouter.get("/terms/current", getCurrentTerms);

touradminRouter.get("/analytics-summary", authAdmin, getAnalyticsSummary);
touradminRouter.get("/analytics-year-wise", authAdmin, getAnalyticsYearWise);
touradminRouter.get("/analytics-month-wise", authAdmin, getAnalyticsMonthWise);
touradminRouter.get("/analytics-cancellation", authAdmin, getAnalyticsCancellation);
touradminRouter.get("/analytics-tour-list", authAdmin, getAnalyticsTourList);
touradminRouter.get("/analytics-search", authAdmin, searchAnalyticsTours);
touradminRouter.post("/:tourId/vehicles", authAdmin, adminCreateTourVehicle);

touradminRouter.patch(
  "/:tourId/vehicles/:vehicleId",
  authAdmin,
  adminUpdateTourVehicle,
);

touradminRouter.patch(
  "/:tourId/vehicles/:vehicleId/toggle-seat-selection",
  authAdmin,
  adminToggleVehicleSeatSelection,
);

touradminRouter.get("/:tourId/vehicles", authAdmin, adminGetTourVehicles);

touradminRouter.delete(
  "/:tourId/vehicles/:vehicleId",
  authAdmin,
  adminDeleteTourVehicle,
);
touradminRouter.get("/payment-methods", authAdmin, getAllPaymentMethods);
touradminRouter.get(
  "/:tourId/vehicle-seat-allocation",
  authAdmin,
  adminFetchTourVehicleSeatOverview,
);
touradminRouter.get("/staff/all", authAdmin, getStaffForQueries);

// ── VIEW ONLY (Admin) — Staff Profile / FIT Enquiries list. Create / Edit / Delete illa. ──
touradminRouter.get("/staff/view-all", authAdmin, adminViewStaff);
touradminRouter.get("/enquiry/all", authAdmin, adminViewEnquiries);
touradminRouter.get("/query-types", authAdmin, getQueryTypes);

// Queries
touradminRouter.get("/queries/sync", authAdmin, getTourAdminQuerySync);
touradminRouter.get("/queries/edit-history", authAdmin, getEditHistory);
touradminRouter.get("/queries", authAdmin, getAdminQueries);
// touradminRouter.post("/queries", authAdmin, queryUpload, raiseQuery);
touradminRouter.post("/queries", authAdmin, queryUpload, forceRaisedByStaff, forceRaisedToFromTnr, raiseQuery);
touradminRouter.get("/queries/tnr-lookup/:tnr", authAdmin, lookupTicketTnr);
// touradminRouter.patch("/queries/:queryId", authAdmin, queryUpload, updateQuery);
touradminRouter.patch("/queries/:queryId", authAdmin, queryUpload, forceRaisedByStaff, forceRaisedToFromTnr, updateQuery);
touradminRouter.delete("/queries/:queryId", authAdmin, deleteQuery);
touradminRouter.patch("/queries/:queryId/reopen", authAdmin, reopenQuery);

// Replies
touradminRouter.get("/queries/:queryId/replies", authAdmin, getTourAdminReplies);
touradminRouter.post("/queries/:queryId/replies", authAdmin, addTourAdminReply);
touradminRouter.patch("/queries/:queryId/replies/:replyId", authAdmin, editTourAdminReply);
touradminRouter.delete("/queries/:queryId/replies/:replyId", authAdmin, deleteTourAdminReply);
// Payment Tasks dashboard — same backend as Tour Admin side, authAdmin-oda gate pannirukom mattum.
touradminRouter.get("/payment-tasks", authAdmin, getPaymentTasks);
touradminRouter.post("/payment-tasks/mark-done", authAdmin, markPaymentTaskDone);
export default touradminRouter;