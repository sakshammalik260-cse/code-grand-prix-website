import { createContext } from 'react'
import type { CheckInRecord, Driver } from '../types'
export interface SessionContextValue {
  driver: Driver | null
  checkIn: CheckInRecord | null
  signIn: (driver: Driver) => void
  signOut: () => void
  completeCheckIn: (record: CheckInRecord) => void
}
export const SessionContext = createContext<SessionContextValue | null>(null)
