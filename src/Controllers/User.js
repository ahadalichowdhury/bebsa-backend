const User = require("../models/User");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "bebsa_company_sherpur"; 
// Register
exports.register = async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    const user = new User({ name, password });
    await user.save();

    res.status(201).json({ success: true, message: "User registered successfully", user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { name, password } = req.body;

    const user = await User.findOne({ name, password });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Generate JWT token with 1-year expiration
    const token = jwt.sign(
      { userId: user._id, name: user.name },
      SECRET_KEY,
      { expiresIn: "1y" } // Token valid for 1 year
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token, // Send the token in response
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};
// Forget Password (Reset Password)
exports.verifyUser = async (req, res) => {
  try {
    const { name } = req.body;

    const user = await User.findOne({ name });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User verified. Proceed to reset password." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { name, newPassword } = req.body;

    const user = await User.findOne({ name });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.password = newPassword; // Update password
    await user.save();

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

exports.decodeToken = (req, res) => {
  try {
    const { token } = req.body; // Take the token from the request body

    if (!token) {
      return res.status(400).json({ success: false, message: "No token provided" });
    }

    // Decode the token
    const decoded = jwt.decode(token); // No need for verification here, just decoding

    if (!decoded) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    res.status(200).json({
      success: true,
      message: "Token decoded successfully",
      decodedData: decoded, // Send the decoded data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

