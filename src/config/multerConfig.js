const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is not defined in .env file");
}

// Use memory storage for Multer
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  console.log("fileFilter received file:", {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    encoding: file.encoding,
    size: file.size || "unknown"
  });
  if (!file || !file.originalname || !file.mimetype) {
    console.error("Invalid file object in fileFilter:", file);
    return cb(new Error("Invalid file data"), false);
  }
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "video/mp4",
    "image/webp",
    "image/avif",
    "image/gif",
    "image/bmp",
    "image/tiff",
    "video/mpeg",
    "video/webm"
  ];
  if (!allowedTypes.includes(file.mimetype)) {
    console.error("File rejected:", file.originalname);
    return cb(new Error("Only JPEG, PNG, MP4, WebP, AVIF, GIF, BMP, TIFF, MPEG, and WebM files are allowed!"), false);
  }
  console.log(`File accepted: ${file.originalname}, type: ${file.mimetype}, size: ${file.size || "unknown"} bytes`);
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 }
}).array("photos");

const handleMulterError = (err, req, res, next) => {
  console.error("Multer error:", err);
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "One or more files exceed the 10MB limit." });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ error: "Too many files. Maximum is 5." });
    }
    return res.status(400).json({ error: `Multer error: ${err.message}` });
  }
  if (err.message) {
    return res.status(400).json({ error: err.message });
  }
  return res.status(400).json({
    error: "File upload error",
    details: err.message || "Unknown error"
  });
};

// Manual GridFS upload function
const uploadToGridFS = async (file, bucket) => {
  console.log("Starting GridFS upload for file:", file.originalname);
  const prefix = file.mimetype.startsWith("image") ? "image" : file.mimetype.startsWith("video") ? "video" : "file";
  const filename = `${prefix}-${Date.now()}${path.extname(file.originalname)}`;
  const writeStream = bucket.openUploadStream(filename, {
    contentType: file.mimetype,
    metadata: {
      originalname: file.originalname,
      mimetype: file.mimetype
    }
  });

  return new Promise((resolve, reject) => {
    writeStream.on("finish", () => {
      console.log("GridFS writeStream finished for:", filename, "ID:", writeStream.id);
      if (!writeStream.id) {
        const error = new Error("GridFS writeStream ID is undefined");
        console.error(error);
        reject(error);
        return;
      }
      resolve({ id: writeStream.id, filename, size: file.size });
    });
    writeStream.on("error", (error) => {
      console.error("GridFS writeStream error for:", filename, error);
      reject(error);
    });
    writeStream.write(file.buffer, (error) => {
      if (error) {
        console.error("Error writing buffer to GridFS:", filename, error);
        reject(error);
        return;
      }
      console.log("Buffer written, ending writeStream for:", filename);
      writeStream.end();
    });
  });
};

// Get GridFS bucket
const getGridFSBucket = () => {
  if (mongoose.connection.readyState !== 1) {
    console.error("MongoDB connection not established");
    throw new Error("MongoDB connection not established");
  }
  console.log("Creating GridFSBucket for Uploads");
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "Uploads"
  });
};

module.exports = { upload, handleMulterError, uploadToGridFS, getGridFSBucket };