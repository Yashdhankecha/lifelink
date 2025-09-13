#!/usr/bin/env node

/**
 * Test script to verify authentication flow
 * Run this to test the complete authentication process
 */

const https = require('https');

const BACKEND_URL = 'https://lifelink-t6hl.onrender.com';

console.log('🧪 Testing Authentication Flow...\n');

// Test 1: Check if /api/auth/me returns 401 (expected when not logged in)
async function testUnauthorizedAccess() {
  console.log('1️⃣ Testing Unauthorized Access (should return 401)...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/me`);
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Correctly returns 401 when not authenticated');
      console.log(`   Message: ${data.message}`);
      return true;
    } else {
      console.log('❌ Expected 401 but got:', response.status);
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing unauthorized access:', error.message);
    return false;
  }
}

// Test 2: Check if login endpoint exists
async function testLoginEndpoint() {
  console.log('\n2️⃣ Testing Login Endpoint...');
  
  try {
    // Try to access login endpoint (should return 400 for missing data)
    const response = await fetch(`${BACKEND_URL}/api/auth/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // Empty body to trigger validation error
    });
    
    const data = await response.json();
    
    if (response.status === 400) {
      console.log('✅ Login endpoint exists and validates input');
      console.log(`   Message: ${data.message}`);
      return true;
    } else {
      console.log('❌ Login endpoint returned unexpected status:', response.status);
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing login endpoint:', error.message);
    return false;
  }
}

// Test 3: Check if registration endpoint exists
async function testRegistrationEndpoint() {
  console.log('\n3️⃣ Testing Registration Endpoint...');
  
  try {
    // Try to access registration endpoint (should return 400 for missing data)
    const response = await fetch(`${BACKEND_URL}/api/auth/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // Empty body to trigger validation error
    });
    
    const data = await response.json();
    
    if (response.status === 400) {
      console.log('✅ Registration endpoint exists and validates input');
      console.log(`   Message: ${data.message}`);
      return true;
    } else {
      console.log('❌ Registration endpoint returned unexpected status:', response.status);
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing registration endpoint:', error.message);
    return false;
  }
}

// Test 4: Check if logout endpoint exists
async function testLogoutEndpoint() {
  console.log('\n4️⃣ Testing Logout Endpoint...');
  
  try {
    // Try to access logout endpoint (should return 401 for missing token)
    const response = await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Logout endpoint exists and requires authentication');
      console.log(`   Message: ${data.message}`);
      return true;
    } else {
      console.log('❌ Logout endpoint returned unexpected status:', response.status);
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing logout endpoint:', error.message);
    return false;
  }
}

// Test 5: Check if OTP endpoints exist
async function testOTPEndpoints() {
  console.log('\n5️⃣ Testing OTP Endpoints...');
  
  try {
    // Test send-otp endpoint
    const response = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // Empty body to trigger validation error
    });
    
    const data = await response.json();
    
    if (response.status === 400) {
      console.log('✅ OTP endpoints exist and validate input');
      console.log(`   Message: ${data.message}`);
      return true;
    } else {
      console.log('❌ OTP endpoint returned unexpected status:', response.status);
      console.log('   Response:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing OTP endpoints:', error.message);
    return false;
  }
}

// Main test function
async function runAuthTests() {
  console.log('🚀 Starting Authentication Flow Tests...\n');
  
  const results = {
    unauthorizedAccess: await testUnauthorizedAccess(),
    loginEndpoint: await testLoginEndpoint(),
    registrationEndpoint: await testRegistrationEndpoint(),
    logoutEndpoint: await testLogoutEndpoint(),
    otpEndpoints: await testOTPEndpoints()
  };
  
  console.log('\n📊 Authentication Test Results:');
  console.log('================================');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All authentication endpoints are working correctly!');
    console.log('\n📋 Next steps:');
    console.log('1. Test login in your Netlify frontend');
    console.log('2. Check if cookies are being set correctly');
    console.log('3. Verify authentication persists after page refresh');
    console.log('\n🔍 If login still doesn\'t work:');
    console.log('- Check browser DevTools → Network tab for API calls');
    console.log('- Check browser DevTools → Application → Cookies for token');
    console.log('- Verify CORS is working (no CORS errors in console)');
  } else {
    console.log('\n⚠️  Some authentication tests failed. Please check the issues above.');
  }
}

// Run tests
runAuthTests().catch(console.error);

