#!/usr/bin/env node

/**
 * Test script to identify the logout issue
 * This will help us understand what's happening with authentication
 */

const https = require('https');

const BACKEND_URL = 'https://lifelink-t6hl.onrender.com';

console.log('🔍 Testing Logout Issue...\n');

// Test 1: Check if there are any existing verified users
async function testExistingUsers() {
  console.log('1️⃣ Testing Login with Existing Users...');
  
  // Try some common test emails
  const testEmails = [
    'test@example.com',
    'user@example.com',
    'admin@example.com',
    'hospital@example.com'
  ];
  
  for (const email of testEmails) {
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
        console.log(`✅ Login successful with ${email}!`);
        console.log(`   User: ${data.user.name}`);
        console.log(`   Role: ${data.user.role}`);
        
        // Check cookies
        const setCookieHeader = response.headers.get('set-cookie');
        if (setCookieHeader) {
          console.log(`   Cookie: ${setCookieHeader}`);
          
          // Test authentication persistence
          const authResponse = await fetch(`${BACKEND_URL}/api/auth/me`, {
            method: 'GET',
            headers: {
              'Cookie': setCookieHeader,
              'Content-Type': 'application/json'
            }
          });
          
          const authData = await authResponse.json();
          
          if (authResponse.ok && authData.success) {
            console.log('✅ Authentication persistence working!');
            return { success: true, email: email, cookie: setCookieHeader };
          } else {
            console.log('❌ Authentication persistence failed');
            console.log(`   Status: ${authResponse.status}`);
            console.log(`   Message: ${authData.message}`);
          }
        } else {
          console.log('❌ No cookie set');
        }
      } else {
        console.log(`❌ Login failed with ${email}: ${data.message}`);
      }
    } catch (error) {
      console.log(`❌ Error testing ${email}: ${error.message}`);
    }
  }
  
  return { success: false };
}

// Test 2: Check CORS configuration
async function testCORS() {
  console.log('\n2️⃣ Testing CORS Configuration...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Origin': 'https://lifelinkbytripod.netlify.app'
      }
    });
    
    const corsHeaders = {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
      'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': response.headers.get('access-control-allow-headers')
    };
    
    console.log('CORS Headers:');
    Object.entries(corsHeaders).forEach(([header, value]) => {
      if (value) {
        console.log(`   ${header}: ${value}`);
      } else {
        console.log(`   ${header}: Not set`);
      }
    });
    
    // Check if CORS is configured correctly
    if (corsHeaders['access-control-allow-origin'] === 'https://lifelinkbytripod.netlify.app') {
      console.log('✅ CORS origin is correctly set');
    } else {
      console.log('❌ CORS origin is not set correctly');
    }
    
    if (corsHeaders['access-control-allow-credentials'] === 'true') {
      console.log('✅ CORS credentials are enabled');
    } else {
      console.log('❌ CORS credentials are not enabled');
    }
    
    return true;
  } catch (error) {
    console.log('❌ CORS test error:', error.message);
    return false;
  }
}

// Test 3: Check server configuration
async function testServerConfig() {
  console.log('\n3️⃣ Testing Server Configuration...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Server is healthy');
      console.log(`   Environment: ${data.environment}`);
      console.log(`   Database: ${data.database.connected ? 'Connected' : 'Disconnected'}`);
      console.log(`   Uptime: ${Math.round(data.uptime)} seconds`);
      return true;
    } else {
      console.log('❌ Server health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Server config test error:', error.message);
    return false;
  }
}

// Main test function
async function runLogoutTest() {
  console.log('🚀 Starting Logout Issue Test...\n');
  
  const results = {
    existingUsers: await testExistingUsers(),
    cors: await testCORS(),
    serverConfig: await testServerConfig()
  };
  
  console.log('\n📊 Test Results:');
  console.log('================');
  console.log(`✅ Existing Users: ${results.existingUsers.success ? 'FOUND' : 'NOT FOUND'}`);
  console.log(`✅ CORS: ${results.cors ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Server Config: ${results.serverConfig ? 'PASSED' : 'FAILED'}`);
  
  console.log('\n🔍 Analysis:');
  console.log('============');
  
  if (results.existingUsers.success) {
    console.log('✅ Found working user credentials!');
    console.log(`   Email: ${results.existingUsers.email}`);
    console.log('   Password: TestPassword123!');
    console.log('💡 Use these credentials to test in your frontend');
  } else {
    console.log('❌ No existing verified users found');
    console.log('💡 You need to create a verified user first');
  }
  
  if (results.cors) {
    console.log('✅ CORS is configured correctly');
  } else {
    console.log('❌ CORS configuration issues');
  }
  
  if (results.serverConfig) {
    console.log('✅ Server is running correctly');
  } else {
    console.log('❌ Server configuration issues');
  }
  
  console.log('\n📋 Next Steps:');
  console.log('==============');
  
  if (results.existingUsers.success) {
    console.log('1. Use the found credentials to test login in your frontend');
    console.log('2. Check if cookies are being set in browser DevTools');
    console.log('3. Check if cookies are being sent with API requests');
    console.log('4. Check if authentication state is being managed properly');
  } else {
    console.log('1. Create a verified user first');
    console.log('2. Check if email verification is working');
    console.log('3. Try registering with a different email');
  }
  
  console.log('\n🔧 Frontend Debug Steps:');
  console.log('========================');
  console.log('1. Open browser DevTools → Application → Cookies');
  console.log('2. Login to your app');
  console.log('3. Check if token cookie is present');
  console.log('4. Check if cookie has correct domain and settings');
  console.log('5. Check if cookie is sent with subsequent API requests');
  console.log('6. Check for any CORS errors in console');
  console.log('7. Check if frontend is handling authentication state');
}

// Run the test
runLogoutTest().catch(console.error);

