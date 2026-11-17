import { updateMockProgress } from './mockProgress'
import { assertMockMonitoringExecution } from '../monitoring/mock'
import type { MockScenario, SubmissionRequest, SubmissionResult } from '../../types/arena'
import { executionFixture, validateSource } from './execution'
import { ArenaServiceError, assertLiveContest, delay, findMockProblem, mockControls } from './mockState'

interface MockJob { request: SubmissionRequest; initial: SubmissionResult; started: number; scenario: MockScenario; final?: SubmissionResult }
const jobs = new Map<string, MockJob>()
export const submissionService = {
  async submitCode(request: SubmissionRequest, signal?: AbortSignal): Promise<SubmissionResult> {
    await validateSource(request); assertLiveContest(request.contestId); await assertMockMonitoringExecution(request, request.sessionId)
    const scenario = mockControls.submissionScenario
    await delay(350, signal)
    await assertMockMonitoringExecution(request, request.sessionId)
    if (scenario === 'NETWORK_ERROR') throw new ArenaServiceError('The simulated submission could not be queued. Your code is unchanged. Please try again.')
    const initial: SubmissionResult = { id: `sub-${crypto.randomUUID()}`, contestId: request.contestId, driverId: request.driverId, problemId: request.problemId, language: request.language, status: 'QUEUED', submittedAt: new Date().toISOString(), simulation: true }
    jobs.set(initial.id, { request: { ...request }, initial, started: Date.now(), scenario })
    await updateMockProgress(request.contestId, request.driverId, request.problemId, false)
    return initial
  },
  async getSubmission(id: string, signal?: AbortSignal): Promise<SubmissionResult> {
    await delay(150, signal)
    const job = jobs.get(id)
    if (!job) throw new ArenaServiceError('This submission is unavailable in the current mock session. Your draft is still saved.')
    if (job.final) return job.final
    const elapsed = Date.now() - job.started
    if (elapsed < 650) return { ...job.initial, status: 'QUEUED' }
    if (elapsed < 1550) return { ...job.initial, status: 'RUNNING' }
    if (job.scenario === 'NETWORK_ERROR') throw new ArenaServiceError('Could not retrieve the simulated submission result. Please retry.')
    const execution = await executionFixture(job.request, job.scenario)
    job.final = { ...job.initial, status: job.scenario, execution }
    // Demo progress is updated only from the service result, never from source inspection.
    await updateMockProgress(job.request.contestId, job.request.driverId, job.request.problemId, job.scenario === 'ACCEPTED', (await findMockProblem(job.request.problemId)).points)
    return job.final
  },
}
