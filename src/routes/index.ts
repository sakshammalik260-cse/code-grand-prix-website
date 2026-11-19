// ==============================================================================
// CODE GRAND PRIX 2026 — MASTER API ROUTER
// ==============================================================================

import { Router } from "express";
import { healthRouter } from "./health.routes.js";
import { authRouter } from "./auth.routes.js";
import { checkinRouter } from "./checkin.routes.js";
import { contestRouter } from "./contest.routes.js";
import { problemRouter } from "./problem.routes.js";
import { submissionRouter } from "./submission.routes.js";
import { violationRouter } from "./violation.routes.js";
import { volunteerRouter } from "./volunteer.routes.js";
import { hintRouter } from "./hint.routes.js";
import { leaderboardRouter } from "./leaderboard.routes.js";
import { adminRouter } from "./admin.routes.js";

export const apiRouter = Router();

// 1. Health & Diagnostics
apiRouter.use(healthRouter);

// 2. Authentication & Identity
apiRouter.use(authRouter);

// 3. Pre-Race Check-in & Session
apiRouter.use(checkinRouter);

// 4. Contest Clock & State
apiRouter.use(contestRouter);

// 5. Problems & Supported Languages
apiRouter.use(problemRouter);

// 6. Code Execution & Judging Submissions
apiRouter.use(submissionRouter);

// 7. Violations & Anti-Cheat Monitoring
apiRouter.use(violationRouter);

// 8. Volunteer Race Control & Bulk Resume
apiRouter.use(volunteerRouter);

// 9. Race Assist Hints
apiRouter.use(hintRouter);

// 10. Leaderboard, Results & Candidate Progress
apiRouter.use(leaderboardRouter);

// 11. Admin Question Management
apiRouter.use(adminRouter);
