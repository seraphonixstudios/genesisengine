import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import winston from 'winston';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

dotenv.config();

const execAsync = promisify(exec);
const prisma = new PrismaClient();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests' }
});

const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { error: 'Generation limit: max 3 per minute on local GPU' }
});

interface AuthRequest extends Request {
  user?: { userId: string; email: string; role: string };
}

const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new Error('No token');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ==========================================
// MIDJOURNEY-STYLE PROMPT ENGINEERING
// ==========================================

interface StylePreset {
  id: string;
  name: string;
  prefix: string;
  suffix: string;
  negativePrompt: string;
  sampler: string;
  steps: number;
  cfgScale: number;
}

const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'midjourney-v6',
    name: 'Midjourney V6 Style',
    prefix: 'masterpiece, best quality, ultra-detailed, 8k uhd, professional photography, cinematic lighting, ',
    suffix: ', sharp focus, vibrant colors, extremely detailed, artstation, concept art, smooth, illustration, trending on artstation, unreal engine 5, octane render, 8k',
    negativePrompt: 'low quality, blurry, distorted, deformed, ugly, duplicate, watermark, signature, text, logo, cropped, worst quality, jpeg artifacts, error, mutation, extra limbs, bad anatomy, disfigured, poorly drawn face, bad proportions, gross proportions, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, cross-eyed',
    sampler: 'DPM++ 2M Karras',
    steps: 40,
    cfgScale: 7.5
  },
  {
    id: 'photorealistic',
    name: 'Photorealistic',
    prefix: 'photorealistic, professional photography, 8k uhd, raw photo, ',
    suffix: ', shot on Canon EOS R5, 85mm lens, f/1.8, sharp focus, natural lighting, detailed texture, realistic skin texture, hyperrealistic, award winning photography, national geographic',
    negativePrompt: 'painting, drawing, illustration, cartoon, anime, 3d render, sketch, low quality, blurry, artificial, deformed, ugly, duplicate',
    sampler: 'DPM++ 2M Karras',
    steps: 35,
    cfgScale: 7
  },
  {
    id: 'digital-art',
    name: 'Digital Art',
    prefix: 'digital art, trending on artstation, highly detailed, ',
    suffix: ', art by greg rutkowski and alphonse mucha and artgerm, sharp focus, vivid colors, dramatic lighting, illustration, concept art, wlop, rossdraws',
    negativePrompt: 'photo, photorealistic, 3d render, blurry, low quality, amateur, watermark, signature, text',
    sampler: 'Euler a',
    steps: 30,
    cfgScale: 8
  },
  {
    id: 'anime',
    name: 'Anime Style',
    prefix: 'anime style, manga, studio ghibli, ',
    suffix: ', beautiful detailed eyes, vibrant colors, cel shading, art by makoto shinkai and hayao miyazaki and katsuhiro otomo, kyoto animation, detailed background, masterpiece',
    negativePrompt: 'photo, photorealistic, 3d render, western cartoon, blurry, low quality, bad anatomy, bad hands',
    sampler: 'Euler a',
    steps: 28,
    cfgScale: 7.5
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    prefix: 'cyberpunk, neon lights, futuristic, sci-fi, ',
    suffix: ', blade runner style, neon colors, high tech, dystopian, highly detailed, 8k, volumetric lighting, ray tracing, unreal engine 5, cinematic composition',
    negativePrompt: 'natural, organic, low tech, blurry, low quality, amateur, medieval, fantasy',
    sampler: 'DPM++ 2M Karras',
    steps: 35,
    cfgScale: 8
  },
  {
    id: 'fantasy',
    name: 'Fantasy Art',
    prefix: 'fantasy art, magical, ethereal, ',
    suffix: ', epic scene, dramatic lighting, art by boris vallejo and frank frazetta and justin gerard, intricate details, mystical atmosphere, dnd, lord of the rings, magic the gathering',
    negativePrompt: 'modern, urban, photorealistic, blurry, low quality, sci-fi, technology',
    sampler: 'DPM++ 2M Karras',
    steps: 35,
    cfgScale: 7.5
  },
  {
    id: 'oil-painting',
    name: 'Oil Painting',
    prefix: 'oil painting, classical art, renaissance style, ',
    suffix: ', masterpiece, baroque, by rembrandt and leonardo da vinci and johannes vermeer, rich colors, visible brushstrokes, museum quality, fine art',
    negativePrompt: 'photo, digital art, modern, blurry, low quality, cartoon, anime',
    sampler: 'Euler a',
    steps: 40,
    cfgScale: 7
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    prefix: 'minimalist, clean design, simple, elegant, ',
    suffix: ', geometric, flat colors, modern design, negative space, sophisticated, scandinavian design, bauhaus, contemporary art',
    negativePrompt: 'cluttered, complex, messy, ornate, busy, low quality, detailed, realistic',
    sampler: 'Euler',
    steps: 25,
    cfgScale: 6.5
  }
];

