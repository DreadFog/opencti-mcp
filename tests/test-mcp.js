#!/usr/bin/env node

/**
 * Test script for OpenCTI MCP Server
 * 
 * Usage:
 *   node test-mcp.js <url> [token]
 * 
 * Examples:
 *   node test-mcp.js http://localhost:3000
 *   node test-mcp.js https://your-ngrok-url.ngrok.io your-token
 */

import https from 'https';
import http from 'http';

const args = process.argv.slice(2);
const url = args[0] || 'http://localhost:3000';
const token = args[1];

// Create agent that accepts self-signed certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

/**
 * Make HTTP request
 */
async function request(endpoint, method = 'GET', body = null) {
  const fullUrl = `${url}${endpoint}`;
  const isHttps = fullUrl.startsWith('https');
  const client = isHttps ? https : http;
  
  return new Promise((resolve, reject) => {
    const urlObj = new URL(fullUrl);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      agent: isHttps ? httpsAgent : undefined,
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

/**
 * Test functions
 */
async function testHealth() {
  console.log('\n📋 Testing health endpoint...');
  try {
    const response = await request('/health');
    console.log(`✅ Status: ${response.statusCode}`);
    console.log('Response:', JSON.stringify(response.body, null, 2));
    return response.statusCode === 200;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testRoot() {
  console.log('\n📋 Testing root endpoint...');
  try {
    const response = await request('/');
    console.log(`✅ Status: ${response.statusCode}`);
    console.log('Response:', JSON.stringify(response.body, null, 2));
    return response.statusCode === 200;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testInitialize() {
  console.log('\n📋 Testing initialize (MCP handshake)...');
  try {
    const body = {
      jsonrpc: '2.0',
      id: '1',
      method: 'initialize',
      params: {
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    };
    
    const response = await request('/mcp', 'POST', body);
    console.log(`✅ Status: ${response.statusCode}`);
    console.log('Response:', JSON.stringify(response.body, null, 2));
    
    return response.statusCode === 200 && response.body?.result;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testNotificationsInitialized() {
  console.log('\n📋 Testing notifications/initialized...');
  try {
    const body = {
      jsonrpc: '2.0',
      method: 'notifications/initialized'
      // Note: no id field, this is a notification
    };
    
    const response = await request('/mcp', 'POST', body);
    console.log(`✅ Status: ${response.statusCode}`);
    
    // Notifications should return 204 No Content or 200 with empty result
    if (response.statusCode === 204) {
      console.log('✅ Received 204 No Content (correct for notification)');
      return true;
    } else if (response.statusCode === 200) {
      console.log('Response:', JSON.stringify(response.body, null, 2));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testListTools() {
  console.log('\n📋 Testing tools/list (MCP method)...');
  try {
    const body = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };
    
    const response = await request('/mcp', 'POST', body);
    console.log(`✅ Status: ${response.statusCode}`);
    
    if (response.body?.result?.tools) {
      console.log(`Found ${response.body.result.tools.length} tools:`);
      response.body.result.tools.forEach((tool, idx) => {
        console.log(`  ${idx + 1}. ${tool.name}`);
      });
    } else {
      console.log('Response:', JSON.stringify(response.body, null, 2));
    }
    
    return response.statusCode === 200 && response.body?.result;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testInvalidRequest() {
  console.log('\n📋 Testing invalid JSON-RPC request...');
  try {
    const body = {
      invalid: 'request'
    };
    
    const response = await request('/mcp', 'POST', body);
    console.log(`✅ Status: ${response.statusCode}`);
    console.log('Response:', JSON.stringify(response.body, null, 2));
    
    return response.statusCode === 400 && response.body?.error;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testEmptyRequest() {
  console.log('\n📋 Testing empty request...');
  try {
    const response = await request('/mcp', 'POST', {});
    console.log(`✅ Status: ${response.statusCode}`);
    console.log('Response:', JSON.stringify(response.body, null, 2));
    
    return response.statusCode === 400 && response.body?.error;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testCallTool(toolName, args = {}) {
  console.log(`\n📋 Testing tools/call for: ${toolName}...`);
  try {
    const body = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };
    
    const response = await request('/mcp', 'POST', body);
    console.log(`✅ Status: ${response.statusCode}`);
    
    if (response.body?.result) {
      console.log('Result:', JSON.stringify(response.body.result, null, 2).substring(0, 500));
    } else if (response.body?.error) {
      console.log('Error:', JSON.stringify(response.body.error, null, 2));
    } else {
      console.log('Response:', JSON.stringify(response.body, null, 2));
    }
    
    return response.statusCode === 200;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('='.repeat(60));
  console.log('OpenCTI MCP Server Test Suite');
  console.log('='.repeat(60));
  console.log(`Target URL: ${url}`);
  console.log(`Auth Token: ${token ? 'Provided' : 'Not provided'}`);
  console.log('='.repeat(60));

  const results = {
    passed: 0,
    failed: 0,
  };

  // Run tests
  const tests = [
    { name: 'Health Check', fn: testHealth },
    { name: 'Root Endpoint', fn: testRoot },
    { name: 'Initialize', fn: testInitialize },
    { name: 'Notifications/Initialized', fn: testNotificationsInitialized },
    { name: 'Empty Request', fn: testEmptyRequest },
    { name: 'Invalid Request', fn: testInvalidRequest },
    { name: 'List Tools', fn: testListTools },
  ];

  for (const test of tests) {
    const passed = await test.fn();
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('='.repeat(60));

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
  }
}

// Run tests
runTests().catch(console.error);