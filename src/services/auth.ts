import { api } from './api'
import { isDevelopmentMock } from './mode'
import type { Driver, LoginCredentials, Role } from '../types'
export function validateIdentity(value: Driver): Driver {
  if (!value || typeof value.id !== 'string' || typeof value.name !== 'string' || typeof value.team !== 'string' || !['CANDIDATE','VOLUNTEER','ADMIN'].includes(value.role)) throw new Error('The server returned an invalid account. Contact race control.')
  return { id:value.id, name:value.name, team:value.team, role:value.role as Role }
}
const mock = import.meta.env.DEV ? () => import('./authMock') : null
export const authService = {
  async login(credentials: LoginCredentials): Promise<Driver> {
    if (isDevelopmentMock && mock) return (await mock()).mockLogin(credentials)
    const res = await api.post<Driver & { token?: string }>('/auth/login', credentials)
    if (res.data?.token) {
      try { localStorage.setItem('cgp_auth_token', res.data.token) } catch { /* ignore storage error */ }
    }
    return validateIdentity(res.data)
  },
  async me(signal?: AbortSignal): Promise<Driver | null> {
    if (isDevelopmentMock && mock) return (await mock()).mockMe()
    try {
      const res = await api.get<Driver & { token?: string }>('/auth/me', { signal })
      if (res.data?.token) {
        try { localStorage.setItem('cgp_auth_token', res.data.token) } catch { /* ignore storage error */ }
      }
      return validateIdentity(res.data)
    }
    catch (error) {
      const status = (error as { response?: { status: number } }).response?.status
      // 401 (unauthenticated guest) or 404 (no active session / cold start) means no user session
      if (status === 401 || status === 404) {
        try { localStorage.removeItem('cgp_auth_token') } catch { /* ignore */ }
        return null
      }
      throw error
    }
  },
  async logout() {
    try {
      if (!isDevelopmentMock) await api.post('/auth/logout')
      else if (mock) (await mock()).mockLogout()
    } finally {
      try { localStorage.removeItem('cgp_auth_token') } catch { /* ignore */ }
    }
  },
}
