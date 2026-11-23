import type { LanguageId } from '../../../types/arena'
import type { SyntaxTopic } from '../../../data/syntaxLibrary/types'
import { SyntaxCodeBlock } from './SyntaxCodeBlock'

interface Props {
  topic: SyntaxTopic
  language: LanguageId
  categoryTitle?: string
}

export function SyntaxTopicCard({ topic, language, categoryTitle }: Props) {
  const example = topic.languages[language]

  if (!example) {
    return null
  }

  return (
    <article className="syntax-topic-card" id={`topic-${topic.id}`}>
      <div className="syntax-topic-header">
        <div className="syntax-topic-titles">
          <div className="syntax-topic-meta">
            {categoryTitle && <span className="syntax-category-tag">{categoryTitle}</span>}
          </div>
          <h3 className="syntax-topic-name">{topic.title}</h3>
        </div>
      </div>

      <p className="syntax-topic-summary">{topic.summary}</p>
      {topic.explanation && topic.explanation !== topic.summary && (
        <p className="syntax-topic-explanation">{topic.explanation}</p>
      )}

      <SyntaxCodeBlock
        code={example.code}
        language={language}
        notes={example.notes}
        topicTitle={topic.title}
      />
    </article>
  )
}
