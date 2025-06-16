const { default: mongoose } = require("mongoose");
const Product = require("../models/productModels");
const SearchKeywords = require("../models/searchKeywordsModels");
const MYcart = require("../models/cartModels");
const Gallery = require("../models/galleryModels");
const ProductVariant = require("../models/productVariantModels");
const { Types } = mongoose; // Ensure Mongoose is imported if used

// get all products
const getProduct = async (req, res) => {
  try {
    const productDetails = await Product.find();
    res
      .status(200)
      .json({
        message: "Fetching Data From Product Model is Successfull",
        data: productDetails,
      });
  } catch (error) {
    res.status(500).json({ message: "Error in fetching product ", error });
  }
};
// search prouducts
const searchProducts = async (req, res) => {
  const { query } = req.query;

  if (!query || query.trim().length === 0) {
    return res.status(400).json({ message: "Search query is required" });
  }

  try {
    const productDetails = await Product.aggregate([
      { $match: { qcStatus: 1 } },
      {
        $lookup: {
          from: "productvariantdetails",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$productId", "$$productId"] },
                $text: { $search: query.trim() },
              },
            },
            { $sort: { score: { $meta: "textScore" } } },
          ],
          as: "productVariantDetails",
        },
      },
      {
        $unwind: {
          path: "$productVariantDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "categories",
          let: { categoryId: "$categoryId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$categoryId"] },
                $text: { $search: query.trim() },
              },
            },
          ],
          as: "categoryDetails",
        },
      },
      {
        $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "brand",
          let: { brandId: "$brandId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$brandId"] },
                $text: { $search: query.trim() },
              },
            },
          ],
          as: "brandDetails",
        },
      },
      { $unwind: { path: "$brandDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "searchKeyword",
          let: { variantId: "$productVariantDetails._id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$productVariantId", "$$variantId"] },
                $text: { $search: query.trim() },
              },
            },
          ],
          as: "searchKeywordsDetails",
        },
      },
      {
        $match: {
          $or: [
            { productVariantDetails: { $ne: null } },
            { categoryDetails: { $ne: null } },
            { brandDetails: { $ne: null } },
            { searchKeywordsDetails: { $ne: [] } },
          ],
        },
      },
      {
        $lookup: {
          from: "productimages", // Assuming you have an images collection
          localField: "productVariantDetails._id",
          foreignField: "varientId",
          as: "galleryImages",
        },
      },
      { $unwind: { path: "$galleryImages", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          productId: "$_id",
          productTitle: "$productVariantDetails.productTitle",
          sellingPrice: "$productVariantDetails.sellingPrice",
          mrp: "$productVariantDetails.mrp",
          image: "$galleryImages.photos",
          brandName: "$brandDetails.brandName",
          categoryName: "$categoryDetails.categoryName",
          keywords: "$searchKeywordsDetails.searchKeyword",
          searchScore: { $meta: "textScore" },
        },
      },
      { $sort: { searchScore: -1 } },
      { $limit: 50 },
    ]);

    if (!productDetails || productDetails.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found for the given query." });
    }
    res.status(200).json({
      message: "Search results fetched successfully",
      data: productDetails,
    });
  } catch (error) {
    console.error("Error in searchProducts:", error);
    res
      .status(500)
      .json({ message: "Error searching products", error: error.message });
  }
};

// Search products by name, brand, category, or keywords
const searchProductSuggestions = async (req, res) => {
  const { query } = req.query;
  console.log("Query:", query);

  if (!query || query.trim().length === 0) {
    return res.status(400).json({ message: "Search query is required" });
  }

  try {
    const trimmedQuery = query.trim();
    const regex = new RegExp(`^${trimmedQuery}`, "i");

    const suggestions = await SearchKeywords.aggregate([
      { $match: { searchKeyword: { $regex: regex } } },
      { $project: { suggestion: "$searchKeyword" } },
      { $group: { _id: "$suggestion", suggestion: { $first: "$suggestion" } } },
      { $limit: 5 },
      { $project: { _id: 0, suggestion: 1 } },
    ]);

    const suggestionList = suggestions.map((s) => s.suggestion).filter(Boolean);
    console.log("Suggestions:", suggestionList); // Add this
    res.status(200).json({ suggestions: suggestionList });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res
      .status(500)
      .json({ message: "Error fetching suggestions", error: error.message });
  }
};
// get top groupd category

