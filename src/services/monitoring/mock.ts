import { authService } from '../auth'
import type { CompetitionSession, Incident, MonitoringService, ParticipantScope, ResolutionResponse, SessionStatus } from '../../types/monitoring'
import { ledgerTransaction } from './ledger'
import { sessionAllowsExecution } from './sessionRules'
import { delay } from '../arena/mockState'

export class MonitoringTransportError extends Error {
  code: 'DISCONNECTED' | 'AUTH_EXPIRED' | 'CONFLICT'
  constructor(message: string, code: 'DISCONNECTED' | 'AUTH_EXPIRED' | 'CONFLICT' = 'DISCONNECTED') { super(message); this.code = code }
}
const key = (scope: ParticipantScope) => `${scope.contestId}:${scope.driverId}`
export function mockConnectionAvailable() {
  try { return sessionStorage.getItem('cgp-monitor-demo-offline') !== '1' && navigator.onLine } catch { return navigator.onLine }
}
async function privileged(signal?:AbortSignal){const user=await authService.me(signal);if(!user||!['VOLUNTEER','ADMIN'].includes(user.role))throw new MonitoringTransportError('Volunteer or admin account required.','AUTH_EXPIRED')}
async function prepare(signal?: AbortSignal) {
  if (!mockConnectionAvailable()) throw new MonitoringTransportError('Mock monitoring connection is offline. Drafts remain local; reconnect or contact race control.')
  await delay(100, signal)
}
function freshSession(scope: ParticipantScope): CompetitionSession {
  const time = new Date().toISOString()
  return { ...scope, id: crypto.randomUUID(), status: 'ACTIVE', revision: 1, updatedAt: time, serverTime: time, policy: { allowExecution: true, allowEditing: true, allowNavigation: true }, latestIncident: null, resumeAuthorization: null, volunteerNotified: false, simulation: true }
}
function changeState(session: CompetitionSession, status: SessionStatus): CompetitionSession {
  const allowed = status === 'ACTIVE' || status === 'RESUME_AUTHORIZED'
  return { ...session, status, revision: session.revision + 1, updatedAt: new Date().toISOString(), policy: { allowExecution: allowed, allowEditing: allowed || status === 'FINISHED', allowNavigation: allowed || status === 'FINISHED' } }
}
export const mockMonitoringService: MonitoringService = {
  async getSession(scope,signal) {
    await prepare(signal)
    return ledgerTransaction(true,ledger => {
      const session = ledger.sessions[key(scope)] || freshSession(scope)
      ledger.sessions[key(scope)] = session
      return { ...session, serverTime: new Date().toISOString() }
    })
  },
  async getViewer(signal) {
    await prepare(signal)
    const user=await authService.me(signal)
    if (!user) throw new MonitoringTransportError('Sign in to view race control.','AUTH_EXPIRED')
    return {id:user.id,role:user.role,simulation:true}
  },
  async reportIncident(request,signal) {
    await prepare(signal)
    return ledgerTransaction(true,ledger => {
      const session = ledger.sessions[key(request)]
      if (!session || session.id !== request.sessionId) throw new MonitoringTransportError('Your competition session needs organizer verification.','AUTH_EXPIRED')
      const existing = ledger.incidents.find(item => item.clientEventId === request.clientEventId && item.sessionId === request.sessionId)
      if (existing) return { incident: existing, session: { ...session, serverTime: new Date().toISOString() } }
      const incident: Incident = { ...request, id: crypto.randomUUID(), timestamp: new Date().toISOString(), reviewStatus: 'OPEN', blocking: request.type !== 'WINDOW_FOCUS_LOST', simulation: true }
      ledger.incidents.unshift(incident)
      const next = incident.blocking ? changeState(session,'LOCKED') : { ...session, revision: session.revision + 1, updatedAt: incident.timestamp }
      next.latestIncident = incident.blocking || !session.latestIncident ? incident : session.latestIncident
      if (incident.blocking) next.resumeAuthorization = null
      ledger.sessions[key(request)] = next
      return { incident, session: { ...next, serverTime: new Date().toISOString() } }
    })
  },
  async listIncidents(signal) { await prepare(signal); await privileged(signal); return ledgerTransaction(false,ledger => ledger.incidents.slice().sort((a,b) => b.timestamp.localeCompare(a.timestamp))) },
  async listParticipants(signal) { await prepare(signal); await privileged(signal); return ledgerTransaction(false,ledger => Object.values(ledger.sessions)) },
  async resolveIncident(id,request,signal) {
    await prepare(signal)
    const viewer = await this.getViewer(signal)
    if (viewer.role !== 'VOLUNTEER' && viewer.role !== 'ADMIN') throw new MonitoringTransportError('Sign in with a volunteer or admin development account to resolve mock incidents.','AUTH_EXPIRED')
    return ledgerTransaction<ResolutionResponse>(true,ledger => {
       const incident = ledger.incidents.find(item => item.id === id) || ledger.incidents.find(item => item.sessionId === id)
       if (!incident) throw new Error('This incident is unavailable. Refresh the review list.')
       if (incident.reviewStatus !== 'OPEN') throw new MonitoringTransportError('This incident already has a terminal decision. Refresh the review list.','CONFLICT')
       if (request.note.trim().length < 8) throw new Error('Add a brief operator note before resolving this incident.')
      const session = ledger.sessions[key(incident)]
      if (session.revision !== request.expectedSessionRevision) throw new MonitoringTransportError('Session changed while you reviewed it. Refresh and review the latest incident.','CONFLICT')
      if (request.decision !== 'AUTHORIZE_RESUME') incident.blocking = true
      incident.reviewStatus = request.decision === 'AUTHORIZE_RESUME' ? 'AUTHORIZED' : request.decision === 'ESCALATE' ? 'ESCALATED' : 'KEPT_LOCKED'
      const outstanding = ledger.incidents.filter(item => item.sessionId === session.id && item.blocking && item.reviewStatus !== 'AUTHORIZED')
      const status = outstanding.some(item => item.reviewStatus === 'ESCALATED') ? 'UNDER_REVIEW' : outstanding.length ? 'LOCKED' : 'RESUME_AUTHORIZED'
      const authorization = { id: crypto.randomUUID(), incidentId: id, decision: request.decision, actorId: viewer.id, actorRole: viewer.role as 'VOLUNTEER' | 'ADMIN', decidedAt: new Date().toISOString(), simulation: true }
      const next = changeState(session,status)
      next.latestIncident = ledger.incidents.find(item => item.sessionId === session.id) || null
      next.resumeAuthorization = status === 'RESUME_AUTHORIZED' && request.decision === 'AUTHORIZE_RESUME' ? authorization : null
      ledger.sessions[key(incident)] = next
      return { incident, session: { ...next, serverTime: new Date().toISOString() }, authorization }
    })
  },
}
export async function assertMockMonitoringExecution(scope: ParticipantScope, sessionId?: string) {
  const session = await ledgerTransaction(false,ledger => ledger.sessions[key(scope)])
  if (!session || session.id !== sessionId || !sessionAllowsExecution(session)) throw new Error('Race control has not authorized execution for this session. Your draft is preserved.')
}
