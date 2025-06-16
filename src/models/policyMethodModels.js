const mongoose = require("mongoose");

const policyMethodSchemaStructure = new mongoose.Schema(
  {
    policyMethodName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const PolicyMethod = mongoose.model(
  "policyMethod",
  policyMethodSchemaStructure,
);

module.exports = PolicyMethod;
