// ==============================================================================
// CODE GRAND PRIX 2026 — CHECK-IN & SESSION SERVICE
// ==============================================================================

import { CheckinStatus, RaceSessionStatus } from "@prisma/client";
import { env } from "../config/env.js";
import { ContestRepository } from "../repositories/contest.repository.js";
import { SessionRepository } from "../repositories/session.repository.js";
import { IncidentRepository } from "../repositories/incident.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { AppError } from "../middleware/error.middleware.js";
import { ERROR_CODES } from "../constants/index.js";

export interface CheckinPayload {
  rulesAccepted: boolean;
  cameraPermission: boolean;
  fullscreenRequested: boolean;
}

export class CheckinService {
  /**
   * Process pre-race checkin.
   * C04 Fix: Re-check-in CANNOT unlock a LOCKED, LOCK_PENDING, or UNDER_REVIEW session!
   */
  static async checkin(userId: string, contestId: string, payload: CheckinPayload) {
    const existingSession = await SessionRepository.findOrCreate(userId, contestId);

    // C04 Fix: Strictly preserve existing locks
    const isLocked =
      existingSession.status === RaceSessionStatus.LOCKED ||
      existingSession.status === RaceSessionStatus.LOCK_PENDING ||
      existingSession.status === RaceSessionStatus.UNDER_REVIEW;

    if (isLocked) {
      throw new AppError(
        403,
        ERROR_CODES.SESSION_LOCKED,
        `Cannot re-check in: Your session is ${existingSession.status} due to: ${
          existingSession.lockReason || "an integrity alert"
        }. A volunteer must authorize your resume.`
      );
    }

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

    // Transition race session state only if not locked
    let sessionStatus: RaceSessionStatus;
    if (!isReady) {
      sessionStatus = RaceSessionStatus.WAITING;
    } else if (timeDetails.status === "LIVE") {
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

    const user = await UserRepository.findById(userId);
    const viewer = user
      ? {
          id: user.id,
          driverId: user.driverId,
          displayName: user.displayName,
          role: user.role
        }
      : null;

    return {
      viewer,
      status: isReady ? "ready" : "blocked",
      checkinStatus: updatedSession.checkinStatus,
      sessionStatus: updatedSession.status,
      reasons,
      session: {
        id: updatedSession.id,
        driverId: userId,
        status: updatedSession.status,
        revision: updatedSession.revision,
        lockReason: updatedSession.lockReason,
        rulesAccepted: updatedSession.rulesAccepted,
        cameraPermission: updatedSession.cameraPermission,
        fullscreenRequested: updatedSession.fullscreenRequested,
        policy: SessionRepository.getPolicy(updatedSession.status),
        updatedAt: updatedSession.updatedAt.toISOString()
      },
      serverTime: timeDetails.serverTime,
      remainingMs: timeDetails.remainingMs
    };
  }

  /**
   * Get authoritative session status matching Frontend SessionEnvelope (Page 9 & 14)
   */
  static async getSession(userId: string, contestId: string = env.CONTEST_ID) {
    const contest = await ContestRepository.getContest(contestId);
    const timeDetails = ContestRepository.calculateTimeDetails(contest);
    const session = await SessionRepository.findOrCreate(userId, contestId);
    const user = await UserRepository.findById(userId);

    const incidents = await IncidentRepository.findBySessionId(session.id);
    const latestIncident = incidents[0] || null;

    const driverId = user?.driverId || userId;
    const role = user?.role === "ADMIN" ? "ADMIN" : user?.role === "VOLUNTEER" ? "VOLUNTEER" : "CANDIDATE";

    // Frontend SessionEnvelope structure
    return {
      viewer: {
        id: driverId,
        role,
        simulation: false
      },
      session: {
        id: session.id,
        contestId: contest.id,
        driverId,
        status: session.status,
        revision: session.revision,
        updatedAt: session.updatedAt.toISOString(),
        serverTime: timeDetails.serverTime,
        policy: SessionRepository.getPolicy(session.status),
        latestIncident: latestIncident
          ? {
              id: latestIncident.id,
              clientEventId: latestIncident.eventId,
              sessionId: session.id,
              type: latestIncident.type,
              reviewStatus: latestIncident.status,
              blocking: latestIncident.blocking,
              timestamp: latestIncident.receivedAt.toISOString(),
              simulation: false
            }
          : null,
        resumeAuthorization: null,
        volunteerNotified: false,
        simulation: false
      },
      serverTime: timeDetails.serverTime,
      // Backward compatibility fields
      contestStatus: timeDetails.status,
      sessionStatus: session.status,
      checkinStatus: session.checkinStatus,
      lockReason: session.lockReason,
      lockedAt: session.lockedAt ? session.lockedAt.toISOString() : null,
      timeRemainingMs: timeDetails.remainingMs
    };
  }
}
