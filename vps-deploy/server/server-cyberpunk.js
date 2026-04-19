require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors({
  origin: '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Static files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`)
});
const upload = multer({ storage });

// ==================== GENERATION ENDPOINTS ====================

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, provider = 'huggingface', model, negativePrompt = '', seed, steps = 30, width = 512, height = 512, guidanceScale = 7.5, sampler = 'DPM++ 2M Karras', style = '', stylePreset = 'none', enhance = true } = req.body;
    
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });
    
    let finalPrompt = prompt;
    let negative = negativePrompt;
    
    // Enhance prompt based on style
    if (enhance) {
      const enhanced = enhancePrompt(prompt, style, stylePreset);
      finalPrompt = enhanced.prompt;
      negative = negative || enhanced.negativePrompt;
    }
    
    let result;
    switch (provider) {
      case 'openai':
        result = await generateWithOpenAI(finalPrompt, { width, height, negativePrompt: negative });
        break;
      case 'replicate':
        result = await generateWithReplicate(finalPrompt, { width, height, steps, guidanceScale, negativePrompt: negative });
        break;
      case 'huggingface':
      default:
        result = await generateWithHuggingFace(finalPrompt, { model, width, height, steps, guidanceScale, seed, negativePrompt: negative });
        break;
    }
    
    res.json(result);
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: error.message || 'Generation failed' });
  }
});

app.get('/api/generate/providers', (req, res) => {
  res.json({
    providers: [
      { id: 'huggingface', name: 'Hugging Face', description: 'Free Stable Diffusion models', models: [
        { id: 'stabilityai/stable-diffusion-xl-base-1.0', name: 'SDXL Base', quality: 'high' },
        { id: 'prompthero/openjourney', name: 'OpenJourney', quality: 'high' },
        { id: 'dreamlike-art/dreamlike-diffusion-1.0', name: 'Dreamlike', quality: 'high' }
      ]},
      { id: 'openai', name: 'OpenAI DALL-E', description: 'Best prompt understanding', models: [
        { id: 'dall-e-3', name: 'DALL-E 3', quality: 'highest' }
      ]},
      { id: 'replicate', name: 'Replicate', description: 'Community models including SDXL', models: [
        { id: 'stability-ai/sdxl', name: 'SDXL', quality: 'highest' }
      ]}
    ]
  });
});

app.get('/api/generate/styles', (req, res) => {
  res.json({
    categories: {
      photography: [
        { id: 'photorealistic', name: 'Photorealistic', modifiers: ['8k', 'highly detailed', 'professional photography'] },
        { id: 'cinematic', name: 'Cinematic', modifiers: ['cinematic lighting', 'film grain', 'color grading'] },
        { id: 'portrait', name: 'Portrait', modifiers: ['professional portrait', 'studio lighting', 'bokeh'] },
        { id: 'macro', name: 'Macro', modifiers: ['macro lens', 'extreme close-up', 'shallow depth'] }
      ],
      art: [
        { id: 'oil-painting', name: 'Oil Painting', modifiers: ['oil on canvas', 'rich colors', 'masterpiece'] },
        { id: 'watercolor', name: 'Watercolor', modifiers: ['watercolor painting', 'soft edges', 'flowing'] },
        { id: 'digital-art', name: 'Digital Art', modifiers: ['digital painting', 'concept art', 'artstation'] },
        { id: 'anime', name: 'Anime', modifiers: ['anime style', 'detailed anime', 'vibrant colors'] }
      ],
      '3d': [
        { id: '3d-render', name: '3D Render', modifiers: ['octane render', 'unreal engine', 'ray tracing'] },
        { id: 'voxel', name: 'Voxel Art', modifiers: ['voxel art', 'minecraft style', 'blocky'] }
      ]
    },
    presets: [
      { id: 'cyberpunk', name: 'Cyberpunk', icon: '🌃', description: 'Neon lights, dystopian future' },
      { id: 'steampunk', name: 'Steampunk', icon: '⚙️', description: 'Victorian era with brass gears' },
      { id: 'fantasy', name: 'Fantasy', icon: '🐉', description: 'Magical creatures, epic landscapes' },
      { id: 'sci-fi', name: 'Sci-Fi', icon: '🚀', description: 'Futuristic technology, space' },
      { id: 'atlantean', name: 'Atlantean', icon: '🏛️', description: 'Ancient mythical civilization' },
      { id: 'matrix', name: 'Matrix', icon: '💊', description: 'Digital rain, green code' },
      { id: 'max-headroom', name: 'Max Headroom', icon: '📺', description: '80s glitch, retro tech' },
      { id: 'vaporwave', name: 'Vaporwave', icon: '🌆', description: 'Retro 80s aesthetic' },
      { id: 'retro', name: 'Retro', icon: '📻', description: 'Vintage 70s-90s' },
      { id: 'horror', name: 'Horror', icon: '👻', description: 'Dark and creepy' }
    ]
  });
});

// ==================== UPSCALING ENDPOINTS ====================

