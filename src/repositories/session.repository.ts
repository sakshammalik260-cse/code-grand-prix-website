import { env } from "../config/env.js";
// ==============================================================================
// CODE GRAND PRIX 2026 — SESSION REPOSITORY
// ==============================================================================

import { prisma } from "../config/database.js";
import { CheckinStatus, RaceSessionStatus, Session } from "@prisma/client";
import { AppError } from "../middleware/error.middleware.js";
import { ERROR_CODES } from "../constants/index.js";

const inMemorySessions: Map<string, Session> = new Map();
const lockedStatuses: RaceSessionStatus[] = [RaceSessionStatus.LOCKED, RaceSessionStatus.LOCK_PENDING, RaceSessionStatus.UNDER_REVIEW];
const checkInLocked = () => new AppError(403, ERROR_CODES.SESSION_LOCKED, "Check-in paused because the session was locked. A volunteer must authorize your resume.");

function getSessionKey(userId: string, contestId: string): string {
  return `${userId}:${contestId}`;
}

export class SessionRepository {
  static async findOrCreate(userId: string, contestId: string): Promise<Session> {
    try {
      const session = await prisma.session.upsert({
        where: {
          userId_contestId: { userId, contestId }
        },
        update: {},
        create: {
          userId,
          contestId,
          status: RaceSessionStatus.WAITING,
          revision: 1,
          checkinStatus: CheckinStatus.NOT_STARTED
        }
      });
      return session;
    } catch (databaseError) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw databaseError;
      // In-memory fallback
      const key = getSessionKey(userId, contestId);
      if (!inMemorySessions.has(key)) {
        inMemorySessions.set(key, {
          id: `sess_${userId}_${contestId}`,
          userId,
          contestId,
          status: RaceSessionStatus.WAITING,
          revision: 1,
          checkinStatus: CheckinStatus.NOT_STARTED,
          rulesAccepted: false,
          cameraPermission: false,
          fullscreenRequested: false,
          cameraStatus: "DISCONNECTED",
          lastSeenAt: new Date(),
          lockCount: 0,
          lockReason: null,
          lockedAt: null,
          resumedAt: null,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      return inMemorySessions.get(key)!;
    }
  }

  static async findById(id: string): Promise<Session | null> {
    try {
      const found = await prisma.session.findUnique({
        where: { id }
      });
      if (found) return found;
    } catch (databaseError) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw databaseError;
      // In-memory fallback
    }

    for (const session of inMemorySessions.values()) {
      if (session.id === id) return session;
    }
    return null;
  }

  static async findAll(): Promise<Session[]> {
    try {
      const sessions = await prisma.session.findMany({
        include: { user: true }
      });
      if (sessions && sessions.length > 0) return sessions;
    } catch (databaseError) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw databaseError;
      // Fallback
    }
    return Array.from(inMemorySessions.values());
  }

  static async updateCheckin(
    userId: string,
    contestId: string,
    data: {
      rulesAccepted: boolean;
      cameraPermission: boolean;
      fullscreenRequested: boolean;
      checkinStatus: CheckinStatus;
      status: RaceSessionStatus;
    }
  ): Promise<Session> {
    try {
      const updated = await prisma.session.updateMany({
        where: {
          userId, contestId,
          status: { notIn: lockedStatuses }
        },
        data: { ...data, revision: { increment: 1 }, lastSeenAt: new Date() }
      });
      if (updated.count !== 1) {
        throw checkInLocked();
      }
      return await prisma.session.findUniqueOrThrow({ where: { userId_contestId: { userId, contestId } } });
    } catch (databaseError) {
      if (databaseError instanceof AppError || env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw databaseError;
      const session = await this.findOrCreate(userId, contestId);
      if (lockedStatuses.includes(session.status)) throw checkInLocked();
      session.rulesAccepted = data.rulesAccepted;
      session.cameraPermission = data.cameraPermission;
      session.fullscreenRequested = data.fullscreenRequested;
      session.checkinStatus = data.checkinStatus;
      session.status = data.status;
      session.revision += 1;
      session.lastSeenAt = new Date();
      session.updatedAt = new Date();
      return session;
    }
  }

  static async lockSession(userId: string, contestId: string, reason: string): Promise<Session> {
    try {
      const updated = await prisma.session.update({
        where: {
          userId_contestId: { userId, contestId }
        },
        data: {
          status: RaceSessionStatus.LOCKED,
          lockReason: reason,
          lockedAt: new Date(),
          revision: { increment: 1 },
          lockCount: { increment: 1 }
        }
      });
      return updated;
    } catch (databaseError) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw databaseError;
      const session = await this.findOrCreate(userId, contestId);
      session.status = RaceSessionStatus.LOCKED;
      session.lockReason = reason;
      session.lockedAt = new Date();
      session.revision += 1;
      session.lockCount += 1;
      session.updatedAt = new Date();
      return session;
    }
  }

  static async resumeSession(userId: string, contestId: string): Promise<Session> {
    try {
      const updated = await prisma.session.update({
        where: {
          userId_contestId: { userId, contestId }
        },
        data: {
          status: RaceSessionStatus.ACTIVE,
          lockReason: null,
          revision: { increment: 1 },
          resumedAt: new Date()
        }
      });
      return updated;
    } catch (databaseError) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw databaseError;
      const session = await this.findOrCreate(userId, contestId);
      session.status = RaceSessionStatus.ACTIVE;
      session.lockReason = null;
      session.revision += 1;
      session.resumedAt = new Date();
      session.updatedAt = new Date();
      return session;
    }
  }

  static async authorizeResumeById(sessionId: string): Promise<Session | null> {
    try {
      const updated = await prisma.session.update({
        where: { id: sessionId },
        data: {
          status: RaceSessionStatus.ACTIVE,
          lockReason: null,
          revision: { increment: 1 },
          resumedAt: new Date()
        }
      });
      return updated;
    } catch (databaseError) {
      if (env.NODE_ENV === "production" || !env.ALLOW_DEV_FALLBACK) throw databaseError;
      const session = await this.findById(sessionId);
      if (!session) return null;
      session.status = RaceSessionStatus.ACTIVE;
      session.lockReason = null;
      session.revision += 1;
      session.resumedAt = new Date();
      session.updatedAt = new Date();
      return session;
    }
  }

  static getPolicy(status: RaceSessionStatus) {
    const canProceed = status === RaceSessionStatus.ACTIVE || status === RaceSessionStatus.RESUME_AUTHORIZED;
    return {
      allowExecution: canProceed,
      allowEditing: canProceed,
      allowNavigation: canProceed
    };
  }
}
