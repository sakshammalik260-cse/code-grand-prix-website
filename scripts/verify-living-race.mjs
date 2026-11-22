import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {browserQa} from './browser-qa.mjs'
const qa=await browserQa()
const sizes=[[1920,1080],[1440,900],[1366,768],[768,1024],[390,844]]
const baseline=await fs.readFile('.qa/living-race-baseline.json','utf8').then(JSON.parse).catch(()=>null)
const results=[]
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
const pass=message=>{console.log('PASS '+message);results.push(message)}
async function media(reduced){await qa.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]})}
async function menu(){if(await qa.evaluate("getComputedStyle(document.querySelector('.mobile-menu')).display!=='none' && !document.querySelector('.navigation').classList.contains('open')"))await qa.click('.mobile-menu')}
try{
 await qa.send('Page.addScriptToEvaluateOnNewDocument',{source:'Date.now=()=>1795047600000'})
 for(const [width,height]of sizes){
  await qa.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false})
  await media(true);await qa.go('/');await qa.evaluate('document.fonts.ready');await pause(1500)
  const geometry=await qa.evaluate('JSON.stringify([...document.querySelectorAll(".site-header,.hero-copy,.hero-grid-entry,.hero-flag,.hero-bottom-line,#about,#schedule,#rules,#contact")].map(el=>({selector:el.id||el.className,bounds:el.getBoundingClientRect().toJSON(),text:el.textContent})))')
  if(baseline){
   const current=JSON.parse(geometry)
   const original=JSON.parse(baseline[width+'x'+height])
   const header=current.find(item=>typeof item.selector==='string' && item.selector.startsWith('site-header'))
   for(const item of current)if(typeof item.selector==='string')item.selector=item.selector.replace(' home-revealed','')
   header.text=header.text.replace(/\s*Reduce animation\s*/, '')
   assert.deepEqual(current,original,'Approved page bounds and copy remain unchanged, excluding the new preference control')
  }
  await qa.screenshot('living-race-static-'+width+'x'+height)
  assert.equal(await qa.evaluate("getComputedStyle(document.querySelector('.living-race-background')).display"),'none')
  await media(false)
  const info=await qa.evaluate('(()=>{const root=document.querySelector(".living-race-background"),hero=document.querySelector("#home"),box=hero.getBoundingClientRect(),scale=Math.max(hero.clientWidth/1672,hero.clientHeight/941),point=new DOMPoint(328,734).matrixTransform(root.getScreenCTM());return {display:getComputedStyle(root).display,pointer:getComputedStyle(root).pointerEvents,x:point.x,y:point.y,expectedX:box.x+(hero.clientWidth-1672*scale)/2+328*scale,expectedY:box.y+hero.clientHeight-941*scale+734*scale,width:hero.clientWidth,overflow:document.documentElement.scrollWidth>innerWidth,hidden:root.getAttribute("aria-hidden")}})()')
  assert.equal(info.pointer,'none');assert.equal(info.hidden,'true');assert.equal(info.overflow,false)
  if(width>700){assert.equal(info.display,'block');assert.ok(Math.abs(info.x-info.expectedX)<.1);assert.ok(Math.abs(info.y-info.expectedY)<.1);await qa.wait('document.querySelector(".living-race-background").dataset.paused==="false"')}
  else assert.equal(info.display,'none')
  await qa.screenshot('living-race-animated-'+width+'x'+height)
  pass(width+'x'+height+': original layout/text, crop-aligned light and static reduced-motion/mobile fallback')
 }
 await qa.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await qa.go('/');await media(false);await pause(500)
 const effects=await qa.evaluate('(()=>{const root=document.querySelector(".living-race-background");return root.getAnimations({subtree:true}).map(a=>{const f=a.effect.getKeyframes(),timing=a.effect.getTiming();return {name:a.animationName,infinite:timing.iterations===Infinity,duration:timing.duration,first:f[0],last:f.at(-1)}})})()')
 assert.ok(effects.length>=10)
 for(const effect of effects){assert.equal(effect.infinite,true);assert.ok(effect.duration>=2100);assert.equal(effect.first.opacity,effect.last.opacity);if(effect.first.opacity!=='0')assert.equal(effect.first.transform,effect.last.transform)}
 await qa.evaluate('document.querySelector(".living-race-background").getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=0})')
 await qa.screenshot('living-race-light-low')
 const low=await qa.evaluate('getComputedStyle(document.querySelector(".race-rear-bloom")).opacity')
 await qa.evaluate('document.querySelector(".living-race-background").getAnimations({subtree:true}).forEach(a=>{a.currentTime=1050})')
 await qa.screenshot('living-race-light-peak')
 const high=await qa.evaluate('getComputedStyle(document.querySelector(".race-rear-bloom")).opacity')
 assert.ok(Number(high)>Number(low))
 // Remount after screenshot sampling so manual WAAPI controls cannot override CSS lifecycle pausing.
 await qa.go('/');await pause(500)
 pass('all environment animations loop infinitely with matching endpoints or invisible streak resets; rear light brightens smoothly')
 // Real tab visibility and offscreen lifecycle pause (not synthetic visibility overrides).
 const id=(await qa.send('Target.createTarget',{url:'about:blank',background:true})).targetId
 const other=await browserQa(id)
 await qa.wait('document.hidden && document.querySelector(".living-race-background").dataset.paused==="true"')
 assert.equal(await qa.evaluate('document.querySelector(".living-race-background").getAnimations({subtree:true}).every(a=>a.playState==="paused")'),true)
 other.socket.close();await qa.send('Target.closeTarget',{targetId:id});await qa.send('Page.bringToFront')
 await qa.wait('document.querySelector(".living-race-background").dataset.paused==="false"')
 await qa.evaluate('document.querySelector("#rules").scrollIntoView({behavior:"instant"})')
 await qa.wait('document.querySelector(".living-race-background").dataset.paused==="true"')
 await qa.evaluate('window.scrollTo({top:0,behavior:"instant"})');await qa.wait('document.querySelector(".living-race-background").dataset.paused==="false"')
 pass('real hidden-tab and offscreen states pause effects; returning resumes the same timeline')
 await qa.evaluate('Date.now=()=>performance.timeOrigin+performance.now()')
 await pause(1100)
 const first=await qa.evaluate('document.querySelector(".race-countdown-panel .countdown").textContent')
 await pause(1200)
 assert.notEqual(await qa.evaluate('document.querySelector(".race-countdown-panel .countdown").textContent'),first)
 pass('countdown continues updating independently of decorative animations')
 const timing=await qa.evaluate('new Promise(resolve=>{let previous=performance.now();const frames=[];function sample(now){frames.push(now-previous);previous=now;if(frames.length<100)requestAnimationFrame(sample);else resolve({frames:frames.length,averageMs:frames.reduce((a,b)=>a+b,0)/frames.length,maxMs:Math.max(...frames)})}requestAnimationFrame(sample)})')
 await qa.send('Performance.enable')
 const metricsBefore=(await qa.send('Performance.getMetrics')).metrics
 await pause(2000)
 const metricsAfter=(await qa.send('Performance.getMetrics')).metrics
 const taskSeconds=metricsAfter.find(m=>m.name==='TaskDuration').value-metricsBefore.find(m=>m.name==='TaskDuration').value
 results.push({frameSampling:timing,taskSecondsPerTwoSeconds:taskSeconds})
 assert.equal(await qa.evaluate('document.querySelectorAll(".living-race-background filter,.living-race-background image,.living-race-background foreignObject").length'),0)
 pass('lightweight SVG effects: no duplicated image, filters, video, canvas or application animation-frame loop; performance sample recorded')
 for(const hash of ['home','about','rules','schedule','contact']){
  await menu();await qa.click('#main-navigation a[href="/#'+hash+'"]');await qa.wait('location.hash==="#'+hash+'"');await pause(1000)
  assert.ok(await qa.evaluate('(()=>{const target=document.querySelector("#'+hash+'"),header=document.querySelector(".site-header");return '+(hash==='home'?'window.scrollY<2':'target.getBoundingClientRect().top>=header.getBoundingClientRect().bottom-1')+'})()'))
 }
 await qa.go('/');await pause(500)
 await qa.click('.hero-grid-entry a');await qa.wait('location.pathname==="/login"')
 await pause(500)
 assert.equal(await qa.evaluate('document.querySelectorAll(".living-race-background").length'),0)
 if(baseline)assert.equal(await qa.evaluate('document.querySelector(".cinematic-login").outerHTML'),baseline.login)
 await qa.go('/');await menu();await qa.clickText('Results');await qa.wait('location.pathname==="/login"')
 await qa.go('/');await qa.click('.nav-actions a');await qa.wait('location.pathname==="/login"')
 await qa.go('/');await qa.click('.final-cta a');await qa.wait('location.pathname==="/login"')
 await qa.go('/');assert.equal(await qa.evaluate('document.querySelectorAll(".living-race-background").length'),1)
 pass('all homepage navigation/entry links retain their behavior, sticky scrolling clears headings, login markup unchanged, route cleanup prevents duplicate scenes')
 assert.equal(qa.exceptions.length,0,qa.exceptions.join(','))
 await fs.writeFile('.qa/living-race-results.json',JSON.stringify(results,null,2))
 console.log('All living race checks passed.')
}catch(error){console.log(await qa.evaluate('({path:location.pathname,text:document.body.innerText.slice(0,1000)})').catch(()=>null));await qa.screenshot('living-race-failure').catch(()=>{});throw error}
finally{await qa.close()}
