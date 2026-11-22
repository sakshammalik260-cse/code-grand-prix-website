export const isDevelopmentMock = import.meta.env.DEV && import.meta.env.VITE_ARENA_MODE !== 'api'

export const isBackendConfigured = import.meta.env.PROD
  ? import.meta.env.VITE_ARENA_MODE !== 'mock'
  : import.meta.env.VITE_ARENA_MODE === 'api'

