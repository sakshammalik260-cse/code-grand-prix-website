import { useContext } from 'react'
import { SessionContext } from '../context/session'
export function useSession() {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession requires SessionProvider')
  return context
}
