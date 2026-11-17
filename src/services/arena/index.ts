import type { ArenaServiceContract } from '../../types/arena'
import { isDevelopmentMock } from '../mode'
export const isArenaMockMode = isDevelopmentMock
// Load Axios/backend wiring only when API mode is explicitly selected.
const backend = import.meta.env.DEV && isDevelopmentMock ? () => import('./mock').then(module=>module.mockArenaServices) : () => import('./backend').then(module=>module.backendArenaServices)
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
export const arenaServices = deferredBackend
