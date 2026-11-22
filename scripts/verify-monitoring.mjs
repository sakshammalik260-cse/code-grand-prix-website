import assert from 'node:assert/strict'
import { canAcceptSession, sessionAllowsExecution } from '../src/services/monitoring/sessionRules.ts'
const scope={contestId:'cgp',driverId:'driver'}
const incident={id:'incident-1',clientEventId:'event-1',sessionId:'session-1',...scope,type:'TAB_HIDDEN',observedAt:'2026-11-17T10:00:00Z',timestamp:'2026-11-17T10:00:01Z',reviewStatus:'OPEN',blocking:true,simulation:true}
const base={id:'session-1',...scope,status:'ACTIVE',revision:1,updatedAt:'2026-11-17T09:00:00Z',serverTime:'2026-11-17T10:00:00Z',policy:{allowExecution:true,allowEditing:true,allowNavigation:true},latestIncident:null,resumeAuthorization:null,volunteerNotified:false,simulation:true}
const locked={...base,status:'LOCKED',revision:2,latestIncident:incident,policy:{allowExecution:false,allowEditing:false,allowNavigation:false}}
const receipt={id:'approval-1',incidentId:'incident-1',decision:'AUTHORIZE_RESUME',actorId:'volunteer',actorRole:'VOLUNTEER',decidedAt:'2026-11-17T10:01:00Z',simulation:true}
const approved={...base,status:'RESUME_AUTHORIZED',revision:3,latestIncident:incident,resumeAuthorization:receipt}
assert.equal(canAcceptSession(null,base,scope),true)
assert.equal(canAcceptSession(base,{...base,driverId:'other',revision:2},scope),false)
assert.equal(canAcceptSession(base,{...base,id:'different',revision:2},scope),false)
assert.equal(canAcceptSession(locked,{...base,revision:1},scope),false)
console.log('PASS scope/session identity and stale revisions are checked')
assert.equal(canAcceptSession(locked,{...base,revision:3},scope),false)
assert.equal(canAcceptSession(locked,{...approved,resumeAuthorization:null},scope),false)
assert.equal(canAcceptSession(locked,{...approved,resumeAuthorization:{...receipt,actorRole:'CANDIDATE'}},scope),false)
assert.equal(canAcceptSession(locked,{...approved,resumeAuthorization:{...receipt,decision:'KEEP_LOCKED'}},scope),false)
console.log('PASS locks cannot be cleared by an active flag, missing approval, participant role or keep-locked decision')
assert.equal(canAcceptSession(locked,{...approved,resumeAuthorization:{...receipt,decidedAt:'2026-11-17T09:00:00Z'}},scope),false)
assert.equal(canAcceptSession(locked,approved,scope),true)
assert.equal(canAcceptSession(approved,{...approved,serverTime:'2026-11-17T10:02:00Z'},scope),true)
assert.equal(canAcceptSession(approved,locked,scope),false)
console.log('PASS validated approval, duplicate snapshots and delayed acknowledgments retain the newest state')
const relocked={...locked,revision:4,latestIncident:{...incident,id:'incident-2'}}
assert.equal(canAcceptSession(approved,relocked,scope),true)
assert.equal(sessionAllowsExecution(base),true)
assert.equal(sessionAllowsExecution(approved),true)
assert.equal(sessionAllowsExecution(locked),false)
assert.equal(sessionAllowsExecution({...base,status:'FINISHED'}),false)
console.log('PASS a new incident can re-lock; execution is gated by confirmed session state and policy')

// Regression: creation guards never affect delivery of the existing pending queue.
const {canReportIncident}=await import('../src/services/monitoring/sessionRules.ts')
for(const status of ['LOCK_PENDING','LOCKED','UNDER_REVIEW','FINISHED']) assert.equal(canReportIncident({session:{...base,status},pending:[]}),false)
assert.equal(canReportIncident({session:base,pending:[incident]}),false)
assert.equal(canReportIncident({session:base,pending:[],connection:'DISCONNECTED'}),true)
assert.equal(canReportIncident({session:base,pending:[],connection:'AUTH_EXPIRED'}),false)
assert.equal(canReportIncident({session:approved,pending:[]}),true)
console.log('PASS blocking creation guard: locked, pending, finished, offline capture and authorized re-arm eligibility')

