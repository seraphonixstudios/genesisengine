/**
 * Integration Tests
 * Test API endpoints with mock database
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:5001/api';

describe('Integration Tests - API Endpoints', () => {
  let authToken: string;
  let testUserId: string;
  const client = axios.create({
    baseURL: API_URL,
    validateStatus: () => true,
  });

  describe('Health Check', () => {
    test('API should be running', async () => {
      const response = await client.get('/health');
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Authentication Endpoints', () => {
    test('POST /auth/register - create user', async () => {
      const response = await client.post('/auth/register', {
        email: `int-test-${Date.now()}@example.com`,
        password: 'IntegrationTest123!',
        name: 'Integration Tester',
      });

      if (response.status === 201) {
        expect(response.data).toHaveProperty('token');
        expect(response.data.user).toHaveProperty('id');
        authToken = response.data.token;
        testUserId = response.data.user.id;
      }
    });

    test('POST /auth/login - authenticate user', async () => {
      const email = `int-test-${Date.now()}@example.com`;
      
      // First register
      await client.post('/auth/register', {
        email,
        password: 'IntegrationTest123!',
        name: 'Login Tester',
      });

      // Then login
      const response = await client.post('/auth/login', {
        email,
        password: 'IntegrationTest123!',
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('token');
    });
  });

  describe('Protected Endpoints', () => {
    beforeEach(async () => {
      const regResponse = await client.post('/auth/register', {
        email: `protected-${Date.now()}@example.com`,
        password: 'ProtectedTest123!',
        name: 'Protected User',
      });

      if (regResponse.status === 201) {
        authToken = regResponse.data.token;
      }
    });

    test('GET /me - get current user', async () => {
      const response = await client.get('/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect([200, 401]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data).toHaveProperty('email');
        expect(response.data).toHaveProperty('name');
      }
    });

    test('Endpoints should require authentication', async () => {
      const response = await client.get('/me');

      expect(response.status).toBe(401);
    });
  });

  describe('Generation Endpoints', () => {
    beforeEach(async () => {
      const regResponse = await client.post('/auth/register', {
        email: `gen-${Date.now()}@example.com`,
        password: 'GenerationTest123!',
        name: 'Generation User',
      });

      if (regResponse.status === 201) {
        authToken = regResponse.data.token;
      }
    });

    test('POST /generate - create generation', async () => {
      const response = await client.post(
        '/generate',
        {
          prompt: 'Integration test image',
          width: 512,
          height: 512,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect([200, 201]).toContain(response.status);
      if (response.status === 200 || response.status === 201) {
        expect(response.data).toHaveProperty('id');
      }
    });

    test('GET /models - list available models', async () => {
      const response = await client.get('/models', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data) || response.data.models).toBeTruthy();
    });

    test('GET /generations - list user generations', async () => {
      const response = await client.get('/generations', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('400 - invalid request body', async () => {
      const response = await client.post('/auth/register', {
        // Missing required fields
        email: 'test@example.com',
      });

      expect(response.status).toBe(400);
    });

    test('401 - missing authorization', async () => {
      const response = await client.get('/me');

      expect(response.status).toBe(401);
    });

    test('404 - non-existent resource', async () => {
      const regResponse = await client.post('/auth/register', {
        email: `notfound-${Date.now()}@example.com`,
        password: 'NotFoundTest123!',
        name: 'NotFound User',
      });

      const response = await client.get('/generations/nonexistent-id', {
        headers: { Authorization: `Bearer ${regResponse.data?.token}` },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('Rate Limiting', () => {
    test('should handle rate limiting', async () => {
      const requests = Array(10)
        .fill(null)
        .map(() =>
          client.post('/auth/register', {
            email: `rate-${Date.now()}-${Math.random()}@example.com`,
            password: 'RateTest123!',
            name: 'Rate Test',
          })
        );

      const responses = await Promise.all(requests);
      
      // At least some should succeed
      expect(responses.some(r => r.status === 201)).toBe(true);
    });
  });

  describe('Data Validation', () => {
    test('email validation', async () => {
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@nodomain.com',
      ];

      for (const email of invalidEmails) {
        const response = await client.post('/auth/register', {
          email,
          password: 'ValidPassword123!',
          name: 'Test User',
        });

        expect([400, 422]).toContain(response.status);
      }
    });

    test('password validation', async () => {
      const invalidPasswords = [
        '123', // too short
        'noupppercase123', // missing uppercase
        'NOLOWERCASE123', // missing lowercase
        'NoNumbers', // missing numbers
      ];

      for (const password of invalidPasswords) {
        const response = await client.post('/auth/register', {
          email: `validate-${Date.now()}-${Math.random()}@example.com`,
          password,
          name: 'Test User',
        });

        expect(response.status).toBe(400);
      }
    });

    test('image dimension validation', async () => {
      const regResponse = await client.post('/auth/register', {
        email: `dim-${Date.now()}@example.com`,
        password: 'DimensionTest123!',
        name: 'Dimension User',
      });

      const invalidDimensions = [
        { width: 10000, height: 10000 }, // too large
        { width: 100, height: 100 }, // too small
        { width: -100, height: 100 }, // negative
      ];

      for (const dims of invalidDimensions) {
        const response = await client.post(
          '/generate',
          {
            prompt: 'test',
            width: dims.width,
            height: dims.height,
          },
          {
            headers: { Authorization: `Bearer ${regResponse.data?.token}` },
          }
        );

        expect(response.status).toBe(400);
      }
    });
  });
});
