import { lazy, Suspense, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, UserRound } from 'lucide-react'
import { authService } from '../services/auth'
import { isDevelopmentMock } from '../services/mode'
import { roleHome } from '../services/access'
import { useSession } from '../hooks/useSession'
import { CheckeredFlag, RaceWordmark } from '../components/RacingIdentity'
import { LoadingState } from '../components/Ui'

const DevelopmentAccounts = import.meta.env.DEV ? lazy(()=>import('../components/DevelopmentAccounts')) : null
const within = (path: string | undefined, root: string) => path === root || path?.startsWith(root + '/')

export function LoginPage() {
  const { driver, loading:authLoading, authError, signIn } = useSession()
  const location=useLocation()
  const navigate = useNavigate()
  const [driverId, setDriverId] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [errors, setErrors] = useState<{ driverId?: string; password?: string }>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const driverIdInput = useRef<HTMLInputElement>(null)
  const passwordInput = useRef<HTMLInputElement>(null)
  const [postLoginTarget, setPostLoginTarget] = useState('')
  if(authLoading)return <LoadingState label="Verifying your paddock pass" detail="Restoring your championship session." />
  if (driver) return <Navigate to={postLoginTarget || roleHome(driver.role)} replace />
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const next = { driverId: !driverId.trim() ? 'Enter your Driver ID.' : undefined, password: !password ? 'Enter your password.' : undefined }
    setErrors(next)
    setError('')
    if (next.driverId || next.password) {
      if (next.driverId) driverIdInput.current?.focus()
      else passwordInput.current?.focus()
      return
    }
    setLoading(true)
    try { const account=await authService.login({ driverId, password }); const from=(location.state as {from?:string})?.from; const allowed=account.role==='ADMIN'?within(from,'/admin') || within(from,'/volunteer') || from==='/results':account.role==='VOLUNTEER'?within(from,'/volunteer'):from==='/check-in' || from==='/results'; const target=allowed && from?from:roleHome(account.role); setPostLoginTarget(target); signIn(account); navigate(target, { replace: true }) }
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
        <div className="login-access-strip"><span><i /> DRIVER IDENTIFICATION</span><strong>ROUND 01</strong></div>
        <h1 id="driver-login-title">DRIVER LOGIN</h1>
        <form onSubmit={submit} noValidate className="login-form">
          <label className="login-field-label" htmlFor="driver-id"><span>Driver ID</span><small>Assigned credential</small></label>
          <div className={`input-wrap ${errors.driverId ? 'invalid' : ''}`}><UserRound size={19} fill="currentColor" /><input ref={driverIdInput} id="driver-id" autoComplete="username" autoCapitalize="characters" spellCheck={false} placeholder="Enter driver ID" maxLength={40} value={driverId} onChange={e => { setDriverId(e.target.value); if (errors.driverId) setErrors(current => ({ ...current, driverId: undefined })); if (error) setError('') }} aria-invalid={!!errors.driverId} aria-describedby={errors.driverId ? 'driver-error' : undefined} disabled={loading} /></div>
          {errors.driverId && <span className="field-error" id="driver-error">{errors.driverId}</span>}
          <label className="login-field-label" htmlFor="password"><span>Password</span><small>Cockpit access</small></label>
          <div className={`input-wrap ${errors.password ? 'invalid' : ''}`}><LockKeyhole size={18} fill="currentColor" /><input ref={passwordInput} id="password" type={visible ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter password" value={password} onChange={e => { setPassword(e.target.value); if (errors.password) setErrors(current => ({ ...current, password: undefined })); if (error) setError('') }} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined} disabled={loading} /><button className="icon-button" type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
          {errors.password && <span className="field-error" id="password-error">{errors.password}</span>}
          {error && <p className="alert alert-error" role="alert">{error}</p>}
          <p className="login-form-status" role="status"><i />{loading ? 'VERIFYING DRIVER CREDENTIALS' : 'PADDOCK ACCESS READY'}</p>
          <button type="submit" className="button button-primary racing-button w-full" disabled={loading} aria-busy={loading}><span>{loading ? <><LoaderCircle size={17} className="spin" /> CHECKING CREDENTIALS</> : <>ENTER THE GRID <ArrowRight size={19} /></>}</span></button>
        </form>
        <p className="login-signature">Competitive Programming Club <span>|</span> Code Grand Prix</p>
        {isDevelopmentMock && DevelopmentAccounts && <Suspense fallback={null}><DevelopmentAccounts onSelect={(id,secret)=>{setDriverId(id);setPassword(secret);setErrors({});setError('')}}/></Suspense>}
        {authError && <p className="field-error" role="alert">{authError}</p>}
        <p className="login-help">Need your credentials? Contact a CPC Club volunteer.</p>
      </section>
    </div>
    <Link to="/" className="login-back-link">← Back to race overview</Link>
    <p className="entry-page-caption">CODE GRAND PRIX 2026 <span>23 NOVEMBER · CPC CLUB</span></p>
  </section>
}
