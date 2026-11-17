import { useEffect, useState } from 'react'
import type { ContestPhase, ContestState } from '../types/arena'

export interface RaceClock {
  seconds: number
  label: string
  effectivePhase: ContestPhase
  canSubmit: boolean
  ended: boolean
}
export type RaceClockInput = Pick<ContestState, 'contestStartTime' | 'contestEndTime' | 'serverTime' | 'status' | 'pausedAt'>
export function useRaceClock({ contestStartTime, contestEndTime, serverTime, status, pausedAt }: RaceClockInput): RaceClock {
  const [tick, setTick] = useState({ version: serverTime, elapsed: 0 })
  useEffect(() => {
    const anchor = performance.now()
    const timer = window.setInterval(() => setTick({ version: serverTime, elapsed: performance.now() - anchor }), 250)
    return () => window.clearInterval(timer)
  }, [serverTime])
  // The server snapshot is the anchor. performance.now avoids local wall-clock edits between refreshes.
  const elapsed = tick.version === serverTime ? tick.elapsed : 0
  const serverNow = status === 'PAUSED_BY_ORGANIZER' ? Date.parse(pausedAt || serverTime) : Date.parse(serverTime) + elapsed
  const target = Date.parse(status === 'WAITING' ? contestStartTime : contestEndTime)
  const valid = Number.isFinite(target) && Number.isFinite(serverNow)
  const seconds = valid ? Math.max(0, Math.ceil((target - serverNow) / 1000)) : 0
  const ended = status === 'FINISHED' || (status === 'LIVE' && (!valid || serverNow >= target))
  const effectivePhase = ended ? 'FINISHED' : status
  const label = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(value => String(value).padStart(2, '0')).join(':')
  return { seconds: ended ? 0 : seconds, label: ended ? '00:00:00' : label, effectivePhase, canSubmit: effectivePhase === 'LIVE' && valid, ended }
}
