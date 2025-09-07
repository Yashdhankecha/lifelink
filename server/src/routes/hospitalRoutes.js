const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getHospitalProfile,
  updateHospitalProfile,
  changeHospitalPassword,
  getHospitalRequests,
  createBloodRequest,
  getAcceptedDonors,
  debugHospitalRequests,
  getHospitalAnalytics,
  updateNotificationSettings,
  getNotificationSettings,
  confirmBloodRequest,
  completeBloodRequest,
  cancelBloodRequest,
  addDirectDonor
} = require('../controllers/hospitalController');

const router = express.Router();

// All routes are protected and require hospital role
router.use(protect);
router.use(authorize('hospital'));

// Profile routes
router.get('/profile', getHospitalProfile);
router.patch('/profile', updateHospitalProfile);
router.patch('/password', changeHospitalPassword);

// Request management routes
router.get('/requests', getHospitalRequests);
router.post('/requests', createBloodRequest);
router.patch('/requests/:id/confirm', confirmBloodRequest);
router.patch('/requests/:id/complete', completeBloodRequest);
router.patch('/requests/:id/cancel', cancelBloodRequest);

// Donor management routes
router.get('/donors', getAcceptedDonors);
router.get('/debug-requests', debugHospitalRequests);

// Analytics routes
router.get('/analytics', getHospitalAnalytics);

// Notification settings routes
router.get('/notifications', getNotificationSettings);
router.patch('/notifications', updateNotificationSettings);

// Donor management routes
router.post('/donors/add-direct', addDirectDonor);

// Debug routes
router.get('/debug-requests', debugHospitalRequests);

module.exports = router;
