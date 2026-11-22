import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { RaceDialog } from '../assist/RaceDialog'
import { monitoringService } from '../../services/monitoring'
import { canAcceptSession } from '../../services/monitoring/sessionRules'
import { outstandingBlocking } from '../../services/monitoring/sessionAuthorization'
import type { CompetitionSession, Incident, SessionAuthorizationRequest, SessionAuthorizationResponse } from '../../types/monitoring'

export function SessionReviewPanel({session,incidents,connected,onClose,onHistory,onConfirmed,onRefresh}:{session:CompetitionSession;incidents:Incident[];connected:boolean;onClose:()=>void;onHistory:()=>void;onConfirmed:(message:string,response:SessionAuthorizationResponse)=>Promise<void>;onRefresh:()=>Promise<void>}) {
  const [request,setRequest] = useState<SessionAuthorizationRequest|null>(null)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  const outstanding = outstandingBlocking(incidents,session.id)
  const stale = !!request && (request.expectedSessionRevision !== session.revision || JSON.stringify([...request.expectedIncidentIds].sort()) !== JSON.stringify(outstanding.map(item=>item.id).sort()))
  const locked = ['LOCK_PENDING','LOCKED','UNDER_REVIEW'].includes(session.status)
  function prepare() {
    setError('')
    setRequest({contestId:session.contestId,driverId:session.driverId,decision:'AUTHORIZE_RESUME',expectedSessionRevision:session.revision,expectedIncidentIds:outstanding.map(item=>item.id),note:'All outstanding blocking incidents reviewed in race control',idempotencyKey:crypto.randomUUID()})
  }
  async function authorize() {
    if (!request || !connected || busy || stale) return
    setBusy(true);setError('')
    try {
      const response = await monitoringService.authorizeSession(session.id,request)
      const receipt = response.authorization
      if (!canAcceptSession(session,response.session,session) || !['RESUME_AUTHORIZED', 'ACTIVE'].includes(response.session.status) || receipt.id !== response.session.resumeAuthorization?.id || receipt.sessionId !== session.id || receipt.decision !== 'AUTHORIZE_RESUME' || !['VOLUNTEER','ADMIN'].includes(receipt.actorRole) || JSON.stringify([...receipt.coveredIncidentIds].sort()) !== JSON.stringify([...request.expectedIncidentIds].sort()) || response.incidents.length !== request.expectedIncidentIds.length || response.incidents.some(item=>item.sessionId!==session.id || item.driverId!==session.driverId || item.contestId!==session.contestId || item.reviewStatus!=='AUTHORIZED' || !request.expectedIncidentIds.includes(item.id))) throw new Error('Session authorization response could not be verified. Refresh race control.')
      await onConfirmed(`Service confirmed session authorization for ${session.driverId}: ${response.incidents.length} blocking incidents resolved.`,response)
    } catch (reason) {
      await onRefresh()
      setError(reason instanceof Error ? reason.message : 'No authorization was confirmed. Retry with the same request after reconnecting.')
    } finally { setBusy(false) }
  }
  return <RaceDialog titleId="session-review-title" onClose={onClose} busy={busy} className="session-review-panel">
    <ShieldCheck size={28}/><h2 id="session-review-title">RACE CONTROL / SESSION REVIEW</h2>
    <dl className="session-review-meta"><div><dt>Driver ID</dt><dd>{session.driverId}</dd></div><div><dt>Contest ID</dt><dd>{session.contestId}</dd></div><div><dt>Session ID</dt><dd>{session.id}</dd></div><div><dt>Status / revision</dt><dd>{session.status} / v{session.revision}</dd></div></dl>
    <h3>Unresolved blocking incidents: {outstanding.length}</h3>
    <ul className="session-incident-list">{outstanding.map(item=><li key={item.id}><strong>{item.type.replaceAll('_',' ')}</strong><time dateTime={item.timestamp}>{new Date(item.timestamp).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})} IST</time><small>Incident ID: {item.id}<br/>Client event ID: {item.clientEventId}</small></li>)}</ul>
    {!outstanding.length && <p>No outstanding blocking incidents. {session.status==='RESUME_AUTHORIZED'?'This session is already authorized.':'Refresh or request organizer review if the session remains locked.'}</p>}
    <p>Review every listed incident and verify the participant's setup. Authorization preserves history and grants no additional contest time. Camera and fullscreen must be restored by the participant.</p>
    <div className="session-review-actions"><button disabled={busy} onClick={onHistory}>VIEW INCIDENT HISTORY</button><button disabled={busy} onClick={onClose}>{locked?'KEEP SESSION LOCKED':'CLOSE REVIEW'}</button>{!request && <button className="session-authorize" disabled={busy||!connected||!locked||!outstanding.length} onClick={prepare}>AUTHORIZE &amp; RESUME SESSION</button>}</div>
    {request && <div className="session-approval-confirmation"><h3>Confirm session authorization</h3><p>Authorize all {request.expectedIncidentIds.length} listed blocking incidents for {request.driverId}, session {session.id}, revision {request.expectedSessionRevision}?</p>{stale && <p role="alert">Session changed. Review the current incident list and prepare a new confirmation.</p>}<div className="session-review-actions"><button disabled={busy} onClick={()=>{setRequest(null);setError('')}}>Back to review</button><button className="session-authorize" disabled={busy||!connected||stale} onClick={()=>{void authorize()}}>{busy?'Authorizing...':'CONFIRM SESSION AUTHORIZATION'}</button></div></div>}
    {!connected && <p role="alert">Connection unavailable. Reconnect and refresh before authorizing.</p>}
    {error && <p className="volunteer-error" role="alert">{error}</p>}
  </RaceDialog>
}
