import type { MonitoringService } from '../../types/monitoring'
import { isDevelopmentMock } from '../mode'
export const isMonitoringMock = isDevelopmentMock
const backend = () => import('./backend').then(module => module.backendMonitoringService)
const transport = import.meta.env.DEV && isDevelopmentMock ? () => import('./mock').then(module=>module.mockMonitoringService) : backend
export const monitoringService: MonitoringService = {
  getSession: (...args) => transport().then(service => service.getSession(...args)),
  getViewer: (...args) => transport().then(service => service.getViewer(...args)),
  reportIncident: (...args) => transport().then(service => service.reportIncident(...args)),
  listIncidents: (...args) => transport().then(service => service.listIncidents(...args)),
  listParticipants: (...args) => transport().then(service => service.listParticipants(...args)),
  resolveIncident: (...args) => transport().then(service => service.resolveIncident(...args)),
}
export const monitoringPollMs = Math.max(1000,Math.min(30000,Number(import.meta.env.VITE_MONITORING_POLL_MS) || 2000))
