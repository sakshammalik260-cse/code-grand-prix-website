import assert from 'node:assert/strict'
import {validateHints,potentialScore,netEarnedScore,candidateHints} from '../src/services/assist/rules.ts'
import {parseHintState,parseHintUnlock,parseLeaderboard} from '../src/services/assist/contracts.ts'
const hints=[{id:'h1',order:1,deductionPoints:10,content:'Review input boundaries.'},{id:'h2',order:2,deductionPoints:20,content:'Review numeric types.'}]
assert.deepEqual(validateHints(hints),[])
assert.ok(validateHints([hints[0],hints[0]]).length>=2)
assert.ok(validateHints([{...hints[0],deductionPoints:-1,content:''}]).length>=2)
assert.ok(validateHints([{...hints[0],deductionPoints:1.5}]).length)
assert.equal(potentialScore(100,30),70);assert.equal(potentialScore(100,200),0)
console.log('PASS hint identity/order/content/cost validation and non-negative potential score')
const locked={id:'h1',problemId:'p1',order:1,deductionPoints:10,status:'LOCKED'}
const state={contestId:'c1',problemId:'p1',configurationRevision:1,maximumPoints:100,hints:[locked],totalHintPenalty:0,remainingPotentialScore:100}
assert.equal('content' in parseHintState(state,'p1').hints[0],false)
assert.throws(()=>parseHintState({...state,hints:[{...locked,content:'Must not be sent'}]},'p1'))
assert.throws(()=>parseHintState({...state,problemId:'another'},'p1'))
const unlocked={...locked,status:'UNLOCKED',content:'Review input boundaries.'}
assert.equal(parseHintUnlock({...state,hints:[unlocked],hint:unlocked,deductionApplied:10,replayed:false,totalHintPenalty:10,remainingPotentialScore:90},'p1','h1').hint.content,unlocked.content)
assert.throws(()=>parseHintUnlock({...state,hint:locked,deductionApplied:10,replayed:false},'p1','h1'))
console.log('PASS locked content is rejected and only a verified unlock acknowledgment reveals a hint')
const receipt={contestId:'c1',driverId:'d1',problemId:'p1',operationId:'op',unlockedAt:new Date().toISOString(),hint:unlocked}
assert.equal(netEarnedScore({contestId:'c1',driverId:'d1',attemptedProblemIds:[],earnedByProblem:{}},[receipt]),0)
assert.equal(netEarnedScore({contestId:'c1',driverId:'d1',attemptedProblemIds:['p1'],earnedByProblem:{p1:100}},[receipt]),90)
assert.equal(netEarnedScore({contestId:'c1',driverId:'d1',attemptedProblemIds:['p1'],earnedByProblem:{p1:5}},[receipt]),0)
console.log('PASS unlocking alone earns nothing; mock judging scores apply per-question penalties without going negative')
const board={contestId:'c1',contestTitle:'Race',status:'LIVE',visible:false,simulation:false,updatedAt:new Date().toISOString(),rows:[{rank:1,driverId:'d1',problemsSolved:0,totalProblems:4,totalScore:0,totalHintPenalties:10,status:'ACTIVE'}]}
assert.deepEqual(parseLeaderboard(board).rows,[])
assert.throws(()=>parseLeaderboard({...board,visible:true,rows:[{...board.rows[0],totalScore:-1}]}))
console.log('PASS withheld standings clear rows and invalid service scores are rejected')

const reordered=candidateHints([{...hints[1],order:1},{...hints[0],order:2,deductionPoints:50,content:'New configuration content.'}],[receipt],'p1')
assert.deepEqual(reordered.map(h=>h.order),[1,2])
assert.equal(reordered[1].content,unlocked.content)
assert.equal(reordered[1].deductionPoints,10)
assert.equal('content' in reordered[0],false)
const retained=candidateHints([{...hints[1],order:1}],[receipt],'p1')
assert.deepEqual(retained.map(h=>h.order),[1,2]);assert.equal(retained[1].content,unlocked.content)
console.log('PASS reordering and removing configured hints preserve paid content/cost while keeping display order unique')
