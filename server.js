/**
 * AI Image Generator Server - Multi-Provider Support
 * Supports: Pollinations (Free), Hugging Face, OpenAI DALL-E
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const { z } = require('zod');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS must be before other middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting for generation endpoints (prevent abuse)
const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per 15 minutes
  message: 'Too many generation requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 auth attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Data cleanup: Remove generations older than 24 hours
function cleanupOldData() {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  let deletedCount = 0;
  
  for (const [id, gen] of generations) {
    const age = now - new Date(gen.createdAt).getTime();
    if (age > maxAge) {
      generations.delete(id);
      // Also delete the file
      try {
        const filepath = path.join(uploadsDir, `${id}.png`);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      } catch (e) {
        console.error(`Failed to delete old file ${id}:`, e.message);
      }
      deletedCount++;
    }
  }
  
  if (deletedCount > 0) {
    console.log(`[Cleanup] Removed ${deletedCount} old generations`);
  }
}

// Run cleanup every 6 hours
setInterval(cleanupOldData, 6 * 60 * 60 * 1000);

// Validation schemas
const GenerationSchema = z.object({
  prompt: z.string().min(1).max(1000),
  width: z.number().int().min(256).max(2048).default(512),
  height: z.number().int().min(256).max(2048).default(512),
  style: z.string().default('default'),
  provider: z.string().optional()
});

const BatchGenerationSchema = z.object({
  prompt: z.string().min(1).max(1000),
  width: z.number().int().min(256).max(2048).default(512),
  height: z.number().int().min(256).max(2048).default(512),
  style: z.string().default('default'),
  count: z.number().int().min(1).max(8).default(4),
  variations: z.array(z.string()).optional()
});

const Img2ImgSchema = z.object({
  image: z.string().min(1),
  prompt: z.string().min(1).max(1000),
  width: z.number().int().min(256).max(2048).default(1024),
  height: z.number().int().min(256).max(2048).default(1024),
  style: z.string().default('default'),
  strength: z.number().min(0).max(1).default(0.75),
  quality: z.enum(['standard', 'high', 'ultra']).default('high'),
  enhancePrompt: z.boolean().default(true),
  preserveStructure: z.boolean().default(true),
  referenceWeight: z.number().min(0).max(1).default(0.92)
});

const AuthSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional()
});

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Storage
const generations = new Map();
const users = new Map();
const tokens = new Map();

// Initialize default user with hashed password
(async () => {
  const hashedPassword = await bcrypt.hash('demo123', 10);
  users.set('demo@example.com', {
    id: 'demo-user-id',
    email: 'demo@example.com',
    password: hashedPassword,
    name: 'Demo User',
    credits: 100,
    plan: 'free'
  });
})();

// Provider configurations - Prioritizing best free/open-source Midjourney-level models
const PROVIDERS = {
  // Pollinations - FREE, uses best open source models (SDXL, RealVis, etc.)
  pollinations: {
    enabled: process.env.POLLINATIONS_ENABLED !== 'false',
    isFree: true,
    priority: 1,
    description: 'Free multi-model (SDXL, RealVis, DreamShaper)'
  },
  
  // Hugging Face - FREE open source models
  huggingface: {
    enabled: !!process.env.HUGGINGFACE_API_KEY && 
             process.env.HUGGINGFACE_API_KEY !== 'your_huggingface_token_here' &&
             process.env.HUGGINGFACE_API_KEY !== 'hf_dummy_key_for_testing',
    apiKey: process.env.HUGGINGFACE_API_KEY,
    // Best free/open-source models for different use cases
    models: {
      default: 'stabilityai/stable-diffusion-xl-base-1.0',  // Base SDXL - excellent quality
      photorealistic: 'SG161222/RealVisXL_V4.0',  // Best for realistic humans/faces
      artistic: 'RunDiffusion/Juggernaut-XL-v9',  // Artistic, creative images
      anime: 'cagliostrolab/animagine-xl-3.1',  // Anime/manga style
      digital: 'Corcelio/mobius-xl',  // Digital art, concept art
      cinematic: 'digiplay/JuggernautXL_v9PhotoReal',  // Cinematic, photorealistic
      fast: 'segmind/Segmind-Vega',  // Fast generation, good quality
    },
    model: process.env.HUGGINGFACE_IMAGE_MODEL || 'stabilityai/stable-diffusion-xl-base-1.0',
    isFree: true,
    priority: 2
  },
  
  // Together AI - FREE tier available with excellent open source models
  together: {
    enabled: !!process.env.TOGETHER_API_KEY && 
             process.env.TOGETHER_API_KEY !== 'your_together_api_key_here',
    apiKey: process.env.TOGETHER_API_KEY,
    models: {
      default: 'stabilityai/stable-diffusion-xl-base-1.0',
      photorealistic: 'SG161222/RealVisXL_V4.0_Lightning',  // Lightning fast, realistic
      artistic: 'RunDiffusion/Juggernaut-XL-v9',  // Juggernaut - highly rated
      anime: 'cagliostrolab/animagine-xl-3.1',
    },
    model: process.env.TOGETHER_IMAGE_MODEL || 'stabilityai/stable-diffusion-xl-base-1.0',
    isFree: true,
    priority: 3
  },
  
  // OpenAI DALL-E - Paid, but highest quality
  openai: {
    enabled: !!process.env.OPENAI_API_KEY && 
             process.env.OPENAI_API_KEY !== 'your_openai_api_key_here',
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_IMAGE_MODEL || 'dall-e-3',
    isFree: false,
    priority: 4
  }
};

/**
 * Get available providers sorted by priority
 */
