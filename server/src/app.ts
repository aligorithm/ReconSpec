import express from "express";
import helmet from "helmet";
import cors from "cors";
import specRoutes from "./routes/spec.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { validateSpecSize } from "./middleware/validation.js";

const app = express();

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

// API routes
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
