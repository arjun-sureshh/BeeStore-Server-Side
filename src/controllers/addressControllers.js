const Address = require("../models/addressModels");
const mongoose = require("mongoose");

// get address
const getAddress = async (req, res) => {
  try {
    const AddressDetails = await Address.find();
    res
      .status(200)
      .json({
        message: "fetching Address details successfull",
        data: AddressDetails,
      });
  } catch (error) {
    res.status(500).json({ message: "Error in fetching Address ", error });
  }
};

const getAddressById = async (req, res) => {
  const { id } = req.params; // Expecting a single ID

  if (!id) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const addressDetails = await Address.findById(id);

    if (!addressDetails) {
      return res.status(404).json({ message: "Address not found" });
    }

    res
      .status(200)
      .json({ message: "Fetching address successful", data: addressDetails });
  } catch (error) {
    console.error("❌ Error fetching address:", error);
    res
      .status(500)
      .json({ message: "Error fetching address", error: error.message });
  }
};

// get the Address by SellerID
const getAddressBySellerIds = async (req, res) => {
  const { sellerIds } = req.body; // Expecting an array from frontend

  if (!sellerIds || !Array.isArray(sellerIds)) {
    return res.status(400).json({ message: "Invalid seller IDs" });
  }

  try {
    const addressDetails = await Address.find({ sellerId: { $in: sellerIds } });

    res
      .status(200)
      .json({ message: "Fetching addresses successful", data: addressDetails });
  } catch (error) {
    res.status(500).json({ message: "Error fetching addresses", error });
  }
};

// post Address

const sellerAddress = async (req, res) => {
  const { sellerId, address, pincode } = req.body;

  try {
    if (!sellerId || !address || !pincode) {
      return res.status(400).json({ message: "Please provide all fields" });
    }
    const newAddress = new Address({
      sellerId,
      address,
      pincode,
    });
    await newAddress.save();
    res.status(201).json({ message: "New Address successfully created" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "server error" });
  }
};

// user address
const updateUserAddress = async (req, res) => {
  const { id } = req.params;
  const {
    userId,
    address,
    pincode,
    districtId,
    mobileNumber,
    alternateMobileNumber,
    fullName,
    addressType,
    city,
    latitude,
    longitude,
  } = req.body;

  try {
    // Check if all required fields are provided
    if (
      !userId ||
      !address ||
      !pincode ||
      !districtId ||
      !mobileNumber ||
      !fullName ||
      !addressType ||
      !city
    ) {
      return res.status(400).json({ message: "Please provide all fields" });
    }

    // Find and update the address
    const updatedAddress = await Address.findByIdAndUpdate(
      id,
      {
        userId,
        address,
        pincode,
        districtId,
        mobileNumber,
        alternateMobileNumber,
        fullName,
        addressType,
        city,
        location: {
          latitude,
          longitude,
        },
      },
      { new: true, runValidators: true }, // Returns updated document and applies schema validation
    );

    if (!updatedAddress) {
      return res.status(404).json({ message: "Address not found" });
    }

    res
      .status(200)
      .json({ message: "Address successfully updated", updatedAddress });
  } catch (error) {
    console.error("❌ Error updating address:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// user address

const userAddress = async (req, res) => {
  const {
    userId,
    address,
    pincode,
    districtId,
    mobileNumber,
    alternateMobileNumber,
    fullName,
    addressType,
    city,
    latitude,
    longitude,
  } = req.body;

  try {
    if (
      !userId ||
      !address ||
      !pincode ||
      !districtId ||
      !mobileNumber ||
      !fullName ||
      !addressType ||
      !city
    ) {
      return res.status(400).json({ message: "Please provide all fields" });
    }
    const newAddress = new Address({
      userId,
      address,
      pincode,
      districtId,
      mobileNumber,
      alternateMobileNumber,
      fullName,
      addressType,
      city,
      location: {
        latitude,
        longitude,
      },
    });
    await newAddress.save();
    res.status(201).json({ message: "New Address successfully created" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "server error" });
  }
};
// get the address in user

const getAddressByuserId = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const userAddressDetails = await Address.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(String(userId)) }, // Convert to ObjectId
      },
      {
        $lookup: {
          from: "districts",
          localField: "districtId",
          foreignField: "_id",
          as: "districtDetails",
        },
      },
      {
        $unwind: {
          path: "$districtDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          address: 1,
          pincode: 1,
          city: 1,
          mobileNumber: 1,
          alternateMobileNumber: 1,
          fullName: 1,
          addressType: 1,
          districtName: "$districtDetails.districtName",
        },
      },
    ]);

    if (!userAddressDetails || userAddressDetails.length === 0) {
      return res
        .status(404)
        .json({ message: "No addresses found for this user." });
    }

    res.status(200).json({
      message: "Addresses fetched successfully",
      data: userAddressDetails,
    });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ message: "Error fetching addresses", error });
  }
};

// delete Address
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Address.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Address   not found" });
    } else {
      res.json({ message: "Address details deleted successfully", deleted });
    }
  } catch (error) {
    console.error("Error deleting in Address details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  sellerAddress,
  getAddress,
  getAddressBySellerIds,
  userAddress,
  getAddressByuserId,
  deleteAddress,
  getAddressById,
  updateUserAddress,
};
