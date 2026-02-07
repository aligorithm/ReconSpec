/**
 * Prompt Builder for Phase A and Phase B Analysis
 *
 * Constructs prompts for the LLM to analyze endpoints against the OWASP Top 10.
 */

import type { EndpointDetail, PotentialVulnerability } from "@reconspec/shared";
import { getKnowledgeBaseText } from "../knowledge/owasp/index.js";
import { getCategoryDocs } from "../knowledge/owasp/docsLoader.js";

/**
 * Sensitive property names that commonly indicate mass assignment/BOPLA (broken object property level authorisation) vectors
 * These are properties that could allow privilege escalation or unauthorized access
 */
const SENSITIVE_PROPERTIES = [
  "role",
  "roles",
  "isAdmin",
  "admin",
  "isSuperUser",
  "superuser",
  "isOwner",
  "owner",
  "verified",
  "isVerified",
  "emailVerified",
  "tier",
  "subscriptionTier",
  "plan",
  "subscription",
  "balance",
  "credits",
  "status",
  "accountStatus",
  "enabled",
  "disabled",
  "permissions",
  "scopes",
  "groups",
  "teams",
  "organizationId",
  "orgId",
  "companyId",
  "quota",
  "limit",
  "rateLimit",
] as const;

/**
 * Build the system prompt for Phase A analysis
 */
