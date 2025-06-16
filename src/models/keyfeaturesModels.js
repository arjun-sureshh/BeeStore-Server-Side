const mongoose = require("mongoose");

const featuresSchemaStructure = new mongoose.Schema(
  {
    featureTitle: {
      type: String,
      required: false,
    },
    featureContent: {
      type: String,
      required: false,
    },
    productVariantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "productvariantdetails",
      required: false,
    },
  },
  { timestamps: true },
);

const Features = mongoose.model("features", featuresSchemaStructure);

module.exports = Features;
