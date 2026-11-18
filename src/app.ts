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
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";

export function createApp(): Express {
  const app = express();

  // 1. Security Headers (Helmet)
  app.use(helmet());

  // 2. CORS Configuration for Frontend Integration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        if (env.ALLOWED_ORIGINS.includes(origin) || env.NODE_ENV === "development") {
          return callback(null, true);
        }
        return callback(new Error("CORS policy violation: Origin not allowed"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-request-id"]
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
