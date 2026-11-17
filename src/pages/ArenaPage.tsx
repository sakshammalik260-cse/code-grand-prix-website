import { RaceAssist } from '../components/assist/RaceAssist'
import { SyntaxGuide } from '../components/assist/SyntaxGuide'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CircleHelp, FileCode2, FlaskConical, LoaderCircle, Play, Send, ShieldCheck } from 'lucide-react'
import { ArenaWorkspace } from '../components/ArenaWorkspace'
import { MonitoringStatus } from '../components/monitoring/MonitoringStatus'
import { ViolationLockOverlay } from '../components/monitoring/ViolationLockOverlay'
import { useContestMonitoring } from '../hooks/useContestMonitoring'
import { ArenaHeader } from '../components/arena/ArenaHeader'
import { ProblemNavigation } from '../components/arena/ProblemNavigation'
import { ProblemStatement } from '../components/arena/ProblemStatement'
import { CodeEditor } from '../components/arena/CodeEditor'
import { ResultsPanel } from '../components/arena/ResultsPanel'
import type { ResultsTab } from '../components/arena/ResultsPanel'
const MockArenaControls=import.meta.env.DEV?lazy(()=>import('../components/arena/MockArenaControls').then(module=>({default:module.MockArenaControls}))):null
import { useSession } from '../hooks/useSession'
import { useArenaBoot } from '../hooks/useArenaBoot'
import type { ArenaBootData } from '../hooks/useArenaBoot'
import { useDraft } from '../hooks/useDraft'
import { useArenaExecution } from '../hooks/useArenaExecution'
import { useRaceClock } from '../hooks/useRaceClock'
import { useFullscreenStatus } from '../hooks/useFullscreenStatus'
import { arenaServices, isArenaMockMode } from '../services/arena'
import { errorMessage, mockControls } from '../services/arena/mockState'
import { isLanguageId, starterCode } from '../data/starterCode'
import type { CodeExecutionRequest, ContestPhase, ContestState, LanguageId, Problem, ProblemSummary } from '../types/arena'
import type { ReactNode } from 'react'

const MonitoringDevPanel = import.meta.env.DEV ? lazy(() => import('../components/monitoring/MonitoringDevPanel')) : null

