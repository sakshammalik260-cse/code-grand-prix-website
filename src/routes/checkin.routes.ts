// ==============================================================================
// CODE GRAND PRIX 2026 — CHECK-IN & SESSION ROUTES
// ==============================================================================

import { Router } from "express";
import { CheckinController, checkinSchema } from "../controllers/checkin.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { Role } from "@prisma/client";
import { validateBody } from "../middleware/validate.middleware.js";

export const checkinRouter = Router();

checkinRouter.post("/checkin", requireAuth, requireRole([Role.CANDIDATE, Role.PARTICIPANT]), validateBody(checkinSchema), CheckinController.checkin);
checkinRouter.get("/session", requireAuth, CheckinController.getSession);
