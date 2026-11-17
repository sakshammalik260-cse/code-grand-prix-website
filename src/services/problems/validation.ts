import type { ProblemInput, TestCaseInput, ContestRound } from '../../types/problems'
const languageIds=['python','java','cpp','javascript']
export function validateProblem(input:ProblemInput):string[] {
  const errors:string[]=[]
  if(!input.title.trim() || input.title.length>160)errors.push('Title is required and must be at most 160 characters.')
  if(!input.statement.some(line=>line.trim()))errors.push('Add a problem description.')
  if(!['Easy','Medium','Hard'].includes(input.difficulty))errors.push('Select a valid difficulty.')
  if(!Number.isFinite(input.points)||input.points<1||input.points>10000)errors.push('Maximum points must be between 1 and 10,000.')
  if(!input.inputFormat.some(line=>line.trim())||!input.outputFormat.trim()||!input.constraints.some(line=>line.trim()))errors.push('Input format, output format and constraints are required.')
  if(!input.allowedLanguages.length || input.allowedLanguages.some(id=>!languageIds.includes(id)))errors.push('Choose at least one supported programming language.')
  if(!Number.isInteger(input.timeLimitMs)||input.timeLimitMs<100||input.timeLimitMs>60000)errors.push('Time limit must be an integer from 100 to 60,000 ms.')
  if(!Number.isInteger(input.memoryLimitMb)||input.memoryLimitMb<16||input.memoryLimitMb>4096)errors.push('Memory limit must be an integer from 16 to 4,096 MB.')
  if(!input.samples.length || input.samples.some(sample=>!sample.input.trim()||!sample.output.trim()))errors.push('Add at least one complete public sample input and output.')
  return errors
}
export function validateTestCase(input:TestCaseInput):string[] {
  return [!input.input.trim()?'Test input is required.':'',!input.expectedOutput.trim()?'Expected output is required.':'',!['PUBLIC','HIDDEN'].includes(input.visibility)?'Select a valid visibility.':'',input.weight!==null&&(!Number.isFinite(input.weight)||input.weight<=0)?'Weight must be a positive number or blank.':''].filter(Boolean)
}
export function validateRound(input:ContestRound):string[] {
  return [!input.id.trim()||!input.title.trim()?'Round ID and title are required.':'',!['WAITING','LIVE','PAUSED_BY_ORGANIZER','FINISHED'].includes(input.status)?'Choose a valid competition status.':'',!Number.isFinite(Date.parse(input.startsAt))||!Number.isFinite(Date.parse(input.endsAt))||Date.parse(input.endsAt)<=Date.parse(input.startsAt)?'Round end must be after a valid start time.':''].filter(Boolean)
}
