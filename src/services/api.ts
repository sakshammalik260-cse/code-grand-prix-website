import axios from 'axios'
import { isBackendConfigured } from './mode'
// Shared client for proposed endpoints. Arena requests use it only in explicit API mode.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config=>{if(!isBackendConfigured)throw new Error('Race services are not connected yet. Contact CPC race control.');return config})
