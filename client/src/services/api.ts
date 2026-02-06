import type { ParsedSpec, ProviderStatus } from "@reconspec/shared";

const API_BASE_URL = "/api";

/**
 * Error response from the API
 */
interface ApiError {
  error: string;
  details?: string;
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

