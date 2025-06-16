const express = require("express");
const {
  createColor,
  getColor,
  deleteColor,
  getColorById,
  updateColor,
} = require("../controllers/colorControllers");

const router = express.Router();

router.post("/", createColor);
router.get("/", getColor);
router.get("/:id", getColorById);
router.delete("/:id", deleteColor);
router.put("/:id", updateColor);

module.exports = router;
