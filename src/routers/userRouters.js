const express = require("express");
const {
  createUser,
  getUser,
  getUserByUserId,
  updateUserDetails,
  checkUserEmail,
  sendOTP,
  verifyOTP,
  resetPassword,
} = require("../controllers/userControllers");

const router = express.Router();

router.post("/", createUser);
router.put("/:userId", updateUserDetails);
router.get("/", getUser);
router.get("/FetchDataByUserId/:userId", getUserByUserId);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/check-email", checkUserEmail);
router.post("/reset-password", resetPassword);

module.exports = router;