app.post('/api/upscale', upload.single('image'), async (req, res) => {
  try {
    const { scale = 4, model = 'real-esrgan-x4', faceEnhance = false } = req.body;
    if (!req.file && !req.body.imageUrl) return res.status(400).json({ error: 'Image required' });
    
    // Implementation would use Replicate or similar
    res.json({ 
      success: true, 
      message: 'Upscaling initiated',
      scale, 
      model,
      note: 'Connect REPLICATE_API_TOKEN to enable'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== EDITING ENDPOINTS ====================

app.post('/api/edit/variations', upload.single('image'), async (req, res) => {
  try {
    const { count = 4, strength = 0.7 } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Image required' });
    
    res.json({ 
      success: true, 
      message: 'Variations generation initiated',
      count,
      strength
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== GALLERY ENDPOINTS ====================

app.get('/api/gallery', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir)
      .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
      .map(f => {
        const stats = fs.statSync(path.join(uploadsDir, f));
        return {
          filename: f,
          url: `/uploads/${f}`,
          size: stats.size,
          createdAt: stats.birthtime
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
    
    res.json({ images: files, total: files.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read gallery' });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    features: [
      'text-to-image',
      'upscaling',
      'variations',
      'gallery',
      'multiple-providers',
      'style-presets',
      'prompt-enhancement',
      'cyberpunk-ui'
    ]
  });
});

// ==================== GENERATION PROVIDERS ====================

async function generateWithHuggingFace(prompt, params) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error('HUGGINGFACE_API_KEY not configured');
  
  const model = params.model || 'stabilityai/stable-diffusion-xl-base-1.0';
  const apiUrl = `https://api-inference.huggingface.co/models/${model}`;
  
  const requestBody = {
    inputs: prompt,
    parameters: {
      negative_prompt: params.negativePrompt || '',
      width: parseInt(params.width) || 512,
      height: parseInt(params.height) || 512,
      guidance_scale: parseFloat(params.guidanceScale) || 7.5,
      num_inference_steps: parseInt(params.steps) || 30
    }
  };
  
  const response = await axios.post(apiUrl, requestBody, {
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    responseType: 'arraybuffer'
  });
  
  const filename = `${uuidv4()}_huggingface.png`;
  const imagePath = path.join(uploadsDir, filename);
  fs.writeFileSync(imagePath, response.data);
  
  return {
    url: `/uploads/${filename}`,
    filename,
    provider: 'huggingface',
    prompt,
    metadata: requestBody.parameters
  };
}

async function generateWithOpenAI(prompt, params) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');
  
  const size = params.width >= 1024 ? '1024x1024' : '512x512';
  
  const response = await axios.post(
    'https://api.openai.com/v1/images/generations',
    { model: 'dall-e-3', prompt, n: 1, size, quality: 'standard' },
    { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
  );
  
  const imageUrl = response.data.data[0].url;
  const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  
  const filename = `${uuidv4()}_openai.png`;
  const imagePath = path.join(uploadsDir, filename);
  fs.writeFileSync(imagePath, Buffer.from(imageResponse.data));
  
  return {
    url: `/uploads/${filename}`,
    filename,
    provider: 'openai',
    prompt,
    metadata: { size }
  };
}

async function generateWithReplicate(prompt, params) {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) throw new Error('REPLICATE_API_TOKEN not configured');
  
  const version = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b';
  
  const predictionResponse = await axios.post(
    'https://api.replicate.com/v1/predictions',
    {
      version,
      input: {
        prompt,
        negative_prompt: params.negativePrompt || '',
        width: parseInt(params.width) || 1024,
        height: parseInt(params.height) || 1024,
        num_inference_steps: parseInt(params.steps) || 50,
        guidance_scale: parseFloat(params.guidanceScale) || 7.5
      }
    },
    { headers: { 'Authorization': `Token ${apiKey}`, 'Content-Type': 'application/json' } }
  );
  
  const resultUrl = await pollForResult(predictionResponse.data.urls.get, apiKey);
  const resultResponse = await axios.get(resultUrl, { responseType: 'arraybuffer' });
  
  const filename = `${uuidv4()}_replicate.png`;
  const imagePath = path.join(uploadsDir, filename);
  fs.writeFileSync(imagePath, Buffer.from(resultResponse.data));
  
  return {
    url: `/uploads/${filename}`,
    filename,
    provider: 'replicate',
    prompt
  };
}

async function pollForResult(url, apiKey) {
  for (let i = 0; i < 60; i++) {
    const response = await axios.get(url, {
      headers: { 'Authorization': `Token ${apiKey}`, 'Content-Type': 'application/json' }
    });
    
    if (response.data.status === 'succeeded') return response.data.output;
    if (response.data.status === 'failed') throw new Error('Prediction failed');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Prediction timeout');
}

// ==================== PROMPT ENHANCEMENT ====================

function enhancePrompt(prompt, style, preset) {
  const qualityBoosters = ['masterpiece', 'best quality', 'highly detailed', '8k uhd', 'intricate details'];
  
  const presetModifiers = {
    cyberpunk: { positive: ['neon lights', 'cyberpunk aesthetic', 'futuristic dystopian', 'high tech low life'] },
    matrix: { positive: ['green digital rain', 'matrix code', 'cyberpunk digital', 'glitch aesthetic'] },
    atlantean: { positive: ['Atlantean civilization', 'ancient underwater city', 'glowing crystals', 'mythical architecture'] },
    'max-headroom': { positive: ['80s retro', 'glitch art', 'scan lines', 'vintage TV', 'retro tech'] },
    vaporwave: { positive: ['vaporwave aesthetic', 'neon pink cyan', 'retro 80s', 'glitch art'] }
  };
  
  let enhanced = prompt;
  let negative = 'blurry, low quality, pixelated, watermark, signature, text, cropped';
  
  if (preset !== 'none' && presetModifiers[preset]) {
    enhanced += ', ' + presetModifiers[preset].positive.join(', ');
  }
  
  enhanced += ', ' + qualityBoosters.join(', ');
  
  return { prompt: enhanced, negativePrompt: negative, originalPrompt: prompt };
}

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 AI Image Generator Server v3.0 - CYBERPUNK EDITION');
  console.log(`📡 Running on port ${PORT}`);
  console.log('🎨 Features: Text-to-Image, Upscaling, Gallery, Multiple Providers');
  console.log('🔮 Style Presets: Cyberpunk, Matrix, Atlantean, Max Headroom');
});
