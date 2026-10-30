import express from "express";
import { loginStaff, forgotPassword, getMyProfile } from "../controllers/staffAuthController.js";
import { authStaff } from "../middlewares/authStaff.js";

// /api/staff/...  — staff portal (staff.gvtourplanners.com)
const staffRouter = express.Router();

staffRouter.post("/login", loginStaff);
staffRouter.post("/forgot-password", forgotPassword);
staffRouter.get("/me", authStaff, getMyProfile);

export default staffRouter;