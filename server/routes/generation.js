const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { 
  generateWithHuggingFace,
  generateWithOpenAI,
  generateWithStabilityAI,
  generateWithReplicate,
  img2imgWithStabilityAI,
  img2imgWithReplicate,
  inpaintWithStabilityAI,
  outpaintWithStabilityAI,
  upscaleWithStabilityAI,
  upscaleWithReplicate,
  upscaleWithSharp,
  generateWithControlNet,
  batchGenerate,
  styleTransfer,
  enhanceFaces,
  removeBackground,
  enhancePrompt,
  createPromptVariations,
  getNegativePrompt
} = require('../utils/generationProviders');

const { queueJob, getJobStatus } = require('../utils/jobQueue');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  }
}});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// ==========================================
// TEXT-TO-IMAGE GENERATION
// ==========================================

router.post('/txt2img', async (req, res) => {
  try {
    const { 
      prompt,
      provider = 'huggingface',
      model,
      negativePrompt,
      seed,
      steps = 30,
      width = 1024,
      height = 1024,
      guidanceScale = 7.5,
      sampler = 'DPM++ 2M Karras',
      style = 'default',
      enhance = true,
      quality = 'high',
      variations = false,
      variationCount = 4
    } = req.body;

    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt is required' 
      });
    }

    // Enhance prompt
    let finalPrompt = prompt;
    if (enhance) {
      finalPrompt = enhancePrompt(prompt, style, quality);
    }

    // Generate variations if requested
    if (variations && variationCount > 1) {
      const promptVariations = createPromptVariations(finalPrompt, variationCount);
      
      const results = await Promise.allSettled(
        promptVariations.map((variationPrompt, index) => {
          const params = {
            prompt: variationPrompt,
            negativePrompt: negativePrompt || getNegativePrompt(style),
            seed: seed ? seed + index : Math.floor(Math.random() * 999999999),
            steps,
            width,
            height,
            guidanceScale,
            sampler,
            style,
            model
          };

          switch (provider) {
            case 'openai':
              return generateWithOpenAI(variationPrompt, params);
            case 'stability':
              return generateWithStabilityAI(variationPrompt, params);
            case 'replicate':
              return generateWithReplicate(variationPrompt, params);
            case 'huggingface':
            default:
              return generateWithHuggingFace(variationPrompt, params);
          }
        })
      );

      const processedResults = results.map((result, index) => ({
        index,
        success: result.status === 'fulfilled',
        image: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null,
        prompt: promptVariations[index]
      }));

      return res.json({
        success: true,
        type: 'variations',
        originalPrompt: prompt,
        enhancedPrompt: finalPrompt,
        results: processedResults
      });
    }

    // Single generation
    const params = {
      prompt: finalPrompt,
      negativePrompt: negativePrompt || getNegativePrompt(style),
      seed,
      steps,
      width,
      height,
      guidanceScale,
      sampler,
      style,
      model
    };

    let result;
    switch (provider) {
      case 'openai':
        result = await generateWithOpenAI(finalPrompt, params);
        break;
      case 'stability':
        result = await generateWithStabilityAI(finalPrompt, params);
        break;
      case 'replicate':
        result = await generateWithReplicate(finalPrompt, params);
        break;
      case 'huggingface':
      default:
        result = await generateWithHuggingFace(finalPrompt, params);
        break;
    }

    res.json({
      success: true,
      type: 'single',
      originalPrompt: prompt,
      enhancedPrompt: enhance ? finalPrompt : null,
      image: result
    });

  } catch (error) {
    console.error('Text-to-image generation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Generation failed',
      details: error.message 
    });
  }
});

// ==========================================
// IMAGE-TO-IMAGE GENERATION
// ==========================================

