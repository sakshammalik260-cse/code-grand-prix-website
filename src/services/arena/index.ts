import { mockProblems } from '../../data/problems'
import type { ArenaServiceContract } from '../../types/arena'
import { delay, findMockProblem, getMockContest, readProgress } from './mockState'
import { executionService } from './execution'
import { submissionService } from './submission'

export const isArenaMockMode = import.meta.env.VITE_ARENA_MODE !== 'api'
export const mockArenaServices: ArenaServiceContract = {
  async getContest(signal) { await delay(180, signal); return getMockContest() },
  async listProblems(signal) { await delay(200, signal); return mockProblems.map(({ id, number, title, difficulty, points }) => ({ id, number, title, difficulty, points })) },
  async getProblem(id, signal) { await delay(220, signal); return findMockProblem(id) },
  ...executionService,
  ...submissionService,
  async getSession(driverId, signal) { await delay(120, signal); return { driverId, active: !!driverId, simulation: true } },
  async getProgress(contestId, driverId, signal) { await delay(80, signal); return readProgress(contestId, driverId) },
}
// Load Axios/backend wiring only when API mode is explicitly selected.
const backend = () => import('./backend').then(module => module.backendArenaServices)
const deferredBackend: ArenaServiceContract = {
  getContest: (...args) => backend().then(service => service.getContest(...args)),
  listProblems: (...args) => backend().then(service => service.listProblems(...args)),
  getProblem: (...args) => backend().then(service => service.getProblem(...args)),
  runCode: (...args) => backend().then(service => service.runCode(...args)),
  submitCode: (...args) => backend().then(service => service.submitCode(...args)),
  getSubmission: (...args) => backend().then(service => service.getSubmission(...args)),
  getSession: (...args) => backend().then(service => service.getSession(...args)),
  getProgress: (...args) => backend().then(service => service.getProgress(...args)),
}
export const arenaServices = isArenaMockMode ? mockArenaServices : deferredBackend
