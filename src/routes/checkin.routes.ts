// ==============================================================================
// CODE GRAND PRIX 2026 — CHECK-IN & SESSION ROUTES
// ==============================================================================

import { Router } from "express";
import { CheckinController, checkinSchema } from "../controllers/checkin.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";

export const checkinRouter = Router();

checkinRouter.post("/checkin", requireAuth, validateBody(checkinSchema), CheckinController.checkin);
checkinRouter.get("/session", requireAuth, CheckinController.getSession);
