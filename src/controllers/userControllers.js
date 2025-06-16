const { default: mongoose } = require("mongoose");
const User = require("../models/userModels");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");

// user get

const getUser = async (req, res) => {
  try {
    const userDetails = await User.find();
    res.status(200).json(userDetails);
  } catch (error) {
    res.status(500).json({ messgae: "Error in fetching User ", error });
  }
};

// user get By User Id

const getUserByUserId = async (req, res) => {
  const { userId } = req.params;

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }

  try {
    const userDetails = await User.findById(userId);

    if (!userDetails) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({
        message: "User details fetched successfully",
        data: userDetails,
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error in fetching user", error: error.message });
  }
};

// user create

const createUser = async (req, res) => {
  const { userName, userEmail, userPassword, userMobileNumber } = req.body;

  if (!userName || !userEmail || !userPassword || !userMobileNumber) {
    return res
      .status(400)
      .json({ message: "Please Provide all Required Fields" });
  }

  try {
    const existingUser = await User.findOne({ userEmail });

    if (existingUser) {
      return res
        .status(400)
        .json({ emailExist: true, message: "User email already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userPassword, salt);

    const newUser = new User({
      userName,
      userEmail,
      userPassword: hashedPassword, // Fixed incorrect storage
      userMobileNumber,
    });

    await newUser.save();
    res.status(201).json({ message: "User Created Successfully" });
  } catch (error) {
    console.error(error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Server Error" });
  }
};

// Check User Email

const checkUserEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ userEmail: email });
    res.status(200).json({ exists: !!user }); // Returns true if seller exists
  } catch (error) {
    res.status(500).json({ message: "Error in fetching User", error });
  }
};

// update or change the user details

const updateUserDetails = async (req, res) => {
  const { userId } = req.params;
  const { userName, userMobileNumber, userEmail, userGender } = req.body;

  try {
    // Check if the email is already taken by another user
    const existingUser = await User.findOne({
      userEmail,
      _id: { $ne: userId },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({
          emailExist: true,
          message: "Email is already in use by another account",
        });
    }

    const updateData = await User.findByIdAndUpdate(
      userId,
      { userName, userMobileNumber, userEmail, userGender },
      { new: true, runValidators: true },
    );

    if (!updateData) {
      return res.status(404).json({ message: "User Account Not Found" });
    }

    res.status(200).json({ message: "User Account Changed", data: updateData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// otp generation

// store  OTP temporarily
const otpStorage = {};

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS, // Your email app password
  },
});

// Generate and send OTP to email
const sendOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Generate OTP
    const otp = otpGenerator.generate(4, {
      digits: true,
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false, // Ensure no lowercase letters
    });
    otpStorage[email] = otp;

    // Email message
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "OTP sent successfully" });

    // Set OTP expiry (optional)
    setTimeout(() => {
      delete otpStorage[email];
    }, 300000); // OTP expires in 5 minutes
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Error sending OTP", error });
  }
};
// Verify OTP
const verifyOTP = (req, res) => {
  const { email, otp } = req.body;

  if (otpStorage[email] === otp) {
    res
      .status(200)
      .json({ success: true, message: "OTP verified successfully" });
    delete otpStorage[email]; // Remove OTP after use
  } else {
    res.status(400).json({ success: false, message: "Invalid or expired OTP" });
  }
};

const resetPassword = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide all reuierd fields" });
  }
  // hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  try {
    const updateData = await User.findOneAndUpdate(
      { userEmail: email },
      { userPassword: hashedPassword },
      { new: true, runValidators: true },
    );

    if (!updateData) {
      return res.status(404).json({ message: "User Account Not Found" });
    }

    res
      .status(200)
      .json({ message: "changed the passowrd ", data: updateData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createUser,
  getUser,
  getUserByUserId,
  updateUserDetails,
  checkUserEmail,
  sendOTP,
  verifyOTP,
  resetPassword,
};
