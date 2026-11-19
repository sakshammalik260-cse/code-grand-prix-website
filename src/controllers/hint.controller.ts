// ==============================================================================
// CODE GRAND PRIX 2026 — RACE ASSIST HINT CONTROLLER
// ==============================================================================

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { HintService } from "../services/hint.service.js";
import { env } from "../config/env.js";

export const unlockHintSchema = z.object({
  operationId: z.string().min(1, "operationId is required"),
  sessionId: z.string().optional(),
  configurationRevision: z.number().optional(),
  expectedDeductionPoints: z.number().optional()
});

export class HintController {
  static async getProblemHints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const problemId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await HintService.getProblemHints(problemId, req.user!.id, env.CONTEST_ID);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async unlockHint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const problemId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const hintId = Array.isArray(req.params.hintId) ? req.params.hintId[0] : req.params.hintId;
      const result = await HintService.unlockHint(
        problemId,
        hintId,
        req.user!.id,
        env.CONTEST_ID,
        req.body
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
