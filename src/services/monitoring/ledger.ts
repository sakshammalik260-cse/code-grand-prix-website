import type { HintReceipt,MockScoreRecord } from '../../types/assist'
import type { AuthorizationLedger } from './sessionAuthorization'
export interface Ledger extends AuthorizationLedger { hintUnlocks?:Record<string,HintReceipt>; scores?:Record<string,MockScoreRecord> }
let opening: Promise<IDBDatabase> | undefined
function open() {
  if (!opening) opening = new Promise<IDBDatabase>((resolve,reject) => {
    const request = indexedDB.open('cgp-monitoring-demo-v1',1)
    request.onupgradeneeded = () => request.result.createObjectStore('ledger')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => { opening = undefined; reject(new Error('Mock monitoring storage is unavailable. Ask an organizer to restore access.')) }
    request.onblocked = () => { opening = undefined; reject(new Error('Close older preview tabs and retry monitoring.')) }
  })
  return opening
}
export async function ledgerTransaction<T>(write: boolean, operation: (ledger: Ledger) => T): Promise<T> {
  const database = await open()
  return new Promise<T>((resolve,reject) => {
    const transaction = database.transaction('ledger',write ? 'readwrite' : 'readonly')
    const store = transaction.objectStore('ledger')
    const request = store.get('state')
    let result: T
    request.onsuccess = () => {
      try {
        const ledger: Ledger = request.result || { sessions: {}, incidents: [] }
        result = operation(ledger)
        if (write) store.put(ledger,'state')
      } catch (error) { transaction.abort(); reject(error) }
    }
    transaction.oncomplete = () => resolve(result)
    transaction.onerror = () => reject(transaction.error || new Error('Monitoring storage transaction failed.'))
    transaction.onabort = () => reject(transaction.error || new Error('Monitoring transaction cancelled.'))
  })
}
