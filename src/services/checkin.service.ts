import { prisma } from "../config/database.js";
// ==============================================================================
// CODE GRAND PRIX 2026 — CHECK-IN & SESSION SERVICE
// ==============================================================================

import { CheckinStatus, RaceSessionStatus } from "@prisma/client";
import { env } from "../config/env.js";
import { RoundService } from "./round.service.js";
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

    const timeDetails = await RoundService.clock(contestId);

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
    const timeDetails = await RoundService.clock(contestId);
    let session = await SessionRepository.findOrCreate(userId, contestId);
    if (timeDetails.status === "LIVE" && session.status === "WAITING" && session.checkinStatus === "READY") {
      await prisma.session.updateMany({
        where: { id: session.id, status: "WAITING", checkinStatus: "READY" },
        data: { status: "ACTIVE", revision: { increment: 1 } }
      });
      session = await SessionRepository.findOrCreate(userId, contestId);
    }
    const user = await UserRepository.findById(userId);

    const incidents = await IncidentRepository.findBySessionId(session.id);
    const latestIncident = incidents[0] || null;
    let lastAuthorization: { id: string; volunteerId: string; incidentId: string | null; createdAt: Date; volunteer: { role: string } } | null = null;
    if (session.status === RaceSessionStatus.ACTIVE || session.status === RaceSessionStatus.RESUME_AUTHORIZED) {
      try {
        lastAuthorization = await prisma.auditLog.findFirst({
          where: { sessionId: session.id, action: "AUTHORIZE_RESUME" },
          orderBy: { createdAt: "desc" },
          select: { id: true, volunteerId: true, incidentId: true, createdAt: true,
            volunteer: { select: { role: true } } }
        });
      } catch (error) {
        if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw error;
      }
    }

    const coverage = lastAuthorization ? await prisma.incident.findMany({
      where: { sessionId: session.id, blocking: true, resolvedAt: lastAuthorization.createdAt,
        resolvedBy: lastAuthorization.volunteerId, resolutionAction: "AUTHORIZE_RESUME" },
      select: { id: true }, orderBy: { id: "asc" }
    }) : [];
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
        contestId: timeDetails.id,
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
              contestId: timeDetails.id,
              driverId,
              sessionId: session.id,
              type: latestIncident.type,
              observedAt: latestIncident.occurredAt.toISOString(),
              problemId: latestIncident.problemId,
              reviewStatus: latestIncident.status,
              blocking: latestIncident.blocking,
              timestamp: latestIncident.receivedAt.toISOString(),
              simulation: false
            }
          : null,
        resumeAuthorization: lastAuthorization ? {
          id: lastAuthorization.id,
          incidentId: lastAuthorization.incidentId || "session_bulk",
          ...(coverage.length && lastAuthorization.incidentId ? { sessionId: session.id, coveredIncidentIds: coverage.map(item => item.id) } : {}),
          decision: "AUTHORIZE_RESUME",
          actorId: lastAuthorization.volunteerId,
          actorRole: lastAuthorization.volunteer.role === "ADMIN" ? "ADMIN" : "VOLUNTEER",
          decidedAt: lastAuthorization.createdAt.toISOString(),
          simulation: false
        } : null,
        volunteerNotified: false,
        simulation: false
      },
      serverTime: timeDetails.serverTime,
      // Backward compatibility fields
      contestStatus: timeDetails.status,
      sessionStatus: session.status,
      checkinStatus: session.checkinStatus,
      lockReason: session.lockReason,
      lastSeenAt: session.lastSeenAt.toISOString(),
      cameraStatus: session.cameraStatus,
      lockCount: session.lockCount,
      lockedAt: session.lockedAt ? session.lockedAt.toISOString() : null,
      timeRemainingMs: timeDetails.remainingMs
    };
  }
}