function getAvailableProviders() {
  return Object.entries(PROVIDERS)
    .filter(([_, config]) => config.enabled)
    .sort((a, b) => a[1].priority - b[1].priority)
    .map(([name]) => name);
}

/**
 * Detect what type of image to generate based on prompt
 */
function detectImageType(prompt) {
  const p = prompt.toLowerCase();
  
  if (p.includes('anime') || p.includes('manga') || p.includes('cartoon') || p.includes('chibi')) {
    return 'anime';
  }
  if (p.includes('realistic') || p.includes('photo') || p.includes('portrait') || p.includes('person') || 
      p.includes('human') || p.includes('face') || p.includes('man') || p.includes('woman') || 
      p.includes('girl') || p.includes('boy')) {
    return 'photorealistic';
  }
  if (p.includes('3d') || p.includes('render') || p.includes('blender') || p.includes('octane')) {
    return '3d-render';
  }
  if (p.includes('oil painting') || p.includes('painting')) {
    return 'oil-painting';
  }
  if (p.includes('sketch') || p.includes('drawing')) {
    return 'sketch';
  }
  if (p.includes('digital art') || p.includes('concept art') || p.includes('artstation')) {
    return 'digital-art';
  }
  return 'default';
}

/**
 * Select best model for the image type
 */
function selectBestModel(provider, imageType) {
  if (!PROVIDERS[provider] || !PROVIDERS[provider].models) {
    return PROVIDERS[provider]?.model || 'stabilityai/stable-diffusion-xl-base-1.0';
  }
  
  const models = PROVIDERS[provider].models;
  return models[imageType] || models.default || 'stabilityai/stable-diffusion-xl-base-1.0';
}

/**
 * Get aspect ratio guidance for prompts
 */
function getAspectRatioGuidance(width, height) {
  const aspect = width / height;
  
  if (Math.abs(aspect - 1) < 0.1) {
    return 'square format 1:1 aspect ratio';
  } else if (aspect > 1.7 && aspect < 1.9) {
    return 'widescreen 16:9 aspect ratio';
  } else if (aspect > 1.3 && aspect < 1.4) {
    return 'standard 4:3 aspect ratio';
  } else if (aspect > 0.55 && aspect < 0.6) {
    return 'vertical mobile 9:16 aspect ratio';
  } else if (aspect > 0.7 && aspect < 0.8) {
    return 'vertical portrait 3:4 aspect ratio';
  } else if (aspect > 2.3 && aspect < 2.4) {
    return 'ultrawide 21:9 cinematic aspect ratio';
  } else {
    return `${width}x${height} resolution`;
  }
}

/**
 * Enhance prompt based on style and aspect ratio - Midjourney-level quality
 */
function enhancePrompt(prompt, style = 'default', width = null, height = null) {
  let enhancedPrompt = prompt;
  
  const styleEnhancers = {
    'photorealistic': ', photorealistic, 8k uhd, dslr, high quality, film grain, Fujifilm XT3, soft lighting, detailed skin texture, anatomically correct, symmetrical face, professional photography, cinematic lighting, depth of field, bokeh, masterpiece, best quality, sharp focus',
    
    'anime': ', anime style, high quality, detailed, vibrant colors, sharp focus, clean lines, studio ghibli style, masterpiece, best quality, 8k uhd',
    
    'digital-art': ', digital art, highly detailed, artstation, concept art, smooth, sharp focus, illustration, unreal engine 5, octane render, masterpiece, best quality, 8k uhd',
    
    'oil-painting': ', oil painting, detailed brushstrokes, rich colors, artistic, museum quality, masterpiece, best quality, renaissance style, dramatic lighting',
    
    'watercolor': ', watercolor painting, soft colors, artistic, flowing, detailed, masterpiece, best quality, wet-on-wet technique',
    
    'sketch': ', detailed pencil sketch, artistic, high quality, professional, cross-hatching, shading, masterpiece, graphite on paper',
    
    '3d-render': ', 3D render, octane render, blender, highly detailed, professional lighting, ray tracing, global illumination, masterpiece, best quality, 8k uhd, unreal engine 5',
    
    'cinematic': ', cinematic lighting, dramatic atmosphere, movie still, film grain, color grading, anamorphic lens, bokeh, masterpiece, best quality, 8k uhd',
    
    'default': ', highly detailed, 8k uhd, sharp focus, professional quality, masterpiece, best quality, trending on artstation'
  };
  
  enhancedPrompt += styleEnhancers[style] || styleEnhancers['default'];
  
  // Add aspect ratio guidance if dimensions provided
  if (width && height) {
    const aspectGuidance = getAspectRatioGuidance(width, height);
    enhancedPrompt += `, ${aspectGuidance}`;
  }
  
  return enhancedPrompt;
}

