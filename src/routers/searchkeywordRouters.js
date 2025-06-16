const express = require("express");
const {
  createSearchKeyword,
  getSearchKeyword,
  getSearchKeyByProductVaraintId,
} = require("../controllers/searchkeywordControllers");

const router = express.Router();

router.post("/", createSearchKeyword);
router.get("/", getSearchKeyword);
router.get(
  "/fetchSearchKeyBYProductVaraintId/:productVariantId",
  getSearchKeyByProductVaraintId,
);

module.exports = router;
