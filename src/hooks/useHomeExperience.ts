import { useEffect, useState } from 'react'

const motionKey = 'cgp-home-reduced-animation'

export function useHomeMotionPreference() {
  const [reduced, setReduced] = useState(() => {
    try { return localStorage.getItem(motionKey) === '1' } catch { return false }
  })
  return [reduced, (value: boolean) => {
    setReduced(value)
    try { localStorage.setItem(motionKey, value ? '1' : '0') } catch { /* Use the preference in memory. */ }
  }] as const
}

export function useHomeReveals(home: boolean) {
  useEffect(() => {
    if (!home || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('home-revealed')
        observer.unobserve(entry.target)
      }
    }, { threshold: 0.12 })
    document.querySelectorAll('.home-shell [data-home-reveal]').forEach(element => observer.observe(element))

    const updateVisibility = () => {
      document.querySelector('.home-shell')?.classList.toggle('home-motion-paused', document.hidden)
    }
    updateVisibility()
    document.addEventListener('visibilitychange', updateVisibility)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [home])
}
