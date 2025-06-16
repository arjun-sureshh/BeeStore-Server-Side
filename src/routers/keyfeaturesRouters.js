const express = require("express");
const {
  createKeyFeatures,
  getKeyFeatures,
  getKeyFeaturesByProductVaraintId,
} = require("../controllers/keyfeatureControllers");

const router = express.Router();

router.post("/", createKeyFeatures);
router.get("/", getKeyFeatures);
router.get(
  "/fetchKeyFeaturesBYProductVaraintId/:productVariantId",
  getKeyFeaturesByProductVaraintId,
);

module.exports = router;
