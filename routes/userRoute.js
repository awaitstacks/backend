import express from "express";
import {
  getProfile,
  loginUser,
  registerUser,
  updateProfile,
  addToTrolly,
  listTrolly,
  paymentRazorpay,
  verifyRazorpay,
  cancelTraveller,
  googleSignIn,
} from "../controllers/userController.js";
import authUser from "../middlewares/authUser.js";
import { upload } from "../middlewares/multer.js";
const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/get-profile", authUser, getProfile);
userRouter.post(
  "/update-profile",
  upload.single("image"),
  authUser,
  updateProfile
);

userRouter.post("/addtotrolly", authUser, addToTrolly);

userRouter.get("/my-trolly", authUser, listTrolly);

userRouter.post("/cancel-traveller", authUser, cancelTraveller);

userRouter.post("/payment-razorpay", authUser, paymentRazorpay);
userRouter.post("/verifyRazorpay", authUser, verifyRazorpay);
userRouter.post("/google-signin", googleSignIn);

export default userRouter;