router.post('/img2img', upload.single('image'), async (req, res) => {
  try {
    const {
      prompt,
      provider = 'stability',
      model,
      negativePrompt,
      seed,
      steps = 30,
      width = 1024,
      height = 1024,
      guidanceScale = 7.5,
      strength = 0.7,
      style = 'default',
      preserveStructure = false,
      enhance = true,
      quality = 'high'
    } = req.body;

    // Get image from file upload or base64
    let imageBase64;
    if (req.file) {
      const fs = require('fs');
      imageBase64 = fs.readFileSync(req.file.path, { encoding: 'base64' });
    } else if (req.body.image) {
      imageBase64 = req.body.image;
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Image is required (file upload or base64)' 
      });
    }

    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt is required' 
      });
    }

    // Enhance prompt
    let finalPrompt = prompt;
    if (enhance) {
      finalPrompt = enhancePrompt(prompt, style, quality);
    }

    const params = {
      prompt: finalPrompt,
      negativePrompt: negativePrompt || getNegativePrompt(style),
      seed,
      steps,
      width,
      height,
      guidanceScale,
      strength: parseFloat(strength),
      style,
      model,
      preserveStructure
    };

    let result;
    switch (provider) {
      case 'replicate':
        result = await img2imgWithReplicate(imageBase64, finalPrompt, params);
        break;
      case 'stability':
      default:
        result = await img2imgWithStabilityAI(imageBase64, finalPrompt, params);
        break;
    }

    res.json({
      success: true,
      type: 'img2img',
      originalPrompt: prompt,
      enhancedPrompt: enhance ? finalPrompt : null,
      image: result,
      parameters: {
        strength,
        preserveStructure,
        provider
      }
    });

  } catch (error) {
    console.error('Image-to-image generation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Image-to-image generation failed',
      details: error.message 
    });
  }
});

// ==========================================
// INPAINTING
// ==========================================

router.post('/inpaint', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'mask', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      prompt,
      model,
      negativePrompt,
      seed,
      steps = 30,
      guidanceScale = 7.5,
      style = 'default'
    } = req.body;

    let imageBase64, maskBase64;

    // Get images from files or base64
    if (req.files && req.files.image && req.files.mask) {
      const fs = require('fs');
      imageBase64 = fs.readFileSync(req.files.image[0].path, { encoding: 'base64' });
      maskBase64 = fs.readFileSync(req.files.mask[0].path, { encoding: 'base64' });
    } else if (req.body.image && req.body.mask) {
      imageBase64 = req.body.image;
      maskBase64 = req.body.mask;
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Both image and mask are required' 
      });
    }

    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt is required' 
      });
    }

    const result = await inpaintWithStabilityAI(
      imageBase64,
      maskBase64,
      prompt,
      {
        model,
        negativePrompt: negativePrompt || getNegativePrompt(style),
        seed,
        steps,
        guidanceScale,
        style
      }
    );

    res.json({
      success: true,
      type: 'inpainting',
      image: result
    });

  } catch (error) {
    console.error('Inpainting error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Inpainting failed',
      details: error.message 
    });
  }
});

// ==========================================
// OUTPAINTING
// ==========================================

router.post('/outpaint', upload.single('image'), async (req, res) => {
  try {
    const {
      prompt,
      width = 1536,
      height = 1536,
      model,
      style = 'default'
    } = req.body;

    let imageBase64;

    if (req.file) {
      const fs = require('fs');
      imageBase64 = fs.readFileSync(req.file.path, { encoding: 'base64' });
    } else if (req.body.image) {
      imageBase64 = req.body.image;
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Image is required' 
      });
    }

    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt is required' 
      });
    }

    const result = await outpaintWithStabilityAI(
      imageBase64,
      prompt,
      {
        width: parseInt(width),
        height: parseInt(height),
        model,
        style
      }
    );

    res.json({
      success: true,
      type: 'outpainting',
      image: result,
      parameters: {
        newWidth: width,
        newHeight: height
      }
    });

  } catch (error) {
    console.error('Outpainting error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Outpainting failed',
      details: error.message 
    });
  }
});

