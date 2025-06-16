const express = require("express");
const {
  createPolicyMethods,
  getPolicyMethods,
  getPolicyMethodById,
  deletePolicyMethod,
  updatePolicyMethod,
} = require("../controllers/policymethodControllers");

const router = express.Router();

router.post("/", createPolicyMethods);
router.get("/", getPolicyMethods);
router.get("/:id", getPolicyMethodById);
router.delete("/:id", deletePolicyMethod);
router.put("/:id", updatePolicyMethod);

module.exports = router;
