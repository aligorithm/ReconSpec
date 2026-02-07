/**
 * Prompt Builder for Phase A and Phase B Analysis
 *
 * Constructs prompts for the LLM to analyze endpoints against the OWASP Top 10.
 */

import type { EndpointDetail, AttackScenario } from "@reconspec/shared";
import { getKnowledgeBaseText } from "../knowledge/owasp/index.js";
import { getTechniquesPromptText } from "../knowledge/techniques/index.js";
import { getPayloadsPromptText } from "../knowledge/payloads/index.js";

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

/**
 * Build the system prompt for Phase B deep dive
 */
export function buildDeepDiveSystemPrompt(): string {
  return `You are an API security testing advisor providing detailed, actionable testing guidance for a specific attack scenario.

# Your Role

You are expanding on an initial security assessment to provide step-by-step testing procedures that a penetration tester can follow directly. Your guidance should be practical, specific to the endpoint being tested, and include concrete examples.

# Key Principles

1. **Be Specific**: Reference actual parameter names, field types, and the endpoint's authentication requirements in your testing steps. Do not provide generic advice.

2. **Actionable Steps**: Each step should be a clear instruction that can be executed with tools like curl, Postman, or Burp Suite.

3. **Realistic Payloads**: Provide payload examples that match the endpoint's content type and schema. If the endpoint accepts JSON, provide JSON payloads. If it accepts form data, provide form-encoded examples.

4. **Observation Guidance**: Explain what to look for in responses to determine if the test was successful or if the vulnerability exists.

5. **Tool-Agnostic**: Steps should work with any HTTP client, but mention relevant tools when appropriate.

# Output Format

Return ONLY a JSON object with this structure:
{
  "overview": "2-3 sentences explaining what this test targets, why it's relevant to this specific endpoint, and what the attacker could achieve.",
  "steps": [
    {
      "description": "Clear instruction for this testing step",
      "parameterFocus": ["paramName1", "paramName2"]
    }
  ],
  "expectedResponses": [
    {
      "condition": "If vulnerable to [specific vulnerability type]",
      "indicators": [
        "What to observe in status codes",
        "What to observe in response body",
        "Timing patterns to look for"
      ]
    }
  ],
  "samplePayloads": [
    {
      "label": "Short descriptor like 'SQL injection in name field'",
      "contentType": "application/json | application/x-www-form-urlencoded | text/plain",
      "body": "The full request body or parameter value with malicious payload",
      "description": "What this specific payload tests for"
    }
  ]
}

# Important Notes

- All parameter names in parameterFocus must exist in the endpoint's parameters or request body schema
- Sample payloads must use the correct content type for the endpoint
- Payload values should be properly escaped for JSON (use \\\\ for backslashes in strings)
- Include 3-6 sample payloads covering different variations
- Steps should be ordered logically (reconnaissance -> testing -> verification)`;
}

/**
 * Build the user prompt for Phase B deep dive
 */
export function buildDeepDiveUserPrompt(
  endpoint: EndpointDetail,
  scenario: AttackScenario
): string {
  const parts = [
    `# Target Endpoint`,
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

  // Attack Scenario
  parts.push(`\n# Attack Scenario to Expand`);
  parts.push(`**Name**: ${scenario.name}`);
  parts.push(`**Category**: ${scenario.category}`);
  parts.push(`**Relevance Score**: ${scenario.relevanceScore}/100`);

  if (scenario.affectedParams.length > 0) {
    parts.push(`**Affected Parameters**: ${scenario.affectedParams.join(", ")}`);
  }

  // Knowledge base content
  const techniquesText = getTechniquesPromptText(scenario.category);
  const payloadsText = getPayloadsPromptText(scenario.category);

  if (techniquesText) {
    parts.push(techniquesText);
  }

  if (payloadsText) {
    parts.push(payloadsText);
  }

  parts.push(`\n---`);
  parts.push(
    `\nGenerate a detailed testing plan for this scenario on this endpoint. Return ONLY a JSON object with the structure specified in the system prompt.`
  );

  return parts.join("\n");
}

/**
 * Build prompt for payload generation
 */
export function buildPayloadGenerationPrompt(
  endpoint: EndpointDetail,
  scenario: AttackScenario,
  existingPayloads: string[]
): string {
  const parts = [
    `You are an API security testing advisor. Generate additional attack payloads for a specific scenario.`,
    ``,
    `# Target Endpoint`,
    `**Method**: ${endpoint.method.toUpperCase()}`,
    `**Path**: ${endpoint.path}`,
    `**Content-Type**: ${endpoint.requestBody?.contentType || "application/json"}`,
    ``,
    `# Attack Scenario`,
    `**Name**: ${scenario.name}`,
    `**Category**: ${scenario.category}`,
    ``,
    `# Existing Payloads (Do Not Duplicate)`,
    existingPayloads.map((p, i) => `${i + 1}. ${p}`).join("\n"),
    ``,
    `# Your Task`,
    ``,
    `Generate 5-10 additional payloads that:`,
    `- Test different variations or edge cases of the attack pattern`,
    `- Are specific to this endpoint's parameters and content type`,
    `- Do not duplicate any payloads already listed above`,
    `- Cover different injection points or parameter combinations`,
    ``,
    `Return ONLY a JSON object:`,
    `{`,
    `  "payloads": [`,
    `    {`,
    `      "label": "Short descriptive name",`,
    `      "contentType": "application/json | application/x-www-form-urlencoded | text/plain",`,
    `      "body": "The payload value or full request body",`,
    `      "description": "What this payload tests for"`,
    `    }`,
    `  ]`,
    `}`,
  ];

  return parts.join("\n");
}
