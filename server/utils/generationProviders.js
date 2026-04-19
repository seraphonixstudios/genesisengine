const axios = require('axios');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const FormData = require('form-data');
const sharp = require('sharp');

const uploadsDir = path.join(__dirname, '../uploads');
const outputsDir = path.join(__dirname, '../outputs');

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.mkdir(outputsDir, { recursive: true });
}
ensureDirectories().catch(console.error);

// ==========================================
// ADVANCED PROMPT ENGINEERING SYSTEM
// ==========================================

const QUALITY_ENHANCEMENTS = {
  photorealistic: [
    'masterpiece', 'best quality', 'ultra-detailed', '8k uhd', 'raw photo',
    'photorealistic', 'professional photography', 'highly detailed',
    'sharp focus', 'crisp details', 'realistic texture', 'natural lighting',
    'dslr', 'canon eos r5', '85mm lens', 'f/1.8', 'award winning photography'
  ],
  digital_art: [
    'masterpiece', 'best quality', 'ultra-detailed', 'trending on artstation',
    'digital art', 'concept art', 'illustration', 'art by artgerm and greg rutkowski',
    'vivid colors', 'dramatic lighting', 'sharp focus', 'wlop', 'rossdraws',
    'pixiv', 'deviantart', 'highly detailed'
  ],
  anime: [
    'masterpiece', 'best quality', 'ultra-detailed', 'beautiful detailed eyes',
    'anime style', 'manga', 'studio ghibli', 'makoto shinkai', 'kyoto animation',
    'vibrant colors', 'cel shading', 'detailed background', 'kawaii'
  ],
  cinematic: [
    'cinematic lighting', 'film grain', 'color grading', 'anamorphic',
    'bokeh', 'depth of field', 'movie still', 'cinematic composition',
    'golden hour', 'volumetric lighting', 'lens flare', '35mm film'
  ],
  oil_painting: [
    'oil painting', 'masterpiece', 'renaissance', 'baroque', 'impressionist',
    'by rembrandt', 'by leonardo da vinci', 'museum quality', 'fine art',
    'visible brushstrokes', 'rich colors', 'canvas texture'
  ],
  3d_render: [
    'octane render', 'unreal engine 5', '3d render', 'ray tracing', 'cinematic',
    'volumetric lighting', 'global illumination', 'physically based rendering',
    'subsurface scattering', 'ambient occlusion', '8k uhd'
  ],
  fantasy: [
    'fantasy art', 'magical', 'ethereal', 'epic scene', 'dramatic lighting',
    'by boris vallejo', 'by frank frazetta', 'dungeons and dragons',
    'magic the gathering', 'lord of the rings', 'mystical atmosphere'
  ],
  sci_fi: [
    'sci-fi', 'futuristic', 'cyberpunk', 'neon lights', 'high tech',
    'space station', 'starship', 'dystopian', 'bladerunner', 'star wars',
    'holographic', 'hologram', 'advanced technology'
  ]
};

const NEGATIVE_PROMPTS = {
  default: 'low quality, blurry, distorted, deformed, ugly, duplicate, watermark, signature, text, logo, cropped, worst quality, jpeg artifacts, error, mutation, extra limbs, bad anatomy, disfigured, poorly drawn face, bad proportions, gross proportions, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, cross-eyed',
  photorealistic: 'painting, drawing, illustration, cartoon, anime, 3d render, sketch, artificial, deformed, ugly, duplicate, watermark, text, logo',
  anime: 'photo, photorealistic, 3d render, western cartoon, realistic, blurry, low quality, bad anatomy, bad hands',
  painting: 'photo, photorealistic, 3d render, cartoon, anime, blurry, low quality, modern'
};

