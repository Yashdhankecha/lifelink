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
    // Get total counts
    const totalUsers = await User.countDocuments();
    const totalDonors = await User.countDocuments();
    const totalHospitals = await Hospital.countDocuments();
    const totalRequests = await BloodRequest.countDocuments();
    
    // Get request status counts
    const requestStats = await BloodRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get blood group distribution
    const bloodGroupStats = await User.aggregate([
      { $match: { role: 'user', bloodGroup: { $exists: true } } },
      {
        $group: {
          _id: '$bloodGroup',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await BloodRequest.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Get urgent requests
    const urgentRequests = await BloodRequest.find({ urgency: 'critical', status: 'pending' })
      .populate('requesterId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get top performing hospitals
    const topHospitals = await BloodRequest.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$requesterId',
          completedRequests: { $sum: 1 },
          totalUnits: { $sum: '$unitsNeeded' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'hospital'
        }
      },
      { $unwind: '$hospital' },
      { $match: { 'hospital.role': 'hospital' } },
      { $sort: { completedRequests: -1 } },
      { $limit: 5 }
    ]);

    // Get monthly request trends (last 6 months)
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

    // Get geographic distribution
    const geographicStats = await BloodRequest.aggregate([
      {
        $group: {
          _id: {
            lat: { $round: ['$location.latitude', 1] },
            lng: { $round: ['$location.longitude', 1] }
          },
          requestCount: { $sum: 1 }
        }
      },
      { $sort: { requestCount: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalDonors,
          totalHospitals,
          totalRequests
        },
        requestStats: requestStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        bloodGroupStats,
        recentActivity,
        urgentRequests,
        topHospitals,
        geographicStats,
        monthlyTrends
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics'
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
    const role = req.query.role;
    const search = req.query.search;
    const status = req.query.status; // active, inactive, verified, unverified

    let users = [];
    let total = 0;

    if (role === 'hospital') {
      // Fetch hospitals from Hospital model
      let query = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { hospitalName: { $regex: search, $options: 'i' } }
        ];
      }

      if (status === 'verified') {
        query.isVerified = true;
      } else if (status === 'unverified') {
        query.isVerified = false;
      }

      const skip = (page - 1) * limit;

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
              { email: { $regex: search, $options: 'i' } }
            ]
          }
        ];
      }

      if (status === 'verified') {
        query.isVerified = true;
      } else if (status === 'unverified') {
        query.isVerified = false;
      } else if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      }

      const skip = (page - 1) * limit;

      users = await User.find(query)
        .select('-password -emailVerificationOTP -resetPasswordToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      total = await User.countDocuments(query);
    }

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// @desc    Get user details
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
const getUserDetails = asyncHandler(async (req, res) => {
  try {
    let user = await User.findById(req.params.id)
      .select('-password -emailVerificationOTP -resetPasswordToken');

    if (!user) {
      // Try to find in Hospital model
      user = await Hospital.findById(req.params.id)
        .select('-password -emailVerificationOTP -resetPasswordToken');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's requests
    const userRequests = await BloodRequest.find({
      $or: [
        { requesterId: req.params.id },
        { donorId: req.params.id }
      ]
    })
    .populate('requesterId', 'name email')
    .populate('donorId', 'name email')
    .sort({ createdAt: -1 })
    .limit(10);

    res.json({
      success: true,
      data: {
        user,
        recentRequests: userRequests
      }
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
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
    const { isActive, isVerified, reason } = req.body;
    const userId = req.params.id;

    let user = await User.findById(userId);
    if (!user) {
      // Try to find in Hospital model
      user = await Hospital.findById(userId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user status
    if (isActive !== undefined) user.isActive = isActive;
    if (isVerified !== undefined) user.isVerified = isVerified;

    await user.save();

    // Log admin action (you might want to create an audit log)
    console.log(`Admin ${req.user.id} updated user ${userId} status:`, {
      isActive,
      isVerified,
      reason,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isActive: user.isActive,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
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
    const userId = req.params.id;

    let user = await User.findById(userId);
    let isHospital = false;
    
    if (!user) {
      // Try to find in Hospital model
      user = await Hospital.findById(userId);
      isHospital = true;
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has active requests
    const activeRequests = await BloodRequest.find({
      $or: [
        { requesterId: userId, status: { $in: ['pending', 'accepted', 'confirmed'] } },
        { donorId: userId, status: { $in: ['accepted', 'confirmed'] } }
      ]
    });

    if (activeRequests.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with active blood requests'
      });
    }

    if (isHospital) {
      await Hospital.findByIdAndDelete(userId);
    } else {
      await User.findByIdAndDelete(userId);
    }

    // Log admin action
    console.log(`Admin ${req.user.id} deleted user ${userId} at ${new Date()}`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// @desc    Get all requests with filtering
// @route   GET /api/admin/requests
// @access  Private (Admin only)
const getAllRequests = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const urgency = req.query.urgency;
    const bloodGroup = req.query.bloodGroup;
    const search = req.query.search;

    let query = {};

    // Apply filters
    if (status) {
      query.status = status;
    }

    if (urgency) {
      query.urgency = urgency;
    }

    if (bloodGroup) {
      query.bloodGroup = bloodGroup;
    }

    if (search) {
      query.$or = [
        { hospitalName: { $regex: search, $options: 'i' } },
        { hospitalAddress: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const requests = await BloodRequest.find(query)
      .populate('requesterId', 'name email phone')
      .populate('donorId', 'name email phone bloodGroup')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BloodRequest.countDocuments(query);

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRequests: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests'
    });
  }
});

// @desc    Update request status
// @route   PUT /api/admin/requests/:id/status
// @access  Private (Admin only)
const updateRequestStatus = asyncHandler(async (req, res) => {
  try {
    const { status, reason } = req.body;
    const requestId = req.params.id;

    const request = await BloodRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    request.status = status;
    await request.save();

    // Log admin action
    console.log(`Admin ${req.user.id} updated request ${requestId} status to ${status}:`, {
      reason,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Request status updated successfully',
      data: {
        request: {
          id: request._id,
          status: request.status,
          bloodGroup: request.bloodGroup,
          hospitalName: request.hospitalName
        }
      }
    });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update request status'
    });
  }
});

// @desc    Get detailed analytics data
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
const getDetailedAnalytics = asyncHandler(async (req, res) => {
  try {
    const { timeRange = '6months' } = req.query;
    
    // Calculate date range based on timeRange
    let startDate = new Date();
    switch (timeRange) {
      case '1month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 6);
    }

    // Get daily activity data (last 7 days)
    const dailyActivityData = await BloodRequest.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            dayOfWeek: { $dayOfWeek: '$createdAt' }
          },
          requests: { $sum: 1 },
          donations: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Get urgency distribution
    const urgencyData = await BloodRequest.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$urgency',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get response time analysis
    const responseTimeData = await BloodRequest.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate },
          acceptedAt: { $exists: true }
        } 
      },
      {
        $addFields: {
          responseTimeHours: {
            $divide: [
              { $subtract: ['$acceptedAt', '$createdAt'] },
              1000 * 60 * 60
            ]
          }
        }
      },
      {
        $bucket: {
          groupBy: '$responseTimeHours',
          boundaries: [0, 1, 4, 12, 24, Infinity],
          default: 'Other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    // Get platform engagement metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const activeUsersToday = await User.countDocuments({
      lastLogin: { $gte: today }
    });

    const activeUsersYesterday = await User.countDocuments({
      lastLogin: { $gte: yesterday, $lt: today }
    });

    const newRegistrationsThisWeek = await User.countDocuments({
      createdAt: { $gte: lastWeek }
    });

    const newRegistrationsLastWeek = await User.countDocuments({
      createdAt: { 
        $gte: new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000),
        $lt: lastWeek
      }
    });

    // Calculate platform health score
    const totalRequests = await BloodRequest.countDocuments({ createdAt: { $gte: startDate } });
    const completedRequests = await BloodRequest.countDocuments({ 
      status: 'completed', 
      createdAt: { $gte: startDate } 
    });
    const platformHealthScore = totalRequests > 0 ? Math.round((completedRequests / totalRequests) * 100) : 0;

    res.json({
      success: true,
      data: {
        dailyActivity: dailyActivityData,
        urgencyDistribution: urgencyData,
        responseTimeAnalysis: responseTimeData,
        engagementMetrics: {
          activeUsersToday,
          activeUsersYesterday,
          newRegistrationsThisWeek,
          newRegistrationsLastWeek,
          platformHealthScore
        }
      }
    });
  } catch (error) {
    console.error('Error fetching detailed analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch detailed analytics'
    });
  }
});

