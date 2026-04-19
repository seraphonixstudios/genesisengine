import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './styles/neural-art-complete.css';
import './styles/premium-enhancements.css';
import { io, Socket } from 'socket.io-client';

// ==========================================
// API CONFIGURATION
// ==========================================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ==========================================
// TYPES
// ==========================================
interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  plan: string;
}

interface GenerationResult {
  url: string;
  filename: string;
  provider: string;
  model: string;
  prompt: string;
  metadata: {
    width: number;
    height: number;
    steps: number;
    guidanceScale: number;
    seed: number;
  };
}

interface GenerationJob {
  id: string;
  type: 'single' | 'batch' | 'variations' | 'img2img' | 'inpaint' | 'upscale';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: GenerationResult | GenerationResult[];
  error?: string;
  prompt: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// ==========================================
// CONSTANTS
// ==========================================
const ASPECT_RATIOS = [
  { id: '1:1', width: 1024, height: 1024, label: '1:1', description: 'Square' },
  { id: '4:3', width: 1024, height: 768, label: '4:3', description: 'Standard' },
  { id: '3:4', width: 768, height: 1024, label: '3:4', description: 'Portrait' },
  { id: '16:9', width: 1024, height: 576, label: '16:9', description: 'Widescreen' },
  { id: '9:16', width: 576, height: 1024, label: '9:16', description: 'Mobile' },
  { id: '21:9', width: 1024, height: 440, label: '21:9', description: 'Ultrawide' }
];

const STYLE_PRESETS = [
  { id: 'photorealistic', name: 'Photorealistic', icon: '📸', description: 'Realistic photography' },
  { id: 'digital-art', name: 'Digital Art', icon: '🎨', description: 'ArtStation trending' },
  { id: 'anime', name: 'Anime', icon: '🎌', description: 'Anime/manga style' },
  { id: 'cinematic', name: 'Cinematic', icon: '🎬', description: 'Movie still quality' },
  { id: 'oil-painting', name: 'Oil Painting', icon: '🖼️', description: 'Classical painting' },
  { id: '3d-render', name: '3D Render', icon: '🎲', description: 'Octane/Unreal Engine' },
  { id: 'fantasy', name: 'Fantasy', icon: '🐉', description: 'Epic magical scenes' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: '🌃', description: 'Neon futuristic' }
];

const QUALITY_LEVELS = [
  { id: 'fast', name: 'Fast', steps: 20, description: 'Quick preview (~10s)' },
  { id: 'standard', name: 'Standard', steps: 30, description: 'Good quality (~20s)' },
  { id: 'high', name: 'High', steps: 40, description: 'Better quality (~30s)' },
  { id: 'ultra', name: 'Ultra', steps: 50, description: 'Best quality (~45s)' }
];

const PROVIDERS = [
  { id: 'huggingface', name: 'Hugging Face', free: true, models: ['stabilityai/stable-diffusion-xl-base-1.0', 'runwayml/stable-diffusion-v1-5'] },
  { id: 'stability', name: 'Stability AI', free: false, models: ['stable-diffusion-xl-1024-v1-0'] },
  { id: 'openai', name: 'OpenAI', free: false, models: ['dall-e-3', 'dall-e-2'] },
  { id: 'replicate', name: 'Replicate', free: true, models: ['stability-ai/sdxl', 'tstramer/midjourney-diffusion'] }
];

const CONTROL_TYPES = [
  { id: 'canny', name: 'Canny Edge', description: 'Edge detection control' },
  { id: 'pose', name: 'OpenPose', description: 'Human pose control' },
  { id: 'depth', name: 'Depth Map', description: 'Depth-based control' },
  { id: 'scribble', name: 'Scribble', description: 'Sketch-based control' }
];

// ==========================================
// HOOKS
// ==========================================
function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(API_URL, {
      transports: ['websocket'],
      reconnection: true
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return { socket, connected };
}

// ==========================================
// COMPONENTS
// ==========================================
function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`toast toast-${toast.type}`}
            role="alert"
            aria-live="polite"
          >
            <span className="toast-icon">
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'warning' && '⚠'}
              {toast.type === 'info' && 'ℹ'}
            </span>
            <span className="toast-message">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="toast-close" aria-label="Dismiss">
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ProgressBar({ progress, label, status }: { progress: number; label?: string; status?: string }) {
  return (
    <div className="progress-container" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-track">
        <motion.div 
          className={`progress-fill ${status}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <span className="progress-text">{Math.round(progress)}% {status && `(${status})`}</span>
    </div>
  );
}

function LoadingSpinner({ size = 'medium', label = 'Loading' }: { size?: 'small' | 'medium' | 'large'; label?: string }) {
  return (
    <div className={`spinner spinner-${size}`} role="status" aria-label={label}>
      <div className="spinner-ring"></div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

// ==========================================
// GENERATOR MODES
// ==========================================

type GenerationMode = 'txt2img' | 'img2img' | 'inpaint' | 'outpaint' | 'upscale' | 'controlnet' | 'batch';

interface GeneratorState {
  mode: GenerationMode;
  prompt: string;
  negativePrompt: string;
  style: string;
  provider: string;
  model: string;
  aspectRatio: typeof ASPECT_RATIOS[0];
  quality: typeof QUALITY_LEVELS[0];
  guidanceScale: number;
  seed: number | null;
  enhancePrompt: boolean;
  variations: boolean;
  variationCount: number;
  
  // Img2Img specific
  uploadedImage: string | null;
  strength: number;
  preserveStructure: boolean;
  
  // Inpaint specific
  maskImage: string | null;
  
  // Upscale specific
  upscaleFactor: number;
  faceEnhance: boolean;
  
  // ControlNet specific
  controlImage: string | null;
  controlType: string;
  controlScale: number;
  
  // Batch specific
  batchPrompts: string[];
}

// ==========================================
// MAIN GENERATOR COMPONENT
// ==========================================
function AIImageGenerator() {
  // State
  const [state, setState] = useState<GeneratorState>({
    mode: 'txt2img',
    prompt: '',
    negativePrompt: '',
    style: 'digital-art',
    provider: 'huggingface',
    model: 'stabilityai/stable-diffusion-xl-base-1.0',
    aspectRatio: ASPECT_RATIOS[0],
    quality: QUALITY_LEVELS[2],
    guidanceScale: 7.5,
    seed: null,
    enhancePrompt: true,
    variations: false,
    variationCount: 4,
    uploadedImage: null,
    strength: 0.7,
    preserveStructure: true,
    maskImage: null,
    upscaleFactor: 2,
    faceEnhance: false,
    controlImage: null,
    controlType: 'canny',
    controlScale: 1.0,
    batchPrompts: ['', '', '', '']
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [activeJobs, setActiveJobs] = useState<GenerationJob[]>([]);
  const [gallery, setGallery] = useState<GenerationResult[]>([]);
  
  const { toasts, addToast, removeToast } = useToast();
  const { socket, connected } = useSocket();
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to WebSocket updates
  useEffect(() => {
    if (!socket) return;

    socket.on('generation-progress', (data: any) => {
      setProgress(data.progress);
      setActiveJobs(prev => 
        prev.map(job => 
          job.id === data.jobId 
            ? { ...job, progress: data.progress, status: data.status }
            : job
        )
      );
    });

    socket.on('generation-complete', (data: any) => {
      addToast('Generation complete!', 'success');
      setIsGenerating(false);
      setProgress(100);
      
      if (data.result) {
        setResults(prev => [data.result, ...prev]);
        setGallery(prev => [data.result, ...prev]);
      }
    });

    socket.on('generation-failed', (data: any) => {
      addToast(`Generation failed: ${data.error}`, 'error');
      setIsGenerating(false);
    });

    return () => {
      socket.off('generation-progress');
      socket.off('generation-complete');
      socket.off('generation-failed');
    };
  }, [socket, addToast]);

  // Update state helper
  const updateState = useCallback((updates: Partial<GeneratorState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle prompt enhancement
  const handleEnhancePrompt = async () => {
    if (!state.prompt.trim()) {
      addToast('Please enter a prompt first', 'warning');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/generate/enhance-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: state.prompt,
          style: state.style,
          quality: state.quality.id,
          variations: false
        })
      });

      if (!response.ok) throw new Error('Enhancement failed');

      const data = await response.json();
      setEnhancedPrompt(data.enhancedPrompt);
      
      // Update negative prompt if empty
      if (!state.negativePrompt && data.negativePrompt) {
        updateState({ negativePrompt: data.negativePrompt });
      }
      
      addToast('Prompt enhanced with AI!', 'success');
    } catch (error: any) {
      addToast('Failed to enhance prompt', 'error');
      console.error('Prompt enhancement error:', error);
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'source' | 'mask' | 'control' = 'source') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (type === 'source') {
        updateState({ uploadedImage: base64 });
      } else if (type === 'mask') {
        updateState({ maskImage: base64 });
      } else if (type === 'control') {
        updateState({ controlImage: base64 });
      }
      addToast('Image uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Handle generation
  const handleGenerate = async () => {
    if (!state.prompt.trim() && state.mode === 'txt2img') {
      addToast('Please enter a prompt', 'error');
      return;
    }

    if ((state.mode === 'img2img' || state.mode === 'inpaint') && !state.uploadedImage) {
      addToast('Please upload an image', 'error');
      return;
    }

    if (state.mode === 'inpaint' && !state.maskImage) {
      addToast('Please upload a mask image', 'error');
      return;
    }

    if (state.mode === 'controlnet' && !state.controlImage) {
      addToast('Please upload a control image', 'error');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    addToast('Starting generation...', 'info');

    try {
      let endpoint = '/api/generate/txt2img';
      let body: any = {
        prompt: state.prompt,
        provider: state.provider,
        model: state.model,
        negativePrompt: state.negativePrompt,
        width: state.aspectRatio.width,
        height: state.aspectRatio.height,
        steps: state.quality.steps,
        guidanceScale: state.guidanceScale,
        style: state.style,
        enhance: state.enhancePrompt,
        quality: state.quality.id,
        seed: state.seed || undefined
      };

      // Adjust endpoint based on mode
      switch (state.mode) {
        case 'txt2img':
          endpoint = '/api/generate/txt2img';
          if (state.variations) {
            body.variations = true;
            body.variationCount = state.variationCount;
          }
          break;

        case 'img2img':
          endpoint = '/api/generate/img2img';
          body.image = state.uploadedImage;
          body.strength = state.strength;
          body.preserveStructure = state.preserveStructure;
          break;

        case 'inpaint':
          endpoint = '/api/generate/inpaint';
          body.image = state.uploadedImage;
          body.mask = state.maskImage;
          break;

        case 'outpaint':
          endpoint = '/api/generate/outpaint';
          body.image = state.uploadedImage;
          body.width = state.aspectRatio.width * 1.5;
          body.height = state.aspectRatio.height * 1.5;
          break;

        case 'upscale':
          endpoint = '/api/generate/upscale';
          body.image = state.uploadedImage;
          body.scale = state.upscaleFactor;
          body.faceEnhance = state.faceEnhance;
          break;

        case 'controlnet':
          endpoint = '/api/generate/controlnet';
          body.controlImage = state.controlImage;
          body.controlType = state.controlType;
          body.controlScale = state.controlScale;
          break;

        case 'batch':
          endpoint = '/api/generate/batch';
          body.prompts = state.batchPrompts.filter(p => p.trim());
          break;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const data = await response.json();

      if (data.success) {
        // Add to active jobs
        const newJob: GenerationJob = {
          id: data.jobId || Date.now().toString(),
          type: state.mode,
          status: 'processing',
          progress: 0,
          prompt: state.prompt
        };
        setActiveJobs(prev => [newJob, ...prev]);

        // Subscribe to job updates if socket connected
        if (socket && data.jobId) {
          socket.emit('subscribe', data.jobId);
        }

        // Handle immediate results for non-queued generations
        if (data.image || data.results) {
          const newResults = Array.isArray(data.results) ? data.results : [data.image];
          setResults(prev => [...newResults, ...prev]);
          setGallery(prev => [...newResults, ...prev]);
          setIsGenerating(false);
          setProgress(100);
          addToast('Generation complete!', 'success');
        }
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      addToast(error.message || 'Generation failed', 'error');
      setIsGenerating(false);
    }
  };

  // Download image
  const handleDownload = (url: string, filename?: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `generated-${Date.now()}.png`;
    link.click();
    addToast('Download started!', 'success');
  };

  // Use result as input for img2img
  const useAsInput = (result: GenerationResult) => {
    updateState({ 
      uploadedImage: result.url,
      mode: 'img2img'
    });
    addToast('Image loaded as input', 'info');
  };

  return (
    <div className="genesis-engine-container">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Genesis Engine Header with Branding */}
      <div className="genesis-engine-header">
        {/* Brand Logos */}
        <div className="brand-logos">
          <div className="logo-left">
            <img 
              src="/seraphonix-logo.png" 
              alt="Seraphonix Studios" 
              className="brand-logo seraphonix"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <span className="brand-label">Seraphonix Studios</span>
          </div>
          <div className="logo-center">
            <h1>🌟 GENESIS ENGINE 🌟</h1>
          </div>
          <div className="logo-right">
            <img 
              src="/sovereign-logo.png" 
              alt="Sovereign" 
              className="brand-logo sovereign"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <span className="brand-label">Powered by Sovereign</span>
          </div>
        </div>
        
        <p className="subtitle">"In the beginning, there was the prompt"</p>
        <p className="tagline">Seven Modes of Creation • 20 Free Generations/Day • Resets Midnight UTC</p>
        <div className="connection-status">
          <span className={`status-dot ${connected ? 'connected' : ''}`} />
          {connected ? '🟢 Engine Online' : '🔴 Connection Lost'}
        </div>
      </div>

      <div className="generator-layout">
        {/* Left Panel - Controls */}
        <div className="controls-panel">
          
          {/* Mode Selector */}
          <section className="control-section">
            <h3>Generation Mode</h3>
            <div className="mode-selector">
              {[
                { id: 'txt2img', icon: '🎨', name: 'Text to Image' },
                { id: 'img2img', icon: '🖼️', name: 'Image to Image' },
                { id: 'inpaint', icon: '✏️', name: 'Inpaint' },
                { id: 'outpaint', icon: '⬜', name: 'Outpaint' },
                { id: 'upscale', icon: '🔍', name: 'Upscale' },
                { id: 'controlnet', icon: '🎮', name: 'ControlNet' },
                { id: 'batch', icon: '📦', name: 'Batch' }
              ].map(mode => (
                <button
                  key={mode.id}
                  className={`mode-btn ${state.mode === mode.id ? 'active' : ''}`}
                  onClick={() => updateState({ mode: mode.id as GenerationMode })}
                >
                  <span>{mode.icon}</span>
                  <span>{mode.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Prompt Section */}
          <section className="control-section">
            <h3>Prompt</h3>
            <textarea
              ref={promptRef}
              value={state.prompt}
              onChange={(e) => updateState({ prompt: e.target.value })}
              placeholder="Describe what you want to generate..."
              rows={4}
              maxLength={2000}
              disabled={isGenerating}
              className="prompt-input"
            />
            <div className="char-count">{state.prompt.length}/2000</div>

            {/* AI Prompt Enhancement */}
            <div className="enhance-section">
              <button
                onClick={handleEnhancePrompt}
                className="btn btn-secondary btn-sm"
                disabled={!state.prompt.trim() || isGenerating}
              >
                ✨ AI Enhance Prompt
              </button>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={state.enhancePrompt}
                  onChange={(e) => updateState({ enhancePrompt: e.target.checked })}
                />
                Auto-enhance on generate
              </label>
            </div>

            {enhancedPrompt && (
              <div className="enhanced-prompt">
                <strong>Enhanced:</strong>
                <p>{enhancedPrompt}</p>
              </div>
            )}

            {/* Negative Prompt */}
            <div className="form-group mt-4">
              <label>Negative Prompt (what to avoid)</label>
              <input
                type="text"
                value={state.negativePrompt}
                onChange={(e) => updateState({ negativePrompt: e.target.value })}
                placeholder="blurry, low quality, distorted..."
                disabled={isGenerating}
                className="negative-prompt-input"
              />
            </div>
          </section>

          {/* Style & Provider */}
          <section className="control-section">
            <h3>Style & Provider</h3>
            
            <div className="style-grid">
              {STYLE_PRESETS.map(style => (
                <button
                  key={style.id}
                  className={`style-card ${state.style === style.id ? 'active' : ''}`}
                  onClick={() => updateState({ style: style.id })}
                  disabled={isGenerating}
                >
                  <span className="style-icon">{style.icon}</span>
                  <span className="style-name">{style.name}</span>
                  <span className="style-desc">{style.description}</span>
                </button>
              ))}
            </div>

            <div className="form-group mt-3">
              <label>AI Provider</label>
              <select
                value={state.provider}
                onChange={(e) => {
                  const provider = PROVIDERS.find(p => p.id === e.target.value);
                  updateState({ 
                    provider: e.target.value,
                    model: provider?.models[0] || ''
                  });
                }}
                disabled={isGenerating}
              >
                {PROVIDERS.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.free ? '(Free)' : '(Paid)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Model</label>
              <select
                value={state.model}
                onChange={(e) => updateState({ model: e.target.value })}
                disabled={isGenerating}
              >
                {PROVIDERS.find(p => p.id === state.provider)?.models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </section>

          {/* Settings */}
          <section className="control-section">
            <h3>Settings</h3>
            
            {/* Aspect Ratio */}
            <div className="form-group">
              <label>Aspect Ratio</label>
              <div className="ratio-grid">
                {ASPECT_RATIOS.map(ratio => (
                  <button
                    key={ratio.id}
                    className={`ratio-btn ${state.aspectRatio.id === ratio.id ? 'active' : ''}`}
                    onClick={() => updateState({ aspectRatio: ratio })}
                    disabled={isGenerating || state.mode === 'upscale'}
                  >
                    <span className="ratio-label">{ratio.label}</span>
                    <span className="ratio-dims">{ratio.width}×{ratio.height}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality */}
            <div className="form-group">
              <label>Quality Level</label>
              <div className="quality-selector">
                {QUALITY_LEVELS.map(q => (
                  <button
                    key={q.id}
                    className={`quality-btn ${state.quality.id === q.id ? 'active' : ''}`}
                    onClick={() => updateState({ quality: q })}
                    disabled={isGenerating}
                  >
                    <span className="quality-name">{q.name}</span>
                    <span className="quality-desc">{q.steps} steps</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Guidance Scale */}
            <div className="form-group slider-group">
              <label>Guidance Scale: {state.guidanceScale}</label>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={state.guidanceScale}
                onChange={(e) => updateState({ guidanceScale: parseFloat(e.target.value) })}
                disabled={isGenerating}
              />
              <span className="hint">Higher = follow prompt more strictly</span>
            </div>

            {/* Seed */}
            <div className="form-group">
              <label>Seed (optional - for reproducibility)</label>
              <input
                type="number"
                value={state.seed || ''}
                onChange={(e) => updateState({ seed: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Random"
                disabled={isGenerating}
              />
              <button 
                className="btn btn-sm btn-outline" 
                onClick={() => updateState({ seed: Math.floor(Math.random() * 999999999) })}
              >
                🎲 Random
              </button>
            </div>
          </section>

          {/* Mode-Specific Controls */}
          {state.mode === 'img2img' && (
            <section className="control-section">
              <h3>Image to Image Settings</h3>
              
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'source')}
                style={{ display: 'none' }}
              />
              
              {!state.uploadedImage ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-outline btn-full"
                  disabled={isGenerating}
                >
                  📁 Upload Image
                </button>
              ) : (
                <div className="uploaded-preview">
                  <img src={state.uploadedImage} alt="Upload preview" />
                  <button
                    onClick={() => updateState({ uploadedImage: null })}
                    className="btn btn-danger btn-sm"
                  >
                    Remove
                  </button>
                </div>
              )}

              <div className="form-group slider-group mt-3">
                <label>Strength: {Math.round(state.strength * 100)}%</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={state.strength * 100}
                  onChange={(e) => updateState({ strength: parseInt(e.target.value) / 100 })}
                  disabled={isGenerating}
                />
                <span className="hint">Higher = more transformation</span>
              </div>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={state.preserveStructure}
                  onChange={(e) => updateState({ preserveStructure: e.target.checked })}
                  disabled={isGenerating}
                />
                Preserve image structure
              </label>
            </section>
          )}

          {state.mode === 'upscale' && (
            <section className="control-section">
              <h3>Upscale Settings</h3>
              
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'source')}
                style={{ display: 'none' }}
              />
              
              {!state.uploadedImage ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-outline btn-full"
                  disabled={isGenerating}
                >
                  📁 Upload Image to Upscale
                </button>
              ) : (
                <div className="uploaded-preview">
                  <img src={state.uploadedImage} alt="Upload preview" />
                  <button
                    onClick={() => updateState({ uploadedImage: null })}
                    className="btn btn-danger btn-sm"
                  >
                    Remove
                  </button>
                </div>
              )}

              <div className="form-group">
                <label>Upscale Factor</label>
                <div className="ratio-grid">
                  {[2, 4].map(factor => (
                    <button
                      key={factor}
                      className={`ratio-btn ${state.upscaleFactor === factor ? 'active' : ''}`}
                      onClick={() => updateState({ upscaleFactor: factor })}
                      disabled={isGenerating}
                    >
                      <span className="ratio-label">{factor}x</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={state.faceEnhance}
                  onChange={(e) => updateState({ faceEnhance: e.target.checked })}
                  disabled={isGenerating}
                />
                Enhance faces (GFPGAN)
              </label>
            </section>
          )}

          {state.mode === 'controlnet' && (
            <section className="control-section">
              <h3>ControlNet Settings</h3>
              
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'control')}
                style={{ display: 'none' }}
                id="control-upload"
              />
              
              {!state.controlImage ? (
                <button
                  onClick={() => document.getElementById('control-upload')?.click()}
                  className="btn btn-outline btn-full"
                  disabled={isGenerating}
                >
                  📁 Upload Control Image
                </button>
              ) : (
                <div className="uploaded-preview">
                  <img src={state.controlImage} alt="Control preview" />
                  <button
                    onClick={() => updateState({ controlImage: null })}
                    className="btn btn-danger btn-sm"
                  >
                    Remove
                  </button>
                </div>
              )}

              <div className="form-group">
                <label>Control Type</label>
                <div className="control-type-grid">
                  {CONTROL_TYPES.map(type => (
                    <button
                      key={type.id}
                      className={`control-type-btn ${state.controlType === type.id ? 'active' : ''}`}
                      onClick={() => updateState({ controlType: type.id })}
                      disabled={isGenerating}
                    >
                      <span>{type.name}</span>
                      <small>{type.description}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group slider-group">
                <label>Control Scale: {state.controlScale}</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={state.controlScale}
                  onChange={(e) => updateState({ controlScale: parseFloat(e.target.value) })}
                  disabled={isGenerating}
                />
              </div>
            </section>
          )}

          {state.mode === 'txt2img' && (
            <section className="control-section">
              <h3>Variations</h3>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={state.variations}
                  onChange={(e) => updateState({ variations: e.target.checked })}
                  disabled={isGenerating}
                />
                Generate variations
              </label>
              
              {state.variations && (
                <div className="form-group">
                  <label>Number of variations: {state.variationCount}</label>
                  <input
                    type="range"
                    min="2"
                    max="8"
                    value={state.variationCount}
                    onChange={(e) => updateState({ variationCount: parseInt(e.target.value) })}
                    disabled={isGenerating}
                  />
                </div>
              )}
            </section>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || (state.mode !== 'upscale' && !state.prompt.trim())}
            className="btn btn-primary btn-generate btn-full"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner size="small" label="" />
                Generating... {progress > 0 && `${Math.round(progress)}%`}
              </>
            ) : (
              <>
                <span>✨</span>
                {state.mode === 'batch' ? 'Generate Batch' : 
                 state.mode === 'upscale' ? 'Upscale Image' :
                 state.mode === 'variations' ? `Generate ${state.variationCount} Variations` :
                 'Generate Image'}
              </>
            )}
          </button>

          {isGenerating && progress > 0 && (
            <div className="mt-3">
              <ProgressBar progress={progress} status="processing" />
            </div>
          )}
        </div>

        {/* Right Panel - Results */}
        <div className="results-panel">
          <h2>Results</h2>
          
          {/* Active Jobs */}
          {activeJobs.length > 0 && (
            <div className="active-jobs">
              <h3>Active Jobs</h3>
              {activeJobs.filter(j => j.status === 'processing').map(job => (
                <div key={job.id} className="job-item">
                  <span>{job.type}</span>
                  <ProgressBar progress={job.progress} />
                </div>
              ))}
            </div>
          )}

          {/* Results Grid */}
          <div className="results-grid">
            {results.length === 0 && !isGenerating && (
              <div className="empty-state">
                <span className="empty-icon">🎨</span>
                <p>Your generated images will appear here</p>
                <small>Start by entering a prompt and clicking Generate</small>
              </div>
            )}

            {isGenerating && results.length === 0 && (
              <div className="generating-state">
                <LoadingSpinner size="large" label="Generating" />
                <p>Creating your masterpiece...</p>
                <div className="progress-wrapper">
                  <ProgressBar progress={progress} />
                </div>
              </div>
            )}

            <AnimatePresence>
              {results.map((result, index) => (
                <motion.div
                  key={`${result.filename}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="result-card"
                >
                  <div className="result-image-wrapper">
                    <img 
                      src={result.url} 
                      alt={result.prompt}
                      loading="lazy"
                    />
                    <div className="result-overlay">
                      <button 
                        onClick={() => handleDownload(result.url, result.filename)}
                        className="btn btn-sm btn-light"
                        title="Download"
                      >
                        ⬇
                      </button>
                      <button 
                        onClick={() => useAsInput(result)}
                        className="btn btn-sm btn-light"
                        title="Use as input"
                      >
                        🖼️
                      </button>
                    </div>
                  </div>
                  
                  <div className="result-info">
                    <p className="result-prompt" title={result.prompt}>
                      {result.prompt.substring(0, 100)}{result.prompt.length > 100 ? '...' : ''}
                    </p>
                    <div className="result-meta">
                      <span className="provider-tag">{result.provider}</span>
                      <span>{result.metadata.width}×{result.metadata.height}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Gallery */}
          {gallery.length > 0 && (
            <div className="gallery-section">
              <h3>Recent Generations</h3>
              <div className="gallery-grid">
                {gallery.slice(0, 6).map((item, index) => (
                  <div 
                    key={index} 
                    className="gallery-item"
                    onClick={() => useAsInput(item)}
                  >
                    <img src={item.url} alt="" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIImageGenerator;
