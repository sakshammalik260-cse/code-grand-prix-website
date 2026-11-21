import { startTransition, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/route-transition.css'

type Phase = 'idle' | 'covering' | 'revealing'

export function RaceRouteTransition() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('idle')
  const phaseRef = useRef<Phase>('idle')

  useEffect(() => {
    const activeTimers: number[] = []
    let destinationPath = ''

    const setPageInert = (value: boolean) => {
      const main = document.getElementById('main')
      if (value) { main?.setAttribute('inert', ''); main?.setAttribute('aria-hidden', 'true') }
      else { main?.removeAttribute('inert'); main?.removeAttribute('aria-hidden') }
    }
    const finish = () => {
      if (phaseRef.current === 'idle') return
      phaseRef.current = 'idle'
      setPhase('idle')
      document.documentElement.classList.remove('race-route-transitioning')
      setPageInert(false)
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => document.getElementById('driver-id')?.focus({ preventScroll: true })))
    }
    const reveal = () => {
      if (phaseRef.current !== 'covering') return
      startTransition(() => navigate(destinationPath))
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
        setPageInert(true)
        phaseRef.current = 'revealing'
        setPhase('revealing')
      }))
      activeTimers.push(window.setTimeout(finish, 680))
    }
    const animationEnd = (event: AnimationEvent) => {
      const target = event.target as HTMLElement
      if (target.classList.contains('race-route-transition-red') && event.animationName === 'race-panel-cover') reveal()
      if (target.classList.contains('race-route-transition-black') && event.animationName === 'race-panel-reveal') finish()
    }
    const onClick = (event: MouseEvent) => {
      if (phaseRef.current !== 'idle' || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]')
      if (!anchor || anchor.target || anchor.hasAttribute('download')) return
      const destination = new URL(anchor.href, window.location.href)
      if (destination.origin !== window.location.origin || destination.pathname.replace(/\/+$/, '') !== '/login' || window.location.pathname.replace(/\/+$/, '') === '/login') return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      event.preventDefault()
      destinationPath = `${destination.pathname}${destination.search}${destination.hash}`
      phaseRef.current = 'covering'
      setPhase('covering')
      document.documentElement.classList.add('race-route-transitioning')
      setPageInert(true)
      activeTimers.push(window.setTimeout(reveal, 620))
    }
    document.addEventListener('click', onClick, true)
    document.addEventListener('animationend', animationEnd)
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('animationend', animationEnd)
      activeTimers.forEach(window.clearTimeout)
      document.documentElement.classList.remove('race-route-transitioning')
      setPageInert(false)
    }
  }, [navigate])

  if (phase === 'idle') return null
  return <div className="race-route-transition" data-phase={phase} aria-hidden="true">
    <span className="race-route-transition-black" />
    <span className="race-route-transition-red" />
    <span className="race-route-transition-checks" />
    <span className="race-route-transition-white" />
    <div className="race-route-transition-label"><i /> PIT LANE / DRIVER ACCESS <i /></div>
  </div>
}
