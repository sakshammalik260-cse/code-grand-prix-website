import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { cameraStore } from '../services/cameraStore'
export function CameraLifecycle() {
  const { pathname } = useLocation()
  const { driver } = useSession()
  useEffect(() => {
    if (!driver || !['/check-in','/lobby','/arena'].includes(pathname.toLowerCase().replace(/\/+$/, '') || '/')) cameraStore.release()
  }, [pathname, driver])
  useEffect(() => () => cameraStore.release(), [])
  return null
}
