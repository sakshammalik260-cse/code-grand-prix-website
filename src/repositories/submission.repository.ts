import { visibleProblem } from "../services/round.service.js";
import { AppError } from "../middleware/error.middleware.js";
import { ERROR_CODES } from "../constants/index.js";
import { env } from "../config/env.js";
// ==============================================================================
// CODE GRAND PRIX 2026 — SUBMISSION REPOSITORY
// ==============================================================================

import { prisma } from "../config/database.js";
import { Submission, SubmissionStatus, Verdict } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const inMemorySubmissions: Map<string, Submission> = new Map();

export interface CreateSubmissionInput {
  userId: string;
  problemId: string;
  languageId: string;
  sourceCode: string;
}

export class SubmissionRepository {
  static async create(input: CreateSubmissionInput, expectedRevision: number, sessionId: string): Promise<Submission> {
    const id = `sub_${uuidv4()}`;
    const newSubmission: Submission = {
      id,
      userId: input.userId,
      problemId: input.problemId,
      languageId: input.languageId,
      sourceCode: input.sourceCode,
      status: SubmissionStatus.QUEUED,
      verdict: Verdict.QUEUED,
      score: 0,
      passedTests: 0,
      totalTests: 0,
      runtimeMs: null,
      memoryKb: null,
      message: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM sessions WHERE id = ${sessionId} AND "userId" = ${input.userId} FOR SHARE`;
      const session = await tx.session.findFirst({ where: { id: sessionId, userId: input.userId },
        select: { status: true, checkinStatus: true } });
      if (!session || !["ACTIVE", "RESUME_AUTHORIZED"].includes(session.status)) {
        throw new AppError(403, ERROR_CODES.SESSION_LOCKED, "Session is no longer active.");
      }
      if (session.checkinStatus !== "READY") {
        throw new AppError(403, ERROR_CODES.CHECKIN_INCOMPLETE, "Pre-race check-in is incomplete.");
      }
      await tx.$queryRaw`SELECT id FROM problems WHERE id = ${input.problemId} FOR UPDATE`;
      const available = await tx.problem.findFirst({ where: {
        AND: [visibleProblem(), { id: input.problemId, revision: expectedRevision }]
      }, select: { id: true } });
      if (!available) throw new AppError(409, ERROR_CODES.VALIDATION_ERROR, "Question or round changed. Refresh before submitting.");
      return tx.submission.create({ data: newSubmission });
    });
  }

  static async updateVerdict(
    id: string,
    data: {
      status: SubmissionStatus;
      verdict: Verdict;
      score: number;
      passedTests: number;
      totalTests: number;
      runtimeMs?: number;
      memoryKb?: number;
      message?: string;
    }
  ): Promise<Submission | null> {
    try {
      const updated = await prisma.submission.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });
      return updated;
    } catch (databaseError) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw databaseError;
      const existing = inMemorySubmissions.get(id);
      if (!existing) return null;
      const updated: Submission = {
        ...existing,
        ...data,
        runtimeMs: data.runtimeMs ?? null,
        memoryKb: data.memoryKb ?? null,
        message: data.message ?? null,
        updatedAt: new Date()
      };
      inMemorySubmissions.set(id, updated);
      return updated;
    }
  }

  static async findById(id: string): Promise<Submission | null> {
    try {
      const found = await prisma.submission.findUnique({
        where: { id }
      });
      if (found) return found;
    } catch (databaseError) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw databaseError;
      // In-memory fallback
    }
    return inMemorySubmissions.get(id) || null;
  }

  static async findByProblemAndUser(problemId: string, userId: string): Promise<Submission[]> {
    try {
      const submissions = await prisma.submission.findMany({
        where: { problemId, userId },
        orderBy: { createdAt: "desc" }
      });
      if (submissions && submissions.length > 0) return submissions;
    } catch (databaseError) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw databaseError;
      // Fallback
    }

    return Array.from(inMemorySubmissions.values())
      .filter((s) => s.problemId === problemId && s.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  static async findAllSolvedByUser(userId: string): Promise<Submission[]> {
    try {
      const submissions = await prisma.submission.findMany({
        where: { userId, verdict: Verdict.ACCEPTED }
      });
      if (submissions && submissions.length > 0) return submissions;
    } catch (databaseError) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw databaseError;
      // Fallback
    }

    return Array.from(inMemorySubmissions.values()).filter(
      (s) => s.userId === userId && s.verdict === Verdict.ACCEPTED
    );
  }

  static async findAllByUser(userId: string): Promise<Submission[]> {
    try {
      const submissions = await prisma.submission.findMany({
        where: { userId }
      });
      if (submissions && submissions.length > 0) return submissions;
    } catch (databaseError) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw databaseError;
      // Fallback
    }

    return Array.from(inMemorySubmissions.values()).filter(
      (s) => s.userId === userId
    );
  }
}
