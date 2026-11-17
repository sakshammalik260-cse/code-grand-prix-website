import { useCallback, useEffect, useRef, useState } from 'react'
import { arenaServices } from '../services/arena'
import { delay, errorMessage, isAbort } from '../services/arena/mockState'
import type { CodeExecutionRequest, CodeExecutionResult, SubmissionRequest, SubmissionResult } from '../types/arena'

interface Options { request: CodeExecutionRequest; allowed: boolean; onBusyChange: (value: boolean) => void; onProgress: (signal?: AbortSignal) => Promise<void> }
export function useArenaExecution({ request, allowed, onBusyChange, onProgress }: Options) {
  const [operation, setOperation] = useState<'run' | 'submit' | null>(null)
  const [lastAction, setLastAction] = useState<'run' | 'submit' | null>(null)
  const [runResult, setRunResult] = useState<CodeExecutionResult | null>(null)
  const [submission, setSubmission] = useState<SubmissionResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [history, setHistory] = useState<SubmissionResult[]>([])
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
    setHistory(previous => [value, ...previous.filter(item => item.id !== value.id)].slice(0,20))
  }, [])
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
          const payload: SubmissionRequest = { contestId: request.contestId, driverId: request.driverId, problemId: request.problemId, language: request.language, sourceCode: request.sourceCode }
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
