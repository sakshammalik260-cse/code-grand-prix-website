// ==============================================================================
// CODE GRAND PRIX 2026 — EXPRESS APPLICATION CONFIGURATION
// ==============================================================================

import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { v4 as uuidv4 } from "uuid";
import { env } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { AppError, errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { ERROR_CODES } from "./constants/index.js";

export function createApp(): Express {
  const app = express();
  if (env.TRUST_PROXY.length) app.set("trust proxy", env.TRUST_PROXY);

  // 1. Security Headers (Helmet)
  app.use(helmet());

  // Reject unapproved browser origins before the request reaches an API handler.
  app.use("/api", (req, _res, next) => {
    const origin = req.get("Origin");
    const safeMethod = ["GET", "HEAD", "OPTIONS"].includes(req.method);
    if ((origin !== undefined && !env.ALLOWED_ORIGINS.includes(origin)) ||
        (!origin && !safeMethod && req.get("Sec-Fetch-Site") === "cross-site")) {
      return next(new AppError(403, ERROR_CODES.FORBIDDEN_ROLE, "Request origin is not allowed."));
    }
    if (env.NODE_ENV === "production" && !req.secure && req.path !== "/health") {
      return next(new AppError(403, ERROR_CODES.FORBIDDEN_ROLE, "HTTPS is required."));
    }
    next();
  });

  // 2. CORS Configuration for Frontend Integration
  app.use(
    cors({
      origin: env.ALLOWED_ORIGINS,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-request-id", "Idempotency-Key"]
    })
  );

  // 3. Request Parsers
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // 4. Request ID & Structured Logging Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = (req.headers["x-request-id"] as string) || uuidv4();
    req.headers["x-request-id"] = requestId;
    res.setHeader("x-request-id", requestId);

    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (req.originalUrl !== "/api/health") {
        console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms [reqId: ${requestId}]`);
      }
    });

    next();
  });

  // 5. Mount API Routes under /api
  app.use("/api", apiRouter);

  // 6. Handle 404 & Global Errors
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
