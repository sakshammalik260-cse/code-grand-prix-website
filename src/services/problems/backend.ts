import { questionPayload,parseProblemSummary,parsePublicProblem } from './contracts'
import { api } from '../api'
import type { AdminProblemService, CandidateProblemService } from '../../types/problems'
import type { AdminProblem,AdminTestCase,ContestRound,AdminOverview } from '../../types/problems'
export const backendAdminProblems:AdminProblemService={
  async overview(signal){return(await api.get<AdminOverview>('/admin/overview',{signal})).data},
  async list(signal){return(await api.get<AdminProblem[]>('/admin/problems',{signal})).data},
  async get(id,signal){return(await api.get<AdminProblem>(`/admin/problems/${encodeURIComponent(id)}`,{signal})).data},
  async create(input){return(await api.post<AdminProblem>('/admin/problems',questionPayload(input))).data},
  async update(id,input,expectedRevision){return(await api.patch<AdminProblem>(`/admin/problems/${encodeURIComponent(id)}`,{...questionPayload(input),expectedRevision})).data},
  async deleteDraft(id,expectedRevision){await api.delete(`/admin/problems/${encodeURIComponent(id)}`,{data:{expectedRevision}})},
  async publish(id,request){return(await api.post<AdminProblem>(`/admin/problems/${encodeURIComponent(id)}/publish`,request)).data},
  async unpublish(id,expectedRevision){return(await api.post<AdminProblem>(`/admin/problems/${encodeURIComponent(id)}/unpublish`,{expectedRevision})).data},
  async assign(roundId,problemId,expectedRevision){return(await api.post<AdminProblem>(`/admin/rounds/${encodeURIComponent(roundId)}/problems`,{problemId,expectedRevision})).data},
  async cases(id,signal){return(await api.get<AdminTestCase[]>(`/admin/problems/${encodeURIComponent(id)}/testcases`,{signal})).data},
  async addCase(id,input){return(await api.post<AdminTestCase>(`/admin/problems/${encodeURIComponent(id)}/testcases`,input)).data},
  async updateCase(id,input){return(await api.patch<AdminTestCase>(`/admin/testcases/${encodeURIComponent(id)}`,input)).data},
  async deleteCase(id){await api.delete(`/admin/testcases/${encodeURIComponent(id)}`)},
  async rounds(signal){return(await api.get<ContestRound[]>('/admin/rounds',{signal})).data},
  async saveRound(input){return(await api.put<ContestRound>(`/admin/rounds/${encodeURIComponent(input.id)}`,input)).data},
}
export const backendCandidateProblems:CandidateProblemService={
  async list(signal){const data=(await api.get<unknown>('/contest/problems',{signal})).data;if(!Array.isArray(data))throw new Error('Invalid contest question list. Contact race control.');return data.map(parseProblemSummary)},
  async get(id,signal){const problem=parsePublicProblem((await api.get<unknown>(`/contest/problems/${encodeURIComponent(id)}`,{signal})).data);if(problem.id!==id)throw new Error('Question response did not match the selection.');return problem},
  async resultsVisibility(signal){return(await api.get<{visible:boolean}>('/contest/results/visibility',{signal})).data},
}
