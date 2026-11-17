import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import { CameraLifecycle } from './components/CameraLifecycle'
import { SessionProvider } from './context/SessionProvider'
import { Layout, RequireDriver, RequireCheckIn } from './components/Layout'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { CheckInPage } from './pages/CheckInPage'
import { LobbyPage } from './pages/LobbyPage'
import { ResultsPage, NotFoundPage } from './pages/PlaceholderPages'

const VolunteerPage = lazy(() => import('./pages/VolunteerPage'))
const ArenaPage = lazy(() => import('./pages/ArenaPage'))

export default function App() {
  return <MotionConfig reducedMotion="user"><BrowserRouter><SessionProvider><CameraLifecycle /><Routes>
    <Route element={<Layout />}>
      <Route index element={<LandingPage />} />
      <Route path="login" element={<LoginPage />} />
      <Route element={<RequireDriver />}>
        <Route path="check-in" element={<CheckInPage />} />
        <Route element={<RequireCheckIn />}>
          <Route path="lobby" element={<LobbyPage />} />
          <Route path="arena" element={<Suspense fallback={<div className="arena-load-screen" role="status">Loading coding arena...</div>}><ArenaPage /></Suspense>} />
        </Route>
      </Route>
      <Route path="volunteer" element={<Suspense fallback={<div className="arena-load-screen">Loading race control...</div>}><VolunteerPage /></Suspense>} />
      <Route path="results" element={<ResultsPage />} />
      <Route path="checkin" element={<Navigate to="/check-in" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes></SessionProvider></BrowserRouter></MotionConfig>
}
