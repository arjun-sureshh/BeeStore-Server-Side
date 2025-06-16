const mongoose = require("mongoose");

const stockSchemaStructure = new mongoose.Schema(
  {
    stockqty: {
      type: Number,
      required: false,
    },
    productvariantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "productvariantdetails",
      required: false,
    },
  },
  { timestamps: true },
);

const ProductStock = mongoose.model("productstock", stockSchemaStructure);

module.exports = ProductStock;
