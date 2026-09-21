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
  getBookingInvoice,
  getCancellationsByBooking,
  updateBookingBalance,
  getManagedBookingsHistory,
  updateTourAdvance,
  viewTourAdvance,
  allotRooms, // Ensure this is imported
  getToursByYear,
  getAvailableTourYears,
  getAllBookings,
  TaskBookingComplete,
  taskMarkModifyReceipt,
  taskMarkAdvanceReceiptSent,
  taskMarkBalanceReceiptSent,
  taskMarkCancellationReceipt,
  taskMarkManageBookingReceipt,
  addTour,
  createTourVehicle,
  updateTourVehicle,
  toggleVehicleSeatSelection,
  getTourVehicles,
  deleteTourVehicle,
  getAllPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getTourVehicleSeatOverview,
  createTourPaymentMethod,
  getTourPaymentMethods,
  updateTourPaymentMethod,
  deleteTourPaymentMethod,
  updateBalanceRemark,
  deleteBalanceRemark,
  updateAdvanceRemark,
  deleteAdvanceRemark,
  getManualRooms,
  addGuestRoom,
  addLeaderRoom,
  deleteLeaderRoom,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiry,
  // deleteEnquiry,
  toggleRatePassed,
  acceptEnquiry,
  rejectEnquiry,
  adminCreateEnquiry,
  updateBookingInvoice,
  deleteBookingInvoice,
  
} from "../controllers/tourController.js";
import authTour from "../middlewares/authTour.js";
import { tourUpload } from "../middlewares/multer.js";
import { paymentQrUpload, staffPhotoUpload } from "../middlewares/multer.js";
import cancelBookingController from "../controllers/cancelController.js";
import {
  createStaff, getAllStaff, getStaffById, updateStaff, deleteStaff,
} from "../controllers/staffController.js";
import { get } from "mongoose";

const tourRouter = express.Router();

// Balance Remarks
tourRouter.put("/balance/:tnr/remark", authTour, updateBalanceRemark);           // Edit remark
tourRouter.delete("/balance/:tnr/remark", authTour, deleteBalanceRemark);        // Delete remark
// Advance Remarks
tourRouter.put("/advance/:tnr/remark", authTour, updateAdvanceRemark);           // Edit remark
tourRouter.delete("/advance/:tnr/remark", authTour, deleteAdvanceRemark); // Delete remark

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
// tourRouter.get("/view-tour-balance/:bookingId", authTour, viewTourBalance);
tourRouter.get("/view-tour-balance/:tnr", authTour, viewTourBalance);
// tourRouter.get("/view-tour-advance/:bookingId", authTour, viewTourAdvance);
tourRouter.get("/view-tour-advance/:tnr", authTour, viewTourAdvance);
// tourRouter.post("/update-tour-balance/:bookingId", authTour, updateTourBalance);
tourRouter.post("/update-tour-balance/:tnr", authTour, updateTourBalance);
tourRouter.post("/update-tour-advance/:tnr", authTour, updateTourAdvance);

tourRouter.put("/mark-modify-receipt", authTour, updateModifyReceipt); // New route
tourRouter.get("/view-booking-cancel/:tnr", viewBooking); 
tourRouter.get("/invoice/:tnr", getBookingInvoice);// New route
tourRouter.put("/invoice/:tnr", updateBookingInvoice);
tourRouter.delete("/invoice/:tnr", deleteBookingInvoice);
tourRouter.get("/cancelled-bookings/:tnr", getCancellationsByBooking); // New route
// tourRouter.post("/calculate-cancellation", viewBooking); // New route
tourRouter.post("/bookings/:tnr/cancel", cancelBookingController);
tourRouter.post(
  "/manage-booking-balance/:bookingId",
  authTour,
  updateBookingBalance,
);
tourRouter.get("/managed-bookings/history", getManagedBookingsHistory);
tourRouter.get("/allot-rooms/:tourId", allotRooms);
// ==================== NEW MANUAL ROOM ROUTES ====================

// View Both Guest & Leader Rooms
tourRouter.get("/:tourId/manual-rooms", getManualRooms);

