// Rate limit helper for development
const rateLimit = require('express-rate-limit');

// Development-friendly rate limiter
const createDevFriendlyLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    message: {
      error: 'Too many requests, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    ...options
  };

  return rateLimit(defaultOptions);
};

// Auth-specific rate limiter
const createAuthLimiter = () => {
  return createDevFriendlyLimiter({
    max: process.env.NODE_ENV === 'production' ? 50 : 500,
    message: {
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes'
    }
  });
};

// API-specific rate limiter
const createApiLimiter = () => {
  return createDevFriendlyLimiter({
    max: process.env.NODE_ENV === 'production' ? 200 : 2000,
    message: {
      error: 'Too many API requests, please try again later.',
      retryAfter: '15 minutes'
    }
  });
};

module.exports = {
  createDevFriendlyLimiter,
  createAuthLimiter,
  createApiLimiter
};
