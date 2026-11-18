// ==============================================================================
// CODE GRAND PRIX 2026 — MASTER API ROUTER
// ==============================================================================

import { Router } from "express";
import { healthRouter } from "./health.routes.js";
import { authRouter } from "./auth.routes.js";
import { checkinRouter } from "./checkin.routes.js";
import { contestRouter } from "./contest.routes.js";
import { problemRouter } from "./problem.routes.js";

export const apiRouter = Router();

// 1. Health & Diagnostics
apiRouter.use(healthRouter);

// 2. Authentication & Profile
apiRouter.use(authRouter);

// 3. Pre-Race Check-in & Session
apiRouter.use(checkinRouter);

// 4. Contest Clock & State
apiRouter.use(contestRouter);

// 5. Problems & Supported Languages
apiRouter.use(problemRouter);
