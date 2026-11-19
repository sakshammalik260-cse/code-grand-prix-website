// ==============================================================================
// CODE GRAND PRIX 2026 — SUBMISSION & EXECUTION ROUTES
// ==============================================================================

import { Router } from "express";
import { SubmissionController, runCodeSchema, submitCodeSchema } from "../controllers/submission.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { Role } from "@prisma/client";

export const submissionRouter = Router();

const candidateRoles = [Role.CANDIDATE, Role.PARTICIPANT];

// C05 Fix: Only candidates can run or submit code
submissionRouter.post(
  "/code/run",
  requireAuth,
  requireRole(candidateRoles),
  validateBody(runCodeSchema),
  SubmissionController.runCode
);

submissionRouter.post(
  "/code/submit",
  requireAuth,
  requireRole(candidateRoles),
  validateBody(submitCodeSchema),
  SubmissionController.submitCode
);

submissionRouter.get(
  "/submissions/:id",
  requireAuth,
  SubmissionController.getSubmission
);
