import type { AdminOverview, ContestRound, ProblemInput } from '../../types/problems'
import type { Problem,ProblemSummary } from '../../types/arena'
const supportedLanguages=['cpp','python','java','javascript']
const phases = ['WAITING', 'LIVE', 'PAUSED_BY_ORGANIZER', 'FINISHED']
const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
const isActiveRound = (value: unknown): value is ContestRound => {
  if (typeof value !== 'object' || value === null) return false
  const round = value as Partial<ContestRound>
  return typeof round.id === 'string' && !!round.id && typeof round.title === 'string' &&
    round.status === 'LIVE' && typeof round.resultsVisible === 'boolean' &&
    typeof round.startsAt === 'string' && Number.isFinite(Date.parse(round.startsAt)) &&
    typeof round.endsAt === 'string' && Date.parse(round.endsAt) > Date.parse(round.startsAt)
}

export function parseAdminOverview(value: unknown): AdminOverview {
  const overview = value as Partial<AdminOverview> | null
  if (!overview || typeof overview !== 'object' ||
      !isCount(overview.totalQuestions) || !isCount(overview.draftQuestions) ||
      !isCount(overview.publishedQuestions) || !isCount(overview.participants) ||
      typeof overview.competitionStatus !== 'string' || !phases.includes(overview.competitionStatus) ||
      !isCount(overview.activeRoundCount) || !Array.isArray(overview.activeRounds) ||
      overview.activeRounds.length !== overview.activeRoundCount || !overview.activeRounds.every(isActiveRound)) {
    throw new Error('Race Control returned an invalid administration overview.')
  }
  return overview as AdminOverview
}
// Whitelist fields so administration metadata never enters candidate rendering or draft requests.
export function questionPayload(value:ProblemInput):ProblemInput {
 return {title:value.title,difficulty:value.difficulty,points:value.points,statement:value.statement,inputFormat:value.inputFormat,outputFormat:value.outputFormat,constraints:value.constraints,samples:value.samples.map(s=>({id:s.id,input:s.input,output:s.output,explanation:s.explanation})),timeLimitMs:value.timeLimitMs,memoryLimitMb:value.memoryLimitMb,expectedTimeComplexity:value.expectedTimeComplexity,expectedSpaceComplexity:value.expectedSpaceComplexity,allowedLanguages:value.allowedLanguages,roundId:value.roundId,order:value.order,hints:(value.hints||[]).map(h=>({id:h.id,order:h.order,deductionPoints:h.deductionPoints,content:h.content}))}
}
function record(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object')throw new Error('Invalid question response. Refresh or contact race control.');return value as Record<string,unknown>}
function assertPublic(value:Record<string,unknown>){
 if(['hiddenTests','hiddenTestCases','testcases','referenceSolution','solution','hints'].some(key=>key in value)||('status'in value&&value.status!=='PUBLISHED'))throw new Error('The question response does not match the public contest contract. Contact race control.')
}
export function parseProblemSummary(value:unknown):ProblemSummary {
 const item=record(value);assertPublic(item)
 if(typeof item.id!=='string'||!item.id||typeof item.title!=='string'||!Number.isInteger(item.number)||typeof item.points!=='number'||!Number.isFinite(item.points)||!['Easy','Medium','Hard'].includes(item.difficulty as string)||!Array.isArray(item.allowedLanguages)||!item.allowedLanguages.length||item.allowedLanguages.some(id=>!supportedLanguages.includes(id)))throw new Error('The question summary is incomplete or invalid. Contact race control.')
 const q=item as unknown as ProblemSummary
 return {id:q.id,number:q.number,title:q.title,difficulty:q.difficulty,points:q.points,allowedLanguages:q.allowedLanguages}
}
export function parsePublicProblem(value:unknown):Problem {
 const summary=parseProblemSummary(value),item=record(value)
 if(['statement','inputFormat','constraints'].some(key=>!Array.isArray(item[key])||(item[key] as unknown[]).some(line=>typeof line!=='string'))||typeof item.outputFormat!=='string'||!Array.isArray(item.samples)||item.samples.some(sample=>!sample||['id','input','output','explanation'].some(key=>typeof sample[key]!=='string'))||typeof item.timeLimitMs!=='number'||item.timeLimitMs<=0||typeof item.memoryLimitMb!=='number'||item.memoryLimitMb<=0)throw new Error('The question briefing is incomplete or invalid. Contact race control.')
 const q=item as unknown as Problem
 return {...summary,allowedLanguages:q.allowedLanguages,statement:q.statement,inputFormat:q.inputFormat,outputFormat:q.outputFormat,constraints:q.constraints,samples:q.samples.map(s=>({id:s.id,input:s.input,output:s.output,explanation:s.explanation})),timeLimitMs:q.timeLimitMs,memoryLimitMb:q.memoryLimitMb,expectedTimeComplexity:typeof q.expectedTimeComplexity==='string'?q.expectedTimeComplexity:undefined,expectedSpaceComplexity:typeof q.expectedSpaceComplexity==='string'?q.expectedSpaceComplexity:undefined}
}
