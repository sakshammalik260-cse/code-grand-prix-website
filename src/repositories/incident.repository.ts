import { env } from "../config/env.js";
// ==============================================================================
// CODE GRAND PRIX 2026 — INCIDENT & AUDIT REPOSITORY
// ==============================================================================

import { prisma } from "../config/database.js";
import { Incident, IncidentAction, IncidentStatus, IncidentType, AuditLog } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const inMemoryIncidents: Map<string, Incident> = new Map();
const inMemoryAuditLogs: AuditLog[] = [];

export interface CreateIncidentInput {
  eventId: string;
  userId: string;
  sessionId: string;
  problemId?: string | null;
  type: IncidentType;
  action: IncidentAction;
  blocking: boolean;
  occurredAt: Date;
  details?: string;
}

export class IncidentRepository {
  static async findByEventId(eventId: string): Promise<Incident | null> {
    try {
      const found = await prisma.incident.findUnique({
        where: { eventId }
      });
      if (found) return found;
    } catch (databaseError) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw databaseError;
      // In-memory fallback
    }

    for (const incident of inMemoryIncidents.values()) {
      if (incident.eventId === eventId) return incident;
    }
    return null;
  }

  static async create(input: CreateIncidentInput): Promise<Incident> {
    const id = `inc_${uuidv4()}`;
    const newIncident: Incident = {
      id,
      eventId: input.eventId,
      userId: input.userId,
      sessionId: input.sessionId,
      problemId: input.problemId || null,
      type: input.type,
      action: input.action,
      status: IncidentStatus.OPEN,
      blocking: input.blocking,
      occurredAt: input.occurredAt,
      receivedAt: new Date(),
      details: input.details || null,
      resolvedAt: null,
      resolvedBy: null,
      resolutionAction: null,
      resolutionReason: null
    };

    try {
      const created = await prisma.incident.create({
        data: newIncident
      });
      return created;
    } catch (databaseError) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw databaseError;
      inMemoryIncidents.set(id, newIncident);
      return newIncident;
    }
  }

  static async findById(id: string): Promise<Incident | null> {
    try {
      const found = await prisma.incident.findUnique({
        where: { id }
      });
      if (found) return found;
    } catch (databaseError) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw databaseError;
      // In-memory fallback
    }
    return inMemoryIncidents.get(id) || null;
  }

  static async findAll(): Promise<Incident[]> {
    try {
      const incidents = await prisma.incident.findMany({
        orderBy: { receivedAt: "desc" }
      });
      if (incidents && incidents.length > 0) return incidents;
    } catch (databaseError) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw databaseError;
      // In-memory fallback
    }
    return Array.from(inMemoryIncidents.values()).sort(
      (a, b) => b.receivedAt.getTime() - a.receivedAt.getTime()
    );
  }

  static async findBySessionId(sessionId: string): Promise<Incident[]> {
    try {
      const incidents = await prisma.incident.findMany({
        where: { sessionId },
        orderBy: { receivedAt: "desc" }
      });
      if (incidents && incidents.length > 0) return incidents;
    } catch (databaseError) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw databaseError;
      // In-memory fallback
    }
    return Array.from(inMemoryIncidents.values())
      .filter((inc) => inc.sessionId === sessionId)
      .sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
  }

  static async resolve(
    id: string,
    action: string,
    reason: string,
    volunteerId: string
  ): Promise<Incident | null> {
    const now = new Date();
    try {
      const updated = await prisma.incident.update({
        where: { id },
        data: {
          status: action === "APPROVE_RESUME" ? IncidentStatus.AUTHORIZED : IncidentStatus.RESOLVED,
          resolvedAt: now,
          resolvedBy: volunteerId,
          resolutionAction: action,
          resolutionReason: reason
        }
      });
      return updated;
    } catch (databaseError) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw databaseError;
      const incident = inMemoryIncidents.get(id);
      if (!incident) return null;
      incident.status =
        action === "APPROVE_RESUME" ? IncidentStatus.AUTHORIZED : IncidentStatus.RESOLVED;
      incident.resolvedAt = now;
      incident.resolvedBy = volunteerId;
      incident.resolutionAction = action;
      incident.resolutionReason = reason;
      return incident;
    }
  }

  static async bulkResolveForSession(
    sessionId: string,
    action: string,
    reason: string,
    volunteerId: string
  ): Promise<Incident[]> {
    const now = new Date();
    try {
      await prisma.incident.updateMany({
        where: {
          sessionId,
          status: IncidentStatus.OPEN
        },
        data: {
          status: IncidentStatus.AUTHORIZED,
          resolvedAt: now,
          resolvedBy: volunteerId,
          resolutionAction: action,
          resolutionReason: reason
        }
      });
      return await this.findBySessionId(sessionId);
    } catch (databaseError) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw databaseError;
      const resolvedList: Incident[] = [];
      for (const incident of inMemoryIncidents.values()) {
        if (incident.sessionId === sessionId && incident.status === IncidentStatus.OPEN) {
          incident.status = IncidentStatus.AUTHORIZED;
          incident.resolvedAt = now;
          incident.resolvedBy = volunteerId;
          incident.resolutionAction = action;
          incident.resolutionReason = reason;
          resolvedList.push(incident);
        }
      }
      return resolvedList;
    }
  }

  static async createAuditLog(
    volunteerId: string,
    action: string,
    reason: string,
    details: { incidentId?: string; participantId?: string; sessionId?: string; previousState?: string; newState?: string }
  ): Promise<AuditLog> {
    const log: AuditLog = {
      id: `audit_${uuidv4()}`,
      idempotencyKey: null,
      volunteerId,
      incidentId: details.incidentId || null,
      participantId: details.participantId || null,
      sessionId: details.sessionId || null,
      action,
      reason,
      previousState: details.previousState || null,
      newState: details.newState || null,
      createdAt: new Date()
    };

    try {
      await prisma.auditLog.create({ data: log });
    } catch (databaseError) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw databaseError;
      inMemoryAuditLogs.push(log);
    }

    return log;
  }
}
