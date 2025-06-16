const mongoose = require("mongoose");

const chatusSchemaStructure = new mongoose.Schema(
  {
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "myCart",
      require: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      require: true,
    },
  },
  { timestamps: true },
);

const ChatUs = mongoose.model("chatus", chatusSchemaStructure);

module.exports = ChatUs;
