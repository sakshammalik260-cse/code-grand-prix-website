import type { CandidateHint,HintState,HintUnlockResult,LeaderboardSnapshot } from '../../types/assist'
function integer(value:unknown){return typeof value==='number'&&Number.isFinite(value)&&Number.isInteger(value)&&value>=0}
function hint(value:CandidateHint,problemId:string):CandidateHint{
 if(!value||typeof value.id!=='string'||value.problemId!==problemId||!integer(value.order)||value.order<1||!integer(value.deductionPoints)||!['LOCKED','UNLOCKED'].includes(value.status))throw new Error('Invalid hint metadata. Contact race control.')
 if(value.status==='LOCKED' && 'content' in value)throw new Error('Locked hint content must not be sent to candidates. Contact race control.')
 const metadata={id:value.id,problemId:value.problemId,order:value.order,deductionPoints:value.deductionPoints}
 if(value.status==='UNLOCKED'){if(typeof value.content!=='string'||!value.content.trim())throw new Error('The unlocked hint is incomplete.');return {...metadata,status:'UNLOCKED',content:value.content}}
 return {...metadata,status:'LOCKED'}
}
export function parseHintState(value:HintState,problemId:string,contestId?:string):HintState{
 if(!value||value.problemId!==problemId||typeof value.contestId!=='string'||contestId&&value.contestId!==contestId||!integer(value.configurationRevision)||!integer(value.maximumPoints)||!integer(value.totalHintPenalty)||!integer(value.remainingPotentialScore)||value.remainingPotentialScore>value.maximumPoints||!Array.isArray(value.hints))throw new Error('Hint response could not be verified. Refresh hint status to reconcile the request.')
 const hints=value.hints.map(h=>hint(h,problemId));if(new Set(hints.map(h=>h.id)).size!==hints.length)throw new Error('Duplicate hint identifiers in service response.')
 return {contestId:value.contestId,problemId,configurationRevision:value.configurationRevision,maximumPoints:value.maximumPoints,totalHintPenalty:value.totalHintPenalty,remainingPotentialScore:value.remainingPotentialScore,hints}
}
export function parseHintUnlock(value:HintUnlockResult,problemId:string,hintId:string,contestId?:string):HintUnlockResult{
 const state=parseHintState(value,problemId,contestId),unlocked=hint(value.hint,problemId)
 if(unlocked.id!==hintId||unlocked.status!=='UNLOCKED'||!state.hints.some(h=>h.id===hintId&&h.status==='UNLOCKED')||!integer(value.deductionApplied)||typeof value.replayed!=='boolean')throw new Error('Unlock acknowledgment could not be verified. Refresh hint status before retrying.')
 return {...state,hint:unlocked,deductionApplied:value.deductionApplied,replayed:value.replayed}
}
export function parseLeaderboard(value:LeaderboardSnapshot):LeaderboardSnapshot{
 if(!value||typeof value.visible!=='boolean'||typeof value.simulation!=='boolean'||typeof value.contestId!=='string'||typeof value.contestTitle!=='string'||!['WAITING','LIVE','PAUSED_BY_ORGANIZER','FINISHED'].includes(value.status)||!Number.isFinite(Date.parse(value.updatedAt))||!Array.isArray(value.rows))throw new Error('Standings response could not be verified.')
 if(!value.visible)return {...value,rows:[]}
 if(value.rows.some(r=>!integer(r.rank)||r.rank<1||typeof r.driverId!=='string'||!integer(r.problemsSolved)||!integer(r.totalProblems)||r.problemsSolved>r.totalProblems||!integer(r.totalScore)||!integer(r.totalHintPenalties)||!['ACTIVE','LOCK_PENDING','LOCKED','UNDER_REVIEW','RESUME_AUTHORIZED','FINISHED','WAITING'].includes(r.status)))throw new Error('Standings contain invalid values.')
 return {...value,rows:value.rows.map(r=>({rank:r.rank,driverId:r.driverId,problemsSolved:r.problemsSolved,totalProblems:r.totalProblems,totalScore:r.totalScore,totalHintPenalties:r.totalHintPenalties,status:r.status}))}
}
