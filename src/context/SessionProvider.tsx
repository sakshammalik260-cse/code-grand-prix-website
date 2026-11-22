import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { CheckInRecord, Driver } from '../types'
import { SessionContext } from './session'
import { event } from '../data/event'
import { AUTH_SESSION_EXPIRED } from '../services/api'
import { restoreCheckIn } from '../services/checkIn'
import { authService } from '../services/auth'
import { isDevelopmentMock } from '../services/mode'
const receiptKey = `cgp-demo-check-in-v1:${event.contestId}`
export function SessionProvider({ children }: { children: ReactNode }) {
  const [driver,setDriver]=useState<Driver | null>(null)
  const [loading,setLoading]=useState(true)
  const [authError,setAuthError]=useState('')
  const [checkIn,setCheckIn]=useState<CheckInRecord | null>(null)
  useEffect(()=>{
    const controller=new AbortController()
    authService.me(controller.signal).then(async user=>{
      if (controller.signal.aborted) return
      if (isDevelopmentMock && user?.role==='CANDIDATE') try {
        const record=JSON.parse(sessionStorage.getItem(receiptKey)||'null') as CheckInRecord | null
        if (record?.driverId===user.id && record.cameraVerified && record.fullscreenVerified && record.rulesAccepted && Number.isFinite(Date.parse(record.completedAt))) setCheckIn(record)
      } catch { /* Recheck inspection when receipt is unavailable. */ }
      if (!isDevelopmentMock && user?.role === 'CANDIDATE') {
        const receipt = await restoreCheckIn(user.id, controller.signal)
        if (controller.signal.aborted) return
        setCheckIn(receipt)
      }
      setDriver(user)
    }).catch(error=>{if(!controller.signal.aborted)setAuthError(error instanceof Error?error.message:'Unable to verify account.')}).finally(()=>{if(!controller.signal.aborted)setLoading(false)})
    return ()=>controller.abort()
  },[])
  useEffect(() => {
    function expire() {
      setDriver(null)
      setCheckIn(null)
      setAuthError('Your session expired. Sign in again to continue.')
    }
    window.addEventListener(AUTH_SESSION_EXPIRED, expire)
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED, expire)
  }, [])
  async function signIn(next: Driver) {
    const receipt = !isDevelopmentMock && next.role === 'CANDIDATE' ? await restoreCheckIn(next.id) : null
    setDriver(next);setLoading(false);setAuthError('');setCheckIn(receipt)

    if (isDevelopmentMock) try {sessionStorage.setItem('cgp-demo-driver',JSON.stringify({id:next.id}));sessionStorage.removeItem(receiptKey)}catch{/* Demo memory session. */}
    return receipt
  }
  function completeCheckIn(record: CheckInRecord) {
    setCheckIn(record)
    if(isDevelopmentMock)try{sessionStorage.setItem(receiptKey,JSON.stringify(record))}catch{/* Memory receipt. */}
  }
  function signOut() {
    void authService.logout().then(()=>{
      setDriver(null);setCheckIn(null);setAuthError('')
      try{sessionStorage.removeItem(receiptKey)}catch{/* Memory session cleared. */}
      if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{})
    }).catch(error=>setAuthError(error instanceof Error?error.message:'Sign out failed. Retry.'))
  }
  return <SessionContext.Provider value={{driver,checkIn,loading,authError,signIn,signOut,completeCheckIn}}>{children}</SessionContext.Provider>
}
