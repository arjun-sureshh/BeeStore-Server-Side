const mongoose = require("mongoose");

const productVariantSchemaStructure = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "productdetails",
      required: false,
      default: null,
    },
    qcStatus: {
      type: Number,
      default: 0,
      trim: true,
      default: null,
    },
    mrp: {
      type: Number,
      required: false,
      default: null,
    },
    sellingPrice: {
      type: Number,
      required: false,
      default: null,
    },
    minimumOrderQty: {
      type: Number,
      required: false,
      default: null,
    },
    shippingProvider: {
      type: String,
      required: false,
      default: null,
    },
    Length: {
      type: Number,
      required: false,
      default: null,
    },
    breadth: {
      type: Number,
      required: false,
      default: null,
    },
    height: {
      type: Number,
      required: false,
      default: null,
    },
    weight: {
      type: Number,
      required: false,
      default: null,
    },
    hsnCode: {
      type: String,
      required: false,
      default: null,
    },
    taxCode: {
      type: String,
      required: false,
      default: null,
    },
    countryOfOrgin: {
      type: String,
      required: false,
      default: null,
    },
    colorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "colors",
      required: false,
      default: null,
    },
    manufactureDetails: {
      type: String,
      required: false,
      default: null,
    },
    packerDetails: {
      type: String,
      required: false,
      default: null,
    },
    productDiscription: {
      type: String,
      required: false,
      default: null,
    },
    productTitle: {
      type: String,
      required: false,
      default: null,
    },
    procurementType: {
      type: String,
      required: false,
      default: null,
    },
    procurementSLA: {
      type: String,
      required: false,
      default: null,
    },
    intheBox: {
      type: String,
      required: false,
      default: null,
    },
    warrantyPeriod: {
      type: String,
      required: false,
      default: null,
    },
    warantySummary: {
      type: String,
      required: false,
      default: null,
    },
  },
  { timestamps: true },
);

const ProductVariant = mongoose.model(
  "productvariantdetails",
  productVariantSchemaStructure,
);

module.exports = ProductVariant;
