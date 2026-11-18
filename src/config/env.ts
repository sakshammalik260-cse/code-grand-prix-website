// ==============================================================================
// CODE GRAND PRIX 2026 — ENVIRONMENT CONFIGURATION PARSER & VALIDATOR
// ==============================================================================

import dotenv from "dotenv";
import { z } from "zod";

// Load .env file
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("4000").transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_BASE_URL: z.string().default("http://localhost:4000"),
  ALLOWED_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://localhost:5173")
    .transform((val) => val.split(",").map((s) => s.trim())),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(8, "JWT_SECRET must be at least 8 characters"),
  JWT_EXPIRES_IN: z.string().default("8h"),
  COOKIE_SECRET: z.string().default("cgp-cookie-secret"),
  COOKIE_SECURE: z
    .string()
    .default("false")
    .transform((val) => val === "true"),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  CONTEST_ID: z.string().default("cgp_2026"),
  CONTEST_START_TIME: z.string().default("2026-11-23T05:30:00Z"),
  CONTEST_END_TIME: z.string().default("2026-11-23T08:30:00Z"),
  CONTEST_STATUS: z.enum(["UPCOMING", "LIVE", "PAUSED", "ENDED"]).default("LIVE"),
  JUDGE_PROVIDER: z.enum(["local", "judge0"]).default("local"),
  JUDGE0_API_URL: z.string().default("http://localhost:2358"),
  JUDGE0_API_KEY: z.string().default(""),
  JUDGE0_WAIT_FOR_RESULT: z
    .string()
    .default("true")
    .transform((val) => val === "true"),
  MAX_SOURCE_CODE_BYTES: z.string().default("65536").transform(Number),
  DEFAULT_TIME_LIMIT_MS: z.string().default("2000").transform(Number),
  DEFAULT_MEMORY_LIMIT_MB: z.string().default("256").transform(Number),
  MAX_OUTPUT_BYTES: z.string().default("65536").transform(Number),
  POINTS_EASY: z.string().default("100").transform(Number),
  POINTS_MEDIUM: z.string().default("250").transform(Number),
  POINTS_HARD: z.string().default("500").transform(Number),
  WRONG_SUBMISSION_PENALTY_MINUTES: z.string().default("20").transform(Number),
  CRITICAL_INCIDENT_TYPES: z
    .string()
    .default("TAB_HIDDEN,FULLSCREEN_EXIT,CAMERA_TRACK_ENDED")
    .transform((val) => val.split(",").map((s) => s.trim())),
  LOG_ONLY_INCIDENT_TYPES: z
    .string()
    .default("WINDOW_BLUR,NETWORK_RECONNECT")
    .transform((val) => val.split(",").map((s) => s.trim()))
});

export const env = envSchema.parse(process.env);