// ==========================================
// STABLE DIFFUSION LOCAL INTEGRATION
// ==========================================

interface SDConfig {
  modelPath: string;
  vaePath?: string;
  sampler: string;
  steps: number;
  cfgScale: number;
  width: number;
  height: number;
  seed?: number;
}

class StableDiffusionManager {
  private sdPath: string;
  private modelsPath: string;
  private outputPath: string;
  private isReady: boolean = false;
  private currentProcess: any = null;

  constructor() {
    this.sdPath = path.join(__dirname, '../stable-diffusion');
    this.modelsPath = path.join(this.sdPath, 'models/Stable-diffusion');
    this.outputPath = path.join(__dirname, '../outputs');
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    await fs.mkdir(this.modelsPath, { recursive: true });
    await fs.mkdir(this.outputPath, { recursive: true });
    await fs.mkdir(path.join(__dirname, '../uploads'), { recursive: true });
  }

  async checkSystem(): Promise<{ cuda: boolean; python: boolean; pip: boolean }> {
    const results = { cuda: false, python: false, pip: false };
    
    try {
      await execAsync('python --version');
      results.python = true;
    } catch {
      try {
        await execAsync('python3 --version');
        results.python = true;
      } catch {}
    }

    try {
      await execAsync('pip --version');
      results.pip = true;
    } catch {}

    try {
      await execAsync('nvidia-smi');
      results.cuda = true;
    } catch {}

    return results;
  }

  async installStableDiffusion(): Promise<boolean> {
    try {
      logger.info('Installing Stable Diffusion WebUI...');
      
      const installScript = `
import os
import subprocess
import sys

def install():
    sd_path = '${this.sdPath.replace(/\\/g, '\\')}\\stable-diffusion-webui'
    
    if os.path.exists(sd_path):
        print('Stable Diffusion WebUI already installed')
        return True
    
    parent_dir = os.path.dirname(sd_path)
    os.makedirs(parent_dir, exist_ok=True)
    os.chdir(parent_dir)
    
    # Clone webui
    subprocess.run([
        'git', 'clone', 'https://github.com/AUTOMATIC1111/stable-diffusion-webui.git'
    ], check=True)
    
    os.chdir(sd_path)
    
    # Install dependencies
    if sys.platform == 'win32':
        subprocess.run(['pip', 'install', '-r', 'requirements.txt'], check=True)
    
    return True

if __name__ == '__main__':
    install()
`;
      
      await fs.writeFile(path.join(__dirname, '../scripts/install_sd.py'), installScript);
      
      logger.info('Running installation script...');
      const { stdout, stderr } = await execAsync('python scripts/install_sd.py');
      logger.info('Installation output:', stdout);
      
      if (stderr) logger.warn('Installation warnings:', stderr);
      
      return true;
    } catch (error: any) {
      logger.error('Failed to install Stable Diffusion:', error);
      return false;
    }
  }

  async downloadModel(modelUrl: string, modelName: string): Promise<boolean> {
    try {
      logger.info(`Downloading model: ${modelName}`);
      
      const downloadScript = `
import urllib.request
import os
import sys

url = '${modelUrl}'
output_path = '${path.join(this.modelsPath, modelName).replace(/\\/g, '\\')}'

def download():
    print(f'Downloading from {url}...')
    urllib.request.urlretrieve(url, output_path)
    print(f'Saved to {output_path}')
    return True

if __name__ == '__main__':
    download()
`;
      
      await fs.writeFile(path.join(__dirname, '../scripts/download_model.py'), downloadScript);
      await execAsync('python scripts/download_model.py');
      
      logger.info(`Model downloaded: ${modelName}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to download model ${modelName}:`, error);
      return false;
    }
  }

  getAvailableModels(): string[] {
    try {
      if (!fs.existsSync(this.modelsPath)) return [];
      const files = fs.readdirSync(this.modelsPath);
      return files.filter(f => f.endsWith('.safetensors') || f.endsWith('.ckpt'));
    } catch {
      return [];
    }
  }

