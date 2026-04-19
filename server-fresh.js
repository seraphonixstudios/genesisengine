const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(compression());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// File upload setup
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Static files
app.use('/uploads', express.static(uploadsDir));

// ==================== HUGGINGFACE GENERATION ====================
async function generateWithHuggingFace(prompt, params) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error('HUGGINGFACE_API_KEY not configured');
  
  const model = params.model || 'RunDiffusion/Juggernaut-XL-v9';
  const width = parseInt(params.width) || 1024;
  const height = parseInt(params.height) || 1024;
  const numInferenceSteps = parseInt(params.steps) || 30;
  const guidanceScale = parseFloat(params.guidanceScale) || 7.5;
  const seed = params.seed ? parseInt(params.seed) : Math.floor(Math.random() * 999999999);
  
  const payload = {
    inputs: prompt,
    parameters: {
      width: width,
      height: height,
      num_inference_steps: numInferenceSteps,
      guidance_scale: guidanceScale,
      seed: seed,
      negative_prompt: params.negativePrompt || 'blurry, low quality, distorted'
    }
  };
  
  const response = await axios.post(
    `https://api-inference.huggingface.co/models/${model}`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer',
      timeout: 120000
    }
  );
  
  const filename = `${uuidv4()}_generated.png`;
  const imagePath = path.join(uploadsDir, filename);
  fs.writeFileSync(imagePath, Buffer.from(response.data));
  
  return {
    url: `/uploads/${filename}`,
    filename,
    provider: 'huggingface',
    model: model,
    prompt,
    seed
  };
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

// ==================== API ENDPOINTS ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    features: ['text-to-image', 'upscaling', 'variations', 'gallery', 'prompt-enhancement', 'open-source']
  });
});

// Get providers (FREE open source only)
app.get('/api/generate/providers', (req, res) => {
  res.json({
    providers: [
      { 
        id: 'huggingface', 
        name: 'FREE Open Source Models', 
        description: 'Midjourney-quality art - 100% FREE',
        models: [
          { id: 'RunDiffusion/Juggernaut-XL-v9', name: 'Juggernaut XL v9', quality: 'highest', style: 'Best overall - prompt adherence king' },
          { id: 'SG161222/RealVisXL_V4.0', name: 'RealVisXL V4', quality: 'highest', style: 'Photorealistic - best for photos' },
          { id: 'Lykon/dreamshaper-xl-1-0', name: 'DreamShaper XL', quality: 'high', style: 'Artistic & creative' },
          { id: 'playgroundai/playground-v2.5-1024px-aesthetic', name: 'Playground v2.5', quality: 'high', style: 'Aesthetic focused' },
          { id: 'stabilityai/stable-diffusion-xl-base-1.0', name: 'SDXL Base', quality: 'high', style: 'Balanced quality & speed' }
        ]
      }
    ]
  });
});

// Enhance prompt
app.post('/api/enhance-prompt', (req, res) => {
  try {
    const { prompt, style = '', stylePreset = 'none' } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });
    
    const enhanced = enhancePrompt(prompt, style, stylePreset);
    
    res.json({
      originalPrompt: prompt,
      enhancedPrompt: enhanced.prompt,
      negativePrompt: enhanced.negativePrompt
    });
  } catch (error) {
    console.error('Enhancement error:', error);
    res.status(500).json({ error: error.message || 'Enhancement failed' });
  }
});

// Generate image
app.post('/api/generate', async (req, res) => {
  try {
    const { 
      prompt, 
      model = 'RunDiffusion/Juggernaut-XL-v9',
      negativePrompt = '', 
      seed,
      steps = 30, 
      width = 1024, 
      height = 1024, 
      guidanceScale = 7.5, 
      style = '', 
      stylePreset = 'none', 
      enhance = true 
    } = req.body;
    
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });
    
    let finalPrompt = prompt;
    let negative = negativePrompt;
    
    if (enhance) {
      const enhanced = enhancePrompt(prompt, style, stylePreset);
      finalPrompt = enhanced.prompt;
      negative = negative || enhanced.negativePrompt;
    }
    
    const result = await generateWithHuggingFace(finalPrompt, { 
      model, width, height, steps, guidanceScale, seed, negativePrompt: negative 
    });
    
    res.json(result);
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: error.message || 'Generation failed' });
  }
});

// Edit endpoints
app.post('/api/edit/upscale', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image required' });
    res.json({ 
      success: true, 
      message: 'Upscaled (demo mode)',
      url: '/uploads/' + req.file.filename
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/edit/inpaint', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image required' });
    res.json({ 
      success: true, 
      message: 'Inpainted (demo mode)',
      url: '/uploads/' + req.file.filename
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/edit/outpaint', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image required' });
    res.json({ 
      success: true, 
      message: 'Outpainted (demo mode)',
      url: '/uploads/' + req.file.filename
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/edit/variations', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image required' });
    res.json({ 
      success: true, 
      message: 'Variations generated (demo mode)',
      url: '/uploads/' + req.file.filename
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Gallery
app.get('/api/gallery', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir)
      .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
      .map(f => {
        const stats = fs.statSync(path.join(uploadsDir, f));
        return {
          filename: f,
          url: '/uploads/' + f,
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

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log('🚀 AI Image Generator Server v3.0 - FREE OPEN SOURCE');
  console.log(`📡 Running on port ${PORT}`);
  console.log('🎨 Models: JuggernautXL, RealVisXL, DreamShaperXL, Playground v2.5, SDXL');
  console.log('💰 Cost: 100% FREE using Hugging Face');
});
