require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Storage
const generations = new Map();
const users = new Map();
const tokens = new Map();

// Reliable model
const MODEL = 'stabilityai/stable-diffusion-2-1';

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '5.0.0' });
});

// Generate image
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, negativePrompt = '', width = 512, height = 512, seed = Math.floor(Math.random() * 999999999) } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt required' });
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const generationId = uuidv4();
    
    // Store generation
    const generation = {
      id: generationId,
      status: 'PROCESSING',
      prompt,
      negativePrompt,
      width,
      height,
      seed,
      createdAt: new Date().toISOString(),
      url: null
    };
    generations.set(generationId, generation);

    // Return ID immediately
    res.json({ id: generationId, status: 'PROCESSING' });

    // Generate in background
    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${MODEL}`,
        {
          inputs: prompt,
          parameters: {
            negative_prompt: negativePrompt,
            width: parseInt(width),
            height: parseInt(height),
            num_inference_steps: 25,
            guidance_scale: 7.5,
            seed: parseInt(seed)
          }
        },
        {
          headers: { 
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 300000 // 5 minutes
        }
      );

      const filename = `${generationId}.png`;
      fs.writeFileSync(path.join(uploadsDir, filename), response.data);

      generation.status = 'COMPLETED';
      generation.url = `/api/images/${filename}`;
      console.log(`[${generationId}] Success`);

    } catch (err) {
      console.error(`[${generationId}] Failed:`, err.message);
      generation.status = 'FAILED';
      generation.error = 'Model is loading or unavailable. Please try again in 1-2 minutes.';
    }

  } catch (error) {
    console.error('Generate error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get generation
app.get('/api/generations/:id', (req, res) => {
  const gen = generations.get(req.params.id);
  if (!gen) return res.status(404).json({ error: 'Not found' });
  res.json(gen);
});

// List generations
app.get('/api/generations', (req, res) => {
  const list = Array.from(generations.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

// Get models
app.get('/api/models', (req, res) => {
  res.json([
    { value: 'stable-diffusion', label: 'Stable Diffusion 2.1', quality: 'High' }
  ]);
});

// Serve images
app.get('/api/images/:filename', (req, res) => {
  const file = path.join(uploadsDir, req.params.filename);
  if (fs.existsSync(file)) {
    res.sendFile(file);
  } else {
    res.status(404).json({ error: 'Image not found' });
  }
});

// Auth - Register
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  
  if (users.has(email)) {
    return res.status(409).json({ error: 'User exists' });
  }

  const user = {
    id: uuidv4(),
    email,
    name,
    credits: 100,
    plan: 'free'
  };

  users.set(email, { ...user, password });
  
  const token = uuidv4();
  tokens.set(token, user);
  
  res.json({ token, user });
});

// Auth - Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const userData = users.get(email);
  
  if (!userData || userData.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { password: _, ...user } = userData;
  const token = uuidv4();
  tokens.set(token, user);
  
  res.json({ token, user });
});

// Get me
app.get('/api/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  
  const token = auth.split(' ')[1];
  const user = tokens.get(token);
  
  if (!user) return res.status(403).json({ error: 'Invalid token' });
  res.json(user);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Ready for connections');
});