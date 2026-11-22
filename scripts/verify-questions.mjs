import assert from 'node:assert/strict'
import {validateProblem,validateTestCase,validateRound} from '../src/services/problems/validation.ts'
import {parseAdminOverview,questionPayload,parseProblemSummary,parsePublicProblem} from '../src/services/problems/contracts.ts'
const valid={title:'Organizer question',difficulty:'Easy',points:100,statement:['Line one','Line two'],inputFormat:['n values'],outputFormat:'One integer',constraints:['1 <= n <= 100'],samples:[{id:'public-1',input:'2',output:'2',explanation:'Public example'}],timeLimitMs:1000,memoryLimitMb:128,allowedLanguages:['python'],roundId:'r1'}
assert.deepEqual(validateProblem(valid),[])
assert.ok(validateProblem({...valid,title:'',allowedLanguages:[]}).length>=2)
assert.ok(validateProblem({...valid,points:0,timeLimitMs:NaN,memoryLimitMb:-1,samples:[]}).length>=4)
assert.ok(validateProblem({...valid,allowedLanguages:['unsupported']}).length)
console.log('PASS incomplete questions, invalid limits, empty samples and invalid language allowlists cannot publish')
assert.deepEqual(validateTestCase({input:'1',expectedOutput:'1',visibility:'HIDDEN',weight:null}),[])
assert.ok(validateTestCase({input:'',expectedOutput:'',visibility:'PUBLIC',weight:0}).length>=3)
assert.ok(validateRound({id:'r1',title:'Round 1',status:'LIVE',startsAt:'2026-11-23T10:00:00Z',endsAt:'2026-11-23T09:00:00Z'}).length)
console.log('PASS test-case weights and round time windows are validated')
const safe=questionPayload({...valid,id:'admin-id',revision:99,status:'DRAFT',testcases:['metadata']})
assert.equal('status' in safe,false);assert.equal('testcases' in safe,false);assert.equal('revision' in safe,false)
const detail={...valid,id:'q1',number:1,arbitraryAdminField:'excluded'}
assert.equal('roundId' in parsePublicProblem(detail),false)
assert.equal('arbitraryAdminField' in parsePublicProblem(detail),false)
assert.equal('statement' in parseProblemSummary(detail),false)
assert.throws(()=>parsePublicProblem({...detail,hiddenTests:[]}))
assert.throws(()=>parsePublicProblem({...detail,status:'DRAFT'}))
assert.throws(()=>parsePublicProblem({...detail,allowedLanguages:[]}))
console.log('PASS explicit DTO field lists, invalid candidate responses and accidental private/admin payloads are checked')

const round = {id:'r1',title:'Round 1',status:'LIVE',startsAt:'2026-11-23T05:30:00Z',endsAt:'2026-11-23T08:30:00Z',resultsVisible:false}
const overview = {totalQuestions:3,draftQuestions:2,publishedQuestions:1,competitionStatus:'LIVE',participants:40,activeRounds:[round],activeRoundCount:1}
assert.deepEqual(parseAdminOverview(overview).activeRounds,[round])
assert.equal(parseAdminOverview(overview).activeRoundCount,1)
assert.throws(()=>parseAdminOverview({...overview,activeRoundCount:0}))
assert.throws(()=>parseAdminOverview({...overview,activeRounds:1}))
assert.throws(()=>parseAdminOverview({...overview,participants:-1}))
assert.throws(()=>parseAdminOverview({...overview,activeRounds:[{...round,endsAt:'invalid'}]}))
console.log('PASS overview validates counts and retains detailed active rounds')
