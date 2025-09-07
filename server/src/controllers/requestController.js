const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Create a new blood request
// @route   POST /api/requests
// @access  Private (User only)
const createBloodRequest = asyncHandler(async (req, res) => {
  const {
    bloodGroup,
    unitsNeeded,
    urgency,
    hospitalName,
    hospitalAddress,
    location,
    notes
  } = req.body;

  // Validate required fields
  if (!bloodGroup || !unitsNeeded || !hospitalName || !hospitalAddress || !location) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields'
    });
  }

  // Validate location
  if (!location.latitude || !location.longitude) {
    return res.status(400).json({
      success: false,
      message: 'Please provide valid location coordinates'
    });
  }

  const bloodRequest = await BloodRequest.create({
    requesterId: req.user.id,
    bloodGroup,
    unitsNeeded,
    urgency: urgency || 'normal',
    hospitalName,
    hospitalAddress,
    location,
    notes
  });

  // Populate requester details
  await bloodRequest.populate('requesterId', 'name email phone');

  res.status(201).json({
    success: true,
    data: bloodRequest,
    message: 'Blood request created successfully'
  });
});

// @desc    Get all blood requests (for general viewing)
// @route   GET /api/requests/all
// @access  Private (User only)
const getAllRequests = asyncHandler(async (req, res) => {
  const { status = 'pending', limit = 50, compatible = false } = req.query;

  // Build base query
  let query = { status: status };

  // If compatible is true, filter by user's compatible blood groups
  if (compatible === 'true') {
    const user = await User.findById(req.user.id).select('bloodGroup');
    if (user && user.bloodGroup) {
      const compatibleGroups = getCompatibleBloodGroups(user.bloodGroup);
      if (compatibleGroups.length > 0) {
        query.bloodGroup = { $in: compatibleGroups };
        query.requesterId = { $ne: req.user.id }; // Exclude user's own requests
      }
    }
  }

  // Get requests
  const allRequests = await BloodRequest.find(query)
  .populate('requesterId', 'name phone email')
  .populate('donorId', 'name phone email bloodGroup')
  .sort({ urgency: -1, createdAt: -1 }) // Critical requests first, then by newest
  .limit(parseInt(limit));

  res.json({
    success: true,
    data: allRequests,
    count: allRequests.length
  });
});

// @desc    Get compatible blood requests for donors
// @route   GET /api/requests/compatible
// @access  Private (User only)
const getCompatibleRequests = asyncHandler(async (req, res) => {
  const { status = 'pending', limit = 20 } = req.query;

  // Get user's blood group
  const user = await User.findById(req.user.id).select('bloodGroup');
  
  if (!user || !user.bloodGroup) {
    return res.status(400).json({
      success: false,
      message: 'User blood group not found'
    });
  }

  // Find compatible blood groups
  const compatibleGroups = getCompatibleBloodGroups(user.bloodGroup);

  // Find compatible requests (excluding user's own requests)
  const compatibleRequests = await BloodRequest.find({
    bloodGroup: { $in: compatibleGroups },
    status: status,
    requesterId: { $ne: req.user.id } // Exclude user's own requests
  })
  .populate('requesterId', 'name phone email')
  .populate('donorId', 'name phone email bloodGroup')
  .sort({ urgency: -1, createdAt: -1 }) // Critical requests first, then by newest
  .limit(parseInt(limit));

  res.json({
    success: true,
    data: compatibleRequests,
    count: compatibleRequests.length
  });
});

// @desc    Get nearby blood requests for donors
// @route   GET /api/requests/nearby
// @access  Private (User only)
const getNearbyRequests = asyncHandler(async (req, res) => {
  const { latitude, longitude, radius = 10 } = req.query; // radius in km, default 10km

  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: 'Please provide your location coordinates'
    });
  }

  // Get user's blood group
  const user = await User.findById(req.user.id).select('bloodGroup availability');

  // Find compatible blood groups (optional filtering)
  const compatibleGroups = user.bloodGroup ? getCompatibleBloodGroups(user.bloodGroup) : null;

  // Build query
  const query = {
    status: 'pending',
    requesterId: { $ne: req.user.id }, // Exclude user's own requests
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        $maxDistance: radius * 1000 // Convert km to meters
      }
    }
  };

  // Add blood group filter if user has blood group
  if (compatibleGroups && compatibleGroups.length > 0) {
    query.bloodGroup = { $in: compatibleGroups };
  }

  // Find nearby requests using geospatial query
  const nearbyRequests = await BloodRequest.find(query)
  .populate('requesterId', 'name phone email')
  .populate('donorId', 'name phone email bloodGroup')
  .sort({ urgency: -1, createdAt: -1 }) // Critical requests first, then by newest
  .limit(20);

  res.json({
    success: true,
    data: nearbyRequests,
    count: nearbyRequests.length
  });
});

