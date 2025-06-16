const mongoose = require("mongoose");

const productSchemaStructure = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "seller",
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "categories",
      required: false,
      default: null,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "brand",
      required: false,
      default: null,
    },
    skuId: {
      type: String,
      default: null,
      required: false,
    },

    ListingStatus: {
      type: Number,
      default: 1,
      required: false,
    },
    fulfilmentBy: {
      type: String,
      required: false,
      default: null,
      trim: true,
    },
    localDeliveryCharge: {
      type: String,
      required: false,
      default: null,
      trim: true,
    },
    zonalDeliveryCharge: {
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

const Product = mongoose.model("productdetails", productSchemaStructure);

module.exports = Product;