// Add Guest Room
tourRouter.post("/:tourId/add-guest-room", authTour, addGuestRoom);

// Add Leader Room
tourRouter.post("/:tourId/add-leader-room", authTour, addLeaderRoom);
tourRouter.delete("/:tourId/leader-room/:roomId", deleteLeaderRoom);

tourRouter.get("/year/:year", getToursByYear);
tourRouter.get("/year", getAvailableTourYears);
tourRouter.get("/bookings-all", getAllBookings);

// In your tourRouter file (or wherever you define routes)

tourRouter.put("/task/complete-booking", authTour, TaskBookingComplete);
tourRouter.put("/task/modify-receipt", authTour, taskMarkModifyReceipt);
tourRouter.put(
  "/task/mark-advance-receipt-sent",
  authTour,
  taskMarkAdvanceReceiptSent,
);
tourRouter.put(
  "/task/mark-balance-receipt-sent",
  authTour,
  taskMarkBalanceReceiptSent,
);
tourRouter.put(
  "/task/mark-cancellation-receipt-sent",
  authTour,
  taskMarkCancellationReceipt,
);
tourRouter.put(
  "/task/mark-managebooking-receipt-sent",
  authTour,
  taskMarkManageBookingReceipt,
);
tourRouter.post("/add-tour", tourUpload, addTour);

// 1. Create a new vehicle for a tour
tourRouter.post("/:tourId/vehicles", authTour, createTourVehicle);

tourRouter.patch("/:tourId/vehicles/:vehicleId", authTour, updateTourVehicle);

tourRouter.patch(
  "/:tourId/vehicles/:vehicleId/toggle-seat-selection",
  authTour,
  toggleVehicleSeatSelection,
);

tourRouter.get("/:tourId/vehicles", authTour, getTourVehicles);
// Vehicle seat allocation overview for a tour (shows only seated travellers)
tourRouter.get(
  "/:tourId/vehicle-seat-allocation",
  authTour,
  getTourVehicleSeatOverview,
);

tourRouter.delete("/:tourId/vehicles/:vehicleId", authTour, deleteTourVehicle);
tourRouter.get("/payment-methods", authTour, getAllPaymentMethods);
tourRouter.post(
  "/create-payment-methods",
  authTour,
  paymentQrUpload,
  createPaymentMethod,
);
tourRouter.put(
  "/update-payment-methods/:id",
  authTour,
  paymentQrUpload,
  updatePaymentMethod,
);

tourRouter.delete("/delete-payment-methods/:id", authTour, deletePaymentMethod);


tourRouter.get("/:tourId/payment-methods", authTour, getTourPaymentMethods);

tourRouter.post(
  "/:tourId/create-payment-methods",
  authTour,
  paymentQrUpload,
  createTourPaymentMethod,
);
tourRouter.put('/:tourId/update-payment-methods/:id',
  authTour,
  paymentQrUpload,
  updateTourPaymentMethod,
);

tourRouter.delete('/:tourId/delete-payment-methods/:id', authTour, deleteTourPaymentMethod);
tourRouter.post('/enquiry/create', authTour, adminCreateEnquiry);
tourRouter.get('/enquiry/all', authTour, getAllEnquiries);
tourRouter.get('/enquiry/:id', authTour, getEnquiryById);
tourRouter.put('/enquiry/:id/update', authTour, updateEnquiry);
// tourRouter.delete('/enquiry/:id/delete', authTour, deleteEnquiry);
tourRouter.put('/enquiry/:id/rate-passed', authTour, toggleRatePassed);
tourRouter.put('/enquiry/:id/accept', authTour, acceptEnquiry);
tourRouter.put('/enquiry/:id/reject', authTour, rejectEnquiry);
tourRouter.post('/staff/create', authTour, staffPhotoUpload, createStaff);
tourRouter.get('/staff/all', authTour, getAllStaff); // '/staff/:id'-kku munnadi
tourRouter.get('/staff/:id', authTour, getStaffById);
tourRouter.put('/staff/:id/update', authTour, staffPhotoUpload, updateStaff);
tourRouter.delete('/staff/:id/delete', authTour, deleteStaff);




export default tourRouter;
