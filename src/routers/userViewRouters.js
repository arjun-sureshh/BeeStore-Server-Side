const express = require("express");
const {
  getUserView,
  createUserView,
} = require("../controllers/userViewControllers");
const authenticate = require("../config/authUser");

const router = express.Router();

router.get("/", authenticate, getUserView);
router.post("/", authenticate, createUserView);

module.exports = router;
