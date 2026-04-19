const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

let store;

if (process.env.REDIS_URL) {
  const client = new Redis(process.env.REDIS_URL);
  store = new RedisStore({
    client,
    prefix: 'rl:',
  });
}

const limiter = rateLimit({
  store,
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10,
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: `Too many requests. Limit: ${parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10} per ${(parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000) / 1000} seconds`,
      retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000) / 1000)
    });
  }
});

const strictLimiter = rateLimit({
  store,
  windowMs: 60000,
  max: 5,
  message: {
    error: 'Too many generation requests',
    message: 'Image generation is limited to 5 per minute'
  }
});

module.exports = { limiter, strictLimiter };
