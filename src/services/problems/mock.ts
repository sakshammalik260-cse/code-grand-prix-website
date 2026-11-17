import { authService } from '../auth'
import { mockProblems } from '../../data/problems'
import { getMockContest,setMockContest } from '../arena/mockState'
import { event } from '../../data/event'
import { ledgerTransaction } from '../monitoring/ledger'
import { questionPayload } from './contracts'
import { validateProblem, validateRound, validateTestCase } from './validation'
import type { AdminProblem,AdminProblemService,AdminTestCase,CandidateProblemService,ContestRound,TestCaseInput } from '../../types/problems'
import type { Problem } from '../../types/arena'
interface DemoCatalog {questions:AdminProblem[];cases:AdminTestCase[];rounds:ContestRound[]}
const storageKey='cgp-development-question-catalog-v1'
export function readDemoCatalog():DemoCatalog {
  const raw=localStorage.getItem(storageKey)
  if(raw){try{return JSON.parse(raw) as DemoCatalog}catch{throw new Error('Demo catalog is unreadable. Ask an organizer to restore it.')}}
  const contest=getMockContest()
  return {questions:mockProblems.map(problem=>({...problem,allowedLanguages:['python','java','cpp','javascript'],roundId:event.contestId,status:'PUBLISHED',publishAt:null,revision:1,hints:problem.id==='p2'?[{id:'demo-pit-hint-1',order:1,deductionPoints:10,content:'Check the requirement for distinct stops before choosing a strategy.'},{id:'demo-pit-hint-2',order:2,deductionPoints:20,content:'An intermediate total can exceed a 32-bit integer. Choose a suitable numeric type.'}]:[]})),cases:[],rounds:[{id:event.contestId,title:'Round 01',status:contest.status,startsAt:contest.contestStartTime,endsAt:contest.contestEndTime,resultsVisible:false}]}
}
function write(data:DemoCatalog){localStorage.setItem(storageKey,JSON.stringify(data))}
async function requireRole(roles:string[],signal?:AbortSignal){
  if(signal?.aborted)throw new DOMException('Request cancelled','AbortError')
  const user=await authService.me(signal)
  if(!user||!roles.includes(user.role))throw Object.assign(new Error('This account does not have permission for this operation.'),{response:{status:user?403:401}})
}
function find(data:DemoCatalog,id:string){const q=data.questions.find(q=>q.id===id);if(!q)throw new Error('Question unavailable. Refresh the catalog.');return q}
function checkRevision(q:AdminProblem,revision:number){if(q.revision!==revision)throw new Error('Question changed in another tab. Reload before saving.')}
function assertValid(errors:string[]){if(errors.length)throw new Error(errors.join(' '))}
function publicProblem(q:AdminProblem):Problem {
  return {id:q.id,number:q.number,title:q.title,difficulty:q.difficulty,points:q.points,statement:q.statement,inputFormat:q.inputFormat,outputFormat:q.outputFormat,constraints:q.constraints,samples:q.samples,timeLimitMs:q.timeLimitMs,memoryLimitMb:q.memoryLimitMb,expectedTimeComplexity:q.expectedTimeComplexity,expectedSpaceComplexity:q.expectedSpaceComplexity,allowedLanguages:q.allowedLanguages}
}
function mutate(id:string,revision:number,change:(question:AdminProblem,data:DemoCatalog)=>void){const data=readDemoCatalog();const q=find(data,id);checkRevision(q,revision);change(q,data);q.revision++;write(data);return q}
function sanitizeCase(id:string,problemId:string,input:TestCaseInput):AdminTestCase {
  return {id,problemId,visibility:input.visibility,weight:input.weight,...(input.visibility==='PUBLIC'?{input:input.input,expectedOutput:input.expectedOutput}:{})}
}
function synchronizeSamples(data:DemoCatalog,problemId:string){
  const q=find(data,problemId)
  const original=q.samples.filter(sample=>!sample.id.startsWith('case-'))
  q.samples=[...original,...data.cases.filter(c=>c.problemId===problemId&&c.visibility==='PUBLIC').map(c=>({id:c.id,input:c.input!,output:c.expectedOutput!,explanation:'Public test case supplied by organizers.'}))];q.revision++
}
export const mockAdminProblems:AdminProblemService={
  async overview(signal){await requireRole(['ADMIN'],signal);const data=readDemoCatalog();const participants=await ledgerTransaction(false,ledger=>Object.keys(ledger.sessions).length);return {totalQuestions:data.questions.length,draftQuestions:data.questions.filter(q=>q.status==='DRAFT').length,publishedQuestions:data.questions.filter(q=>q.status==='PUBLISHED'||q.status==='SCHEDULED'&&Date.parse(q.publishAt!)<=Date.now()).length,competitionStatus:getMockContest().status,participants,activeRounds:data.rounds.filter(r=>r.id===event.contestId?getMockContest().status==='LIVE':r.status==='LIVE').length}},
  async list(signal){await requireRole(['ADMIN'],signal);return readDemoCatalog().questions},
  async get(id,signal){await requireRole(['ADMIN'],signal);return find(readDemoCatalog(),id)},
  async create(input){await requireRole(['ADMIN']);assertValid(validateProblem(input));const data=readDemoCatalog();const q:AdminProblem={...questionPayload(input),id:crypto.randomUUID(),number:Math.max(0,...data.questions.map(q=>q.number))+1,status:'DRAFT',publishAt:null,revision:1};data.questions.push(q);write(data);return q},
  async update(id,input,revision){await requireRole(['ADMIN']);assertValid(validateProblem(input));return mutate(id,revision,q=>{if(q.status!=='DRAFT')throw new Error('Unpublish or cancel the schedule before editing.');Object.assign(q,questionPayload(input))})},
  async deleteDraft(id,revision){await requireRole(['ADMIN']);const data=readDemoCatalog();const q=find(data,id);checkRevision(q,revision);if(q.status!=='DRAFT')throw new Error('Only draft questions can be deleted.');data.questions=data.questions.filter(q=>q.id!==id);data.cases=data.cases.filter(c=>c.problemId!==id);write(data)},
  async publish(id,request){await requireRole(['ADMIN']);return mutate(id,request.expectedRevision,(q,data)=>{assertValid(validateProblem(q));if(!q.roundId||!data.rounds.some(r=>r.id===q.roundId))throw new Error('Assign an existing round before publication.');if(request.publishAt&&(!Number.isFinite(Date.parse(request.publishAt))||Date.parse(request.publishAt)<=Date.now()))throw new Error('Choose a future publication time.');q.status=request.publishAt?'SCHEDULED':'PUBLISHED';q.publishAt=request.publishAt})},
  async unpublish(id,revision){await requireRole(['ADMIN']);return mutate(id,revision,q=>{q.status='DRAFT';q.publishAt=null})},
  async assign(roundId,problemId,revision){await requireRole(['ADMIN']);return mutate(problemId,revision,(q,data)=>{if(q.status!=='DRAFT')throw new Error('Unpublish before changing the assigned round.');if(!data.rounds.some(r=>r.id===roundId))throw new Error('Round not found.');q.roundId=roundId})},
  async cases(id,signal){await requireRole(['ADMIN'],signal);const data=readDemoCatalog();find(data,id);return data.cases.filter(c=>c.problemId===id)},
  async addCase(id,input){await requireRole(['ADMIN']);assertValid(validateTestCase(input));const data=readDemoCatalog();if(find(data,id).status!=='DRAFT')throw new Error('Unpublish before changing test cases.');const item=sanitizeCase('case-'+crypto.randomUUID(),id,input);data.cases.push(item);synchronizeSamples(data,id);write(data);return item},
  async updateCase(id,input){await requireRole(['ADMIN']);assertValid(validateTestCase(input));const data=readDemoCatalog();const previous=data.cases.find(c=>c.id===id);if(!previous)throw new Error('Test case unavailable.');if(find(data,previous.problemId).status!=='DRAFT')throw new Error('Unpublish before changing test cases.');const item=sanitizeCase(id,previous.problemId,input);data.cases=data.cases.map(c=>c.id===id?item:c);synchronizeSamples(data,item.problemId);write(data);return item},
  async deleteCase(id){await requireRole(['ADMIN']);const data=readDemoCatalog();const item=data.cases.find(c=>c.id===id);if(!item)throw new Error('Test case unavailable.');if(find(data,item.problemId).status!=='DRAFT')throw new Error('Unpublish before changing test cases.');data.cases=data.cases.filter(c=>c.id!==id);synchronizeSamples(data,item.problemId);write(data)},
  async rounds(signal){await requireRole(['ADMIN'],signal);return readDemoCatalog().rounds.map(r=>r.id===getMockContest().id?{...r,status:getMockContest().status}:r)},
  async saveRound(input){await requireRole(['ADMIN']);assertValid(validateRound(input));const data=readDemoCatalog();data.rounds=[...data.rounds.filter(r=>r.id!==input.id),input];write(data);if(input.id===event.contestId){const previous=getMockContest();setMockContest({...previous,title:previous.title,round:input.title,status:input.status,contestStartTime:input.startsAt,contestEndTime:input.endsAt,pausedAt:input.status==='PAUSED_BY_ORGANIZER'?new Date().toISOString():undefined})};return input},
}
export function eligibleQuestions(){
 const contest=getMockContest(),data=readDemoCatalog()
 if(contest.status==='WAITING'||Date.now()<Date.parse(contest.contestStartTime)||!data.rounds.some(r=>r.id===contest.id))return []
 return data.questions.filter(q=>q.roundId===contest.id&&(q.status==='PUBLISHED'||q.status==='SCHEDULED'&&Date.parse(q.publishAt!)<=Date.now()))
}
export const mockCandidateProblems:CandidateProblemService={
 async list(signal){await requireRole(['CANDIDATE'],signal);return eligibleQuestions().map(q=>({id:q.id,number:q.number,title:q.title,difficulty:q.difficulty,points:q.points,allowedLanguages:q.allowedLanguages}))},
 async get(id,signal){await requireRole(['CANDIDATE'],signal);const q=eligibleQuestions().find(q=>q.id===id);if(!q)throw new Error('This question is unpublished, unreleased or unavailable for your round. Your saved draft is preserved.');return publicProblem(q)},
 async resultsVisibility(signal){await requireRole(['CANDIDATE','ADMIN'],signal);return {visible:readDemoCatalog().rounds.find(r=>r.id===event.contestId)?.resultsVisible===true}},
}
