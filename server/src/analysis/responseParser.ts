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
