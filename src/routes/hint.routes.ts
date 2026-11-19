// ==============================================================================
// CODE GRAND PRIX 2026 — RACE ASSIST HINT ROUTES
// ==============================================================================

import { Router } from "express";
import { HintController, unlockHintSchema } from "../controllers/hint.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";

export const hintRouter = Router();

hintRouter.get(
  "/contest/problems/:id/hints",
  requireAuth,
  HintController.getProblemHints
);

hintRouter.post(
  "/contest/problems/:id/hints/:hintId/unlock",
  requireAuth,
  validateBody(unlockHintSchema),
  HintController.unlockHint
);
