// ==============================================================================
// CODE GRAND PRIX 2026 — CONTEST ROUTES
// ==============================================================================

import { Router } from "express";
import { ContestController } from "../controllers/contest.controller.js";

export const contestRouter = Router();

contestRouter.get("/contest", ContestController.getContest);
