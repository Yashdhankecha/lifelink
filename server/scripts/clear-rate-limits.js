#!/usr/bin/env node

/**
 * Development script to help with rate limiting issues
 * This script provides information about rate limits and helps debug issues
 */

const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:5000/api';

async function checkRateLimitStatus() {
  try {
    console.log('🔍 Checking rate limit status...');
    const response = await axios.get(`${API_BASE}/dev/rate-limit-status`);
    console.log('✅ Rate limit status:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('❌ Rate limit status endpoint not available (production mode?)');
    } else {
      console.log('❌ Error checking rate limit status:', error.message);
    }
  }
}

async function testHealthEndpoint() {
  try {
    console.log('🏥 Testing health endpoint...');
    const response = await axios.get(`${API_BASE}/health`);
    console.log('✅ Server is running:', response.data.message);
  } catch (error) {
    console.log('❌ Server health check failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Rate Limit Helper Script');
  console.log('============================');
  
  await checkRateLimitStatus();
  console.log('');
  await testHealthEndpoint();
  
  console.log('\n📝 Tips:');
  console.log('- In development: 1000 requests per 15 minutes globally, 500 for auth');
  console.log('- In production: 100 requests per 15 minutes globally, 50 for auth');
  console.log('- Rate limits reset every 15 minutes automatically');
  console.log('- If you hit the limit, wait 15 minutes or restart the server');
  console.log('- Health endpoint (/api/health) is not rate limited');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkRateLimitStatus, testHealthEndpoint };
