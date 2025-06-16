const express = require("express");
const {
  createAdmin,
  getAdmin,
  getAdminById,
  deleteAdmin,
  updateAdmin,
  sendOTP,
  verifyOTP,
  updateAdminpassword,
} = require("../controllers/adminControllers");

const router = express.Router();

router.post("/", createAdmin);
router.get("/", getAdmin);
router.get("/:id", getAdminById);
router.delete("/:id", deleteAdmin);
router.put("/:id", updateAdmin);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.put("/change-password/:id", updateAdminpassword);

module.exports = router;
