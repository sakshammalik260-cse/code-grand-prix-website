// ==============================================================================
// CODE GRAND PRIX 2026 — VIOLATION & INCIDENT SERVICE
// ==============================================================================

import { env } from "../config/env.js";
import { IncidentRepository } from "../repositories/incident.repository.js";
import { SessionRepository } from "../repositories/session.repository.js";
import { ContestRepository } from "../repositories/contest.repository.js";
import { IncidentAction, IncidentType } from "@prisma/client";

export interface ReportViolationInput {
  clientEventId?: string;
  eventId?: string;
  contestId?: string;
  driverId?: string;
  sessionId?: string;
  type: string;
  observedAt?: string;
  occurredAt?: string;
  problemId?: string | null;
  details?: unknown;
}

export class ViolationService {
  /**
   * Helper to normalize incident types across frontend versions
   */
  private static normalizeIncidentType(rawType: string): IncidentType {
    const t = rawType.toUpperCase();
    if (t === "TAB_HIDDEN") return IncidentType.TAB_HIDDEN;
    if (t === "WINDOW_BLUR" || t === "WINDOW_FOCUS_LOST") return IncidentType.WINDOW_FOCUS_LOST;
    if (t === "FULLSCREEN_EXIT") return IncidentType.FULLSCREEN_EXIT;
    if (t === "CAMERA_TRACK_ENDED" || t === "CAMERA_INTERRUPTED") return IncidentType.CAMERA_INTERRUPTED;
    if (t === "CAMERA_PERMISSION_DENIED") return IncidentType.CAMERA_PERMISSION_DENIED;
    if (t === "NETWORK_RECONNECT") return IncidentType.NETWORK_RECONNECT;
    return IncidentType.TAB_HIDDEN;
  }

  /**
   * Report a violation from the frontend monitoring system
   */
  static async reportViolation(userId: string, input: ReportViolationInput) {
    const eventId = input.clientEventId || input.eventId || `event_${Date.now()}`;
    const contestId = input.contestId || env.CONTEST_ID;
    const type = this.normalizeIncidentType(input.type);
    const occurredAt = new Date(input.observedAt || input.occurredAt || Date.now());

    // 1. Deduplication Check
    const existing = await IncidentRepository.findByEventId(eventId);
    const session = await SessionRepository.findOrCreate(userId, contestId);

    if (existing) {
      return {
        incidentId: existing.id,
        incident: {
          id: existing.id,
          clientEventId: existing.eventId,
          sessionId: existing.sessionId,
          type: existing.type,
          reviewStatus: existing.status,
          blocking: existing.blocking,
          timestamp: existing.receivedAt.toISOString(),
          simulation: false
        },
        session: {
          id: session.id,
          driverId: input.driverId,
          status: session.status,
          revision: session.revision,
          policy: SessionRepository.getPolicy(session.status)
        },
        accepted: true,
        action: existing.action,
        sessionStatus: session.status,
        duplicate: true
      };
    }

    // 2. Policy Decision: LOCK vs LOG_ONLY
    const isCritical =
      type === IncidentType.TAB_HIDDEN ||
      type === IncidentType.FULLSCREEN_EXIT ||
      type === IncidentType.CAMERA_INTERRUPTED ||
      type === IncidentType.CAMERA_TRACK_ENDED;

    const action = isCritical ? IncidentAction.LOCK : IncidentAction.LOG_ONLY;

    let updatedSession = session;
    if (action === IncidentAction.LOCK) {
      updatedSession = await SessionRepository.lockSession(
        userId,
        contestId,
        `Integrity alert: ${type} detected during active competition.`
      );
    }

    // 3. Create Incident Record
    const incident = await IncidentRepository.create({
      eventId,
      userId,
      sessionId: session.id,
      problemId: input.problemId || null,
      type,
      action,
      blocking: isCritical,
      occurredAt,
      details: typeof input.details === "object" ? JSON.stringify(input.details) : input.details?.toString()
    });

    const contest = await ContestRepository.getContest(contestId);
    const timeDetails = ContestRepository.calculateTimeDetails(contest);

    return {
      incidentId: incident.id,
      incident: {
        id: incident.id,
        clientEventId: incident.eventId,
        sessionId: incident.sessionId,
        type: incident.type,
        reviewStatus: incident.status,
        blocking: incident.blocking,
        timestamp: incident.receivedAt.toISOString(),
        simulation: false
      },
      session: {
        id: updatedSession.id,
        driverId: input.driverId,
        status: updatedSession.status,
        revision: updatedSession.revision,
        policy: SessionRepository.getPolicy(updatedSession.status),
        updatedAt: updatedSession.updatedAt.toISOString(),
        serverTime: timeDetails.serverTime
      },
      accepted: true,
      action,
      sessionStatus: updatedSession.status
    };
  }
}
