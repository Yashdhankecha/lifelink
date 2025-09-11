const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { connectDB } = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const { createDevFriendlyLimiter, createAuthLimiter } = require('./utils/rateLimitHelper');

// Load env vars
require('./config/env');

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet());

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser middleware
app.use(cookieParser());

// CORS middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Static file serving removed - frontend will be served by Netlify

// Global rate limiting (more lenient in development)
const globalLimiter = createDevFriendlyLimiter({
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  }
});
app.use(globalLimiter);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes with specific rate limiting
app.use('/api/auth', createAuthLimiter(), require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/hospital', require('./routes/hospitalRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Health check route
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState;
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const healthData = {
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStates[dbStatus] || 'unknown',
      connected: dbStatus === 1
    },
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };

  // Return 200 even if database is not connected
  // This allows the health check to pass while database reconnects
  res.status(200).json(healthData);
});

// Development route to check rate limit status
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/dev/rate-limit-status', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Rate limit status',
      environment: process.env.NODE_ENV,
      globalLimit: process.env.NODE_ENV === 'production' ? 100 : 1000,
      authLimit: process.env.NODE_ENV === 'production' ? 50 : 500,
      windowMs: '15 minutes'
    });
  });
}

// Route to manually retry database connection (for debugging)
app.post('/api/dev/retry-db', (req, res) => {
  const { retryConnection } = require('./config/db');
  
  try {
    retryConnection();
    res.status(200).json({
      success: true,
      message: 'Database connection retry initiated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retry database connection',
      error: error.message
    });
  }
});

// Root route - Backend only
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Life Link Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      users: '/api/users/*',
      hospital: '/api/hospital/*',
      requests: '/api/requests/*',
      chatbot: '/api/chatbot/*',
      admin: '/api/admin/*'
    },
    frontend: 'https://lifelinkbytripod.netlify.app/',
    documentation: 'This is a backend-only service. Frontend is served by Netlify.'
  });
});

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Catch-all for non-API routes - Backend only
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found. This is a backend-only service. Frontend is served by Netlify.',
    availableEndpoints: [
      '/api/health',
      '/api/auth/*',
      '/api/users/*',
      '/api/hospital/*',
      '/api/requests/*',
      '/api/chatbot/*',
      '/api/admin/*'
    ]
  });
});

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 10000; // Render uses port 10000

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
  console.log(`Environment variables loaded:`, {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
    JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
    CLIENT_URL: process.env.CLIENT_URL
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err.message);
  console.error('Stack:', err.stack);
  
  // In production, don't exit immediately - log and continue
  if (process.env.NODE_ENV === 'production') {
    console.log('Server continuing despite unhandled promise rejection...');
  } else {
    server.close(() => {
      process.exit(1);
    });
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error('Stack:', err.stack);
  
  // In production, don't exit immediately - log and continue
  if (process.env.NODE_ENV === 'production') {
    console.log('Server continuing despite uncaught exception...');
  } else {
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});
