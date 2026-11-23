import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode, PointerEvent, KeyboardEvent } from 'react'
import { useRef } from 'react'

export interface ArenaWorkspaceProps {
  topBar: ReactNode
  problemNavigation: ReactNode
  problemStatement: ReactNode
  editor: ReactNode
  editorActions: ReactNode
  results: ReactNode
  mobileNavigation?: ReactNode
  notice?: ReactNode
  statusBar?: ReactNode
  mobileView?: 'statement' | 'code' | 'results'
  focusMode?: boolean
  navigationCollapsed?: boolean
}

export function ArenaWorkspace({
  topBar,
  problemNavigation,
  problemStatement,
  editor,
  editorActions,
  results,
  mobileNavigation,
  notice,
  statusBar,
  mobileView = 'code',
  focusMode = false,
  navigationCollapsed = false
}: ArenaWorkspaceProps) {
  const [height, setHeight] = useState(() => Math.min(280, Math.max(180, window.innerHeight * 0.3)))
  const drag = useRef<{ y: number; height: number } | null>(null)

  useEffect(() => {
    const clamp = () => setHeight(current => Math.max(130, Math.min(window.innerHeight * 0.42, current)))
    window.addEventListener('resize', clamp)
    return () => window.removeEventListener('resize', clamp)
  }, [])

  function resize(event: PointerEvent<HTMLDivElement>) {
    if (drag.current) {
      setHeight(Math.max(130, Math.min(window.innerHeight * 0.42, drag.current.height + drag.current.y - event.clientY)))
    }
  }

  function resizeByKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      setHeight(current => Math.max(130, Math.min(window.innerHeight * 0.42, current + (event.key === 'ArrowUp' ? 20 : -20))))
    }
  }

  return (
    <div
      className="arena-workspace"
      data-mobile-view={mobileView}
      data-focus-mode={focusMode}
      data-nav-collapsed={navigationCollapsed}
      style={{ '--arena-results-height': `${height}px` } as CSSProperties}
    >
      {topBar}
      {mobileNavigation}
      {notice}
      <div className="arena-panes">
        {problemNavigation}
        <section className="arena-problem-statement" aria-label="Problem statement">
          {problemStatement}
        </section>
        <section className="arena-editor-column" aria-label="Coding workspace">
          <div className="arena-editor">{editor}</div>
          <div className="arena-editor-actions">{editorActions}</div>
          <div
            className="arena-result-resizer"
            role="separator"
            aria-label="Resize editor and results"
            aria-orientation="horizontal"
            aria-valuemin={130}
            aria-valuemax={Math.floor(window.innerHeight * 0.42)}
            aria-valuenow={Math.round(height)}
            tabIndex={0}
            onKeyDown={resizeByKey}
            onPointerDown={event => {
              drag.current = { y: event.clientY, height }
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerMove={resize}
            onPointerUp={event => {
              drag.current = null
              event.currentTarget.releasePointerCapture(event.pointerId)
            }}
            onPointerCancel={() => {
              drag.current = null
            }}
          >
            <span />
          </div>
          <section className="arena-results" aria-label="Test case results">
            {results}
          </section>
        </section>
      </div>
      {statusBar}
    </div>
  )
}
