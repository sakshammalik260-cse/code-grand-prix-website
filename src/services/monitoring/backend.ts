import { api } from '../api'
import { authService } from '../auth'
import type { Incident, IncidentAcknowledgment, MonitoringService, CompetitionSession, IncidentReviewResponse, SessionAuthorizationResponse, SessionEnvelope } from '../../types/monitoring'
export const backendMonitoringService: MonitoringService = {
  async authorizeSession(id,request,signal) { return (await api.post<SessionAuthorizationResponse>(`/volunteer/sessions/${encodeURIComponent(id)}/authorize-resume`,request,{signal,headers:{'Idempotency-Key':request.idempotencyKey}})).data },
  async getSession(scope,signal) {
    const { data } = await api.get<SessionEnvelope>('/session',{ params: { contestId: scope.contestId }, signal })
    if (!data.session || data.session.driverId !== scope.driverId || data.viewer.role !== 'CANDIDATE') throw Object.assign(new Error('Participant session is missing or expired. Sign in again or contact race control.'), { code: 'AUTH_EXPIRED' })
    return data.session
  },
  async getViewer(signal) {
    const account = await authService.me(signal)
    if (!account) throw Object.assign(new Error('Your Race Control session expired. Sign in again.'), { code: 'AUTH_EXPIRED' })
    return { id: account.id, role: account.role, simulation: false }
  },
  async reportIncident(request,signal) { return (await api.post<IncidentAcknowledgment>('/violations',request,{ signal, headers: { 'Idempotency-Key': request.clientEventId } })).data },
  async listIncidents(signal) { return (await api.get<Incident[]>('/volunteer/incidents',{signal})).data },
  async listParticipants(signal) { return (await api.get<CompetitionSession[]>('/volunteer/participants',{signal})).data },
  async resolveIncident(id,request,signal) { return (await api.post<IncidentReviewResponse>(`/volunteer/incidents/${encodeURIComponent(id)}/resolve`,{action:request.decision,reason:request.note,expectedSessionRevision:request.expectedSessionRevision},{signal})).data },
}
