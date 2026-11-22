import type { AdminHint } from './assist'
import type { LanguageId, Problem, ProblemSummary, ContestPhase } from './arena'
export type PublicationStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED'
export interface AdminProblem extends Problem {
  hints?: AdminHint[]
  allowedLanguages: LanguageId[]
  roundId: string | null
  order?: number
  status: PublicationStatus
  publishAt: string | null
  revision: number
}
export type ProblemInput = Omit<AdminProblem,'id'|'number'|'revision'|'status'|'publishAt'>
export interface PublishRequest { publishAt: string | null; expectedRevision: number }
export interface TestCaseInput { input: string; expectedOutput: string; visibility: 'PUBLIC'|'HIDDEN'; weight: number | null; expectedRevision?: number }
// Hidden case content is write-only. Admin lists return metadata for hidden cases.
export interface AdminTestCase { id: string; problemId: string; visibility: 'PUBLIC'|'HIDDEN'; weight: number | null; input?: string; expectedOutput?: string }
export interface ContestRound { id: string; title: string; status: ContestPhase; startsAt: string; endsAt: string; resultsVisible: boolean; questionsVisible?: boolean }
export interface AdminOverview {
  totalQuestions: number
  draftQuestions: number
  publishedQuestions: number
  competitionStatus: ContestPhase
  participants: number
  activeRounds: ContestRound[]
  activeRoundCount: number
}
export interface AdminProblemService {
  overview(signal?:AbortSignal):Promise<AdminOverview>
  list(signal?:AbortSignal):Promise<AdminProblem[]>
  get(id:string,signal?:AbortSignal):Promise<AdminProblem>
  create(input:ProblemInput):Promise<AdminProblem>
  update(id:string,input:ProblemInput,expectedRevision:number):Promise<AdminProblem>
  deleteDraft(id:string,expectedRevision:number):Promise<void>
  publish(id:string,request:PublishRequest):Promise<AdminProblem>
  unpublish(id:string,expectedRevision:number):Promise<AdminProblem>
  assign(roundId:string,problemId:string,expectedRevision:number):Promise<AdminProblem>
  cases(problemId:string,signal?:AbortSignal):Promise<AdminTestCase[]>
  addCase(problemId:string,input:TestCaseInput):Promise<AdminTestCase>
  updateCase(id:string,input:TestCaseInput):Promise<AdminTestCase>
  deleteCase(id:string):Promise<void>
  getLeaderboardVisibility?(signal?: AbortSignal): Promise<{ visible: boolean }>
  setLeaderboardVisibility?(visible: boolean): Promise<{ visible: boolean }>
  rounds(signal?:AbortSignal):Promise<ContestRound[]>
  saveRound(input:ContestRound):Promise<ContestRound>
}
export interface CandidateProblemService {
  list(signal?:AbortSignal):Promise<ProblemSummary[]>
  get(id:string,signal?:AbortSignal):Promise<Problem>
  resultsVisibility(signal?:AbortSignal):Promise<{visible:boolean}>
}
