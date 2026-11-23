import type { LanguageId } from '../../types/arena'

export interface SyntaxCategory {
  id: string
  title: string
  shortTitle: string
  description: string
  iconName: string
  order: number
}

export interface LanguageExample {
  code: string
  imports?: string
  explanation?: string
  notes?: string
}

export interface SyntaxTopic {
  id: string
  categoryId: string
  title: string
  summary: string
  explanation: string
  keywords: string[]
  quickReference?: boolean
  languages: Record<LanguageId, LanguageExample>
}

export interface QuickReferenceItem {
  id: string
  label: string
  topicId: string
  categoryId: string
}
