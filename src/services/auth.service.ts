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

export class AuthService {
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

    // Get current contest and session
    const contest = await ContestRepository.getContest(env.CONTEST_ID);
    const timeDetails = ContestRepository.calculateTimeDetails(contest);
    const session = await SessionRepository.findOrCreate(user.id, contest.id);

    // Generate JWT token with unique jti identifier
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

    return {
      token,
      user: {
        id: user.id,
        driverId: user.driverId,
        displayName: user.displayName,
        role: user.role.toLowerCase()
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
   * Get authenticated user profile
   */
  static async getMe(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new AppError(404, ERROR_CODES.RESOURCE_NOT_FOUND, "User profile not found.");
    }

    return {
      id: user.id,
      displayName: user.displayName,
      driverId: user.driverId,
      role: user.role.toLowerCase(),
      contestId: env.CONTEST_ID
    };
  }

  /**
   * Invalidate authenticated session and token
   */
  static async logout(token: string, userId: string) {
    // Revoke token until 8 hours from now
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
    await TokenRepository.revokeToken(token, expiresAt);
    await UserRepository.updateLastLogout(userId, new Date());

    return {
      success: true,
      message: "Successfully logged out. Session has been terminated."
    };
  }
}
