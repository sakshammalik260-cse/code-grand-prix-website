// ==============================================================================
// CODE GRAND PRIX 2026 — AUTHENTICATION ROUTES
// ==============================================================================

import { Router } from "express";
import { AuthController, loginSchema } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";

export const authRouter = Router();

authRouter.post("/auth/login", validateBody(loginSchema), AuthController.login);
authRouter.get("/auth/me", requireAuth, AuthController.getMe);
authRouter.post("/auth/logout", requireAuth, AuthController.logout);
