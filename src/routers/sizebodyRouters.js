const express = require("express");
const {
  createSizeBody,
  getSizeBody,
  getSizeyByProductVaraintId,
} = require("../controllers/sizebodyControllers");

const router = express.Router();

router.post("/", createSizeBody);
router.get("/", getSizeBody);
router.get(
  "/fetchSizeBYProductVaraintId/:productVariantId",
  getSizeyByProductVaraintId,
);

module.exports = router;
