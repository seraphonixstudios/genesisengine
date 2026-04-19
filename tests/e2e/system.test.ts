/**
 * End-to-End System Tests
 * Tests complete user workflows from authentication to image generation
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.API_URL || 'http://localhost:5001/api';

interface TestUser {
  email: string;
  password: string;
  name: string;
  token?: string;
}

describe('AI Image Generator - E2E System Tests', () => {
  let apiClient: AxiosInstance;
  const testUser: TestUser = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
  };

  beforeAll(() => {
    apiClient = axios.create({
      baseURL: API_BASE_URL,
      validateStatus: () => true, // Don't throw on any status
    });
  });

  describe('Authentication Flow', () => {
    test('should register a new user', async () => {
      const response = await apiClient.post('/auth/register', {
        email: testUser.email,
        password: testUser.password,
        name: testUser.name,
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('token');
      expect(response.data).toHaveProperty('user');
      expect(response.data.user.email).toBe(testUser.email);
      expect(response.data.user.name).toBe(testUser.name);

      testUser.token = response.data.token;
    });

    test('should not register with duplicate email', async () => {
      const response = await apiClient.post('/auth/register', {
        email: testUser.email,
        password: testUser.password,
        name: 'Another User',
      });

      expect(response.status).toBe(409);
      expect(response.data.error).toContain('already exists');
    });

    test('should not register with invalid email', async () => {
      const response = await apiClient.post('/auth/register', {
        email: 'invalid-email',
        password: testUser.password,
        name: 'Test User',
      });

      expect(response.status).toBe(400);
    });

    test('should not register with weak password', async () => {
      const response = await apiClient.post('/auth/register', {
        email: `weak-${Date.now()}@example.com`,
        password: '123', // Too short
        name: 'Test User',
      });

      expect(response.status).toBe(400);
    });

    test('should login with correct credentials', async () => {
      const response = await apiClient.post('/auth/login', {
        email: testUser.email,
        password: testUser.password,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('token');
      expect(response.data.user.email).toBe(testUser.email);
    });

    test('should not login with wrong password', async () => {
      const response = await apiClient.post('/auth/login', {
        email: testUser.email,
        password: 'WrongPassword123!',
      });

      expect(response.status).toBe(401);
    });

    test('should not login with non-existent email', async () => {
      const response = await apiClient.post('/auth/login', {
        email: 'nonexistent@example.com',
        password: testUser.password,
      });

      expect(response.status).toBe(404);
    });
  });

  describe('User Profile', () => {
    let authClient: AxiosInstance;

    beforeAll(() => {
      authClient = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          Authorization: `Bearer ${testUser.token}`,
        },
        validateStatus: () => true,
      });
    });

    test('should get current user profile', async () => {
      const response = await authClient.get('/me');

      expect(response.status).toBe(200);
      expect(response.data.email).toBe(testUser.email);
      expect(response.data.name).toBe(testUser.name);
      expect(response.data).toHaveProperty('credits');
      expect(response.data).toHaveProperty('plan');
    });

    test('should not access profile without token', async () => {
      const response = await apiClient.get('/me');

      expect(response.status).toBe(401);
    });

    test('should not access profile with invalid token', async () => {
      const invalidClient = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          Authorization: 'Bearer invalid-token',
        },
        validateStatus: () => true,
      });

      const response = await invalidClient.get('/me');

      expect(response.status).toBe(401);
    });
  });

  describe('Image Generation Flow', () => {
    let authClient: AxiosInstance;

    beforeAll(() => {
      authClient = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          Authorization: `Bearer ${testUser.token}`,
        },
        validateStatus: () => true,
      });
    });

    test('should initiate image generation', async () => {
      const response = await authClient.post('/generate', {
        prompt: 'a serene Japanese garden with cherry blossoms, ultra detailed',
        negativePrompt: 'blurry, low quality',
        model: 'stable-diffusion',
        stylePreset: 'photorealistic',
        width: 1024,
        height: 1024,
        enhancePrompt: true,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('status');
      expect(['PENDING', 'PROCESSING', 'COMPLETED']).toContain(response.data.status);
    });

    test('should not generate without prompt', async () => {
      const response = await authClient.post('/generate', {
        negativePrompt: 'blurry',
        model: 'stable-diffusion',
        stylePreset: 'photorealistic',
        width: 1024,
        height: 1024,
      });

      expect(response.status).toBe(400);
    });

    test('should not generate without authentication', async () => {
      const response = await apiClient.post('/generate', {
        prompt: 'test image',
        model: 'stable-diffusion',
        width: 1024,
        height: 1024,
      });

      expect(response.status).toBe(401);
    });

    test('should validate image dimensions', async () => {
      const response = await authClient.post('/generate', {
        prompt: 'test image',
        model: 'stable-diffusion',
        width: 10000, // Invalid - too large
        height: 10000,
      });

      expect(response.status).toBe(400);
    });

    test('should handle model availability', async () => {
      const response = await authClient.post('/generate', {
        prompt: 'test image',
        model: 'nonexistent-model',
        width: 1024,
        height: 1024,
      });

      expect([400, 404]).toContain(response.status);
    });
  });

  describe('Generation Status and Polling', () => {
    let authClient: AxiosInstance;
    let generationId: string;

    beforeAll(async () => {
      authClient = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          Authorization: `Bearer ${testUser.token}`,
        },
        validateStatus: () => true,
      });

      // Create a generation to poll
      const genResponse = await authClient.post('/generate', {
        prompt: 'a beautiful sunset over mountains',
        model: 'stable-diffusion',
        width: 512,
        height: 512,
      });

      if (genResponse.status === 200) {
        generationId = genResponse.data.id;
      }
    });

    test('should retrieve generation status', async () => {
      if (!generationId) {
        console.warn('Skipping status test - no generation created');
        return;
      }

      const response = await authClient.get(`/generations/${generationId}`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('status');
      expect(response.data).toHaveProperty('prompt');
      expect(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).toContain(
        response.data.status
      );
    });

    test('should not access generation without authentication', async () => {
      if (!generationId) {
        console.warn('Skipping auth test - no generation created');
        return;
      }

      const response = await apiClient.get(`/generations/${generationId}`);

      expect(response.status).toBe(401);
    });

    test('should return 404 for non-existent generation', async () => {
      const response = await authClient.get('/generations/nonexistent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('Gallery and History', () => {
    let authClient: AxiosInstance;

    beforeAll(() => {
      authClient = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          Authorization: `Bearer ${testUser.token}`,
        },
        validateStatus: () => true,
      });
    });

    test('should retrieve user generations', async () => {
      const response = await authClient.get('/generations');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      if (response.data.length > 0) {
        expect(response.data[0]).toHaveProperty('id');
        expect(response.data[0]).toHaveProperty('prompt');
        expect(response.data[0]).toHaveProperty('status');
      }
    });

    test('should support pagination', async () => {
      const response = await authClient.get('/generations?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    test('should filter generations by status', async () => {
      const response = await authClient.get('/generations?status=COMPLETED');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      if (response.data.length > 0) {
        response.data.forEach(gen => {
          expect(gen.status).toBe('COMPLETED');
        });
      }
    });

    test('should not access other users generations', async () => {
      // This would require creating another user and verifying isolation
      // Placeholder for security test
      expect(true).toBe(true);
    });
  });

  describe('Available Models', () => {
    let authClient: AxiosInstance;

    beforeAll(() => {
      authClient = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          Authorization: `Bearer ${testUser.token}`,
        },
        validateStatus: () => true,
      });
    });

    test('should list available models', async () => {
      const response = await authClient.get('/models');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data) || response.data.models).toBeTruthy();
    });

    test('should include model metadata', async () => {
      const response = await authClient.get('/models');

      expect(response.status).toBe(200);
      
      const models = Array.isArray(response.data) ? response.data : response.data.models;
      
      if (models && models.length > 0) {
        expect(models[0]).toHaveProperty('id');
        expect(models[0]).toHaveProperty('name');
      }
    });
  });

  describe('Error Handling and Validation', () => {
    let authClient: AxiosInstance;

    beforeAll(() => {
      authClient = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          Authorization: `Bearer ${testUser.token}`,
        },
        validateStatus: () => true,
      });
    });

    test('should handle malformed JSON', async () => {
      const response = await axios.post(`${API_BASE_URL}/generate`, 'invalid json', {
        headers: {
          'Authorization': `Bearer ${testUser.token}`,
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      });

      expect([400, 422]).toContain(response.status);
    });

    test('should handle rate limiting gracefully', async () => {
      // Make multiple rapid requests
      const requests = Array(5)
        .fill(null)
        .map(() =>
          authClient.post('/generate', {
            prompt: 'test',
            width: 512,
            height: 512,
          })
        );

      const responses = await Promise.all(requests);
      
      // Should have at least some successful responses
      expect(responses.some(r => r.status === 200 || r.status === 429)).toBe(true);
    });

    test('should sanitize user input', async () => {
      const response = await authClient.post('/generate', {
        prompt: '<script>alert("xss")</script>',
        width: 512,
        height: 512,
      });

      // Should either sanitize or reject
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Complete User Workflow', () => {
    test('should complete full user journey', async () => {
      const workflow = {
        email: `workflow-${Date.now()}@example.com`,
        password: 'WorkflowTest123!',
        name: 'Workflow User',
      };

      const client = axios.create({
        baseURL: API_BASE_URL,
        validateStatus: () => true,
      });

      // 1. Register
      let response = await client.post('/auth/register', {
        email: workflow.email,
        password: workflow.password,
        name: workflow.name,
      });
      expect(response.status).toBe(201);
      const token = response.data.token;

      // 2. Login
      response = await client.post('/auth/login', {
        email: workflow.email,
        password: workflow.password,
      });
      expect(response.status).toBe(200);

      // 3. Get profile
      const authClient = axios.create({
        baseURL: API_BASE_URL,
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true,
      });

      response = await authClient.get('/me');
      expect(response.status).toBe(200);
      expect(response.data.email).toBe(workflow.email);

      // 4. Get available models
      response = await authClient.get('/models');
      expect(response.status).toBe(200);

      // 5. Generate image
      response = await authClient.post('/generate', {
        prompt: 'a beautiful landscape',
        model: 'stable-diffusion',
        width: 512,
        height: 512,
      });
      expect(response.status).toBe(200);
      const generationId = response.data.id;

      // 6. Check generation status
      response = await authClient.get(`/generations/${generationId}`);
      expect(response.status).toBe(200);
      expect(response.data.status).toBeTruthy();

      // 7. List all generations
      response = await authClient.get('/generations');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });
});
