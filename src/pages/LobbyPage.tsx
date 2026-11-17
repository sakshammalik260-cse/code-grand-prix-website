import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, Check, ClipboardCheck, MapPin, Radio, UserRound } from 'lucide-react'
import { Countdown } from '../components/Countdown'
import { Badge } from '../components/Ui'
import { CircuitMap } from '../components/RacingIdentity'
import { useSession } from '../hooks/useSession'
import { event } from '../data/event'
import type { LobbyState } from '../types'
import { isArenaMockMode } from '../services/arena'
import { mockControls } from '../services/arena/mockState'

export function LobbyPage() {
  const { driver, checkIn } = useSession()
  const [state, setState] = useState<LobbyState>('waiting')
  return <section className={`cinematic-page cinematic-lobby lobby-state-${state}`}>
    <div className="lobby-content container">
      <div className="lobby-grid">
        <aside className="lobby-circuit-column"><CircuitMap /><div className="lobby-map-caption"><span className="status-dot" /> CIRCUIT STANDBY</div></aside>
        <section className="lobby-center" aria-labelledby="lobby-title">
          <h1 id="lobby-title"><span className="title-speed-lines" aria-hidden="true">///</span> RACE LOBBY</h1>
          <div className="lobby-message" aria-live="polite"><h2>{state === 'waiting' ? 'You’re checked in!' : state === 'live' ? 'The lights are green!' : 'Across the finish line.'}</h2><p>{state === 'waiting' ? 'The race will begin soon. Stay on this page.' : state === 'live' ? 'The mock race is live. Your arena preview is ready.' : 'The mock contest has ended. View the results page.'}</p></div>
          {state === 'waiting' ? <><div className="race-countdown-panel lobby-race-countdown"><h2>RACE STARTS IN</h2><Countdown hoursOnly /></div><p className="lobby-schedule-note">Countdown to November 23, 2026 · IST<br />Race start time to be announced</p><div className="lobby-waiting-status"><Radio size={14} /><span>Waiting for race control</span><span className="waiting-dots">•••</span></div></> : <div className="lobby-race-action"><Badge tone={state === 'live' ? 'green' : 'neutral'}>{state === 'live' ? 'GREEN LIGHT' : 'CHEQUERED FLAG'}</Badge><Link className="button button-primary racing-button w-full" to={state === 'live' ? '/arena' : '/results'}><span>{state === 'live' ? 'ENTER CODING ARENA' : 'VIEW RESULTS'}<ArrowRight size={18} /></span></Link></div>}
        </section>
        <aside className="lobby-driver-column"><section className="glass-panel driver-details-panel"><h2>Driver Details</h2><dl><div><dt><UserRound size={17} />Driver ID</dt><dd>{driver?.id}</dd></div><div><dt><ClipboardCheck size={17} />Status</dt><dd><span className="checked-in-chip"><Check size={12} />Checked In</span></dd></div><div><dt><MapPin size={17} />Station</dt><dd className="station-pending">To be assigned</dd></div></dl><div className="driver-details-foot"><span>{driver?.name}</span><span>{checkIn ? new Date(checkIn.completedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: event.timezone }) : '—'} IST</span></div></section><div className="lobby-event-note"><CalendarDays size={15} /><div><strong>{event.dateLabel}</strong><span>{event.university}</span></div></div><p className="lobby-camera-note">Camera stream stays local during the race.<br />Its status is checked in the arena.</p></aside>
      </div>
      <section className="mock-controls lobby-mock-controls"><div><Badge tone="yellow">MOCK CONTEST</Badge><p>Preview only. These controls do not start a real contest.</p></div><div className="segmented-control" aria-label="Mock contest state">{(['waiting', 'live', 'finished'] as const).map(value => <button key={value} aria-pressed={state === value} onClick={() => { setState(value); if (isArenaMockMode) mockControls.setContestPhase(value === 'live' ? 'LIVE' : value === 'finished' ? 'FINISHED' : 'WAITING') }} className={state === value ? 'selected' : ''}>{value === 'waiting' ? 'Waiting' : value === 'live' ? 'Live race' : 'Finished'}</button>)}</div></section>
    </div>
    <p className="entry-page-caption">CODE GRAND PRIX 2026 <span>YOUR GRID. YOUR MOMENT.</span></p>
  </section>
}
