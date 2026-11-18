// ==============================================================================
// CODE GRAND PRIX 2026 — JUDGE ADAPTER INTERFACE
// ==============================================================================

import { VerdictType } from "../constants/index.js";

export interface JudgeExecutionRequest {
  language: string; // 'python' | 'java' | 'cpp' | 'javascript'
  sourceCode: string;
  stdin: string;
  timeLimitMs: number;
  memoryLimitMb: number;
}

export interface JudgeExecutionResult {
  status: VerdictType;
  stdout: string;
  stderr: string;
  runtimeMs: number;
  memoryKb: number;
  error?: string;
}

export interface IJudgeAdapter {
  execute(request: JudgeExecutionRequest): Promise<JudgeExecutionResult>;
}
