import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useReducedMotion } from 'motion/react'
import { RaceWordmark } from './RacingIdentity'
import '../styles/brand-intro.css'

export const BRAND_INTRO_SESSION_KEY = 'cgp-brand-intro-v1'
export const BRAND_INTRO_DISABLE_KEY = 'cgp-brand-intro-disabled'

function isHomepage() {
  if (typeof window === 'undefined') return false
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  return path === '/'
}

function hasPlayed() {
  try {
    return sessionStorage.getItem(BRAND_INTRO_SESSION_KEY) === 'seen'
  } catch {
    return false
  }
}

function shouldShowIntro() {
  if (!isHomepage()) return false

  if (typeof window !== 'undefined') {
    const query = new URLSearchParams(window.location.search).get('intro')
    if (query === '0') return false
    if (query === '1') return true
  }

  try {
    if (sessionStorage.getItem(BRAND_INTRO_DISABLE_KEY) === '1') return false
    if (hasPlayed()) {
      if (import.meta.env.VITE_REPLAY_BRAND_INTRO === 'true') return true
      return false
    }
  } catch {
    // Continue if storage is restricted
  }

  return true
}

function rememberPlayed() {
  try {
    sessionStorage.setItem(BRAND_INTRO_SESSION_KEY, 'seen')
  } catch {
    // Storage restrictions should never break the experience
  }
}

