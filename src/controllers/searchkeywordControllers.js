const SearchKeywords = require("../models/searchKeywordsModels");

// get searchKeyword
const getSearchKeyword = async (req, res) => {
  try {
    const searchkeywordDetails = await SearchKeywords.find();
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
    const productSearchKeyDetails = await SearchKeywords.find({
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

const createSearchKeyword = async (req, res) => {
  const { productVariantId, searchKeyWords } = req.body; // ✅ Receiving an array of keywords

  if (
    !productVariantId ||
    !Array.isArray(searchKeyWords) ||
    searchKeyWords.length === 0
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
    const newKeywords = searchKeyWords.map((item) => ({
      productVariantId: productVariantId,
      searchKeyword: item.searchKeyWord, // ✅ Extract keyword value
    }));

    await SearchKeywords.insertMany(newKeywords); // ✅ Insert all keywords at once

    res.status(201).json({ message: "Search keywords added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createSearchKeyword,
  getSearchKeyword,
  getSearchKeyByProductVaraintId,
};
