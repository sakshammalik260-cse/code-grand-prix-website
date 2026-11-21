import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { StatePanel } from './Ui'
import { cameraStore } from '../services/cameraStore'

interface Props { children: ReactNode; resetKey: string }
interface State { error: Error | null }

class Boundary extends Component<Props, State> {
  state: State = { error: null }
  static getDerivedStateFromError(error: Error): State { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Route render failed', error, info.componentStack)
    if (window.location.pathname.toLowerCase().replace(/\/+$/, '') === '/arena') {
      window.dispatchEvent(new Event('cgp-session-teardown'))
      cameraStore.release()
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
    }
  }
  componentDidUpdate(previous: Props) { if (this.state.error && previous.resetKey !== this.props.resetKey) this.setState({ error: null }) }
  render() {
    if (!this.state.error) return this.props.children
    const chunkFailure = /dynamically imported module|loading chunk|importing a module/i.test(this.state.error.message)
    return <StatePanel className="access-denied" eyebrow="Race Control / Display fault" title={chunkFailure ? 'A race module could not be loaded.' : 'This screen hit an unexpected fault.'} description={chunkFailure ? 'Your session and local drafts are unchanged. Reload the application to reconnect the interface.' : 'The interface stopped this route before it could damage your current session.'} icon={<AlertTriangle size={31}/>} tone="critical" action={<><button className="button button-primary" onClick={() => window.location.reload()}>RELOAD INTERFACE</button><Link className="button button-secondary" to="/">RETURN HOME</Link></>} />
  }
}

export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation()
  return <Boundary resetKey={`${location.pathname}${location.search}${location.hash}`}>{children}</Boundary>
}