// @desc    Get system reports
// @route   GET /api/admin/reports
// @access  Private (Admin only)
const getSystemReports = asyncHandler(async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;

    let start = new Date(startDate) || new Date();
    start.setDate(start.getDate() - 30); // Default to last 30 days
    let end = new Date(endDate) || new Date();

    let reportData = {};

    switch (type) {
      case 'donation_summary':
        reportData = await BloodRequest.aggregate([
          { $match: { createdAt: { $gte: start, $lte: end } } },
          {
            $group: {
              _id: null,
              totalRequests: { $sum: 1 },
              totalUnits: { $sum: '$unitsNeeded' },
              completedRequests: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
              },
              completedUnits: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$unitsNeeded', 0] }
              }
            }
          }
        ]);
        break;

      case 'blood_group_distribution':
        reportData = await BloodRequest.aggregate([
          { $match: { createdAt: { $gte: start, $lte: end } } },
          {
            $group: {
              _id: '$bloodGroup',
              requestCount: { $sum: 1 },
              totalUnits: { $sum: '$unitsNeeded' },
              completedUnits: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$unitsNeeded', 0] }
              }
            }
          },
          { $sort: { requestCount: -1 } }
        ]);
        break;

      case 'hospital_performance':
        reportData = await BloodRequest.aggregate([
          { $match: { createdAt: { $gte: start, $lte: end } } },
          {
            $group: {
              _id: '$requesterId',
              totalRequests: { $sum: 1 },
              completedRequests: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
              },
              totalUnits: { $sum: '$unitsNeeded' },
              completedUnits: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$unitsNeeded', 0] }
              }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'hospital'
            }
          },
          { $unwind: '$hospital' },
          { $match: { 'hospital.role': 'hospital' } },
          {
            $addFields: {
              successRate: {
                $multiply: [
                  { $divide: ['$completedRequests', '$totalRequests'] },
                  100
                ]
              }
            }
          },
          { $sort: { successRate: -1 } }
        ]);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    res.json({
      success: true,
      data: {
        reportType: type,
        dateRange: { start, end },
        data: reportData
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
  try {
    const { format = 'csv', startDate, endDate } = req.query;
    
    let query = { role: 'user' };
    
    // Apply date filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const users = await User.find(query)
      .select('-password -emailVerificationOTP -resetPasswordToken')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      // Generate CSV
      let csv = 'Name,Email,Blood Group,Phone,Address,Registration Date,Total Donations,Status\n';
      users.forEach(user => {
        csv += `"${user.name}","${user.email}","${user.bloodGroup}","${user.phone || ''}","${user.address || ''}","${user.createdAt.toISOString().split('T')[0]}","${user.totalDonations || 0}","${user.isActive ? 'Active' : 'Inactive'}"\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=users-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } else if (format === 'excel') {
      // Generate Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Users');
      
      // Add headers
      worksheet.columns = [
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Blood Group', key: 'bloodGroup', width: 15 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Address', key: 'address', width: 30 },
        { header: 'Registration Date', key: 'createdAt', width: 20 },
        { header: 'Total Donations', key: 'totalDonations', width: 15 },
        { header: 'Status', key: 'status', width: 15 }
      ];
      
      // Add data
      users.forEach(user => {
        worksheet.addRow({
          name: user.name,
          email: user.email,
          bloodGroup: user.bloodGroup,
          phone: user.phone || '',
          address: user.address || '',
          createdAt: user.createdAt.toISOString().split('T')[0],
          totalDonations: user.totalDonations || 0,
          status: user.isActive ? 'Active' : 'Inactive'
        });
      });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=users-${new Date().toISOString().split('T')[0]}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported format. Use csv or excel.'
      });
    }
  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export users data'
    });
  }
});

// @desc    Export hospitals data
// @route   GET /api/admin/export/hospitals
// @access  Private (Admin only)
const exportHospitalsData = asyncHandler(async (req, res) => {
  try {
    const { format = 'csv', startDate, endDate } = req.query;
    
    let query = {};
    
    // Apply date filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const hospitals = await Hospital.find(query)
      .select('-password -emailVerificationOTP -resetPasswordToken')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      // Generate CSV
      let csv = 'Hospital Name,Contact Person,Email,Phone,Address,License Number,Registration Date,Status\n';
      hospitals.forEach(hospital => {
        csv += `"${hospital.hospitalName}","${hospital.name}","${hospital.email}","${hospital.phone || hospital.contactNumber || ''}","${hospital.address || ''}","${hospital.licenseNumber || ''}","${hospital.createdAt.toISOString().split('T')[0]}","${hospital.isVerified ? 'Verified' : 'Pending'}"\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=hospitals-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } else if (format === 'excel') {
      // Generate Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Hospitals');
      
      // Add headers
      worksheet.columns = [
        { header: 'Hospital Name', key: 'hospitalName', width: 25 },
        { header: 'Contact Person', key: 'name', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Address', key: 'address', width: 40 },
        { header: 'License Number', key: 'licenseNumber', width: 20 },
        { header: 'Registration Date', key: 'createdAt', width: 20 },
        { header: 'Status', key: 'status', width: 15 }
      ];
      
      // Add data
      hospitals.forEach(hospital => {
        worksheet.addRow({
          hospitalName: hospital.hospitalName,
          name: hospital.name,
          email: hospital.email,
          phone: hospital.phone || hospital.contactNumber || '',
          address: hospital.address || '',
          licenseNumber: hospital.licenseNumber || '',
          createdAt: hospital.createdAt.toISOString().split('T')[0],
          status: hospital.isVerified ? 'Verified' : 'Pending'
        });
      });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=hospitals-${new Date().toISOString().split('T')[0]}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported format. Use csv or excel.'
      });
    }
  } catch (error) {
    console.error('Error exporting hospitals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export hospitals data'
    });
  }
});

