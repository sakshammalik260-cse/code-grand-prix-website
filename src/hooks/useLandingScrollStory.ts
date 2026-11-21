import { useLayoutEffect, type RefObject } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useLandingScrollStory(rootRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const context = gsap.context(() => {
      const media = gsap.matchMedia()

      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach(element => {
          const kind = element.dataset.reveal
          const feature = kind === 'feature'
          gsap.fromTo(element,
            { autoAlpha: 0, y: feature ? 58 : 38, scale: feature ? .965 : 1, rotateX: kind === 'heading' ? 5 : 0, transformPerspective: 900 },
            { autoAlpha: 1, y: 0, scale: 1, rotateX: 0, duration: feature ? .95 : .78, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 84%', once: true } },
          )
        })

        gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach(group => {
          const items = Array.from(group.querySelectorAll<HTMLElement>(':scope > [data-stagger-item]'))
          if (!items.length) return
          gsap.fromTo(items,
            { autoAlpha: 0, y: 42, rotateX: 5, transformPerspective: 850 },
            { autoAlpha: 1, y: 0, rotateX: 0, duration: .68, stagger: .11, ease: 'power3.out', scrollTrigger: { trigger: group, start: 'top 83%', once: true } },
          )
        })
      })

      media.add('(min-width: 50rem) and (prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach(element => {
          const distance = Number(element.dataset.parallax || 10)
          gsap.fromTo(element, { yPercent: -distance * .32 }, { yPercent: distance, ease: 'none', scrollTrigger: { trigger: element.closest('[data-scroll-section]') || element, start: 'top bottom', end: 'bottom top', scrub: .8 } })
        })

        const progress = root.querySelector<HTMLElement>('[data-timeline-progress]')
        if (progress) gsap.fromTo(progress, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: progress.parentElement, start: 'top 76%', end: 'bottom 48%', scrub: .65 } })

        const tiltCleanups = gsap.utils.toArray<HTMLElement>('[data-tilt]').map(card => {
          const rotateX = gsap.quickTo(card, 'rotationX', { duration: .48, ease: 'power3.out' })
          const rotateY = gsap.quickTo(card, 'rotationY', { duration: .48, ease: 'power3.out' })
          const lift = gsap.quickTo(card, 'z', { duration: .48, ease: 'power3.out' })
          gsap.set(card, { transformPerspective: 900, transformStyle: 'preserve-3d' })
          const move = (event: PointerEvent) => {
            const bounds = card.getBoundingClientRect()
            rotateX(((event.clientY - bounds.top) / bounds.height - .5) * -5)
            rotateY(((event.clientX - bounds.left) / bounds.width - .5) * 6)
            lift(8)
          }
          const leave = () => { rotateX(0); rotateY(0); lift(0) }
          card.addEventListener('pointermove', move); card.addEventListener('pointerleave', leave)
          return () => { card.removeEventListener('pointermove', move); card.removeEventListener('pointerleave', leave) }
        })

        const magneticCleanups = gsap.utils.toArray<HTMLElement>('[data-magnetic]').map(button => {
          const moveX = gsap.quickTo(button, 'x', { duration: .35, ease: 'power3.out' })
          const moveY = gsap.quickTo(button, 'y', { duration: .35, ease: 'power3.out' })
          const move = (event: PointerEvent) => {
            const bounds = button.getBoundingClientRect()
            moveX((event.clientX - bounds.left - bounds.width / 2) * .14)
            moveY((event.clientY - bounds.top - bounds.height / 2) * .18)
          }
          const leave = () => { moveX(0); moveY(0) }
          button.addEventListener('pointermove', move); button.addEventListener('pointerleave', leave)
          return () => { button.removeEventListener('pointermove', move); button.removeEventListener('pointerleave', leave) }
        })
        return () => { tiltCleanups.forEach(cleanup => cleanup()); magneticCleanups.forEach(cleanup => cleanup()) }
      })

      media.add('(max-width: 49.99rem) and (prefers-reduced-motion: no-preference)', () => {
        const progress = root.querySelector<HTMLElement>('[data-timeline-progress]')
        if (progress) gsap.fromTo(progress, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: progress.parentElement, start: 'top 78%', end: 'bottom 55%', scrub: .6 } })
      })

      return () => media.revert()
    }, root)

    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh, { once: true })
    void document.fonts?.ready.then(refresh)
    requestAnimationFrame(refresh)
    return () => { window.removeEventListener('load', refresh); context.revert() }
  }, [rootRef])
}
