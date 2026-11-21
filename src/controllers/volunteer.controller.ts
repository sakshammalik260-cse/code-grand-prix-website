// ==============================================================================
// CODE GRAND PRIX 2026 — VOLUNTEER & RACE CONTROL CONTROLLER
// ==============================================================================

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { VolunteerService } from "../services/volunteer.service.js";

export const resolveIncidentSchema = z.object({
  action: z.string().min(1, "action is required"),
  reason: z.string().min(1, "reason is required"),
  expectedSessionRevision: z.number().int().positive().optional()
});

export const authorizeResumeSchema = z.object({
  contestId: z.string().min(1).optional(),
  driverId: z.string().min(1).optional(),
  expectedIncidentIds: z.array(z.string().min(1)).optional(),
  decision: z.enum(["AUTHORIZE_RESUME", "APPROVE_RESUME"]),
  expectedSessionRevision: z.number().int().positive(),
  note: z.string().min(1, "note is required"),
  idempotencyKey: z.string().trim().min(1)
});

export class VolunteerController {
  static async listParticipants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const participants = await VolunteerService.listParticipants();
      res.status(200).json(participants);
    } catch (error) {
      next(error);
    }
  }

  static async listIncidents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const incidents = await VolunteerService.listIncidents();
      res.status(200).json(incidents);
    } catch (error) {
      next(error);
    }
  }

  static async getIncidentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const incident = await VolunteerService.getIncidentById(id);
      res.status(200).json(incident);
    } catch (error) {
      next(error);
    }
  }

  static async resolveIncident(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { action, reason } = req.body;
      const result = await VolunteerService.resolveIncident(id, action, reason, req.user!.id, req.body.expectedSessionRevision);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async authorizeResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawParam = req.params.id || req.params.sessionId;
      const sessionId = Array.isArray(rawParam) ? rawParam[0] : String(rawParam);

      const result = await VolunteerService.authorizeResume(sessionId, req.user!.id, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
