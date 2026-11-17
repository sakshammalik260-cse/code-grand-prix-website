import type { SessionEnvelope } from '../../types/monitoring'
import { candidateProblemService } from '../problems'
import { api } from '../api'
import type { ArenaServiceContract, ArenaSession, CodeExecutionResult, ContestState, DriverProgress, SubmissionResult } from '../../types/arena'

// Proposed contracts only. The backend team must confirm paths and response schemas.
// Authentication transport (for example secure cookies) must be configured with that team.
export const backendArenaServices: ArenaServiceContract = {
  async getContest(signal) { return (await api.get<ContestState>('/contest', { signal })).data },
  async listProblems(signal) { return candidateProblemService.list(signal) },
  async getProblem(id, signal) { return candidateProblemService.get(id,signal) },
  async runCode(request, signal) { return (await api.post<CodeExecutionResult>('/code/run', request, { signal })).data },
  async submitCode(request, signal) { return (await api.post<SubmissionResult>('/code/submit', request, { signal })).data },
  async getSubmission(id, signal) { return (await api.get<SubmissionResult>(`/submissions/${encodeURIComponent(id)}`, { signal })).data },
  async getSession(driverId, signal) { const data = (await api.get<SessionEnvelope>('/session', { signal })).data; const result: ArenaSession = { driverId: data.session?.driverId || '', active: data.viewer.role === 'CANDIDATE' && data.session?.driverId === driverId, simulation: data.viewer.simulation }; return result },
  async getProgress(contestId, _driverId, signal) { return (await api.get<DriverProgress>('/contest/progress', { params: { contestId }, signal })).data },
}
