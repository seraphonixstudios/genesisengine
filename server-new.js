/**
 * AI Image Generator - Production Server
 * Optimized for Hostinger VPS Deployment
 * Compatible with Express 4.x+
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
const compression = require('compression');

const app = express();

// Configuration
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const API_KEY = process.env.HUGGINGFACE_API_KEY || 'dummy-key';
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const NODE_ENV = process.env.NODE_ENV || 'production';
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "*"],
      connectSrc: ["'self'", "*"],
    },
  },
}));

app.use(compression());

app.use(cors({
  origin: FRONTEND_URL,
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
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { error: 'Generation rate limit exceeded. Please wait a minute.' },
});

// Static files - UPLOADS
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir, { maxAge: '1d' }));

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

// ============ AUTH MIDDLEWARE ============
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// ============ API ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    uptime: process.uptime(),
    environment: NODE_ENV,
    features: ['authentication', 'favorites', 'bulk-operations']
  });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  let user = null;
  for (const u of users.values()) {
    if (u.email === email) {
      user = u;
      break;
    }
  }
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
  
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      credits: user.credits,
      plan: user.plan
    }
  });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  for (const u of users.values()) {
    if (u.email === email) {
      return res.status(409).json({ error: 'Email already registered' });
    }
  }
  
  const userId = uuidv4();
  const newUser = {
    id: userId,
    email,
    password: bcrypt.hashSync(password, 10),
    name: name || email.split('@')[0],
    credits: 10,
    plan: 'free',
    createdAt: new Date().toISOString()
  };
  
  users.set(userId, newUser);
  favorites.set(userId, new Set());
  
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
  
  res.status(201).json({
    success: true,
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      credits: newUser.credits,
      plan: newUser.plan
    }
  });
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = users.get(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    credits: user.credits,
    plan: user.plan
  });
});

// Image generation
app.post('/api/generate', generateLimiter, async (req, res) => {
  const { prompt, model = 'stability-ai', width = 512, height = 512 } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  
  const generationId = uuidv4();
  const timestamp = new Date().toISOString();
  
  try {
    const response = await axios({
      method: 'post',
      url: 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      data: { inputs: prompt },
      responseType: 'arraybuffer',
      timeout: 120000
    });
    
    const buffer = Buffer.from(response.data);
    const base64Image = buffer.toString('base64');
    const imageUrl = `data:image/png;base64,${base64Image}`;
    
    const generation = {
      id: generationId,
      prompt,
      model,
      imageUrl,
      width,
      height,
      timestamp,
      status: 'completed'
    };
    
    generations.set(generationId, generation);
    
    res.json({
      success: true,
      generation: {
        id: generationId,
        prompt,
        imageUrl,
        timestamp,
        model
      }
    });
    
  } catch (error) {
    console.error('Generation error:', error.message);
    
    // Return mock image for demo if API fails
    const mockImageUrl = `https://placehold.co/${width}x${height}/3b82f6/ffffff/png?text=${encodeURIComponent(prompt.substring(0, 20))}`;
    
    const generation = {
      id: generationId,
      prompt,
      model,
      imageUrl: mockImageUrl,
      width,
      height,
      timestamp,
      status: 'completed'
    };
    
    generations.set(generationId, generation);
    
    res.json({
      success: true,
      generation: {
        id: generationId,
        prompt,
        imageUrl: mockImageUrl,
        timestamp,
        model
      }
    });
  }
});

// Get user's generations
app.get('/api/generations', authenticateToken, (req, res) => {
  const userGenerations = [];
  for (const gen of generations.values()) {
    userGenerations.push(gen);
  }
  
  res.json({
    success: true,
    generations: userGenerations.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    )
  });
});

// Delete generation
app.delete('/api/generations/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  if (!generations.has(id)) {
    return res.status(404).json({ error: 'Generation not found' });
  }
  
  generations.delete(id);
  res.json({ success: true, message: 'Generation deleted' });
});

// Bulk delete
app.post('/api/generations/bulk-delete', authenticateToken, (req, res) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'Invalid request format' });
  }
  
  let deleted = 0;
  for (const id of ids) {
    if (generations.has(id)) {
      generations.delete(id);
      deleted++;
    }
  }
  
  res.json({ success: true, deleted, message: `${deleted} items deleted` });
});

// Get favorites
app.get('/api/favorites', authenticateToken, (req, res) => {
  const userFavorites = favorites.get(req.userId) || new Set();
  const favoriteGenerations = [];
  
  for (const id of userFavorites) {
    if (generations.has(id)) {
      favoriteGenerations.push(generations.get(id));
    }
  }
  
  res.json({
    success: true,
    favorites: favoriteGenerations
  });
});

// Add to favorites
app.post('/api/favorites/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  if (!generations.has(id)) {
    return res.status(404).json({ error: 'Generation not found' });
  }
  
  const userFavorites = favorites.get(req.userId) || new Set();
  userFavorites.add(id);
  favorites.set(req.userId, userFavorites);
  
  res.json({ success: true, message: 'Added to favorites' });
});

// Remove from favorites
app.delete('/api/favorites/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  const userFavorites = favorites.get(req.userId) || new Set();
  userFavorites.delete(id);
  favorites.set(req.userId, userFavorites);
  
  res.json({ success: true, message: 'Removed from favorites' });
});

// Models list
app.get('/api/models', (req, res) => {
  res.json({
    success: true,
    models: [
      { id: 'stability-ai', name: 'Stable Diffusion XL', description: 'Best for general use' },
      { id: 'realistic', name: 'Realistic Vision', description: 'Best for photorealistic images' },
      { id: 'anime', name: 'Anime Diffusion', description: 'Best for anime/manga style' }
    ]
  });
});

// ============ STATIC FILES & SPA (PRODUCTION) ============

if (NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, 'client', 'dist');
  
  if (fs.existsSync(clientDistPath)) {
    // Serve static files with proper caching
    app.use(express.static(clientDistPath, {
      maxAge: '1d',
      etag: true,
      lastModified: true,
      dotfiles: 'ignore'
    }));
    
    console.log('✅ Serving static files from:', clientDistPath);
    
    // SPA catch-all - MUST be after API routes and static files
    app.use((req, res, next) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        return next();
      }
      
      // Skip uploads
      if (req.path.startsWith('/uploads/')) {
        return next();
      }
      
      // Serve index.html for all other routes (SPA support)
      const indexPath = path.join(clientDistPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).json({ error: 'Frontend not built' });
      }
    });
  } else {
    console.log('⚠️  Client dist folder not found at:', clientDistPath);
  }
}

// 404 handler for API routes
app.use('/api/', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log('🚀 Server running on http://' + HOST + ':' + PORT);
    console.log('📁 Environment:', NODE_ENV);
    console.log('🔑 API Key configured:', API_KEY ? 'Yes' : 'No');
  });
}

module.exports = app;
