const arenaMode = import.meta.env.VITE_ARENA_MODE
export const isDevelopmentMock = import.meta.env.DEV && (arenaMode === undefined || arenaMode === 'mock')

export const isBackendConfigured = arenaMode === 'api'
