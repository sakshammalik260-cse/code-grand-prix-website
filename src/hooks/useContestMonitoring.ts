import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { MonitoringClient } from '../services/monitoring/client'
import { cameraStore } from '../services/cameraStore'
import { canReportIncident, sessionAllowsExecution } from '../services/monitoring/sessionRules'
import type { ParticipantScope } from '../types/monitoring'

export function useContestMonitoring(scope: ParticipantScope & { enabled: boolean; problemId: string }) {
  const [client] = useState(() => new MonitoringClient(scope))
  const state = useSyncExternalStore(client.subscribe,client.getSnapshot)
  const [visible,setVisible] = useState(document.visibilityState === 'visible')
  const camera = useSyncExternalStore(cameraStore.subscribe,cameraStore.getSnapshot)
  useEffect(() => { client.start(); return () => client.stop() },[client])
  useEffect(() => { client.setProblem(scope.problemId) },[client,scope.problemId])
  useEffect(() => {
    if (!scope.enabled) return
    let armed = false
    let hidden = document.visibilityState === 'hidden'
    let lostFocus = false
    let leaving = false
    let tabTimer: ReturnType<typeof setTimeout> | undefined
    let fullscreen = !!document.fullscreenElement
    let cameraRevision = cameraStore.getSnapshot().interruptionRevision
    let focusTimer: ReturnType<typeof setTimeout> | undefined
    const inArena = () => !leaving && window.location.pathname.toLowerCase().replace(/\/+$/, '') === '/arena'
    const arm = () => {
      const snapshot = client.getSnapshot()
      if (!inArena() || !canReportIncident(snapshot)) {
        armed = false; client.setMonitoringArmed(false)
        clearTimeout(tabTimer); tabTimer = undefined; clearTimeout(focusTimer)
        return
      }
      // Re-baseline only after confirmed approval, queue synchronization and explicit setup recovery.
      if (!armed && !snapshot.pending.length && document.visibilityState === 'visible' && cameraStore.getSnapshot().status === 'ACTIVE' && document.fullscreenElement) {
        hidden = false; lostFocus = false; fullscreen = true
        cameraRevision = cameraStore.getSnapshot().interruptionRevision
        armed = true; client.setMonitoringArmed(true)
      }
    }
    arm()
    const checkCamera = () => {
      const current = cameraStore.getSnapshot()
      if (current.interruptionRevision > cameraRevision) {
        cameraRevision = current.interruptionRevision
        if (armed && inArena() && !client.permissionSuppressed()) client.report('CAMERA_INTERRUPTED')
      }
      arm()
    }
    const visibility = () => {
      const nowHidden = document.visibilityState === 'hidden'
      if (nowHidden && !hidden) {
        clearTimeout(focusTimer)
        if (armed && inArena() && !client.permissionSuppressed() && !tabTimer) tabTimer = setTimeout(() => { tabTimer = undefined; if (armed && inArena() && !client.permissionSuppressed()) client.report('TAB_HIDDEN') },100)
      }
      hidden = nowHidden
      setVisible(!nowHidden)
      if (!hidden) { lostFocus = false; arm(); void client.refresh() }
    }
    const blur = () => {
      clearTimeout(focusTimer)
      focusTimer = setTimeout(() => {
        if (armed && inArena() && !hidden && document.visibilityState !== 'hidden' && !lostFocus && !client.permissionSuppressed()) { lostFocus = true; client.report('WINDOW_FOCUS_LOST') }
      },500)
    }
    const focus = () => { clearTimeout(focusTimer); lostFocus = false; arm() }
    const fullscreenChange = () => {
      const active = !!document.fullscreenElement
      if (fullscreen && !active && armed && inArena() && !client.permissionSuppressed()) client.report('FULLSCREEN_EXIT')
      fullscreen = active; arm()
    }
    const pageLeaving = () => { leaving = true; clearTimeout(tabTimer); clearTimeout(focusTimer) }
    const pageRestored = () => { leaving = false; hidden = document.visibilityState === 'hidden'; fullscreen = !!document.fullscreenElement; cameraRevision = cameraStore.getSnapshot().interruptionRevision; lostFocus = false; armed = false; arm(); void client.refresh() }
    window.addEventListener('pageshow',pageRestored)
    window.addEventListener('beforeunload',pageLeaving); window.addEventListener('pagehide',pageLeaving)
    const unsubscribeCamera = cameraStore.subscribe(checkCamera)
    const unsubscribeSession = client.subscribe(arm)
    document.addEventListener('visibilitychange',visibility)
    document.addEventListener('fullscreenchange',fullscreenChange)
    window.addEventListener('blur',blur); window.addEventListener('focus',focus)
    const online = () => { void client.refresh() }
    window.addEventListener('online',online); window.addEventListener('offline',online)
    return () => {
      client.setMonitoringArmed(false)
      clearTimeout(tabTimer); clearTimeout(focusTimer); window.removeEventListener('pageshow',pageRestored); window.removeEventListener('beforeunload',pageLeaving); window.removeEventListener('pagehide',pageLeaving); unsubscribeCamera(); unsubscribeSession()
      document.removeEventListener('visibilitychange',visibility); document.removeEventListener('fullscreenchange',fullscreenChange)
      window.removeEventListener('blur',blur); window.removeEventListener('focus',focus); window.removeEventListener('online',online); window.removeEventListener('offline',online)
    }
  },[client,scope.enabled])
  const pendingLock = state.pending.some(item => item.type !== 'WINDOW_FOCUS_LOST')
  const locked = pendingLock || !!state.session && ['LOCK_PENDING','LOCKED','UNDER_REVIEW'].includes(state.session.status)
  const ready = visible && camera.status === 'ACTIVE' && !!document.fullscreenElement
  const authorized = state.connection === 'CONNECTED' && state.pending.length === 0 && sessionAllowsExecution(state.session)
  return { ...state, client, camera, locked, ready, authorized,
    recoverCamera: useCallback(() => client.permissionAction(cameraStore.request),[client]),
  }
}
