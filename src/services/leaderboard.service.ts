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

function normalizeProblemId(id: string): string {
  return id ? id.replace(/^prob_/, "").toLowerCase() : "";
}

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
      const userReceipts = await HintRepository.getUserHintReceipts(p.id, contest.id);

      let totalScore = 0;
      let problemsSolved = 0;
      const totalHintPenalties = userReceipts.reduce((sum, r) => sum + r.deductionApplied, 0);

      // C12: Count each problem at most once (no duplicate point multiplication)
      // C13: Deduct hint penalties per-solved-problem: awarded = max(0, points - problemHintDeductions).
      // Unsolved problems award 0 and their hint penalties do not deduct from other solved problems!
      for (const prob of problems) {
        const isSolved = solvedSubmissions.some(
          (s) =>
            normalizeProblemId(s.problemId) === normalizeProblemId(prob.id) ||
            normalizeProblemId(s.problemId) === normalizeProblemId(prob.slug)
        );
        if (isSolved) {
          problemsSolved += 1;
          const problemHintDeductions = userReceipts
            .filter(
              (r) =>
                normalizeProblemId(r.problemId) === normalizeProblemId(prob.id) ||
                normalizeProblemId(r.problemId) === normalizeProblemId(prob.slug)
            )
            .reduce((sum, r) => sum + r.deductionApplied, 0);

          const awarded = Math.max(0, prob.points - problemHintDeductions);
          totalScore += awarded;
        }
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
    const contest = await ContestRepository.getContest(contestId);
    const problems = await ProblemRepository.findAllPublic();
    const totalProblems = problems.length;

    const solvedSubmissions = await SubmissionRepository.findAllSolvedByUser(userId);
    const allUserSubmissions = await SubmissionRepository.findAllByUser(userId);
    const userReceipts = await HintRepository.getUserHintReceipts(userId, contest.id);

    let currentScore = 0;
    const solvedProblemIds: string[] = [];

    for (const prob of problems) {
      const isSolved = solvedSubmissions.some(
        (s) =>
          normalizeProblemId(s.problemId) === normalizeProblemId(prob.id) ||
          normalizeProblemId(s.problemId) === normalizeProblemId(prob.slug)
      );
      if (isSolved) {
        solvedProblemIds.push(prob.slug);
        const problemHintDeductions = userReceipts
          .filter(
            (r) =>
              normalizeProblemId(r.problemId) === normalizeProblemId(prob.id) ||
              normalizeProblemId(r.problemId) === normalizeProblemId(prob.slug)
          )
          .reduce((sum, r) => sum + r.deductionApplied, 0);

        currentScore += Math.max(0, prob.points - problemHintDeductions);
      }
    }

    const attemptedProblemIds = Array.from(
      new Set(allUserSubmissions.map((s) => s.problemId))
    );

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
