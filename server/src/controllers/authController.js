const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Admin = require('../models/Admin');
const { generateToken } = require('../utils/generateToken');
const { generateOTP, setOTPExpiry } = require('../utils/generateOTP');
const { sendOTPEmail } = require('../utils/emailService');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Register user
// @route   POST /api/auth/user/register
// @access  Public
exports.registerUser = asyncHandler(async (req, res, next) => {
    const { name, email, password, bloodGroup, location } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check if email is already used by hospital
    const existingHospital = await Hospital.findOne({ email });
    if (existingHospital) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered as a hospital. Please use a different email or contact support.'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      bloodGroup,
      location
    });

    // Generate OTP for email verification
    const otp = generateOTP();
    const otpExpiry = setOTPExpiry();
    
    user.emailVerificationOTP = otp;
    user.emailVerificationExpire = otpExpiry;
    await user.save();

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, 'Donor/Patient');
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email for OTP verification.',
        email: user.email,
        userType: 'user'
      });
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError.message);
      console.error('Full error:', emailError);
      
      // Provide more specific error message
      let errorMessage = 'Email service is currently unavailable. Please use the OTP below for verification.';
      if (emailError.message.includes('placeholder')) {
        errorMessage = 'Email configuration needs to be updated. Please use the OTP below for verification.';
      } else if (emailError.message.includes('missing')) {
        errorMessage = 'Email configuration is incomplete. Please use the OTP below for verification.';
      }
      
      res.status(201).json({
        success: true,
        message: `User registered successfully. ${errorMessage}`,
        email: user.email,
        userType: 'user',
        otp: otp, // Show OTP when email fails
        emailError: process.env.NODE_ENV === 'development' ? emailError.message : undefined
      });
    }
});

// @desc    Register hospital
// @route   POST /api/auth/hospital/register
// @access  Public
exports.registerHospital = asyncHandler(async (req, res, next) => {
    const { name, email, password, hospitalName, address, licenseNumber, contactNumber } = req.body;

    // Check if hospital already exists
    const existingHospital = await Hospital.findOne({ 
      $or: [{ email }, { licenseNumber }] 
    });
    if (existingHospital) {
      return res.status(400).json({
        success: false,
        message: 'Hospital already exists with this email or license number'
      });
    }

    // Check if email is already used by user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered as a user. Please use a different email or contact support.'
      });
    }

    // Create hospital
    const hospital = await Hospital.create({
      name,
      email,
      password,
      hospitalName,
      address,
      licenseNumber,
      contactNumber,
      phone: contactNumber // Map contactNumber to phone for frontend compatibility
    });

    // Generate OTP for email verification
    const otp = generateOTP();
    const otpExpiry = setOTPExpiry();
    
    hospital.emailVerificationOTP = otp;
    hospital.emailVerificationExpire = otpExpiry;
    await hospital.save();

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, 'Hospital');
      
      res.status(201).json({
        success: true,
        message: 'Hospital registered successfully. Please check your email for OTP verification.',
        email: hospital.email,
        userType: 'hospital'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      res.status(201).json({
        success: true,
        message: 'Hospital registered successfully. Email service is currently unavailable. Please use the OTP below for verification.',
        email: hospital.email,
        userType: 'hospital',
        otp: otp // Show OTP when email fails
      });
    }
});

// @desc    Register admin
// @route   POST /api/auth/admin/register
// @access  Public (should be restricted in production)
exports.registerAdmin = asyncHandler(async (req, res, next) => {
    const { name, email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists with this email'
      });
    }

    // Check if email is already used by user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered as a user. Please use a different email or contact support.'
      });
    }

    // Check if email is already used by hospital
    const existingHospital = await Hospital.findOne({ email });
    if (existingHospital) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered as a hospital. Please use a different email or contact support.'
      });
    }

    // Create admin
    const admin = await Admin.create({
      name,
      email,
      password
    });

    // Generate OTP for email verification
    const otp = generateOTP();
    const otpExpiry = setOTPExpiry();
    
    admin.emailVerificationOTP = otp;
    admin.emailVerificationExpire = otpExpiry;
    await admin.save();

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, 'Admin');
      
      res.status(201).json({
        success: true,
        message: 'Admin registered successfully. Please check your email for OTP verification.',
        email: admin.email,
        userType: 'admin'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      res.status(201).json({
        success: true,
        message: 'Admin registered successfully. Email service is currently unavailable. Please use the OTP below for verification.',
        email: admin.email,
        userType: 'admin',
        otp: otp // Show OTP when email fails
      });
    }
});

// @desc    Login user
// @route   POST /api/auth/user/login
// @access  Public
exports.loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in. Check your email for OTP.',
        email: user.email,
        userType: 'user'
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    // Set cookie options
    const options = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none'
    };

    res.status(200).cookie('token', token, options).json({
      success: true,
      message: 'User logged in successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bloodGroup: user.bloodGroup,
        location: user.location,
        availability: user.availability
      }
    });
});

// @desc    Login hospital
// @route   POST /api/auth/hospital/login
// @access  Public
exports.loginHospital = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Check for hospital
    const hospital = await Hospital.findOne({ email }).select('+password');
    if (!hospital) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await hospital.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if email is verified
    if (!hospital.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in. Check your email for OTP.',
        email: hospital.email,
        userType: 'hospital'
      });
    }

    // Generate token
    const token = generateToken(hospital._id, hospital.role);

    // Set cookie options
    const options = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none'
    };

    res.status(200).cookie('token', token, options).json({
      success: true,
      message: 'Hospital logged in successfully',
      hospital: {
        id: hospital._id,
        name: hospital.name,
        email: hospital.email,
        role: hospital.role,
        hospitalName: hospital.hospitalName,
        address: hospital.address,
        isVerified: hospital.isVerified,
        verifiedStatus: hospital.verifiedStatus
      }
    });
});

// @desc    Login admin
// @route   POST /api/auth/admin/login
// @access  Public
exports.loginAdmin = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Check for admin
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if email is verified
    if (!admin.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in. Check your email for OTP.',
        email: admin.email,
        userType: 'admin'
      });
    }

    // Generate token
    const token = generateToken(admin._id, admin.role);

    // Set cookie options
    const options = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none'
    };

    res.status(200).cookie('token', token, options).json({
      success: true,
      message: 'Admin logged in successfully',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none'
    });

    res.status(200).json({
      success: true,
      message: 'User logged out successfully'
    });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
    const user = req.user;

    res.status(200).json({
      success: true,
      user
    });
});
