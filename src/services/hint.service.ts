import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
// ==============================================================================
// CODE GRAND PRIX 2026 — RACE ASSIST HINT SERVICE
// ==============================================================================

import { ERROR_CODES } from "../constants/index.js";
import { AppError } from "../middleware/error.middleware.js";
import { HintRepository } from "../repositories/hint.repository.js";
import { ProblemRepository } from "../repositories/problem.repository.js";
import { SessionRepository } from "../repositories/session.repository.js";
import { RaceSessionStatus } from "@prisma/client";

export class HintService {
  /**
   * Get hints state for a problem
   */
  static async getProblemHints(problemId: string, userId: string, contestId: string) {
    const problem = await ProblemRepository.findByIdPublic(problemId);
    if (!problem) {
      throw new AppError(404, ERROR_CODES.RESOURCE_NOT_FOUND, `Problem '${problemId}' not found.`);
    }

    // Candidate IDs are slugs; Prisma relations require the internal problem UUID.
    let canonicalProblemId = problem.slug;
    let configurationRevision = 1;
    try {
      const row = await prisma.problem.findUnique({ where: { slug: problem.slug },
        select: { id: true, revision: true } });
      if (row) { canonicalProblemId = row.id; configurationRevision = row.revision; }
    } catch (error) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw error;
    }
    const { hints, totalHintPenalty } = await HintRepository.getProblemHints(
      canonicalProblemId, userId, contestId
    );
    return {
      contestId, problemId: problem.slug, configurationRevision,
      maximumPoints: problem.points, totalHintPenalty,
      remainingPotentialScore: Math.max(0, problem.points - totalHintPenalty),
      hints: hints.map(h => ({ ...h, problemId: problem.slug }))
    };
  }

  /**
   * Unlock a hint for a problem
   */
  static async unlockHint(
    problemId: string,
    hintId: string,
    userId: string,
    contestId: string,
    input: { operationId: string; sessionId?: string }
  ) {
    const session = await SessionRepository.findOrCreate(userId, contestId);
    if (
      session.status === RaceSessionStatus.LOCKED ||
      session.status === RaceSessionStatus.UNDER_REVIEW ||
      session.status === RaceSessionStatus.LOCK_PENDING
    ) {
      throw new AppError(
        403,
        ERROR_CODES.SESSION_LOCKED,
        "Cannot unlock hints while your session is locked or under review."
      );
    }

    if (session.status !== RaceSessionStatus.ACTIVE && session.status !== RaceSessionStatus.RESUME_AUTHORIZED) {
      throw new AppError(403, ERROR_CODES.SESSION_LOCKED, "Competition session is not active.");
    }
    const problem = await ProblemRepository.findByIdPublic(problemId);
    if (!problem) {
      throw new AppError(404, ERROR_CODES.RESOURCE_NOT_FOUND, `Problem '${problemId}' not found.`);
    }

    const hint = await HintRepository.findHintById(hintId);
    if (!hint) {
      throw new AppError(404, ERROR_CODES.RESOURCE_NOT_FOUND, `Hint '${hintId}' not found.`);
    }

    let canonicalProblemId = problem.slug;
    let configurationRevision = 1;
    try {
      const row = await prisma.problem.findUnique({ where: { slug: problem.slug },
        select: { id: true, revision: true } });
      if (row) { canonicalProblemId = row.id; configurationRevision = row.revision; }
    } catch (error) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw error;
    }
    // Validate the configuration used for the candidate's confirmation.
    const pending = input as typeof input & { configurationRevision?: number; expectedDeductionPoints?: number };
    if (pending.configurationRevision !== undefined && pending.configurationRevision !== configurationRevision) {
      throw new AppError(409, ERROR_CODES.VALIDATION_ERROR, "Hint configuration changed. Refresh before unlocking.");
    }
    if (pending.expectedDeductionPoints !== undefined && pending.expectedDeductionPoints !== hint.deductionPoints) {
      throw new AppError(409, ERROR_CODES.VALIDATION_ERROR, "Hint price changed. Refresh before unlocking.");
    }
    // C14: Verify hint belongs to this problem's canonical ID.
    if (hint.problemId !== canonicalProblemId) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        `Hint '${hintId}' does not belong to problem '${problemId}'.`
      );
    }

    const result = await HintRepository.unlockHint(
      userId,
      contestId,
      canonicalProblemId,
      hintId,
      input.operationId,
      configurationRevision
    );

    // Fetch updated hints state for complete frontend DTO (Page 14)
    const { hints: updatedHints, totalHintPenalty } = await HintRepository.getProblemHints(
      canonicalProblemId,
      userId,
      contestId
    );

    const remainingPotentialScore = Math.max(0, problem.points - totalHintPenalty);

    return {
      contestId,
      problemId: problem.slug,
      configurationRevision,
      maximumPoints: problem.points,
      totalHintPenalty,
      remainingPotentialScore,
      hints: updatedHints.map(h => ({ ...h, problemId: problem.slug })),
      hint: {
        id: result.hint.id,
        problemId: problem.slug,
        order: result.hint.order,
        deductionPoints: result.hint.deductionPoints,
        content: result.hint.content,
        status: "UNLOCKED"
      },
      deductionApplied: result.deductionApplied,
      replayed: result.replayed
    };
  }
}
