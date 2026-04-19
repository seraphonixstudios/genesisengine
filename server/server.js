const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// ==========================================
// IN-MEMORY DATABASE (For standalone mode)
// ==========================================

class MemoryDatabase {
  constructor() {
    this.users = new Map();
    this.generations = new Map();
    this.gallery = new Map();
    this.counters = {
      users: 0,
      generations: 0
    };
    
    // Create demo user
    this.createDemoUser();
  }
  
  async createDemoUser() {
    const hashedPassword = await bcrypt.hash('demo123', 12);
    const demoUser = {
      id: 'demo-user-id',
      email: 'demo@example.com',
      password: hashedPassword,
      name: 'Demo User',
      credits: 1000,
      plan: 'pro',
      role: 'user',
      createdAt: new Date().toISOString()
    };
    this.users.set(demoUser.id, demoUser);
    this.users.set(demoUser.email, demoUser); // Index by email
  }
  
  async createUser(data) {
    const id = uuidv4();
    const user = {
      id,
      ...data,
      credits: 100,
      plan: 'free',
      role: 'user',
      createdAt: new Date().toISOString()
    };
    this.users.set(id, user);
    this.users.set(user.email, user);
    this.counters.users++;
    return user;
  }
  
  async findUserByEmail(email) {
    return this.users.get(email) || null;
  }
  
  async findUserById(id) {
    return this.users.get(id) || null;
  }
  
  async updateUser(id, data) {
    const user = this.users.get(id);
    if (!user) return null;
    const updated = { ...user, ...data, updatedAt: new Date().toISOString() };
    this.users.set(id, updated);
    this.users.set(updated.email, updated);
    return updated;
  }
  
  async createGeneration(data) {
    const id = uuidv4();
    const generation = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.generations.set(id, generation);
    this.counters.generations++;
    return generation;
  }
  
  async findGenerationById(id) {
    return this.generations.get(id) || null;
  }
  
  async findGenerationsByUser(userId, limit = 50) {
    const results = [];
    for (const [id, gen] of this.generations) {
      if (gen.userId === userId) {
        results.push(gen);
      }
    }
    return results
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }
  
  async updateGeneration(id, data) {
    const gen = this.generations.get(id);
    if (!gen) return null;
    const updated = { ...gen, ...data, updatedAt: new Date().toISOString() };
    this.generations.set(id, updated);
    return updated;
  }
}

const db = new MemoryDatabase();

// ==========================================
// MIDDLEWARE
// ==========================================

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Generation limit: max 10 per minute' },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload setup
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const user = await db.findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Optional authentication (for public endpoints)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await db.findUserById(decoded.userId);
      if (user) {
        req.user = {
          userId: user.id,
          email: user.email,
          role: user.role
        };
      }
    }
    next();
  } catch {
    next();
  }
};

// ==========================================
// WEBSOCKET HANDLING
// ==========================================

