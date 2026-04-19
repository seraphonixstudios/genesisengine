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

router.post('/inpaint', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'mask', maxCount: 1 }
]), async (req, res) => {
  try {
    const { prompt, negativePrompt = '', strength = 0.75 } = req.body;
    
    if (!req.files?.image || !req.files?.mask) {
      return res.status(400).json({ error: 'Both image and mask are required' });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await inpaintImage({
      imagePath: req.files.image[0].path,
      maskPath: req.files.mask[0].path,
      prompt,
      negativePrompt,
      strength: parseFloat(strength)
    });

    [req.files.image[0].path, req.files.mask[0].path].forEach(path => {
      if (fs.existsSync(path)) fs.unlinkSync(path);
    });

    res.json(result);
  } catch (error) {
    console.error('Inpainting error:', error);
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    res.status(500).json({ 
      error: 'Inpainting failed',
      details: error.message
    });
  }
});

router.post('/outpaint', upload.single('image'), async (req, res) => {
  try {
    const { 
      direction = 'all', 
      expansion = 512,
      prompt = '',
      model = 'stable-diffusion'
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const result = await outpaintImage({
      imagePath: req.file.path,
      direction,
      expansion: parseInt(expansion),
      prompt,
      model
    });

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json(result);
  } catch (error) {
    console.error('Outpainting error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      error: 'Outpainting failed',
      details: error.message
    });
  }
});

router.post('/variations', upload.single('image'), async (req, res) => {
  try {
    const { 
      count = 4, 
      strength = 0.7,
      prompt = ''
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const results = await generateVariations({
      imagePath: req.file.path,
      count: parseInt(count),
      strength: parseFloat(strength),
      prompt
    });

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({
      variations: results,
      count: results.length
    });
  } catch (error) {
    console.error('Variations error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      error: 'Failed to generate variations',
      details: error.message
    });
  }
});

router.post('/img2img', upload.single('image'), async (req, res) => {
  try {
    const { 
      prompt, 
      strength = 0.75,
      negativePrompt = '',
      steps = 30,
      guidanceScale = 7.5
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await imageToImage({
      imagePath: req.file.path,
      prompt,
      strength: parseFloat(strength),
      negativePrompt,
      steps: parseInt(steps),
      guidanceScale: parseFloat(guidanceScale)
    });

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json(result);
  } catch (error) {
    console.error('Img2img error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      error: 'Image-to-image failed',
      details: error.message
    });
  }
});

async function inpaintImage({ imagePath, maskPath, prompt, negativePrompt, strength }) {
  const filename = `${uuidv4()}_inpainted.png`;
  const outputPath = path.join(__dirname, '../uploads', filename);

  try {
    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) {
      throw new Error('Replicate API token not configured');
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const maskBuffer = fs.readFileSync(maskPath);
    
    const base64Image = imageBuffer.toString('base64');
    const base64Mask = maskBuffer.toString('base64');

    const predictionResponse = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: 'stability-ai/stable-diffusion-inpainting:f7856ab69371085934e9f5e3c38722aceac7018c5c144b7df3b78de9e98055d0',
        input: {
          image: `data:image/png;base64,${base64Image}`,
          mask: `data:image/png;base64,${base64Mask}`,
          prompt: prompt,
          negative_prompt: negativePrompt,
          strength: strength,
          num_outputs: 1
        }
      },
      {
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const resultUrl = await pollForResult(predictionResponse.data.urls.get, apiKey);
    const resultResponse = await axios.get(resultUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(outputPath, Buffer.from(resultResponse.data));

    return {
      url: `/uploads/${filename}`,
      filename: filename,
      type: 'inpaint',
      prompt: prompt,
      strength: strength
    };
  } catch (error) {
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    throw error;
  }
}

async function outpaintImage({ imagePath, direction, expansion, prompt, model }) {
  const filename = `${uuidv4()}_outpainted.png`;
  const outputPath = path.join(__dirname, '../uploads', filename);

  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const apiKey = process.env.REPLICATE_API_TOKEN;
    const predictionResponse = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: 'stability-ai/stable-diffusion-inpainting:f7856ab69371085934e9f5e3c38722aceac7018c5c144b7df3b78de9e98055d0',
        input: {
          image: `data:image/png;base64,${base64Image}`,
          prompt: `extended ${prompt}, seamless continuation`,
          num_outputs: 1,
          guidance_scale: 7.5
        }
      },
      {
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const resultUrl = await pollForResult(predictionResponse.data.urls.get, apiKey);
    const resultResponse = await axios.get(resultUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(outputPath, Buffer.from(resultResponse.data));

    return {
      url: `/uploads/${filename}`,
      filename: filename,
      type: 'outpaint',
      direction,
      expansion
    };
  } catch (error) {
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    throw error;
  }
}

async function generateVariations({ imagePath, count, strength, prompt }) {
  const results = [];
  const apiKey = process.env.REPLICATE_API_TOKEN;

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const generationPromises = Array.from({ length: Math.min(count, 4) }, async (_, i) => {
    const filename = `${uuidv4()}_variation_${i}.png`;
    const outputPath = path.join(__dirname, '../uploads', filename);

    try {
      const predictionResponse = await axios.post(
        'https://api.replicate.com/v1/predictions',
        {
          version: 'stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4',
          input: {
            image: `data:image/png;base64,${base64Image}`,
            prompt: prompt || 'variation',
            strength: strength,
            seed: Math.floor(Math.random() * 999999999),
            num_outputs: 1
          }
        },
        {
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const resultUrl = await pollForResult(predictionResponse.data.urls.get, apiKey);
      const resultResponse = await axios.get(resultUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(outputPath, Buffer.from(resultResponse.data));

      return {
        url: `/uploads/${filename}`,
        filename: filename,
        index: i,
        strength: strength
      };
    } catch (error) {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      throw error;
    }
  });

  return await Promise.all(generationPromises);
}

async function imageToImage({ imagePath, prompt, strength, negativePrompt, steps, guidanceScale }) {
  const filename = `${uuidv4()}_img2img.png`;
  const outputPath = path.join(__dirname, '../uploads', filename);

  try {
    const apiKey = process.env.REPLICATE_API_TOKEN;
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const predictionResponse = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: 'stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4',
        input: {
          image: `data:image/png;base64,${base64Image}`,
          prompt: prompt,
          negative_prompt: negativePrompt,
          strength: strength,
          num_inference_steps: steps,
          guidance_scale: guidanceScale,
          num_outputs: 1
        }
      },
      {
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const resultUrl = await pollForResult(predictionResponse.data.urls.get, apiKey);
    const resultResponse = await axios.get(resultUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(outputPath, Buffer.from(resultResponse.data));

    return {
      url: `/uploads/${filename}`,
      filename: filename,
      type: 'img2img',
      prompt: prompt,
      strength: strength
    };
  } catch (error) {
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
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

module.exports = router;