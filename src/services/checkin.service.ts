// ==============================================================================
// CODE GRAND PRIX 2026 — CHECK-IN & SESSION SERVICE
// ==============================================================================

import { CheckinStatus, ContestStatus, RaceSessionStatus } from "@prisma/client";
import { env } from "../config/env.js";
import { ContestRepository } from "../repositories/contest.repository.js";
import { SessionRepository } from "../repositories/session.repository.js";

export interface CheckinPayload {
  rulesAccepted: boolean;
  cameraPermission: boolean;
  fullscreenRequested: boolean;
}

export class CheckinService {
  /**
   * Process pre-race checkin
   */
  static async checkin(userId: string, contestId: string, payload: CheckinPayload) {
    const reasons: string[] = [];

    if (!payload.rulesAccepted) {
      reasons.push("Competition regulations and integrity rules must be accepted.");
    }
    if (!payload.cameraPermission) {
      reasons.push("Camera permission must be granted for proctoring checks.");
    }
    if (!payload.fullscreenRequested) {
      reasons.push("Fullscreen arena mode is required to enter the competition.");
    }

    const contest = await ContestRepository.getContest(contestId);
    const timeDetails = ContestRepository.calculateTimeDetails(contest);

    const isReady = reasons.length === 0;
    const checkinStatus: CheckinStatus = isReady ? CheckinStatus.READY : CheckinStatus.BLOCKED;

    // Transition race session state
    let sessionStatus: RaceSessionStatus;
    if (!isReady) {
      sessionStatus = RaceSessionStatus.WAITING;
    } else if (timeDetails.status === ContestStatus.LIVE) {
      sessionStatus = RaceSessionStatus.ACTIVE;
    } else {
      sessionStatus = RaceSessionStatus.WAITING;
    }

    const updatedSession = await SessionRepository.updateCheckin(userId, contestId, {
      rulesAccepted: payload.rulesAccepted,
      cameraPermission: payload.cameraPermission,
      fullscreenRequested: payload.fullscreenRequested,
      checkinStatus,
      status: sessionStatus
    });

    return {
      status: isReady ? "ready" : "blocked",
      checkinStatus: updatedSession.checkinStatus,
      sessionStatus: updatedSession.status,
      reasons,
      session: {
        status: updatedSession.status,
        lockReason: updatedSession.lockReason,
        rulesAccepted: updatedSession.rulesAccepted,
        cameraPermission: updatedSession.cameraPermission,
        fullscreenRequested: updatedSession.fullscreenRequested
      },
      serverTime: timeDetails.serverTime,
      remainingMs: timeDetails.remainingMs
    };
  }

  /**
   * Get authoritative session status
   */
  static async getSession(userId: string, contestId: string = env.CONTEST_ID) {
    const contest = await ContestRepository.getContest(contestId);
    const timeDetails = ContestRepository.calculateTimeDetails(contest);
    const session = await SessionRepository.findOrCreate(userId, contestId);

    return {
      contestStatus: timeDetails.status,
      sessionStatus: session.status,
      checkinStatus: session.checkinStatus,
      lockReason: session.lockReason,
      lockedAt: session.lockedAt ? session.lockedAt.toISOString() : null,
      serverTime: timeDetails.serverTime,
      timeRemainingMs: timeDetails.remainingMs
    };
  }
}
