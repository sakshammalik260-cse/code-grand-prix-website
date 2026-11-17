import { useSyncExternalStore } from 'react'
import { cameraStore } from '../services/cameraStore'
export function useCamera() {
  return { ...useSyncExternalStore(cameraStore.subscribe, cameraStore.getSnapshot), request: cameraStore.request }
}
