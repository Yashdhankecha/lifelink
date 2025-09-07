const Hospital = require('../models/Hospital');
const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

// Get hospital profile
const getHospitalProfile = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.user.id).select('-password');
  
  if (!hospital) {
    return res.status(404).json({
      success: false,
      message: 'Hospital not found'
    });
  }

  res.json({
    success: true,
    data: hospital
  });
});

// Update hospital profile
const updateHospitalProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, address, city, state, pincode, licenseNumber } = req.body;
  
  const hospital = await Hospital.findByIdAndUpdate(
    req.user.id,
    {
      name,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      licenseNumber
    },
    { new: true, runValidators: true }
  ).select('-password');

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: hospital
  });
});

// Change hospital password
const changeHospitalPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  const hospital = await Hospital.findById(req.user.id);
  
  // Check current password
  const isPasswordValid = await hospital.comparePassword(currentPassword);
  if (!isPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  hospital.password = newPassword;
  await hospital.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// Create blood request
const createBloodRequest = asyncHandler(async (req, res) => {
  console.log('Received request body:', req.body);
  const { patientName, bloodGroup, urgency, unitsNeeded, notes, requiredDate } = req.body;
  
  try {
    const bloodRequest = await BloodRequest.create({
      hospital: req.user.id,
      patientName,
      bloodGroup,
      urgency: urgency || 'medium',
      unitsNeeded: unitsNeeded || 1,
      notes,
      requiredDate: requiredDate || new Date(),
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Blood request created successfully',
      data: bloodRequest
    });
  } catch (error) {
    console.error('BloodRequest creation error:', error);
    throw error;
  }
});

// Get hospital requests
const getHospitalRequests = asyncHandler(async (req, res) => {
  const { status, bloodGroup, urgency, page = 1, limit = 10 } = req.query;
  
  const query = { hospital: req.user.id };
  
  if (status) query.status = status;
  if (bloodGroup) query.bloodGroup = bloodGroup;
  if (urgency) query.urgency = urgency;

  const requests = await BloodRequest.find(query)
    .populate('acceptedDonors', 'name email phone bloodGroup')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await BloodRequest.countDocuments(query);

  res.json({
    success: true,
    data: requests,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    }
  });
});

// Confirm blood request (when donor accepts)
const confirmBloodRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const bloodRequest = await BloodRequest.findOne({
    _id: id,
    hospital: req.user.id
  });

  if (!bloodRequest) {
    return res.status(404).json({
      success: false,
      message: 'Blood request not found'
    });
  }

  if (bloodRequest.status !== 'accepted') {
    return res.status(400).json({
      success: false,
      message: 'Request must be accepted before confirmation'
    });
  }

  bloodRequest.status = 'confirmed';
  await bloodRequest.save();

  res.json({
    success: true,
    message: 'Blood request confirmed successfully',
    data: bloodRequest
  });
});

// Complete blood request
const completeBloodRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log('Complete request called for ID:', id);
  console.log('Hospital user ID:', req.user.id);
  
  const bloodRequest = await BloodRequest.findOne({
    _id: id,
    hospital: req.user.id
  }).populate('donorId', 'name email phone bloodGroup');

  console.log('Blood request found:', bloodRequest ? 'Yes' : 'No');
  if (bloodRequest) {
    console.log('Request status:', bloodRequest.status);
    console.log('Request hospital:', bloodRequest.hospital);
  }

  if (!bloodRequest) {
    return res.status(404).json({
      success: false,
      message: 'Blood request not found'
    });
  }

  if (bloodRequest.status !== 'confirmed') {
    console.log('Request status is not confirmed:', bloodRequest.status);
    return res.status(400).json({
      success: false,
      message: 'Request must be confirmed before completion'
    });
  }

  // Update blood request status
  bloodRequest.status = 'completed';
  bloodRequest.completedAt = new Date();
  await bloodRequest.save();

  // Add donor to hospital's donor list if donor exists
  if (bloodRequest.donorId) {
    const Hospital = require('../models/Hospital');
    const hospital = await Hospital.findById(req.user.id);
    
    if (hospital) {
      // Check if donor already exists in the list
      const existingDonorIndex = hospital.donorList.findIndex(
        donor => donor.donorId.toString() === bloodRequest.donorId._id.toString()
      );

      if (existingDonorIndex !== -1) {
        // Update existing donor's information
        hospital.donorList[existingDonorIndex].lastDonationDate = new Date();
        hospital.donorList[existingDonorIndex].totalDonations += 1;
        hospital.donorList[existingDonorIndex].donorName = bloodRequest.donorId.name;
        hospital.donorList[existingDonorIndex].donorEmail = bloodRequest.donorId.email;
        hospital.donorList[existingDonorIndex].donorPhone = bloodRequest.donorId.phone;
        hospital.donorList[existingDonorIndex].bloodGroup = bloodRequest.donorId.bloodGroup;
      } else {
        // Add new donor to the list
        hospital.donorList.push({
          donorId: bloodRequest.donorId._id,
          donorName: bloodRequest.donorId.name,
          donorEmail: bloodRequest.donorId.email,
          donorPhone: bloodRequest.donorId.phone,
          bloodGroup: bloodRequest.donorId.bloodGroup,
          lastDonationDate: new Date(),
          totalDonations: 1
        });
      }

      await hospital.save();
    }
  }

  console.log('Request completed successfully');
  res.json({
    success: true,
    message: 'Blood request completed successfully',
    data: bloodRequest
  });
});

