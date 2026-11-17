import type { AdminHint,HintReceipt,MockScoreRecord,CandidateHint } from '../../types/assist'
export const potentialScore=(maximum:number,penalty:number)=>Math.max(0,maximum-penalty)
export function validateHints(hints:AdminHint[]):string[]{
 const errors:string[]=[]
 if(new Set(hints.map(h=>h.id)).size!==hints.length)errors.push('Hint IDs must be unique.')
 if(new Set(hints.map(h=>h.order)).size!==hints.length)errors.push('Hint order must be unique.')
 hints.forEach((hint,index)=>{
  if(typeof hint.id!=='string'||!hint.id.trim())errors.push(`Hint ${index+1} needs an ID.`)
  if(!Number.isInteger(hint.order)||hint.order<1)errors.push(`Hint ${index+1} needs a positive integer order.`)
  if(!Number.isInteger(hint.deductionPoints)||hint.deductionPoints<0)errors.push(`Hint ${index+1} deduction must be a non-negative integer.`)
  if(typeof hint.content!=='string'||!hint.content.trim())errors.push(`Hint ${index+1} content is required.`)
 });return errors
}
export function receiptsFor(receipts:Record<string,HintReceipt>,contestId:string,driverId:string,problemId?:string){return Object.values(receipts).filter(r=>r.contestId===contestId&&r.driverId===driverId&&(!problemId||r.problemId===problemId))}
export function netEarnedScore(score:MockScoreRecord,receipts:HintReceipt[]){return Object.entries(score.earnedByProblem).reduce((sum,[problemId,points])=>sum+potentialScore(points,receipts.filter(r=>r.problemId===problemId).reduce((n,r)=>n+r.hint.deductionPoints,0)),0)}

export function candidateHints(configuration:AdminHint[],receipts:HintReceipt[],problemId:string):CandidateHint[]{
 const hints:CandidateHint[]=configuration.map(h=>{
  const paid=receipts.find(r=>r.hint.id===h.id)
  return paid?{...paid.hint,order:h.order}:{id:h.id,problemId,order:h.order,deductionPoints:h.deductionPoints,status:'LOCKED'}
 })
 let order=Math.max(0,...hints.map(h=>h.order))
 for(const paid of receipts)if(!hints.some(h=>h.id===paid.hint.id))hints.push({...paid.hint,order:++order})
 return hints.sort((a,b)=>a.order-b.order)
}
