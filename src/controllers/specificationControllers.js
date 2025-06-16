const Specification = require("../models/productSpecification");

// get searchKeyword
const getSearchKeyword = async (req, res) => {
  try {
    const searchkeywordDetails = await Specification.find();
    res.status(200).json({ searchkeywordDetails });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error in fetching searchKeyword ", error });
  }
};

// product search Key get by varaint Id
const getSearchKeyByProductVaraintId = async (req, res) => {
  const { productVariantId } = req.params;
  try {
    const productSearchKeyDetails = await Specification.find({
      productVariantId: productVariantId,
    });

    if (!productSearchKeyDetails) {
      return res
        .status(404)
        .json({
          message: "Product search Key words not found with the given ID.",
        });
    }
    res.status(200).json({
      message: "Product search Key words fetched successfully",
      data: productSearchKeyDetails,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching product search Key words", error });
  }
};

// post searchKeyword

const createSpecification = async (req, res) => {
  const { productVariantId, specification } = req.body; // ✅ Receiving an array of keywords

  if (
    !productVariantId ||
    !Array.isArray(specification) ||
    specification.length === 0
  ) {
    return res
      .status(400)
      .json({
        message:
          "Please provide productVariantId and at least one search keyword",
      });
  }

  try {
    // ✅ Create keyword entries for each keyword in the array
    const newSpecification = specification.map((item) => ({
      productVariantId: productVariantId,
      specification: item.specification, // ✅ Extract keyword value
    }));

    await Specification.insertMany(newSpecification); // ✅ Insert all keywords at once

    res.status(201).json({ message: "Specification added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createSpecification,
  // getSearchKeyword,
  // getSearchKeyByProductVaraintId
};
