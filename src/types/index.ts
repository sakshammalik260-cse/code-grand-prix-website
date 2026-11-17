export interface Driver { id: string; name: string; team: string }
export interface CheckInRecord {
  driverId: string
  completedAt: string
  cameraVerified: boolean
  rulesAccepted: boolean
  fullscreenVerified: boolean
}
export type LobbyState = 'waiting' | 'live' | 'finished'
export interface LoginCredentials { driverId: string; password: string }

export * from './arena'
