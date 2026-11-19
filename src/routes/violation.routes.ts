// ==============================================================================
// CODE GRAND PRIX 2026 — VIOLATION & INCIDENT ROUTES
// ==============================================================================

import { Router } from "express";
import { ViolationController, violationSchema } from "../controllers/violation.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";

export const violationRouter = Router();

violationRouter.post(
  "/violations",
  requireAuth,
  validateBody(violationSchema),
  ViolationController.reportViolation
);
