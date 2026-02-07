import OpenAI from "openai";
import type {
  ConnectionTestResult,
  LLMRequest,
  LLMResponse,
} from "@reconspec/shared";
import type { LLMGateway } from "../gateway.js";
import { normalizeError } from "../gateway.js";

/**
 * OpenAI adapter for the LLM Gateway
 * Also serves as the base pattern for OpenAI-compatible APIs (xAI, DeepSeek, OpenRouter, etc.)
 */
export class OpenAIAdapter implements LLMGateway {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string, baseUrl?: string) {
    const options: { apiKey: string; baseURL?: string } = { apiKey };

    // Set custom base URL if provided (for OpenRouter, DeepSeek, etc.)
    if (baseUrl) {
      options.baseURL = baseUrl;
    }

    this.client = new OpenAI(options);
    this.model = model;
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    try {
      // Make the API call
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: request.messages as Array<{
          role: "system" | "user" | "assistant";
          content: string;
        }>,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature || 0.7,
        response_format:
          request.responseFormat === "json"
            ? { type: "json_object" }
            : undefined,
      });

      return {
        content: response.choices[0].message.content || "",
        usage: {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
        },
        model: response.model,
      };
    } catch (error) {
      throw normalizeError(error, "OpenAI");
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: "user", content: "Respond with the word 'connected'." }],
      });

      return {
        success: true,
        model: response.model,
      };
    } catch (error) {
      const llmError = normalizeError(error, "OpenAI");
      return {
        success: false,
        model: this.model,
        error: llmError.message,
      };
    }
  }
}
