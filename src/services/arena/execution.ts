import type { CodeExecutionRequest, CodeExecutionResult, Verdict } from '../../types/arena'
import { ArenaServiceError, assertLiveContest, delay, findMockProblem, mockControls } from './mockState'

const errorFixtures: Partial<Record<Verdict, string>> = {
  COMPILATION_ERROR: 'Simulation: compiler diagnostic fixture at main:5: missing expression. No compiler was invoked.',
  RUNTIME_ERROR: 'Simulation: process exited with a runtime error. No source code was executed.',
  TIME_LIMIT_EXCEEDED: 'Simulation: the execution exceeded its time limit. No source code was executed.',
  MEMORY_LIMIT_EXCEEDED: 'Simulation: the execution exceeded its memory limit. No source code was executed.',
}
export function validateSource(request: CodeExecutionRequest) {
  if (!request.sourceCode.trim()) throw new ArenaServiceError('Your editor is empty. Add source code before running or submitting.')
  if (request.sourceCode.length > 250000) throw new ArenaServiceError('This source file exceeds the 250,000-character preview limit. Shorten it before trying again.')
  if (!['python','java','cpp','javascript'].includes(request.language)) throw new ArenaServiceError('Select a supported programming language.')
  findMockProblem(request.problemId)
}
// Fixed demonstration outcomes. This function never interprets or judges source code.
export function executionFixture(request: CodeExecutionRequest, status: Verdict): CodeExecutionResult {
  const problem = findMockProblem(request.problemId)
  const custom = request.customInput !== undefined
  const samples = custom ? [{ id: 'custom', input: request.customInput!, output: null }] : problem.samples
  const cases = samples.map((sample, index) => ({
    id: sample.id, label: custom ? 'Custom input' : `Case ${index + 1}`, input: sample.input,
    expectedOutput: sample.output,
    stdout: status === 'ACCEPTED' ? custom ? '[Simulation] Custom input received. No program was executed.' : sample.output! : status === 'WRONG_ANSWER' ? '[Simulation] Output differs from this public sample.' : '',
    stderr: errorFixtures[status] || '', status,
  }))
  return { id: `run-${crypto.randomUUID()}`, problemId: request.problemId, language: request.language, status,
    stdout: cases[0].stdout, stderr: cases[0].stderr, expectedOutput: cases[0].expectedOutput,
    executionTimeMs: status === 'TIME_LIMIT_EXCEEDED' ? problem.timeLimitMs : 42,
    memoryUsageKb: status === 'MEMORY_LIMIT_EXCEEDED' ? problem.memoryLimitMb * 1024 : 6976,
    cases, simulation: true }
}
export const executionService = {
  async runCode(request: CodeExecutionRequest, signal?: AbortSignal): Promise<CodeExecutionResult> {
    validateSource(request); assertLiveContest(request.contestId)
    const scenario = mockControls.runScenario
    await delay(850, signal)
    if (scenario === 'NETWORK_ERROR') throw new ArenaServiceError('The simulated execution request failed. Your draft was preserved. Retry when ready.')
    return executionFixture(request, scenario)
  },
}
