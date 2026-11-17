import { ledgerTransaction } from '../monitoring/ledger'
import { receiptsFor,netEarnedScore } from '../assist/rules'
import type { DriverProgress } from '../../types/arena'
const key=(contestId:string,driverId:string)=>JSON.stringify([contestId,driverId])
export async function readProgress(contestId:string,driverId:string):Promise<DriverProgress>{
 return ledgerTransaction(false,ledger=>{
  const score=ledger.scores?.[key(contestId,driverId)]||{contestId,driverId,attemptedProblemIds:[],earnedByProblem:{}}
  return {contestId,driverId,totalProblems:0,attemptedProblemIds:score.attemptedProblemIds,solvedProblemIds:Object.keys(score.earnedByProblem),currentScore:netEarnedScore(score,receiptsFor(ledger.hintUnlocks||{},contestId,driverId)),simulation:true}
 })
}
export async function updateMockProgress(contestId:string,driverId:string,problemId:string,accepted:boolean,points=0){
 await ledgerTransaction(true,ledger=>{
  ledger.scores ||= {};const score=ledger.scores[key(contestId,driverId)]||{contestId,driverId,attemptedProblemIds:[],earnedByProblem:{}}
  score.attemptedProblemIds=[...new Set([...score.attemptedProblemIds,problemId])]
  if(accepted && !(problemId in score.earnedByProblem))score.earnedByProblem[problemId]=points
  ledger.scores[key(contestId,driverId)]=score
 })
}
