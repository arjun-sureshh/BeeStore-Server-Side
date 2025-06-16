const mongoose = require("mongoose");

const paymentMethodSchemaStructure = new mongoose.Schema(
  {
    paymentMethodName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const PaymentMethod = mongoose.model(
  "paymentMethod",
  paymentMethodSchemaStructure,
);

module.exports = PaymentMethod;
