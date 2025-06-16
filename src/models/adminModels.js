const mongoose = require("mongoose");

const adminSchemaStructure = new mongoose.Schema(
  {
    adminName: {
      type: String,
      require: true,
      trim: true,
    },
    adminEmail: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    adminPassword: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true },
);

const Admin = mongoose.model("admin", adminSchemaStructure);

module.exports = Admin;
