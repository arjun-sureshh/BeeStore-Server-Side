const { default: mongoose } = require("mongoose");
const ProductVariant = require("../models/productVariantModels");
const SearchKeywords = require("../models/searchKeywordsModels");
const Specification = require("../models/productSpecification");
const { string } = require("joi");

// product get
const getProductVariant = async (req, res) => {
  try {
    const productvariantDetails = await ProductVariant.find();
    res.status(200).json(productvariantDetails);
  } catch (error) {
    res.status(500).json({ message: "Error in fetching product ", error });
  }
};

// get the Varaint by ProductId to QC department
const getVariantToQC = async (req, res) => {
  const { productIds } = req.body; // Expecting an array from frontend

  if (!productIds || !Array.isArray(productIds)) {
    return res.status(400).json({ message: "Invalid Product IDs" });
  }

  try {
    const productVariantDetails = await ProductVariant.find({
      productId: { $in: productIds },
    });

    res
      .status(200)
      .json({
        message: "Fetching Product Variant successful",
        data: productVariantDetails,
      });
  } catch (error) {
    res.status(500).json({ message: "Error fetching Product Variant ", error });
  }
};

// get product based on the productId

const getVaraintByID = async (req, res) => {
  const { productVaraintId } = req.params;
  console.log(productVaraintId);

  try {
    const productDetails = await ProductVariant.findById(productVaraintId);
    if (!productDetails) {
      return res
        .status(404)
        .json({ message: "Product Varaint not found with the given ID." });
    }

    res.status(200).json({
      message: "Product Variant fetched successfully",
      data: productDetails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching product Varaint", error });
  }
};

// get product varaint by the product id  based on the productId

const getVaraintByPrID = async (req, res) => {
  const { productId } = req.params;

  try {
    const productDetails = await ProductVariant.find({ productId: productId });
    if (!productDetails) {
      return res
        .status(404)
        .json({ message: "Product Varaint not found with the given ID." });
    }

    res.status(200).json({
      message: "Product Variant fetched successfully",
      data: productDetails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching product Varaint", error });
  }
};

// get product Details by Seller ID

const getVaraintByProductID = async (req, res) => {
  const { productId } = req.params;

  try {
    // Ensure productId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid Product ID" });
    }

    const productObjectId = new mongoose.Types.ObjectId(String(productId));

    const productVariantDetails = await ProductVariant.aggregate([
      {
        $match: {
          productId: productObjectId,
        },
      },
      // Lookup product details (one-to-one)
      {
        $lookup: {
          from: "productdetails",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Lookup color details (one-to-one)
      {
        $lookup: {
          from: "colors",
          localField: "colorId",
          foreignField: "_id",
          as: "colorDetails",
        },
      },
      {
        $unwind: {
          path: "$colorDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Lookup category details (one-to-one)
      {
        $lookup: {
          from: "categories",
          localField: "productDetails.categoryId",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: {
          path: "$categoryDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Lookup brand details (one-to-one)
      {
        $lookup: {
          from: "brands",
          localField: "productDetails.brandId",
          foreignField: "_id",
          as: "brandDetails",
        },
      },
      {
        $unwind: {
          path: "$brandDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Lookup stock details (one-to-one)
      {
        $lookup: {
          from: "productstocks",
          localField: "_id",
          foreignField: "productvariantId",
          as: "stockDetails",
        },
      },
      {
        $unwind: {
          path: "$stockDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Lookup images (one-to-many, keep as array)
      {
        $lookup: {
          from: "productimage",
          localField: "_id",
          foreignField: "varientId",
          as: "galleryDetails",
        },
      },
      // Lookup specifications (one-to-many, keep as array)
      {
        $lookup: {
          from: "productSpecification",
          localField: "_id",
          foreignField: "productVariantId",
          as: "specificationDetails",
        },
      },
      // Lookup sizes (one-to-many, keep as array)
      {
        $lookup: {
          from: "sizeBody",
          localField: "_id",
          foreignField: "productVariantId",
          as: "sizeDetails",
        },
      },
      // Lookup search keywords (one-to-many, keep as array)
      {
        $lookup: {
          from: "searchKeyword",
          localField: "_id",
          foreignField: "productVariantId",
          as: "searchKeywordsDetails",
        },
      },
      // Lookup features (one-to-many, keep as array)
      {
        $lookup: {
          from: "features",
          localField: "_id",
          foreignField: "productVariantId",
          as: "featuresDetails",
        },
      },
      // Project the desired fields
      {
        $project: {
          ProductVariantId: "$_id",
          mrp: 1,
          sellingPrice: 1,
          productDiscription: 1,
          productTitle: 1,
          minimumOrderQty: 1,
          shippingProvider: 1,
          Length: 1,
          breadth: 1,
          height: 1,
          weight: 1,
          hsnCode: 1,
          taxCode: 1,
          countryOfOrgin: 1,
          manufactureDetails: 1,
          packerDetails: 1,
          procurementSLA: 1,
          procurementType: 1,
          intheBox: 1,
          warrantyPeriod: 1,
          warantySummary: 1,
          colorId: 1,
          colorName: "$colorDetails.color",
          fulfilmentBy: "$productDetails.fulfilmentBy",
          skuId: "$productDetails.fulfilmentBy",
          localDeliveryCharge: "$productDetails.fulfilmentBy",
          fulfilmentBy: "$productDetails.fulfilmentBy",

          brandName: "$brandDetails.brandName",
          categoryName: "$categoryDetails.categoryName",
          productId: "$productDetails._id",
          stockqty: "$stockDetails.stockqty",
          images: "$galleryDetails.photos", // Array of photos
          searchKeywords: "$searchKeywordsDetails.searchKeyword", // Array of keywords
          specification: "$specificationDetails.specification", // Array of specifications
          size: {
            $map: {
              input: "$sizeDetails",
              as: "size",
              in: {
                size: "$$size.size",
                sizehead_Id: "$$size.sizeHeadNameId",
              },
            },
          },
          features: {
            $map: {
              input: "$featuresDetails",
              as: "feature",
              in: {
                title: "$$feature.featureTitle",
                content: "$$feature.featureContent",
              },
            },
          },
          // featureTitle: "$featuresDetails.featureTitle", // Array of feature titles
          // featureContent: "$featuresDetails.featureContent" // Array of feature contents
        },
      },
    ]);

    if (!productVariantDetails || productVariantDetails.length === 0) {
      return res
        .status(404)
        .json({
          message: "No product variants found for the given product ID.",
        });
    }

    res.status(200).json({
      message: "Product variants fetched successfully",
      data: productVariantDetails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching product variants", error });
  }
};

// get product varaint to the single product view

const getproductforSingleView = async (req, res) => {
  const { productId } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid Product ID" });
    }

    const productObjectId = new mongoose.Types.ObjectId(String(productId));

    const productVariantDetails = await ProductVariant.aggregate([
      { $match: { productId: productObjectId } },
      {
        $lookup: {
          from: "productdetails",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "colors",
          localField: "colorId",
          foreignField: "_id",
          as: "colorDetails",
        },
      },
      { $unwind: { path: "$colorDetails", preserveNullAndEmptyArrays: true } },
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
          from: "productstocks",
          localField: "_id",
          foreignField: "productvariantId",
          as: "stockDetails",
        },
      },
      { $unwind: { path: "$stockDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "productimages",
          localField: "_id",
          foreignField: "varientId",
          as: "galleryDetails",
        },
      },
      {
        $lookup: {
          from: "productspecifications",
          localField: "_id",
          foreignField: "productVariantId",
          as: "specificationDetails",
        },
      },
      {
        $lookup: {
          from: "sizebodies",
          localField: "_id",
          foreignField: "productVariantId",
          as: "sizeDetails",
        },
      },
      {
        $lookup: {
          from: "searchkeywords",
          localField: "_id",
          foreignField: "productVariantId",
          as: "searchKeywordsDetails",
        },
      },
      {
        $lookup: {
          from: "features",
          localField: "_id",
          foreignField: "productVariantId",
          as: "featuresDetails",
        },
      },
      // Fetch feedback for the productId
      {
        $lookup: {
          from: "feedbacks",
          localField: "productId",
          foreignField: "productId",
          as: "feedbackDetails",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "userDetails",
              },
            },
            {
              $unwind: {
                path: "$userDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                rating: 1,
                title: 1,
                description: 1,
                media: 1,
                userId: 1,
                userName: "$userDetails.userName",
                createdAt: 1,
              },
            },
          ],
        },
      },
      // Compute average rating and total feedback count
      {
        $addFields: {
          averageRating: { $avg: "$feedbackDetails.rating" },
          totalFeedback: { $size: "$feedbackDetails" },
        },
      },
      {
        $project: {
          variantId: "$_id",
          mrp: 1,
          sellingPrice: 1,
          productDescription: "$productDiscription",
          productTitle: 1,
          minimumOrderQty: 1,
          shippingProvider: 1,
          length: "$Length",
          breadth: 1,
          height: 1,
          weight: 1,
          hsnCode: 1,
          taxCode: 1,
          countryOfOrigin: "$countryOfOrgin",
          manufactureDetails: 1,
          packerDetails: 1,
          procurementSLA: 1,
          procurementType: 1,
          inTheBox: "$intheBox",
          warrantyPeriod: 1,
          warrantySummary: "$warantySummary",
          colorId: 1,
          colorName: "$colorDetails.color",
          brandName: "$brandDetails.brandName",
          categoryName: "$categoryDetails.categoryName",
          productId: "$productDetails._id",
          stockQty: "$stockDetails.stockqty",
          images: {
            $map: {
              input: "$galleryDetails",
              as: "gallery",
              in: {
                $cond: {
                  if: { $ne: ["$$gallery.photos", null] },
                  then: { $concat: ["/api/gallery/image/", { $toString: "$$gallery.photos" }] },
                  else: null
                }
              }
            }
          },
          specifications: "$specificationDetails.specification",
          sizes: {
            $map: {
              input: "$sizeDetails",
              as: "size",
              in: {
                size: "$$size.size",
                sizeHeadId: "$$size.sizeHeadNameId",
              },
            },
          },
          searchKeywords: "$searchKeywordsDetails.searchKeyword",
          features: {
            $map: {
              input: "$featuresDetails",
              as: "feature",
              in: {
                title: "$$feature.featureTitle",
                content: "$$feature.featureContent",
              },
            },
          },
          averageRating: 1,
          totalFeedback: 1,
          feedbackDetails: 1,
        },
      },
    ]);

    if (!productVariantDetails || productVariantDetails.length === 0) {
      return res.status(404).json({
        message: "No product variants found for the given product ID.",
      });
    }

    res.status(200).json({
      message: "Product variants fetched successfully",
      data: productVariantDetails,
    });
  } catch (error) {
    console.error("Error fetching product variants:", error);
    res.status(500).json({
      message: "Error fetching product variants",
      error: error.message,
    });
  }
};

// get product details fro out of stock

const getOutOfStockBySellerID = async (req, res) => {
  const { sellerId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: "Invalid Seller ID" });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(String(sellerId));

    const outOfStockProducts = await ProductVariant.aggregate([
      {
        $lookup: {
          from: "productdetails",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "productDetails.sellerId": sellerObjectId,
          "productDetails.qcStatus": 1,
        },
      },
      {
        $lookup: {
          from: "productstocks",
          localField: "_id",
          foreignField: "productvariantId",
          as: "stockDetails",
        },
      },
      {
        $unwind: {
          path: "$stockDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "stockDetails.stockqty": { $eq: 0 },
        },
      },
      {
        $lookup: {
          from: "colors",
          localField: "colorId",
          foreignField: "_id",
          as: "colorDetails",
        },
      },
      {
        $unwind: {
          path: "$colorDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "productDetails.categoryId",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: {
          path: "$categoryDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "brands",
          localField: "productDetails.brandId",
          foreignField: "_id",
          as: "brandDetails",
        },
      },
      {
        $unwind: {
          path: "$brandDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "productimages",
          localField: "_id",
          foreignField: "varientId",
          as: "galleryImages",
          pipeline: [
            { $sort: { createdAt: 1 } },
            { $limit: 1 },
            {
              $project: {
                photos: {
                  $cond: {
                    if: { $isArray: "$photos" },
                    then: { $arrayElemAt: ["$photos", 0] },
                    else: "$photos",
                  },
                },
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$galleryImages",
          preserveNullAndEmptyArrays: true,
        },
      }, 
      {
        $project: {
          _id: 1,
          mrp: 1,
          sellingPrice: 1,
          productDiscription: 1,
          productTitle: 1,
          colorId: 1,
          colorName: "$colorDetails.color",
          fulfilmentBy: "$productDetails.fulfilmentBy",
          brandName: "$brandDetails.brandName",
          categoryName: "$categoryDetails.categoryName",
          productId: "$productDetails._id",
           image: {
            $cond: {
              if: { $ne: ["$galleryImages.photos", null] },
              then: { $concat: ["/api/gallery/image/", { $toString: "$galleryImages.photos" }] },
              else: "/default-image.jpg",
            },
          },
          stockqty: "$stockDetails.stockqty",
        },
      },
    ]);

    res.status(200).json({
      message: "Out of stock products fetched successfully",
      data: outOfStockProducts,
      count: outOfStockProducts.length,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching out of stock products", error });
  }
};

// get product detail for low stock

const getLowStockBySellerID = async (req, res) => {
  const { sellerId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: "Invalid Seller ID" });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(String(sellerId));

    const lowStockProducts = await ProductVariant.aggregate([
      {
        $lookup: {
          from: "productdetails",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "productDetails.sellerId": sellerObjectId,
          "productDetails.qcStatus": 1,
        },
      },
      {
        $lookup: {
          from: "productstocks",
          localField: "_id",
          foreignField: "productvariantId",
          as: "stockDetails",
        },
      },
      {
        $unwind: {
          path: "$stockDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "stockDetails.stockqty": { $lt: 10, $gt: 0 },
        },
      },
      {
        $lookup: {
          from: "colors",
          localField: "colorId",
          foreignField: "_id",
          as: "colorDetails",
        },
      },
      {
        $unwind: {
          path: "$colorDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "productDetails.categoryId",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: {
          path: "$categoryDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "brands",
          localField: "productDetails.brandId",
          foreignField: "_id",
          as: "brandDetails",
        },
      },
      {
        $unwind: {
          path: "$brandDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "productimages",
          localField: "_id",
          foreignField: "varientId",
          as: "galleryImages",
           pipeline: [
            { $sort: { createdAt: 1 } },
            { $limit: 1 },
            {
              $project: {
                photos: {
                  $cond: {
                    if: { $isArray: "$photos" },
                    then: { $arrayElemAt: ["$photos", 0] },
                    else: "$photos",
                  },
                },
              },
            },
          ],
        },
      },
     {
        $unwind: {
          path: "$galleryImages",
          preserveNullAndEmptyArrays: true,
        },
      }, 
      {
        $project: {
          _id: 1,
          mrp: 1,
          sellingPrice: 1,
          productDiscription: 1,
          productTitle: 1,
          colorId: 1,
          colorName: "$colorDetails.color",
          fulfilmentBy: "$productDetails.fulfilmentBy",
          brandName: "$brandDetails.brandName",
          categoryName: "$categoryDetails.categoryName",
          productId: "$productDetails._id",
          image: {
            $cond: {
              if: { $ne: ["$galleryImages.photos", null] },
              then: { $concat: ["/api/gallery/image/", { $toString: "$galleryImages.photos" }] },
              else: "/default-image.jpg",
            },
          },
          stockqty: "$stockDetails.stockqty",
        },
      },
    ]);

    res.status(200).json({
      message: "Low stock products fetched successfully",
      data: lowStockProducts,
      count: lowStockProducts.length,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching low stock products", error });
  }
};

// GET product details for stock inventory in seller

const getVaraintBySellerIDForInventory = async (req, res) => {
  const { sellerId } = req.params;

  console.log("Fetching variants for sellerId:", sellerId); // Debug

  try {
    // Ensure sellerId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: "Invalid Seller ID" });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(String(sellerId));

    const productVaraintDetails = await ProductVariant.aggregate([
      {
        $lookup: {
          from: "productdetails",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "productDetails.sellerId": sellerObjectId,
          "productDetails.qcStatus": 1,
        },
      },
      {
        $lookup: {
          from: "colors",
          localField: "colorId",
          foreignField: "_id",
          as: "colorDetails",
        },
      },
      {
        $unwind: {
          path: "$colorDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "productDetails.categoryId",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: {
          path: "$categoryDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "brands",
          localField: "productDetails.brandId",
          foreignField: "_id",
          as: "brandDetails",
        },
      },
      {
        $unwind: {
          path: "$brandDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "productimages",
          localField: "_id",
          foreignField: "varientId",
          as: "galleryImages",
          pipeline: [
            { $sort: { createdAt: 1 } },
            { $limit: 1 },
            {
              $project: {
                photos: {
                  $cond: {
                    if: { $isArray: "$photos" },
                    then: { $arrayElemAt: ["$photos", 0] },
                    else: "$photos",
                  },
                },
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$galleryImages",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "productstocks",
          localField: "_id",
          foreignField: "productvariantId",
          as: "stockDetails",
        },
      },
      {
        $unwind: {
          path: "$stockDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          mrp: 1,
          sellingPrice: 1,
          productDiscription: 1,
          productTitle: 1,
          colorId: 1,
          colorName: "$colorDetails.color",
          fulfilmentBy: "$productDetails.fulfilmentBy",
          brandName: "$brandDetails.brandName",
          categoryName: "$categoryDetails.categoryName",
          productId: "$productDetails._id",
          image: {
            $cond: {
              if: { $ne: ["$galleryImages.photos", null] },
              then: { $concat: ["/api/gallery/image/", { $toString: "$galleryImages.photos" }] },
              else: "/default-image.jpg",
            },
          },
          stockqty: "$stockDetails.stockqty",
        },
      },
    ]);


    if (!productVaraintDetails || productVaraintDetails.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found for the given seller ID." });
    }

    res.status(200).json({
      message: "Products fetched successfully",
      data: productVaraintDetails,
    });
  } catch (error) {
    console.error("Error fetching product variants:", error);
    res.status(500).json({ message: "Error fetching product", error: error.message });
  }
};

// get product Details by Seller ID
const getVaraintBySellerID = async (req, res) => {
  const { sellerId } = req.params;

  try {
    // Ensure sellerId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: "Invalid Product ID" });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(String(sellerId));

    const productVaraintDetails = await ProductVariant.aggregate([
      {
        $lookup: {
          from: "productdetails",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true, // If no category is found, keep null instead of removing the document
        },
      },

      {
        $match: {
          "productDetails.sellerId": sellerObjectId,
          "productDetails.qcStatus": 1, // Only fetch products where qcStatus is 1
        },
      },
      {
        $lookup: {
          from: "colors",
          localField: "colorId",
          foreignField: "_id",
          as: "colorDetails",
        },
      },

      {
        $unwind: {
          path: "$colorDetails",
          preserveNullAndEmptyArrays: true, // If no category is found, keep null instead of removing the document
        },
      },
      {
        $lookup: {
          from: "categories", // Lookup Category details
          localField: "productDetails.categoryId",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: {
          path: "$categoryDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "brands", // Lookup Brand details if applicable
          localField: "productDetails.brandId",
          foreignField: "_id",
          as: "brandDetails",
        },
      },
      {
        $unwind: {
          path: "$brandDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          mrp: 1,
          sellingPrice: 1,
          productDiscription: 1,
          productTitle: 1,
          colorId: 1,
          colorName: "$colorDetails.color",
          fulfilmentBy: "$productDetails.fulfilmentBy", // Assuming 'name' is the field for category name
          brandName: "$brandDetails.brandName", // Assuming 'name' is the field for brand name
          categoryName: "$categoryDetails.categoryName",
          productId: "$productDetails._id",
        },
      },
    ]);

    if (!productVaraintDetails || productVaraintDetails.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found for the given seller ID." });
    }

    res.status(200).json({
      message: "Products fetched successfully",
      data: productVaraintDetails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching product", error });
  }
};

// create product varaint
const createProductVariant = async (req, res) => {
  const { productId } = req.body;

  try {
    const newProductVareint = new ProductVariant({
      productId,
    });

    await newProductVareint.save();
    res
      .status(201)
      .json({
        message: "Product Variant created succeccfully",
        data: newProductVareint,
      });
  } catch (error) {
    console.error(error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "server error" });
  }
};

const updateProductVariant = async (req, res) => {
  const { productVaraintId } = req.params;
  const {
    productId,
    mrp,
    sellingPrice,
    minimumOrderQty,
    shippingProvider,
    Length,
    breadth,
    height,
    weight,
    hsnCode,
    taxCode,
    countryOfOrgin,
    manufactureDetails,
    packerDetails,
    productDiscription,
    productTitle,
    procurementSLA,
    procurementType,
    colorId,
    intheBox,
    warrantyPeriod,
    warantySummary,
  } = req.body;

  try {
    if (!productVaraintId) {
      return res
        .status(404)
        .json({ message: "We can't find Product Variant by this Variant ID" });
    }

    // ✅ Handle empty colorId: Set it to null if it's empty
    let updateData = {
      productId,
      mrp,
      sellingPrice,
      minimumOrderQty,
      shippingProvider,
      Length,
      breadth,
      height,
      weight,
      hsnCode,
      taxCode,
      countryOfOrgin,
      manufactureDetails,
      packerDetails,
      productDiscription,
      productTitle,
      procurementSLA,
      procurementType,
      intheBox,
      warrantyPeriod,
      warantySummary,
    };

    // ✅ Only add colorId if it's valid (not empty or invalid ObjectId)
    if (colorId && mongoose.Types.ObjectId.isValid(colorId)) {
      updateData.colorId = colorId;
    } else {
      updateData.colorId = null; // Or delete updateData.colorId;
    }

    // ✅ Update the product variant
    const updatedData = await ProductVariant.findByIdAndUpdate(
      productVaraintId,
      updateData,
      { new: true, runValidators: true },
    );

    if (!updatedData) {
      return res.status(404).json({ message: "Product Variant not found" });
    }

    res
      .status(200)
      .json({
        message: "Product Variant updated successfully",
        data: updatedData,
      });
  } catch (error) {
    console.error(error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Server error" });
  }
};

// delete the product varaint
const deleteProductVaraint = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await ProductVariant.findByIdAndDelete(id);
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
  createProductVariant,
  getProductVariant,
  updateProductVariant,
  getVaraintBySellerID,
  deleteProductVaraint,
  getVaraintByProductID,
  getVaraintByID,
  getVariantToQC,
  getproductforSingleView,
  getVaraintBySellerIDForInventory,
  getLowStockBySellerID,
  getOutOfStockBySellerID,
};
