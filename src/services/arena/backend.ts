import type { SessionEnvelope } from '../../types/monitoring'
import { candidateProblemService } from '../problems'
import { api } from '../api'
import type { ArenaServiceContract, ArenaSession, CodeExecutionResult, ContestState, DriverProgress, SubmissionResult } from '../../types/arena'

export const backendArenaServices: ArenaServiceContract = {
  async getContest(signal) { return (await api.get<ContestState>('/contest', { signal })).data },
  async listProblems(signal) { return candidateProblemService.list(signal) },
  async getProblem(id, signal) { return candidateProblemService.get(id,signal) },
  async runCode(request, signal) { return (await api.post<CodeExecutionResult>('/code/run', request, { signal, timeout: 240000 })).data },
  async submitCode(request, signal) { return (await api.post<SubmissionResult>('/code/submit', request, { signal, timeout: 240000 })).data },
  async getSubmission(id, signal) { return (await api.get<SubmissionResult>(`/submissions/${encodeURIComponent(id)}`, { signal })).data },
  async getSession(driverId, signal) { const data = (await api.get<SessionEnvelope & { checkinStatus: string }>('/session', { signal })).data; const result: ArenaSession = { driverId: data.session?.driverId || '', active: data.checkinStatus === 'READY' && data.viewer.role === 'CANDIDATE' && data.session?.driverId === driverId, simulation: data.viewer.simulation }; return result },
  async getProgress(contestId, _driverId, signal) { return (await api.get<DriverProgress>('/contest/progress', { params: { contestId }, signal })).data },
}
