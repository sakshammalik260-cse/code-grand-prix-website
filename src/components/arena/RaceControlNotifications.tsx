import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Radio, X, XCircle } from 'lucide-react'
import { statusLabels } from '../../data/arenaUi'
import type { CodeExecutionResult, SubmissionResult } from '../../types/arena'

type ToastTone = 'info' | 'success' | 'error'
interface Toast { id: string; tone: ToastTone; title: string; message: string }
interface Props {
  operation: 'run' | 'submit' | null
  runResult: CodeExecutionResult | null
  submission: SubmissionResult | null
  error: string
}

export function RaceControlNotifications({ operation, runResult, submission, error }: Props) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const seen = useRef(new Set<string>())
  const timers = useRef(new Map<string, number>())
  const operationSequence = useRef(0)
  const previousOperation = useRef<Props['operation']>(null)

  const dismiss = useCallback((id: string) => {
    setToasts(current => current.filter(toast => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) window.clearTimeout(timer)
    timers.current.delete(id)
  }, [])

  const push = useCallback((id: string, tone: ToastTone, title: string, message: string) => {
    if (seen.current.has(id)) return
    seen.current.add(id)
    setToasts(current => [...current.slice(-2), { id, tone, title, message }])
    timers.current.set(id, window.setTimeout(() => dismiss(id), 4600))
  }, [dismiss])

  useEffect(() => () => { timers.current.forEach(timer => window.clearTimeout(timer)) }, [])

  useEffect(() => {
    if (operation && previousOperation.current !== operation) {
      operationSequence.current += 1
      push(`operation:${operationSequence.current}:${operation}`, 'info', operation === 'run' ? 'TEST RUN STARTED' : 'SUBMISSION SENT', operation === 'run' ? 'Public execution request is in progress.' : 'Your source snapshot was sent to the judging service.')
    }
    previousOperation.current = operation
  }, [operation, push])

  useEffect(() => {
    if (!runResult) return
    const passed = runResult.cases.filter(item => item.status === 'ACCEPTED').length
    push(`run:${runResult.id}:${runResult.status}`, runResult.status === 'ACCEPTED' ? 'success' : 'error', runResult.status === 'ACCEPTED' ? 'PUBLIC TESTS PASSED' : statusLabels[runResult.status].toUpperCase(), `${passed}/${runResult.cases.length} cases · ${runResult.executionTimeMs} ms`)
  }, [runResult, push])

  useEffect(() => {
    if (!submission) return
    if (submission.status === 'QUEUED' || submission.status === 'RUNNING') {
      push(`submission:${submission.id}:${submission.status}`, 'info', submission.status === 'QUEUED' ? 'SUBMISSION RECEIVED' : 'JUDGING IN PROGRESS', `Submission #${submission.id.slice(-7)} is ${submission.status.toLowerCase()}.`)
      return
    }
    push(`submission:${submission.id}:${submission.status}`, submission.status === 'ACCEPTED' ? 'success' : 'error', statusLabels[submission.status].toUpperCase(), submission.status === 'ACCEPTED' ? 'Official judged result received.' : 'Review the execution console before your next attempt.')
  }, [submission, push])

  useEffect(() => {
    if (error) push(`error:${error}`, 'error', 'RACE CONTROL', error)
  }, [error, push])

  if (!toasts.length) return null
  return <aside className="race-control-toasts" aria-label="Race control notifications" aria-live="polite">
    {toasts.map(toast => <article key={toast.id} className={`race-control-toast toast-${toast.tone}`}>
      <span className="race-control-toast-icon">{toast.tone === 'success' ? <CheckCircle2 size={16} /> : toast.tone === 'error' ? <XCircle size={16} /> : <Radio size={16} />}</span>
      <div><span>{toast.tone === 'error' ? <AlertTriangle size={10} /> : null} RACE CONTROL</span><strong>{toast.title}</strong><p>{toast.message}</p></div>
      <button onClick={() => dismiss(toast.id)} aria-label={`Dismiss ${toast.title} notification`}><X size={14} /></button>
    </article>)}
  </aside>
}
