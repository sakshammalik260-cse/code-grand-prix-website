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
import { SubmissionStatus, Verdict, CheckinStatus, RaceSessionStatus } from "@prisma/client";

export interface RunCodeInput {
  sessionId?: string;
  contestId?: string;
  driverId?: string;
  problemId: string;
  language?: string;
  languageId?: string;
  sourceCode: string;
  customInput?: string;
}

export interface SubmitCodeInput {
  sessionId?: string;
  contestId?: string;
  driverId?: string;
  problemId: string;
  language?: string;
  languageId?: string;
  sourceCode: string;
}

export class JudgeService {
  private static adapter: IJudgeAdapter;

  private static getAdapter(): IJudgeAdapter {
    // C01 Fix: Disable unhardened local runner in production
    if (env.NODE_ENV === "production" && env.JUDGE_PROVIDER === "local") {
      throw new AppError(
        500,
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        "C01 Refusal: Local code execution adapter is disabled in production. Set JUDGE_PROVIDER=judge0."
      );
    }

    if (!this.adapter) {
      if (env.JUDGE_PROVIDER === "judge0") {
        this.adapter = new Judge0Adapter();
      } else {
        this.adapter = new LocalSandboxJudge();
      }
    }
    return this.adapter;
  }

  private static normalizeOutput(text: string): string {
    return text
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n")
      .trim();
  }

  /**
   * C02 & C05 Fix: Comprehensive Server-Side Gates for Run & Submit
   */
  private static async validateExecutionGates(
    userId: string,
    contestId: string,
    problemId: string,
    language: string,
    sourceCode: string,
    customInput?: string
  ) {
    // 1. Contest Gate
    const contest = await ContestRepository.getContest(contestId);
    const timeDetails = ContestRepository.calculateTimeDetails(contest);
    if (timeDetails.status !== "LIVE") {
      throw new AppError(
        409,
        ERROR_CODES.CONTEST_NOT_LIVE,
        `Contest is currently ${timeDetails.status}. Code execution is only permitted during LIVE status.`
      );
    }

    // 2. Session Integrity Gate
    const session = await SessionRepository.findOrCreate(userId, contestId);
    const isLocked =
      session.status === RaceSessionStatus.LOCKED ||
      session.status === RaceSessionStatus.LOCK_PENDING ||
      session.status === RaceSessionStatus.UNDER_REVIEW;

    if (isLocked) {
      throw new AppError(
        403,
        ERROR_CODES.SESSION_LOCKED,
        `Your session is ${session.status} due to: ${session.lockReason || "an integrity alert"}. Code execution is blocked until resolved by a volunteer.`
      );
    }

    if (session.checkinStatus !== CheckinStatus.READY) {
      throw new AppError(
        403,
        ERROR_CODES.CHECKIN_INCOMPLETE,
        "Pre-race check-in is incomplete. Complete camera and fullscreen check before running or submitting code."
      );
    }

    // 3. Problem Gate (C07 Fix: Must be strictly PUBLISHED)
    const problem = await ProblemRepository.findByIdWithAllTests(problemId, true);
    if (!problem) {
      throw new AppError(
        404,
        ERROR_CODES.RESOURCE_NOT_FOUND,
        `Problem '${problemId}' is either unpublished, future-round, or does not exist.`
      );
    }

    // 4. Language Gate (C02 Fix: Must be in allowedLanguages)
    const langNormalized = language.toLowerCase();
    const isAllowed = problem.allowedLanguages.some(
      (l) => l.toLowerCase() === langNormalized || (langNormalized === "js" && l === "javascript")
    );
    if (!isAllowed) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        `Language '${language}' is not permitted for problem '${problem.title}'. Allowed languages: [${problem.allowedLanguages.join(", ")}].`
      );
    }

    // 5. Payload Size Caps
    if (sourceCode.length > env.MAX_SOURCE_CODE_BYTES) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        `Source code exceeds maximum allowed size of ${env.MAX_SOURCE_CODE_BYTES} bytes.`
      );
    }

    if (customInput && customInput.length > env.MAX_CUSTOM_INPUT_BYTES) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        `Custom input exceeds maximum allowed size of ${env.MAX_CUSTOM_INPUT_BYTES} bytes.`
      );
    }

    return { problem, session, contest };
  }

  /**
   * Run Code against public sample cases or custom input
   */
  static async runCode(userId: string, input: RunCodeInput) {
    const contestId = input.contestId || env.CONTEST_ID;
    const language = (input.language || input.languageId || "").toLowerCase();
    const { problem } = await this.validateExecutionGates(
      userId,
      contestId,
      input.problemId,
      language,
      input.sourceCode,
      input.customInput
    );

    const adapter = this.getAdapter();
    const runId = `run_${uuidv4()}`;

    // Case A: Custom Input Execution
    if (input.customInput !== undefined && input.customInput !== null) {
      const exec = await adapter.execute({
        language,
        sourceCode: input.sourceCode,
        stdin: input.customInput,
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb
      });

      return {
        id: runId,
        problemId: problem.slug,
        language,
        status: exec.status,
        stdout: exec.stdout,
        stderr: exec.stderr,
        expectedOutput: null,
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
        language,
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

      if (exec.status === VERDICTS.COMPILATION_ERROR) {
        break;
      }
    }

    return {
      id: runId,
      problemId: problem.slug,
      language,
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
  static async submitCode(userId: string, trustedDriverId: string, input: SubmitCodeInput) {
    const contestId = input.contestId || env.CONTEST_ID;
    const language = (input.language || input.languageId || "").toLowerCase();
    const { problem } = await this.validateExecutionGates(
      userId,
      contestId,
      input.problemId,
      language,
      input.sourceCode
    );

    // Create Submission record
    const submission = await SubmissionRepository.create({
      userId,
      problemId: problem.id,
      languageId: language,
      sourceCode: input.sourceCode
    });

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
        language,
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

    const score = finalVerdict === VERDICTS.ACCEPTED ? problem.points : 0;

    await SubmissionRepository.updateVerdict(submission.id, {
      status: SubmissionStatus.COMPLETED,
      verdict: finalVerdict as Verdict,
      score,
      passedTests,
      totalTests: allCases.length,
      runtimeMs: maxRuntime,
      memoryKb: maxMemory,
      message
    });

    // Frontend SubmissionResult DTO (Page 7 & 9)
    return {
      id: submission.id,
      submissionId: submission.id,
      contestId,
      driverId: trustedDriverId,
      problemId: problem.slug,
      language,
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
   * C03 Fix: Retrieve submission details by ID with strict role checking
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

    const roleUpper = userRole.toUpperCase();
    const isStaff = roleUpper === "ADMIN" || roleUpper === "VOLUNTEER";

    // C03 Fix: Candidate role is CANDIDATE or PARTICIPANT
    if (!isStaff && submission.userId !== userId) {
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
