/**
 * Response Parser for Phase A Analysis
 *
 * Validates and parses LLM JSON responses.
 */

import type { EndpointDetail, AttackScenario } from "@reconspec/shared";
import { getAllCategoryIds } from "../knowledge/owasp/index.js";

/**
 * Phase A LLM response schema
 */
export interface PhaseAResponse {
  scenarios: PhaseAScenario[];
  endpointSummary: string;
}

export interface PhaseAScenario {
  name: string;
  categoryId: string;
  relevanceScore: number;
  affectedParams: string[];
  summary: string;
}

/**
 * API-level summary response schema
 */
export interface APISummaryResponse {
  overview: string;
  riskCategories: RiskCategoryCount[];
}

export interface RiskCategoryCount {
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
    if (!parsed.scenarios || !Array.isArray(parsed.scenarios)) {
      return { success: false, error: "Missing or invalid scenarios array" };
    }

    if (typeof parsed.endpointSummary !== "string") {
      return { success: false, error: "Missing or invalid endpointSummary" };
    }

    // Validate each scenario
    const validCategoryIds = getAllCategoryIds();
    const endpointParamNames = new Set([
      ...endpoint.parameters.map((p) => p.name),
      ...(endpoint.requestBody?.properties.map((f) => f.name) ?? []),
    ]);

