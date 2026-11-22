import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { RaceWordmark } from './RacingIdentity'

const introKey = 'cgp-race-intro-seen'

export function RaceIntro({ reduced, anchored }: { reduced: boolean; anchored: boolean }) {
  const [open, setOpen] = useState(() => {
    if (reduced || anchored || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    try { return sessionStorage.getItem(introKey) !== '1' } catch { return false }
  })
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (!open || reduced || anchored) return
    const element = dialog.current
    if (!element || typeof element.showModal !== 'function') return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (preference.matches) return

    element.showModal()
    try { sessionStorage.setItem(introKey, '1') } catch { /* The intro still closes normally. */ }
    const update = () => { element.dataset.paused = String(document.hidden) }
    const reduce = () => { if (preference.matches) setOpen(false) }
    update()
    document.addEventListener('visibilitychange', update)
    preference.addEventListener('change', reduce)
    return () => {
      element.close()
      document.removeEventListener('visibilitychange', update)
      preference.removeEventListener('change', reduce)
    }
  }, [open, reduced, anchored])

  if (!open || reduced || anchored) return null
  return (
    <dialog ref={dialog} className="race-intro" aria-label="Code Grand Prix introduction"
      onCancel={event => { event.preventDefault(); setOpen(false) }}
      onAnimationEnd={event => {
        if (event.target === event.currentTarget && event.animationName === 'race-intro-exit') setOpen(false)
      }}>
      <div className="race-intro-light" aria-hidden="true" />
      <RaceWordmark className="race-intro-wordmark" />
      <div className="race-intro-actions">
        <button type="button" autoFocus onClick={() => setOpen(false)}>SKIP INTRO <kbd>Esc</kbd></button>
        <Link to="/login" onClick={() => setOpen(false)}>Driver login</Link>
      </div>
    </dialog>
  )
}
