/**
 * Test Setup
 * Initialize test environment
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.API_URL = process.env.API_URL || 'http://localhost:5000/api';

// Increase timeout for slow tests
jest.setTimeout(30000);

// Mock console methods to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};
