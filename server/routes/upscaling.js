const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../temp'));
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { 
      scale = 4, 
      model = 'real-esrgan-x4',
      denoise = 0.5,
      faceEnhance = false 
    } = req.body;

    if (!req.file && !req.body.imageUrl) {
      return res.status(400).json({ error: 'Image file or URL is required' });
    }

    let imagePath = req.file ? req.file.path : null;
    let imageUrl = req.body.imageUrl;

    const result = await upscaleImage({
      imagePath,
      imageUrl,
      scale: parseInt(scale),
      model,
      denoise: parseFloat(denoise),
      faceEnhance: faceEnhance === 'true' || faceEnhance === true
    });

    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    res.json(result);
  } catch (error) {
    console.error('Upscaling error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      error: 'Upscaling failed',
      details: error.message
    });
  }
});

async function upscaleImage({ imagePath, imageUrl, scale, model, denoise, faceEnhance }) {
  const filename = `${uuidv4()}_upscaled_${scale}x.png`;
  const outputPath = path.join(__dirname, '../uploads', filename);

  try {
    let imageBuffer;
    
    if (imagePath) {
      imageBuffer = fs.readFileSync(imagePath);
    } else {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      imageBuffer = Buffer.from(response.data);
    }

    const base64Image = imageBuffer.toString('base64');

    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) {
      throw new Error('Replicate API token not configured');
    }

    const modelMap = {
      'real-esrgan-x4': 'nightmareai/real-esrgan:f121d640bd286e1f57b62bd72e6f5b0d515bbc52ec27c5a9bde7d95b1d1ba068',
      'real-esrgan-x2': 'nightmareai/real-esrgan:f121d640bd286e1f57b62bd72e6f5b0d515bbc52ec27c5a9bde7d95b1d1ba068',
      'swinir': 'jingyunliang/swinir:660d922d33153019e8c263a3bba265de882e7f4f70396546b6c9c8f9d47a021a',
      'esrgan': 'lucataco/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05ce10373bf62b566ddbfbd89609'
    };

    const version = modelMap[model] || modelMap['real-esrgan-x4'];

    const predictionResponse = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: version,
        input: {
          image: `data:image/png;base64,${base64Image}`,
          scale: scale,
          face_enhance: faceEnhance
        }
      },
      {
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const prediction = predictionResponse.data;
    const resultUrl = await pollForResult(prediction.urls.get, apiKey);

    const resultResponse = await axios.get(resultUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(outputPath, Buffer.from(resultResponse.data));

    return {
      url: `/uploads/${filename}`,
      filename: filename,
      originalScale: scale,
      model: model,
      metadata: {
        denoise: denoise,
        faceEnhance: faceEnhance,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    throw error;
  }
}

async function pollForResult(url, apiKey) {
  const maxAttempts = 60;
  const delay = 1000;

  for (let i = 0; i < maxAttempts; i++) {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const data = response.data;

    if (data.status === 'succeeded') {
      return data.output;
    } else if (data.status === 'failed') {
      throw new Error(`Prediction failed: ${data.error}`);
    }

    await new Promise(resolve => setTimeout(resolve, delay));
  }

  throw new Error('Prediction timeout');
}

router.get('/models', (req, res) => {
  res.json([
    {
      id: 'real-esrgan-x4',
      name: 'Real-ESRGAN 4x',
      description: 'General purpose upscaling with excellent quality',
      maxScale: 4,
      useCase: 'General purpose, best overall quality',
      tags: ['general', 'realistic', 'anime']
    },
    {
      id: 'real-esrgan-x2',
      name: 'Real-ESRGAN 2x',
      description: 'Faster 2x upscaling for quick results',
      maxScale: 2,
      useCase: 'Quick upscaling, lower VRAM usage',
      tags: ['fast', 'general']
    },
    {
      id: 'swinir',
      name: 'SwinIR',
      description: 'State-of-the-art image restoration',
      maxScale: 4,
      useCase: 'High quality restoration, denoising',
      tags: ['restoration', 'high-quality']
    },
    {
      id: 'esrgan',
      name: 'ESRGAN',
      description: 'Classic ESRGAN for older content',
      maxScale: 4,
      useCase: 'Game textures, anime upscaling',
      tags: ['anime', 'game', 'retro']
    }
  ]);
});

module.exports = router;