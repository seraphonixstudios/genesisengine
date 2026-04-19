require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const generationRoutes = require('./routes/generation');
const editingRoutes = require('./routes/editing');
const upscalingRoutes = require('./routes/upscaling');
const galleryRoutes = require('./routes/gallery');
const workspaceRoutes = require('./routes/workspace');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(requestLogger);

const uploadsDir = path.join(__dirname, 'uploads');
const tempDir = path.join(__dirname, 'temp');
[uploadsDir, tempDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.use('/uploads', express.static(uploadsDir));

app.use('/api/generate', generationRoutes);
app.use('/api/edit', editingRoutes);
app.use('/api/upscale', upscalingRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/workspace', workspaceRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: [
      'text-to-image',
      'image-to-image',
      'inpainting',
      'outpainting',
      'upscaling',
      'variations',
      'batch-processing',
      'prompt-enhancement'
    ]
  });
});

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log('🚀 AI Image Generator Server v2.0');
  console.log('📡 Running on port ' + PORT);
  console.log('📁 Uploads directory: ' + uploadsDir);
  console.log('🎨 Features: Text-to-Image, Upscaling, Editing, Batch Processing');
});
