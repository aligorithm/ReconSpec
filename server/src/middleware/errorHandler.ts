import { Request, Response, NextFunction } from "express";

/**
 * Standard error response shape
 */
export interface ErrorResponse {
  error: string;
  details?: string;
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
): void {
  console.error("Error:", err);
  console.error("Stack:", err.stack);

  // Don't send response if headers already sent
  if (res.headersSent) {
    console.error("Headers already sent, cannot send error response");
    return;
  }

  // Handle specific error types
  if (err.name === "SyntaxError") {
    res.status(400).json({
      error: "Invalid JSON or YAML syntax",
      details: err.message,
    });
    return;
  }

  // Default error response - always show details for debugging
  const errorResponse: ErrorResponse = {
    error: "Internal server error",
    details: err.message,
  };

  res.status(500).json(errorResponse);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
