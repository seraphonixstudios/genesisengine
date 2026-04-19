const crypto = require('crypto');

// Use environment variable or generate a default
const API_KEY = process.env.API_KEY || 'test-api-key';

if (!process.env.API_KEY) {
  console.log(`Using default API Key: ${API_KEY}`);
  console.log('Set API_KEY in your environment variables for production');
}

function authenticateApiKey(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      error: 'Unauthorized'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ 
      error: 'Unauthorized'
    });
  }

  const apiKey = parts[1];
  
  if (apiKey !== API_KEY) {
    return res.status(401).json({ 
      error: 'Unauthorized'
    });
  }

  req.authenticated = true;
  next();
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const parts = authHeader.split(' ');
    // Check against both module-level API_KEY and process.env.API_KEY for test compatibility
    const validKey = process.env.API_KEY || API_KEY || 'test-api-key';
    if (parts.length === 2 && parts[0] === 'Bearer' && parts[1] === validKey) {
      req.authenticated = true;
    }
  }
  
  next();
}

module.exports = { authenticateApiKey, optionalAuth, API_KEY };
