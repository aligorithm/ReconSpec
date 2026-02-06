import { Router, Request, Response } from "express";
import {
  ConnectionTestResult,
  ProviderStatus,
  createLLMError,
} from "@reconspec/shared";
import { asyncHandler } from "../middleware/errorHandler.js";
import { getProviderDisplayName } from "../config/llm.js";

const router = Router();

/**
 * GET /api/provider/status
 * Returns the current provider configuration status
 */
router.get(
  "/status",
  asyncHandler(async (req: Request, res: Response<ProviderStatus>) => {
    // Get the gateway instance from the app locals
    const gateway = req.app.locals.llmGateway;
    const config = req.app.locals.llmConfig;

    if (!gateway || !config) {
      res.json({ configured: false });
      return;
    }

    res.json({
      configured: true,
      provider: config.provider,
      model: config.model,
    });
  })
);

/**
 * POST /api/provider/test
 * Tests the connection to the configured provider
 */
router.post(
  "/test",
  asyncHandler(async (req: any, res: Response<ConnectionTestResult>) => {
    const gateway = req.app.locals.llmGateway;

    if (!gateway) {
      res.status(400).json({
        success: false,
        model: "none",
        error: "No LLM provider configured. Set LLM_PROVIDER and LLM_API_KEY in .env",
      });
      return;
    }

    const result = await gateway.testConnection();
    res.status(result.success ? 200 : 500).json(result);
  })
);

export default router;
