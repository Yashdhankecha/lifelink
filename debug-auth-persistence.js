#!/usr/bin/env node

/**
 * Debug script to test authentication persistence
 * This will help identify why users are getting logged out
 */

const https = require('https');

const BACKEND_URL = 'https://lifelink-t6hl.onrender.com';

console.log('🔍 Debugging Authentication Persistence...\n');

// Test 1: Test login and check if cookie is set
async function testLoginAndCookie() {
  console.log('1️⃣ Testing Login and Cookie Setting...');
  
  try {
    // First, let's try to login with the test user
    const loginData = {
      email: 'newuser-1757628569762@example.com',
      password: 'TestPassword123!'
    };
    
    const response = await fetch(`${BACKEND_URL}/api/auth/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
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

// Test 2: Test /api/auth/me with cookie
async function testAuthMeWithCookie(cookie) {
  console.log('\n2️⃣ Testing /api/auth/me with Cookie...');
  
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
      console.log('✅ /api/auth/me successful with cookie!');
      console.log(`   User: ${data.user.name}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Role: ${data.user.role}`);
      return true;
    } else {
      console.log('❌ /api/auth/me failed with cookie');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${data.message}`);
      return false;
    }
  } catch (error) {
    console.log('❌ /api/auth/me test error:', error.message);
    return false;
  }
}

// Test 3: Test /api/auth/me without cookie
async function testAuthMeWithoutCookie() {
  console.log('\n3️⃣ Testing /api/auth/me without Cookie...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ /api/auth/me correctly returns 401 without cookie');
      console.log(`   Message: ${data.message}`);
      return true;
    } else {
      console.log('❌ /api/auth/me should return 401 without cookie');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, data);
      return false;
    }
  } catch (error) {
    console.log('❌ /api/auth/me test error:', error.message);
    return false;
  }
}

// Test 4: Test logout
async function testLogout(cookie) {
  console.log('\n4️⃣ Testing Logout...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Cookie': cookie,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Logout successful!');
      console.log(`   Message: ${data.message}`);
      
      // Check if logout cookie is set
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader && setCookieHeader.includes('token=none')) {
        console.log('✅ Logout cookie is being set');
        console.log(`   Logout Cookie: ${setCookieHeader}`);
        return true;
      } else {
        console.log('❌ Logout cookie not being set');
        return false;
      }
    } else {
      console.log('❌ Logout failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${data.message}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Logout test error:', error.message);
    return false;
  }
}

// Test 5: Check CORS headers
async function testCORSHeaders() {
  console.log('\n5️⃣ Testing CORS Headers...');
  
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

// Main test function
async function runAuthDebug() {
  console.log('🚀 Starting Authentication Persistence Debug...\n');
  
  // Test login and get cookie
  const loginResult = await testLoginAndCookie();
  
  if (!loginResult.success) {
    console.log('\n❌ Cannot proceed with tests - login failed');
    return;
  }
  
  const results = {
    login: loginResult.success,
    authMeWithCookie: await testAuthMeWithCookie(loginResult.cookie),
    authMeWithoutCookie: await testAuthMeWithoutCookie(),
    logout: await testLogout(loginResult.cookie),
    cors: await testCORSHeaders()
  };
  
  console.log('\n📊 Authentication Debug Results:');
  console.log('=================================');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  console.log('\n🔍 Analysis:');
  console.log('============');
  
  if (results.login && results.authMeWithCookie) {
    console.log('✅ Backend authentication is working correctly');
  } else {
    console.log('❌ Backend authentication has issues');
  }
  
  if (results.cors) {
    console.log('✅ CORS is configured correctly');
  } else {
    console.log('❌ CORS configuration issues');
  }
  
  console.log('\n📋 Common Frontend Issues:');
  console.log('==========================');
  console.log('1. Frontend not sending cookies with requests');
  console.log('2. Frontend not handling authentication state properly');
  console.log('3. Frontend clearing authentication state on page refresh');
  console.log('4. CORS cookie issues in browser');
  
  console.log('\n🔧 Frontend Debug Steps:');
  console.log('========================');
  console.log('1. Check browser DevTools → Application → Cookies');
  console.log('2. Check if token cookie is present after login');
  console.log('3. Check if cookie is sent with API requests');
  console.log('4. Check if frontend is handling authentication state');
  console.log('5. Check for CORS errors in console');
  
  if (results.login && results.authMeWithCookie) {
    console.log('\n💡 Backend is working correctly!');
    console.log('The issue is likely in the frontend authentication handling.');
  }
}

// Run tests
runAuthDebug().catch(console.error);
