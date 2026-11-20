import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import { CameraLifecycle } from './components/CameraLifecycle'
import { SessionProvider } from './context/SessionProvider'
import { Layout, RequireCheckIn } from './components/Layout'
import { ResultsAccess } from './components/ResultsAccess'
import { RequireRole } from './components/RequireRole'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { CheckInPage } from './pages/CheckInPage'
import { LobbyPage } from './pages/LobbyPage'
import { NotFoundPage } from './pages/PlaceholderPages'
import { BrandIntro } from './components/BrandIntro'

const AdminPage = lazy(()=>import('./pages/admin/AdminPage'))
const VolunteerPage = lazy(() => import('./pages/VolunteerPage'))
const ArenaPage = lazy(() => import('./pages/ArenaPage'))

export default function App() {
  return <MotionConfig reducedMotion="user"><BrandIntro><BrowserRouter><SessionProvider><CameraLifecycle /><Routes>
    <Route element={<Layout />}>
      <Route index element={<LandingPage />} />
      <Route path="login" element={<LoginPage />} />
      <Route element={<RequireRole roles={['CANDIDATE']} />}>
        <Route path="check-in" element={<CheckInPage />} />
        <Route element={<RequireCheckIn />}>
          <Route path="lobby" element={<LobbyPage />} />
          <Route path="arena" element={<Suspense fallback={<div className="arena-load-screen" role="status">Loading coding arena...</div>}><ArenaPage /></Suspense>} />
        </Route>
      </Route>
      <Route element={<RequireRole roles={['VOLUNTEER','ADMIN']} />}>
      <Route path="volunteer/*" element={<Suspense fallback={<div className="arena-load-screen">Loading race control...</div>}><VolunteerPage /></Suspense>} />
      </Route>
      <Route element={<RequireRole roles={['ADMIN']} />}><Route path="admin/*" element={<Suspense fallback={<div className="arena-load-screen">Loading administration...</div>}><AdminPage/></Suspense>}/></Route>
      <Route element={<RequireRole roles={['CANDIDATE','ADMIN']} />}><Route path="results" element={<ResultsAccess />} /></Route>
      <Route path="checkin" element={<Navigate to="/check-in" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes></SessionProvider></BrowserRouter></BrandIntro></MotionConfig>
}