export function BrandIntro({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion() === true
  const [visible, setVisible] = useState(shouldShowIntro)
  const [exiting, setExiting] = useState(false)
  const [fastExit, setFastExit] = useState(false)
  const [progress, setProgress] = useState(15)
  const [lights, setLights] = useState(0)
  const [lightsOut, setLightsOut] = useState(false)
  const [statusText, setStatusText] = useState('RACE CONTROL // INITIALIZING TELEMETRY')
  const exitingRef = useRef(false)
  const timers = useRef<number[]>([])
  const skipButton = useRef<HTMLButtonElement>(null)

  const clearTimers = useCallback(() => {
    for (const id of timers.current) {
      window.clearTimeout(id)
    }
    timers.current = []
  }, [])

  const finish = useCallback((immediate = false) => {
    if (exitingRef.current) return
    exitingRef.current = true
    rememberPlayed()
    clearTimers()

    if (immediate || reducedMotion) {
      setFastExit(true)
      setExiting(true)
      const timer = window.setTimeout(() => {
        setVisible(false)
        document.documentElement.classList.remove('brand-intro-active')
      }, reducedMotion ? 40 : 180)
      timers.current.push(timer)
      return
    }

    setExiting(true)
    const timer = window.setTimeout(() => {
      setVisible(false)
      document.documentElement.classList.remove('brand-intro-active')
    }, 680)
    timers.current.push(timer)
  }, [clearTimers, reducedMotion])

  useEffect(() => {
    if (!visible) {
      document.documentElement.classList.remove('brand-intro-active')
      return
    }

    document.documentElement.classList.add('brand-intro-active')

    if (reducedMotion) {
      const timer = window.setTimeout(() => finish(true), 300)
      timers.current.push(timer)
      return () => {
        window.clearTimeout(timer)
        document.documentElement.classList.remove('brand-intro-active')
      }
    }

    const schedule = (callback: () => void, delayMs: number) => {
      const id = window.setTimeout(callback, delayMs)
      timers.current.push(id)
    }

    // Telemetry & Lights sequence with authentic F1 timing
    schedule(() => {
      setProgress(35)
      setStatusText('CALIBRATING TRACK SENSORS...')
    }, 1100)

    schedule(() => {
      setProgress(60)
      setStatusText('GRID TELEMETRY ESTABLISHED')
    }, 1600)

    // Formula 1 starting sequence: 5 red lights turn ON sequentially
    schedule(() => {
      setProgress(75)
      setStatusText('STARTING SEQUENCE INITIATED')
      setLights(1)
    }, 2050)

    schedule(() => {
      setProgress(82)
      setLights(2)
    }, 2250)

    schedule(() => {
      setProgress(89)
      setLights(3)
    }, 2450)

    schedule(() => {
      setProgress(95)
      setLights(4)
    }, 2650)

    schedule(() => {
      setProgress(100)
      setLights(5)
      setStatusText('GRID ASSEMBLED // ALL LIGHTS ON')
    }, 2850)

    // LIGHTS OUT: Tense pause then sudden extinguish
    schedule(() => {
      setLightsOut(true)
      setStatusText('LIGHTS OUT & AWAY WE GO!')
    }, 3350)

    // Launch wipe into hero grid
    schedule(() => {
      finish(false)
    }, 3750)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === ' ' || event.key === 'Enter') {
        finish(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      clearTimers()
      window.removeEventListener('keydown', onKeyDown)
      document.documentElement.classList.remove('brand-intro-active')
    }
  }, [clearTimers, finish, reducedMotion, visible])

  return <>
    {visible && <section
      className={`brand-intro ${exiting ? 'is-exiting' : ''} ${fastExit ? 'is-fast-exit' : ''} ${reducedMotion ? 'is-reduced' : ''}`}
      aria-label="Code Grand Prix introduction sequence"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) finish(true)
      }}
    >
      <div className="brand-intro-atmosphere" aria-hidden="true"><span /><span /><span /></div>
      <div className="brand-intro-checks" aria-hidden="true" />
      <div className="brand-intro-ignition" aria-hidden="true"><i /></div>
      <div className="brand-intro-stripes" aria-hidden="true"><i /><i /><i /></div>

      <div className="brand-intro-stage">
        <div className="brand-intro-presenter">
          <div className="presenter-mark-wrap">
            <img
              src="/branding/cpc-mark-transparent.png"
              alt="Competitive Programming Club"
              width="1590"
              height="665"
            />
          </div>
          <div className="presenter-meta">
            <span className="presenter-org">COMPETITIVE PROGRAMMING CLUB</span>
            <span className="presenter-pres">PRESENTS CHAMPIONSHIP SEASON</span>
          </div>
          <span className="presenter-status">
            <i className="status-live-pulse" />
            LIVE
          </span>
        </div>

        <div className="brand-intro-wordmark-wrap">
          <RaceWordmark className="brand-intro-wordmark" />
          <span className="brand-intro-logo-sweep" aria-hidden="true" />
          <span className="brand-intro-season-badge">
            SEASON <b>2026</b> // FIA FORMULA 1 SPEC
          </span>
        </div>

        <div className="brand-intro-tagline">
          <span className="tagline-token tagline-code">
            <span className="tagline-num">01</span>
            <strong>CODE.</strong>
          </span>
          <span className="tagline-slash" aria-hidden="true">//</span>
          <span className="tagline-token tagline-compile">
            <span className="tagline-num">02</span>
            <strong>COMPILE.</strong>
          </span>
          <span className="tagline-slash" aria-hidden="true">//</span>
          <span className="tagline-token tagline-conquer">
            <span className="tagline-num">03</span>
            <strong>CONQUER.</strong>
          </span>
        </div>
      </div>

      <div className="brand-intro-readiness">
        <div className="brand-intro-readiness-label">
          <div className={`readiness-hud-left ${lightsOut ? 'is-ready' : ''}`}>
            <span className="readiness-led-beacon" />
            <span>RACE CONTROL</span>
          </div>
          <span className="readiness-hud-status">{statusText}</span>
        </div>

        <div className="brand-intro-progress-wrap">
          <div
            className="brand-intro-progress"
            role="progressbar"
            aria-label="Grid telemetry initialization"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <span style={{ transform: `scaleX(${progress / 100})` }} />
          </div>
          <div className="progress-ticks" aria-hidden="true">
            <i /><i /><i /><i /><i /><i /><i /><i /><i />
          </div>
        </div>

        <div className={`brand-intro-gantry ${lightsOut ? 'is-lights-out' : ''}`} aria-hidden="true">
          {[1, 2, 3, 4, 5].map((pod) => (
            <div key={pod} className={`gantry-lamp-unit ${lights >= pod ? 'is-lit' : ''}`}>
              <div className="gantry-lamp-inner" />
            </div>
          ))}
        </div>
      </div>

      <div className="brand-intro-wipe" aria-hidden="true"><i /><i /><i /></div>
      <button
        ref={skipButton}
        className="brand-intro-skip"
        type="button"
        onClick={() => finish(true)}
        aria-label="Skip introduction"
      >
        Skip intro <kbd>ESC</kbd>
      </button>
      <p className="sr-only" role="status">{statusText}</p>
    </section>}
    {children}
  </>
}
