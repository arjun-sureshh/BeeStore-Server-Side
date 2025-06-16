const express = require("express");
const {
  getAddress,
  sellerAddress,
  getAddressBySellerIds,
  getAddressByuserId,
  userAddress,
  deleteAddress,
  getAddressById,
  updateUserAddress,
} = require("../controllers/addressControllers");

const router = express.Router();

router.post("/seller", sellerAddress);
router.post("/user", userAddress);
router.put("/user/:id", updateUserAddress);
router.get("/", getAddress);
router.get("/getAddress/:id", getAddressById);
router.get("/getByUserId/:userId", getAddressByuserId);
router.post("/getBySellerIds", getAddressBySellerIds);
router.delete("/:id", deleteAddress);

module.exports = router;
