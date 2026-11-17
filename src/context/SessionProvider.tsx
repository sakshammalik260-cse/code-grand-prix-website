import { useState } from 'react'
import type { ReactNode } from 'react'
import type { CheckInRecord, Driver } from '../types'
import { SessionContext } from './session'
import { event } from '../data/event'
const key = 'cgp-demo-driver'
const receiptKey = `cgp-demo-check-in-v1:${event.contestId}`
function readDriver(): Driver | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(key) || 'null')
    if (value && typeof value === 'object' && 'id' in value && 'name' in value && 'team' in value
      && typeof value.id === 'string' && typeof value.name === 'string' && typeof value.team === 'string') return value as Driver
  } catch { /* Session storage may be unavailable; use memory instead. */ }
  return null
}
function readCheckIn(): CheckInRecord | null {
  try {
    const driver = readDriver()
    const value = JSON.parse(sessionStorage.getItem(receiptKey) || 'null') as Partial<CheckInRecord> | null
    if (driver && value?.driverId === driver.id && value.cameraVerified === true && value.fullscreenVerified === true
      && value.rulesAccepted === true && typeof value.completedAt === 'string' && Number.isFinite(Date.parse(value.completedAt))) return value as CheckInRecord
  } catch { /* A missing receipt requires the real check-in flow. */ }
  return null
}
export function SessionProvider({ children }: { children: ReactNode }) {
  const [driver, setDriver] = useState<Driver | null>(readDriver)
  const [checkIn, setCheckIn] = useState<CheckInRecord | null>(readCheckIn)
  function signIn(next: Driver) {
    setDriver(next)
    setCheckIn(null)
    try { sessionStorage.setItem(key, JSON.stringify(next)); sessionStorage.removeItem(receiptKey) } catch { /* In-memory session remains available. */ }
  }
  function completeCheckIn(record: CheckInRecord) {
    setCheckIn(record)
    // Demo receipt only. It does not claim the camera or fullscreen remains active after navigation/reload.
    try { sessionStorage.setItem(receiptKey, JSON.stringify(record)) } catch { /* In-memory check-in remains available. */ }
  }
  function signOut() {
    setDriver(null)
    setCheckIn(null)
    try { sessionStorage.removeItem(key); sessionStorage.removeItem(receiptKey) } catch { /* In-memory session is cleared. */ }
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
  }
  return <SessionContext.Provider value={{ driver, checkIn, signIn, signOut, completeCheckIn }}>{children}</SessionContext.Provider>
}
