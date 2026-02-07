/**
 * Response Parser for Phase A Analysis
 *
 * Validates and parses LLM JSON responses.
 */

import type { EndpointDetail, PotentialVulnerability } from "@reconspec/shared";
import { getAllCategoryIds } from "../knowledge/owasp/index.js";

/**
 * Phase A LLM response schema
 */
export interface PhaseAResponse {
  vulnerabilities: PhaseAVulnerability[];
  endpointSummary: string;
}

export interface PhaseAVulnerability {
  name: string;
  categories: string[];
  relevanceScore: number;
  affectedParams: string[];
  summary: string;
}

/**
 * API-level summary response schema
 */
export interface APISummaryResponse {
  overview: string;
  testingCategories: TestingCategoryCount[];
}

export interface TestingCategoryCount {
  categoryId: string;
  categoryName: string;
  count: number;
}

/**
 * Parse and validate Phase A response from LLM
 */
export function parsePhaseAResponse(
  jsonResponse: string,
  endpoint: EndpointDetail
): { success: boolean; data?: PhaseAResponse; error?: string } {
  try {
    // Remove markdown code fences if present
    const cleanedJson = jsonResponse
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(cleanedJson) as PhaseAResponse;

    // Validate structure
    if (!parsed.vulnerabilities || !Array.isArray(parsed.vulnerabilities)) {
      return { success: false, error: "Missing or invalid vulnerabilities array" };
    }

    if (typeof parsed.endpointSummary !== "string") {
      return { success: false, error: "Missing or invalid endpointSummary" };
    }

    // Validate each vulnerability
    const validCategoryIds = getAllCategoryIds();
    const endpointParamNames = new Set([
      ...endpoint.parameters.map((p) => p.name),
      ...(endpoint.requestBody?.properties.map((f) => f.name) ?? []),
    ]);

    for (let i = 0; i < parsed.vulnerabilities.length; i++) {
      const vuln = parsed.vulnerabilities[i];

      // Validate required fields
      if (typeof vuln.name !== "string" || !vuln.name.trim()) {
        return {
          success: false,
          error: `Vulnerability ${i + 1}: missing or invalid name`,
        };
      }

      // Validate categories array
      if (!Array.isArray(vuln.categories)) {
        return {
          success: false,
          error: `Vulnerability ${i + 1}: missing or invalid categories array`,
        };
      }

      // Ensure at least one category
      if (vuln.categories.length === 0) {
        return {
          success: false,
          error: `Vulnerability ${i + 1}: categories array cannot be empty`,
        };
      }

      // Validate each category ID is known
      for (const catId of vuln.categories) {
        if (!validCategoryIds.includes(catId)) {
          return {
            success: false,
            error: `Vulnerability ${i + 1}: unknown categoryId "${catId}"`,
          };
        }
      }

      // Validate and clamp relevanceScore
      if (typeof vuln.relevanceScore !== "number") {
        vuln.relevanceScore = 50; // Default
      } else {
        vuln.relevanceScore = Math.max(0, Math.min(100, vuln.relevanceScore));
      }

      // Validate affectedParams is array
      if (!Array.isArray(vuln.affectedParams)) {
        vuln.affectedParams = [];
      }

      // Filter affectedParams to only include params that exist on the endpoint
      vuln.affectedParams = vuln.affectedParams.filter((param) =>
        endpointParamNames.has(param)
      );

      if (typeof vuln.summary !== "string" || !vuln.summary.trim()) {
        return {
          success: false,
          error: `Vulnerability ${i + 1}: missing or invalid summary`,
        };
      }
    }

    return { success: true, data: parsed };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse JSON",
    };
  }
}

/**
 * Parse and validate API summary response from LLM
 */
export function parseAPISummaryResponse(
  jsonResponse: string
): { success: boolean; data?: APISummaryResponse; error?: string } {
  try {
    // Remove markdown code fences if present
    const cleanedJson = jsonResponse
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(cleanedJson) as APISummaryResponse;

    // Validate structure
    if (typeof parsed.overview !== "string" || !parsed.overview.trim()) {
      return { success: false, error: "Missing or invalid overview" };
    }

    if (!Array.isArray(parsed.testingCategories)) {
      return { success: false, error: "Missing or invalid testingCategories array" };
    }

    // Validate testingCategories
    const validCategoryIds = getAllCategoryIds();
    for (let i = 0; i < parsed.testingCategories.length; i++) {
      const cat = parsed.testingCategories[i];

      if (!cat) {
        return {
          success: false,
          error: `Risk category ${i + 1}: category is null or undefined`,
        };
      }

      if (typeof cat.categoryId !== "string" || !cat.categoryId) {
        return {
          success: false,
          error: `Risk category ${i + 1}: missing or invalid categoryId`,
        };
      }

      if (typeof cat.categoryName !== "string" || !cat.categoryName) {
        return {
          success: false,
          error: `Risk category ${i + 1}: missing or invalid categoryName`,
        };
      }

      if (typeof cat.count !== "number" || cat.count < 0) {
        return {
          success: false,
          error: `Risk category ${i + 1}: invalid count`,
        };
      }
    }

    return { success: true, data: parsed };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse JSON",
    };
  }
}

