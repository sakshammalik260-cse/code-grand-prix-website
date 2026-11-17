import { useCallback, useEffect, useRef, useState } from 'react'
import { draftKey, readDraft, writeDraft } from '../services/draftStore'
import type { DraftScope } from '../services/draftStore'
export type DraftSaveStatus = 'starter' | 'saved' | 'pending' | 'error'

/** Mount the editor with its scope key so every problem/language has independent state and undo history. */
export function useDraft(scope: DraftScope, starter: string) {
  const key = draftKey(scope)
  const [initial] = useState(() => readDraft(key, starter))
  const [code, setCode] = useState(initial.sourceCode)
  const [status, setStatus] = useState<DraftSaveStatus>(initial.error ? 'error' : initial.persisted ? 'saved' : 'starter')
  const latest = useRef(initial.sourceCode)
  const dirty = useRef(initial.needsWrite)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mounted = useRef(false)
  const save = useCallback((announce = true) => {
    if (timer.current) clearTimeout(timer.current)
    if (!dirty.current) return
    const success = writeDraft(key, latest.current)
    dirty.current = !success
    if (announce && mounted.current) setStatus(success ? 'saved' : 'error')
  }, [key])
  useEffect(() => {
    mounted.current = true
    const onHide = () => save(false)
    const onVisibility = () => { if (document.visibilityState === 'hidden') save(false) }
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      mounted.current = false
      if (timer.current) clearTimeout(timer.current)
      save(false)
      window.removeEventListener('pagehide', onHide)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [save])
  const update = useCallback((value: string) => {
    latest.current = value
    dirty.current = true
    setCode(value)
    setStatus('pending')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => save(), 600)
  }, [save])
  return { code, update, save, status, storageKey: key }
}
