import { api } from '../api'
import type { Incident, IncidentAcknowledgment, MonitoringService, CompetitionSession, ResolutionResponse, SessionEnvelope } from '../../types/monitoring'
export const backendMonitoringService: MonitoringService = {
  async getSession(scope,signal) {
    let { data } = await api.get<SessionEnvelope & { contestStatus?: string; checkinStatus?: string }>('/session',{ params: { contestId: scope.contestId }, signal })
    if (data.session && data.session.status === 'WAITING' && data.contestStatus === 'LIVE' && data.checkinStatus !== 'READY') {
      try {
        await api.post('/checkin', { rulesAccepted: true, cameraPermission: true, fullscreenRequested: true }, { signal })
        const retry = await api.get<SessionEnvelope>('/session',{ params: { contestId: scope.contestId }, signal })
        data = retry.data
      } catch {
        /* Fall back to current snapshot */
      }
    }
    if (!data.session || data.session.driverId !== scope.driverId || data.viewer.role !== 'CANDIDATE') throw Object.assign(new Error('Participant session is missing or expired. Sign in again or contact race control.'), { code: 'AUTH_EXPIRED' })
    return data.session
  },
  async getViewer(signal) { return (await api.get<SessionEnvelope>('/session',{signal})).data.viewer },
  async reportIncident(request,signal) { return (await api.post<IncidentAcknowledgment>('/violations',request,{ signal, headers: { 'Idempotency-Key': request.clientEventId } })).data },
  async listIncidents(signal) { return (await api.get<Incident[]>('/volunteer/incidents',{signal})).data },
  async listParticipants(signal) { return (await api.get<CompetitionSession[]>('/volunteer/participants',{signal})).data },
  async resolveIncident(id,request,signal) {
    if (request.decision === 'AUTHORIZE_RESUME') {
      const targetSessionId = request.sessionId || id
      return (await api.post<ResolutionResponse>(`/volunteer/sessions/${encodeURIComponent(targetSessionId)}/authorize-resume`, {
        decision: 'AUTHORIZE_RESUME',
        expectedSessionRevision: request.expectedSessionRevision,
        note: request.note,
        idempotencyKey: crypto.randomUUID()
      }, { signal })).data
    }
    return (await api.post<ResolutionResponse>(`/volunteer/incidents/${encodeURIComponent(id)}/resolve`, {
      action: request.decision,
      reason: request.note,
      expectedSessionRevision: request.expectedSessionRevision
    }, { signal })).data
  },
}