function enhancePrompt(prompt, style = 'default', quality = 'high', imageType = 'general') {
  const enhancements = QUALITY_ENHANCEMENTS[style] || QUALITY_ENHANCEMENTS.digital_art;
  
  // Detect image type from prompt
  const lowerPrompt = prompt.toLowerCase();
  let detectedType = imageType;
  
  if (lowerPrompt.includes('person') || lowerPrompt.includes('portrait') || lowerPrompt.includes('face')) {
    detectedType = 'portrait';
  } else if (lowerPrompt.includes('landscape') || lowerPrompt.includes('nature') || lowerPrompt.includes('mountain')) {
    detectedType = 'landscape';
  } else if (lowerPrompt.includes('building') || lowerPrompt.includes('architecture') || lowerPrompt.includes('house')) {
    detectedType = 'architecture';
  }
  
  // Build enhanced prompt
  let enhanced = prompt;
  
  // Add style prefix
  if (!lowerPrompt.includes(style.toLowerCase())) {
    enhanced = `${enhancements.slice(0, 4).join(', ')}, ${enhanced}`;
  }
  
  // Add quality suffix
  if (quality === 'ultra') {
    enhanced += `, ${enhancements.slice(4, 8).join(', ')}`;
  } else if (quality === 'high') {
    enhanced += `, ${enhancements.slice(4, 6).join(', ')}`;
  }
  
  // Add type-specific enhancements
  if (detectedType === 'portrait') {
    enhanced += ', detailed facial features, symmetrical face, realistic skin texture, professional portrait';
  } else if (detectedType === 'landscape') {
    enhanced += ', wide angle, panoramic, atmospheric perspective, detailed environment';
  }
  
  // Clean up duplicate commas and spaces
  enhanced = enhanced.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();
  
  return enhanced;
}

function createPromptVariations(basePrompt, count = 4) {
  const variations = [];
  const modifiers = [
    ['from different angle', 'another perspective', 'viewed from side'],
    ['with different lighting', 'dramatic lighting', 'soft lighting'],
    ['close-up view', 'wide shot', 'medium shot'],
    ['at golden hour', 'at night', 'at dawn']
  ];
  
  variations.push(basePrompt);
  
  for (let i = 1; i < count; i++) {
    const modifierSet = modifiers[(i - 1) % modifiers.length];
    const modifier = modifierSet[Math.floor(Math.random() * modifierSet.length)];
    variations.push(`${basePrompt}, ${modifier}`);
  }
  
  return variations;
}

function getNegativePrompt(style = 'default') {
  return NEGATIVE_PROMPTS[style] || NEGATIVE_PROMPTS.default;
}

// ==========================================
// TEXT-TO-IMAGE PROVIDERS
// ==========================================

async function generateWithHuggingFace(prompt, params = {}) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    throw new Error('Hugging Face API key not configured');
  }

  const modelEndpoint = params.model || 'stabilityai/stable-diffusion-xl-base-1.0';
  const apiUrl = `https://api-inference.huggingface.co/models/${modelEndpoint}`;

  const requestBody = {
    inputs: prompt,
    parameters: {
      negative_prompt: params.negativePrompt || getNegativePrompt(params.style),
      width: parseInt(params.width) || 1024,
      height: parseInt(params.height) || 1024,
      guidance_scale: parseFloat(params.guidanceScale) || 7.5,
      num_inference_steps: parseInt(params.steps) || 30,
      seed: parseInt(params.seed) || Math.floor(Math.random() * 999999999)
    }
  };

  const response = await axios.post(apiUrl, requestBody, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    responseType: 'arraybuffer',
    timeout: 120000
  });

  const filename = `${uuidv4()}_huggingface.png`;
  const imagePath = path.join(uploadsDir, filename);
  await fs.writeFile(imagePath, response.data);

  return {
    url: `/uploads/${filename}`,
    filename: filename,
    provider: 'huggingface',
    model: modelEndpoint,
    prompt: prompt,
    metadata: {
      width: requestBody.parameters.width,
      height: requestBody.parameters.height,
      steps: requestBody.parameters.num_inference_steps,
      guidanceScale: requestBody.parameters.guidance_scale,
      seed: requestBody.parameters.seed
    }
  };
}

