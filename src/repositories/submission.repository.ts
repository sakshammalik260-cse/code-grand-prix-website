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
  static async create(input: CreateSubmissionInput): Promise<Submission> {
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

    try {
      const created = await prisma.submission.create({
        data: newSubmission
      });
      return created;
    } catch {
      inMemorySubmissions.set(id, newSubmission);
      return newSubmission;
    }
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
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
      // Fallback
    }

    return Array.from(inMemorySubmissions.values()).filter(
      (s) => s.userId === userId && s.verdict === Verdict.ACCEPTED
    );
  }
}
