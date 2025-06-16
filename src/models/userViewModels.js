const mongoose = require("mongoose");

const userViewSchemaStructure = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "productdetails",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true },
);

const userView = mongoose.model("userViewedProducts", userViewSchemaStructure);
module.exports = userView;