async function generateWithOpenAI(prompt, params = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const model = params.model || 'dall-e-3';
  const size = params.width >= 1024 || params.height >= 1024 
    ? '1024x1024' 
    : params.width >= 768 
      ? '1024x1024'
      : '512x512';

  const response = await axios.post(
    'https://api.openai.com/v1/images/generations',
    {
      model: model,
      prompt: prompt,
      n: 1,
      size: size,
      quality: params.quality || 'standard',
      style: params.style || 'vivid'
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const imageUrl = response.data.data[0].url;
  const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  
  const filename = `${uuidv4()}_openai.png`;
  const imagePath = path.join(uploadsDir, filename);
  await fs.writeFile(imagePath, Buffer.from(imageResponse.data));

  return {
    url: `/uploads/${filename}`,
    filename: filename,
    provider: 'openai',
    model: model,
    prompt: prompt,
    metadata: {
      revisedPrompt: response.data.data[0].revised_prompt,
      size: size,
      quality: params.quality || 'standard'
    }
  };
}

async function generateWithStabilityAI(prompt, params = {}) {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) {
    throw new Error('Stability AI API key not configured');
  }

  const model = params.model || 'stable-diffusion-xl-1024-v1-0';
  
  const response = await axios.post(
    `https://api.stability.ai/v1/generation/${model}/text-to-image`,
    {
      text_prompts: [
        { text: prompt, weight: 1 },
        { text: params.negativePrompt || getNegativePrompt(params.style), weight: -1 }
      ],
      cfg_scale: parseFloat(params.guidanceScale) || 7,
      height: parseInt(params.height) || 1024,
      width: parseInt(params.width) || 1024,
      steps: parseInt(params.steps) || 30,
      seed: parseInt(params.seed) || 0,
      samples: 1
    },
    {
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      }
    }
  );

  const base64Image = response.data.artifacts[0].base64;
  const buffer = Buffer.from(base64Image, 'base64');
  
  const filename = `${uuidv4()}_stability.png`;
  const imagePath = path.join(uploadsDir, filename);
  await fs.writeFile(imagePath, buffer);

  return {
    url: `/uploads/${filename}`,
    filename: filename,
    provider: 'stability',
    model: model,
    prompt: prompt,
    metadata: {
      seed: response.data.artifacts[0].seed,
      width: parseInt(params.width) || 1024,
      height: parseInt(params.height) || 1024
    }
  };
}

async function generateWithReplicate(prompt, params = {}) {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) {
    throw new Error('Replicate API token not configured');
  }

  const modelMap = {
    'sdxl': 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
    'midjourney': 'tstramer/midjourney-diffusion:436b051ebd8f68d23e83d22de5e198e0995357afef113768c20f0b0f08923ecc',
    'anything-v3': 'cjwbw/anything-v3-better-vae:09a580cd3fae6c9a0d4b2cacc3a9b6a4f0dca6c66966d42f7e6f4e9c2e5e3d1c',
    'realistic-vision': 'lucataco/realistic-vision-v5.1:2c3e86532705c20ca210c67e759a2fd058023f4624fd06c1a2c03f3e869c7c93'
  };

  const version = modelMap[params.model] || modelMap['sdxl'];

  const predictionResponse = await axios.post(
    'https://api.replicate.com/v1/predictions',
    {
      version: version,
      input: {
        prompt: prompt,
        negative_prompt: params.negativePrompt || getNegativePrompt(params.style),
        width: parseInt(params.width) || 1024,
        height: parseInt(params.height) || 1024,
        num_inference_steps: parseInt(params.steps) || 50,
        guidance_scale: parseFloat(params.guidanceScale) || 7.5,
        seed: parseInt(params.seed) || null
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
  
  const filename = `${uuidv4()}_replicate.png`;
  const imagePath = path.join(uploadsDir, filename);
  await fs.writeFile(imagePath, Buffer.from(resultResponse.data));

  return {
    url: `/uploads/${filename}`,
    filename: filename,
    provider: 'replicate',
    model: params.model || 'sdxl',
    prompt: prompt,
    metadata: {
      width: parseInt(params.width) || 1024,
      height: parseInt(params.height) || 1024
    }
  };
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
      return data.output[0];
    } else if (data.status === 'failed') {
      throw new Error(`Prediction failed: ${data.error}`);
    }

    await new Promise(resolve => setTimeout(resolve, delay));
  }

  throw new Error('Prediction timeout');
}

// ==========================================
// IMAGE-TO-IMAGE (IMG2IMG)
// ==========================================

