export type IncidentType = 'TAB_HIDDEN' | 'WINDOW_FOCUS_LOST' | 'FULLSCREEN_EXIT' | 'CAMERA_INTERRUPTED' | 'CAMERA_PERMISSION_DENIED' | 'CAMERA_TRACK_ENDED' | 'WINDOW_BLUR' | 'NETWORK_RECONNECT'
export type SessionStatus = 'WAITING' | 'ACTIVE' | 'LOCK_PENDING' | 'LOCKED' | 'UNDER_REVIEW' | 'RESUME_AUTHORIZED' | 'FINISHED'
export type CameraStatus = 'ACTIVE' | 'INTERRUPTED' | 'PERMISSION_REQUIRED' | 'UNAVAILABLE'
export type ReviewStatus = 'OPEN' | 'AUTHORIZED' | 'KEPT_LOCKED' | 'ESCALATED' | 'RESOLVED' | 'DISMISSED'
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
  resolvedAt?: string | null
  resolutionAction?: string | null
  resolutionReason?: string | null
  resolvedBy?: string | null
  reviewStatus: ReviewStatus
  blocking: boolean
  simulation: boolean
}
export interface Authorization {
  sessionId?: string
  coveredIncidentIds?: string[]
  id: string
  incidentId: string
  decision: ResolutionDecision
  actorId: string
  actorRole: 'VOLUNTEER' | 'ADMIN'
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
export interface Viewer { id: string; role: 'CANDIDATE' | 'VOLUNTEER' | 'ADMIN'; simulation: boolean }
export interface SessionEnvelope { viewer: Viewer; session: CompetitionSession | null; serverTime: string }
export interface IncidentAcknowledgment { incident: Incident; session: CompetitionSession }
export interface ResolutionRequest { decision: ResolutionDecision; expectedSessionRevision: number; note: string }
export interface ResolutionResponse { incident: Incident; session: CompetitionSession; authorization: Authorization }
export interface IncidentReviewResponse { success: boolean; incident: Incident; session: null }
export interface SessionAuthorization extends Authorization {
  sessionId: string
  coveredIncidentIds: string[]
}
export interface SessionAuthorizationRequest extends ParticipantScope {
  decision: 'AUTHORIZE_RESUME'
  expectedSessionRevision: number
  expectedIncidentIds: string[]
  note: string
  idempotencyKey: string
}
export interface SessionAuthorizationResponse {
  session: CompetitionSession
  incidents: Incident[]
  authorization: SessionAuthorization
}
export interface MonitoringService {
  authorizeSession(id: string, request: SessionAuthorizationRequest, signal?: AbortSignal): Promise<SessionAuthorizationResponse>
  getSession(scope: ParticipantScope, signal?: AbortSignal): Promise<CompetitionSession>
  getViewer(signal?: AbortSignal): Promise<Viewer>
  reportIncident(request: IncidentRequest, signal?: AbortSignal): Promise<IncidentAcknowledgment>
  listIncidents(signal?: AbortSignal): Promise<Incident[]>
  listParticipants(signal?: AbortSignal): Promise<CompetitionSession[]>
  resolveIncident(id: string, request: ResolutionRequest, signal?: AbortSignal): Promise<ResolutionResponse | IncidentReviewResponse>
}
export interface MonitoringSnapshot {
  session: CompetitionSession | null
  connection: ConnectionStatus
  pending: IncidentRequest[]
  error: string
}
