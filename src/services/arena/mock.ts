import type { ArenaServiceContract } from '../../types/arena'
import { candidateProblemService } from '../problems'
import { delay,getMockContest,readProgress } from './mockState'
import { executionService } from './execution'
import { submissionService } from './submission'
export const mockArenaServices: ArenaServiceContract = {
  async getContest(signal) { await delay(180, signal); return getMockContest() },
  async listProblems(signal) { return candidateProblemService.list(signal) },
  async getProblem(id, signal) { return candidateProblemService.get(id,signal) },
  ...executionService,
  ...submissionService,
  async getSession(driverId, signal) { await delay(120, signal); return { driverId, active: !!driverId, simulation: true } },
  async getProgress(contestId, driverId, signal) { await delay(80, signal); return {...readProgress(contestId, driverId),totalProblems:(await candidateProblemService.list(signal)).length} },
}
