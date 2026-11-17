import { Navigate, Outlet, useLocation, Link } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import { useSession } from '../hooks/useSession'
import { canAccess, roleHome } from '../services/access'
import type { Role } from '../types'
export function RequireRole({ roles }: { roles: Role[] }) {
  const {driver,loading,authError}=useSession();const location=useLocation()
  if(loading)return <div className="arena-load-screen" role="status">Verifying your pit pass...</div>
  if(!driver)return <Navigate to="/login" replace state={{from:location.pathname+location.search,authError}} />
  return canAccess(driver.role,roles)?<Outlet />:<AccessDeniedPage />
}
export function AccessDeniedPage() {
  const {driver}=useSession()
  return <section className="access-denied"><span className="admin-eyebrow">403 / RESTRICTED PADDOCK</span><ShieldX size={56}/><h1>This area needs a different pit pass.</h1><p>Your account does not have permission to enter this part of Race Control.</p><Link className="button button-primary" to={driver?roleHome(driver.role):'/login'}>RETURN TO YOUR DASHBOARD</Link></section>
}
