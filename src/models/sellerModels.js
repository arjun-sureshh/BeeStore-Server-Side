const mongoose = require("mongoose");

const sellerSchemaStructure = new mongoose.Schema(
  {
    sellerName: {
      type: String,
      require: false,
      default: null,
      trim: true,
    },
    sellerEmail: {
      type: String,
      required: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    ListingStatus: {
      type: Number,
      default: 1,
      required: false,
    },
    sellerPassword: {
      type: String,
      required: false,
      unique: true,
      trim: true,
    },
    sellerMobileNumber: {
      type: Number,
      required: false,
      trim: true,
      validate: {
        validator: function (number) {
          const phoneNumber = /^\d{10}$/;
          return phoneNumber.test(number);
        },
        message: "enter valid number",
      },
    },
    sellerDisplayName: {
      type: String,
      trim: true,
      default: null,
      required: false,
    },
    bankAccountNo: {
      type: String,
      required: false,
      default: null,
      trim: true,
    },
    ifscCode: {
      type: String,
      required: false,
      default: null,
      trim: true,
    },
    storeDiscription: {
      type: String,
      required: false,
      default: null,
      trim: true,
    },

    sellerGST: {
      type: String,
      required: false,
      default: null,
      trim: true,
    },
    qcStatus: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const Seller = mongoose.model("seller", sellerSchemaStructure);

module.exports = Seller;
