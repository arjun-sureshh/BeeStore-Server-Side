const express = require("express");
const {
  createPaymentMethod,
  getPaymentMethod,
  getPaymentMethodById,
  deletePaymentMethod,
  updatePaymentMethod,
} = require("../controllers/paymentmethodControllers");

const router = express.Router();

router.post("/", createPaymentMethod);
router.get("/", getPaymentMethod);
router.get("/:id", getPaymentMethodById);
router.delete("/:id", deletePaymentMethod);
router.put("/:id", updatePaymentMethod);

module.exports = router;
