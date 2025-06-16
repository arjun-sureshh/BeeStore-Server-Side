const SizeHead = require("../models/sizeHeadModels");

// get SizeHead
const getSizeHead = async (req, res) => {
  try {
    const sizeHeadDetails = await SizeHead.find();
    res
      .status(200)
      .json({ message: "color fetched successfullly", data: sizeHeadDetails });
  } catch (error) {
    res.status(500).json({ message: "Error in fetching Size ", error });
  }
};

// get payment method by id
const getSizeTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const findItem = await SizeHead.findById(id);
    if (findItem) {
      res.status(200).json({ message: "got the Size Name ", data: findItem });
    } else {
      res.status(404).json({ message: "requested Size Name is not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error in fetching Size Type ", error });
  }
};

// post Size Type

const createSizeHead = async (req, res) => {
  const { sizeHeadName } = req.body;
  try {
    let existingSize = await SizeHead.findOne({
      sizeHeadName: { $regex: new RegExp("^" + sizeHeadName + "$", "i") },
    });

    if (existingSize) {
      return res
        .status(400)
        .json({ message: "This Size Type is already exists" });
    }

    const newSizeType = new SizeHead({
      sizeHeadName,
    });
    await newSizeType.save();
    res.status(201).json({ message: "New Size Type successfully created" });
  } catch (error) {
    console.error(error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "server error" });
  }
};

// delete Size Type
const deleteSizeType = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await SizeHead.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Size Type not found" });
    } else {
      res.json({ message: "Size Type deleted successfully", deleted });
    }
  } catch (error) {
    console.error("Error deleting in Size Type:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//  update Size Type by id

const updateSizeType = async (req, res) => {
  try {
    const { id } = req.params;
    const { sizeHeadName } = req.body;
    const findItem = await SizeHead.findById(id);

    let existingSizeType = await SizeHead.findOne({
      sizeHeadName: { $regex: new RegExp("^" + sizeHeadName + "$", "i") },
    });

    if (existingSizeType) {
      return res
        .status(400)
        .json({ message: "This Size Type is already exists" });
    }

    if (findItem) {
      const updateItem = await SizeHead.findByIdAndUpdate(
        id,
        { sizeHeadName },
        { new: true },
      );
      res.status(201).send({ message: "Size Type Changed", data: updateItem });
    } else {
      res.status(404).json({ message: "Size Type is not found " });
    }
  } catch (error) {
    console.error("Error updateing in Size Type:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = {
  createSizeHead,
  getSizeHead,
  getSizeTypeById,
  updateSizeType,
  deleteSizeType,
};