// @desc    Export requests data
// @route   GET /api/admin/export/requests
// @access  Private (Admin only)
const exportRequestsData = asyncHandler(async (req, res) => {
  try {
    const { format = 'csv', startDate, endDate, status, bloodGroup } = req.query;
    
    let query = {};
    
    // Apply filters
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (status) query.status = status;
    if (bloodGroup) query.bloodGroup = bloodGroup;

    const requests = await BloodRequest.find(query)
      .populate('requesterId', 'name email')
      .populate('donorId', 'name email bloodGroup')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      // Generate CSV
      let csv = 'Request ID,Patient Name,Patient Email,Blood Group,Hospital,Urgency,Units Needed,Status,Request Date,Donor Name,Completion Date\n';
      requests.forEach(request => {
        csv += `"${request._id}","${request.requesterId?.name || 'N/A'}","${request.requesterId?.email || 'N/A'}","${request.bloodGroup}","${request.hospitalName || 'N/A'}","${request.urgency}","${request.unitsNeeded}","${request.status}","${request.createdAt.toISOString().split('T')[0]}","${request.donorId?.name || 'N/A'}","${request.completedAt ? request.completedAt.toISOString().split('T')[0] : 'N/A'}"\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=requests-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } else if (format === 'excel') {
      // Generate Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Requests');
      
      // Add headers
      worksheet.columns = [
        { header: 'Request ID', key: 'id', width: 25 },
        { header: 'Patient Name', key: 'patientName', width: 20 },
        { header: 'Patient Email', key: 'patientEmail', width: 30 },
        { header: 'Blood Group', key: 'bloodGroup', width: 15 },
        { header: 'Hospital', key: 'hospitalName', width: 25 },
        { header: 'Urgency', key: 'urgency', width: 15 },
        { header: 'Units Needed', key: 'unitsNeeded', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Request Date', key: 'createdAt', width: 20 },
        { header: 'Donor Name', key: 'donorName', width: 20 },
        { header: 'Completion Date', key: 'completedAt', width: 20 }
      ];
      
      // Add data
      requests.forEach(request => {
        worksheet.addRow({
          id: request._id,
          patientName: request.requesterId?.name || 'N/A',
          patientEmail: request.requesterId?.email || 'N/A',
          bloodGroup: request.bloodGroup,
          hospitalName: request.hospitalName || 'N/A',
          urgency: request.urgency,
          unitsNeeded: request.unitsNeeded,
          status: request.status,
          createdAt: request.createdAt.toISOString().split('T')[0],
          donorName: request.donorId?.name || 'N/A',
          completedAt: request.completedAt ? request.completedAt.toISOString().split('T')[0] : 'N/A'
        });
      });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=requests-${new Date().toISOString().split('T')[0]}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported format. Use csv or excel.'
      });
    }
  } catch (error) {
    console.error('Error exporting requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export requests data'
    });
  }
});

// @desc    Export analytics data
// @route   GET /api/admin/export/analytics
// @access  Private (Admin only)
const exportAnalyticsData = asyncHandler(async (req, res) => {
  try {
    const { format = 'pdf', startDate, endDate } = req.query;
    
    // Get analytics data
    const totalUsers = await User.countDocuments();
    const totalHospitals = await Hospital.countDocuments();
    const totalRequests = await BloodRequest.countDocuments();
    
    // Get request status counts
    const requestStats = await BloodRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get blood group distribution
    const bloodGroupStats = await User.aggregate([
      { $match: { role: 'user', bloodGroup: { $exists: true } } },
      {
        $group: {
          _id: '$bloodGroup',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    if (format === 'pdf') {
      // Generate PDF
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${new Date().toISOString().split('T')[0]}.pdf`);
      doc.pipe(res);

      // Add content
      doc.fontSize(20).text('Life Link Analytics Report', 50, 50);
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80);
      
      doc.fontSize(16).text('Overview', 50, 120);
      doc.fontSize(12).text(`Total Users: ${totalUsers}`, 50, 150);
      doc.text(`Total Hospitals: ${totalHospitals}`, 50, 170);
      doc.text(`Total Requests: ${totalRequests}`, 50, 190);
      
      doc.fontSize(16).text('Request Status Distribution', 50, 230);
      let yPos = 260;
      requestStats.forEach(stat => {
        doc.text(`${stat._id}: ${stat.count}`, 50, yPos);
        yPos += 20;
      });
      
      doc.fontSize(16).text('Blood Group Distribution', 50, yPos + 20);
      yPos += 50;
      bloodGroupStats.forEach(stat => {
        doc.text(`${stat._id}: ${stat.count}`, 50, yPos);
        yPos += 20;
      });

      doc.end();
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported format. Use pdf.'
      });
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics data'
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
