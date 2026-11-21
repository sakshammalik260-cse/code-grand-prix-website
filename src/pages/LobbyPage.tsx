import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, Check, ClipboardCheck, MapPin, Radio, UserRound } from 'lucide-react'
import { Countdown } from '../components/Countdown'
import { StatusIndicator } from '../components/Ui'
import { CircuitMap } from '../components/RacingIdentity'
import { useSession } from '../hooks/useSession'
import { event } from '../data/event'
import type { ContestState } from '../types/arena'
import type { LobbyState } from '../types'
import { arenaServices,isArenaMockMode } from '../services/arena'
import { mockControls } from '../services/arena/mockState'

function lobbyState(status: ContestState['status']): LobbyState {
  if (status === 'LIVE') return 'live'
  if (status === 'PAUSED_BY_ORGANIZER') return 'paused'
  if (status === 'FINISHED') return 'finished'
  return 'waiting'
}

export function LobbyPage() {
  const { driver, checkIn } = useSession()
  const [state, setState] = useState<LobbyState>('waiting')
  const [contest,setContest]=useState<ContestState|null>(null),[error,setError]=useState('')
  useEffect(()=>{const controller=new AbortController();let inFlight=false;const load=async()=>{if(inFlight)return;inFlight=true;try{const next=await arenaServices.getContest(controller.signal);if(!controller.signal.aborted){setContest(next);setState(lobbyState(next.status));setError('')}}catch(reason){if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:'Unable to load race status.')}finally{inFlight=false}};void load();const timer=setInterval(()=>void load(),2000);return()=>{controller.abort();clearInterval(timer)}},[])
  const hasStartTime=!!contest&&Number.isFinite(Date.parse(contest.contestStartTime))
  const liveEntryAvailable=state==='live'&&!error
  return <section className={`cinematic-page cinematic-lobby lobby-state-${state}`}>
    <div className="lobby-content container">
      <div className="lobby-grid">
        <aside className="lobby-circuit-column"><CircuitMap /><div className="lobby-map-caption"><span className="status-dot" /> CIRCUIT STANDBY</div></aside>
        <section className="lobby-center" aria-labelledby="lobby-title">
          <h1 id="lobby-title"><span className="title-speed-lines" aria-hidden="true">///</span> RACE LOBBY</h1>
          <div key={'message-'+state} className="lobby-message" aria-live="polite"><h2>{state === 'waiting' ? 'You’re checked in!' : state === 'live' ? 'The lights are green!' : state === 'paused' ? 'Race Control has paused the round.' : 'Across the finish line.'}</h2><p>{state === 'waiting' ? 'Hold position while Race Control prepares the start.' : state === 'live' ? 'The race workspace is ready. Follow race-control instructions.' : state === 'paused' ? 'Stay in the lobby. Entry and execution remain locked until the organizer resumes the contest.' : 'The contest has ended. Results depend on organizer publication.'}</p></div>
          {state === 'waiting' ? <div key="waiting" className="lobby-state-content">{hasStartTime?<div className="race-countdown-panel lobby-race-countdown"><h2>OFFICIAL START IN</h2><Countdown hoursOnly target={contest?.contestStartTime} /></div>:<div className="race-countdown-panel lobby-race-countdown lobby-time-tba"><h2>OFFICIAL RACE START</h2><strong>TO BE ANNOUNCED</strong></div>}<p className="lobby-schedule-note">{event.dateLabel} · IST<br />{hasStartTime?'Official contest clock supplied by Race Control.':'Remain in the lobby for the organizer-controlled start.'}</p><div className="lobby-waiting-status"><Radio size={14} /><span>Waiting for race control</span><span className="waiting-dots">•••</span></div></div> : <div key={state} className="lobby-race-action"><StatusIndicator tone={state === 'live' ? 'live' : state === 'paused' ? 'caution' : 'neutral'}>{state === 'live' ? error ? 'STATUS STALE' : 'GREEN LIGHT' : state === 'paused' ? 'RACE PAUSED' : 'CHEQUERED FLAG'}</StatusIndicator>{state==='paused'?<button className="button button-secondary racing-button w-full" disabled><span>WAIT FOR RACE CONTROL</span></button>:state==='live'&&!liveEntryAvailable?<button className="button button-secondary racing-button w-full" disabled><span>VERIFYING RACE STATUS</span></button>:<Link className="button button-primary racing-button w-full" to={state === 'live' ? '/arena' : '/results'}><span>{state === 'live' ? 'ENTER CODING ARENA' : 'VIEW RESULTS'}<ArrowRight size={18} /></span></Link>}</div>}
        </section>
        <aside className="lobby-driver-column"><section className="glass-panel driver-details-panel"><h2>Driver Details</h2><dl><div><dt><UserRound size={17} />Driver ID</dt><dd>{driver?.id}</dd></div><div><dt><ClipboardCheck size={17} />Status</dt><dd><span className="checked-in-chip"><Check size={12} />Checked In</span></dd></div><div><dt><MapPin size={17} />Station</dt><dd className="station-pending">To be assigned</dd></div></dl><div className="driver-details-foot"><span>{driver?.name}</span><span>{checkIn ? new Date(checkIn.completedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: event.timezone }) : '—'} IST</span></div></section><div className="lobby-event-note"><CalendarDays size={15} /><div><strong>{event.dateLabel}</strong><span>{event.university}</span></div></div><p className="lobby-camera-note">Camera stream stays local during the race.<br />Its status is checked in the arena.</p></aside>
      </div>
      {import.meta.env.DEV && isArenaMockMode && <section className="mock-controls lobby-mock-controls"><div><StatusIndicator tone="caution">MOCK CONTEST</StatusIndicator><p>Preview only. These controls do not start a real contest.</p></div><div className="segmented-control" aria-label="Mock contest state">{(['waiting', 'live', 'paused', 'finished'] as const).map(value => <button key={value} aria-pressed={state === value} onClick={() => { setState(value); if (isArenaMockMode) setContest(mockControls.setContestPhase(value === 'live' ? 'LIVE' : value === 'paused' ? 'PAUSED_BY_ORGANIZER' : value === 'finished' ? 'FINISHED' : 'WAITING')) }} className={state === value ? 'selected' : ''}>{value === 'waiting' ? 'Waiting' : value === 'live' ? 'Live race' : value === 'paused' ? 'Paused' : 'Finished'}</button>)}</div></section>}
      {error&&<p className="alert alert-error" role="alert">{error} Race entry will be verified again in the arena.</p>}
    </div>
    <p className="entry-page-caption">CODE GRAND PRIX 2026 <span>YOUR GRID. YOUR MOMENT.</span></p>
  </section>
}
