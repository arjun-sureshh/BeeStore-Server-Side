require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const connectDB = require("./config/db");
const app = express();

app.use(express.json());
app.use(cors({
  origin: ["https://bee-store-rho.vercel.app", "http://localhost:5173"], // Add localhost for development
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true, // If you use cookies or auth headers
  allowedHeaders: ["Content-Type", "Authorization"]
}));

connectDB()
  .then(() => {
    console.log("MongoDB connected successfully");

    // Middleware to check MongoDB connection
    app.use((req, res, next) => {
      if (mongoose.connection.readyState !== 1) {
        return res.status(500).json({ error: "MongoDB not connected" });
      }
      next();
    });

    const { handleMulterError } = require("./config/multerConfig");

    // Routers
    app.use("/api/admin", require("./routers/adminRouters"));
    app.use("/api/user", require("./routers/userRouters"));
    app.use("/api/seller", require("./routers/sellerRouters"));
    app.use("/api/category", require("./routers/categoryRouters"));
    app.use("/api/color", require("./routers/colorRouters"));
    app.use("/api/brand", require("./routers/brandRouters"));
    app.use("/api/district", require("./routers/districtRouters"));
    app.use("/api/policymethod", require("./routers/policymethodRouters"));
    app.use("/api/paymentmethod", require("./routers/paymentmethodRouters"));
    app.use("/api/sizehead", require("./routers/sizeheadRouters"));
    app.use("/api/sizebody", require("./routers/sizebodyRouters"));
    app.use("/api/feedback", require("./routers/feedbackRouters"));
    app.use("/api/address", require("./routers/addressRouters"));
    app.use("/api/gallery", require("./routers/galleryRouters"));
    app.use("/api/keyfeatures", require("./routers/keyfeaturesRouters"));
    app.use("/api/product", require("./routers/productRouters"));
    app.use("/api/searchkeyword", require("./routers/searchkeywordRouters"));
    app.use("/api/productvaraint", require("./routers/productvariantRouters"));
    app.use("/api/productstock", require("./routers/productstockRouters"));
    app.use("/api/booking", require("./routers/bookingRouters"));
    app.use("/api/wishlist", require("./routers/wishlistRouters"));
    app.use("/api/cart", require("./routers/cartRouters"));
    app.use("/api/chatus", require("./routers/chatusRouters"));
    app.use("/api/Login", require("./routers/loginRouters"));
    app.use("/api/specification", require("./routers/specificationRouters"));
    app.use("/api/auth", require("./routers/authRouter"));
    app.use("/api/userView", require("./routers/userViewRouters"));
    app.use("/api/productUpload", require("./routers/productUploadRouters"));

 app.get("/test-demo", async (req, res) => {
  try {
    const msg="hello backedn connected"
    res.status(200).json(msg);
  } catch (error) {
    console.error("Error in grouped-by-category:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

    // app.use(handleMulterError);

    // Global error handler
    app.use((err, req, res, next) => {
      console.error("Global error:", err);
      res.status(500).json({ error: "Internal Server Error", details: err.message });
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
    // process.exit(1);
  });

module.exports = app;