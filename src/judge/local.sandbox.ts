// ==============================================================================
// CODE GRAND PRIX 2026 — LOCAL DEVELOPMENT SANDBOX RUNNER
// ==============================================================================

import fs from "fs";
import path from "path";
import os from "os";
import { execFile, spawn } from "child_process";
import { promisify } from "node:util";
import { IJudgeAdapter, JudgeExecutionRequest, JudgeExecutionResult } from "./judge.interface.js";
import { VERDICTS } from "../constants/index.js";

const MAX_OUTPUT_BYTES = 65536; // 64 KB cap

const execFileAsync = promisify(execFile);

async function findPython(): Promise<string> {
  if (process.platform !== "win32") return "python3";

  // Enumerate installed runtimes without invoking a Python install alias.
  const candidates: string[] = [];
  try {
    const { stdout } = await execFileAsync("py", ["-0p"], {
      timeout: 3000,
      windowsHide: true
    });
    for (const line of stdout.split(/\r?\n/)) {
      const match = line.match(/^\s*-(?:V:)?(?:PythonCore\/)?3(?:[.\d-]*)\s+(\*\s+)?([A-Za-z]:\\.+\.exe)\s*$/i);
      if (!match) continue;
      if (match[1]) candidates.unshift(match[2].trim());
      else candidates.push(match[2].trim());
    }
  } catch {
    // Python may be installed directly without the launcher.
  }

  for (const directory of (process.env.PATH ?? "").split(path.delimiter)) {
    const absolute = directory.replace(/^"|"$/g, "");
    if (path.isAbsolute(absolute)) candidates.push(path.join(absolute, "python.exe"));
  }

  for (const candidate of candidates) {
    if (candidate.toLowerCase().split(path.sep).includes("windowsapps")) continue;
    if ((await fs.promises.stat(candidate).catch(() => null))?.isFile()) return candidate;
  }
  throw new Error("No installed Python 3 interpreter found for trusted local execution.");
}

