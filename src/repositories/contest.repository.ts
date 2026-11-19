// ==============================================================================
// CODE GRAND PRIX 2026 — CONTEST REPOSITORY
// ==============================================================================

import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { Contest, ContestStatus } from "@prisma/client";

const defaultContest: Contest = {
  id: env.CONTEST_ID,
  title: "Code Grand Prix 2026",
  status: ContestStatus.LIVE,
  resultsVisible: true,
  startsAt: new Date(env.CONTEST_START_TIME),
  endsAt: new Date(env.CONTEST_END_TIME),
  createdAt: new Date(),
  updatedAt: new Date()
};

export class ContestRepository {
  static async getContest(id: string = env.CONTEST_ID): Promise<Contest> {
    try {
      const contest = await prisma.contest.findUnique({
        where: { id }
      });
      if (contest) return contest;
    } catch {
      if (env.NODE_ENV === "production" && !env.ALLOW_DEV_FALLBACK) {
        throw new Error("Database unavailable while fetching contest state.");
      }
    }
    return defaultContest;
  }

  static calculateTimeDetails(contest: Contest) {
    const now = new Date();
    const serverTime = now.toISOString();
    const startsAt = contest.startsAt.toISOString();
    const endsAt = contest.endsAt.toISOString();

    const nowTime = now.getTime();
    const startTime = contest.startsAt.getTime();
    const endTime = contest.endsAt.getTime();

    let status: "WAITING" | "LIVE" | "PAUSED_BY_ORGANIZER" | "FINISHED";

    // C06 Fix: Authoritative schedule check
    if (contest.status === ContestStatus.PAUSED || contest.status === ContestStatus.PAUSED_BY_ORGANIZER) {
      status = "PAUSED_BY_ORGANIZER";
    } else if (nowTime < startTime) {
      status = "WAITING";
    } else if (nowTime >= endTime) {
      status = "FINISHED";
    } else {
      status = "LIVE";
    }

    const remainingMs = Math.max(0, endTime - nowTime);

    return {
      id: contest.id,
      title: contest.title,
      round: env.CONTEST_ROUND_NAME,
      status,
      // Frontend contract field names (Page 9 & 14)
      contestStartTime: startsAt,
      contestEndTime: endsAt,
      serverTime,
      remainingMs,
      simulation: false,
      // Backend contract compatibility
      startsAt,
      endsAt,
      resultsVisible: contest.resultsVisible,
      timerPolicy: {
        type: "GLOBAL_AUTHORITATIVE",
        syncIntervalMs: 15000,
        submissionAllowedDuringLock: false,
        compensatoryTimeAllowed: true
      }
    };
  }
}
