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
    return validateIdentity((await api.post<Driver>('/auth/login',credentials)).data)
  },
  async me(signal?: AbortSignal): Promise<Driver | null> {
    if (isDevelopmentMock && mock) return (await mock()).mockMe()
    try { return validateIdentity((await api.get<Driver>('/auth/me',{signal})).data) }
    catch (error) { if ((error as { response?: { status: number } }).response?.status === 401) return null; throw error }
  },
  async logout() { if (!isDevelopmentMock) await api.post('/auth/logout'); else if(mock) (await mock()).mockLogout() },
}
