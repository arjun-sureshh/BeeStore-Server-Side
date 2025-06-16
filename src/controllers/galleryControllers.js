const { default: mongoose } = require("mongoose");
const Gallery = require("../models/galleryModels");
const { uploadToGridFS, getGridFSBucket } = require("../config/multerConfig");

// Gallery Get
const getGallery = async (req, res) => {
  try {
    const photoDetails = await Gallery.find();
    const imageData = photoDetails.map((image) => ({
      _id: image._id,
      filename: image.filename,
      fileId: image.photos,
      photos: `${req.protocol}://${req.get("host")}/api/gallery/file/${image.photos}`,
    }));
    res.status(200).json({ message: "Gallery fetched successfully", data: imageData });
  } catch (error) {
    res.status(500).json({ message: "Error fetching gallery", error });
  }
};

// product images get by varaint Id
const getImagesByProductVaraintId = async (req, res) => {
  const { productVariantId } = req.params;

  console.log("Received productVariantId:", productVariantId); // Debugging log

  try {
    const productImageDetails = await Gallery.find({
      varientId: productVariantId,
    });
    console.log("Query Result:", productImageDetails); // Debugging log

    if (!productImageDetails.length) {
      return res
        .status(404)
        .json({ message: "Product Images not found with the given ID." });
    }

    const imageData = productImageDetails.map((image) => ({
      _id: image._id,
      filename: image.filename,
      fileId: image.photos,
      photos: `${req.protocol}://${req.get("host")}/api/gallery/file/${image.photos}`,
    }));

    res.status(200).json({
      message: "Product Images fetched successfully",
      data: imageData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching product Images", error });
  }
};

// Gallery Post

const createGallery = async (req, res) => {
  try {
    console.log("createGallery called with:", {
      files: req.files?.map(f => ({
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size
      })),
      body: req.body
    });

    if (!req.files || req.files.length === 0) {
      console.log("No files uploaded");
      return res.status(400).json({ error: "No files uploaded" });
    }

    const { productVariantId } = req.body;
    if (!productVariantId || !mongoose.isValidObjectId(productVariantId)) {
      console.log("Invalid or missing productVariantId:", productVariantId);
      return res.status(400).json({ error: "Valid Product Variant ID is required" });
    }

    const bucket = getGridFSBucket();
    const uploadedFiles = [];

    console.log("Raw req.files:", req.files);

    for (const file of req.files) {
      try {
        const result = await uploadToGridFS(file, bucket);
        console.log("GridFS upload result:", result);
        if (!result.id || !result.filename) {
          console.error("Invalid GridFS result for file:", file.originalname, result);
          continue; // Skip invalid files
        }
        uploadedFiles.push({
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          gridfsId: result.id,
          filename: result.filename
        });
      } catch (error) {
        console.error("Error uploading file to GridFS:", file.originalname, error);
        continue; // Skip failed files
      }
    }

    console.log("Processing files:", uploadedFiles);

    if (uploadedFiles.length === 0) {
      console.log("No valid files uploaded");
      return res.status(400).json({ error: "No valid files uploaded" });
    }

    // Save one document per file to productimage collection
    const savedDocuments = [];
    for (const file of uploadedFiles) {
      const gallery = new Gallery({
        photos: file.gridfsId,
        filename: file.filename,
        varientId: productVariantId
      });
      await gallery.save();
      savedDocuments.push(gallery);
    }

    console.log("Gallery documents saved:", savedDocuments);

    res.json({
      message: "Files uploaded successfully",
      files: uploadedFiles.map(file => ({
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        gridfsId: file.gridfsId,
        filename: file.filename
      }))
    });
  } catch (error) {
    console.error("Error in createGallery:", error);
    res.status(500).json({ error: "Failed to create gallery", details: error.message });
  }
};

module.exports = {
  createGallery,
  getGallery,
  getImagesByProductVaraintId,
};