const express = require("express");
const {
  getSearchKeyword,
  getSearchKeyByProductVaraintId,
  createSpecification,
} = require("../controllers/specificationControllers");

const router = express.Router();

router.post("/", createSpecification);
// router.get('/',getSearchKeyword);
// router.get('/fetchSearchKeyBYProductVaraintId/:productVariantId',getSearchKeyByProductVaraintId);

module.exports = router;
