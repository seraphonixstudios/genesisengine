#!/usr/bin/env node
/**
 * Comprehensive Test Runner
 * Starts the server and runs all test suites
 */

const { spawn } = require('child_process');
const http = require('http');

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

function waitForServer(url, maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const check = () => {
      attempts++;
      http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          retry();
        }
      }).on('error', retry);
    };
    
    const retry = () => {
      if (attempts >= maxAttempts) {
        reject(new Error('Server failed to start'));
      } else {
        setTimeout(check, 1000);
      }
    };
    
    check();
  });
}

function runTests(testPath) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, API_URL: 'http://localhost:5000/api' };
    const args = ['test', '--', '--runInBand'];
    
    if (testPath) {
      args.push('--testPathPattern', testPath);
    }
    
    const jest = spawn('npm', args, {
      stdio: 'inherit',
      env,
      shell: true
    });
    
    jest.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Tests failed with code ${code}`));
      }
    });
  });
}

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     AI Image Generator - Test Runner                   ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('\n');
  
  let server;
  
  try {
    // Start server
    log('Starting server on port 5000...', 'info');
    server = spawn('node', ['server-enhanced-v2.js'], {
      env: { ...process.env, PORT: '5000' },
      stdio: 'pipe',
      shell: true
    });
    
    // Log server output
    server.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`${colors.cyan}[SERVER]${colors.reset} ${output}`);
      }
    });
    
    server.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output && !output.includes('ExperimentalWarning')) {
        console.log(`${colors.yellow}[SERVER WARN]${colors.reset} ${output}`);
      }
    });
    
    // Wait for server to be ready
    log('Waiting for server to be ready...', 'info');
    await waitForServer('http://localhost:5000/api/health');
    log('Server is ready!', 'success');
    console.log('\n');
    
    // Run Unit Tests
    log('Running Unit Tests...', 'info');
    try {
      await runTests('unit');
      log('Unit tests completed!', 'success');
    } catch (e) {
      log('Unit tests failed', 'error');
    }
    console.log('\n');
    
    // Run Integration Tests
    log('Running Integration Tests...', 'info');
    try {
      await runTests('integration');
      log('Integration tests completed!', 'success');
    } catch (e) {
      log('Integration tests failed', 'error');
    }
    console.log('\n');
    
    // Run E2E Tests
    log('Running E2E System Tests...', 'info');
    try {
      await runTests('e2e/system');
      log('E2E tests completed!', 'success');
    } catch (e) {
      log('E2E tests failed', 'error');
    }
    console.log('\n');
    
    log('All test suites completed!', 'success');
    
  } catch (error) {
    log(`Test runner error: ${error.message}`, 'error');
  } finally {
    // Cleanup
    if (server) {
      log('Shutting down server...', 'info');
      server.kill();
    }
  }
  
  console.log('\n');
}

main();
