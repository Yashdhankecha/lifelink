#!/usr/bin/env node

/**
 * Test script to check user credentials and database
 * This will help debug the 401 login error
 */

const https = require('https');

const BACKEND_URL = 'https://lifelink-t6hl.onrender.com';

console.log('🧪 Testing User Credentials and Database...\n');

// Test 1: Check if registration works (to see if database is accessible)
async function testRegistration() {
  console.log('1️⃣ Testing User Registration (to check database)...');
  
  try {
    const testUser = {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      bloodGroup: 'O+',
      location: 'Test City'
    };
    
    const response = await fetch(`${BACKEND_URL}/api/auth/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    
    if (response.status === 201) {
      console.log('✅ Registration endpoint working');
      console.log(`   Message: ${data.message}`);
      console.log(`   Email: ${data.email}`);
      console.log(`   User Type: ${data.userType}`);
      
      if (data.otp) {
        console.log(`   OTP: ${data.otp} (for testing)`);
      }
      
      return { success: true, data };
    } else {
      console.log('❌ Registration failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${data.message}`);
      return { success: false, data };
    }
  } catch (error) {
    console.log('❌ Registration error:', error.message);
    return { success: false, error: error.message };
  }
}

// Test 2: Test login with invalid credentials
async function testInvalidLogin() {
  console.log('\n2️⃣ Testing Login with Invalid Credentials...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      })
    });
    
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Login correctly rejects invalid credentials');
      console.log(`   Message: ${data.message}`);
      return true;
    } else {
      console.log('❌ Login should reject invalid credentials');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, data);
      return false;
    }
  } catch (error) {
    console.log('❌ Invalid login test error:', error.message);
    return false;
  }
}

// Test 3: Test login with empty credentials
async function testEmptyLogin() {
  console.log('\n3️⃣ Testing Login with Empty Credentials...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    const data = await response.json();
    
    if (response.status === 400) {
      console.log('✅ Login correctly validates input');
      console.log(`   Message: ${data.message}`);
      return true;
    } else {
      console.log('❌ Login should validate input');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, data);
      return false;
    }
  } catch (error) {
    console.log('❌ Empty login test error:', error.message);
    return false;
  }
}

// Test 4: Check database connection
async function testDatabaseConnection() {
  console.log('\n4️⃣ Testing Database Connection...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Database connection status:');
      console.log(`   Status: ${data.database.status}`);
      console.log(`   Connected: ${data.database.connected}`);
      console.log(`   Environment: ${data.environment}`);
      return data.database.connected;
    } else {
      console.log('❌ Health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Database connection test error:', error.message);
    return false;
  }
}

// Main test function
async function runCredentialTests() {
  console.log('🚀 Starting User Credential Tests...\n');
  
  const results = {
    databaseConnection: await testDatabaseConnection(),
    invalidLogin: await testInvalidLogin(),
    emptyLogin: await testEmptyLogin(),
    registration: await testRegistration()
  };
  
  console.log('\n📊 Credential Test Results:');
  console.log('===========================');
  
  Object.entries(results).forEach(([test, result]) => {
    if (typeof result === 'boolean') {
      console.log(`${result ? '✅' : '❌'} ${test}: ${result ? 'PASSED' : 'FAILED'}`);
    } else if (result && result.success) {
      console.log(`✅ ${test}: PASSED`);
    } else {
      console.log(`❌ ${test}: FAILED`);
    }
  });
  
  console.log('\n🔍 Analysis:');
  console.log('============');
  
  if (results.databaseConnection) {
    console.log('✅ Database is connected and working');
  } else {
    console.log('❌ Database connection issue - this could cause login failures');
  }
  
  if (results.invalidLogin) {
    console.log('✅ Login correctly rejects invalid credentials');
  } else {
    console.log('❌ Login validation issue');
  }
  
  if (results.registration && results.registration.success) {
    console.log('✅ Registration is working - database is accessible');
    console.log('💡 You can use the test user created above to test login');
  } else {
    console.log('❌ Registration failed - check database connection');
  }
  
  console.log('\n📋 Next Steps:');
  console.log('==============');
  console.log('1. Check if your user exists in the database');
  console.log('2. Verify the user is email verified (isVerified: true)');
  console.log('3. Make sure you\'re using the correct email and password');
  console.log('4. Check if the user was created through registration');
  
  if (results.registration && results.registration.success) {
    console.log('\n🧪 Test Login with the created user:');
    console.log(`   Email: ${results.registration.data.email}`);
    console.log('   Password: TestPassword123!');
    console.log('   Note: You may need to verify the email first');
  }
}

// Run tests
runCredentialTests().catch(console.error);

