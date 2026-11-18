// ==============================================================================
// CODE GRAND PRIX 2026 — HEALTH CHECK & DIAGNOSTICS ROUTES
// ==============================================================================

import { Router, Request, Response } from "express";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";

export const healthRouter = Router();

healthRouter.get("/health", async (req: Request, res: Response) => {
  let dbStatus = "disconnected";
  try {
    // Quick probe to check DB connectivity
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch {
    dbStatus = "unreachable";
  }

  const response = {
    status: dbStatus === "connected" ? "healthy" : "degraded",
    contestId: env.CONTEST_ID,
    contestStatus: env.CONTEST_STATUS,
    judgeProvider: env.JUDGE_PROVIDER,
    serverTime: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbStatus,
    version: "1.0.0"
  };

  res.status(dbStatus === "connected" ? 200 : 503).json(response);
});
