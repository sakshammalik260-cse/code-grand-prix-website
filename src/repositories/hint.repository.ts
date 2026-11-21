import { Prisma } from "@prisma/client";
import { AppError } from "../middleware/error.middleware.js";
import { ERROR_CODES } from "../constants/index.js";
import { visibleProblem } from "../services/round.service.js";
import { env } from "../config/env.js";
// ==============================================================================
// CODE GRAND PRIX 2026 — HINT REPOSITORY
// ==============================================================================

import { prisma } from "../config/database.js";
import { SEED_DATA } from "../data/seed-data.js";
import { Hint, HintReceipt } from "@prisma/client";

const inMemoryHints: Map<string, Hint[]> = new Map();

// Initialize in-memory hints from SEED_DATA
for (const p of SEED_DATA.problems) {
  if (p.hints && p.hints.length > 0) {
    const list: Hint[] = p.hints.map((h) => ({
      id: h.id,
      problemId: p.slug,
      order: h.order,
      deductionPoints: h.deductionPoints,
      content: h.content,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    inMemoryHints.set(p.slug, list);
    inMemoryHints.set(`prob_${p.slug}`, list);
  }
}

export class HintRepository {
  static async getProblemHints(problemId: string, userId: string, contestId: string) {
    let hints: Hint[] = [];
    try {
      hints = await prisma.hint.findMany({
        where: { problemId },
        orderBy: { order: "asc" }
      });
    } catch (databaseError) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw databaseError;
      // Fallback
    }

    if (!hints || hints.length === 0) {
      hints = inMemoryHints.get(problemId) || [];
    }

    // Get purchased receipts
    let receipts: HintReceipt[] = [];
    try {
      receipts = await prisma.hintReceipt.findMany({
        where: { userId, contestId, problemId }
      });
    } catch (databaseError) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw databaseError;
      // Fallback
    }

    const purchasedHintIds = new Set(receipts.map((r) => r.hintId));

    const totalHintPenalty = receipts.reduce((sum, receipt) => sum + receipt.deductionApplied, 0);
    const formattedHints = hints.map((h) => {
      const isUnlocked = purchasedHintIds.has(h.id);
      if (isUnlocked) {
        return {
          id: h.id,
          order: h.order,
          deductionPoints: h.deductionPoints,
          status: "UNLOCKED" as const,
          content: h.content
        };
      }
      return {
        id: h.id,
        order: h.order,
        deductionPoints: h.deductionPoints,
        status: "LOCKED" as const
        // Content strictly omitted when locked!
      };
    });

    return {
      hints: formattedHints,
      totalHintPenalty
    };
  }

  static async findHintById(hintId: string): Promise<Hint | null> {
    try {
      const hint = await prisma.hint.findUnique({
        where: { id: hintId }
      });
      if (hint) return hint;
    } catch (databaseError) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw databaseError;
      // Fallback
    }

    for (const list of inMemoryHints.values()) {
      const found = list.find((h) => h.id === hintId);
      if (found) return found;
    }
    return null;
  }

  static async unlockHint(
    userId: string,
    contestId: string,
    problemId: string,
    hintId: string,
    operationId: string,
    expectedRevision: number
  ): Promise<{ hint: Hint; deductionApplied: number; replayed: boolean }> {
    try {
      return await prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM problems WHERE id = ${problemId} FOR UPDATE`;
        const available = await tx.problem.findFirst({
          where: { AND: [visibleProblem(), { id: problemId, revision: expectedRevision }] },
          select: { id: true }
        });
        if (!available) throw new AppError(409, ERROR_CODES.VALIDATION_ERROR, "Question or round changed. Refresh before unlocking.");
        const hint = await tx.hint.findFirst({ where: { id: hintId, problemId } });
        if (!hint) throw new AppError(404, ERROR_CODES.RESOURCE_NOT_FOUND, "Hint not found.");
        const operation = await tx.hintReceipt.findUnique({ where: { operationId } });
        if (operation && (operation.userId !== userId || operation.contestId !== contestId ||
            operation.problemId !== problemId || operation.hintId !== hintId)) {
          throw new AppError(409, ERROR_CODES.VALIDATION_ERROR, "Operation ID belongs to a different hint purchase.");
        }
        const purchased = operation ?? await tx.hintReceipt.findFirst({ where: { contestId, userId, problemId, hintId } });
        if (purchased) return { hint, deductionApplied: 0, replayed: true };
        await tx.hintReceipt.create({ data: { operationId, contestId, userId, problemId, hintId,
          deductionApplied: hint.deductionPoints } });
        return { hint, deductionApplied: hint.deductionPoints, replayed: false };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError(409, ERROR_CODES.VALIDATION_ERROR, "Operation ID belongs to a different hint purchase.");
      }
      throw error;
    }
  }

  static async getTotalHintPenaltiesForUser(userId: string, contestId: string): Promise<number> {
    const receipts = await this.getUserHintReceipts(userId, contestId);
    return receipts.reduce((sum, r) => sum + r.deductionApplied, 0);
  }

  static async getUserHintReceipts(userId: string, contestId: string): Promise<HintReceipt[]> {
    return prisma.hintReceipt.findMany({ where: { userId, contestId } });
  }
}
