import assert from 'node:assert/strict'
import { browserQa } from './browser-qa.mjs'
import { cpcDescription } from '../src/data/cpc.ts'

const qa = await browserQa()
const { send, evaluate, wait, go, click, screenshot } = qa
const intro = '.race-intro[open]'
const seen = 'cgp-race-intro-seen'
const preference = 'cgp-home-reduced-animation'
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

async function freshIntro() {
  await go('/login')
  await evaluate(`sessionStorage.removeItem('${seen}'); localStorage.removeItem('${preference}')`)
  await go('/')
}

async function openMenu() {
  if (await evaluate("getComputedStyle(document.querySelector('.mobile-menu')).display !== 'none' && !document.querySelector('#main-navigation').classList.contains('open')")) {
    await click('.mobile-menu')
  }
}

try {
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await freshIntro()
  await wait(`!!document.querySelector('${intro}')`)
  assert.equal(await evaluate("document.activeElement.textContent.includes('SKIP INTRO')"), true)
  await screenshot('phase45-intro')
  await wait(`!document.querySelector('${intro}')`)
  assert.equal(await evaluate(`sessionStorage.getItem('${seen}')`), '1')
  await go('/login')
  await go('/')
  assert.equal(await evaluate(`!!document.querySelector('${intro}')`), false)

  await freshIntro()
  await click('.race-intro button')
  await wait(`!document.querySelector('${intro}')`)

  await freshIntro()
  for (const type of ['keyDown', 'keyUp']) {
    await send('Input.dispatchKeyEvent', { type, key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
  }
  await wait(`!document.querySelector('${intro}')`)

  await freshIntro()
  await click('.race-intro a')
  await wait("location.pathname === '/login' && !!document.querySelector('#driver-id')")
  console.log('PASS intro completion, session persistence, Skip, Escape and direct Driver Login')

  for (const [width, height] of [[1920, 1080], [1440, 900], [1366, 768], [768, 1024], [390, 844]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
    await go('/')
    await evaluate('document.fonts.ready')
    await wait("document.querySelector('.hero-copy').classList.contains('home-revealed')")
    await delay(520)
    assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true)
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.site-header')).position"), 'sticky')
    assert.equal(await evaluate("document.querySelectorAll('.home-nav-number').length"), 6)
    const overlap = await evaluate(`(() => {
      const nav = document.querySelector('#main-navigation');
      if (getComputedStyle(nav).display === 'none') return false;
      return nav.getBoundingClientRect().right > document.querySelector('.nav-actions').getBoundingClientRect().left ||
        nav.querySelector('.home-nav-number').getBoundingClientRect().left < document.querySelector('.club-mark').getBoundingClientRect().right;
    })()`)
    assert.equal(overlap, false, `Navbar overlap at ${width}x${height}`)
    await screenshot(`phase45-hero-${width}x${height}`)
    await openMenu()
    await click('#main-navigation a[href="/#about"]')
    await wait("document.querySelector('#main-navigation [aria-current=location]')?.hash === '#about'")
    await wait("document.querySelector('.cpc-about-heading').classList.contains('home-revealed')")
    assert.deepEqual(await evaluate("[...document.querySelectorAll('.cpc-about-description > p,.cpc-philosophy > p')].map(p => p.textContent)"), [...cpcDescription])
    assert.ok(await evaluate("document.querySelector('#about').getBoundingClientRect().top >= document.querySelector('.site-header').getBoundingClientRect().bottom - 1"))
    for (let index = 0; index < 3; index++) {
      await evaluate(`document.querySelectorAll('.cpc-pillar')[${index}].scrollIntoView({block:'center', behavior:'instant'})`)
      await wait(`document.querySelectorAll('.cpc-pillar')[${index}].classList.contains('home-revealed')`)
    }
    assert.deepEqual(await evaluate("[...document.querySelectorAll('.cpc-pillar')].map(el => getComputedStyle(el).animationDelay)"), ['0s', '0.06s', '0.12s'])
    console.log(`PASS ${width}x${height} hero geometry, sticky anchors, About copy and staggered cards`)
  }

  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  for (const id of ['schedule', 'rules', 'contact', 'home']) {
    await evaluate(`document.querySelector('#${id}').scrollIntoView({behavior:'instant'})`)
    await wait(`document.querySelector('#main-navigation [aria-current=location]')?.hash === '#${id}'`)
  }
  await click('.home-motion-preference summary')
  await click('.home-motion-options input')
  await go('/')
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.living-race-background')).display"), 'none')
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.hero-copy')).animationName"), 'none')
  assert.equal(await evaluate(`localStorage.getItem('${preference}')`), '1')
  await evaluate(`localStorage.removeItem('${preference}'); sessionStorage.removeItem('${seen}')`)
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await go('/')
  assert.equal(await evaluate(`!!document.querySelector('${intro}')`), false)
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.hero-copy')).animationName"), 'none')
  assert.equal(await evaluate("!!document.fullscreenElement || !!document.querySelector('video, .monitoring-status')"), false)
  const countdown = await evaluate("document.querySelector('.race-countdown-panel .countdown').textContent")
  await delay(1250)
  assert.notEqual(await evaluate("document.querySelector('.race-countdown-panel .countdown').textContent"), countdown)
  await click('.hero-grid-entry a')
  await wait("location.pathname === '/login' && !!document.querySelector('#driver-id')")
  assert.equal(qa.exceptions.length, 0, qa.exceptions.join(', '))
  console.log('PASS scroll highlighting, persistent motion preference, system reduced motion, countdown and Enter the Grid')
} finally {
  await qa.close()
}
