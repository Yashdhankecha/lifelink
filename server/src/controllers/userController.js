const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Update user location
// @route   PUT /api/users/location
// @access  Private
exports.updateLocation = asyncHandler(async (req, res, next) => {
    const { location } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update location
    user.location = {
      latitude: location.latitude,
      longitude: location.longitude
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      location: user.location
    });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    const user = await User.findById(userId).select('-password -emailVerificationOTP -emailVerificationExpire -resetPasswordToken -resetPasswordExpire');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { 
      name, 
      email, 
      phone, 
      bloodGroup, 
      dateOfBirth, 
      address, 
      emergencyContact, 
      medicalHistory, 
      availability 
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update allowed fields (including empty strings and null values)
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (address !== undefined) user.address = address;
    if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;
    if (medicalHistory !== undefined) user.medicalHistory = medicalHistory;
    if (availability !== undefined) user.availability = availability;

    await user.save();

    // Remove sensitive fields from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.emailVerificationOTP;
    delete userResponse.emailVerificationExpire;
    delete userResponse.resetPasswordToken;
    delete userResponse.resetPasswordExpire;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: userResponse
    });
});

// @desc    Update user stats (donations, badges)
// @route   PUT /api/users/stats
// @access  Private
exports.updateUserStats = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { totalDonations, badges } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update stats
    if (totalDonations !== undefined) user.totalDonations = totalDonations;
    if (badges !== undefined) user.badges = badges;

    await user.save();

    // Remove sensitive fields from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.emailVerificationOTP;
    delete userResponse.emailVerificationExpire;
    delete userResponse.resetPasswordToken;
    delete userResponse.resetPasswordExpire;

    res.status(200).json({
      success: true,
      message: 'User stats updated successfully',
      user: userResponse
    });
});

// @desc    Get registered hospitals for patients
// @route   GET /api/users/hospitals
// @access  Private
exports.getRegisteredHospitals = asyncHandler(async (req, res, next) => {
    const Hospital = require('../models/Hospital');
    
    const hospitals = await Hospital.find({ 
      isVerified: true, 
      isActive: true 
    }).select('hospitalName address city state pincode contactNumber email');
    
    res.json({
      success: true,
      data: hospitals
    });
});