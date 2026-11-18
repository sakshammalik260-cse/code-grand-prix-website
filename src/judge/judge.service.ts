// ==============================================================================
// CODE GRAND PRIX 2026 — JUDGE SERVICE (DISPATCHER & EXECUTION ENGINE)
// ==============================================================================

import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env.js";
import { VERDICTS, VerdictType, ERROR_CODES } from "../constants/index.js";
import { AppError } from "../middleware/error.middleware.js";
import { IJudgeAdapter } from "./judge.interface.js";
import { LocalSandboxJudge } from "./local.sandbox.js";
import { Judge0Adapter } from "./judge0.adapter.js";
import { ProblemRepository } from "../repositories/problem.repository.js";
import { SubmissionRepository } from "../repositories/submission.repository.js";
import { SessionRepository } from "../repositories/session.repository.js";
import { ContestRepository } from "../repositories/contest.repository.js";
import { SubmissionStatus, Verdict, CheckinStatus, RaceSessionStatus, ContestStatus } from "@prisma/client";

export interface RunCodeInput {
  sessionId?: string;
  contestId?: string;
  driverId?: string;
  problemId: string;
  language: string;
  sourceCode: string;
  customInput?: string;
}

export interface SubmitCodeInput {
  sessionId?: string;
  contestId?: string;
  driverId?: string;
  problemId: string;
  language: string;
  sourceCode: string;
}

export class JudgeService {
  private static adapter: IJudgeAdapter;

  private static getAdapter(): IJudgeAdapter {
    if (!this.adapter) {
      if (env.JUDGE_PROVIDER === "judge0") {
        console.log("⚙️  Using Judge0 Production Adapter for code execution.");
        this.adapter = new Judge0Adapter();
      } else {
        console.log("⚙️  Using Local Subprocess Sandbox for development code execution.");
        this.adapter = new LocalSandboxJudge();
      }
    }
    return this.adapter;
  }

  /**
   * Helper to normalize output text for reliable competitive programming comparison
   */
  private static normalizeOutput(text: string): string {
    return text
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n")
      .trim();
  }