// Add donor directly to hospital's donor list (for in-person donations)
const addDirectDonor = asyncHandler(async (req, res) => {
  const { donorName, donorEmail, donorPhone, bloodGroup } = req.body;
  
  if (!donorName || !donorEmail || !donorPhone || !bloodGroup) {
    return res.status(400).json({
      success: false,
      message: 'All donor information is required'
    });
  }

  const Hospital = require('../models/Hospital');
  const hospital = await Hospital.findById(req.user.id);
  
  if (!hospital) {
    return res.status(404).json({
      success: false,
      message: 'Hospital not found'
    });
  }

  // Check if donor already exists in the list
  const existingDonorIndex = hospital.donorList.findIndex(
    donor => donor.donorEmail === donorEmail
  );

  if (existingDonorIndex !== -1) {
    // Update existing donor's information
    hospital.donorList[existingDonorIndex].lastDonationDate = new Date();
    hospital.donorList[existingDonorIndex].totalDonations += 1;
    hospital.donorList[existingDonorIndex].donorName = donorName;
    hospital.donorList[existingDonorIndex].donorPhone = donorPhone;
    hospital.donorList[existingDonorIndex].bloodGroup = bloodGroup;
  } else {
    // Add new donor to the list
    hospital.donorList.push({
      donorId: null, // No app user ID for direct donations
      donorName,
      donorEmail,
      donorPhone,
      bloodGroup,
      lastDonationDate: new Date(),
      totalDonations: 1
    });
  }

  await hospital.save();

  res.json({
    success: true,
    message: 'Donor added to hospital donor list successfully',
    data: {
      donorName,
      donorEmail,
      donorPhone,
      bloodGroup,
      lastDonationDate: new Date(),
      totalDonations: existingDonorIndex !== -1 ? hospital.donorList[existingDonorIndex].totalDonations : 1
    }
  });
});

// Cancel blood request
const cancelBloodRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const bloodRequest = await BloodRequest.findOne({
    _id: id,
    hospital: req.user.id
  });

  if (!bloodRequest) {
    return res.status(404).json({
      success: false,
      message: 'Blood request not found'
    });
  }

  if (bloodRequest.status === 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel completed request'
    });
  }

  bloodRequest.status = 'cancelled';
  await bloodRequest.save();

  res.json({
    success: true,
    message: 'Blood request cancelled successfully',
    data: bloodRequest
  });
});

// Debug endpoint to see all requests for a hospital
const debugHospitalRequests = asyncHandler(async (req, res) => {
  const allRequests = await BloodRequest.find({ hospital: req.user.id })
    .populate('donorId', 'name email phone bloodGroup')
    .populate('acceptedBy', 'name email phone bloodGroup')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: allRequests,
    count: allRequests.length
  });
});

