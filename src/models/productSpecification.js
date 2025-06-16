const mongoose = require("mongoose");

const specificationSchemaStructure = new mongoose.Schema(
  {
    productVariantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "productvariantdetails",
      required: false,
    },
    specification: {
      type: String,
      required: false,
    },
  },
  { timestamps: true },
);

const Specification = mongoose.model(
  "productSpecification",
  specificationSchemaStructure,
);

module.exports = Specification;
