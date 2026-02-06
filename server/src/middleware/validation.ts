import { Request, Response, NextFunction } from "express";

/**
 * Maximum spec file size (2MB)
 */
const MAX_SPEC_SIZE = 2 * 1024 * 1024;

/**
 * Validate request body size before processing
 */
export function validateSpecSize(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const contentLength = req.get("content-length");

  if (contentLength && parseInt(contentLength, 10) > MAX_SPEC_SIZE) {
    res.status(413).json({
      error: "Spec file too large",
      details: `Maximum size is ${MAX_SPEC_SIZE / 1024 / 1024}MB`,
    });
    return;
  }

  next();
}
