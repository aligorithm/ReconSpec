import type {
  ConnectionTestResult,
  LLMMessage,
  LLMRequest,
  LLMResponse,
  LLMError,
} from "@reconspec/shared";
import { AnthropicAdapter } from "./adapters/anthropic.js";
import { OpenAIAdapter } from "./adapters/openai.js";

/**
 * Provider-agnostic LLM gateway interface
 */
export interface LLMGateway {
  /**
   * Send a chat completion request to the LLM
   */
  chat(request: LLMRequest): Promise<LLMResponse>;

  /**
   * Test the connection to the LLM provider
   */
  testConnection(): Promise<ConnectionTestResult>;
}

/**
 * Factory function to create a gateway instance
 */
export function createGateway(
  provider: string,
  apiKey: string,
  model: string,
  baseUrl?: string
): LLMGateway {
  switch (provider) {
    case "anthropic":
      return new AnthropicAdapter(apiKey, model);

    case "openai":
      return new OpenAIAdapter(apiKey, model, baseUrl);

    default:
      throw new Error(
        `Provider '${provider}' is not yet supported. Supported providers: anthropic, openai`
      );
  }
}

/**
 * Normalize provider errors into consistent LLMError types
 */
export function normalizeError(
  error: unknown,
  provider: string
): LLMError {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Authentication errors (401, 403)
  if (
    errorMessage.includes("401") ||
    errorMessage.includes("403") ||
    errorMessage.includes("unauthorized") ||
    errorMessage.includes("forbidden") ||
    errorMessage.includes("authentication") ||
    errorMessage.includes("invalid api key") ||
    errorMessage.includes("api key")
  ) {
    const llmError = new Error(
      `Invalid API key for ${provider}. Please check your LLM_API_KEY.`
    ) as LLMError;
    llmError.type = "auth_error";
    llmError.retryable = false;
    return llmError;
  }

  // Rate limit errors (429)
  if (
    errorMessage.includes("429") ||
    errorMessage.includes("rate limit") ||
    errorMessage.includes("rate_limit_exceeded") ||
    errorMessage.includes("quota exceeded")
  ) {
    const llmError = new Error(
      `Rate limit exceeded for ${provider}. Please try again later.`
    ) as LLMError;
    llmError.type = "rate_limit";
    llmError.retryable = true;
    return llmError;
  }

  // Model not found (404)
  if (
    errorMessage.includes("404") ||
    errorMessage.includes("model not found") ||
    errorMessage.includes("invalid model")
  ) {
    const llmError = new Error(
      `Model not found for ${provider}. Please check your LLM_MODEL setting.`
    ) as LLMError;
    llmError.type = "model_not_found";
    llmError.retryable = false;
    return llmError;
  }

  // Invalid request (400)
  if (
    errorMessage.includes("400") ||
    errorMessage.includes("invalid request") ||
    errorMessage.includes("bad request")
  ) {
    const llmError = new Error(
      `Invalid request to ${provider}: ${errorMessage}`
    ) as LLMError;
    llmError.type = "invalid_request";
    llmError.retryable = false;
    return llmError;
  }

  // Server errors (500, 502, 503, 504)
  if (
    errorMessage.includes("500") ||
    errorMessage.includes("502") ||
    errorMessage.includes("503") ||
    errorMessage.includes("504") ||
    errorMessage.includes("server error") ||
    errorMessage.includes("internal server error") ||
    errorMessage.includes("bad gateway") ||
    errorMessage.includes("service unavailable")
  ) {
    const llmError = new Error(
      `Server error from ${provider}. Please try again later.`
    ) as LLMError;
    llmError.type = "server_error";
    llmError.retryable = true;
    return llmError;
  }

  // Network errors
  if (
    errorMessage.includes("ECONNREFUSED") ||
    errorMessage.includes("ENOTFOUND") ||
    errorMessage.includes("ETIMEDOUT") ||
    errorMessage.includes("network") ||
    errorMessage.includes("fetch") ||
    errorMessage.includes("connection")
  ) {
    const llmError = new Error(
      `Network error connecting to ${provider}. Please check your internet connection.`
    ) as LLMError;
    llmError.type = "network_error";
    llmError.retryable = true;
    return llmError;
  }

  // Default error
  const llmError = new Error(
    `Error from ${provider}: ${errorMessage}`
  ) as LLMError;
  llmError.type = "server_error";
  llmError.retryable = true;
  return llmError;
}
