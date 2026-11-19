// ==============================================================================
// CODE GRAND PRIX 2026 — ADMIN & QUESTION MANAGEMENT SERVICE
// ==============================================================================

import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { Difficulty, ProblemStatus } from "@prisma/client";
import { ProblemRepository } from "../repositories/problem.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { IncidentRepository } from "../repositories/incident.repository.js";
import { ContestRepository } from "../repositories/contest.repository.js";
import { v4 as uuidv4 } from "uuid";

export interface CreateAdminProblemInput {
  title: string;
  difficulty: "Easy" | "Medium" | "Hard" | Difficulty;
  points: number;
  statement: string | string[];
  inputFormat: string | string[];
  outputFormat: string;
  constraints: string | string[];
  samples?: Array<{ id?: string; input: string; output: string; explanation?: string }>;
  timeLimitMs?: number;
  memoryLimitMb?: number;
  allowedLanguages?: string[];
  roundId?: string;
}

export class AdminService {
  static async getOverview() {
    let totalQuestions = 0;
    let draftQuestions = 0;
    let publishedQuestions = 0;

    try {
      totalQuestions = await prisma.problem.count();
      draftQuestions = await prisma.problem.count({ where: { status: ProblemStatus.DRAFT } });
      publishedQuestions = await prisma.problem.count({ where: { status: ProblemStatus.PUBLISHED } });
    } catch {
      const publicProblems = await ProblemRepository.findAllPublic();
      totalQuestions = publicProblems.length;
      publishedQuestions = publicProblems.length;
      draftQuestions = 0;
    }

    const participants = await UserRepository.findAllParticipants();
    const incidents = await IncidentRepository.findAll();
    const contest = await ContestRepository.getContest(env.CONTEST_ID);
    const timeDetails = ContestRepository.calculateTimeDetails(contest);

    return {
      // Frontend Handoff Page 10 Contract
      totalQuestions,
      draftQuestions,
      publishedQuestions,
      competitionStatus: timeDetails.status,
      participants: participants.length,
      activeRounds: [
        {
          id: contest.id,
          name: contest.title,
          round: timeDetails.round,
          status: timeDetails.status,
          contestStartTime: timeDetails.contestStartTime,
          contestEndTime: timeDetails.contestEndTime
        }
      ],
      // Backwards-compatible fields
      totalProblems: totalQuestions,
      totalParticipants: participants.length,
      totalIncidents: incidents.length,
      openIncidents: incidents.filter((i) => i.status === "OPEN").length,
      contestId: contest.id,
      contestStatus: timeDetails.status
    };
  }

  static async listProblems() {
    try {
      const problems = await prisma.problem.findMany({
        orderBy: { order: "asc" },
        include: { testCases: true, hints: true }
      });
      if (problems && problems.length > 0) return problems;
    } catch {
      // Fallback
    }

    const publicList = await ProblemRepository.findAllPublic();
    return publicList.map((p) => ({
      ...p,
      revision: 1,
      status: ProblemStatus.PUBLISHED,
      testCasesCount: 4
    }));
  }

  static async createProblem(input: CreateAdminProblemInput) {
    const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const diffUpper = input.difficulty.toUpperCase() as Difficulty;

    const statementStr = Array.isArray(input.statement) ? input.statement.join("\n\n") : input.statement;
    const inputFormatStr = Array.isArray(input.inputFormat) ? input.inputFormat.join("\n") : input.inputFormat;
    const constraintsStr = Array.isArray(input.constraints) ? input.constraints.join("\n") : input.constraints;

    const id = `prob_${uuidv4()}`;

    try {
      const created = await prisma.problem.create({
        data: {
          id,
          contestId: env.CONTEST_ID,
          slug,
          title: input.title,
          difficulty: diffUpper,
          points: input.points,
          statement: statementStr,
          inputFormat: inputFormatStr,
          outputFormat: input.outputFormat,
          constraints: constraintsStr,
          timeLimitMs: input.timeLimitMs || 2000,
          memoryLimitMb: input.memoryLimitMb || 256,
          allowedLanguages: input.allowedLanguages || ["python", "javascript", "cpp", "java"],
          status: ProblemStatus.DRAFT,
          revision: 1
        }
      });

      // Add samples if present
      if (input.samples && input.samples.length > 0) {
        for (let i = 0; i < input.samples.length; i++) {
          const s = input.samples[i];
          await prisma.testCase.create({
            data: {
              problemId: created.id,
              input: s.input,
              expectedOutput: s.output,
              isPublic: true,
              explanation: s.explanation || null,
              order: i + 1
            }
          });
        }
      }

      return created;
    } catch {
      // In-memory mock response for admin problem creation
      return {
        id,
        contestId: env.CONTEST_ID,
        slug,
        title: input.title,
        difficulty: diffUpper,
        points: input.points,
        status: ProblemStatus.DRAFT,
        revision: 1
      };
    }
  }

  static async publishProblem(id: string) {
    try {
      const updated = await prisma.problem.update({
        where: { id },
        data: { status: ProblemStatus.PUBLISHED, revision: { increment: 1 } }
      });
      return updated;
    } catch {
      return { id, status: ProblemStatus.PUBLISHED, revision: 2 };
    }
  }

  static async unpublishProblem(id: string) {
    try {
      const updated = await prisma.problem.update({
        where: { id },
        data: { status: ProblemStatus.DRAFT, revision: { increment: 1 } }
      });
      return updated;
    } catch {
      return { id, status: ProblemStatus.DRAFT, revision: 2 };
    }
  }

  static async addTestCase(
    problemId: string,
    input: { input: string; expectedOutput: string; visibility?: string; isPublic?: boolean }
  ) {
    const isPublic = input.visibility === "PUBLIC" || input.isPublic === true;
    try {
      const created = await prisma.testCase.create({
        data: {
          problemId,
          input: input.input,
          expectedOutput: input.expectedOutput,
          isPublic
        }
      });
      return created;
    } catch {
      return {
        id: `tc_${uuidv4()}`,
        problemId,
        input: input.input,
        expectedOutput: input.expectedOutput,
        isPublic
      };
    }
  }
}
