import assert from 'node:assert/strict'
import {
  allSyntaxTopics,
  syntaxCategories,
  quickReferenceList,
  searchSyntaxTopics,
  getTopicsByCategory,
} from '../src/data/syntaxLibrary/index.ts'

console.log(`Verifying Syntax Library: ${allSyntaxTopics.length} topics across ${syntaxCategories.length} categories...`)

// 1. Categories verification
assert.equal(syntaxCategories.length, 10, 'Expected exactly 10 categories')
const expectedCategories = [
  'basics',
  'conditions',
  'loops',
  'arrays',
  'sorting',
  'strings',
  'functions',
  'matrices',
  'data-structures',
  'standard-library',
]
const categoryIds = syntaxCategories.map(c => c.id)
assert.deepEqual(categoryIds, expectedCategories, 'Categories must match exact expected order')

// 2. Uniqueness of topic IDs
const topicIds = new Set()
for (const topic of allSyntaxTopics) {
  assert.ok(!topicIds.has(topic.id), `Duplicate topic ID found: ${topic.id}`)
  topicIds.add(topic.id)
  assert.ok(categoryIds.includes(topic.categoryId), `Topic ${topic.id} has invalid categoryId ${topic.categoryId}`)
  assert.ok(topic.title.trim().length > 0, `Topic ${topic.id} missing title`)
  assert.ok(topic.summary.trim().length > 0, `Topic ${topic.id} missing summary`)
  assert.ok(Array.isArray(topic.keywords) && topic.keywords.length > 0, `Topic ${topic.id} missing keywords`)

  // 3. All 4 languages supported per topic
  const languages = ['python', 'java', 'cpp', 'javascript']
  for (const lang of languages) {
    const example = topic.languages[lang]
    assert.ok(example, `Topic ${topic.id} missing example for language ${lang}`)
    assert.ok(example.code && example.code.trim().length > 0, `Topic ${topic.id} has empty code for language ${lang}`)
  }
}
console.log(`PASS All ${allSyntaxTopics.length} topics verified with all 4 languages (Python, Java, C++, JavaScript).`)

// 4. Quick reference list verification
assert.ok(quickReferenceList.length >= 6, 'Expected at least 6 quick reference items')
for (const qr of quickReferenceList) {
  assert.ok(topicIds.has(qr.topicId), `Quick reference ${qr.id} references non-existent topic ${qr.topicId}`)
}
console.log(`PASS Quick reference shortcuts resolve to valid topics.`)

// 5. Category grouping verification
for (const catId of categoryIds) {
  const topicsInCat = getTopicsByCategory(catId)
  assert.ok(topicsInCat.length > 0, `Category ${catId} has zero topics`)
}
console.log(`PASS Every category contains populated reference topics.`)

// 6. Search verification
const testQueries = [
  { q: 'for loop', expectedMin: 2 },
  { q: 'sort', expectedMin: 2 },
  { q: 'reverse', expectedMin: 2 },
  { q: 'input', expectedMin: 1 },
  { q: 'map', expectedMin: 1 },
  { q: 'nested', expectedMin: 1 },
]

for (const { q, expectedMin } of testQueries) {
  for (const lang of ['python', 'java', 'cpp', 'javascript']) {
    const results = searchSyntaxTopics(q, lang)
    assert.ok(
      results.length >= expectedMin,
      `Search query "${q}" for ${lang} returned ${results.length} results, expected at least ${expectedMin}`
    )
  }
}
console.log(`PASS Search engine correctly indexes and filters across titles, keywords, summaries, and code.`)

console.log('PASS Syntax Library 2.0 verification completed successfully!')
