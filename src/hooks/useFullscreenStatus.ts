import { useEffect, useState } from 'react'
export function useFullscreenStatus() {
  const [active, setActive] = useState(Boolean(document.fullscreenElement))
  const [error, setError] = useState('')
  useEffect(() => {
    const update = () => setActive(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', update)
    return () => document.removeEventListener('fullscreenchange', update)
  }, [])
  async function activate() {
    setError('')
    try {
      if (!document.documentElement.requestFullscreen) throw new Error('Fullscreen is unavailable in this browser.')
      await document.documentElement.requestFullscreen()
    } catch { setError('Fullscreen could not be activated. Your draft is unchanged; try again in a supported desktop browser.') }
  }
  async function toggle() {
    if (!document.fullscreenElement) return activate()
    setError('')
    try { await document.exitFullscreen() }
    catch { setError('Fullscreen could not be exited. Press Esc or retry from the browser controls.') }
  }
  return { active, error, activate, toggle }
}
