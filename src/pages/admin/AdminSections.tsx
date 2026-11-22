import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  Play,
  Pause,
  Square,
  KeyRound,
  UserPlus,
  Download,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Users,
  FileCode2,
  Clock,
  Sparkles
} from 'lucide-react'
import { adminProblemService } from '../../services/problems'
import { monitoringService } from '../../services/monitoring'
import { adminControlService, type AdminUser, type AdminContestState } from '../../services/adminService'
import { useRemoteResource } from '../../hooks/useRemoteResource'
import { validateRound } from '../../services/problems/validation'
import { RaceDialog } from '../../components/assist/RaceDialog'
import type { ContestRound } from '../../types/problems'

const overview = (signal: AbortSignal) => adminProblemService.overview(signal)
const rounds = (signal: AbortSignal) => adminProblemService.rounds(signal)
const participants = (signal: AbortSignal) => monitoringService.listParticipants(signal)

function formatCountdown(ms: number) {
  if (ms <= 0) return '00:00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map(v => String(v).padStart(2, '0')).join(':')
}

function generatePassword(prefix = 'Pass') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${prefix}#${code}2026`
}

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const content = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function localTime(iso: string) {
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

// ==============================================================================
// 1. TOP RACE CONTROL BAR (PERSISTENT RACE LIFECYCLE CONTROLS)
// ==============================================================================
export function AdminRaceControlStrip({ onActionTriggered }: { onActionTriggered?: () => void }) {
  const [state, setState] = useState<AdminContestState | null>(null)
  const [remaining, setRemaining] = useState<number>(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmAction, setConfirmAction] = useState<'START' | 'PAUSE' | 'RESUME' | 'END' | null>(null)
  const [durationInput, setDurationInput] = useState(120)

  const fetchState = useCallback(async () => {
    try {
      const data = await adminControlService.getContestState()
      setState(data)
      setRemaining(data.remainingMs || 0)
    } catch {
      // Fallback gracefully
    }
  }, [])

  useEffect(() => {
    fetchState()
    const timer = setInterval(() => {
      setRemaining(prev => Math.max(0, prev - 1000))
    }, 1000)
    const poll = setInterval(fetchState, 15000)
    return () => {
      clearInterval(timer)
      clearInterval(poll)
    }
  }, [fetchState])

  async function executeAction() {
    if (!confirmAction) return
    setBusy(true)
    setError('')
    try {
      if (confirmAction === 'START') await adminControlService.startRace(durationInput)
      else if (confirmAction === 'PAUSE') await adminControlService.pauseRace()
      else if (confirmAction === 'RESUME') await adminControlService.resumeRace()
      else if (confirmAction === 'END') await adminControlService.endRace()
      setConfirmAction(null)
      await fetchState()
      onActionTriggered?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Race control operation failed.')
    } finally {
      setBusy(false)
    }
  }

  const status = state?.contestStatus || 'WAITING'
  const isLive = status === 'LIVE'
  const isPaused = status === 'PAUSED' || status === 'PAUSED_BY_ORGANIZER'
  const isFinished = status === 'FINISHED' || status === 'ENDED'

  const badgeClass = isLive
    ? 'status-live'
    : isPaused
    ? 'status-paused'
    : isFinished
    ? 'status-finished'
    : 'status-waiting'

  return (
    <>
      <div className="admin-race-bar" role="region" aria-label="Race Master Controls">
        <div className="admin-race-status-wrap">
          <span className={`admin-race-badge ${badgeClass}`}>
            <span className="pulse-dot" />
            {isPaused ? 'RACE PAUSED' : isLive ? 'RACE LIVE' : isFinished ? 'RACE COMPLETE' : 'RACE WAITING'}
          </span>
          <div className="admin-clock-display">
            <Clock size={16} />
            <span>{isFinished ? '00:00:00' : formatCountdown(remaining)}</span>
            <small>{isLive ? 'REMAINING' : isPaused ? 'TIMER FROZEN' : isFinished ? 'ENDED' : 'UNTIL TIMEOUT'}</small>
          </div>
          {state?.activeRound && (
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>
              Round: <strong style={{ color: '#fff' }}>{state.activeRound.title}</strong>
            </span>
          )}
        </div>

        <div className="admin-race-actions">
          {!isLive && !isPaused && !isFinished && (
            <button className="btn-race-action btn-race-start" onClick={() => setConfirmAction('START')} disabled={busy}>
              <Play size={14} /> START RACE
            </button>
          )}

          {isLive && (
            <>
              <button className="btn-race-action btn-race-pause" onClick={() => setConfirmAction('PAUSE')} disabled={busy}>
                <Pause size={14} /> PAUSE RACE
              </button>
              <button className="btn-race-action btn-race-end" onClick={() => setConfirmAction('END')} disabled={busy}>
                <Square size={14} /> END RACE
              </button>
            </>
          )}

          {isPaused && (
            <>
              <button className="btn-race-action btn-race-resume" onClick={() => setConfirmAction('RESUME')} disabled={busy}>
                <Play size={14} /> RESUME RACE
              </button>
              <button className="btn-race-action btn-race-end" onClick={() => setConfirmAction('END')} disabled={busy}>
                <Square size={14} /> END RACE
              </button>
            </>
          )}

          {isFinished && (
            <button className="btn-race-action btn-race-start" onClick={() => setConfirmAction('START')} disabled={busy}>
              <RefreshCw size={14} /> RE-START NEW RACE
            </button>
          )}

          <button className="admin-icon-button" title="Refresh Race Telemetry" onClick={fetchState}>
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '8px 30px', background: '#470d1a', color: '#ffd1d8', fontSize: '12px' }}>
          {error}
        </div>
      )}

      {confirmAction && (
        <div className="admin-modal-backdrop" onClick={() => !busy && setConfirmAction(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                {confirmAction === 'START'
                  ? 'Confirm Race Start'
                  : confirmAction === 'PAUSE'
                  ? 'Emergency Race Pause'
                  : confirmAction === 'RESUME'
                  ? 'Confirm Race Resume'
                  : 'End Competition'}
              </h3>
            </div>
            <div className="admin-modal-body">
              {confirmAction === 'START' && (
                <>
                  <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#cbd5e1' }}>
                    Starting the race will activate Round 1, open all published questions to candidates, and start the competition countdown clock.
                  </p>
                  <label>
                    Competition Duration (Minutes)
                    <input
                      type="number"
                      min={10}
                      max={1440}
                      value={durationInput}
                      onChange={e => setDurationInput(Math.max(1, Number(e.target.value)))}
                    />
                  </label>
                </>
              )}
              {confirmAction === 'PAUSE' && (
                <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#fde68a' }}>
                  <strong>Emergency Pause:</strong> Candidate code execution and submission will be immediately held. The round clock will pause.
                </p>
              )}
              {confirmAction === 'RESUME' && (
                <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#cbd5e1' }}>
                  Resuming the race will re-enable candidate submissions and unpause the race clock.
                </p>
              )}
              {confirmAction === 'END' && (
                <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#fca5a5' }}>
                  <strong>Finalizing Contest:</strong> This immediately stops all candidate work, locks submissions, and closes the competition window.
                </p>
              )}
            </div>
            <div className="admin-modal-actions">
              <button className="admin-secondary" disabled={busy} onClick={() => setConfirmAction(null)}>
                Cancel
              </button>
              <button
                className={confirmAction === 'END' ? 'admin-danger' : confirmAction === 'PAUSE' ? 'btn-race-action btn-race-pause' : 'admin-primary'}
                disabled={busy}
                onClick={executeAction}
              >
                {busy ? 'Processing...' : `Confirm ${confirmAction}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ==============================================================================
// 2. ADMIN DASHBOARD
// ==============================================================================
export function AdminDashboard() {
  const resource = useRemoteResource(overview)
  const compStatus = resource.data?.competitionStatus ? resource.data.competitionStatus.replaceAll('_', ' ') : '--'
  const activeRoundsCount = typeof resource.data?.activeRounds === 'number'
    ? resource.data.activeRounds
    : (Array.isArray(resource.data?.activeRounds) ? (resource.data.activeRounds as unknown[]).length : '--')

  return (
    <>
      <div className="admin-section-heading">
        <div>
          <span className="admin-eyebrow">CPC CLUB / CODE GRAND PRIX 2026</span>
          <h1>Race Administration & Command Centre</h1>
          <p>Full control over contest lifecycle, challenge catalog, team credentials, and volunteer marshals.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link className="admin-primary" to="/admin/teams">
            <Users size={16} /> Manage Teams
          </Link>
          <Link className="admin-secondary" to="/admin/questions">
            <FileCode2 size={16} /> Questions
          </Link>
        </div>
      </div>

      {resource.error && (
        <p role="alert" className="admin-error">
          {resource.error}
          <button onClick={resource.reload}>Retry</button>
        </p>
      )}

      {resource.loading && <p role="status">Loading race overview...</p>}

      <div className="admin-kpis">
        {[
          ['Total questions', resource.data?.totalQuestions],
          ['Draft questions', resource.data?.draftQuestions],
          ['Published questions', resource.data?.publishedQuestions],
          ['Competition status', compStatus],
          ['Participants / Teams', resource.data?.participants],
          ['Active rounds', activeRoundsCount]
        ].map(([label, value], index) => (
          <div key={label} className={'admin-kpi kpi-' + index}>
            <span>{label}</span>
            <strong>{typeof value === 'object' && value !== null ? JSON.stringify(value) : (value ?? '--')}</strong>
            <small>{index < 3 ? 'QUESTION BANK' : 'RACE OPERATIONS'}</small>
          </div>
        ))}
      </div>

      <div className="admin-overview-grid">
        <section className="admin-panel">
          <span className="admin-eyebrow">01 / RACE LIFECYCLE & GRID</span>
          <h2>Start, Pause & End Race</h2>
          <p>Control the master competition clock. Use the top action bar to start Round 1, trigger emergency pauses, or finalize the contest.</p>
          <Link to="/admin/contests">Open Contest & Round Scheduler →</Link>
        </section>

        <section className="admin-panel">
          <span className="admin-eyebrow">02 / TEAMS & CREDENTIALS</span>
          <h2>Team Roster & Passwords</h2>
          <p>Add new teams, edit driver IDs, and reset candidate passwords on the fly for on-site participants.</p>
          <Link to="/admin/teams">Manage Teams & Passwords →</Link>
        </section>

        <section className="admin-panel">
          <span className="admin-eyebrow">03 / MARSHALS & RACE CONTROL</span>
          <h2>Volunteer Marshals</h2>
          <p>Configure volunteer accounts, grant proctoring access, and manage volunteer credentials.</p>
          <Link to="/admin/volunteers">Manage Volunteers & Passwords →</Link>
        </section>

        <section className="admin-panel">
          <span className="admin-eyebrow">04 / CHALLENGE CATALOG</span>
          <h2>Questions & Test Cases</h2>
          <p>Draft, publish, and schedule coding problems with private test cases and hint configurations.</p>
          <Link to="/admin/questions">Manage Question Bank →</Link>
        </section>
      </div>
    </>
  )
}

// ==============================================================================
// 3. TEAMS & PASSWORDS MANAGEMENT (/admin/teams)
// ==============================================================================
export function AdminTeamsManagement() {
  const [teams, setTeams] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)

  // Modals state
  const [addModal, setAddModal] = useState(false)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [passwordUser, setPasswordUser] = useState<AdminUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)

  // Form states
  const [formTeamName, setFormTeamName] = useState('')
  const [formDriverId, setFormDriverId] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const loadTeams = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminControlService.listUsers('CANDIDATE')
      setTeams(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load teams.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTeams()
  }, [loadTeams])

  const filteredTeams = teams.filter(t =>
    t.team.toLowerCase().includes(search.toLowerCase()) ||
    t.driverId.toLowerCase().includes(search.toLowerCase()) ||
    t.displayName.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreateTeam(e: FormEvent) {
    e.preventDefault()
    if (!formTeamName.trim() || !formDriverId.trim() || !formPassword.trim()) {
      setError('Please fill in team name, driver ID, and password.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await adminControlService.createUser({
        displayName: formTeamName.trim(),
        team: formTeamName.trim(),
        driverId: formDriverId.trim(),
        role: 'CANDIDATE',
        password: formPassword.trim()
      })
      setAddModal(false)
      setFormTeamName('')
      setFormDriverId('')
      setFormPassword('')
      await loadTeams()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team.')
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdateTeam(e: FormEvent) {
    e.preventDefault()
    if (!editUser) return
    setBusy(true)
    setError('')
    try {
      await adminControlService.updateUser(editUser.id, {
        displayName: formTeamName.trim() || editUser.displayName,
        team: formTeamName.trim() || editUser.team,
        driverId: formDriverId.trim() || editUser.driverId
      })
      setEditUser(null)
      await loadTeams()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team.')
    } finally {
      setBusy(false)
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault()
    if (!passwordUser || !formPassword.trim()) return
    setBusy(true)
    setError('')
    try {
      await adminControlService.updateUser(passwordUser.id, {
        password: formPassword.trim()
      })
      setPasswordUser(null)
      setFormPassword('')
      await loadTeams()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteUser() {
    if (!deleteTarget) return
    setBusy(true)
    setError('')
    try {
      await adminControlService.deleteUser(deleteTarget.id)
      setDeleteTarget(null)
      await loadTeams()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete team.')
    } finally {
      setBusy(false)
    }
  }

  function handleExportCsv() {
    downloadCsv(
      `cgp_teams_credentials_${new Date().toISOString().slice(0, 10)}.csv`,
      ['Team Name', 'Driver ID (Login)', 'Created At'],
      teams.map(t => [t.team, t.driverId, new Date(t.createdAt).toLocaleString()])
    )
  }

  return (
    <>
      <div className="admin-section-heading">
        <div>
          <span className="admin-eyebrow">TEAM CREDENTIALS & ACCESS</span>
          <h1>Teams & Candidate Passwords</h1>
          <p>Create teams, manage driver login IDs, and set or reset team passwords instantly.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="admin-secondary" onClick={handleExportCsv} disabled={!teams.length}>
            <Download size={15} /> Export Teams CSV
          </button>
          <button
            className="admin-primary"
            onClick={() => {
              setFormTeamName('')
              setFormDriverId('')
              setFormPassword(generatePassword('Team'))
              setShowPassword(true)
              setAddModal(true)
            }}
          >
            <UserPlus size={16} /> Add Team
          </button>
        </div>
      </div>

      {error && <p className="admin-error" role="alert">{error}</p>}

      <div className="admin-filterbar">
        <label className="admin-search">
          <Search size={16} />
          <input
            aria-label="Search teams"
            placeholder="Search by team name or driver ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </label>
        <button className="admin-secondary" onClick={loadTeams} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {loading && <p role="status">Loading teams and credentials...</p>}

      <div className="admin-table-wrap" role="region" aria-label="Teams and passwords" tabIndex={0}>
        <table>
          <caption className="sr-only">Registered competition teams</caption>
          <thead>
            <tr>
              <th scope="col">Team Name</th>
              <th scope="col">Driver ID (Login)</th>
              <th scope="col">Session State</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.map(team => (
              <tr key={team.id}>
                <th scope="row">
                  <strong>{team.team || team.displayName}</strong>
                  <small>{team.displayName}</small>
                </th>
                <td>
                  <span className="admin-credential-chip">{team.driverId}</span>
                </td>
                <td>
                  <span className={`admin-status status-${(team.session?.status || 'WAITING').toLowerCase()}`}>
                    {team.session?.status?.replaceAll('_', ' ') || 'WAITING'}
                  </span>
                </td>
                <td>
                  <div className="admin-row-actions">
                    <button
                      className="admin-primary"
                      title="Set New Password"
                      onClick={() => {
                        setPasswordUser(team)
                        setFormPassword(generatePassword('Reset'))
                        setShowPassword(true)
                      }}
                    >
                      <KeyRound size={13} /> Set Password
                    </button>
                    <button
                      className="admin-secondary"
                      title="Edit Team"
                      onClick={() => {
                        setEditUser(team)
                        setFormTeamName(team.team)
                        setFormDriverId(team.driverId)
                      }}
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <button
                      className="admin-danger"
                      title="Delete Team"
                      onClick={() => setDeleteTarget(team)}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !filteredTeams.length && (
          <p className="admin-empty">No teams found matching your search.</p>
        )}
      </div>

      {/* ADD TEAM MODAL */}
      {addModal && (
        <div className="admin-modal-backdrop" onClick={() => !busy && setAddModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Add New Competition Team</h3>
            </div>
            <form onSubmit={handleCreateTeam}>
              <div className="admin-modal-body">
                <label>
                  Team Name
                  <input
                    placeholder="e.g. Red Bull Coders"
                    value={formTeamName}
                    required
                    onChange={e => {
                      setFormTeamName(e.target.value)
                      if (!formDriverId || formDriverId === formTeamName) {
                        setFormDriverId(e.target.value)
                      }
                    }}
                  />
                </label>
                <label>
                  Driver ID (Team login username)
                  <input
                    placeholder="e.g. RedBullCoders"
                    value={formDriverId}
                    required
                    onChange={e => setFormDriverId(e.target.value)}
                  />
                </label>
                <label>
                  Initial Password
                  <div className="admin-password-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formPassword}
                      required
                      onChange={e => setFormPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setFormPassword(generatePassword('Team'))}>
                      <Sparkles size={13} /> Generate
                    </button>
                    <button type="button" onClick={() => setShowPassword(p => !p)}>
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </label>
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="admin-secondary" disabled={busy} onClick={() => setAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-primary" disabled={busy}>
                  {busy ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEAM MODAL */}
      {editUser && (
        <div className="admin-modal-backdrop" onClick={() => !busy && setEditUser(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Edit Team Details</h3>
            </div>
            <form onSubmit={handleUpdateTeam}>
              <div className="admin-modal-body">
                <label>
                  Team Name
                  <input
                    value={formTeamName}
                    required
                    onChange={e => setFormTeamName(e.target.value)}
                  />
                </label>
                <label>
                  Driver ID (Login ID)
                  <input
                    value={formDriverId}
                    required
                    onChange={e => setFormDriverId(e.target.value)}
                  />
                </label>
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="admin-secondary" disabled={busy} onClick={() => setEditUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="admin-primary" disabled={busy}>
                  {busy ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {passwordUser && (
        <div className="admin-modal-backdrop" onClick={() => !busy && setPasswordUser(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Reset Password: {passwordUser.team}</h3>
            </div>
            <form onSubmit={handleResetPassword}>
              <div className="admin-modal-body">
                <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '14px' }}>
                  Assign a new password for Driver ID: <strong>{passwordUser.driverId}</strong>.
                </p>
                <label>
                  New Password
                  <div className="admin-password-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formPassword}
                      required
                      onChange={e => setFormPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setFormPassword(generatePassword('Reset'))}>
                      <Sparkles size={13} /> Generate
                    </button>
                    <button type="button" onClick={() => setShowPassword(p => !p)}>
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </label>
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="admin-secondary" disabled={busy} onClick={() => setPasswordUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="admin-primary" disabled={busy}>
                  {busy ? 'Updating...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteTarget && (
        <div className="admin-modal-backdrop" onClick={() => !busy && setDeleteTarget(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Confirm Team Deletion</h3>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#fca5a5' }}>
                Are you sure you want to remove team <strong>{deleteTarget.team}</strong> (Driver ID: {deleteTarget.driverId})? This will delete all associated sessions and submissions.
              </p>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-secondary" disabled={busy} onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="admin-danger" disabled={busy} onClick={handleDeleteUser}>
                {busy ? 'Deleting...' : 'Delete Team'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ==============================================================================
// 4. VOLUNTEERS & PASSWORDS MANAGEMENT (/admin/volunteers)
// ==============================================================================
export function AdminVolunteersManagement() {
  const [volunteers, setVolunteers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)

  // Modals state
  const [addModal, setAddModal] = useState(false)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [passwordUser, setPasswordUser] = useState<AdminUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)

  // Form states
  const [formName, setFormName] = useState('')
  const [formDriverId, setFormDriverId] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const loadVolunteers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminControlService.listUsers('VOLUNTEER')
      setVolunteers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load volunteers.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadVolunteers()
  }, [loadVolunteers])

  const filtered = volunteers.filter(v =>
    v.displayName.toLowerCase().includes(search.toLowerCase()) ||
    v.driverId.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreateVolunteer(e: FormEvent) {
    e.preventDefault()
    if (!formName.trim() || !formDriverId.trim() || !formPassword.trim()) {
      setError('Please fill in volunteer name, ID, and password.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await adminControlService.createUser({
        displayName: formName.trim(),
        team: 'CPC Race Control',
        driverId: formDriverId.trim(),
        role: 'VOLUNTEER',
        password: formPassword.trim()
      })
      setAddModal(false)
      setFormName('')
      setFormDriverId('')
      setFormPassword('')
      await loadVolunteers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create volunteer account.')
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdateVolunteer(e: FormEvent) {
    e.preventDefault()
    if (!editUser) return
    setBusy(true)
    setError('')
    try {
      await adminControlService.updateUser(editUser.id, {
        displayName: formName.trim() || editUser.displayName,
        driverId: formDriverId.trim() || editUser.driverId
      })
      setEditUser(null)
      await loadVolunteers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update volunteer.')
    } finally {
      setBusy(false)
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault()
    if (!passwordUser || !formPassword.trim()) return
    setBusy(true)
    setError('')
    try {
      await adminControlService.updateUser(passwordUser.id, {
        password: formPassword.trim()
      })
      setPasswordUser(null)
      setFormPassword('')
      await loadVolunteers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteVolunteer() {
    if (!deleteTarget) return
    setBusy(true)
    setError('')
    try {
      await adminControlService.deleteUser(deleteTarget.id)
      setDeleteTarget(null)
      await loadVolunteers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete volunteer.')
    } finally {
      setBusy(false)
    }
  }

  function handleExportCsv() {
    downloadCsv(
      `cgp_volunteers_${new Date().toISOString().slice(0, 10)}.csv`,
      ['Volunteer Name', 'Login ID', 'Role', 'Created At'],
      volunteers.map(v => [v.displayName, v.driverId, v.role, new Date(v.createdAt).toLocaleString()])
    )
  }

  return (
    <>
      <div className="admin-section-heading">
        <div>
          <span className="admin-eyebrow">RACE MARSHAL ACCESS</span>
          <h1>Volunteer Credentials & Passwords</h1>
          <p>Register volunteers, assign marshal login IDs, and manage volunteer passwords.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="admin-secondary" onClick={handleExportCsv} disabled={!volunteers.length}>
            <Download size={15} /> Export Volunteers CSV
          </button>
          <button
            className="admin-primary"
            onClick={() => {
              setFormName('')
              setFormDriverId(`VOL_${String(volunteers.length + 1).padStart(2, '0')}`)
              setFormPassword(generatePassword('Marshal'))
              setShowPassword(true)
              setAddModal(true)
            }}
          >
            <UserPlus size={16} /> Add Volunteer
          </button>
        </div>
      </div>

      {error && <p className="admin-error" role="alert">{error}</p>}

      <div className="admin-filterbar">
        <label className="admin-search">
          <Search size={16} />
          <input
            aria-label="Search volunteers"
            placeholder="Search by volunteer name or login ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </label>
        <button className="admin-secondary" onClick={loadVolunteers} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {loading && <p role="status">Loading volunteers...</p>}

      <div className="admin-table-wrap" role="region" aria-label="Volunteers list" tabIndex={0}>
        <table>
          <caption className="sr-only">Registered race volunteers</caption>
          <thead>
            <tr>
              <th scope="col">Marshal / Volunteer Name</th>
              <th scope="col">Login ID</th>
              <th scope="col">Role</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(vol => (
              <tr key={vol.id}>
                <th scope="row">
                  <strong>{vol.displayName}</strong>
                </th>
                <td>
                  <span className="admin-credential-chip">{vol.driverId}</span>
                </td>
                <td>
                  <span className="admin-status status-published">VOLUNTEER</span>
                </td>
                <td>
                  <div className="admin-row-actions">
                    <button
                      className="admin-primary"
                      title="Set New Password"
                      onClick={() => {
                        setPasswordUser(vol)
                        setFormPassword(generatePassword('Marshal'))
                        setShowPassword(true)
                      }}
                    >
                      <KeyRound size={13} /> Set Password
                    </button>
                    <button
                      className="admin-secondary"
                      title="Edit Volunteer"
                      onClick={() => {
                        setEditUser(vol)
                        setFormName(vol.displayName)
                        setFormDriverId(vol.driverId)
                      }}
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <button
                      className="admin-danger"
                      title="Delete Volunteer"
                      onClick={() => setDeleteTarget(vol)}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !filtered.length && (
          <p className="admin-empty">No volunteers found matching your query.</p>
        )}
      </div>

      {/* ADD VOLUNTEER MODAL */}
      {addModal && (
        <div className="admin-modal-backdrop" onClick={() => !busy && setAddModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Register New Volunteer Marshal</h3>
            </div>
            <form onSubmit={handleCreateVolunteer}>
              <div className="admin-modal-body">
                <label>
                  Volunteer Full Name
                  <input
                    placeholder="e.g. Rahul Sharma"
                    value={formName}
                    required
                    onChange={e => setFormName(e.target.value)}
                  />
                </label>
                <label>
                  Volunteer Login ID
                  <input
                    placeholder="e.g. VOL_05"
                    value={formDriverId}
                    required
                    onChange={e => setFormDriverId(e.target.value)}
                  />
                </label>
                <label>
                  Password
                  <div className="admin-password-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formPassword}
                      required
                      onChange={e => setFormPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setFormPassword(generatePassword('Marshal'))}>
                      <Sparkles size={13} /> Generate
                    </button>
                    <button type="button" onClick={() => setShowPassword(p => !p)}>
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </label>
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="admin-secondary" disabled={busy} onClick={() => setAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-primary" disabled={busy}>
                  {busy ? 'Registering...' : 'Register Volunteer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT VOLUNTEER MODAL */}
      {editUser && (
        <div className="admin-modal-backdrop" onClick={() => !busy && setEditUser(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Edit Volunteer</h3>
            </div>
            <form onSubmit={handleUpdateVolunteer}>
              <div className="admin-modal-body">
                <label>
                  Volunteer Name
                  <input
                    value={formName}
                    required
                    onChange={e => setFormName(e.target.value)}
                  />
                </label>
                <label>
                  Login ID
                  <input
                    value={formDriverId}
                    required
                    onChange={e => setFormDriverId(e.target.value)}
                  />
                </label>
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="admin-secondary" disabled={busy} onClick={() => setEditUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="admin-primary" disabled={busy}>
                  {busy ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET VOLUNTEER PASSWORD MODAL */}
      {passwordUser && (
        <div className="admin-modal-backdrop" onClick={() => !busy && setPasswordUser(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Reset Password: {passwordUser.displayName}</h3>
            </div>
            <form onSubmit={handleResetPassword}>
              <div className="admin-modal-body">
                <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '14px' }}>
                  Assign a new password for Volunteer ID: <strong>{passwordUser.driverId}</strong>.
                </p>
                <label>
                  New Password
                  <div className="admin-password-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formPassword}
                      required
                      onChange={e => setFormPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setFormPassword(generatePassword('Marshal'))}>
                      <Sparkles size={13} /> Generate
                    </button>
                    <button type="button" onClick={() => setShowPassword(p => !p)}>
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </label>
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="admin-secondary" disabled={busy} onClick={() => setPasswordUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="admin-primary" disabled={busy}>
                  {busy ? 'Updating...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteTarget && (
        <div className="admin-modal-backdrop" onClick={() => !busy && setDeleteTarget(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Confirm Volunteer Deletion</h3>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#fca5a5' }}>
                Are you sure you want to delete volunteer <strong>{deleteTarget.displayName}</strong> ({deleteTarget.driverId})?
              </p>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-secondary" disabled={busy} onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="admin-danger" disabled={busy} onClick={handleDeleteVolunteer}>
                {busy ? 'Deleting...' : 'Delete Volunteer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ==============================================================================
// 5. CONTEST & ROUND MANAGEMENT
// ==============================================================================
export function ContestManagement() {
  const resource = useRemoteResource(rounds)
  const [editing, setEditing] = useState<ContestRound | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!editing) return
    const issues = validateRound(editing)
    if (issues.length) {
      setError(issues.join(' '))
      return
    }
    setBusy(true)
    setError('')
    try {
      await adminProblemService.saveRound(editing)
      setEditing(null)
      setMessage('Round settings saved.')
      resource.reload()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save round.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="admin-section-heading">
        <div>
          <span className="admin-eyebrow">RACE OPERATIONS</span>
          <h1>Contest & Round Management</h1>
          <p>Configure round schedules, manage release windows, and toggle question visibility.</p>
        </div>
        <button
          className="admin-primary"
          onClick={() => {
            setError('')
            setEditing({
              id: '',
              title: '',
              status: 'WAITING',
              startsAt: new Date().toISOString(),
              endsAt: new Date(Date.now() + 10800000).toISOString(),
              resultsVisible: false
            })
          }}
        >
          Add round
        </button>
      </div>

      {(error || resource.error) && <p className="admin-error" role="alert">{error || resource.error}</p>}
      {message && <p className="admin-success" role="status">{message}</p>}
      {resource.loading && <p role="status">Loading rounds...</p>}

      {editing && (
        <form onSubmit={save} className="admin-form admin-operation" noValidate>
          <h2>Edit round settings</h2>
          <fieldset disabled={busy}>
            <div className="admin-form-grid">
              <label>
                Round ID
                <input
                  value={editing.id}
                  readOnly={!!resource.data?.some(round => round.id === editing.id)}
                  onChange={event => setEditing({ ...editing, id: event.target.value })}
                />
              </label>
              <label>
                Round title
                <input
                  value={editing.title}
                  onChange={event => setEditing({ ...editing, title: event.target.value })}
                />
              </label>
              <label>
                Competition status
                <select
                  value={editing.status}
                  onChange={event => setEditing({ ...editing, status: event.target.value as ContestRound['status'] })}
                >
                  {['WAITING', 'LIVE', 'PAUSED_BY_ORGANIZER', 'FINISHED'].map(status => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label>
                Starts at (local)
                <input
                  type="datetime-local"
                  value={localTime(editing.startsAt)}
                  onChange={event => setEditing({ ...editing, startsAt: event.target.value ? new Date(event.target.value).toISOString() : '' })}
                />
              </label>
              <label>
                Ends at (local)
                <input
                  type="datetime-local"
                  value={localTime(editing.endsAt)}
                  onChange={event => setEditing({ ...editing, endsAt: event.target.value ? new Date(event.target.value).toISOString() : '' })}
                />
              </label>
            </div>
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={editing.resultsVisible}
                onChange={event => setEditing({ ...editing, resultsVisible: event.target.checked })}
              />
              Results visible to candidates
            </label>
            <div className="admin-form-actions">
              <button className="admin-primary">{busy ? 'Saving...' : 'Save round'}</button>
              <button type="button" className="admin-secondary" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </fieldset>
        </form>
      )}

      <div className="admin-table-wrap" role="region" aria-label="Contest rounds" tabIndex={0}>
        <table>
          <caption className="sr-only">Contest rounds and schedules</caption>
          <thead>
            <tr>
              <th scope="col">Round</th>
              <th scope="col">Status</th>
              <th scope="col">Schedule</th>
              <th scope="col">Results</th>
              <th scope="col">Manage</th>
            </tr>
          </thead>
          <tbody>
            {resource.data?.map(round => (
              <tr key={round.id}>
                <th scope="row">
                  <strong>{round.title}</strong>
                  <small>{round.id}</small>
                </th>
                <td>{round.status ? String(round.status).replaceAll('_', ' ') : 'WAITING'}</td>
                <td>
                  {round.startsAt ? new Date(round.startsAt).toLocaleString() : '--'}
                  <small>Ends {round.endsAt ? new Date(round.endsAt).toLocaleString() : '--'}</small>
                </td>
                <td>{round.resultsVisible ? 'Visible' : 'Withheld'}</td>
                <td>
                  <button
                    className="admin-secondary"
                    aria-label={`Edit settings for ${round.title}`}
                    onClick={() => {
                      setEditing(round)
                      setError('')
                      setMessage('')
                    }}
                  >
                    Edit settings
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ==============================================================================
// 6. RESULTS VISIBILITY MANAGEMENT
// ==============================================================================
export function ResultsVisibilityManagement() {
  const resource = useRemoteResource(rounds)
  const [target, setTarget] = useState<ContestRound | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const close = useCallback(() => {
    if (!busy) setTarget(null)
  }, [busy])

  async function confirm() {
    if (!target) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const latest = (await adminProblemService.rounds()).find(round => round.id === target.id)
      if (!latest) throw new Error('This round no longer exists. Refresh results control.')
      const next = await adminProblemService.saveRound({ ...latest, resultsVisible: !target.resultsVisible })
      setMessage(next.resultsVisible ? 'Classification published to candidates.' : 'Classification withheld from candidates.')
      setTarget(null)
      resource.reload()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Results visibility could not be changed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="admin-section-heading">
        <div>
          <span className="admin-eyebrow">CLASSIFICATION CONTROL</span>
          <h1>Results Visibility & Standings Release</h1>
          <p>Publish or withhold the candidate classification without changing round timing or race state.</p>
        </div>
        <button className="admin-secondary" disabled={resource.loading} onClick={resource.reload}>
          Refresh
        </button>
      </div>

      {(error || resource.error) && <p className="admin-error" role="alert">{error || resource.error}</p>}
      {message && <p className="admin-success" role="status">{message}</p>}
      {resource.loading && <p role="status">Loading classification controls...</p>}

      <div className="admin-table-wrap" role="region" aria-label="Results visibility by round" tabIndex={0}>
        <table>
          <caption className="sr-only">Read-only round context and candidate results visibility</caption>
          <thead>
            <tr>
              <th scope="col">Round</th>
              <th scope="col">Race state</th>
              <th scope="col">Schedule</th>
              <th scope="col">Candidate view</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {resource.data?.map(round => (
              <tr key={round.id}>
                <th scope="row">
                  <strong>{round.title}</strong>
                  <small>{round.id}</small>
                </th>
                <td>{round.status ? String(round.status).replaceAll('_', ' ') : 'WAITING'}</td>
                <td>
                  {round.startsAt ? new Date(round.startsAt).toLocaleString() : '--'}
                  <small>Ends {round.endsAt ? new Date(round.endsAt).toLocaleString() : '--'}</small>
                </td>
                <td>
                  <span className={'admin-status ' + (round.resultsVisible ? 'status-published' : 'status-draft')}>
                    {round.resultsVisible ? 'VISIBLE' : 'WITHHELD'}
                  </span>
                </td>
                <td>
                  <button
                    className={round.resultsVisible ? 'admin-secondary' : 'admin-primary'}
                    aria-label={`${round.resultsVisible ? 'Withhold' : 'Publish'} classification for ${round.title}`}
                    onClick={() => setTarget(round)}
                  >
                    {round.resultsVisible ? (
                      <>
                        <EyeOff size={15} /> Withhold
                      </>
                    ) : (
                      <>
                        <Eye size={15} /> Publish
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {target && (
        <RaceDialog titleId="results-visibility-title" onClose={close} busy={busy}>
          <span className="assist-eyebrow">RACE CONTROL / CLASSIFICATION</span>
          <h2 id="results-visibility-title">
            {target.resultsVisible ? 'Withhold' : 'Publish'} {target.title} results?
          </h2>
          <p>
            {target.resultsVisible
              ? 'Candidates will lose access to the current classification immediately.'
              : 'Authenticated candidates will be able to view the service-reported classification.'}
          </p>
          <p>No scores are changed by this action.</p>
          <div className="assist-dialog-actions">
            <button className="assist-secondary" disabled={busy} onClick={close}>
              CANCEL
            </button>
            <button
              className={target.resultsVisible ? 'admin-danger' : 'assist-primary'}
              disabled={busy}
              onClick={() => void confirm()}
            >
              {busy ? 'UPDATING...' : target.resultsVisible ? 'WITHHOLD RESULTS' : 'PUBLISH RESULTS'}
            </button>
          </div>
        </RaceDialog>
      )}
    </>
  )
}

// ==============================================================================
// 7. PARTICIPANTS REGISTER
// ==============================================================================
export function AdminParticipants() {
  const resource = useRemoteResource(participants)
  return (
    <>
      <div className="admin-section-heading">
        <div>
          <span className="admin-eyebrow">LIVE SESSION REGISTER</span>
          <h1>Live Participant Sessions</h1>
          <p>Real-time proctoring status, session lock monitoring, and pit pass telemetry.</p>
        </div>
        <button className="admin-secondary" onClick={resource.reload}>
          Refresh
        </button>
      </div>
      {resource.error && <p className="admin-error" role="alert">{resource.error}</p>}
      <div className="admin-table-wrap" role="region" aria-label="Participant sessions" tabIndex={0}>
        <table>
          <caption className="sr-only">Current participant competition sessions</caption>
          <thead>
            <tr>
              <th scope="col">Driver</th>
              <th scope="col">Session state</th>
              <th scope="col">Contest</th>
              <th scope="col">Last update</th>
            </tr>
          </thead>
          <tbody>
            {resource.data?.map(session => (
              <tr key={session.id}>
                <th scope="row">{session.driverId}</th>
                <td>{session.status ? String(session.status).replaceAll('_', ' ') : 'WAITING'}</td>
                <td>{session.contestId}</td>
                <td>{session.updatedAt ? new Date(session.updatedAt).toLocaleString() : '--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!resource.data?.length && (
          <p className="admin-empty">{resource.loading ? 'Loading sessions...' : 'No participant sessions yet.'}</p>
        )}
      </div>
    </>
  )
}
