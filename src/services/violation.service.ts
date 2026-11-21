import { CheckinService } from "./checkin.service.js";
import { UserRepository } from "../repositories/user.repository.js";
// ==============================================================================
// CODE GRAND PRIX 2026 — VIOLATION & INCIDENT SERVICE
// ==============================================================================

import { env } from "../config/env.js";
import { IncidentRepository } from "../repositories/incident.repository.js";
import { SessionRepository } from "../repositories/session.repository.js";
import { IncidentAction, IncidentType, RaceSessionStatus } from "@prisma/client";

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

  static async reportViolation(userId: string, input: ReportViolationInput) {
    const eventId = input.clientEventId || input.eventId || `event_${Date.now()}`;
    const contestId = input.contestId || env.CONTEST_ID;
    const type = this.normalizeIncidentType(input.type);
    const occurredAt = new Date(input.observedAt || input.occurredAt || Date.now());

    // 1. Deduplication Check
    const existing = await IncidentRepository.findByEventId(eventId);
    const session = await SessionRepository.findOrCreate(userId, contestId);
    const user = await UserRepository.findById(userId);
    if (!user) throw new Error("Authenticated participant not found.");
    const trustedDriverId = user.driverId;
    if (existing && (existing.userId !== userId || existing.sessionId !== session.id)) {
      throw new Error("Incident idempotency key belongs to a different candidate session.");
    }

    if (existing) {
      return {
        incidentId: existing.id,
        incident: {
          id: existing.id,
          clientEventId: existing.eventId,
          contestId,
          driverId: trustedDriverId,
          sessionId: existing.sessionId,
          observedAt: existing.occurredAt.toISOString(),
          problemId: existing.problemId,
          type: existing.type,
          reviewStatus: existing.status,
          status: existing.status,
          blocking: existing.blocking,
          timestamp: existing.receivedAt.toISOString(),
          simulation: false
        },
        session: (await CheckinService.getSession(userId, contestId)).session,
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

    let action = isCritical ? IncidentAction.LOCK : IncidentAction.LOG_ONLY;

    let updatedSession = session;

    // C17 Fix: Suppress redundant lock state transition if session is already locked
    const alreadyLocked =
      session.status === RaceSessionStatus.LOCKED ||
      session.status === RaceSessionStatus.LOCK_PENDING ||
      session.status === RaceSessionStatus.UNDER_REVIEW;

    // Subsequent observations in one lock episode remain audit events, not new blockers.
    if (alreadyLocked && isCritical) action = IncidentAction.LOG_ONLY;
    if (action === IncidentAction.LOCK && !alreadyLocked) {
      // First critical event in this episode -> locks session and increments lockCount
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
      blocking: action === IncidentAction.LOCK,
      occurredAt,
      details: typeof input.details === "object" ? JSON.stringify(input.details) : input.details?.toString()
    });

    return {
      incidentId: incident.id,
      incident: {
        id: incident.id,
        clientEventId: incident.eventId,
        contestId,
        driverId: trustedDriverId,
        sessionId: incident.sessionId,
        observedAt: incident.occurredAt.toISOString(),
        problemId: incident.problemId,
        type: incident.type,
        reviewStatus: incident.status,
        status: incident.status,
        blocking: incident.blocking,
        timestamp: incident.receivedAt.toISOString(),
        simulation: false
      },
      session: (await CheckinService.getSession(userId, contestId)).session,
      accepted: true,
      action,
      sessionStatus: updatedSession.status
    };
  }
}