export function buildSystemPrompt(): string {
  return `You are an API security testing advisor. You help penetration testers plan their testing by identifying which attack categories are worth investigating for a given endpoint, based on observable characteristics in its OpenAPI specification.

# Your Role

You are a planning assistant, not a vulnerability scanner. The output you produce represents potential attack paths worth testing, NOT confirmed vulnerabilities or detected issues. Your job is to help security engineers prioritize where to focus their manual testing efforts.

# Key Principles

1. **Spec-only analysis**: Base your analysis ONLY on information present in the OpenAPI spec (paths, methods, parameters, schemas, auth requirements, responses). Do NOT speculate about implementation details, runtime behavior, or backend technology.

2. **Identify testing opportunities**: Be permissive in suggesting potential test areas. If an OWASP category COULD be relevant based on the endpoint's characteristics (method, parameters, schema, auth), include it as a potential testing opportunity. It's better to suggest a test that turns out to be irrelevant than to miss a testing opportunity.

3. **Prioritize by observable signals**: Use the relevance indicators in the OWASP category documentation as priority boosters. When strong indicators are present (e.g., specific field names, patterns, schema characteristics), assign higher relevance scores (70-100). When signals are weaker but the category is still worth testing, assign moderate scores (50-69).

4. **Context-aware**: Consider the HTTP method, parameter types, auth requirements, and request/response schemas when assessing what to test. For example:
   - ANY POST/PUT/PATCH with a request body is worth testing for BOPLA (mass assignment)
   - Endpoints with path parameters like {userId}, {orderId} are worth testing for BOLA
   - Authentication endpoints should be tested for authentication bypasses

# Output Format

Return ONLY a JSON object with this structure:
{
  "vulnerabilities": [
    {
      "name": "Brief descriptive vulnerability name",
      "categories": ["API2", "API8"],
      "relevanceScore": 85,
      "affectedParams": ["userId", "password"],
      "summary": "One-sentence explanation of why this is relevant"
    }
  ],
  "endpointSummary": "One-sentence summary of the endpoint's risk profile"
}

# Multiple Categories Guidance

A single vulnerability MAY be relevant to multiple OWASP categories:
- A POST /login endpoint could flag both API2 (Broken Authentication) and API8 (Security Misconfiguration) if it shows indicators for both
- Use multiple categories when the same parameter or endpoint shows signals for different risk categories
- Do NOT force multiple categories - only use when genuinely relevant

# Scoring Guidelines

- Relevance scores should range from 0-100
- 90-100: High priority - Strong, obvious indicators present (e.g., /users/{userId} for BOLA, request body with "role" field for BOPLA)
- 70-89: High relevance - Clear signals that warrant priority testing
- 50-69: Worth testing - Moderate relevance, include as exploratory test opportunities
- Below 50: Optional - Only include if the category has some connection to the endpoint

**Be inclusive**: When in doubt, include the category with a moderate score (50-69) rather than excluding it. Penetration testers can decide what to test, but they can only test what you suggest.

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

    // Schema comparison for BOPLA detection
    // Always show schema info when available - let LLM assess relevance
    if (endpoint.requestBody.schemaRef) {
      parts.push(`**Schema Reference**: ${endpoint.requestBody.schemaRef}`);

      // If we have the full schema definition, show comparison
      if (endpoint.requestBody.allSchemaProperties && endpoint.requestBody.allSchemaProperties.length > 0) {
        const exposedProps = new Set(endpoint.requestBody.properties.map((p) => p.name));
        const allProps = endpoint.requestBody.allSchemaProperties;
        const hiddenProps = allProps.filter((p) => !exposedProps.has(p.name));
        const hiddenSensitiveProps = hiddenProps.filter((p) =>
          SENSITIVE_PROPERTIES.includes(p.name as any)
        );

        parts.push(`**Exposed Properties** (${endpoint.requestBody.properties.length} of ${allProps.length}):`);
        endpoint.requestBody.properties.forEach((prop) => {
          const required = prop.required ? " (required)" : "";
          parts.push(
            `- \`${prop.name}\` (${prop.type}${required}): ${
              prop.description || "No description"
            }`
          );
        });

        // Show hidden properties if any exist
        if (hiddenProps.length > 0) {
          parts.push(`\n**Hidden Properties** (${hiddenProps.length} not exposed in this endpoint):`);
          hiddenProps.forEach((prop) => {
            const isSensitive = SENSITIVE_PROPERTIES.includes(prop.name as any);
            const sensitiveTag = isSensitive ? " ⚠️ SENSITIVE" : "";
            const required = prop.required ? " (required in schema)" : "";
            parts.push(
              `- \`${prop.name}\` (${prop.type}${required})${sensitiveTag}: ${
                prop.description || "No description"
              }`
            );
          });
        }

        // Always show schema context for BOPLA assessment
        // Note: Even if no hidden sensitive properties are detected in the schema,
        // BOPLA may still be relevant if the endpoint accepts user-modifiable data
        // that could influence privilege escalation (e.g., role, tier, status fields)
        if (hiddenSensitiveProps.length > 0) {
          parts.push(
            `\n**Note**: Schema defines ${hiddenSensitiveProps.length} sensitive properties not exposed in this endpoint: ${hiddenSensitiveProps.map((p: { name: string }) => `\`${p.name}\``).join(", ")}`
          );
        }
      } else {
        // Schema reference exists but we couldn't extract the full definition
        parts.push(`**Properties** (from schema reference):`);
        endpoint.requestBody.properties.forEach((prop) => {
          const required = prop.required ? " (required)" : "";
          parts.push(
            `- \`${prop.name}\` (${prop.type}${required}): ${
              prop.description || "No description"
            }`
          );
        });
        parts.push(`\n**Note**: This endpoint references a schema definition. BOPLA testing may be relevant if the full schema includes additional properties not shown here.`);
      }
    } else {
      // No schema reference - standard display
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
    `\nAnalyze this endpoint and return ONLY a JSON object with relevant potential vulnerabilities. If no vulnerabilities are relevant, return an empty vulnerabilities array.`
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
    vulnerabilities: Array<{ name: string; categories: string[] }>;
  }>,
  totalVulnerabilities: number,
  totalEndpoints: number
): string {
  const condensedVulns = endpointSummaries
    .filter((ep) => ep.vulnerabilities.length > 0)
    .map(
      (ep) =>
        `- ${ep.method.toUpperCase()} ${ep.path}: ${ep.vulnerabilities.length} potential test areas (${ep.vulnerabilities.map((v) => v.categories.join(",")).join(", ")})`
    )
    .join("\n");

  return `You are an API security testing strategist. Your role is to analyze API specifications and recommend testing priorities—NOT to claim vulnerabilities have been found.

# Critical Context

This is a **testing strategy aid**, not a vulnerability scanner. The "potential vulnerabilities" listed are areas worth testing based on OpenAPI spec analysis, not confirmed security issues.

# API Information
**Title**: ${specTitle}
**Description**: ${specDescription || "No description provided"}

# Analysis Results
**Total Endpoints**: ${totalEndpoints}
**Potential Testing Areas**: ${totalVulnerabilities}

# Endpoints with Suggested Test Areas
${condensedVulns || "No specific test areas identified."}

# Your Task

Provide a JSON response that guides testing strategy:

{
  "overview": "A 2-3 paragraph summary that covers: (1) What this API does based on its endpoints and functionality, (2) Recommended testing strategy priorities—which areas to test first and why based on the identified patterns, (3) High-level testing approach suggestions. Use language like 'testing should prioritize', 'worth investigating', 'consider testing for', 'may benefit from'.",
  "testingCategories": [
    {"categoryId": "API1", "categoryName": "Broken Object Level Authorization", "count": 8}
  ]
}

The testingCategories array should list OWASP categories that appear across the analysis, sorted by count descending. These represent areas where testing effort should be focused.

# Language Guidelines

- Use "potential test areas", "testing priorities", "worth investigating"
- AVOID: "vulnerabilities identified", "security issues", "risks found", "concerning"
- Focus on WHAT to test, not WHAT is wrong
- Emphasize this is planning guidance for manual testing`;
}

