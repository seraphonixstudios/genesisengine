/**
 * AI Image Generator - Enhanced Accessible Server
 * Features: Better error handling, logging, rate limiting, and security
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();

// Configuration
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const API_KEY = process.env.HUGGINGFACE_API_KEY;
const MAX_REQUESTS_PER_MINUTE = parseInt(process.env.RATE_LIMIT) || 10;

// Validate API key
if (!API_KEY) {
  console.error('❌ ERROR: HUGGINGFACE_API_KEY is required');
  process.exit(1);
}

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: MAX_REQUESTS_PER_MINUTE,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/generate', limiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${req.ip}`);
  next();
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
const tokens = new Map();

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    activeGenerations: generations.size
  });
});

// Get available models
app.get('/api/models', (req, res) => {
  res.json([
    { 
      id: 'stable-diffusion', 
      name: 'Stable Diffusion 2.1', 
      quality: 'High',
      description: 'General purpose image generation',
      recommended: true
    },
    { 
      id: 'realistic-vision', 
      name: 'Realistic Vision', 
      quality: 'Ultra',
      description: 'Photorealistic images'
    },
    { 
      id: 'anime', 
      name: 'Anime Diffusion', 
      quality: 'High',
      description: 'Anime and manga style'
    }
  ]);
});

// Get style presets
app.get('/api/style-presets', (req, res) => {
  res.json([
    { id: 'none', name: 'Default', icon: '⚡', description: 'No style modification' },
    { id: 'photorealistic', name: 'Photorealistic', icon: '📸', description: 'Professional photography look' },
    { id: 'digital-art', name: 'Digital Art', icon: '🎨', description: 'Trending on ArtStation' },
    { id: 'anime', name: 'Anime', icon: '🎌', description: 'Anime/manga style' },
    { id: 'cyberpunk', name: 'Cyberpunk', icon: '🌃', description: 'Neon futuristic' },
    { id: 'fantasy', name: 'Fantasy', icon: '🏰', description: 'Magical and epic' },
    { id: 'oil-painting', name: 'Oil Painting', icon: '🖼️', description: 'Classical art style' },
    { id: 'minimalist', name: 'Minimalist', icon: '⬜', description: 'Clean and simple' }
  ]);
});

// Generate image with enhanced error handling
app.post('/api/generate', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { 
      prompt, 
      negativePrompt = '', 
      width = 512, 
      height = 512,
      style = 'none',
      model = 'stable-diffusion'
    } = req.body;

    // Validation
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ 
        error: 'Prompt is required',
        field: 'prompt',
        message: 'Please provide a description of what you want to generate'
      });
    }

    if (prompt.length > 1000) {
      return res.status(400).json({
        error: 'Prompt too long',
        field: 'prompt',
        message: 'Prompt must be less than 1000 characters'
      });
    }

    // Sanitize inputs
    const sanitizedPrompt = prompt.trim().replace(/[<>]/g, '');
    const sanitizedNegative = negativePrompt.trim().replace(/[<>]/g, '');

    const generationId = uuidv4();
    const generation = {
      id: generationId,
      status: 'PROCESSING',
      prompt: sanitizedPrompt,
      negativePrompt: sanitizedNegative,
      width: parseInt(width) || 512,
      height: parseInt(height) || 512,
      style,
      model,
      createdAt: new Date().toISOString(),
      url: null,
      error: null,
      progress: 0
    };

    generations.set(generationId, generation);

    // Return immediately with ID
    res.status(202).json({
      id: generationId,
      status: 'PROCESSING',
      message: 'Generation started',
      estimatedTime: '10-30 seconds',
      checkStatus: `/api/generations/${generationId}`
    });

    // Process in background
    processGeneration(generationId, generation, sanitizedPrompt, sanitizedNegative, width, height)
      .catch(err => console.error(`[${generationId}] Unhandled error:`, err));

  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Something went wrong. Please try again.'
    });
  }
});

// Background processing function
async function processGeneration(id, gen, prompt, negativePrompt, width, height) {
  try {
    console.log(`[${id}] Starting generation...`);
    gen.progress = 10;

    // Enhance prompt based on style
    const enhancedPrompt = enhancePrompt(prompt, gen.style);
    gen.progress = 20;

    const response = await axios.post(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1',
      {
        inputs: enhancedPrompt,
        parameters: {
          negative_prompt: negativePrompt,
          width: Math.min(parseInt(width) || 512, 1024),
          height: Math.min(parseInt(height) || 512, 1024),
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

    gen.progress = 80;

    const filename = `${id}.png`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, response.data);

    gen.status = 'COMPLETED';
    gen.url = `/uploads/${filename}`;
    gen.progress = 100;
    gen.completedAt = new Date().toISOString();
    
    console.log(`[${id}] ✅ Completed in ${Date.now() - new Date(gen.createdAt).getTime()}ms`);

  } catch (error) {
    console.error(`[${id}] ❌ Failed:`, error.message);
    
    gen.status = 'FAILED';
    gen.progress = 0;
    
    if (error.response?.status === 503) {
      gen.error = 'Model is loading. Please retry in 2-3 minutes.';
      gen.retryable = true;
    } else if (error.response?.status === 429) {
      gen.error = 'Rate limit exceeded. Please wait a moment.';
      gen.retryable = true;
    } else if (error.code === 'ECONNABORTED') {
      gen.error = 'Request timed out. Please try again.';
      gen.retryable = true;
    } else {
      gen.error = 'Generation failed. Please try again.';
      gen.retryable = false;
    }
  }
}

// Helper function to enhance prompts
function enhancePrompt(prompt, style) {
  const modifiers = {
    'photorealistic': 'photorealistic, 8k, highly detailed, professional photography, sharp focus',
    'digital-art': 'digital art, trending on artstation, highly detailed, masterpiece',
    'anime': 'anime style, manga art, vibrant colors, detailed illustration',
    'cyberpunk': 'cyberpunk, neon lights, futuristic, high tech, detailed',
    'fantasy': 'fantasy art, magical, epic, highly detailed, masterpiece',
    'oil-painting': 'oil painting, classical art, rich colors, textured, masterpiece',
    'minimalist': 'minimalist, clean, simple, elegant, modern design'
  };

  let enhanced = prompt;
  if (style && style !== 'none' && modifiers[style]) {
    enhanced += `, ${modifiers[style]}`;
  }
  
  return enhanced + ', high quality, detailed';
}

// Get generation status with progress
app.get('/api/generations/:id', (req, res) => {
  const generation = generations.get(req.params.id);
  
  if (!generation) {
    return res.status(404).json({
      error: 'Generation not found',
      message: 'The generation ID does not exist or has expired'
    });
  }
  
  res.json(generation);
});

// List all generations with pagination
app.get('/api/generations', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  
  const allGenerations = Array.from(generations.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedResults = allGenerations.slice(startIndex, endIndex);
  
  res.json({
    generations: paginatedResults,
    pagination: {
      page,
      limit,
      total: allGenerations.length,
      totalPages: Math.ceil(allGenerations.length / limit)
    }
  });
});

// Delete generation
app.delete('/api/generations/:id', (req, res) => {
  const generation = generations.get(req.params.id);
  
  if (!generation) {
    return res.status(404).json({ error: 'Generation not found' });
  }
  
  // Delete file if exists
  if (generation.url) {
    const filename = path.basename(generation.url);
    const filepath = path.join(uploadsDir, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }
  
  generations.delete(req.params.id);
  res.json({ message: 'Generation deleted successfully' });
});

// Cleanup old generations (runs every hour)
setInterval(() => {
  const ONE_HOUR = 60 * 60 * 1000;
  const now = Date.now();
  
  for (const [id, gen] of generations.entries()) {
    if (gen.status === 'FAILED' && (now - new Date(gen.createdAt).getTime()) > ONE_HOUR) {
      generations.delete(id);
      console.log(`[Cleanup] Removed failed generation ${id}`);
    }
  }
}, ONE_HOUR);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /api/health',
      'GET /api/models',
      'GET /api/style-presets',
      'POST /api/generate',
      'GET /api/generations',
      'GET /api/generations/:id',
      'DELETE /api/generations/:id'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║     🤖 AI Image Generator v2.0 - Enhanced      ║');
  console.log('╠════════════════════════════════════════════════╣');
  console.log(`║  🌐 Server: http://${HOST}:${PORT}`);
  console.log(`║  📊 Health:  http://${HOST}:${PORT}/api/health`);
  console.log('║  ✨ Features: Rate limiting, Security, Logging ║');
  console.log('╚════════════════════════════════════════════════╝');
});

module.exports = app;