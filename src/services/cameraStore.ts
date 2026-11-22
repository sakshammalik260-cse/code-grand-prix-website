import type { CameraStatus } from '../types/monitoring'
interface CameraSnapshot { stream: MediaStream | null; status: CameraStatus; pending: boolean; error: string; interruptionRevision: number; reason: string }
let snapshot: CameraSnapshot = { stream: null, status: 'PERMISSION_REQUIRED', pending: false, error: '', interruptionRevision: 0, reason: '' }
const listeners = new Set<() => void>()
let generation = 0
let pending: Promise<boolean> | null = null
let cleanups: (() => void)[] = []
function publish(next: Partial<CameraSnapshot>) { snapshot = { ...snapshot, ...next }; listeners.forEach(listener => listener()) }
function cleanup() { cleanups.forEach(fn => fn()); cleanups = [] }
function interrupt(status: CameraStatus, reason: string, stream: MediaStream) {
  if (snapshot.stream !== stream || snapshot.status !== 'ACTIVE') return
  cleanup(); stream.getTracks().forEach(track => track.stop())
  publish({ stream: null, status, reason, error: reason, interruptionRevision: snapshot.interruptionRevision + 1 })
}
export const cameraStore = {
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } },
  getSnapshot: () => snapshot,
  release() {
    generation++; pending = null; cleanup()
    snapshot.stream?.getTracks().forEach(track => track.stop())
    publish({ stream: null, status: 'PERMISSION_REQUIRED', pending: false, error: '', reason: '' })
  },
  request(): Promise<boolean> {
    if (snapshot.stream?.active && snapshot.status === 'ACTIVE') return Promise.resolve(true)
    if (pending) return pending
    const attempt = ++generation
    publish({ pending: true, error: '' })
    pending = Promise.resolve().then(async () => {
      try {
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('Camera access needs HTTPS or localhost and a supported browser.')
        let stream: MediaStream
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        }
        if (attempt !== generation) { stream.getTracks().forEach(track => track.stop()); return false }
        if (!stream.active || !stream.getVideoTracks().length) { stream.getTracks().forEach(track => track.stop()); throw new Error('No active camera video track was returned. Reconnect the camera and retry.') }
        cleanup(); snapshot.stream?.getTracks().forEach(track => track.stop())
        publish({ stream, status: 'ACTIVE', error: '', reason: '' })
        for (const track of stream.getVideoTracks()) {
          const ended = () => interrupt('INTERRUPTED', 'Camera disconnected or stopped. Restore camera access.', stream)
          let muteTimer: ReturnType<typeof setTimeout> | undefined
          const muted = () => { muteTimer = setTimeout(() => { if (track.muted) interrupt('INTERRUPTED', 'Camera stream was interrupted. Restore camera access.', stream) }, 1500) }
          const unmuted = () => { if (muteTimer) clearTimeout(muteTimer) }
          track.addEventListener('ended', ended); track.addEventListener('mute', muted); track.addEventListener('unmute', unmuted)
          cleanups.push(() => { unmuted(); track.removeEventListener('ended', ended); track.removeEventListener('mute', muted); track.removeEventListener('unmute', unmuted) })
        }
        const healthCheck = setInterval(() => { if (!stream.active || stream.getVideoTracks().some(track => track.readyState === 'ended')) interrupt('INTERRUPTED', 'Camera video track is no longer active. Restore access.', stream) },1000)
        cleanups.push(() => clearInterval(healthCheck))
        const inactive = () => interrupt('INTERRUPTED', 'The camera stream became unavailable.', stream)
        stream.addEventListener('inactive', inactive); cleanups.push(() => stream.removeEventListener('inactive', inactive))
        if (navigator.permissions?.query) {
          void navigator.permissions.query({ name: 'camera' as PermissionName }).then(permission => {
            if (attempt !== generation || snapshot.stream !== stream) return
            const changed = () => { if (permission.state === 'denied') interrupt('PERMISSION_REQUIRED', 'Camera permission was revoked. Allow access in browser site settings, then retry.', stream) }
            permission.addEventListener('change', changed); cleanups.push(() => permission.removeEventListener('change', changed))
          }).catch(() => { /* Permission observation is not available in every browser. */ })
        }
        return true
      } catch (error) {
        if (attempt !== generation) return false
        cleanup(); snapshot.stream?.getTracks().forEach(track => track.stop())
        const name = error instanceof DOMException ? error.name : ''
        const message = name === 'NotAllowedError' ? 'Camera permission was denied or blocked. Allow camera access in your browser settings (click the lock/permissions icon in your address bar), then retry.' : name === 'NotFoundError' ? 'No camera found. Connect a camera and retry.' : name === 'NotReadableError' ? 'Camera may be in use by another app. Close it there and retry.' : error instanceof Error ? error.message : 'Unable to start the camera.'
        publish({ stream: null, status: name === 'NotAllowedError' ? 'PERMISSION_REQUIRED' : 'UNAVAILABLE', error: message })
        return false
      } finally { if (attempt === generation) { pending = null; publish({ pending: false }) } }
    })
    return pending
  },
}
if (import.meta.hot) import.meta.hot.dispose(() => cameraStore.release())
