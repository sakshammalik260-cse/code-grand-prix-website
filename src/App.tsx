import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CameraLifecycle } from './components/CameraLifecycle'
import { SessionProvider } from './context/SessionProvider'
import { Layout, RequireCheckIn } from './components/Layout'
import { ResultsAccess } from './components/ResultsAccess'
import { RequireRole } from './components/RequireRole'
import { LoadingState } from './components/Ui'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { CheckInPage } from './pages/CheckInPage'
import { LobbyPage } from './pages/LobbyPage'
import { NotFoundPage } from './pages/PlaceholderPages'
import { BrandIntro } from './components/BrandIntro'
import { RouteErrorBoundary } from './components/RouteErrorBoundary'
import { RaceRouteTransition } from './components/RaceRouteTransition'

const WinnerCertificatePage = lazy(() => import('./pages/WinnerCertificatePage').then(module => ({ default: module.WinnerCertificatePage })))

const AdminPage = lazy(()=>import('./pages/admin/AdminPage'))
const VolunteerPage = lazy(() => import('./pages/VolunteerPage'))
const ArenaPage = lazy(() => import('./pages/ArenaPage'))

export default function App() {
  return <BrandIntro><BrowserRouter><SessionProvider><CameraLifecycle /><RaceRouteTransition /><RouteErrorBoundary><Routes>
    <Route path="certificate" element={<Suspense fallback={<LoadingState label="Preparing winner certificate" detail="Loading the print-ready championship artwork." />}><WinnerCertificatePage /></Suspense>} />
    <Route element={<Layout />}>
      <Route index element={<LandingPage />} />
      <Route path="login" element={<LoginPage />} />
      <Route element={<RequireRole roles={['CANDIDATE']} />}>
        <Route path="check-in" element={<CheckInPage />} />
        <Route element={<RequireCheckIn />}>
          <Route path="lobby" element={<LobbyPage />} />
          <Route path="arena" element={<Suspense fallback={<LoadingState label="Preparing the coding arena" detail="Loading the editor, race state and monitoring systems." />}><ArenaPage /></Suspense>} />
        </Route>
      </Route>
      <Route element={<RequireRole roles={['VOLUNTEER','ADMIN']} />}>
      <Route path="volunteer/*" element={<Suspense fallback={<LoadingState label="Connecting to Race Control" detail="Loading participant sessions and incident telemetry." />}><VolunteerPage /></Suspense>} />
      </Route>
      <Route element={<RequireRole roles={['ADMIN']} />}><Route path="admin/*" element={<Suspense fallback={<LoadingState label="Opening championship operations" detail="Loading rounds, questions and participant controls." />}><AdminPage/></Suspense>}/></Route>
      <Route element={<RequireRole roles={['CANDIDATE','ADMIN']} />}><Route path="results" element={<ResultsAccess />} /></Route>
      <Route path="checkin" element={<Navigate to="/check-in" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes></RouteErrorBoundary></SessionProvider></BrowserRouter></BrandIntro>
}
