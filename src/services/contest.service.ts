// ==============================================================================
// CODE GRAND PRIX 2026 — CONTEST CLOCK & STATUS SERVICE
// ==============================================================================

import { env } from "../config/env.js";
import { ContestRepository } from "../repositories/contest.repository.js";

export class ContestService {
  /**
   * Get server-authoritative contest clock and status
   */
  static async getContestClock(contestId: string = env.CONTEST_ID) {
    const contest = await ContestRepository.getContest(contestId);
    const timeDetails = ContestRepository.calculateTimeDetails(contest);

    return {
      id: contest.id,
      title: contest.title,
      status: timeDetails.status,
      startsAt: timeDetails.startsAt,
      endsAt: timeDetails.endsAt,
      serverTime: timeDetails.serverTime,
      remainingMs: timeDetails.remainingMs,
      timerPolicy: timeDetails.timerPolicy
    };
  }
}
