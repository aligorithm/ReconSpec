import type { ParsedSpec, ProviderStatus, EndpointDetail } from "@reconspec/shared";

const API_BASE_URL = "/api";

/**
 * Error response from the API
 */
interface ApiError {
  error: string;
  details?: string;
}

/**
 * Analysis progress events
 */
export type AnalysisProgressEvent =
  | { type: "progress"; data: { completed: number; total: number; currentEndpoint: string } }
  | { type: "endpoint_complete"; data: { endpointId: string; scenarioCount: number } }
  | { type: "summary_complete"; data: APISummary }
  | { type: "complete"; data: { totalScenarios: number; totalEndpoints: number; apiSummary?: APISummary; failedEndpoints?: number } }
  | { type: "error"; data: { endpointId: string; error: string } };

/**
 * API-level summary
 */
export interface APISummary {
  overview: string;
  riskCategories: RiskCategoryCount[];
}

export interface RiskCategoryCount {
  categoryId: string;
  categoryName: string;
  count: number;
}

/**
 * Analysis status
 */
export interface AnalysisStatus {
  isRunning: boolean;
  startedAt: string | null;
  specHash: string | null;
  completedAt: string | null;
}

/**
 * Parse and validate an OpenAPI specification
 *
 * @param specContent - The raw spec content (JSON or YAML)
 * @returns The parsed and normalized spec
 */
export async function parseSpec(
  specContent: string
): Promise<ParsedSpec> {
  const response = await fetch(`${API_BASE_URL}/spec`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: specContent,
  });

  if (!response.ok) {
    let errorMessage = `Server error (${response.status})`;

    // Try to parse error response, fall back to status text if empty
    try {
      const text = await response.text();
      if (text) {
        const error = JSON.parse(text) as ApiError;
        errorMessage = error.details || error.error;
      } else {
        errorMessage = response.statusText || errorMessage;
      }
    } catch {
      // If parsing fails, use status text or generic error
      errorMessage = response.statusText || `Server error (${response.status})`;
    }

    throw new Error(errorMessage);
  }

  return (await response.json()) as ParsedSpec;
}

/**
 * Get the current provider status
 */
export async function getProviderStatus(): Promise<ProviderStatus> {
  const response = await fetch(`${API_BASE_URL}/provider/status`);
  if (!response.ok) {
    throw new Error(`Failed to get provider status: ${response.statusText}`);
  }
  return (await response.json()) as ProviderStatus;
}

/**
 * Get analysis status
 */
export async function getAnalysisStatus(): Promise<AnalysisStatus> {
  const response = await fetch(`${API_BASE_URL}/analyze/status`);
  if (!response.ok) {
    throw new Error(`Failed to get analysis status: ${response.statusText}`);
  }
  return (await response.json()) as AnalysisStatus;
}

/**
 * Analyze spec with SSE streaming
 */
export function analyzeSpec(
  spec: ParsedSpec,
  onProgress: (event: AnalysisProgressEvent) => void,
  onComplete: (result: { totalScenarios: number; totalEndpoints: number }) => void,
  onError: (error: string) => void
): () => void {
  const controller = new AbortController();

  console.log("[analyzeSpec] Starting analysis for spec:", spec.title);

  fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(spec),
    signal: controller.signal,
  })
    .then(async (response) => {
      console.log("[analyzeSpec] Response status:", response.status, response.statusText);

      if (!response.ok) {
        const error = await response.text();
        console.error("[analyzeSpec] Error response:", error);
        throw new Error(error || "Analysis failed");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        console.error("[analyzeSpec] No response body");
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let eventCount = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log("[analyzeSpec] Stream done, received", eventCount, "events");
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || ""; // Keep incomplete chunk in buffer

          for (const line of lines) {
            if (!line.trim()) continue;

            // Parse SSE format: "event: <type>\ndata: <json>\n\n"
            const eventMatch = line.match(/^event: (.+)$/m);
            const dataMatch = line.match(/^data: (.+)$/m);

            if (eventMatch && dataMatch) {
              eventCount++;
              const eventType = eventMatch[1];
              console.log("[analyzeSpec] SSE event:", eventType, "data:", dataMatch[1]?.substring(0, 100));

              try {
                const data = JSON.parse(dataMatch[1]);

                if (eventType === "complete") {
                  console.log("[analyzeSpec] Complete:", data);
                  onComplete(data);
                } else if (eventType === "error") {
                  console.error("[analyzeSpec] Error event:", data);
                  onError(data.error || "Unknown error");
                } else {
                  onProgress({ type: eventType as any, data });
                }
              } catch (e) {
                console.error("[analyzeSpec] Failed to parse SSE data:", e, "line:", line);
              }
            }
          }
        }
      } catch (readError) {
        console.error("[analyzeSpec] Read error:", readError);
        throw readError;
      }
    })
    .catch((error) => {
      console.error("[analyzeSpec] Fetch error:", error);
      if (error.name !== "AbortError") {
        onError(error instanceof Error ? error.message : "Analysis failed");
      }
    });

  // Return cancel function
  return () => controller.abort();
}

