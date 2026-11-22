import { LeaderboardService } from "./leaderboard.service.js";
import { prisma } from "../config/database.js";
import type { Incident } from "@prisma/client";
import { CheckinService } from "./checkin.service.js";
import { Prisma, RaceSessionStatus, IncidentStatus, Role } from "@prisma/client";
// ==============================================================================
// CODE GRAND PRIX 2026 — VOLUNTEER & RACE CONTROL SERVICE
// ==============================================================================

import { ERROR_CODES } from "../constants/index.js";
import { AppError } from "../middleware/error.middleware.js";
import { IncidentRepository } from "../repositories/incident.repository.js";
import { SessionRepository } from "../repositories/session.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { env } from "../config/env.js";

export class VolunteerService {

  /**
   * List participants with live competition session status, score, and lock details
   */
  static async listParticipants(role: Role) {
    const participants = await UserRepository.findAllParticipants();
    const standings = await LeaderboardService.getLeaderboard(role);
    const scoreByDriver = new Map(standings.rows.map(row => [row.driverId, row.totalScore]));
    const result = [];

    for (const p of participants) {
      const { session, lockReason, lastSeenAt, cameraStatus, lockCount } = await CheckinService.getSession(p.id, env.CONTEST_ID);
      const score = scoreByDriver.get(p.driverId);

      result.push({
        ...session,
        displayName: p.displayName,
        team: p.team || "CPC Grid",
        raceStatus: session.status,
        ...(score === undefined ? {} : { score }),
        lastSeenAt, cameraStatus, lockCount, lockReason
      });
    }

    return result;
  }

  /**
   * List reported incidents
   */
  static async listIncidents() {
    const incidents = await prisma.incident.findMany({
      where: { session: { contestId: env.CONTEST_ID } },
      include: { user: { select: { driverId: true } } },
      orderBy: { receivedAt: "desc" }
    });
    return incidents.map(item => incidentDto(item, env.CONTEST_ID, item.user.driverId));
  }

  static async getIncidentById(id: string) {
    const incident = await prisma.incident.findFirst({
      where: { id, session: { contestId: env.CONTEST_ID } },
      include: { user: { select: { driverId: true } } }
    });
    if (!incident) throw new AppError(404, ERROR_CODES.RESOURCE_NOT_FOUND, "Incident not found.");
    return incidentDto(incident, env.CONTEST_ID, incident.user.driverId);
  }

  /**
   * Resolve an individual incident
   */
  static async resolveIncident(
    incidentId: string,
    action: string,
    reason: string,
    volunteerId: string,
    expectedSessionRevision?: number
  ) {
    if (expectedSessionRevision !== undefined) {
      return prisma.$transaction(async tx => {
        const incident = await tx.incident.findFirst({
          where: { id: incidentId, session: { contestId: env.CONTEST_ID } },
          include: { session: true, user: { select: { driverId: true } } }
        });
        if (!incident) throw new AppError(404, ERROR_CODES.RESOURCE_NOT_FOUND, "Incident not found.");
        if (incident.session.revision !== expectedSessionRevision || incident.status !== IncidentStatus.OPEN) {
          throw new AppError(409, ERROR_CODES.VALIDATION_ERROR, "Incident or session changed; refresh Race Control.");
        }
        if (!["KEEP_LOCKED", "ESCALATE"].includes(action)) {
          throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, "Use session authorization to clear blocking incidents.");
        }
        const resolved = await tx.incident.update({ where: { id: incidentId }, data: {
          status: IncidentStatus.RESOLVED, resolvedAt: new Date(), resolvedBy: volunteerId,
          resolutionAction: action, resolutionReason: reason
        } });
        await tx.auditLog.create({ data: { volunteerId, action, reason, incidentId,
          participantId: incident.userId, sessionId: incident.sessionId } });
        return { success: true, incident: incidentDto(resolved, env.CONTEST_ID, incident.user.driverId), session: null };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }).catch(handleConcurrentReview);
    }
    const incident = await IncidentRepository.findById(incidentId);
    if (!incident) {
      throw new AppError(404, ERROR_CODES.RESOURCE_NOT_FOUND, `Incident '${incidentId}' not found.`);
    }

