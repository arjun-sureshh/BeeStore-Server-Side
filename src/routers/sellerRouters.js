const express = require("express");
const {
  createSeller,
  getSeller,
  updateNametoSeller,
  getSellerById,
  updateBankDetailstoSeller,
  sendOTP,
  verifyOTP,
  updateQcStatus,
  getApprovedSeller,
  getRejectedSeller,
  checkSellerEmail,
  resetPassword,
} = require("../controllers/sellerControllers");

const router = express.Router();

router.post("/", createSeller);
router.get("/", getSeller);
router.post("/check-email", checkSellerEmail);
router.post("/reset-password", resetPassword);
router.get("/ApprovedSeller", getApprovedSeller);
router.get("/RejectedSeller", getRejectedSeller);
router.get("/:sellerId", getSellerById);
router.put("/updateName/:sellerId", updateNametoSeller);
router.put("/bankDetails/:sellerId", updateBankDetailstoSeller);
router.put("/approved/:sellerId", updateQcStatus);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

module.exports = router;
