const express = require("express");
const {
  signIn,
  signUp,
  resetPasswordRequest,
  checkResetPasswordOTP,
  resetPasswordFinish,
} = require("../controllers/authController");

const router = express.Router();

// Authentication Routes
router.post("/sign-in", signIn);
router.post("/sign-up", signUp);
router.post("/reset-password/request", resetPasswordRequest);
router.get("/reset-password/check", checkResetPasswordOTP);
router.post("/reset-password/finish", resetPasswordFinish);

module.exports = router;
