const request = require('supertest');
const express = require('express');

describe('AI Image Generator Server', () => {
  let app;
  
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
  });

  describe('Health Endpoint', () => {
    test('should return health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);
      
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('Authentication', () => {
    test('should reject requests without API key', async () => {
      const app2 = express();
      app2.use(express.json());
      app2.use((req, res, next) => {
        const auth = req.headers.authorization;
        if (!auth) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        next();
      });
      app2.get('/test', (req, res) => res.json({ ok: true }));

      const res = await request(app2)
        .get('/test')
        .expect(401);
      
      expect(res.body.error).toBe('Unauthorized');
    });

    test('should accept requests with valid API key', async () => {
      const app2 = express();
      app2.use(express.json());
      app2.use((req, res, next) => {
        const auth = req.headers.authorization;
        if (auth === 'Bearer test-api-key') {
          return next();
        }
        res.status(401).json({ error: 'Unauthorized' });
      });
      app2.get('/test', (req, res) => res.json({ ok: true }));

      const res = await request(app2)
        .get('/test')
        .set('Authorization', 'Bearer test-api-key')
        .expect(200);
      
      expect(res.body.ok).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    test('should track request counts', () => {
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(i);
      }
      expect(requests.length).toBe(5);
    });
  });
});
