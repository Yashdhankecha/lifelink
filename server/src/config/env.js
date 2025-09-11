const dotenv = require('dotenv');
const path = require('path');

// Load env vars from config.env file (for local development)
// In production (Railway), environment variables are set directly
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, '../../config.env') });
}

// Log environment variable status for debugging
console.log('Environment variable status:', {
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
  JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
  CLIENT_URL: process.env.CLIENT_URL ? 'Set' : 'Not set',
  EMAIL_HOST: process.env.EMAIL_HOST ? 'Set' : 'Not set',
  GROQ_API_KEY: process.env.GROQ_API_KEY ? 'Set' : 'Not set'
});

module.exports = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT || 10000, // Render uses port 10000
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  CLIENT_URL: process.env.CLIENT_URL,
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY
};
