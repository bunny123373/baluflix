import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/baluflix");
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ DB Error", err);
  }
};

export default connectDB;