  /**
   * Run Code against public sample cases or custom input
   */
  static async runCode(userId: string, input: RunCodeInput) {
    const problem = await ProblemRepository.findByIdWithAllTests(input.problemId);
    if (!problem) {
      throw new AppError(
        404,
        ERROR_CODES.RESOURCE_NOT_FOUND,
        `Problem '${input.problemId}' does not exist.`
      );
    }

    if (input.sourceCode.length > env.MAX_SOURCE_CODE_BYTES) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        `Source code exceeds maximum allowed size of ${env.MAX_SOURCE_CODE_BYTES} bytes.`
      );
    }

    const adapter = this.getAdapter();
    const runId = `run_${uuidv4()}`;

    // Case A: Custom Input Execution
    if (input.customInput !== undefined && input.customInput !== null) {
      const exec = await adapter.execute({
        language: input.language,
        sourceCode: input.sourceCode,
        stdin: input.customInput,
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb
      });

      return {
        id: runId,
        problemId: problem.slug,
        language: input.language,
        status: exec.status,
        stdout: exec.stdout,
        stderr: exec.stderr,
        expectedOutput: null, // As specified in contract: null for custom input
        executionTimeMs: exec.runtimeMs,
        memoryUsageKb: exec.memoryKb,
        cases: [
          {
            id: "custom",
            label: "Custom Input",
            input: input.customInput,
            expectedOutput: null,
            stdout: exec.stdout,
            stderr: exec.stderr,
            status: exec.status
          }
        ],
        simulation: false
      };
    }

    // Case B: Public Sample Cases Execution
    const publicCases = problem.testCases.filter((tc) => tc.isPublic);
    const caseResults = [];
    let overallStatus: VerdictType = VERDICTS.ACCEPTED;
    let maxRuntime = 0;
    let maxMemory = 0;
    let lastStdout = "";
    let lastStderr = "";
    let lastExpectedOutput = "";

    for (let i = 0; i < publicCases.length; i++) {
      const tc = publicCases[i];
      const exec = await adapter.execute({
        language: input.language,
        sourceCode: input.sourceCode,
        stdin: tc.input,
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb
      });

      maxRuntime = Math.max(maxRuntime, exec.runtimeMs);
      maxMemory = Math.max(maxMemory, exec.memoryKb);
      lastStdout = exec.stdout;
      lastStderr = exec.stderr;
      lastExpectedOutput = tc.expectedOutput;

      let caseStatus: VerdictType = exec.status;

      if (caseStatus === VERDICTS.ACCEPTED) {
        const studentNorm = this.normalizeOutput(exec.stdout);
        const expectedNorm = this.normalizeOutput(tc.expectedOutput);
        if (studentNorm !== expectedNorm) {
          caseStatus = VERDICTS.WRONG_ANSWER;
        }
      }

      if (caseStatus !== VERDICTS.ACCEPTED && overallStatus === VERDICTS.ACCEPTED) {
        overallStatus = caseStatus;
      }

      caseResults.push({
        id: tc.id || `sample_${i + 1}`,
        label: `Sample ${i + 1}`,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        stdout: exec.stdout,
        stderr: exec.stderr,
        status: caseStatus
      });

      // Stop on fatal compilation error
      if (exec.status === VERDICTS.COMPILATION_ERROR) {
        break;
      }
    }

    return {
      id: runId,
      problemId: problem.slug,
      language: input.language,
      status: overallStatus,
      stdout: lastStdout,
      stderr: lastStderr,
      expectedOutput: lastExpectedOutput,
      executionTimeMs: maxRuntime,
      memoryUsageKb: maxMemory,
      cases: caseResults,
      simulation: false
    };
  }

  /**
   * Submit Code against private hidden test cases and persist official verdict
   */
  static async submitCode(userId: string, input: SubmitCodeInput) {
    const contestId = input.contestId || env.CONTEST_ID;

    // 1. Contest Gate
    const contest = await ContestRepository.getContest(contestId);
    const timeDetails = ContestRepository.calculateTimeDetails(contest);
    if (timeDetails.status !== ContestStatus.LIVE) {
      throw new AppError(
        409,
        ERROR_CODES.CONTEST_NOT_LIVE,
        `Contest is currently ${timeDetails.status}. Submissions are only permitted during LIVE status.`
      );
    }

    // 2. Session Integrity Gate
    const session = await SessionRepository.findOrCreate(userId, contestId);
    if (session.status === RaceSessionStatus.LOCKED) {
      throw new AppError(
        403,
        ERROR_CODES.SESSION_LOCKED,
        `Your session is LOCKED due to: ${session.lockReason || "integrity alert"}. Submissions are blocked until resolved by a volunteer.`
      );
    }

    if (session.checkinStatus !== CheckinStatus.READY) {
      throw new AppError(
        403,
        ERROR_CODES.CHECKIN_INCOMPLETE,
        "Pre-race check-in is incomplete. Complete camera and fullscreen check before submitting code."
      );
    }

    // 3. Problem Retrieval
    const problem = await ProblemRepository.findByIdWithAllTests(input.problemId);
    if (!problem) {
      throw new AppError(
        404,
        ERROR_CODES.RESOURCE_NOT_FOUND,
        `Problem '${input.problemId}' does not exist.`
      );
    }

    if (input.sourceCode.length > env.MAX_SOURCE_CODE_BYTES) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        `Source code exceeds maximum allowed size of ${env.MAX_SOURCE_CODE_BYTES} bytes.`
      );
    }

    // 4. Create initial Submission record (QUEUED)
    const submission = await SubmissionRepository.create({
      userId,
      problemId: problem.id,
      languageId: input.language,
      sourceCode: input.sourceCode
    });

    // 5. Execute judging pipeline
    const adapter = this.getAdapter();
    const allCases = problem.testCases;
    let passedTests = 0;
    let finalVerdict: VerdictType = VERDICTS.ACCEPTED;
    let maxRuntime = 0;
    let maxMemory = 0;
    let message = "All test cases passed.";

    for (let i = 0; i < allCases.length; i++) {
      const tc = allCases[i];
      const exec = await adapter.execute({
        language: input.language,
        sourceCode: input.sourceCode,
        stdin: tc.input,
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb
      });

      maxRuntime = Math.max(maxRuntime, exec.runtimeMs);
      maxMemory = Math.max(maxMemory, exec.memoryKb);

      if (exec.status === VERDICTS.COMPILATION_ERROR) {
        finalVerdict = VERDICTS.COMPILATION_ERROR;
        message = "Compilation error occurred.";
        break;
      }

      if (exec.status === VERDICTS.TIME_LIMIT_EXCEEDED) {
        finalVerdict = VERDICTS.TIME_LIMIT_EXCEEDED;
        message = `Time limit exceeded (${problem.timeLimitMs}ms).`;
        break;
      }

      if (exec.status === VERDICTS.RUNTIME_ERROR) {
        finalVerdict = VERDICTS.RUNTIME_ERROR;
        message = "Runtime error occurred during execution.";
        break;
      }

      // Check output correctness
      const studentNorm = this.normalizeOutput(exec.stdout);
      const expectedNorm = this.normalizeOutput(tc.expectedOutput);

      if (studentNorm === expectedNorm) {
        passedTests++;
      } else {
        finalVerdict = VERDICTS.WRONG_ANSWER;
        message = tc.isPublic
          ? `Wrong answer on sample test ${i + 1}.`
          : "Wrong answer on private test.";
        break;
      }
    }

    // Award points only if all test cases passed
    const score = finalVerdict === VERDICTS.ACCEPTED ? problem.points : 0;

    // Update submission record with terminal result
    const updatedSubmission = await SubmissionRepository.updateVerdict(submission.id, {
      status: SubmissionStatus.COMPLETED,
      verdict: finalVerdict as Verdict,
      score,
      passedTests,
      totalTests: allCases.length,
      runtimeMs: maxRuntime,
      memoryKb: maxMemory,
      message
    });

    return {
      id: submission.id,
      submissionId: submission.id,
      contestId,
      driverId: input.driverId,
      problemId: problem.slug,
      language: input.language,
      status: finalVerdict,
      verdict: finalVerdict,
      score,
      passedTests,
      totalTests: allCases.length,
      runtimeMs: maxRuntime,
      memoryKb: maxMemory,
      message,
      submittedAt: submission.createdAt.toISOString(),
      simulation: false
    };
  }

  /**
   * Retrieve submission details by ID
   */
  static async getSubmission(submissionId: string, userId: string, userRole: string) {
    const submission = await SubmissionRepository.findById(submissionId);
    if (!submission) {
      throw new AppError(
        404,
        ERROR_CODES.RESOURCE_NOT_FOUND,
        `Submission '${submissionId}' was not found.`
      );
    }

    // Role check: Candidates can only see their own submissions
    if (userRole.toLowerCase() === "participant" && submission.userId !== userId) {
      throw new AppError(
        403,
        ERROR_CODES.FORBIDDEN_ROLE,
        "Access denied: You can only view your own submissions."
      );
    }

    return {
      id: submission.id,
      submissionId: submission.id,
      status: submission.verdict,
      verdict: submission.verdict,
      score: submission.score,
      passedTests: submission.passedTests,
      totalTests: submission.totalTests,
      runtimeMs: submission.runtimeMs,
      memoryKb: submission.memoryKb,
      message: submission.message,
      submittedAt: submission.createdAt.toISOString(),
      simulation: false
    };
  }
}
