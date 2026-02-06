import type { HttpMethod } from "../models/endpoint.js";

/**
 * Supported HTTP methods for OpenAPI operations
 */
export const HTTP_METHODS = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "options",
  "head",
] as const;

// Re-export HttpMethod from endpoint.ts
export type { HttpMethod };
