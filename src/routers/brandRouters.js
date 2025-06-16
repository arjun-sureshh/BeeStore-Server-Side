const express = require("express");
const {
  createBrand,
  getBrand,
  getBrandById,
  deleteBrand,
  updateBrand,
  searchBrand,
  brandBySeller,
} = require("../controllers/brandControllers");

const router = express.Router();

router.post("/", createBrand);
router.post("/brandBySeller", brandBySeller);
router.get("/", getBrand);
router.get("/:id", getBrandById);
router.get("/search/:searchData", searchBrand);
router.delete("/:id", deleteBrand);
router.put("/:id", updateBrand);

module.exports = router;
