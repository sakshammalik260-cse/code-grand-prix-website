import { api } from '../api'
import type { Incident, IncidentAcknowledgment, MonitoringService, CompetitionSession, ResolutionResponse, SessionEnvelope } from '../../types/monitoring'
export const backendMonitoringService: MonitoringService = {
  async getSession(scope,signal) {
    const { data } = await api.get<SessionEnvelope>('/session',{ params: { contestId: scope.contestId }, signal })
    if (!data.session || data.session.driverId !== scope.driverId || data.viewer.role !== 'CANDIDATE') throw Object.assign(new Error('Participant session is missing or expired. Sign in again or contact race control.'), { code: 'AUTH_EXPIRED' })
    return data.session
  },
  async getViewer(signal) { return (await api.get<SessionEnvelope>('/session',{signal})).data.viewer },
  async reportIncident(request,signal) { return (await api.post<IncidentAcknowledgment>('/violations',request,{ signal, headers: { 'Idempotency-Key': request.clientEventId } })).data },
  async listIncidents(signal) { return (await api.get<Incident[]>('/volunteer/incidents',{signal})).data },
  async listParticipants(signal) { return (await api.get<CompetitionSession[]>('/volunteer/participants',{signal})).data },
  async resolveIncident(id,request,signal) { return (await api.post<ResolutionResponse>(`/volunteer/incidents/${encodeURIComponent(id)}/resolve`,request,{signal})).data },
}
