/**
 * Prompt Builder for Phase A Analysis
 *
 * Constructs prompts for the LLM to analyze endpoints against the OWASP Top 10.
 */

import type { EndpointDetail } from "@reconspec/shared";
import { getKnowledgeBaseText } from "../knowledge/owasp/index.js";

/**
 * Build the system prompt for Phase A analysis
 */
export function buildSystemPrompt(): string {
  return `You are an API security testing advisor. You help penetration testers plan their testing by identifying which attack categories are worth investigating for a given endpoint, based on observable characteristics in its OpenAPI specification.

# Your Role

You are a planning assistant, not a vulnerability scanner. The output you produce represents potential attack paths worth testing, NOT confirmed vulnerabilities or detected issues. Your job is to help security engineers prioritize where to focus their manual testing efforts.

# Key Principles

1. **Spec-only analysis**: Base your analysis ONLY on information present in the OpenAPI spec (paths, methods, parameters, schemas, auth requirements, responses). Do NOT speculate about implementation details, runtime behavior, or backend technology.

2. **Relevance over quantity**: Only include attack scenarios that have meaningful signals in the spec. If an endpoint has no observable characteristics suggesting a given OWASP category is relevant, omit it. Do NOT pad the results.

3. **Concrete indicators**: Map scenarios to observable signals in the spec (e.g., "path parameter named {userId} suggests direct object reference").

4. **Context-aware**: Consider the HTTP method, parameter types, auth requirements, and request/response schemas when assessing relevance.

# Output Format

Return ONLY a JSON object with this structure:
{
  "scenarios": [
    {
      "name": "Brief descriptive attack name",
      "categoryId": "API1",
      "relevanceScore": 85,
      "affectedParams": ["userId", "petId"],
      "summary": "One-sentence explanation of why this is relevant"
    }
  ],
  "endpointSummary": "One-sentence summary of the endpoint's risk profile"
}

# Scoring Guidelines

- Relevance scores should range from 0-100
- 90-100: Strong, obvious indicators (e.g., /users/{userId} for BOLA)
- 70-89: Clear but not definitive signals
- 50-69: Moderate relevance, worth investigating
- Below 50: Weak signals, only include if genuinely relevant

${getKnowledgeBaseText()}`;
}

/**
 * Build the user prompt for analyzing a specific endpoint
 */
export function buildUserPrompt(endpoint: EndpointDetail): string {
  const parts = [
    `# Endpoint to Analyze`,
    `**Method**: ${endpoint.method.toUpperCase()}`,
    `**Path**: ${endpoint.path}`,
  ];

  if (endpoint.summary) {
    parts.push(`**Summary**: ${endpoint.summary}`);
  }

  if (endpoint.description) {
    parts.push(`**Description**: ${endpoint.description}`);
  }

  // Parameters
  if (endpoint.parameters && endpoint.parameters.length > 0) {
    parts.push(`\n## Parameters`);
    endpoint.parameters.forEach((param) => {
      const required = param.required ? " (required)" : "";
      parts.push(
        `- \`${param.name}\` (${param.in}${required}): ${
          param.description || "No description"
        }`
      );
    });
  }

  // Request Body
  if (endpoint.requestBody && endpoint.requestBody.properties) {
    parts.push(`\n## Request Body`);
    parts.push(`**Content-Type**: ${endpoint.requestBody.contentType}`);
    parts.push(`**Properties**:`);
    endpoint.requestBody.properties.forEach((prop) => {
      const required = prop.required ? " (required)" : "";
      parts.push(
        `- \`${prop.name}\` (${prop.type}${required}): ${
          prop.description || "No description"
        }`
      );
    });
  }

  // Security/Authentication
  if (endpoint.security && endpoint.security.length > 0) {
    parts.push(`\n## Authentication`);
    endpoint.security.forEach((sec) => {
      const scopes = sec.scopes && sec.scopes.length > 0 ? ` (scopes: ${sec.scopes.join(", ")})` : "";
      parts.push(`- ${sec.name}${scopes}`);
    });
  } else {
    parts.push(`\n## Authentication: No security requirement defined`);
  }

  // Response Codes
  if (endpoint.responses && endpoint.responses.length > 0) {
    parts.push(`\n## Response Codes`);
    endpoint.responses.forEach((resp) => {
      parts.push(`- ${resp.statusCode}: ${resp.description || "No description"}`);
    });
  }

  parts.push(`\n---`);
  parts.push(
    `\nAnalyze this endpoint and return ONLY a JSON object with relevant attack scenarios. If no scenarios are relevant, return an empty scenarios array.`
  );

  return parts.join("\n");
}

/**
 * Build the prompt for API-level summary
 */
export function buildSummaryPrompt(
  specTitle: string,
  specDescription: string | null,
  endpointSummaries: Array<{
    method: string;
    path: string;
    scenarios: Array<{ name: string; categoryId: string }>;
  }>,
  totalScenarios: number,
  totalEndpoints: number
): string {
  const condensedScenarios = endpointSummaries
    .filter((ep) => ep.scenarios.length > 0)
    .map(
      (ep) =>
        `- ${ep.method.toUpperCase()} ${ep.path}: ${ep.scenarios.length} scenarios (${ep.scenarios.map((s) => s.categoryId).join(", ")})`
    )
    .join("\n");

  return `You are an API security analyst. Analyze the following API security assessment results and provide a comprehensive summary.

# API Information
**Title**: ${specTitle}
**Description**: ${specDescription || "No description provided"}

# Assessment Results
**Total Endpoints**: ${totalEndpoints}
**Total Attack Scenarios**: ${totalScenarios}

# Endpoint Breakdown
${condensedScenarios || "No scenarios identified."}

# Your Task

Provide a JSON response with:
{
  "overview": "2-3 paragraph prose summary of the API's overall security posture. Highlight key areas of concern, patterns across endpoints, and general recommendations.",
  "riskCategories": [
    {"categoryId": "API1", "categoryName": "Broken Object Level Authorization", "count": 8}
  ]
}

The riskCategories array should list all OWASP categories that appear across scenarios, sorted by count descending.`;
}
