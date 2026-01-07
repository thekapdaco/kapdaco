import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom plugin to suppress proxy connection errors when backend is not running
const suppressProxyErrors = () => {
  return {
    name: 'suppress-proxy-errors',
    configureServer(server) {
      // Intercept error events from the proxy middleware
      server.middlewares.use((req, res, next) => {
        // Store original error handler
        const originalEmit = res.emit.bind(res)
        
        // Intercept error events
        res.emit = function(event, ...args) {
          if (event === 'error') {
            const err = args[0]
            // Suppress ECONNREFUSED errors (backend not running)
            if (err && err.code === 'ECONNREFUSED') {
              // Silently handle - backend is not available
              return false
            }
          }
          return originalEmit(event, ...args)
        }
        next()
      })

      // Also intercept console.error for proxy-related errors
      const originalError = console.error
      console.error = (...args) => {
        const message = String(args[0] || '')
        // Filter out ECONNREFUSED proxy errors
        if (
          message.includes('ECONNREFUSED') ||
          (message.includes('proxy error') && message.includes('/api'))
        ) {
          // Suppress these specific proxy errors
          return
        }
        originalError.apply(console, args)
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    suppressProxyErrors()
  ],
  optimizeDeps: {
    exclude: ['@sentry/react'], // Exclude Sentry from dependency optimization (optional package)
  },
  ssr: {
    noExternal: [], // Allow Sentry to be external in SSR
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-icons': ['lucide-react'],
          // Split heavy pages
          'page-product': ['./src/pages/ProductDetail'],
          'page-checkout': ['./src/pages/Checkout'],
          'page-customize': ['./src/pages/customize/Customize'],
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