// ==========================================
// UPSCALING
// ==========================================

router.post('/upscale', upload.single('image'), async (req, res) => {
  try {
    const {
      provider = 'sharp',
      scale = 2,
      width,
      height,
      faceEnhance = false,
      quality = 'standard'
    } = req.body;

    let imageBase64;

    if (req.file) {
      const fs = require('fs');
      imageBase64 = fs.readFileSync(req.file.path, { encoding: 'base64' });
    } else if (req.body.image) {
      imageBase64 = req.body.image;
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Image is required' 
      });
    }

    const params = {
      scale: parseFloat(scale),
      width: width ? parseInt(width) : undefined,
      height: height ? parseInt(height) : undefined,
      faceEnhance: faceEnhance === 'true' || faceEnhance === true,
      quality
    };

    let result;
    switch (provider) {
      case 'stability':
        result = await upscaleWithStabilityAI(imageBase64, params);
        break;
      case 'replicate':
        result = await upscaleWithReplicate(imageBase64, params);
        break;
      case 'sharp':
      default: {
        // Save temp file for sharp processing
        const fs = require('fs').promises;
        const tempPath = path.join(uploadsDir, `temp_${uuidv4()}.png`);
        const buffer = Buffer.from(imageBase64, 'base64');
        await fs.writeFile(tempPath, buffer);
        result = await upscaleWithSharp(tempPath, parseFloat(scale));
        await fs.unlink(tempPath).catch(() => {});
        break;
      }
    }

    res.json({
      success: true,
      type: 'upscaling',
      image: result,
      parameters: {
        scale,
        provider,
        faceEnhance
      }
    });

  } catch (error) {
    console.error('Upscaling error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Upscaling failed',
      details: error.message 
    });
  }
});

// ==========================================
// CONTROLNET
// ==========================================

router.post('/controlnet', upload.single('controlImage'), async (req, res) => {
  try {
    const {
      prompt,
      controlType = 'canny',
      model,
      negativePrompt,
      seed,
      steps = 30,
      width = 1024,
      height = 1024,
      guidanceScale = 7.5,
      controlScale = 1.0,
      style = 'default'
    } = req.body;

    let controlImageBase64;

    if (req.file) {
      const fs = require('fs');
      controlImageBase64 = fs.readFileSync(req.file.path, { encoding: 'base64' });
    } else if (req.body.controlImage) {
      controlImageBase64 = req.body.controlImage;
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Control image is required' 
      });
    }

    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt is required' 
      });
    }

    const result = await generateWithControlNet(
      prompt,
      controlImageBase64,
      controlType,
      {
        model,
        negativePrompt: negativePrompt || getNegativePrompt(style),
        seed,
        steps,
        width,
        height,
        guidanceScale,
        controlScale: parseFloat(controlScale),
        style
      }
    );

    res.json({
      success: true,
      type: 'controlnet',
      controlType,
      image: result
    });

  } catch (error) {
    console.error('ControlNet error:', error);
    res.status(500).json({ 
      success: false,
      error: 'ControlNet generation failed',
      details: error.message 
    });
  }
});

// ==========================================
// BATCH GENERATION
// ==========================================

router.post('/batch', async (req, res) => {
  try {
    const {
      prompts,
      provider = 'huggingface',
      model,
      negativePrompt,
      seed,
      steps = 30,
      width = 1024,
      height = 1024,
      guidanceScale = 7.5,
      style = 'default',
      enhance = true,
      quality = 'high',
      concurrency = 2
    } = req.body;

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Array of prompts is required' 
      });
    }

    if (prompts.length > 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'Maximum 10 prompts allowed per batch' 
      });
    }

    // Enhance all prompts
    const enhancedPrompts = prompts.map(p => 
      enhance ? enhancePrompt(p, style, quality) : p
    );

    const results = await batchGenerate(enhancedPrompts, provider, {
      model,
      negativePrompt: negativePrompt || getNegativePrompt(style),
      seed,
      steps,
      width,
      height,
      guidanceScale,
      style,
      concurrency
    });

    res.json({
      success: true,
      type: 'batch',
      total: prompts.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results: results.map((r, index) => ({
        index,
        originalPrompt: prompts[index],
        enhancedPrompt: enhancedPrompts[index],
        success: r.status === 'fulfilled',
        image: r.status === 'fulfilled' ? r.value : null,
        error: r.status === 'rejected' ? r.reason.message : null
      }))
    });

  } catch (error) {
    console.error('Batch generation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Batch generation failed',
      details: error.message 
    });
  }
});

