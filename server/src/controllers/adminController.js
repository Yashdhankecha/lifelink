const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Admin = require('../models/Admin');
const BloodRequest = require('../models/BloodRequest');
const asyncHandler = require('express-async-handler');

// @desc    Get admin dashboard analytics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
const getDashboardAnalytics = asyncHandler(async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalDonors = await User.countDocuments({ role: 'user', bloodGroup: { $exists: true, $ne: null } });
    const totalHospitals = await Hospital.countDocuments();
    const totalRequests = await BloodRequest.countDocuments();
    
    // Get request status distribution
    const requestStats = await BloodRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Convert to object format expected by frontend
    const requestStatsObj = {};
    requestStats.forEach(stat => {
      requestStatsObj[stat._id] = stat.count;
    });
    
    // Get blood group distribution for donors
    const bloodGroupStats = await User.aggregate([
      { $match: { role: 'user', bloodGroup: { $exists: true, $ne: null } } },
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get monthly trends for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyTrends = await BloodRequest.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalRequests: { $sum: 1 },
          completedRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Get urgent requests (critical urgency)
    const urgentRequests = await BloodRequest.find({ urgency: 'critical' })
      .populate('hospital', 'hospitalName')
      .select('bloodGroup urgency createdAt hospitalName hospitalAddress')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Get top hospitals by request count
    const topHospitals = await BloodRequest.aggregate([
      {
        $group: {
          _id: '$hospital',
          requestCount: { $sum: 1 }
        }
      },
      { $sort: { requestCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'hospitals',
          localField: '_id',
          foreignField: '_id',
          as: 'hospitalInfo'
        }
      },
      {
        $project: {
          hospitalName: { $arrayElemAt: ['$hospitalInfo.hospitalName', 0] },
          requestCount: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalDonors,
          totalHospitals,
          totalRequests
        },
        requestStats: requestStatsObj,
        bloodGroupStats,
        monthlyTrends,
        urgentRequests,
        topHospitals,
        geographicStats: [], // Placeholder for future implementation
        recentActivity: [] // Placeholder for future implementation
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics'
    });
  }
});

// @desc    Get detailed analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
const getDetailedAnalytics = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get basic counts
    const totalUsers = await User.countDocuments({ ...dateFilter, role: 'user' });
    const totalHospitals = await Hospital.countDocuments(dateFilter);
    const totalRequests = await BloodRequest.countDocuments(dateFilter);
    
    // Get request status distribution
    const statusDistribution = await BloodRequest.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Get blood group distribution
    const bloodGroupDistribution = await BloodRequest.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get monthly trends
    const monthlyTrends = await BloodRequest.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalHospitals,
          totalRequests
        },
        distributions: {
          status: statusDistribution,
          bloodGroup: bloodGroupDistribution
        },
        trends: {
          monthly: monthlyTrends
        }
      }
    });
  } catch (error) {
    console.error('Detailed analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch detailed analytics'
    });
  }
});

