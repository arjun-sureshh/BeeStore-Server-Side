const express = require("express");
const router = express.Router();
const {
  fetchProductData,
  upsertProduct,
} = require("../controllers/productuploadControllers");
const upload = require("../config/multerConfig");
const auth = require("../config/auth");

router.post("/upsert", upsertProduct);
router.get("/fetch/:productId", fetchProductData);
module.exports = router;
