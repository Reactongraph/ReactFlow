import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT ?? '4173'),
    allowedHosts: ['*'],
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':    ['react', 'react-dom'],
          'flow-vendor':     ['reactflow'],
          'socket-vendor':   ['socket.io-client'],
          'axios-vendor':    ['axios'],
          'zustand-vendor':  ['zustand'],
        },
      },
    },
  },
})