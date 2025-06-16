const mongoose = require("mongoose");
const Product = require("../models/productModels");
const ProductVariant = require("../models/productVariantModels");
const ProductStock = require("../models/productStockModels");
const Features = require("../models/keyfeaturesModels");
const Gallery = require("../models/galleryModels");
const SearchKeywords = require("../models/searchKeywordsModels");
const Specification = require("../models/productSpecification");
const Size = require("../models/sizeBodyModels");

const upsertProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      productId, // Optional: for updating existing product
      sellerId,
      categoryId,
      brandId,
      skuId,
      fullfilementBy,
      localDeliveryCharge,
      ZonalDeliveryCharge,
      ListingStatus,
      variantId, // Optional: for updating existing variant
      variantData: {
        mrp,
        sellingPrice,
        minimumOrderQty,
        shippingProvider,
        Length,
        breadth,
        height,
        weight,
        HSN,
        taxCode,
        countryOfOrgin,
        manufacturerDetails,
        packerDetails,
        productDiscription,
        productTitle,
        ProcurementType,
        ProcurementSLA,
        colorId,
        intheBox,
        warrantyPeriod,
        warantySummary,
        stockqty,
        size,
        sizeHeadId,
        features,
        searchKeyWords,
        specification,
        images, // Array of image URLs or filenames
      },
    } = req.body;

    // Validation
    if (!sellerId || !skuId || !fullfilementBy || !ListingStatus) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ message: "Missing required product fields" });
    }

    const requiredVariantFields = [
      "mrp",
      "sellingPrice",
      "minimumOrderQty",
      "shippingProvider",
      "weight",
      "HSN",
      "taxCode",
      "productTitle",
      "productDiscription",
      "intheBox",
      "manufacturerDetails",
      "packerDetails",
    ];
    for (const field of requiredVariantFields) {
      if (!variantData[field]) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json({ message: `Missing required variant field: ${field}` });
      }
    }

    // Create or Update Product
    let product;
    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      product = await Product.findByIdAndUpdate(
        productId,
        {
          sellerId,
          categoryId,
          brandId,
          skuId,
          fullfilementBy,
          localDeliveryCharge,
          ZonalDeliveryCharge,
          ListingStatus,
        },
        { new: true, runValidators: true, session },
      );
    } else {
      product = new Product({
        sellerId,
        categoryId,
        brandId,
        skuId,
        fullfilementBy,
        localDeliveryCharge,
        ZonalDeliveryCharge,
        ListingStatus,
      });
      await product.save({ session });
    }

    if (!product) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ message: "Failed to create/update product" });
    }

    const productIdObj = product._id;

    // Create or Update Product Variant
    let productVariant;
    if (variantId && mongoose.Types.ObjectId.isValid(variantId)) {
      productVariant = await ProductVariant.findByIdAndUpdate(
        variantId,
        {
          productId: productIdObj,
          mrp,
          sellingPrice,
          minimumOrderQty,
          shippingProvider,
          Length,
          breadth,
          height,
          weight,
          hsnCode: HSN,
          taxCode,
          countryOfOrgin,
          manufacturerDetails,
          packerDetails,
          productDiscription,
          productTitle,
          procurementType: ProcurementType,
          procurementSLA: ProcurementSLA,
          colorId:
            colorId && mongoose.Types.ObjectId.isValid(colorId)
              ? colorId
              : null,
          intheBox,
          warrantyPeriod,
          warantySummary,
        },
        { new: true, runValidators: true, session },
      );
    } else {
      productVariant = new ProductVariant({
        productId: productIdObj,
        mrp,
        sellingPrice,
        minimumOrderQty,
        shippingProvider,
        Length,
        breadth,
        height,
        weight,
        hsnCode: HSN,
        taxCode,
        countryOfOrgin,
        manufacturerDetails,
        packerDetails,
        productDiscription,
        productTitle,
        procurementType: ProcurementType,
        procurementSLA: ProcurementSLA,
        colorId:
          colorId && mongoose.Types.ObjectId.isValid(colorId) ? colorId : null,
        intheBox,
        warrantyPeriod,
        warantySummary,
      });
      await productVariant.save({ session });
    }

    if (!productVariant) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ message: "Failed to create/update product variant" });
    }

    const variantIdObj = productVariant._id;

    // Update or Create Stock
    if (stockqty) {
      const existingStock = await ProductStock.findOne({
        productvariantId: variantIdObj,
      }).session(session);
      if (existingStock) {
        await ProductStock.findByIdAndUpdate(
          existingStock._id,
          { stockqty },
          { session },
        );
      } else {
        const newStock = new ProductStock({
          productvariantId: variantIdObj,
          stockqty,
        });
        await newStock.save({ session });
      }
    }

    // Update Images
    if (images && Array.isArray(images) && images.length > 0) {
      await Gallery.deleteMany({ varientId: variantIdObj }, { session });
      const newImages = images.map((image) => ({
        varientId: variantIdObj,
        photos: image, // Assuming image is a URL or filename
      }));
      await Gallery.insertMany(newImages, { session });
    }

    // Update Features
    if (features && Array.isArray(features) && features.length > 0) {
      await Features.deleteMany(
        { productVariantId: variantIdObj },
        { session },
      );
      const newFeatures = features.map((feature) => ({
        featureTitle: feature.title,
        featureContent: feature.content,
        productVariantId: variantIdObj,
      }));
      await Features.insertMany(newFeatures, { session });
    }

    // Update Search Keywords
    if (
      searchKeyWords &&
      Array.isArray(searchKeyWords) &&
      searchKeyWords.length > 0
    ) {
      await SearchKeywords.deleteMany(
        { productVariantId: variantIdObj },
        { session },
      );
      const newKeywords = searchKeyWords.map((keyword) => ({
        productVariantId: variantIdObj,
        searchKeyword: keyword.searchKeyWord,
      }));
      await SearchKeywords.insertMany(newKeywords, { session });
    }

    // Update Specifications
    if (
      specification &&
      Array.isArray(specification) &&
      specification.length > 0
    ) {
      await Specification.deleteMany(
        { productVariantId: variantIdObj },
        { session },
      );
      const newSpecs = specification.map((spec) => ({
        productVariantId: variantIdObj,
        specification: spec.specification,
      }));
      await Specification.insertMany(newSpecs, { session });
    }

    // Update Size
    if (size && sizeHeadId) {
      await Size.deleteMany({ productVariantId: variantIdObj }, { session });
      const newSize = new Size({
        productVariantId: variantIdObj,
        size,
        sizeHeadNameId: sizeHeadId,
      });
      await newSize.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Product and variant saved successfully",
      data: { productId: productIdObj, productVariantId: variantIdObj },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const fetchProductData = async (req, res) => {
  const { productId } = req.params;

  try {
    // Validate productId
    if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
      return res
        .status(400)
        .json({
          message: "Invalid Product ID: Must be a 24-character hex string",
        });
    }

    // Fetch Product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Fetch Variants with related data
    const productObjectId = new mongoose.Types.ObjectId(productId);
    const productVariants = await ProductVariant.aggregate([
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
          from: "productimage",
          localField: "_id",
          foreignField: "varientId",
          as: "galleryDetails",
        },
      },
      {
        $lookup: {
          from: "productSpecification",
          localField: "_id",
          foreignField: "productVariantId",
          as: "specificationDetails",
        },
      },
      {
        $lookup: {
          from: "sizeBody",
          localField: "_id",
          foreignField: "productVariantId",
          as: "sizeDetails",
        },
      },
      {
        $lookup: {
          from: "searchKeyword",
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
      {
        $project: {
          ProductVariantId: "$_id",
          productId: 1,
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
          manufacturerDetails: 1,
          packerDetails: 1,
          procurementSLA: 1,
          procurementType: 1,
          intheBox: 1,
          warrantyPeriod: 1,
          warantySummary: 1,
          colorId: 1,
          colorName: "$colorDetails.color",
          skuId: "$productDetails.skuId",
          fullfilementBy: "$productDetails.fullfilementBy",
          localDeliveryCharge: "$productDetails.localDeliveryCharge",
          ZonalDeliveryCharge: "$productDetails.ZonalDeliveryCharge",
          brandName: "$brandDetails.brandName",
          categoryName: "$categoryDetails.categoryName",
          stockqty: "$stockDetails.stockqty",
          photos: "$galleryDetails.photos",
          searchKeyWords: "$searchKeywordsDetails.searchKeyword",
          specification: "$specificationDetails.specification",
          size: {
            $map: {
              input: "$sizeDetails",
              as: "size",
              in: {
                size: "$$size.size",
                sizeHeadId: "$$size.sizeHeadNameId",
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
        },
      },
    ]);

    res.status(200).json({
      message: "Product data fetched successfully",
      data: {
        product,
        variants: productVariants,
      },
    });
  } catch (error) {
    console.error("Error fetching product status:", error);
    res
      .status(500)
      .json({ message: "Error fetching product data", error: error.message });
  }
};

module.exports = {
  upsertProduct,
  fetchProductData,
};