  async generateImage(
    prompt: string,
    negativePrompt: string,
    config: SDConfig,
    outputFilename: string
  ): Promise<string | null> {
    try {
      const outputPath = path.join(this.outputPath, outputFilename);
      
      // Create generation script
      const generationScript = `
import torch
from diffusers import StableDiffusionXLPipeline, DPMSolverMultistepScheduler
from PIL import Image
import json

# Load model
model_id = "stabilityai/stable-diffusion-xl-base-1.0"
pipe = StableDiffusionXLPipeline.from_pretrained(
    model_id,
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    use_safetensors=True
)

if torch.cuda.is_available():
    pipe = pipe.to("cuda")
    pipe.enable_xformers_memory_efficient_attention()

# Configure scheduler
pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)

# Generate
image = pipe(
    prompt="${prompt}",
    negative_prompt="${negativePrompt}",
    num_inference_steps=${config.steps},
    guidance_scale=${config.cfgScale},
    width=${config.width},
    height=${config.height},
    ${config.seed ? `generator=torch.Generator("cuda" if torch.cuda.is_available() else "cpu").manual_seed(${config.seed}),` : ''}
).images[0]

# Save
image.save("${outputPath.replace(/\\/g, '\\')}")
print(f"Image saved to ${outputPath.replace(/\\/g, '\\')}")
`;

      const scriptPath = path.join(__dirname, '../scripts/generate.py');
      await fs.writeFile(scriptPath, generationScript);
      
      logger.info('Starting image generation...');
      const startTime = Date.now();
      
      await execAsync('python scripts/generate.py');
      
      const duration = (Date.now() - startTime) / 1000;
      logger.info(`Generation complete in ${duration}s`);
      
      return outputPath;
    } catch (error: any) {
      logger.error('Generation failed:', error);
      return null;
    }
  }

  // Fallback: Use API mode if local SD not available
  async generateViaAPI(
    prompt: string,
    negativePrompt: string,
    config: SDConfig
  ): Promise<string | null> {
    try {
      // This would connect to a local ComfyUI or WebUI API
      // For now, we'll use a simple fetch to localhost:7860 (AUTOMATIC1111 default)
      
      const payload = {
        prompt: prompt,
        negative_prompt: negativePrompt,
        steps: config.steps,
        cfg_scale: config.cfgScale,
        width: config.width,
        height: config.height,
        sampler_index: config.sampler,
        seed: config.seed || -1,
        batch_size: 1,
        n_iter: 1,
      };

      const response = await fetch('http://localhost:7860/sdapi/v1/txt2img', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Local SD API not available');
      }

      const data = await response.json();
      
      // Save base64 image
      if (data.images && data.images[0]) {
        const base64Data = data.images[0].replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const outputPath = path.join(this.outputPath, `generated-${Date.now()}.png`);
        await fs.writeFile(outputPath, buffer);
        return outputPath;
      }
      
      return null;
    } catch (error: any) {
      logger.error('API generation failed:', error);
      return null;
    }
  }
}

const sdManager = new StableDiffusionManager();

// ==========================================
// AUTH ROUTES
// ==========================================

