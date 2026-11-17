import { useState } from 'react'
import type { ReactNode } from 'react'
import type { CheckInRecord, Driver } from '../types'
import { SessionContext } from './session'
const key = 'cgp-demo-driver'
function readDriver(): Driver | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(key) || 'null')
    if (value && typeof value === 'object' && 'id' in value && 'name' in value && 'team' in value
      && typeof value.id === 'string' && typeof value.name === 'string' && typeof value.team === 'string') return value as Driver
  } catch { /* Session storage may be unavailable; use memory instead. */ }
  return null
}
export function SessionProvider({ children }: { children: ReactNode }) {
  const [driver, setDriver] = useState<Driver | null>(readDriver)
  const [checkIn, setCheckIn] = useState<CheckInRecord | null>(null)
  function signIn(next: Driver) {
    setDriver(next)
    setCheckIn(null)
    try { sessionStorage.setItem(key, JSON.stringify(next)) } catch { /* In-memory session remains available. */ }
  }
  function signOut() {
    setDriver(null)
    setCheckIn(null)
    try { sessionStorage.removeItem(key) } catch { /* In-memory session is cleared. */ }
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
  }
  return <SessionContext.Provider value={{ driver, checkIn, signIn, signOut, completeCheckIn: setCheckIn }}>{children}</SessionContext.Provider>
}
