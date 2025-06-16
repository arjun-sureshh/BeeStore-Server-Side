const express = require("express");
const {
  createFeedBack,
  
} = require("../controllers/feedbackControllers");
const {upload,handleMulterError} = require("../config/multerConfig");

const router = express.Router();

router.post("/", upload, handleMulterError, createFeedBack);

module.exports = router;
