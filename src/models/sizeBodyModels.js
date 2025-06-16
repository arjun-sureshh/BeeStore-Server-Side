const mongoose = require("mongoose");

const sizebodySchemaStructure = new mongoose.Schema({
  size: {
    type: String,
    required: true,
  },
  sizeHeadNameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "sizeheads",
    required: true,
  },
  productVariantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "productvariantdetails",
    required: true,
  },
});

const Size = mongoose.model("sizeBody", sizebodySchemaStructure);
module.exports = Size;
