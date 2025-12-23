#!/usr/bin/env node
/**
 * Backend Connection Test Script
 * Tests the backend API endpoints to verify they are accessible
 */

const http = require('http');
const https = require('https');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const PRODUCTION_URL = 'https://daten3-1.onrender.com';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Make HTTP/HTTPS request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: options.timeout || 10000,
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
            rawData: data,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data,
            parseError: e.message,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Test health check endpoint
 */
async function testHealthCheck(baseUrl) {
  log('\n📋 Testing Health Check Endpoint...', 'cyan');

  try {
    const response = await makeRequest(`${baseUrl}/api/health`);

    if (response.statusCode === 200) {
      log(`✅ Health check PASSED (Status: ${response.statusCode})`, 'green');
      log(`   Response: ${JSON.stringify(response.data, null, 2)}`, 'blue');
      return true;
    } else {
      log(`⚠️  Health check returned status ${response.statusCode}`, 'yellow');
      log(`   Response: ${response.rawData}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Health check FAILED: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Test root endpoint
 */
async function testRootEndpoint(baseUrl) {
  log('\n📋 Testing Root Endpoint...', 'cyan');

  try {
    const response = await makeRequest(`${baseUrl}/`);

    if (response.statusCode === 200) {
      log(`✅ Root endpoint PASSED (Status: ${response.statusCode})`, 'green');
      log(`   API Name: ${response.data.name}`, 'blue');
      log(`   Version: ${response.data.version}`, 'blue');
      log(`   Status: ${response.data.status}`, 'blue');
      return true;
    } else {
      log(`⚠️  Root endpoint returned status ${response.statusCode}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Root endpoint FAILED: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Test CSRF token endpoint
 */
async function testCSRFToken(baseUrl) {
  log('\n📋 Testing CSRF Token Endpoint...', 'cyan');

  try {
    const response = await makeRequest(`${baseUrl}/api/auth/csrf-token`);

    if (response.statusCode === 200 && response.data.data && response.data.data.csrfToken) {
      log(`✅ CSRF token PASSED (Status: ${response.statusCode})`, 'green');
      log(`   Token received: ${response.data.data.csrfToken.substring(0, 20)}...`, 'blue');
      return response.data.data.csrfToken;
    } else {
      log(`⚠️  CSRF token endpoint returned status ${response.statusCode}`, 'yellow');
      log(`   Response: ${JSON.stringify(response.data)}`, 'yellow');
      return null;
    }
  } catch (error) {
    log(`❌ CSRF token FAILED: ${error.message}`, 'red');
    return null;
  }
}

/**
 * Test API documentation endpoint
 */
async function testApiDocs(baseUrl) {
  log('\n📋 Testing API Documentation Endpoint...', 'cyan');

  try {
    const response = await makeRequest(`${baseUrl}/api-docs.json`);

    if (response.statusCode === 200) {
      log(`✅ API Docs PASSED (Status: ${response.statusCode})`, 'green');
      log(`   Swagger version: ${response.data.openapi || response.data.swagger}`, 'blue');
      return true;
    } else {
      log(`⚠️  API Docs returned status ${response.statusCode}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ API Docs FAILED: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Test CORS headers
 */
async function testCORS(baseUrl) {
  log('\n📋 Testing CORS Configuration...', 'cyan');

  try {
    const response = await makeRequest(`${baseUrl}/api/health`, {
      headers: {
        Origin: 'http://localhost:5173',
      },
    });

    const corsHeader = response.headers['access-control-allow-origin'];
    const credentialsHeader = response.headers['access-control-allow-credentials'];

    if (corsHeader) {
      log(`✅ CORS PASSED`, 'green');
      log(`   Access-Control-Allow-Origin: ${corsHeader}`, 'blue');
      log(`   Access-Control-Allow-Credentials: ${credentialsHeader}`, 'blue');
      return true;
    } else {
      log(`⚠️  CORS headers not found`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ CORS test FAILED: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests(baseUrl, label) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  Testing ${label}`, 'cyan');
  log(`  URL: ${baseUrl}`, 'cyan');
  log('='.repeat(60), 'cyan');

  const results = {
    healthCheck: await testHealthCheck(baseUrl),
    rootEndpoint: await testRootEndpoint(baseUrl),
    csrfToken: await testCSRFToken(baseUrl),
    apiDocs: await testApiDocs(baseUrl),
    cors: await testCORS(baseUrl),
  };

  log('\n' + '='.repeat(60), 'cyan');
  log('  Test Summary', 'cyan');
  log('='.repeat(60), 'cyan');

  const passed = Object.values(results).filter((r) => r === true || r !== null && r !== false).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([test, result]) => {
    const status = result === true || (result !== null && result !== false) ? '✅ PASS' : '❌ FAIL';
    const color = result === true || (result !== null && result !== false) ? 'green' : 'red';
    log(`  ${status} - ${test}`, color);
  });

  log('\n' + '-'.repeat(60), 'cyan');
  log(`  Total: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');
  log('='.repeat(60) + '\n', 'cyan');

  return passed === total;
}

/**
 * Main function
 */
async function main() {
  log('\n🧪 Backend Connection Test Suite', 'cyan');
  log('Testing backend API connectivity and endpoints\n', 'cyan');

  const testLocal = process.argv.includes('--local');
  const testProd = process.argv.includes('--prod');
  const testAll = !testLocal && !testProd;

  let allPassed = true;

  if (testLocal || testAll) {
    const localPassed = await runTests(BACKEND_URL, 'Local Backend');
    allPassed = allPassed && localPassed;
  }

  if (testProd || testAll) {
    const prodPassed = await runTests(PRODUCTION_URL, 'Production Backend');
    allPassed = allPassed && prodPassed;
  }

  if (allPassed) {
    log('🎉 All tests passed!', 'green');
    process.exit(0);
  } else {
    log('⚠️  Some tests failed. Check the output above.', 'yellow');
    process.exit(1);
  }
}

// Run tests
main().catch((error) => {
  log(`\n💥 Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
