import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Camera, CameraOff, Check, Circle, Expand, LoaderCircle, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react'
import { useCamera } from '../hooks/useCamera'
import { useSession } from '../hooks/useSession'
import { api } from '../services/api'
import { isDevelopmentMock } from '../services/mode'
export function CheckInPage() {
  const { driver, completeCheckIn } = useSession()
  const navigate = useNavigate()
  const camera = useCamera()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement))
  const [fullscreenError, setFullscreenError] = useState('')
  const [accepted, setAccepted] = useState(false)
  useEffect(() => {
    const video = videoRef.current
    if (video) video.srcObject = camera.stream
    return () => { if (video) video.srcObject = null }
  }, [camera.stream])
  useEffect(() => {
    if (!camera.stream && !camera.pending) {
      void camera.request()
    }
  }, [])
  useEffect(() => {
    const update = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', update)
    return () => document.removeEventListener('fullscreenchange', update)
  }, [])
  async function enterFullscreen() {
    setFullscreenError('')
    try {
      if (!document.documentElement.requestFullscreen) throw new Error('Fullscreen is unavailable in this browser. Use a supported desktop browser.')
      await document.documentElement.requestFullscreen()
    } catch (err) { setFullscreenError(err instanceof Error ? err.message : 'Fullscreen was not allowed. Please try again.') }
  }
  const checks = [{ title: 'Driver identity confirmed', done: !!driver }, { title: 'Camera preview connected', done: !!camera.stream?.active }, { title: 'Fullscreen activated', done: fullscreen }, { title: 'Rules acknowledged', done: accepted }]
  const ready = checks.every(check => check.done)
  const [starting, setStarting] = useState(false)
  async function start() {
    if (!ready || !driver || !document.fullscreenElement || !camera.stream?.active || starting) return
    setStarting(true)
    try {
      if (!isDevelopmentMock) {
        await api.post('/checkin', {
          rulesAccepted: true,
          cameraPermission: true,
          fullscreenRequested: true
        })
      }
    } catch (err) {
      console.warn('Check-in sync with backend:', err)
    } finally {
      setStarting(false)
    }
    completeCheckIn({ driverId: driver.id, completedAt: new Date().toISOString(), cameraVerified: true, rulesAccepted: true, fullscreenVerified: true })
    navigate('/lobby')
  }

  const inspectionSteps = [
    { title: 'Verify Identity', status: 'Identity Verified', done: !!driver },
    { title: 'Camera Access', status: 'Camera Active', done: !!camera.stream?.active },
    { title: 'Fullscreen Mode', status: 'Fullscreen Enabled', done: fullscreen },
    { title: 'Accept Rules', status: 'Rules Accepted', done: accepted },
    { title: 'System Check', status: 'System Ready', done: ready },
  ]
  const nextStep = inspectionSteps.findIndex(step => !step.done)
  return <section className="cinematic-page inspection-page">
    <div className="inspection-content container">
      <div className="dashboard-heading"><h1>PRE-RACE INSPECTION</h1><p>Verify your setup. Prepare for the grid.</p></div>
      <div className="inspection-layout">
        <aside className="inspection-sidebar" aria-label="Inspection checklist">
          <ol className="inspection-steps" aria-hidden="true">{inspectionSteps.map((step, index) => <li key={step.title} className={step.done ? 'complete' : index === nextStep ? 'current' : ''}><span className="inspection-step-marker">{step.done ? <Check size={17} strokeWidth={3} /> : <span>{index + 1}</span>}</span><span>{step.title}</span></li>)}</ol>
          <div className="inspection-identity"><UserRound size={18} /><div><strong>{driver?.name}</strong><span>{driver?.id}</span></div><ShieldCheck size={17} /></div>
          <p className="inspection-help">Need a hand? Ask a CPC Club volunteer.</p>
        </aside>
        <div className="inspection-camera-column">
          <div className={'camera-preview inspection-camera ' + (camera.stream ? 'connected' : '')}>
            <video ref={videoRef} autoPlay playsInline muted aria-label="Your local camera preview" />
            {!camera.stream && <div className="camera-placeholder"><CameraOff size={39} /><h2>Camera preview</h2><p>Enable your camera to complete inspection.<br />Keep your face clearly visible.</p></div>}
            <span className="camera-frame-corner camera-frame-tl" /><span className="camera-frame-corner camera-frame-br" />
            <span className={'camera-status-label ' + (camera.stream ? 'active' : '')}><span className="status-dot" />{camera.stream ? 'Camera Active' : 'Camera Offline'}</span>
          </div>
          <div className="inspection-device-controls">
            <button className="button button-secondary" onClick={() => { void camera.request() }} disabled={camera.pending || !!camera.stream}>{camera.pending ? <LoaderCircle className="spin" size={15} /> : <Camera size={15} />}{camera.pending ? 'Requesting access…' : camera.stream ? 'Camera connected' : 'Enable camera'}</button>
            <button className="button button-secondary" onClick={enterFullscreen} disabled={fullscreen}>{fullscreen ? <><Check size={15} /> Fullscreen active</> : <><Expand size={15} /> Activate fullscreen</>}</button>
          </div>
          {camera.error && <p className="alert alert-error inspection-error" role="alert">{camera.error}</p>}
          {fullscreenError && <p className="alert alert-error inspection-error" role="alert">{fullscreenError}</p>}
          <label className="checkbox-label inspection-acknowledgment"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} /><span>I have read and agree to follow the competition rules of Code Grand Prix. <a href="/#rules" target="_blank" rel="noreferrer" aria-label="Review guidelines (opens in a new tab)">Review guidelines</a></span></label>
          <p className="inspection-privacy"><LockKeyhole size={12} /> Local preview only. Nothing is recorded or uploaded.<br /><span>Camera stays local through the lobby and arena. Sign out or leave the participant flow to stop it. Press Esc to exit fullscreen.</span></p>
        </div>
        <aside className="inspection-status-column readiness-panel">
          <section className="glass-panel system-status-panel" aria-label="System status"><h2>System Status</h2><ul>{inspectionSteps.map(step => <li key={step.status} className={step.done ? 'verified' : ''}>{step.done ? <Check className="status-verified-icon" size={16} strokeWidth={3} /> : <Circle size={16} />}<span>{step.status}</span><span className="sr-only">{step.done ? ', complete' : ', pending'}</span></li>)}</ul><div className="system-check-count">{checks.filter(check => check.done).length} OF 4 CHECKS COMPLETE <span>{ready ? 'READY' : 'PENDING'}</span></div></section>
          <button id="start-engine" className="button button-primary racing-button w-full" disabled={!ready} onClick={start}><span>START YOUR ENGINE <ArrowRight size={18} /></span></button>
          <p className={'inspection-ready-note ' + (ready ? 'is-ready' : '')} aria-live="polite">{ready ? 'All systems ready. See you on the grid.' : 'Complete all checks to unlock your engine.'}</p>
          <div className="inspection-event-label">CODE GRAND PRIX 2026<span>23 NOVEMBER · CPC CLUB</span></div>
        </aside>
      </div>
    </div>
    <p className="entry-page-caption">PRE-RACE CHECK-IN <span>IDENTITY · CAMERA · FULLSCREEN · RULES</span></p>
  </section>
}
