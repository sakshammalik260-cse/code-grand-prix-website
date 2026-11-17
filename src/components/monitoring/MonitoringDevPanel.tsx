import { useState } from 'react'
import type { CompetitionSession, IncidentType } from '../../types/monitoring'
import { mockMonitoringService } from '../../services/monitoring/mock'
import type { MonitoringClient } from '../../services/monitoring/client'
interface Props { client: MonitoringClient; session: CompetitionSession | null }
export default function MonitoringDevPanel({ client, session }: Props) {
  const [message,setMessage] = useState('')
  const [busy,setBusy] = useState(false)
  async function action(operation: () => Promise<unknown>) {
    setBusy(true);setMessage('')
    try { await operation();setMessage('Simulation request completed. Session status comes from the mock service.') }
    catch(error) { setMessage(error instanceof Error ? error.message : 'Simulation failed.') }
    finally { setBusy(false) }
  }
  const incident = (type: IncidentType) => { client.report(type) }
  async function approve() {
    if (!session) throw new Error('Wait for a session snapshot.')
    const latest = await mockMonitoringService.getSession(client.scope)
    const incidents = await mockMonitoringService.listIncidents()
    const blocking = incidents.filter(item => item.sessionId === latest.id && item.blocking && item.reviewStatus !== 'AUTHORIZED')
    if (!blocking.length) throw new Error('No unresolved blocking incident. Restoration does not grant new approval.')
    const previous = sessionStorage.getItem('cgp-mock-volunteer-preview')
    sessionStorage.setItem('cgp-mock-volunteer-preview','1')
    try {
      for (const item of blocking) {
        const current = await mockMonitoringService.getSession(client.scope)
        await mockMonitoringService.resolveIncident(item.id,{ decision:'AUTHORIZE_RESUME',expectedSessionRevision:current.revision,note:'Explicit development simulation' })
      }
    } finally { if (previous === null) sessionStorage.removeItem('cgp-mock-volunteer-preview'); else sessionStorage.setItem('cgp-mock-volunteer-preview',previous) }
    await client.refresh()
  }
  return <details className="monitoring-dev-panel"><summary>Monitoring simulator · DEV</summary><div><h3>Development monitoring simulator</h3><p>Mock service only. No real volunteer approval or official timer changes.</p><div className="monitoring-dev-buttons"><button disabled={busy} onClick={() => incident('TAB_HIDDEN')}>Simulate tab switch</button><button disabled={busy} onClick={() => incident('FULLSCREEN_EXIT')}>Simulate fullscreen exit</button><button disabled={busy} onClick={() => incident('CAMERA_INTERRUPTED')}>Simulate camera interruption</button><button disabled={busy} onClick={() => incident('TAB_HIDDEN')}>Simulate session lock</button><button disabled={busy} onClick={() => { void action(approve) }}>Simulate volunteer approval</button><button disabled={busy} onClick={() => { void action(() => client.refresh()) }}>Restore session snapshot</button><button disabled={busy} onClick={() => { sessionStorage.setItem('cgp-monitor-demo-offline','1');void client.refresh() }}>Simulate disconnection</button><button disabled={busy} onClick={() => { sessionStorage.removeItem('cgp-monitor-demo-offline');void client.refresh() }}>Reconnect monitoring</button></div><a href="/volunteer" target="_blank" rel="noreferrer">Open mock volunteer console ↗</a>{message && <p role="status">{message}</p>}</div></details>
}
