import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { MatrixRain, Scanlines, GridOverlay } from './components/CyberEffects';

const API_URL = (import.meta as any).env.VITE_API_URL || '';

// Auth Context
interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  plan: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) throw new Error('Registration failed');
    const data = await res.json();
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// API Helper
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
};

// Prompt Suggestions
const PROMPT_SUGGESTIONS = [
  'a serene Japanese garden with cherry blossoms, golden hour lighting, ultra detailed',
  'cyberpunk cityscape at night, neon lights, rain, cinematic composition, 8k',
  'portrait of an elderly wizard, intricate robes, magical atmosphere, photorealistic',
  'futuristic spaceship interior, sleek design, ambient lighting, sci-fi concept art',
  'mystical forest with glowing mushrooms, ethereal lighting, fantasy art style',
  'vintage muscle car on Route 66, sunset, cinematic, highly detailed',
  'cute anime character, kawaii style, vibrant colors, detailed background',
];

// Style Presets
const STYLE_PRESETS = [
  { id: 'midjourney-v6', name: 'Midjourney V6', icon: '✨', description: 'Ultra-detailed, artistic' },
  { id: 'photorealistic', name: 'Photorealistic', icon: '📸', description: 'Professional, hyper-real' },
  { id: 'digital-art', name: 'Digital Art', icon: '🎨', description: 'ArtStation trending' },
  { id: 'anime', name: 'Anime', icon: '🎌', description: 'Anime/manga style' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: '🌃', description: 'Neon, futuristic' },
  { id: 'fantasy', name: 'Fantasy', icon: '🏰', description: 'Epic, magical' },
  { id: 'oil-painting', name: 'Oil Painting', icon: '🖼️', description: 'Classical art' },
  { id: 'minimalist', name: 'Minimalist', icon: '⬜', description: 'Clean, elegant' },
];

// Aspect Ratios
const ASPECT_RATIOS = [
  { id: '1:1', width: 1024, height: 1024, label: '1:1', description: 'Square' },
  { id: '4:3', width: 1024, height: 768, label: '4:3', description: 'Standard' },
  { id: '3:4', width: 768, height: 1024, label: '3:4', description: 'Portrait' },
  { id: '16:9', width: 1024, height: 576, label: '16:9', description: 'Widescreen' },
  { id: '9:16', width: 576, height: 1024, label: '9:16', description: 'Mobile' },
  { id: '21:9', width: 1024, height: 440, label: '21:9', description: 'Ultrawide' },
];

// Enhanced Button Component
function Button({ children, onClick, disabled, variant = 'primary', className = '', ...props }: any) {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg hover:shadow-cyan-500/50',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 hover:border-gray-500',
    outline: 'border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 hover:shadow-lg hover:shadow-cyan-500/30',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/50',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyles} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>
      {children}
    </button>
  );
}

// Enhanced Card Component
function Card({ children, className = '', glowing = false }: any) {
  return (
    <div className={`bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300 ${glowing ? 'shadow-lg shadow-cyan-500/20' : ''} ${className}`}>
      {children}
    </div>
  );
}

