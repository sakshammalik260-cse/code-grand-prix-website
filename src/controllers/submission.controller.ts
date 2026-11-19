// ==============================================================================
// CODE GRAND PRIX 2026 — SUBMISSION & RUN CONTROLLER
// ==============================================================================

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { JudgeService } from "../judge/judge.service.js";

export const runCodeSchema = z
  .object({
    sessionId: z.string().optional(),
    contestId: z.string().optional(),
    driverId: z.string().optional(),
    problemId: z.string().min(1, "problemId is required"),
    language: z.string().optional(),
    languageId: z.string().optional(),
    sourceCode: z.string().min(1, "sourceCode cannot be empty"),
    customInput: z.string().optional()
  })
  .refine((data) => !!(data.language || data.languageId), {
    message: "language or languageId is required"
  });

export const submitCodeSchema = z
  .object({
    sessionId: z.string().optional(),
    contestId: z.string().optional(),
    driverId: z.string().optional(),
    problemId: z.string().min(1, "problemId is required"),
    language: z.string().optional(),
    languageId: z.string().optional(),
    sourceCode: z.string().min(1, "sourceCode cannot be empty")
  })
  .refine((data) => !!(data.language || data.languageId), {
    message: "language or languageId is required"
  });

export class SubmissionController {
  static async runCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await JudgeService.runCode(req.user!.id, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async submitCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await JudgeService.submitCode(req.user!.id, req.user!.driverId, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await JudgeService.getSubmission(id, req.user!.id, req.user!.role);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
