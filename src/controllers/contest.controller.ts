// ==============================================================================
// CODE GRAND PRIX 2026 — CONTEST CONTROLLER
// ==============================================================================

import { Request, Response, NextFunction } from "express";
import { ContestService } from "../services/contest.service.js";

export class ContestController {
  static async getContest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contest = await ContestService.getContestClock();
      res.status(200).json(contest);
    } catch (error) {
      next(error);
    }
  }
}
