// ==============================================================================
// CODE GRAND PRIX 2026 — VOLUNTEER & RACE CONTROL ROUTES
// ==============================================================================

import { Router } from "express";
import {
  VolunteerController,
  resolveIncidentSchema,
  authorizeResumeSchema
} from "../controllers/volunteer.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { Role } from "@prisma/client";

export const volunteerRouter = Router();

// Staff roles permitted: VOLUNTEER and ADMIN
const staffRoles = [Role.VOLUNTEER, Role.ADMIN];

volunteerRouter.get(
  "/volunteer/participants",
  requireAuth,
  requireRole(staffRoles),
  VolunteerController.listParticipants
);

volunteerRouter.get(
  "/volunteer/incidents",
  requireAuth,
  requireRole(staffRoles),
  VolunteerController.listIncidents
);

volunteerRouter.get(
  "/volunteer/incidents/:id",
  requireAuth,
  requireRole(staffRoles),
  VolunteerController.getIncidentById
);

volunteerRouter.post(
  "/volunteer/incidents/:id/resolve",
  requireAuth,
  requireRole(staffRoles),
  validateBody(resolveIncidentSchema),
  VolunteerController.resolveIncident
);

// One-Action Bulk Session Resume endpoints (supports both :id and :sessionId)
volunteerRouter.post(
  "/volunteer/sessions/:id/authorize-resume",
  requireAuth,
  requireRole(staffRoles),
  validateBody(authorizeResumeSchema),
  VolunteerController.authorizeResume
);

volunteerRouter.post(
  "/volunteer/sessions/:sessionId/authorize-resume",
  requireAuth,
  requireRole(staffRoles),
  validateBody(authorizeResumeSchema),
  VolunteerController.authorizeResume
);
