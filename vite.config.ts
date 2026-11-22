import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

const publicSettings = ['VITE_ARENA_MODE', 'VITE_API_BASE_URL', 'VITE_MONITORING_POLL_MS']

function validApiBase(value: string, production: boolean) {
  if (value === '/api') return true
  try {
    const url = new URL(value)
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/api') return false
    return url.protocol === 'https:' || (!production && url.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
  } catch { return false }
}

export default defineConfig(({ command, mode }) => {
  const publicEnv = loadEnv(mode, process.cwd(), 'VITE_')
  const proxyEnv = loadEnv(mode, process.cwd(), 'CGP_API_PROXY_TARGET')
  const build = command === 'build'
  if (build && process.env.NODE_ENV !== 'production') {
    throw new Error('Build deployable assets with NODE_ENV=production. Use the Vite dev server for mocks.')
  }
  if (publicEnv.VITE_ARENA_MODE === 'api' && !validApiBase(publicEnv.VITE_API_BASE_URL ?? '/api', build)) {
    throw new Error('VITE_API_BASE_URL must be /api or a permitted API URL ending in /api.')
  }
  return {
    plugins: [react(), tailwindcss()],
    envPrefix: [],
    define: Object.fromEntries(publicSettings.map(key => [
      'import.meta.env.' + key, JSON.stringify(publicEnv[key]) ?? 'undefined',
    ])),
    server: {
      proxy: { '/api': proxyEnv.CGP_API_PROXY_TARGET || 'http://127.0.0.1:4000' },
    },
  }
})
