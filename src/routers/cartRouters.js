const express = require("express");
const {
  createCart,
  getCart,
  deleteCart,
  addQty,
  removeQty,
  placeOrder,
  BuyNow,
  getSellerDashboardStats,
} = require("../controllers/cartControllers");

const router = express.Router();

router.post("/", createCart);
router.delete("/", deleteCart);
router.get("/:userId", getCart);
router.put("/removeOne", removeQty);
router.put("/addOne", addQty);
router.post("/place-order", placeOrder);
router.post("/buy-now", BuyNow);
router.get("/dashboard-stats/:sellerId", getSellerDashboardStats);

module.exports = router;
