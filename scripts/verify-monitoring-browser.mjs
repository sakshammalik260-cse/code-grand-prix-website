import assert from 'node:assert/strict'
import {browserQa} from './browser-qa.mjs'
const candidate=await browserQa()
let staff
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
const pass=message=>console.log('PASS '+message)
const scope={contestId:'cgp-2026-round-01',driverId:'CGP2026'}
const service=expression=>'(async()=>{const {monitoringService:s}=await import("/src/services/monitoring/index.ts");return '+expression+'})()'
async function ledger(browser,expression){return browser.evaluate('(async()=>{const {ledgerTransaction}=await import("/src/services/monitoring/ledger.ts");return ledgerTransaction(false,ledger=>'+expression+')})()')}
async function restore(){
 await candidate.send('Page.bringToFront')
 if(await candidate.evaluate("[...document.querySelectorAll('button')].some(el=>el.textContent.trim()==='Restore camera')")){await candidate.clickText('Restore camera');await candidate.wait("![...document.querySelectorAll('button')].some(el=>el.textContent.trim()==='Restore camera')")}
 if(!await candidate.evaluate('!!document.fullscreenElement')){await candidate.clickText('Re-enter fullscreen');await candidate.wait('!!document.fullscreenElement')}
 await candidate.wait("!document.querySelector('.violation-lock-card') && document.querySelector('.monitoring-status')?.textContent.includes('SECURE')")
 await pause(1300)
}
let checkedRecoveryErrors=false
async function bulk(){
 await staff.clickText('Review session')
 await staff.wait("!!document.querySelector('.session-review-panel')")
 if(!checkedRecoveryErrors){
  for(const [width,height] of [[1440,900],[1366,768],[390,844]]){
   await staff.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false})
   assert.ok(await staff.evaluate("document.querySelector('.session-review-panel').scrollWidth<=document.querySelector('.session-review-panel').clientWidth+1"))
   await staff.screenshot('monitoring-session-review-'+width+'x'+height)
  }
  await staff.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
 }
 await staff.clickText('AUTHORIZE & RESUME SESSION')
 await staff.wait("!!document.querySelector('.session-approval-confirmation')")
 if(!checkedRecoveryErrors){
  await staff.evaluate('(async()=>{const {ledgerTransaction}=await import("/src/services/monitoring/ledger.ts");await ledgerTransaction(true,ledger=>{Object.values(ledger.sessions).find(s=>s.driverId==="CGP2026").revision++})})()')
  await staff.wait("document.querySelector('.session-approval-confirmation [role=alert]')?.textContent.includes('Session changed')")
  assert.equal(await staff.evaluate("[...document.querySelectorAll('button')].find(el=>el.textContent==='CONFIRM SESSION AUTHORIZATION').disabled"),true)
  await staff.clickText('Back to review');await staff.clickText('AUTHORIZE & RESUME SESSION')
  await staff.evaluate('(async()=>{const moduleUrl=performance.getEntriesByType("resource").find(e=>new URL(e.name).pathname==="/src/services/monitoring/index.ts").name;const {monitoringService:s}=await import(moduleUrl);const original=s.authorizeSession;window.__bulkKeys=[];s.authorizeSession=(id,request,signal)=>{window.__bulkKeys.push(request.idempotencyKey);return original(id,request,signal)};sessionStorage.setItem("cgp-monitor-demo-offline","1")})()')
  await staff.clickText('CONFIRM SESSION AUTHORIZATION')
  await staff.wait("document.querySelector('.session-review-panel .volunteer-error')?.textContent.includes('offline')")
  assert.equal(await ledger(staff,'Object.keys(ledger.sessionAuthorizations||{}).length'),0)
  await staff.evaluate('sessionStorage.removeItem("cgp-monitor-demo-offline")')
  await staff.wait("document.querySelector('.volunteer-connection')?.textContent==='CONNECTED' && ![...document.querySelectorAll('button')].find(el=>el.textContent==='CONFIRM SESSION AUTHORIZATION')?.disabled")
 }
 await staff.clickText('CONFIRM SESSION AUTHORIZATION')
 await staff.wait("!!document.querySelector('.volunteer-confirmation') && !document.querySelector('.session-review-panel')")
 if(!checkedRecoveryErrors){
  const keys=await staff.evaluate('window.__bulkKeys')
  assert.equal(keys.length,2);assert.equal(keys[0],keys[1]);checkedRecoveryErrors=true
  pass('responsive review, stale-confirmation guard and offline UI retry preserve the authorization key without false success')
 }
}
try{
 await candidate.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
 await candidate.login('CGP2026','Race2026!')
 await candidate.evaluate('(async()=>{const {mockControls}=await import("/src/services/arena/mockState.ts");mockControls.setContestPhase("LIVE")})()')
 await candidate.clickText('Enable camera');await candidate.wait("document.querySelector('video')?.srcObject?.active")
 await candidate.clickText('Activate fullscreen');await candidate.wait('!!document.fullscreenElement')
 await candidate.evaluate("document.querySelector('input[type=checkbox]').click()")
 await candidate.clickText('START YOUR ENGINE');await candidate.wait("location.pathname==='/lobby'")
 await candidate.clickText('ENTER CODING ARENA');await candidate.wait("document.querySelector('.monitoring-status')?.textContent.includes('SECURE')")
 await pause(1300)
 const end=await candidate.evaluate("JSON.parse(localStorage.getItem('cgp-mock-contest-v1')).contestEndTime")
 // Exercise actual CodeMirror document, run and submit before locking; retain the mounted instances.
 const draft='// bulk monitoring regression: preserve this draft\nint main() { return 0; }'
 await candidate.evaluate("document.querySelector('.cm-content').focus()")
 for(const type of ['keyDown','keyUp'])await candidate.send('Input.dispatchKeyEvent',{type,key:'a',code:'KeyA',windowsVirtualKeyCode:65,modifiers:2})
 await candidate.send('Input.insertText',{text:draft})
 await candidate.evaluate("window.__arenaEditor=document.querySelector('.cm-editor');window.__arenaLanguage=document.querySelector('#arena-language').value;window.__arenaLocation=location.search")
 await candidate.clickText('Run Code');await candidate.wait("document.querySelector('.arena-results-panel')?.textContent.includes('Accepted') || document.body.innerText.includes('Execution time')")
 await candidate.clickText('Submit Code');await candidate.wait("document.body.innerText.includes('Accepted')")
 await candidate.evaluate('(async()=>{const moduleUrl=performance.getEntriesByType("resource").find(e=>new URL(e.name).pathname==="/src/services/monitoring/index.ts").name;const {monitoringService:s}=await import(moduleUrl);const original=s.reportIncident;s.reportIncident=async(request,signal)=>{if(request.type==="WINDOW_FOCUS_LOST")await new Promise(r=>setTimeout(r,750));return original(request,signal)}})()')
 await candidate.evaluate("window.dispatchEvent(new Event('blur'))")
 await candidate.wait("JSON.parse(sessionStorage.getItem('cgp-monitor-pending:cgp-2026-round-01:CGP2026')||'[]').some(i=>i.type==='WINDOW_FOCUS_LOST')")
 const created=await candidate.send('Target.createTarget',{url:'about:blank',background:true})
 staff=await browserQa(created.targetId)
 await staff.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
 await candidate.wait("document.visibilityState==='hidden'")
 await candidate.wait("document.querySelector('.violation-lock-card')?.textContent.includes('LOCKED') && !document.querySelector('.violation-lock-card')?.textContent.includes('LOCK PENDING')")
 await staff.login('VOLUNTEER2026','Marshal2026!');await staff.wait("!!document.querySelector('.volunteer-table-wrap tbody tr')")
 assert.equal(await ledger(staff,'ledger.incidents.filter(i=>i.blocking && i.reviewStatus!=="AUTHORIZED").length'),1)
 const lockedHistory=await ledger(staff,'ledger.incidents.length')
 // Real browser tab switches while locked, plus independent fullscreen/camera simulator events.
 await candidate.send('Page.bringToFront');await pause(150)
 await staff.send('Page.bringToFront');await pause(250)
 await candidate.send('Page.bringToFront');await pause(150)
 await candidate.evaluate("document.querySelector('.monitoring-dev-panel').open=true")
 await candidate.clickText('Simulate fullscreen exit');await candidate.clickText('Simulate camera interruption');await candidate.clickText('Simulate tab switch')
 await pause(400)
 assert.equal(await ledger(candidate,'ledger.incidents.length'),lockedHistory)
 pass('tab monitoring remains armed during a pending nonblocking focus report; one blocking incident, none repeated while locked')
 assert.equal(await candidate.evaluate(service('s.authorizeSession("bad",{}).then(()=>false).catch(()=>true)')),true)
 const probeId=(await candidate.send('Target.createTarget',{url:'about:blank',background:true})).targetId
 const probe=await browserQa(probeId)
 await probe.login('CGP2026','Race2026!');await probe.go('/volunteer');await probe.wait("!!document.querySelector('.access-denied')")
 probe.socket.close();await candidate.send('Target.closeTarget',{targetId:probeId})
 pass('candidate cannot authorize sessions through service or volunteer route')
 await staff.send('Page.bringToFront');await staff.click('[aria-label="Refresh volunteer data"]')
 await staff.wait("document.querySelector('.volunteer-table-wrap tbody')?.textContent.includes('LOCKED')")
 await bulk();await staff.screenshot('monitoring-bulk-authorized')
 const firstReceipt=await ledger(staff,'Object.values(ledger.sessionAuthorizations||{})[0]')
 assert.equal(firstReceipt.response.incidents.length,1)
 await candidate.wait("document.querySelector('.violation-lock-card')?.textContent.includes('RESUME AUTHORIZED')")
 assert.ok(await candidate.evaluate("!!document.querySelector('.violation-lock-card')"),'hidden candidate does not dismiss recovery overlay')
 await restore()
 assert.equal(await candidate.evaluate("document.querySelector('.cm-editor')===window.__arenaEditor"),true)
 assert.equal(await candidate.evaluate("document.querySelector('#arena-language').value===window.__arenaLanguage && location.search===window.__arenaLocation"),true)
 assert.ok(await candidate.evaluate("document.body.innerText.includes('Submissions (1)')"),'submission history remains mounted under the lock')
 assert.ok((await candidate.evaluate("document.querySelector('.cm-content').textContent")).includes('bulk monitoring regression'))
 assert.equal(await candidate.evaluate("JSON.parse(localStorage.getItem('cgp-mock-contest-v1')).contestEndTime"),end)
 await candidate.clickText('Submit Code');await candidate.wait("document.body.innerText.includes('Accepted')")
 pass('one session approval restores editing/submission after explicit recovery; code, mounted editor and official end time preserved')
 // Genuine new violation after resumption.
 await staff.send('Page.bringToFront')
 await candidate.wait("document.querySelector('.violation-lock-card')?.textContent.includes('LOCKED') && !document.querySelector('.violation-lock-card')?.textContent.includes('LOCK PENDING')")
 assert.equal(await ledger(staff,'ledger.incidents.filter(i=>i.blocking && i.reviewStatus!=="AUTHORIZED").length'),1)
 const events=await ledger(staff,'ledger.incidents.map(i=>[i.id,i.clientEventId])')
 assert.equal(new Set(events.map(i=>i[0])).size,events.length);assert.equal(new Set(events.map(i=>i[1])).size,events.length)
 pass('genuine tab switch after resumption creates a distinct new incident')
 // Preserve and resolve historical records as they exist in v1; no database migration/reset.
 await staff.evaluate('(async()=>{const {ledgerTransaction}=await import("/src/services/monitoring/ledger.ts");await ledgerTransaction(true,ledger=>{const current=Object.values(ledger.sessions).find(s=>s.driverId==="CGP2026");const old=ledger.incidents.find(i=>i.sessionId===current.id && i.blocking && i.reviewStatus!=="AUTHORIZED");for(let n=0;n<3;n++)ledger.incidents.unshift({...old,id:crypto.randomUUID(),clientEventId:crypto.randomUUID(),type:["TAB_HIDDEN","FULLSCREEN_EXIT","CAMERA_INTERRUPTED"][n],reviewStatus:n===2?"ESCALATED":"OPEN",timestamp:new Date(Date.now()-10000-n*1000).toISOString()});current.status="UNDER_REVIEW";current.revision++})})()')
 await staff.click('[aria-label="Refresh volunteer data"]');await staff.wait("document.querySelector('.volunteer-table-wrap tbody')?.textContent.includes('UNDER REVIEW')")
 const oldRecords=await ledger(staff,'ledger.incidents.map(i=>[i.id,i.clientEventId,i.timestamp])')
 await staff.clickText('Review session');await staff.wait("document.querySelectorAll('.session-incident-list li').length===4")
 await staff.screenshot('monitoring-historical-session-review')
 await staff.clickText('AUTHORIZE & RESUME SESSION')
 await staff.clickText('CONFIRM SESSION AUTHORIZATION');await staff.wait("!document.querySelector('.session-review-panel') && document.querySelector('.volunteer-confirmation')?.textContent.includes('4 blocking')")
 assert.deepEqual(await ledger(staff,'ledger.incidents.map(i=>[i.id,i.clientEventId,i.timestamp])'),oldRecords)
 assert.equal(await ledger(staff,'ledger.incidents.filter(i=>i.blocking && i.reviewStatus!=="AUTHORIZED").length'),0)
 assert.equal(await ledger(staff,'Object.keys(ledger.sessionAuthorizations).length'),2)
 pass('four historical open/escalated incidents resolve atomically with IDs, event IDs and timestamps preserved')
 await restore()
 // Camera interruption and genuine permission recovery.
 await candidate.evaluate('(async()=>{const url=performance.getEntriesByType("resource").find(e=>e.name.includes("/src/services/cameraStore.ts")).name;const {cameraStore}=await import(url);cameraStore.getSnapshot().stream.getVideoTracks()[0].dispatchEvent(new Event("ended"))})()')
 await candidate.wait("document.querySelector('.violation-lock-card')?.textContent.includes('CAMERA INTERRUPTED') && !document.querySelector('.violation-lock-card')?.textContent.includes('LOCK PENDING')")
 await staff.send('Page.bringToFront');await staff.click('[aria-label="Refresh volunteer data"]');await pause(400)
 await bulk()
 await candidate.wait("document.querySelector('.violation-lock-card')?.textContent.includes('RESUME AUTHORIZED')")
 await restore()
 await candidate.screenshot('monitoring-restored-arena')
 pass('camera-ended interruption, approved camera recovery and fullscreen restoration do not create another lock')
 // Client queue regression: pending lock blocks new independent events offline and survives restart.
 const queueResult=await candidate.evaluate('(async()=>{const {MonitoringClient}=await import("/src/services/monitoring/client.ts");const scope={contestId:"queue-regression",driverId:"queue-driver"};const a=new MonitoringClient(scope);a.start();await a.refresh();await new Promise(r=>setTimeout(r,500));a.setMonitoringArmed(true);sessionStorage.setItem("cgp-monitor-demo-offline","1");a.report("TAB_HIDDEN","original-queued-event");a.report("FULLSCREEN_EXIT","must-not-exist");await new Promise(r=>setTimeout(r,250));const before=a.getSnapshot().pending;a.stop();const b=new MonitoringClient(scope);b.start();await new Promise(r=>setTimeout(r,250));const restored=b.getSnapshot().pending;sessionStorage.removeItem("cgp-monitor-demo-offline");await b.refresh();await new Promise(r=>setTimeout(r,500));const after=b.getSnapshot();b.stop();return {before,restored,after}})()')
 assert.equal(queueResult.before.length,1);assert.deepEqual(queueResult.restored,queueResult.before);assert.equal(queueResult.after.pending.length,0);assert.equal(queueResult.after.session.latestIncident.clientEventId,'original-queued-event')
 pass('offline pending guard preserves original request through restart, reconnect and exact acknowledgment')
 // Concurrent staff transactions, key retries, conflicts, no partial approval and audit count.
 await staff.send('Page.bringToFront')
 await candidate.wait("document.querySelector('.violation-lock-card')?.textContent.includes('LOCKED') && !document.querySelector('.violation-lock-card')?.textContent.includes('LOCK PENDING')")
 const atomic=await staff.evaluate(service('(async()=>{const sessions=await s.listParticipants();const session=sessions.find(x=>x.driverId==="CGP2026");const incidents=(await s.listIncidents()).filter(i=>i.sessionId===session.id && i.blocking && i.reviewStatus!=="AUTHORIZED");const request={contestId:session.contestId,driverId:session.driverId,decision:"AUTHORIZE_RESUME",expectedSessionRevision:session.revision,expectedIncidentIds:incidents.map(i=>i.id),note:"Concurrency regression",idempotencyKey:crypto.randomUUID()};if(!incidents.length)return {missing:true};const replies=await Promise.allSettled([s.authorizeSession(session.id,request),s.authorizeSession(session.id,{...request,idempotencyKey:crypto.randomUUID()})]);const repeated=await s.authorizeSession(session.id,request);return {replies:replies.map(r=>({status:r.status,code:r.reason?.code,id:r.value?.authorization.id})),repeated:repeated.authorization.id}})()'))
 assert.equal(atomic.missing,undefined);assert.equal(atomic.replies.filter(r=>r.status==='fulfilled').length,1);assert.equal(atomic.replies.find(r=>r.status==='rejected').code,'CONFLICT');assert.equal(atomic.repeated,atomic.replies.find(r=>r.status==='fulfilled').id)
 pass('concurrent session approvals serialize in IndexedDB: one success, one conflict; same-key retry returns original receipt')
 // Audit history and individual review remain available after session-oriented default.
 await staff.clickText('Incident history');await staff.wait("[...document.querySelectorAll('button')].some(el=>el.textContent==='Review incident')")
 await staff.clickText('Review incident');await staff.wait("!!document.querySelector('.volunteer-review-card')")
 assert.ok(await staff.evaluate("document.querySelector('.volunteer-review-card').textContent.includes('Client event ID')"))
 assert.equal(candidate.exceptions.length+staff.exceptions.length,0)
 pass('full audit history and individual incident identifiers/review remain accessible; no runtime exceptions')
 await candidate.send('Page.bringToFront')
 await candidate.evaluate("window.__oldPage=true")
 await candidate.send('Page.reload')
 await candidate.wait("!window.__oldPage && !!document.querySelector('.cm-content')")
 assert.ok((await candidate.evaluate("document.querySelector('.cm-content').textContent")).includes('bulk monitoring regression'))
 assert.equal(await candidate.evaluate("JSON.parse(localStorage.getItem('cgp-mock-contest-v1')).contestEndTime"),end)
 pass('refresh preserves the saved CodeMirror draft and official competition end time')
 console.log('All monitoring browser regressions passed.')
}catch(error){
 console.log('CANDIDATE',await candidate.evaluate('({path:location.pathname,text:document.body.innerText.slice(-5000),full:!!document.fullscreenElement,visibility:document.visibilityState})').catch(()=>null))
 if(staff)console.log('STAFF',await staff.evaluate('({path:location.pathname,text:document.body.innerText.slice(-5000)})').catch(()=>null))
 await candidate.screenshot('monitoring-bulk-failure').catch(()=>{})
 throw error
}finally{staff?.socket.close();await candidate.close()}
