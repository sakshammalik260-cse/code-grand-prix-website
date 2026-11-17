import { useEffect, useRef, useState } from 'react'

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const streamRef = useRef<MediaStream | null>(null)
  const generation = useRef(0)
  useEffect(() => () => {
    generation.current += 1
    streamRef.current?.getTracks().forEach(track => track.stop())
  }, [])
  async function request() {
    const attempt = ++generation.current
    setPending(true)
    setError('')
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('Camera access requires HTTPS or localhost and a supported browser.')
      const next = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      if (attempt !== generation.current) { next.getTracks().forEach(track => track.stop()); return }
      streamRef.current?.getTracks().forEach(track => track.stop())
      streamRef.current = next
      next.getVideoTracks().forEach(track => track.addEventListener('ended', () => {
        if (streamRef.current === next) { setStream(null); setError('Camera disconnected. Reconnect your camera and try again.') }
      }))
      setStream(next)
    } catch (err) {
      if (attempt !== generation.current) return
      const name = err instanceof DOMException ? err.name : ''
      setError(name === 'NotAllowedError' ? 'Camera permission was denied. Allow camera access in your browser’s site settings, then try again.'
        : name === 'NotFoundError' ? 'No camera found. Connect a camera, then try again.'
        : name === 'NotReadableError' ? 'Your camera may be in use by another app. Close it there, then try again.'
        : err instanceof Error ? err.message : 'Could not start the camera. Please try again.')
    } finally { if (attempt === generation.current) setPending(false) }
  }
  return { stream, pending, error, request }
}
