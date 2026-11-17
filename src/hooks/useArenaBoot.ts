import { useEffect, useState } from 'react'
import { arenaServices } from '../services/arena'
import { errorMessage, isAbort } from '../services/arena/mockState'
import type { ArenaSession, ContestState, DriverProgress, ProblemSummary } from '../types/arena'

export interface ArenaBootData { contest: ContestState; problems: ProblemSummary[]; progress: DriverProgress; session: ArenaSession }
export function useArenaBoot(driverId: string) {
  const [data, setData] = useState<ArenaBootData | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal
    Promise.all([arenaServices.getContest(signal), arenaServices.listProblems(signal), arenaServices.getSession(driverId, signal)])
      .then(async ([contest, problems, session]) => ({ contest, problems, session, progress: await arenaServices.getProgress(contest.id, driverId, signal) }))
      .then(result => { if (!signal.aborted) setData(result) })
      .catch(reason => { if (!signal.aborted && !isAbort(reason)) setError(errorMessage(reason)) })
    return () => controller.abort()
  }, [driverId, attempt])
  function retry() { setData(null); setError(''); setAttempt(value => value + 1) }
  return { data, error, retry }
}
