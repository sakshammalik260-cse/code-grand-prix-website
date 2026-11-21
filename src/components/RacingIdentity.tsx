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
 return <img src="/branding/cpc-logo.webp" alt="CPC - Competitive Programming Club. Build, solve, improve." width="720" height="356" className={`cpc-full-logo ${className}`} loading="lazy" decoding="async"/>
}

export function CheckeredFlag({ className = '' }: { className?: string }) {
  return <svg className={`racing-flag ${className}`} viewBox="0 0 400 240" fill="none" aria-hidden="true"><defs><pattern id="flag-checks" width="64" height="64" patternUnits="userSpaceOnUse" patternTransform="skewX(-13)"><rect width="64" height="64" fill="#11151c" /><path d="M0 0h32v32H0zm32 32h32v32H32z" fill="#e3e7ed" /></pattern><linearGradient id="flag-shade" x1="0" x2="400"><stop stopColor="#000" stopOpacity=".6" /><stop offset=".25" stopColor="#fff" stopOpacity=".1" /><stop offset=".42" stopColor="#000" stopOpacity=".55" /><stop offset=".63" stopColor="#fff" stopOpacity=".25" /><stop offset=".85" stopColor="#000" stopOpacity=".45" /><stop offset="1" stopColor="#fff" stopOpacity=".15" /></linearGradient><clipPath id="flag-clip"><path d="M37 24C115 0 145 66 224 39S329 6 396 28L353 219C278 197 242 237 171 215S77 177 0 202z" /></clipPath></defs><g clipPath="url(#flag-clip)"><path fill="url(#flag-checks)" d="M0 0h400v240H0z" /><path fill="url(#flag-shade)" d="M0 0h400v240H0z" /></g></svg>
}

export function CircuitMap() {
  return <div className="circuit-mini-map"><svg viewBox="0 0 320 240" fill="none" role="img" aria-label="Abstract Code Circuit course map"><path className="map-shadow" d="m57 152-19-10q-9-6-3-15l12-13 4-23q1-8 8-5l12 7 17-8q7-3 9 4l4 10 17-13q8-6 4-14l-3-7q-3-7 6-12l111-46q27-10 33 7 4 10-8 31L165 210q-13 22-30 6l-37-36-18-3q-14-2-15-12z" /><path className="map-red" d="m57 152-19-10q-9-6-3-15l12-13 4-23q1-8 8-5l12 7 17-8q7-3 9 4l4 10 17-13q8-6 4-14l-3-7q-3-7 6-12l111-46q27-10 33 7 4 10-8 31L165 210q-13 22-30 6l-37-36-18-3q-14-2-15-12z" /><path d="m112 65 11 12" stroke="#fff" strokeWidth="4" strokeDasharray="2 2" /><circle cx="116" cy="71" r="5" fill="#e10600" stroke="#fff" strokeWidth="1.5" /></svg><span>THE CODE CIRCUIT <i /> 2026</span></div>
}
