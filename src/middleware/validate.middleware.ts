// ==============================================================================
// CODE GRAND PRIX 2026 — REQUEST VALIDATION MIDDLEWARE
// ==============================================================================

import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ERROR_CODES } from "../constants/index.js";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: "Request validation failed.",
            details: err.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message
            }))
          }
        });
        return;
      }
      next(err);
    }
  };
}
