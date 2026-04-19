const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { createCanvas } = require('canvas');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
const generationsDir = path.join(__dirname, 'generations');

// Create directories
[uploadsDir, generationsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`)
});
const upload = multer({ storage });

// In-memory storage for generations
const generations = new Map();

// Generate placeholder image based on prompt and parameters
async function generatePlaceholderImage(prompt, params) {
  const width = params.width || 512;
  const height = params.height || 512;
  const seed = params.seed || Math.floor(Math.random() * 10000);
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Use seed to generate consistent random colors
  const rng = seededRandom(seed);
  
  // Create gradient background based on style
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  const hue1 = Math.floor(rng() * 360);
  const hue2 = (hue1 + 60 + Math.floor(rng() * 120)) % 360;
  
  gradient.addColorStop(0, `hsla(${hue1}, 70%, 20%, 1)`);
  gradient.addColorStop(0.5, `hsla(${(hue1 + hue2) / 2}, 60%, 30%, 1)`);
  gradient.addColorStop(1, `hsla(${hue2}, 70%, 20%, 1)`);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Add noise texture
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (rng() - 0.5) * 20;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);
  
  // Add geometric patterns based on prompt
  const patternCount = 5 + Math.floor(rng() * 10);
  for (let i = 0; i < patternCount; i++) {
    ctx.beginPath();
    const x = rng() * width;
    const y = rng() * height;
    const radius = 20 + rng() * 100;
    
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${Math.floor(rng() * 360)}, 50%, 50%, ${0.1 + rng() * 0.2})`;
    ctx.fill();
  }
  
  // Add flowing lines
  ctx.strokeStyle = `hsla(${Math.floor(rng() * 360)}, 80%, 60%, 0.3)`;
  ctx.lineWidth = 2;
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    let x = rng() * width;
    let y = rng() * height;
    ctx.moveTo(x, y);
    
    for (let j = 0; j < 5; j++) {
      x += (rng() - 0.5) * 200;
      y += (rng() - 0.5) * 200;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  
  // Add text overlay with prompt preview
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  
  const words = prompt.split(' ').slice(0, 3).join(' ');
  ctx.fillText(words, width / 2, height / 2);
  
  ctx.font = '16px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText(`${width}x${height} | Seed: ${seed}`, width / 2, height / 2 + 30);
  
  // Add border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, width, height);
  
  return canvas.toBuffer('image/png');
}

// Seeded random number generator
function seededRandom(seed) {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// Generate endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { 
      prompt, 
      model = 'stable-diffusion',
      negativePrompt = '',
      seed = Math.floor(Math.random() * 999999999),
      steps = 30,
      width = 512,
      height = 512,
      guidanceScale = 7.5,
      style = '',
      stylePreset = 'none',
      enhancePrompt = true
    } = req.body;

    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const generationId = uuidv4();
    const filename = `${generationId}.png`;
    const imagePath = path.join(generationsDir, filename);
    
    // Store generation metadata
    const generation = {
      id: generationId,
      status: 'PROCESSING',
      prompt,
      negativePrompt,
      model,
      style,
      stylePreset,
      width,
      height,
      seed,
      steps,
      guidanceScale,
      enhancePrompt,
      createdAt: new Date().toISOString(),
      url: null,
      thumbnailUrl: null
    };
    
    generations.set(generationId, generation);
    
    // Generate image asynchronously
    setTimeout(async () => {
      try {
        const imageBuffer = await generatePlaceholderImage(prompt, { width, height, seed });
        fs.writeFileSync(imagePath, imageBuffer);
        
        generation.status = 'COMPLETED';
        generation.url = `/api/images/generated/${filename}`;
        generation.thumbnailUrl = generation.url;
        generations.set(generationId, generation);
        
        console.log(`Generated image: ${generationId}`);
      } catch (err) {
        console.error('Generation failed:', err);
        generation.status = 'FAILED';
        generation.error = err.message;
        generations.set(generationId, generation);
      }
    }, 2000 + Math.random() * 3000); // 2-5 second delay
    
    res.json({ 
      generationId,
      status: 'PROCESSING',
      message: 'Generation started'
    });

  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: 'Failed to start generation' });
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

// Delete generation
app.delete('/api/generations/:id', (req, res) => {
  const generation = generations.get(req.params.id);
  if (!generation) {
    return res.status(404).json({ error: 'Generation not found' });
  }
  
  // Delete file if exists
  if (generation.url) {
    const filename = path.basename(generation.url);
    const filepath = path.join(generationsDir, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }
  
  generations.delete(req.params.id);
  res.json({ message: 'Generation deleted' });
});

// Serve generated images
app.get('/api/images/generated/:filename', (req, res) => {
  const imagePath = path.join(generationsDir, req.params.filename);
  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).json({ error: 'Image not found' });
  }
});

// Serve uploaded images
app.get('/api/images/:filename', (req, res) => {
  const imagePath = path.join(uploadsDir, req.params.filename);
  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).json({ error: 'Image not found' });
  }
});

// Models endpoint
app.get('/api/models', (req, res) => {
  res.json([
    { id: 'stable-diffusion', name: 'Stable Diffusion XL', quality: 'High', description: 'General purpose, high quality' },
    { id: 'realistic-vision', name: 'Realistic Vision', quality: 'Ultra', description: 'Photorealistic images' },
    { id: 'dreamlike-diffusion', name: 'Dreamlike Diffusion', quality: 'High', description: 'Artistic, fantasy style' },
    { id: 'openjourney', name: 'OpenJourney', quality: 'High', description: 'Midjourney style' },
    { id: 'anything-v3', name: 'Anything V3', quality: 'High', description: 'Anime/2D art style' }
  ]);
});

// Styles endpoint
app.get('/api/styles', (req, res) => {
  res.json([
    { value: 'photorealistic', label: 'Photorealistic', category: 'photography' },
    { value: 'digital-art', label: 'Digital Art', category: 'digital' },
    { value: 'anime', label: 'Anime', category: 'anime' },
    { value: 'oil-painting', label: 'Oil Painting', category: 'painting' },
    { value: 'watercolor', label: 'Watercolor', category: 'painting' },
    { value: 'cyberpunk', label: 'Cyberpunk', category: 'style' },
    { value: 'fantasy', label: 'Fantasy', category: 'style' },
    { value: 'minimalist', label: 'Minimalist', category: 'style' }
  ]);
});

// Style presets endpoint
app.get('/api/style-presets', (req, res) => {
  res.json([
    { value: 'none', label: 'None' },
    { value: 'cyberpunk', label: 'Cyberpunk', description: 'Neon lights, futuristic' },
    { value: 'fantasy', label: 'Fantasy', description: 'Magical, epic landscapes' },
    { value: 'vintage', label: 'Vintage', description: 'Nostalgic, aged look' },
    { value: 'minimalist', label: 'Minimalist', description: 'Clean, simple' },
    { value: 'nature', label: 'Nature', description: 'Organic, environmental' }
  ]);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    standalone: true,
    generations: generations.size
  });
});

app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           AI Image Generator - STANDALONE MODE             ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Server running on: http://localhost:${PORT}                   ║`);
  console.log('║  No external APIs required - Fully self-contained          ║');
  console.log('║  Images generated locally using procedural generation      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
});