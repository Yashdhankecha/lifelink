#!/usr/bin/env node

/**
 * Script to create a verified user for testing authentication
 */

const https = require('https');

const BACKEND_URL = 'https://lifelink-t6hl.onrender.com';

console.log('🔧 Creating Verified User for Testing...\n');

// Step 1: Register a new user
async function registerNewUser() {
  console.log('1️⃣ Registering New User...');
  
  try {
    const newUser = {
      name: 'Test User',
      email: `verified-${Date.now()}@example.com`,
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
    
    if (response.status === 201) {
      console.log('✅ User registered successfully!');
      console.log(`   Email: ${data.email}`);
      console.log(`   Message: ${data.message}`);
      
      if (data.otp) {
        console.log(`   OTP: ${data.otp} (for verification)`);
        return { success: true, email: data.email, otp: data.otp };
      } else {
        console.log('❌ No OTP provided');
        return { success: false, error: 'No OTP provided' };
      }
    } else {
      console.log('❌ Registration failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${data.message}`);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.log('❌ Registration error:', error.message);
    return { success: false, error: error.message };
  }
}

// Step 2: Verify the user with OTP
async function verifyUser(email, otp) {
  console.log('\n2️⃣ Verifying User with OTP...');
  
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
    
    if (response.ok && data.success) {
      console.log('✅ User verified successfully!');
      console.log(`   Message: ${data.message}`);
      return { success: true };
    } else {
      console.log('❌ Verification failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${data.message}`);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.log('❌ Verification error:', error.message);
    return { success: false, error: error.message };
  }
}

// Step 3: Test login with verified user
async function testLogin(email) {
  console.log('\n3️⃣ Testing Login with Verified User...');
  
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
    
    if (response.ok && data.success) {
      console.log('✅ Login successful!');
      console.log(`   User: ${data.user.name}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Role: ${data.user.role}`);
      
      // Check if Set-Cookie header is present
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        console.log('✅ Cookie is being set by server');
        console.log(`   Cookie: ${setCookieHeader}`);
        
        // Parse cookie to check settings
        if (setCookieHeader.includes('HttpOnly')) {
          console.log('✅ Cookie is HttpOnly (secure)');
        } else {
          console.log('❌ Cookie is not HttpOnly (security issue)');
        }
        
        if (setCookieHeader.includes('Secure')) {
          console.log('✅ Cookie is Secure (HTTPS only)');
        } else {
          console.log('❌ Cookie is not Secure (may not work on HTTPS)');
        }
        
        if (setCookieHeader.includes('SameSite=None')) {
          console.log('✅ Cookie is SameSite=None (cross-origin)');
        } else if (setCookieHeader.includes('SameSite=Strict')) {
          console.log('❌ Cookie is SameSite=Strict (may not work cross-origin)');
        } else {
          console.log('⚠️  Cookie SameSite not specified');
        }
        
        return { success: true, cookie: setCookieHeader, user: data.user };
      } else {
        console.log('❌ No Set-Cookie header found');
        return { success: false, error: 'No cookie set' };
      }
    } else {
      console.log('❌ Login failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${data.message}`);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.log('❌ Login test error:', error.message);
    return { success: false, error: error.message };
  }
}

// Step 4: Test authentication persistence
async function testAuthPersistence(cookie) {
  console.log('\n4️⃣ Testing Authentication Persistence...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': cookie,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Authentication persistence working!');
      console.log(`   User: ${data.user.name}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Role: ${data.user.role}`);
      return true;
    } else {
      console.log('❌ Authentication persistence failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${data.message}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication persistence test error:', error.message);
    return false;
  }
}

// Main function
async function createVerifiedUser() {
  console.log('🚀 Creating Verified User for Authentication Testing...\n');
  
  // Step 1: Register user
  const registration = await registerNewUser();
  if (!registration.success) {
    console.log('\n❌ Cannot proceed - registration failed');
    return;
  }
  
  // Step 2: Verify user
  const verification = await verifyUser(registration.email, registration.otp);
  if (!verification.success) {
    console.log('\n❌ Cannot proceed - verification failed');
    return;
  }
  
  // Step 3: Test login
  const login = await testLogin(registration.email);
  if (!login.success) {
    console.log('\n❌ Cannot proceed - login failed');
    return;
  }
  
  // Step 4: Test authentication persistence
  const persistence = await testAuthPersistence(login.cookie);
  
  console.log('\n📊 Results:');
  console.log('===========');
  console.log(`✅ Registration: ${registration.success ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Verification: ${verification.success ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Login: ${login.success ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Persistence: ${persistence ? 'PASSED' : 'FAILED'}`);
  
  if (registration.success && verification.success && login.success && persistence) {
    console.log('\n🎉 SUCCESS! Authentication is working correctly!');
    console.log('\n📋 Test Credentials:');
    console.log(`   Email: ${registration.email}`);
    console.log('   Password: TestPassword123!');
    console.log('\n💡 Use these credentials to test in your frontend!');
    
    console.log('\n🔍 If frontend still has logout issues:');
    console.log('1. Check browser DevTools → Application → Cookies');
    console.log('2. Check if token cookie is present after login');
    console.log('3. Check if cookie is sent with API requests');
    console.log('4. Check for CORS errors in console');
    console.log('5. Check if frontend is handling authentication state properly');
  } else {
    console.log('\n❌ Some tests failed. Check the issues above.');
  }
}

// Run the script
createVerifiedUser().catch(console.error);
