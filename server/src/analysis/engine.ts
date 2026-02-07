/**
 * Analysis Engine for Phase A Analysis
 *
 * Orchestrates the analysis of endpoints against the OWASP Top 10.
 */

import type { ParsedSpec, EndpointDetail, SecurityAssessment, AttackScenario } from "@reconspec/shared";
import type { LLMGateway } from "../llm/gateway.js";
import type { LLMMessage } from "@reconspec/shared";
import { buildSystemPrompt, buildUserPrompt, buildSummaryPrompt, buildDeepDiveSystemPrompt, buildDeepDiveUserPrompt, buildPayloadGenerationPrompt } from "./promptBuilder.js";
import {
  parsePhaseAResponse,
  parseAPISummaryResponse,
  toAttackScenario,
  parseDeepDiveResponse,
  parsePayloadGenerationResponse,
  type APISummaryResponse,
  type DeepDiveResponse,
  type PayloadExample,
} from "./responseParser.js";

/**
 * Progress callback for SSE streaming
 */
export type ProgressCallback = (event: {
  type: "progress" | "endpoint_complete" | "summary_complete" | "complete" | "error";
  data: any;
}) => void;

/**
 * Analysis result for a single endpoint
 */
export interface EndpointAnalysisResult {
  endpointId: string;
  success: boolean;
  assessment?: SecurityAssessment;
  error?: string;
}

/**
 * Overall analysis result
 */
export interface AnalysisResult {
  results: EndpointAnalysisResult[];
  apiSummary: APISummaryResponse | null;
  totalScenarios: number;
  failedEndpoints: number;
}

/**
 * Analyze a single endpoint
 */
