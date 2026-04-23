import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // ── Dev server ────────────────────────────────────────────────
  server: {
    port: 5173,
    host: true,
  },

  // ── Preview (production preview / Railway) ────────────────────
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT ?? '4173'),
    allowedHosts: ['*'],
  },

  // ── Build optimisations ───────────────────────────────────────
  build: {
    // Raise warning threshold — our chunks are intentionally split
    chunkSizeWarningLimit: 600,

    // Target modern browsers for smaller output
    target: 'es2020',

    // Inline small assets as base64 to save round-trips
    assetsInlineLimit: 4096,

    // Source maps for production error tracking (disable if not needed)
    sourcemap: false,

    rollupOptions: {
      output: {
        // Deterministic chunk names for long-term caching
        chunkFileNames:  'assets/[name]-[hash].js',
        entryFileNames:  'assets/[name]-[hash].js',
        assetFileNames:  'assets/[name]-[hash][extname]',

        manualChunks: {
          // Core React — changes rarely, cache forever
          'react-vendor':   ['react', 'react-dom'],
          // React Flow — large, isolated chunk
          'flow-vendor':    ['reactflow'],
          // Network / realtime
          'socket-vendor':  ['socket.io-client'],
          'axios-vendor':   ['axios'],
          // State
          'zustand-vendor': ['zustand'],
          // PDF export — only loaded on demand
          'pdf-vendor':     ['jspdf', 'html2canvas'],
        },
      },
    },
  },
})
