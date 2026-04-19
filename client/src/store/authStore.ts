import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  plan: 'free' | 'pro' | 'enterprise'
  credits: number
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  token: string | null
  setUser: (user: User) => void
  setToken: (token: string) => void
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  updateCredits: (credits: number) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,

      setUser: (user) => set({ user, isAuthenticated: true }),
      setToken: (token) => set({ token }),

      login: async (email, password) => {
        // API call would go here
        const mockUser: User = {
          id: '1',
          email,
          name: 'Demo User',
          plan: 'free',
          credits: 100,
        }
        set({ user: mockUser, isAuthenticated: true, token: 'mock-token' })
      },

      register: async (email, password, name) => {
        const mockUser: User = {
          id: '1',
          email,
          name,
          plan: 'free',
          credits: 100,
        }
        set({ user: mockUser, isAuthenticated: true, token: 'mock-token' })
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, token: null })
      },

      updateCredits: (credits) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, credits } })
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)

interface ThemeState {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark') => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light'
        set({ theme: newTheme })
        document.documentElement.classList.toggle('dark', newTheme === 'dark')
      },
      setTheme: (theme) => {
        set({ theme })
        document.documentElement.classList.toggle('dark', theme === 'dark')
      },
    }),
    {
      name: 'theme-storage',
    }
  )
)

interface GenerationState {
  isGenerating: boolean
  progress: number
  currentJob: any | null
  recentGenerations: any[]
  setGenerating: (isGenerating: boolean) => void
  setProgress: (progress: number) => void
  setCurrentJob: (job: any) => void
  addGeneration: (generation: any) => void
}

export const useGenerationStore = create<GenerationState>((set) => ({
  isGenerating: false,
  progress: 0,
  currentJob: null,
  recentGenerations: [],
  setGenerating: (isGenerating) => set({ isGenerating }),
  setProgress: (progress) => set({ progress }),
  setCurrentJob: (job) => set({ currentJob: job }),
  addGeneration: (generation) =>
    set((state) => ({
      recentGenerations: [generation, ...state.recentGenerations].slice(0, 20),
    })),
}))
