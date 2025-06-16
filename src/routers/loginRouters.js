const express = require("express");
const { Login, getLogin } = require("../controllers/loginControllers");
const auth = require("../config/auth");

const router = express.Router();

router.post("/", Login);
router.get("/", auth, getLogin);

module.exports = router;
