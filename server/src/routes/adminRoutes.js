const express = require('express');
const router = express.Router();
const {
  getDashboardAnalytics,
  getDetailedAnalytics,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  deleteUser,
  getAllRequests,
  updateRequestStatus,
  getSystemReports
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');

// Admin middleware to check if user is admin
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

// Apply authentication and admin check to all routes
router.use(protect);
router.use(adminOnly);

// Dashboard Analytics
router.get('/dashboard', getDashboardAnalytics);
router.get('/analytics', getDetailedAnalytics);

// User Management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Request Management
router.get('/requests', getAllRequests);
router.put('/requests/:id/status', updateRequestStatus);

// Reports
router.get('/reports', getSystemReports);

module.exports = router;
