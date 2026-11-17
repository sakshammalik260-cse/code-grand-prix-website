import { authService } from '../auth'
import { ledgerTransaction } from '../monitoring/ledger'
import type { Ledger } from '../monitoring/ledger'
import { sessionAllowsExecution } from '../monitoring/sessionRules'
import { mockConnectionAvailable } from '../monitoring/mock'
import { getMockContest,delay } from '../arena/mockState'
import { readDemoCatalog,eligibleQuestions,mockAdminProblems } from '../problems/mock'
import { potentialScore,receiptsFor,netEarnedScore,candidateHints } from './rules'
import type { AdminProblem } from '../../types/problems'
import type { HintService,AdminHintService,LeaderboardService,HintState,UnlockedHint,HintReceipt,MockScoreRecord } from '../../types/assist'
async function candidate(signal?:AbortSignal){
 await delay(100,signal)
 if(!mockConnectionAvailable())throw new Error('Mock connection is offline. No hint was revealed or charged. Reconnect and retry.')
 const user=await authService.me(signal);if(!user||user.role!=='CANDIDATE')throw new Error('A candidate account is required for Race Assist.');return user
}
function question(id:string){const q=eligibleQuestions().find(q=>q.id===id);if(!q)throw new Error('Hints are unavailable for this unpublished or unreleased question.');return q}
function state(ledger:Ledger,q:AdminProblem,driverId:string):HintState{
 const contestId=getMockContest().id,receipts=receiptsFor(ledger.hintUnlocks||{},contestId,driverId,q.id)
 const hints=candidateHints(q.hints||[],receipts,q.id)
 const penalty=receipts.reduce((sum,r)=>sum+r.hint.deductionPoints,0)
 return {contestId,problemId:q.id,configurationRevision:q.revision,maximumPoints:q.points,hints:hints.sort((a,b)=>a.order-b.order),totalHintPenalty:penalty,remainingPotentialScore:potentialScore(q.points,penalty)}
}
export const hintAdapter:HintService={
 async get(id,signal){const user=await candidate(signal);return ledgerTransaction(false,ledger=>state(ledger,question(id),user.id))},
 async unlock(id,hintId,request,signal){
  const user=await candidate(signal)
  return ledgerTransaction(true,ledger=>{
   const q=question(id),contest=getMockContest(),session=Object.values(ledger.sessions).find(s=>s.contestId===contest.id&&s.driverId===user.id)
   if(contest.status!=='LIVE'||Date.now()>=Date.parse(contest.contestEndTime)||!session||session.id!==request.sessionId||!sessionAllowsExecution(session))throw new Error('Race control has not authorized hint unlocking for this session.')
   const key=JSON.stringify([contest.id,user.id,id,hintId]);ledger.hintUnlocks ||= {}
   const previous=ledger.hintUnlocks[key]
   if(previous){const snapshot=state(ledger,q,user.id);return {...snapshot,hint:snapshot.hints.find(h=>h.id===hintId) as UnlockedHint,deductionApplied:0,replayed:true}}
   if(!request.operationId||Object.values(ledger.hintUnlocks).some(r=>r.operationId===request.operationId))throw new Error('This unlock request ID is invalid or already belongs to a different hint.')
   const configured=q.hints?.find(h=>h.id===hintId)
   if(!configured)throw new Error('This hint is no longer available. Refresh Race Assist.')
   if(request.configurationRevision!==q.revision||request.expectedDeductionPoints!==configured.deductionPoints)throw new Error('Hint configuration changed. Refresh and confirm the current deduction before unlocking.')
   const unlocked:UnlockedHint={id:configured.id,problemId:id,order:configured.order,deductionPoints:configured.deductionPoints,status:'UNLOCKED',content:configured.content}
   const receipt:HintReceipt={contestId:contest.id,driverId:user.id,problemId:id,operationId:request.operationId,unlockedAt:new Date().toISOString(),hint:unlocked}
   ledger.hintUnlocks[key]=receipt
   return {...state(ledger,q,user.id),hint:unlocked,deductionApplied:configured.deductionPoints,replayed:false}
  })
 },
}
export const adminHintAdapter:AdminHintService={
 async list(id,signal){return(await mockAdminProblems.get(id,signal)).hints||[]},
 async create(id,hint,revision){const q=await mockAdminProblems.get(id);return(await mockAdminProblems.update(id,{...q,hints:[...(q.hints||[]),hint]},revision)).hints||[]},
 async update(id,hint,revision){const q=(await mockAdminProblems.list()).find(q=>q.hints?.some(h=>h.id===id));if(!q)throw new Error('Hint unavailable.');return(await mockAdminProblems.update(q.id,{...q,hints:q.hints!.map(h=>h.id===id?hint:h)},revision)).hints||[]},
 async remove(id,revision){const q=(await mockAdminProblems.list()).find(q=>q.hints?.some(h=>h.id===id));if(!q)throw new Error('Hint unavailable.');return(await mockAdminProblems.update(q.id,{...q,hints:q.hints!.filter(h=>h.id!==id)},revision)).hints||[]},
}
export const leaderboardAdapter:LeaderboardService={
 async get(signal){
  await delay(100,signal);if(!mockConnectionAvailable())throw new Error('Standings connection is offline. Reconnect to refresh.')
  const user=await authService.me(signal);if(!user||!['CANDIDATE','ADMIN'].includes(user.role))throw new Error('This account cannot view standings.')
  const contest=getMockContest(),catalog=readDemoCatalog(),visible=user.role==='ADMIN'||catalog.rounds.find(r=>r.id===contest.id)?.resultsVisible===true
  return ledgerTransaction(false,ledger=>{
   const common={contestId:contest.id,contestTitle:contest.title,status:contest.status,visible,simulation:true,updatedAt:new Date().toISOString()}
   if(!visible)return {...common,rows:[]}
   const sessions=Object.values(ledger.sessions).filter(s=>s.contestId===contest.id),scores=Object.values(ledger.scores||{}).filter(s=>s.contestId===contest.id)
   const ids=new Set([...sessions.map(s=>s.driverId),...scores.map(s=>s.driverId)]),totalProblems=catalog.questions.filter(q=>q.roundId===contest.id&&(q.status==='PUBLISHED'||q.status==='SCHEDULED'&&Date.parse(q.publishAt!)<=Date.now())).length
   const rows=[...ids].map(driverId=>{
    const score=scores.find(s=>s.driverId===driverId)||{contestId:contest.id,driverId,attemptedProblemIds:[],earnedByProblem:{}} satisfies MockScoreRecord
    const receipts=receiptsFor(ledger.hintUnlocks||{},contest.id,driverId)
    return {rank:0,driverId,problemsSolved:Object.keys(score.earnedByProblem).length,totalProblems:Math.max(totalProblems,Object.keys(score.earnedByProblem).length),totalScore:netEarnedScore(score,receipts),totalHintPenalties:receipts.reduce((sum,r)=>sum+r.hint.deductionPoints,0),status:contest.status==='FINISHED'?'FINISHED' as const:sessions.find(s=>s.driverId===driverId)?.status||'WAITING' as const}
   }).sort((a,b)=>b.totalScore-a.totalScore||b.problemsSolved-a.problemsSolved||a.driverId.localeCompare(b.driverId)).map((row,index)=>({...row,rank:index+1}))
   return {...common,rows}
  })
 },
}
