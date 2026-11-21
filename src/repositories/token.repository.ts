import { env } from "../config/env.js";
// ==============================================================================
// CODE GRAND PRIX 2026 — TOKEN REVOCATION REPOSITORY
// ==============================================================================

import { prisma } from "../config/database.js";

// In-memory set for high-speed token revocation check
const inMemoryRevokedTokens = new Set<string>();

export class TokenRepository {
  /**
   * Mark a token as revoked
   */
  static async revokeToken(token: string, expiresAt: Date): Promise<void> {
    inMemoryRevokedTokens.add(token);

    try {
      await prisma.revokedToken.create({
        data: {
          token,
          expiresAt
        }
      });
    } catch (error) {
      if (env.NODE_ENV === "production") throw error;
    }
  }

  /**
   * Check if a token has been revoked
   */
  static async isTokenRevoked(token: string): Promise<boolean> {
    if (inMemoryRevokedTokens.has(token)) {
      return true;
    }

    try {
      const found = await prisma.revokedToken.findUnique({
        where: { token }
      });
      if (found) {
        inMemoryRevokedTokens.add(token);
        return true;
      }
    } catch (error) {
      if (env.NODE_ENV === "production") throw error;
    }

    return false;
  }
}
