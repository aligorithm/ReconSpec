import Anthropic from "@anthropic-ai/sdk";
import type {
  ConnectionTestResult,
  LLMMessage,
  LLMRequest,
  LLMResponse,
} from "@reconspec/shared";
import type { LLMGateway } from "../gateway.js";
import { normalizeError } from "../gateway.js";

/**
 * Anthropic adapter for the LLM Gateway
 */
export class AnthropicAdapter implements LLMGateway {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    try {
      // Extract system message from messages array
      const systemMessage = request.messages.find(
        (m) => m.role === "system"
      )?.content;

      // Filter out system message from user/assistant messages
      const messages = request.messages.filter(
        (m) => m.role !== "system"
      ) as Array<{ role: "user" | "assistant"; content: string }>;

      // Make the API call
      const response = await this.client.messages.create({
        model: this.model,
        system: systemMessage,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature || 0.7,
      });

      // Extract content from response blocks
      let content = "";
      for (const block of response.content) {
        if (block.type === "text") {
          content += block.text;
        }
      }

      return {
        content,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
        model: response.model,
      };
    } catch (error) {
      throw normalizeError(error, "Anthropic");
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: "user", content: "Respond with the word 'connected'." }],
      });

      return {
        success: true,
        model: response.model,
      };
    } catch (error) {
      const llmError = normalizeError(error, "Anthropic");
      return {
        success: false,
        model: this.model,
        error: llmError.message,
      };
    }
  }
}
