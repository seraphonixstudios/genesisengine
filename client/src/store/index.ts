import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_URL = '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  plan: string;
}

interface Generation {
  id: string;
  prompt: string;
  negativePrompt?: string;
  model: string;
  width: number;
  height: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  url?: string;
  thumbnailUrl?: string;
  createdAt: string;
  error?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const response = await api.post('/api/auth/login', { email, password });
        const { user, token } = response.data;
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },

      register: async (email, password, name) => {
        const response = await api.post('/api/auth/register', { email, password, name });
        const { user, token } = response.data;
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

interface GenerationState {
  generations: Generation[];
  models: any[];
  isGenerating: boolean;
  currentGeneration: Generation | null;
  progress: number;
  fetchGenerations: () => Promise<void>;
  fetchModels: () => Promise<void>;
  generate: (data: any) => Promise<void>;
  addGeneration: (generation: Generation) => void;
  updateGeneration: (id: string, data: Partial<Generation>) => void;
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  generations: [],
  models: [],
  isGenerating: false,
  currentGeneration: null,
  progress: 0,

  fetchGenerations: async () => {
    const response = await api.get('/api/generations');
    set({ generations: response.data });
  },

  fetchModels: async () => {
    const response = await api.get('/api/models');
    set({ models: response.data });
  },

  generate: async (data) => {
    set({ isGenerating: true, progress: 0 });
    try {
      const response = await api.post('/api/generate', data);
      const { generationId } = response.data;
      
      // Poll for status
      const interval = setInterval(async () => {
        try {
          const statusRes = await api.get(`/api/generations/${generationId}`);
          const generation = statusRes.data;
          
          set({ currentGeneration: generation });
          
          if (generation.status === 'COMPLETED') {
            clearInterval(interval);
            set({ isGenerating: false, progress: 100 });
            get().fetchGenerations();
          } else if (generation.status === 'FAILED') {
            clearInterval(interval);
            set({ isGenerating: false });
            throw new Error(generation.error || 'Generation failed');
          } else {
            set({ progress: generation.status === 'PROCESSING' ? 50 : 10 });
          }
        } catch (error) {
          clearInterval(interval);
          set({ isGenerating: false });
        }
      }, 2000);
    } catch (error) {
      set({ isGenerating: false });
      throw error;
    }
  },

  addGeneration: (generation) => {
    set((state) => ({
      generations: [generation, ...state.generations],
    }));
  },

  updateGeneration: (id, data) => {
    set((state) => ({
      generations: state.generations.map((g) =>
        g.id === id ? { ...g, ...data } : g
      ),
    }));
  },
}));

export { api };
