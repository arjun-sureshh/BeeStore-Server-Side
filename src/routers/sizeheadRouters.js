const express = require("express");
const {
  createSizeHead,
  getSizeHead,
  getSizeTypeById,
  deleteSizeType,
  updateSizeType,
} = require("../controllers/sizeheadControllers");

const router = express.Router();

router.post("/", createSizeHead);
router.get("/", getSizeHead);
router.get("/:id", getSizeTypeById);
router.delete("/:id", deleteSizeType);
router.put("/:id", updateSizeType);

module.exports = router;
