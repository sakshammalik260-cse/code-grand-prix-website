import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { CheckInRecord, Driver } from '../types'
import { SessionContext } from './session'
import { event } from '../data/event'
import { authService } from '../services/auth'
import { isDevelopmentMock } from '../services/mode'
import { cameraStore } from '../services/cameraStore'
const receiptKey = `cgp-demo-check-in-v1:${event.contestId}`
export function SessionProvider({ children }: { children: ReactNode }) {
  const [driver,setDriver]=useState<Driver | null>(null)
  const [loading,setLoading]=useState(true)
  const [authError,setAuthError]=useState('')
  const [checkIn,setCheckIn]=useState<CheckInRecord | null>(null)
  useEffect(()=>{
    const controller=new AbortController()
    authService.me(controller.signal).then(user=>{
      if (controller.signal.aborted) return
      setDriver(user)
      if (user?.role==='CANDIDATE') try {
        const record=JSON.parse(sessionStorage.getItem(receiptKey)||'null') as CheckInRecord | null
        if (record?.driverId===user.id && record.cameraVerified && record.fullscreenVerified && record.rulesAccepted && Number.isFinite(Date.parse(record.completedAt))) setCheckIn(record)
      } catch { /* Recheck inspection when receipt is unavailable. */ }
    }).catch(error=>{if(!controller.signal.aborted)setAuthError(error instanceof Error?error.message:'Unable to verify account.')}).finally(()=>{if(!controller.signal.aborted)setLoading(false)})
    return ()=>controller.abort()
  },[])
  function signIn(next: Driver) {
    setDriver(next);setLoading(false);setAuthError('');setCheckIn(null)
    if (isDevelopmentMock) try {sessionStorage.setItem('cgp-demo-driver',JSON.stringify({id:next.id}));sessionStorage.removeItem(receiptKey)}catch{/* Demo memory session. */}
  }
  function completeCheckIn(record: CheckInRecord) {
    setCheckIn(record)
    try{sessionStorage.setItem(receiptKey,JSON.stringify(record))}catch{/* Memory receipt. */}
  }
  function signOut() {
    setAuthError('')
    window.dispatchEvent(new Event('cgp-session-teardown'))
    cameraStore.release()
    if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{})
    void authService.logout().then(()=>{
      setDriver(null);setCheckIn(null);setAuthError('')
      try{sessionStorage.removeItem(receiptKey)}catch{/* Memory session cleared. */}
    }).catch(error=>{window.dispatchEvent(new Event('cgp-session-teardown-cancelled'));setAuthError(error instanceof Error?error.message:'Sign out failed. Retry.')})
  }
  return <SessionContext.Provider value={{driver,checkIn,loading,authError,signIn,signOut,completeCheckIn}}>{children}</SessionContext.Provider>
}
