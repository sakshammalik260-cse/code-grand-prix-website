export type LanguageId = 'python' | 'java' | 'cpp' | 'javascript'
export interface ProgrammingLanguage { id: LanguageId; label: string; fileName: string }
export type ProblemDifficulty = 'Easy' | 'Medium' | 'Hard'
export interface PublicSample { id: string; input: string; output: string; explanation: string }
export interface ProblemSummary {
  id: string
  number: number
  title: string
  difficulty: ProblemDifficulty
  points: number
}
export interface Problem extends ProblemSummary {
  statement: string[]
  inputFormat: string[]
  outputFormat: string
  constraints: string[]
  samples: PublicSample[]
  timeLimitMs: number
  memoryLimitMb: number
  expectedTimeComplexity?: string
  expectedSpaceComplexity?: string
}
export type ContestPhase = 'WAITING' | 'LIVE' | 'PAUSED_BY_ORGANIZER' | 'FINISHED'
export interface ContestState {
  id: string
  title: string
  round: string
  status: ContestPhase
  contestStartTime: string
  contestEndTime: string
  serverTime: string
  pausedAt?: string
  simulation: boolean
}
export type Verdict = 'ACCEPTED' | 'WRONG_ANSWER' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED'
export type SubmissionStatus = 'QUEUED' | 'RUNNING' | Verdict
export type MockScenario = Verdict | 'NETWORK_ERROR'
export interface CodeExecutionRequest {
  sessionId: string
  contestId: string
  driverId: string
  problemId: string
  language: LanguageId
  sourceCode: string
  customInput?: string
}
export interface SampleCaseResult {
  id: string
  label: string
  input: string
  expectedOutput: string | null
  stdout: string
  stderr: string
  status: Verdict
}
export interface CodeExecutionResult {
  id: string
  problemId: string
  language: LanguageId
  status: Verdict
  stdout: string
  stderr: string
  expectedOutput: string | null
  executionTimeMs: number
  memoryUsageKb: number
  cases: SampleCaseResult[]
  simulation: boolean
}
export interface SubmissionRequest {
  sessionId: string
  contestId: string
  driverId: string
  problemId: string
  language: LanguageId
  sourceCode: string
}
export interface SubmissionResult {
  id: string
  contestId: string
  driverId: string
  problemId: string
  language: LanguageId
  status: SubmissionStatus
  submittedAt: string
  simulation: boolean
  execution?: CodeExecutionResult
}
export interface DriverProgress {
  contestId: string
  driverId: string
  totalProblems: number
  attemptedProblemIds: string[]
  solvedProblemIds: string[]
  currentScore: number
  simulation: boolean
}
export interface ArenaSession { driverId: string; active: boolean; simulation: boolean }
export interface ArenaServiceContract {
  getContest(signal?: AbortSignal): Promise<ContestState>
  listProblems(signal?: AbortSignal): Promise<ProblemSummary[]>
  getProblem(id: string, signal?: AbortSignal): Promise<Problem>
  runCode(request: CodeExecutionRequest, signal?: AbortSignal): Promise<CodeExecutionResult>
  submitCode(request: SubmissionRequest, signal?: AbortSignal): Promise<SubmissionResult>
  getSubmission(id: string, signal?: AbortSignal): Promise<SubmissionResult>
  getSession(driverId: string, signal?: AbortSignal): Promise<ArenaSession>
  getProgress(contestId: string, driverId: string, signal?: AbortSignal): Promise<DriverProgress>
}
