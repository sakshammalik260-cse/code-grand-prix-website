import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {browserQa} from './browser-qa.mjs'
const offline=process.argv.includes('--offline')
process.env.CGP_QA_BASE_URL ||= offline?'http://127.0.0.1:4173':'http://127.0.0.1:4174'
const origin=new URL(process.env.CGP_QA_BASE_URL).origin
const qa=await browserQa(),{send,evaluate,wait,go}=qa,requests=[],results=[]
let role=null
function pass(message){results.push(message);console.log('PASS '+message)}
qa.socket.addEventListener('message',({data})=>{
 const message=JSON.parse(data)
 if(message.method==='Network.requestWillBeSent')requests.push(message.params.request)
 if(message.method!=='Fetch.requestPaused')return
 const {requestId,request}=message.params,path=new URL(request.url).pathname
 let code=200,body={}
 if(path==='/api/auth/me'){code=role?200:401;body=role?{id:'SERVER-ACCOUNT',name:'Server account',team:'CPC',role}:{message:'Not authenticated'}}
 else if(path==='/api/session')body={viewer:{id:'SERVER-ACCOUNT',role,simulation:false},session:{driverId:'SERVER-ACCOUNT'},checkinStatus:'NOT_STARTED',serverTime:new Date().toISOString()}
 else if(path==='/api/admin/overview')body={totalQuestions:0,draftQuestions:0,publishedQuestions:0,competitionStatus:'WAITING',participants:0,activeRounds:[],activeRoundCount:0}
 else if(['/api/admin/problems','/api/admin/rounds','/api/volunteer/incidents','/api/volunteer/participants'].includes(path))body=[]
 else {code=403;body={message:'No fixture for this request'}}
 void send('Fetch.fulfillRequest',{requestId,responseCode:code,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from(JSON.stringify(body)).toString('base64')})
})
try{
 await send('Network.enable')
 if(!offline)await send('Fetch.enable',{patterns:[{urlPattern:origin+'/api/*',requestStage:'Request'}]})
 await go('/login');await wait("!!document.querySelector('#driver-id')")
 assert.equal(await evaluate("!!document.querySelector('.login-preview-access')"),false,'Production has no development account selector')
 await evaluate("localStorage.setItem('role','ADMIN');sessionStorage.setItem('role','ADMIN');sessionStorage.setItem('cgp-demo-driver',JSON.stringify({id:'ADMIN2026',role:'ADMIN'}))")
 await go('/admin/questions');await wait("location.pathname==='/login'&&!!document.querySelector('#driver-id')")
 pass('Production ignores forged browser identity/roles; unauthenticated staff access redirects to login')
 if(offline){assert.equal(requests.some(r=>new URL(r.url).pathname.startsWith('/api/')),false);pass('Unconfigured production sends no backend requests and never uses development authentication')}
 else{
  assert.ok(requests.some(r=>r.url.endsWith('/api/auth/me')),'Build this preview with VITE_ARENA_MODE=api')
  role='CANDIDATE'
  for(const path of ['/admin','/admin/questions','/admin/contests','/volunteer','/volunteer/incidents']){await go(path);await wait("!!document.querySelector('.access-denied')");assert.ok(await evaluate("document.querySelector('.access-denied').textContent.includes('403')"))}
  assert.equal(requests.some(r=>/\/api\/(admin|volunteer)\//.test(new URL(r.url).pathname)),false,'Denied role never mounts privileged service consumers')
  pass('Server-reported candidate cannot enter admin/volunteer routes despite stored ADMIN values; privileged APIs are not called')
  role='VOLUNTEER';await go('/volunteer/incidents');await wait("!!document.querySelector('.volunteer-body')");await go('/admin/questions');await wait("!!document.querySelector('.access-denied')");pass('Server-reported volunteer can access race control and cannot access question administration')
  role='ADMIN';await go('/admin');await wait("!!document.querySelector('.admin-kpis')");await go('/admin/questions');await wait("!!document.querySelector('.admin-filterbar')");await go('/volunteer');await wait("!!document.querySelector('.volunteer-body')");pass('Server-reported ADMIN retains administration and volunteer access')
  role='SUPERADMIN';await go('/admin');await wait("location.pathname==='/login'&&!!document.querySelector('#driver-id')");assert.equal(await evaluate("!!document.querySelector('.admin-layout')"),false);pass('Unknown server roles are rejected by identity validation')
  assert.equal(requests.some(r=>Object.keys(r.headers).some(key=>['x-role','x-user-role'].includes(key.toLowerCase()))),false)
 }
 assert.equal(qa.exceptions.length,0,qa.exceptions.join(','));await fs.mkdir('.qa',{recursive:true});await fs.writeFile(`.qa/phase4-2-production-${offline?'offline':'api'}.json`,JSON.stringify(results,null,2))
}finally{await qa.close()}
