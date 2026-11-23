import { api } from './api'
import type { Role } from '../types'

export interface AdminUser {
  id: string
  driverId: string
  displayName: string
  team: string
  role: Role
  createdAt: string
  updatedAt: string
  session?: {
    id: string
    status: string
    cameraStatus: string
    lockCount: number
    revision: number
    lastSeenAt: string
  } | null
}

export interface AdminContestState {
  contestId: string
  contestStatus: string
  startsAt?: string
  endsAt?: string
  resultsVisible: boolean
  activeRound?: {
    id: string
    title: string
    status: string
    startsAt: string
    endsAt: string
    resultsVisible: boolean
    questionsVisible: boolean
  } | null
  rounds?: Array<{
    id: string
    title: string
    status: string
    startsAt: string
    endsAt: string
    resultsVisible: boolean
    questionsVisible: boolean
  }>
  remainingMs: number
  serverTime: string
}

export const adminControlService = {
  async getContestState(): Promise<AdminContestState> {
    return (await api.get<AdminContestState>('/admin/contest/state')).data
  },

  async startRace(durationMinutes = 120): Promise<{ success: boolean; status: string; startsAt: string; endsAt: string; remainingMs: number }> {
    return (await api.post('/admin/contest/start', { durationMinutes })).data
  },

  async pauseRace(): Promise<{ success: boolean; status: string }> {
    return (await api.post('/admin/contest/pause')).data
  },

  async resumeRace(): Promise<{ success: boolean; status: string }> {
    return (await api.post('/admin/contest/resume')).data
  },

  async endRace(): Promise<{ success: boolean; status: string }> {
    return (await api.post('/admin/contest/end')).data
  },

  async listUsers(role?: Role): Promise<AdminUser[]> {
    return (await api.get<AdminUser[]>('/admin/users', { params: role ? { role } : undefined })).data
  },

  async createUser(data: { driverId: string; displayName: string; team?: string; role: Role; password: string }): Promise<AdminUser> {
    return (await api.post<AdminUser>('/admin/users', data)).data
  },

  async updateUser(id: string, data: { driverId?: string; displayName?: string; team?: string; role?: Role; password?: string }): Promise<AdminUser> {
    return (await api.patch<AdminUser>(`/admin/users/${encodeURIComponent(id)}`, data)).data
  },

  async deleteUser(id: string): Promise<{ success: boolean }> {
    return (await api.delete<{ success: boolean }>(`/admin/users/${encodeURIComponent(id)}`)).data
  },

  async activateAllTeams(): Promise<{ success: boolean; activatedCount: number }> {
    return (await api.post('/admin/teams/activate-all')).data
  },

  async activateTeam(id: string): Promise<{ success: boolean; activatedCount: number }> {
    return (await api.post(`/admin/teams/${encodeURIComponent(id)}/activate`)).data
  }
}
