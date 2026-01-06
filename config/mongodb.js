import mongoose from "mongoose";
const connectDB = async () => {
  mongoose.connection.on("connected", () => {
    console.log("DB Connection succesfull");
  });
  await mongoose.connect(`${process.env.MONGODB_URL}/prescripto`);
};
export default connectDB;