/**
 * Convert PhaseAVulnerability to PotentialVulnerability with timestamp
 */
export function toPotentialVulnerability(
  phaseAVuln: PhaseAVulnerability,
  index: number
): PotentialVulnerability {
  return {
    id: `vuln-${Date.now()}-${index}`,
    name: phaseAVuln.name,
    categories: phaseAVuln.categories,
    relevanceScore: phaseAVuln.relevanceScore,
    affectedParams: phaseAVuln.affectedParams,
    deepDive: null, // Populated in Phase B
  };
}

/**
 * Phase B Deep Dive response schema
 */
export interface TestScenario {
  context: string;
  legitimateRequest: string;
  maliciousPayload: string;
  explanation: string;
}

export interface DeepDiveResponse {
  overview: string;
  testScenarios: TestScenario[];
  tools: string[];
  samplePayload: PayloadExample | null;
}

export interface PayloadExample {
  label: string;
  contentType: string;
  body: string;
  description: string;
}

/**
 * Parse and validate Phase B Deep Dive response from LLM
 */
export function parseDeepDiveResponse(
  jsonResponse: string,
  endpoint: EndpointDetail
): { success: boolean; data?: DeepDiveResponse; error?: string } {
  try {
    // Remove markdown code fences if present
    const cleanedJson = jsonResponse
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(cleanedJson) as DeepDiveResponse;

    // Validate overview
    if (typeof parsed.overview !== "string" || !parsed.overview.trim()) {
      return { success: false, error: "Missing or invalid overview" };
    }

    // Validate testScenarios array
    if (!Array.isArray(parsed.testScenarios)) {
      return { success: false, error: "Missing or invalid testScenarios array" };
    }

    for (let i = 0; i < parsed.testScenarios.length; i++) {
      const scenario = parsed.testScenarios[i];

      // Validate context
      if (typeof scenario.context !== "string" || !scenario.context.trim()) {
        return {
          success: false,
          error: `Scenario ${i + 1}: missing or invalid context`,
        };
      }

      // Validate legitimateRequest
      if (typeof scenario.legitimateRequest !== "string" || !scenario.legitimateRequest.trim()) {
        return {
          success: false,
          error: `Scenario ${i + 1}: missing or invalid legitimateRequest`,
        };
      }

      // Validate maliciousPayload
      if (typeof scenario.maliciousPayload !== "string" || !scenario.maliciousPayload.trim()) {
        return {
          success: false,
          error: `Scenario ${i + 1}: missing or invalid maliciousPayload`,
        };
      }

      // Validate explanation
      if (typeof scenario.explanation !== "string" || !scenario.explanation.trim()) {
        return {
          success: false,
          error: `Scenario ${i + 1}: missing or invalid explanation`,
        };
      }
    }

    // Validate tools array
    if (!Array.isArray(parsed.tools)) {
      parsed.tools = [];
    }

    // Sanitize tool names
    parsed.tools = parsed.tools
      .filter((t) => typeof t === "string" && t.trim())
      .map((t) => t.trim());

    // Validate samplePayload (optional)
    if (parsed.samplePayload !== null && parsed.samplePayload !== undefined) {
      if (typeof parsed.samplePayload !== "object") {
        return { success: false, error: "samplePayload must be an object or null" };
      }

      const payload = parsed.samplePayload;

      if (typeof payload.label !== "string" || !payload.label.trim()) {
        return { success: false, error: "samplePayload: missing or invalid label" };
      }

      if (typeof payload.contentType !== "string" || !payload.contentType.trim()) {
        return { success: false, error: "samplePayload: missing or invalid contentType" };
      }

      if (typeof payload.body !== "string" || !payload.body.trim()) {
        return { success: false, error: "samplePayload: missing or invalid body" };
      }

      if (typeof payload.description !== "string" || !payload.description.trim()) {
        return { success: false, error: "samplePayload: missing or invalid description" };
      }

      // Sanitize body to prevent HTML injection in frontend
      payload.body = payload.body
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    return { success: true, data: parsed };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse JSON",
    };
  }
}