app.get('/health', async (req: Request, res: Response) => {
  const systemStatus = await sdManager.checkSystem();
  const models = sdManager.getAvailableModels();
  
  res.json({
    status: 'healthy',
    version: '5.0.0',
    standalone: true,
    system: systemStatus,
    models: {
      count: models.length,
      list: models
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/system/status', async (req: Request, res: Response) => {
  const status = await sdManager.checkSystem();
  const models = sdManager.getAvailableModels();
  
  res.json({
    ready: models.length > 0,
    python: status.python,
    cuda: status.cuda,
    models: models,
    installNeeded: !status.python || models.length === 0
  });
});

app.post('/api/system/install', async (req: Request, res: Response) => {
  const success = await sdManager.installStableDiffusion();
  res.json({ success, message: success ? 'Installation started' : 'Installation failed' });
});

app.post('/api/models/download', async (req: Request, res: Response) => {
  const { url, name } = req.body;
  const success = await sdManager.downloadModel(url, name);
  res.json({ success, message: success ? 'Download started' : 'Download failed' });
});

app.get('/api/models', (req: Request, res: Response) => {
  const models = sdManager.getAvailableModels();
  res.json({
    available: models,
    recommended: [
      { name: 'SDXL Base', url: 'https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors', size: '6.9 GB' },
      { name: 'RealVisXL', url: 'https://huggingface.co/SG161222/RealVisXL_V4.0/resolve/main/RealVisXL_V4.0.safetensors', size: '6.9 GB' },
      { name: 'Juggernaut XL', url: 'https://huggingface.co/RunDiffusion/Juggernaut-XL-v9/resolve/main/Juggernaut-XL-v9.safetensors', size: '6.9 GB' },
    ]
  });
});

// Style presets
app.get('/api/styles', (req: Request, res: Response) => {
  res.json(STYLE_PRESETS.map(s => ({
    id: s.id,
    name: s.name,
    steps: s.steps,
    cfgScale: s.cfgScale,
    sampler: s.sampler
  })));
});

// Auth
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2)
    });

    const data = schema.parse(req.body);
    
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: data.email,
        password: hashedPassword,
        name: data.name,
        credits: 100,
      }
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, credits: user.credits, plan: user.plan },
      token
    });
  } catch (error: any) {
    logger.error('Register error:', error);
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    res.json({
      user: { id: user.id, email: user.email, name: user.name, credits: user.credits, plan: user.plan },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, name: true, credits: true, plan: true, role: true }
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Generation
app.post('/api/generate', authenticate, generateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      prompt: z.string().min(1).max(4000),
      negativePrompt: z.string().max(1000).optional(),
      stylePreset: z.string().default('midjourney-v6'),
      width: z.number().int().min(512).max(2048).default(1024),
      height: z.number().int().min(512).max(2048).default(1024),
      seed: z.number().optional(),
    });

    const data = schema.parse(req.body);
    const userId = req.user!.userId;

    // Check credits
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.credits < 1) {
      return res.status(403).json({ error: 'Insufficient credits' });
    }

    // Get style preset
    const style = STYLE_PRESETS.find(s => s.id === data.stylePreset) || STYLE_PRESETS[0];
    
    // Enhance prompt
    const enhancedPrompt = `${style.prefix}${data.prompt}${style.suffix}`;
    const finalNegativePrompt = data.negativePrompt || style.negativePrompt;

    // Create generation record
    const generation = await prisma.generation.create({
      data: {
        id: uuidv4(),
        userId,
        prompt: data.prompt,
        negativePrompt: finalNegativePrompt,
        model: 'local-sdxl',
        width: data.width,
        height: data.height,
        steps: style.steps,
        guidanceScale: style.cfgScale,
        stylePreset: data.stylePreset,
        status: 'PROCESSING',
      }
    });

    // Deduct credits
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: 1 } }
    });

    res.json({
      generationId: generation.id,
      status: 'PROCESSING',
      enhancedPrompt,
      message: 'Generation started on local GPU'
    });

    // Generate in background
    const config: SDConfig = {
      modelPath: '',
      sampler: style.sampler,
      steps: style.steps,
      cfgScale: style.cfgScale,
      width: data.width,
      height: data.height,
      seed: data.seed,
    };

    try {
      const outputPath = await sdManager.generateImage(
        enhancedPrompt,
        finalNegativePrompt,
        config,
        `${generation.id}.png`
      );

      if (!outputPath) {
        // Try API mode
        const apiPath = await sdManager.generateViaAPI(
          enhancedPrompt,
          finalNegativePrompt,
          config
        );
        
        if (apiPath) {
          await prisma.generation.update({
            where: { id: generation.id },
            data: { status: 'COMPLETED', url: `/outputs/${generation.id}.png` }
          });
        } else {
          throw new Error('Generation failed');
        }
      } else {
        await prisma.generation.update({
          where: { id: generation.id },
          data: { status: 'COMPLETED', url: `/outputs/${generation.id}.png` }
        });
      }
    } catch (error: any) {
      logger.error('Generation failed:', error);
      await prisma.generation.update({
        where: { id: generation.id },
        data: { status: 'FAILED', error: error.message }
      });
    }
  } catch (error: any) {
    logger.error('Generate error:', error);
    res.status(500).json({ error: error.message || 'Generation failed' });
  }
});

// Get generations
app.get('/api/generations', authenticate, async (req: AuthRequest, res: Response) => {
  const generations = await prisma.generation.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  res.json(generations);
});

app.get('/api/generations/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const generation = await prisma.generation.findFirst({
    where: { id: req.params.id, userId: req.user!.userId }
  });
  if (!generation) return res.status(404).json({ error: 'Not found' });
  res.json(generation);
});

// Serve static files
app.use('/outputs', express.static(path.join(__dirname, '../outputs')));

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`🎨 Standalone AI Image Generator running on http://localhost:${PORT}`);
  logger.info(`✨ Features: Midjourney-style quality, Local GPU, No external APIs needed`);
  logger.info(`📦 Note: Requires Python, PyTorch, and Stable Diffusion models`);
});
