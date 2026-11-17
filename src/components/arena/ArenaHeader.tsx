import { Link } from 'react-router-dom'
import { CameraOff, ChevronDown, Expand, Flag, LogOut, Maximize, RefreshCw, Timer, UserRound } from 'lucide-react'
import { RaceWordmark } from '../RacingIdentity'
import { useSession } from '../../hooks/useSession'
import { useRaceClock } from '../../hooks/useRaceClock'
import type { RaceClockInput } from '../../hooks/useRaceClock'
import type { ContestState } from '../../types/arena'

export function RaceTimer({ contestStartTime, contestEndTime, serverTime, status, pausedAt }: RaceClockInput) {
  const clock = useRaceClock({ contestStartTime, contestEndTime, serverTime, status, pausedAt })
  return <div className={'arena-race-timer timer-' + clock.effectivePhase.toLowerCase()} role="timer" aria-label={`${clock.effectivePhase === 'WAITING' ? 'Race starts in' : 'Race time remaining'} ${clock.label}`}><Timer size={19} /><strong>{clock.label}</strong><span>{clock.effectivePhase === 'WAITING' ? 'STARTS IN' : clock.effectivePhase === 'PAUSED_BY_ORGANIZER' ? 'PAUSED' : clock.ended ? 'FINISHED' : 'REMAINING'}</span></div>
}
interface Props { contest: ContestState; fullscreen: boolean; onFullscreen: () => void; onRefresh: () => void; refreshing: boolean }
export function ArenaHeader({ contest, fullscreen, onFullscreen, onRefresh, refreshing }: Props) {
  const { driver, checkIn, signOut } = useSession()
  return <><Link to="/lobby" className="arena-brand" aria-label="Code Grand Prix race lobby"><RaceWordmark /></Link><div className="arena-round-label"><h1 className="sr-only">Coding arena</h1><strong>{contest.round} <span>—</span> {contest.status === 'LIVE' ? 'Race in Progress' : contest.status === 'WAITING' ? 'Awaiting Start' : contest.status === 'FINISHED' ? 'Race Finished' : 'Organizer Pause'}</strong>{contest.simulation && <span className="arena-mock-label">MOCK MODE</span>}</div><RaceTimer {...contest} /><div className="arena-camera-chip" title={checkIn?.cameraVerified ? 'Camera verified during check-in. The local preview stopped when you left inspection.' : 'No active camera stream.'}><CameraOff size={13} /><span>Camera: OFF</span></div><button className={'arena-icon-button arena-fullscreen-toggle ' + (fullscreen ? 'is-active' : '')} title={fullscreen ? 'Fullscreen is active' : 'Activate fullscreen'} aria-label={fullscreen ? 'Fullscreen active' : 'Activate fullscreen'} onClick={onFullscreen} disabled={fullscreen}><Expand size={16} /></button><details className="arena-driver-menu"><summary><span className="arena-user-avatar"><UserRound size={14} fill="currentColor" /></span><span>{driver?.id}</span><ChevronDown size={13} /></summary><div className="arena-driver-dropdown"><span>{driver?.name}</span><Link to="/lobby"><Flag size={14} />Race lobby</Link><Link to="/check-in"><CameraOff size={14} />Camera check-in</Link><button onClick={onFullscreen} disabled={fullscreen}><Maximize size={14} />{fullscreen ? 'Fullscreen active' : 'Enter fullscreen'}</button><button onClick={onRefresh} disabled={refreshing}><RefreshCw size={14} className={refreshing ? 'spin' : ''} />Refresh race status</button><button onClick={signOut}><LogOut size={14} />Sign out</button></div></details></>
}
