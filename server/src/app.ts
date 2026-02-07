import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import specRoutes from "./routes/spec.js";
import providerRoutes from "./routes/provider.js";
import analyzeRoutes from "./routes/analyze.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { validateSpecSize } from "./middleware/validation.js";
import { loadLLMConfig, getProviderDisplayName } from "./config/llm.js";
import { createGateway } from "./llm/gateway.js";
import { createLLMError } from "@reconspec/shared";

// Load environment variables from project root
dotenv.config({ path: '../.env' });

const app = express();

// Initialize LLM Gateway
let llmGateway: any = null;
let llmConfig: any = null;

try {
  llmConfig = loadLLMConfig();
  if (llmConfig) {
    llmGateway = createGateway(
      llmConfig.provider,
      llmConfig.apiKey,
      llmConfig.model,
      llmConfig.baseUrl
    );
    console.log(
      `[LLM] Configured ${getProviderDisplayName(llmConfig.provider)} with model ${llmConfig.model}`
    );
  } else {
    console.log(
      "[LLM] No LLM provider configured. Set LLM_PROVIDER and LLM_API_KEY in .env to enable analysis."
    );
  }
} catch (error) {
  const llmError = error instanceof Error ? error.message : String(error);
  console.error(`[LLM] Failed to initialize LLM gateway: ${llmError}`);
}

// Security headers
app.use(helmet());

// CORS configuration - allow Vite dev server
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// Body parsing with size limits
// Parse text/plain, text/yaml, text/json as raw text
app.use(express.text({ limit: "2mb", type: ["text/plain", "text/yaml", "text/json", "text/*"] }));
app.use(express.json({ limit: "2mb" }));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "reconspec-server" });
});

// Store LLM gateway in app locals for access in route handlers
app.use((req, _res, next) => {
  req.app.locals.llmGateway = llmGateway;
  req.app.locals.llmConfig = llmConfig;
  next();
});

// API routes
app.use("/api/provider", providerRoutes);
app.use("/api/analyze", analyzeRoutes);
app.use("/api", specRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: "Not found",
    details: "The requested endpoint does not exist",
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
