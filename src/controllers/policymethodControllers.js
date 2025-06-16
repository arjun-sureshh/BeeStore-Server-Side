const PolicyMethod = require("../models/policyMethodModels");

// get PolicyMethods
const getPolicyMethods = async (req, res) => {
  try {
    const policymethodsDetails = await PolicyMethod.find();
    res.status(200).json({ policymethodsDetails });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error in fetching Policy Methods ", error });
  }
};

// get payment method by id
const getPolicyMethodById = async (req, res) => {
  try {
    const { id } = req.params;
    const findItem = await PolicyMethod.findById(id);
    if (findItem) {
      res
        .status(200)
        .json({ message: "got the Policy Method ", data: findItem });
    } else {
      res.status(404).json({ message: "requested Policy Method is not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error in fetching Policy Method ", error });
  }
};

// post PolicyMethods

const createPolicyMethods = async (req, res) => {
  const { policyMethodName } = req.body;
  try {
    let existingPolicyMethod = await PolicyMethod.findOne({
      policyMethodName: {
        $regex: new RegExp("^" + policyMethodName + "$", "i"),
      },
    });

    if (existingPolicyMethod) {
      return res
        .status(400)
        .json({ message: "This Policy Method is already exists" });
    }

    const newPolicyMethod = new PolicyMethod({
      policyMethodName,
    });
    await newPolicyMethod.save();
    res.status(201).json({ message: "New Policy Method successfully created" });
  } catch (error) {
    console.error(error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "server error" });
  }
};

// delete Policy
const deletePolicyMethod = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await PolicyMethod.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Policy Method not found" });
    } else {
      res.json({ message: "Policy Method deleted successfully", deleted });
    }
  } catch (error) {
    console.error("Error deleting in Policy Method:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//  update Policy by id

const updatePolicyMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const { policyMethodName } = req.body;
    const findItem = await PolicyMethod.findById(id);

    let existingPolicyMethod = await PolicyMethod.findOne({
      policyMethodName: {
        $regex: new RegExp("^" + policyMethodName + "$", "i"),
      },
    });

    if (existingPolicyMethod) {
      return res
        .status(400)
        .json({ message: "This Policy Method is already exists" });
    }

    if (findItem) {
      const updateItem = await PolicyMethod.findByIdAndUpdate(
        id,
        { policyMethodName },
        { new: true },
      );
      res.status(201).send({ message: "Policy Method Changed", updateItem });
    } else {
      res.status(404).json({ message: "Policy Method is not found " });
    }
  } catch (error) {
    console.error("Error updateing in Policy Method:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = {
  createPolicyMethods,
  getPolicyMethods,
  getPolicyMethodById,
  deletePolicyMethod,
  updatePolicyMethod,
};
