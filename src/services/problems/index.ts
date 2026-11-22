import { isBackendConfigured, isDevelopmentMock } from '../mode'
import type { AdminProblemService, CandidateProblemService } from '../../types/problems'
const backend=()=>import('./backend')
const mock=import.meta.env.DEV?()=>import('./mock'):null
const admin=()=>isDevelopmentMock&&mock?mock().then(m=>m.mockAdminProblems):backend().then(m=>m.backendAdminProblems)
const candidate=()=>isDevelopmentMock&&mock?mock().then(m=>m.mockCandidateProblems):backend().then(m=>m.backendCandidateProblems)
export const adminProblemService:AdminProblemService={
  overview:(...args)=>admin().then(s=>s.overview(...args)),list:(...args)=>admin().then(s=>s.list(...args)),get:(...args)=>admin().then(s=>s.get(...args)),
  create:(...args)=>admin().then(s=>s.create(...args)),update:(...args)=>admin().then(s=>s.update(...args)),deleteDraft:(...args)=>admin().then(s=>s.deleteDraft(...args)),
  publish:(...args)=>admin().then(s=>s.publish(...args)),unpublish:(...args)=>admin().then(s=>s.unpublish(...args)),assign:(...args)=>admin().then(s=>s.assign(...args)),
  cases:(...args)=>admin().then(s=>s.cases(...args)),addCase:(...args)=>admin().then(s=>s.addCase(...args)),updateCase:(...args)=>admin().then(s=>s.updateCase(...args)),deleteCase:(...args)=>admin().then(s=>s.deleteCase(...args)),
  ...(isBackendConfigured ? {
    getLeaderboardVisibility: (signal?: AbortSignal) => backend().then(m => m.backendAdminProblems.getLeaderboardVisibility!(signal)),
    setLeaderboardVisibility: (visible: boolean) => backend().then(m => m.backendAdminProblems.setLeaderboardVisibility!(visible)),
  } : {}),
  rounds:(...args)=>admin().then(s=>s.rounds(...args)),saveRound:(...args)=>admin().then(s=>s.saveRound(...args)),
}
export const candidateProblemService:CandidateProblemService={list:(...args)=>candidate().then(s=>s.list(...args)),get:(...args)=>candidate().then(s=>s.get(...args)),resultsVisibility:(...args)=>candidate().then(s=>s.resultsVisibility(...args))}
