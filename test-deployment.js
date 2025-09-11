#!/usr/bin/env node

/**
 * Deployment Test Script
 * Tests your Netlify + Render deployment
 */

const https = require('https');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const makeRequest = (url, timeout = 10000) => {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { timeout }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
};

const testBackendHealth = async () => {
  try {
    log('\n🔍 Testing Backend Health...', 'blue');
    const response = await makeRequest('https://lifelink-t6hl.onrender.com/api/health');
    
    if (response.statusCode === 200) {
      log('✅ Backend health check passed', 'green');
      log(`   Status: ${response.statusCode}`, 'green');
      log(`   Database: ${response.body.database?.status || 'unknown'}`, 
          response.body.database?.connected ? 'green' : 'yellow');
      return true;
    } else {
      log(`❌ Backend health check failed: ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Backend health check error: ${error.message}`, 'red');
    return false;
  }
};

const testBackendRoot = async () => {
  try {
    log('\n🔍 Testing Backend Root...', 'blue');
    const response = await makeRequest('https://lifelink-t6hl.onrender.com/');
    
    if (response.statusCode === 200) {
      log('✅ Backend root endpoint working', 'green');
      log(`   Message: ${response.body.message || 'No message'}`, 'green');
      log(`   Frontend URL: ${response.body.frontend || 'Not set'}`, 'blue');
      return true;
    } else {
      log(`❌ Backend root failed: ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Backend root error: ${error.message}`, 'red');
    return false;
  }
};

const testFrontend = async () => {
  try {
    log('\n🔍 Testing Frontend...', 'blue');
    const response = await makeRequest('https://lifelinkbytripod.netlify.app/');
    
    if (response.statusCode === 200) {
      log('✅ Frontend is accessible', 'green');
      log(`   Status: ${response.statusCode}`, 'green');
      log(`   Content-Type: ${response.headers['content-type'] || 'unknown'}`, 'blue');
      return true;
    } else {
      log(`❌ Frontend failed: ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Frontend error: ${error.message}`, 'red');
    return false;
  }
};

const testCORS = async () => {
  try {
    log('\n🔍 Testing CORS Configuration...', 'blue');
    const response = await makeRequest('https://lifelink-t6hl.onrender.com/api/health');
    
    const corsHeaders = {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-credentials': response.headers['access-control-allow-credentials'],
      'access-control-allow-methods': response.headers['access-control-allow-methods']
    };

    if (corsHeaders['access-control-allow-origin']) {
      log('✅ CORS headers present', 'green');
      log(`   Origin: ${corsHeaders['access-control-allow-origin']}`, 'green');
      log(`   Credentials: ${corsHeaders['access-control-allow-credentials']}`, 'green');
      return true;
    } else {
      log('❌ CORS headers missing', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ CORS test error: ${error.message}`, 'red');
    return false;
  }
};

const main = async () => {
  log(`${colors.bold}🚀 Life Link Deployment Test${colors.reset}`);
  log('Testing Netlify + Render deployment...\n');
  
  const results = {
    backendHealth: await testBackendHealth(),
    backendRoot: await testBackendRoot(),
    frontend: await testFrontend(),
    cors: await testCORS()
  };
  
  log('\n📊 Test Results:', 'bold');
  log(`Backend Health: ${results.backendHealth ? '✅ PASS' : '❌ FAIL'}`, 
      results.backendHealth ? 'green' : 'red');
  log(`Backend Root: ${results.backendRoot ? '✅ PASS' : '❌ FAIL'}`, 
      results.backendRoot ? 'green' : 'red');
  log(`Frontend: ${results.frontend ? '✅ PASS' : '❌ FAIL'}`, 
      results.frontend ? 'green' : 'red');
  log(`CORS: ${results.cors ? '✅ PASS' : '❌ FAIL'}`, 
      results.cors ? 'green' : 'red');
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    log('\n🎉 All tests passed! Your deployment is working correctly!', 'green');
    log('\n📋 Next Steps:', 'bold');
    log('1. Test user registration and login', 'blue');
    log('2. Test authentication persistence', 'blue');
    log('3. Test all app features', 'blue');
    log('4. Check mobile responsiveness', 'blue');
  } else {
    log('\n⚠️  Some tests failed. Check the issues above.', 'red');
    log('\n🔧 Troubleshooting:', 'bold');
    log('1. Check Render deployment logs', 'blue');
    log('2. Verify environment variables', 'blue');
    log('3. Check Netlify build logs', 'blue');
    log('4. Test API endpoints manually', 'blue');
  }
  
  log('\n🌐 Your URLs:', 'bold');
  log('Frontend: https://lifelinkbytripod.netlify.app', 'blue');
  log('Backend: https://lifelink-t6hl.onrender.com', 'blue');
  log('API Health: https://lifelink-t6hl.onrender.com/api/health', 'blue');
};

main().catch(error => {
  log(`\n💥 Test script error: ${error.message}`, 'red');
  process.exit(1);
});