async function img2imgWithStabilityAI(imageBase64, prompt, params = {}) {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) {
    throw new Error('Stability AI API key not configured');
  }

  const model = params.model || 'stable-diffusion-xl-1024-v1-0';
  const strength = params.strength || 0.7;
  
  // Convert base64 to buffer if needed
  let imageBuffer;
  if (imageBase64.startsWith('data:image')) {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    imageBuffer = Buffer.from(base64Data, 'base64');
  } else {
    imageBuffer = Buffer.from(imageBase64, 'base64');
  }

  const formData = new FormData();
  formData.append('init_image', imageBuffer, { filename: 'init_image.png' });
  formData.append('text_prompts[0][text]', prompt);
  formData.append('text_prompts[0][weight]', '1');
  formData.append('text_prompts[1][text]', params.negativePrompt || getNegativePrompt(params.style));
  formData.append('text_prompts[1][weight]', '-1');
  formData.append('cfg_scale', (params.guidanceScale || 7).toString());
  formData.append('steps', (params.steps || 30).toString());
  formData.append('samples', '1');
  formData.append('strength', strength.toString());
  formData.append('seed', (params.seed || 0).toString());

  const response = await axios.post(
    `https://api.stability.ai/v1/generation/${model}/image-to-image`,
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        'Authorization': apiKey,
        'Accept': 'application/json'
      }
    }
  );

  const base64Image = response.data.artifacts[0].base64;
  const outputBuffer = Buffer.from(base64Image, 'base64');
  
  const filename = `${uuidv4()}_img2img_stability.png`;
  const imagePath = path.join(uploadsDir, filename);
  await fs.writeFile(imagePath, outputBuffer);

  return {
    url: `/uploads/${filename}`,
    filename: filename,
    provider: 'stability',
    model: model,
    prompt: prompt,
    metadata: {
      strength: strength,
      seed: response.data.artifacts[0].seed,
      width: 1024,
      height: 1024
    }
  };
}

async function img2imgWithReplicate(imageBase64, prompt, params = {}) {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) {
    throw new Error('Replicate API token not configured');
  }

  // Save base64 image temporarily
  const tempFilename = `temp_${uuidv4()}.png`;
  const tempPath = path.join(uploadsDir, tempFilename);
  
  let imageBuffer;
  if (imageBase64.startsWith('data:image')) {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    imageBuffer = Buffer.from(base64Data, 'base64');
  } else {
    imageBuffer = Buffer.from(imageBase64, 'base64');
  }
  
  await fs.writeFile(tempPath, imageBuffer);

  // Upload to temporary hosting or convert to data URI
  const dataUri = `data:image/png;base64,${imageBuffer.toString('base64')}`;

  const predictionResponse = await axios.post(
    'https://api.replicate.com/v1/predictions',
    {
      version: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      input: {
        image: dataUri,
        prompt: prompt,
        negative_prompt: params.negativePrompt || getNegativePrompt(params.style),
        strength: params.strength || 0.7,
        num_inference_steps: parseInt(params.steps) || 50,
        guidance_scale: parseFloat(params.guidanceScale) || 7.5
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
  
  // Clean up temp file
  await fs.unlink(tempPath).catch(() => {});
  
  const filename = `${uuidv4()}_img2img_replicate.png`;
  const imagePath = path.join(uploadsDir, filename);
  await fs.writeFile(imagePath, Buffer.from(resultResponse.data));

  return {
    url: `/uploads/${filename}`,
    filename: filename,
    provider: 'replicate',
    model: 'sdxl',
    prompt: prompt,
    metadata: {
      strength: params.strength || 0.7,
      width: 1024,
      height: 1024
    }
  };
}

// ==========================================
// INPAINTING & OUTPAINTING
// ==========================================

async function inpaintWithStabilityAI(imageBase64, maskBase64, prompt, params = {}) {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) {
    throw new Error('Stability AI API key not configured');
  }

  const model = params.model || 'stable-diffusion-xl-1024-v1-0';
  
  // Process images
  let imageBuffer, maskBuffer;
  
  if (imageBase64.startsWith('data:image')) {
    imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  } else {
    imageBuffer = Buffer.from(imageBase64, 'base64');
  }
  
  if (maskBase64.startsWith('data:image')) {
    maskBuffer = Buffer.from(maskBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  } else {
    maskBuffer = Buffer.from(maskBase64, 'base64');
  }

  const formData = new FormData();
  formData.append('init_image', imageBuffer, { filename: 'image.png' });
  formData.append('mask_image', maskBuffer, { filename: 'mask.png' });
  formData.append('text_prompts[0][text]', prompt);
  formData.append('text_prompts[0][weight]', '1');
  formData.append('cfg_scale', (params.guidanceScale || 7).toString());
  formData.append('steps', (params.steps || 30).toString());
  formData.append('samples', '1');
  formData.append('seed', (params.seed || 0).toString());

  const response = await axios.post(
    `https://api.stability.ai/v1/generation/${model}/image-to-image/masking`,
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        'Authorization': apiKey,
        'Accept': 'application/json'
      }
    }
  );

  const base64Image = response.data.artifacts[0].base64;
  const outputBuffer = Buffer.from(base64Image, 'base64');
  
  const filename = `${uuidv4()}_inpaint.png`;
  const imagePath = path.join(uploadsDir, filename);
  await fs.writeFile(imagePath, outputBuffer);

  return {
    url: `/uploads/${filename}`,
    filename: filename,
    provider: 'stability',
    model: model,
    prompt: prompt,
    metadata: {
      type: 'inpainting',
      seed: response.data.artifacts[0].seed
    }
  };
}

