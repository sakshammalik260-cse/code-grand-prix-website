// ==============================================================================
// CODE GRAND PRIX 2026 — GLOBAL ERROR & NOT FOUND MIDDLEWARE
// ==============================================================================

import { Request, Response, NextFunction } from "express";
import { ERROR_CODES, ErrorCode } from "../constants/index.js";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;
  public readonly details?: unknown;

  constructor(statusCode: number, errorCode: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist.`
    }
  });
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const requestId = req.headers["x-request-id"] || "unknown";

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      requestId,
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details
      }
    });
    return;
  }

  // Handle unexpected or internal errors safely
  console.error(`[Error] Request ID ${requestId}:`, err);

  res.status(500).json({
    success: false,
    requestId,
    error: {
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: "An internal server error occurred. Please contact race control."
    }
  });
}
