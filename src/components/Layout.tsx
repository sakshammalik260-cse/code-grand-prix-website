import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { ArrowUpRight, Flag, LogOut, Menu, X } from 'lucide-react'
import { useSession } from '../hooks/useSession'
import { roleHome } from '../services/access'
import { event } from '../data/event'
import { scrollPublicTarget, scrollPublicTop } from '../services/publicScroll'
import { ClubMark, ClubLogo, RaceWordmark } from './RacingIdentity'
import chrome from './PublicShell.module.css'

export function Brand() {
  return <Link to="/" className="brand" aria-label="Code Grand Prix home"><span className="brand-mark"><Flag size={25} fill="currentColor" /></span><span>CODE GRAND PRIX<small>CPC CLUB <i /> SEASON 2026</small></span></Link>
}
function ScrollToPage() {
  const { pathname, hash, key } = useLocation()
  const previousPath = useRef(pathname)
  useEffect(() => {
    const routeChanged = previousPath.current !== pathname
    previousPath.current = pathname
    const focusTarget = (container: Element | null, force = false) => {
      if ((!routeChanged && !force) || !container) return
      const target = container.matches('h1,h2') ? container as HTMLElement : container.querySelector<HTMLElement>('h1,h2')
      if (!target) return
      target.tabIndex = -1
      window.requestAnimationFrame(() => target.focus({ preventScroll: true }))
    }
    if (hash) {
      let id = hash.slice(1)
      try { id = decodeURIComponent(id) } catch { /* Invalid hashes have no matching section. */ }
      const scrollToTarget = () => {
        const target = document.getElementById(id)
        if (!target) return false
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (!scrollPublicTarget(target, reduced)) target.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' })
        focusTarget(target, true)
        return true
      }
      if (scrollToTarget()) return
      const observer = new MutationObserver(() => { if (scrollToTarget()) observer.disconnect() })
      observer.observe(document.getElementById('main') ?? document.body, { childList: true, subtree: true })
      return () => observer.disconnect()
    } else {
      if (!scrollPublicTop()) window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      document.querySelector('.dashboard-route-shell > main')?.scrollTo({ top: 0, behavior: 'instant' })
      focusTarget(document.getElementById('main'))
    }
  }, [pathname, hash, key])
  return null
}
export function Layout() {
  const { driver, signOut } = useSession()
  const { pathname: requestedPath } = useLocation()
  const pathname = requestedPath.toLowerCase().replace(/\/+$/, '') || '/'
  const [menuPath, setMenuPath] = useState<string | null>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const open = menuPath === pathname
  const cinematic = ['/', '/login', '/check-in', '/lobby'].includes(pathname)
  const home = pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState(home ? 'home' : '')
  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setMenuPath(null)
      window.requestAnimationFrame(() => menuButtonRef.current?.focus())
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [open])
  useEffect(() => {
    let frame = 0
    const update = () => { frame = 0; setScrolled(window.scrollY > 24) }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame) }
  }, [])
  useEffect(() => {
    if (!home) return
    const ids = ['home', 'about', 'schedule', 'access', 'rules', 'contact']
    let frame = 0
    const update = () => {
      frame = 0
      const threshold = (document.querySelector('.site-header')?.getBoundingClientRect().height || 0) + 48
      let current = 'home'
      for (const id of ids) {
        const section = document.getElementById(id)
        if (section && section.getBoundingClientRect().top <= threshold) current = id
      }
      setActiveSection(current)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(frame) }
  }, [home])
  const currentSection = home ? activeSection : ''
  const volunteerRoute = pathname === '/volunteer' || pathname.startsWith('/volunteer/'), adminRoute = pathname === '/admin' || pathname.startsWith('/admin/')
  if (pathname === '/arena' || pathname === '/results' || volunteerRoute || adminRoute) {
    const shell = pathname === '/arena' ? 'arena-route-shell' : `dashboard-route-shell ${volunteerRoute ? 'volunteer-route-shell' : ''}`
    return <div className={shell}><ScrollToPage /><a className="skip-link" href={pathname === '/arena' ? '#arena-language' : '#main'}>{pathname === '/arena' ? 'Skip to code editor' : 'Skip to content'}</a><main id="main" tabIndex={-1}><Outlet /></main></div>
  }
  return <div className={cinematic ? `app-shell public-site-shell cinematic-shell ${home ? 'home-shell' : 'entry-shell'} ${pathname === '/login' ? 'login-shell' : ''}` : 'app-shell public-site-shell'}>
    <ScrollToPage /><a className="skip-link" href="#main">Skip to content</a>
    <header className={`site-header ${chrome.header} ${cinematic ? 'race-header' : ''} ${scrolled ? `is-scrolled ${chrome.scrolled}` : ''}`}><div className={`nav-shell ${chrome.navShell}`}>
      {cinematic ? home ? <ClubMark /> : <Link to="/" className="header-wordmark" aria-label="Code Grand Prix home"><RaceWordmark /></Link> : <Brand />}
      <button ref={menuButtonRef} className={`icon-button mobile-menu ${chrome.menuButton}`} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="main-navigation" onClick={() => setMenuPath(open ? null : pathname)}>{open ? <X /> : <Menu />}</button>
      <nav id="main-navigation" className={`navigation ${chrome.navigation} ${open ? `open ${chrome.navigationOpen}` : ''}`} aria-label="Main navigation" onClick={() => { const moveFocus = open; setMenuPath(null); if (moveFocus) window.requestAnimationFrame(() => document.getElementById('main')?.focus({ preventScroll: true })) }}>
        <Link to="/#home" className={currentSection === 'home' ? 'active' : undefined} aria-current={currentSection === 'home' ? 'location' : undefined}>{cinematic ? 'Home' : 'Overview'}</Link>
        <Link to="/#about" className={currentSection === 'about' ? 'active' : undefined} aria-current={currentSection === 'about' ? 'location' : undefined}>{cinematic ? 'About' : 'The race'}</Link>
        {cinematic && <Link to="/#schedule" className={currentSection === 'schedule' ? 'active' : undefined} aria-current={currentSection === 'schedule' ? 'location' : undefined}>Schedule</Link>}
        {cinematic && <Link to="/#access" className={currentSection === 'access' ? 'active' : undefined} aria-current={currentSection === 'access' ? 'location' : undefined}>Access</Link>}
        <Link to="/#rules" className={currentSection === 'rules' ? 'active' : undefined} aria-current={currentSection === 'rules' ? 'location' : undefined}>{cinematic ? 'Rules' : 'Rulebook'}</Link>
        {driver?.role !== 'VOLUNTEER' && <NavLink to="/results">Results</NavLink>}
      </nav>
      <div className={`nav-actions ${chrome.actions}`}>{!cinematic && <span className="season-label"><span className="status-dot" /> RACE WEEK</span>}{driver ? <><Link className="nav-cta" to={roleHome(driver.role)} title={`Open ${driver.id} dashboard`}>{driver.id}<ArrowUpRight size={16} /></Link><button className="icon-button" onClick={signOut} aria-label="Sign out"><LogOut size={17} /></button></> : <Link className="nav-cta" to="/login">Driver login <ArrowUpRight size={16} /></Link>}</div>
    </div></header>
    <main id="main" tabIndex={-1}><Outlet /></main>
    {(!cinematic || home) && <footer id="contact" className={`site-footer ${chrome.footer}`}>
      <div className={chrome.footerBackdrop} aria-hidden="true">CODE / COMPILE / CONQUER</div>
      <div className="footer-main">
        <Link to="/" aria-label="Competitive Programming Club home"><ClubLogo className="cpc-footer-logo" /></Link>
        <div className="footer-statement"><span>CODE. COMPILE. CONQUER.</span><p>Built for the thrill of solving and the discipline of competition.</p></div>
        <div className="footer-event"><span>EVENT DAY</span><strong><time dateTime={event.date}>{event.dateLabel.toUpperCase()}</time></strong><small>{event.university}<br />Participant support: on-site CPC volunteer desk.</small></div>
        <nav className="footer-navigation" aria-label="Footer navigation"><Link to="/#about">About CPC</Link><Link to="/#schedule">Schedule</Link><Link to="/#access">Driver access</Link><Link to="/#rules">Rulebook</Link><Link to="/login">Driver login</Link></nav>
      </div>
      <div className="footer-bottom"><span>© 2026 CPC Club <span className="footer-divider">/</span> {event.university}</span><span>YOUR LOGIC. YOUR SPEED. YOUR RACE.</span></div>
    </footer>}
  </div>
}
export function RequireCheckIn() {
  const { driver, checkIn } = useSession()
  return checkIn && checkIn.driverId === driver?.id ? <Outlet /> : <Navigate to="/check-in" replace />
}