async function outpaintWithStabilityAI(imageBase64, prompt, params = {}) {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) {
    throw new Error('Stability AI API key not configured');
  }

  // For outpainting, we use image-to-image with a modified canvas
  // This is a simplified implementation
  let imageBuffer;
  
  if (imageBase64.startsWith('data:image')) {
    imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  } else {
    imageBuffer = Buffer.from(imageBase64, 'base64');
  }

  // Get original image dimensions
  const metadata = await sharp(imageBuffer).metadata();
  const originalWidth = metadata.width;
  const originalHeight = metadata.height;

  // Create expanded canvas
  const targetWidth = params.width || Math.max(originalWidth * 1.5, 1024);
  const targetHeight = params.height || Math.max(originalHeight * 1.5, 1024);
  const left = Math.floor((targetWidth - originalWidth) / 2);
  const top = Math.floor((targetHeight - originalHeight) / 2);

  const expandedImage = await sharp({
    create: {
      width: targetWidth,
      height: targetHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  }).composite([{
    input: imageBuffer,
    left: left,
    top: top
  }]).png().toBuffer();

  // Create mask for original image area
  const maskImage = await sharp({
    create: {
      width: targetWidth,
      height: targetHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 255 }
    }
  }).composite([{
    input: await sharp({
      create: {
        width: originalWidth,
        height: originalHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 255 }
      }
    }).png().toBuffer(),
    left: left,
    top: top
  }]).png().toBuffer();

  // Use inpainting on expanded canvas
  const formData = new FormData();
  formData.append('init_image', expandedImage, { filename: 'image.png' });
  formData.append('mask_image', maskImage, { filename: 'mask.png' });
  formData.append('text_prompts[0][text]', prompt);
  formData.append('text_prompts[0][weight]', '1');
  formData.append('cfg_scale', '7');
  formData.append('steps', '40');
  formData.append('samples', '1');

  const response = await axios.post(
    'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image/masking',
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        'Authorization': apiKey,
        'Accept': 'application/json'
      }
    }
  );

  const base64Image = response.data.artifacts[0].base64;
  const outputBuffer = Buffer.from(base64Image, 'base64');
  
  const filename = `${uuidv4()}_outpaint.png`;
  const imagePath = path.join(uploadsDir, filename);
  await fs.writeFile(imagePath, outputBuffer);

  return {
    url: `/uploads/${filename}`,
    filename: filename,
    provider: 'stability',
    model: 'stable-diffusion-xl-1024-v1-0',
    prompt: prompt,
    metadata: {
      type: 'outpainting',
      originalWidth,
      originalHeight,
      newWidth: targetWidth,
      newHeight: targetHeight
    }
  };
}

// ==========================================
// UPSCALING
// ==========================================