// Login Page - Enhanced
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-blue-950 to-cyan-950 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,119,182,0))]"></div>
      
      <Card className="w-full max-w-md p-8 relative z-10 glowing">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/50">🎨</div>
          <h1 className="text-4xl font-bold text-white mb-2">Neural.AI</h1>
          <p className="text-cyan-400/70 text-sm tracking-widest font-mono">INTELLIGENT IMAGE SYNTHESIS</p>
        </div>
        
        {error && (
          <div className="bg-red-900/40 border border-red-500/50 text-red-300 p-4 rounded-lg mb-6 text-sm font-mono">
            ⚠ {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-cyan-400/70 mb-2 font-mono tracking-wider">EMAIL</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-cyan-500/20 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-cyan-400/70 mb-2 font-mono tracking-wider">PASSWORD</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-cyan-500/20 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
              required
            />
          </div>
          <Button type="submit" disabled={loading} variant="primary" className="w-full py-3 text-base">
            {loading ? '⟳ AUTHENTICATING...' : 'SIGN IN'}
          </Button>
        </form>
        
        <p className="mt-6 text-center text-gray-400 text-sm">
          No account?{' '}
          <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">Create one</Link>
        </p>
      </Card>
    </div>
  );
}

// Register Page - Enhanced
function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(email, password, name);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-blue-950 to-cyan-950 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,119,182,0))]"></div>
      
      <Card className="w-full max-w-md p-8 relative z-10 glowing">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/50">✨</div>
          <h1 className="text-4xl font-bold text-white mb-2">Join Neural.AI</h1>
          <p className="text-cyan-400/70 text-sm tracking-widest font-mono">BEGIN YOUR CREATIVE JOURNEY</p>
        </div>
        
        {error && (
          <div className="bg-red-900/40 border border-red-500/50 text-red-300 p-4 rounded-lg mb-6 text-sm font-mono">
            ⚠ {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-cyan-400/70 mb-2 font-mono tracking-wider">NAME</label>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-cyan-500/20 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-cyan-400/70 mb-2 font-mono tracking-wider">EMAIL</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-cyan-500/20 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-cyan-400/70 mb-2 font-mono tracking-wider">PASSWORD (MIN 8 CHARS)</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-cyan-500/20 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
              minLength={8}
              required
            />
          </div>
          <Button type="submit" disabled={loading} variant="primary" className="w-full py-3 text-base">
            {loading ? '⟳ CREATING...' : 'CREATE ACCOUNT'}
          </Button>
        </form>
        
        <p className="mt-6 text-center text-gray-400 text-sm">
          Already registered?{' '}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}

// Main Generator Page - Enhanced
function Generator() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [model, setModel] = useState('leonardo');
  const [style, setStyle] = useState('midjourney-v6');
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [enhancePrompt, setEnhancePrompt] = useState(true);
  const [upscale, setUpscale] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [models, setModels] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { refreshUser } = useAuth();

  useEffect(() => {
    fetch('/api/models')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.models)) {
          setModels(data.models);
        } else if (Array.isArray(data)) {
          setModels(data);
        }
      })
      .catch(console.error);
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError('');
    setResult(null);

    try {
      const data = await apiFetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt,
          negativePrompt,
          model,
          stylePreset: style,
          width: aspectRatio.width,
          height: aspectRatio.height,
          enhancePrompt,
          upscale,
        }),
      });

      const generationId = data.id || data.generationId;
      
      const interval = setInterval(async () => {
        try {
          const gen = await apiFetch(`/api/generations/${generationId}`);
          if (gen.status === 'COMPLETED') {
            clearInterval(interval);
            setResult(gen);
            setGenerating(false);
            refreshUser();
          } else if (gen.status === 'FAILED') {
            clearInterval(interval);
            setError(gen.error || 'Generation failed');
            setGenerating(false);
          }
        } catch (e: any) {
          clearInterval(interval);
          setError(e.message || 'Failed to check status');
          setGenerating(false);
        }
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Generation failed');
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
          NEURAL IMAGE SYNTHESIZER
        </h1>
        <p className="text-cyan-400/60 font-mono text-sm tracking-widest">Powered by Advanced AI Models</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prompt Input */}
          <Card className="p-8" glowing>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-mono text-cyan-400/70 tracking-wider">PROMPT ENGINEERING</label>
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono transition-colors"
              >
                {showSuggestions ? '✕ Hide' : '+ Templates'}
              </button>
            </div>
            
            {showSuggestions && (
              <div className="mb-4 p-4 rounded-lg bg-cyan-900/10 border border-cyan-500/20 animate-fadeIn">
                <p className="text-xs text-cyan-400/60 mb-3 font-mono">SUGGESTED PROMPTS:</p>
                <div className="flex flex-wrap gap-2">
                  {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setPrompt(suggestion); setShowSuggestions(false); }}
                      className="text-xs px-3 py-2 rounded bg-cyan-500/5 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/15 transition-all font-mono text-cyan-400 hover:text-cyan-300"
                    >
                      {suggestion.slice(0, 30)}...
                    </button>
                  ))}
                </div>
              </div>
            )}

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your ideal image in detail..."
              className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-cyan-500/20 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all h-32 resize-none font-mono text-sm"
            />
            
            <div className="mt-4">
              <label className="text-sm font-mono text-cyan-400/70 tracking-wider mb-2 block">EXCLUSIONS (OPTIONAL)</label>
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="Elements to avoid..."
                className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-cyan-500/20 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-mono text-sm"
              />
            </div>
          </Card>

          {/* Style Selection */}
          <Card className="p-8" glowing>
            <label className="text-sm font-mono text-cyan-400/70 tracking-wider mb-4 block">STYLE PRESETS</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setStyle(preset.id)}
                  className={`p-4 rounded-lg border transition-all duration-300 text-left ${
                    style === preset.id
                      ? 'bg-cyan-500/20 border-cyan-500 shadow-lg shadow-cyan-500/30'
                      : 'bg-gray-800/30 border-cyan-500/20 hover:border-cyan-500/40 hover:bg-gray-800/50'
                  }`}
                >
                  <div className="text-2xl mb-2">{preset.icon}</div>
                  <div className="font-semibold text-white text-sm">{preset.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{preset.description}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Settings */}
          <Card className="p-8" glowing>
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Model */}
              <div>
                <label className="text-sm font-mono text-cyan-400/70 tracking-wider mb-3 block">AI MODEL</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-cyan-500/20 text-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all font-mono text-sm cursor-pointer"
                >
                  {Array.isArray(models) && models.length > 0 ? (
                    models.map((m) => (
                      <option key={m.id || m.value} value={m.id || m.value}>{m.name || m.label}</option>
                    ))
                  ) : (
                    <option value="stable-diffusion">Stable Diffusion XL</option>
                  )}
                </select>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="text-sm font-mono text-cyan-400/70 tracking-wider mb-3 block">DIMENSIONS</label>
                <div className="grid grid-cols-3 gap-2">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.id}
                      onClick={() => setAspectRatio(ratio)}
                      className={`p-3 rounded-lg border transition-all duration-300 text-center ${
                        aspectRatio.id === ratio.id
                          ? 'bg-cyan-500/20 border-cyan-500 shadow-lg shadow-cyan-500/20'
                          : 'bg-gray-800/30 border-cyan-500/20 hover:border-cyan-500/40'
                      }`}
                    >
                      <div className="font-semibold text-white">{ratio.label}</div>
                      <div className="text-xs text-gray-400">{ratio.width}×{ratio.height}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-cyan-500/10">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={enhancePrompt}
                  onChange={(e) => setEnhancePrompt(e.target.checked)}
                  className="w-5 h-5 rounded cursor-pointer"
                  style={{accentColor: '#06b6d4'}}
                />
                <span className="text-sm font-mono text-cyan-400/70 group-hover:text-cyan-400">ENHANCE PROMPT</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={upscale}
                  onChange={(e) => setUpscale(e.target.checked)}
                  className="w-5 h-5 rounded cursor-pointer"
                  style={{accentColor: '#fbbf24'}}
                />
                <span className="text-sm font-mono text-yellow-400/70 group-hover:text-yellow-400">2X UPSCALE</span>
              </label>
            </div>
          </Card>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            variant="primary"
            className="w-full py-4 text-lg font-bold rounded-lg"
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block animate-spin">◈</span>
                SYNTHESIZING...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>✨</span>
                GENERATE IMAGE
              </span>
            )}
          </Button>

          {error && (
            <div className="p-4 rounded-lg border border-red-500/50 bg-red-900/20 text-red-400 font-mono text-sm">
              ⚠ ERROR: {error}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="lg:col-span-1">
          <Card className="p-8 sticky top-6 glowing">
            <h3 className="text-sm font-mono text-cyan-400/70 tracking-wider mb-4">OUTPUT PREVIEW</h3>
            
            {generating && !result && (
              <div className="aspect-square rounded-lg bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-cyan-500/20 flex flex-col items-center justify-center">
                <div className="relative w-20 h-20 mb-4">
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-500 border-r-cyan-500 animate-spin"></div>
                  <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-blue-500 animate-spin" style={{animationDirection: 'reverse'}}></div>
                </div>
                <p className="font-mono text-sm text-cyan-400/60">PROCESSING...</p>
              </div>
            )}

            {result?.url && (
              <div className="space-y-4">
                <div className="relative group rounded-lg overflow-hidden border border-cyan-500/20 hover:border-cyan-500/40 transition-all">
                  <img src={result.url} alt="Generated" className="w-full rounded-lg" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                    <a
                      href={result.url}
                      download
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-mono text-xs transition-colors"
                    >
                      DOWNLOAD
                    </a>
                  </div>
                </div>
                <div className="text-xs font-mono space-y-2 text-cyan-400/60">
                  <p><span className="text-yellow-400">MODEL:</span> {result.model}</p>
                  <p><span className="text-yellow-400">STYLE:</span> {result.stylePreset}</p>
                  <p><span className="text-yellow-400">SEED:</span> {result.seed}</p>
                </div>
              </div>
            )}

            {!generating && !result && (
              <div className="aspect-square rounded-lg bg-gradient-to-br from-gray-800/30 to-gray-900/50 border border-cyan-500/20 flex flex-col items-center justify-center">
                <span className="text-5xl mb-4">✨</span>
                <p className="font-mono text-sm text-cyan-400/60">AWAITING INPUT...</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// Gallery Page - Enhanced
function Gallery() {
  const [generations, setGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<any>(null);

  useEffect(() => {
    apiFetch('/api/generations')
      .then(setGenerations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="text-center py-12">
      <div className="inline-block animate-spin text-4xl text-cyan-500">◈</div>
      <p className="text-cyan-400/60 font-mono mt-4 text-sm">LOADING ARCHIVE...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-2">IMAGE ARCHIVE</h1>
        <p className="text-cyan-400/60 font-mono text-sm">{generations.length} CREATIONS SAVED</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {generations.map((gen) => (
          <Card key={gen.id} className="overflow-hidden cursor-pointer hover:border-cyan-500 transition-all group" onClick={() => gen.url && setSelectedImage(gen)}>
            {gen.url ? (
              <div className="relative overflow-hidden bg-gray-800">
                <img src={gen.url} alt={gen.prompt} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            ) : (
              <div className="w-full aspect-square bg-gray-800 flex items-center justify-center">
                <span className="text-gray-500 text-sm font-mono">{gen.status}</span>
              </div>
            )}
            <div className="p-4 bg-gray-900/40">
              <p className="text-sm text-cyan-400/70 line-clamp-2 font-mono">{gen.prompt}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-500 font-mono">{new Date(gen.createdAt).toLocaleDateString()}</span>
                <span className={`text-xs px-2 py-1 rounded font-mono ${
                  gen.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                  gen.status === 'FAILED' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>{gen.status}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage.url} alt={selectedImage.prompt} className="w-full rounded-lg" />
            <p className="text-white mt-6 text-center font-mono text-sm">{selectedImage.prompt}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Layout
function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen relative">
      <MatrixRain />
      <Scanlines />
      <GridOverlay />
      
      <nav className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-md border-b border-cyan-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <span className="text-2xl text-cyan-500 group-hover:text-cyan-400 transition-colors">✨</span>
              <span className="font-bold text-xl text-white hidden sm:inline">Neural.AI</span>
            </Link>
            
            <div className="hidden md:flex gap-8">
              <Link to="/" className="text-sm font-mono text-cyan-400/70 hover:text-cyan-400 transition-colors">[GENERATE]</Link>
              <Link to="/gallery" className="text-sm font-mono text-cyan-400/70 hover:text-cyan-400 transition-colors">[ARCHIVE]</Link>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-cyan-400">{user?.credits} Credits</p>
                <p className="text-xs text-cyan-400/60 font-mono">{user?.plan.toUpperCase()} TIER</p>
              </div>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="text-sm font-mono text-red-400/70 hover:text-red-400 transition-colors"
              >
                [EXIT]
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <Routes>
          <Route path="/" element={<Generator />} />
          <Route path="/gallery" element={<Gallery />} />
        </Routes>
      </main>
      
      <footer className="border-t border-cyan-500/10 text-center py-6 relative z-10">
        <p className="font-mono text-sm text-cyan-400/50">NEURAL.AI v5.0.0 | SYSTEM STATUS: ONLINE</p>
      </footer>
    </div>
  );
}

// App
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
      <Route path="/*" element={user ? <Layout /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
