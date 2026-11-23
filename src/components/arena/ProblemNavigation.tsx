import { Check, Circle, Flag, Gauge, LockKeyhole, PanelLeftClose, PanelLeftOpen, Play, Trophy } from 'lucide-react'
import type { DriverProgress, ProblemSummary } from '../../types/arena'

interface Props {
  problems: ProblemSummary[]
  selected: string
  progress: DriverProgress | null
  busy: boolean
  round: string
  onSelect: (id: string) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function ProblemNavigation({
  problems,
  selected,
  progress,
  busy,
  round,
  onSelect,
  collapsed = false,
  onToggleCollapse
}: Props) {
  const progressKnown = progress !== null
  const attempted = progress?.attemptedProblemIds || []
  const solved = progress?.solvedProblemIds || []
  const solvedPercent = progress?.totalProblems ? Math.min(100, (solved.length / progress.totalProblems) * 100) : 0

  return (
    <aside
      className={`arena-problem-navigation ${collapsed ? 'is-collapsed' : ''}`}
      aria-label="Driver problem garage"
    >
      <div className="arena-sidebar-heading">
        {!collapsed && (
          <>
            <div className="arena-sidebar-heading-text">
              <span>{round.toUpperCase()}</span>
              <strong>Problem Garage</strong>
            </div>
            {onToggleCollapse && (
              <button
                type="button"
                className="arena-collapse-btn"
                onClick={onToggleCollapse}
                title="Collapse Problem Garage (Ctrl+B)"
                aria-label="Collapse Problem Garage"
              >
                <PanelLeftClose size={15} />
              </button>
            )}
          </>
        )}
        {collapsed && onToggleCollapse && (
          <button
            type="button"
            className="arena-collapse-btn is-expand"
            onClick={onToggleCollapse}
            title="Expand Problem Garage (Ctrl+B)"
            aria-label="Expand Problem Garage"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}
      </div>

      <nav className="arena-problem-list" aria-label="Competition problems">
        {!collapsed && (
          <span className="arena-sidebar-track" aria-hidden="true">
            <i style={{ height: `${solvedPercent}%` }} />
          </span>
        )}
        {problems.map(problem => {
          const isSolved = solved.includes(problem.id)
          const isAttempted = attempted.includes(problem.id)
          const status = !progressKnown
            ? 'Progress unavailable'
            : isSolved
            ? 'Solved'
            : isAttempted
            ? 'Attempted'
            : 'Not started'
          const tooltip = `P${problem.number}: ${problem.title} (${problem.difficulty} - ${problem.points} pts)`

          return (
            <button
              key={problem.id}
              className={`arena-problem-item ${selected === problem.id ? 'is-active' : ''} ${
                isSolved ? 'is-solved' : isAttempted ? 'is-attempted' : ''
              }`}
              onClick={() => onSelect(problem.id)}
              disabled={busy}
              aria-current={selected === problem.id ? 'step' : undefined}
              title={collapsed ? tooltip : undefined}
            >
              <span className="arena-problem-number">P{problem.number}</span>
              {!collapsed && (
                <span className="arena-problem-name">
                  <strong>{problem.title}</strong>
                  <span className={`arena-difficulty difficulty-${problem.difficulty.toLowerCase()}`}>
                    {problem.difficulty}
                  </span>
                </span>
              )}
              <span className="arena-problem-state" title={status}>
                {isSolved ? (
                  <Check size={collapsed ? 10 : 13} />
                ) : isAttempted ? (
                  <Play size={collapsed ? 8 : 11} fill="currentColor" />
                ) : (
                  <Circle size={collapsed ? 9 : 12} />
                )}
              </span>
              {!collapsed && <span className="arena-problem-status-label">{status}</span>}
            </button>
          )
        })}
        {!problems.length && (
          <p className="arena-empty-problems">
            <LockKeyhole size={17} />
            {!collapsed && 'No released problems'}
          </p>
        )}
      </nav>

      <div className="arena-sidebar-bottom">
        {!collapsed ? (
          <>
            <div className="arena-progress-label">
              <span>Race progress</span>
              <strong>{progressKnown ? `${solved.length}/${progress.totalProblems}` : '—'}</strong>
            </div>
            <div className="arena-progress-track">
              <span style={{ width: `${solvedPercent}%` }} />
            </div>
            <dl>
              <div>
                <dt>
                  <Flag size={10} />
                  Problems
                </dt>
                <dd>
                  <span key={progress?.totalProblems || problems.length} className="arena-stat-value">
                    {progress?.totalProblems || problems.length}
                  </span>
                </dd>
              </div>
              <div>
                <dt>
                  <Play size={10} />
                  Attempted
                </dt>
                <dd>
                  <span key={progressKnown ? attempted.length : 'unknown'} className="arena-stat-value">
                    {progressKnown ? attempted.length : '—'}
                  </span>
                </dd>
              </div>
              <div>
                <dt>
                  <Check size={10} />
                  Solved
                </dt>
                <dd>
                  <span key={progressKnown ? solved.length : 'unknown'} className="arena-stat-value">
                    {progressKnown ? solved.length : '—'}
                  </span>
                </dd>
              </div>
              <div>
                <dt>
                  <Gauge size={10} />
                  Score
                </dt>
                <dd>
                  <span key={progress?.currentScore ?? 'none'} className="arena-stat-value">
                    {progress ? progress.currentScore : '—'}
                  </span>
                </dd>
              </div>
            </dl>
            <div className="arena-driver-total">
              <Trophy size={12} />
              <span>DRIVER SCORE</span>
              <strong>{progress ? progress.currentScore : '—'}</strong>
            </div>
          </>
        ) : (
          <div
            className="arena-driver-total-compact"
            title={`Driver Score: ${progress ? progress.currentScore : 0} | Solved: ${solved.length}/${problems.length}`}
          >
            <Trophy size={14} />
            <span className="score-val">{progress ? progress.currentScore : 0}</span>
          </div>
        )}
      </div>
    </aside>
  )
}