const getProductsGroupedByTopCategory = async (req, res) => {
  try {
    const productDetails = await Product.aggregate([
      { $match: { qcStatus: 1 } },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $graphLookup: {
          from: "categories",
          startWith: "$categoryDetails.mainCategory",
          connectFromField: "mainCategory",
          connectToField: "_id",
          as: "categoryHierarchy",
          depthField: "depth",
        },
      },
      {
        $addFields: {
          topParentCategory: {
            $cond: {
              if: { $eq: ["$categoryDetails.mainCategory", null] },
              then: "$categoryDetails",
              else: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$categoryHierarchy",
                      cond: { $eq: ["$$this.mainCategory", null] },
                    },
                  },
                  0,
                ],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: "productvariantdetails",
          localField: "_id",
          foreignField: "productId",
          as: "productVariantDetails",
          pipeline: [{ $sort: { sellingPrice: 1 } }, { $limit: 1 }],
        },
      },
      {
        $unwind: {
          path: "$productVariantDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "productimages",
          localField: "productVariantDetails._id",
          foreignField: "varientId",
          as: "galleryImages",
          pipeline: [{ $limit: 1 }],
        },
      },
      { $unwind: { path: "$galleryImages", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "brands",
          localField: "brandId",
          foreignField: "_id",
          as: "brandDetails",
        },
      },
      { $unwind: { path: "$brandDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "sellers",
          localField: "sellerId",
          foreignField: "_id",
          as: "sellerDetails",
        },
      },
      { $unwind: { path: "$sellerDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          productId: "$_id",
          topParentCategoryName: "$topParentCategory.categoryName",
          topParentCategoryId: "$topParentCategory._id",
          productTitle: "$productVariantDetails.productTitle",
          sellingPrice: "$productVariantDetails.sellingPrice",
          mrp: "$productVariantDetails.mrp",
          image: {
            $cond: {
              if: { $ne: ["$galleryImages.photos", null] },
              then: { $concat: ["/api/gallery/image/", { $toString: "$galleryImages.photos" }] },
              else: null
            }
          },
          brandName: "$brandDetails.brandName",
          sellerName: "$sellerDetails.sellerName",
        },
      },
      {
        $group: {
          _id: {
            topParentCategoryId: "$topParentCategoryId",
            topParentCategoryName: "$topParentCategoryName",
          },
          products: {
            $push: {
              productId: "$productId",
              productTitle: "$productTitle",
              sellingPrice: "$sellingPrice",
              mrp: "$mrp",
              image: "$image",
              brandName: "$brandName",
              sellerName: "$sellerName",
              topcategoryId: "$topParentCategoryId",
            },
          },
          productCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          categoryId: "$_id.topParentCategoryId",
          categoryName: "$_id.topParentCategoryName",
          productCount: 1,
          products: 1,
        },
      },
      { $sort: { categoryName: 1 } },
    ]);

    if (!productDetails || productDetails.length === 0) {
      return res.status(404).json({ message: "No products found." });
    }

    res.status(200).json({
      message: "Products grouped by top category fetched successfully",
      data: productDetails,
    });
  } catch (error) {
    console.error("Error in getProductsGroupedByTopCategory:", error);
    res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
};

