const express = require("express");
const {
  createProductStock,
  getProductStock,
  getStockByProductVaraintId,
  getStockByVariantIds,
  updateProductStock,
  AddProductStock,
} = require("../controllers/productstockControllers");

const router = express.Router();

router.post("/", createProductStock);
router.put("/updateStock/:productvariantId", updateProductStock);
router.put("/AddStock/:productvariantId", AddProductStock);
router.get("/", getProductStock);
router.get("/fetchProductStock/:productVaraintId", getStockByProductVaraintId);
router.post("/fetchstockByProductVariantId", getStockByVariantIds);

module.exports = router;
