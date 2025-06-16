const mongoose = require("mongoose");

const searchKeywordSchemaStructure = new mongoose.Schema(
  {
    productVariantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "productvariantdetails",
      required: false,
    },
    searchKeyword: {
      type: String,
      required: false,
    },
  },
  { timestamps: true },
);

// Create index on searchKeyword
searchKeywordSchemaStructure.index({ searchKeyword: 1 });

const SearchKeywords = mongoose.model(
  "searchKeyword",
  searchKeywordSchemaStructure,
);

module.exports = SearchKeywords;
