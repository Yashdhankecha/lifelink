const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/requestController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   POST /api/requests
// @desc    Create a new blood request
// @access  Private (User only)
router.post('/', createBloodRequest);

// @route   GET /api/requests/all
// @desc    Get all blood requests
// @access  Private (User only)
router.get('/all', getAllRequests);

// @route   GET /api/requests/compatible
// @desc    Get compatible blood requests for donors
// @access  Private (User only)
router.get('/compatible', getCompatibleRequests);

// @route   GET /api/requests/nearby
// @desc    Get nearby blood requests for donors
// @access  Private (User only)
router.get('/nearby', getNearbyRequests);

// @route   GET /api/requests/my
// @desc    Get user's own requests (created or accepted)
// @access  Private (User only)
router.get('/my', getMyRequests);

// @route   GET /api/requests/stats
// @desc    Get donation statistics and badges
// @access  Private (User only)
router.get('/stats', getDonationStats);

// @route   PATCH /api/requests/:id/accept
// @desc    Accept a blood request
// @access  Private (User only - Donor)
router.patch('/:id/accept', acceptBloodRequest);

// @route   POST /api/requests/:id/confirm
// @desc    Hospital confirm donor acceptance
// @access  Private (Hospital only)
router.post('/:id/confirm', confirmBloodRequest);

// @route   POST /api/requests/:id/complete
// @desc    Complete blood request
// @access  Private (Hospital only)
router.post('/:id/complete', completeBloodRequest);

// @route   PATCH /api/requests/:id/status
// @desc    Update request status
// @access  Private (Requester, Donor, or Admin)
router.patch('/:id/status', updateRequestStatus);

// @route   PUT /api/requests/:id
// @desc    Update a blood request
// @access  Private (Requester only)
router.put('/:id', updateBloodRequest);

// @route   DELETE /api/requests/:id
// @desc    Delete a blood request
// @access  Private (Requester only)
router.delete('/:id', deleteBloodRequest);

module.exports = router;
