import { z } from "zod";
import { VERDICTS, type VerdictType } from "../constants/index.js";
import { env } from "../config/env.js";
import type { IJudgeAdapter, JudgeExecutionRequest, JudgeExecutionResult } from "./judge.interface.js";
import { JudgeUnavailable, readJudgeJson } from "./judge-transport.js";

const languages = {
  python: { names: ["python", "python3"], file: "main.py", compileStage: "none" },
  java: { names: ["java"], file: "Main.java", compileStage: "optional" },
  cpp: { names: ["c++", "cpp", "g++"], file: "main.cpp", compileStage: "required" },
  javascript: { names: ["javascript", "node", "nodejs", "node.js"], file: "main.js", compileStage: "none" }
};
type Language = keyof typeof languages;

const runtimeSchema = z.object({
  language: z.string().min(1).max(80),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  aliases: z.array(z.string().max(80)).max(100)
});
type Runtime = z.infer<typeof runtimeSchema>;
const stageSchema = z.object({
  stdout: z.string(), stderr: z.string(),
  code: z.number().int().nullable(),
  signal: z.string().nullable(),
  status: z.enum(["RE", "SG", "TO", "OL", "EL", "XX"]).nullable(),
  memory: z.number().finite().nonnegative().nullable(),
  cpu_time: z.number().finite().nonnegative().nullable(),
  wall_time: z.number().finite().nonnegative().nullable()
});
type Stage = z.infer<typeof stageSchema>;
const resultSchema = z.object({
  language: z.string(), version: z.string(),
  compile: stageSchema.optional(), run: stageSchema.optional()
});
const compileTimeoutMs = 10000;
const maxRunCpuMs = 60000;
const discoveryTimeoutMs = 5000;
const executionCooldownMs = 30000;
const bytesPerMb = 1024 * 1024;

function stageVerdict(stage: Stage, compiled: boolean, memoryLimit: number): VerdictType {
  if (stage.status === "XX") throw new JudgeUnavailable("piston-worker");
  if (stage.status === "TO") return VERDICTS.TIME_LIMIT_EXCEEDED;
  if (stage.status === "OL" || stage.status === "EL") return VERDICTS.RUNTIME_ERROR;
  // Isolate reports coarse memory figures. A capped cgroup can be rounded down to a page boundary.
  const reportedLimit = Math.floor(memoryLimit / 1000) * 1000;
  const killed = (stage.status === "RE" || stage.status === "SG") &&
    (stage.code === 137 || stage.signal === "SIGKILL");
  if (stage.memory !== null && stage.memory >= reportedLimit - (killed ? 4096 : 0)) {
    return VERDICTS.MEMORY_LIMIT_EXCEEDED;
  }
  if (stage.status === null && stage.code === 0 && stage.signal === null) {
    if (stage.memory === null || stage.cpu_time === null || stage.wall_time === null) {
      throw new JudgeUnavailable("piston-missing-resource-metadata");
    }
    return VERDICTS.ACCEPTED;
  }
  if (stage.status === null && stage.code === null && stage.signal === null) {
    throw new JudgeUnavailable("piston-missing-exit-status");
  }
  return compiled ? VERDICTS.COMPILATION_ERROR : VERDICTS.RUNTIME_ERROR;
}

function javaSourceCompilationFailed(stage: Stage): boolean {
  // The source launcher reports both compile errors and uncaught exceptions with exit code 1.
  return stage.code === 1 && stage.signal === null && stage.stdout === "" &&
    /^(?:[^\r\n]*[/\\])?Main\.java(?:\.java)?:\d+: error:[ \t]/m.test(stage.stderr) &&
    /\r?\nerror: compilation failed\s*$/.test(stage.stderr);
}

export class PistonAdapter implements IJudgeAdapter {
  private readonly base: string;
  private readonly headers: Headers;
  private catalog?: { expires: number; runtimes: Record<Language, Runtime> };
  private discovery?: Promise<NonNullable<PistonAdapter["catalog"]>>;
  private executionCooldownUntil = 0;

  constructor() {
    try {
      const url = new URL(env.PISTON_API_URL);
      const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
      const token = env.PISTON_API_TOKEN;
      if (url.username || url.password || url.search || url.hash || url.pathname !== "/" ||
          (url.protocol !== "https:" && (url.protocol !== "http:" || !local)) ||
          (!local && !token) || (token && !/^[!-~]+$/.test(token))) {
        throw new JudgeUnavailable("piston-configuration");
      }
      this.base = url.origin + "/api/v2";
      this.headers = new Headers({
        Accept: "application/json", "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {})
      });
    } catch {
      throw new JudgeUnavailable("piston-configuration");
    }
  }

  private async request(path: "/runtimes" | "/execute", timeout: number, parent?: AbortSignal, body?: object) {
    const signal = AbortSignal.any([AbortSignal.timeout(timeout), ...(parent ? [parent] : [])]);
    try {
      const response = await fetch(this.base + path, {
        method: body ? "POST" : "GET", headers: this.headers, redirect: "error", signal,
        body: body ? JSON.stringify(body) : undefined
      });
      if (!response.ok) {
        await response.body?.cancel();
        throw new JudgeUnavailable("piston-http-" + response.status);
      }
      // Both stages may include stdout, stderr and the combined copy. Allow JSON escaping.
      return await readJudgeJson(response, body ? env.MAX_OUTPUT_BYTES * 48 + 16384 : 65536);
    } catch (error) {
      if (error instanceof JudgeUnavailable) throw error;
      if (path === "/execute") {
        // The next request should rediscover runtimes after a transport failure.
        this.catalog = undefined;
        if (signal.aborted) {
          // The worker can continue an aborted HTTP job. Give it time to drain before adding work.
          this.executionCooldownUntil = Date.now() + executionCooldownMs;
        }
      }
      throw new JudgeUnavailable(signal.aborted ? "piston-deadline" : "piston-transport");
    }
  }

