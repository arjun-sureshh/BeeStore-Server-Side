const express = require("express");
const {
  createDistrict,
  getDistrict,
  deleteDistrct,
  getDistrictById,
  updateDistrct,
} = require("../controllers/districtControllers");

const router = express.Router();

router.post("/", createDistrict);
router.get("/", getDistrict);
router.get("/:id", getDistrictById);
router.delete("/:id", deleteDistrct);
router.put("/:id", updateDistrct);

module.exports = router;
