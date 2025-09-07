const express = require('express');
const { body } = require('express-validator');
const { handleChatbotMessage, getChatbotSuggestions } = require('../controllers/chatbotController');
const { optionalAuth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Validation middleware for chatbot messages
const validateChatbotMessage = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters')
    .escape(),
  handleValidationErrors
];

// @route   POST /api/chatbot
// @desc    Send message to chatbot
// @access  Private (optional - works with or without authentication)
router.post('/', optionalAuth, validateChatbotMessage, handleChatbotMessage);

// @route   GET /api/chatbot/suggestions
// @desc    Get chatbot suggestions
// @access  Public
router.get('/suggestions', getChatbotSuggestions);

module.exports = router;
