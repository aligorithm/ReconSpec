/**
 * LLM and provider-related types
 */

/**
 * Supported AI providers
 */
export type ProviderType = "anthropic" | "openai";

/**
 * Message role in LLM chat
 */
export type LLMMessageRole = "system" | "user" | "assistant";

/**
 * A single message in an LLM conversation
 */
export interface LLMMessage {
  role: LLMMessageRole;
  content: string;
}

/**
 * Request to send to an LLM
 */
export interface LLMRequest {
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
}

/**
 * Response from an LLM
 */
export interface LLMResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  model: string;
}

/**
 * Result of testing a provider connection
 */
export interface ConnectionTestResult {
  success: boolean;
  model: string;
  error?: string;
}

/**
 * Provider status returned to the frontend
 */
export interface ProviderStatus {
  configured: boolean;
  provider?: ProviderType;
  model?: string;
}

/**
 * Normalized LLM error types
 */
export type LLMErrorType =
  | "auth_error"
  | "rate_limit"
  | "model_not_found"
  | "invalid_request"
  | "server_error"
  | "network_error"
  | "not_configured";

/**
 * Normalized LLM error
 */
export interface LLMError extends Error {
  type: LLMErrorType;
  retryable: boolean;
}

/**
 * Helper to create an LLM error
 */
export function createLLMError(
  type: LLMErrorType,
  message: string,
  retryable: boolean
): LLMError {
  const error = new Error(message) as LLMError;
  error.type = type;
  error.retryable = retryable;
  return error;
}
