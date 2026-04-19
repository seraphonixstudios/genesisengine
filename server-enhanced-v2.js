/**
 * AI Image Generator - Enhanced VPS Production Server
 * Features: Authentication, Favorites, Bulk Operations, Enhanced API
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();

// Configuration
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const API_KEY = process.env.HUGGINGFACE_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validate API key
if (!API_KEY) {
  console.error('ERROR: HUGGINGFACE_API_KEY is required');
  console.error('Set it in your .env file');
  process.exit(1);
}

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// Stricter rate limit for generation
const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Generation rate limit exceeded. Please wait a minute.' }
});

// Static files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Data stores
const generations = new Map();
const users = new Map();
const favorites = new Map();

// Initialize default user
const defaultUserId = uuidv4();
users.set(defaultUserId, {
  id: defaultUserId,
  email: 'demo@example.com',
  password: bcrypt.hashSync('demo123', 10),
  name: 'Demo User',
  credits: 100,
  plan: 'free',
  createdAt: new Date().toISOString()
});
favorites.set(defaultUserId, new Set());

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.user = users.get(decoded.userId);
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Optional auth middleware
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      req.user = users.get(decoded.userId);
    } catch (err) {
      // Invalid token, continue without user
    }
  }
  next();
};

// ============ AUTH ROUTES ============

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one lowercase letter' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one number' });
    }

    for (const user of users.values()) {
      if (user.email === email) {
        return res.status(409).json({ error: 'User already exists' });
      }
    }

    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      id: userId,
      email,
      password: hashedPassword,
      name,
      credits: 10,
      plan: 'free',
      createdAt: new Date().toISOString()
    };

    users.set(userId, user);
    favorites.set(userId, new Set());

    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        plan: user.plan
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let user = null;
    for (const u of users.values()) {
      if (u.email === email) {
        user = u;
        break;
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        plan: user.plan
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get('/api/me', authenticateToken, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    credits: req.user.credits,
    plan: req.user.plan
  });
});

// ============ HEALTH & MODELS ============

// Health endpoints (both /api/health and /health for compatibility)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: ['authentication', 'favorites', 'bulk-operations']
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

app.get('/api/models', (req, res) => {
  res.json({
    models: [
      { id: 'stable-diffusion', name: 'Stable Diffusion 2.1', provider: 'HuggingFace', quality: 'High', description: 'General purpose, reliable results' },
      { id: 'sdxl', name: 'SDXL Base', provider: 'HuggingFace', quality: 'Ultra', description: 'Higher quality, more detailed images' }
    ]
  });
});

// Styles endpoint (for test compatibility)
app.get('/api/styles', (req, res) => {
  res.json([
    { id: 'none', name: 'Default', icon: '⚡' },
    { id: 'photorealistic', name: 'Photorealistic', icon: '📸' },
    { id: 'digital-art', name: 'Digital Art', icon: '🎨' },
    { id: 'anime', name: 'Anime', icon: '🎌' },
    { id: 'cyberpunk', name: 'Cyberpunk', icon: '🌃' },
    { id: 'fantasy', name: 'Fantasy', icon: '🏰' }
  ]);
});

// Style presets endpoint (for test compatibility)
app.get('/api/style-presets', (req, res) => {
  res.json([
    { id: 'none', name: 'Default', description: 'Standard generation' },
    { id: 'photorealistic', name: 'Photorealistic', description: 'Realistic photography' },
    { id: 'digital-art', name: 'Digital Art', description: 'ArtStation trending' },
    { id: 'anime', name: 'Anime', description: 'Anime/manga style' },
    { id: 'cyberpunk', name: 'Cyberpunk', description: 'Neon futuristic' },
    { id: 'fantasy', name: 'Fantasy', description: 'Epic magical scenes' }
  ]);
});

// ============ GENERATION ROUTES ============

app.post('/api/generate', generateLimiter, optionalAuth, async (req, res) => {
  try {
    const { prompt, negativePrompt = '', width = 512, height = 512, stylePreset = 'none' } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Validate dimensions
    const w = parseInt(width);
    const h = parseInt(height);
    
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      return res.status(400).json({ error: 'Invalid dimensions. Width and height must be positive numbers' });
    }
    
    if (w < 128 || h < 128) {
      return res.status(400).json({ error: 'Dimensions too small. Minimum size is 128x128' });
    }
    
    if (w > 2048 || h > 2048) {
      return res.status(400).json({ error: 'Dimensions too large. Maximum size is 2048x2048' });
    }

    const userId = req.userId;
    if (userId) {
      const user = users.get(userId);
      if (!user || user.credits < 1) {
        return res.status(403).json({ error: 'Insufficient credits' });
      }
      user.credits--;
    }

    const generationId = uuidv4();
    const generation = {
      id: generationId,
      status: 'PROCESSING',
      prompt,
      negativePrompt,
      width,
      height,
      stylePreset,
      createdAt: new Date().toISOString(),
      url: null,
      error: null,
      userId: userId || null,
      progress: 0
    };

    generations.set(generationId, generation);

    res.status(200).json({
      id: generationId,
      generationId,
      status: 'PROCESSING',
      message: 'Generation started'
    });

    // Process in background
    try {
      console.log(`[${generationId}] Starting generation...`);

      const response = await axios.post(
        'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1',
        {
          inputs: prompt,
          parameters: {
            negative_prompt: negativePrompt,
            width: parseInt(width),
            height: parseInt(height),
            num_inference_steps: 25,
            guidance_scale: 7.5
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 300000
        }
      );

      const filename = `${generationId}.png`;
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, response.data);

      generation.status = 'COMPLETED';
      generation.url = `/uploads/${filename}`;
      generation.progress = 100;
      console.log(`[${generationId}] Success`);

    } catch (error) {
      console.error(`[${generationId}] Failed:`, error.message);

      if (error.response?.status === 503 || error.response?.status === 410) {
        generation.status = 'FAILED';
        generation.error = 'Model is loading. Please try again in 2-3 minutes.';
      } else {
        generation.status = 'FAILED';
        generation.error = error.message || 'Generation failed';
      }
    }

  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/generations/:id', (req, res) => {
  const generation = generations.get(req.params.id);
  if (!generation) {
    return res.status(404).json({ error: 'Generation not found' });
  }
  res.json(generation);
});

app.get('/api/generations', optionalAuth, (req, res) => {
  const userId = req.userId;
  let list = Array.from(generations.values());

  if (userId) {
    list = list.filter(g => g.userId === userId);
  }

  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

// ============ FAVORITES ROUTES ============

app.get('/api/favorites', authenticateToken, (req, res) => {
  const userFavorites = favorites.get(req.userId) || new Set();
  const favoriteGenerations = Array.from(userFavorites)
    .map(id => generations.get(id))
    .filter(g => g !== undefined)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(favoriteGenerations);
});

app.post('/api/favorites/:id', authenticateToken, (req, res) => {
  const generationId = req.params.id;
  const generation = generations.get(generationId);

  if (!generation) {
    return res.status(404).json({ error: 'Generation not found' });
  }

  const userFavorites = favorites.get(req.userId) || new Set();
  userFavorites.add(generationId);
  favorites.set(req.userId, userFavorites);

  res.json({ success: true, message: 'Added to favorites' });
});

app.delete('/api/favorites/:id', authenticateToken, (req, res) => {
  const generationId = req.params.id;
  const userFavorites = favorites.get(req.userId) || new Set();
  userFavorites.delete(generationId);
  favorites.set(req.userId, userFavorites);

  res.json({ success: true, message: 'Removed from favorites' });
});

// ============ BULK OPERATIONS ============

app.post('/api/bulk/delete', authenticateToken, (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'IDs array required' });
  }

  let deleted = 0;
  for (const id of ids) {
    const gen = generations.get(id);
    if (gen && gen.userId === req.userId) {
      generations.delete(id);
      if (gen.url) {
        const filepath = path.join(uploadsDir, `${id}.png`);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      }
      deleted++;
    }
  }

  res.json({ success: true, deleted, message: `${deleted} items deleted` });
});

app.post('/api/bulk/favorite', authenticateToken, (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'IDs array required' });
  }

  const userFavorites = favorites.get(req.userId) || new Set();
  let added = 0;

  for (const id of ids) {
    const gen = generations.get(id);
    if (gen) {
      userFavorites.add(id);
      added++;
    }
  }

  favorites.set(req.userId, userFavorites);
  res.json({ success: true, added, message: `${added} items added to favorites` });
});

// ============ LEGACY ROUTE ALIASES (for test compatibility) ============
// These routes don't use /api prefix to match test expectations

// Auth aliases
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one lowercase letter' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one number' });
    }

    for (const user of users.values()) {
      if (user.email === email) {
        return res.status(409).json({ error: 'User already exists' });
      }
    }

    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      id: userId,
      email,
      password: hashedPassword,
      name,
      credits: 10,
      plan: 'free',
      createdAt: new Date().toISOString()
    };

    users.set(userId, user);
    favorites.set(userId, new Set());

    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        plan: user.plan
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let user = null;
    for (const u of users.values()) {
      if (u.email === email) {
        user = u;
        break;
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        plan: user.plan
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/me', authenticateToken, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    credits: req.user.credits,
    plan: req.user.plan
  });
});

// Generation aliases
app.post('/generate', optionalAuth, async (req, res) => {
  try {
    const { prompt, negativePrompt = '', width = 512, height = 512, stylePreset = 'none' } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Validate dimensions
    const w = parseInt(width);
    const h = parseInt(height);
    
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      return res.status(400).json({ error: 'Invalid dimensions. Width and height must be positive numbers' });
    }
    
    if (w < 128 || h < 128) {
      return res.status(400).json({ error: 'Dimensions too small. Minimum size is 128x128' });
    }
    
    if (w > 2048 || h > 2048) {
      return res.status(400).json({ error: 'Dimensions too large. Maximum size is 2048x2048' });
    }

    const userId = req.userId;
    if (userId) {
      const user = users.get(userId);
      if (!user || user.credits < 1) {
        return res.status(403).json({ error: 'Insufficient credits' });
      }
      user.credits--;
    }

    const generationId = uuidv4();
    const generation = {
      id: generationId,
      status: 'PROCESSING',
      prompt,
      negativePrompt,
      width,
      height,
      stylePreset,
      createdAt: new Date().toISOString(),
      url: null,
      error: null,
      userId: userId || null,
      progress: 0
    };

    generations.set(generationId, generation);

    res.status(200).json({
      id: generationId,
      generationId,
      status: 'PROCESSING',
      message: 'Generation started'
    });

    // Process in background
    try {
      console.log(`[${generationId}] Starting generation...`);

      const hfResponse = await axios.post(
        'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1',
        {
          inputs: prompt,
          parameters: {
            negative_prompt: negativePrompt,
            width: parseInt(width),
            height: parseInt(height),
            num_inference_steps: 25,
            guidance_scale: 7.5
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 300000
        }
      );

      const filename = `${generationId}.png`;
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, hfResponse.data);

      generation.status = 'COMPLETED';
      generation.url = `/uploads/${filename}`;
      generation.progress = 100;
      console.log(`[${generationId}] Success`);

    } catch (error) {
      console.error(`[${generationId}] Failed:`, error.message);

      if (error.response?.status === 503 || error.response?.status === 410) {
        generation.status = 'FAILED';
        generation.error = 'Model is loading. Please try again in 2-3 minutes.';
      } else {
        generation.status = 'FAILED';
        generation.error = error.message || 'Generation failed';
      }
    }

  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/generations', optionalAuth, (req, res) => {
  const userId = req.userId;
  let list = Array.from(generations.values());

  if (userId) {
    list = list.filter(g => g.userId === userId);
  }

  // Handle query params (pagination, filtering)
  const { status, page = 1, limit = 50 } = req.query;
  
  if (status) {
    list = list.filter(g => g.status === status.toUpperCase());
  }

  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Simple pagination
  const start = (parseInt(page) - 1) * parseInt(limit);
  const end = start + parseInt(limit);
  const paginatedList = list.slice(start, end);
  
  res.json(paginatedList);
});

app.get('/generations/:id', (req, res) => {
  const generation = generations.get(req.params.id);
  if (!generation) {
    return res.status(404).json({ error: 'Generation not found' });
  }
  res.json(generation);
});

// Models alias (without /api prefix)
app.get('/models', (req, res) => {
  res.json({
    models: [
      { id: 'stable-diffusion', name: 'Stable Diffusion 2.1', provider: 'HuggingFace', quality: 'High', description: 'General purpose, reliable results' },
      { id: 'sdxl', name: 'SDXL Base', provider: 'HuggingFace', quality: 'Ultra', description: 'Higher quality, more detailed images' }
    ]
  });
});

// Styles endpoints
app.get('/styles', (req, res) => {
  res.json([
    { id: 'none', name: 'Default', icon: '⚡' },
    { id: 'photorealistic', name: 'Photorealistic', icon: '📸' },
    { id: 'digital-art', name: 'Digital Art', icon: '🎨' },
    { id: 'anime', name: 'Anime', icon: '🎌' },
    { id: 'cyberpunk', name: 'Cyberpunk', icon: '🌃' },
    { id: 'fantasy', name: 'Fantasy', icon: '🏰' }
  ]);
});

app.get('/style-presets', (req, res) => {
  res.json([
    { id: 'none', name: 'Default', description: 'Standard generation' },
    { id: 'photorealistic', name: 'Photorealistic', description: 'Realistic photography' },
    { id: 'digital-art', name: 'Digital Art', description: 'ArtStation trending' },
    { id: 'anime', name: 'Anime', description: 'Anime/manga style' },
    { id: 'cyberpunk', name: 'Cyberpunk', description: 'Neon futuristic' },
    { id: 'fantasy', name: 'Fantasy', description: 'Epic magical scenes' }
  ]);
});

// Favorites aliases
app.get('/favorites', authenticateToken, (req, res) => {
  const userFavorites = favorites.get(req.userId) || new Set();
  const favoriteGenerations = Array.from(userFavorites)
    .map(id => generations.get(id))
    .filter(g => g !== undefined)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(favoriteGenerations);
});

app.post('/favorites/:id', authenticateToken, (req, res) => {
  const generationId = req.params.id;
  const generation = generations.get(generationId);

  if (!generation) {
    return res.status(404).json({ error: 'Generation not found' });
  }

  const userFavorites = favorites.get(req.userId) || new Set();
  userFavorites.add(generationId);
  favorites.set(req.userId, userFavorites);

  res.json({ success: true, message: 'Added to favorites' });
});

app.delete('/favorites/:id', authenticateToken, (req, res) => {
  const generationId = req.params.id;
  const userFavorites = favorites.get(req.userId) || new Set();
  userFavorites.delete(generationId);
  favorites.set(req.userId, userFavorites);

  res.json({ success: true, message: 'Removed from favorites' });
});

// ============ ERROR HANDLING ============

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log('==================================');
    console.log('  AI Image Generator v2.0 - Ready');
    console.log('==================================');
    console.log(`Server: http://${HOST}:${PORT}`);
    console.log(`Health: http://${HOST}:${PORT}/api/health`);
    console.log('==================================');
  });
}

module.exports = { app, authenticateToken, optionalAuth, users, generations, favorites, JWT_SECRET, uploadsDir, API_KEY };
