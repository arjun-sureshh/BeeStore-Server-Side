const mongoose = require("mongoose");

const addressSchemaStructure = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "usres",
      trim: false,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "sellers",
      trim: false,
    },
    address: {
      type: String,
      required: false,
    },
    pincode: {
      type: String,
      required: false,
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "districts",
      required: false,
    },
    mobileNumber: {
      type: String,
      required: false,
    },
    alternateMobileNumber: {
      type: String,
      required: false,
    },
    fullName: {
      type: String,
      required: false,
    },
    addressType: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: false,
    },
    location: {
      latitude: {
        type: Number,
        required: false,
      },
      longitude: {
        type: Number,
        required: false,
      },
    },
  },
  { timestamps: true },
);

const Address = mongoose.model("address", addressSchemaStructure);

module.exports = Address;
