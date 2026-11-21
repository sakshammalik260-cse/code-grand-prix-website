// ==============================================================================
// CODE GRAND PRIX 2026 — PRISMA DATABASE CLIENT SINGLETON
// ==============================================================================

import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ||
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export async function connectDatabase(): Promise<boolean> {
  try {
    await prisma.$connect();
    console.log("✅ Successfully connected to PostgreSQL database via Prisma.");
    return true;
  } catch (error) {
    console.error("❌ Failed to connect to PostgreSQL database:", error);
    if (env.NODE_ENV === "production") throw error;
    return false;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
