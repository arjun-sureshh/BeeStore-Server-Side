const mongoose = require("mongoose");

const wishlistSchemaStructure = new mongoose.Schema(
  {
    varientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "productvariantdetails",
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

const Wishlist = mongoose.model("wishlists", wishlistSchemaStructure);
module.exports = Wishlist;