// @desc    Accept a blood request
// @route   PATCH /api/requests/:id/accept
// @access  Private (User only - Donor)
const acceptBloodRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log('Accept request called for ID:', id);
  console.log('User ID:', req.user.id);

  const bloodRequest = await BloodRequest.findById(id);
  console.log('Blood request found:', bloodRequest ? 'Yes' : 'No');

  if (!bloodRequest) {
    return res.status(404).json({
      success: false,
      message: 'Blood request not found'
    });
  }

  if (bloodRequest.status !== 'pending') {
    console.log('Request status is not pending:', bloodRequest.status);
    return res.status(400).json({
      success: false,
      message: 'This request is no longer available'
    });
  }

  // Check if user is available
  const user = await User.findById(req.user.id);
  console.log('User found:', user ? 'Yes' : 'No');
  console.log('User availability:', user?.availability);
  console.log('User blood group:', user?.bloodGroup);
  console.log('Request blood group:', bloodRequest.bloodGroup);

  if (!user.availability) {
    return res.status(400).json({
      success: false,
      message: 'You are currently not available for donations'
    });
  }

  // Check blood group compatibility
  const compatibleGroups = getCompatibleBloodGroups(user.bloodGroup);
  console.log('Compatible groups for', user.bloodGroup, ':', compatibleGroups);
  if (!compatibleGroups.includes(bloodRequest.bloodGroup)) {
    return res.status(400).json({
      success: false,
      message: 'Your blood group is not compatible with this request'
    });
  }

  // Update the request
  bloodRequest.donorId = req.user.id;
  bloodRequest.acceptedBy = req.user.id;
  bloodRequest.status = 'accepted';
  bloodRequest.acceptedAt = new Date();
  await bloodRequest.save();

  // Populate donor details
  await bloodRequest.populate('donorId', 'name email phone bloodGroup');
  await bloodRequest.populate('acceptedBy', 'name email phone bloodGroup');
  await bloodRequest.populate('requesterId', 'name email phone');

  // Get hospital details for the donor
  const hospitalDetails = {
    hospitalName: bloodRequest.hospitalName,
    hospitalAddress: bloodRequest.hospitalAddress,
    requesterName: bloodRequest.requesterId.name,
    requesterPhone: bloodRequest.requesterId.phone
  };

  console.log('Request accepted successfully');
  res.json({
    success: true,
    data: bloodRequest,
    hospitalDetails: hospitalDetails,
    message: 'Blood request accepted successfully'
  });
});

// @desc    Hospital confirm donor acceptance
// @route   POST /api/requests/:id/confirm
// @access  Private (Hospital only)
const confirmBloodRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const bloodRequest = await BloodRequest.findById(id);

  if (!bloodRequest) {
    return res.status(404).json({
      success: false,
      message: 'Blood request not found'
    });
  }

  if (bloodRequest.status !== 'accepted') {
    return res.status(400).json({
      success: false,
      message: 'Request must be accepted by a donor before confirmation'
    });
  }

  // Check if the current user is the hospital that created this request
  // For now, we'll check if the requester is a hospital user
  // In a real system, you might want to link requests to hospital accounts
  const requester = await User.findById(bloodRequest.requesterId);
  if (!requester || requester.role !== 'hospital') {
    return res.status(403).json({
      success: false,
      message: 'Only the hospital that created this request can confirm it'
    });
  }

  // Update the request
  bloodRequest.status = 'confirmed';
  bloodRequest.confirmedAt = new Date();
  await bloodRequest.save();

  // Populate all details
  await bloodRequest.populate('donorId', 'name email phone');
  await bloodRequest.populate('acceptedBy', 'name email phone');
  await bloodRequest.populate('requesterId', 'name email phone');

  res.json({
    success: true,
    data: bloodRequest,
    message: 'Blood request confirmed successfully'
  });
});

