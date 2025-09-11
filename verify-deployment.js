#!/usr/bin/env node

/**
 * Deployment Verification Script
 * 
 * This script helps verify that the deployment is working correctly
 * by checking various aspects of the application.
 */

const http = require('http');
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
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, { timeout }, (res) => {
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

const checkHealthEndpoint = async (baseUrl) => {
  try {
    log('\n🔍 Checking health endpoint...', 'blue');
    const response = await makeRequest(`${baseUrl}/api/health`);
    
    if (response.statusCode === 200) {
      log('✅ Health endpoint is responding', 'green');
      log(`   Status: ${response.statusCode}`, 'green');
      log(`   Database: ${response.body.database?.status || 'unknown'}`, 
          response.body.database?.connected ? 'green' : 'yellow');
      log(`   Environment: ${response.body.environment || 'unknown'}`, 'blue');
      return true;
    } else {
      log(`❌ Health endpoint returned status ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Health endpoint check failed: ${error.message}`, 'red');
    return false;
  }
};

const checkStaticFiles = async (baseUrl) => {
  try {
    log('\n🔍 Checking static files...', 'blue');
    const response = await makeRequest(`${baseUrl}/`);
    
    if (response.statusCode === 200) {
      log('✅ Static files are being served', 'green');
      return true;
    } else {
      log(`❌ Static files returned status ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Static files check failed: ${error.message}`, 'red');
    return false;
  }
};

const main = async () => {
  const baseUrl = process.argv[2] || 'http://localhost:5000';
  
  log(`${colors.bold}🚀 Life Link Deployment Verification${colors.reset}`);
  log(`Testing: ${baseUrl}`);
  
  const healthOk = await checkHealthEndpoint(baseUrl);
  const staticOk = await checkStaticFiles(baseUrl);
  
  log('\n📊 Summary:', 'bold');
  log(`Health Endpoint: ${healthOk ? '✅ PASS' : '❌ FAIL'}`, healthOk ? 'green' : 'red');
  log(`Static Files: ${staticOk ? '✅ PASS' : '❌ FAIL'}`, staticOk ? 'green' : 'red');
  
  if (healthOk && staticOk) {
    log('\n🎉 Deployment verification successful!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Deployment verification failed!', 'red');
    process.exit(1);
  }
};

main().catch(error => {
  log(`\n💥 Verification script error: ${error.message}`, 'red');
  process.exit(1);
});
