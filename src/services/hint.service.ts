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

    const { hints, totalHintPenalty } = await HintRepository.getProblemHints(
      problem.slug,
      userId,
      contestId
    );

    const remainingPotentialScore = Math.max(0, problem.points - totalHintPenalty);

    return {
      problemId: problem.slug,
      maximumPoints: problem.points,
      totalHintPenalty,
      remainingPotentialScore,
      hints
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

    const problem = await ProblemRepository.findByIdPublic(problemId);
    if (!problem) {
      throw new AppError(404, ERROR_CODES.RESOURCE_NOT_FOUND, `Problem '${problemId}' not found.`);
    }

    const hint = await HintRepository.findHintById(hintId);
    if (!hint) {
      throw new AppError(404, ERROR_CODES.RESOURCE_NOT_FOUND, `Hint '${hintId}' not found.`);
    }

    // C14: Verify hint belongs to the requested problem
    if (hint.problemId !== problem.id && hint.problemId !== problem.slug) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        `Hint '${hintId}' does not belong to problem '${problemId}'.`
      );
    }

    const result = await HintRepository.unlockHint(
      userId,
      contestId,
      problem.slug,
      hintId,
      input.operationId
    );

    // Fetch updated hints state for complete frontend DTO (Page 14)
    const { hints: updatedHints, totalHintPenalty } = await HintRepository.getProblemHints(
      problem.slug,
      userId,
      contestId
    );

    const remainingPotentialScore = Math.max(0, problem.points - totalHintPenalty);

    return {
      contestId,
      problemId: problem.slug,
      configurationRevision: session.revision,
      maximumPoints: problem.points,
      totalHintPenalty,
      remainingPotentialScore,
      hints: updatedHints,
      hint: {
        id: result.hint.id,
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
