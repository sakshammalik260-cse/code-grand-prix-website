import type { MonitoringService } from '../../types/monitoring'
import { mockMonitoringService } from './mock'
export const isMonitoringMock = import.meta.env.VITE_ARENA_MODE !== 'api'
const backend = () => import('./backend').then(module => module.backendMonitoringService)
export const monitoringService: MonitoringService = isMonitoringMock ? mockMonitoringService : {
  getSession: (...args) => backend().then(service => service.getSession(...args)),
  getViewer: (...args) => backend().then(service => service.getViewer(...args)),
  reportIncident: (...args) => backend().then(service => service.reportIncident(...args)),
  listIncidents: (...args) => backend().then(service => service.listIncidents(...args)),
  listParticipants: (...args) => backend().then(service => service.listParticipants(...args)),
  resolveIncident: (...args) => backend().then(service => service.resolveIncident(...args)),
}
export const monitoringPollMs = Math.max(1000,Math.min(30000,Number(import.meta.env.VITE_MONITORING_POLL_MS) || 2000))
