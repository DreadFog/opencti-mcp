#!/usr/bin/env node

/**
 * Test script that simulates Copilot Studio's MCP connection flow
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

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Simulate Copilot Studio connection flow
 */
async function simulateCopilotStudio() {
  console.log('='.repeat(60));
  console.log('Simulating Copilot Studio MCP Connection Flow');
  console.log('='.repeat(60));
  console.log(`Target URL: ${url}`);
  console.log(`Auth Token: ${token ? 'Provided' : 'Not provided'}`);
  console.log('='.repeat(60));
  console.log('');

  try {
    // Step 1: Initialize
    console.log('📋 Step 1: Sending initialize request...');
    const initRequest = {
      jsonrpc: '2.0',
      id: '1',
      method: 'initialize',
      params: {
        capabilities: {},
        clientInfo: {
          agentName: 'Copilot Studio Test',
          appId: 'test-app-123',
          name: 'Copilot Studio',
          version: '1.0.0'
        }
      }
    };
    
    console.log('Request:', JSON.stringify(initRequest, null, 2));
    const initResponse = await request('/mcp', 'POST', initRequest);
    console.log(`Response Status: ${initResponse.statusCode}`);
    console.log('Response Body:', JSON.stringify(initResponse.body, null, 2));
    
    if (initResponse.statusCode !== 200 || !initResponse.body?.result) {
      console.error('❌ Initialize failed!');
      return false;
    }
    
    console.log('✅ Initialize successful');
    console.log('');
    
    await sleep(100);
    
    // Step 2: Send initialized notification
    console.log('📋 Step 2: Sending notifications/initialized...');
    const notifRequest = {
      jsonrpc: '2.0',
      method: 'notifications/initialized'
      // No id - this is a notification
    };
    
    console.log('Request:', JSON.stringify(notifRequest, null, 2));
    const notifResponse = await request('/mcp', 'POST', notifRequest);
    console.log(`Response Status: ${notifResponse.statusCode}`);
    
    if (notifResponse.statusCode !== 204 && notifResponse.statusCode !== 200) {
      console.error('⚠️  Notification failed (but not critical)');
    } else {
      console.log('✅ Notification sent');
    }
    console.log('');
    
    await sleep(100);
    
    // Step 3: List tools
    console.log('📋 Step 3: Sending tools/list request...');
    const listRequest = {
      jsonrpc: '2.0',
      id: '2',
      method: 'tools/list',
      params: {}
    };
    
    console.log('Request:', JSON.stringify(listRequest, null, 2));
    const listResponse = await request('/mcp', 'POST', listRequest);
    console.log(`Response Status: ${listResponse.statusCode}`);
    console.log('Response Body:', JSON.stringify(listResponse.body, null, 2).substring(0, 1000));
    
    if (listResponse.statusCode !== 200 || !listResponse.body?.result) {
      console.error('❌ tools/list failed!');
      return false;
    }
    
    const tools = listResponse.body.result.tools || [];
    console.log('');
    console.log('✅ tools/list successful');
    console.log(`Found ${tools.length} tools:`);
    tools.forEach((tool, idx) => {
      console.log(`  ${idx + 1}. ${tool.name}`);
      console.log(`     ${tool.description}`);
    });
    console.log('');
    
    if (tools.length === 0) {
      console.error('❌ No tools returned! This is why Copilot Studio says no tools found.');
      return false;
    }
    
    await sleep(100);
    
    // Step 4: Call a tool (if any exist)
    if (tools.length > 0) {
      const testTool = tools[0];
      console.log(`📋 Step 4: Testing tool call with "${testTool.name}"...`);
      
      // Build minimal arguments
      const args = {};
      if (testTool.inputSchema?.properties) {
        // Add any required fields with minimal values
        const required = testTool.inputSchema.required || [];
        for (const field of required) {
          if (field === 'limit') args[field] = 5;
          else if (field === 'entity_type') args[field] = 'Indicator';
          else args[field] = 'test';
        }
      }
      
      const callRequest = {
        jsonrpc: '2.0',
        id: '3',
        method: 'tools/call',
        params: {
          name: testTool.name,
          arguments: args
        }
      };
      
      console.log('Request:', JSON.stringify(callRequest, null, 2));
      const callResponse = await request('/mcp', 'POST', callRequest);
      console.log(`Response Status: ${callResponse.statusCode}`);
      console.log('Response Body:', JSON.stringify(callResponse.body, null, 2).substring(0, 500));
      
      if (callResponse.statusCode !== 200) {
        console.error('❌ Tool call failed!');
      } else {
        console.log('✅ Tool call successful');
      }
      console.log('');
    }
    
    // Summary
    console.log('='.repeat(60));
    console.log('Summary');
    console.log('='.repeat(60));
    console.log('✅ Connection flow completed');
    console.log(`✅ ${tools.length} tools available`);
    console.log('='.repeat(60));
    console.log('');
    console.log('If Copilot Studio still says "no tools found", check:');
    console.log('1. Does the initialize response include tools capability?');
    console.log('2. Does tools/list return an array of tools?');
    console.log('3. Are the tools in the correct format?');
    console.log('4. Check Copilot Studio logs for specific errors');
    
    return true;
    
  } catch (error) {
    console.error('');
    console.error('❌ Error during connection flow:', error.message);
    console.error('');
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run the simulation
simulateCopilotStudio().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});