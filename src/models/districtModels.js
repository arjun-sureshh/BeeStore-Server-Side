const mongoose = require("mongoose");

const districtSchemaStructure = new mongoose.Schema(
  {
    districtName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const District = mongoose.model("district", districtSchemaStructure);

module.exports = District;
