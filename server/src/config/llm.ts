import type { ProviderType } from "@reconspec/shared";

/**
 * LLM provider configuration
 */
export interface LLMConfig {
  provider: ProviderType;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

/**
 * Read and validate LLM configuration from environment variables
 */
export function loadLLMConfig(): LLMConfig | null {
  const provider = process.env.LLM_PROVIDER as ProviderType | undefined;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;
  const baseUrl = process.env.LLM_BASE_URL;

  // If no provider configured, return null
  if (!provider || !apiKey) {
    return null;
  }

  // Validate provider
  const validProviders: ProviderType[] = ["anthropic", "openai"];
  if (!validProviders.includes(provider)) {
    throw new Error(
      `Invalid LLM_PROVIDER: "${provider}". Supported providers: ${validProviders.join(", ")}`
    );
  }

  // Validate model
  if (!model || model.trim().length === 0) {
    throw new Error("LLM_MODEL must be set when LLM_PROVIDER is configured");
  }

  return {
    provider,
    apiKey,
    model: model.trim(),
    baseUrl: baseUrl?.trim() || undefined,
  };
}

/**
 * Get the display name for a provider
 */
export function getProviderDisplayName(provider: ProviderType): string {
  const displayNames: Record<ProviderType, string> = {
    anthropic: "Anthropic",
    openai: "OpenAI",
  };
  return displayNames[provider];
}
