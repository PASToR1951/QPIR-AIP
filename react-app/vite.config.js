/* global process */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const tunnelHost = env.VITE_TUNNEL_HOST
  const apiProxyTarget = env.VITE_API_PROXY_TARGET

  return {
    plugins: [react()],
    server: {
      // In tunnel mode: listen on all interfaces and point HMR at the public host.
      // In local dev: default behaviour (127.0.0.1 only).
      host: tunnelHost ? '0.0.0.0' : undefined,
      allowedHosts: tunnelHost ? [tunnelHost] : undefined,
      hmr: tunnelHost
        ? { host: tunnelHost, clientPort: 443, protocol: 'wss' }
        : { host: 'localhost', port: 5173 },
      proxy: apiProxyTarget
        ? {
            '/api': {
              target: apiProxyTarget,
              changeOrigin: true,
              secure: false,
            },
            '/school-logos': {
              target: apiProxyTarget,
              changeOrigin: true,
              secure: false,
            },
            '/cluster-logos': {
              target: apiProxyTarget,
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },
    // Pre-bundle heavy deps in dev mode so they are served as single files
    // instead of hundreds of individual ESM requests.
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'framer-motion',
        'axios',
      ],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
            'vendor-motion': ['framer-motion'],
            'vendor-axios':  ['axios'],
          },
        },
      },
    },
  }
})
