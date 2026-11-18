// ==============================================================================
// CODE GRAND PRIX 2026 — LOCAL DEVELOPMENT SANDBOX RUNNER
// ==============================================================================

import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import { IJudgeAdapter, JudgeExecutionRequest, JudgeExecutionResult } from "./judge.interface.js";
import { VERDICTS } from "../constants/index.js";

const MAX_OUTPUT_BYTES = 65536; // 64 KB cap

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
        runCmd = "python3";
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
        fileName = "Solution.java";
        compileCmd = "javac";
        compileArgs = [path.join(tmpDir, fileName)];
        runCmd = "java";
        runArgs = ["-Xmx256m", "-Xms64m", "-cp", tmpDir, "Solution"];
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

      // Write stdin and close the stream
      if (stdin) {
        child.stdin.write(stdin);
      }
      child.stdin.end();
    });
  }
}
