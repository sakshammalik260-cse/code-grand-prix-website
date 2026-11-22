import { useEffect, useId, useRef } from 'react'
import '../styles/living-race-background.css'

/** Atmospheric overlays registered to the unmodified 1672 x 941 hero plate. */
export function LivingRaceBackground() {
  const scene = useRef<SVGSVGElement>(null)
  const id = useId()
  const paint = (name: string) => `url(#${id}-${name})`

  useEffect(() => {
    const element = scene.current
    if (!element) return
    let inView = true
    const update = () => { element.dataset.paused = String(document.hidden || !inView) }
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      inView = entries.some(entry => entry.isIntersecting)
      update()
    })
    observer?.observe(element)
    document.addEventListener('visibilitychange', update)
    update()
    return () => { observer?.disconnect(); document.removeEventListener('visibilitychange', update) }
  }, [])

  return <svg ref={scene} className="living-race-background" viewBox="0 0 1672 941" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false" data-paused="true">
    <defs>
      <radialGradient id={`${id}-rear`}>
        <stop stopColor="#ff3020" stopOpacity=".68" />
        <stop offset=".28" stopColor="#f0180b" stopOpacity=".35" />
        <stop offset="1" stopColor="#e10600" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${id}-core`}>
        <stop stopColor="#ff8c68" stopOpacity=".5" />
        <stop offset=".5" stopColor="#ff1a08" stopOpacity=".35" />
        <stop offset="1" stopColor="#e10600" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${id}-haze`}>
        <stop stopColor="#b7c7d9" stopOpacity=".5" />
        <stop offset="1" stopColor="#9aafc5" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${id}-crowd`}>
        <stop stopColor="#edc5ba" stopOpacity=".5" />
        <stop offset="1" stopColor="#ec3930" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-streak`}>
        <stop stopColor="#e10600" stopOpacity="0" />
        <stop offset=".7" stopColor="#f12c21" stopOpacity=".7" />
        <stop offset="1" stopColor="#ffd4ba" stopOpacity="0" />
      </linearGradient>
      <clipPath id={`${id}-stands`}><path d="M0 385 125 425 125 518 0 482Z M615 558 820 638 820 664 615 588Z" /></clipPath>
      <clipPath id={`${id}-road`}><path d="M1020 705 1672 790 1672 941 865 941 860 815Z" /></clipPath>
    </defs>

    {/* The car is baked into the plate: only its existing light and nearby air move. */}
    <g className="race-rear-bloom"><ellipse cx="328" cy="734" rx="64" ry="57" fill={paint('rear')} /></g>
    <g className="race-rear-core"><ellipse cx="328" cy="734" rx="23" ry="30" fill={paint('core')} /></g>
    <g className="race-rear-reflection"><ellipse cx="300" cy="911" rx="165" ry="26" fill={paint('rear')} /></g>
    <g className="race-tire-haze"><ellipse cx="105" cy="862" rx="86" ry="14" fill={paint('haze')} /><ellipse cx="678" cy="856" rx="83" ry="12" fill={paint('haze')} /></g>

    <g className="race-track-layer" transform="translate(1050 690)"><g className="race-barrier-travel"><path d="M0 0 100 -13" fill="none" stroke={paint('streak')} strokeWidth="3" strokeLinecap="round" /></g></g>
    <g className="race-track-layer" transform="translate(1050 690)"><g className="race-barrier-travel race-barrier-delayed"><path d="M0 0 75 -10" fill="none" stroke={paint('streak')} strokeWidth="2" strokeLinecap="round" /></g></g>
    <g className="race-track-layer" clipPath={paint('road')}><g transform="translate(1040 715)"><g className="race-road-travel"><ellipse rx="74" ry="5" transform="rotate(18)" fill={paint('rear')} /></g></g></g>

    {/* Only light varies over the original crowd; no grandstand or spectator translation. */}
    <g clipPath={paint('stands')} className="race-crowd-light"><ellipse cx="70" cy="450" rx="160" ry="90" fill={paint('crowd')} /><ellipse cx="708" cy="610" rx="120" ry="42" fill={paint('crowd')} /></g>
    <g className="race-stadium-light"><ellipse cx="1526" cy="291" rx="118" ry="104" fill={paint('haze')} /><ellipse cx="1255" cy="502" rx="56" ry="64" fill={paint('haze')} /></g>
    <g className="race-stadium-haze"><ellipse cx="1335" cy="455" rx="200" ry="40" transform="rotate(-35 1335 455)" fill={paint('haze')} /></g>
  </svg>
}
