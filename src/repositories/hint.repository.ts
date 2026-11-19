// ==============================================================================
// CODE GRAND PRIX 2026 — HINT REPOSITORY
// ==============================================================================

import { prisma } from "../config/database.js";
import { SEED_DATA } from "../data/seed-data.js";
import { Hint, HintReceipt } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const inMemoryHints: Map<string, Hint[]> = new Map();
const inMemoryReceipts: Map<string, HintReceipt> = new Map();

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

function getReceiptKey(contestId: string, userId: string, problemId: string, hintId: string): string {
  return `${contestId}:${userId}:${problemId}:${hintId}`;
}

export class HintRepository {
  static async getProblemHints(problemId: string, userId: string, contestId: string) {
    let hints: Hint[] = [];
    try {
      hints = await prisma.hint.findMany({
        where: { problemId },
        orderBy: { order: "asc" }
      });
    } catch {
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
    } catch {
      // Fallback
    }

    if (!receipts || receipts.length === 0) {
      receipts = Array.from(inMemoryReceipts.values()).filter(
        (r) => r.userId === userId && r.contestId === contestId && r.problemId === problemId
      );
    }

    const purchasedHintIds = new Set(receipts.map((r) => r.hintId));

    let totalHintPenalty = 0;
    const formattedHints = hints.map((h) => {
      const isUnlocked = purchasedHintIds.has(h.id);
      if (isUnlocked) {
        totalHintPenalty += h.deductionPoints;
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
    } catch {
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
    operationId: string
  ): Promise<{ hint: Hint; deductionApplied: number; replayed: boolean }> {
    const hint = await this.findHintById(hintId);
    if (!hint) {
      throw new Error(`Hint '${hintId}' does not exist.`);
    }

    const receiptKey = getReceiptKey(contestId, userId, problemId, hintId);

    // 1. Check existing receipt for idempotency
    try {
      const existing = await prisma.hintReceipt.findFirst({
        where: {
          OR: [
            { operationId },
            { contestId, userId, problemId, hintId }
          ]
        }
      });
      if (existing) {
        return { hint, deductionApplied: 0, replayed: true };
      }
    } catch {
      // In-memory check
      if (inMemoryReceipts.has(receiptKey) || Array.from(inMemoryReceipts.values()).some((r) => r.operationId === operationId)) {
        return { hint, deductionApplied: 0, replayed: true };
      }
    }

    // 2. Create receipt
    const receipt: HintReceipt = {
      id: `rcpt_${uuidv4()}`,
      operationId,
      contestId,
      userId,
      problemId,
      hintId,
      deductionApplied: hint.deductionPoints,
      createdAt: new Date()
    };

    try {
      await prisma.hintReceipt.create({ data: receipt });
    } catch {
      inMemoryReceipts.set(receiptKey, receipt);
    }

    return { hint, deductionApplied: hint.deductionPoints, replayed: false };
  }

  static async getTotalHintPenaltiesForUser(userId: string, contestId: string): Promise<number> {
    const receipts = await this.getUserHintReceipts(userId, contestId);
    return receipts.reduce((sum, r) => sum + r.deductionApplied, 0);
  }

  static async getUserHintReceipts(userId: string, contestId: string): Promise<HintReceipt[]> {
    try {
      const receipts = await prisma.hintReceipt.findMany({
        where: { userId, contestId }
      });
      if (receipts && receipts.length > 0) return receipts;
    } catch {
      // Fallback
    }

    return Array.from(inMemoryReceipts.values()).filter(
      (r) => r.userId === userId && r.contestId === contestId
    );
  }
}
