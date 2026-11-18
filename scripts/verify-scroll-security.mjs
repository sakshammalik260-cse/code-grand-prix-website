import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {browserQa} from './browser-qa.mjs'
import {cpcDescription} from '../src/data/cpc.ts'
const qa=await browserQa(),{send,evaluate,wait,go,click,clickText,screenshot,login,logout}=qa
const results=[]
function pass(message){results.push(message);console.log('PASS '+message)}
async function denied(path){await go(path);await wait("!!document.querySelector('.access-denied')");assert.ok(await evaluate("document.querySelector('.access-denied').textContent.includes('403')"),path)}
async function publicMenu(){if(await evaluate("getComputedStyle(document.querySelector('.mobile-menu')).display!=='none' && !document.querySelector('.navigation').classList.contains('open')"))await click('.mobile-menu')}
async function sectionLink(hash){await publicMenu();await click(`#main-navigation a[href='/#${hash}']`);await wait(`location.hash==='#${hash}'`);await new Promise(r=>setTimeout(r,900))}
try{
  await go('/login');await wait("!!document.querySelector('.login-preview-access')") // Refuse to run mutations against production.
  await evaluate('sessionStorage.clear()');await go('/')
  for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[768,1024],[390,844]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false})
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
    await go('/#home');await wait('window.scrollY<2');await wait("!document.querySelector('.site-header').classList.contains('is-scrolled')")
    const before=await evaluate("({height:document.querySelector('.site-header').getBoundingClientRect().height,hero:document.querySelector('#home').getBoundingClientRect().height,top:document.querySelector('#home').getBoundingClientRect().top})")
    assert.ok(Math.abs(before.top)<2,'Hero remains in its original position')
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.site-header')).position"),'sticky')
    await sectionLink('about');await wait("document.querySelector('.site-header').classList.contains('is-scrolled')")
    const bounds=await evaluate("({header:document.querySelector('.site-header').getBoundingClientRect().bottom,heading:document.querySelector('#cpc-about-heading').getBoundingClientRect().top,top:document.querySelector('.site-header').getBoundingClientRect().top,height:document.querySelector('.site-header').getBoundingClientRect().height,hero:document.querySelector('#home').getBoundingClientRect().height})")
    assert.ok(Math.abs(bounds.top)<2,'Header stays visible');assert.ok(bounds.heading>bounds.header+10,'Heading clears navbar');assert.equal(bounds.height,before.height);assert.equal(bounds.hero,before.hero)
    assert.equal(await evaluate("document.querySelector('#home').nextElementSibling.id"),'about')
    assert.equal(await evaluate("document.querySelectorAll('#about').length"),1)
    const paragraphs=await evaluate("[...document.querySelectorAll('.cpc-about-description>p,.cpc-philosophy>p')].map(p=>p.textContent)")
    assert.deepEqual(paragraphs,[...cpcDescription]);assert.equal(await evaluate("document.querySelector('.cpc-about-logo').complete&&document.querySelector('.cpc-about-logo').naturalWidth>0"),true)
    assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'No horizontal page overflow')
    assert.deepEqual(await evaluate("[...document.querySelectorAll('.cpc-pillar h3')].map(h=>h.textContent)"),['BUILD','SOLVE','IMPROVE'])
    assert.equal(await evaluate("getComputedStyle(document.documentElement).scrollBehavior"),'auto')
    await screenshot(`phase4-2-about-${width}x${height}`,'#about');await screenshot(`phase4-2-about-viewport-${width}x${height}`)
    await sectionLink('rules');assert.ok(await evaluate("document.querySelector('#rules').getBoundingClientRect().top>=document.querySelector('.site-header').getBoundingClientRect().bottom-1"))
    await sectionLink('schedule');assert.ok(await evaluate("document.querySelector('#schedule').getBoundingClientRect().top>=document.querySelector('.site-header').getBoundingClientRect().bottom-1"))
    await sectionLink('contact');assert.ok(await evaluate("document.querySelector('#contact').getBoundingClientRect().top>=document.querySelector('.site-header').getBoundingClientRect().bottom-1"))
    await sectionLink('home');await wait('scrollY<2');pass(`Exact About copy, original logo, responsive cards and sticky/anchor navigation at ${width}x${height}`)
  }
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await go('/#home');await wait('scrollY<2');await sectionLink('about');assert.equal(await evaluate("getComputedStyle(document.documentElement).scrollBehavior"),'smooth');await wait("getComputedStyle(document.querySelector('.cpc-about-heading')).opacity==='1'")
  await evaluate("window.scrollTo({top:document.querySelector('#rules').offsetTop,behavior:'instant'})");await sectionLink('about');await go('/login');await publicMenu();await click("#main-navigation a[href='/#about']");await wait("location.pathname==='/'&&location.hash==='#about'");await new Promise(r=>setTimeout(r,1000));assert.ok(await evaluate("document.querySelector('#cpc-about-heading').getBoundingClientRect().top>document.querySelector('.site-header').getBoundingClientRect().bottom"));pass('Smooth scrolling, repeat links, cross-route anchors and reduced-motion behavior work')
  for(const path of ['/arena','/admin','/admin/questions','/admin/contests','/volunteer','/volunteer/incidents']){await go(path);await wait("location.pathname==='/login'&&!!document.querySelector('#driver-id')")}
  pass('Unauthenticated protected and nested routes redirect to login')
  await login('CGP2026','Race2026!')
  for(const path of ['/admin','/admin/questions','/admin/contests','/admin/participants','/admin/results','/volunteer','/volunteer/incidents','/volunteer/participants','/ADMIN/questions','/%61dmin/questions','/admin/questions/'])await denied(path)
  await evaluate("localStorage.setItem('role','ADMIN');sessionStorage.setItem('role','ADMIN');sessionStorage.setItem('cgp-demo-driver',JSON.stringify({id:'CGP2026',role:'ADMIN'}));sessionStorage.setItem('cgp-mock-volunteer-preview','1')")
  await denied('/admin/questions?role=ADMIN');await evaluate("window.__reloadMarker='old'");await send('Page.reload',{ignoreCache:true});await wait("window.__reloadMarker===undefined&&!!document.querySelector('.access-denied')");assert.ok(await evaluate("document.querySelector('.access-denied').textContent.includes('403')"));await go('/');assert.equal(await evaluate("[...document.querySelectorAll('a')].some(a=>['/admin','/volunteer'].some(prefix=>{const path=new URL(a.href,location.href).pathname.toLowerCase();return path===prefix||path.startsWith(prefix+'/')}))"),false)
  pass('Candidate is denied every staff route, encoded/case variants, refresh and manipulated role fields; no staff links are exposed')
  await go('/check-in');await clickText('Enable camera');await wait("document.querySelector('video')?.srcObject?.active");await clickText('Activate fullscreen');await wait('!!document.fullscreenElement');await evaluate("document.querySelector('input[type=checkbox]').click()");await clickText('START YOUR ENGINE');await wait("location.pathname==='/lobby'");await clickText('Live race');await clickText('ENTER CODING ARENA');await wait("document.querySelector('.monitoring-status')?.textContent.includes('SECURE')")
  assert.equal(await evaluate("!!document.querySelector('.public-site-shell .site-header')"),false)
  const cockpit=await evaluate("({height:document.querySelector('.arena-workspace').getBoundingClientRect().height,viewport:innerHeight,statement:getComputedStyle(document.querySelector('.arena-problem-statement')).overflowY,editor:getComputedStyle(document.querySelector('.cm-scroller')).overflowY})")
  assert.ok(Math.abs(cockpit.height-cockpit.viewport)<2);assert.ok(['auto','scroll'].includes(cockpit.statement));assert.ok(['auto','scroll'].includes(cockpit.editor))
  await evaluate("document.querySelector('.monitoring-dev-panel').open=true");await clickText('Simulate tab switch');await wait("document.querySelector('.violation-session-meta')?.textContent.includes('LOCKED') && !document.querySelector('.violation-session-meta')?.textContent.includes('LOCK PENDING')");assert.ok(await evaluate("getComputedStyle(document.querySelector('.violation-lock-backdrop')).zIndex>40"));assert.equal(await evaluate("document.querySelector('.arena-run-button').disabled"),true);pass('Candidate arena remains authorized, with independent native pane scrolling and a visible blocking session overlay')
  await logout();await login('VOLUNTEER2026','Marshal2026!');await wait("!!document.querySelector('.volunteer-body')");for(const path of ['/admin','/admin/questions','/admin/contests'])await denied(path)
  await go('/volunteer/incidents');await wait("!!document.querySelector('.volunteer-body')");assert.equal(await evaluate("[...document.querySelectorAll('a')].some(a=>a.getAttribute('href')==='/admin'||a.getAttribute('href')?.startsWith('/admin/'))"),false);await clickText('Review incident');await wait("!!document.querySelector('.volunteer-review-card')");assert.ok(await evaluate("Number(getComputedStyle(document.querySelector('.volunteer-review-backdrop')).zIndex)>Number(getComputedStyle(document.querySelector('.volunteer-topbar')).zIndex)"));await clickText('AUTHORIZE RESUME');await wait("document.querySelector('.volunteer-confirmation')?.textContent.includes('authorization')");pass('Volunteer nested dashboard and incident authorization remain allowed; admin access and links remain blocked')
  await logout();await login('ADMIN2026','Control2026!');await wait("!!document.querySelector('.admin-kpis')")
  for(const [width,height] of [[1366,768],[390,844]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await go('/admin/questions');await wait("!!document.querySelector('.admin-table-wrap tbody tr')");await clickText('Add question');await wait("!!document.querySelector('.admin-form')");await evaluate("document.querySelector('.dashboard-route-shell>main').scrollTo({top:700,behavior:'instant'})");assert.ok(await evaluate("Math.abs(document.querySelector('.admin-topbar').getBoundingClientRect().top)<3"));assert.ok(await evaluate("document.querySelector('.dashboard-route-shell>main').scrollTop>100"));await screenshot(`phase4-2-admin-scroll-${width}x${height}`)
  }
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await go('/volunteer');await wait("!!document.querySelector('.volunteer-body')");assert.ok(await evaluate("[...document.querySelectorAll('a')].some(a=>a.getAttribute('href')==='/admin')"));pass('Admin and volunteer permissions are preserved; admin headers stay accessible while the real page container scrolls')
  assert.equal(qa.exceptions.length,0,qa.exceptions.join(','));await fs.mkdir('.qa',{recursive:true});await fs.writeFile('.qa/phase4-2-results.json',JSON.stringify(results,null,2))
} catch(error){await screenshot('phase4-2-failure').catch(()=>{});throw error} finally{await qa.close()}
