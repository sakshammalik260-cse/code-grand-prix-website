import type { CheckInRecord } from '../types'
import type { SessionEnvelope } from '../types/monitoring'
import { api } from './api'
import { isDevelopmentMock } from './mode'

type BackendSession = SessionEnvelope & { checkinStatus: 'NOT_STARTED' | 'BLOCKED' | 'READY' }

export async function restoreCheckIn(driverId: string, signal?: AbortSignal): Promise<CheckInRecord | null> {
  const { data } = await api.get<BackendSession>('/session', { signal })
  if (data?.viewer?.role !== 'CANDIDATE' || data.viewer.id !== driverId ||
      data.viewer.simulation !== false || data.session?.driverId !== driverId ||
      !['NOT_STARTED', 'BLOCKED', 'READY'].includes(data.checkinStatus)) {
    throw new Error('Race Control could not verify your participant session.')
  }
  if (data.checkinStatus !== 'READY') return null
  if (!Number.isFinite(Date.parse(data.session.updatedAt))) {
    throw new Error('Race Control returned an invalid check-in timestamp.')
  }
  return { driverId, completedAt: data.session.updatedAt, cameraVerified: true, fullscreenVerified: true, rulesAccepted: true }
}

export async function verifyCheckIn(record: CheckInRecord): Promise<CheckInRecord> {
  if (isDevelopmentMock) return record
  const { data } = await api.post<{
    checkinStatus: BackendSession['checkinStatus']
    session: { driverId: string; updatedAt: string; cameraPermission: boolean; fullscreenRequested: boolean; rulesAccepted: boolean }
  }>('/checkin', {
    rulesAccepted: record.rulesAccepted,
    cameraPermission: record.cameraVerified,
    fullscreenRequested: record.fullscreenVerified,
  })
  const session = data?.session
  if (data?.checkinStatus !== 'READY' || session?.driverId !== record.driverId ||
      session.cameraPermission !== true || session.fullscreenRequested !== true ||
      session.rulesAccepted !== true || !Number.isFinite(Date.parse(session.updatedAt))) {
    throw new Error('Race Control could not verify your check-in.')
  }
  return { ...record, completedAt: session.updatedAt }
}
