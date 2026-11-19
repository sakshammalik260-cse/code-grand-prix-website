// ==============================================================================
// CODE GRAND PRIX 2026 — ADMIN & QUESTION MANAGEMENT CONTROLLER
// ==============================================================================

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AdminService } from "../services/admin.service.js";

export const createAdminProblemSchema = z.object({
  title: z.string().min(1, "title is required"),
  difficulty: z.enum(["Easy", "Medium", "Hard", "EASY", "MEDIUM", "HARD"]).default("Medium"),
  points: z.number().default(100),
  statement: z.union([z.string(), z.array(z.string())]),
  inputFormat: z.union([z.string(), z.array(z.string())]).default(""),
  outputFormat: z.string().default(""),
  constraints: z.union([z.string(), z.array(z.string())]).default(""),
  samples: z
    .array(
      z.object({
        id: z.string().optional(),
        input: z.string(),
        output: z.string(),
        explanation: z.string().optional()
      })
    )
    .optional(),
  timeLimitMs: z.number().optional(),
  memoryLimitMb: z.number().optional(),
  allowedLanguages: z.array(z.string()).optional(),
  roundId: z.string().optional()
});

export class AdminController {
  static async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const overview = await AdminService.getOverview();
      res.status(200).json(overview);
    } catch (error) {
      next(error);
    }
  }

  static async listProblems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const problems = await AdminService.listProblems();
      res.status(200).json(problems);
    } catch (error) {
      next(error);
    }
  }

  static async createProblem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await AdminService.createProblem(req.body);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }

  static async publishProblem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await AdminService.publishProblem(id);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  static async unpublishProblem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await AdminService.unpublishProblem(id);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  static async addTestCase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const created = await AdminService.addTestCase(id, req.body);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }
}
