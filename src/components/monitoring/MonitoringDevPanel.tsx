import { useState } from 'react'
import type { CompetitionSession, IncidentType } from '../../types/monitoring'
import type { MonitoringClient } from '../../services/monitoring/client'
interface Props { client: MonitoringClient; session: CompetitionSession | null }
export default function MonitoringDevPanel({ client }: Props) {
  const [message,setMessage] = useState('')
  const [busy,setBusy] = useState(false)
  async function action(operation: () => Promise<unknown>) {
    setBusy(true);setMessage('')
    try { await operation();setMessage('Simulation request completed. Session status comes from the mock service.') }
    catch(error) { setMessage(error instanceof Error ? error.message : 'Simulation failed.') }
    finally { setBusy(false) }
  }
  const incident = (type: IncidentType) => { client.report(type) }
  return <details className="monitoring-dev-panel"><summary>Monitoring simulator · DEV</summary><div><h3>Development monitoring simulator</h3><p>Mock service only. No real volunteer approval or official timer changes.</p><div className="monitoring-dev-buttons"><button disabled={busy} onClick={() => incident('TAB_HIDDEN')}>Simulate tab switch</button><button disabled={busy} onClick={() => incident('FULLSCREEN_EXIT')}>Simulate fullscreen exit</button><button disabled={busy} onClick={() => incident('CAMERA_INTERRUPTED')}>Simulate camera interruption</button><button disabled={busy} onClick={() => incident('TAB_HIDDEN')}>Simulate session lock</button><button disabled={busy} onClick={() => { void action(() => client.refresh()) }}>Restore session snapshot</button><button disabled={busy} onClick={() => { sessionStorage.setItem('cgp-monitor-demo-offline','1');void client.refresh() }}>Simulate disconnection</button><button disabled={busy} onClick={() => { sessionStorage.removeItem('cgp-monitor-demo-offline');void client.refresh() }}>Reconnect monitoring</button></div><p>Test bulk approval in a separate tab: sign in with a volunteer or admin development account, open Race Control / Review session / AUTHORIZE & RESUME SESSION. Locked simulations are ignored; existing queued reports still retry.</p>{message && <p role="status">{message}</p>}</div></details>
}