// @desc    Complete blood request
// @route   POST /api/requests/:id/complete
// @access  Private (Hospital only)
const completeBloodRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const bloodRequest = await BloodRequest.findById(id);

  if (!bloodRequest) {
    return res.status(404).json({
      success: false,
      message: 'Blood request not found'
    });
  }

  if (bloodRequest.status !== 'confirmed') {
    return res.status(400).json({
      success: false,
      message: 'Request must be confirmed before completion'
    });
  }

  // Check if the current user is the hospital that created this request
  const requester = await User.findById(bloodRequest.requesterId);
  if (!requester || requester.role !== 'hospital') {
    return res.status(403).json({
      success: false,
      message: 'Only the hospital that created this request can complete it'
    });
  }

  // Update the request
  bloodRequest.status = 'completed';
  bloodRequest.completedAt = new Date();
  await bloodRequest.save();

  // Populate all details
  await bloodRequest.populate('donorId', 'name email phone');
  await bloodRequest.populate('acceptedBy', 'name email phone');
  await bloodRequest.populate('requesterId', 'name email phone');

  res.json({
    success: true,
    data: bloodRequest,
    message: 'Blood request completed successfully'
  });
});

// @desc    Update request status
// @route   PATCH /api/requests/:id/status
// @access  Private (Requester, Donor, or Admin)
const updateRequestStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const bloodRequest = await BloodRequest.findById(id);

  if (!bloodRequest) {
    return res.status(404).json({
      success: false,
      message: 'Blood request not found'
    });
  }

  // Check permissions
  const isRequester = bloodRequest.requesterId.toString() === req.user.id;
  const isDonor = bloodRequest.donorId && bloodRequest.donorId.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isRequester && !isDonor && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this request'
    });
  }

  // Validate status transition
  const validTransitions = {
    'pending': ['accepted', 'cancelled'],
    'accepted': ['on_the_way', 'cancelled'],
    'on_the_way': ['completed', 'cancelled'],
    'completed': [],
    'cancelled': []
  };

  if (!validTransitions[bloodRequest.status].includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot change status from ${bloodRequest.status} to ${status}`
    });
  }

  // Update status
  bloodRequest.status = status;
  
  if (status === 'completed') {
    bloodRequest.completedAt = new Date();
    
    // Update donor's last donation date
    if (bloodRequest.donorId) {
      await User.findByIdAndUpdate(bloodRequest.donorId, {
        lastDonationDate: new Date()
      });
    }
  }

  await bloodRequest.save();

  // Populate all details
  await bloodRequest.populate('requesterId', 'name email phone');
  await bloodRequest.populate('donorId', 'name email phone');

  res.json({
    success: true,
    data: bloodRequest,
    message: 'Request status updated successfully'
  });
});

// @desc    Get user's own requests
// @route   GET /api/requests/my
// @access  Private (User only)
const getMyRequests = asyncHandler(async (req, res) => {
  const { status, type } = req.query; // type: 'created' or 'accepted'

  let query = {};

  if (type === 'created') {
    query.requesterId = req.user.id;
  } else if (type === 'accepted') {
    query.donorId = req.user.id;
  } else {
    // Get both created and accepted requests
    query.$or = [
      { requesterId: req.user.id },
      { donorId: req.user.id }
    ];
  }

  if (status) {
    query.status = status;
  }

  const requests = await BloodRequest.find(query)
    .populate('requesterId', 'name email phone')
    .populate('donorId', 'name email phone bloodGroup')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: requests,
    count: requests.length
  });
});

// @desc    Update a blood request
// @route   PUT /api/requests/:id
// @access  Private (Requester only)
const updateBloodRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    bloodGroup,
    unitsNeeded,
    urgency,
    hospitalName,
    hospitalAddress,
    location,
    notes
  } = req.body;

  const bloodRequest = await BloodRequest.findById(id);

  if (!bloodRequest) {
    return res.status(404).json({
      success: false,
      message: 'Blood request not found'
    });
  }

  // Check if user is the requester
  if (bloodRequest.requesterId.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this request'
    });
  }

  // Check if request can be updated (only pending requests can be updated)
  if (bloodRequest.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Only pending requests can be updated'
    });
  }

  // Update fields
  if (bloodGroup) bloodRequest.bloodGroup = bloodGroup;
  if (unitsNeeded) bloodRequest.unitsNeeded = unitsNeeded;
  if (urgency) bloodRequest.urgency = urgency;
  if (hospitalName) bloodRequest.hospitalName = hospitalName;
  if (hospitalAddress) bloodRequest.hospitalAddress = hospitalAddress;
  if (location) bloodRequest.location = location;
  if (notes !== undefined) bloodRequest.notes = notes;

  await bloodRequest.save();

  // Populate requester details
  await bloodRequest.populate('requesterId', 'name email phone');

  res.json({
    success: true,
    data: bloodRequest,
    message: 'Blood request updated successfully'
  });
});

// @desc    Delete a blood request
// @route   DELETE /api/requests/:id
// @access  Private (Requester only)
const deleteBloodRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const bloodRequest = await BloodRequest.findById(id);

  if (!bloodRequest) {
    return res.status(404).json({
      success: false,
      message: 'Blood request not found'
    });
  }

  // Check if user is the requester
  if (bloodRequest.requesterId.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this request'
    });
  }

  // Check if request can be deleted (only pending requests can be deleted)
  if (bloodRequest.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Only pending requests can be deleted'
    });
  }

  await BloodRequest.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Blood request deleted successfully'
  });
});

// @desc    Get donation history and stats
// @route   GET /api/requests/stats
// @access  Private (User only)
const getDonationStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get completed donations as donor
  const completedDonations = await BloodRequest.find({
    donorId: userId,
    status: 'completed'
  }).countDocuments();

  // Get total requests created
  const totalRequestsCreated = await BloodRequest.find({
    requesterId: userId
  }).countDocuments();

  // Get recent donations
  const recentDonations = await BloodRequest.find({
    donorId: userId,
    status: 'completed'
  })
  .populate('requesterId', 'name')
  .sort({ completedAt: -1 })
  .limit(5);

  // Calculate badges
  const badges = calculateBadges(completedDonations);

  res.json({
    success: true,
    data: {
      totalDonations: completedDonations,
      totalRequestsCreated,
      recentDonations,
      badges
    }
  });
});

// Helper function to get compatible blood groups
function getCompatibleBloodGroups(donorBloodGroup) {
  const compatibility = {
    "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    "O+": ["O+", "A+", "B+", "AB+"],
    "A-": ["A-", "A+", "AB-", "AB+"],
    "A+": ["A+", "AB+"],
    "B-": ["B-", "B+", "AB-", "AB+"],
    "B+": ["B+", "AB+"],
    "AB-": ["AB-", "AB+"],
    "AB+": ["AB+"]
  };
  
  return compatibility[donorBloodGroup] || [];
}

// Helper function to calculate badges
function calculateBadges(totalDonations) {
  const allBadges = [
    { name: 'First Donation', icon: '🎉', description: 'Completed your first blood donation', threshold: 1 },
    { name: 'Life Saver', icon: '🩸', description: 'Completed 3 blood donations', threshold: 3 },
    { name: 'Hero Donor', icon: '🏆', description: 'Completed 5 blood donations', threshold: 5 },
    { name: 'Champion', icon: '👑', description: 'Completed 10 blood donations', threshold: 10 },
    { name: 'Legend', icon: '⭐', description: 'Completed 25 blood donations', threshold: 25 }
  ];
  
  return allBadges.map(badge => ({
    ...badge,
    earned: totalDonations >= badge.threshold
  }));
}

module.exports = {
  createBloodRequest,
  getAllRequests,
  getCompatibleRequests,
  getNearbyRequests,
  acceptBloodRequest,
  confirmBloodRequest,
  completeBloodRequest,
  updateRequestStatus,
  getMyRequests,
  getDonationStats,
  updateBloodRequest,
  deleteBloodRequest
};
