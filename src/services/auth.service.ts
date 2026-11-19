// ==============================================================================
// CODE GRAND PRIX 2026 — AUTHENTICATION SERVICE
// ==============================================================================

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env.js";
import { ERROR_CODES } from "../constants/index.js";
import { AppError } from "../middleware/error.middleware.js";
import { UserRepository } from "../repositories/user.repository.js";
import { SessionRepository } from "../repositories/session.repository.js";
import { ContestRepository } from "../repositories/contest.repository.js";
import { TokenRepository } from "../repositories/token.repository.js";
import { Role } from "@prisma/client";

export class AuthService {
  /**
   * Helper to normalize roles to frontend Driver type: 'CANDIDATE' | 'VOLUNTEER' | 'ADMIN'
   */
  private static normalizeRole(role: Role): "CANDIDATE" | "VOLUNTEER" | "ADMIN" {
    if (role === Role.ADMIN) return "ADMIN";
    if (role === Role.VOLUNTEER) return "VOLUNTEER";
    return "CANDIDATE";
  }

  /**
   * Authenticate user by driverId and password
   */
  static async login(driverId: string, password: string) {
    const user = await UserRepository.findByDriverId(driverId);
    if (!user) {
      throw new AppError(
        401,
        ERROR_CODES.INVALID_CREDENTIALS,
        "Invalid driver ID or password."
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError(
        401,
        ERROR_CODES.INVALID_CREDENTIALS,
        "Invalid driver ID or password."
      );
    }

    const contest = await ContestRepository.getContest(env.CONTEST_ID);
    const timeDetails = ContestRepository.calculateTimeDetails(contest);
    const session = await SessionRepository.findOrCreate(user.id, contest.id);

    const jti = uuidv4();
    const token = jwt.sign(
      {
        userId: user.id,
        driverId: user.driverId,
        role: user.role,
        contestId: contest.id,
        jti
      },
      env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    const normalizedRole = this.normalizeRole(user.role);

    return {
      token,
      // Frontend Driver contract fields: id, name, team, role
      id: user.driverId,
      name: user.displayName,
      team: user.team || "CPC Grid",
      role: normalizedRole,
      // Standard backend metadata
      user: {
        id: user.id,
        driverId: user.driverId,
        displayName: user.displayName,
        team: user.team || "CPC Grid",
        role: normalizedRole
      },
      contest: {
        id: contest.id,
        status: timeDetails.status
      },
      session: {
        status: session.status,
        lockReason: session.lockReason
      },
      serverTime: timeDetails.serverTime,
      remainingMs: timeDetails.remainingMs
    };
  }

  /**
   * Get authenticated user profile (matches frontend Driver type)
   */
  static async getMe(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new AppError(404, ERROR_CODES.RESOURCE_NOT_FOUND, "User profile not found.");
    }

    const normalizedRole = this.normalizeRole(user.role);

    return {
      id: user.driverId,
      name: user.displayName,
      displayName: user.displayName,
      driverId: user.driverId,
      team: user.team || "CPC Grid",
      role: normalizedRole,
      contestId: env.CONTEST_ID
    };
  }

  /**
   * Invalidate authenticated session and token
   */
  static async logout(token: string, userId: string) {
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
    await TokenRepository.revokeToken(token, expiresAt);
    await UserRepository.updateLastLogout(userId, new Date());

    return {
      success: true,
      message: "Successfully logged out. Session has been terminated."
    };
  }
}
