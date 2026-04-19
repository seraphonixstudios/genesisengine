import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SparklesIcon, 
  PhotoIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuthStore, useGenerationStore } from '../store';

const ASPECT_RATIOS = [
  { id: '1:1', width: 1024, height: 1024, label: 'Square' },
  { id: '4:3', width: 1024, height: 768, label: 'Landscape' },
  { id: '3:4', width: 768, height: 1024, label: 'Portrait' },
  { id: '16:9', width: 1024, height: 576, label: 'Widescreen' },
  { id: '21:9', width: 1024, height: 440, label: 'Ultrawide' },
];

const STYLE_PRESETS = [
  { id: 'none', name: 'None', icon: '✨' },
  { id: 'photorealistic', name: 'Photorealistic', icon: '📸' },
  { id: 'digital-art', name: 'Digital Art', icon: '🎨' },
  { id: 'cinematic', name: 'Cinematic', icon: '🎬' },
  { id: 'anime', name: 'Anime', icon: '🎌' },
  { id: '3d-render', name: '3D Render', icon: '🎲' },
  { id: 'oil-painting', name: 'Oil Painting', icon: '🖼️' },
  { id: 'watercolor', name: 'Watercolor', icon: '💧' },
];

export default function Generator() {
  const { user, updateUser } = useAuthStore();
  const { models, isGenerating, progress, currentGeneration, generate } = useGenerationStore();
  
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [style, setStyle] = useState('none');
  const [steps, setSteps] = useState(30);
  const [guidance, setGuidance] = useState(7.5);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  useEffect(() => {
    useGenerationStore.getState().fetchModels();
  }, []);

  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].id);
    }
  }, [models]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    if (!user || user.credits < 1) {
      toast.error('Insufficient credits. Please upgrade your plan.');
      return;
    }

    try {
      await generate({
        prompt,
        negativePrompt,
        model: selectedModel,
        width: aspectRatio.width,
        height: aspectRatio.height,
        steps,
        guidanceScale: guidance,
        stylePreset: style,
      });

      // Update credits
      updateUser({ credits: user.credits - 1 });
      
      toast.success('Generation started!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Generation failed');
    }
  };

  useEffect(() => {
    if (currentGeneration?.status === 'COMPLETED' && currentGeneration.url) {
      setGeneratedImage(currentGeneration.url);
    }
  }, [currentGeneration]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center py-6">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-pink-600"
        >
          Create AI Art
        </motion.h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Transform your ideas into stunning visuals
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Prompt Input */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prompt <span className="text-red-500">*</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A serene mountain landscape at sunset with golden clouds reflecting on a crystal clear lake, photorealistic, 8k quality..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none h-32"
              maxLength={4000}
              disabled={isGenerating}
            />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Be descriptive for best results</span>
              <span>{prompt.length}/4000</span>
            </div>
          </div>

          {/* Negative Prompt */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Negative Prompt (Optional)
            </label>
            <input
              type="text"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="blurry, low quality, distorted, ugly, deformed, bad anatomy..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
              disabled={isGenerating}
            />
          </div>

          {/* Model Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              AI Model
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  disabled={isGenerating}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedModel === model.id
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-violet-300'
                  } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">{model.name}</div>
                  <div className="text-sm text-gray-500">{model.provider}</div>
                  <div className="text-xs text-gray-400 mt-1">{model.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Settings Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Aspect Ratio */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => setAspectRatio(ratio)}
                    disabled={isGenerating}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      aspectRatio.id === ratio.id
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700'
                        : 'border-gray-200 dark:border-gray-700 hover:border-violet-300'
                    }`}
                  >
                    <div className="text-xs opacity-70">{ratio.label}</div>
                    <div>{ratio.id}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Style & Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Style Preset
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  disabled={isGenerating}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  {STYLE_PRESETS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Steps: {steps}
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={steps}
                  onChange={(e) => setSteps(Number(e.target.value))}
                  disabled={isGenerating}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Guidance Scale: {guidance}
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={guidance}
                  onChange={(e) => setGuidance(Number(e.target.value))}
                  disabled={isGenerating}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                Generating... {progress}%
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                Generate Image ({user?.credits || 0} credits)
              </>
            )}
          </button>
        </div>

        {/* Result Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Result</h3>
            
            <AnimatePresence mode="wait">
              {isGenerating && !generatedImage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center"
                >
                  <ArrowPathIcon className="w-12 h-12 text-violet-600 animate-spin mb-4" />
                  <p className="text-sm text-gray-500">Generating...</p>
                  <div className="w-48 h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
                    <div 
                      className="h-full bg-violet-600 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </motion.div>
              )}

              {generatedImage && !isGenerating && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="relative group">
                    <img
                      src={generatedImage}
                      alt="Generated"
                      className="w-full rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = generatedImage;
                          link.download = `generated-${Date.now()}.png`;
                          link.click();
                        }}
                        className="p-2 bg-white rounded-full hover:bg-gray-100"
                      >
                        <PhotoIcon className="w-5 h-5 text-gray-900" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <a
                      href={generatedImage}
                      download
                      className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-center hover:bg-gray-200 transition-colors"
                    >
                      Download
                    </a>
                  </div>
                </motion.div>
              )}

              {!isGenerating && !generatedImage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-400"
                >
                  <SparklesIcon className="w-16 h-16 mb-2" />
                  <p className="text-sm">Your masterpiece awaits</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
