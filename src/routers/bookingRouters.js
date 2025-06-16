const express = require("express");
const {
  createBooking,
  getBooking,
  confirmOrder,
  orderDetails,
  getOrderDetails,
  searchOrdersByProductTitle,
  update_cart_booking_status,
  cancel_cart_item,
  getTopOrderedProducts,
  getTotalIncome,
  getDeliveredOrders,
} = require("../controllers/bookingControllers");

const router = express.Router();

router.post("/", createBooking);
router.post("/getbyId", getBooking);
router.put("/confirm-Order", confirmOrder);
router.put("/update-the-status", update_cart_booking_status);
router.put("/cancel-cart-item", cancel_cart_item);

router.post("/order-details", orderDetails);
router.post("/search-orders", searchOrdersByProductTitle);
router.get("/get-order-details", getOrderDetails);

router.get("/delivered", getDeliveredOrders);
router.get("/total-income", getTotalIncome);
router.get("/top-ordered", getTopOrderedProducts);

module.exports = router;
