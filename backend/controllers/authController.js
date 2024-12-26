const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Sign In User
// @route   POST /api/v1/auth/sign-in
exports.signIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
        description: "No user found with this email",
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
        description: "Password does not match",
      });
    }

    // Generate token
    const accessToken = generateToken(user._id);

    res.status(200).json({
      status: "success",
      message: "Login successful",
      accessToken,
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Server error",
      description: error.message,
    });
  }
};

// @desc    Sign Up User
// @route   POST /api/v1/auth/sign-up
exports.signUp = async (req, res) => {
  const {
    firstName,
    lastName,
    phone,
    dateOfBirth,
    sex,
    address,
    email,
    password,
    type,
  } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "Người dùng đã tồn tại",
        description:
          "An account with this email or phone number already exists",
      });
    }

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      phone,
      dateOfBirth,
      sex,
      address,
      email,
      password,
      type: type || 1, // Default to user if not specified
    });

    // Generate token
    const accessToken = generateToken(user._id);

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      description: "User account created",
      accessToken,
      userId: user._id,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        status: "error",
        message: "Validation Failed",
        description: Object.values(error.errors)
          .map((err) => err.message)
          .join(", "),
      });
    }

    res.status(500).json({
      status: "error",
      message: "Registration failed",
      description: error.message,
    });
  }
};

// @desc    Initiate Password Reset
// @route   POST /api/v1/auth/reset-password/request
exports.resetPasswordRequest = async (req, res) => {
  const { email, type } = req.body;

  try {
    if (!email || typeof type !== "number") {
      return res.status(400).json({
        status: "error",
        message: "Email và loại người dùng là bắt buộc",
      });
    }

    const user = await User.findOne({ email, type });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy người dùng với email và loại này",
      });
    }

    // Generate a random 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Save OTP and expiration time in the user model
    user.resetOTP = otp;
    user.resetOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false }); // Skip password hashing

    console.log(`Generated OTP for ${email}: ${otp}`);

    res.status(200).json({
      status: "success",
      message: "OTP đã được gửi đến email của bạn",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Có lỗi xảy ra khi xử lý yêu cầu",
      description: error.message,
    });
  }
};

// @desc    Check Password Reset OTP
// @route   GET /api/v1/auth/reset-password/check
exports.checkResetPasswordOTP = async (req, res) => {
  const { resetKey, type } = req.body;

  try {
    if (!resetKey || typeof type !== "number") {
      return res.status(400).json({
        status: "error",
        message: "OTP và loại người dùng là bắt buộc",
      });
    }

    const user = await User.findOne({ resetOTP: resetKey, type });

    if (!user) {
      return res.status(404).json({
        isValid: false,
        message: "OTP không hợp lệ",
      });
    }

    if (Date.now() > user.resetOTPExpires) {
      return res.status(400).json({
        isValid: false,
        message: "OTP đã hết hạn",
      });
    }

    res.status(200).json({
      isValid: true,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Có lỗi xảy ra khi kiểm tra OTP",
      description: error.message,
    });
  }
};

// @desc    Finish Password Reset
// @route   POST /api/v1/auth/reset-password/finish
exports.resetPasswordFinish = async (req, res) => {
  const { resetKey, type, newPassword } = req.body;

  try {
    if (!resetKey || typeof type !== "number" || !newPassword) {
      return res.status(400).json({
        status: "error",
        message: "OTP, loại người dùng, và mật khẩu mới là bắt buộc",
      });
    }

    const user = await User.findOne({ resetOTP: resetKey, type });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "OTP không hợp lệ hoặc người dùng không tồn tại",
      });
    }

    if (Date.now() > user.resetOTPExpires) {
      return res.status(400).json({
        status: "error",
        message: "OTP đã hết hạn",
      });
    }

    // Set the new password - let the pre-save middleware handle the hashing
    user.password = newPassword;

    // Clear OTP fields
    user.resetOTP = undefined;
    user.resetOTPExpires = undefined;

    await user.save(); // This will trigger the pre-save hook to hash the password

    res.status(200).json({
      status: "success",
      message: "Mật khẩu đã được cập nhật thành công",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Có lỗi xảy ra khi cập nhật mật khẩu",
      description: error.message,
    });
  }
};
