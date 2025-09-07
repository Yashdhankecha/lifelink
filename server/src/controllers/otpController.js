const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Admin = require('../models/Admin');
const { generateOTP, setOTPExpiry } = require('../utils/generateOTP');
const { sendOTPEmail } = require('../utils/emailService');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Send OTP for email verification
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOTP = asyncHandler(async (req, res, next) => {
    const { email, userType } = req.body;

    if (!email || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Email and user type are required'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = setOTPExpiry();

    let user;
    let userTypeLabel;

    // Find user by type and email
    switch (userType) {
      case 'user':
        user = await User.findOne({ email });
        userTypeLabel = 'Donor/Patient';
        break;
      case 'hospital':
        user = await Hospital.findOne({ email });
        userTypeLabel = 'Hospital';
        break;
      case 'admin':
        user = await Admin.findOne({ email });
        userTypeLabel = 'Admin';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid user type'
        });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user with OTP
    user.emailVerificationOTP = otp;
    user.emailVerificationExpire = otpExpiry;
    await user.save();

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, userTypeLabel);
      
      res.status(200).json({
        success: true,
        message: 'OTP sent successfully to your email'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.'
      });
    }
});

// @desc    Verify OTP for email verification
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = asyncHandler(async (req, res, next) => {
    const { email, otp, userType } = req.body;

    if (!email || !otp || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and user type are required'
      });
    }

    let user;

    // Find user by type and email
    switch (userType) {
      case 'user':
        user = await User.findOne({ email });
        break;
      case 'hospital':
        user = await Hospital.findOne({ email });
        break;
      case 'admin':
        user = await Admin.findOne({ email });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid user type'
        });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if OTP exists and is not expired
    if (!user.emailVerificationOTP || !user.emailVerificationExpire) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new OTP.'
      });
    }

    if (user.emailVerificationExpire < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (user.emailVerificationOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.'
      });
    }

    // Mark email as verified
    user.isVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now login.'
    });
});

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = asyncHandler(async (req, res, next) => {
    const { email, userType } = req.body;

    if (!email || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Email and user type are required'
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = setOTPExpiry();

    let user;
    let userTypeLabel;

    // Find user by type and email
    switch (userType) {
      case 'user':
        user = await User.findOne({ email });
        userTypeLabel = 'Donor/Patient';
        break;
      case 'hospital':
        user = await Hospital.findOne({ email });
        userTypeLabel = 'Hospital';
        break;
      case 'admin':
        user = await Admin.findOne({ email });
        userTypeLabel = 'Admin';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid user type'
        });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user with new OTP
    user.emailVerificationOTP = otp;
    user.emailVerificationExpire = otpExpiry;
    await user.save();

    // Send new OTP email
    try {
      await sendOTPEmail(email, otp, userTypeLabel);
      
      res.status(200).json({
        success: true,
        message: 'New OTP sent successfully to your email'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.'
      });
    }
});
