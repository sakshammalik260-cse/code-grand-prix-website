import type { CompetitionSession, IncidentRequest, IncidentType, MonitoringSnapshot, ParticipantScope } from '../../types/monitoring'
import { monitoringService, monitoringPollMs } from './index'
import { canAcceptSession, canReportIncident, isSessionSnapshot } from './sessionRules'

export class MonitoringClient {
  private value: MonitoringSnapshot
  private listeners = new Set<() => void>()
  private running = false
  private lifecycle = 0
  private refreshing = false
  private flushing = false
  private abort = new AbortController()
  private interval: ReturnType<typeof setInterval> | undefined
  private problemId: string | null = null
  private journalKey: string
  private lockKey: string
  private monitoringArmed = false
  setMonitoringArmed(armed: boolean) { this.monitoringArmed = armed }
  private permissionDepth = 0
  private permissionUntil = 0
  constructor(privateScope: ParticipantScope) {
    this.scope = {contestId:privateScope.contestId,driverId:privateScope.driverId}
    this.journalKey = `cgp-monitor-pending:${privateScope.contestId}:${privateScope.driverId}`
    this.lockKey = `cgp-monitor-locked:${privateScope.contestId}:${privateScope.driverId}`
    let rememberedLock: CompetitionSession | null = null
    try {
      const cached: unknown = JSON.parse(sessionStorage.getItem(this.lockKey) || 'null')
      if (isSessionSnapshot(cached) && cached.contestId === privateScope.contestId && cached.driverId === privateScope.driverId && ['LOCK_PENDING','LOCKED','UNDER_REVIEW'].includes(cached.status)) rememberedLock = cached
    } catch { /* The authoritative service will restore the session. */ }
    let pending: IncidentRequest[] = []
    try {
      const records: unknown = JSON.parse(sessionStorage.getItem(this.journalKey) || '[]')
      if (Array.isArray(records)) pending = records.filter((item): item is IncidentRequest => !!item && item.contestId === privateScope.contestId && item.driverId === privateScope.driverId && typeof item.clientEventId === 'string' && typeof item.sessionId === 'string' && ['TAB_HIDDEN','WINDOW_FOCUS_LOST','FULLSCREEN_EXIT','CAMERA_INTERRUPTED'].includes(item.type) && typeof item.observedAt === 'string')
    } catch { /* Keep the in-memory retry queue if browser storage is unavailable. */ }
    this.value = { session: rememberedLock, connection: 'CONNECTING', pending, error: '' }
  }
  readonly scope: ParticipantScope
  getSnapshot = () => this.value
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  private publish(patch: Partial<MonitoringSnapshot>) { this.value = { ...this.value, ...patch }; this.listeners.forEach(listener => listener()) }
  private persist() { try { sessionStorage.setItem(this.journalKey,JSON.stringify(this.value.pending)); if (this.value.session && ['LOCK_PENDING','LOCKED','UNDER_REVIEW'].includes(this.value.session.status)) sessionStorage.setItem(this.lockKey,JSON.stringify(this.value.session)); else if (this.value.session) sessionStorage.removeItem(this.lockKey) } catch { /* Queue is retained in memory; never unlock on a storage failure. */ } }
  setProblem(id: string) { this.problemId = id }
  permissionSuppressed() { return this.permissionDepth > 0 || performance.now() < this.permissionUntil }
  async permissionAction(action: () => Promise<unknown>) {
    this.permissionDepth++
    try { await action() } finally { this.permissionDepth--; this.permissionUntil = performance.now() + 1000 }
  }
  start() {
    if (this.running) return
    this.lifecycle++; this.running = true; this.abort = new AbortController()
    this.publish({ connection: 'CONNECTING' })
    void this.refresh()
    this.interval = setInterval(() => { void this.refresh() },monitoringPollMs)
  }
  stop() { this.lifecycle++; this.running = false; this.monitoringArmed = false; this.refreshing = false; this.flushing = false; this.abort.abort(); clearInterval(this.interval); this.persist() }
  private failure(error: unknown) {
    if (!this.running || this.abort.signal.aborted) return
    const status = (error as { response?: { status?: number }; code?: string })?.response?.status
    const expired = status === 401 || status === 403 || (error as { code?: string })?.code === 'AUTH_EXPIRED'
    this.publish({ connection: expired ? 'AUTH_EXPIRED' : 'DISCONNECTED', error: error instanceof Error ? error.message : 'Monitoring service is unavailable. Contact race control.' })
  }
  async refresh() {
    if (!this.running || this.refreshing) return
    this.refreshing = true
    const generation = this.lifecycle, signal = this.abort.signal
    try {
      const next = await monitoringService.getSession(this.scope,signal)
      if (!this.running || generation !== this.lifecycle || signal.aborted) return
      if (canAcceptSession(this.value.session,next,this.scope)) { this.publish({ session: next, connection: 'CONNECTED', error: '' }); this.persist() }
      else if (this.value.session && next.id === this.value.session.id && next.revision < this.value.session.revision) { /* Ignore delayed snapshots, retaining the newest confirmed state. */ }
      else throw new Error('Session update could not be verified. Request a fresh race-control snapshot.')
      await this.flush()
    } catch (error) { if (generation === this.lifecycle && !signal.aborted) this.failure(error) }
    finally { if (generation === this.lifecycle) this.refreshing = false }
  }
  report(type: IncidentType, clientEventId = crypto.randomUUID()) {
    if (!this.running || !this.monitoringArmed || !canReportIncident(this.value) || !this.value.session || this.value.pending.some(item => item.clientEventId === clientEventId)) return
    const request: IncidentRequest = { ...this.scope, sessionId: this.value.session.id, clientEventId, type, observedAt: new Date().toISOString(), problemId: this.problemId }
    this.publish({ pending: [...this.value.pending,request] }); this.persist()
    void this.flush()
  }
  private async flush() {
    if (!this.running || this.flushing || this.value.connection !== 'CONNECTED') return
    this.flushing = true
    const generation = this.lifecycle, signal = this.abort.signal
    try {
      while (this.running && this.value.pending.length) {
        const request = this.value.pending[0]
        const reply = await monitoringService.reportIncident(request,signal)
        if (!this.running || generation !== this.lifecycle || signal.aborted) return
        if (reply.incident.clientEventId !== request.clientEventId || reply.incident.sessionId !== request.sessionId || reply.session.id !== request.sessionId || reply.incident.driverId !== this.scope.driverId || reply.incident.contestId !== this.scope.contestId) throw new Error('Incident acknowledgment did not match this session. Contact race control.')
        const accepted = canAcceptSession(this.value.session,reply.session,this.scope)
        const superseded = this.value.session && reply.session.id === this.value.session.id && reply.session.revision < this.value.session.revision
        if (!accepted && !superseded) throw new Error('Incident session state could not be verified. The report remains queued for race control.')
        this.publish({ ...(accepted ? { session: reply.session } : {}), pending: this.value.pending.filter(item => item.clientEventId !== request.clientEventId), connection: 'CONNECTED', error: '' })
        this.persist()
      }
    } catch (error) { if (generation === this.lifecycle && !signal.aborted) this.failure(error) }
    finally { if (generation === this.lifecycle) this.flushing = false }
  }
}
