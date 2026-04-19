const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const generations = new Map();
const users = new Map();
const tokens = new Map();

const PORT = 3001;

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Generate
app.post('/api/generate', async (req, res) => {
  const { prompt, negativePrompt = '' } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });
  
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key missing' });
  
  const id = uuidv4();
  const gen = { id, status: 'PROCESSING', prompt, url: null };
  generations.set(id, gen);
  
  res.json({ id, status: 'PROCESSING' });
  
  // Generate
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1',
      { inputs: prompt, parameters: { negative_prompt: negativePrompt, num_inference_steps: 25 } },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, responseType: 'arraybuffer', timeout: 300000 }
    );
    fs.writeFileSync(path.join(uploadsDir, `${id}.png`), response.data);
    gen.status = 'COMPLETED';
    gen.url = `/api/images/${id}.png`;
    console.log(`[${id}] SUCCESS`);
  } catch (e) {
    console.error(`[${id}] FAIL:`, e.message);
    gen.status = 'FAILED';
    gen.error = 'Model loading. Wait 2 minutes and retry.';
  }
});

// Get generation
app.get('/api/generations/:id', (req, res) => {
  const g = generations.get(req.params.id);
  g ? res.json(g) : res.status(404).json({ error: 'Not found' });
});

// List
app.get('/api/generations', (req, res) => res.json(Array.from(generations.values())));

// Models
app.get('/api/models', (req, res) => res.json([{ value: 'sd', label: 'Stable Diffusion', quality: 'High' }]));

// Image
app.get('/api/images/:f', (req, res) => {
  const f = path.join(uploadsDir, req.params.f);
  fs.existsSync(f) ? res.sendFile(f) : res.status(404).json({ error: 'Not found' });
});

// Auth
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  if (users.has(email)) return res.status(409).json({ error: 'Exists' });
  const user = { id: uuidv4(), email, name, credits: 100, plan: 'free' };
  users.set(email, { ...user, password });
  const token = uuidv4();
  tokens.set(token, user);
  res.json({ token, user });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const d = users.get(email);
  if (!d || d.password !== password) return res.status(401).json({ error: 'Invalid' });
  const { password: _, ...user } = d;
  const token = uuidv4();
  tokens.set(token, user);
  res.json({ token, user });
});

app.get('/api/me', (req, res) => {
  const t = req.headers.authorization?.split(' ')[1];
  const u = tokens.get(t);
  u ? res.json(u) : res.status(403).json({ error: 'Invalid' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log('Test: curl http://localhost:' + PORT + '/api/health');
});

server.on('error', (err) => {
  console.error('Server error:', err.message);
  process.exit(1);
});