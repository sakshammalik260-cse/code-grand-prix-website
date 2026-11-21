// ==============================================================================
// CODE GRAND PRIX 2026 — PROBLEM REPOSITORY
// ==============================================================================

import { visibleProblem } from "../services/round.service.js";
import { prisma } from "../config/database.js";
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
  revision: number;
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
  /** Internal scoring lookup. Never send database IDs to candidate-facing problem DTOs. */
  static async findAllScoring(): Promise<Array<{id: string; slug: string; points: number}>> {
    return prisma.problem.findMany({
      where: { contestId: env.CONTEST_ID, OR: [visibleProblem(), { submissions: { some: {} } }] },
      select: { id: true, slug: true, points: true }
    });
  }
  /**
   * C08 Fix: Candidate problems query.
   * If DB returns 0 items, returns []. Never serves development seeds in production!
   */
  static async findAllPublic(): Promise<CandidateProblemSummary[]> {
    const problems = await prisma.problem.findMany({
      where: visibleProblem(),
      orderBy: [{ order: "asc" }, { id: "asc" }],
      select: { slug: true, order: true, title: true, difficulty: true, points: true, allowedLanguages: true }
    });
    return problems.map(p => ({
      id: p.slug, slug: p.slug, number: p.order, title: p.title,
      difficulty: toFrontendDifficulty(p.difficulty), points: p.points, allowedLanguages: p.allowedLanguages
    }));
  }

  /**
   * C07 & Frontend DTO Fix: Candidate full problem view.
   * Strictly public fields only, matching Page 14 DTO.
   */
  static async findByIdPublic(idOrSlug: string): Promise<CandidateFullProblem | null> {
    const problem = await prisma.problem.findFirst({
      where: {
        AND: [visibleProblem(), { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }]
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
    const problem = await prisma.problem.findFirst({
      where: {
        AND: [requirePublished ? visibleProblem() : { contestId: env.CONTEST_ID }, { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }]
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
        revision: problem.revision,
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
    return null;
  }
}
