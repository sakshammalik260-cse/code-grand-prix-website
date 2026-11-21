import { useEffect, type RefObject } from 'react'
import Lenis from 'lenis'

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value))

export function useLandingRaceMotion(heroRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finePointer = window.matchMedia('(pointer: fine)')
    let sceneFrame = 0
    let pendingScroll = window.scrollY
    let lastProgress = -1

    const updateScene = (scrollY: number) => {
      const range = Math.max(1, hero.offsetHeight * .94)
      const progress = reduced.matches ? 0 : clamp(scrollY / range, 0, 1)
      if (Math.abs(progress - lastProgress) < .0005) return
      lastProgress = progress
      hero.style.setProperty('--race-progress', progress.toFixed(4))
      hero.style.setProperty('--race-copy-y', `${(-progress * 48).toFixed(2)}px`)
      hero.style.setProperty('--race-copy-opacity', clamp(1 - progress * 1.18, .08, 1).toFixed(3))
      hero.style.setProperty('--race-control-y', `${(-progress * 29).toFixed(2)}px`)
      hero.style.setProperty('--race-control-opacity', clamp(1 - progress * 1.05, .16, 1).toFixed(3))
      hero.style.setProperty('--race-telemetry-y', `${(progress * 36).toFixed(2)}px`)
      hero.style.setProperty('--race-telemetry-opacity', clamp(1 - progress * 1.5, 0, 1).toFixed(3))
    }

    const scheduleScene = (scrollY = window.scrollY) => {
      pendingScroll = scrollY
      if (sceneFrame) return
      sceneFrame = window.requestAnimationFrame(() => { sceneFrame = 0; updateScene(pendingScroll) })
    }

    const motionObserver = new IntersectionObserver(([entry]) => {
      hero.dataset.motionActive = String(entry.isIntersecting)
    }, { rootMargin: '220px 0px' })
    motionObserver.observe(hero)

    const useLenis = !reduced.matches && finePointer.matches && window.innerWidth >= 800
    let lenis: Lenis | null = null
    const nativeScroll = () => scheduleScene()
    const visibility = () => {
      if (!lenis) return
      if (document.hidden) lenis.stop()
      else lenis.start()
    }

    if (useLenis) {
      lenis = new Lenis({
        lerp: .1,
        smoothWheel: true,
        syncTouch: false,
        anchors: true,
        autoRaf: true,
        prevent: node => !!node.closest('input, textarea, select, [contenteditable="true"], [data-native-scroll]'),
      })
      lenis.on('scroll', event => scheduleScene(event.scroll))
      document.addEventListener('visibilitychange', visibility)
    } else {
      window.addEventListener('scroll', nativeScroll, { passive: true })
    }

    const resize = () => { lastProgress = -1; scheduleScene() }
    const motionChange = () => { lastProgress = -1; scheduleScene(); if (reduced.matches) lenis?.stop(); else lenis?.start() }
    window.addEventListener('resize', resize)
    reduced.addEventListener('change', motionChange)
    updateScene(window.scrollY)

    return () => {
      if (sceneFrame) window.cancelAnimationFrame(sceneFrame)
      motionObserver.disconnect()
      lenis?.destroy()
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('scroll', nativeScroll)
      window.removeEventListener('resize', resize)
      reduced.removeEventListener('change', motionChange)
      delete hero.dataset.motionActive
    }
  }, [heroRef])
}
