// ==============================================================================
// CODE GRAND PRIX 2026 — LEADERBOARD & PROGRESS CONTROLLER
// ==============================================================================

import { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { AppError } from "../middleware/error.middleware.js";
import { ERROR_CODES } from "../constants/index.js";
import { LeaderboardService } from "../services/leaderboard.service.js";

export class LeaderboardController {
  static async getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userRole = req.user ? req.user.role : "CANDIDATE";
      const leaderboard = await LeaderboardService.getLeaderboard(userRole);
      res.status(200).json(leaderboard);
    } catch (error) {
      next(error);
    }
  }

  static async getProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contestId = env.CONTEST_ID;
      const progress = await LeaderboardService.getProgress(
        req.user!.id,
        req.user!.driverId,
        contestId
      );
      res.status(200).json(progress);
    } catch (error) {
      next(error);
    }
  }

  static async getVisibility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await LeaderboardService.getVisibility();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getContestVisibility(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json(await LeaderboardService.getContestVisibility());
    } catch (error) {
      next(error);
    }
  }

  static async setVisibility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { visible } = req.body;
      if (typeof visible !== "boolean") throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, "visible must be a boolean.");
      const result = await LeaderboardService.setVisibility(visible);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
