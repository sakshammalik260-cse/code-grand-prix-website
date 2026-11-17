import axios from 'axios'
// Future endpoint modules can share this client. Phase 1 makes no backend requests.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})