const {authorizeSessionInLedger}=await import('../src/services/monitoring/sessionAuthorization.ts')
const staff={id:'marshal',role:'VOLUNTEER',simulation:true}
const historical=[incident,{...incident,id:'old-2',clientEventId:'event-2',type:'FULLSCREEN_EXIT',reviewStatus:'KEPT_LOCKED'},{...incident,id:'old-3',clientEventId:'event-3',type:'CAMERA_INTERRUPTED',reviewStatus:'ESCALATED'}]
const makeLedger=()=>({sessions:{'cgp:driver':structuredClone(locked)},incidents:structuredClone(historical),hintUnlocks:{untouched:true},scores:{untouched:true}})
const request={...scope,decision:'AUTHORIZE_RESUME',expectedSessionRevision:2,expectedIncidentIds:historical.map(item=>item.id),note:'Reviewed',idempotencyKey:'bulk-1'}
const ledger=makeLedger()
const response=authorizeSessionInLedger(ledger,'session-1',request,staff)
assert.equal(response.session.status,'RESUME_AUTHORIZED');assert.equal(response.session.revision,3)
assert.equal(response.incidents.length,3);assert.ok(response.incidents.every(item=>item.reviewStatus==='AUTHORIZED'))
assert.deepEqual(ledger.incidents.map(item=>[item.id,item.clientEventId,item.timestamp]),historical.map(item=>[item.id,item.clientEventId,item.timestamp]))
assert.deepEqual(ledger.hintUnlocks,{untouched:true});assert.deepEqual(ledger.scores,{untouched:true})
assert.equal(canAcceptSession(locked,response.session,scope),true)
assert.equal(canAcceptSession(locked,{...response.session,resumeAuthorization:{...response.authorization,sessionId:'other'}},scope),false)
assert.equal(canAcceptSession(locked,{...response.session,resumeAuthorization:{...response.authorization,coveredIncidentIds:['old-2']}},scope),false)
assert.deepEqual(authorizeSessionInLedger(ledger,'session-1',request,staff),response)
assert.equal(Object.keys(ledger.sessionAuthorizations).length,1)
console.log('PASS historical bulk approval resolves exact set, preserves IDs/timestamps/other ledger data; repeated key records one decision')
for(const [overrides,viewer,target] of [
 [{}, {...staff,role:'CANDIDATE'},'session-1'],
 [{expectedSessionRevision:1},staff,'session-1'],
 [{expectedIncidentIds:['incident-1']},staff,'session-1'],
 [{driverId:'another'},staff,'session-1'],
 [{contestId:'another'},staff,'session-1'],
 [{},staff,'other-session'],
]) {
 const current=makeLedger(),before=JSON.stringify(current)
 assert.throws(()=>authorizeSessionInLedger(current,target,{...request,...overrides},viewer))
 assert.equal(JSON.stringify(current),before)
}
assert.throws(()=>authorizeSessionInLedger(ledger,'session-1',{...request,idempotencyKey:'new-key'},staff),/changed/)
assert.throws(()=>authorizeSessionInLedger(ledger,'session-1',{...request,expectedSessionRevision:3,idempotencyKey:'new-key'},staff),/already authorized/)
assert.throws(()=>authorizeSessionInLedger(ledger,'session-1',{...request,note:'changed'},staff),/different request/)
const empty=makeLedger();empty.incidents=[]
assert.throws(()=>authorizeSessionInLedger(empty,'session-1',{...request,expectedIncidentIds:[]},staff),/No outstanding/)
console.log('PASS candidate/scope/stale/set/key conflicts and no-outstanding/already-authorized cases make no partial writes')

assert.equal(canAcceptSession(approved,{...approved,resumeAuthorization:{...receipt,actorRole:'CANDIDATE'}},scope),false)
assert.equal(authorizeSessionInLedger(makeLedger(),'session-1',request,{...staff,role:'ADMIN'}).authorization.actorRole,'ADMIN')
console.log('PASS unchanged revision cannot alter approval metadata; ADMIN authorization remains supported')

const collided=makeLedger();collided.sessions['other:driver']=collided.sessions['cgp:driver']
assert.throws(()=>authorizeSessionInLedger(collided,'session-1',{...request,contestId:'other'},staff),/does not match/)
console.log('PASS target record scope is verified independently of its lookup key')
