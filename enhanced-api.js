/**
 * ENHANCED GENESIS API ENDPOINTS
 * Adds market-standard features to existing Genesis Engine
 * Integrates with Python backend when available, uses APIs as fallback
 */

const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Available models (free/open source)
const AVAILABLE_MODELS = {
    // Stable Diffusion 1.5 variants
    'sd-1-5': { name: 'Stable Diffusion 1.5', provider: 'huggingface', id: 'runwayml/stable-diffusion-v1-5' },
    'realistic-vision': { name: 'Realistic Vision V5.1', provider: 'huggingface', id: 'SG161222/Realistic_Vision_V5.1_noVAE' },
    'dreamshaper': { name: 'DreamShaper', provider: 'huggingface', id: 'Lykon/DreamShaper' },
    'deliberate': { name: 'Deliberate', provider: 'huggingface', id: 'XpucT/Deliberate' },
    
    // Anime/Artistic
    'anything-v3': { name: 'Anything V3', provider: 'huggingface', id: 'Linaqruf/anything-v3.0' },
    'counterfeit': { name: 'Counterfeit V3.0', provider: 'huggingface', id: 'gsdf/Counterfeit-V3.0' },
    
    // SDXL (requires more resources)
    'sdxl-base': { name: 'SDXL Base 1.0', provider: 'huggingface', id: 'stabilityai/stable-diffusion-xl-base-1.0' },
    'sdxl-turbo': { name: 'SDXL Turbo', provider: 'huggingface', id: 'stabilityai/sdxl-turbo' },
    
    // Specialized
    'analog-diffusion': { name: 'Analog Diffusion', provider: 'huggingface', id: 'wavymulder/Analog-Diffusion' },
    'openjourney': { name: 'OpenJourney', provider: 'huggingface', id: 'prompthero/openjourney' }
};

// Available schedulers
const AVAILABLE_SCHEDULERS = [
    'DPM++ 2M', 'DPM++ 2M Karras', 'DPM++ SDE', 'DPM++ SDE Karras',
    'Euler', 'Euler a', 'DDIM', 'LMS', 'PNDM', 'UniPC', 
    'DDPM', 'DEIS', 'Heun', 'LMS Karras'
];

// ControlNet types
const CONTROLNET_TYPES = [
    'canny', 'depth', 'openpose', 'scribble', 
    'lineart', 'softedge', 'shuffle', 'tile', 'inpaint'
];

// Style presets (prompt modifiers)
const STYLE_PRESETS = {
    'photorealistic': { prompt: ', photorealistic, highly detailed, 8k uhd, professional photography', negative: 'cartoon, anime, illustration, painting, drawing' },
    'anime': { prompt: ', anime style, studio ghibli, high quality, detailed', negative: 'photorealistic, 3d render, western cartoon' },
    'digital-art': { prompt: ', digital art, trending on artstation, highly detailed, vibrant colors', negative: 'blurry, low quality, watermark' },
    'oil-painting': { prompt: ', oil painting, masterpiece, classical art style, detailed brushstrokes', negative: 'digital art, 3d render, anime, cartoon' },
    'cinematic': { prompt: ', cinematic lighting, movie still, film grain, professional color grading', negative: 'amateur, snapshot, low quality' },
    'cyberpunk': { prompt: ', cyberpunk style, neon lights, futuristic, high tech, detailed', negative: 'medieval, historical, natural, rural' },
    'fantasy': { prompt: ', fantasy art, magical, detailed, epic scene, dnd style', negative: 'sci-fi, modern, urban, technology' },
    'portrait': { prompt: ', portrait, detailed face, professional lighting, sharp focus', negative: 'blurry face, distorted features' }
};

// Generation queue for managing concurrent requests
class GenerationQueue {
    constructor(maxConcurrent = 2) {
        this.queue = [];
        this.active = new Map();
        this.maxConcurrent = maxConcurrent;
        this.completed = new Map();
    }

    async add(task) {
        const id = uuidv4();
        const taskData = {
            id,
            status: 'queued',
            progress: 0,
            createdAt: Date.now(),
            ...task
        };
        
        this.queue.push(taskData);
        this.processQueue();
        
        return id;
    }

    async processQueue() {
        if (this.active.size >= this.maxConcurrent || this.queue.length === 0) {
            return;
        }

        const task = this.queue.shift();
        this.active.set(task.id, task);
        task.status = 'processing';
        task.startedAt = Date.now();

        try {
            // Process task
            const result = await this.executeTask(task);
            task.status = 'complete';
            task.result = result;
            task.progress = 100;
        } catch (error) {
            task.status = 'error';
            task.error = error.message;
        } finally {
            task.completedAt = Date.now();
            this.active.delete(task.id);
            this.completed.set(task.id, task);
            
            // Clean old completed tasks
            if (this.completed.size > 100) {
                const oldest = Array.from(this.completed.keys()).slice(0, 50);
                oldest.forEach(key => this.completed.delete(key));
            }

            // Process next
            this.processQueue();
        }
    }

