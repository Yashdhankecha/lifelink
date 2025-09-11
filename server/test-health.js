#!/usr/bin/env node

const http = require('http');

const testHealthCheck = () => {
  const options = {
    hostname: 'localhost',
    port: process.env.PORT || 5000,
    path: '/api/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Health Check Response:');
      console.log('Status:', res.statusCode);
      console.log('Headers:', res.headers);
      console.log('Body:', JSON.parse(data));
      
      if (res.statusCode === 200) {
        console.log('✅ Health check passed!');
        process.exit(0);
      } else {
        console.log('❌ Health check failed!');
        process.exit(1);
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Health check request failed:', err.message);
    process.exit(1);
  });

  req.on('timeout', () => {
    console.error('❌ Health check request timed out');
    req.destroy();
    process.exit(1);
  });

  req.end();
};

// Wait a bit for server to start, then test
setTimeout(testHealthCheck, 2000);
