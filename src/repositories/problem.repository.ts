// ==============================================================================
// CODE GRAND PRIX 2026 — PROBLEM REPOSITORY
// ==============================================================================

import { prisma } from "../config/database.js";
import { SEED_DATA } from "../data/seed-data.js";
import { Difficulty, ProblemStatus } from "@prisma/client";

export interface PublicProblemSummary {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  points: number;
  status: ProblemStatus;
  order: number;
  availability: "AVAILABLE" | "LOCKED";
}

export interface PublicProblemDetail {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  points: number;
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  allowedLanguages: string[];
  examples: Array<{
    id?: string;
    input: string;
    expectedOutput: string;
    explanation?: string | null;
  }>;
}

export interface InternalProblemWithTests {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  points: number;
  timeLimitMs: number;
  memoryLimitMb: number;
  allowedLanguages: string[];
  testCases: Array<{
    id: string;
    input: string;
    expectedOutput: string;
    isPublic: boolean;
    explanation?: string | null;
    order: number;
  }>;
}

export class ProblemRepository {
  static async findAllPublic(): Promise<PublicProblemSummary[]> {
    try {
      const problems = await prisma.problem.findMany({
        where: { status: ProblemStatus.PUBLISHED },
        orderBy: { order: "asc" },
        select: {
          id: true,
          slug: true,
          title: true,
          difficulty: true,
          points: true,
          status: true,
          order: true
        }
      });
      if (problems && problems.length > 0) {
        return problems.map((p) => ({
          ...p,
          availability: "AVAILABLE"
        }));
      }
    } catch {
      // Fallback
    }

    return SEED_DATA.problems.map((p, idx) => ({
      id: `prob_${p.slug}`,
      slug: p.slug,
      title: p.title,
      difficulty: p.difficulty,
      points: p.points,
      status: ProblemStatus.PUBLISHED,
      order: p.order,
      availability: "AVAILABLE"
    }));
  }

  static async findByIdPublic(idOrSlug: string): Promise<PublicProblemDetail | null> {
    try {
      const problem = await prisma.problem.findFirst({
        where: {
          OR: [{ id: idOrSlug }, { slug: idOrSlug }],
          status: ProblemStatus.PUBLISHED
        },
        include: {
          testCases: {
            where: { isPublic: true }, // Strictly public tests only!
            orderBy: { order: "asc" }
          }
        }
      });

      if (problem) {
        return {
          id: problem.id,
          slug: problem.slug,
          title: problem.title,
          difficulty: problem.difficulty,
          points: problem.points,
          statement: problem.statement,
          inputFormat: problem.inputFormat,
          outputFormat: problem.outputFormat,
          constraints: problem.constraints,
          timeLimitMs: problem.timeLimitMs,
          memoryLimitMb: problem.memoryLimitMb,
          allowedLanguages: problem.allowedLanguages,
          examples: problem.testCases.map((tc, idx) => ({
            id: tc.id || `sample_${idx + 1}`,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            explanation: tc.explanation
          }))
        };
      }
    } catch {
      // Fallback
    }

    const found = SEED_DATA.problems.find(
      (p) => p.slug === idOrSlug || `prob_${p.slug}` === idOrSlug
    );
    if (!found) return null;

    return {
      id: `prob_${found.slug}`,
      slug: found.slug,
      title: found.title,
      difficulty: found.difficulty,
      points: found.points,
      statement: found.statement,
      inputFormat: found.inputFormat,
      outputFormat: found.outputFormat,
      constraints: found.constraints,
      timeLimitMs: found.timeLimitMs,
      memoryLimitMb: found.memoryLimitMb,
      allowedLanguages: found.allowedLanguages,
      examples: found.testCases
        .filter((tc) => tc.isPublic)
        .map((tc, idx) => ({
          id: `sample_${idx + 1}`,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          explanation: tc.explanation
        }))
    };
  }

  /**
   * Internal method for Judge Worker ONLY: includes private hidden tests.
   * NEVER call this from public API endpoints!
   */
  static async findByIdWithAllTests(idOrSlug: string): Promise<InternalProblemWithTests | null> {
    try {
      const problem = await prisma.problem.findFirst({
        where: {
          OR: [{ id: idOrSlug }, { slug: idOrSlug }]
        },
        include: {
          testCases: {
            orderBy: { order: "asc" }
          }
        }
      });

      if (problem) {
        return {
          id: problem.id,
          slug: problem.slug,
          title: problem.title,
          difficulty: problem.difficulty,
          points: problem.points,
          timeLimitMs: problem.timeLimitMs,
          memoryLimitMb: problem.memoryLimitMb,
          allowedLanguages: problem.allowedLanguages,
          testCases: problem.testCases.map((tc, idx) => ({
            id: tc.id || `tc_${idx + 1}`,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isPublic: tc.isPublic,
            explanation: tc.explanation,
            order: tc.order
          }))
        };
      }
    } catch {
      // Fallback
    }

    const found = SEED_DATA.problems.find(
      (p) => p.slug === idOrSlug || `prob_${p.slug}` === idOrSlug
    );
    if (!found) return null;

    return {
      id: `prob_${found.slug}`,
      slug: found.slug,
      title: found.title,
      difficulty: found.difficulty,
      points: found.points,
      timeLimitMs: found.timeLimitMs,
      memoryLimitMb: found.memoryLimitMb,
      allowedLanguages: found.allowedLanguages,
      testCases: found.testCases.map((tc, idx) => ({
        id: `tc_${idx + 1}`,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isPublic: tc.isPublic,
        explanation: tc.explanation,
        order: idx + 1
      }))
    };
  }
}
