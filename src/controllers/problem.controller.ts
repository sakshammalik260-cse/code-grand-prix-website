// ==============================================================================
// CODE GRAND PRIX 2026 — PROBLEM & LANGUAGE CONTROLLER
// ==============================================================================

import { Request, Response, NextFunction } from "express";
import { ProblemService } from "../services/problem.service.js";

export class ProblemController {
  static async getProblems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const problems = await ProblemService.getProblems();
      res.status(200).json(problems);
    } catch (error) {
      next(error);
    }
  }

  static async getProblemById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const problem = await ProblemService.getProblemById(id);
      res.status(200).json(problem);
    } catch (error) {
      next(error);
    }
  }

  static async getLanguages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const languages = ProblemService.getLanguages();
      res.status(200).json(languages);
    } catch (error) {
      next(error);
    }
  }
}