//  fetch by top category
const getProductBasedOnTopCategory = async (req, res) => {
  const { clickedCategory } = req.body;

  // Validate clickedCategory
  if (!clickedCategory || !Types.ObjectId.isValid(clickedCategory)) {
    return res.status(400).json({ message: "Invalid or missing category ID" });
  }

  try {
    const productDetails = await Product.aggregate([
      // Step 1: Match approved products
      { $match: { qcStatus: 1 } },

      // Step 2: Lookup category details
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true },
      },

      // Step 3: Graph lookup for full category hierarchy
      {
        $graphLookup: {
          from: "categories",
          startWith: "$categoryDetails.mainCategory",
          connectFromField: "mainCategory",
          connectToField: "_id",
          as: "categoryHierarchy",
          depthField: "depth",
        },
      },

      // Step 4: Add top parent category
      {
        $addFields: {
          topParentCategory: {
            $cond: {
              if: { $eq: ["$categoryDetails.mainCategory", null] },
              then: "$categoryDetails",
              else: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$categoryHierarchy",
                      cond: { $eq: ["$$this.mainCategory", null] },
                    },
                  },
                  0,
                ],
              },
            },
          },
        },
      },

      // Step 4.5: Filter by clickedCategory
      {
        $match: {
          "topParentCategory._id": new Types.ObjectId(clickedCategory),
        },
      },

      // Step 5: Lookup one product variant
      {
        $lookup: {
          from: "productvariantdetails",
          localField: "_id",
          foreignField: "productId",
          as: "productVariantDetails",
          pipeline: [{ $sort: { sellingPrice: 1 } }],
        },
      },
      {
        $unwind: {
          path: "$productVariantDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Step 6: Lookup one image
      {
        $lookup: {
          from: "productimages",
          localField: "productVariantDetails._id",
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
      { $unwind: { path: "$galleryImages", preserveNullAndEmptyArrays: true } },

      // Step 7: Lookup color
      {
        $lookup: {
          from: "colors",
          localField: "productVariantDetails.colorId",
          foreignField: "_id",
          as: "colorDetails",
        },
      },
      { $unwind: { path: "$colorDetails", preserveNullAndEmptyArrays: true } },

      // Step 8: Lookup brand and seller
      {
        $lookup: {
          from: "brands",
          localField: "brandId",
          foreignField: "_id",
          as: "brandDetails",
        },
      },
      { $unwind: { path: "$brandDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "sellers",
          localField: "sellerId",
          foreignField: "_id",
          as: "sellerDetails",
        },
      },
      { $unwind: { path: "$sellerDetails", preserveNullAndEmptyArrays: true } },

      // Step 9: Lookup feedback to get ratings
      {
        $lookup: {
          from: "feedbacks",
          localField: "_id",
          foreignField: "productId",
          as: "feedbackDetails",
        },
      },

      // Step 10: Calculate average rating and count
      {
        $addFields: {
          avgRating: { $avg: "$feedbackDetails.rating" },
          ratingCount: { $size: "$feedbackDetails" },
        },
      },

      // Step 11: Project essential fields
      {
        $project: {
          productId: "$_id",
          productVariantId: "$productVariantDetails._id", // Include productVariantId
          topParentCategoryName: "$topParentCategory.categoryName",
          topParentCategoryId: "$topParentCategory._id",
          productTitle: "$productVariantDetails.productTitle",
          sellingPrice: "$productVariantDetails.sellingPrice",
          mrp: "$productVariantDetails.mrp",
          image: {
            $cond: {
              if: { $ne: ["$galleryImages.photos", null] },
              then: { $concat: ["/api/gallery/image/", { $toString: "$galleryImages.photos" }] },
              else: null
            }
          },
          brandName: "$brandDetails.brandName",
          sellerName: "$sellerDetails.sellerName",
          color: "$colorDetails.color",
          avgRating: 1,
          ratingCount: 1,
        },
      },

      // Step 12: Group by top parent category
      {
        $group: {
          _id: {
            topParentCategoryId: "$topParentCategoryId",
            topParentCategoryName: "$topParentCategoryName",
          },
          products: {
            $push: {
              productId: "$productId",
              productVariantId: "$productVariantId", // Include productVariantId
              productTitle: "$productTitle",
              sellingPrice: "$sellingPrice",
              mrp: "$mrp",
              image: "$image",
              brandName: "$brandName",
              sellerName: "$sellerName",
              topcategoryId: "$topParentCategoryId",
              color: "$color",
              avgRating: "$avgRating",
              ratingCount: "$ratingCount",
            },
          },
          productCount: { $sum: 1 },
        },
      },

      // Step 13: Final projection
      {
        $project: {
          _id: 0,
          categoryId: "$_id.topParentCategoryId",
          categoryName: "$_id.topParentCategoryName",
          productCount: 1,
          products: 1,
        },
      },

      // Step 14: Sort
      { $sort: { categoryName: 1 } },
    ]);

    if (!productDetails || productDetails.length === 0) {
      return res.status(404).json({
        message: `No products found for category ID ${clickedCategory}`,
      });
    }

    res.status(200).json({
      message: "Products grouped by top category fetched successfully",
      data: productDetails,
    });
  } catch (error) {
    console.error("Error in getProductsGroupedByTopCategory:", error);
    res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
};

// get cancelled products
const getCancelledProducts = async (req, res) => {
  const { sellerId } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: "Invalid seller ID" });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(String(sellerId));

    const cancelledItems = await MYcart.aggregate([
      // Filter for cancelled cart items (cartStatus: -1)
      { $match: { cartStatus: -1 } },
      // Join with productvariantdetails
      {
        $lookup: {
          from: ProductVariant.collection.name,
          localField: "productvariantId",
          foreignField: "_id",
          as: "productvariantId",
        },
      },
      // Unwind productvariantId to get a single object
      {
        $unwind: {
          path: "$productvariantId",
          preserveNullAndEmptyArrays: false,
        },
      },
      // Join with productdetails
      {
        $lookup: {
          from: Product.collection.name,
          localField: "productvariantId.productId",
          foreignField: "_id",
          as: "productId",
        },
      },
      // Unwind productId
      { $unwind: { path: "$productId", preserveNullAndEmptyArrays: false } },
      // Filter by sellerId
      { $match: { "productId.sellerId": sellerObjectId } },
      // Join with productimage for gallery
      {
        $lookup: {
          from: "productimages",
          localField: "productvariantId._id",
          foreignField: "varientId",
          as: "gallery",
        },
      },
      // Project the required fields
      {
        $project: {
          _id: 1,
          cartQty: 1,
          cartStatus: 1,
          createdAt: 1,
          bookingID: 1,
          cancellationReason: 1, // Include for future use
          productvariantId: {
            _id: "$productvariantId._id",
            productTitle: "$productvariantId.productTitle",
            sellingPrice: "$productvariantId.sellingPrice",
            mrp: "$productvariantId.mrp",
          },
          gallery: {
            $map: { input: "$gallery", as: "g", in: { photos: "$$g.photos" } },
          },
        },
      },
    ]);

    res.status(200).json({ status: 200, data: cancelledItems });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 500,
      data: { message: "Error fetching cancelled products: " + error.message },
    });
  }
};

