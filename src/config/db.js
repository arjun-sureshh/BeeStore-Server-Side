const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    // console.log("mono-url",process.env.MONGO_URI);

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Mongo DB connected");
  } catch (error) {
    console.error("error connecting to MongoDB", error);
    process.exit(1);
  }
};

module.exports = connectDB;
