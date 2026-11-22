import assert from 'node:assert/strict'
import { browserQa } from './browser-qa.mjs'

const base = new URL(process.env.CGP_QA_BASE_URL || 'http://127.0.0.1:5173')
assert.ok(['localhost', '127.0.0.1'].includes(base.hostname))
const marker = await fetch(new URL('/api/__browser_fixture', base))
assert.equal(await marker.text(), 'cgp-isolated-browser-fixture', 'Use the disposable backend browser fixture.')

async function connect(port) {
  process.env.CGP_QA_CDP_URL = 'http://127.0.0.1:' + port
  const page = await browserQa()
  await page.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  return page
}
const candidate = await connect(9225)
const volunteer = await connect(9226)
const admin = await connect(9227)
const pages = [candidate, volunteer, admin]
const has = text => `document.body.innerText.includes(${JSON.stringify(text)})`
const enabled = selector => `!!document.querySelector(${JSON.stringify(selector + ':enabled')})`
const unavailable = 'Code execution is temporarily unavailable. Please contact Race Control.'
const trustedJudge = process.env.CGP_BROWSER_TRUSTED_JUDGE === 'true'
const unique = 'Integration question ' + Date.now()
const sourceMarker = '// phase9 retained draft'
const conceal = () => 'case-' + crypto.randomUUID()
function localTime(minutes) {
  const time = new Date(Date.now() + minutes * 60000)
  return new Date(+time - time.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

async function select(page, label, value) {
  await page.evaluate(`(() => {
    const field = [...document.querySelectorAll('label')].find(el => el.firstChild?.textContent.trim() === ${JSON.stringify(label)})?.querySelector('select')
    if (!field || ![...field.options].some(option => option.value === ${JSON.stringify(value)})) throw new Error('Missing select option for ' + ${JSON.stringify(label)})
    field.value = ${JSON.stringify(value)}
    field.dispatchEvent(new Event('change', {bubbles:true}))
  })()`)
}
async function fill(page, label, value) {
  const id = 'phase9-test-field'
  await page.evaluate(`(() => {
    document.querySelector('#${id}')?.removeAttribute('id')
    const field = [...document.querySelectorAll('label')].find(el => el.firstChild?.textContent.trim() === ${JSON.stringify(label)})?.querySelector('input,textarea')
    if (!field) throw new Error('Missing field ' + ${JSON.stringify(label)})
    field.id = '${id}'
  })()`)
  await page.input('#' + id, value)
}
async function clickRow(page, title, action) {
  const button = `[...document.querySelectorAll('tr')].find(row=>row.textContent.includes(${JSON.stringify(title)})) && [...[...document.querySelectorAll('tr')].find(row=>row.textContent.includes(${JSON.stringify(title)})).querySelectorAll('button')].find(button=>!button.disabled&&button.textContent.trim()===${JSON.stringify(action)})`
  await page.wait(`!!(${button})`)
  await page.evaluate(`(${button})?.click()`)
}
async function status(page, path) {
  return page.evaluate(`fetch(${JSON.stringify('/api' + path)}).then(response => response.status)`)
}

let stage = 'landing page'
try {
  await candidate.go('/#home')
  await candidate.wait("!!document.querySelector('.home-shell .hero-copy h1')")
  console.log('PASS landing page renders in API mode')

  stage = 'authentication'
  for (const page of pages) {
    await page.go('/login')
    await page.logout()
  }
  await candidate.login('CGP2026', 'Race2026!')
  await volunteer.login('VOLUNTEER2026', 'Marshal2026!')
  await admin.login('ADMIN2026', 'Control2026!')
  await admin.wait(has('Race administration'))
  await admin.wait("[...document.querySelectorAll('.admin-kpi')].some(kpi => kpi.innerText.includes('Active rounds') && kpi.querySelector('strong')?.textContent === '1')")
  assert.equal(await candidate.evaluate("document.cookie.includes('auth_token')"), false)
  assert.equal(await status(candidate, '/admin/overview'), 403)
  assert.equal(await status(candidate, '/volunteer/participants'), 403)
  await candidate.go('/admin')
  await candidate.wait(has('different pit pass'))
  await candidate.go('/volunteer')
  await candidate.wait(has('different pit pass'))
  console.log('PASS cookie login for all roles and candidate dashboard denial')

  stage = 'candidate check-in and judging'
  await candidate.send('Page.bringToFront')
  await candidate.go('/check-in')
  await candidate.evaluate(`navigator.mediaDevices.getUserMedia = () =>
    Promise.reject(new DOMException('Fixture camera request denied', 'NotAllowedError'))`)
  await candidate.clickText('Enable camera')
  await candidate.wait(has('Camera permission was denied'))
  assert.equal(await candidate.evaluate(enabled('#start-engine')), false)
  await candidate.evaluate('delete navigator.mediaDevices.getUserMedia')
  await candidate.clickText('Enable camera')
  await candidate.wait(has('Camera connected'))

  await candidate.evaluate(`(() => {
    const root = document.documentElement
    root.requestFullscreen = () => Promise.reject(new DOMException('Fixture fullscreen request denied', 'NotAllowedError'))
  })()`)
  await candidate.clickText('Activate fullscreen')
  await candidate.wait(has('Fixture fullscreen request denied'))
  assert.equal(await candidate.evaluate(enabled('#start-engine')), false)
  await candidate.evaluate('delete document.documentElement.requestFullscreen')
  await candidate.clickText('Activate fullscreen')
  console.log('PASS injected camera and fullscreen rejections block check-in until recovery')
  await candidate.click('.inspection-acknowledgment input')
  await candidate.click('#start-engine')
  await candidate.wait("location.pathname==='/lobby'")
  await candidate.wait(has('The lights are green!'))
  await candidate.clickText('ENTER CODING ARENA')
  await candidate.click('.arena-problem-item')
  await candidate.wait(`(${enabled('.arena-run-button')}) || ${has('Restore camera')}`)
  if (await candidate.evaluate(has('Restore camera'))) await candidate.clickText('Restore camera')
  await candidate.wait(enabled('.arena-run-button'))
  for (const [id, file, starter] of [
    ['python', 'main.py', 'import sys'],
    ['cpp', 'main.cpp', '#include <bits/stdc++.h>'],
    ['javascript', 'main.js', 'function solve(input)'],
    ['java', 'Main.java', 'public class Main'],
  ]) {
    await candidate.evaluate(`(() => {
      const language = document.querySelector('#arena-language')
      language.value = ${JSON.stringify(id)}
      language.dispatchEvent(new Event('change', { bubbles: true }))
    })()`)
    await candidate.wait(has(file))
    await candidate.wait(`document.querySelector('.cm-content')?.textContent.includes(${JSON.stringify(starter)})`)
  }
  console.log('PASS all four language starters load in CodeMirror')
  await candidate.wait(enabled('.arena-run-button'))
  if (trustedJudge) {
    await candidate.evaluate(`(() => {
      const language = document.querySelector('#arena-language')
      language.value = 'javascript'
      language.dispatchEvent(new Event('change', { bubbles: true }))
    })()`)
    await candidate.wait("document.querySelector('.cm-content')?.textContent.includes('function solve(input)')")
    const source = await candidate.evaluate("fetch('/api/__browser_source').then(r => r.text())")
    await candidate.evaluate("document.querySelector('.cm-content').focus()")
    for (const type of ['keyDown', 'keyUp']) {
      await candidate.send('Input.dispatchKeyEvent', { type, key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, modifiers: 2 })
    }
    await candidate.send('Input.insertText', { text: source })
    await candidate.wait(enabled('.arena-run-button'))
    await candidate.clickText('Run Code')
    await candidate.wait("document.querySelector('.arena-execution-summary.is-accepted')?.textContent.includes('Accepted')")
    await candidate.wait("document.querySelector('.arena-io-grid pre')?.textContent.trim() === '3 340'")
    await candidate.evaluate('performance.clearResourceTimings()')
    await candidate.clickText('Submit Code')
    await candidate.wait("!!document.querySelector('.arena-verdict-banner.verdict-success')")
    await candidate.wait("document.querySelector('.arena-progress-grid > div:last-child dd')?.textContent === '100'")
    const progressRequests = await candidate.evaluate(`performance.getEntriesByType('resource')
      .filter(entry => new URL(entry.name).pathname === '/api/contest/progress').length`)
    assert.equal(progressRequests, 1)
    console.log('PASS editor Run, real trusted execution, accepted Submit and a single authoritative progress refresh')
  } else {
    await candidate.evaluate('performance.clearResourceTimings()')
    for (const [label, action] of [['Run Code','run'],['Submit Code','submit']]) {
      await candidate.clickText(label)
      await candidate.wait(`performance.getEntriesByType('resource').some(entry=>entry.name.endsWith('/api/code/${action}') && entry.responseStatus===503)`)
      await candidate.wait(has(unavailable))
    }
    const busy = 'The judge is busy. Try again shortly.'
    const replyBusy = ({ data }) => {
      const message = JSON.parse(data)
      if (message.method !== 'Fetch.requestPaused') return
      void candidate.send('Fetch.fulfillRequest', {
        requestId: message.params.requestId,
        responseCode: 503,
        responseHeaders: [{ name: 'Content-Type', value: 'application/json' }],
        body: Buffer.from(JSON.stringify({ error: { code: 'JUDGE_BUSY', message: busy } })).toString('base64')
      })
    }
    candidate.socket.addEventListener('message', replyBusy)
    await candidate.send('Fetch.enable', { patterns: [{ urlPattern: new URL('/api/code/run', base).href }] })
    try {
      await candidate.clickText('Run Code')
      await candidate.wait(has(busy))
      assert.equal(await candidate.evaluate(has(unavailable)), false)
    } finally {
      await candidate.send('Fetch.disable')
      candidate.socket.removeEventListener('message', replyBusy)
    }
    console.log('PASS Run/Submit HTTP 503 outage and distinct judge busy messages')
  }

  stage = 'monitoring reconnection'
  await candidate.send('Network.enable')
  const network = { latency: 0, downloadThroughput: -1, uploadThroughput: -1 }
  await candidate.send('Network.emulateNetworkConditions', { ...network, offline: true })
  await candidate.wait("!!document.querySelector('.monitoring-health-banner') && !!document.querySelector('.arena-run-button:disabled')")
  await candidate.send('Network.emulateNetworkConditions', { ...network, offline: false })
  await candidate.wait(enabled('.arena-run-button'))
  console.log('PASS real API interruption gates execution and reconnect restores authorization')

  stage = 'monitoring authorization'
  await candidate.evaluate("document.querySelector('.cm-content').focus()")
  await candidate.send('Input.insertText', { text: sourceMarker + '\n' })
  await candidate.wait(`document.querySelector('.cm-content').textContent.includes(${JSON.stringify(sourceMarker)})`)
  await candidate.evaluate('document.exitFullscreen()')
  await candidate.wait(has('AWAITING AUTHORIZATION'))
  const arenaPath = await candidate.evaluate('location.pathname + location.search')
  await candidate.go('/lobby')
  await candidate.wait(has('Checked In'))
  await candidate.go(arenaPath)
  await candidate.wait(has('AWAITING AUTHORIZATION'))
  assert.equal(await candidate.evaluate(enabled('.arena-run-button')), false)
  await volunteer.input('input[aria-label="Search driver ID"]', 'CGP2026')
  await volunteer.wait(has('LOCKED'))
  await volunteer.clickText('Review session')
  await volunteer.wait(has('Unresolved blocking incidents: 1'))
  await volunteer.clickText('AUTHORIZE & RESUME SESSION')
  await volunteer.clickText('CONFIRM SESSION AUTHORIZATION')
  await volunteer.wait(has('Service confirmed session authorization'))
  await candidate.wait(has('Approved by'))
  if (await candidate.evaluate(has('Restore camera'))) await candidate.clickText('Restore camera')
  if (!await candidate.evaluate('!!document.fullscreenElement')) await candidate.clickText('Re-enter fullscreen')
  await candidate.wait(enabled('.arena-run-button'))
  assert.ok(await candidate.evaluate(`document.querySelector('.cm-content').textContent.includes(${JSON.stringify(sourceMarker)})`))
  console.log('PASS monitoring lock, volunteer receipt and editor draft preserved through resume')

  stage = 'admin question publishing'
  await admin.go('/admin/questions')
  await admin.clickText('Add question')
  await fill(admin, 'Title', unique)
  await fill(admin, 'Description', 'Integration fixture problem statement.')
  await fill(admin, 'Input format', 'One integer.')
  await fill(admin, 'Output format', 'One integer.')
  await fill(admin, 'Constraints', 'Input is between 1 and 10.')
  await fill(admin, 'Sample input', '1')
  await fill(admin, 'Sample output', '1')
  await admin.clickText('Add another hint')
  await fill(admin, 'Hint content', 'Fixture hint content')
  await fill(admin, 'Point deduction', '5')
  await admin.clickText('Save as draft')
  await admin.wait(has('Test cases'))
  await select(admin, 'Visibility', 'HIDDEN')
  const hiddenMarker = conceal()
  await fill(admin, 'Test input', hiddenMarker)
  await fill(admin, 'Expected output', conceal())
  await admin.clickText('Add test case')
  await admin.wait(has('Test case saved.'))
  await admin.clickText('All questions')
  await clickRow(admin, unique, 'Assign')
  await select(admin, 'Round', 'cgp_2026')
  await admin.clickText('Confirm assignment')
  await admin.wait(has('Question assigned to round.'))
  await clickRow(admin, unique, 'Publish')
  await admin.clickText('Publish now')
  await admin.wait(has('Question published.'))
  await candidate.wait(has(unique))
  await candidate.evaluate(`[...document.querySelectorAll('.arena-problem-item')].find(button=>button.textContent.includes(${JSON.stringify(unique)})).click()`)
  await candidate.wait(has('Integration fixture problem statement.'))
  const publicDetail = await candidate.evaluate("fetch('/api/contest/problems/'+new URLSearchParams(location.search).get('problem')).then(r=>r.text())")
  assert.ok(!publicDetail.includes(hiddenMarker))
  assert.ok(!publicDetail.includes('Fixture hint content'))
  await candidate.click('.race-assist summary')
  await candidate.click('.hint-locked')
  await candidate.clickText('UNLOCK HINT')
  await candidate.wait(has('Fixture hint content'))
  await candidate.wait(has('5 points deducted'))
  await candidate.screenshot('phase9-desktop-arena')
  await candidate.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await candidate.clickText('Code editor')
  assert.ok(await candidate.evaluate("document.querySelector('.cm-content').getBoundingClientRect().width > 0"))
  assert.ok(await candidate.evaluate('document.documentElement.scrollWidth <= innerWidth'))
  assert.ok(await candidate.evaluate("document.querySelector('.arena-submit-button').getBoundingClientRect().right <= innerWidth"))
  await candidate.screenshot('phase9-mobile-arena')
  await candidate.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  console.log('PASS admin draft, public sample, hidden test, hint, assignment and publication verified by candidate')

  stage = 'round changes and results'
  await admin.go('/admin/contests')
  await admin.clickText('Add round')
  await fill(admin, 'Round ID', 'browser-round-2')
  await fill(admin, 'Round title', 'Browser round two')
  await fill(admin, 'Starts at (local)', localTime(-5))
  await fill(admin, 'Ends at (local)', localTime(25))
  await admin.click('label.admin-checkbox input')
  await admin.clickText('Save round')
  await admin.wait(has('Browser round two'))
  await clickRow(admin, 'Round 1', 'Edit settings')
  await select(admin, 'Competition status', 'PAUSED_BY_ORGANIZER')
  await admin.clickText('Save round')
  await admin.wait(has('Round settings saved.'))
  await candidate.wait(has('Paused by organizer.'))
  await candidate.wait("!new URLSearchParams(location.search).has('problem')")
  assert.equal(await candidate.evaluate(has('Integration fixture problem statement.')), false)
  await clickRow(admin, 'Round 1', 'Edit settings')
  await select(admin, 'Competition status', 'LIVE')
  await admin.clickText('Save round')
  await candidate.wait(has(unique))
  await clickRow(admin, 'Round 1', 'Edit settings')
  await select(admin, 'Competition status', 'FINISHED')
  await admin.clickText('Save round')
  await candidate.wait("!document.querySelector('.arena-problem-item')")
  await clickRow(admin, 'Browser round two', 'Edit settings')
  await select(admin, 'Competition status', 'LIVE')
  await admin.clickText('Save round')
  await candidate.wait(has('Round 2 / Browser round two'))
  assert.equal(await candidate.evaluate(has('Integration fixture problem statement.')), false)
  assert.equal(await candidate.evaluate(has(unique)), false)
  await clickRow(admin, 'Browser round two', 'Edit settings')
  await select(admin, 'Competition status', 'FINISHED')
  await admin.clickText('Save round')
  await candidate.wait(has('Race Finished'))
  await candidate.go('/results')
  await candidate.wait(has('DRIVER STANDINGS'))
  await candidate.wait(has('CGP2026'))
  if (trustedJudge) {
    await candidate.wait("document.querySelector('.is-current-driver .standings-score')?.textContent === '100'")
    console.log('PASS leaderboard shows the server-awarded candidate score')
  }
  await admin.go('/admin/results')
  await admin.wait(has('Allow standings across the contest'))
  await admin.click('.admin-operation input[type=checkbox]')
  await admin.wait("!document.querySelector('.admin-operation input[type=checkbox]')?.checked")
  await candidate.go('/results')
  await candidate.wait(has('The classification is under review.'))
  await admin.clickText('View official standings')
  await admin.wait(has('DRIVER STANDINGS'))
  await admin.wait(has('CGP2026'))
  assert.equal(await volunteer.evaluate("fetch('/api/leaderboard').then(r=>r.json()).then(data=>data.rows.length)"), 0)
  await admin.go('/admin/results')
  await admin.wait(has('Allow standings across the contest'))
  await admin.click('.admin-operation input[type=checkbox]')
  await admin.wait("!!document.querySelector('.admin-operation input[type=checkbox]')?.checked")
  console.log('PASS organizer pause/resume/close, round two handoff, and leaderboard visibility')

  stage = 'refresh, mobile and logout'
  await candidate.go('/lobby')
  await candidate.wait(has('Checked In'))
  await candidate.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await candidate.go('/lobby')
  await candidate.wait(has('Checked In'))
  assert.ok(await candidate.evaluate('document.documentElement.scrollWidth <= innerWidth'))
  await candidate.screenshot('phase9-mobile-lobby')
  await candidate.click('[aria-label="Sign out"]')
  await candidate.wait(`!document.querySelector('[aria-label="Sign out"]')`)
  assert.equal(await status(candidate, '/auth/me'), 401)
  await candidate.go('/arena')
  await candidate.wait("location.pathname==='/login'")
  for (const page of pages) assert.deepEqual(page.exceptions, [])
  console.log('PASS rehydration, 390px lobby, logout, protected routing and browser exception checks')
} catch (error) {
  console.error('Phase 9 failed during ' + stage)
  console.error(await candidate.evaluate(`({
    fullscreen: !!document.fullscreenElement, visibility: document.visibilityState,
    monitoring: document.querySelector('.monitoring-status')?.innerText,
    notice: document.querySelector('.monitoring-health-banner')?.innerText
  })`))
  for (const page of pages) console.error(await page.evaluate("location.href+' '+document.body.innerText.slice(-1800)"))
  throw error
} finally {
  for (const page of pages) page.socket.close()
}
