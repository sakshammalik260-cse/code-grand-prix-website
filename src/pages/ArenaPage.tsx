import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CircleHelp, FileCode2, FlaskConical, LoaderCircle, Play, Send, ShieldCheck } from 'lucide-react'
import { ArenaWorkspace } from '../components/ArenaWorkspace'
import { ArenaHeader } from '../components/arena/ArenaHeader'
import { ProblemNavigation } from '../components/arena/ProblemNavigation'
import { ProblemStatement } from '../components/arena/ProblemStatement'
import { CodeEditor } from '../components/arena/CodeEditor'
import { ResultsPanel } from '../components/arena/ResultsPanel'
import type { ResultsTab } from '../components/arena/ResultsPanel'
import { MockArenaControls } from '../components/arena/MockArenaControls'
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
import type { CodeExecutionRequest, ContestPhase, ContestState, LanguageId, Problem } from '../types/arena'
import type { ReactNode } from 'react'

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
  const selectedId = params.get('problem') || 'p2'
  const language = isLanguageId(params.get('lang')) ? params.get('lang') as LanguageId : 'cpp'
  const summary = initial.problems.find(problem => problem.id === selectedId)
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
      const next = await arenaServices.getContest(controller.signal)
      if (alive.current && !controller.signal.aborted) { setContest(next); setNoticeError('') }
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
  const header = <ArenaHeader contest={{ ...contest, status: clock.effectivePhase }} fullscreen={fullscreen.active} onFullscreen={() => { void fullscreen.activate() }} onRefresh={() => { void refreshContest() }} refreshing={refreshing} />
  const sidebar = <ProblemNavigation problems={initial.problems} selected={selectedId} progress={progress} busy={busy} onSelect={selectProblem} />
  const phaseText = clock.effectivePhase === 'WAITING' ? 'The race has not started. You can prepare your draft; Run and Submit unlock when race control starts the contest.' : clock.effectivePhase === 'PAUSED_BY_ORGANIZER' ? 'Paused by organizer. Your draft remains editable; Run and Submit are unavailable until the race resumes.' : clock.ended ? 'The chequered flag is out. Submissions are closed; your local drafts remain available.' : !clock.canSubmit ? 'Race timing is unavailable. Refresh race status before submitting.' : ''
  const notice = <>{phaseText && <div className={'arena-state-notice state-' + clock.effectivePhase.toLowerCase()} role="status"><CircleHelp size={14} /><span>{phaseText}</span></div>}{(noticeError || fullscreen.error) && <div className="arena-state-notice state-error" role="alert"><AlertCircle size={14} /><span>{noticeError || fullscreen.error}</span><button onClick={() => { if (noticeError) void refreshContest().then(() => refreshProgress()); else void fullscreen.activate() }}>Retry</button></div>}</>
  const mockControlsUi = isArenaMockMode ? <MockArenaControls busy={busy} onPhase={changeMockPhase} onExpiry={() => setContest(mockControls.finishInFiveSeconds())} /> : null
  if (!summary) return <ArenaWorkspace topBar={header} problemNavigation={sidebar} problemStatement={<div className="arena-inline-error"><AlertCircle size={28} /><h2>Problem not found</h2><p>{initial.problems.length ? 'Choose a valid problem from the left sidebar.' : 'No problems have been released for this contest.'}</p>{initial.problems[0] && <button className="arena-quiet-button" onClick={() => selectProblem(initial.problems[0].id)}>Open first problem</button>}</div>} editor={<div className="arena-pane-loading"><FileCode2 size={27} /><p>Select a problem to restore its draft.</p></div>} editorActions={null} results={null} notice={notice} statusBar={<ArenaStatusBar simulation={contest.simulation} controls={mockControlsUi} />} />
  const problem = detail?.id === selectedId ? detail.problem || null : null
  const problemError = detail?.id === selectedId ? detail.error || '' : ''
  return <ArenaDocument key={`${contest.id}:${driverId}:${selectedId}:${language}`} contest={contest} driverId={driverId} problemId={selectedId} language={language} problem={problem} problemError={problemError} onRetryProblem={retryProblem} onLanguage={selectLanguage} canAct={clock.canSubmit && !!problem} onBusyChange={setBusy} onProgress={refreshProgress} header={header} sidebar={sidebar} notice={notice} mockControlsUi={mockControlsUi} />
}
function ArenaStatusBar({ simulation, controls }: { simulation: boolean; controls: ReactNode }) {
  return <footer className="arena-status-bar"><Link to="/lobby"><ArrowLeft size={11} />Lobby</Link><span><span className="arena-status-led" />{simulation ? 'Simulation workspace · No code is executed' : 'Connected to judging service'}</span><span className="arena-keyboard-hints">Ctrl/Cmd + Enter <b>Run</b><i />Ctrl/Cmd + Shift + Enter <b>Submit</b></span>{controls}</footer>
}
interface DocumentProps {
  contest: ContestState; driverId: string; problemId: string; language: LanguageId; problem: Problem | null; problemError: string
  onRetryProblem: () => void; onLanguage: (language: LanguageId) => void; canAct: boolean
  onBusyChange: (busy: boolean) => void; onProgress: (signal?: AbortSignal) => Promise<void>
  header: ReactNode; sidebar: ReactNode; notice: ReactNode; mockControlsUi: ReactNode
}
function ArenaDocument({ contest, driverId, problemId, language, problem, problemError, onRetryProblem, onLanguage, canAct, onBusyChange, onProgress, header, sidebar, notice, mockControlsUi }: DocumentProps) {
  const draft = useDraft({ contestId: contest.id, driverId, problemId, language }, starterCode[language])
  const [customInput, setCustomInput] = useState('')
  const [inputMode, setInputMode] = useState<'samples' | 'custom'>('samples')
  const [tab, setTab] = useState<ResultsTab>('samples')
  const [mobileView, setMobileView] = useState<'statement' | 'code' | 'results'>('code')
  const request = useMemo<CodeExecutionRequest>(() => ({ contestId: contest.id, driverId, problemId, language, sourceCode: draft.code, ...(inputMode === 'custom' ? { customInput } : {}) }), [contest.id, driverId, problemId, language, draft.code, inputMode, customInput])
  const execution = useArenaExecution({ request, allowed: canAct, onBusyChange, onProgress })
  const { run: executeRun, submit: executeSubmit } = execution
  const saveDraft = draft.save
  const run = useCallback(() => { setTab('output'); if (window.innerWidth <= 1000) setMobileView('results'); void executeRun() }, [executeRun])
  const submit = useCallback(() => { setTab('submissions'); if (window.innerWidth <= 1000) setMobileView('results'); void executeSubmit() }, [executeSubmit])
  const save = useCallback(() => saveDraft(), [saveDraft])
  const result = execution.lastAction === 'submit' ? execution.submission?.execution || null : execution.runResult
  function changeTab(next: ResultsTab) { setTab(next); if (next === 'samples' || next === 'custom') setInputMode(next) }
  const mobileNavigation = <div className="arena-mobile-navigation" aria-label="Workspace panels">{(['statement','code','results'] as const).map(view => <button key={view} aria-pressed={mobileView === view} onClick={() => setMobileView(view)}>{view === 'statement' ? 'Problem' : view === 'code' ? 'Code editor' : 'Results'}</button>)}</div>
  return <ArenaWorkspace topBar={header} problemNavigation={sidebar} problemStatement={<ProblemStatement problem={problem} error={problemError} onRetry={onRetryProblem} />} editor={<CodeEditor language={language} code={draft.code} onChange={draft.update} onLanguage={onLanguage} saveStatus={draft.status} onSave={save} busy={!!execution.operation} onRun={run} onSubmit={submit} />} editorActions={<><button className="arena-input-selector" onClick={() => { setTab(inputMode === 'custom' ? 'custom' : 'samples'); setMobileView('results') }}><FlaskConical size={12} /><span>{inputMode === 'custom' ? 'Custom input' : 'Public samples'}</span></button><span className="arena-action-spacer" /><button className="arena-run-button" onClick={run} disabled={!canAct || !!execution.operation} title="Run Code (Ctrl/Cmd+Enter)">{execution.operation === 'run' ? <LoaderCircle size={14} className="spin" /> : <Play size={13} />}Run Code</button><button className="arena-submit-button" onClick={submit} disabled={!canAct || !!execution.operation} title="Submit Code (Ctrl/Cmd+Shift+Enter)">{execution.operation === 'submit' ? <LoaderCircle size={14} className="spin" /> : <Send size={13} />}Submit Code</button></>} results={<ResultsPanel problem={problem} tab={tab} onTab={changeTab} customInput={customInput} onCustomInput={setCustomInput} execution={result} submission={execution.submission} history={execution.history} operation={execution.operation} submitting={execution.submitting} error={execution.error} lastAction={execution.lastAction} onRun={run} onCheckResult={execution.checkResult} canRun={canAct} simulation={contest.simulation} />} notice={notice} mobileNavigation={mobileNavigation} mobileView={mobileView} statusBar={<ArenaStatusBar simulation={contest.simulation} controls={mockControlsUi} />} />
}

