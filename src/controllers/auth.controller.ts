// ==============================================================================
// CODE GRAND PRIX 2026 — AUTHENTICATION CONTROLLER
// ==============================================================================

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AuthService } from "../services/auth.service.js";
import { env } from "../config/env.js";
import { AppError } from "../middleware/error.middleware.js";
import { beginLogin, LoginThrottled, refundLogin } from "../services/login-rate-limit.js";

export const loginSchema = z.object({
  driverId: z.string().trim().min(1, "driverId is required").max(128),
  password: z.string().min(1, "password is required").max(1024)
});

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    res.set("Cache-Control", "no-store");
    try {
      const { driverId, password } = req.body;
      const reservations = await beginLogin(req.ip ?? "", driverId);
      let login;
      try {
        login = await AuthService.login(driverId, password);
      } catch (error) {
        if (!(error instanceof AppError && error.statusCode === 401)) await refundLogin(reservations);
        throw error;
      }
      await refundLogin(reservations);

      const { token, ...profile } = login;
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: env.COOKIE_SAME_SITE,
        maxAge: env.JWT_EXPIRES_IN * 1000
      });
      res.status(200).json(profile);
    } catch (error) {
      if (error instanceof LoginThrottled) res.set("Retry-After", String(error.retryAfter));
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AuthService.getMe(req.user!.id);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.rawToken!;
      const userId = req.user!.id;

      await AuthService.logout(token, userId);

      res.clearCookie("auth_token", {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: env.COOKIE_SAME_SITE
      });

      res.status(200).json({
        success: true,
        message: "Successfully logged out. Session has been revoked."
      });
    } catch (error) {
      next(error);
    }
  }
}
