const { default: mongoose } = require("mongoose");
const userView = require("../models/userViewModels");

// Get User Views
// Get User Views
const getUserView = async (req, res) => {
  const userId = req.userId; // From auth middleware

  if (req.userType !== "user") {
    return res
      .status(403)
      .json({ msg: "Only users can view their product history" });
  }

  try {
    const productViews = await userView.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(String(userId)) } },
      { $sort: { createdAt: -1 } }, // Latest first
      { $group: { _id: "$productId", createdAt: { $first: "$createdAt" } } }, // Deduplicate
      { $sort: { createdAt: -1 } },
      { $limit: 10 }, // 10 unique products
      {
        $lookup: {
          from: "productdetails",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      // Lookup one product variant
      {
        $lookup: {
          from: "productvariantdetails",
          localField: "product._id",
          foreignField: "productId",
          as: "variant",
          pipeline: [{ $sort: { sellingPrice: 1 } }, { $limit: 1 }],
        },
      },
      { $unwind: { path: "$variant", preserveNullAndEmptyArrays: true } },
      // Lookup one image
      {
        $lookup: {
          from: "productimages",
          localField: "variant._id",
          foreignField: "varientId",
          as: "image",
          pipeline: [{ $limit: 1 }],
        },
      },
      { $unwind: { path: "$image", preserveNullAndEmptyArrays: true } },
      // Lookup brand and seller
      {
        $lookup: {
          from: "brands",
          localField: "product.brandId",
          foreignField: "_id",
          as: "brand",
        },
      },
      { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "sellers",
          localField: "product.sellerId",
          foreignField: "_id",
          as: "seller",
        },
      },
      { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
      // Project fields to match Product type
      {
        $project: {
          productId: "$product._id",
          productTitle: "$variant.productTitle",
          sellingPrice: "$variant.sellingPrice",
          mrp: "$variant.mrp",
          image: "$image.photos",
          brandName: "$brand.brandName",
          sellerName: "$seller.sellerName",
          topcategoryId: "$product.categoryId",
        },
      },
    ]);

    if (!productViews.length) {
      return res.status(200).json({
        message: "No viewed products found",
        data: [],
      });
    }

    res.status(200).json({
      message: "Recently viewed products fetched successfully",
      data: productViews,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching viewed products", error });
  }
};

const createUserView = async (req, res) => {
  const { productId } = req.body;
  const userId = req.userId; // From JWT middleware

  if (!productId) {
    return res.status(400).json({ message: "productId is required" });
  }

  try {
    // Optional: Verify product exists
    const product = await mongoose.model("productdetails").findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const newView = new userView({
      userId: new mongoose.Types.ObjectId(userId),
      productId: new mongoose.Types.ObjectId(productId),
    });
    await newView.save();

    res.status(201).json({
      message: "Product view recorded successfully",
      data: newView,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error recording view", error });
  }
};

module.exports = {
  getUserView,
  createUserView,
};
