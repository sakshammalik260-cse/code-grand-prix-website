// ==============================================================================
// CODE GRAND PRIX 2026 — PROBLEM & LANGUAGE SERVICE
// ==============================================================================

import { SUPPORTED_LANGUAGES } from "../constants/index.js";
import { ERROR_CODES } from "../constants/index.js";
import { AppError } from "../middleware/error.middleware.js";
import { ProblemRepository } from "../repositories/problem.repository.js";

export class ProblemService {
  /**
   * Get all published problems
   */
  static async getProblems() {
    return await ProblemRepository.findAllPublic();
  }

  /**
   * Get public details of a single problem (sanitized, no hidden tests)
   */
  static async getProblemById(idOrSlug: string) {
    const problem = await ProblemRepository.findByIdPublic(idOrSlug);
    if (!problem) {
      throw new AppError(
        404,
        ERROR_CODES.RESOURCE_NOT_FOUND,
        `Problem with identifier '${idOrSlug}' was not found.`
      );
    }
    return problem;
  }

  /**
   * Get all supported programming languages and starter templates
   */
  static getLanguages() {
    return SUPPORTED_LANGUAGES;
  }
}
