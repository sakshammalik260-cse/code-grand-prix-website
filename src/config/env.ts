// ==============================================================================
// CODE GRAND PRIX 2026 — ENVIRONMENT CONFIGURATION PARSER & VALIDATOR
// ==============================================================================

import dotenv from "dotenv";
import { isIP } from "node:net";
import { z } from "zod";

// Load .env file
dotenv.config();

const positiveInt = (fallback: number, min: number, max: number) =>
  z.string().default(String(fallback)).transform(Number).pipe(z.number().int().min(min).max(max));
const csv = (value: string) => value.split(",").map(item => item.trim()).filter(Boolean);
const webOrigin = (value: string) => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && url.origin === value;
  } catch { return false; }
};
const trustedProxy = (value: string) => {
  const [address, prefix, extra] = value.split("/");
  const version = isIP(address);
  return version !== 0 && extra === undefined &&
    (prefix === undefined || (/^\d+$/.test(prefix) && Number(prefix) > 0 && Number(prefix) <= (version === 4 ? 32 : 128)));
};
const postgresUrl = z.string().url().refine(value => /^postgres(ql)?:\/\//.test(value), "Use a PostgreSQL URL.");
const durationUnits = { s: 1, m: 60, h: 3600, d: 86400 } as const;

const envSchema = z
  .object({
    PORT: positiveInt(4000, 1, 65535),
    CGP_BIND_ADDRESS: z.string().default("127.0.0.1").refine(value => isIP(value) !== 0, "Use a bind IP address."),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    API_BASE_URL: z.string().default("http://localhost:4000"),
    ALLOWED_ORIGINS: z.string()
      .default("http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173")
      .transform(csv).pipe(z.array(z.string().refine(webOrigin, "Use an exact web origin."))),
    TRUST_PROXY: z.string().default("").transform(csv)
      .pipe(z.array(z.string().refine(trustedProxy, "Use a proxy IP address or CIDR."))),
    DATABASE_URL: postgresUrl,
    ALLOW_DEV_FALLBACK: z
      .enum(["true", "false"])
      .default("false")
      .transform((val) => val === "true"),
    JWT_SECRET: z.string().min(8, "JWT_SECRET must be at least 8 characters"),
    JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/).default("8h")
      .transform(value => Number(value.slice(0, -1)) * durationUnits[value.at(-1) as keyof typeof durationUnits])
      .pipe(z.number().int().min(1).max(30 * 86400)),
    COOKIE_SECRET: z.string().default("cgp-cookie-secret"),
    COOKIE_SECURE: z
      .string()
      .default("false")
      .transform((val) => val === "true"),
    COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
    LOGIN_RATE_LIMIT_STORE: z.enum(["memory", "postgres"]).optional(),
    LOGIN_SOURCE_LIMIT: positiveInt(250, 20, 10000),
    CONTEST_ID: z.string().default("cgp_2026"),
    CONTEST_ROUND_ID: z.string().default("round-1"),
    CONTEST_ROUND_NAME: z.string().default("Round 1"),
    CONTEST_START_TIME: z.string().default("2026-01-01T00:00:00Z"),
    CONTEST_END_TIME: z.string().default("2030-01-01T00:00:00Z"),
    CONTEST_STATUS: z
      .enum(["UPCOMING", "WAITING", "LIVE", "PAUSED", "PAUSED_BY_ORGANIZER", "ENDED", "FINISHED"])
      .default("LIVE"),
    JUDGE_PROVIDER: z.enum(["local", "judge0", "piston"]).default("local"),
    JUDGE0_AUTH_MODE: z.enum(["self-hosted", "rapidapi"]).default("self-hosted"),
    JUDGE0_AUTH_HEADER: z.string().default("X-Auth-Token"),
    JUDGE0_RAPIDAPI_HOST: z.string().default("judge0-ce.p.rapidapi.com"),
    JUDGE0_RAPIDAPI_KEY: z.string().default(""),
    JUDGE0_API_URL: z.string().default("http://localhost:2358"),
    JUDGE0_API_KEY: z.string().default(""),
    PISTON_API_URL: z.string().default("http://127.0.0.1:2000"),
    PISTON_API_TOKEN: z.string().default(""),
    PISTON_PYTHON_VERSION: z.string().optional(),
    PISTON_JAVA_VERSION: z.string().optional(),
    PISTON_JAVA_SOURCE_CPU_ALLOWANCE_MS: positiveInt(0, 0, 10000),
    PISTON_CPP_VERSION: z.string().optional(),
    PISTON_JAVASCRIPT_VERSION: z.string().optional(),
    PISTON_COMPILE_MEMORY_MB: positiveInt(512, 128, 4096),
    PISTON_MAX_RUN_MEMORY_MB: positiveInt(4096, 16, 4096),
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
      message: "C01 FATAL: Local runner is disabled in production. Select an isolated judge provider.",
      path: ["JUDGE_PROVIDER"]
    }
  );

export const env = envSchema.parse(process.env);
if (env.PISTON_JAVA_SOURCE_CPU_ALLOWANCE_MS > 0 &&
    !/^\d+\.\d+\.\d+$/.test(env.PISTON_JAVA_VERSION ?? "")) {
  throw new Error("A Java source CPU allowance requires an exact PISTON_JAVA_VERSION.");
}
export const loginRateLimitStore = env.LOGIN_RATE_LIMIT_STORE ?? (env.NODE_ENV === "development" ? "memory" : "postgres");

if (env.COOKIE_SAME_SITE === "none" && !env.COOKIE_SECURE) {
  throw new Error("COOKIE_SAME_SITE=none requires COOKIE_SECURE=true.");
}
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
  if (env.COOKIE_SECRET.length < 32 || env.COOKIE_SECRET.includes("replace-in-prod") ||
      env.COOKIE_SECRET === env.JWT_SECRET) {
    throw new Error("Production requires a separate high-entropy COOKIE_SECRET of at least 32 characters.");
  }
  if (!env.ALLOWED_ORIGINS.length || env.ALLOWED_ORIGINS.some(origin => !origin.startsWith("https://")) ||
      !webOrigin(env.API_BASE_URL) || !env.API_BASE_URL.startsWith("https://")) {
    throw new Error("Production requires an HTTPS API_BASE_URL origin and explicit HTTPS ALLOWED_ORIGINS.");
  }
  if (!env.TRUST_PROXY.length || loginRateLimitStore !== "postgres") {
    throw new Error("Production requires explicit TRUST_PROXY addresses and the PostgreSQL login rate-limit store.");
  }
  const providerUrl = env.JUDGE_PROVIDER === "piston" ? process.env.PISTON_API_URL : process.env.JUDGE0_API_URL;
  if (!providerUrl) throw new Error("Production requires an explicit URL for the selected judge provider.");
}
