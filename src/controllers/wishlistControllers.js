const mongoose = require("mongoose");
const Wishlist = require("../models/wishlistModels");
const ProductVariant = require("../models/productVariantModels");

// Get wishlist items for a user with variant and image details
const getWishlist = async (req, res) => {
  const { userId } = req.query;

  console.log("Fetching wishlist for userId:", userId); // Debug

  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.status(400).json({
      success: false,
      message: "Valid userId is required",
    });
  }

  try {
    const wishlistItems = await Wishlist.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(String(userId)) } },
      // Join with ProductVariant
      {
        $lookup: {
          from: "productvariantdetails",
          localField: "varientId",
          foreignField: "_id",
          as: "variantDetails",
        },
      },
      {
        $unwind: { path: "$variantDetails", preserveNullAndEmptyArrays: true },
      },
      // Join with Gallery for one image
      {
        $lookup: {
          from: "productimages",
          localField: "varientId",
          foreignField: "varientId",
          as: "galleryImages",
         pipeline: [
            { $sort: { createdAt: 1 } },
            { $limit: 1 },
            // Include productVariantId in the image projection
            { $project: { photos: 1, varientId: 1 } },
          ],
        },
      },
      {
        $unwind: { path: "$galleryImages", preserveNullAndEmptyArrays: true },
      },
      // Join with Feedback to get ratings
      {
        $lookup: {
          from: "feedbacks",
          localField: "variantDetails.productId",
          foreignField: "productId",
          as: "feedback",
        },
      },
      // Join with ProductStock
      {
        $lookup: {
          from: "productstocks",
          localField: "varientId",
          foreignField: "productvariantId",
          as: "productstockDetails",
        },
      },
      {
        $unwind: {
          path: "$productstockDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Project the required fields
      {
        $project: {
          varientId: "$varientId",
          productName: {
            $ifNull: ["$variantDetails.productTitle", "Unknown Product"],
          },
          image: {
            $cond: {
              if: { $ne: ["$galleryImages.photos", null] },
              then: { $concat: ["/api/gallery/image/", { $toString: "$galleryImages.photos" }] },
              else: "/default-image.jpg",
            },
          },
          minimumQty: "$variantDetails.minimumOrderQty",
          productstock: "$productstockDetails.stockqty",
          sellingPrice: {
            $ifNull: [{ $toString: "$variantDetails.sellingPrice" }, "0"],
          },
          MRP: { $ifNull: [{ $toString: "$variantDetails.mrp" }, "0"] },
          offerPer: {
            $ifNull: [
              {
                $toString: {
                  $round: [
                    {
                      $multiply: [
                        {
                          $divide: [
                            {
                              $subtract: [
                                "$variantDetails.mrp",
                                "$variantDetails.sellingPrice",
                              ],
                            },
                            "$variantDetails.mrp",
                          ],
                        },
                        100,
                      ],
                    },
                    0,
                  ],
                },
              },
              "0",
            ],
          },
          productRating: {
            $ifNull: [
              {
                $toString: {
                  $round: [
                    { $avg: "$feedback.rating" },
                    1,
                  ],
                },
              },
              "0",
            ],
          },
          totalOrders: {
            $ifNull: [{ $toString: { $size: "$feedback" } }, "0"],
          },
        },
      },
    ]);


    if (!wishlistItems || wishlistItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No wishlist items found for this user",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Wishlist fetched successfully",
      data: wishlistItems,
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching wishlist",
      error: error.message,
    });
  }
};

// Check if a specific item is in the user's wishlist
const getWishlistStatus = async (req, res) => {
  const { userId, varientId } = req.query;
  if (!userId || !varientId) {
    return res.status(400).json({
      success: false,
      message:
        `Missing required fields: ${!userId ? "userId" : ""} ${!varientId ? "varientId" : ""}`.trim(),
    });
  }
  try {
    const existingWishlist = await Wishlist.findOne({ userId, varientId });
    res.status(200).json({
      success: true,
      isInWishlist: !!existingWishlist,
    });
  } catch (error) {
    console.error("Error checking wishlist status:", error);
    res.status(500).json({
      success: false,
      message: "Error checking wishlist status",
      error,
    });
  }
};

// Add to wishlist
const createWishlist = async (req, res) => {
  const { userId, varientId } = req.body;
  if (!userId || !varientId) {
    console.log("Validation failed: Missing fields", { userId, varientId });
    return res.status(400).json({
      success: false,
      message:
        `Missing required fields: ${!userId ? "userId" : ""} ${!varientId ? "varientId" : ""}`.trim(),
    });
  }
  try {
    const existingWishlist = await Wishlist.findOne({ userId, varientId });
    if (existingWishlist) {
      console.log("Wishlist item already exists:", { userId, varientId });
      return res.status(200).json({
        success: false,
        message: "Item already in wishlist",
      });
    }
    const wishlist = await Wishlist.create({ userId, varientId });
    console.log("Wishlist item created:", wishlist);
    res.status(201).json({
      success: true,
      message: "Added to wishlist",
      data: wishlist,
    });
  } catch (error) {
    console.error("Error creating wishlist item:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add to wishlist",
    });
  }
};

// Remove from wishlist
const deleteWishlist = async (req, res) => {
  const { userId, varientId } = req.body;
  if (!userId || !varientId) {
    console.log("Validation failed: Missing fields", { userId, varientId });
    return res.status(400).json({
      success: false,
      message:
        `Missing required fields: ${!userId ? "userId" : ""} ${!varientId ? "varientId" : ""}`.trim(),
    });
  }
  try {
    const deletedWishlist = await Wishlist.findOneAndDelete({
      userId,
      varientId,
    });
    if (!deletedWishlist) {
      console.log("Wishlist item not found:", { userId, varientId });
      return res.status(404).json({
        success: false,
        message: "Item not found in wishlist",
      });
    }
    console.log("Wishlist item deleted:", deletedWishlist);
    res.status(200).json({
      success: true,
      message: "Removed from wishlist",
    });
  } catch (error) {
    console.error("Error deleting wishlist item:", error);
    res.status(500).json({
      success: false,
      message: "Error removing from wishlist",
      error,
    });
  }
};

module.exports = {
  createWishlist,
  getWishlist,
  getWishlistStatus,
  deleteWishlist,
};