    for (let i = 0; i < parsed.scenarios.length; i++) {
      const scenario = parsed.scenarios[i];

      // Validate required fields
      if (typeof scenario.name !== "string" || !scenario.name.trim()) {
        return {
          success: false,
          error: `Scenario ${i + 1}: missing or invalid name`,
        };
      }

      if (typeof scenario.categoryId !== "string") {
        return {
          success: false,
          error: `Scenario ${i + 1}: missing or invalid categoryId`,
        };
      }

      // Validate categoryId is known
      if (!validCategoryIds.includes(scenario.categoryId)) {
        return {
          success: false,
          error: `Scenario ${i + 1}: unknown categoryId "${scenario.categoryId}"`,
        };
      }

      // Validate and clamp relevanceScore
      if (typeof scenario.relevanceScore !== "number") {
        scenario.relevanceScore = 50; // Default
      } else {
        scenario.relevanceScore = Math.max(0, Math.min(100, scenario.relevanceScore));
      }

      // Validate affectedParams is array
      if (!Array.isArray(scenario.affectedParams)) {
        scenario.affectedParams = [];
      }

      // Filter affectedParams to only include params that exist on the endpoint
      scenario.affectedParams = scenario.affectedParams.filter((param) =>
        endpointParamNames.has(param)
      );

      if (typeof scenario.summary !== "string" || !scenario.summary.trim()) {
        return {
          success: false,
          error: `Scenario ${i + 1}: missing or invalid summary`,
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

    if (!Array.isArray(parsed.riskCategories)) {
      return { success: false, error: "Missing or invalid riskCategories array" };
    }

    // Validate riskCategories
    const validCategoryIds = getAllCategoryIds();
    for (let i = 0; i < parsed.riskCategories.length; i++) {
      const cat = parsed.riskCategories[i];

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
 * Convert PhaseAScenario to AttackScenario with timestamp
 */
export function toAttackScenario(
  phaseAScenario: PhaseAScenario,
  index: number
): AttackScenario {
  return {
    id: `scenario-${Date.now()}-${index}`,
    name: phaseAScenario.name,
    category: phaseAScenario.categoryId,
    relevanceScore: phaseAScenario.relevanceScore,
    affectedParams: phaseAScenario.affectedParams,
    deepDive: null, // Populated in Phase B
  };
}

/**
 * Phase B Deep Dive response schema
 */
export interface DeepDiveResponse {
  overview: string;
  steps: DeepDiveStep[];
  expectedResponses: ExpectedResponse[];
  samplePayloads: PayloadExample[];
}

export interface DeepDiveStep {
  description: string;
  parameterFocus: string[];
}

export interface ExpectedResponse {
  condition: string;
  indicators: string[];
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

    // Validate steps
    if (!Array.isArray(parsed.steps)) {
      return { success: false, error: "Missing or invalid steps array" };
    }

    // Get valid parameter names
    const validParamNames = new Set([
      ...endpoint.parameters.map((p) => p.name),
      ...(endpoint.requestBody?.properties.map((f) => f.name) ?? []),
    ]);

    for (let i = 0; i < parsed.steps.length; i++) {
      const step = parsed.steps[i];

      if (typeof step.description !== "string" || !step.description.trim()) {
        return {
          success: false,
          error: `Step ${i + 1}: missing or invalid description`,
        };
      }

      if (!Array.isArray(step.parameterFocus)) {
        return {
          success: false,
          error: `Step ${i + 1}: missing or invalid parameterFocus`,
        };
      }

      // Validate that all parameterFocus values exist on the endpoint
      step.parameterFocus = step.parameterFocus.filter((param) =>
        validParamNames.has(param)
      );
    }

    // Validate expectedResponses
    if (!Array.isArray(parsed.expectedResponses)) {
      return { success: false, error: "Missing or invalid expectedResponses array" };
    }

    for (let i = 0; i < parsed.expectedResponses.length; i++) {
      const resp = parsed.expectedResponses[i];

      if (typeof resp.condition !== "string" || !resp.condition.trim()) {
        return {
          success: false,
          error: `Expected response ${i + 1}: missing or invalid condition`,
        };
      }

      if (!Array.isArray(resp.indicators)) {
        return {
          success: false,
          error: `Expected response ${i + 1}: missing or invalid indicators`,
        };
      }
    }

    // Validate samplePayloads
    if (!Array.isArray(parsed.samplePayloads)) {
      return { success: false, error: "Missing or invalid samplePayloads array" };
    }

    for (let i = 0; i < parsed.samplePayloads.length; i++) {
      const payload = parsed.samplePayloads[i];

      if (typeof payload.label !== "string" || !payload.label.trim()) {
        return {
          success: false,
          error: `Payload ${i + 1}: missing or invalid label`,
        };
      }

      if (typeof payload.contentType !== "string" || !payload.contentType.trim()) {
        return {
          success: false,
          error: `Payload ${i + 1}: missing or invalid contentType`,
        };
      }

      if (typeof payload.body !== "string" || !payload.body.trim()) {
        return {
          success: false,
          error: `Payload ${i + 1}: missing or invalid body`,
        };
      }

      if (typeof payload.description !== "string" || !payload.description.trim()) {
        return {
          success: false,
          error: `Payload ${i + 1}: missing or invalid description`,
        };
      }

      // Sanitize body to prevent HTML injection in frontend
      // Replace < with &lt;, > with &gt;, but preserve JSON structure
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

/**
 * Parse payload generation response
 */
export function parsePayloadGenerationResponse(
  jsonResponse: string
): { success: boolean; data?: PayloadExample[]; error?: string } {
  try {
    const cleanedJson = jsonResponse
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(cleanedJson) as { payloads: PayloadExample[] };

    if (!Array.isArray(parsed.payloads)) {
      return { success: false, error: "Missing or invalid payloads array" };
    }

    for (let i = 0; i < parsed.payloads.length; i++) {
      const payload = parsed.payloads[i];

      if (typeof payload.label !== "string" || !payload.label.trim()) {
        return {
          success: false,
          error: `Payload ${i + 1}: missing or invalid label`,
        };
      }

      if (typeof payload.contentType !== "string" || !payload.contentType.trim()) {
        return {
          success: false,
          error: `Payload ${i + 1}: missing or invalid contentType`,
        };
      }

      if (typeof payload.body !== "string" || !payload.body.trim()) {
        return {
          success: false,
          error: `Payload ${i + 1}: missing or invalid body`,
        };
      }

      if (typeof payload.description !== "string" || !payload.description.trim()) {
        return {
          success: false,
          error: `Payload ${i + 1}: missing or invalid description`,
        };
      }

      // Sanitize body
      payload.body = payload.body
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    return { success: true, data: parsed.payloads };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse JSON",
    };
  }
}
