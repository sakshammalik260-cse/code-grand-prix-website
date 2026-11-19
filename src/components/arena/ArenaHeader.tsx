import type { ReactNode } from 'react'
import { Camera, ChevronDown, Expand, Focus, LogOut, RefreshCw, Shrink, TimerReset, UserRound } from 'lucide-react'
import { useSession } from '../../hooks/useSession'
import { useRaceClock } from '../../hooks/useRaceClock'
import type { ContestState } from '../../types/arena'
import { RaceWordmark } from '../RacingIdentity'

interface Props {
  contest: ContestState
  fullscreen: boolean
  onFullscreen: () => void
  onRefresh: () => void
  refreshing: boolean
  monitoring: ReactNode
  focusMode: boolean
  onFocusMode: () => void
}

function RaceTimer({ contest }: { contest: ContestState }) {
  const clock = useRaceClock(contest)
  const label = clock.effectivePhase === 'WAITING' ? 'STARTS IN' : clock.effectivePhase === 'PAUSED_BY_ORGANIZER' ? 'PAUSED' : clock.effectivePhase === 'FINISHED' || clock.ended ? 'FINISHED' : 'TIME REMAINING'
  return <div className={`arena-race-timer phase-${clock.effectivePhase.toLowerCase()}`} role="timer" aria-label={`${label}: ${clock.label}`}>
    <TimerReset size={18} />
    <strong aria-hidden="true">{clock.label.split(':').map((part, index, parts) => <span key={`${index}-${part}`}>{part}{index < parts.length - 1 ? <i>:</i> : null}</span>)}</strong>
    <span>{label}</span>
  </div>
}

export function ArenaHeader({ contest, fullscreen, onFullscreen, onRefresh, refreshing, monitoring, focusMode, onFocusMode }: Props) {
  const { driver, signOut } = useSession()
  const phaseLabel = contest.status === 'PAUSED_BY_ORGANIZER' ? 'PAUSED' : contest.status
  return <header className="arena-topbar">
    <div className="arena-brand"><RaceWordmark /></div>
    <div className="arena-round-label">
      <strong>{contest.round} <span>—</span> {contest.title}</strong>
      <span className={`arena-phase-chip phase-${contest.status.toLowerCase()}`}><i />{phaseLabel}</span>
      {contest.simulation && <span className="arena-mock-label">MOCK MODE</span>}
    </div>
    <RaceTimer contest={contest} />
    {monitoring || <div className="arena-camera-chip"><Camera size={14} /><span>Camera status unavailable</span></div>}
    <button className={`arena-focus-toggle ${focusMode ? 'is-active' : ''}`} onClick={onFocusMode} aria-pressed={focusMode} title={`${focusMode ? 'Exit' : 'Enter'} focus mode (Ctrl/Cmd+Shift+F)`}><Focus size={14} /><span>{focusMode ? 'Exit focus' : 'Focus'}</span></button>
    <button className="arena-fullscreen-toggle" onClick={onFullscreen} aria-pressed={fullscreen} title={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>{fullscreen ? <Shrink size={14} /> : <Expand size={14} />}<span>FULLSCREEN</span></button>
    <div className="arena-driver-menu"><details><summary><span className="arena-user-avatar"><UserRound size={14} /></span><span>{driver?.id || 'Driver'}</span><ChevronDown size={11} /></summary><div className="arena-driver-dropdown"><strong>{driver?.name || 'Driver'}</strong><span>{driver?.team || 'Code Grand Prix'}</span><button onClick={onFocusMode}><Focus size={13} />{focusMode ? 'Exit focus mode' : 'Enter focus mode'}</button><button onClick={onRefresh} disabled={refreshing}><RefreshCw size={13} className={refreshing ? 'spin' : ''} />Refresh race status</button><button onClick={signOut}><LogOut size={13} />Sign out</button></div></details></div>
  </header>
}
