// ==============================================================================
// CODE GRAND PRIX 2026 — CONTEST REPOSITORY
// ==============================================================================

import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { Contest, ContestStatus } from "@prisma/client";

const defaultContest: Contest = {
  id: env.CONTEST_ID,
  title: "Code Grand Prix 2026",
  status: env.CONTEST_STATUS as ContestStatus,
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
      // Fallback
    }
    return defaultContest;
  }

  static calculateTimeDetails(contest: Contest) {
    const now = new Date();
    const serverTime = now.toISOString();
    const endsAt = contest.endsAt.toISOString();
    const startsAt = contest.startsAt.toISOString();

    const remainingMs = Math.max(0, contest.endsAt.getTime() - now.getTime());
    let status = contest.status;

    // Check if contest has naturally finished
    if (status === ContestStatus.LIVE && remainingMs === 0) {
      status = ContestStatus.ENDED;
    }

    return {
      status,
      startsAt,
      endsAt,
      serverTime,
      remainingMs,
      timerPolicy: {
        type: "GLOBAL_AUTHORITATIVE",
        syncIntervalMs: 15000,
        submissionAllowedDuringLock: false,
        compensatoryTimeAllowed: true
      }
    };
  }
}
