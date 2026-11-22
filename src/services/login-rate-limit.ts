import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { prisma } from "../config/database.js";
import { env, loginRateLimitStore } from "../config/env.js";
import { ERROR_CODES } from "../constants/index.js";
import { AppError } from "../middleware/error.middleware.js";

const windowMs = 15 * 60 * 1000;
const pairLimit = 8;
const accountLimit = 20;
const shared = loginRateLimitStore === "postgres";
type Bucket = { attempts: number; expiresAt: Date };
type Reservation = { key: string; expiresAt: Date };
const memory = new Map<string, Bucket>();
let nextSweep = 0;

function sourceNetwork(address: string) {
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
  if (mapped) return mapped[1];
  if (isIP(address) === 4) return address;
  const host = address.split("%")[0];
  if (isIP(host) !== 6) return "unknown";

  // WHATWG URL canonicalizes equivalent spellings before grouping IPv6 by /64.
  const canonical = new URL(`http://[${host}]`).hostname.slice(1, -1);
  const [left, right] = canonical.split("::");
  const prefix = left ? left.split(":") : [];
  const suffix = right ? right.split(":") : [];
  const parts = right === undefined ? prefix :
    [...prefix, ...Array<string>(8 - prefix.length - suffix.length).fill("0"), ...suffix];
  if (parts.slice(0, 6).join(":") === "0:0:0:0:0:ffff") {
    const high = parseInt(parts[6], 16);
    const low = parseInt(parts[7], 16);
    return [high >> 8, high & 255, low >> 8, low & 255].join(".");
  }
  return parts.slice(0, 4).join(":") + "::/64";
}

function bucketKey(...parts: string[]) {
  return createHmac("sha256", env.JWT_SECRET).update(JSON.stringify(["login", ...parts])).digest("hex");
}

async function sweep(now: Date) {
  if (now.getTime() < nextSweep) return;
  nextSweep = now.getTime() + 60000;
  if (shared) {
    await prisma.$executeRaw`DELETE FROM "login_rate_buckets" WHERE "expiresAt" <= CURRENT_TIMESTAMP`;
  } else {
    for (const [key, bucket] of memory) if (bucket.expiresAt <= now) memory.delete(key);
  }
}

async function reserve(key: string, limit: number, now: Date): Promise<Bucket> {
  if (shared) {
    const [bucket] = await prisma.$queryRaw<Bucket[]>`
      INSERT INTO "login_rate_buckets" AS bucket ("key", "attempts", "expiresAt")
      VALUES (${key}, 1, (CURRENT_TIMESTAMP) + INTERVAL '15 minutes')
      ON CONFLICT ("key") DO UPDATE SET
        "attempts" = CASE WHEN bucket."expiresAt" <= CURRENT_TIMESTAMP
          THEN 1 ELSE LEAST(bucket."attempts" + 1, ${limit + 1}) END,
        "expiresAt" = CASE WHEN bucket."expiresAt" <= CURRENT_TIMESTAMP
          THEN EXCLUDED."expiresAt" ELSE bucket."expiresAt" END
      RETURNING "attempts", "expiresAt"
    `;
    return bucket;
  }

  const previous = memory.get(key);
  const bucket = previous && previous.expiresAt > now
    ? { ...previous, attempts: Math.min(limit + 1, previous.attempts + 1) }
    : { attempts: 1, expiresAt: new Date(now.getTime() + windowMs) };
  memory.set(key, bucket);
  return bucket;
}

export class LoginThrottled extends AppError {
  constructor(readonly retryAfter: number) {
    super(429, ERROR_CODES.RATE_LIMIT_EXCEEDED, "Too many login attempts. Wait before trying again.");
  }
}

export async function beginLogin(address: string, driverId: string): Promise<Reservation[]> {
  const now = new Date();
  await sweep(now);
  const source = sourceNetwork(address);
  const identity = driverId.toLowerCase();
  const limits = [
    { key: bucketKey("source", source), limit: env.LOGIN_SOURCE_LIMIT },
    { key: bucketKey("pair", source, identity), limit: pairLimit },
    { key: bucketKey("account", identity), limit: accountLimit }
  ];
  const reservations: Reservation[] = [];
  for (const { key, limit } of limits) {
    const bucket = await reserve(key, limit, now);
    if (bucket.attempts > limit) {
      throw new LoginThrottled(Math.max(1, Math.ceil((bucket.expiresAt.getTime() - Date.now()) / 1000)));
    }
    reservations.push({ key, expiresAt: bucket.expiresAt });
  }
  return reservations;
}

export async function refundLogin(reservations: Reservation[]) {
  for (const { key, expiresAt } of reservations) {
    if (shared) {
      await prisma.$executeRaw`
        UPDATE "login_rate_buckets" SET "attempts" = "attempts" - 1
        WHERE "key" = ${key} AND "expiresAt" = ${expiresAt}
          AND "attempts" > 0
      `;
    } else {
      const bucket = memory.get(key);
      if (bucket?.expiresAt === expiresAt && bucket.attempts > 0) bucket.attempts--;
    }
  }
}