async function upscaleWithStabilityAI(imageBase64, params = {}) {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) {
    throw new Error('Stability AI API key not configured');
  }

  let imageBuffer;
  if (imageBase64.startsWith('data:image')) {
    imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  } else {
    imageBuffer = Buffer.from(imageBase64, 'base64');
  }

  const width = params.width || 2048;
  const height = params.height || 2048;

  const response = await axios.post(
    'https://api.stability.ai/v1/generation/stable-diffusion-x4-latent-upscaler/image-to-image/upscale',
    {
      text_prompts: [
        { text: params.prompt || 'upscaled image, high quality, detailed', weight: 1 }
      ],
      init_image: imageBuffer.toString('base64'),
      width: width,
      height: height,
      cfg_scale: 7,
      steps: 20,
      samples: 1
    },
    {
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      }
    }
  );

  const base64Image = response.data.artifacts[0].base64;
  const outputBuffer = Buffer.from(base64Image, 'base64');
  
  const filename = `${uuidv4()}_upscaled.png`;
  const imagePath = path.join(uploadsDir, filename);
  await fs.writeFile(imagePath, outputBuffer);

  return {
    url: `/uploads/${filename}`,
    filename: filename,
    provider: 'stability',
    model: 'stable-diffusion-x4-latent-upscaler',
    metadata: {
      originalWidth: params.originalWidth,
      originalHeight: params.originalHeight,
      upscaledWidth: width,
      upscaledHeight: height,
      scaleFactor: width / (params.originalWidth || 1024)
    }
  };
}

