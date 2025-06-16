const mongoose = require("mongoose");

const colorSchemaStructure = new mongoose.Schema(
  {
    color: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const Color = mongoose.model("color", colorSchemaStructure);
module.exports = Color;
