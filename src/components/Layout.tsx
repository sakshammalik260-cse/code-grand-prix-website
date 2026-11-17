import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { ArrowUpRight, Flag, LogOut, Menu, X } from 'lucide-react'
import { useSession } from '../hooks/useSession'
import { ClubMark, RaceWordmark } from './RacingIdentity'

export function Brand() {
  return <Link to="/" className="brand" aria-label="Code Grand Prix home"><span className="brand-mark"><Flag size={25} fill="currentColor" /></span><span>CODE GRAND PRIX<small>CPC CLUB <i /> SEASON 2026</small></span></Link>
}
function ScrollToPage() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    else window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}
export function Layout() {
  const { driver, signOut } = useSession()
  const { pathname } = useLocation()
  const [menuPath, setMenuPath] = useState<string | null>(null)
  const open = menuPath === pathname
  const cinematic = ['/', '/login', '/check-in', '/lobby'].includes(pathname)
  const home = pathname === '/'
  if (pathname === '/arena') return <div className="arena-route-shell"><ScrollToPage /><a className="skip-link" href="#arena-language">Skip to code editor</a><main id="main" tabIndex={-1}><Outlet /></main></div>
  return <div className={cinematic ? `app-shell cinematic-shell ${home ? 'home-shell' : 'entry-shell'} ${pathname === '/login' ? 'login-shell' : ''}` : 'app-shell'}>
    <ScrollToPage /><a className="skip-link" href="#main">Skip to content</a>
    <header className={`site-header ${cinematic ? 'race-header' : ''}`}><div className="nav-shell">
      {cinematic ? home ? <ClubMark /> : <Link to="/" className="header-wordmark" aria-label="Code Grand Prix home"><RaceWordmark /></Link> : <Brand />}
      <button className="icon-button mobile-menu" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="main-navigation" onClick={() => setMenuPath(open ? null : pathname)}>{open ? <X /> : <Menu />}</button>
      <nav id="main-navigation" className={open ? 'navigation open' : 'navigation'} aria-label="Main navigation" onClick={() => setMenuPath(null)}>
        <NavLink to="/" end>{cinematic ? 'Home' : 'Overview'}</NavLink><Link to="/#about">{cinematic ? 'About' : 'The race'}</Link><Link to="/#rules">{cinematic ? 'Rules' : 'Rulebook'}</Link>
        {cinematic && <><Link to="/#schedule">Schedule</Link><Link to="/#contact">Contact</Link></>}
        <NavLink to="/results">Results</NavLink>
      </nav>
      <div className="nav-actions">{!cinematic && <span className="season-label"><span className="status-dot" /> RACE WEEK</span>}{driver ? <><Link className="nav-cta" to="/check-in">{driver.id}<ArrowUpRight size={16} /></Link><button className="icon-button" onClick={signOut} aria-label="Sign out"><LogOut size={17} /></button></> : <Link className="nav-cta" to="/login">Driver login <ArrowUpRight size={16} /></Link>}</div>
    </div></header>
    <main id="main" tabIndex={-1}><Outlet /></main>
    {(!cinematic || home) && <footer id="contact" className="site-footer"><Brand /><p>Built for the thrill of solving.</p><span>© 2026 CPC Club <span className="footer-divider">/</span> Jain (Deemed-to-be) University</span></footer>}
  </div>
}
export function RequireDriver() {
  const { driver } = useSession()
  return driver ? <Outlet /> : <Navigate to="/login" replace />
}
export function RequireCheckIn() {
  const { driver, checkIn } = useSession()
  return checkIn && checkIn.driverId === driver?.id ? <Outlet /> : <Navigate to="/check-in" replace />
}
