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
import { RoundService } from "./round.service.js";
import { TokenRepository } from "../repositories/token.repository.js";
import { Role } from "@prisma/client";

// Match the cost used by provisioned credentials even when the driver ID is unknown.
const dummyHash = bcrypt.hashSync(uuidv4(), 10);

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
    const validLength = Buffer.byteLength(password) <= 72;
    const isMatch = await bcrypt.compare(validLength ? password : "", user?.passwordHash ?? dummyHash);
    if (!user || !validLength || !isMatch) {
      throw new AppError(
        401,
        ERROR_CODES.INVALID_CREDENTIALS,
        "Invalid driver ID or password."
      );
    }

    const timeDetails = await RoundService.clock(env.CONTEST_ID);
    const session = await SessionRepository.findOrCreate(user.id, timeDetails.id);

    const jti = uuidv4();
    const token = jwt.sign(
      {
        userId: user.id,
        driverId: user.driverId,
        role: user.role,
        contestId: timeDetails.id,
        issuedAtMs: Date.now(),
        jti
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
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
        id: timeDetails.id,
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
    const expiresAt = new Date(Date.now() + env.JWT_EXPIRES_IN * 1000);
    await TokenRepository.revokeToken(token, expiresAt);
    await UserRepository.updateLastLogout(userId, new Date());

    return {
      success: true,
      message: "Successfully logged out. Session has been terminated."
    };
  }
}
