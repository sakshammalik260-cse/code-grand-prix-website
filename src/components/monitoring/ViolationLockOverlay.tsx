import { useEffect, useRef } from 'react'
import { AlertTriangle, Camera, Expand, Hourglass, RefreshCw, Save, ShieldCheck, WifiOff } from 'lucide-react'
import type { CameraStatus, CompetitionSession, ConnectionStatus, IncidentRequest } from '../../types/monitoring'

const reasons: Record<string,string> = { TAB_HIDDEN: 'Competition tab was hidden.', WINDOW_FOCUS_LOST: 'Competition window lost focus.', FULLSCREEN_EXIT: 'Fullscreen mode was exited.', CAMERA_INTERRUPTED: 'Camera monitoring was interrupted.' }
interface Props {
  session: CompetitionSession | null; connection: ConnectionStatus; pending: IncidentRequest[]; error: string
  camera: CameraStatus; cameraPending: boolean; cameraError: string; fullscreen: boolean
  onCamera: () => void; onFullscreen: () => void; onRefresh: () => void; onSignOut: () => void
  developmentControls?: React.ReactNode
}
export function ViolationLockOverlay({ session, connection, pending, error, camera, cameraPending, cameraError, fullscreen, onCamera, onFullscreen, onRefresh, onSignOut, developmentControls }: Props) {
  const dialog = useRef<HTMLDivElement>(null)
  const latest = session?.latestIncident || pending.at(-1)
  const approved = session?.status === 'RESUME_AUTHORIZED' && !!session.resumeAuthorization
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.focus()
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialog.current) return
      const targets = [...dialog.current.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],summary,select,input,[tabindex="0"]')].filter(element => element.getClientRects().length)
      const first = targets[0], last = targets.at(-1)
      if (!first) { event.preventDefault(); return }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown',trap)
    return () => { document.removeEventListener('keydown',trap); if (previous?.isConnected) previous.focus() }
  },[])
  return <div className="violation-lock-backdrop"><div className="violation-lock-card" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="race-control-title" aria-describedby="race-control-description" tabIndex={-1}>
    <div className="violation-card-heading">{approved ? <ShieldCheck size={31} /> : <AlertTriangle size={32} />}<h2 id="race-control-title">RACE CONTROL</h2></div>
    <h3>{approved ? 'RESUME AUTHORIZED' : 'SESSION TEMPORARILY LOCKED'}</h3>
    <p id="race-control-description">{approved ? 'Authorization received. Restore your monitoring setup to continue.' : 'Unauthorized competition activity detected.'}<br /><span>{latest ? reasons[latest.type] : 'Session verification is required.'}</span></p>
    <p>{session?.volunteerNotified ? 'A volunteer has been notified.' : pending.length ? 'Incident delivery is awaiting acknowledgment.' : session?.simulation ? 'Mock incident recorded for volunteer review.' : 'Awaiting race-control acknowledgment.'}</p>
    <p className="violation-remain">Please remain at your station.</p>
    <div className="violation-session-meta"><span>Incident <strong>{latest?.type.replaceAll('_',' ') || 'SESSION REVIEW'}</strong></span><span>Time <strong>{latest ? new Date('timestamp' in latest ? latest.timestamp as string : latest.observedAt).toLocaleTimeString('en-IN',{ timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',second:'2-digit' }) + ' IST' : '—'}</strong></span><span>Session <strong>{pending.some(item => item.type !== 'WINDOW_FOCUS_LOST') ? 'LOCK PENDING' : session?.status.replaceAll('_',' ') || 'VERIFYING'}</strong></span><span>Connection <strong className={connection === 'CONNECTED' ? 'monitor-good' : 'monitor-warn'}>{connection}</strong></span></div>
    <div className={'violation-authorization ' + (approved ? 'approved' : '')}>{approved ? <ShieldCheck size={15} /> : connection !== 'CONNECTED' ? <WifiOff size={15} /> : <Hourglass size={15} />}<span>{approved ? `Approved by ${session.resumeAuthorization!.actorId}${session.simulation ? ' (simulation)' : ''}` : session?.status === 'UNDER_REVIEW' ? 'UNDER VOLUNTEER REVIEW' : 'AWAITING AUTHORIZATION'}</span></div>
    {(!fullscreen || camera !== 'ACTIVE') && <div className="violation-recovery-actions">{camera !== 'ACTIVE' && <button onClick={onCamera} disabled={cameraPending}><Camera size={14} />{cameraPending ? 'Requesting camera…' : 'Restore camera'}</button>}{!fullscreen && <button onClick={onFullscreen}><Expand size={14} />Re-enter fullscreen</button>}</div>}
    {(error || cameraError) && <p className="violation-service-error" role="status">{error || cameraError}</p>}
    <div className="violation-secondary-actions"><button onClick={onRefresh}><RefreshCw size={12} />Refresh status</button><button onClick={() => window.dispatchEvent(new Event('cgp-save-draft'))}><Save size={12} />Save draft now</button>{connection === 'AUTH_EXPIRED' && <button onClick={onSignOut}>Sign in again</button>}</div>
    <p className="violation-recovery-note">Your code and results remain in place. Autosave stays enabled.<br />If connection cannot be restored, ask an organizer to review your session. Camera/fullscreen recovery does not clear a lock.</p>
    {session?.simulation && <span className="violation-simulation-label">MOCK MONITORING · NO CAMERA UPLOADS</span>}
    {developmentControls}
  </div></div>
}
