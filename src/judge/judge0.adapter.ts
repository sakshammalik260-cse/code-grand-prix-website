import { setTimeout as delay } from "node:timers/promises";
import { z } from "zod";
import { ERROR_CODES, VERDICTS, type VerdictType } from "../constants/index.js";
import { env } from "../config/env.js";
import { AppError } from "../middleware/error.middleware.js";
import type { IJudgeAdapter, JudgeExecutionRequest, JudgeExecutionResult } from "./judge.interface.js";

export class JudgeUnavailable extends AppError {
  constructor(readonly stage: string) {
    super(503, ERROR_CODES.JUDGE_UNAVAILABLE, "Code execution is temporarily unavailable. Try again or contact race control.");
  }
}

const supported = {
  python: /^Python\s*\(3\./i,
  java: /^Java\s*\(/i,
  cpp: /^C\+\+\s*\(/i,
  javascript: /^JavaScript\s*\(Node\.js\b/i
};
type Language = keyof typeof supported;

const catalogSchema = z.array(z.object({ id: z.number().int().positive(), name: z.string().min(1).max(200) }));
const tokenSchema = z.object({ token: z.string().uuid() });
const statusSchema = z.object({ status: z.object({ id: z.number().int() }) });
const resultSchema = statusSchema.extend({
  stdout: z.string().nullable(), stderr: z.string().nullable(), compile_output: z.string().nullable(),
  time: z.union([z.string(), z.number()]).nullable(), memory: z.number().nonnegative().nullable()
});

async function readJson(response: Response, limit: number): Promise<unknown> {
  if (!response.body || Number(response.headers.get("content-length")) > limit) {
    await response.body?.cancel();
    throw new JudgeUnavailable("response-size");
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new JudgeUnavailable("response-size");
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } finally {
    reader.releaseLock();
  }
}

function decode(value: string | null): Buffer {
  if (!value) return Buffer.alloc(0);
  // Judge0 uses Ruby Base64.encode64, which wraps lines.
  const encoded = value.replace(/[\r\n]/g, "");
  const bytes = Buffer.from(encoded, "base64");
  if (bytes.toString("base64") !== encoded) throw new JudgeUnavailable("base64");
  return bytes;
}

export class Judge0Adapter implements IJudgeAdapter {
  private catalog?: { expiresAt: number; languages: Record<Language, { id: number; name: string }> };
  private discovering?: Promise<NonNullable<Judge0Adapter["catalog"]>>;
  private readonly apiUrl: string;

  constructor() {
    try {
      const url = new URL(env.JUDGE0_API_URL);
      const loopback = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
      if ((url.protocol !== "https:" && (url.protocol !== "http:" || !loopback)) ||
          url.username || url.password || url.search || url.hash || env.JUDGE0_API_KEY.length < 32) {
        throw new JudgeUnavailable("configuration");
      }
      this.apiUrl = url.href.replace(/\/$/, "");
    } catch {
      throw new JudgeUnavailable("configuration");
    }
  }

  private async request(path: string, signal: AbortSignal, limit: number, payload?: object) {
    try {
      const response = await fetch(this.apiUrl + path, {
        method: payload ? "POST" : "GET",
        redirect: "error",
        headers: { Accept: "application/json", "Content-Type": "application/json", "X-Auth-Token": env.JUDGE0_API_KEY },
        signal: AbortSignal.any([signal, AbortSignal.timeout(env.JUDGE0_HTTP_TIMEOUT_MS)]),
        body: payload ? JSON.stringify(payload) : undefined
      });
      if (!response.ok) {
        await response.body?.cancel();
        throw new JudgeUnavailable("upstream-http-" + response.status);
      }
      return await readJson(response, limit);
    } catch (error) {
      if (error instanceof JudgeUnavailable) throw error;
      throw new JudgeUnavailable(signal.aborted ? "deadline" : "transport-or-protocol");
    }
  }

  private async discover() {
    const signal = AbortSignal.timeout(env.JUDGE0_HTTP_TIMEOUT_MS);
    const [about, rows] = await Promise.all([
      this.request("/about", signal, 16384),
      this.request("/languages", signal, 65536)
    ]);
    if (!about || typeof about !== "object" || !("version" in about) || about.version !== "1.13.1") {
      throw new JudgeUnavailable("unsupported-version");
    }
    const parsed = catalogSchema.safeParse(rows);
    if (!parsed.success) throw new JudgeUnavailable("language-catalog");
    const languages = {} as NonNullable<Judge0Adapter["catalog"]>["languages"];
    for (const language of Object.keys(supported) as Language[]) {
      const pinnedName = env[`JUDGE0_LANGUAGE_${language.toUpperCase() as Uppercase<Language>}`];
      const candidates = parsed.data.filter(item => supported[language].test(item.name) &&
        (!pinnedName || item.name === pinnedName));
      // Judge0 can expose several compiler versions. Require an explicit name in that case.
      if (candidates.length !== 1) throw new JudgeUnavailable("language-selection-" + language);
      languages[language] = candidates[0];
    }
    return { expiresAt: Date.now() + 300000, languages };
  }

  async getLanguages() {
    if (this.catalog && this.catalog.expiresAt > Date.now()) return this.catalog.languages;
    this.discovering ??= this.discover().then(catalog => (this.catalog = catalog)).finally(() => {
      this.discovering = undefined;
    });
    return (await this.discovering).languages;
  }

  async execute(request: JudgeExecutionRequest): Promise<JudgeExecutionResult> {
    const signal = AbortSignal.any([AbortSignal.timeout(env.JUDGE0_JOB_TIMEOUT_MS),
      ...(request.signal ? [request.signal] : [])]);
    const catalog = await this.getLanguages();
    const runtime = Object.hasOwn(catalog, request.language) ? catalog[request.language as Language] : undefined;
    if (!runtime) throw new JudgeUnavailable("language-selection");
    const cpu = request.timeLimitMs / 1000;
    const memory = request.memoryLimitMb * 1024;
    if (!Number.isFinite(cpu) || cpu < 0.1 || cpu > 60 || !Number.isInteger(memory) ||
        memory < 16384 || memory > 4194304) throw new JudgeUnavailable("execution-limits");
    const data = await this.request("/submissions?base64_encoded=true&wait=false", signal, 4096, {
      language_id: runtime.id, source_code: Buffer.from(request.sourceCode).toString("base64"),
      stdin: Buffer.from(request.stdin).toString("base64"),
      cpu_time_limit: cpu, cpu_extra_time: 0, wall_time_limit: Math.max(2, cpu * 2),
      memory_limit: memory, stack_limit: 8192, max_processes_and_or_threads: 32,
      enable_per_process_and_thread_time_limit: false,
      enable_per_process_and_thread_memory_limit: false,
      max_file_size: Math.max(1, Math.floor(env.MAX_OUTPUT_BYTES / 1024)),
      number_of_runs: 1, enable_network: false
    });
    const submitted = tokenSchema.safeParse(data);
    if (!submitted.success) throw new JudgeUnavailable("submission-token");

    const path = `/submissions/${submitted.data.token}?base64_encoded=true&fields=status,stdout,stderr,compile_output,time,memory`;
    while (!signal.aborted) {
      try { await delay(env.JUDGE0_POLL_INTERVAL_MS, undefined, { signal }); }
      catch { throw new JudgeUnavailable("deadline"); }
      const data = await this.request(path, signal, env.MAX_OUTPUT_BYTES * 5 + 16384);
      const status = statusSchema.safeParse(data);
      if (!status.success) throw new JudgeUnavailable("status");
      const { id } = status.data.status;
      if (id === 1 || id === 2) continue;
      if (id < 3 || id > 12) throw new JudgeUnavailable("worker-result");
      const result = resultSchema.safeParse(data);
      if (!result.success) throw new JudgeUnavailable("result-fields");
      const stdout = decode(result.data.stdout);
      const stderr = decode(id === 6 ? result.data.compile_output : result.data.stderr);
      const seconds = result.data.time === null ? 0 : Number(result.data.time);
      const memoryKb = result.data.memory ?? 0;
      if (!Number.isFinite(seconds) || seconds < 0) throw new JudgeUnavailable("runtime-metadata");
      const excessiveOutput = stdout.byteLength + stderr.byteLength > env.MAX_OUTPUT_BYTES || id === 8;
      let decodedOutput = "";
      let invalidOutput = false;
      if (!excessiveOutput) {
        try { decodedOutput = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(stdout); }
        catch { invalidOutput = true; }
      }
      let verdict: VerdictType;
      if (excessiveOutput || invalidOutput) verdict = VERDICTS.RUNTIME_ERROR;
      else if (id === 3) verdict = VERDICTS.ACCEPTED;
      else if (id === 4) verdict = VERDICTS.WRONG_ANSWER;
      else if (id === 5) verdict = VERDICTS.TIME_LIMIT_EXCEEDED;
      else if (id === 6) verdict = VERDICTS.COMPILATION_ERROR;
      else if (memoryKb >= memory) verdict = VERDICTS.MEMORY_LIMIT_EXCEEDED;
      else verdict = VERDICTS.RUNTIME_ERROR;
      return {
        status: verdict, stdout: decodedOutput,
        stderr: excessiveOutput ? "Output limit exceeded." : invalidOutput ? "Output is not valid UTF-8." : stderr.toString("utf8"),
        runtimeMs: Math.round(seconds * 1000), memoryKb
      };
    }
    throw new JudgeUnavailable("deadline");
  }
}
