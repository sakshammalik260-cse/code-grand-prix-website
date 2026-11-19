// ==============================================================================
// CODE GRAND PRIX 2026 — LEADERBOARD & PROGRESS CONTROLLER
// ==============================================================================

import { Request, Response, NextFunction } from "express";
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
      const contestId = (req.query.contestId as string) || "cgp_2026";
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
      const result = LeaderboardService.getVisibility();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async setVisibility(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { visible } = req.body;
      const result = LeaderboardService.setVisibility(Boolean(visible));
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
