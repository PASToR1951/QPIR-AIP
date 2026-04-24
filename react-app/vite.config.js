/* global process */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const legacyTunnelHost = env.VITE_TUNNEL_HOST
  const publicHost = env.VITE_PUBLIC_HOST || legacyTunnelHost
  const devHost = env.VITE_DEV_HOST
  const devPort = Number(env.VITE_DEV_PORT || '5173')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET
  const allowedHosts = env.VITE_ALLOWED_HOSTS
    ? env.VITE_ALLOWED_HOSTS.split(',').map((host) => host.trim()).filter(Boolean)
    : publicHost
      ? [publicHost]
      : undefined
  const hmrProtocol = env.VITE_HMR_PROTOCOL || (legacyTunnelHost ? 'wss' : 'ws')
  const hmrClientPort = Number(
    env.VITE_HMR_CLIENT_PORT || (hmrProtocol === 'wss' ? '443' : String(devPort))
  )

  return {
    plugins: [react()],
    server: {
      // Allow imports from the monorepo root (e.g. docs/wiki/**/*.md?raw)
      fs: { allow: ['..'] },
      // When a public host is configured, listen on all interfaces and point HMR
      // at that host so phones/tablets on the LAN can reach the dev server.
      port: devPort,
      strictPort: Boolean(publicHost),
      host: devHost || (publicHost ? '0.0.0.0' : undefined),
      allowedHosts,
      hmr: publicHost
        ? { host: publicHost, clientPort: hmrClientPort, protocol: hmrProtocol }
        : undefined,
      proxy: apiProxyTarget
        ? {
            '/api': {
              target: apiProxyTarget,
              secure: false,
            },
            '/school-logos': {
              target: apiProxyTarget,
              secure: false,
            },
            '/cluster-logos': {
              target: apiProxyTarget,
              secure: false,
            },
            '/app-logo': {
              target: apiProxyTarget,
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
        'react-google-recaptcha-v3',
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