/**
 * Get negative prompt for quality
 */
function getNegativePrompt() {
  return 'blurry, low quality, low resolution, distorted, deformed, ugly, duplicate, watermark, signature, text, bad anatomy, bad proportions, extra limbs, missing limbs, floating limbs, disconnected limbs, mutation, mutated, extra fingers, fused fingers, too many fingers, long neck, cross-eyed, mutated hands, polar lowres, bad face, gender swap, different person, changed face, altered identity';
}

/**
 * Process image to ensure correct aspect ratio without stretching
 * Uses 'cover' mode to fill the target dimensions while maintaining aspect ratio
 */
async function processImageAspectRatio(imageBuffer, targetWidth, targetHeight) {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const originalWidth = metadata.width;
    const originalHeight = metadata.height;
    
    // Calculate aspect ratios
    const targetAspect = targetWidth / targetHeight;
    const originalAspect = originalWidth / originalHeight;
    
    // If aspect ratios match closely (within 1%), no processing needed
    if (Math.abs(targetAspect - originalAspect) < 0.01) {
      console.log(`[AspectRatio] Image already has correct aspect ratio: ${originalWidth}x${originalHeight}`);
      return imageBuffer;
    }
    
    console.log(`[AspectRatio] Fixing aspect ratio: ${originalWidth}x${originalHeight} -> ${targetWidth}x${targetHeight}`);
    console.log(`[AspectRatio] Original aspect: ${originalAspect.toFixed(3)}, Target: ${targetAspect.toFixed(3)}`);
    
    // Resize with 'cover' to fill the target dimensions without stretching
    // This may crop the image slightly but preserves aspect ratio
    const processedBuffer = await sharp(imageBuffer)
      .resize(targetWidth, targetHeight, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toBuffer();
    
    console.log(`[AspectRatio] Image processed successfully`);
    return processedBuffer;
  } catch (error) {
    console.error(`[AspectRatio] Error processing image:`, error.message);
    // Return original buffer if processing fails
    return imageBuffer;
  }
}

/**
 * Generate image with Pollinations (Free)
 */
async function generateWithPollinations(prompt, width, height, negativePrompt) {
  const seed = Math.floor(Math.random() * 1000000);
  const encodedPrompt = encodeURIComponent(prompt);
  const encodedNegative = encodeURIComponent(negativePrompt);
  
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}&negative_prompt=${encodedNegative}&enhance=true`;
  
  console.log(`[Pollinations] Generating: ${prompt.substring(0, 50)}...`);
  
  const response = await axios.get(imageUrl, { 
    responseType: 'arraybuffer',
    timeout: 180000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; AI-Generator/1.0)'
    }
  });
  
  return {
    data: response.data,
    provider: 'pollinations',
    url: imageUrl
  };
}

/**
 * Generate image with Hugging Face
 */
async function generateWithHuggingFace(prompt, width, height, negativePrompt, imageType = 'default') {
  const config = PROVIDERS.huggingface;
  const model = selectBestModel('huggingface', imageType);
  
  console.log(`[Hugging Face] Using model: ${model}`);
  console.log(`[Hugging Face] Generating: ${prompt.substring(0, 50)}...`);
  
  const response = await axios({
    method: 'post',
    url: `https://api-inference.huggingface.co/models/${model}`,
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    data: { 
      inputs: prompt,
      parameters: {
        width: parseInt(width),
        height: parseInt(height),
        num_inference_steps: 50,
        guidance_scale: 7.5,
        negative_prompt: negativePrompt
      }
    },
    responseType: 'arraybuffer',
    timeout: 180000
  });
  
  return {
    data: response.data,
    provider: 'huggingface',
    model: model
  };
}

/**
 * Generate image-to-image with Hugging Face (img2img)
 * This uses a proper img2img model that respects the reference image
 */