async function analyzeEndpoint(
  gateway: LLMGateway,
  endpoint: EndpointDetail
): Promise<EndpointAnalysisResult> {
  const messages: LLMMessage[] = [
    { role: "system", content: buildSystemPrompt() },
    { role: "user", content: buildUserPrompt(endpoint) },
  ];

  try {
    const response = await gateway.chat({
      messages,
      temperature: 0.3,
      maxTokens: 2000,
      responseFormat: "json",
    });

    const parsed = parsePhaseAResponse(response.content, endpoint);

    if (!parsed.success || !parsed.data) {
      return {
        endpointId: endpoint.id,
        success: false,
        error: parsed.error || "Failed to parse response",
      };
    }

    // Sort scenarios by relevance score descending
    const sortedScenarios = parsed.data.scenarios.sort(
      (a, b) => b.relevanceScore - a.relevanceScore
    );

    // Convert to AttackScenario format
    const attackScenarios = sortedScenarios.map((scenario, index) =>
      toAttackScenario(scenario, index)
    );

    return {
      endpointId: endpoint.id,
      success: true,
      assessment: {
        scenarios: attackScenarios,
        analyzedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      endpointId: endpoint.id,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Generate API-level summary
 */
async function generateAPISummary(
  gateway: LLMGateway,
  spec: ParsedSpec,
  analysisResults: Array<{
    endpoint: EndpointDetail;
    result: EndpointAnalysisResult;
  }>,
  onProgress: ProgressCallback
): Promise<APISummaryResponse | null> {
  const endpointSummaries = analysisResults
    .filter(({ result }) => result.success && result.assessment)
    .map(({ endpoint, result }) => ({
      method: endpoint.method,
      path: endpoint.path,
      scenarios: result.assessment!.scenarios.map((s) => ({
        name: s.name,
        categoryId: s.category,
      })),
    }));

  const totalScenarios = endpointSummaries.reduce(
    (sum, ep) => sum + ep.scenarios.length,
    0
  );

  const prompt = buildSummaryPrompt(
    spec.title,
    spec.description,
    endpointSummaries,
    totalScenarios,
    spec.tagGroups.flatMap((g) => g.endpoints).length
  );

  const messages: LLMMessage[] = [
    {
      role: "system",
      content:
        "You are an API security analyst. Analyze the assessment results and return ONLY a JSON response.",
    },
    { role: "user", content: prompt },
  ];

  try {
    const response = await gateway.chat({
      messages,
      temperature: 0.4,
      maxTokens: 1500,
      responseFormat: "json",
    });

    const parsed = parseAPISummaryResponse(response.content);

    if (parsed.success && parsed.data) {
      onProgress({
        type: "summary_complete",
        data: parsed.data,
      });
      return parsed.data;
    }

    return null;
  } catch (error) {
    console.error("Failed to generate API summary:", error);
    return null;
  }
}

/**
 * Analyze all endpoints in the spec
 */
export async function analyzeSpec(
  gateway: LLMGateway,
  spec: ParsedSpec,
  onProgress: ProgressCallback,
  concurrencyLimit: number = 3
): Promise<AnalysisResult> {
  const results: EndpointAnalysisResult[] = [];
  // Flatten endpoints from all tag groups
  const endpoints = spec.tagGroups.flatMap((group) => group.endpoints);
  const total = endpoints.length;
  let completed = 0;

  // Process endpoints with concurrency limit
  for (let i = 0; i < endpoints.length; i += concurrencyLimit) {
    const batch = endpoints.slice(i, i + concurrencyLimit);

    const batchPromises = batch.map(async (endpoint) => {
      const result = await analyzeEndpoint(gateway, endpoint);
      completed++;

      onProgress({
        type: "progress",
        data: {
          completed,
          total,
          currentEndpoint: `${endpoint.method.toUpperCase()} ${endpoint.path}`,
        },
      });

      if (result.success) {
        onProgress({
          type: "endpoint_complete",
          data: {
            endpointId: endpoint.id,
            assessment: result.assessment,
          },
        });
      } else {
        onProgress({
          type: "error",
          data: {
            endpointId: endpoint.id,
            error: result.error || "Unknown error",
          },
        });
      }

      return { endpoint, result };
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.map((r) => r.result));
  }

  // Calculate total scenarios
  const totalScenarios = results.reduce(
    (sum, r) => sum + (r.assessment?.scenarios.length || 0),
    0
  );

  // Generate API-level summary
  const analysisResults = endpoints.map((endpoint, idx) => ({
    endpoint,
    result: results[idx],
  }));

  const apiSummary = await generateAPISummary(
    gateway,
    spec,
    analysisResults,
    onProgress
  );

  // Count failures
  const failedEndpoints = results.filter((r) => !r.success).length;

  onProgress({
    type: "complete",
    data: {
      totalScenarios,
      totalEndpoints: total,
    },
  });

  return {
    results,
    apiSummary,
    totalScenarios,
    failedEndpoints,
  };
}

/**
 * Find an endpoint by ID in the spec
 */
function findEndpointById(spec: ParsedSpec, endpointId: string): EndpointDetail | null {
  for (const group of spec.tagGroups) {
    const endpoint = group.endpoints.find((e) => e.id === endpointId);
    if (endpoint) return endpoint;
  }
  return null;
}

/**
 * Generate a deep dive for a specific attack scenario
 */
export async function generateDeepDive(
  gateway: LLMGateway,
  spec: ParsedSpec,
  endpointId: string,
  scenarioId: string
): Promise<{ success: boolean; data?: DeepDiveResponse; error?: string }> {
  // Find the endpoint
  const endpoint = findEndpointById(spec, endpointId);
  if (!endpoint) {
    return { success: false, error: "Endpoint not found" };
  }

  // Find the scenario
  const scenario = endpoint.assessment?.scenarios.find((s) => s.id === scenarioId);
  if (!scenario) {
    return { success: false, error: "Scenario not found" };
  }

  const messages: LLMMessage[] = [
    { role: "system", content: buildDeepDiveSystemPrompt() },
    { role: "user", content: buildDeepDiveUserPrompt(endpoint, scenario) },
  ];

  try {
    const response = await gateway.chat({
      messages,
      temperature: 0.4,
      maxTokens: 3000,
      responseFormat: "json",
    });

    const parsed = parseDeepDiveResponse(response.content, endpoint);

    if (!parsed.success || !parsed.data) {
      // Retry once
      const retryResponse = await gateway.chat({
        messages,
        temperature: 0.4,
        maxTokens: 3000,
        responseFormat: "json",
      });
      const retryParsed = parseDeepDiveResponse(retryResponse.content, endpoint);
      if (!retryParsed.success || !retryParsed.data) {
        return {
          success: false,
          error: parsed.error || "Failed to parse response after retry",
        };
      }
      return { success: true, data: retryParsed.data };
    }

    return { success: true, data: parsed.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate deep dive",
    };
  }
}

/**
 * Generate additional payloads for a scenario
 */
export async function generateAdditionalPayloads(
  gateway: LLMGateway,
  spec: ParsedSpec,
  endpointId: string,
  scenarioId: string,
  existingPayloads: string[]
): Promise<{ success: boolean; data?: PayloadExample[]; error?: string }> {
  // Find the endpoint
  const endpoint = findEndpointById(spec, endpointId);
  if (!endpoint) {
    return { success: false, error: "Endpoint not found" };
  }

  // Find the scenario
  const scenario = endpoint.assessment?.scenarios.find((s) => s.id === scenarioId);
  if (!scenario) {
    return { success: false, error: "Scenario not found" };
  }

  const messages: LLMMessage[] = [
    {
      role: "system",
      content:
        "You are an API security testing advisor. Generate additional attack payloads and return ONLY a JSON response.",
    },
    {
      role: "user",
      content: buildPayloadGenerationPrompt(endpoint, scenario, existingPayloads),
    },
  ];

  try {
    const response = await gateway.chat({
      messages,
      temperature: 0.5,
      maxTokens: 2500,
      responseFormat: "json",
    });

    const parsed = parsePayloadGenerationResponse(response.content);

    if (!parsed.success || !parsed.data) {
      return {
        success: false,
        error: parsed.error || "Failed to parse response",
      };
    }

    return { success: true, data: parsed.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate payloads",
    };
  }
}