// ==========================================
// STYLE TRANSFER
// ==========================================

router.post('/style-transfer', upload.fields([
  { name: 'contentImage', maxCount: 1 },
  { name: 'styleImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      styleWeight = 1e4,
      contentWeight = 1,
      steps = 300
    } = req.body;

    let contentImageBase64, styleImageBase64;

    if (req.files && req.files.contentImage && req.files.styleImage) {
      const fs = require('fs');
      contentImageBase64 = fs.readFileSync(req.files.contentImage[0].path, { encoding: 'base64' });
      styleImageBase64 = fs.readFileSync(req.files.styleImage[0].path, { encoding: 'base64' });
    } else if (req.body.contentImage && req.body.styleImage) {
      contentImageBase64 = req.body.contentImage;
      styleImageBase64 = req.body.styleImage;
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Both content and style images are required' 
      });
    }

    const result = await styleTransfer(
      contentImageBase64,
      styleImageBase64,
      {
        styleWeight: parseFloat(styleWeight),
        contentWeight: parseFloat(contentWeight),
        steps: parseInt(steps)
      }
    );

    res.json({
      success: true,
      type: 'style-transfer',
      image: result,
      parameters: {
        styleWeight,
        contentWeight,
        steps
      }
    });

  } catch (error) {
    console.error('Style transfer error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Style transfer failed',
      details: error.message 
    });
  }
});

// ==========================================
// FACE ENHANCEMENT
// ==========================================

router.post('/enhance-faces', upload.single('image'), async (req, res) => {
  try {
    const {
      upscale = 2,
      backgroundEnhance = false
    } = req.body;

    let imageBase64;

    if (req.file) {
      const fs = require('fs');
      imageBase64 = fs.readFileSync(req.file.path, { encoding: 'base64' });
    } else if (req.body.image) {
      imageBase64 = req.body.image;
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Image is required' 
      });
    }

    const result = await enhanceFaces(imageBase64, {
      upscale: parseInt(upscale),
      backgroundEnhance: backgroundEnhance === 'true' || backgroundEnhance === true
    });

    res.json({
      success: true,
      type: 'face-enhancement',
      image: result,
      parameters: {
        upscale,
        backgroundEnhance
      }
    });

  } catch (error) {
    console.error('Face enhancement error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Face enhancement failed',
      details: error.message 
    });
  }
});

// ==========================================
// BACKGROUND REMOVAL
// ==========================================

router.post('/remove-background', upload.single('image'), async (req, res) => {
  try {
    const {
      alphaMatting = true
    } = req.body;

    let imageBase64;

    if (req.file) {
      const fs = require('fs');
      imageBase64 = fs.readFileSync(req.file.path, { encoding: 'base64' });
    } else if (req.body.image) {
      imageBase64 = req.body.image;
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Image is required' 
      });
    }

    const result = await removeBackground(imageBase64, {
      alphaMatting: alphaMatting === 'true' || alphaMatting === true
    });

    res.json({
      success: true,
      type: 'background-removal',
      image: result,
      parameters: {
        alphaMatting
      }
    });

  } catch (error) {
    console.error('Background removal error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Background removal failed',
      details: error.message 
    });
  }
});

// ==========================================
// PROMPT ENHANCEMENT API
// ==========================================