// @desc    Get all users with pagination and filtering
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role || 'user';
    const search = req.query.search || '';
    const status = req.query.status || '';
    
    const skip = (page - 1) * limit;
    
    let users = [];
    let total = 0;

    if (role === 'hospital') {
      // Fetch hospitals from Hospital model
      let query = {};
      
      if (search) {
        query.$or = [
          { hospitalName: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (status) {
        if (status === 'verified') {
          query.isVerified = true;
        } else if (status === 'pending') {
          query.isVerified = false;
        }
      }
      
      users = await Hospital.find(query)
        .select('-password -emailVerificationOTP -resetPasswordToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      total = await Hospital.countDocuments(query);
    } else {
      // Fetch regular users from User model (exclude admin users)
      let query = { role: 'user' }; // Only fetch users with role 'user'
      
      if (search) {
        query.$and = [
          { role: 'user' },
          {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
              { bloodGroup: { $regex: search, $options: 'i' } }
            ]
          }
        ];
      }
      
      if (status) {
        if (status === 'active') {
          query.isActive = true;
        } else if (status === 'inactive') {
          query.isActive = false;
        }
      }
      
      users = await User.find(query)
        .select('-password -emailVerificationOTP -resetPasswordToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      total = await User.countDocuments(query);
    }

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// @desc    Get user details by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
const getUserDetails = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find in User model first
    let user = await User.findById(id).select('-password -emailVerificationOTP -resetPasswordToken');
    
    // If not found in User model, try Hospital model
    if (!user) {
      user = await Hospital.findById(id).select('-password -emailVerificationOTP -resetPasswordToken');
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details'
    });
  }
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
const updateUserStatus = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isVerified } = req.body;
    
    // Try to update in User model first
    let user = await User.findById(id);
    
    if (user) {
      if (status !== undefined) {
        user.isActive = status === 'active';
      }
      await user.save();
    } else {
      // If not found in User model, try Hospital model
      user = await Hospital.findById(id);
      if (user) {
        if (isVerified !== undefined) {
          user.isVerified = isVerified;
          user.verifiedStatus = isVerified; // Also update verifiedStatus field
        }
        await user.save();
      }
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to delete from User model first
    let user = await User.findByIdAndDelete(id);
    
    // If not found in User model, try Hospital model
    if (!user) {
      user = await Hospital.findByIdAndDelete(id);
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// @desc    Get all blood requests with pagination and filtering
// @route   GET /api/admin/requests
// @access  Private (Admin only)
const getAllRequests = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || '';
    const bloodGroup = req.query.bloodGroup || '';
    const urgency = req.query.urgency || '';
    const search = req.query.search || '';
    
    const skip = (page - 1) * limit;
    
    let query = {};
    
    if (status) query.status = status;
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (urgency) query.urgency = urgency;
    
    if (search) {
      query.$or = [
        { patientName: { $regex: search, $options: 'i' } },
        { bloodGroup: { $regex: search, $options: 'i' } },
        { hospitalName: { $regex: search, $options: 'i' } },
        { hospitalAddress: { $regex: search, $options: 'i' } }
      ];
    }
    
    const requests = await BloodRequest.find(query)
      .populate('requesterId', 'name email phone')
      .populate('hospital', 'hospitalName name email address')
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await BloodRequest.countDocuments(query);

    // Transform requests to match frontend expectations
    const transformedRequests = requests.map(request => ({
      _id: request._id,
      bloodGroup: request.bloodGroup,
      unitsNeeded: request.unitsNeeded,
      status: request.status,
      urgency: request.urgency,
      notes: request.notes,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      hospitalName: request.hospitalName || (request.hospital && request.hospital.hospitalName) || 'Unknown Hospital',
      hospitalAddress: request.hospitalAddress || (request.hospital && request.hospital.address) || 'Unknown Address',
      location: request.location,
      requesterId: request.requesterId,
      donorId: request.donorId
    }));

    res.status(200).json({
      success: true,
      data: {
        requests: transformedRequests,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRequests: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
          limit: limit
        }
      }
    });
  } catch (error) {
    console.error('Get all requests error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Update request status
// @route   PUT /api/admin/requests/:id/status
// @access  Private (Admin only)
const updateRequestStatus = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const request = await BloodRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }
    
    request.status = status;
    if (status === 'completed') {
      request.completedAt = new Date();
    }
    
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Request status updated successfully',
      data: { request }
    });
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update request status'
    });
  }
});

// @desc    Get system reports
// @route   GET /api/admin/reports
// @access  Private (Admin only)
const getSystemReports = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get comprehensive statistics
    const stats = {
      users: await User.countDocuments({ ...dateFilter, role: 'user' }),
      hospitals: await Hospital.countDocuments(dateFilter),
      requests: await BloodRequest.countDocuments(dateFilter),
      completedRequests: await BloodRequest.countDocuments({ ...dateFilter, status: 'completed' }),
      pendingRequests: await BloodRequest.countDocuments({ ...dateFilter, status: 'pending' })
    };

    // Get blood group distribution
    const bloodGroupStats = await BloodRequest.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get status distribution
    const statusStats = await BloodRequest.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get monthly trends
    const monthlyTrends = await BloodRequest.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        statistics: stats,
        bloodGroupDistribution: bloodGroupStats,
        statusDistribution: statusStats,
        monthlyTrends: monthlyTrends
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report'
    });
  }
});

module.exports = {
  getDashboardAnalytics,
  getDetailedAnalytics,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  deleteUser,
  getAllRequests,
  updateRequestStatus,
  getSystemReports
};
