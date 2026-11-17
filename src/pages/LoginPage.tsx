import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, UserRound } from 'lucide-react'
import { authService } from '../services/auth'
import { demoCredentials } from '../data/event'
import { useSession } from '../hooks/useSession'
import { CheckeredFlag, RaceWordmark } from '../components/RacingIdentity'

export function LoginPage() {
  const { driver, signIn } = useSession()
  const navigate = useNavigate()
  const [driverId, setDriverId] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [errors, setErrors] = useState<{ driverId?: string; password?: string }>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  if (driver) return <Navigate to="/check-in" replace />
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const next = { driverId: !driverId.trim() ? 'Enter your Driver ID.' : undefined, password: !password ? 'Enter your password.' : undefined }
    setErrors(next)
    setError('')
    if (next.driverId || next.password) return
    setLoading(true)
    try { signIn(await authService.login({ driverId, password })); navigate('/check-in', { replace: true }) }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.') }
    finally { setLoading(false) }
  }
  return <section className="cinematic-login cinematic-page" aria-label="Driver authentication">
    <div className="helmet-portrait" role="img" aria-label="Racing driver wearing a black and red helmet under dramatic red lighting" />
    <CheckeredFlag className="login-flag" />
    <div className="login-speed-lines" aria-hidden="true" />
    <div className="driver-login-layout">
      <section className="driver-login-panel" aria-labelledby="driver-login-title">
        <RaceWordmark className="login-wordmark" />
        <h1 id="driver-login-title">DRIVER LOGIN</h1>
        <form onSubmit={submit} noValidate className="login-form">
          <label className="sr-only" htmlFor="driver-id">Driver ID</label>
          <div className={`input-wrap ${errors.driverId ? 'invalid' : ''}`}><UserRound size={19} fill="currentColor" /><input id="driver-id" autoComplete="username" autoCapitalize="characters" spellCheck={false} placeholder="Driver ID" maxLength={40} value={driverId} onChange={e => setDriverId(e.target.value)} aria-invalid={!!errors.driverId} aria-describedby={errors.driverId ? 'driver-error' : undefined} disabled={loading} /></div>
          {errors.driverId && <span className="field-error" id="driver-error">{errors.driverId}</span>}
          <label className="sr-only" htmlFor="password">Password</label>
          <div className={`input-wrap ${errors.password ? 'invalid' : ''}`}><LockKeyhole size={18} fill="currentColor" /><input id="password" type={visible ? 'text' : 'password'} autoComplete="current-password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined} disabled={loading} /><button className="icon-button" type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
          {errors.password && <span className="field-error" id="password-error">{errors.password}</span>}
          {error && <p className="alert alert-error" role="alert">{error}</p>}
          <button type="submit" className="button button-primary racing-button w-full" disabled={loading}><span>{loading ? <><LoaderCircle size={17} className="spin" /> CHECKING CREDENTIALS</> : <>ENTER THE GRID <ArrowRight size={19} /></>}</span></button>
        </form>
        <p className="login-signature">CPC <span>|</span> Code Grand Prix</p>
        <details className="login-preview-access"><summary>Preview access <span>MOCK MODE</span></summary><div><p>Driver ID: <code>{demoCredentials.driverId}</code><br />Password: <code>{demoCredentials.password}</code></p><button className="text-link" type="button" disabled={loading} onClick={() => { setDriverId(demoCredentials.driverId); setPassword(demoCredentials.password); setErrors({}); setError('') }}>Use demo credentials <ArrowRight size={14} /></button></div></details>
        <p className="login-help">Need your credentials? Contact a CPC Club volunteer.</p>
      </section>
    </div>
    <Link to="/" className="login-back-link">← Back to race overview</Link>
    <p className="entry-page-caption">CODE GRAND PRIX 2026 <span>23 NOVEMBER · CPC CLUB</span></p>
  </section>
}
