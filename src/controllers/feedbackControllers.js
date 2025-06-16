const express = require("express");
const mongoose = require("mongoose");
const upload = require("../config/multerConfig");
const Feedback = require("../models/feedbackModels");
const multer = require("multer");

const createFeedBack = async (req, res) => {
  try {
    const { rating, title, description, cartId, productId, userId } = req.body;
    const mediaFiles = req.files || [];

    if (!rating || !cartId || !productId || !userId) {
      return res
        .status(400)
        .json({
          message: "Missing required fields: rating, cartId, productId, userId",
        });
    }

    const parsedRating = parseInt(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be a number between 1 and 5" });
    }

    const existingFeedback = await Feedback.findOne({ cartId, userId });
    if (existingFeedback) {
      return res
        .status(400)
        .json({ message: "You have already submitted feedback for this item" });
    }

    if (
      !mongoose.Types.ObjectId.isValid(cartId) ||
      !mongoose.Types.ObjectId.isValid(productId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid cartId, productId, or userId" });
    }

    const media = mediaFiles.map((file) => ({
      url: `/feedback/${file.filename}`,
      type: file.mimetype.startsWith("image") ? "image" : "video",
    }));

    const newFeedback = new Feedback({
      rating: parsedRating,
      title,
      description,
      cartId,
      productId,
      userId,
      media,
    });

    await newFeedback.save();
    res.status(201).json({ message: "Feedback successfully created" });
  } catch (error) {
    console.error("Error creating feedback:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes("Only JPEG, PNG, and MP4 files are allowed")) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res
        .status(400)
        .json({
          message: "Unexpected field name in file upload. Expected 'media'.",
        });
    }
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File size exceeds 5MB limit." });
    }
    return res.status(400).json({ message: err.message });
  }
  next(err);
};

module.exports = { createFeedBack, handleMulterError };
