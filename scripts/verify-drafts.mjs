import assert from 'node:assert/strict'
import { draftKey, readDraft, writeDraft } from '../src/services/draftStore.ts'

const data = new Map()
const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }
Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true })
const scope = { contestId:'contest:a',driverId:'driver',problemId:'p2',language:'cpp' }
const key = draftKey(scope)
const otherLanguage = draftKey({ ...scope, language:'python' })
const otherDriver = draftKey({ ...scope, driverId:'other' })
const otherContest = draftKey({ ...scope, contestId:'other' })
assert.equal(new Set([key, otherLanguage, otherDriver, otherContest]).size, 4)
assert.notEqual(draftKey({ ...scope, contestId:'a:b',driverId:'c' }), draftKey({ ...scope, contestId:'a',driverId:'b:c' }))
console.log('PASS contest/driver/problem/language scoping, including delimiter-safe keys')
assert.equal(writeDraft(key,'// original'),true)
assert.equal(readDraft(key,'starter').sourceCode,'// original')
assert.equal(readDraft(otherDriver,'starter').sourceCode,'starter')
assert.equal(readDraft(otherContest,'starter').sourceCode,'starter')
console.log('PASS saved drafts restore without leaking into another driver or contest')
storage.setItem(otherLanguage,JSON.stringify({version:1,sourceCode:'',updatedAt:'2026-11-17T00:00:00Z'}))
assert.equal(readDraft(otherLanguage,'starter').sourceCode,'')
console.log('PASS intentionally empty draft is preserved instead of replaced by starter code')
const corruptKey=draftKey({ ...scope,problemId:'corrupt' })
storage.setItem(corruptKey,'{broken JSON')
const corrupt=readDraft(corruptKey,'starter')
assert.equal(corrupt.error,true);assert.equal(corrupt.needsWrite,false)
assert.equal(storage.getItem(corruptKey),'{broken JSON')
console.log('PASS corrupt saved data is reported and not silently overwritten')
const fallbackKey=draftKey({ ...scope,problemId:'fallback' })
const originalSet=storage.setItem
storage.setItem=()=>{throw new Error('Quota exceeded')}
assert.equal(writeDraft(fallbackKey,'// unsaved draft'),false)
assert.equal(readDraft(fallbackKey,'starter').sourceCode,'// unsaved draft')
assert.equal(readDraft(fallbackKey,'starter').needsWrite,true)
storage.setItem=originalSet
assert.equal(writeDraft(fallbackKey,readDraft(fallbackKey,'starter').sourceCode),true)
assert.equal(JSON.parse(storage.getItem(fallbackKey)).sourceCode,'// unsaved draft')
assert.equal(readDraft(fallbackKey,'starter').needsWrite,false)
console.log('PASS failed writes retain retryable in-memory drafts and recover when storage returns')
const originalGet=storage.getItem
storage.getItem=()=>{throw new Error('Storage blocked')}
const blocked=readDraft(draftKey({ ...scope,problemId:'blocked' }),'starter')
assert.equal(blocked.error,true);assert.equal(blocked.sourceCode,'starter');assert.equal(blocked.needsWrite,false)
storage.getItem=originalGet
console.log('PASS blocked storage falls back without marking starter text for automatic overwrite')
