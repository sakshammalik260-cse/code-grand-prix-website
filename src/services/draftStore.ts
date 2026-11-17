export interface DraftScope { contestId: string; driverId: string; problemId: string; language: string }
export interface DraftRecord { version: 1; sourceCode: string; updatedAt: string }
interface CachedDraft { record: DraftRecord; persisted: boolean }
export interface DraftRead { sourceCode: string; persisted: boolean; error: boolean; exists: boolean; needsWrite: boolean }
const memory = new Map<string, CachedDraft>()
export function draftKey(scope: DraftScope) {
  return 'cgp:draft:v1:' + [scope.contestId, scope.driverId, scope.problemId, scope.language].map(encodeURIComponent).join(':')
}
export function readDraft(key: string, fallback: string): DraftRead {
  const cached = memory.get(key)
  if (cached) return { sourceCode: cached.record.sourceCode, persisted: cached.persisted, error: !cached.persisted, exists: true, needsWrite: !cached.persisted }
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return { sourceCode: fallback, persisted: false, error: false, exists: false, needsWrite: false }
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1 || !('sourceCode' in value) || typeof value.sourceCode !== 'string') {
      return { sourceCode: fallback, persisted: false, error: true, exists: true, needsWrite: false }
    }
    return { sourceCode: value.sourceCode, persisted: true, error: false, exists: true, needsWrite: false }
  } catch { return { sourceCode: fallback, persisted: false, error: true, exists: false, needsWrite: false } }
}
export function writeDraft(key: string, sourceCode: string): boolean {
  const record: DraftRecord = { version: 1, sourceCode, updatedAt: new Date().toISOString() }
  memory.set(key, { record, persisted: false })
  try { localStorage.setItem(key, JSON.stringify(record)); memory.set(key, { record, persisted: true }); return true }
  catch { return false }
}
