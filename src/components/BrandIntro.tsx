import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { RaceWordmark } from './RacingIdentity'
import '../styles/brand-intro.css'

export const BRAND_INTRO_SESSION_KEY = 'cgp-brand-intro-v1'
export const BRAND_INTRO_DISABLE_KEY = 'cgp-brand-intro-disabled'

function storageValue(key: string) {
  try { return sessionStorage.getItem(key) } catch { return null }
}

function shouldShowIntro() {
  if (typeof window === 'undefined') return false
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  if (path !== '/') return false
  const query = new URLSearchParams(window.location.search).get('intro')
  if (query === '0' || storageValue(BRAND_INTRO_DISABLE_KEY) === '1') return false
  if (query === '1' || import.meta.env.VITE_REPLAY_BRAND_INTRO === 'true') return true
  return storageValue(BRAND_INTRO_SESSION_KEY) !== 'seen'
}

function rememberPlayed() {
  try { sessionStorage.setItem(BRAND_INTRO_SESSION_KEY, 'seen') } catch { /* Restricted storage must not block entry. */ }
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

export function BrandIntro({ children }: { children: ReactNode }) {
  const reducedMotion = usePrefersReducedMotion()
  const [visible, setVisible] = useState(shouldShowIntro)
  const [exiting, setExiting] = useState(false)
  const [fastExit, setFastExit] = useState(false)
  const [lights, setLights] = useState(0)
  const [lightsOut, setLightsOut] = useState(false)
  const timers = useRef<number[]>([])
  const finishing = useRef(false)
  const skipButton = useRef<HTMLButtonElement>(null)

  const clearTimers = useCallback(() => {
    timers.current.forEach(window.clearTimeout)
    timers.current = []
  }, [])

  const finish = useCallback((immediate = false) => {
    if (finishing.current) return
    finishing.current = true
    rememberPlayed()
    clearTimers()
    setFastExit(immediate || reducedMotion)
    setExiting(true)
    const timer = window.setTimeout(() => {
      setVisible(false)
      document.documentElement.classList.remove('brand-intro-active')
      window.requestAnimationFrame(() => document.getElementById('main')?.focus({ preventScroll: true }))
    }, immediate || reducedMotion ? 140 : 560)
    timers.current.push(timer)
  }, [clearTimers, reducedMotion])

  useEffect(() => {
    if (!visible) return
    document.documentElement.classList.add('brand-intro-active')
    window.requestAnimationFrame(() => skipButton.current?.focus({ preventScroll: true }))

    if (reducedMotion) {
      const timer = window.setTimeout(() => finish(true), 450)
      timers.current.push(timer)
      return () => { window.clearTimeout(timer); document.documentElement.classList.remove('brand-intro-active') }
    }

    const schedule = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(callback, delay)
      timers.current.push(timer)
    }
    ;[1, 2, 3, 4, 5].forEach((value, index) => schedule(() => setLights(value), 1280 + index * 180))
    schedule(() => setLightsOut(true), 2380)
    schedule(() => finish(false), 2700)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') { event.preventDefault(); skipButton.current?.focus(); return }
      if (!['Escape', ' ', 'Enter'].includes(event.key)) return
      event.preventDefault()
      finish(true)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      clearTimers()
      window.removeEventListener('keydown', onKeyDown)
      document.documentElement.classList.remove('brand-intro-active')
    }
  }, [clearTimers, finish, reducedMotion, visible])

  const status = lightsOut ? 'LIGHTS OUT // ENTERING THE GRID' : lights ? `START SEQUENCE // ${lights} OF 5` : 'RACE CONTROL // SYNCHRONIZING GRID'

  return <>
    {visible && <section className={`brand-intro ${exiting ? 'is-exiting' : ''} ${fastExit ? 'is-fast-exit' : ''} ${lightsOut ? 'is-lights-out' : ''}`} role="dialog" aria-modal="true" aria-label="Code Grand Prix introduction">
      <div className="brand-intro-grid" aria-hidden="true" />
      <div className="brand-intro-track" aria-hidden="true"><i /><i /><i /></div>
      <div className="brand-intro-corner brand-intro-corner-left" aria-hidden="true" />
      <div className="brand-intro-corner brand-intro-corner-right" aria-hidden="true" />

      <header className="brand-intro-broadcast">
        <div className="brand-intro-promoter"><img src="/branding/cpc-mark.webp" width="320" height="134" alt="Competitive Programming Club" /><span>CPC CLUB<small>PRESENTS</small></span></div>
        <span className="brand-intro-round">CHAMPIONSHIP 2026 <i /> ROUND 01</span>
      </header>

      <div className="brand-intro-stage">
        <p className="brand-intro-kicker"><span /> THE ULTIMATE CODING CIRCUIT <span /></p>
        <div className="brand-intro-title"><RaceWordmark className="brand-intro-wordmark" /><span className="brand-intro-title-scan" aria-hidden="true" /></div>
        <p className="brand-intro-season">SEASON <strong>2026</strong> / CPC COMPETITIVE PROGRAMMING CHAMPIONSHIP</p>
        <div className="brand-intro-mantra" aria-label="Code, compile, conquer"><span><small>01</small>CODE</span><i>//</i><span><small>02</small>COMPILE</span><i>//</i><span><small>03</small>CONQUER</span></div>
      </div>

      <div className="brand-intro-control">
        <div className="brand-intro-control-label"><span><i /> RACE CONTROL</span><strong>{status}</strong></div>
        <div className="brand-intro-progress" aria-hidden="true"><span /></div>
        <div className="brand-intro-gantry" aria-label={lightsOut ? 'Starting lights are out' : `${lights} of 5 starting lights illuminated`}>
          {[1, 2, 3, 4, 5].map(pod => <span key={pod} className={lights >= pod && !lightsOut ? 'is-lit' : ''} aria-hidden="true"><i /><i /></span>)}
        </div>
      </div>

      <div className="brand-intro-launch" aria-hidden="true"><span /><span /><span /></div>
      <button ref={skipButton} className="brand-intro-skip" type="button" onClick={() => finish(true)}>SKIP INTRO <kbd>ESC</kbd></button>
      <p className="sr-only" role="status" aria-live="polite">{status}</p>
    </section>}
    <div className="brand-intro-app" inert={visible ? true : undefined} aria-hidden={visible || undefined}>{children}</div>
  </>
}
