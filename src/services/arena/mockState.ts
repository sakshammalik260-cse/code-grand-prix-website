import type { ContestPhase, ContestState, DriverProgress, MockScenario } from '../../types/arena'
import { candidateProblemService } from '../problems'
import { event } from '../../data/event'

export const mockContestId = event.contestId
export class ArenaServiceError extends Error {
  constructor(message: string) { super(message); this.name = 'ArenaServiceError' }
}
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new DOMException('Request cancelled', 'AbortError')); return }
    const abort = () => { clearTimeout(timer); reject(new DOMException('Request cancelled', 'AbortError')) }
    const timer = window.setTimeout(() => { signal?.removeEventListener('abort', abort); resolve() }, ms)
    signal?.addEventListener('abort', abort, { once: true })
  })
}
export function isAbort(error: unknown) { return error instanceof DOMException && error.name === 'AbortError' }
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'The request could not be completed. Please try again.'
}
function readContest(): ContestState {
  try {
    const stored = JSON.parse(localStorage.getItem('cgp-mock-contest-v1') || sessionStorage.getItem('cgp-mock-contest-v1') || 'null') as ContestState | null
    if (stored?.id === mockContestId && ['WAITING','LIVE','PAUSED_BY_ORGANIZER','FINISHED'].includes(stored.status)
      && Number.isFinite(Date.parse(stored.contestStartTime)) && Number.isFinite(Date.parse(stored.contestEndTime))
      && (stored.status !== 'PAUSED_BY_ORGANIZER' || Number.isFinite(Date.parse(stored.pausedAt || '')))) return stored
  } catch { /* Mock state can remain in memory. */ }
  const now = Date.now()
  return { id: mockContestId, title: 'Code Grand Prix 2026', round: 'Round 01', status: 'WAITING', contestStartTime: new Date(now + 1800000).toISOString(), contestEndTime: new Date(now + 12600000).toISOString(), serverTime: new Date(now).toISOString(), simulation: true }
}
let contest = readContest()
function persistContest() { try { localStorage.setItem('cgp-mock-contest-v1', JSON.stringify(contest)); sessionStorage.setItem('cgp-mock-contest-v1', JSON.stringify(contest)) } catch { /* Memory fallback. */ } }
export function setMockContest(next:ContestState){contest=next;persistContest()}
export function getMockContest(): ContestState {
  contest=readContest()
  if (contest.status === 'LIVE' && Date.now() >= Date.parse(contest.contestEndTime)) {
    contest = { ...contest, status: 'FINISHED' }; persistContest()
  }
  return { ...contest, serverTime: new Date().toISOString(), simulation: true }
}
export const mockControls = {
  runScenario: 'ACCEPTED' as MockScenario,
  submissionScenario: 'ACCEPTED' as MockScenario,
  setContestPhase(status: ContestPhase) {
    const now = Date.now()
    const previous = getMockContest()
    if (status === 'LIVE') {
      const remaining = previous.status === 'PAUSED_BY_ORGANIZER' ? Math.max(0, Date.parse(previous.contestEndTime) - Date.parse(previous.pausedAt!)) : 8100000
      contest = { ...previous, status, contestStartTime: previous.status === 'PAUSED_BY_ORGANIZER' ? previous.contestStartTime : new Date(now - 2700000).toISOString(), contestEndTime: new Date(now + remaining).toISOString(), pausedAt: undefined }
    } else if (status === 'WAITING') {
      contest = { ...previous, status, contestStartTime: new Date(now + 1800000).toISOString(), contestEndTime: new Date(now + 12600000).toISOString(), pausedAt: undefined }
    } else if (status === 'PAUSED_BY_ORGANIZER') {
      contest = { ...previous, status, pausedAt: new Date(now).toISOString(), contestEndTime: previous.status === 'LIVE' ? previous.contestEndTime : new Date(now + 8100000).toISOString() }
    } else {
      contest = { ...previous, status, contestEndTime: new Date(now).toISOString(), pausedAt: undefined }
    }
    persistContest()
    return getMockContest()
  },
  finishInFiveSeconds() {
    contest = { ...getMockContest(), status: 'LIVE', contestStartTime: new Date(Date.now() - 1000).toISOString(), contestEndTime: new Date(Date.now() + 5000).toISOString(), pausedAt: undefined }
    persistContest(); return getMockContest()
  },
}
const progressCache = new Map<string, DriverProgress>()
export function readProgress(contestId: string, driverId: string): DriverProgress {
  const key = `cgp-mock-progress:${contestId}:${driverId}`
  let data = progressCache.get(key)
  if (!data) {
    try {
      const stored = JSON.parse(sessionStorage.getItem(key) || 'null') as DriverProgress | null
      if (stored?.contestId === contestId && stored.driverId === driverId && Array.isArray(stored.attemptedProblemIds)
        && stored.attemptedProblemIds.every(id => typeof id === 'string') && Array.isArray(stored.solvedProblemIds)
        && stored.solvedProblemIds.every(id => typeof id === 'string') && typeof stored.currentScore === 'number') data = stored
    } catch { /* Memory fallback. */ }
  }
  return data || { contestId, driverId, totalProblems: 0, attemptedProblemIds: [], solvedProblemIds: [], currentScore: 0, simulation: true }
}
export function updateMockProgress(contestId: string, driverId: string, problemId: string, accepted: boolean, points = 0) {
  const previous = readProgress(contestId, driverId)
  const solved = new Set(previous.solvedProblemIds)
  if (accepted) solved.add(problemId)
  const next: DriverProgress = { ...previous, attemptedProblemIds: [...new Set([...previous.attemptedProblemIds, problemId])], solvedProblemIds: [...solved], currentScore: previous.currentScore + (accepted && !previous.solvedProblemIds.includes(problemId) ? points : 0), simulation: true }
  const key = `cgp-mock-progress:${contestId}:${driverId}`
  progressCache.set(key, next)
  try { sessionStorage.setItem(key, JSON.stringify(next)) } catch { /* Not an official score; memory fallback. */ }
  return next
}
export function assertLiveContest(contestId: string) {
  const current = getMockContest()
  if (current.id !== contestId) throw new ArenaServiceError('This contest is unavailable. Refresh race status and try again.')
  if (current.status !== 'LIVE') throw new ArenaServiceError('The race is not accepting requests right now. Your draft is safe.')
}
export async function findMockProblem(id: string) {
  return candidateProblemService.get(id)
}