async function generateImg2ImgWithHuggingFace(imageBuffer, prompt, width, height, strength = 0.5) {
  const config = PROVIDERS.huggingface;
  
  if (!config.enabled || !config.apiKey) {
    throw new Error('Hugging Face not configured');
  }
  
  // Use a proper img2img model
  const img2imgModel = 'timbrooks/instruct-pix2pix';
  
  console.log(`[Hugging Face Img2Img] Using model: ${img2imgModel}`);
  console.log(`[Hugging Face Img2Img] Prompt: ${prompt.substring(0, 50)}...`);
  console.log(`[Hugging Face Img2Img] Strength: ${strength}`);
  
  try {
    const response = await axios({
      method: 'post',
      url: `https://api-inference.huggingface.co/models/${img2imgModel}`,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      data: { 
        inputs: prompt,
        image: imageBuffer.toString('base64'),
        parameters: {
          num_inference_steps: 50,
          guidance_scale: 7.5,
          strength: strength
        }
      },
      responseType: 'arraybuffer',
      timeout: 300000 // 5 minutes for img2img
    });
    
    return {
      data: response.data,
      provider: 'huggingface-img2img',
      model: img2imgModel
    };
  } catch (error) {
    console.error(`[Hugging Face Img2Img] Error:`, error.message);
    throw error;
  }
}

/**
 * Generate image with OpenAI DALL-E
 */
async function generateWithOpenAI(prompt, width, height) {
  const config = PROVIDERS.openai;
  
  console.log(`[OpenAI DALL-E] Generating: ${prompt.substring(0, 50)}...`);
  
  // Map sizes for DALL-E
  const size = width === height ? '1024x1024' : 
               width > height ? '1792x1024' : '1024x1792';
  
  const response = await axios.post(
    'https://api.openai.com/v1/images/generations',
    {
      model: config.model,
      prompt: prompt,
      n: 1,
      size: size,
      response_format: 'url'
    },
    {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    }
  );
  
  // Fetch the actual image
  const imageResponse = await axios.get(response.data.data[0].url, {
    responseType: 'arraybuffer',
    timeout: 30000
  });
  
  return {
    data: imageResponse.data,
    provider: 'openai',
    url: response.data.data[0].url
  };
}

/**
 * Generate image with Together AI
 */
async function generateWithTogether(prompt, width, height, imageType = 'default') {
  const config = PROVIDERS.together;
  const model = selectBestModel('together', imageType);
  
  console.log(`[Together AI] Using model: ${model}`);
  console.log(`[Together AI] Generating: ${prompt.substring(0, 50)}...`);
  
  const response = await axios.post(
    `${process.env.TOGETHER_API_BASE || 'https://api.together.xyz'}/v1/images/generations`,
    {
      model: model,
      prompt: prompt,
      width: parseInt(width),
      height: parseInt(height),
      steps: 30,
      n: 1
    },
    {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000
    }
  );
  
  // Together returns base64 encoded image
  const imageData = Buffer.from(response.data.data[0].b64_json, 'base64');
  
  return {
    data: imageData,
    provider: 'together',
    model: model
  };
}

/**
 * Generate image with fallback support
 */
async function generateImageWithFallback(prompt, width, height, style = 'default', requestedProvider = null) {
  // Detect what type of image we're generating
  const imageType = detectImageType(prompt);
  console.log(`[Generator] Detected image type: ${imageType}`);
  
  const enhancedPrompt = enhancePrompt(prompt, style, width, height);
  const negativePrompt = getNegativePrompt();
  
  // If a specific provider is requested, try only that one first
  if (requestedProvider && PROVIDERS[requestedProvider]?.enabled) {
    console.log(`[Generator] Using requested provider: ${requestedProvider}`);
    try {
      let result;
      
      switch (requestedProvider) {
        case 'pollinations':
          result = await generateWithPollinations(enhancedPrompt, width, height, negativePrompt);
          break;
        case 'huggingface':
          result = await generateWithHuggingFace(enhancedPrompt, width, height, negativePrompt, imageType);
          break;
        case 'openai':
          result = await generateWithOpenAI(enhancedPrompt, width, height);
          break;
        case 'together':
          result = await generateWithTogether(enhancedPrompt, width, height, imageType);
          break;
        default:
          throw new Error(`Unknown provider: ${requestedProvider}`);
      }
      
      // Process image to ensure correct aspect ratio
      result.data = await processImageAspectRatio(result.data, parseInt(width), parseInt(height));
      return result;
    } catch (error) {
      console.warn(`Requested provider ${requestedProvider} failed:`, error.message);
      // Fall back to other providers if requested one fails
    }
  }
  
  // Use available providers in priority order
  const providers = getAvailableProviders();
  
  if (providers.length === 0) {
    throw new Error('No image generation providers configured');
  }
  
  let lastError = null;
  
  for (const provider of providers) {
    // Skip if this was already tried as the requested provider
    if (provider === requestedProvider) continue;
    
    try {
      let result;
      
      switch (provider) {
        case 'pollinations':
          result = await generateWithPollinations(enhancedPrompt, width, height, negativePrompt);
          break;
        case 'huggingface':
          result = await generateWithHuggingFace(enhancedPrompt, width, height, negativePrompt, imageType);
          break;
        case 'openai':
          result = await generateWithOpenAI(enhancedPrompt, width, height);
          break;
        case 'together':
          result = await generateWithTogether(enhancedPrompt, width, height, imageType);
          break;
        default:
          continue;
      }
      
      // Process image to ensure correct aspect ratio
      result.data = await processImageAspectRatio(result.data, parseInt(width), parseInt(height));
      return result;
      
    } catch (error) {
      console.warn(`Provider ${provider} failed:`, error.message);
      lastError = error;
      
      if (process.env.ENABLE_PROVIDER_FALLBACK !== 'true') {
        break;
      }
    }
  }
  
  throw new Error(`All providers failed. Last error: ${lastError?.message}`);
}

