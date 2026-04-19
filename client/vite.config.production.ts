import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    loader: 'tsx',
    include: [
      'src/**/*.tsx',
      'src/**/*.ts',
      'src/**/*.jsx',
      'src/**/*.js',
    ],
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    cors: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['framer-motion'],
        },
      },
    },
  },
  define: {
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || ''),
  },
})