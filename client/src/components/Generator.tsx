import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Download, 
  Trash2, 
  Heart, 
  Share2, 
  Maximize2,
  RefreshCw,
  Zap,
  Settings,
  Image as ImageIcon,
  Wand2,
  Copy,
  Check
} from 'lucide-react';

interface Model {
  id: string;
  name: string;
  quality: string;
  description: string;
}

interface GenerationResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  prompt: string;
  negativePrompt: string;
  model: string;
  stylePreset: string;
  width: number;
  height: number;
  seed: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  isFavorite?: boolean;
}

const STYLE_PRESETS = [
  { id: 'midjourney-v6', name: 'Midjourney V6', icon: '✨', description: 'Ultra-detailed, artistic, premium quality', color: 'from-purple-500 to-pink-500' },
  { id: 'photorealistic', name: 'Photorealistic', icon: '📸', description: 'Professional photography, hyper-realistic', color: 'from-blue-500 to-cyan-500' },
  { id: 'digital-art', name: 'Digital Art', icon: '🎨', description: 'Trending on ArtStation, artistic', color: 'from-orange-500 to-red-500' },
  { id: 'anime', name: 'Anime', icon: '🎌', description: 'Anime/manga style, vibrant colors', color: 'from-pink-500 to-rose-500' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: '🌃', description: 'Neon, futuristic, dystopian', color: 'from-cyan-500 to-blue-600' },
  { id: 'fantasy', name: 'Fantasy', icon: '🏰', description: 'Epic, magical, dramatic', color: 'from-amber-500 to-orange-600' },
  { id: 'oil-painting', name: 'Oil Painting', icon: '🖼️', description: 'Classical art, rich textures', color: 'from-yellow-600 to-amber-700' },
  { id: 'minimalist', name: 'Minimalist', icon: '⬜', description: 'Clean, simple, elegant', color: 'from-gray-500 to-gray-700' },
];

const ASPECT_RATIOS = [
  { id: '1:1', width: 1024, height: 1024, label: '1:1', description: 'Square', icon: '□' },
  { id: '4:3', width: 1024, height: 768, label: '4:3', description: 'Standard', icon: '▭' },
  { id: '3:4', width: 768, height: 1024, label: '3:4', description: 'Portrait', icon: '▯' },
  { id: '16:9', width: 1024, height: 576, label: '16:9', description: 'Widescreen', icon: '▭▭' },
  { id: '9:16', width: 576, height: 1024, label: '9:16', description: 'Mobile', icon: '▯▯' },
  { id: '21:9', width: 1024, height: 440, label: '21:9', description: 'Ultrawide', icon: '▭▭▭' },
];

const BATCH_SIZES = [1, 2, 4, 8];

interface AdvancedSettings {
  guidanceScale: number;
  steps: number;
  seed: number | null;
  enhancePrompt: boolean;
  useFixedSeed: boolean;
}

