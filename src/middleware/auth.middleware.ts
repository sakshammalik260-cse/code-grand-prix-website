// ==============================================================================
// CODE GRAND PRIX 2026 — AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// ==============================================================================

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ERROR_CODES } from "../constants/index.js";
import { UserRepository } from "../repositories/user.repository.js";
import { SessionRepository } from "../repositories/session.repository.js";
import { TokenRepository } from "../repositories/token.repository.js";
import { User, Session, Role } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  driverId: string;
  displayName: string;
  role: Role;
}

export interface JwtPayload {
  userId: string;
  driverId: string;
  role: Role;
  contestId: string;
  jti?: string;
  iat?: number;
  exp?: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      sessionData?: Session;
      rawToken?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Extract token from Authorization Bearer header or HttpOnly cookie
    let token: string | undefined;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHENTICATED,
          message: "Authentication required. Please log in with your driverId and password."
        }
      });
      return;
    }

    // 2. Check if token is blacklisted / revoked
    const isRevoked = await TokenRepository.isTokenRevoked(token);
    if (isRevoked) {
      res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHENTICATED,
          message: "Session token has been revoked. Please log in again."
        }
      });
      return;
    }

    // 3. Verify JWT signature & expiration
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
      res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHENTICATED,
          message: "Invalid or expired session token. Please log in again."
        }
      });
      return;
    }

    // 4. Validate user existence
    const user = await UserRepository.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHENTICATED,
          message: "User account no longer exists."
        }
      });
      return;
    }

    // 5. Check if token was issued prior to user's last logout
    if (user.lastLogoutAt && decoded.iat) {
      const issuedAt = decoded.iat * 1000;
      if (issuedAt < user.lastLogoutAt.getTime()) {
        res.status(401).json({
          success: false,
          error: {
            code: ERROR_CODES.UNAUTHENTICATED,
            message: "Session token was invalidated by a recent logout."
          }
        });
        return;
      }
    }

    // 6. Fetch contest session
    const session = await SessionRepository.findOrCreate(user.id, env.CONTEST_ID);

    // Attach to request
    req.user = {
      id: user.id,
      driverId: user.driverId,
      displayName: user.displayName,
      role: user.role
    };
    req.sessionData = session;
    req.rawToken = token;

    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHENTICATED,
          message: "Authentication required."
        }
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN_ROLE,
          message: `Forbidden: This resource requires one of [${allowedRoles.join(", ")}] roles.`
        }
      });
      return;
    }

    next();
  };
}