router.post('/enhance-prompt', async (req, res) => {
  try {
    const {
      prompt,
      style = 'default',
      quality = 'high',
      imageType = 'general',
      variations: generateVariations = false,
      variationCount = 4
    } = req.body;

    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt is required' 
      });
    }

    const enhanced = enhancePrompt(prompt, style, quality, imageType);
    const negativePrompt = getNegativePrompt(style);

    let response = {
      success: true,
      originalPrompt: prompt,
      enhancedPrompt: enhanced,
      negativePrompt: negativePrompt,
      style: style,
      quality: quality,
      detectedType: imageType
    };

    if (generateVariations) {
      response.variations = createPromptVariations(enhanced, variationCount);
    }

    res.json(response);

  } catch (error) {
    console.error('Prompt enhancement error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Prompt enhancement failed',
      details: error.message 
    });
  }
});

// ==========================================
// PROVIDER INFORMATION
// ==========================================

router.get('/providers', (req, res) => {
  res.json({
    success: true,
    providers: [
      {
        id: 'huggingface',
        name: 'Hugging Face',
        description: 'Free community models including Stable Diffusion',
        freeTier: true,
        models: [
          { id: 'stabilityai/stable-diffusion-xl-base-1.0', name: 'SDXL Base', quality: 'high', free: true },
          { id: 'stabilityai/stable-diffusion-2-1', name: 'SD 2.1', quality: 'medium', free: true },
          { id: 'runwayml/stable-diffusion-v1-5', name: 'SD 1.5', quality: 'medium', free: true },
          { id: 'prompthero/openjourney', name: 'OpenJourney', quality: 'high', free: true },
          { id: 'dreamlike-art/dreamlike-diffusion-1.0', name: 'Dreamlike', quality: 'high', free: true }
        ]
      },
      {
        id: 'openai',
        name: 'OpenAI',
        description: 'High-quality DALL-E models',
        freeTier: false,
        models: [
          { id: 'dall-e-3', name: 'DALL-E 3', quality: 'highest', free: false },
          { id: 'dall-e-2', name: 'DALL-E 2', quality: 'high', free: false }
        ]
      },
      {
        id: 'stability',
        name: 'Stability AI',
        description: 'Stable Diffusion XL with advanced controls',
        freeTier: false,
        models: [
          { id: 'stable-diffusion-xl-1024-v1-0', name: 'SDXL 1024', quality: 'highest', free: false },
          { id: 'stable-diffusion-v1-6', name: 'SD v1.6', quality: 'high', free: false }
        ]
      },
      {
        id: 'replicate',
        name: 'Replicate',
        description: 'Access to various community models',
        freeTier: true,
        models: [
          { id: 'stability-ai/sdxl', name: 'SDXL', quality: 'highest', free: true },
          { id: 'cjwbw/anything-v3-better-vae', name: 'Anything V3', quality: 'high', free: true },
          { id: 'tstramer/midjourney-diffusion', name: 'Midjourney Style', quality: 'high', free: true },
          { id: 'lucataco/realistic-vision-v5.1', name: 'Realistic Vision', quality: 'highest', free: true }
        ]
      }
    ]
  });
});

// ==========================================
// SAMPLERS & STYLES
// ==========================================

router.get('/samplers', (req, res) => {
  res.json({
    success: true,
    samplers: [
      { id: 'DPM++ 2M Karras', name: 'DPM++ 2M Karras', quality: 'best', speed: 'medium', recommended: true },
      { id: 'DPM++ SDE Karras', name: 'DPM++ SDE Karras', quality: 'best', speed: 'slow' },
      { id: 'Euler a', name: 'Euler a', quality: 'good', speed: 'fast' },
      { id: 'DPM++ 2M', name: 'DPM++ 2M', quality: 'good', speed: 'medium' },
      { id: 'Heun', name: 'Heun', quality: 'best', speed: 'slow' },
      { id: 'DDIM', name: 'DDIM', quality: 'good', speed: 'medium' },
      { id: 'PLMS', name: 'PLMS', quality: 'medium', speed: 'fast' }
    ]
  });
});

