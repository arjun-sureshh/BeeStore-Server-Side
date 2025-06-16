const express = require("express");
const {
  createWishlist,
  getWishlist,
  getWishlistStatus,
  deleteWishlist,
} = require("../controllers/wishlistControllers");

const router = express.Router();

router.get("/status", getWishlistStatus);
router.post("/", createWishlist);
router.delete("/", deleteWishlist);
router.get("/", getWishlist);

module.exports = router;
