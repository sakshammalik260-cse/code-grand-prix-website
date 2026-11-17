import { api } from '../api'
import { parseHintState,parseHintUnlock,parseLeaderboard } from './contracts'
import type { HintService,AdminHintService,LeaderboardService,HintState,HintUnlockResult,LeaderboardSnapshot,AdminHint } from '../../types/assist'
export const hintAdapter:HintService={
 async get(id,signal){return parseHintState((await api.get<HintState>(`/contest/problems/${encodeURIComponent(id)}/hints`,{signal})).data,id)},
 async unlock(id,hintId,request,signal){return parseHintUnlock((await api.post<HintUnlockResult>(`/contest/problems/${encodeURIComponent(id)}/hints/${encodeURIComponent(hintId)}/unlock`,request,{signal,headers:{'Idempotency-Key':request.operationId}})).data,id,hintId)},
}
export const adminHintAdapter:AdminHintService={
 async list(id,signal){return(await api.get<AdminHint[]>(`/admin/problems/${encodeURIComponent(id)}/hints`,{signal})).data},
 async create(id,hint,expectedRevision){return(await api.post<AdminHint[]>(`/admin/problems/${encodeURIComponent(id)}/hints`,{hint,expectedRevision})).data},
 async update(id,hint,expectedRevision){return(await api.patch<AdminHint[]>(`/admin/hints/${encodeURIComponent(id)}`,{hint,expectedRevision})).data},
 async remove(id,expectedRevision){return(await api.delete<AdminHint[]>(`/admin/hints/${encodeURIComponent(id)}`,{data:{expectedRevision}})).data},
}
export const leaderboardAdapter:LeaderboardService={async get(signal){return parseLeaderboard((await api.get<LeaderboardSnapshot>('/leaderboard',{signal})).data)}}
