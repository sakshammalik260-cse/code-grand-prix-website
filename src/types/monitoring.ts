export type IncidentType = 'TAB_HIDDEN' | 'WINDOW_FOCUS_LOST' | 'FULLSCREEN_EXIT' | 'CAMERA_INTERRUPTED'
export type SessionStatus = 'ACTIVE' | 'LOCK_PENDING' | 'LOCKED' | 'UNDER_REVIEW' | 'RESUME_AUTHORIZED' | 'FINISHED'
export type CameraStatus = 'ACTIVE' | 'INTERRUPTED' | 'PERMISSION_REQUIRED' | 'UNAVAILABLE'
export type ReviewStatus = 'OPEN' | 'AUTHORIZED' | 'KEPT_LOCKED' | 'ESCALATED'
export type ResolutionDecision = 'AUTHORIZE_RESUME' | 'KEEP_LOCKED' | 'ESCALATE'
export type ConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'AUTH_EXPIRED'
export interface ParticipantScope { contestId: string; driverId: string }
export interface IncidentRequest extends ParticipantScope {
  clientEventId: string
  sessionId: string
  type: IncidentType
  observedAt: string
  problemId: string | null
}
export interface Incident extends IncidentRequest {
  id: string
  timestamp: string
  reviewStatus: ReviewStatus
  blocking: boolean
  simulation: boolean
}
export interface Authorization {
  id: string
  incidentId: string
  decision: ResolutionDecision
  actorId: string
  actorRole: 'VOLUNTEER' | 'ORGANIZER'
  decidedAt: string
  simulation: boolean
}
export interface CompetitionSession extends ParticipantScope {
  id: string
  status: SessionStatus
  revision: number
  updatedAt: string
  serverTime: string
  policy: { allowExecution: boolean; allowEditing: boolean; allowNavigation: boolean }
  latestIncident: Incident | null
  resumeAuthorization: Authorization | null
  volunteerNotified: boolean
  simulation: boolean
}
export interface Viewer { id: string; role: 'PARTICIPANT' | 'VOLUNTEER' | 'ORGANIZER'; simulation: boolean }
export interface SessionEnvelope { viewer: Viewer; session: CompetitionSession | null; serverTime: string }
export interface IncidentAcknowledgment { incident: Incident; session: CompetitionSession }
export interface ResolutionRequest { decision: ResolutionDecision; expectedSessionRevision: number; note: string }
export interface ResolutionResponse { incident: Incident; session: CompetitionSession; authorization: Authorization }
export interface MonitoringService {
  getSession(scope: ParticipantScope, signal?: AbortSignal): Promise<CompetitionSession>
  getViewer(signal?: AbortSignal): Promise<Viewer>
  reportIncident(request: IncidentRequest, signal?: AbortSignal): Promise<IncidentAcknowledgment>
  listIncidents(signal?: AbortSignal): Promise<Incident[]>
  listParticipants(signal?: AbortSignal): Promise<CompetitionSession[]>
  resolveIncident(id: string, request: ResolutionRequest, signal?: AbortSignal): Promise<ResolutionResponse>
}
export interface MonitoringSnapshot {
  session: CompetitionSession | null
  connection: ConnectionStatus
  pending: IncidentRequest[]
  error: string
}
