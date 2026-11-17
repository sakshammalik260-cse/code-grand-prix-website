import type { LanguageId, Problem, ProblemSummary, ContestPhase } from './arena'
export type PublicationStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED'
export interface AdminProblem extends Problem {
  allowedLanguages: LanguageId[]
  roundId: string | null
  status: PublicationStatus
  publishAt: string | null
  revision: number
}
export type ProblemInput = Omit<AdminProblem,'id'|'number'|'revision'|'status'|'publishAt'>
export interface PublishRequest { publishAt: string | null; expectedRevision: number }
export interface TestCaseInput { input: string; expectedOutput: string; visibility: 'PUBLIC'|'HIDDEN'; weight: number | null }
// Hidden case content is write-only. Admin lists return metadata for hidden cases.
export interface AdminTestCase { id: string; problemId: string; visibility: 'PUBLIC'|'HIDDEN'; weight: number | null; input?: string; expectedOutput?: string }
export interface ContestRound { id: string; title: string; status: ContestPhase; startsAt: string; endsAt: string; resultsVisible: boolean }
export interface AdminOverview { totalQuestions:number; draftQuestions:number; publishedQuestions:number; competitionStatus:string; participants:number; activeRounds:number }
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
  rounds(signal?:AbortSignal):Promise<ContestRound[]>
  saveRound(input:ContestRound):Promise<ContestRound>
}
export interface CandidateProblemService {
  list(signal?:AbortSignal):Promise<ProblemSummary[]>
  get(id:string,signal?:AbortSignal):Promise<Problem>
  resultsVisibility(signal?:AbortSignal):Promise<{visible:boolean}>
}
