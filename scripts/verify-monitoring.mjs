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
