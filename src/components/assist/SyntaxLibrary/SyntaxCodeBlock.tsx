import { useState, useCallback, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'
import type { LanguageId } from '../../../types/arena'

interface Props {
  code: string
  language: LanguageId
  notes?: string
  topicTitle: string
}

interface CodeToken {
  type: 'keyword' | 'string' | 'comment' | 'number' | 'type' | 'text'
  text: string
}

function tokenize(code: string): CodeToken[] {
  // Regex tokenizing comments, strings, numbers, keywords, and types
  const tokenRegex = /(?:\/\/.*|#.*|\/\*[\s\S]*?\*\/)|(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(?:\b(?:0x[0-9a-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?n?)\b)|(?:\b(?:def|class|return|if|elif|else|for|while|break|continue|import|from|as|in|is|not|and|or|match|case|lambda|public|private|static|void|int|long|double|float|char|boolean|bool|auto|const|constexpr|switch|default|new|try|catch|throw|throws|function|let|var|yield|async|await|using|namespace|nullptr|null|true|false|True|False|None)\b)|(?:\b[A-Z][a-zA-Z0-9_]*\b|\b(?:vector|string|pair|map|set|stack|queue|deque|unordered_map|unordered_set|priority_queue)\b)/g

  const tokens: CodeToken[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tokenRegex.exec(code)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', text: code.slice(lastIndex, match.index) })
    }

    const matchedText = match[0]
    if (matchedText.startsWith('//') || matchedText.startsWith('#') || matchedText.startsWith('/*')) {
      tokens.push({ type: 'comment', text: matchedText })
    } else if (matchedText.startsWith('"') || matchedText.startsWith("'") || matchedText.startsWith('`')) {
      tokens.push({ type: 'string', text: matchedText })
    } else if (/^(?:0x[0-9a-fA-F]+|\d)/.test(matchedText)) {
      tokens.push({ type: 'number', text: matchedText })
    } else if (/^[A-Z]|^(?:vector|string|pair|map|set|stack|queue|deque|unordered_map|unordered_set|priority_queue)$/.test(matchedText) &&
               !/^(?:True|False|None)$/.test(matchedText)) {
      tokens.push({ type: 'type', text: matchedText })
    } else {
      tokens.push({ type: 'keyword', text: matchedText })
    }

    lastIndex = tokenRegex.lastIndex
  }

  if (lastIndex < code.length) {
    tokens.push({ type: 'text', text: code.slice(lastIndex) })
  }

  return tokens
}

export function SyntaxCodeBlock({ code, language, notes, topicTitle }: Props) {
  const [copied, setCopied] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState('')

  const tokens = useMemo(() => tokenize(code), [code])

  const copy = useCallback(async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API is unavailable in this environment.')
      }
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setCopyFeedback('Copied!')
      const timer = setTimeout(() => {
        setCopied(false)
        setCopyFeedback('')
      }, 2000)
      return () => clearTimeout(timer)
    } catch {
      setCopyFeedback('Copy failed')
      const timer = setTimeout(() => setCopyFeedback(''), 2000)
      return () => clearTimeout(timer)
    }
  }, [code])

  return (
    <div className="syntax-code-block">
      <div className="syntax-code-header">
        <span className="syntax-code-lang">{language.toUpperCase()}</span>
        <button
          type="button"
          className="syntax-copy-button"
          onClick={() => void copy()}
          aria-label={`Copy ${topicTitle} ${language} code snippet`}
          title="Copy snippet"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span className="syntax-copy-label text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span className="syntax-copy-label">Copy</span>
            </>
          )}
        </button>
      </div>

      <pre className="syntax-code-pre" tabIndex={0} aria-label={`${topicTitle} code snippet`}>
        <code>
          {tokens.map((token, index) => {
            if (token.type === 'text') {
              return token.text
            }
            return (
              <span key={index} className={`syntax-token-${token.type}`}>
                {token.text}
              </span>
            )
          })}
        </code>
      </pre>

      {notes && (
        <div className="syntax-code-notes">
          <span className="syntax-note-badge">NOTE</span>
          <span>{notes}</span>
        </div>
      )}

      {copyFeedback && !copied && (
        <div className="syntax-copy-status" role="status">
          {copyFeedback}
        </div>
      )}
    </div>
  )
}