// Get all donors who have donated blood to the hospital
const getAcceptedDonors = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status = 'all' } = req.query;
  
  console.log('Hospital ID:', req.user.id);
  
  // First, let's check all requests for this hospital
  const allRequests = await BloodRequest.find({ hospital: req.user.id });
  console.log('All requests for hospital:', allRequests.length);
  console.log('All request statuses:', allRequests.map(r => ({ id: r._id, status: r.status, donorId: r.donorId, acceptedBy: r.acceptedBy })));

  // Build query based on status filter
  let statusQuery = {};
  if (status !== 'all') {
    statusQuery.status = status;
  } else {
    statusQuery.status = { $in: ['accepted', 'confirmed', 'completed'] };
  }

  const query = {
    hospital: req.user.id,
    ...statusQuery
  };
  
  console.log('Query:', query);

  const requests = await BloodRequest.find(query)
    .populate('donorId', 'name email phone bloodGroup')
    .populate('acceptedBy', 'name email phone bloodGroup')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  console.log('Found requests:', requests.length);
  console.log('Requests with donorId:', requests.filter(r => r.donorId).length);
  console.log('Requests with acceptedBy:', requests.filter(r => r.acceptedBy).length);

  // Get all unique donors who have donated to this hospital
  const donorMap = new Map();
  
  requests.forEach(request => {
    // Add donorId (primary donor)
    if (request.donorId) {
      const donorId = request.donorId._id.toString();
      if (!donorMap.has(donorId)) {
        donorMap.set(donorId, {
          _id: request.donorId._id,
          name: request.donorId.name,
          email: request.donorId.email,
          phone: request.donorId.phone,
          bloodGroup: request.donorId.bloodGroup,
          donations: [],
          totalDonations: 0,
          lastDonation: null,
          firstDonation: null
        });
      }
      
      const donor = donorMap.get(donorId);
      donor.donations.push({
        requestId: request._id,
        patientName: request.patientName,
        bloodGroup: request.bloodGroup,
        status: request.status,
        urgency: request.urgency,
        createdAt: request.createdAt,
        completedAt: request.completedAt,
        acceptedAt: request.acceptedAt
      });
      donor.totalDonations++;
      
      if (request.completedAt) {
        if (!donor.lastDonation || request.completedAt > donor.lastDonation) {
          donor.lastDonation = request.completedAt;
        }
        if (!donor.firstDonation || request.completedAt < donor.firstDonation) {
          donor.firstDonation = request.completedAt;
        }
      }
    }
    
    // Add acceptedBy (alternative donor field)
    if (request.acceptedBy && request.acceptedBy._id.toString() !== request.donorId?._id.toString()) {
      const donorId = request.acceptedBy._id.toString();
      if (!donorMap.has(donorId)) {
        donorMap.set(donorId, {
          _id: request.acceptedBy._id,
          name: request.acceptedBy.name,
          email: request.acceptedBy.email,
          phone: request.acceptedBy.phone,
          bloodGroup: request.acceptedBy.bloodGroup,
          donations: [],
          totalDonations: 0,
          lastDonation: null,
          firstDonation: null
        });
      }
      
      const donor = donorMap.get(donorId);
      donor.donations.push({
        requestId: request._id,
        patientName: request.patientName,
        bloodGroup: request.bloodGroup,
        status: request.status,
        urgency: request.urgency,
        createdAt: request.createdAt,
        completedAt: request.completedAt,
        acceptedAt: request.acceptedAt
      });
      donor.totalDonations++;
      
      if (request.completedAt) {
        if (!donor.lastDonation || request.completedAt > donor.lastDonation) {
          donor.lastDonation = request.completedAt;
        }
        if (!donor.firstDonation || request.completedAt < donor.firstDonation) {
          donor.firstDonation = request.completedAt;
        }
      }
    }
  });

  // Get hospital's donor list
  const Hospital = require('../models/Hospital');
  const hospital = await Hospital.findById(req.user.id);
  
  // Add hospital's donor list to the map
  if (hospital && hospital.donorList) {
    hospital.donorList.forEach(donorData => {
      const donorId = donorData.donorId ? donorData.donorId.toString() : `direct_${donorData.donorEmail}`;
      
      if (!donorMap.has(donorId)) {
        donorMap.set(donorId, {
          _id: donorData.donorId || `direct_${donorData.donorEmail}`,
          name: donorData.donorName,
          email: donorData.donorEmail,
          phone: donorData.donorPhone,
          bloodGroup: donorData.bloodGroup,
          donations: [],
          totalDonations: donorData.totalDonations,
          lastDonation: donorData.lastDonationDate,
          firstDonation: donorData.addedAt,
          isDirectDonor: !donorData.donorId // Flag to identify direct donors
        });
      } else {
        // Update existing donor with hospital donor list data
        const existingDonor = donorMap.get(donorId);
        existingDonor.totalDonations = Math.max(existingDonor.totalDonations, donorData.totalDonations);
        if (donorData.lastDonationDate && (!existingDonor.lastDonation || donorData.lastDonationDate > existingDonor.lastDonation)) {
          existingDonor.lastDonation = donorData.lastDonationDate;
        }
      }
    });
  }

  // Convert map to array and sort by total donations
  const donors = Array.from(donorMap.values()).sort((a, b) => b.totalDonations - a.totalDonations);

  console.log('Processed donors:', donors.length);
  console.log('Donor details:', donors.map(d => ({ name: d.name, totalDonations: d.totalDonations })));

  // Get total count for pagination
  const totalRequests = await BloodRequest.find({
    hospital: req.user.id,
    ...statusQuery
  }).countDocuments();

  console.log('Total requests for hospital:', totalRequests);

  res.json({
    success: true,
    data: donors,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(donors.length / limit),
      total: donors.length,
      totalRequests
    }
  });
});