// get the product by searchkeyword

const getProductsBySearchKeyword = async (req, res) => {
  const { searchKeyword } = req.body;

  // Validate searchKeyword
  if (
    !searchKeyword ||
    typeof searchKeyword !== "string" ||
    searchKeyword.trim().length === 0
  ) {
    return res
      .status(400)
      .json({ message: "Invalid or missing search keyword" });
  }

  try {
    const trimmedKeyword = searchKeyword.trim();
    const regex = new RegExp(`^${trimmedKeyword}`, "i"); // Case-insensitive prefix match

    const productDetails = await SearchKeywords.aggregate([
      // Step 1: Match search keywords
      { $match: { searchKeyword: { $regex: regex } } },

      // Step 2: Lookup product variant details
      {
        $lookup: {
          from: "productvariantdetails",
          localField: "productVariantId",
          foreignField: "_id",
          as: "productVariantDetails",
        },
      },
      {
        $unwind: {
          path: "$productVariantDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Step 3: Lookup product details
      {
        $lookup: {
          from: "productdetails",
          localField: "productVariantDetails.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true },
      },

      // Step 4: Match approved products
      { $match: { "productDetails.qcStatus": 1 } },

      // Step 5: Lookup category details
      {
        $lookup: {
          from: "categories",
          localField: "productDetails.categoryId",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true },
      },

      // Step 6: Graph lookup for full category hierarchy
      {
        $graphLookup: {
          from: "categories",
          startWith: "$categoryDetails.mainCategory",
          connectFromField: "mainCategory",
          connectToField: "_id",
          as: "categoryHierarchy",
          depthField: "depth",
        },
      },

      // Step 7: Add top parent category
      {
        $addFields: {
          topParentCategory: {
            $cond: {
              if: { $eq: ["$categoryDetails.mainCategory", null] },
              then: "$categoryDetails",
              else: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$categoryHierarchy",
                      cond: { $eq: ["$$this.mainCategory", null] },
                    },
                  },
                  0,
                ],
              },
            },
          },
        },
      },

      // Step 8: Lookup one image
      {
        $lookup: {
          from: "productimages",
          localField: "productVariantId",
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
      { $unwind: { path: "$galleryImages", preserveNullAndEmptyArrays: true } },

      // Step 9: Lookup color
      {
        $lookup: {
          from: "colors",
          localField: "productVariantDetails.colorId",
          foreignField: "_id",
          as: "colorDetails",
        },
      },
      { $unwind: { path: "$colorDetails", preserveNullAndEmptyArrays: true } },

      // Step 10: Lookup brand and seller
      {
        $lookup: {
          from: "brands",
          localField: "productDetails.brandId",
          foreignField: "_id",
          as: "brandDetails",
        },
      },
      { $unwind: { path: "$brandDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "sellers",
          localField: "productDetails.sellerId",
          foreignField: "_id",
          as: "sellerDetails",
        },
      },
      { $unwind: { path: "$sellerDetails", preserveNullAndEmptyArrays: true } },

      // Step 11: Lookup feedback to get ratings
      {
        $lookup: {
          from: "feedbacks",
          localField: "productDetails._id",
          foreignField: "productId",
          as: "feedbackDetails",
        },
      },

      // Step 12: Calculate average rating and count
      {
        $addFields: {
          avgRating: { $avg: "$feedbackDetails.rating" },
          ratingCount: { $size: "$feedbackDetails" },
        },
      },

      // Step 13: Project essential fields
      {
        $project: {
          productId: "$productDetails._id",
          productVariantId: "$productVariantId", // Include productVariantId
          topParentCategoryName: "$topParentCategory.categoryName",
          topParentCategoryId: "$topParentCategory._id",
          productTitle: "$productVariantDetails.productTitle",
          sellingPrice: "$productVariantDetails.sellingPrice",
          mrp: "$productVariantDetails.mrp",
          image: {
            $cond: {
              if: { $ne: ["$galleryImages.photos", null] },
              then: { $concat: ["/api/gallery/image/", { $toString: "$galleryImages.photos" }] },
              else: null
            }
          },
          brandName: "$brandDetails.brandName",
          sellerName: "$sellerDetails.sellerName",
          color: "$colorDetails.color",
          avgRating: 1,
          ratingCount: 1,
        },
      },

      // Step 14: Group by productId to remove duplicates
      {
        $group: {
          _id: "$productId",
          productVariantId: { $first: "$productVariantId" }, // Include productVariantId
          topParentCategoryName: { $first: "$topParentCategoryName" },
          topParentCategoryId: { $first: "$topParentCategoryId" },
          productTitle: { $first: "$productTitle" },
          sellingPrice: { $first: "$sellingPrice" },
          mrp: { $first: "$mrp" },
          image: { $first: "$image" },
          brandName: { $first: "$brandName" },
          sellerName: { $first: "$sellerName" },
          color: { $first: "$color" },
          avgRating: { $first: "$avgRating" },
          ratingCount: { $first: "$ratingCount" },
        },
      },

      // Step 15: Group by top parent category
      {
        $group: {
          _id: {
            topParentCategoryId: "$topParentCategoryId",
            topParentCategoryName: "$topParentCategoryName",
          },
          products: {
            $push: {
              productId: "$_id",
              productVariantId: "$productVariantId", // Include productVariantId
              productTitle: "$productTitle",
              sellingPrice: "$sellingPrice",
              mrp: "$mrp",
              image: "$image",
              brandName: "$brandName",
              sellerName: "$sellerName",
              topcategoryId: "$topParentCategoryId",
              color: "$color",
              avgRating: "$avgRating",
              ratingCount: "$ratingCount",
            },
          },
          productCount: { $sum: 1 },
        },
      },

      // Step 16: Final projection

      {
        $project: {
          _id: 0,
          categoryId: "$_id.topParentCategoryId",
          categoryName: "$_id.topParentCategoryName",
          productCount: 1,
          products: 1,
        },
      },

      // Step 17: Sort
      { $sort: { categoryName: 1 } },
    ]);

    if (!productDetails || productDetails.length === 0) {
      return res.status(404).json({
        message: `No products found for search keyword "${trimmedKeyword}"`,
      });
    }

    res.status(200).json({
      message: "Products fetched by search keyword successfully",
      data: productDetails,
    });
  } catch (error) {
    console.error("Error in getProductsBySearchKeyword:", error);
    res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
};

// get approved seller details

const getApprovedProduct = async (req, res) => {
  try {
    const productDetails = await Product.find({
      ListingStatus: 4,
      qcStatus: 1,
    });
    res
      .status(200)
      .json({
        message: "fetching Approved Product details successfull",
        data: productDetails,
      });
  } catch (error) {
    res.status(500).json({ messgae: "Error in fetching Product ", error });
  }
};

// get approved seller details
const getRejectedProduct = async (req, res) => {
  try {
    const productDetails = await Product.find({
      ListingStatus: 4,
      qcStatus: -1,
    });
    res
      .status(200)
      .json({
        message: "fetching Rejected Product details successfull",
        data: productDetails,
      });
  } catch (error) {
    res.status(500).json({ messgae: "Error in fetching Product ", error });
  }
};

// get all product with lisiting status is 4 ad qc status is 0
const getProductToQC = async (req, res) => {
  try {
    const productDetails = await Product.aggregate([
      {
        $match: { ListingStatus: 4, qcStatus: 0 },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: {
          path: "$categoryDetails",
          preserveNullAndEmptyArrays: true, // If no category is found, keep null instead of removing the document
        },
      },
      {
        $lookup: {
          from: "brands",
          localField: "brandId",
          foreignField: "_id",
          as: "brandDetails",
        },
      },

      {
        $unwind: {
          path: "$brandDetails",
          preserveNullAndEmptyArrays: true, // If no category is found, keep null instead of removing the document
        },
      },
      {
        $lookup: {
          from: "sellers",
          localField: "sellerId",
          foreignField: "_id",
          as: "sellerDetails",
        },
      },

      {
        $unwind: {
          path: "$sellerDetails",
          preserveNullAndEmptyArrays: true, // If no category is found, keep null instead of removing the document
        },
      },
      {
        $project: {
          _id: 1,
          sellerId: 1,
          skuId: 1,
          ListingStatus: 1,
          fulfilmentBy: 1,
          qcStatus: 1,
          createdAt: 1,
          updatedAt: 1,
          localDeliveryCharge: 1,
          zonalDeliveryCharge: 1,
          categoryName: "$categoryDetails.categoryName", // Assuming 'name' is the field for category name
          brandName: "$brandDetails.brandName", // Assuming 'name' is the field for brand name
          sellerName: "$sellerDetails.sellerName",
        },
      },
    ]);
    if (!productDetails || productDetails.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found for the given seller ID." });
    }

    res.status(200).json({
      message: "Products fetched successfully",
      data: productDetails,
    });
  } catch (error) {
    console.error("Error in getProductToQC:", error);
    res
      .status(500)
      .json({ message: "Error in fetching product", error: error.message });
  }
};

// get product based on the productId

const getProductByProductId = async (req, res) => {
  const { productId } = req.params;
  try {
    const productDetails = await Product.findById(productId);
    if (!productDetails) {
      return res
        .status(404)
        .json({ message: "Product not found with the given ID." });
    }

    res.status(200).json({
      message: "Product fetched successfully",
      data: productDetails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching product", error });
  }
};

// get product Details by Seller ID
const getProductBySellerID = async (req, res) => {
  const { sellerId } = req.params;

  try {
    // Ensure sellerId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: "Invalid seller ID" });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(String(sellerId));

    const productDetails = await Product.aggregate([
      {
        $match: { sellerId: sellerObjectId, qcStatus: 0 },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $lookup: {
          from: "brand",
          localField: "brandId",
          foreignField: "_id",
          as: "brandDetails",
        },
      },
      {
        $unwind: {
          path: "$categoryDetails",
          preserveNullAndEmptyArrays: true, // If no category is found, keep null instead of removing the document
        },
      },
      {
        $unwind: {
          path: "$brandDetails",
          preserveNullAndEmptyArrays: true, // If no category is found, keep null instead of removing the document
        },
      },
      {
        $project: {
          _id: 1,
          sellerId: 1,
          skuId: 1,
          ListingStatus: 1,
          fulfilmentBy: 1,
          qcStatus: 1,
          createdAt: 1,
          updatedAt: 1,
          categoryName: "$categoryDetails.categoryName", // Assuming 'name' is the field for category name
          brandName: "$brandDetails.brandName", // Assuming 'name' is the field for brand name
        },
      },
    ]);

    if (!productDetails || productDetails.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found for the given seller ID." });
    }

    res.status(200).json({
      message: "Products fetched successfully",
      data: productDetails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching product", error });
  }
};

// get product bY Id
const getProductById = async (req, res) => {
  const { productId } = req.params;

  try {
    const productDetails = await Product.findById(productId).select(
      "ListingStatus sellerId",
    ); // Fetch only required fields

    if (!productDetails) {
      return res
        .status(404)
        .json({ message: "Product not found with the given ID." });
    }

    res.status(200).json({
      message: "Product fetched successfully",
      productDetails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching product", error });
  }
};

// create product when the page loads
const createProduct = async (req, res) => {
  const { sellerId, categoryId } = req.body;

  if (!sellerId || !categoryId) {
    return res
      .status(400)
      .json({ message: "seller must be login or select category properly" });
  }

  try {
    const newProduct = new Product({
      sellerId,
      categoryId,
      ListingStatus: 2,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json({
      message: "product created successfully with category",
      product: savedProduct,
    });
  } catch (error) {
    console.error(error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "server error" });
  }
};

// update Brand Id in to  product

const updateBrandId = async (req, res) => {
  const { productId } = req.params;
  const { brandId } = req.body;

  if (!brandId || !productId) {
    return res.status(400).json({ message: "Please provide Brand Id" });
  }

  try {
    const updatedBrandId = await Product.findByIdAndUpdate(
      productId,
      { brandId: brandId, ListingStatus: 3 },
      { new: true, runValidators: true },
    );

    if (!updatedBrandId) {
      return res.status(404).json({ message: "Product not found" });
    }

    res
      .status(200)
      .json({
        message: "Brand  updated to product successfully",
        product: updatedBrandId,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// update the product Qcstatus
const updateQcStatus = async (req, res) => {
  const { productId } = req.params;
  const { qcStatus } = req.body;

  if (!qcStatus) {
    return res.status(400).json({ message: "Please provide teh Qc status" });
  }

  try {
    const updateData = await Product.findByIdAndUpdate(
      productId,
      { qcStatus: qcStatus },
      { new: true, runValidators: true },
    );

    if (!updateData) {
      return res.status(404).json({ message: "Product  Not Found" });
    }

    res.status(200).json({ message: "Product Approved", data: updateData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// update Skui Id and fulfilement in to  product

const updateSkuidAndFullfilement = async (req, res) => {
  const { productId } = req.params;
  const {
    skuId,
    fulfilmentBy,
    localDeliveryCharge,
    zonalDeliveryCharge,
    ListingStatus,
  } = req.body;

  if (!skuId || !productId || !fulfilmentBy || !ListingStatus) {
    return res
      .status(400)
      .json({ message: "Please provide skuid and fullfilement" });
  }

  try {
    const updatedData = await Product.findByIdAndUpdate(
      productId,
      {
        skuId,
        fulfilmentBy,
        localDeliveryCharge,
        zonalDeliveryCharge,
        ListingStatus: ListingStatus,
      },
      { new: true, runValidators: true },
    );

    if (!updatedData) {
      return res.status(404).json({ message: "Product not found" });
    }

    res
      .status(200)
      .json({
        message: "skuid and fullfilemnt updated to product successfully",
        product: updatedData,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// delete the product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Product Variant   not found" });
    } else {
      res.json({ message: "Product deleted successfully", deleted });
    }
  } catch (error) {
    console.error("Error deleting in Product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createProduct,
  getProduct,
  getProductById,
  updateBrandId,
  getProductBySellerID,
  updateSkuidAndFullfilement,
  deleteProduct,
  getProductByProductId,
  getProductToQC,
  updateQcStatus,
  getApprovedProduct,
  getRejectedProduct,
  getProductsGroupedByTopCategory,
  getProductBasedOnTopCategory,
  searchProducts,
  searchProductSuggestions,
  getProductsBySearchKeyword,
  getCancelledProducts,
};
