const logger = require('./logger');

function errorHandler(err, req, res, next) {
  logger.error(err.message, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      message: `Maximum file size is ${process.env.MAX_IMAGE_SIZE || 10485760} bytes`
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Invalid file field',
      message: 'Unexpected file field in request'
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(statusCode).json({
    error: err.name || 'Error',
    message: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.url} not found`,
    availableEndpoints: [
      'POST /api/generate',
      'POST /api/generate-img2img',
      'POST /api/generate-inpaint',
      'GET /api/models',
      'GET /api/styles',
      'GET /api/style-presets',
      'GET /health',
      'GET /metrics'
    ]
  });
}

module.exports = { errorHandler, notFoundHandler };