// Get hospital analytics
const getHospitalAnalytics = asyncHandler(async (req, res) => {
  const { timeRange = '6months' } = req.query;
  
  // Calculate date range
  const now = new Date();
  let startDate;
  
  switch (timeRange) {
    case '1month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case '3months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      break;
    case '6months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      break;
    case '1year':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  }

  // Get requests in date range
  const requests = await BloodRequest.find({
    hospital: req.user.id,
    createdAt: { $gte: startDate }
  });

  // Calculate KPIs
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const acceptedRequests = requests.filter(r => r.status === 'accepted').length;
  const confirmedRequests = requests.filter(r => r.status === 'confirmed').length;
  const completedRequests = requests.filter(r => r.status === 'completed').length;
  const cancelledRequests = requests.filter(r => r.status === 'cancelled').length;

  // Blood group distribution
  const bloodGroupStats = {};
  requests.forEach(request => {
    bloodGroupStats[request.bloodGroup] = (bloodGroupStats[request.bloodGroup] || 0) + 1;
  });

  // Urgency distribution
  const urgencyStats = {};
  requests.forEach(request => {
    urgencyStats[request.urgency] = (urgencyStats[request.urgency] || 0) + 1;
  });

  // Monthly trend (last 6 months)
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    const monthRequests = requests.filter(r => 
      r.createdAt >= monthStart && r.createdAt <= monthEnd
    );
    
    monthlyTrend.push({
      month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
      requests: monthRequests.length,
      completed: monthRequests.filter(r => r.status === 'completed').length
    });
  }

  // Completion rate
  const completionRate = totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0;

  res.json({
    success: true,
    data: {
      kpis: {
        totalRequests,
        pendingRequests,
        acceptedRequests,
        confirmedRequests,
        completedRequests,
        cancelledRequests,
        completionRate: Math.round(completionRate * 100) / 100
      },
      bloodGroupDistribution: bloodGroupStats,
      urgencyDistribution: urgencyStats,
      monthlyTrend,
      timeRange
    }
  });
});

// Get notification settings
const getNotificationSettings = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.user.id).select('notificationSettings');
  
  res.json({
    success: true,
    data: hospital.notificationSettings || {
      emailNotifications: true,
      smsNotifications: false,
      newRequestAlerts: true,
      donorResponseAlerts: true,
      completionAlerts: true
    }
  });
});

// Update notification settings
const updateNotificationSettings = asyncHandler(async (req, res) => {
  const { emailNotifications, smsNotifications, newRequestAlerts, donorResponseAlerts, completionAlerts } = req.body;
  
  const hospital = await Hospital.findByIdAndUpdate(
    req.user.id,
    {
      notificationSettings: {
        emailNotifications,
        smsNotifications,
        newRequestAlerts,
        donorResponseAlerts,
        completionAlerts
      }
    },
    { new: true }
  );

  res.json({
    success: true,
    message: 'Notification settings updated successfully',
    data: hospital.notificationSettings
  });
});

module.exports = {
  getHospitalProfile,
  updateHospitalProfile,
  changeHospitalPassword,
  createBloodRequest,
  getHospitalRequests,
  confirmBloodRequest,
  completeBloodRequest,
  cancelBloodRequest,
  addDirectDonor,
  debugHospitalRequests,
  getAcceptedDonors,
  getHospitalAnalytics,
  getNotificationSettings,
  updateNotificationSettings
};
