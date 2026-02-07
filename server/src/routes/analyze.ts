/**
 * Analysis Routes
 *
 * POST /api/analyze - Trigger Phase A analysis with SSE streaming
 * GET /api/analyze/status - Get analysis status
 * POST /api/analyze/deep-dive - Generate deep dive for a vulnerability
 */

import { Router, Request, Response } from "express";
import type { ParsedSpec } from "@reconspec/shared";
import { asyncHandler } from "../middleware/errorHandler.js";
import { analyzeSpec, generateDeepDive } from "../analysis/engine.js";

const router = Router();

// Store for currently running analysis (in-memory, single analysis at a time)
let currentAnalysis: {
  isRunning: boolean;
  startedAt: string | null;
  specHash: string | null;
  completedAt: string | null;
} = {
  isRunning: false,
  startedAt: null,
  specHash: null,
  completedAt: null,
};

/**
 * Recursively sanitize all string values in an object to prevent XSS
 * This ensures that any user-controlled content (descriptions, summaries, payloads, etc.)
 * is HTML-escaped before being sent to the frontend
 */
function deepSanitize(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle strings - escape HTML entities
  if (typeof obj === 'string') {
    return obj
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitize(item));
  }

  // Handle objects - recursively sanitize all properties
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = deepSanitize(value);
    }
    return sanitized;
  }

  // Return other primitives (numbers, booleans) as-is
  return obj;
}

/**
 * Helper to send SSE event
 * Sanitizes event names and all data content to prevent XSS injection
 */
function sendSSE(res: Response, event: string, data: any) {
  // SSE event names should only contain safe characters (alphanumeric, dash, underscore, dot)
  const sanitizedEvent = event.replace(/[^a-zA-Z0-9_.-]/g, '');

  // Deep sanitize all data to prevent XSS in string content
  const sanitizedData = deepSanitize(data);

  res.write(`event: ${sanitizedEvent}\n`);
  res.write(`data: ${JSON.stringify(sanitizedData)}\n\n`);
}

/**
 * POST /api/analyze
 *
 * Triggers Phase A analysis for the provided spec.
 * Streams progress via Server-Sent Events.
 */
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    // Check if LLM gateway is available
    const gateway = req.app.locals.llmGateway;
    if (!gateway) {
      res.status(400).json({
        error: "No LLM provider configured. Set LLM_PROVIDER and LLM_API_KEY in .env",
      });
      return;
    }

    // Check if analysis is already running
    if (currentAnalysis.isRunning) {
      res.status(409).json({
        error: "Analysis already in progress",
      });
      return;
    }

    const spec = req.body as ParsedSpec;

    // Validate spec
    if (!spec || !spec.tagGroups || !Array.isArray(spec.tagGroups)) {
      res.status(400).json({
        error: "Invalid spec format",
      });
      return;
    }

    // Store spec in app.locals for deep dive routes
    req.app.locals.currentSpec = spec;

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

    // Mark analysis as running
    currentAnalysis.isRunning = true;
    currentAnalysis.startedAt = new Date().toISOString();
    currentAnalysis.completedAt = null;

    try {
      // Run analysis
      const result = await analyzeSpec(
        gateway,
        spec,
        (event) => {
          sendSSE(res, event.type, event.data);

          // Update the stored spec with assessment data as endpoints complete
          if (event.type === "endpoint_complete") {
            const { endpointId, assessment } = event.data;
            for (const group of req.app.locals.currentSpec.tagGroups) {
              const endpoint = group.endpoints.find((e: { id: string }) => e.id === endpointId);
              if (endpoint) {
                endpoint.assessment = assessment;
                break;
              }
            }
          }
        },
        3 // Concurrency limit
      );

      // Send final completion event with results
      const totalEndpoints = spec.tagGroups.reduce(
        (sum, group) => sum + group.endpoints.length,
        0
      );
      sendSSE(res, "complete", {
        totalScenarios: result.totalScenarios,
        totalEndpoints,
        apiSummary: result.apiSummary,
        failedEndpoints: result.failedEndpoints,
      });
    } catch (error) {
      sendSSE(res, "error", {
        error: error instanceof Error ? error.message : "Analysis failed",
      });
    } finally {
      // Mark analysis as complete
      currentAnalysis.isRunning = false;
      currentAnalysis.completedAt = new Date().toISOString();
    }

    res.end();
  })
);

/**
 * GET /api/analyze/status
 *
 * Returns whether an analysis is currently running.
 */
router.get(
  "/status",
  asyncHandler(async (req: Request, res: Response) => {
    res.json(currentAnalysis);
  })
);

/**
 * POST /api/analyze/deep-dive
 *
 * Generates a deep dive analysis for a specific vulnerability.
 */
router.post(
  "/deep-dive",
  asyncHandler(async (req: Request, res: Response) => {
    const gateway = req.app.locals.llmGateway;
    if (!gateway) {
      res.status(400).json({
        error: "No LLM provider configured. Set LLM_PROVIDER and LLM_API_KEY in .env",
      });
      return;
    }

    const { endpointId, vulnId } = req.body;

    if (!endpointId || !vulnId) {
      res.status(400).json({
        error: "Missing required fields: endpointId and vulnId",
      });
      return;
    }

    // Get the spec from session (stored during analysis)
    const spec = req.app.locals.currentSpec as ParsedSpec | undefined;
    if (!spec) {
      res.status(404).json({
        error: "No spec found. Please run an analysis first.",
      });
      return;
    }

    const result = await generateDeepDive(gateway, spec, endpointId, vulnId);

    if (!result.success || !result.data) {
      res.status(500).json({
        error: result.error || "Failed to generate deep dive",
      });
      return;
    }

    res.json(result.data);
  })
);

export default router;
