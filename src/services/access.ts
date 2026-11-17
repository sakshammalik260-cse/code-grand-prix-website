import type { Role } from '../types'
export const roleHome = (role: Role) => role === 'ADMIN' ? '/admin' : role === 'VOLUNTEER' ? '/volunteer' : '/check-in'
export const canAccess = (role: Role, allowed: readonly Role[]) => allowed.includes(role)
