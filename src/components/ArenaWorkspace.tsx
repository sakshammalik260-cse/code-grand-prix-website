import type { ReactNode } from 'react'

/** Layout slots for the next arena phase. Supply a CodeMirror 6 editor in `editor`. */
export interface ArenaWorkspaceProps {
  topBar: ReactNode
  problemNavigation: ReactNode
  problemStatement: ReactNode
  editor: ReactNode
  editorActions: ReactNode
  results: ReactNode
}

export function ArenaWorkspace({ topBar, problemNavigation, problemStatement, editor, editorActions, results }: ArenaWorkspaceProps) {
  return <div className="arena-workspace">
    <header className="arena-topbar">{topBar}</header>
    <div className="arena-panes">
      <nav className="arena-problem-navigation" aria-label="Problems">{problemNavigation}</nav>
      <section className="arena-problem-statement" aria-label="Problem statement">{problemStatement}</section>
      <section className="arena-editor-column" aria-label="Coding workspace">
        <div className="arena-editor">{editor}</div>
        <div className="arena-editor-actions">{editorActions}</div>
        <section className="arena-results" aria-label="Test case results">{results}</section>
      </section>
    </div>
  </div>
}
