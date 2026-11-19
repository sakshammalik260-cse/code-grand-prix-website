// ==============================================================================
// CODE GRAND PRIX 2026 — USER REPOSITORY
// ==============================================================================

import { prisma } from "../config/database.js";
import { Role, User } from "@prisma/client";
import bcrypt from "bcryptjs";

// Pre-hashed passwords for in-memory fallback
const HASHED_PASS_DRIVER = bcrypt.hashSync("driver123", 10);
const HASHED_PASS_RACE2026 = bcrypt.hashSync("Race2026!", 10);
const HASHED_PASS_VOLUNTEER = bcrypt.hashSync("racecontrol2026", 10);
const HASHED_PASS_MARSHAL2026 = bcrypt.hashSync("Marshal2026!", 10);
const HASHED_PASS_ADMIN2026 = bcrypt.hashSync("Control2026!", 10);

const inMemoryUsers: Map<string, User> = new Map([
  [
    "CGP2026",
    {
      id: "u_cgp2026",
      driverId: "CGP2026",
      displayName: "Demo Driver",
      team: "CPC / Preview grid",
      passwordHash: HASHED_PASS_RACE2026,
      role: Role.CANDIDATE,
      lastLogoutAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  [
    "VOLUNTEER2026",
    {
      id: "u_vol2026",
      driverId: "VOLUNTEER2026",
      displayName: "Demo Marshal",
      team: "CPC / Race control",
      passwordHash: HASHED_PASS_MARSHAL2026,
      role: Role.VOLUNTEER,
      lastLogoutAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  [
    "ADMIN2026",
    {
      id: "u_admin2026",
      driverId: "ADMIN2026",
      displayName: "Demo Organizer",
      team: "CPC / Administration",
      passwordHash: HASHED_PASS_ADMIN2026,
      role: Role.ADMIN,
      lastLogoutAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  [
    "CGP_045",
    {
      id: "u_045",
      driverId: "CGP_045",
      displayName: "Lewis Hamilton",
      team: "Mercedes AMG",
      passwordHash: HASHED_PASS_DRIVER,
      role: Role.CANDIDATE,
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
      team: "Scuderia Ferrari",
      passwordHash: HASHED_PASS_DRIVER,
      role: Role.CANDIDATE,
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
      team: "Red Bull Racing",
      passwordHash: HASHED_PASS_DRIVER,
      role: Role.CANDIDATE,
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
      team: "FIA Race Control",
      passwordHash: HASHED_PASS_VOLUNTEER,
      role: Role.VOLUNTEER,
      lastLogoutAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
]);

export class UserRepository {
  static async findByDriverId(driverId: string): Promise<User | null> {
    const normalized = driverId.trim();
    try {
      const user = await prisma.user.findFirst({
        where: {
          driverId: {
            equals: normalized,
            mode: "insensitive"
          }
        }
      });
      if (user) return user;
    } catch {
      // Fallback
    }

    for (const [key, user] of inMemoryUsers.entries()) {
      if (key.toLowerCase() === normalized.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  static async findById(id: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id }
      });
      if (user) return user;
    } catch {
      // Fallback
    }

    for (const user of inMemoryUsers.values()) {
      if (user.id === id) return user;
    }
    return null;
  }

  static async findAllParticipants(): Promise<User[]> {
    try {
      const users = await prisma.user.findMany({
        where: {
          role: { in: [Role.CANDIDATE, Role.PARTICIPANT] }
        }
      });
      if (users && users.length > 0) return users;
    } catch {
      // Fallback
    }

    return Array.from(inMemoryUsers.values()).filter(
      (u) => u.role === Role.CANDIDATE || u.role === Role.PARTICIPANT
    );
  }

  static async updateLastLogout(userId: string, date: Date): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { lastLogoutAt: date }
      });
    } catch {
      // Fallback
    }

    for (const user of inMemoryUsers.values()) {
      if (user.id === userId) {
        user.lastLogoutAt = date;
        break;
      }
    }
  }
}