export default function ArenaPage() {
  const { driver } = useSession()
  if (!driver) return <div className="arena-load-screen"><h1>Driver session required</h1><Link to="/login">Return to driver login</Link></div>
  return <ArenaSession key={driver.id} driverId={driver.id} />
}
function ArenaSession({ driverId }: { driverId: string }) {
  const boot = useArenaBoot(driverId)
  if (boot.error) return <div className="arena-load-screen"><AlertCircle size={34} /><h1>Unable to load the race</h1><p>{boot.error}</p><button className="button button-primary" onClick={boot.retry}>RETRY CONNECTION</button><Link to="/lobby">Return to lobby</Link></div>
  if (!boot.data) return <div className="arena-load-screen" role="status"><LoaderCircle size={30} className="spin" /><h1>Preparing your cockpit</h1><p>Loading problems, race status and driver progress…</p></div>
  if (!boot.data.session.active || boot.data.session.driverId !== driverId) return <div className="arena-load-screen"><ShieldCheck size={34} /><h1>Your driver session needs attention</h1><p>Sign in again before returning to the arena. Your local drafts are preserved.</p><Link className="button button-primary" to="/check-in">REVIEW DRIVER CHECK-IN</Link></div>
  return <ArenaLoaded initial={boot.data} driverId={driverId} />
}
function ArenaLoaded({ initial, driverId }: { initial: ArenaBootData; driverId: string }) {
  const [params, setParams] = useSearchParams()
  const [contest, setContest] = useState(initial.contest)
  const [problems,setProblems]=useState<ProblemSummary[]>(initial.problems)
  const [progress, setProgress] = useState(initial.progress)
  const [busy, setBusy] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [noticeError, setNoticeError] = useState('')
  const [detail, setDetail] = useState<{ id: string; problem?: Problem; error?: string } | null>(null)
  const [detailAttempt, setDetailAttempt] = useState(0)
  const controllers = useRef(new Set<AbortController>())
  const alive = useRef(true)
  const fullscreen = useFullscreenStatus()
  const clock = useRaceClock(contest)
  const selectedId = params.get('problem') || (problems.some(p=>p.id==='p2')?'p2':problems[0]?.id || '')
  const permitted = problems.find(p=>p.id===selectedId)?.allowedLanguages || ['python','java','cpp','javascript'] as LanguageId[]
  const language = isLanguageId(params.get('lang')) ? params.get('lang') as LanguageId : permitted.includes('cpp')?'cpp':permitted[0] || 'cpp'
  const monitoring = useContestMonitoring({ contestId: contest.id, driverId, problemId: selectedId, enabled: clock.effectivePhase === 'LIVE' })
  const { signOut } = useSession()
  const overlayVisible = monitoring.locked || monitoring.session?.status === 'RESUME_AUTHORIZED' && !monitoring.ready
  const editingLocked = monitoring.locked || !!monitoring.session && !monitoring.session.policy.allowEditing
  const development = import.meta.env.DEV && isArenaMockMode && MonitoringDevPanel ? <Suspense fallback={null}><MonitoringDevPanel client={monitoring.client} session={monitoring.session} /></Suspense> : null
  const restoreFullscreen = () => { void monitoring.client.permissionAction(fullscreen.activate) }
  const decorate = (workspace: ReactNode) => <div className="monitoring-arena-shell"><div className="monitoring-underlay" inert={overlayVisible} aria-hidden={overlayVisible ? true : undefined}>{workspace}</div>{overlayVisible && <ViolationLockOverlay session={monitoring.session} connection={monitoring.connection} pending={monitoring.pending} error={monitoring.error || fullscreen.error} camera={monitoring.camera.status} cameraPending={monitoring.camera.pending} cameraError={monitoring.camera.error} fullscreen={fullscreen.active} onCamera={() => { void monitoring.recoverCamera() }} onFullscreen={restoreFullscreen} onRefresh={() => { void monitoring.client.refresh() }} onSignOut={signOut} developmentControls={development} />}{!overlayVisible && development}</div>
  const summary = problems.find(problem => problem.id === selectedId)
  useEffect(() => {
    alive.current = true
    const pending = controllers.current
    return () => { alive.current = false; pending.forEach(controller => controller.abort()) }
  }, [])
  useEffect(() => {
    if (!summary) return
    const controller = new AbortController()
    arenaServices.getProblem(selectedId, controller.signal)
      .then(problem => { if (!controller.signal.aborted) setDetail({ id: selectedId, problem }) })
      .catch(reason => { if (!controller.signal.aborted) setDetail({ id: selectedId, error: errorMessage(reason) }) })
    return () => controller.abort()
  }, [selectedId, summary, detailAttempt])
  const refreshContest = useCallback(async (quiet = false) => {
    const controller = new AbortController()
    controllers.current.add(controller)
    if (!quiet) setRefreshing(true)
    try {
      const [next,nextProblems] = await Promise.all([arenaServices.getContest(controller.signal),arenaServices.listProblems(controller.signal)])
      if (alive.current && !controller.signal.aborted) { setContest(next); setProblems(nextProblems); setDetailAttempt(value=>value+1); setNoticeError('') }
    } catch (reason) { if (alive.current && !controller.signal.aborted) setNoticeError('Race status could not be refreshed. ' + errorMessage(reason)) }
    finally { controllers.current.delete(controller); if (alive.current && !quiet) setRefreshing(false) }
  }, [])
  useEffect(() => {
    const timer = window.setInterval(() => { void refreshContest(true) }, 15000)
    return () => window.clearInterval(timer)
  }, [refreshContest])
  const refreshProgress = useCallback(async (signal?: AbortSignal) => {
    try {
      const next = await arenaServices.getProgress(contest.id, driverId, signal)
      if (alive.current && !signal?.aborted) setProgress(next)
    } catch (reason) { if (alive.current && !signal?.aborted) setNoticeError('Progress is temporarily unavailable. ' + errorMessage(reason)) }
  }, [contest.id, driverId])
  const selectProblem = useCallback((id: string) => setParams(previous => { const next = new URLSearchParams(previous); next.set('problem',id); return next }, { replace: true }), [setParams])
  const selectLanguage = useCallback((id: LanguageId) => setParams(previous => { const next = new URLSearchParams(previous); next.set('lang',id); return next }, { replace: true }), [setParams])
  function retryProblem() { setDetail(null); setDetailAttempt(value => value + 1) }
  function changeMockPhase(phase: ContestPhase) { setContest(mockControls.setContestPhase(phase)); setNoticeError('') }
  const header = <ArenaHeader contest={{ ...contest, status: clock.effectivePhase }} fullscreen={fullscreen.active} onFullscreen={restoreFullscreen} onRefresh={() => { void refreshContest(); void monitoring.client.refresh() }} refreshing={refreshing} monitoring={<MonitoringStatus camera={monitoring.camera.status} fullscreen={fullscreen.active} session={monitoring.session} connection={monitoring.connection} locked={monitoring.locked} />} />
  const sidebar = <ProblemNavigation problems={problems} selected={selectedId} progress={progress} busy={busy || monitoring.locked || !!monitoring.session && !monitoring.session.policy.allowNavigation} onSelect={selectProblem} />
  const phaseText = clock.effectivePhase === 'WAITING' ? 'The race has not started. You can prepare your draft; Run and Submit unlock when race control starts the contest.' : clock.effectivePhase === 'PAUSED_BY_ORGANIZER' ? 'Paused by organizer. Your draft remains editable; Run and Submit are unavailable until the race resumes.' : clock.ended ? 'The chequered flag is out. Submissions are closed; your local drafts remain available.' : !clock.canSubmit ? 'Race timing is unavailable. Refresh race status before submitting.' : ''
  const notice = <>{(!monitoring.authorized || !monitoring.ready) && !overlayVisible && <div className="monitoring-health-banner" role="status"><span>{monitoring.connection !== 'CONNECTED' ? monitoring.error || 'Verifying competition session...' : monitoring.session?.status === 'FINISHED' ? 'The competition session is finished. Execution is closed; your draft remains available.' : !monitoring.ready ? 'Restore camera and fullscreen before executing code. Your draft remains available.' : 'Race-control authorization is required.'}</span>{monitoring.camera.status !== 'ACTIVE' && <button onClick={() => { void monitoring.recoverCamera() }} disabled={monitoring.camera.pending}>{monitoring.camera.pending ? 'Requesting camera...' : 'Restore camera'}</button>}{!fullscreen.active && <button onClick={restoreFullscreen}>Re-enter fullscreen</button>}<button onClick={() => { void monitoring.client.refresh() }}>Refresh session</button>{monitoring.connection === 'AUTH_EXPIRED' && <button onClick={signOut}>Sign in again</button>}</div>}{!permitted.includes(language) && <div className="arena-state-notice state-error" role="status">This language is not permitted. Select an available language; your existing draft remains saved.</div>}{phaseText && <div className={'arena-state-notice state-' + clock.effectivePhase.toLowerCase()} role="status"><CircleHelp size={14} /><span>{phaseText}</span></div>}{(noticeError || fullscreen.error) && <div className="arena-state-notice state-error" role="alert"><AlertCircle size={14} /><span>{noticeError || fullscreen.error}</span><button onClick={() => { if (noticeError) void refreshContest().then(() => refreshProgress()); else void fullscreen.activate() }}>Retry</button></div>}</>
  const mockControlsUi = import.meta.env.DEV && isArenaMockMode && MockArenaControls ? <Suspense fallback={null}><MockArenaControls busy={busy} onPhase={changeMockPhase} onExpiry={() => setContest(mockControls.finishInFiveSeconds())} /></Suspense> : null
  if (!summary) return decorate(<ArenaWorkspace topBar={header} problemNavigation={sidebar} problemStatement={<div className="arena-inline-error"><AlertCircle size={28} /><h2>Problem not found</h2><p>{problems.length ? 'Choose a valid problem from the left sidebar.' : 'No problems have been released for this contest.'}</p>{problems[0] && <button className="arena-quiet-button" onClick={() => selectProblem(problems[0].id)}>Open first problem</button>}</div>} editor={<div className="arena-pane-loading"><FileCode2 size={27} /><p>Select a problem to restore its draft.</p></div>} editorActions={null} results={null} notice={notice} statusBar={<ArenaStatusBar simulation={contest.simulation} controls={mockControlsUi} />} />)
  const problem = detail?.id === selectedId ? detail.problem || null : null
  const problemError = detail?.id === selectedId ? detail.error || '' : ''
  return decorate(<ArenaDocument key={`${contest.id}:${driverId}:${selectedId}:${language}`} contest={contest} driverId={driverId} problemId={selectedId} language={language} problem={problem} problemError={problemError} onRetryProblem={retryProblem} onLanguage={selectLanguage} referenceAllowed={monitoring.authorized && monitoring.ready && !editingLocked && !clock.ended} sessionId={monitoring.session?.id || ''} editingLocked={editingLocked} canAct={clock.canSubmit && !!problem && problem.allowedLanguages.includes(language) && monitoring.authorized && monitoring.ready && !monitoring.locked} onBusyChange={setBusy} onProgress={refreshProgress} header={header} sidebar={sidebar} notice={notice} mockControlsUi={mockControlsUi} />)
}
function ArenaStatusBar({ simulation, controls }: { simulation: boolean; controls: ReactNode }) {
  return <footer className="arena-status-bar"><Link to="/lobby"><ArrowLeft size={11} />Lobby</Link><span><span className="arena-status-led" />{simulation ? 'Simulation workspace · No code is executed' : 'Connected to judging service'}</span><span className="arena-keyboard-hints">Ctrl/Cmd + Enter <b>Run</b><i />Ctrl/Cmd + Shift + Enter <b>Submit</b></span>{controls}</footer>
}
interface DocumentProps {
  referenceAllowed:boolean; sessionId: string; editingLocked: boolean; contest: ContestState; driverId: string; problemId: string; language: LanguageId; problem: Problem | null; problemError: string
  onRetryProblem: () => void; onLanguage: (language: LanguageId) => void; canAct: boolean
  onBusyChange: (busy: boolean) => void; onProgress: (signal?: AbortSignal) => Promise<void>
  header: ReactNode; sidebar: ReactNode; notice: ReactNode; mockControlsUi: ReactNode
}
function ArenaDocument({ referenceAllowed, sessionId, editingLocked, contest, driverId, problemId, language, problem, problemError, onRetryProblem, onLanguage, canAct, onBusyChange, onProgress, header, sidebar, notice, mockControlsUi }: DocumentProps) {
  const draft = useDraft({ contestId: contest.id, driverId, problemId, language }, starterCode[language])
  const [customInput, setCustomInput] = useState('')
  const [inputMode, setInputMode] = useState<'samples' | 'custom'>('samples')
  const [tab, setTab] = useState<ResultsTab>('samples')
  const [mobileView, setMobileView] = useState<'statement' | 'code' | 'results'>('code')
  const request = useMemo<CodeExecutionRequest>(() => ({ sessionId, contestId: contest.id, driverId, problemId, language, sourceCode: draft.code, ...(inputMode === 'custom' ? { customInput } : {}) }), [sessionId, contest.id, driverId, problemId, language, draft.code, inputMode, customInput])
  const execution = useArenaExecution({ request, allowed: canAct, onBusyChange, onProgress })
  const { run: executeRun, submit: executeSubmit } = execution
  const saveDraft = draft.save
  const run = useCallback(() => { setTab('output'); if (window.innerWidth <= 1000) setMobileView('results'); void executeRun() }, [executeRun])
  const submit = useCallback(() => { setTab('submissions'); if (window.innerWidth <= 1000) setMobileView('results'); void executeSubmit() }, [executeSubmit])
  const save = useCallback(() => saveDraft(), [saveDraft])
  const result = execution.lastAction === 'submit' ? execution.submission?.execution || null : execution.runResult
  function changeTab(next: ResultsTab) { setTab(next); if (next === 'samples' || next === 'custom') setInputMode(next) }
  const penaltyChanged=useCallback(()=>{void onProgress()},[onProgress])
  const mobileNavigation = <div className="arena-mobile-navigation" aria-label="Workspace panels">{(['statement','code','results'] as const).map(view => <button key={view} aria-pressed={mobileView === view} onClick={() => setMobileView(view)}>{view === 'statement' ? 'Problem' : view === 'code' ? 'Code editor' : 'Results'}</button>)}</div>
  return <ArenaWorkspace topBar={header} problemNavigation={sidebar} problemStatement={<><ProblemStatement problem={problem} error={problemError} onRetry={onRetryProblem} />{problem&&<RaceAssist key={problemId} problemId={problemId} sessionId={sessionId} allowed={canAct} onPenalty={penaltyChanged}/>}</>} editor={<CodeEditor allowedLanguages={problem?.allowedLanguages || []} readOnly={editingLocked} language={language} code={draft.code} onChange={draft.update} onLanguage={onLanguage} saveStatus={draft.status} onSave={save} busy={!!execution.operation} onRun={run} onSubmit={submit} />} editorActions={<><SyntaxGuide language={language} allowed={referenceAllowed}/><button className="arena-input-selector" onClick={() => { setTab(inputMode === 'custom' ? 'custom' : 'samples'); setMobileView('results') }}><FlaskConical size={12} /><span>{inputMode === 'custom' ? 'Custom input' : 'Public samples'}</span></button><span className="arena-action-spacer" /><button className="arena-run-button" onClick={run} disabled={!canAct || !!execution.operation} title="Run Code (Ctrl/Cmd+Enter)">{execution.operation === 'run' ? <LoaderCircle size={14} className="spin" /> : <Play size={13} />}Run Code</button><button className="arena-submit-button" onClick={submit} disabled={!canAct || !!execution.operation} title="Submit Code (Ctrl/Cmd+Shift+Enter)">{execution.operation === 'submit' ? <LoaderCircle size={14} className="spin" /> : <Send size={13} />}Submit Code</button></>} results={<ResultsPanel problem={problem} tab={tab} onTab={changeTab} customInput={customInput} onCustomInput={setCustomInput} execution={result} submission={execution.submission} history={execution.history} operation={execution.operation} submitting={execution.submitting} error={execution.error} lastAction={execution.lastAction} onRun={run} onCheckResult={execution.checkResult} canRun={canAct} simulation={contest.simulation} />} notice={notice} mobileNavigation={mobileNavigation} mobileView={mobileView} statusBar={<ArenaStatusBar simulation={contest.simulation} controls={mockControlsUi} />} />
}

