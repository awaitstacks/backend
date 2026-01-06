import express from "express";
import {
  bookingComplete,
  bookingsTour,
  loginTour,
  markOfflineAdvancePaid,
  markOfflineBalancePaid,
  markAdvanceReceiptSent,
  markBalanceReceiptSent,
  tourDashboard,
  tourList,
  tourProfile,
  updateTourProfile,
  updateTraveller,
  viewTourBalance,
  updateTourBalance,
  updateModifyReceipt,
  viewBooking,
  getCancellationsByBooking,
  updateBookingBalance,
  getManagedBookingsHistory,
  updateTourAdvance,
  viewTourAdvance,
  allotRooms, // Ensure this is imported
} from "../controllers/tourController.js";
import authTour from "../middlewares/authTour.js";
import { tourUpload } from "../middlewares/multer.js";
import cancelBookingController from "../controllers/cancelController.js";

const tourRouter = express.Router();

tourRouter.get("/list", tourList);
tourRouter.post("/login", loginTour);
tourRouter.get("/bookings-tour/:tourId", authTour, bookingsTour);
tourRouter.post("/complete-bookingtour", authTour, bookingComplete);
tourRouter.get("/tour-dashboard/:tourId", authTour, tourDashboard);
tourRouter.get("/tour-profile/:tourId", authTour, tourProfile);
tourRouter.put("/update-tourprofile", authTour, tourUpload, updateTourProfile);
tourRouter.put("/mark-advancepaid", authTour, markOfflineAdvancePaid);
tourRouter.put("/mark-balancepaid", authTour, markOfflineBalancePaid);
tourRouter.put("/update-traveller", authTour, updateTraveller);
tourRouter.put("/mark-advance-receipt", authTour, markAdvanceReceiptSent);
tourRouter.put("/mark-balance-receipt", authTour, markBalanceReceiptSent);
tourRouter.get("/view-tour-balance/:bookingId", authTour, viewTourBalance);
tourRouter.get("/view-tour-advance/:bookingId", authTour, viewTourAdvance);
tourRouter.post("/update-tour-balance/:bookingId", authTour, updateTourBalance);
tourRouter.post("/update-tour-advance/:bookingId", authTour, updateTourAdvance);
tourRouter.put("/mark-modify-receipt", authTour, updateModifyReceipt); // New route
tourRouter.get("/view-booking-cancel/:bookingId", viewBooking); // New route
tourRouter.get("/cancelled-bookings/:bookingId", getCancellationsByBooking); // New route
tourRouter.post("/calculate-cancellation", viewBooking); // New route
tourRouter.post("/bookings/:id/cancel", cancelBookingController);
tourRouter.post(
  "/manage-booking-balance/:bookingId",
  authTour,
  updateBookingBalance
);
tourRouter.get("/managed-bookings/history", getManagedBookingsHistory);
tourRouter.get("/allot-rooms/:tourId", allotRooms);

export default tourRouter;
