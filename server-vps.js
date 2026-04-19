/**
 * AI Image Generator - VPS Production Server
 * Simplified, reliable version for VPS deployment
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Configuration
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const API_KEY = process.env.HUGGINGFACE_API_KEY;

// Validate API key
if (!API_KEY) {
  console.error('❌ ERROR: HUGGINGFACE_API_KEY is required');
  console.error('Set it in your .env file');
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Data stores
const generations = new Map();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Generate image
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, negativePrompt = '', width = 512, height = 512 } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const generationId = uuidv4();
    const generation = {
      id: generationId,
      status: 'PROCESSING',
      prompt,
      negativePrompt,
      width,
      height,
      createdAt: new Date().toISOString(),
      url: null,
      error: null
    };

    generations.set(generationId, generation);

    // Return immediately with ID
    res.json({ 
      id: generationId, 
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
          timeout: 300000 // 5 minutes
        }
      );

      const filename = `${generationId}.png`;
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, response.data);

      generation.status = 'COMPLETED';
      generation.url = `/uploads/${filename}`;
      console.log(`[${generationId}] ✅ Success`);

    } catch (error) {
      console.error(`[${generationId}] ❌ Failed:`, error.message);
      
      // Check if it's a model loading error
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

// Get generation status
app.get('/api/generations/:id', (req, res) => {
  const generation = generations.get(req.params.id);
  if (!generation) {
    return res.status(404).json({ error: 'Generation not found' });
  }
  res.json(generation);
});

// List all generations
app.get('/api/generations', (req, res) => {
  const list = Array.from(generations.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

// Get available models
app.get('/api/models', (req, res) => {
  res.json([
    { value: 'stable-diffusion', label: 'Stable Diffusion 2.1', quality: 'High' }
  ]);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   AI Image Generator - VPS Ready       ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║  Server: http://${HOST}:${PORT}`);
  console.log('╚════════════════════════════════════════╝');
});

module.exports = app;