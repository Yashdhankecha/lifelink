#!/usr/bin/env node

/**
 * Simple authentication test to debug the logout issue
 */

const https = require('https');

const BACKEND_URL = 'https://lifelink-t6hl.onrender.com';

console.log('🧪 Simple Authentication Test...\n');

// Test 1: Check if we can create a user and get OTP
async function testRegistrationWithOTP() {
  console.log('1️⃣ Testing Registration and OTP...');
  
  try {
    const newUser = {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      bloodGroup: 'O+',
      location: {
        latitude: 40.7128,
        longitude: -74.0060
      }
    };
    
    const response = await fetch(`${BACKEND_URL}/api/auth/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newUser)
    });
    
    const data = await response.json();
    
    console.log('Registration Response:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${data.success}`);
    console.log(`   Message: ${data.message}`);
    console.log(`   Email: ${data.email}`);
    console.log(`   User Type: ${data.userType}`);
    
    if (data.otp) {
      console.log(`   OTP: ${data.otp}`);
      return { success: true, email: data.email, otp: data.otp };
    } else {
      console.log('   OTP: Not provided in response');
      return { success: true, email: data.email, otp: null };
    }
  } catch (error) {
    console.log('❌ Registration error:', error.message);
    return { success: false, error: error.message };
  }
}

// Test 2: Check email verification endpoint
async function testEmailVerification(email, otp) {
  console.log('\n2️⃣ Testing Email Verification...');
  
  if (!otp) {
    console.log('⚠️  No OTP available, skipping verification test');
    return { success: false, error: 'No OTP available' };
  }
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        otp: otp,
        userType: 'user'
      })
    });
    
    const data = await response.json();
    
    console.log('Verification Response:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${data.success}`);
    console.log(`   Message: ${data.message}`);
    
    return { success: response.ok && data.success };
  } catch (error) {
    console.log('❌ Verification error:', error.message);
    return { success: false, error: error.message };
  }
}

// Test 3: Test login (this will show us the exact error)
async function testLogin(email) {
  console.log('\n3️⃣ Testing Login...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: 'TestPassword123!'
      })
    });
    
    const data = await response.json();
    
    console.log('Login Response:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${data.success}`);
    console.log(`   Message: ${data.message}`);
    
    if (response.ok && data.success) {
      console.log(`   User: ${data.user.name}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Role: ${data.user.role}`);
      
      // Check cookies
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        console.log(`   Cookie: ${setCookieHeader}`);
      } else {
        console.log('   Cookie: Not set');
      }
      
      return { success: true, cookie: setCookieHeader };
    } else {
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return { success: false, error: error.message };
  }
}

// Test 4: Test /api/auth/me
async function testAuthMe(cookie) {
  console.log('\n4️⃣ Testing /api/auth/me...');
  
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (cookie) {
      headers['Cookie'] = cookie;
    }
    
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: 'GET',
      headers: headers
    });
    
    const data = await response.json();
    
    console.log('Auth Me Response:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${data.success}`);
    console.log(`   Message: ${data.message}`);
    
    if (response.ok && data.success) {
      console.log(`   User: ${data.user.name}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Role: ${data.user.role}`);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log('❌ Auth Me error:', error.message);
    return false;
  }
}

// Main test function
async function runSimpleAuthTest() {
  console.log('🚀 Starting Simple Authentication Test...\n');
  
  // Step 1: Register user
  const registration = await testRegistrationWithOTP();
  if (!registration.success) {
    console.log('\n❌ Registration failed');
    return;
  }
  
  // Step 2: Verify user (if OTP available)
  let verification = { success: true };
  if (registration.otp) {
    verification = await testEmailVerification(registration.email, registration.otp);
  }
  
  // Step 3: Test login
  const login = await testLogin(registration.email);
  
  // Step 4: Test auth me
  const authMe = await testAuthMe(login.cookie);
  
  console.log('\n📊 Test Results:');
  console.log('================');
  console.log(`✅ Registration: ${registration.success ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Verification: ${verification.success ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Login: ${login.success ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Auth Me: ${authMe ? 'PASSED' : 'FAILED'}`);
  
  console.log('\n🔍 Analysis:');
  console.log('============');
  
  if (!login.success) {
    console.log('❌ Login failed - this is likely the cause of logout issues');
    console.log('💡 Check if email verification is required');
    console.log('💡 Check if user exists in database');
    console.log('💡 Check if password is correct');
  }
  
  if (login.success && !authMe) {
    console.log('❌ Login works but /api/auth/me fails - cookie issue');
    console.log('💡 Check if cookies are being set correctly');
    console.log('💡 Check if cookies are being sent with requests');
    console.log('💡 Check CORS configuration');
  }
  
  if (login.success && authMe) {
    console.log('✅ Backend authentication is working correctly!');
    console.log('💡 The logout issue is likely in the frontend');
    console.log('💡 Check frontend authentication state management');
    console.log('💡 Check if frontend is sending cookies with requests');
  }
  
  console.log('\n📋 Frontend Debug Checklist:');
  console.log('============================');
  console.log('1. Check browser DevTools → Application → Cookies');
  console.log('2. Check if token cookie is present after login');
  console.log('3. Check if cookie is sent with API requests');
  console.log('4. Check for CORS errors in console');
  console.log('5. Check if frontend is handling authentication state');
  console.log('6. Check if frontend is clearing auth state on page refresh');
}

// Run the test
runSimpleAuthTest().catch(console.error);