// Utility function to handle async errors in route handlers
const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

// Health check with provider status
app.get('/api/health', asyncHandler(async (req, res) => {
  const providers = getAvailableProviders();
  res.json({ 
    status: 'ok', 
    version: '5.1.0',
    providers: {
      available: providers,
      count: providers.length
    }
  });
}));

// Get available providers endpoint
app.get('/api/providers', asyncHandler(async (req, res) => {
  const providers = Object.entries(PROVIDERS)
    .filter(([_, config]) => config.enabled)
    .map(([name, config]) => ({
      name,
      isFree: config.isFree,
      priority: config.priority
    }));
  
  res.json({
    success: true,
    providers
  });
}));

// Generate image
app.post('/api/generate', generateLimiter, asyncHandler(async (req, res) => {
  const validated = GenerationSchema.parse(req.body);
  const { prompt, width, height, style, provider: requestedProvider } = validated;

  const generationId = uuidv4();
    
    // Create generation record
    const generation = {
      id: generationId,
      status: 'PROCESSING',
      prompt,
      width,
      height,
      style,
      url: null,
      providerUsed: null,
      createdAt: new Date().toISOString()
    };
    
  generations.set(generationId, generation);

  // Return immediately
  res.json({
    success: true,
    generation: {
      id: generationId,
      status: 'PROCESSING',
      prompt
    }
  });

  // Generate image with enhanced quality and fallback (async, but properly error-handled)
  (async () => {
    try {
      const result = await generateImageWithFallback(
        prompt, 
        width, 
        height, 
        style,
        requestedProvider
      );
      
      // Save to file
      const filename = `${generationId}.png`;
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, result.data);
      
      // Update generation
      generation.status = 'COMPLETED';
      generation.url = `/uploads/${filename}`;
      generation.providerUsed = result.provider;
      generation.enhancedPrompt = enhancePrompt(prompt, style, width, height);
      
      console.log(`[${generationId}] Generated using ${result.provider}: ${prompt}`);
      
    } catch (err) {
      console.error(`[${generationId}] Failed:`, err.message);
      generation.status = 'FAILED';
      generation.error = err.message;
    }
  })();
}));

/**
 * BATCH GENERATION - Generate multiple images at once
 */
