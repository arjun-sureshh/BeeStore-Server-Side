const express = require("express");
const mongoose = require("mongoose");
const {
  createGallery,
  getGallery,
  getImagesByProductVaraintId,
} = require("../controllers/galleryControllers");
const { upload, handleMulterError, getGridFSBucket } = require("../config/multerConfig");

const router = express.Router();

// POST /api/gallery
router.post("/", upload, createGallery);

// GET /api/gallery
router.get("/", getGallery);

// GET /api/storage/fetchImagesBYProductVaraintId/:productVariantId
router.get("/fetchImagesBYProductVaraintId/:productVariantId", getImagesByProductVaraintId);

// Stream GridFS image
router.get("/image/:fileId", async (req, res) => {
  console.log("Fetching image for fileId:", req.params.fileId);
  try {
    const { fileId } = req.params;
    if (!mongoose.isValidObjectId(fileId)) {
      return res.status(400).json({ error: "Invalid file ID" });
    }

    const bucket = getGridFSBucket();
    const files = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ error: "Image not found" });
    }

    const file = files[0];
    res.set("Content-Type", file.contentType || "application/octet-stream");
    res.set("Content-Length", file.length);

    const readStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
    readStream.on("error", (error) => {
      console.error("Error streaming GridFS file:", error);
      res.status(500).json({ error: "Failed to stream image" });
    });
    readStream.pipe(res);
  } catch (error) {
    console.error("Error in image streaming endpoint:", error);
    res.status(500).json({ error: "Failed to fetch image", details: error.message });
  }
});
module.exports = router;