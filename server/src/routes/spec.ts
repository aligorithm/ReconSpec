import { Router, Request, Response } from "express";
import { parseSpec } from "../services/specParser.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

/**
 * POST /api/spec
 * Parse and validate an OpenAPI specification
 *
 * Accepts JSON or YAML spec as request body
 * Returns normalized ParsedSpec object
 */
router.post(
  "/spec",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Get content from request body
    const contentType = req.get("content-type") || "";
    let specContent: string;
    let format: "json" | "yaml";

    if (contentType.includes("application/json")) {
      // JSON with spec field
      const body = req.body as { spec?: string };
      if (!body.spec) {
        res.status(400).json({
          error: "Missing spec field",
          details: 'Request body must contain a "spec" field with the OpenAPI specification',
        });
        return;
      }
      specContent = body.spec;
      format = "json";
    } else {
      // Raw text (YAML or JSON)
      // Body should be a string from express.text() middleware
      specContent = typeof req.body === 'string' ? req.body : String(req.body || '');

      // Detect format based on content
      const trimmed = specContent.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        format = "json";
      } else {
        format = "yaml";
      }
    }

    // Validate content is not empty
    if (!specContent || specContent.trim().length === 0) {
      res.status(400).json({
        error: "Empty spec",
        details: "The specification content is empty",
      });
      return;
    }

    // Parse the spec
    const parsedSpec = await parseSpec(specContent, format);

    res.status(200).json(parsedSpec);
  })
);

export default router;
