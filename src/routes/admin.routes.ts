// ==============================================================================
// CODE GRAND PRIX 2026 — ADMIN QUESTION MANAGEMENT ROUTES
// ==============================================================================

import { Router } from "express";
import { AdminController, createAdminProblemSchema } from "../controllers/admin.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { Role } from "@prisma/client";

export const adminRouter = Router();

// Staff role requirement: ADMIN only
const adminOnly = [Role.ADMIN];

adminRouter.get("/admin/overview", requireAuth, requireRole(adminOnly), AdminController.getOverview);
adminRouter.get("/admin/problems", requireAuth, requireRole(adminOnly), AdminController.listProblems);
adminRouter.post(
  "/admin/problems",
  requireAuth,
  requireRole(adminOnly),
  validateBody(createAdminProblemSchema),
  AdminController.createProblem
);
adminRouter.post(
  "/admin/problems/:id/publish",
  requireAuth,
  requireRole(adminOnly),
  AdminController.publishProblem
);
adminRouter.post(
  "/admin/problems/:id/unpublish",
  requireAuth,
  requireRole(adminOnly),
  AdminController.unpublishProblem
);
adminRouter.post(
  "/admin/problems/:id/testcases",
  requireAuth,
  requireRole(adminOnly),
  AdminController.addTestCase
);
