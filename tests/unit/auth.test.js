const { authenticateApiKey, optionalAuth } = require('../../src/middleware/auth');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('authenticateApiKey', () => {
    test('should reject request without authorization header', () => {
      authenticateApiKey(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Unauthorized'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with invalid format', () => {
      req.headers.authorization = 'InvalidFormat';
      
      authenticateApiKey(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with invalid API key', () => {
      req.headers.authorization = 'Bearer invalid-key';
      
      authenticateApiKey(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    test('should continue without authentication', () => {
      optionalAuth(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.authenticated).toBeUndefined();
    });

    test('should mark as authenticated with valid key', () => {
      process.env.API_KEY = 'test-key';
      req.headers.authorization = 'Bearer test-key';
      
      optionalAuth(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.authenticated).toBe(true);
      
      delete process.env.API_KEY;
    });
  });
});
