const mongoose = require("mongoose");

const brandSchemaStructure = new mongoose.Schema(
  {
    brandName: {
      type: String,
      required: true,
    },
    brandStatus: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const Brand = mongoose.model("brand", brandSchemaStructure);
module.exports = Brand;
