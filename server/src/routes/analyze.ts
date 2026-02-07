/**
 * Analysis Routes
 *
 * POST /api/analyze - Trigger Phase A analysis with SSE streaming
 * GET /api/analyze/status - Get analysis status
 */

import { Router, Request, Response } from "express";
import type { ParsedSpec } from "@reconspec/shared";
import { asyncHandler } from "../middleware/errorHandler.js";
import { analyzeSpec } from "../analysis/engine.js";

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
 * Helper to send SSE event
 */
function sendSSE(res: Response, event: string, data: any) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
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

export default router;