/**
 * Build the system prompt for Phase B deep dive
 */
export function buildDeepDiveSystemPrompt(categoryIds: string[]): string {
  const docsContent = getCategoryDocs(categoryIds);

  return `You are an API security testing advisor providing testing guidance for a POTENTIAL vulnerability.

# Your Role

You are expanding on an initial security assessment to provide practical testing guidance. Your guidance should be specific to the endpoint being tested and based on the POTENTIAL vulnerability identified.

# Critical: "Potential" Not "Confirmed"

**IMPORTANT**: All findings represent POTENTIAL vulnerabilities for testing purposes, NOT confirmed risks. You are identifying attack paths worth investigating, not detecting actual vulnerabilities. Use language that reflects this:

- "This MAY be vulnerable if..."
- "POTENTIAL attack vector..."
- "Could allow an attacker to..."
- "Worth testing for..."
- "Suggests the possibility of..."

Do NOT use definitive language like "is vulnerable", "allows attackers", "can be exploited".

# CRITICAL: Use Actual Endpoint Details

**DO NOT copy generic examples from OWASP documentation.**

You MUST create scenarios specific to the ACTUAL endpoint being tested:

1. **Use the real endpoint path** (e.g., if testing POST /api/users/{userId}/settings, reference that exact path)
2. **Use actual parameter names** from the endpoint (e.g., if the endpoint has "role", "isAdmin", "subscriptionTier" parameters, use THOSE in your payloads)
3. **Match the API's domain** (e.g., if it's a package management API, use package-related context; if it's an e-commerce API, use shopping context)
4. **Reference the actual request body structure** (if the endpoint expects specific JSON fields, your examples must match)

**WRONG**: Generic marketplace/hotel/booking examples copied from OWASP docs
**RIGHT**: Scenarios using the actual endpoint's parameters, paths, and business domain

${docsContent ? `
# OWASP Documentation Reference

The following sections from OWASP API Security Top 10 documentation provide context for the attack patterns and testing techniques. Adapt these concepts to the specific endpoint being tested—DO NOT copy the examples verbatim.

${docsContent}
` : ""}

# Output Format

Return ONLY a JSON object with this structure:
{
  "overview": "2-3 sentences explaining why this POTENTIAL vulnerability was flagged for this specific endpoint, referencing actual parameters and the endpoint's purpose.",
  "testScenarios": [
    {
      "context": "Business context relevant to THIS API's domain. If it's a payment API, use payment context. If it's a user management API, use user management context.",
      "legitimateRequest": "Example using the ACTUAL endpoint path and real parameter names. Show normal expected usage.",
      "maliciousPayload": "Example exploiting the ACTUAL parameters from this endpoint. Use real field names that exist in the schema.",
      "explanation": "Why this specific test on THIS endpoint could demonstrate the vulnerability. Reference the actual endpoint details."
    }
  ],
  "tools": ["Burp Suite", "ZAP", "Postman", "Bruno", "curl"],
  "samplePayload": {
    "label": "Short descriptor",
    "contentType": "application/json",
    "body": "A single example request body using the ACTUAL schema from this endpoint",
    "description": "What this payload tests for"
  }
}

# Scenario Requirements

- ALL scenarios must use the ACTUAL endpoint path provided in the user prompt
- ALL payloads must use REAL parameter names from the endpoint schema
- Context must match the API's business domain (inferred from endpoint path/description)
- DO NOT use unrelated examples like hotels, marketplaces, or social media unless that's what this API actually does
- If you can't create a relevant scenario for this specific endpoint, create fewer scenarios (2 minimum) rather than copying generic examples

# Important Notes

- Provide 2-4 test scenarios that are SPECIFIC to this endpoint
- Each scenario should tell a complete story using real endpoint details
- Suggest 3-5 relevant testing tools
- samplePayload is OPTIONAL - set to null if not applicable
- If provided, samplePayload must match the endpoint's actual content type
- Overview should explain WHY this was flagged based on the OpenAPI spec
- Always use tentative language ("may", "could", "potentially", "suggests")`;
}

