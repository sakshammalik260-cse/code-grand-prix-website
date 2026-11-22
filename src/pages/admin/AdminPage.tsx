import { Link, NavLink, Route, Routes } from 'react-router-dom'
import {
  LayoutDashboard,
  FileCode2,
  Flag,
  Users,
  UserCheck,
  Trophy,
  ShieldCheck,
  LogOut,
  Radio
} from 'lucide-react'
import { RaceWordmark } from '../../components/RacingIdentity'
import { useSession } from '../../hooks/useSession'
import { isDevelopmentMock } from '../../services/mode'
import {
  AdminRaceControlStrip,
  AdminDashboard,
  AdminTeamsManagement,
  AdminVolunteersManagement,
  ContestManagement,
  AdminParticipants,
  ResultsVisibilityManagement
} from './AdminSections'
import { QuestionManagement } from './QuestionManagement'
import { NotFoundPage } from '../PlaceholderPages'

export default function AdminPage() {
  const { driver, signOut, authError } = useSession()

  const navLinks = [
    ['/admin', 'Dashboard', LayoutDashboard],
    ['/admin/teams', 'Teams & Passwords', Users],
    ['/admin/volunteers', 'Volunteers & Passwords', UserCheck],
    ['/admin/questions', 'Question Bank', FileCode2],
    ['/admin/contests', 'Contest & Rounds', Flag],
    ['/admin/participants', 'Live Sessions', Radio],
    ['/admin/results', 'Results & Standings', Trophy],
  ] as const

  return (
    <div className="admin-layout">
      <header className="admin-topbar">
        <Link to="/" aria-label="Race overview">
          <RaceWordmark />
        </Link>
        <div>
          <strong>RACE ADMINISTRATION</strong>
          <small>CPC CLUB / SEASON 2026</small>
        </div>
        <span className="admin-account" title={driver?.id}>
          <ShieldCheck size={15} />
          <span>{driver?.id}</span>
          <small>ADMIN</small>
        </span>
        <button className="admin-icon-button" onClick={signOut} aria-label="Sign out">
          <LogOut size={18} />
        </button>
      </header>

      {/* Persistent Race Control Actions Bar */}
      <AdminRaceControlStrip />

      <div className="admin-body">
        <aside className="admin-sidebar">
          <span className="admin-eyebrow">COMMAND CENTRE</span>
          <nav aria-label="Administration">
            {navLinks.map(([path, label, Icon]) => {
              const Symbol = Icon
              return (
                <NavLink end={path === '/admin'} to={path} key={path}>
                  <Symbol size={17} />
                  {label}
                </NavLink>
              )
            })}
            <Link to="/volunteer">
              <ShieldCheck size={17} />
              Volunteer Paddock
            </Link>
          </nav>

          <div className="admin-sidebar-footer">
            <span className="admin-status status-published">ADMIN PRIVILEGE</span>
            <p>
              Code Grand Prix 2026<br />
              Official Paddock Control
            </p>
            <Link to="/">Back to race overview</Link>
          </div>
        </aside>

        <main className="admin-main" id="admin-content">
          {isDevelopmentMock && (
            <div className="admin-mock-banner">
              DEVELOPMENT MOCK / Browser preview data only. Production requires server-verified administrator access.
            </div>
          )}

          {authError && <p className="admin-error" role="alert">{authError}</p>}

          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="teams" element={<AdminTeamsManagement />} />
            <Route path="volunteers" element={<AdminVolunteersManagement />} />
            <Route path="questions" element={<QuestionManagement />} />
            <Route path="contests" element={<ContestManagement />} />
            <Route path="participants" element={<AdminParticipants />} />
            <Route path="results" element={<ResultsVisibilityManagement />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
