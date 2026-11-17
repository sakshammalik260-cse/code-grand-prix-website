import { useCallback, useEffect, useState } from 'react'
import { useSession } from '../hooks/useSession'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Check, ClipboardList, Flag, LoaderCircle, RefreshCw, Search, ShieldCheck, Users, X } from 'lucide-react'
import { RaceWordmark } from '../components/RacingIdentity'
import { canAcceptSession } from '../services/monitoring/sessionRules'
import { monitoringService, isMonitoringMock, monitoringPollMs } from '../services/monitoring'
import type { CompetitionSession, Incident, ResolutionDecision, Viewer } from '../types/monitoring'

export default function VolunteerPage() {
  const {signOut}=useSession()
  const [viewer,setViewer] = useState<Viewer | null>(null)
  const [sessions,setSessions] = useState<CompetitionSession[]>([])
  const [incidents,setIncidents] = useState<Incident[]>([])
  const [error,setError] = useState('')
  const [connected,setConnected] = useState(false)
  const [loading,setLoading] = useState(true)
  const [search,setSearch] = useState('')
  const [tab,setTab] = useState<'incidents' | 'participants'>('incidents')
  const [review,setReview] = useState<string | null>(null)
  const [busy,setBusy] = useState(false)
  const [confirmation,setConfirmation] = useState('')
  const [actionError,setActionError] = useState('')
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const currentViewer = await monitoringService.getViewer(signal)
      if (signal?.aborted) return
      setViewer(currentViewer)
      if (!['VOLUNTEER','ADMIN'].includes(currentViewer.role)) { setConnected(false);setLoading(false);return }
      const [nextSessions,nextIncidents] = await Promise.all([monitoringService.listParticipants(signal),monitoringService.listIncidents(signal)])
      if (signal?.aborted) return
      setSessions(nextSessions);setIncidents(nextIncidents);setConnected(true);setError('')
    } catch(reason) { if (!signal?.aborted) { const status = (reason as { response?: { status?: number } })?.response?.status; if (status === 401 || status === 403) { setViewer(null);setSessions([]);setIncidents([]);setReview(null) }; setConnected(false);setError(reason instanceof Error ? reason.message : 'Race control could not be reached.') } }
    finally { if (!signal?.aborted) setLoading(false) }
  },[])
  useEffect(() => {
    const controller = new AbortController();void Promise.resolve().then(() => { if (!controller.signal.aborted) return load(controller.signal) })
    const timer = window.setInterval(() => { void load(controller.signal) },monitoringPollMs)
    return () => { controller.abort();clearInterval(timer) }
  },[load])
  const privileged = viewer && ['VOLUNTEER','ADMIN'].includes(viewer.role)
  const selected = incidents.find(item => item.id === review)
  const selectedSession = sessions.find(item => item.id === selected?.sessionId)
  async function resolve(decision: ResolutionDecision) {
    if (!selected || !selectedSession || !connected || !privileged) return
    setBusy(true);setError('');setActionError('');setConfirmation('')
    try {
      const response = await monitoringService.resolveIncident(selected.id,{ decision,expectedSessionRevision:selectedSession.revision,note:'Reviewed in race control console' })
      if (response.authorization.decision !== decision || response.incident.id !== selected.id || !response.authorization.id || !['VOLUNTEER','ADMIN'].includes(response.authorization.actorRole) || !canAcceptSession(selectedSession,response.session,selectedSession)) throw new Error('Resolution response could not be verified. Refresh the session.')
      setConfirmation(decision === 'AUTHORIZE_RESUME' && response.session.status === 'RESUME_AUTHORIZED' ? 'Service confirmed resume authorization.' : decision === 'AUTHORIZE_RESUME' ? 'Incident authorized. Other blocking incidents still require review.' : decision === 'ESCALATE' ? 'Service confirmed escalation for organizer review.' : 'Service confirmed that the session remains locked.')
      await load();setReview(null)
    } catch(reason) { await load();setActionError(reason instanceof Error ? reason.message : 'Resolution failed. No approval was confirmed.') }
    finally { setBusy(false) }
  }
  const filtered = (tab === 'incidents' ? incidents : sessions).filter(item => item.driverId.toLowerCase().includes(search.toLowerCase()))
  return <div className="volunteer-layout"><header className="volunteer-topbar"><Link to="/" className="volunteer-brand"><RaceWordmark /></Link><button className="arena-quiet-button" onClick={signOut}>Sign out</button><h1>RACE CONTROL CENTRE <span>// Volunteer Dashboard</span></h1><span className={'volunteer-connection ' + (connected ? 'monitor-good' : 'monitor-warn')}>{connected ? 'CONNECTED' : loading ? 'CONNECTING' : 'DISCONNECTED'}</span><button className="arena-icon-button" onClick={() => { void load() }} aria-label="Refresh volunteer data"><RefreshCw size={16} /></button></header>
    {!privileged ? <div className="volunteer-access"><ShieldCheck size={42} /><h2>{loading ? 'Verifying volunteer access' : 'Volunteer access required'}</h2><p>{isMonitoringMock ? 'Use a volunteer or admin development account to review mock incidents.' : 'An authenticated volunteer or organizer role is required. Contact CPC Club for access.'}</p>{error && <p role="alert">{error}</p>}<Link to="/" className="text-link"><ArrowLeft size={13} />Race overview</Link></div> : <div className="volunteer-body"><aside className="volunteer-sidebar"><span className="volunteer-sidebar-label">OPERATIONS</span><button className={tab === 'incidents' ? 'selected' : ''} onClick={() => setTab('incidents')}><ClipboardList size={16} />Race Control</button><button className={tab === 'participants' ? 'selected' : ''} onClick={() => setTab('participants')}><Users size={16} />Participants</button>{viewer.role==='ADMIN'&&<Link to="/admin"><Flag size={16} />Administration</Link>}<p>{viewer.simulation ? 'MOCK PREVIEW' : 'AUTHORIZED ROLE'}<span>{viewer.id}</span></p><Link to="/" className="volunteer-back"><ArrowLeft size={12} />Overview</Link></aside><main className="volunteer-main"><div className="volunteer-main-heading"><div><h2>{tab === 'incidents' ? 'Incident review' : 'Participant sessions'}</h2><p>Session updates are authoritative service responses. Refresh interval: {monitoringPollMs / 1000}s.</p></div><label className="volunteer-search"><Search size={15} /><input aria-label="Search driver ID" placeholder="Search driver ID…" value={search} onChange={event => setSearch(event.target.value)} /></label></div><div className="volunteer-kpis">{[
      ['Total drivers',sessions.length,'neutral'],['Racing',sessions.filter(item => ['ACTIVE','RESUME_AUTHORIZED'].includes(item.status)).length,'green'],['Flagged',sessions.filter(item => ['LOCKED','LOCK_PENDING'].includes(item.status)).length,'red'],['Under review',sessions.filter(item => item.status === 'UNDER_REVIEW').length,'yellow'],
    ].map(([label,count,tone]) => <div key={label} className={'kpi-' + tone}><strong>{String(count).padStart(2,'0')}</strong><span>{label}</span></div>)}</div>{isMonitoringMock && <div className="volunteer-mock-banner">MOCK MONITORING — Reviews change only the shared browser preview ledger. No real volunteer notification or event authorization is implied.</div>}{error && <div className="volunteer-error" role="alert">{error}<button onClick={() => { void load() }}>Retry connection</button></div>}{confirmation && <p className="volunteer-confirmation" role="status"><Check size={14} />{confirmation}</p>}<div className="volunteer-table-wrap"><table><thead><tr><th>Driver ID</th><th>Session</th><th>{tab === 'incidents' ? 'Incident' : 'Latest incident'}</th><th>Time (IST)</th><th>{tab === 'incidents' ? 'Review' : 'Version'}</th><th>Action</th></tr></thead><tbody>{filtered.map(item => {
      const incident = 'type' in item ? item : item.latestIncident
      const session = 'type' in item ? sessions.find(value => value.id === item.sessionId) : item
      return <tr key={'type' in item ? item.id : item.id + '-session'}><td>{item.driverId}</td><td><span className={'volunteer-state state-' + (session?.status || 'UNKNOWN').toLowerCase()}>{session?.status.replaceAll('_',' ') || 'Loading'}</span></td><td>{incident?.type.replaceAll('_',' ') || '—'}{incident?.type === 'WINDOW_FOCUS_LOST' && <small>Review signal; not confirmed tab hiding</small>}</td><td>{new Date('timestamp' in item ? item.timestamp : item.updatedAt).toLocaleTimeString('en-IN',{ timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',second:'2-digit' })}</td><td>{'reviewStatus' in item ? item.reviewStatus : `v${item.revision}`}</td><td>{incident ? <button className="volunteer-review-button" onClick={() => { setReview(incident.id);setConfirmation('');setActionError('') }} disabled={!connected || busy}>Review incident</button> : <span className="monitor-good">No incident</span>}</td></tr>
    })}</tbody></table>{!filtered.length && <div className="volunteer-empty">{search ? 'No matching driver records.' : tab === 'incidents' ? 'No monitoring incidents have been recorded.' : 'No participant sessions have connected yet.'}</div>}</div></main></div>}
    {selected && selectedSession && <div className="volunteer-review-backdrop"><section className="volunteer-review-card" role="dialog" aria-modal="true" aria-labelledby="volunteer-review-title"><button className="volunteer-review-close arena-icon-button" onClick={() => setReview(null)} aria-label="Close incident review" disabled={busy}><X size={18} /></button><AlertTriangle size={29} /><h2 id="volunteer-review-title">Review driver {selected.driverId}</h2><p>{selected.type.replaceAll('_',' ')} · {selected.reviewStatus}</p><dl><div><dt>Session state</dt><dd>{selectedSession.status}</dd></div><div><dt>Problem</dt><dd>{selected.problemId || 'Not selected'}</dd></div><div><dt>Incident ID</dt><dd>{selected.id}</dd></div><div><dt>Session version</dt><dd>{selectedSession.revision}</dd></div></dl><p className="volunteer-review-note">Verify the participant’s setup before authorizing. Every outstanding blocking incident must be reviewed. This does not grant additional contest time.</p><div className="volunteer-resolution-actions"><button disabled={busy || !connected} onClick={() => { void resolve('AUTHORIZE_RESUME') }}>{busy ? <LoaderCircle size={14} className="spin" /> : <ShieldCheck size={14} />}AUTHORIZE RESUME</button><button disabled={busy || !connected} onClick={() => { void resolve('KEEP_LOCKED') }}>KEEP LOCKED</button><button disabled={busy || !connected} onClick={() => { void resolve('ESCALATE') }}>ESCALATE</button></div>{(actionError || error) && <p className="volunteer-error" role="alert">{actionError || error}</p>}</section></div>}
  </div>
}
