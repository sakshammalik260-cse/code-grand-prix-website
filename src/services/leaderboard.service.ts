import { RoundService } from "./round.service.js";
import { prisma } from "../config/database.js";
// ==============================================================================
// CODE GRAND PRIX 2026 — LEADERBOARD & PROGRESS SERVICE
// ==============================================================================

import { env } from "../config/env.js";
import { ContestRepository } from "../repositories/contest.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { SubmissionRepository } from "../repositories/submission.repository.js";
import { ProblemRepository } from "../repositories/problem.repository.js";
import { HintRepository } from "../repositories/hint.repository.js";
import { SessionRepository } from "../repositories/session.repository.js";
import { Role, Verdict } from "@prisma/client";

function scoresByProblem(
  solved: ReadonlyArray<{ problemId: string; score: number }>,
  receipts: ReadonlyArray<{ problemId: string; deductionApplied: number }>
) {
  const bestScores = new Map<string, number>();
  const deductions = new Map<string, number>();
  for (const { problemId, score } of solved) {
    bestScores.set(problemId, Math.max(bestScores.get(problemId) ?? 0, score));
  }
  for (const { problemId, deductionApplied } of receipts) {
    deductions.set(problemId, (deductions.get(problemId) ?? 0) + deductionApplied);
  }
  for (const [problemId, bestScore] of bestScores) {
    bestScores.set(problemId, Math.max(0, bestScore - (deductions.get(problemId) ?? 0)));
  }
  return bestScores;
}

export class LeaderboardService {
  static async getVisibility() {
    const contest = await ContestRepository.getContest(env.CONTEST_ID);
    return { visible: (await RoundService.clock(contest.id)).resultsVisible };
  }

  static async getContestVisibility() {
    const contest = await ContestRepository.getContest(env.CONTEST_ID);
    return { visible: contest.resultsVisible };
  }

  static async setVisibility(visible: boolean) {
    const contest = await prisma.contest.update({
      where: { id: env.CONTEST_ID }, data: { resultsVisible: visible }
    });
    return { visible: contest.resultsVisible };
  }

  /**
   * Get official authoritative leaderboard
   */
  static async getLeaderboard(userRole: Role) {
    const contest = await ContestRepository.getContest(env.CONTEST_ID);
    const clock = await RoundService.clock(contest.id);
    const visible = clock.resultsVisible || userRole === Role.ADMIN;
    if (!visible) {
      return {
        contestId: contest.id,
        contestTitle: contest.title,
        status: clock.status,
        visible: false,
        simulation: false,
        updatedAt: new Date().toISOString(),
        rows: []
      };
    }

    const problems = await ProblemRepository.findAllScoring();
    const totalProblems = problems.length;
    const participants = await UserRepository.findAllParticipants();
    const rows = [];

    for (const p of participants) {
      const session = await SessionRepository.findOrCreate(p.id, contest.id);
      const solvedSubmissions = await SubmissionRepository.findAllSolvedByUser(p.id);
      const userReceipts = await HintRepository.getUserHintReceipts(p.id, contest.id);

      const scores = scoresByProblem(solvedSubmissions, userReceipts);
      let totalScore = 0;
      let problemsSolved = 0;
      const totalHintPenalties = userReceipts.reduce((sum, r) => sum + r.deductionApplied, 0);

      for (const problem of problems) {
        const awarded = scores.get(problem.id);
        if (awarded === undefined) continue;
        problemsSolved += 1;
        totalScore += awarded;
      }

      rows.push({
        driverId: p.driverId,
        displayName: p.displayName,
        team: p.team || "CPC Grid",
        problemsSolved,
        totalProblems,
        totalScore,
        totalHintPenalties,
        status: session.status
      });
    }

    // Sort: 1) Score DESC, 2) Solved count DESC, 3) DriverId ASC
    rows.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.problemsSolved !== a.problemsSolved) return b.problemsSolved - a.problemsSolved;
      return a.driverId.localeCompare(b.driverId);
    });

    const rankedRows = rows.map((r, index) => ({
      rank: index + 1,
      ...r
    }));

    return {
      contestId: contest.id,
      contestTitle: contest.title,
      status: clock.status,
      visible,
      simulation: false,
      updatedAt: new Date().toISOString(),
      rows: rankedRows
    };
  }

  /**
   * Get candidate's personal progress
   */
  static async getProgress(userId: string, driverId: string, contestId: string = env.CONTEST_ID) {
    const contest = await ContestRepository.getContest(contestId);
    const problems = await ProblemRepository.findAllScoring();
    const totalProblems = problems.length;

    const allUserSubmissions = await SubmissionRepository.findAllByUser(userId);
    const userReceipts = await HintRepository.getUserHintReceipts(userId, contest.id);
    const scores = scoresByProblem(allUserSubmissions.filter(submission => submission.verdict === Verdict.ACCEPTED), userReceipts);

    let currentScore = 0;
    const solvedProblemIds: string[] = [];

    for (const problem of problems) {
      const awarded = scores.get(problem.id);
      if (awarded === undefined) continue;
      solvedProblemIds.push(problem.slug);
      currentScore += awarded;
    }

    const slugsById = new Map(problems.map(problem => [problem.id, problem.slug]));
    const attemptSlugs = allUserSubmissions.map(submission => slugsById.get(submission.problemId));
    const attemptedProblemIds = [...new Set(attemptSlugs.filter(slug => slug !== undefined))];

    return {
      contestId: contest.id,
      driverId,
      totalProblems,
      attemptedProblemIds,
      solvedProblemIds,
      currentScore,
      simulation: false
    };
  }
}
