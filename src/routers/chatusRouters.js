const express = require("express");
const { createchat, getChat } = require("../controllers/chatusControllers");

const router = express.Router();

router.post("/", createchat);
router.get("/", getChat);

module.exports = router;
