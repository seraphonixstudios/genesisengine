/**
 * End-to-End Test Script for AI Image Generator
 * Tests all major functionality
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_EMAIL = `test_${Date.now()}@example.com`;
const TEST_PASSWORD = 'testpassword123';
const TEST_NAME = 'Test User';

let authToken = null;
let userId = null;
let generationId = null;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, type = 'info') {
  const color = type === 'success' ? colors.green : type === 'error' ? colors.red : type === 'warning' ? colors.yellow : colors.blue;
  console.log(`${color}[${type.toUpperCase()}]${colors.reset} ${message}`);
}

async function runTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     AI Image Generator - End-to-End Test Suite         ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Health Check
  try {
    log('Testing health endpoint...', 'info');
    const response = await axios.get(`${API_URL}/api/health`);
    if (response.data.status === 'online') {
      log('Health check passed ✓', 'success');
      passed++;
    } else {
      log('Health check failed', 'error');
      failed++;
    }
  } catch (error) {
    log(`Health check error: ${error.message}`, 'error');
    failed++;
  }

  // Test 2: Get Models
  try {
    log('Testing models endpoint...', 'info');
    const response = await axios.get(`${API_URL}/api/models`);
    if (Array.isArray(response.data) && response.data.length > 0) {
      log(`Models endpoint passed ✓ (${response.data.length} models)`, 'success');
      passed++;
    } else {
      log('Models endpoint failed', 'error');
      failed++;
    }
  } catch (error) {
    log(`Models endpoint error: ${error.message}`, 'error');
    failed++;
  }

  // Test 3: User Registration
  try {
    log('Testing user registration...', 'info');
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: TEST_NAME
    });
    if (response.data.token && response.data.user) {
      authToken = response.data.token;
      userId = response.data.user.id;
      log(`Registration passed ✓ (User: ${response.data.user.email})`, 'success');
      passed++;
    } else {
      log('Registration failed', 'error');
      failed++;
    }
  } catch (error) {
    log(`Registration error: ${error.response?.data?.error || error.message}`, 'error');
    failed++;
  }

  // Test 4: User Login
  try {
    log('Testing user login...', 'info');
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    if (response.data.token && response.data.user) {
      authToken = response.data.token;
      log('Login passed ✓', 'success');
      passed++;
    } else {
      log('Login failed', 'error');
      failed++;
    }
  } catch (error) {
    log(`Login error: ${error.response?.data?.error || error.message}`, 'error');
    failed++;
  }

  // Test 5: Get Current User
  try {
    log('Testing get current user...', 'info');
    const response = await axios.get(`${API_URL}/api/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (response.data.id === userId) {
      log('Get user passed ✓', 'success');
      passed++;
    } else {
      log('Get user failed', 'error');
      failed++;
    }
  } catch (error) {
    log(`Get user error: ${error.response?.data?.error || error.message}`, 'error');
    failed++;
  }

  // Test 6: Generate Image (may fail due to model loading)
  try {
    log('Testing image generation...', 'info');
    const response = await axios.post(`${API_URL}/api/generate`, {
      prompt: 'A beautiful sunset over mountains',
      negativePrompt: 'blurry, low quality',
      width: 512,
      height: 512
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (response.data.generationId && response.data.status === 'PROCESSING') {
      generationId = response.data.generationId;
      log(`Generation started ✓ (ID: ${generationId})`, 'success');
      passed++;
    } else {
      log('Generation start failed', 'error');
      failed++;
    }
  } catch (error) {
    log(`Generation error: ${error.response?.data?.error || error.message}`, 'error');
    failed++;
  }

  // Test 7: Get Generation Status
  if (generationId) {
    try {
      log('Testing generation status check...', 'info');
      const response = await axios.get(`${API_URL}/api/generations/${generationId}`);
      if (response.data.id === generationId) {
        log(`Status check passed ✓ (Status: ${response.data.status})`, 'success');
        passed++;
      } else {
        log('Status check failed', 'error');
        failed++;
      }
    } catch (error) {
      log(`Status check error: ${error.response?.data?.error || error.message}`, 'error');
      failed++;
    }
  }

  // Test 8: List Generations
  try {
    log('Testing list generations...', 'info');
    const response = await axios.get(`${API_URL}/api/generations`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (Array.isArray(response.data)) {
      log(`List generations passed ✓ (${response.data.length} items)`, 'success');
      passed++;
    } else {
      log('List generations failed', 'error');
      failed++;
    }
  } catch (error) {
    log(`List generations error: ${error.response?.data?.error || error.message}`, 'error');
    failed++;
  }

  // Test 9: Add to Favorites (if generation exists)
  if (generationId) {
    try {
      log('Testing add to favorites...', 'info');
      const response = await axios.post(`${API_URL}/api/favorites/${generationId}`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (response.data.success) {
        log('Add to favorites passed ✓', 'success');
        passed++;
      } else {
        log('Add to favorites failed', 'error');
        failed++;
      }
    } catch (error) {
      log(`Add to favorites error: ${error.response?.data?.error || error.message}`, 'error');
      failed++;
    }
  }

  // Test 10: Get Favorites
  try {
    log('Testing get favorites...', 'info');
    const response = await axios.get(`${API_URL}/api/favorites`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (Array.isArray(response.data)) {
      log(`Get favorites passed ✓ (${response.data.length} favorites)`, 'success');
      passed++;
    } else {
      log('Get favorites failed', 'error');
      failed++;
    }
  } catch (error) {
    log(`Get favorites error: ${error.response?.data?.error || error.message}`, 'error');
    failed++;
  }

  // Test 11: Remove from Favorites
  if (generationId) {
    try {
      log('Testing remove from favorites...', 'info');
      const response = await axios.delete(`${API_URL}/api/favorites/${generationId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (response.data.success) {
        log('Remove from favorites passed ✓', 'success');
        passed++;
      } else {
        log('Remove from favorites failed', 'error');
        failed++;
      }
    } catch (error) {
      log(`Remove from favorites error: ${error.response?.data?.error || error.message}`, 'error');
      failed++;
    }
  }

  // Test 12: Unauthenticated Access (should fail)
  try {
    log('Testing unauthenticated access protection...', 'info');
    await axios.get(`${API_URL}/api/me`);
    log('Unauthenticated access should have failed', 'error');
    failed++;
  } catch (error) {
    if (error.response?.status === 401) {
      log('Unauthenticated access correctly blocked ✓', 'success');
      passed++;
    } else {
      log('Unexpected error for unauthenticated access', 'error');
      failed++;
    }
  }

  // Summary
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                    Test Summary                        ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  Total Tests: ${(passed + failed).toString().padEnd(43)}║`);
  console.log(`║  ${colors.green}Passed: ${passed.toString().padEnd(48)}${colors.reset}║`);
  console.log(`║  ${colors.red}Failed: ${failed.toString().padEnd(48)}${colors.reset}║`);
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
