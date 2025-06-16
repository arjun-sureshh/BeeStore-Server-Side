const { default: mongoose } = require("mongoose");
const Size = require("../models/sizeBodyModels");

// get Size body
const getSizeBody = async (req, res) => {
  try {
    const sizebodyDetails = await Size.find();
    res.status(200).json({ sizebodyDetails });
  } catch (error) {
    res.status(500).json({ message: "Error in fetching Brand ", error });
  }
};

// product Size get by varaint Id
const getSizeyByProductVaraintId = async (req, res) => {
  const { productVariantId } = req.params;
  try {
    const productSizeDetails = await Size.find({
      productVariantId: productVariantId,
    });

    if (!productSizeDetails) {
      return res
        .status(404)
        .json({ message: "Product Size Details not found with the given ID." });
    }
    res.status(200).json({
      message: "Product Size Details fetched successfully",
      data: productSizeDetails,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching product Size Details", error });
  }
};

// post size Body

const createSizeBody = async (req, res) => {
  const { size, sizeHeadNameId, productVariantId } = req.body;
  try {
    let existingSize = await Size.findOne({ productVariantId });

    // Convert to ObjectId
    sizeHeadNameId = new mongoose.Types.ObjectId(String(sizeHeadNameId));
    productVariantId = new mongoose.Types.ObjectId(String(productVariantId));

    if (existingSize) {
      // If the size already exists, update it
      existingSize.size = size;
      existingSize.sizeHeadNameId = sizeHeadNameId;
      await existingSize.save();

      return res.status(200).json({ message: "Size updated successfully" });
    }

    const newSize = new Brand({
      size,
      sizeHeadNameId,
      productVariantId,
    });
    await newSize.save();
    res.status(201).json({ message: "New Size successfully created" });
  } catch (error) {
    console.error(error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "server error" });
  }
};

module.exports = {
  createSizeBody,
  getSizeBody,
  getSizeyByProductVaraintId,
};
