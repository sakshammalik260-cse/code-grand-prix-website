// ==============================================================================
// CODE GRAND PRIX 2026 — LEADERBOARD & PROGRESS ROUTES
// ==============================================================================

import { Router } from "express";
import { LeaderboardController } from "../controllers/leaderboard.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { Role } from "@prisma/client";

export const leaderboardRouter = Router();

leaderboardRouter.get("/leaderboard", LeaderboardController.getLeaderboard);
leaderboardRouter.get("/contest/progress", requireAuth, LeaderboardController.getProgress);
leaderboardRouter.get("/contest/results/visibility", LeaderboardController.getVisibility);

// Admin toggle for leaderboard visibility
leaderboardRouter.post(
  "/admin/results/visibility",
  requireAuth,
  requireRole([Role.ADMIN]),
  LeaderboardController.setVisibility
);
