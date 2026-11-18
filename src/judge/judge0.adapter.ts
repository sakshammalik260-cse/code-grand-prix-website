// ==============================================================================
// CODE GRAND PRIX 2026 — JUDGE0 PRODUCTION ADAPTER
// ==============================================================================

import { IJudgeAdapter, JudgeExecutionRequest, JudgeExecutionResult } from "./judge.interface.js";
import { VERDICTS, VerdictType } from "../constants/index.js";
import { env } from "../config/env.js";

// Standard Judge0 Language IDs
const JUDGE0_LANGUAGE_IDS: Record<string, number> = {
  python: 71, // Python (3.8.1)
  python3: 71,
  javascript: 63, // JavaScript (Node.js 12.14.0)
  nodejs: 63,
  js: 63,
  cpp: 54, // C++ (GCC 9.2.0)
  "c++": 54,
  java: 62 // Java (OpenJDK 13.0.1)
};

export class Judge0Adapter implements IJudgeAdapter {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = env.JUDGE0_API_URL.replace(/\/$/, "");
    this.apiKey = env.JUDGE0_API_KEY;
  }

  async execute(request: JudgeExecutionRequest): Promise<JudgeExecutionResult> {
    const langKey = request.language.toLowerCase();
    const languageId = JUDGE0_LANGUAGE_IDS[langKey];

    if (!languageId) {
      return {
        status: VERDICTS.INTERNAL_ERROR,
        stdout: "",
        stderr: `Language '${request.language}' is not mapped in Judge0 adapter.`,
        runtimeMs: 0,
        memoryKb: 0
      };
    }

    const payload = {
      source_code: Buffer.from(request.sourceCode).toString("base64"),
      language_id: languageId,
      stdin: Buffer.from(request.stdin || "").toString("base64"),
      cpu_time_limit: Math.max(1, Math.ceil(request.timeLimitMs / 1000)),
      memory_limit: request.memoryLimitMb * 1024
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };

    if (this.apiKey) {
      headers["X-Auth-Token"] = this.apiKey;
      headers["X-RapidAPI-Key"] = this.apiKey;
    }

    try {
      const response = await fetch(`${this.apiUrl}/submissions?base64_encoded=true&wait=true`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Judge0 responded with HTTP ${response.status}: ${await response.text()}`);
      }

      const data = (await response.json()) as {
        status?: { id: number; description: string };
        stdout?: string | null;
        stderr?: string | null;
        compile_output?: string | null;
        time?: string | null;
        memory?: number | null;
        message?: string | null;
      };

      const stdout = data.stdout ? Buffer.from(data.stdout, "base64").toString("utf8") : "";
      const stderr = data.stderr
        ? Buffer.from(data.stderr, "base64").toString("utf8")
        : data.compile_output
        ? Buffer.from(data.compile_output, "base64").toString("utf8")
        : "";

      const runtimeMs = data.time ? Math.round(parseFloat(data.time) * 1000) : 0;
      const memoryKb = data.memory || 0;

      const verdict = this.mapJudge0Status(data.status?.id || 13);

      return {
        status: verdict,
        stdout,
        stderr,
        runtimeMs,
        memoryKb
      };
    } catch (error) {
      return {
        status: VERDICTS.INTERNAL_ERROR,
        stdout: "",
        stderr: `Judge0 execution failed: ${(error as Error).message}`,
        runtimeMs: 0,
        memoryKb: 0
      };
    }
  }

  private mapJudge0Status(statusId: number): VerdictType {
    switch (statusId) {
      case 3:
        return VERDICTS.ACCEPTED;
      case 4:
        return VERDICTS.WRONG_ANSWER;
      case 5:
        return VERDICTS.TIME_LIMIT_EXCEEDED;
      case 6:
        return VERDICTS.COMPILATION_ERROR;
      case 7:
      case 8:
      case 9:
      case 10:
      case 11:
      case 12:
        return VERDICTS.RUNTIME_ERROR;
      default:
        return VERDICTS.INTERNAL_ERROR;
    }
  }
}
