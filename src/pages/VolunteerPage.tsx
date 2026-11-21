import { useCallback, useDeferredValue, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Check, ClipboardList, Flag, LoaderCircle, RefreshCw, Search, ShieldCheck, Users } from 'lucide-react'
import { useSession } from '../hooks/useSession'
import { RaceWordmark } from '../components/RacingIdentity'
import { RaceDialog } from '../components/assist/RaceDialog'
import { canAcceptSession } from '../services/monitoring/sessionRules'
import { monitoringService, isMonitoringMock, monitoringPollMs } from '../services/monitoring'
import type { CompetitionSession, Incident, ResolutionDecision, Viewer } from '../types/monitoring'

interface ReviewTarget { incidentId:string; sessionRevision:number }

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
  const [review,setReview] = useState<ReviewTarget | null>(null)
  const [note,setNote] = useState('')
  const [busy,setBusy] = useState(false)
  const [confirmation,setConfirmation] = useState('')
  const [actionError,setActionError] = useState('')
  const viewerRef=useRef<Viewer|null>(null)
  const activeController=useRef<AbortController|null>(null)
  const inFlight=useRef(false)
  const queued=useRef(false)

  const load = useCallback(async (includeViewer=false) => {
    if(inFlight.current){queued.current=true;return true}
    inFlight.current=true
    let success=false
    try { do {
      queued.current=false
      const controller=new AbortController();activeController.current=controller
      try {
        const currentViewer=includeViewer||!viewerRef.current?await monitoringService.getViewer(controller.signal):viewerRef.current
        if(!controller.signal.aborted){viewerRef.current=currentViewer;setViewer(currentViewer);if(!['VOLUNTEER','ADMIN'].includes(currentViewer.role)){setConnected(false);success=false}else{const [nextSessions,nextIncidents]=await Promise.all([monitoringService.listParticipants(controller.signal),monitoringService.listIncidents(controller.signal)]);if(!controller.signal.aborted){setSessions(nextSessions);setIncidents(nextIncidents);setConnected(true);setError('');success=true}}}
      } catch(reason) {
        if(!controller.signal.aborted){const status=(reason as {response?:{status?:number}})?.response?.status;if(status===401||status===403){viewerRef.current=null;setViewer(null);setSessions([]);setIncidents([]);setReview(null)}setConnected(false);setError(reason instanceof Error?reason.message:'Race control could not be reached.');success=false}
      } finally {activeController.current=null;if(!controller.signal.aborted)setLoading(false)}
      includeViewer=false
    } while(queued.current) } finally {inFlight.current=false}
    return success
  },[])

  useEffect(()=>{
    let stopped=false,timer=0
    const schedule=(delay:number)=>{window.clearTimeout(timer);if(!stopped&&!document.hidden)timer=window.setTimeout(tick,delay)}
    const tick=async()=>{const success=await load(!viewerRef.current);schedule(success?monitoringPollMs:Math.min(monitoringPollMs*3,10000))}
    const visibility=()=>{if(document.hidden)window.clearTimeout(timer);else void tick()}
    void tick();document.addEventListener('visibilitychange',visibility)
    return()=>{stopped=true;window.clearTimeout(timer);activeController.current?.abort();document.removeEventListener('visibilitychange',visibility)}
  },[load])

  const privileged=viewer&&['VOLUNTEER','ADMIN'].includes(viewer.role)
  const sessionById=new Map(sessions.map(session=>[session.id,session]))
  const selected=incidents.find(item=>item.id===review?.incidentId)
  const selectedSession=selected?sessionById.get(selected.sessionId):undefined
  const staleReview=!!review&&!!selectedSession&&selectedSession.revision!==review.sessionRevision
  const terminal=!!selected&&selected.reviewStatus!=='OPEN'
  const deferredSearch=useDeferredValue(search.toLowerCase())
  const filtered=(tab==='incidents'?incidents:sessions).filter(item=>item.driverId.toLowerCase().includes(deferredSearch))
  const kpis=sessions.reduce((counts,session)=>{counts.total++;if(['ACTIVE','RESUME_AUTHORIZED'].includes(session.status))counts.racing++;if(['LOCKED','LOCK_PENDING'].includes(session.status))counts.flagged++;if(session.status==='UNDER_REVIEW')counts.review++;return counts},{total:0,racing:0,flagged:0,review:0})
  const closeReview=useCallback(()=>{if(!busy){setReview(null);setNote('');setActionError('')}},[busy])

  async function resolve(decision:ResolutionDecision){
    if(!selected||!selectedSession||!review||!connected||!privileged||terminal||staleReview)return
    const operatorNote=note.trim()
    if(operatorNote.length<8){setActionError('Add a brief operator note of at least 8 characters.');return}
    setBusy(true);setError('');setActionError('');setConfirmation('')
    try{
      const response=await monitoringService.resolveIncident(selected.id,{decision,expectedSessionRevision:review.sessionRevision,note:operatorNote})
      if(response.authorization.decision!==decision||response.incident.id!==selected.id||!response.authorization.id||!['VOLUNTEER','ADMIN'].includes(response.authorization.actorRole)||!canAcceptSession(selectedSession,response.session,selectedSession))throw new Error('Resolution response could not be verified. Refresh the session.')
      setConfirmation(decision==='AUTHORIZE_RESUME'&&response.session.status==='RESUME_AUTHORIZED'?'Service confirmed resume authorization.':decision==='AUTHORIZE_RESUME'?'Incident authorized. Other blocking incidents still require review.':decision==='ESCALATE'?'Service confirmed escalation for organizer review.':'Service confirmed that the session remains locked.')
      await load();setReview(null);setNote('')
    }catch(reason){await load();setActionError(reason instanceof Error?reason.message:'Resolution failed. No approval was confirmed.')}
    finally{setBusy(false)}
  }

  function selectTab(event:KeyboardEvent<HTMLButtonElement>,next:'incidents'|'participants'){
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return
    event.preventDefault();const value=next==='incidents'?'participants':'incidents';setTab(value);window.requestAnimationFrame(()=>document.getElementById('volunteer-tab-'+value)?.focus())
  }

  return <div className="volunteer-layout"><header className="volunteer-topbar"><Link to="/" className="volunteer-brand"><RaceWordmark /></Link><button className="arena-quiet-button" onClick={signOut}>Sign out</button><h1>RACE CONTROL CENTRE <span>// Volunteer Dashboard</span></h1><span className={'volunteer-connection '+(connected?'monitor-good':'monitor-warn')}>{connected?'CONNECTED':loading?'CONNECTING':'DISCONNECTED'}</span><button className="arena-icon-button" onClick={()=>{void load(!viewerRef.current)}} aria-label="Refresh volunteer data"><RefreshCw size={16}/></button></header>
    {!privileged?<div className="volunteer-access"><ShieldCheck size={42}/><h2>{loading?'Verifying volunteer access':'Volunteer access required'}</h2><p>{isMonitoringMock?'Use a volunteer or admin development account to review mock incidents.':'An authenticated volunteer or organizer role is required. Contact CPC Club for access.'}</p>{error&&<p role="alert">{error}</p>}<Link to="/" className="text-link"><ArrowLeft size={13}/>Race overview</Link></div>:<div className="volunteer-body"><aside className="volunteer-sidebar"><span className="volunteer-sidebar-label">OPERATIONS</span><div className="volunteer-tabs" role="tablist" aria-label="Race control views"><button id="volunteer-tab-incidents" role="tab" aria-selected={tab==='incidents'} aria-controls="volunteer-operations-panel" tabIndex={tab==='incidents'?0:-1} className={tab==='incidents'?'selected':''} onKeyDown={event=>selectTab(event,'incidents')} onClick={()=>setTab('incidents')}><ClipboardList size={16}/>Race Control</button><button id="volunteer-tab-participants" role="tab" aria-selected={tab==='participants'} aria-controls="volunteer-operations-panel" tabIndex={tab==='participants'?0:-1} className={tab==='participants'?'selected':''} onKeyDown={event=>selectTab(event,'participants')} onClick={()=>setTab('participants')}><Users size={16}/>Participants</button></div>{viewer.role==='ADMIN'&&<Link to="/admin"><Flag size={16}/>Administration</Link>}<p>{viewer.simulation?'MOCK PREVIEW':'AUTHORIZED ROLE'}<span title={viewer.id}>{viewer.id}</span></p><Link to="/" className="volunteer-back"><ArrowLeft size={12}/>Overview</Link></aside><section className="volunteer-main" id="volunteer-operations-panel" role="tabpanel" aria-labelledby={'volunteer-tab-'+tab}><div className="volunteer-main-heading"><div><h2>{tab==='incidents'?'Incident review':'Participant sessions'}</h2><p>Session updates are authoritative service responses. Refreshes after each completed request.</p></div><label className="volunteer-search"><Search size={15}/><input aria-label="Search driver ID" placeholder="Search driver ID…" value={search} onChange={event=>setSearch(event.target.value)}/></label></div><div className="volunteer-kpis">{[['Total drivers',kpis.total,'neutral'],['Racing',kpis.racing,'green'],['Flagged',kpis.flagged,'red'],['Under review',kpis.review,'yellow']].map(([label,count,tone])=><div key={label} className={'kpi-'+tone}><strong>{String(count).padStart(2,'0')}</strong><span>{label}</span></div>)}</div>{isMonitoringMock&&<div className="volunteer-mock-banner">MOCK MONITORING — Reviews change only the shared browser preview ledger. No real volunteer notification or event authorization is implied.</div>}{error&&<div className="volunteer-error" role="alert">{error}<button onClick={()=>{void load(!viewerRef.current)}}>Retry connection</button></div>}{confirmation&&<p className="volunteer-confirmation" role="status"><Check size={14}/>{confirmation}</p>}<div className="volunteer-table-wrap" role="region" aria-label={tab==='incidents'?'Monitoring incidents':'Participant sessions'} tabIndex={0}><table><caption className="sr-only">{tab==='incidents'?'Monitoring incidents requiring race-control review':'Current participant monitoring sessions'}</caption><thead><tr><th scope="col">Driver ID</th><th scope="col">Session</th><th scope="col">{tab==='incidents'?'Incident':'Latest incident'}</th><th scope="col">Time (IST)</th><th scope="col">{tab==='incidents'?'Review':'Version'}</th><th scope="col">Action</th></tr></thead><tbody>{filtered.map(item=>{const incident='type' in item?item:item.latestIncident;const session='type' in item?sessionById.get(item.sessionId):item;const itemTerminal=!!incident&&incident.reviewStatus!=='OPEN';return <tr key={'type' in item?item.id:item.id+'-session'}><th scope="row">{item.driverId}</th><td><span className={'volunteer-state state-'+(session?.status||'UNKNOWN').toLowerCase()}>{session?.status.replaceAll('_',' ')||'Loading'}</span></td><td>{incident?.type.replaceAll('_',' ')||'—'}{incident?.type==='WINDOW_FOCUS_LOST'&&<small>Review signal; not confirmed tab hiding</small>}</td><td>{new Date('timestamp' in item?item.timestamp:item.updatedAt).toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',second:'2-digit'})}</td><td>{'reviewStatus' in item?item.reviewStatus:`v${item.revision}`}</td><td>{incident&&session?<button className="volunteer-review-button" aria-label={`${itemTerminal?'View':'Review'} ${incident.type.replaceAll('_',' ')} incident for ${item.driverId}`} onClick={()=>{setReview({incidentId:incident.id,sessionRevision:session.revision});setNote('');setConfirmation('');setActionError('')}} disabled={!connected||busy}>{itemTerminal?'View decision':'Review incident'}</button>:<span className="monitor-good">No incident</span>}</td></tr>})}</tbody></table>{!filtered.length&&<div className="volunteer-empty">{search?'No matching driver records.':tab==='incidents'?'No monitoring incidents have been recorded.':'No participant sessions have connected yet.'}</div>}</div></section></div>}
    {selected&&selectedSession&&<RaceDialog titleId="volunteer-review-title" onClose={closeReview} busy={busy}><div className="volunteer-review-content"><AlertTriangle size={29}/><span className="assist-eyebrow">RACE CONTROL / INCIDENT REVIEW</span><h2 id="volunteer-review-title">Review driver {selected.driverId}</h2><p>{selected.type.replaceAll('_',' ')} · {selected.reviewStatus}</p><dl><div><dt>Session state</dt><dd>{selectedSession.status}</dd></div><div><dt>Problem</dt><dd>{selected.problemId||'Not selected'}</dd></div><div><dt>Incident ID</dt><dd>{selected.id}</dd></div><div><dt>Session version</dt><dd>{selectedSession.revision}</dd></div></dl>{staleReview&&<p className="volunteer-error" role="alert">The session changed while this review was open. Close and reopen the incident before deciding.</p>}{terminal?<p className="volunteer-review-note">This incident has a terminal review decision and is read-only.</p>:<><p className="volunteer-review-note">Verify the participant’s setup before authorizing. Every outstanding blocking incident must be reviewed. This does not grant additional contest time.</p><label className="volunteer-note-field">Operator note<textarea value={note} maxLength={240} rows={3} onChange={event=>setNote(event.target.value)} placeholder="Record the setup check or escalation reason"/><small>{note.length}/240 characters</small></label><div className="volunteer-resolution-actions"><button disabled={busy||!connected||staleReview} onClick={()=>{void resolve('AUTHORIZE_RESUME')}}>{busy?<LoaderCircle size={14} className="spin"/>:<ShieldCheck size={14}/>}AUTHORIZE RESUME</button><button disabled={busy||!connected||staleReview} onClick={()=>{void resolve('KEEP_LOCKED')}}>KEEP LOCKED</button><button disabled={busy||!connected||staleReview} onClick={()=>{void resolve('ESCALATE')}}>ESCALATE</button></div></>}{(actionError||error)&&<p className="volunteer-error" role="alert">{actionError||error}</p>}</div></RaceDialog>}
  </div>
}
