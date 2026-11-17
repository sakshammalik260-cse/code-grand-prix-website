import type { Driver, LoginCredentials } from '../types'
import { demoCredentials } from '../data/event'
export const authService = {
  async login({ driverId, password }: LoginCredentials): Promise<Driver> {
    await new Promise((resolve) => setTimeout(resolve, 600))
    if (driverId.trim().toUpperCase() !== demoCredentials.driverId || password !== demoCredentials.password) {
      throw new Error('Driver ID or password is incorrect. Check your credentials and try again.')
    }
    return { id: demoCredentials.driverId, name: 'Demo Driver', team: 'CPC • Preview grid' }
  },
}
