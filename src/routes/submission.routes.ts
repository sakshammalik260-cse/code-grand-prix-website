// ==============================================================================
// CODE GRAND PRIX 2026 — SUBMISSION & EXECUTION ROUTES
// ==============================================================================

import { Router } from "express";
import { SubmissionController, runCodeSchema, submitCodeSchema } from "../controllers/submission.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";

export const submissionRouter = Router();

submissionRouter.post(
  "/code/run",
  requireAuth,
  validateBody(runCodeSchema),
  SubmissionController.runCode
);

submissionRouter.post(
  "/code/submit",
  requireAuth,
  validateBody(submitCodeSchema),
  SubmissionController.submitCode
);

submissionRouter.get(
  "/submissions/:id",
  requireAuth,
  SubmissionController.getSubmission
);
