import { useId } from 'react'
import { Link } from 'react-router-dom'

interface RaceWordmarkProps { className?: string }
export function RaceWordmark({ className = '' }: RaceWordmarkProps) {
  return <span className={`race-wordmark ${className}`} aria-label="Code Grand Prix">
    <svg className="race-speed-mark" viewBox="0 0 102 38" fill="currentColor" aria-hidden="true"><path d="M3 32 29 6h18L21 32zm30 0L59 6h14L47 32zm26 0L85 6h14L73 32z" /></svg>
    <span className="wordmark-code">CODE<span className="wordmark-checks" aria-hidden="true" /></span>
    <span className="wordmark-grand">GRAND PRIX</span>
  </span>
}

export function ClubMark({ compact = false }: { compact?: boolean }) {
 return <Link to="/" className={`club-mark ${compact ? 'club-mark-compact' : ''}`} aria-label="Competitive Programming Club home"><img src="/branding/cpc-mark.webp" alt="Competitive Programming Club" className="cpc-navbar-mark" width="320" height="134" decoding="async"/><span className="sr-only">CPC</span></Link>
}
export function ClubLogo({className=''}:{className?:string}){
 return <img src="/branding/cpc-logo.webp" alt="CPC - Competitive Programming Club. Build, solve, improve." width="720" height="400" className={`cpc-full-logo ${className}`} loading="lazy" decoding="async"/>
}

export function CheckeredFlag({ className = '' }: { className?: string }) {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const patternId = `flag-pattern-${rawId}`
  const shadeId = `flag-shade-${rawId}`
  const clipId = `flag-clip-${rawId}`
  const maskId = `flag-mask-${rawId}`

  return (
    <svg
      className={`racing-flag ${className}`}
      viewBox="0 0 440 250"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        {/* Soft edge fade for natural blending into night track lighting */}
        <linearGradient id={maskId} x1="0" y1="0" x2="440" y2="250" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
          <stop offset="18%" stopColor="#fff" stopOpacity="0.88" />
          <stop offset="60%" stopColor="#fff" stopOpacity="1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.9" />
        </linearGradient>
        <mask id={`mask-alpha-${rawId}`}>
          <rect width="440" height="250" fill={`url(#${maskId})`} />
        </mask>

        {/* Crisp racing checks with carbon graphite and platinum silver */}
        <pattern
          id={patternId}
          width="44"
          height="44"
          patternUnits="userSpaceOnUse"
          patternTransform="skewX(-14) rotate(-3)"
        >
          <rect width="44" height="44" fill="#0d1017" />
          <path d="M0 0h22v22H0zm22 22h22v22H22z" fill="#dbe0ec" />
        </pattern>

        {/* 3D silk cloth ripple shading: alternating crest highlights and trough shadows */}
        <linearGradient id={shadeId} x1="0" y1="0" x2="440" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#000" stopOpacity="0.75" />
          <stop offset="13%" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="26%" stopColor="#000" stopOpacity="0.55" />
          <stop offset="40%" stopColor="#000" stopOpacity="0.72" />
          <stop offset="54%" stopColor="#fff" stopOpacity="0.32" />
          <stop offset="68%" stopColor="#000" stopOpacity="0.60" />
          <stop offset="82%" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="94%" stopColor="#000" stopOpacity="0.48" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.70" />
        </linearGradient>

        {/* Aerodynamic waving cloth contour with natural fluid curves */}
        <clipPath id={clipId}>
          <path d="M 25 34 C 90 8, 145 54, 225 32 S 350 6, 424 28 C 416 80, 432 140, 408 184 C 392 214, 384 235, 372 242 C 305 218, 255 248, 182 228 C 115 210, 65 220, 8 238 C 16 180, 14 100, 25 34 Z" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`} mask={`url(#mask-alpha-${rawId})`}>
        <path fill={`url(#${patternId})`} d="M0 0h440v250H0z" />
        <path fill={`url(#${shadeId})`} d="M0 0h440v250H0z" />
        <path fill={`url(#${shadeId})`} d="M0 0h440v250H0z" opacity="0.4" style={{ mixBlendMode: 'screen' }} />
      </g>
    </svg>
  )
}

export function CircuitMap() {
  return <div className="circuit-mini-map"><svg viewBox="0 0 320 240" fill="none" role="img" aria-label="Abstract Code Circuit course map"><path className="map-shadow" d="m57 152-19-10q-9-6-3-15l12-13 4-23q1-8 8-5l12 7 17-8q7-3 9 4l4 10 17-13q8-6 4-14l-3-7q-3-7 6-12l111-46q27-10 33 7 4 10-8 31L165 210q-13 22-30 6l-37-36-18-3q-14-2-15-12z" /><path className="map-red" d="m57 152-19-10q-9-6-3-15l12-13 4-23q1-8 8-5l12 7 17-8q7-3 9 4l4 10 17-13q8-6 4-14l-3-7q-3-7 6-12l111-46q27-10 33 7 4 10-8 31L165 210q-13 22-30 6l-37-36-18-3q-14-2-15-12z" /><path d="m112 65 11 12" stroke="#fff" strokeWidth="4" strokeDasharray="2 2" /><circle cx="116" cy="71" r="5" fill="#e10600" stroke="#fff" strokeWidth="1.5" /></svg><span>THE CODE CIRCUIT <i /> 2026</span></div>
}
