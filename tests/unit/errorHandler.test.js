const { errorHandler, notFoundHandler } = require('../../src/middleware/errorHandler');
const logger = require('../../src/middleware/logger');

jest.mock('../../src/middleware/logger');

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { url: '/test', method: 'GET', ip: '127.0.0.1' };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  test('should handle generic errors', () => {
    const err = new Error('Test error');
    
    errorHandler(err, req, res, next);
    
    expect(logger.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Error'
    }));
  });

  test('should handle file size limit errors', () => {
    const err = new Error('File too large');
    err.code = 'LIMIT_FILE_SIZE';
    
    errorHandler(err, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'File too large'
    }));
  });

  test('should handle unexpected file errors', () => {
    const err = new Error('Unexpected field');
    err.code = 'LIMIT_UNEXPECTED_FILE';
    
    errorHandler(err, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Invalid file field'
    }));
  });

  test('should use custom status code', () => {
    const err = new Error('Not found');
    err.statusCode = 404;
    
    errorHandler(err, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('Not Found Handler', () => {
  test('should return 404 with available endpoints', () => {
    const req = { method: 'GET', url: '/unknown' };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    notFoundHandler(req, res);
    
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Not Found',
      availableEndpoints: expect.any(Array)
    }));
  });
});