  private async discover() {
    const raw = await this.request("/runtimes", discoveryTimeoutMs);
    // An unrelated runtime might use a version format we never submit.
    const parsed = z.array(z.unknown()).max(500).safeParse(raw);
    if (!parsed.success) throw new JudgeUnavailable("piston-catalog");
    const available = parsed.data.flatMap(row => {
      const runtime = runtimeSchema.safeParse(row);
      return runtime.success ? [runtime.data] : [];
    });
    const runtimes = {} as Record<Language, Runtime>;
    for (const language of Object.keys(languages) as Language[]) {
      const version = env[`PISTON_${language.toUpperCase() as Uppercase<Language>}_VERSION`];
      const names = languages[language].names;
      const matches = available.filter(row => [row.language, ...row.aliases].some(name => names.includes(name.toLowerCase())) &&
        (language !== "python" || row.version.startsWith("3.")) && (!version || row.version === version));
      if (matches.length !== 1) throw new JudgeUnavailable("piston-runtime-" + language);
      runtimes[language] = matches[0];
    }
    return { expires: Date.now() + 300000, runtimes };
  }

  async getRuntimes() {
    if (this.catalog && this.catalog.expires > Date.now()) return this.catalog.runtimes;
    this.discovery ??= this.discover().then(catalog => (this.catalog = catalog)).finally(() => {
      this.discovery = undefined;
    });
    return (await this.discovery).runtimes;
  }

  async execute(request: JudgeExecutionRequest): Promise<JudgeExecutionResult> {
    if (!Object.hasOwn(languages, request.language)) throw new JudgeUnavailable("piston-language");
    const language = request.language as Language;
    const spec = languages[language];
    const problemCpu = request.timeLimitMs;
    const memory = request.memoryLimitMb * bytesPerMb;
    if (!Number.isInteger(problemCpu) || problemCpu < 100 || problemCpu > maxRunCpuMs ||
        !Number.isInteger(memory) || memory < 16 * bytesPerMb || memory > env.PISTON_MAX_RUN_MEMORY_MB * bytesPerMb) {
      throw new JudgeUnavailable("piston-execution-limits");
    }
    const compileMemory = env.PISTON_COMPILE_MEMORY_MB * bytesPerMb;
    const sourceAllowance = language === "java" ? env.PISTON_JAVA_SOURCE_CPU_ALLOWANCE_MS : 0;
    const cpu = Math.min(problemCpu + sourceAllowance, maxRunCpuMs);
    const wall = Math.max(2000, 2 * cpu);
    if (request.signal?.aborted) throw new JudgeUnavailable("piston-deadline");
    const runtime = (await this.getRuntimes())[language];
    if (request.signal?.aborted) throw new JudgeUnavailable("piston-deadline");
    if (Date.now() < this.executionCooldownUntil) throw new JudgeUnavailable("piston-execution-cooldown");
    const data = await this.request("/execute", compileTimeoutMs + wall + 5000, request.signal, {
      language: runtime.language, version: runtime.version,
      files: [{ name: spec.file, content: request.sourceCode }],
      stdin: request.stdin,
      compile_timeout: compileTimeoutMs, compile_cpu_time: compileTimeoutMs, compile_memory_limit: compileMemory,
      run_timeout: wall, run_cpu_time: cpu, run_memory_limit: memory
    });
    const result = resultSchema.safeParse(data);
    if (!result.success || result.data.language !== runtime.language || result.data.version !== runtime.version) {
      throw new JudgeUnavailable("piston-result");
    }
    const { compile, run } = result.data;
    if ((!compile && spec.compileStage === "required") || (compile && spec.compileStage === "none")) {
      throw new JudgeUnavailable("piston-result");
    }
    if (compile && sourceAllowance > 0) throw new JudgeUnavailable("piston-java-source-policy");
    if (compile) {
      const verdict = stageVerdict(compile, true, compileMemory);
      if (verdict !== VERDICTS.ACCEPTED || this.exceedsOutput(compile)) return this.toResult(compile, verdict, true);
    }
    if (!run) throw new JudgeUnavailable("piston-result");
    const verdict = stageVerdict(run, false, memory);
    if (language === "java" && !compile && verdict === VERDICTS.RUNTIME_ERROR &&
        (run.status === "RE" || run.status === null) && javaSourceCompilationFailed(run)) {
      return this.toResult(run, VERDICTS.COMPILATION_ERROR, true);
    }
    return this.toResult(run, verdict, false);
  }

  private exceedsOutput(stage: Stage) {
    return stage.status === "OL" || stage.status === "EL" ||
      Buffer.byteLength(stage.stdout) + Buffer.byteLength(stage.stderr) > env.MAX_OUTPUT_BYTES;
  }

  private toResult(stage: Stage, status: VerdictType, compiling: boolean): JudgeExecutionResult {
    const oversized = this.exceedsOutput(stage);
    return {
      status: oversized && status !== VERDICTS.TIME_LIMIT_EXCEEDED && status !== VERDICTS.MEMORY_LIMIT_EXCEEDED
        ? VERDICTS.RUNTIME_ERROR : status,
      stdout: oversized || compiling ? "" : stage.stdout,
      stderr: oversized ? "Output limit exceeded." : compiling && !stage.stderr ? stage.stdout : stage.stderr,
      runtimeMs: Math.ceil(stage.cpu_time ?? 0),
      memoryKb: Math.ceil((stage.memory ?? 0) / 1024)
    };
  }
}
