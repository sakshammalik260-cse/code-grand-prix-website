import type Lenis from 'lenis'

let activeScroller: Lenis | null = null
let pendingTarget: { target: HTMLElement; immediate: boolean } | null = null

export function setPublicScroller(scroller: Lenis | null) {
  activeScroller = scroller
  if (!scroller || !pendingTarget) return
  const pending = pendingTarget
  pendingTarget = null
  queueMicrotask(() => scrollPublicTarget(pending.target, pending.immediate))
}

export function scrollPublicTarget(target: HTMLElement, immediate = false) {
  if (!activeScroller) { pendingTarget = { target, immediate }; return false }
  const header = document.querySelector<HTMLElement>('.site-header')
  activeScroller.scrollTo(target, {
    offset: -(header?.getBoundingClientRect().height || 0),
    immediate,
    duration: immediate ? 0 : 1.05,
    force: true,
  })
  return true
}

export function scrollPublicTop() {
  if (!activeScroller) return false
  activeScroller.scrollTo(0, { immediate: true, force: true })
  return true
}
