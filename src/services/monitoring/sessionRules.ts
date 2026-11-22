import type { CompetitionSession, ParticipantScope } from '../../types/monitoring'
export function isSessionSnapshot(value: unknown): value is CompetitionSession {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<CompetitionSession>
  if (typeof item.id !== 'string' || typeof item.contestId !== 'string' || typeof item.driverId !== 'string' || !Number.isInteger(item.revision) || (item.revision || 0) < 1 || !['WAITING','ACTIVE','LOCK_PENDING','LOCKED','UNDER_REVIEW','RESUME_AUTHORIZED','FINISHED'].includes(item.status || '')) return false
  if (!item.policy || ['allowExecution','allowEditing','allowNavigation'].some(field => typeof item.policy![field as keyof typeof item.policy] !== 'boolean')) return false
  if (!Number.isFinite(Date.parse(item.serverTime || '')) || !Number.isFinite(Date.parse(item.updatedAt || ''))) return false
  if (item.latestIncident === undefined || item.resumeAuthorization === undefined) return false
  if (item.latestIncident && (!['TAB_HIDDEN','WINDOW_FOCUS_LOST','FULLSCREEN_EXIT','CAMERA_INTERRUPTED'].includes(item.latestIncident.type) || !Number.isFinite(Date.parse(item.latestIncident.timestamp)) || typeof item.latestIncident.id !== 'string')) return false
  return true
}
export function canAcceptSession(previous: CompetitionSession | null, next: CompetitionSession, scope: ParticipantScope): boolean {
  if (!isSessionSnapshot(next)) return false
  if (next.contestId !== scope.contestId || next.driverId !== scope.driverId || !Number.isInteger(next.revision) || next.revision < 1) return false
  if (previous && (previous.id !== next.id || next.revision < previous.revision)) return false
  if (previous && next.revision === previous.revision) return previous.status === next.status && previous.resumeAuthorization?.id === next.resumeAuthorization?.id && previous.latestIncident?.id === next.latestIncident?.id && JSON.stringify(previous.policy) === JSON.stringify(next.policy)
  const lockedBefore = previous && ['LOCK_PENDING','LOCKED','UNDER_REVIEW'].includes(previous.status)
  const unlocking = ['ACTIVE','RESUME_AUTHORIZED'].includes(next.status)
  if ((lockedBefore && unlocking) || next.status === 'RESUME_AUTHORIZED') {
    const receipt = next.resumeAuthorization
    if (!receipt || typeof receipt.id !== 'string' || !receipt.id || typeof receipt.actorId !== 'string' || !receipt.actorId || typeof receipt.incidentId !== 'string' || receipt.decision !== 'AUTHORIZE_RESUME' || !['VOLUNTEER','ADMIN'].includes(receipt.actorRole) || !Number.isFinite(Date.parse(receipt.decidedAt))) return false
    if (previous && next.revision <= previous.revision) return false
    if (lockedBefore && previous.latestIncident && Date.parse(receipt.decidedAt) < Date.parse(previous.latestIncident.timestamp)) return false
  }
  return true
}
export function sessionAllowsExecution(session: CompetitionSession | null) {
  return !!session && ['ACTIVE','RESUME_AUTHORIZED'].includes(session.status) && session.policy.allowExecution
}
