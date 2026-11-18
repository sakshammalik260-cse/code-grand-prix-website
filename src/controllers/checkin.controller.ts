// ==============================================================================
// CODE GRAND PRIX 2026 — CHECK-IN & SESSION CONTROLLER
// ==============================================================================

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { CheckinService } from "../services/checkin.service.js";
import { env } from "../config/env.js";

export const checkinSchema = z.object({
  rulesAccepted: z.boolean(),
  cameraPermission: z.boolean(),
  fullscreenRequested: z.boolean()
});

export class CheckinController {
  static async checkin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await CheckinService.checkin(req.user!.id, env.CONTEST_ID, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await CheckinService.getSession(req.user!.id, env.CONTEST_ID);
      res.status(200).json(session);
    } catch (error) {
      next(error);
    }
  }
}
