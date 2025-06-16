const mongoose = require("mongoose");

const cartSchemaStructure = new mongoose.Schema(
  {
    cartQty: {
      type: Number,
      required: true,
    },
    productvariantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "productvariantdetails",
      required: true,
    },
    bookingID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "booking",
    },
    cartStatus: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const MYcart = mongoose.model("myCart", cartSchemaStructure);

module.exports = MYcart;
