const Brand = require("../models/brandModels");

// get Brand
const getBrand = async (req, res) => {
  try {
    const brandDetails = await Brand.find();
    res.status(200).json({ brandDetails });
  } catch (error) {
    res.status(500).json({ message: "Error in fetching Brand ", error });
  }
};

//  get Brand by id

const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;
    const findItem = await Brand.findById(id);
    if (findItem) {
      res.status(200).json({ message: "got the Brand ", data: findItem });
    } else {
      res.status(404).json({ message: "requested Brand is not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error in fetching Brand ", error });
  }
};

// post Brand

const createBrand = async (req, res) => {
  const { brandName } = req.body;
  try {
    let existingBrand = await Brand.findOne({
      brandName: { $regex: new RegExp("^" + brandName + "$", "i") },
    });

    if (existingBrand) {
      return res.status(400).json({ message: "This Brand is already exists" });
    }

    const newBrand = new Brand({
      brandName,
      brandStatus: 1,
    });
    await newBrand.save();
    res.status(201).json({ message: "New Brand successfully created" });
  } catch (error) {
    console.error(error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "server error" });
  }
};

// sugest brand from the seller side to add the brand

const brandBySeller = async (req, res) => {
  const { brandName } = req.body;
  try {
    let existingBrand = await Brand.findOne({
      brandName: { $regex: new RegExp("^" + brandName + "$", "i") },
    });

    if (existingBrand) {
      return res.status(400).json({ message: "This Brand is already exists" });
    }

    const newBrand = new Brand({
      brandName,
    });
    await newBrand.save();
    res
      .status(201)
      .json({ message: "New Brand successfully created", data: newBrand });
  } catch (error) {
    console.error(error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "server error" });
  }
};

// delete Brand
const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Brand.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Brand not found" });
    } else {
      res.json({ message: "Brand deleted successfully", deleted });
    }
  } catch (error) {
    console.error("Error deleting in Brand:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//  update Brand by id

const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { brandName } = req.body;
    const findItem = await Brand.findById(id);
    let existingBrand = await Brand.findOne({
      brandName: { $regex: new RegExp("^" + brandName + "$", "i") },
    });

    if (existingBrand) {
      return res.status(400).json({ message: "This Brand is already exists" });
    }
    if (findItem) {
      const updateItem = await Brand.findByIdAndUpdate(
        id,
        { brandName },
        { new: true },
      );
      res.status(201).send({ message: "Brand Changed", updateItem });
    } else {
      res.status(404).json({ message: "Brand is not found " });
    }
  } catch (error) {
    console.error("Error updateing in Brand:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// search brand in product upload
const searchBrand = async (req, res) => {
  try {
    const { searchData } = req.params;

    if (!searchData) {
      return res.status(400).json({ message: "Search term is required" });
    }

    const categories = await Brand.aggregate([
      {
        $match: {
          brandName: { $regex: `^${searchData}`, $options: "i" }, // Case-insensitive match
          // brandStatus: 1, // Only return brands with status 1
        },
      },
    ]);
    return res.json(categories);
  } catch (error) {
    console.error("Error searching categories:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  createBrand,
  getBrand,
  getBrandById,
  updateBrand,
  deleteBrand,
  searchBrand,
  brandBySeller,
};
