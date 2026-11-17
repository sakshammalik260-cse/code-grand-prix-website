import { isDevelopmentMock } from '../mode'
import type { HintService,AdminHintService,LeaderboardService } from '../../types/assist'
const transport=import.meta.env.DEV&&isDevelopmentMock?()=>import('./mock'):()=>import('./backend')
export const hintService:HintService={get:(...args)=>transport().then(s=>s.hintAdapter.get(...args)),unlock:(...args)=>transport().then(s=>s.hintAdapter.unlock(...args))}
export const adminHintService:AdminHintService={list:(...args)=>transport().then(s=>s.adminHintAdapter.list(...args)),create:(...args)=>transport().then(s=>s.adminHintAdapter.create(...args)),update:(...args)=>transport().then(s=>s.adminHintAdapter.update(...args)),remove:(...args)=>transport().then(s=>s.adminHintAdapter.remove(...args))}
export const leaderboardService:LeaderboardService={get:(...args)=>transport().then(s=>s.leaderboardAdapter.get(...args))}