export function Generator() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [model, setModel] = useState('leonardo');
  const [style, setStyle] = useState('midjourney-v6');
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [batchSize, setBatchSize] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [error, setError] = useState('');
  const [models, setModels] = useState<Model[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [advanced, setAdvanced] = useState<AdvancedSettings>({
    guidanceScale: 7.5,
    steps: 30,
    seed: null,
    enhancePrompt: true,
    useFixedSeed: false,
  });

  const API_URL = 'http://localhost:5000';

  useEffect(() => {
    fetch(`${API_URL}/api/models`)
      .then(r => r.json())
      .then(setModels)
      .catch(console.error);
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const promises = Array(batchSize).fill(null).map((_, i) => 
        fetch(`${API_URL}/api/generate`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({
            prompt,
            negativePrompt,
            model,
            stylePreset: style,
            width: aspectRatio.width,
            height: aspectRatio.height,
            guidanceScale: advanced.guidanceScale,
            steps: advanced.steps,
            seed: advanced.useFixedSeed ? advanced.seed : null,
            enhancePrompt: advanced.enhancePrompt,
            batchIndex: i,
          }),
        }).then(r => r.json())
      );

      const generations = await Promise.all(promises);
      
      // Poll for results
      const pollInterval = setInterval(async () => {
        const allCompleted = await Promise.all(
          generations.map(async (gen) => {
            if (gen.status === 'COMPLETED' || gen.status === 'FAILED') return gen;
            
            const res = await fetch(`${API_URL}/api/generations/${gen.id}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            return res.json();
          })
        );

        setResults(allCompleted);
        
        const done = allCompleted.every(g => g.status === 'COMPLETED' || g.status === 'FAILED');
        if (done) {
          clearInterval(pollInterval);
          setGenerating(false);
        }
      }, 2000);

    } catch (err: any) {
      setError(err.message);
      setGenerating(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (url: string, filename: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/api/generations/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    setResults(prev => prev.filter(r => r.id !== id));
  };

  const selectedStyle = STYLE_PRESETS.find(s => s.id === style);

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Create Stunning AI Art
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Professional-grade image generation with advanced controls
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prompt Input */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <label className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-500" />
                Prompt
              </label>
              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your image in detail... (e.g., 'a majestic lion in a savanna sunset, golden lighting, ultra detailed')"
              className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-0 outline-none h-36 resize-none text-lg"
            />
            
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Negative Prompt
              </label>
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="Things to avoid: blurry, distorted, low quality, ugly, deformed..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-0 outline-none"
              />
            </div>
          </motion.div>

          {/* Style Selection */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            <label className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 block flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Style Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setStyle(preset.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-300 hover:scale-105 ${
                    style === preset.id
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 hover:shadow-md'
                  }`}
                >
                  <div className="text-3xl mb-2">{preset.icon}</div>
                  <div className="font-semibold text-sm">{preset.name}</div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-1">{preset.description}</div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Model & Settings */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 block">
                  AI Model
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 focus:border-purple-500 outline-none"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} - {m.quality}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 block">
                  Batch Size
                </label>
                <div className="flex gap-2">
                  {BATCH_SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => setBatchSize(size)}
                      className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-all ${
                        batchSize === size
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700'
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 block">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-6 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => setAspectRatio(ratio)}
                    className={`p-3 rounded-xl border-2 text-center transition-all hover:scale-105 ${
                      aspectRatio.id === ratio.id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="text-xl mb-1">{ratio.icon}</div>
                    <div className="text-xs font-medium">{ratio.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Settings Toggle */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
              >
                <Settings className="w-4 h-4" />
                Advanced Settings
                <span className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 grid sm:grid-cols-2 gap-4 overflow-hidden"
                  >
                    <div>
                      <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">
                        Guidance Scale: {advanced.guidanceScale}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        step="0.5"
                        value={advanced.guidanceScale}
                        onChange={(e) => setAdvanced({...advanced, guidanceScale: parseFloat(e.target.value)})}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">
                        Steps: {advanced.steps}
                      </label>
                      <input
                        type="range"
                        min="20"
                        max="50"
                        step="5"
                        value={advanced.steps}
                        onChange={(e) => setAdvanced({...advanced, steps: parseInt(e.target.value)})}
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={advanced.enhancePrompt}
                          onChange={(e) => setAdvanced({...advanced, enhancePrompt: e.target.checked})}
                          className="w-5 h-5 text-purple-600 rounded"
                        />
                        <span className="text-sm">Auto-enhance prompt</span>
                      </label>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={advanced.useFixedSeed}
                          onChange={(e) => setAdvanced({...advanced, useFixedSeed: e.target.checked})}
                          className="w-5 h-5 text-purple-600 rounded"
                        />
                        <span className="text-sm">Fixed seed</span>
                      </label>
                      {advanced.useFixedSeed && (
                        <input
                          type="number"
                          value={advanced.seed || ''}
                          onChange={(e) => setAdvanced({...advanced, seed: parseInt(e.target.value)})}
                          placeholder="Enter seed"
                          className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 w-32"
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Generate Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="w-full py-5 text-xl font-bold rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {generating ? (
              <>
                <RefreshCw className="w-6 h-6 animate-spin" />
                Generating {batchSize > 1 && `${results.length + 1}/${batchSize}...`}
              </>
            ) : (
              <>
                <Zap className="w-6 h-6" />
                Generate {batchSize > 1 ? `${batchSize} Images` : 'Image'}
              </>
            )}
          </motion.button>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg"
            >
              {error}
            </motion.div>
          )}
        </div>

        {/* Results */}
        <div className="lg:col-span-1">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sticky top-6"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-500" />
              Results
            </h3>
            
            {generating && results.length === 0 && (
              <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl flex flex-col items-center justify-center">
                <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Creating masterpiece...</p>
              </div>
            )}

            <AnimatePresence>
              {results.length > 0 && (
                <div className={`grid gap-4 ${results.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {results.map((result, idx) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative group"
                    >
                      {result.url ? (
                        <>
                          <img 
                            src={result.url} 
                            alt={`Generated ${idx + 1}`}
                            className="w-full rounded-xl shadow-md"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleDownload(result.url, `generated-${result.id}.png`)}
                              className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                              title="Download"
                            >
                              <Download className="w-5 h-5 text-gray-900" />
                            </button>
                            <button
                              onClick={() => window.open(result.url, '_blank')}
                              className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                              title="View full size"
                            >
                              <Maximize2 className="w-5 h-5 text-gray-900" />
                            </button>
                            <button
                              onClick={() => handleDelete(result.id)}
                              className="p-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5 text-white" />
                            </button>
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="px-2 py-1 bg-black/50 text-white text-xs rounded-full">
                              #{idx + 1}
                            </span>
                          </div>
                        </>
                      ) : result.status === 'FAILED' ? (
                        <div className="aspect-square bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                          <span className="text-red-600 text-sm">Failed</span>
                        </div>
                      ) : (
                        <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                          <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>

            {!generating && results.length === 0 && (
              <div className="aspect-square bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 rounded-xl flex flex-col items-center justify-center text-gray-400">
                <Sparkles className="w-16 h-16 mb-4 text-purple-400" />
                <p className="text-center px-4">Your masterpiece awaits</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Generator;