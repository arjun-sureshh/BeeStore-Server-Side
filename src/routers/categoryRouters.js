const express = require("express");
const {
  createCategory,
  getCategory,
  getCategoryById,
  deleteCategory,
  updateCategory,
  searchCategory,
  select_Categories,
} = require("../controllers/categoryControllers");

const router = express.Router();

router.post("/", createCategory);
router.get("/", getCategory);
router.get("/:id", getCategoryById);
router.get("/search/:searchData", searchCategory);
router.delete("/:id", deleteCategory);
router.put("/:id", updateCategory);
router.get("/select-categories", select_Categories);

module.exports = router;
