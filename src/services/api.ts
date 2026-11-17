import axios from 'axios'
// Shared client for proposed endpoints. Arena requests use it only in explicit API mode.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})
