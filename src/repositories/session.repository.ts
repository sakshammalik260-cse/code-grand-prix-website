// ==============================================================================
// CODE GRAND PRIX 2026 — SESSION REPOSITORY
// ==============================================================================

import { prisma } from "../config/database.js";
import { CheckinStatus, RaceSessionStatus, Session } from "@prisma/client";

const inMemorySessions: Map<string, Session> = new Map();

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
          checkinStatus: CheckinStatus.NOT_STARTED
        }
      });
      return session;
    } catch {
      // In-memory fallback
      const key = getSessionKey(userId, contestId);
      if (!inMemorySessions.has(key)) {
        inMemorySessions.set(key, {
          id: `sess_${userId}_${contestId}`,
          userId,
          contestId,
          status: RaceSessionStatus.WAITING,
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
      const updated = await prisma.session.update({
        where: {
          userId_contestId: { userId, contestId }
        },
        data: {
          ...data,
          lastSeenAt: new Date()
        }
      });
      return updated;
    } catch {
      const session = await this.findOrCreate(userId, contestId);
      session.rulesAccepted = data.rulesAccepted;
      session.cameraPermission = data.cameraPermission;
      session.fullscreenRequested = data.fullscreenRequested;
      session.checkinStatus = data.checkinStatus;
      session.status = data.status;
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
          lockCount: { increment: 1 }
        }
      });
      return updated;
    } catch {
      const session = await this.findOrCreate(userId, contestId);
      session.status = RaceSessionStatus.LOCKED;
      session.lockReason = reason;
      session.lockedAt = new Date();
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
          resumedAt: new Date()
        }
      });
      return updated;
    } catch {
      const session = await this.findOrCreate(userId, contestId);
      session.status = RaceSessionStatus.ACTIVE;
      session.lockReason = null;
      session.resumedAt = new Date();
      session.updatedAt = new Date();
      return session;
    }
  }
}
