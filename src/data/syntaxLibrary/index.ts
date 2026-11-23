import { syntaxCategories } from './categories.ts'
import { basicsTopics } from './topics/basics.ts'
import { conditionsTopics } from './topics/conditions.ts'
import { loopsTopics } from './topics/loops.ts'
import { arraysTopics } from './topics/arrays.ts'
import { sortingTopics } from './topics/sorting.ts'
import { stringsTopics } from './topics/strings.ts'
import { functionsTopics } from './topics/functions.ts'
import { matricesTopics } from './topics/matrices.ts'
import { dataStructuresTopics } from './topics/dataStructures.ts'
import { standardLibraryTopics } from './topics/standardLibrary.ts'
import type { LanguageId } from '../../types/arena'
import type { QuickReferenceItem, SyntaxTopic } from './types.ts'

export * from './types.ts'
export { syntaxCategories }

export const allSyntaxTopics: SyntaxTopic[] = [
  ...basicsTopics,
  ...conditionsTopics,
  ...loopsTopics,
  ...arraysTopics,
  ...sortingTopics,
  ...stringsTopics,
  ...functionsTopics,
  ...matricesTopics,
  ...dataStructuresTopics,
  ...standardLibraryTopics,
]

export const quickReferenceList: QuickReferenceItem[] = [
  { id: 'qr-for-loop', label: 'For Loop (0 to N)', topicId: 'for-loop-0-to-n', categoryId: 'loops' },
  { id: 'qr-while-loop', label: 'While Loop', topicId: 'while-loop-basic', categoryId: 'loops' },
  { id: 'qr-sort', label: 'Sort Array', topicId: 'sort-ascending', categoryId: 'sorting' },
  { id: 'qr-io', label: 'Input / Output', topicId: 'reading-input', categoryId: 'basics' },
  { id: 'qr-array-init', label: 'Array Declaration', topicId: 'array-creation', categoryId: 'arrays' },
  { id: 'qr-string-ops', label: 'String Operations', topicId: 'string-declaration-length', categoryId: 'strings' },
  { id: 'qr-map', label: 'Map / HashMap', topicId: 'ds-map', categoryId: 'data-structures' },
]

export function getTopicsByCategory(categoryId: string): SyntaxTopic[] {
  return allSyntaxTopics.filter(topic => topic.categoryId === categoryId)
}

export function searchSyntaxTopics(query: string, language: LanguageId, categoryId?: string): SyntaxTopic[] {
  const normalized = query.trim().toLowerCase()
  let filtered = allSyntaxTopics

  if (categoryId && categoryId !== 'all') {
    filtered = filtered.filter(t => t.categoryId === categoryId)
  }

  if (!normalized) {
    return filtered
  }

  const terms = normalized.split(/\s+/).filter(Boolean)

  return filtered.filter(topic => {
    const langExample = topic.languages[language]
    const textToMatch = [
      topic.title,
      topic.summary,
      topic.explanation,
      ...topic.keywords,
      langExample?.notes || '',
      langExample?.code || '',
    ].join(' ').toLowerCase()

    return terms.every(term => textToMatch.includes(term))
  })
}