/**
 * Build the user prompt for Phase B deep dive
 */
export function buildDeepDiveUserPrompt(
  specTitle: string,
  specDescription: string | null,
  endpoint: EndpointDetail,
  vuln: PotentialVulnerability
): string {
  const parts = [
    `# API Context`,
    `**API Name**: ${specTitle}`,
  ];

  if (specDescription) {
    parts.push(`**API Description**: ${specDescription}`);
  }

  parts.push(`\n# Target Endpoint`);
  parts.push(`**Method**: ${endpoint.method.toUpperCase()}`);
  parts.push(`**Path**: ${endpoint.path}`);

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

    // Schema comparison for BOPLA detection
    // Always show schema info when available - let LLM assess relevance
    if (endpoint.requestBody.schemaRef) {
      parts.push(`**Schema Reference**: ${endpoint.requestBody.schemaRef}`);

      // If we have the full schema definition, show comparison
      if (endpoint.requestBody.allSchemaProperties && endpoint.requestBody.allSchemaProperties.length > 0) {
        const exposedProps = new Set(endpoint.requestBody.properties.map((p) => p.name));
        const allProps = endpoint.requestBody.allSchemaProperties;
        const hiddenProps = allProps.filter((p) => !exposedProps.has(p.name));
        const hiddenSensitiveProps = hiddenProps.filter((p) =>
          SENSITIVE_PROPERTIES.includes(p.name as any)
        );

        parts.push(`**Exposed Properties** (${endpoint.requestBody.properties.length} of ${allProps.length}):`);
        endpoint.requestBody.properties.forEach((prop) => {
          const required = prop.required ? " (required)" : "";
          parts.push(
            `- \`${prop.name}\` (${prop.type}${required}): ${
              prop.description || "No description"
            }`
          );
        });

        // Show hidden properties if any exist
        if (hiddenProps.length > 0) {
          parts.push(`\n**Hidden Properties** (${hiddenProps.length} not exposed in this endpoint):`);
          hiddenProps.forEach((prop) => {
            const isSensitive = SENSITIVE_PROPERTIES.includes(prop.name as any);
            const sensitiveTag = isSensitive ? " ⚠️ SENSITIVE" : "";
            const required = prop.required ? " (required in schema)" : "";
            parts.push(
              `- \`${prop.name}\` (${prop.type}${required})${sensitiveTag}: ${
                prop.description || "No description"
              }`
            );
          });
        }

        // Always show schema context for BOPLA assessment
        // Note: Even if no hidden sensitive properties are detected in the schema,
        // BOPLA may still be relevant if the endpoint accepts user-modifiable data
        // that could influence privilege escalation (e.g., role, tier, status fields)
        if (hiddenSensitiveProps.length > 0) {
          parts.push(
            `\n**Note**: Schema defines ${hiddenSensitiveProps.length} sensitive properties not exposed in this endpoint: ${hiddenSensitiveProps.map((p: { name: string }) => `\`${p.name}\``).join(", ")}`
          );
        }
      } else {
        // Schema reference exists but we couldn't extract the full definition
        parts.push(`**Properties** (from schema reference):`);
        endpoint.requestBody.properties.forEach((prop) => {
          const required = prop.required ? " (required)" : "";
          parts.push(
            `- \`${prop.name}\` (${prop.type}${required}): ${
              prop.description || "No description"
            }`
          );
        });
        parts.push(`\n**Note**: This endpoint references a schema definition. BOPLA testing may be relevant if the full schema includes additional properties not shown here.`);
      }
    } else {
      // No schema reference - standard display
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

  // Potential Vulnerability
  parts.push(`\n# Initial Assessment`);
  parts.push(`**Vulnerability**: ${vuln.name}`);
  parts.push(`**Categories**: ${vuln.categories.join(", ")}`);
  parts.push(`**Relevance Score**: ${vuln.relevanceScore}/100`);

  if (vuln.affectedParams.length > 0) {
    parts.push(`**Affected Parameters**: ${vuln.affectedParams.join(", ")}`);
  }

  parts.push(`\n---`);
  parts.push(
    `\nGenerate detailed testing guidance for this vulnerability on this endpoint. Return ONLY a JSON object with the structure specified in the system prompt.`
  );

  return parts.join("\n");
}
