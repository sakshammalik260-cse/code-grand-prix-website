import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { ArrowUpRight, Flag, LogOut, Menu, X } from 'lucide-react'
import { useSession } from '../hooks/useSession'
import { roleHome } from '../services/access'
import { ClubMark, ClubLogo, RaceWordmark } from './RacingIdentity'

export function Brand() {
  return <Link to="/" className="brand" aria-label="Code Grand Prix home"><span className="brand-mark"><Flag size={25} fill="currentColor" /></span><span>CODE GRAND PRIX<small>CPC CLUB <i /> SEASON 2026</small></span></Link>
}
function ScrollToPage() {
  const { pathname, hash, key } = useLocation()
  useEffect(() => {
    if (hash) {
      let id = hash.slice(1)
      try { id = decodeURIComponent(id) } catch { /* Invalid hashes have no matching section. */ }
      document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      document.querySelector('.dashboard-route-shell > main')?.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [pathname, hash, key])
  return null
}
export function Layout() {
  const { driver, signOut } = useSession()
  const { pathname: requestedPath } = useLocation()
  const pathname = requestedPath.toLowerCase().replace(/\/+$/, '') || '/'
  const [menuPath, setMenuPath] = useState<string | null>(null)
  const open = menuPath === pathname
  const cinematic = ['/', '/login', '/check-in', '/lobby'].includes(pathname)
  const home = pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    let frame = 0
    const update = () => { frame = 0; setScrolled(window.scrollY > 24) }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame) }
  }, [])
  if (pathname === '/arena' || pathname === '/results' || pathname.startsWith('/volunteer') || pathname.startsWith('/admin')) {
    const shell = pathname === '/arena' ? 'arena-route-shell' : `dashboard-route-shell ${pathname.startsWith('/volunteer') ? 'volunteer-route-shell' : ''}`
    return <div className={shell}><ScrollToPage /><a className="skip-link" href={pathname === '/arena' ? '#arena-language' : '#main'}>{pathname === '/arena' ? 'Skip to code editor' : 'Skip to content'}</a><main id="main" tabIndex={-1}><Outlet /></main></div>
  }
  return <div className={cinematic ? `app-shell public-site-shell cinematic-shell ${home ? 'home-shell' : 'entry-shell'} ${pathname === '/login' ? 'login-shell' : ''}` : 'app-shell public-site-shell'}>
    <ScrollToPage /><a className="skip-link" href="#main">Skip to content</a>
    <header className={`site-header ${cinematic ? 'race-header' : ''} ${scrolled ? 'is-scrolled' : ''}`}><div className="nav-shell">
      {cinematic ? home ? <ClubMark /> : <Link to="/" className="header-wordmark" aria-label="Code Grand Prix home"><RaceWordmark /></Link> : <Brand />}
      <button className="icon-button mobile-menu" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="main-navigation" onClick={() => setMenuPath(open ? null : pathname)}>{open ? <X /> : <Menu />}</button>
      <nav id="main-navigation" className={open ? 'navigation open' : 'navigation'} aria-label="Main navigation" onClick={() => setMenuPath(null)}>
        <NavLink to="/#home" end>{cinematic ? 'Home' : 'Overview'}</NavLink><Link to="/#about">{cinematic ? 'About' : 'The race'}</Link><Link to="/#rules">{cinematic ? 'Rules' : 'Rulebook'}</Link>
        {cinematic && <><Link to="/#schedule">Schedule</Link><Link to="/#contact">Contact</Link></>}
        <NavLink to="/results">Results</NavLink>
      </nav>
      <div className="nav-actions">{!cinematic && <span className="season-label"><span className="status-dot" /> RACE WEEK</span>}{driver ? <><Link className="nav-cta" to={roleHome(driver.role)}>{driver.id}<ArrowUpRight size={16} /></Link><button className="icon-button" onClick={signOut} aria-label="Sign out"><LogOut size={17} /></button></> : <Link className="nav-cta" to="/login">Driver login <ArrowUpRight size={16} /></Link>}</div>
    </div></header>
    <main id="main" tabIndex={-1}><Outlet /></main>
    {(!cinematic || home) && <footer id="contact" className="site-footer"><Link to="/" aria-label="Competitive Programming Club home"><ClubLogo className="cpc-footer-logo"/></Link><p>Built for the thrill of solving.</p><span>© 2026 CPC Club <span className="footer-divider">/</span> Jain (Deemed-to-be) University</span></footer>}
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
