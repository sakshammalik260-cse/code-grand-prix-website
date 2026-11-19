// ==============================================================================
// CODE GRAND PRIX 2026 — ENVIRONMENT CONFIGURATION PARSER & VALIDATOR
// ==============================================================================

import dotenv from "dotenv";
import { z } from "zod";

// Load .env file
dotenv.config();

const envSchema = z
  .object({
    PORT: z.string().default("4000").transform((val) => parseInt(val, 10)),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    API_BASE_URL: z.string().default("http://localhost:4000"),
    ALLOWED_ORIGINS: z
      .string()
      .default("http://localhost:3000,http://localhost:5173")
      .transform((val) => val.split(",").map((s) => s.trim())),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    ALLOW_DEV_FALLBACK: z
      .string()
      .default("true")
      .transform((val) => val === "true"),
    JWT_SECRET: z.string().min(8, "JWT_SECRET must be at least 8 characters"),
    JWT_EXPIRES_IN: z.string().default("8h"),
    COOKIE_SECRET: z.string().default("cgp-cookie-secret"),
    COOKIE_SECURE: z
      .string()
      .default("false")
      .transform((val) => val === "true"),
    COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
    CONTEST_ID: z.string().default("cgp_2026"),
    CONTEST_ROUND_ID: z.string().default("round-1"),
    CONTEST_ROUND_NAME: z.string().default("Round 1"),
    CONTEST_START_TIME: z.string().default("2026-01-01T00:00:00Z"),
    CONTEST_END_TIME: z.string().default("2030-01-01T00:00:00Z"),
    CONTEST_STATUS: z
      .enum(["UPCOMING", "WAITING", "LIVE", "PAUSED", "PAUSED_BY_ORGANIZER", "ENDED", "FINISHED"])
      .default("LIVE"),
    JUDGE_PROVIDER: z.enum(["local", "judge0"]).default("local"),
    JUDGE0_API_URL: z.string().default("http://localhost:2358"),
    JUDGE0_API_KEY: z.string().default(""),
    JUDGE0_WAIT_FOR_RESULT: z
      .string()
      .default("true")
      .transform((val) => val === "true"),
    MAX_SOURCE_CODE_BYTES: z.string().default("65536").transform(Number),
    MAX_CUSTOM_INPUT_BYTES: z.string().default("65536").transform(Number),
    DEFAULT_TIME_LIMIT_MS: z.string().default("2000").transform(Number),
    DEFAULT_MEMORY_LIMIT_MB: z.string().default("256").transform(Number),
    MAX_OUTPUT_BYTES: z.string().default("65536").transform(Number),
    POINTS_EASY: z.string().default("100").transform(Number),
    POINTS_MEDIUM: z.string().default("250").transform(Number),
    POINTS_HARD: z.string().default("500").transform(Number),
    WRONG_SUBMISSION_PENALTY_MINUTES: z.string().default("20").transform(Number),
    CRITICAL_INCIDENT_TYPES: z
      .string()
      .default("TAB_HIDDEN,FULLSCREEN_EXIT,CAMERA_TRACK_ENDED,CAMERA_INTERRUPTED")
      .transform((val) => val.split(",").map((s) => s.trim())),
    LOG_ONLY_INCIDENT_TYPES: z
      .string()
      .default("WINDOW_BLUR,WINDOW_FOCUS_LOST,NETWORK_RECONNECT")
      .transform((val) => val.split(",").map((s) => s.trim()))
  })
  .refine(
    (data) => {
      // In production, refuse unhardened local judge runner
      if (data.NODE_ENV === "production" && data.JUDGE_PROVIDER === "local") {
        return false;
      }
      return true;
    },
    {
      message: "C01 FATAL: Local runner is disabled in production. Set JUDGE_PROVIDER=judge0.",
      path: ["JUDGE_PROVIDER"]
    }
  );

export const env = envSchema.parse(process.env);
