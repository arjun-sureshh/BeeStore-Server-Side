const mongoose = require("mongoose");

const sizebasedSchemaStructure = new mongoose.Schema({
  sizeHeadName: {
    type: String,
    required: true,
  },
});

const SizeHead = mongoose.model("sizeHead", sizebasedSchemaStructure);
module.exports = SizeHead;
