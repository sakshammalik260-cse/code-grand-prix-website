import type { SubmissionStatus } from '../types/arena'
export const statusLabels: Record<SubmissionStatus, string> = {
  QUEUED: 'Queued', RUNNING: 'Running', ACCEPTED: 'Accepted', WRONG_ANSWER: 'Wrong Answer',
  COMPILATION_ERROR: 'Compilation Error', RUNTIME_ERROR: 'Runtime Error', TIME_LIMIT_EXCEEDED: 'Time Limit Exceeded', MEMORY_LIMIT_EXCEEDED: 'Memory Limit Exceeded',
}
