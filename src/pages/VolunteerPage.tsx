import { useCallback, useDeferredValue, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Check, ClipboardList, Flag, LoaderCircle, RefreshCw, Search, ShieldAlert, ShieldCheck, Users, X } from 'lucide-react'
import { useSession } from '../hooks/useSession'
import { RaceWordmark } from '../components/RacingIdentity'
import { RaceDialog } from '../components/assist/RaceDialog'
import { monitoringService, isMonitoringMock, monitoringPollMs } from '../services/monitoring'
import type { CompetitionSession, Incident, ResolutionDecision, Viewer } from '../types/monitoring'

interface ReviewTarget {
  incidentId?: string
  sessionId: string
  sessionRevision: number
  driverId: string
  teamName: string
  displayName?: string
  incidentType?: string
  lockReason?: string
  isTerminal?: boolean
}

type StatusFilter = 'all' | 'flagged' | 'racing' | 'review'

export default function VolunteerPage() {
  const { signOut } = useSession()
  const [viewer, setViewer] = useState<Viewer | null>(null)
  const [sessions, setSessions] = useState<CompetitionSession[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [error, setError] = useState('')
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'incidents' | 'participants'>('incidents')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [review, setReview] = useState<ReviewTarget | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [actionError, setActionError] = useState('')
  const viewerRef = useRef<Viewer | null>(null)
  const activeController = useRef<AbortController | null>(null)
  const inFlight = useRef(false)
  const queued = useRef(false)

  const load = useCallback(async (includeViewer = false) => {
    if (inFlight.current) { queued.current = true; return true }
    inFlight.current = true
    let success = false
    try {
      do {
        queued.current = false
        const controller = new AbortController(); activeController.current = controller
        try {
          const currentViewer = includeViewer || !viewerRef.current ? await monitoringService.getViewer(controller.signal) : viewerRef.current
          if (!controller.signal.aborted) {
            viewerRef.current = currentViewer
            setViewer(currentViewer)
            if (!['VOLUNTEER', 'ADMIN'].includes(currentViewer.role)) {
              setConnected(false)
              success = false
            } else {
              const [nextSessions, nextIncidents] = await Promise.all([
                monitoringService.listParticipants(controller.signal),
                monitoringService.listIncidents(controller.signal)
              ])
              if (!controller.signal.aborted) {
                setSessions(nextSessions)
                setIncidents(nextIncidents)
                setConnected(true)
                setError('')
                success = true
              }
            }
          }
        } catch (reason) {
          if (!controller.signal.aborted) {
            const status = (reason as { response?: { status?: number } })?.response?.status
            if (status === 401 || status === 403) {
              viewerRef.current = null
              setViewer(null)
              setSessions([])
              setIncidents([])
              setReview(null)
            }
            setConnected(false)
            setError(reason instanceof Error ? reason.message : 'Race control could not be reached.')
            success = false
          }
        } finally {
          activeController.current = null
          if (!controller.signal.aborted) setLoading(false)
        }
        includeViewer = false
      } while (queued.current)
    } finally {
      inFlight.current = false
    }
    return success
  }, [])

  useEffect(() => {
    let stopped = false, timer = 0
    const schedule = (delay: number) => {
      window.clearTimeout(timer)
      if (!stopped && !document.hidden) timer = window.setTimeout(tick, delay)
    }
    const tick = async () => {
      const success = await load(!viewerRef.current)
      schedule(success ? monitoringPollMs : Math.min(monitoringPollMs * 3, 10000))
    }
    const visibility = () => {
      if (document.hidden) window.clearTimeout(timer)
      else void tick()
    }
    void tick()
    document.addEventListener('visibilitychange', visibility)
    return () => {
      stopped = true
      window.clearTimeout(timer)
      activeController.current?.abort()
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [load])

  const privileged = viewer && ['VOLUNTEER', 'ADMIN'].includes(viewer.role)
  const sessionById = new Map(sessions.map(session => [session.id, session]))
  const sessionByDriverId = new Map(sessions.map(session => [session.driverId, session]))

  const selectedSession = review ? sessionById.get(review.sessionId) : undefined
  const staleReview = !!review && !!selectedSession && selectedSession.revision !== review.sessionRevision
  const terminal = !!review?.isTerminal

  const kpis = sessions.reduce((counts, session) => {
    counts.total++
    if (['ACTIVE', 'RESUME_AUTHORIZED'].includes(session.status)) counts.racing++
    if (['LOCKED', 'LOCK_PENDING'].includes(session.status) || (session.latestIncident?.blocking && session.latestIncident.reviewStatus === 'OPEN')) counts.flagged++
    if (session.status === 'UNDER_REVIEW') counts.review++
    return counts
  }, { total: 0, racing: 0, flagged: 0, review: 0 })

  const deferredSearch = useDeferredValue(search.toLowerCase().trim())
  const rawList = tab === 'incidents' ? incidents : sessions

  const filtered = rawList.filter(item => {
    const isIncident = 'type' in item
    const session = isIncident ? (sessionById.get(item.sessionId) || sessionByDriverId.get(item.driverId)) : item
    const incident = isIncident ? item : item.latestIncident
    const isLocked = session?.status === 'LOCKED' || session?.status === 'LOCK_PENDING'
    const isBlocking = !!(incident?.blocking && incident.reviewStatus === 'OPEN')
    const isFlagged = isLocked || isBlocking

    // Status filtering
    if (statusFilter === 'flagged' && !isFlagged) return false
    if (statusFilter === 'racing' && !['ACTIVE', 'RESUME_AUTHORIZED'].includes(session?.status || '')) return false
    if (statusFilter === 'review' && session?.status !== 'UNDER_REVIEW') return false

    // Search query
    if (!deferredSearch) return true
    const driverIdMatch = item.driverId?.toLowerCase().includes(deferredSearch)
    const teamMatch = session?.team?.toLowerCase().includes(deferredSearch)
    const displayMatch = session?.displayName?.toLowerCase().includes(deferredSearch)
    const incidentTypeMatch = incident?.type?.toLowerCase().includes(deferredSearch)
    const lockReasonMatch = session?.lockReason?.toLowerCase().includes(deferredSearch)

    return !!(driverIdMatch || teamMatch || displayMatch || incidentTypeMatch || lockReasonMatch)
  })

  const closeReview = useCallback(() => {
    if (!busy) {
      setReview(null)
      setNote('')
      setActionError('')
    }
  }, [busy])

  async function resolve(decision: ResolutionDecision) {
    if (!review || !connected || !privileged || terminal || staleReview) return
    const operatorNote = note.trim()
    if (operatorNote.length < 8) {
      setActionError('Add an operator note of at least 8 characters explaining the decision.')
      return
    }
    setBusy(true); setError(''); setActionError(''); setConfirmation('')
    try {
      const targetId = review.incidentId || review.sessionId
      const response = await monitoringService.resolveIncident(targetId, {
        decision,
        expectedSessionRevision: review.sessionRevision,
        note: operatorNote,
        sessionId: review.sessionId
      })
      if (response.authorization.decision !== decision || !response.authorization.id || !['VOLUNTEER', 'ADMIN'].includes(response.authorization.actorRole)) {
        throw new Error('Resolution response could not be verified. Refresh Race Control.')
      }
      setConfirmation(
        decision === 'AUTHORIZE_RESUME'
          ? `Authorization confirmed for team ${review.teamName || review.driverId}. Session successfully unlocked!`
          : decision === 'ESCALATE'
          ? `Incident escalated for organizer review for team ${review.teamName || review.driverId}.`
          : `Session remains locked for team ${review.teamName || review.driverId}.`
      )
      await load()
      setReview(null)
      setNote('')
    } catch (reason) {
      await load()
      setActionError(reason instanceof Error ? reason.message : 'Resolution failed. No approval was confirmed.')
    } finally {
      setBusy(false)
    }
  }

  function selectTab(event: KeyboardEvent<HTMLButtonElement>, next: 'incidents' | 'participants') {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const value = next === 'incidents' ? 'participants' : 'incidents'
    setTab(value)
    window.requestAnimationFrame(() => document.getElementById('volunteer-tab-' + value)?.focus())
  }

  function openIncidentReview(incident: Incident, session?: CompetitionSession) {
    const s = session || sessionById.get(incident.sessionId) || sessionByDriverId.get(incident.driverId)
    setReview({
      incidentId: incident.id,
      sessionId: incident.sessionId,
      sessionRevision: s ? s.revision : 1,
      driverId: incident.driverId,
      teamName: s?.team || 'CPC Grid',
      displayName: s?.displayName,
      incidentType: incident.type,
      lockReason: s?.lockReason,
      isTerminal: incident.reviewStatus !== 'OPEN'
    })
    setNote('')
    setConfirmation('')
    setActionError('')
  }

  function openSessionUnlock(session: CompetitionSession) {
    setReview({
      incidentId: session.latestIncident?.id,
      sessionId: session.id,
      sessionRevision: session.revision,
      driverId: session.driverId,
      teamName: session.team || 'CPC Grid',
      displayName: session.displayName,
      incidentType: session.latestIncident?.type,
      lockReason: session.lockReason,
      isTerminal: false
    })
    setNote('')
    setConfirmation('')
    setActionError('')
  }

  return (
    <div className="volunteer-layout">
      <header className="volunteer-topbar">
        <Link to="/" className="volunteer-brand"><RaceWordmark /></Link>
        <button className="arena-quiet-button" onClick={signOut}>Sign out</button>
        <h1>RACE CONTROL CENTRE <span>// Volunteer Dashboard</span></h1>
        <span className={'volunteer-connection ' + (connected ? 'monitor-good' : 'monitor-warn')}>
          {connected ? 'CONNECTED' : loading ? 'CONNECTING' : 'DISCONNECTED'}
        </span>
        <button className="arena-icon-button" onClick={() => { void load(!viewerRef.current) }} aria-label="Refresh volunteer data">
          <RefreshCw size={16} />
        </button>
      </header>

      {!privileged ? (
        <div className="volunteer-access">
          <ShieldCheck size={42} />
          <h2>{loading ? 'Verifying volunteer access' : 'Volunteer access required'}</h2>
          <p>
            {isMonitoringMock
              ? 'Use a volunteer or admin development account to review mock incidents.'
              : 'An authenticated volunteer or organizer role is required. Contact CPC Club for access.'}
          </p>
          {error && <p role="alert">{error}</p>}
          <Link to="/" className="text-link"><ArrowLeft size={13} />Race overview</Link>
        </div>
      ) : (
        <div className="volunteer-body">
          <aside className="volunteer-sidebar">
            <span className="volunteer-sidebar-label">OPERATIONS</span>
            <div className="volunteer-tabs" role="tablist" aria-label="Race control views">
              <button
                id="volunteer-tab-incidents"
                role="tab"
                aria-selected={tab === 'incidents'}
                aria-controls="volunteer-operations-panel"
                tabIndex={tab === 'incidents' ? 0 : -1}
                className={tab === 'incidents' ? 'selected' : ''}
                onKeyDown={event => selectTab(event, 'incidents')}
                onClick={() => setTab('incidents')}
              >
                <ClipboardList size={16} />
                Race Control
                {incidents.filter(i => i.reviewStatus === 'OPEN' && i.blocking).length > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#dc2626', color: '#fff', fontSize: '9px', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                    {incidents.filter(i => i.reviewStatus === 'OPEN' && i.blocking).length}
                  </span>
                )}
              </button>
              <button
                id="volunteer-tab-participants"
                role="tab"
                aria-selected={tab === 'participants'}
                aria-controls="volunteer-operations-panel"
                tabIndex={tab === 'participants' ? 0 : -1}
                className={tab === 'participants' ? 'selected' : ''}
                onKeyDown={event => selectTab(event, 'participants')}
                onClick={() => setTab('participants')}
              >
                <Users size={16} />
                Participants ({sessions.length})
              </button>
            </div>
            {viewer.role === 'ADMIN' && (
              <Link to="/admin"><Flag size={16} />Administration</Link>
            )}
            <p>
              {viewer.simulation ? 'MOCK PREVIEW' : 'AUTHORIZED ROLE'}
              <span title={viewer.id}>{viewer.id}</span>
            </p>
            <Link to="/" className="volunteer-back"><ArrowLeft size={12} />Overview</Link>
          </aside>

          <section className="volunteer-main" id="volunteer-operations-panel" role="tabpanel" aria-labelledby={'volunteer-tab-' + tab}>
            <div className="volunteer-main-heading">
              <div>
                <h2>{tab === 'incidents' ? 'Integrity Incidents & Alerts' : 'Participant Teams & Sessions'}</h2>
                <p>Real-time telemetry and lock controls. Click on KPI cards to quickly filter teams.</p>
              </div>
              <label className="volunteer-search">
                <Search size={15} />
                <input
                  aria-label="Search team, driver ID, or member"
                  placeholder="Search team, driver ID, name…"
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                />
                {search && (
                  <button type="button" onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#8898ae', cursor: 'pointer', padding: 0 }}>
                    <X size={14} />
                  </button>
                )}
              </label>
            </div>

            {/* Clickable KPI Cards */}
            <div className="volunteer-kpis">
              <button
                type="button"
                className={`kpi-neutral ${statusFilter === 'all' ? 'kpi-active' : ''}`}
                onClick={() => setStatusFilter('all')}
                title="Show all participant teams"
              >
                <strong>{String(kpis.total).padStart(2, '0')}</strong>
                <span>Total drivers {statusFilter === 'all' && '✓'}</span>
              </button>
              <button
                type="button"
                className={`kpi-green ${statusFilter === 'racing' ? 'kpi-active' : ''}`}
                onClick={() => setStatusFilter(prev => prev === 'racing' ? 'all' : 'racing')}
                title="Filter to currently racing teams"
              >
                <strong>{String(kpis.racing).padStart(2, '0')}</strong>
                <span>Racing {statusFilter === 'racing' && '✓'}</span>
              </button>
              <button
                type="button"
                className={`kpi-red ${statusFilter === 'flagged' ? 'kpi-active' : ''}`}
                onClick={() => setStatusFilter(prev => prev === 'flagged' ? 'all' : 'flagged')}
                title="Filter to flagged/locked teams"
              >
                <strong>{String(kpis.flagged).padStart(2, '0')}</strong>
                <span>Flagged {statusFilter === 'flagged' && '✓'}</span>
              </button>
              <button
                type="button"
                className={`kpi-yellow ${statusFilter === 'review' ? 'kpi-active' : ''}`}
                onClick={() => setStatusFilter(prev => prev === 'review' ? 'all' : 'review')}
                title="Filter to sessions under review"
              >
                <strong>{String(kpis.review).padStart(2, '0')}</strong>
                <span>Under review {statusFilter === 'review' && '✓'}</span>
              </button>
            </div>

            {/* Flagged Alert Banner if teams are locked and not currently filtered */}
            {kpis.flagged > 0 && statusFilter !== 'flagged' && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(225,6,0,0.18), rgba(139,14,33,0.3))',
                border: '1px solid #e10600',
                borderRadius: '6px',
                padding: '12px 18px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                boxShadow: '0 0 20px rgba(225,6,0,0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <ShieldAlert size={22} style={{ color: '#ff6e7a', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: '#fff', fontSize: '12px', display: 'block' }}>
                      {kpis.flagged} {kpis.flagged === 1 ? 'Team is' : 'Teams are'} FLAGGED / LOCKED by Race Control
                    </strong>
                    <span style={{ fontSize: '10px', color: '#ffccd0' }}>
                      Action required: Review incidents or authorize resume to allow the participant to continue.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusFilter('flagged')}
                  style={{
                    background: '#e10600',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '7px 14px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}
                >
                  ISOLATE FLAGGED TEAMS →
                </button>
              </div>
            )}

            {/* Quick Filter Bar */}
            <div className="volunteer-filter-bar">
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', marginRight: '4px' }}>
                Filter:
              </span>
              <button
                type="button"
                className={`volunteer-filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All ({tab === 'incidents' ? incidents.length : sessions.length})
              </button>
              <button
                type="button"
                className={`volunteer-filter-pill pill-flagged ${statusFilter === 'flagged' ? 'active' : ''}`}
                onClick={() => setStatusFilter(prev => prev === 'flagged' ? 'all' : 'flagged')}
              >
                Flagged / Locked ({kpis.flagged})
              </button>
              <button
                type="button"
                className={`volunteer-filter-pill pill-racing ${statusFilter === 'racing' ? 'active' : ''}`}
                onClick={() => setStatusFilter(prev => prev === 'racing' ? 'all' : 'racing')}
              >
                Racing ({kpis.racing})
              </button>
              <button
                type="button"
                className={`volunteer-filter-pill pill-review ${statusFilter === 'review' ? 'active' : ''}`}
                onClick={() => setStatusFilter(prev => prev === 'review' ? 'all' : 'review')}
              >
                Under Review ({kpis.review})
              </button>
              {statusFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  style={{ background: 'none', border: 'none', color: '#ff6e7a', fontSize: '10px', cursor: 'pointer', textDecoration: 'underline', marginLeft: '6px' }}
                >
                  Clear filter
                </button>
              )}
            </div>

            {isMonitoringMock && (
              <div className="volunteer-mock-banner">
                MOCK MONITORING — Reviews change only the shared browser preview ledger. No real volunteer notification or event authorization is implied.
              </div>
            )}

            {error && (
              <div className="volunteer-error" role="alert">
                {error}
                <button onClick={() => { void load(!viewerRef.current) }}>Retry connection</button>
              </div>
            )}

            {confirmation && (
              <p className="volunteer-confirmation" role="status">
                <Check size={14} />
                {confirmation}
              </p>
            )}

            <div className="volunteer-table-wrap" role="region" aria-label={tab === 'incidents' ? 'Monitoring incidents' : 'Participant sessions'} tabIndex={0}>
              <table>
                <caption className="sr-only">
                  {tab === 'incidents' ? 'Monitoring incidents requiring race-control review' : 'Current participant monitoring sessions'}
                </caption>
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '220px' }}>Team & Driver</th>
                    <th scope="col" style={{ width: '130px' }}>Session Status</th>
                    <th scope="col">{tab === 'incidents' ? 'Integrity Alert' : 'Alert / Lock Reason'}</th>
                    <th scope="col" style={{ width: '110px' }}>Time (IST)</th>
                    <th scope="col" style={{ width: '90px' }}>{tab === 'incidents' ? 'Review' : 'Revision'}</th>
                    <th scope="col" style={{ width: '150px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => {
                    const isIncident = 'type' in item
                    const incident = isIncident ? item : item.latestIncident
                    const session = isIncident ? (sessionById.get(item.sessionId) || sessionByDriverId.get(item.driverId)) : item
                    const isLocked = session?.status === 'LOCKED' || session?.status === 'LOCK_PENDING'
                    const isBlocking = !!(incident?.blocking && incident.reviewStatus === 'OPEN')
                    const isFlagged = isLocked || isBlocking
                    const itemTerminal = !!incident && incident.reviewStatus !== 'OPEN'
                    const teamName = session?.team || (('team' in item && typeof item.team === 'string') ? item.team : '') || 'CPC Grid'
                    const displayName = session?.displayName || (('displayName' in item && typeof item.displayName === 'string') ? item.displayName : '')
                    const timeValue = 'timestamp' in item ? item.timestamp : item.updatedAt

                    return (
                      <tr key={isIncident ? item.id : item.id + '-session'} style={isFlagged ? { background: 'rgba(225,6,0,0.06)' } : undefined}>
                        {/* Team & Driver Column */}
                        <th scope="row">
                          <div className="volunteer-identity-cell">
                            <div className="volunteer-driver-row">
                              <span className="volunteer-driver-id">{item.driverId}</span>
                              {isFlagged && <span className="volunteer-flag-tag">FLAGGED</span>}
                            </div>
                            <span className="volunteer-team-name" title={teamName}>{teamName}</span>
                            {displayName && displayName !== teamName && (
                              <span className="volunteer-member-name" title={displayName}>{displayName}</span>
                            )}
                          </div>
                        </th>

                        {/* Session Status Column */}
                        <td>
                          <span className={'volunteer-state state-' + (session?.status || 'UNKNOWN').toLowerCase()}>
                            {session?.status.replaceAll('_', ' ') || 'Unknown'}
                          </span>
                        </td>

                        {/* Alert / Signal Column */}
                        <td>
                          <div>
                            {incident ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <strong style={{ color: incident.blocking ? '#ff8b8d' : '#e2e8f0', fontSize: '11px' }}>
                                  {incident.type.replaceAll('_', ' ')}
                                </strong>
                                {incident.blocking && (
                                  <span style={{ fontSize: '8px', color: '#ff6e7a', fontWeight: 700, border: '1px solid #ff4d5e55', padding: '1px 4px', borderRadius: '2px' }}>
                                    BLOCKING
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: '#64748b' }}>—</span>
                            )}
                            {session?.lockReason && (
                              <span className="volunteer-lock-reason" title={session.lockReason}>
                                {session.lockReason}
                              </span>
                            )}
                            {incident?.type === 'WINDOW_FOCUS_LOST' && !session?.lockReason && (
                              <small style={{ color: '#94a3b8', fontSize: '9px', display: 'block', marginTop: '3px' }}>
                                Review signal; candidate may have switched windows.
                              </small>
                            )}
                          </div>
                        </td>

                        {/* Time (IST) */}
                        <td>
                          {new Date(timeValue).toLocaleTimeString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </td>

                        {/* Version / Review Status */}
                        <td>
                          {isIncident ? (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              color: item.reviewStatus === 'OPEN' ? '#fbbf24' : item.reviewStatus === 'AUTHORIZED' ? '#34d399' : '#f87171'
                            }}>
                              {item.reviewStatus}
                            </span>
                          ) : (
                            <span style={{ fontFamily: 'Consolas, monospace', fontSize: '10px', color: '#94a3b8' }}>
                              v{item.revision}
                              {typeof item.score === 'number' && ` · ${item.score} pts`}
                            </span>
                          )}
                        </td>

                        {/* Action Column */}
                        <td>
                          <div className="volunteer-action-group">
                            {isIncident && incident ? (
                              <button
                                className="volunteer-review-button"
                                style={isFlagged ? { background: 'linear-gradient(#dc2626,#991b1b)', borderColor: '#ef4444' } : undefined}
                                aria-label={`${itemTerminal ? 'View' : 'Review'} ${incident.type.replaceAll('_', ' ')} incident for ${teamName} (${item.driverId})`}
                                onClick={() => openIncidentReview(incident, session)}
                                disabled={!connected || busy}
                              >
                                {isFlagged ? 'Review & Unlock' : itemTerminal ? 'View decision' : 'Review incident'}
                              </button>
                            ) : session && isLocked ? (
                              <button
                                className="volunteer-review-button"
                                style={{ background: 'linear-gradient(#dc2626,#991b1b)', borderColor: '#ef4444' }}
                                aria-label={`Authorize resume for locked session ${teamName} (${session.driverId})`}
                                onClick={() => openSessionUnlock(session)}
                                disabled={!connected || busy}
                              >
                                Authorize Resume
                              </button>
                            ) : incident && session ? (
                              <button
                                className="volunteer-review-button"
                                aria-label={`${itemTerminal ? 'View' : 'Review'} ${incident.type.replaceAll('_', ' ')} for ${teamName}`}
                                onClick={() => openIncidentReview(incident, session)}
                                disabled={!connected || busy}
                              >
                                {itemTerminal ? 'View decision' : 'Review incident'}
                              </button>
                            ) : (
                              <span className="monitor-good" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
                                <Check size={12} /> Clear
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {!filtered.length && (
                <div className="volunteer-empty">
                  {statusFilter === 'flagged'
                    ? 'No flagged or locked teams at the moment. All participants are clear.'
                    : search
                    ? `No matching driver or team records for "${search}".`
                    : tab === 'incidents'
                    ? 'No monitoring incidents recorded.'
                    : 'No participant sessions connected yet.'}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Review & Unlock Dialog */}
      {review && (
        <RaceDialog titleId="volunteer-review-title" onClose={closeReview} busy={busy}>
          <div className="volunteer-review-content">
            <AlertTriangle size={29} />
            <span className="assist-eyebrow">RACE CONTROL / INCIDENT REVIEW</span>
            <h2 id="volunteer-review-title">
              {review.teamName} <span style={{ fontSize: '16px', color: '#a0aec0', fontWeight: 400 }}>({review.driverId})</span>
            </h2>
            <p style={{ marginTop: '6px', color: '#cbd5e1', fontSize: '12px' }}>
              {review.incidentType ? review.incidentType.replaceAll('_', ' ') : 'Integrity review'}
              {review.lockReason && ` — ${review.lockReason}`}
            </p>

            <dl>
              <div>
                <dt>Team Name</dt>
                <dd><strong>{review.teamName}</strong></dd>
              </div>
              {review.displayName && (
                <div>
                  <dt>Member Name</dt>
                  <dd>{review.displayName}</dd>
                </div>
              )}
              <div>
                <dt>Driver ID</dt>
                <dd style={{ fontFamily: 'Consolas, monospace' }}>{review.driverId}</dd>
              </div>
              <div>
                <dt>Session state</dt>
                <dd><span className="volunteer-state state-locked">{selectedSession?.status || 'LOCKED'}</span></dd>
              </div>
              {review.lockReason && (
                <div>
                  <dt>Lock Reason</dt>
                  <dd style={{ color: '#ff8b8d', maxWidth: '300px' }}>{review.lockReason}</dd>
                </div>
              )}
              {review.incidentId && (
                <div>
                  <dt>Incident ID</dt>
                  <dd style={{ fontFamily: 'Consolas, monospace', fontSize: '9px' }}>{review.incidentId}</dd>
                </div>
              )}
              <div>
                <dt>Session version</dt>
                <dd>v{selectedSession?.revision || review.sessionRevision}</dd>
              </div>
            </dl>

            {staleReview && (
              <p className="volunteer-error" role="alert">
                The session changed while this review was open. Close and reopen the incident before deciding.
              </p>
            )}

            {terminal ? (
              <p className="volunteer-review-note">This incident has a terminal review decision and is read-only.</p>
            ) : (
              <>
                <p className="volunteer-review-note">
                  Verify the participant’s workstation setup. Authorizing resume clears all blocking alerts and immediately restores the participant’s code execution, navigation, and editing capabilities.
                </p>
                <label className="volunteer-note-field">
                  Operator note
                  <textarea
                    value={note}
                    maxLength={240}
                    rows={3}
                    onChange={event => setNote(event.target.value)}
                    placeholder="Record the workstation inspection, reason for unlock, or escalation details…"
                  />
                  <small>{note.length}/240 characters (minimum 8 required)</small>
                </label>
                <div className="volunteer-resolution-actions">
                  <button
                    disabled={busy || !connected || staleReview}
                    onClick={() => { void resolve('AUTHORIZE_RESUME') }}
                    title="Unlock the team session and allow them to continue"
                  >
                    {busy ? <LoaderCircle size={14} className="spin" /> : <ShieldCheck size={14} />}
                    AUTHORIZE RESUME & UNLOCK
                  </button>
                  <button
                    disabled={busy || !connected || staleReview}
                    onClick={() => { void resolve('KEEP_LOCKED') }}
                  >
                    KEEP LOCKED
                  </button>
                  <button
                    disabled={busy || !connected || staleReview}
                    onClick={() => { void resolve('ESCALATE') }}
                  >
                    ESCALATE TO ORGANIZER
                  </button>
                </div>
              </>
            )}

            {(actionError || error) && (
              <p className="volunteer-error" role="alert" style={{ marginTop: '14px' }}>
                {actionError || error}
              </p>
            )}
          </div>
        </RaceDialog>
      )}
    </div>
  )
}
