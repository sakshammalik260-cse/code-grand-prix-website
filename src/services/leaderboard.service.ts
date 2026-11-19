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
import { Role } from "@prisma/client";

let isResultsVisible = true;

export class LeaderboardService {
  static getVisibility() {
    return { visible: isResultsVisible };
  }

  static setVisibility(visible: boolean) {
    isResultsVisible = visible;
    return { visible: isResultsVisible };
  }

  /**
   * Get official authoritative leaderboard
   */
  static async getLeaderboard(userRole?: Role | string) {
    const contest = await ContestRepository.getContest(env.CONTEST_ID);
    const problems = await ProblemRepository.findAllPublic();
    const totalProblems = problems.length;

    const isPrivileged =
      userRole === Role.ADMIN ||
      userRole === Role.VOLUNTEER ||
      userRole?.toString().toUpperCase() === "ADMIN" ||
      userRole?.toString().toUpperCase() === "VOLUNTEER";

    // If candidate and results are withheld by organizer
    if (!isResultsVisible && !isPrivileged) {
      return {
        contestId: contest.id,
        contestTitle: contest.title,
        status: contest.status,
        visible: false,
        simulation: false,
        updatedAt: new Date().toISOString(),
        rows: []
      };
    }

    const participants = await UserRepository.findAllParticipants();
    const rows = [];

    for (const p of participants) {
      const session = await SessionRepository.findOrCreate(p.id, contest.id);
      const solvedSubmissions = await SubmissionRepository.findAllSolvedByUser(p.id);

      // Unique solved problem IDs
      const solvedProblemIds = new Set(solvedSubmissions.map((s) => s.problemId));
      const problemsSolved = solvedProblemIds.size;

      const rawScore = solvedSubmissions.reduce((sum, s) => sum + s.score, 0);
      const totalHintPenalties = await HintRepository.getTotalHintPenaltiesForUser(p.id, contest.id);

      const totalScore = Math.max(0, rawScore - totalHintPenalties);

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
      status: contest.status,
      visible: isResultsVisible,
      simulation: false,
      updatedAt: new Date().toISOString(),
      rows: rankedRows
    };
  }

  /**
   * Get candidate's personal progress
   */
  static async getProgress(userId: string, driverId: string, contestId: string = env.CONTEST_ID) {
    const problems = await ProblemRepository.findAllPublic();
    const totalProblems = problems.length;

    const solvedSubmissions = await SubmissionRepository.findAllSolvedByUser(userId);
    const solvedProblemIds = Array.from(new Set(solvedSubmissions.map((s) => s.problemId)));

    const rawScore = solvedSubmissions.reduce((sum, s) => sum + s.score, 0);
    const totalHintPenalties = await HintRepository.getTotalHintPenaltiesForUser(userId, contestId);
    const currentScore = Math.max(0, rawScore - totalHintPenalties);

    return {
      contestId,
      driverId,
      totalProblems,
      attemptedProblemIds: solvedProblemIds,
      solvedProblemIds,
      currentScore,
      simulation: false
    };
  }
}