const activeGenerations = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('subscribe', (jobId) => {
    socket.join(`job-${jobId}`);
    console.log(`Socket ${socket.id} subscribed to job ${jobId}`);
  });
  
  socket.on('unsubscribe', (jobId) => {
    socket.leave(`job-${jobId}`);
    console.log(`Socket ${socket.id} unsubscribed from job ${jobId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

function emitJobProgress(jobId, progress, status, data = {}) {
  io.to(`job-${jobId}`).emit('generation-progress', {
    jobId,
    progress,
    status,
    ...data,
    timestamp: new Date().toISOString()
  });
}

// ==========================================
// ROUTES
// ==========================================

// Health check
app.get('/health', async (req, res) => {
  const status = {
    name: 'Genesis Engine',
    tagline: 'In the beginning, there was the prompt',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '5.0.0',
    features: [
      'text-to-image',
      'image-to-image',
      'inpainting',
      'outpainting',
      'upscaling',
      'controlnet',
      'batch-generation',
      'style-transfer',
      'face-enhancement',
      'background-removal',
      'prompt-enhancement'
    ],
    providers: [
      'huggingface',
      'openai',
      'stability',
      'replicate'
    ],
    freeTier: {
      dailyGenerations: 20,
      resetTime: '00:00 UTC'
    },
    services: {
      database: 'memory-store',
      websocket: io.engine.clientsCount + ' clients connected'
    }
  };
  
  res.json(status);
});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

app.post('/api/auth/register', apiLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Email, password, and name are required' 
      });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters' 
      });
    }

    // Check if user exists
    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.createUser({
      email,
      password: hashedPassword,
      name
    });

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        plan: user.plan
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', apiLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await db.findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        plan: user.plan
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/refresh', apiLimiter, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'your-secret-key');
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }
    
    const user = await db.findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      accessToken
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

app.get('/api/me', authenticate, async (req, res) => {
  try {
    const user = await db.findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      credits: user.credits,
      plan: user.plan,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ==========================================
// GENERATION ROUTES
// ==========================================

const generationRoutes = require('./routes/generation');
app.use('/api/generate', apiLimiter, optionalAuth, generationRoutes);

// Legacy routes for backward compatibility
app.use('/api/txt2img', apiLimiter, optionalAuth, generationRoutes);
app.use('/api/img2img', apiLimiter, optionalAuth, generationRoutes);

// ==========================================
// USER GENERATIONS & GALLERY
// ==========================================

app.get('/api/generations', authenticate, async (req, res) => {
  try {
    const generations = await db.findGenerationsByUser(req.user.userId, 50);
    res.json({
      success: true,
      count: generations.length,
      generations
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch generations' });
  }
});

app.get('/api/generations/:id', authenticate, async (req, res) => {
  try {
    const generation = await db.findGenerationById(req.params.id);
    if (!generation || generation.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Generation not found' });
    }
    
    res.json({
      success: true,
      generation
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch generation' });
  }
});

// ==========================================
// PUBLIC GALLERY
// ==========================================

app.get('/api/gallery', async (req, res) => {
  try {
    const { page = 1, limit = 20, style, sort = 'newest' } = req.query;
    
    // Get all completed generations
    let generations = [];
    for (const [id, gen] of db.generations) {
      if (gen.status === 'COMPLETED' && gen.isPublic !== false) {
        generations.push({
          id: gen.id,
          url: gen.url,
          prompt: gen.prompt,
          style: gen.stylePreset,
          createdAt: gen.createdAt,
          width: gen.width,
          height: gen.height,
          likes: gen.likes || 0
        });
      }
    }
    
    // Filter by style if provided
    if (style && style !== 'all') {
      generations = generations.filter(g => g.style === style);
    }
    
    // Sort
    if (sort === 'newest') {
      generations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === 'popular') {
      generations.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }
    
    // Paginate
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedResults = generations.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      gallery: paginatedResults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: generations.length,
        totalPages: Math.ceil(generations.length / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gallery' });
  }
});

// ==========================================
// STATIC FILES
// ==========================================

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/outputs', express.static(path.join(__dirname, 'outputs')));

// Serve client build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ==========================================
// START SERVER
// ==========================================

server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║              🌟 GENESIS ENGINE v5.0 🌟                       ║');
  console.log('║         "In the beginning, there was the prompt"             ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║     Created by Seraphonix Studios • Powered by Sovereign     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('              🎨 The Seven Modes of Creation 🎨');
  console.log('');
  console.log('  1. ✨ Text-to-Image    - The Word becomes Vision');
  console.log('  2. 🔄 Image-to-Image   - Transformation & Metamorphosis');
  console.log('  3. ✏️ Inpainting       - Healing & Restoration');
  console.log('  4. ⬜ Outpainting      - Expansion Beyond Boundaries');
  console.log('  5. 🔍 Upscaling        - Magnification of Detail');
  console.log('  6. 🎮 ControlNet       - Precision & Control');
  console.log('  7. 📦 Batch            - Multiplication of Creations');
  console.log('');
  console.log(`🚀 Genesis Engine running on http://localhost:${PORT}`);
  console.log(`🎨 Creation API: http://localhost:${PORT}/api/generate`);
  console.log(`💫 Health Check: http://localhost:${PORT}/health`);
  console.log('');
  console.log('💰 FREE TIER: 20 Generations per Day (Resets at Midnight UTC)');
  console.log('');
  console.log('🤖 Four Pillars of AI Power:');
  console.log('   • HuggingFace (Free Community Models)');
  console.log('   • Replicate (Cloud GPU Power)');
  console.log('   • Stability AI (Commercial Grade)');
  console.log('   • OpenAI DALL-E (Premium Quality)');
  console.log('');
  console.log('👤 Demo Account: demo@example.com / demo123');
  console.log('🏛️  Created by Seraphonix Studios');
  console.log('👑 Powered by Sovereign Technology');
  console.log('📚 Docs: https://docs.genesis-engine.com');
  console.log('⭐ Star us on GitHub: https://github.com/yourusername/genesis-engine');
  console.log('');
});

module.exports = { app, server, io, db };
