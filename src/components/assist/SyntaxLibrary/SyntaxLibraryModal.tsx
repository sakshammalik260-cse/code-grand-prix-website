import { useState, useMemo, useCallback } from 'react'
import {
  BookOpen,
  Search,
  X,
  Zap,
  Filter,
} from 'lucide-react'
import { RaceDialog } from '../RaceDialog'
import { languages } from '../../../data/starterCode'
import {
  syntaxCategories,
  searchSyntaxTopics,
  quickReferenceList,
  allSyntaxTopics,
} from '../../../data/syntaxLibrary'
import type { LanguageId } from '../../../types/arena'
import { SyntaxTopicCard } from './SyntaxTopicCard'

interface Props {
  initialLanguage: LanguageId
  onClose: () => void
}

export function SyntaxLibraryModal({ initialLanguage, onClose }: Props) {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageId>(initialLanguage)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const handleLanguageChange = useCallback((lang: LanguageId) => {
    setSelectedLanguage(lang)
  }, [])

  const handleCategorySelect = useCallback((catId: string) => {
    setSelectedCategory(catId)
  }, [])

  const handleQuickReference = useCallback((topicId: string, categoryId: string) => {
    setSelectedCategory(categoryId)
    setSearchQuery('')
    setTimeout(() => {
      const el = document.getElementById(`topic-${topicId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 50)
  }, [])

  const filteredTopics = useMemo(() => {
    return searchSyntaxTopics(searchQuery, selectedLanguage, selectedCategory)
  }, [searchQuery, selectedLanguage, selectedCategory])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allSyntaxTopics.length }
    for (const cat of syntaxCategories) {
      counts[cat.id] = allSyntaxTopics.filter(t => t.categoryId === cat.id).length
    }
    return counts
  }, [])

  return (
    <RaceDialog
      titleId="syntax-library-title"
      onClose={onClose}
      className="syntax-library-dialog"
    >
      <div className="syntax-library-container">
        {/* Top Header */}
        <div className="syntax-lib-header">
          <div className="syntax-lib-title-row">
            <span className="assist-eyebrow">COCKPIT REFERENCE // ZERO PENALTY</span>
            <div className="syntax-lib-title-wrap">
              <h2 id="syntax-library-title" className="syntax-lib-heading">
                <BookOpen size={22} className="text-red-500" />
                <span>Syntax Library 2.0</span>
              </h2>
              <span className="syntax-badge-free">FREE / NO DEDUCTION</span>
            </div>
            <p className="syntax-lib-subtext">
              Quick-reference guide for programming language syntax, standard libraries, and common operations.
              Pure language references — no problem-specific solutions or algorithms.
            </p>
          </div>

          {/* Controls: Language Selector & Search */}
          <div className="syntax-lib-controls">
            <div className="syntax-language-bar">
              <span className="syntax-control-label">REFERENCE LANGUAGE:</span>
              <div className="syntax-language-pills" role="radiogroup" aria-label="Reference Language">
                {languages.map(lang => {
                  const isActive = lang.id === selectedLanguage
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      className={`syntax-lang-pill ${isActive ? 'is-active' : ''}`}
                      onClick={() => handleLanguageChange(lang.id)}
                    >
                      {lang.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="syntax-search-box">
              <Search size={15} className="syntax-search-icon" />
              <input
                type="text"
                placeholder="Search topics (e.g. for loop, sort, hashmap, input)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="syntax-search-input"
                aria-label="Search syntax reference topics"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="syntax-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search query"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Reference Bar */}
          <div className="syntax-quick-ref-bar">
            <div className="syntax-quick-ref-label">
              <Zap size={12} className="text-amber-400" />
              <span>QUICK REFERENCE:</span>
            </div>
            <div className="syntax-quick-ref-pills">
              {quickReferenceList.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className="syntax-quick-ref-pill"
                  onClick={() => handleQuickReference(item.topicId, item.categoryId)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="syntax-categories-bar" role="tablist" aria-label="Syntax Categories">
            <button
              type="button"
              role="tab"
              aria-selected={selectedCategory === 'all'}
              className={`syntax-cat-tab ${selectedCategory === 'all' ? 'is-active' : ''}`}
              onClick={() => handleCategorySelect('all')}
            >
              <span>All Topics</span>
              <small className="syntax-cat-count">{categoryCounts.all}</small>
            </button>
            {syntaxCategories.map(cat => {
              const isActive = cat.id === selectedCategory
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`syntax-cat-tab ${isActive ? 'is-active' : ''}`}
                  onClick={() => handleCategorySelect(cat.id)}
                >
                  <span>{cat.shortTitle}</span>
                  <small className="syntax-cat-count">{categoryCounts[cat.id]}</small>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content Body: Topic List */}
        <div className="syntax-topics-scroll-area">
          <div className="syntax-topics-list">
            {filteredTopics.length > 0 ? (
              filteredTopics.map(topic => {
                const category = syntaxCategories.find(c => c.id === topic.categoryId)
                return (
                  <SyntaxTopicCard
                    key={topic.id}
                    topic={topic}
                    language={selectedLanguage}
                    categoryTitle={category?.title}
                  />
                )
              })
            ) : (
              <div className="syntax-empty-state">
                <Filter size={32} className="syntax-empty-icon" />
                <h4>No matching syntax topics found</h4>
                <p>
                  No reference topics matched &ldquo;{searchQuery}&rdquo; in {selectedCategory === 'all' ? 'any category' : selectedCategory}.
                </p>
                <button
                  type="button"
                  className="syntax-empty-reset"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('all')
                  }}
                >
                  Clear Filters & Show All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="syntax-library-footer">
          <span className="syntax-footer-note">
            Selected language: <strong>{languages.find(l => l.id === selectedLanguage)?.label}</strong>.
            Copy snippets when needed. Your editor draft and selected problem remain untouched.
          </span>
          <button type="button" className="assist-secondary" onClick={onClose}>
            CLOSE REFERENCE (ESC)
          </button>
        </div>
      </div>
    </RaceDialog>
  )
}
