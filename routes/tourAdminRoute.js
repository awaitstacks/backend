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

} from "../controllers/tourAdminController.js";
import authAdmin from "../middlewares/authAdmin.js";
import { tourUpload } from "../middlewares/multer.js"; // ✅ Correct import (pre-configured fields)

const touradminRouter = express.Router();

// ✅ Route: Add a new tour with images
touradminRouter.post("/add-tour", authAdmin, tourUpload, addTour);
touradminRouter.post("/login", loginAdmin);
touradminRouter.post("/all-tours", authAdmin, allTours);
touradminRouter.post("/generate-missing-tnrs", authAdmin, generateMissingTNRs);

touradminRouter.post("/reject-bookingadmin", authAdmin, bookingRejectAdmin);
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
// TEMP DEBUG — remove after testing
touradminRouter.get("/analytics-cancel-debug", async (req, res) => {
  try {
    const data = await tourBookingModel.aggregate([
      { $unwind: "$travellers" },
      {
        $match: {
          "travellers.cancelled.byAdmin": true,
          "travellers.cancelled.byTraveller": true,
        }
      },
      {
        $project: {
          tnr: 1,
          cancelledAt: "$travellers.cancelled.cancelledAt",
          gvPool: "$gvCancellationPool",
          irctcPool: "$irctcCancellationPool",
        }
      }
    ]);
    res.json({ count: data.length, data });
  } catch (e) {
    res.json({ error: e.message });
  }
});


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


export default touradminRouter;