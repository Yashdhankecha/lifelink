const express = require('express');
const {
  registerUser,
  registerHospital,
  registerAdmin,
  loginUser,
  loginHospital,
  loginAdmin,
  logout,
  getMe
} = require('../controllers/authController');
const {
  sendOTP,
  verifyOTP,
  resendOTP
} = require('../controllers/otpController');
const { protect } = require('../middleware/auth');
const {
  validateUserSignup,
  validateHospitalSignup,
  validateAdminSignup,
  validateLogin,
  handleValidationErrors
} = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/auth/user/register
// @desc    Register a new user
// @access  Public
router.post('/user/register', validateUserSignup, handleValidationErrors, registerUser);

// @route   POST /api/auth/hospital/register
// @desc    Register a new hospital
// @access  Public
router.post('/hospital/register', validateHospitalSignup, handleValidationErrors, registerHospital);

// @route   POST /api/auth/admin/register
// @desc    Register a new admin
// @access  Public (should be restricted in production)
router.post('/admin/register', validateAdminSignup, handleValidationErrors, registerAdmin);

// @route   POST /api/auth/user/login
// @desc    Login user
// @access  Public
router.post('/user/login', validateLogin, handleValidationErrors, loginUser);

// @route   POST /api/auth/hospital/login
// @desc    Login hospital
// @access  Public
router.post('/hospital/login', validateLogin, handleValidationErrors, loginHospital);

// @route   POST /api/auth/admin/login
// @desc    Login admin
// @access  Public
router.post('/admin/login', validateLogin, handleValidationErrors, loginAdmin);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, logout);

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, getMe);

// @route   POST /api/auth/send-otp
// @desc    Send OTP for email verification
// @access  Public
router.post('/send-otp', sendOTP);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for email verification
// @access  Public
router.post('/verify-otp', verifyOTP);

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP for email verification
// @access  Public
router.post('/resend-otp', resendOTP);

module.exports = router;
