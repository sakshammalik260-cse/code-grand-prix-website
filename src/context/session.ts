import { createContext } from 'react'
import type { CheckInRecord, Driver } from '../types'
export interface SessionContextValue {
  loading: boolean
  authError: string
  driver: Driver | null
  checkIn: CheckInRecord | null
  signIn: (driver: Driver) => Promise<CheckInRecord | null>
  signOut: () => void
  completeCheckIn: (record: CheckInRecord) => void
}
export const SessionContext = createContext<SessionContextValue | null>(null)
