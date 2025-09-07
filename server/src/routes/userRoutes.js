const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateLocationUpdate, handleValidationErrors } = require('../middleware/validation');
const { updateLocation, getProfile, updateProfile, updateUserStats, getRegisteredHospitals } = require('../controllers/userController');

// @route   PUT /api/users/location
// @desc    Update user location
// @access  Private
router.put('/location', protect, validateLocationUpdate, handleValidationErrors, updateLocation);

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, getProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, updateProfile);

// @route   PUT /api/users/stats
// @desc    Update user stats (donations, badges)
// @access  Private
router.put('/stats', protect, updateUserStats);

// @route   GET /api/users/hospitals
// @desc    Get registered hospitals for patients
// @access  Private
router.get('/hospitals', protect, getRegisteredHospitals);

module.exports = router;
