// ==============================================================================
// CODE GRAND PRIX 2026 — VIOLATION & INCIDENT CONTROLLER
// ==============================================================================

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ViolationService } from "../services/violation.service.js";

export const violationSchema = z.object({
  clientEventId: z.string().optional(),
  eventId: z.string().optional(),
  contestId: z.string().optional(),
  driverId: z.string().optional(),
  sessionId: z.string().optional(),
  type: z.string().min(1, "type is required"),
  observedAt: z.string().optional(),
  occurredAt: z.string().optional(),
  problemId: z.string().nullable().optional(),
  details: z.any().optional()
}).refine(data => !!(data.clientEventId || data.eventId), {
  message: "clientEventId (or legacy eventId) is required for reliable incident deduplication"
});

export class ViolationController {
  static async reportViolation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ViolationService.reportViolation(req.user!.id, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
