import { Navigate, Outlet, useLocation, Link } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import { useSession } from '../hooks/useSession'
import { canAccess, roleHome } from '../services/access'
import type { Role } from '../types'
import { LoadingState, StatePanel } from './Ui'
export function RequireRole({ roles }: { roles: Role[] }) {
  const {driver,loading,authError}=useSession();const location=useLocation()
  if(loading)return <LoadingState label="Verifying your pit pass" detail="Checking your championship role and session." />
  if(!driver)return <Navigate to="/login" replace state={{from:location.pathname+location.search,authError}} />
  return canAccess(driver.role,roles)?<Outlet />:<AccessDeniedPage />
}
export function AccessDeniedPage() {
  const {driver}=useSession()
  return <StatePanel className="access-denied" eyebrow="403 / Restricted paddock" title="This area needs a different pit pass." description="Your account does not have permission to enter this part of Race Control." icon={<ShieldX size={32}/>} tone="critical" action={<Link className="button button-primary" to={driver?roleHome(driver.role):'/login'}>RETURN TO YOUR DASHBOARD</Link>} />
}
