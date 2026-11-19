// ==============================================================================
// CODE GRAND PRIX 2026 — RACE ASSIST HINT ROUTES
// ==============================================================================

import { Router } from "express";
import { HintController, unlockHintSchema } from "../controllers/hint.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { Role } from "@prisma/client";

export const hintRouter = Router();

const candidateRoles = [Role.CANDIDATE, Role.PARTICIPANT];

hintRouter.get(
  "/contest/problems/:id/hints",
  requireAuth,
  HintController.getProblemHints
);

// C05 Fix: Only candidates can purchase hints
hintRouter.post(
  "/contest/problems/:id/hints/:hintId/unlock",
  requireAuth,
  requireRole(candidateRoles),
  validateBody(unlockHintSchema),
  HintController.unlockHint
);
