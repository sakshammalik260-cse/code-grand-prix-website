// ==============================================================================
// CODE GRAND PRIX 2026 — AUTHENTICATION CONTROLLER
// ==============================================================================

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AuthService } from "../services/auth.service.js";
import { env } from "../config/env.js";

export const loginSchema = z.object({
  driverId: z.string().min(1, "driverId is required").trim(),
  password: z.string().min(1, "password is required")
});

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { driverId, password } = req.body;
      const result = await AuthService.login(driverId, password);

      // Set secure HttpOnly cookie
      res.cookie("auth_token", result.token, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        sameSite: env.COOKIE_SAME_SITE,
        maxAge: 8 * 60 * 60 * 1000 // 8 hours
      });

      res.status(200).json(result);
    } catch (error) {
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
