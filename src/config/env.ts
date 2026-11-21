// ==============================================================================
// CODE GRAND PRIX 2026 — ENVIRONMENT CONFIGURATION PARSER & VALIDATOR
// ==============================================================================

import dotenv from "dotenv";
import { z } from "zod";

// Load .env file
dotenv.config();

const positiveInt = (fallback: number, min: number, max: number) =>
  z.string().default(String(fallback)).transform(Number).pipe(z.number().int().min(min).max(max));

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
    ALLOW_TRUSTED_LOCAL_JUDGE: z.enum(["true", "false"]).default("false").transform(value => value === "true"),
    JUDGE0_LANGUAGE_PYTHON: z.string().default("Python (3.8.1)"),
    JUDGE0_LANGUAGE_JAVA: z.string().default("Java (OpenJDK 13.0.1)"),
    JUDGE0_LANGUAGE_CPP: z.string().default("C++ (GCC 9.2.0)"),
    JUDGE0_LANGUAGE_JAVASCRIPT: z.string().default("JavaScript (Node.js 12.14.0)"),
    JUDGE0_HTTP_TIMEOUT_MS: positiveInt(4000, 100, 15000),
    JUDGE0_JOB_TIMEOUT_MS: positiveInt(150000, 500, 300000),
    JUDGE0_POLL_INTERVAL_MS: positiveInt(250, 50, 3000),
    JUDGE_REQUEST_TIMEOUT_MS: positiveInt(180000, 500, 600000),
    JUDGE_MAX_CONCURRENT_REQUESTS: positiveInt(4, 1, 32),
    JUDGE_MAX_CASES: positiveInt(100, 1, 200),
    MAX_SOURCE_CODE_BYTES: positiveInt(65536, 1, 262144),
    MAX_CUSTOM_INPUT_BYTES: positiveInt(65536, 1, 262144),
    DEFAULT_TIME_LIMIT_MS: z.string().default("2000").transform(Number),
    DEFAULT_MEMORY_LIMIT_MB: z.string().default("256").transform(Number),
    MAX_OUTPUT_BYTES: positiveInt(65536, 1024, 262144),
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

if (env.NODE_ENV === "production") {
  if (env.ALLOW_DEV_FALLBACK) {
    throw new Error("Production requires ALLOW_DEV_FALLBACK=false; refusing in-memory competition state.");
  }
  if (env.JWT_SECRET.length < 32 || env.JWT_SECRET.includes("replace-in-prod")) {
    throw new Error("Production requires a unique, high-entropy JWT_SECRET of at least 32 characters.");
  }
  if (!env.COOKIE_SECURE) {
    throw new Error("Production requires COOKIE_SECURE=true behind HTTPS.");
  }
}
