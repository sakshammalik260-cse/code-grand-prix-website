import { useLayoutEffect, type RefObject } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { setPublicScroller } from '../services/publicScroll'

gsap.registerPlugin(ScrollTrigger)

const smoothQuery = '(min-width: 50rem) and (pointer: fine) and (prefers-reduced-motion: no-preference)'

export function useLandingRaceMotion(heroRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const hero = heroRef.current
    if (!hero) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const smoothMedia = window.matchMedia(smoothQuery)
    let lenis: Lenis | null = null
    let resizeFrame = 0
    let entrancePlayed = false
    hero.dataset.gsapScene = 'true'

    const ticker = (time: number) => lenis?.raf(time * 1000)
    const updateScrollTrigger = () => ScrollTrigger.update()
    const destroySmoothScroll = () => {
      if (!lenis) return
      gsap.ticker.remove(ticker)
      lenis.destroy()
      lenis = null
      setPublicScroller(null)
      delete document.documentElement.dataset.smoothScroll
    }
    const createSmoothScroll = () => {
      if (lenis || !smoothMedia.matches) return
      lenis = new Lenis({
        lerp: .085,
        smoothWheel: true,
        syncTouch: false,
        autoRaf: false,
        anchors: false,
        prevent: node => node instanceof Element && !!node.closest('input, textarea, select, [contenteditable="true"], [data-native-scroll]'),
      })
      lenis.on('scroll', updateScrollTrigger)
      setPublicScroller(lenis)
      gsap.ticker.add(ticker)
      gsap.ticker.lagSmoothing(0)
      document.documentElement.dataset.smoothScroll = 'lenis'
      if (document.hidden || document.querySelector('.brand-intro')) lenis.stop()
    }
    const reconcileSmoothScroll = () => {
      if (smoothMedia.matches) createSmoothScroll()
      else destroySmoothScroll()
      ScrollTrigger.refresh()
    }
    const visibilityChange = () => {
      if (!lenis) return
      if (document.hidden) lenis.stop()
      else if (!document.querySelector('.brand-intro')) lenis.start()
    }

    createSmoothScroll()
    document.addEventListener('visibilitychange', visibilityChange)
    smoothMedia.addEventListener('change', reconcileSmoothScroll)

    const gsapContext = gsap.context(() => {
      const artwork = hero.querySelector<HTMLElement>('[data-hero-layer="artwork"]')
      const shade = hero.querySelector<HTMLElement>('[data-hero-layer="shade"]')
      const grid = hero.querySelector<HTMLElement>('[data-hero-layer="grid"]')
      const ambient = hero.querySelector<HTMLElement>('[data-hero-layer="ambient"]')
      const particles = hero.querySelector<HTMLElement>('[data-hero-layer="particles"]')
      const grandstand = hero.querySelector<HTMLElement>('[data-hero-layer="grandstand"]')
      const velocity = hero.querySelector<HTMLElement>('[data-hero-layer="velocity"]')
      const track = hero.querySelector<HTMLElement>('[data-hero-layer="track"]')
      const flag = hero.querySelector<HTMLElement>('[data-hero-layer="flag"]')
      const identity = hero.querySelector<HTMLElement>('[data-hero-layer="identity"]')
      const control = hero.querySelector<HTMLElement>('[data-hero-layer="control"]')
      const telemetry = hero.querySelector<HTMLElement>('[data-hero-layer="telemetry"]')
      const entranceTargets = [artwork, flag, identity, control, telemetry].filter(Boolean)
      gsap.set(entranceTargets, { animation: 'none' })

      const playEntrance = () => {
        if (entrancePlayed) return
        entrancePlayed = true
        lenis?.start()
        if (reduced.matches) { gsap.set(entranceTargets, { clearProps: 'opacity,visibility,transform,filter' }); return }
        const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } })
        if (artwork) timeline.fromTo(artwork, { autoAlpha: .58, scale: 1.065 }, { autoAlpha: 1, scale: 1.01, duration: 1.2 }, 0)
        if (grid) timeline.fromTo(grid, { autoAlpha: 0, scale: 1.08 }, { autoAlpha: .48, scale: 1, duration: 1.25 }, .08)
        if (flag) timeline.fromTo(flag, { autoAlpha: 0, x: 45, rotate: -2 }, { autoAlpha: 1, x: 0, rotate: 0, duration: .8 }, .2)
        if (identity) timeline.fromTo(identity.children, { autoAlpha: 0, y: 24, filter: 'blur(7px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: .68, stagger: .085 }, .3)
        if (control) timeline.fromTo(control, { autoAlpha: 0, x: 34, scale: .97 }, { autoAlpha: 1, x: 0, scale: 1, duration: .72 }, .44)
        if (control) timeline.fromTo(control.children, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: .42, stagger: .055 }, .58)
        if (telemetry) timeline.fromTo(telemetry.children, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .45, stagger: .07 }, .74)
      }

      const media = gsap.matchMedia()
      media.add('(min-width: 50rem) and (prefers-reduced-motion: no-preference)', () => {
        const scene = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: .7,
            invalidateOnRefresh: true,
            onEnter: () => { hero.dataset.motionActive = 'true' },
            onEnterBack: () => { hero.dataset.motionActive = 'true' },
            onLeave: () => { hero.dataset.motionActive = 'false' },
            onLeaveBack: () => { hero.dataset.motionActive = 'false' },
          },
        })
        if (artwork) scene.to(artwork, { yPercent: 11, scale: 1.115 }, 0)
        if (shade) scene.to(shade, { xPercent: 3, opacity: .86 }, 0)
        if (grid) scene.to(grid, { yPercent: 25, scale: 1.09, opacity: .14 }, 0)
        if (ambient) scene.to(ambient, { yPercent: -28, scale: 1.2, opacity: .2 }, 0)
        if (particles) scene.to(particles, { yPercent: -42, opacity: .08 }, 0)
        if (grandstand) scene.to(grandstand, { yPercent: 18, opacity: .06 }, 0)
        if (velocity) scene.to(velocity, { xPercent: 25, opacity: .72 }, 0)
        if (track) scene.to(track, { xPercent: -15, opacity: .58 }, 0)
        if (flag) scene.to(flag, { x: 95, y: -86, rotation: 3, opacity: .08 }, 0)
        if (identity) scene.to(identity, { y: -104, scale: .79, opacity: 0 }, 0)
        if (control) scene.to(control, { x: 34, y: -64, scale: .92, opacity: 0 }, 0)
        if (telemetry) scene.to(telemetry, { y: 72, opacity: 0 }, 0)

        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
        const artworkX = artwork ? gsap.quickTo(artwork, 'x', { duration: 1.15, ease: 'power3.out' }) : null
        const artworkY = artwork ? gsap.quickTo(artwork, 'y', { duration: 1.15, ease: 'power3.out' }) : null
        const gridX = grid ? gsap.quickTo(grid, 'x', { duration: 1.35, ease: 'power3.out' }) : null
        const gridY = grid ? gsap.quickTo(grid, 'y', { duration: 1.35, ease: 'power3.out' }) : null
        const ambientX = ambient ? gsap.quickTo(ambient, 'x', { duration: 1.5, ease: 'power3.out' }) : null
        const pointerMove = (event: PointerEvent) => {
          const bounds = hero.getBoundingClientRect()
          const x = (event.clientX - bounds.left) / bounds.width - .5
          const y = (event.clientY - bounds.top) / bounds.height - .5
          artworkX?.(x * -16); artworkY?.(y * -10)
          gridX?.(x * 24); gridY?.(y * 15)
          ambientX?.(x * 34)
        }
        const pointerLeave = () => { artworkX?.(0); artworkY?.(0); gridX?.(0); gridY?.(0); ambientX?.(0) }
        hero.addEventListener('pointermove', pointerMove)
        hero.addEventListener('pointerleave', pointerLeave)
        return () => { hero.removeEventListener('pointermove', pointerMove); hero.removeEventListener('pointerleave', pointerLeave) }
      })

      const introComplete = () => playEntrance()
      window.addEventListener('cgp:intro-complete', introComplete)
      if (!document.querySelector('.brand-intro')) window.requestAnimationFrame(playEntrance)
      return () => { window.removeEventListener('cgp:intro-complete', introComplete); media.revert() }
    }, hero)

    const refresh = () => {
      if (resizeFrame) cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; reconcileSmoothScroll() })
    }
    window.addEventListener('resize', refresh)
    const mediaElement = hero.querySelector('video')
    mediaElement?.addEventListener('loadedmetadata', refresh)
    void document.fonts?.ready.then(refresh)
    ScrollTrigger.refresh()

    return () => {
      if (resizeFrame) cancelAnimationFrame(resizeFrame)
      window.removeEventListener('resize', refresh)
      mediaElement?.removeEventListener('loadedmetadata', refresh)
      document.removeEventListener('visibilitychange', visibilityChange)
      smoothMedia.removeEventListener('change', reconcileSmoothScroll)
      destroySmoothScroll()
      gsapContext.revert()
      delete hero.dataset.gsapScene
      delete hero.dataset.motionActive
    }
  }, [heroRef])
}