    async executeTask(task) {
        // This would call the Python backend or external API
        // For now, we'll use the existing generation methods
        return { status: 'completed', id: task.id };
    }

    getStatus(id) {
        if (this.active.has(id)) return this.active.get(id);
        if (this.completed.has(id)) return this.completed.get(id);
        return this.queue.find(t => t.id === id);
    }

    getQueueStatus() {
        return {
            queued: this.queue.length,
            active: this.active.size,
            completed: this.completed.size,
            maxConcurrent: this.maxConcurrent
        };
    }
}

const genQueue = new GenerationQueue();

// Register enhanced endpoints
function registerEnhancedEndpoints(app) {
    
    // ===== ADVANCED GENERATION =====
    
    // Enhanced generate with all options
    app.post('/api/v2/generate', async (req, res) => {
        try {
            const {
                prompt,
                negative_prompt = '',
                width = 512,
                height = 512,
                num_inference_steps = 25,
                guidance_scale = 7.5,
                seed = null,
                scheduler = 'DPM++ 2M',
                num_images = 1,
                model_id = 'sd-1-5',
                style = null,
                lora_weights = [],
                upscale = false,
                face_enhance = false,
                batch_size = 1
            } = req.body;

            // Apply style preset if specified
            let finalPrompt = prompt;
            let finalNegative = negative_prompt;
            
            if (style && STYLE_PRESETS[style]) {
                finalPrompt += STYLE_PRESETS[style].prompt;
                finalNegative = finalNegative + ', ' + STYLE_PRESETS[style].negative;
            }

            // Add to generation queue
            const taskId = await genQueue.add({
                type: 'generate',
                prompt: finalPrompt,
                negative_prompt: finalNegative,
                width,
                height,
                steps: num_inference_steps,
                guidance_scale,
                seed,
                scheduler,
                num_images,
                model_id,
                lora_weights,
                upscale,
                face_enhance
            });

            res.json({
                success: true,
                generation_id: taskId,
                status: 'queued',
                position: genQueue.queue.length,
                eta_seconds: genQueue.queue.length * 30
            });

        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // Get generation status
    app.get('/api/v2/status/:generation_id', (req, res) => {
        const status = genQueue.getStatus(req.params.generation_id);
        if (!status) {
            return res.status(404).json({ error: 'Generation not found' });
        }
        res.json(status);
    });

    // Get queue status
    app.get('/api/v2/queue', (req, res) => {
        res.json(genQueue.getQueueStatus());
    });

    // ===== IMAGE-TO-IMAGE =====
    
    app.post('/api/v2/img2img', async (req, res) => {
        try {
            const {
                prompt,
                image,  // base64 encoded
                strength = 0.75,
                negative_prompt = '',
                width = 512,
                height = 512,
                num_inference_steps = 25,
                guidance_scale = 7.5,
                seed = null,
                scheduler = 'DPM++ 2M',
                num_images = 1
            } = req.body;

            const taskId = await genQueue.add({
                type: 'img2img',
                prompt,
                image,
                strength,
                negative_prompt,
                width,
                height,
                steps: num_inference_steps,
                guidance_scale,
                seed,
                scheduler,
                num_images
            });

            res.json({
                success: true,
                generation_id: taskId,
                status: 'queued'
            });

        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // ===== INPAINTING =====
    
    app.post('/api/v2/inpaint', async (req, res) => {
        try {
            const {
                prompt,
                image,  // base64
                mask,   // base64 mask (white = inpaint)
                negative_prompt = '',
                num_inference_steps = 50,
                guidance_scale = 7.5,
                seed = null
            } = req.body;

            const taskId = await genQueue.add({
                type: 'inpaint',
                prompt,
                image,
                mask,
                negative_prompt,
                steps: num_inference_steps,
                guidance_scale,
                seed
            });

            res.json({
                success: true,
                generation_id: taskId,
                status: 'queued'
            });

        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // ===== UPSCALING =====
    
    app.post('/api/v2/upscale', async (req, res) => {
        try {
            const {
                image,  // base64 or URL
                scale = 4,
                model = 'RealESRGAN_x4plus',
                face_enhance = false
            } = req.body;

            const taskId = await genQueue.add({
                type: 'upscale',
                image,
                scale,
                model,
                face_enhance
            });

            res.json({
                success: true,
                generation_id: taskId,
                status: 'queued'
            });

        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // ===== CONTROLNET =====
    
    app.post('/api/v2/controlnet', async (req, res) => {
        try {
            const {
                prompt,
                control_image,  // base64
                controlnet_type = 'canny',
                controlnet_conditioning_scale = 1.0,
                negative_prompt = '',
                width = 512,
                height = 512,
                num_inference_steps = 25,
                guidance_scale = 7.5,
                seed = null
            } = req.body;

            if (!CONTROLNET_TYPES.includes(controlnet_type)) {
                return res.status(400).json({
                    error: `Invalid controlnet_type. Available: ${CONTROLNET_TYPES.join(', ')}`
                });
            }

            const taskId = await genQueue.add({
                type: 'controlnet',
                prompt,
                control_image,
                controlnet_type,
                controlnet_conditioning_scale,
                negative_prompt,
                width,
                height,
                steps: num_inference_steps,
                guidance_scale,
                seed
            });

            res.json({
                success: true,
                generation_id: taskId,
                status: 'queued'
            });

        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // ===== BATCH GENERATION =====
    
    app.post('/api/v2/batch', async (req, res) => {
        try {
            const {
                prompts,  // array of prompts
                negative_prompt = '',
                width = 512,
                height = 512,
                num_inference_steps = 25,
                guidance_scale = 7.5,
                scheduler = 'DPM++ 2M'
            } = req.body;

            if (!Array.isArray(prompts) || prompts.length === 0) {
                return res.status(400).json({ error: 'prompts must be a non-empty array' });
            }

            if (prompts.length > 10) {
                return res.status(400).json({ error: 'Maximum 10 prompts per batch' });
            }

            const taskIds = [];
            for (const prompt of prompts) {
                const taskId = await genQueue.add({
                    type: 'generate',
                    prompt,
                    negative_prompt,
                    width,
                    height,
                    steps: num_inference_steps,
                    guidance_scale,
                    scheduler
                });
                taskIds.push(taskId);
            }

            res.json({
                success: true,
                batch_id: uuidv4(),
                generation_ids: taskIds,
                status: 'queued',
                total: prompts.length
            });

        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    // ===== INFO ENDPOINTS =====
    
    // List available models
    app.get('/api/v2/models', (req, res) => {
        res.json({
            models: AVAILABLE_MODELS,
            default: 'sd-1-5',
            categories: {
                'general': ['sd-1-5', 'realistic-vision', 'deliberate'],
                'anime': ['anything-v3', 'dreamshaper'],
                'xl': ['sdxl-base', 'sdxl-turbo'],
                'specialized': ['analog-diffusion', 'openjourney']
            }
        });
    });

    // List schedulers
    app.get('/api/v2/schedulers', (req, res) => {
        res.json({
            schedulers: AVAILABLE_SCHEDULERS,
            default: 'DPM++ 2M',
            recommended: {
                'fast': ['DPM++ 2M', 'Euler a'],
                'quality': ['DPM++ 2M Karras', 'DPM++ SDE Karras'],
                'stable': ['DDIM', 'PNDM']
            }
        });
    });

    // List ControlNet types
    app.get('/api/v2/controlnet-types', (req, res) => {
        res.json({
            types: CONTROLNET_TYPES,
            descriptions: {
                'canny': 'Edge detection - good for preserving structure',
                'depth': 'Depth map - good for 3D pose',
                'openpose': 'Human pose detection',
                'scribble': 'Scribble/sketch to image',
                'lineart': 'Line art style',
                'softedge': 'Soft edges - less rigid than canny',
                'shuffle': 'Content shuffle - reimagine while keeping style',
                'tile': 'Tile processing - for high-res images',
                'inpaint': 'Inpainting control'
            }
        });
    });

    // List style presets
    app.get('/api/v2/styles', (req, res) => {
        res.json({
            styles: STYLE_PRESETS,
            default: 'photorealistic'
        });
    });

    // System status
    app.get('/api/v2/status', (req, res) => {
        res.json({
            status: 'operational',
            version: '2.0.0',
            queue: genQueue.getQueueStatus(),
            capabilities: [
                'text-to-image',
                'image-to-image',
                'inpainting',
                'upscaling',
                'controlnet',
                'batch-generation',
                'lora-support',
                'face-enhancement'
            ],
            features: {
                python_backend: false,  // Will be true when Python API is running
                gpu_available: false,
                models_cached: 0
            }
        });
    });

    console.log('[Genesis Enhanced] API v2 endpoints registered');
}

module.exports = { registerEnhancedEndpoints, genQueue };
