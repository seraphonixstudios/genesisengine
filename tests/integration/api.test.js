const request = require('supertest');

describe('Image Generation API Integration', () => {
  const baseUrl = process.env.TEST_URL || 'http://localhost:5000';
  const apiKey = process.env.TEST_API_KEY || 'test-key';

  describe('Health Check', () => {
    test('should return health status', async () => {
      const res = await request(baseUrl)
        .get('/health')
        .expect(200);
      
      expect(res.body.status).toBe('ok');
    });
  });

  describe('API Endpoints', () => {
    test('should return available models', async () => {
      const res = await request(baseUrl)
        .get('/api/models')
        .set('Authorization', `Bearer ${apiKey}`)
        .expect(200);
      
      expect(res.body.models).toBeDefined();
      expect(Array.isArray(res.body.models)).toBe(true);
    });

    test('should return available styles', async () => {
      const res = await request(baseUrl)
        .get('/api/styles')
        .set('Authorization', `Bearer ${apiKey}`)
        .expect(200);
      
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('should return style presets', async () => {
      const res = await request(baseUrl)
        .get('/api/style-presets')
        .set('Authorization', `Bearer ${apiKey}`)
        .expect(200);
      
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Authentication', () => {
    test('should reject unauthenticated requests', async () => {
      const res = await request(baseUrl)
        .get('/api/models')
        .expect(401);
      
      expect(res.body.error).toBeDefined();
    });

    test('should reject invalid API keys', async () => {
      const res = await request(baseUrl)
        .get('/api/models')
        .set('Authorization', 'Bearer invalid-key')
        .expect(401);
      
      expect(res.body.error).toBeDefined();
    });
  });
});