app.post('/api/generate/batch', generateLimiter, asyncHandler(async (req, res) => {
  const validated = BatchGenerationSchema.parse(req.body);
  const { prompt, width, height, style, count, variations = [] } = validated;
  const batchCount = count;
    
    const generationIds = [];
    const generationRecords = [];

    // Create all generation records first
    for (let i = 0; i < batchCount; i++) {
      const generationId = uuidv4();
      const variation = variations[i] || '';
      const finalPrompt = variation ? `${prompt}, ${variation}` : `${prompt} (variation ${i + 1})`;
      
      const generation = {
        id: generationId,
        status: 'PROCESSING',
        prompt: finalPrompt,
        originalPrompt: prompt,
        variation: variation,
        width,
        height,
        style,
        batchIndex: i,
        batchTotal: batchCount,
        url: null,
        providerUsed: null,
        createdAt: new Date().toISOString()
      };
      
      generations.set(generationId, generation);
      generationIds.push(generationId);
      generationRecords.push({ id: generationId, prompt: finalPrompt });
    }

  // Return immediately with all IDs
  res.json({
    success: true,
    batchId: uuidv4(),
    count: batchCount,
    generations: generationRecords
  });

  // Generate all images sequentially with delays to avoid rate limiting
  console.log(`[Batch] Starting batch generation of ${batchCount} images...`);
  
  // Process sequentially instead of parallel to avoid rate limits (properly error-handled)
  (async () => {
    try {
      for (let index = 0; index < generationRecords.length; index++) {
        const record = generationRecords[index];
        const generation = generations.get(record.id);
        
        try {
          // Add delay between requests (5 seconds between each)
          if (index > 0) {
            console.log(`[Batch] Waiting 5 seconds before generating image ${index + 1}/${batchCount}...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
          
          console.log(`[Batch] Generating image ${index + 1}/${batchCount}...`);
          
          // Retry logic for rate limiting
          let retries = 3;
          let result = null;
          
          while (retries > 0 && !result) {
            try {
              result = await generateImageWithFallback(
                record.prompt,
                width,
                height,
                style
              );
            } catch (err) {
              if (err.message && err.message.includes('429')) {
                console.log(`[Batch] Rate limited on image ${index + 1}, waiting 10 seconds before retry... (${retries} retries left)`);
                await new Promise(resolve => setTimeout(resolve, 10000));
                retries--;
              } else {
                throw err;
              }
            }
          }
          
          if (!result) {
            throw new Error('Max retries exceeded due to rate limiting');
          }
          
          // Save to file
          const filename = `${record.id}.png`;
          const filepath = path.join(uploadsDir, filename);
          fs.writeFileSync(filepath, result.data);
          
          // Update generation
          generation.status = 'COMPLETED';
          generation.url = `/uploads/${filename}`;
          generation.providerUsed = result.provider;
          generation.enhancedPrompt = enhancePrompt(record.prompt, style);
          
          console.log(`[Batch] Completed ${index + 1}/${batchCount}: ${record.prompt.substring(0, 50)}...`);
          
        } catch (err) {
          console.error(`[Batch] Failed ${index + 1}/${batchCount}:`, err.message);
          generation.status = 'FAILED';
          generation.error = err.message;
        }
      }
      
      console.log(`[Batch] All ${batchCount} generations completed`);
    } catch (err) {
      console.error('[Batch] Batch generation error:', err.message);
    }
  })();
}));

/**
 * ENHANCE PROMPT - Midjourney-style prompt enhancement
 * Takes a simple prompt and expands it to professional quality
 */
app.post('/api/enhance-prompt', asyncHandler(async (req, res) => {
  const { prompt, style = 'default', mode = 'creative' } = req.body;
    
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt required' });
  }
  
  try {
    // Detect image type for targeted enhancement
    const imageType = detectImageType(prompt);
    
    // Midjourney-style enhancements based on mode
    const enhancements = {
      creative: {
        prefix: '',
        suffix: ', highly detailed, artistic, creative composition, dramatic lighting, 8k uhd, masterpiece, trending on artstation'
      },
      photorealistic: {
        prefix: 'photorealistic ',
        suffix: ', 8k uhd, dslr, professional photography, sharp focus, realistic texture, cinematic lighting, depth of field, bokeh, masterpiece, best quality'
      },
      anime: {
        prefix: '',
        suffix: ', anime style, high quality, detailed, vibrant colors, sharp focus, clean lines, studio ghibli style, masterpiece, 8k uhd'
      },
      cinematic: {
        prefix: 'cinematic shot, ',
        suffix: ', movie still, film grain, color grading, anamorphic lens, dramatic atmosphere, professional cinematography, 8k uhd, masterpiece'
      },
      oil_painting: {
        prefix: 'oil painting of ',
        suffix: ', detailed brushstrokes, rich colors, artistic, museum quality, renaissance style, dramatic lighting, masterpiece'
      }
    };
    
    const enhancement = enhancements[mode] || enhancements.creative;
    const enhancedPrompt = enhancement.prefix + prompt + enhancement.suffix;
    
    // Add style-specific enhancements
    let finalPrompt = enhancePrompt(enhancedPrompt, style);
    
    // Generate variations for inspiration
    const variations = [
      finalPrompt,
      finalPrompt + ', ultra detailed, hyperrealistic',
      finalPrompt + ', atmospheric, moody lighting',
      finalPrompt + ', vibrant colors, high contrast'
    ];
    
    res.json({
      success: true,
      original: prompt,
      enhanced: finalPrompt,
      imageType: imageType,
      mode: mode,
      style: style,
      variations: variations
    });
  } catch (error) {
    console.error('Prompt enhancement error:', error);
    res.status(500).json({ error: 'Failed to enhance prompt' });
  }
}));

/**
 * ADVANCED IMAGE-TO-IMAGE GENERATION
 * Midjourney-level image transformation with multiple quality options
 */
app.post('/api/img2img', generateLimiter, asyncHandler(async (req, res) => {
  const validated = Img2ImgSchema.parse(req.body);
  const { 
    image,
    prompt, 
    width, 
    height, 
    style,
    strength,
    quality,
    enhancePrompt: shouldEnhance,
    preserveStructure,
    referenceWeight
  } = validated;

  // Validate base64 image
  const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
  if (!base64Data) {
    return res.status(400).json({ error: 'Invalid image format' });
  }

  const generationId = uuidv4();
    
    // Create generation record with enhanced metadata
    const generation = {
      id: generationId,
      status: 'PROCESSING',
      prompt,
      originalImage: image.substring(0, 100) + '...',
      width,
      height,
      style,
      strength,
      quality,
      referenceWeight,
      type: 'img2img',
      url: null,
      providerUsed: null,
      createdAt: new Date().toISOString()
    };
    
  generations.set(generationId, generation);

  // Return immediately
  res.json({
    success: true,
    generation: {
      id: generationId,
      status: 'PROCESSING',
      prompt,
      type: 'img2img',
      quality,
      referenceWeight
    }
  });

  // Process image-to-image with enhanced quality (properly error-handled)
  (async () => {
    let providerAttempts = [];
    try {
        console.log(`[Img2Img] Starting transformation...`);
        console.log(`[Img2Img] Quality: ${quality}, User Strength: ${strength}, Reference Weight: ${referenceWeight}`);
        
        // Save the original image
        const originalBuffer = Buffer.from(base64Data, 'base64');
        
         // Calculate actual strength based on reference weight
        // Lower strength = more like original, Higher strength = more transformation
        let adjustedStrength;
        if (referenceWeight >= 0.85) {
          adjustedStrength = 0.15; // EXTREMELY subtle changes - almost identical
        } else if (referenceWeight >= 0.6) {
          adjustedStrength = 0.25; // Very subtle changes
        } else {
          adjustedStrength = 0.4; // Moderate changes
        }
        
        // Override with user setting if it's lower (more conservative)
        adjustedStrength = Math.min(adjustedStrength, strength);
        console.log(`[Img2Img] Adjusted strength: ${adjustedStrength}`);

        // Build a CLEAN, SIMPLE prompt with GENDER PRESERVATION
        let finalPrompt;
        if (referenceWeight >= 0.7) {
          // High reference weight - focus on maintaining the image EXACTLY
          finalPrompt = `${prompt}, same person, same gender, same face, same body type, exact likeness, maintain all physical characteristics, preserve identity, same clothing style, same pose, maintain structure, high fidelity to reference`;
        } else {
          // Lower reference weight - allow more creativity but preserve gender
          finalPrompt = `${prompt}, same gender, same person, inspired by reference, maintain physical characteristics, ${width}x${height}`;
        }
        
        // Add quality boost
        finalPrompt += ', masterpiece, best quality, highly detailed';
        
        console.log(`[Img2Img] Prompt: ${finalPrompt}`);
        
        const negativePrompt = getNegativePrompt();
        let result = null;
        
        // APPROACH 1: Try Hugging Face img2img if available
        if (PROVIDERS.huggingface?.enabled) {
          try {
            console.log(`[Img2Img] Trying Hugging Face img2img...`);
            result = await generateImg2ImgWithHuggingFace(
              originalBuffer,
              finalPrompt,
              width,
              height,
              adjustedStrength
            );
            providerAttempts.push('huggingface-img2img-success');
            console.log(`[Img2Img] Hugging Face img2img succeeded`);
          } catch (hfErr) {
            console.log(`[Img2Img] Hugging Face img2img failed: ${hfErr.message}`);
            providerAttempts.push(`huggingface-img2img-failed: ${hfErr.message}`);
          }
        }
        
        // APPROACH 2: Use regular generation with enhanced prompt referencing the image
        if (!result) {
          try {
            console.log(`[Img2Img] Using text generation with reference guidance...`);
            
            // Create a descriptive prompt that references the image with gender preservation
            const enhancedPrompt = `Transform reference image: ${prompt}. Keep same person, same gender, same face, exact likeness, maintain all physical characteristics. ${width}x${height} resolution, masterpiece, best quality, highly detailed`;
            
            result = await generateImageWithFallback(
              enhancedPrompt,
              width,
              height,
              style
            );
            
            providerAttempts.push('text-generation-fallback-success');
            console.log(`[Img2Img] Text generation fallback succeeded`);
          } catch (genErr) {
            console.log(`[Img2Img] Text generation fallback failed: ${genErr.message}`);
            providerAttempts.push(`text-generation-fallback-failed: ${genErr.message}`);
            throw new Error('All img2img approaches failed');
          }
        }
        
        // Process image to ensure correct aspect ratio
        result.data = await processImageAspectRatio(result.data, parseInt(width), parseInt(height));
        
        // Save transformed image
        const filename = `${generationId}.png`;
        const filepath = path.join(uploadsDir, filename);
        fs.writeFileSync(filepath, result.data);
        
        // Update generation
        generation.status = 'COMPLETED';
        generation.url = `/uploads/${filename}`;
        generation.providerUsed = result.provider;
        generation.providerAttempts = providerAttempts;
        generation.enhancedPrompt = finalPrompt;
        generation.strengthUsed = adjustedStrength;
        
      console.log(`[${generationId}] Img2Img completed using ${result.provider}`);
      console.log(`[${generationId}] Provider attempts: ${providerAttempts.join(', ')}`);
      
    } catch (err) {
      console.error(`[${generationId}] Img2Img failed:`, err.message);
      generation.status = 'FAILED';
      generation.error = err.message;
      generation.providerAttempts = providerAttempts || [];
    }
  })();
}));

// Get generation status
app.get('/api/generations/:id', asyncHandler(async (req, res) => {
  const gen = generations.get(req.params.id);
  if (!gen) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json(gen);
}));

// List all generations
app.get('/api/generations', asyncHandler(async (req, res) => {
  const list = Array.from(generations.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
}));

// Delete generation
app.delete('/api/generations/:id', validateToken, (req, res) => {
  const generationId = req.params.id;
  if (!generations.has(generationId)) {
    return res.status(404).json({ error: 'Generation not found' });
  }
  
  generations.delete(generationId);
  res.json({ success: true, message: 'Generation deleted' });
});

// Get models
app.get('/api/models', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    models: [
      { id: 'stable-diffusion', name: 'Stable Diffusion XL' },
      { id: 'dall-e-3', name: 'DALL-E 3', requiresApiKey: true }
    ],
    styles: [
      { id: 'default', name: 'Default' },
      { id: 'photorealistic', name: 'Photorealistic' },
      { id: 'anime', name: 'Anime' },
      { id: 'digital-art', name: 'Digital Art' },
      { id: 'oil-painting', name: 'Oil Painting' },
      { id: 'watercolor', name: 'Watercolor' },
      { id: 'sketch', name: 'Sketch' },
      { id: '3d-render', name: '3D Render' }
    ]
  });
}));

// Register
app.post('/api/auth/register', authLimiter, asyncHandler(async (req, res) => {
  const validated = AuthSchema.parse(req.body);
  const { email, password, name } = validated;
  
  if (users.has(email)) {
    return res.status(409).json({ error: 'Email already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    email,
    name: name || email.split('@')[0],
    credits: 10,
    plan: 'free'
  };

  users.set(email, { ...user, password: hashedPassword });
  
  const token = uuidv4();
  tokens.set(token, user);
  
  res.json({ success: true, token, user });
}));

// Login
app.post('/api/auth/login', authLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  const userData = users.get(email);
  
  if (!userData) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const passwordMatch = await bcrypt.compare(password, userData.password);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { password: _, ...user } = userData;
  const token = uuidv4();
  tokens.set(token, user);
  
  res.json({ success: true, token, user });
}));

// Middleware to validate token
function validateToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: 'No authorization header' });
  }
  
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Invalid token format. Use Bearer <token>' });
  }
  
  const token = auth.substring(7); // Remove 'Bearer ' prefix
  const user = tokens.get(token);
  
  if (!user) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
  
  req.user = user;
  next();
}

// Get current user
app.get('/api/auth/me', validateToken, (req, res) => {
  const user = req.user;
  
  res.json(user);
});

// Alias for /api/me
app.get('/api/me', validateToken, (req, res) => {
  res.json(req.user);
});

// Favorites endpoints
const favorites = new Map();

app.get('/api/favorites', validateToken, (req, res) => {
  const userFavorites = favorites.get(req.user.id) || [];
  res.json(userFavorites);
});

app.post('/api/favorites/:id', validateToken, (req, res) => {
  const generationId = req.params.id;
  const gen = generations.get(generationId);
  
  if (!gen) {
    return res.status(404).json({ error: 'Generation not found' });
  }
  
  let userFavorites = favorites.get(req.user.id) || [];
  if (!userFavorites.find(f => f.id === generationId)) {
    userFavorites.push(gen);
    favorites.set(req.user.id, userFavorites);
  }
  
  res.json({ success: true, message: 'Added to favorites' });
});

app.delete('/api/favorites/:id', validateToken, (req, res) => {
  const generationId = req.params.id;
  let userFavorites = favorites.get(req.user.id) || [];
  userFavorites = userFavorites.filter(f => f.id !== generationId);
  favorites.set(req.user.id, userFavorites);
  
  res.json({ success: true, message: 'Removed from favorites' });
});



// ==========================================
// ENHANCED GENESIS API v2 - Market-Standard Features
// MUST be registered BEFORE SPA fallback
// ==========================================

try {
  const { registerEnhancedEndpoints } = require('./enhanced-api.js');
  registerEnhancedEndpoints(app);
  console.log('[Server] Enhanced API v2 endpoints loaded');
} catch (err) {
  console.warn('[Server] Enhanced API v2 not available:', err.message);
}

// Serve uploads directory
app.use('/uploads', express.static(uploadsDir));

// Serve static files
const clientDistPath = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  
  // SPA fallback - MUST be last
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ 
      error: 'Validation error',
      details: err.errors
    });
  }
  
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AI Image Generator Server running on http://0.0.0.0:${PORT}`);
  console.log(`📁 Frontend: ${clientDistPath}`);
  console.log(`🔧 Available providers: ${getAvailableProviders().join(', ')}`);
  console.log(`🧹 Cleanup job scheduled every 6 hours`);
});
