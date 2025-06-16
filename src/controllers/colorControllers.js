const Color = require("../models/colorModules");

// get color
const getColor = async (req, res) => {
  try {
    const colorDetails = await Color.find();
    res
      .status(200)
      .json({ message: "color fetched successfullly", data: colorDetails });
  } catch (error) {
    res.status(500).json({ message: "Error in fetching Category ", error });
  }
};

//  get color by id

const getColorById = async (req, res) => {
  try {
    const { id } = req.params;
    const findcolor = await Color.findById(id);
    if (findcolor) {
      res.status(200).json({ message: "got the color ", data: findcolor });
    } else {
      res.status(404).json({ message: "requested color is not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error in fetching color ", error });
  }
};

// post color

const createColor = async (req, res) => {
  const { color } = req.body;
  try {
    let existingcolor = await Color.findOne({
      color: { $regex: new RegExp("^" + color + "$", "i") },
    });

    if (existingcolor) {
      return res.status(400).json({ message: "This color is already exists" });
    }

    const newColor = new Color({
      color,
    });
    await newColor.save();
    res.status(201).json({ message: "New color successfully created" });
  } catch (error) {
    console.error(error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "server error" });
  }
};

// delete color
const deleteColor = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Color.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Color not found" });
    } else {
      res.json({ message: "Color deleted successfully", deleted });
    }
  } catch (error) {
    console.error("Error deleting in Color:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//  update color by id

const updateColor = async (req, res) => {
  try {
    const { id } = req.params;
    const { color } = req.body;
    const findItem = await Color.findById(id);
    let existingcolor = await Color.findOne({
      color: { $regex: new RegExp("^" + color + "$", "i") },
    });

    if (existingcolor) {
      return res.status(400).json({ message: "This color is already exists" });
    }
    if (findItem) {
      const updateItem = await Color.findByIdAndUpdate(
        id,
        { color },
        { new: true },
      );
      res.status(201).send({ msg: "Color Changed", updateItem });
    } else {
      res.status(404).json({ message: "color is not found " });
    }
  } catch (error) {
    console.error("Error updateing in color:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createColor,
  getColor,
  getColorById,
  deleteColor,
  updateColor,
};
