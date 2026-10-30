import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";

import userRouter from "./routes/userRoute.js";
import touradminRouter from "./routes/tourAdminRoute.js";
import tourRouter from "./routes/tourRoute.js";
import bookingRouter from "./routes/bookingRoute.js";
import staffRouter from "./routes/staffRoute.js";

//app config

const app = express();
const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();

//middlewares

app.use(express.json());
// app.use(cors());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ttoken",
      "token",
      "aToken",
      "stoken",

    ],
  }),
);
//API endpoints

//Admin

app.use("/api/touradmin", touradminRouter);

//Tour

app.use("/api/tour", tourRouter);

app.use("/api/user", userRouter);

//public
app.use("/api/bookings", bookingRouter);

app.use("/api/staff", staffRouter);

//localhost:4000/api/admin

app.get("/", (req, res) => {
  res.send("API working TEST MODE");
});

app.listen(port, () => console.log("Server started", port));
