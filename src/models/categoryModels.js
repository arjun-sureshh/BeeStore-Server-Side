const mongoose = require("mongoose");

const categorySchemaStructure = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      require: true,
      trim: true,
    },
    mainCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "categories",
      required: false,
      default: null,
      trim: true,
    },
  },
  { timestamps: true },
);

const Category = mongoose.model("categories", categorySchemaStructure);

module.exports = Category;