router.get('/styles', (req, res) => {
  res.json({
    success: true,
    styles: {
      categories: {
        photography: [
          { id: 'photorealistic', name: 'Photorealistic', icon: '📸', description: 'Realistic photography style' },
          { id: 'portrait', name: 'Portrait', icon: '👤', description: 'Professional portrait photography' },
          { id: 'landscape', name: 'Landscape', icon: '🏔️', description: 'Nature and scenic photography' },
          { id: 'cinematic', name: 'Cinematic', icon: '🎬', description: 'Movie-like quality' }
        ],
        art: [
          { id: 'digital-art', name: 'Digital Art', icon: '🎨', description: 'Digital painting style' },
          { id: 'oil-painting', name: 'Oil Painting', icon: '🖼️', description: 'Classical oil painting' },
          { id: 'watercolor', name: 'Watercolor', icon: '💧', description: 'Watercolor painting' },
          { id: 'fantasy', name: 'Fantasy', icon: '🐉', description: 'Fantasy art style' }
        ],
        anime: [
          { id: 'anime', name: 'Anime', icon: '🎌', description: 'Japanese anime style' },
          { id: 'manga', name: 'Manga', icon: '📚', description: 'Manga style' },
          { id: 'studio-ghibli', name: 'Studio Ghibli', icon: '✨', description: 'Ghibli-inspired art' }
        ],
        '3d': [
          { id: '3d-render', name: '3D Render', icon: '🎲', description: '3D rendered style' },
          { id: 'sci_fi', name: 'Sci-Fi', icon: '🚀', description: 'Science fiction style' },
          { id: 'cyberpunk', name: 'Cyberpunk', icon: '🌃', description: 'Cyberpunk aesthetic' }
        ]
      },
      presets: [
        { id: 'photorealistic', name: 'Photorealistic', icon: '📸' },
        { id: 'digital-art', name: 'Digital Art', icon: '🎨' },
        { id: 'anime', name: 'Anime', icon: '🎌' },
        { id: 'oil-painting', name: 'Oil Painting', icon: '🖼️' },
        { id: 'cinematic', name: 'Cinematic', icon: '🎬' },
        { id: '3d-render', name: '3D Render', icon: '🎲' },
        { id: 'cyberpunk', name: 'Cyberpunk', icon: '🌃' },
        { id: 'fantasy', name: 'Fantasy', icon: '🐉' },
        { id: 'sci_fi', name: 'Sci-Fi', icon: '🚀' },
        { id: 'watercolor', name: 'Watercolor', icon: '💧' }
      ]
    }
  });
});

router.get('/control-types', (req, res) => {
  res.json({
    success: true,
    controlTypes: [
      { id: 'pose', name: 'OpenPose', description: 'Control character poses and body positions', icon: '🚶' },
      { id: 'depth', name: 'Depth Map', description: 'Control based on depth information', icon: '📏' },
      { id: 'canny', name: 'Canny Edge', description: 'Control based on edge detection', icon: '✏️' },
      { id: 'scribble', name: 'Scribble', description: 'Control based on hand-drawn scribbles', icon: '✍️' },
      { id: 'lineart', name: 'Line Art', description: 'Control based on line drawings', icon: '📐' },
      { id: 'normal', name: 'Normal Map', description: 'Control based on surface normals', icon: '🧊' },
      { id: 'segmentation', name: 'Segmentation', description: 'Control based on semantic segmentation', icon: '🎯' }
    ]
  });
});

// ==========================================
// QUEUE STATUS
// ==========================================

router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const status = await getJobStatus(jobId);
    res.json({
      success: true,
      status
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to get job status',
      details: error.message 
    });
  }
});

module.exports = router;
