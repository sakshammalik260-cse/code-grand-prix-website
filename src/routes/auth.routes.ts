// ==============================================================================
// CODE GRAND PRIX 2026 — AUTHENTICATION ROUTES
// ==============================================================================

import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AuthController, loginSchema } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { ERROR_CODES } from "../constants/index.js";

export const authRouter = Router();

// Rate limiter for authentication attempts (15 attempts per 15 minutes per IP)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: "Too many login attempts. Please wait 15 minutes before trying again."
    }
  }
});

authRouter.post("/auth/login", loginLimiter, validateBody(loginSchema), AuthController.login);
authRouter.get("/auth/me", requireAuth, AuthController.getMe);
authRouter.post("/auth/logout", requireAuth, AuthController.logout);