export class LocalSandboxJudge implements IJudgeAdapter {
  async execute(request: JudgeExecutionRequest): Promise<JudgeExecutionResult> {
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "cgp-exec-"));

    try {
      return await this.runExecution(request, tmpDir);
    } finally {
      // Ensure isolated directory cleanup
      try {
        await fs.promises.rm(tmpDir, { recursive: true, force: true });
      } catch {
        // Ignored
      }
    }
  }

  private async runExecution(
    request: JudgeExecutionRequest,
    tmpDir: string
  ): Promise<JudgeExecutionResult> {
    const lang = request.language.toLowerCase();

    let fileName = "";
    let compileCmd: string | null = null;
    let compileArgs: string[] = [];
    let runCmd = "";
    let runArgs: string[] = [];

    switch (lang) {
      case "python":
      case "python3":
        fileName = "Solution.py";
        runCmd = await findPython();
        runArgs = [path.join(tmpDir, fileName)];
        break;

      case "javascript":
      case "nodejs":
      case "js":
        fileName = "solution.js";
        runCmd = process.execPath; // Use current Node executable
        runArgs = ["--max-old-space-size=256", path.join(tmpDir, fileName)];
        break;

      case "cpp":
      case "c++":
        fileName = "solution.cpp";
        compileCmd = "g++";
        compileArgs = [
          "-O2",
          "-std=c++17",
          path.join(tmpDir, fileName),
          "-o",
          path.join(tmpDir, "solution")
        ];
        runCmd = path.join(tmpDir, "solution");
        runArgs = [];
        break;

      case "java":
        const mainClass = /\bpublic\s+class\s+Main\b/.test(request.sourceCode) ? "Main" : "Solution";
        fileName = mainClass + ".java";
        compileCmd = "javac";
        compileArgs = [path.join(tmpDir, fileName)];
        runCmd = "java";
        runArgs = ["-Xmx256m", "-Xms64m", "-cp", tmpDir, mainClass];
        break;

      default:
        return {
          status: VERDICTS.INTERNAL_ERROR,
          stdout: "",
          stderr: `Unsupported language: ${request.language}`,
          runtimeMs: 0,
          memoryKb: 0
        };
    }

    // 1. Write source file to isolated directory
    const sourceFilePath = path.join(tmpDir, fileName);
    await fs.promises.writeFile(sourceFilePath, request.sourceCode, "utf8");

    // 2. Compilation Stage (if needed)
    if (compileCmd) {
      const compileResult = await this.spawnProcess(compileCmd, compileArgs, "", 8000, tmpDir);
      if (compileResult.timedOut) {
        return {
          status: VERDICTS.COMPILATION_ERROR,
          stdout: "",
          stderr: "Compilation timed out.",
          runtimeMs: 8000,
          memoryKb: 0
        };
      }
      if (compileResult.exitCode !== 0) {
        return {
          status: VERDICTS.COMPILATION_ERROR,
          stdout: "",
          stderr: compileResult.stderr || "Compilation failed.",
          runtimeMs: compileResult.durationMs,
          memoryKb: 0
        };
      }
    }

    // 3. Execution Stage
    const execResult = await this.spawnProcess(
      runCmd,
      runArgs,
      request.stdin,
      request.timeLimitMs,
      tmpDir
    );

    if (execResult.timedOut) {
      return {
        status: VERDICTS.TIME_LIMIT_EXCEEDED,
        stdout: execResult.stdout,
        stderr: execResult.stderr,
        runtimeMs: request.timeLimitMs,
        memoryKb: 0
      };
    }

    if (execResult.exitCode !== 0) {
      return {
        status: VERDICTS.RUNTIME_ERROR,
        stdout: execResult.stdout,
        stderr: execResult.stderr || `Process exited with code ${execResult.exitCode}`,
        runtimeMs: execResult.durationMs,
        memoryKb: 10240
      };
    }

    return {
      status: VERDICTS.ACCEPTED,
      stdout: execResult.stdout,
      stderr: execResult.stderr,
      runtimeMs: execResult.durationMs,
      memoryKb: 12480
    };
  }

  private spawnProcess(
    cmd: string,
    args: string[],
    stdin: string,
    timeoutMs: number,
    cwd: string
  ): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number | null;
    durationMs: number;
    timedOut: boolean;
  }> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let timedOut = false;
      let stdoutBytes = 0;
      let stderrBytes = 0;
      let stdout = "";
      let stderr = "";

      const child = spawn(cmd, args, {
        cwd,
        env: {
          PATH: process.env.PATH || "/usr/local/bin:/usr/bin:/bin",
          NODE_ENV: "production"
        },
        stdio: ["pipe", "pipe", "pipe"]
      });

      const timer = setTimeout(() => {
        timedOut = true;
        try {
          child.kill("SIGKILL");
        } catch {
          // Process already ended
        }
      }, timeoutMs);

      child.stdout.on("data", (chunk: Buffer) => {
        if (stdoutBytes < MAX_OUTPUT_BYTES) {
          const remaining = MAX_OUTPUT_BYTES - stdoutBytes;
          stdout += chunk.toString("utf8", 0, Math.min(chunk.length, remaining));
          stdoutBytes += chunk.length;
        }
      });

      child.stderr.on("data", (chunk: Buffer) => {
        if (stderrBytes < MAX_OUTPUT_BYTES) {
          const remaining = MAX_OUTPUT_BYTES - stderrBytes;
          stderr += chunk.toString("utf8", 0, Math.min(chunk.length, remaining));
          stderrBytes += chunk.length;
        }
      });

      child.on("error", (err: Error) => {
        clearTimeout(timer);
        resolve({
          stdout,
          stderr: err.message,
          exitCode: 1,
          durationMs: Date.now() - startTime,
          timedOut: false
        });
      });

      child.on("close", (exitCode: number | null) => {
        clearTimeout(timer);
        resolve({
          stdout,
          stderr,
          exitCode,
          durationMs: Date.now() - startTime,
          timedOut
        });
      });

      child.stdin.on("error", (error: NodeJS.ErrnoException) => {
        if (error.code !== "EPIPE" && error.code !== "ERR_STREAM_DESTROYED") child.kill();
      });

      // Write stdin and close the stream
      if (stdin) {
        child.stdin.write(stdin);
      }
      child.stdin.end();
    });
  }
}
