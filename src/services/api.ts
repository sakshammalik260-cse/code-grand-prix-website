import axios from 'axios'
import { isBackendConfigured } from './mode'
export const AUTH_SESSION_EXPIRED = 'cgp:auth-session-expired'
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config=>{if(!isBackendConfigured)throw new Error('Race services are not connected yet. Contact CPC race control.');return config})

api.interceptors.response.use(undefined, (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const details = error.response?.data?.error
    if (status === 503 && (details?.code === 'JUDGE_UNAVAILABLE' ||
      (!details?.code && error.config?.url?.startsWith('/code/')))) {
      error.message = 'Code execution is temporarily unavailable. Please contact Race Control.'
    } else if (typeof details?.message === 'string') {
      error.message = details.message
    }
    if (status === 401 && !['/auth/login', '/auth/me', '/auth/logout'].includes(error.config?.url || '')) {
      window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED))
    }
  }
  return Promise.reject(error)
})
