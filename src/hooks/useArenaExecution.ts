import { useCallback, useEffect, useRef, useState } from 'react'
import { arenaServices } from '../services/arena'
import { delay, errorMessage, isAbort } from '../services/async'
import type { CodeExecutionRequest, CodeExecutionResult, SubmissionRequest, SubmissionResult } from '../types/arena'

interface Options { request: CodeExecutionRequest; allowed: boolean; simulation: boolean; onBusyChange: (value: boolean) => void; onProgress: (signal?: AbortSignal) => Promise<void> }
const submissionStatuses=new Set(['QUEUED','RUNNING','ACCEPTED','WRONG_ANSWER','COMPILATION_ERROR','RUNTIME_ERROR','TIME_LIMIT_EXCEEDED','MEMORY_LIMIT_EXCEEDED'])
const languageIds=new Set(['python','java','cpp','javascript'])
function readHistory(key:string,scope:CodeExecutionRequest,simulation:boolean):SubmissionResult[]{try{const value:unknown=JSON.parse(sessionStorage.getItem(key)||'[]');if(!Array.isArray(value))return[];return value.filter((item):item is SubmissionResult=>{if(!item||typeof item!=='object')return false;const record=item as SubmissionResult;return typeof record.id==='string'&&record.contestId===scope.contestId&&record.driverId===scope.driverId&&record.problemId===scope.problemId&&record.language===scope.language&&languageIds.has(record.language)&&submissionStatuses.has(record.status)&&typeof record.submittedAt==='string'&&Number.isFinite(Date.parse(record.submittedAt))&&record.simulation===simulation&&!simulation&&['QUEUED','RUNNING'].includes(record.status)}).map(item=>({id:item.id,contestId:item.contestId,driverId:item.driverId,problemId:item.problemId,language:item.language,status:item.status,submittedAt:item.submittedAt,simulation:item.simulation})).slice(0,20)}catch{return[]}}
export function useArenaExecution({ request, allowed, simulation, onBusyChange, onProgress }: Options) {
  const historyKey=`cgp-arena-submissions-v1:${request.contestId}:${request.driverId}:${request.problemId}:${request.language}`
  const [operation, setOperation] = useState<'run' | 'submit' | null>(null)
  const [lastAction, setLastAction] = useState<'run' | 'submit' | null>(null)
  const [runResult, setRunResult] = useState<CodeExecutionResult | null>(null)
  const [submission, setSubmission] = useState<SubmissionResult | null>(()=>readHistory(historyKey,request,simulation)[0]||null)
  const [submitting, setSubmitting] = useState(false)
  const [history, setHistory] = useState<SubmissionResult[]>(()=>readHistory(historyKey,request,simulation))
  const [error, setError] = useState('')
  const controller = useRef<AbortController | null>(null)
  const locked = useRef(false)
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; controller.current?.abort(); onBusyChange(false) }
  }, [onBusyChange])
  const remember = useCallback((value: SubmissionResult) => {
    setSubmission(value)
    setHistory(previous => {const next=[value, ...previous.filter(item => item.id !== value.id)].slice(0,20);try{sessionStorage.setItem(historyKey,JSON.stringify(next))}catch{/* Keep history in memory when storage is unavailable. */}return next})
  }, [historyKey])
  const poll = useCallback(async (initial: SubmissionResult, signal: AbortSignal) => {
    let value = initial
    for (let attempt = 0; (value.status === 'QUEUED' || value.status === 'RUNNING') && attempt < 80; attempt++) {
      await delay(450, signal)
      value = await arenaServices.getSubmission(value.id, signal)
      if (!signal.aborted) remember(value)
    }
    if (value.status === 'QUEUED' || value.status === 'RUNNING') throw new Error('Your submission is queued, but the result is delayed. Use “Check result” to retrieve it without submitting again.')
    await onProgress(signal)
  }, [remember, onProgress])
  const execute = useCallback(async (kind: 'run' | 'submit', existing?: SubmissionResult) => {
    if (locked.current) return
    if (!existing && !request.sourceCode.trim()) { setError('Your editor is empty. Add source code before running or submitting.'); return }
    if (!existing && !allowed) { setError('The race is not accepting requests. Your draft remains available for editing.'); return }
    locked.current = true
    const nextController = new AbortController()
    controller.current = nextController
    const signal = nextController.signal
    setOperation(kind); setLastAction(kind); setError(''); onBusyChange(true)
    try {
      if (kind === 'run') {
        setRunResult(null)
        const result = await arenaServices.runCode({ ...request }, signal)
        if (!signal.aborted) setRunResult(result)
      } else {
        let value = existing
        if (!value) {
          setSubmission(null); setSubmitting(true)
          const payload: SubmissionRequest = { sessionId: request.sessionId, contestId: request.contestId, driverId: request.driverId, problemId: request.problemId, language: request.language, sourceCode: request.sourceCode }
          value = await arenaServices.submitCode(payload, signal)
          if (signal.aborted) return
          setSubmitting(false); remember(value)
          await onProgress(signal)
        }
        await poll(value, signal)
      }
    } catch (reason) {
      if (!signal.aborted && !isAbort(reason)) setError(errorMessage(reason))
    } finally {
      locked.current = false
      if (mounted.current) { setOperation(null); setSubmitting(false); onBusyChange(false) }
    }
  }, [request, allowed, onBusyChange, onProgress, remember, poll])
  return { operation, lastAction, runResult, submission, submitting, history, error,
    run: useCallback(() => execute('run'), [execute]),
    submit: useCallback(() => execute('submit'), [execute]),
    checkResult: useCallback(() => { if (submission) void execute('submit', submission) }, [execute, submission]),
  }
}
