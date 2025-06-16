const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  // Get token from header
  const token = req.header("x-auth-token");

  // Check if token is missing
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    // Verify token
    jwt.verify(token, "jwtSecret", (error, decoded) => {
      if (error) {
        return res.status(401).json({ msg: "Token is not valid" });
      }

      // Assign userType based on decoded data
      if (decoded.userType === "user") {
        req.user = decoded.user;
        req.userType = "user";
      } else if (decoded.userType === "seller") {
        req.seller = decoded.user;
        req.userType = "seller";
      } else if (decoded.userType === "admin") {
        req.admin = decoded.user;
        req.userType = "admin";
      } else {
        return res.status(401).json({ msg: "Invalid token" });
      }

      next(); // Move to next middleware or route
    });
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

module.exports = auth;

/// we should change this code
