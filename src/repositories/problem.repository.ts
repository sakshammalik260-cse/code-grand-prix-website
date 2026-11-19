// ==============================================================================
// CODE GRAND PRIX 2026 — PROBLEM REPOSITORY
// ==============================================================================

import { prisma } from "../config/database.js";
import { SEED_DATA } from "../data/seed-data.js";
import { Difficulty, ProblemStatus } from "@prisma/client";
import { env } from "../config/env.js";

export type FrontendDifficulty = "Easy" | "Medium" | "Hard";

export interface CandidateProblemSummary {
  id: string;
  slug: string;
  number: number;
  title: string;
  difficulty: FrontendDifficulty;
  points: number;
  allowedLanguages: string[];
}

export interface CandidatePublicSample {
  id: string;
  input: string;
  output: string;
  expectedOutput?: string;
  explanation: string;
}

export interface CandidateFullProblem {
  id: string;
  slug: string;
  number: number;
  title: string;
  difficulty: FrontendDifficulty;
  points: number;
  allowedLanguages: string[];
  statement: string[];
  inputFormat: string[];
  outputFormat: string;
  constraints: string[];
  samples: CandidatePublicSample[];
  timeLimitMs: number;
  memoryLimitMb: number;
  expectedTimeComplexity?: string;
  expectedSpaceComplexity?: string;
}

export interface InternalProblemWithTests {
  id: string;
  slug: string;
  title: string;
  status: ProblemStatus;
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

function toFrontendDifficulty(d: Difficulty | string): FrontendDifficulty {
  const upper = d.toUpperCase();
  if (upper === "EASY") return "Easy";
  if (upper === "HARD") return "Hard";
  return "Medium";
}

function toStringArray(val: string | string[]): string[] {
  if (Array.isArray(val)) return val;
  if (!val) return [];
  // Split on paragraph or newline
  return val.split(/\n\n+/).filter((s) => s.trim().length > 0);
}

export class ProblemRepository {
  /**
   * C08 Fix: Candidate problems query.
   * If DB returns 0 items, returns []. Never serves development seeds in production!
   */
  static async findAllPublic(): Promise<CandidateProblemSummary[]> {
    let dbSuccess = false;
    try {
      const problems = await prisma.problem.findMany({
        where: { status: ProblemStatus.PUBLISHED },
        orderBy: { order: "asc" },
        select: {
          id: true,
          slug: true,
          order: true,
          title: true,
          difficulty: true,
          points: true,
          allowedLanguages: true
        }
      });
      dbSuccess = true;
      if (problems) {
        return problems.map((p) => ({
          id: p.slug,
          slug: p.slug,
          number: p.order,
          title: p.title,
          difficulty: toFrontendDifficulty(p.difficulty),
          points: p.points,
          allowedLanguages: p.allowedLanguages
        }));
      }
    } catch (error) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) {
        throw new Error(`Database error while fetching published problems: ${(error as Error).message}`);
      }
    }

    // Only fallback if DB query failed AND dev fallback explicitly allowed
    if (!dbSuccess && env.ALLOW_DEV_FALLBACK) {
      return SEED_DATA.problems.map((p, idx) => ({
        id: p.slug,
        slug: p.slug,
        number: p.order || idx + 1,
        title: p.title,
        difficulty: toFrontendDifficulty(p.difficulty),
        points: p.points,
        allowedLanguages: p.allowedLanguages
      }));
    }

    return [];
  }

  /**
   * C07 & Frontend DTO Fix: Candidate full problem view.
   * Strictly public fields only, matching Page 14 DTO.
   */
  static async findByIdPublic(idOrSlug: string): Promise<CandidateFullProblem | null> {
    try {
      const problem = await prisma.problem.findFirst({
        where: {
          OR: [{ id: idOrSlug }, { slug: idOrSlug }],
          status: ProblemStatus.PUBLISHED
        },
        include: {
          testCases: {
            where: { isPublic: true },
            orderBy: { order: "asc" }
          }
        }
      });

      if (problem) {
        return {
          id: problem.slug,
          slug: problem.slug,
          number: problem.order,
          title: problem.title,
          difficulty: toFrontendDifficulty(problem.difficulty),
          points: problem.points,
          allowedLanguages: problem.allowedLanguages,
          statement: toStringArray(problem.statement),
          inputFormat: toStringArray(problem.inputFormat),
          outputFormat: problem.outputFormat,
          constraints: toStringArray(problem.constraints),
          timeLimitMs: problem.timeLimitMs,
          memoryLimitMb: problem.memoryLimitMb,
          expectedTimeComplexity: problem.expectedTimeComplexity || "O(n)",
          expectedSpaceComplexity: problem.expectedSpaceComplexity || "O(1)",
          samples: problem.testCases.map((tc, idx) => ({
            id: tc.id || `s${idx + 1}`,
            input: tc.input,
            output: tc.expectedOutput,
            expectedOutput: tc.expectedOutput,
            explanation: tc.explanation || ""
          }))
        };
      }
    } catch (error) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) {
        throw new Error(`Database error fetching problem: ${(error as Error).message}`);
      }
    }

    if (env.ALLOW_DEV_FALLBACK) {
      const found = SEED_DATA.problems.find(
        (p) => p.slug === idOrSlug || `prob_${p.slug}` === idOrSlug
      );
      if (!found) return null;

      return {
        id: found.slug,
        slug: found.slug,
        number: found.order,
        title: found.title,
        difficulty: toFrontendDifficulty(found.difficulty),
        points: found.points,
        allowedLanguages: found.allowedLanguages,
        statement: toStringArray(found.statement),
        inputFormat: toStringArray(found.inputFormat),
        outputFormat: found.outputFormat,
        constraints: toStringArray(found.constraints),
        timeLimitMs: found.timeLimitMs,
        memoryLimitMb: found.memoryLimitMb,
        expectedTimeComplexity: "O(n)",
        expectedSpaceComplexity: "O(1)",
        samples: found.testCases
          .filter((tc) => tc.isPublic)
          .map((tc, idx) => ({
            id: `s${idx + 1}`,
            input: tc.input,
            output: tc.expectedOutput,
            expectedOutput: tc.expectedOutput,
            explanation: tc.explanation || ""
          }))
      };
    }

    return null;
  }

  /**
   * Internal lookup for Judge Service ONLY.
   * C07 Fix: Checks PUBLISHED status if requirePublished=true (for candidates).
   */
  static async findByIdWithAllTests(
    idOrSlug: string,
    requirePublished: boolean = true
  ): Promise<InternalProblemWithTests | null> {
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
        // C07 Fix: Reject unpublished problems for candidate execution
        if (requirePublished && problem.status !== ProblemStatus.PUBLISHED) {
          return null;
        }

        return {
          id: problem.id,
          slug: problem.slug,
          title: problem.title,
          status: problem.status,
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
    } catch (error) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) {
        throw new Error(`Database error fetching problem tests: ${(error as Error).message}`);
      }
    }

    if (env.ALLOW_DEV_FALLBACK) {
      const found = SEED_DATA.problems.find(
        (p) => p.slug === idOrSlug || `prob_${p.slug}` === idOrSlug
      );
      if (!found) return null;

      return {
        id: `prob_${found.slug}`,
        slug: found.slug,
        title: found.title,
        status: ProblemStatus.PUBLISHED,
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

    return null;
  }
}
