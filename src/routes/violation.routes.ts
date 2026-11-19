// ==============================================================================
// CODE GRAND PRIX 2026 — VIOLATION & INCIDENT ROUTES
// ==============================================================================

import { Router } from "express";
import { ViolationController, violationSchema } from "../controllers/violation.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { Role } from "@prisma/client";

export const violationRouter = Router();

const candidateRoles = [Role.CANDIDATE, Role.PARTICIPANT];

// C05 Fix: Only candidate sessions report monitoring violations
violationRouter.post(
  "/violations",
  requireAuth,
  requireRole(candidateRoles),
  validateBody(violationSchema),
  ViolationController.reportViolation
);
