const Admin = require("../models/adminModels");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");

// admin get
const getAdmin = async (req, res) => {
  try {
    const adminDetails = await Admin.find();
    res.status(200).json(adminDetails);
  } catch (error) {
    res.status(500).json({ message: "Error in fetching admin ", error });
  }
};

// get Admin By ID

const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const findData = await Admin.findById(id);
    if (findData) {
      res
        .status(200)
        .json({ message: "got the Admin Details ", data: findData });
    } else {
      res.status(404).json({ message: "requested Admin Details is not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error in fetching Admin ", error });
  }
};

// admin post
const createAdmin = async (req, res) => {
  const { adminName, adminEmail, adminPassword } = req.body;

  if (!adminName || !adminEmail || !adminPassword) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields" });
  }

  try {
    const existingAdmin = await Admin.findOne({ adminEmail });
    if (existingAdmin) {
      console.log("admin");

      return res.status(400).json({ message: "This email is already exists " });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10); // Generate salt
    const hashedPassword = await bcrypt.hash(adminPassword, salt); // Hash the password

    // Create new admin with hashed password
    const newAdmin = new Admin({
      adminName,
      adminEmail,
      adminPassword: hashedPassword, // Store the hashed password
    });

    await newAdmin.save();
    res.status(201).json({ message: "Admin created succeccfully" });
  } catch (error) {
    console.error(error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "server error" });
  }
};

// delete Admin
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Admin.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Admin Account  not found" });
    } else {
      res.json({ message: "Admin Account deleted successfully", deleted });
    }
  } catch (error) {
    console.error("Error deleting in Admin Account:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//  update Brand by id

const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminName, adminEmail } = req.body;
    const findItem = await Admin.findById(id);

    const existingAdmin = await Admin.findOne({ adminEmail });
    if (existingAdmin) {
      return res.status(400).json({ message: "This email is already exists " });
    }

    if (findItem) {
      const updateItem = await Admin.findByIdAndUpdate(
        id,
        { adminName, adminEmail },
        { new: true },
      );
      if (adminName && !adminEmail) {
        res.status(201).send({ message: "Admin Name Changed", updateItem });
      } else if (adminEmail && !adminName) {
        res.status(201).send({ message: "Admin Email Changed", updateItem });
      } else if (adminName && adminEmail) {
        res
          .status(201)
          .send({ message: "Admin Name And email Changed", updateItem });
      } else {
        res
          .status(201)
          .send({ message: "required admin email and name for change" });
      }
    } else {
      res.status(404).json({ message: "Admin account is not found " });
    }
  } catch (error) {
    console.error("Error updateing in admin Detailes:", error);
    res.status(500).json({ message: "Internal server error" });
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
  const { adminEmail } = req.body;
  // console.log(adminEmail);

  if (!adminEmail) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const admin = await Admin.findOne({ adminEmail });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Generate OTP
    const otp = otpGenerator.generate(4, {
      digits: true,
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false, // Ensure no lowercase letters
    });
    otpStorage[adminEmail] = otp;

    // Email message
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "OTP sent successfully" });

    // Set OTP expiry (optional)
    setTimeout(() => {
      delete otpStorage[adminEmail];
    }, 300000); // OTP expires in 5 minutes
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Error sending OTP", error });
  }
};
// Verify OTP
const verifyOTP = (req, res) => {
  const { adminEmail, otp } = req.body;

  if (otpStorage[adminEmail] === otp) {
    delete otpStorage[adminEmail]; // Remove OTP after use
    res.status(200).json({ message: "OTP verified successfully" });
  } else {
    res.status(400).json({ message: "Invalid or expired OTP" });
  }
};

//  update Brand by id

const updateAdminpassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminPassword } = req.body;
    const updateItem = await Admin.findByIdAndUpdate(
      id,
      { adminPassword },
      { new: true },
    );
    if (updateItem) {
      res.status(200).send({ message: "Admin Password Changed", updateItem });
    } else {
      res.status(400).send({ message: "required Password for change" });
    }
  } catch (error) {
    console.error("Error in password changing:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createAdmin,
  getAdmin,
  getAdminById,
  deleteAdmin,
  updateAdmin,
  sendOTP,
  verifyOTP,
  updateAdminpassword,
};
