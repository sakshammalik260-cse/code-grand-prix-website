// ==============================================================================
// CODE GRAND PRIX 2026 — VOLUNTEER & RACE CONTROL SERVICE
// ==============================================================================

import { v4 as uuidv4 } from "uuid";
import { ERROR_CODES } from "../constants/index.js";
import { AppError } from "../middleware/error.middleware.js";
import { IncidentRepository } from "../repositories/incident.repository.js";
import { SessionRepository } from "../repositories/session.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { SubmissionRepository } from "../repositories/submission.repository.js";
import { env } from "../config/env.js";

export class VolunteerService {
  /**
   * List participants with live competition session status, score, and lock details
   */
  static async listParticipants() {
    const participants = await UserRepository.findAllParticipants();
    const result = [];

    for (const p of participants) {
      const session = await SessionRepository.findOrCreate(p.id, env.CONTEST_ID);
      const solvedSubmissions = await SubmissionRepository.findAllSolvedByUser(p.id);
      const score = solvedSubmissions.reduce((sum, s) => sum + s.score, 0);

      result.push({
        id: session.id,
        driverId: p.driverId,
        displayName: p.displayName,
        team: p.team || "CPC Grid",
        raceStatus: session.status,
        status: session.status,
        score,
        lastSeenAt: session.lastSeenAt.toISOString(),
        cameraStatus: session.cameraStatus,
        lockCount: session.lockCount,
        lockReason: session.lockReason,
        revision: session.revision,
        policy: SessionRepository.getPolicy(session.status),
        simulation: false
      });
    }

    return result;
  }

  /**
   * List reported incidents
   */
  static async listIncidents() {
    const incidents = await IncidentRepository.findAll();
    return incidents.map((inc) => ({
      id: inc.id,
      clientEventId: inc.eventId,
      sessionId: inc.sessionId,
      type: inc.type,
      reviewStatus: inc.status,
      status: inc.status,
      blocking: inc.blocking,
      detectedAt: inc.occurredAt.toISOString(),
      timestamp: inc.receivedAt.toISOString(),
      details: inc.details,
      resolvedAt: inc.resolvedAt?.toISOString() || null,
      resolvedBy: inc.resolvedBy || null,
      simulation: false
    }));
  }

  /**
   * Get single incident by ID
   */
  static async getIncidentById(id: string) {
    const inc = await IncidentRepository.findById(id);
    if (!inc) {
      throw new AppError(404, ERROR_CODES.RESOURCE_NOT_FOUND, `Incident '${id}' not found.`);
    }

    return {
      id: inc.id,
      clientEventId: inc.eventId,
      sessionId: inc.sessionId,
      type: inc.type,
      reviewStatus: inc.status,
      status: inc.status,
      blocking: inc.blocking,
      detectedAt: inc.occurredAt.toISOString(),
      timestamp: inc.receivedAt.toISOString(),
      details: inc.details,
      resolvedAt: inc.resolvedAt?.toISOString() || null,
      resolvedBy: inc.resolvedBy || null
    };
  }

  /**
   * Resolve an individual incident
   */
  static async resolveIncident(
    incidentId: string,
    action: string,
    reason: string,
    volunteerId: string
  ) {
    const incident = await IncidentRepository.findById(incidentId);
    if (!incident) {
      throw new AppError(404, ERROR_CODES.RESOURCE_NOT_FOUND, `Incident '${incidentId}' not found.`);
    }

    const resolved = await IncidentRepository.resolve(incidentId, action, reason, volunteerId);

    // If approved to resume, resume session
    let updatedSession = null;
    if (action === "APPROVE_RESUME" || action === "AUTHORIZE_RESUME") {
      updatedSession = await SessionRepository.resumeSession(incident.userId, env.CONTEST_ID);
    }

    await IncidentRepository.createAuditLog(volunteerId, action, reason, {
      incidentId,
      participantId: incident.userId,
      sessionId: incident.sessionId
    });

    return {
      success: true,
      incident: resolved,
      session: updatedSession
    };
  }

  /**
   * One-Action Atomic Bulk Session Recovery (As specified in handoff Page 9 & 12)
   */
  static async authorizeResume(
    sessionId: string,
    volunteerId: string,
    input: {
      decision: string;
      expectedSessionRevision?: number;
      note: string;
      idempotencyKey?: string;
    }
  ) {
    const session = await SessionRepository.findById(sessionId);
    if (!session) {
      throw new AppError(404, ERROR_CODES.RESOURCE_NOT_FOUND, `Session '${sessionId}' not found.`);
    }

    // Monotonic revision check
    if (
      input.expectedSessionRevision !== undefined &&
      session.revision > input.expectedSessionRevision
    ) {
      throw new AppError(
        409,
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        `Stale session revision: Session has revision ${session.revision}, expected ${input.expectedSessionRevision}.`
      );
    }

    // 1. Bulk resolve all open incidents for this session
    const resolvedIncidents = await IncidentRepository.bulkResolveForSession(
      sessionId,
      input.decision,
      input.note,
      volunteerId
    );

    // 2. Unlock session and set status back to ACTIVE
    const updatedSession = await SessionRepository.authorizeResumeById(sessionId);

    // 3. Create single signed approval audit record
    await IncidentRepository.createAuditLog(volunteerId, input.decision, input.note, {
      sessionId,
      participantId: session.userId,
      previousState: session.status,
      newState: "ACTIVE"
    });

    const latestIncident = resolvedIncidents[0] || null;

    return {
      incident: latestIncident
        ? {
            id: latestIncident.id,
            clientEventId: latestIncident.eventId,
            sessionId: latestIncident.sessionId,
            type: latestIncident.type,
            reviewStatus: latestIncident.status,
            blocking: latestIncident.blocking,
            timestamp: latestIncident.receivedAt.toISOString(),
            simulation: false
          }
        : null,
      session: updatedSession
        ? {
            id: updatedSession.id,
            driverId: session.userId,
            status: updatedSession.status,
            revision: updatedSession.revision,
            policy: SessionRepository.getPolicy(updatedSession.status),
            updatedAt: updatedSession.updatedAt.toISOString()
          }
        : null,
      authorization: {
        id: `auth_${uuidv4()}`,
        incidentId: latestIncident?.id || "session_bulk",
        decision: input.decision,
        actorId: volunteerId,
        actorRole: "VOLUNTEER",
        decidedAt: new Date().toISOString(),
        simulation: false
      }
    };
  }
}
