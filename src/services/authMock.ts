import type { Driver, LoginCredentials } from '../types'
export const developmentAccounts = [
  { id:'CGP2026', password:'Race2026!', role:'CANDIDATE', name:'Demo Driver', team:'CPC / Preview grid' },
  { id:'VOLUNTEER2026', password:'Marshal2026!', role:'VOLUNTEER', name:'Demo Marshal', team:'CPC / Race control' },
  { id:'ADMIN2026', password:'Control2026!', role:'ADMIN', name:'Demo Organizer', team:'CPC / Administration' },
] as const
export function mockMe(): Driver | null {
  try { const stored=JSON.parse(sessionStorage.getItem('cgp-demo-driver') || 'null');const account=developmentAccounts.find(item=>item.id===stored?.id);return account ? {id:account.id,name:account.name,team:account.team,role:account.role} : null } catch { return null }
}
export async function mockLogin(credentials: LoginCredentials): Promise<Driver> {
  await new Promise(resolve=>setTimeout(resolve,350))
  const account=developmentAccounts.find(item=>item.id===credentials.driverId.trim().toUpperCase() && item.password===credentials.password)
  if (!account) throw new Error('Driver ID or password is incorrect. Check your credentials and try again.')
  const {id,name,team,role}=account;return {id,name,team,role}
}
export function mockLogout() { sessionStorage.removeItem('cgp-demo-driver') }
