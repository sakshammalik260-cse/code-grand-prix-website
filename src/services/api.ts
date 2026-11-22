import axios from 'axios'
import { isBackendConfigured } from './mode'

function resolveBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()
  if (!envUrl) return '/api'
  const clean = envUrl.replace(/\/+$/, '')
  // If user passed backend URL without /api, append it automatically
  if (!clean.endsWith('/api') && /^https?:\/\//i.test(clean)) {
    return `${clean}/api`
  }
  return clean
}

// Shared client for proposed endpoints. Arena requests use it only in explicit API mode.
export const api = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  if (!isBackendConfigured) throw new Error('Race services are not connected yet. Contact CPC race control.')
  const token = typeof window !== 'undefined' ? localStorage.getItem('cgp_auth_token') : null
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
