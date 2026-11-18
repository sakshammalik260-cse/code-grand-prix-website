// ==============================================================================
// CODE GRAND PRIX 2026 — PROBLEM & LANGUAGE ROUTES
// ==============================================================================

import { Router } from "express";
import { ProblemController } from "../controllers/problem.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const problemRouter = Router();

problemRouter.get("/problems", requireAuth, ProblemController.getProblems);
problemRouter.get("/problems/:id", requireAuth, ProblemController.getProblemById);
problemRouter.get("/languages", ProblemController.getLanguages);