    const resolved = await IncidentRepository.resolve(incidentId, action, reason, volunteerId);

    // Individual reviews only record a decision. They cannot bypass unresolved
    // incidents; use the atomic AUTHORIZE & RESUME SESSION action to unlock.
    const updatedSession = null;

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
      contestId?: string;
      driverId?: string;
      expectedIncidentIds?: string[];
      expectedSessionRevision?: number;
      note: string;
      idempotencyKey?: string;
    }
  ) {
    if (input.decision !== "AUTHORIZE_RESUME" && input.decision !== "APPROVE_RESUME") {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, "Unsupported race-control decision.");
    }
    if (!input.idempotencyKey || !input.idempotencyKey.trim() ||
        !Number.isInteger(input.expectedSessionRevision) || !input.expectedSessionRevision) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR,
        "A non-empty idempotencyKey and expectedSessionRevision are required.");
    }
    const operationId = input.idempotencyKey;
    const response = await prisma.$transaction(async (tx) => {
      const staff = await tx.user.findUnique({ where: { id: volunteerId } });
      if (!staff || (staff.role !== Role.VOLUNTEER && staff.role !== Role.ADMIN)) {
        throw new AppError(403, ERROR_CODES.FORBIDDEN_ROLE, "Race Control authorization requires staff privileges.");
      }
      const existing = await tx.auditLog.findUnique({ where: { idempotencyKey: operationId } });
      if (existing && (existing.sessionId !== sessionId || existing.volunteerId !== volunteerId ||
          existing.action !== "AUTHORIZE_RESUME")) {
        throw new AppError(409, ERROR_CODES.VALIDATION_ERROR, "Idempotency key already belongs to a different authorization.");
      }
      let session = await tx.session.findUnique({ where: { id: sessionId } });
      if (!session) throw new AppError(404, ERROR_CODES.RESOURCE_NOT_FOUND, "Session not found.");
      const candidate = await tx.user.findUnique({ where: { id: session.userId } });
      if (!candidate) throw new AppError(404, ERROR_CODES.RESOURCE_NOT_FOUND, "Candidate not found.");
      if (session.contestId !== env.CONTEST_ID || (input.contestId && input.contestId !== session.contestId) ||
          (input.driverId && input.driverId !== candidate.driverId)) {
        throw new AppError(409, ERROR_CODES.VALIDATION_ERROR, "Session scope has changed; refresh Race Control.");
      }
      let audit = existing;
      if (!audit) {
        if (session.revision !== input.expectedSessionRevision) {
          throw new AppError(409, ERROR_CODES.VALIDATION_ERROR, "Session revision has changed; refresh Race Control.");
        }
        if (
          session.status !== RaceSessionStatus.LOCKED &&
          session.status !== RaceSessionStatus.LOCK_PENDING &&
          session.status !== RaceSessionStatus.UNDER_REVIEW
        ) {
          throw new AppError(409, ERROR_CODES.VALIDATION_ERROR, "Session is not awaiting authorization.");
        }
        const blockers = await tx.incident.findMany({
          where: { sessionId, blocking: true, status: { not: IncidentStatus.AUTHORIZED } },
          select: { id: true }, orderBy: { id: "asc" }
        });
        const ids = blockers.map(item => item.id);
        if (input.expectedIncidentIds && (!ids.length || !sameIds(ids, input.expectedIncidentIds))) {
          throw new AppError(409, ERROR_CODES.VALIDATION_ERROR, "The outstanding incident set changed; review it again.");
        }
        const decidedAt = new Date();
        const previousState = session.status;
        const changed = await tx.session.updateMany({
          where: { id: sessionId, revision: input.expectedSessionRevision, status: {
            in: [RaceSessionStatus.LOCKED, RaceSessionStatus.LOCK_PENDING, RaceSessionStatus.UNDER_REVIEW]
          } },
          data: { status: RaceSessionStatus.ACTIVE, lockReason: null, resumedAt: new Date(),
            revision: { increment: 1 } }
        });
        if (changed.count !== 1) {
          throw new AppError(409, ERROR_CODES.VALIDATION_ERROR, "Concurrent session update; refresh and retry.");
        }
        await tx.incident.updateMany({ where: { id: { in: ids } },
          data: { status: IncidentStatus.AUTHORIZED, resolvedAt: decidedAt,
            resolvedBy: volunteerId, resolutionAction: "AUTHORIZE_RESUME", resolutionReason: input.note } });
        audit = await tx.auditLog.create({ data: {
          volunteerId, sessionId, participantId: session.userId, action: "AUTHORIZE_RESUME",
          reason: input.note, previousState, newState: "ACTIVE", idempotencyKey: operationId,
          incidentId: ids[0], createdAt: decidedAt
        } });
        session = await tx.session.findUniqueOrThrow({ where: { id: sessionId } });
      }
      const latest = await tx.incident.findFirst({ where: { sessionId }, orderBy: { receivedAt: "desc" } });
      const incident = latest ? incidentDto(latest, session.contestId, candidate.driverId) : null;
      const incidents = (await tx.incident.findMany({
        where: { sessionId, blocking: true, resolvedBy: volunteerId, resolvedAt: audit.createdAt,
          resolutionAction: "AUTHORIZE_RESUME" },
        orderBy: { id: "asc" }
      })).map(item => incidentDto(item, session.contestId, candidate.driverId));
      const coveredIncidentIds = incidents.map(item => item.id);
      if (existing && input.expectedIncidentIds &&
          (!sameIds(coveredIncidentIds, input.expectedIncidentIds) || audit.reason !== input.note ||
            session.revision !== input.expectedSessionRevision! + 1 || session.status !== RaceSessionStatus.ACTIVE)) {
        throw new AppError(409, ERROR_CODES.VALIDATION_ERROR, "Authorization changed; refresh Race Control.");
      }
      const authorization = {
        id: audit.id, incidentId: audit.incidentId || "session_bulk", sessionId, coveredIncidentIds, decision: "AUTHORIZE_RESUME" as const,
        actorId: volunteerId, actorRole: staff.role as "VOLUNTEER" | "ADMIN",
        decidedAt: audit.createdAt.toISOString(), simulation: false
      };
      return {
        incident, incidents,
        session: { id: session.id, contestId: session.contestId, driverId: candidate.driverId,
          status: session.status, revision: session.revision,
          updatedAt: session.updatedAt.toISOString(), serverTime: new Date().toISOString(),
          policy: SessionRepository.getPolicy(session.status), latestIncident: incident,
          resumeAuthorization: authorization, volunteerNotified: true, simulation: false },
        authorization
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }).catch(handleConcurrentReview);
    return response;
  }

}

function sameIds(first: string[], second: string[]) {
  return JSON.stringify([...first].sort()) === JSON.stringify([...second].sort());
}

function incidentDto(item: Incident, contestId: string, driverId: string) {
  const observedAt = item.occurredAt.toISOString();
  return {
    id: item.id, contestId, driverId, clientEventId: item.eventId, sessionId: item.sessionId,
    type: item.type, observedAt, detectedAt: observedAt, problemId: item.problemId,
    reviewStatus: item.status, status: item.status, blocking: item.blocking,
    timestamp: item.receivedAt.toISOString(), details: item.details,
    resolvedAt: item.resolvedAt?.toISOString() ?? null, resolvedBy: item.resolvedBy,
    resolutionAction: item.resolutionAction, resolutionReason: item.resolutionReason, simulation: false
  };
}

function handleConcurrentReview(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2034", "P2002"].includes(error.code)) {
    throw new AppError(409, ERROR_CODES.VALIDATION_ERROR, "Another Race Control request changed this session. Refresh and review again.");
  }
  throw error;
}
