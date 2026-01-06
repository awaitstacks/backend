// import mongoose from "mongoose";
// const connectDB = async () => {
//   mongoose.connection.on("connected", () => {
//     console.log("DB Connection succesfull");
//   });
//   await mongoose.connect(`${process.env.MONGODB_URL}/prescripto`);
// };
// export default connectDB;

import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/prescripto`, {
      // Add these options for better debugging/reliability
      serverSelectionTimeoutMS: 10000, // Timeout after 10s if no server
      connectTimeoutMS: 10000,
    });

    console.log("DB Connection successful"); // This will only log on real success
  } catch (error) {
    console.error("DB Connection FAILED:", error.message || error);
    // Optional: process.exit(1); // Stop server if DB fails (uncomment if critical)
  }

  // Keep your event listeners for ongoing monitoring
  mongoose.connection.on("connected", () => {
    console.log("DB Connection successful (event)");
  });
  mongoose.connection.on("error", (err) => {
    console.error("DB Connection error:", err);
  });
  mongoose.connection.on("disconnected", () => {
    console.log("DB disconnected");
  });
};

export default connectDB;
