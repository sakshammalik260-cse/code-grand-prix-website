// ==============================================================================
// CODE GRAND PRIX 2026 — USER REPOSITORY
// ==============================================================================

import { prisma } from "../config/database.js";
import { Role, User } from "@prisma/client";
import bcrypt from "bcryptjs";

// Pre-hashed passwords for in-memory fallback
const HASHED_PASS_DRIVER = bcrypt.hashSync("driver123", 10);
const HASHED_PASS_VOLUNTEER = bcrypt.hashSync("racecontrol2026", 10);
const HASHED_PASS_STEWARD = bcrypt.hashSync("steward2026", 10);

const inMemoryUsers: Map<string, User> = new Map([
  [
    "CGP_045",
    {
      id: "u_045",
      driverId: "CGP_045",
      displayName: "Lewis Hamilton",
      passwordHash: HASHED_PASS_DRIVER,
      role: Role.PARTICIPANT,
      lastLogoutAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  [
    "CGP_016",
    {
      id: "u_016",
      driverId: "CGP_016",
      displayName: "Charles Leclerc",
      passwordHash: HASHED_PASS_DRIVER,
      role: Role.PARTICIPANT,
      lastLogoutAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  [
    "CGP_001",
    {
      id: "u_001",
      driverId: "CGP_001",
      displayName: "Max Verstappen",
      passwordHash: HASHED_PASS_DRIVER,
      role: Role.PARTICIPANT,
      lastLogoutAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  [
    "VOL_RACE_CONTROL",
    {
      id: "u_vol_01",
      driverId: "VOL_RACE_CONTROL",
      displayName: "Race Director Charlie",
      passwordHash: HASHED_PASS_VOLUNTEER,
      role: Role.VOLUNTEER,
      lastLogoutAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  [
    "VOL_STEWARD_01",
    {
      id: "u_vol_02",
      driverId: "VOL_STEWARD_01",
      displayName: "FIA Steward Alpha",
      passwordHash: HASHED_PASS_STEWARD,
      role: Role.VOLUNTEER,
      lastLogoutAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
]);

export class UserRepository {
  static async findByDriverId(driverId: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { driverId }
      });
      if (user) return user;
    } catch {
      // Fallback to in-memory
    }
    return inMemoryUsers.get(driverId) || null;
  }

  static async findById(id: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id }
      });
      if (user) return user;
    } catch {
      // Fallback to in-memory
    }

    for (const user of inMemoryUsers.values()) {
      if (user.id === id) return user;
    }
    return null;
  }

  static async updateLastLogout(userId: string, date: Date): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { lastLogoutAt: date }
      });
    } catch {
      // Fallback to in-memory
    }

    for (const user of inMemoryUsers.values()) {
      if (user.id === userId) {
        user.lastLogoutAt = date;
        break;
      }
    }
  }
}
