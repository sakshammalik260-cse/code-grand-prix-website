import fs from 'node:fs/promises'
import assert from 'node:assert/strict'

// Isolated Chrome only: set CGP_QA_CDP_URL to the browser's local debugging address.
export async function browserQa(targetId) {
  const address=process.env.CGP_QA_CDP_URL||'http://127.0.0.1:9225'
  const targets=await(await fetch(address+'/json')).json()
  const page=targets.find(target=>target.type==='page' && (!targetId || target.id===targetId))
  assert.ok(page,'Start an isolated Chrome test browser with remote debugging enabled.')
  const socket=new WebSocket(page.webSocketDebuggerUrl)
  await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}))
  let id=0
  const pending=new Map(),exceptions=[]
  function send(method,params={}){return new Promise((resolve,reject)=>{const request=++id;pending.set(request,{resolve,reject});socket.send(JSON.stringify({id:request,method,params}))})}
  socket.addEventListener('message',({data})=>{
    const message=JSON.parse(data)
    if(message.method==='Runtime.exceptionThrown')exceptions.push(message.params.exceptionDetails.text)
    if(!message.id)return
    const request=pending.get(message.id);pending.delete(message.id)
    if(message.error)request.reject(new Error(JSON.stringify(message.error)))
    else request.resolve(message.result)
  })
  async function evaluate(expression){
    const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true})
    if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  async function wait(expression){
    for(let i=0;i<150;i++){
      try{if(await evaluate(expression))return}catch(error){if(!/context|navigated/i.test(error.message))throw error}
      await new Promise(resolve=>setTimeout(resolve,100))
    }
    throw new Error('Timed out: '+expression)
  }
  async function go(path){
    await send('Page.navigate',{url:(process.env.CGP_QA_BASE_URL||'http://127.0.0.1:5173')+path})
    await wait("document.readyState==='complete' && !!document.querySelector('#main') && !document.querySelector('.arena-load-screen')")
  }
  async function click(selector){
    await wait(`!!document.querySelector(${JSON.stringify(selector)}) && !document.querySelector(${JSON.stringify(selector)}).disabled`)
    const point=await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({block:'center',behavior:'instant'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`)
    await send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1})
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1})
  }
  async function clickText(text){
    await wait(`[...document.querySelectorAll('button,a')].some(el=>el.textContent.trim()===${JSON.stringify(text)}&&!el.disabled)`)
    await evaluate(`[...document.querySelectorAll('button,a')].find(el=>el.textContent.trim()===${JSON.stringify(text)}&&!el.disabled).click()`)
  }
  async function input(selector,value){await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}))})()`)}
  async function screenshot(name,selector){
    await fs.mkdir('.qa',{recursive:true})
    let clip
    if(selector)clip=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:r.height,scale:1}})()`)
    const data=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:!!selector,...(clip?{clip}:{})})
    await fs.writeFile('.qa/'+name+'.png',Buffer.from(data.data,'base64'))
  }
  async function login(id,password){await go('/login');await wait("!!document.querySelector('#driver-id')");await input('#driver-id',id);await input('#password',password);await clickText('ENTER THE GRID');await wait("location.pathname!=='/login'&&!document.querySelector('.arena-load-screen')")}
  async function logout(){await evaluate("(async()=>{const {authService}=await import('/src/services/auth.ts');await authService.logout()})()");await go('/login')}
  await send('Page.enable');await send('Runtime.enable');await send('Page.bringToFront')
  return {send,evaluate,wait,go,click,clickText,input,screenshot,login,logout,exceptions,socket,close:async()=>{await send('Browser.close').catch(()=>{});socket.close()}}
}
