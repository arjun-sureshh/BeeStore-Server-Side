const District = require("../models/districtModels");

// get district

const getDistrict = async (req, res) => {
  try {
    const districtDetails = await District.find();

    if (!districtDetails.length) {
      return res.status(404).json({ message: "No districts available." });
    }

    res.status(200).json({
      message: "All districts fetched successfully",
      data: districtDetails,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error in fetching districts",
      error: error.message,
    });
  }
};

// get District by id

const getDistrictById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "District ID is required" });
    }
    const findDistrict = await District.findById(id);
    if (findDistrict) {
      res.status(200).json({ message: "got the district", data: findDistrict });
    } else {
      res.status(404).json({ message: "requested District is not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error in fetching District ", error });
  }
};

// post District

const createDistrict = async (req, res) => {
  const { districtName } = req.body;
  try {
    if (!districtName) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    let existingDistrict = await District.findOne({
      districtName: { $regex: new RegExp("^" + districtName + "$", "i") },
    });

    if (existingDistrict) {
      return res
        .status(400)
        .json({ message: "This District is already exists" });
    }

    const newDistrict = new District({
      districtName,
    });
    await newDistrict.save();
    res.status(201).json({ message: "New District successfully created" });
  } catch (error) {
    console.error(error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "server error" });
  }
};

//  delete District

const deleteDistrct = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await District.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "District not found" });
    } else {
      res.json({ message: "District deleted successfully", deleted });
    }
  } catch (error) {
    console.error("Error deleting in District:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//  Update District

const updateDistrct = async (req, res) => {
  try {
    const { id } = req.params;
    const { districtName } = req.body;
    const district = await District.findById(id);

    let existingDistrict = await District.findOne({
      districtName: { $regex: new RegExp("^" + districtName + "$", "i") },
    });

    if (existingDistrict) {
      return res
        .status(400)
        .json({ message: "This District is already exists" });
    }

    if (district) {
      const districtUpdate = await District.findByIdAndUpdate(
        id,
        { districtName },
        { new: true },
      );
      res.status(201).send({ msg: "District Changed", districtUpdate });
    } else {
      res.status(404).json({ message: "District is not found " });
    }
  } catch (error) {
    console.error("Error updateing in District:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createDistrict,
  getDistrict,
  getDistrictById,
  deleteDistrct,
  updateDistrct,
};
