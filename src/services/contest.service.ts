// ==============================================================================
// CODE GRAND PRIX 2026 — CONTEST CLOCK & STATUS SERVICE
// ==============================================================================

import { env } from "../config/env.js";
import { RoundService } from "./round.service.js";

export class ContestService {
  /**
   * Get server-authoritative contest clock and status
   */
  static async getContestClock(contestId: string = env.CONTEST_ID) {
    return RoundService.clock(contestId);
  }
}
