const Admin = require("../models/adminModels");
const Seller = require("../models/sellerModels");
const User = require("../models/userModels");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const { config } = require("dotenv");

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
    "string.empty": "Email is required",
    "string.email": "Email is not valid",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
    "string.empty": "Password is required",
  }),
});

const Login = async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details });
  }

  const { email, password } = req.body;

  try {
    // Check if the email exists in any collection
    const user = await User.findOne({ userEmail: email });
    const seller = await Seller.findOne({ sellerEmail: email });
    const admin = await Admin.findOne({ adminEmail: email });

    if (!user && !seller && !admin) {
      return res
        .status(400)
        .json({ error: "No account found with this email" });
    }

    // Verify the password for the corresponding user, seller, or admin
    let isValidPassword = false;
    let userData;

    if (user) {
      isValidPassword = await bcrypt.compare(password, user.userPassword);
      userData = user;
    } else if (seller) {
      if (seller.qcStatus !== 1) {
        return res.status(403).json({
          error:
            "Your account is not yet verified by admin. Please wait for verification to login and Sell products.",
        });
      }
      isValidPassword = await bcrypt.compare(password, seller.sellerPassword);
      userData = seller;
    } else if (admin) {
      isValidPassword = await bcrypt.compare(password, admin.adminPassword);
      userData = admin;
    }

    if (!isValidPassword) {
      return res
        .status(400)
        .json({ error: "Incorrect password. Please check and try again." });
    }

    // Generate JWT token
    const payload = {
      user: {
        id: userData._id,
      },
      userType: user ? "user" : seller ? "seller" : admin ? "admin" : null,
    };

    jwt.sign(
      payload,
      "jwtSecret", // Replace with process.env.JWT_SECRET
      { expiresIn: "2h" }, // Token expires in 1 hour
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          userType: user ? "user" : seller ? "seller" : admin ? "admin" : null,
        });
      },
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

const getLogin = async (req, res) => {
  try {
    if (req.userType === "user") {
      // If the user is authenticated as a regular user
      const user = await User.findById(req.user.id).select("-password");
      res.json(user);
    } else if (req.userType === "seller") {
      // If the user is authenticated as a seller
      const seller = await Seller.findById(req.seller.id).select("-password");
      res.json(seller);
    } else if (req.userType === "admin") {
      // If the user is authenticated as an admin
      const admin = await Admin.findById(req.admin.id).select("-password");
      res.json(admin);
    } else {
      // If neither user nor seller is authenticated
      res.status(400).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  Login,
  getLogin,
};
