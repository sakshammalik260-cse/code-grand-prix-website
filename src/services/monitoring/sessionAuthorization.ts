import type { CompetitionSession, Incident, SessionAuthorizationRequest, SessionAuthorizationResponse, Viewer } from '../../types/monitoring.ts'

export interface AuthorizationLedger {
  sessions: Record<string, CompetitionSession>
  incidents: Incident[]
  sessionAuthorizations?: Record<string, { fingerprint: string; request?: SessionAuthorizationRequest; response: SessionAuthorizationResponse }>
}
const conflict = (message: string): never => { throw Object.assign(new Error(message), {code:'CONFLICT'}) }
export const outstandingBlocking = (incidents: Incident[], sessionId: string) => incidents.filter(item => item.sessionId === sessionId && item.blocking && item.reviewStatus !== 'AUTHORIZED')

// Called inside ONE readwrite ledger transaction. No asynchronous work or partial commits here.
export function authorizeSessionInLedger(ledger: AuthorizationLedger, sessionId: string, request: SessionAuthorizationRequest, viewer: Viewer): SessionAuthorizationResponse {
  if (!['VOLUNTEER','ADMIN'].includes(viewer.role)) throw Object.assign(new Error('Volunteer or admin access required.'),{code:'AUTH_EXPIRED'})
  if (request.decision !== 'AUTHORIZE_RESUME' || !request.idempotencyKey?.trim() || !Array.isArray(request.expectedIncidentIds) || new Set(request.expectedIncidentIds).size !== request.expectedIncidentIds.length) return conflict('Invalid session authorization request.')
  const session = ledger.sessions[`${request.contestId}:${request.driverId}`]
  if (!session || session.id !== sessionId || session.contestId !== request.contestId || session.driverId !== request.driverId) return conflict('The target session or contest does not match. Refresh race control.')
  const fingerprint = JSON.stringify([sessionId,request.contestId,request.driverId,request.decision,request.expectedSessionRevision,[...request.expectedIncidentIds].sort(),request.note])
  const key = JSON.stringify([viewer.id,sessionId,request.idempotencyKey])
  const previous = ledger.sessionAuthorizations?.[key]
  if (previous) {
    if (previous.fingerprint !== fingerprint) return conflict('This authorization key was already used for a different request.')
    return previous.response
  }
  if (session.revision !== request.expectedSessionRevision) return conflict('Session changed during review. Refresh and confirm the latest incident set.')
  if (!['LOCK_PENDING','LOCKED','UNDER_REVIEW'].includes(session.status)) return conflict('Session is already authorized or is not locked. Refresh race control.')
  const covered = outstandingBlocking(ledger.incidents,sessionId)
  if (!covered.length) return conflict('No outstanding blocking incidents. Request organizer review of this session.')
  if (covered.some(item => item.contestId !== session.contestId || item.driverId !== session.driverId) || JSON.stringify(covered.map(item=>item.id).sort()) !== JSON.stringify([...request.expectedIncidentIds].sort())) return conflict('The outstanding incident set changed. Review it again before authorizing.')
  const now = new Date().toISOString()
  const authorization = {id:crypto.randomUUID(),incidentId:covered[0].id,sessionId,coveredIncidentIds:covered.map(item=>item.id),decision:'AUTHORIZE_RESUME' as const,actorId:viewer.id,actorRole:viewer.role as 'VOLUNTEER'|'ADMIN',decidedAt:now,simulation:true}
  const ids = new Set(authorization.coveredIncidentIds)
  const incidents: Incident[] = covered.map(item=>({...item,reviewStatus:'AUTHORIZED'}))
  ledger.incidents = ledger.incidents.map(item => ids.has(item.id) ? {...item,reviewStatus:'AUTHORIZED'} : item)
  const next: CompetitionSession = {...session,status:'RESUME_AUTHORIZED',revision:session.revision+1,updatedAt:now,serverTime:now,policy:{allowExecution:true,allowEditing:true,allowNavigation:true},latestIncident:ledger.incidents.find(item=>item.id===session.latestIncident?.id)||session.latestIncident,resumeAuthorization:authorization}
  ledger.sessions[`${request.contestId}:${request.driverId}`] = next
  const response = {session:next,incidents,authorization}
  ledger.sessionAuthorizations ??= {}
  ledger.sessionAuthorizations[key] = {fingerprint,request:{...request,expectedIncidentIds:[...request.expectedIncidentIds]},response}
  return response
}
