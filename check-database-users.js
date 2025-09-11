#!/usr/bin/env node

/**
 * Script to check what users and hospitals exist in the database
 * This will help you see what emails are already registered
 */

const https = require('https');

const BACKEND_URL = 'https://lifelink-t6hl.onrender.com';

console.log('🔍 Checking Database Users and Hospitals...\n');

// Test 1: Try to register with a completely new email
async function testNewUserRegistration() {
  console.log('1️⃣ Testing Registration with New Email...');
  
  try {
    const newUser = {
      name: 'Test User',
      email: `newuser-${Date.now()}@example.com`,
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
      console.log('✅ Registration successful with new email!');
      console.log(`   Email: ${data.email}`);
      console.log(`   Message: ${data.message}`);
      
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

// Test 2: Try to register with a hospital email (should fail)
async function testHospitalEmailRegistration() {
  console.log('\n2️⃣ Testing Registration with Hospital Email...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'hospital@example.com', // This might be registered as hospital
        password: 'TestPassword123!',
        bloodGroup: 'O+',
        location: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      })
    });
    
    const data = await response.json();
    
    if (response.status === 400 && data.message.includes('hospital')) {
      console.log('✅ Correctly detected existing hospital email');
      console.log(`   Message: ${data.message}`);
      return true;
    } else {
      console.log('❌ Should have detected existing hospital email');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, data);
      return false;
    }
  } catch (error) {
    console.log('❌ Hospital email test error:', error.message);
    return false;
  }
}

// Test 3: Try to register with existing user email (should fail)
async function testExistingUserEmailRegistration() {
  console.log('\n3️⃣ Testing Registration with Existing User Email...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test-1757627056774@example.com', // This was created in previous test
        password: 'TestPassword123!',
        bloodGroup: 'O+',
        location: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      })
    });
    
    const data = await response.json();
    
    if (response.status === 400 && data.message.includes('already exists')) {
      console.log('✅ Correctly detected existing user email');
      console.log(`   Message: ${data.message}`);
      return true;
    } else {
      console.log('❌ Should have detected existing user email');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, data);
      return false;
    }
  } catch (error) {
    console.log('❌ Existing user email test error:', error.message);
    return false;
  }
}

// Test 4: Test hospital registration
async function testHospitalRegistration() {
  console.log('\n4️⃣ Testing Hospital Registration...');
  
  try {
    const newHospital = {
      name: 'Test Hospital Admin',
      email: `hospital-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      hospitalName: 'Test Hospital',
      address: '123 Test Street, Test City',
      licenseNumber: `LIC-${Date.now()}`,
      contactNumber: '1234567890'
    };
    
    const response = await fetch(`${BACKEND_URL}/api/auth/hospital/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newHospital)
    });
    
    const data = await response.json();
    
    if (response.status === 201) {
      console.log('✅ Hospital registration successful!');
      console.log(`   Email: ${data.email}`);
      console.log(`   Message: ${data.message}`);
      
      if (data.otp) {
        console.log(`   OTP: ${data.otp} (for testing)`);
      }
      
      return { success: true, data };
    } else {
      console.log('❌ Hospital registration failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${data.message}`);
      return { success: false, data };
    }
  } catch (error) {
    console.log('❌ Hospital registration error:', error.message);
    return { success: false, error: error.message };
  }
}

// Main test function
async function runDatabaseCheck() {
  console.log('🚀 Starting Database User Check...\n');
  
  const results = {
    newUserRegistration: await testNewUserRegistration(),
    hospitalEmailTest: await testHospitalEmailRegistration(),
    existingUserEmailTest: await testExistingUserEmailRegistration(),
    hospitalRegistration: await testHospitalRegistration()
  };
  
  console.log('\n📊 Database Check Results:');
  console.log('==========================');
  
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
  
  if (results.newUserRegistration && results.newUserRegistration.success) {
    console.log('✅ Registration is working with new emails');
    console.log('💡 Use a completely new email address for registration');
  }
  
  if (results.hospitalEmailTest) {
    console.log('✅ System correctly prevents duplicate hospital emails');
  }
  
  if (results.existingUserEmailTest) {
    console.log('✅ System correctly prevents duplicate user emails');
  }
  
  if (results.hospitalRegistration && results.hospitalRegistration.success) {
    console.log('✅ Hospital registration is working');
  }
  
  console.log('\n📋 Solutions:');
  console.log('=============');
  console.log('1. Use a completely new email address for registration');
  console.log('2. Check if you already have an account with that email');
  console.log('3. Try registering as a hospital instead of user');
  console.log('4. Use the test users created above for testing');
  
  if (results.newUserRegistration && results.newUserRegistration.success) {
    console.log('\n🧪 Test Login with the created user:');
    console.log(`   Email: ${results.newUserRegistration.data.email}`);
    console.log('   Password: TestPassword123!');
    console.log('   Note: You may need to verify the email first');
  }
}

// Run tests
runDatabaseCheck().catch(console.error);
