#!/usr/bin/env node

/**
 * Test script to verify API fix
 * Run this after deploying to test if the fix worked
 */

const https = require('https');
const http = require('http');

// Configuration
const BACKEND_URL = 'https://lifelink-t6hl.onrender.com';
const FRONTEND_URL = 'https://lifelinkbytripod.netlify.app'; // Update this to your actual Netlify URL

console.log('🧪 Testing API Fix...\n');

// Test 1: Backend Health Check
async function testBackendHealth() {
  console.log('1️⃣ Testing Backend Health...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Backend is healthy');
      console.log(`   Database: ${data.database.connected ? 'Connected' : 'Disconnected'}`);
      console.log(`   Environment: ${data.environment}`);
      return true;
    } else {
      console.log('❌ Backend health check failed');
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend health check error:', error.message);
    return false;
  }
}

// Test 2: Backend Root Endpoint
async function testBackendRoot() {
  console.log('\n2️⃣ Testing Backend Root Endpoint...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Backend root endpoint working');
      console.log(`   Message: ${data.message}`);
      console.log(`   Frontend URL: ${data.frontend}`);
      return true;
    } else {
      console.log('❌ Backend root endpoint failed');
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend root endpoint error:', error.message);
    return false;
  }
}

// Test 3: Test Wrong API Call (should fail)
async function testWrongAPICall() {
  console.log('\n3️⃣ Testing Wrong API Call (should fail)...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/auth/me`);
    
    if (response.status === 404) {
      console.log('✅ Wrong API call correctly returns 404');
      const data = await response.json();
      console.log(`   Message: ${data.message}`);
      return true;
    } else {
      console.log('❌ Wrong API call should return 404 but got:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Wrong API call error:', error.message);
    return false;
  }
}

// Test 4: Test Correct API Call (should work)
async function testCorrectAPICall() {
  console.log('\n4️⃣ Testing Correct API Call (should work)...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/me`);
    
    if (response.status === 401) {
      console.log('✅ Correct API call returns 401 (unauthorized - expected)');
      const data = await response.json();
      console.log(`   Message: ${data.message}`);
      return true;
    } else if (response.status === 200) {
      console.log('✅ Correct API call returns 200 (authorized)');
      return true;
    } else {
      console.log('❌ Correct API call returned unexpected status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Correct API call error:', error.message);
    return false;
  }
}

// Test 5: Frontend Accessibility
async function testFrontendAccess() {
  console.log('\n5️⃣ Testing Frontend Accessibility...');
  
  try {
    const response = await fetch(FRONTEND_URL);
    
    if (response.ok) {
      console.log('✅ Frontend is accessible');
      console.log(`   Status: ${response.status}`);
      return true;
    } else {
      console.log('❌ Frontend not accessible');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Frontend access error:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting API Fix Verification Tests...\n');
  
  const results = {
    backendHealth: await testBackendHealth(),
    backendRoot: await testBackendRoot(),
    wrongAPICall: await testWrongAPICall(),
    correctAPICall: await testCorrectAPICall(),
    frontendAccess: await testFrontendAccess()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Your API fix is working correctly.');
    console.log('\n📋 Next steps:');
    console.log('1. Update Netlify environment variables');
    console.log('2. Redeploy Netlify');
    console.log('3. Test authentication in browser');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the issues above.');
    console.log('\n🔧 Common fixes:');
    console.log('1. Make sure backend is deployed and running');
    console.log('2. Check if CORS is configured correctly');
    console.log('3. Verify environment variables are set');
  }
}

// Run tests
runTests().catch(console.error);