async function upscaleWithReplicate(imageBase64, params = {}) {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) {
    throw new Error('Replicate API token not configured');
  }

  let imageBuffer;
  if (imageBase64.startsWith('data:image')) {
    imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  } else {
    imageBuffer = Buffer.from(imageBase64, 'base64');
  }

  const scale = params.scale || 4;
  const dataUri = `data:image/png;base64,${imageBuffer.toString('base64')}`;

  const predictionResponse = await axios.post(
    'https://api.replicate.com/v1/predictions',
    {
      version: '0d3e4c2a1b5f8e9c4d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e',
      input: {
        image: dataUri,
        scale: scale,
        face_enhance: params.faceEnhance !== false
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
  
  const filename = `${uuidv4()}_upscaled_replicate.png`;
  const imagePath = path.join(uploadsDir, filename);
  await fs.writeFile(imagePath, Buffer.from(resultResponse.data));

  return {
    url: `/uploads/${filename}`,
    filename: filename,
    provider: 'replicate',
    model: 'real-esrgan',
    metadata: {
      scale: scale,
      faceEnhance: params.faceEnhance !== false
    }
  };
}

// ==========================================
// LOCAL SHARP UPSCALING (FALLBACK)
// ==========================================

async function upscaleWithSharp(imagePath, scale = 2) {
  const image = sharp(imagePath);
  const metadata = await image.metadata();
  
  const newWidth = Math.round(metadata.width * scale);
  const newHeight = Math.round(metadata.height * scale);
  
  const upscaledBuffer = await image
    .resize(newWidth, newHeight, {
      kernel: sharp.kernel.lanczos3,
      fit: 'contain'
    })
    .sharpen({
      sigma: 1.5,
      m1: 1.5,
      m2: 0.5
    })
    .png()
    .toBuffer();
  
  const filename = `${uuidv4()}_upscaled_sharp.png`;
  const outputPath = path.join(uploadsDir, filename);
  await fs.writeFile(outputPath, upscaledBuffer);
  
  return {
    url: `/uploads/${filename}`,
    filename: filename,
    provider: 'local',
    model: 'sharp-lanczos',
    metadata: {
      originalWidth: metadata.width,
      originalHeight: metadata.height,
      upscaledWidth: newWidth,
      upscaledHeight: newHeight,
      scaleFactor: scale,
      method: 'lanczos3'
    }
  };
}

// ==========================================
// CONTROLNET (SIMPLIFIED - POSE/DEPTH/CANNY)
// ==========================================

async function generateWithControlNet(prompt, controlImage, controlType, params = {}) {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) {
    throw new Error('Replicate API token not configured for ControlNet');
  }

  // Map control types to models
  const controlNetModels = {
    'pose': 'openpose',
    'depth': 'midas',
    'canny': 'canny',
    'scribble': 'scribble',
    'segmentation': 'seg',
    'lineart': 'lineart',
    'normal': 'normal'
  };

  const controlModel = controlNetModels[controlType] || 'canny';

  let imageBuffer;
  if (controlImage.startsWith('data:image')) {
    imageBuffer = Buffer.from(controlImage.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  } else {
    imageBuffer = Buffer.from(controlImage, 'base64');
  }

  const dataUri = `data:image/png;base64,${imageBuffer.toString('base64')}`;

  const predictionResponse = await axios.post(
    'https://api.replicate.com/v1/predictions',
    {
      version: 'controlnet-version-hash-here',
      input: {
        prompt: prompt,
        negative_prompt: params.negativePrompt || getNegativePrompt(params.style),
        image: dataUri,
        control_model: controlModel,
        control_scale: params.controlScale || 1.0,
        width: parseInt(params.width) || 1024,
        height: parseInt(params.height) || 1024,
        num_inference_steps: parseInt(params.steps) || 30,
        guidance_scale: parseFloat(params.guidanceScale) || 7.5
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
  
  const filename = `${uuidv4()}_controlnet_${controlType}.png`;
  const imagePath = path.join(uploadsDir, filename);
  await fs.writeFile(imagePath, Buffer.from(resultResponse.data));

  return {
    url: `/uploads/${filename}`,
    filename: filename,
    provider: 'replicate',
    model: `controlnet-${controlType}`,
    prompt: prompt,
    metadata: {
      controlType: controlType,
      controlScale: params.controlScale || 1.0,
      width: parseInt(params.width) || 1024,
      height: parseInt(params.height) || 1024
    }
  };
}

// ==========================================
// BATCH GENERATION
// ==========================================

async function batchGenerate(prompts, provider, params = {}) {
  const results = [];
  const batchSize = params.batchSize || 4;
  
  // Process in parallel with concurrency limit
  const concurrency = params.concurrency || 2;
  
  for (let i = 0; i < prompts.length; i += concurrency) {
    const batch = prompts.slice(i, i + concurrency);
    const batchPromises = batch.map((prompt, index) => {
      const seed = (params.seed || Math.floor(Math.random() * 999999999)) + i + index;
      
      switch (provider) {
        case 'openai':
          return generateWithOpenAI(prompt, { ...params, seed });
        case 'stability':
          return generateWithStabilityAI(prompt, { ...params, seed });
        case 'replicate':
          return generateWithReplicate(prompt, { ...params, seed });
        case 'huggingface':
        default:
          return generateWithHuggingFace(prompt, { ...params, seed });
      }
    });
    
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults);
  }
  
  return results.map((result, index) => ({
    index: index,
    status: result.status,
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason.message : null
  }));
}

// ==========================================
// STYLE TRANSFER
// ==========================================

async function styleTransfer(contentImageBase64, styleImageBase64, params = {}) {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) {
    throw new Error('Replicate API token not configured');
  }

  let contentBuffer, styleBuffer;
  
  if (contentImageBase64.startsWith('data:image')) {
    contentBuffer = Buffer.from(contentImageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  } else {
    contentBuffer = Buffer.from(contentImageBase64, 'base64');
  }
  
  if (styleImageBase64.startsWith('data:image')) {
    styleBuffer = Buffer.from(styleImageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  } else {
    styleBuffer = Buffer.from(styleImageBase64, 'base64');
  }

  const contentDataUri = `data:image/png;base64,${contentBuffer.toString('base64')}`;
  const styleDataUri = `data:image/png;base64,${styleBuffer.toString('base64')}`;

  const predictionResponse = await axios.post(
    'https://api.replicate.com/v1/predictions',
    {
      version: 'style-transfer-model-version',
      input: {
        content_image: contentDataUri,
        style_image: styleDataUri,
        style_weight: params.styleWeight || 1e4,
        content_weight: params.contentWeight || 1,
        num_steps: params.steps || 300
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
  
  const filename = `${uuidv4()}_style_transfer.png`;
  const imagePath = path.join(uploadsDir, filename);
  await fs.writeFile(imagePath, Buffer.from(resultResponse.data));

  return {
    url: `/uploads/${filename}`,
    filename: filename,
    provider: 'replicate',
    model: 'neural-style-transfer',
    metadata: {
      styleWeight: params.styleWeight || 1e4,
      contentWeight: params.contentWeight || 1,
      steps: params.steps || 300
    }
  };
}

// ==========================================
// FACE ENHANCEMENT
// ==========================================

async function enhanceFaces(imageBase64, params = {}) {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) {
    throw new Error('Replicate API token not configured');
  }

  let imageBuffer;
  if (imageBase64.startsWith('data:image')) {
    imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  } else {
    imageBuffer = Buffer.from(imageBase64, 'base64');
  }

  const dataUri = `data:image/png;base64,${imageBuffer.toString('base64')}`;

  const predictionResponse = await axios.post(
    'https://api.replicate.com/v1/predictions',
    {
      version: 'gfpgan-version-or-codeformer',
      input: {
        image: dataUri,
        upscale: params.upscale || 2,
        face_enhance: true,
        background_enhance: params.backgroundEnhance || false
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
  
  const filename = `${uuidv4()}_face_enhanced.png`;
  const imagePath = path.join(uploadsDir, filename);
  await fs.writeFile(imagePath, Buffer.from(resultResponse.data));

  return {
    url: `/uploads/${filename}`,
    filename: filename,
    provider: 'replicate',
    model: 'gfpgan',
    metadata: {
      upscale: params.upscale || 2,
      faceEnhance: true
    }
  };
}

// ==========================================
// BACKGROUND REMOVAL
// ==========================================

async function removeBackground(imageBase64, params = {}) {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) {
    // Fallback to sharp-based background removal
    return removeBackgroundWithSharp(imageBase64, params);
  }

  let imageBuffer;
  if (imageBase64.startsWith('data:image')) {
    imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  } else {
    imageBuffer = Buffer.from(imageBase64, 'base64');
  }

  const dataUri = `data:image/png;base64,${imageBuffer.toString('base64')}`;

  const predictionResponse = await axios.post(
    'https://api.replicate.com/v1/predictions',
    {
      version: 'rembg-version',
      input: {
        image: dataUri,
        alpha_matting: params.alphaMatting !== false,
        alpha_matting_foreground_threshold: 240,
        alpha_matting_background_threshold: 10,
        alpha_matting_erode_size: 10
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
  
  const filename = `${uuidv4()}_nobg.png`;
  const imagePath = path.join(uploadsDir, filename);
  await fs.writeFile(imagePath, Buffer.from(resultResponse.data));

  return {
    url: `/uploads/${filename}`,
    filename: filename,
    provider: 'replicate',
    model: 'rembg',
    metadata: {
      alphaMatting: params.alphaMatting !== false
    }
  };
}

async function removeBackgroundWithSharp(imageBase64, params = {}) {
  let imageBuffer;
  if (imageBase64.startsWith('data:image')) {
    imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  } else {
    imageBuffer = Buffer.from(imageBase64, 'base64');
  }

  // Simple background removal using edge detection and threshold
  const processed = await sharp(imageBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = processed;
  
  // Create simple mask based on brightness
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (brightness > 240) { // White-ish background
      data[i + 3] = 0; // Set alpha to 0
    }
  }

  const outputBuffer = await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  }).png().toBuffer();

  const filename = `${uuidv4()}_nobg.png`;
  const imagePath = path.join(uploadsDir, filename);
  await fs.writeFile(imagePath, outputBuffer);

  return {
    url: `/uploads/${filename}`,
    filename: filename,
    provider: 'local',
    model: 'sharp-basic',
    metadata: {
      method: 'brightness-threshold',
      note: 'For better results, use Replicate with rembg'
    }
  };
}

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  // Prompt enhancement
  enhancePrompt,
  createPromptVariations,
  getNegativePrompt,
  
  // Text-to-image
  generateWithHuggingFace,
  generateWithOpenAI,
  generateWithStabilityAI,
  generateWithReplicate,
  
  // Image-to-image
  img2imgWithStabilityAI,
  img2imgWithReplicate,
  
  // Inpainting/Outpainting
  inpaintWithStabilityAI,
  outpaintWithStabilityAI,
  
  // Upscaling
  upscaleWithStabilityAI,
  upscaleWithReplicate,
  upscaleWithSharp,
  
  // ControlNet
  generateWithControlNet,
  
  // Batch generation
  batchGenerate,
  
  // Style transfer
  styleTransfer,
  
  // Face enhancement
  enhanceFaces,
  
  // Background removal
  removeBackground,
  removeBackgroundWithSharp,
  
  // Utility
  pollForResult
};
