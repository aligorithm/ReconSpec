import type { ParameterDetail, RequestBodyDetail, ResponseDetail } from "./parameter.js";

/**
 * HTTP methods supported in OpenAPI
 */
export type HttpMethod = "get" | "post" | "put" | "patch" | "delete" | "options" | "head";

/**
 * Detailed endpoint information extracted from OpenAPI spec
 */
export interface EndpointDetail {
  id: string; // Deterministic hash of method + path
  method: HttpMethod;
  path: string;
  summary: string | null;
  description: string | null;
  operationId: string | null;
  tags: string[];
  deprecated: boolean;
  parameters: ParameterDetail[];
  requestBody: RequestBodyDetail | null;
  responses: ResponseDetail[];
  security: SecurityRequirement[];
  assessment: SecurityAssessment | null; // Always null in Phase 1
}

export interface SecurityRequirement {
  name: string;
  scopes: string[];
}

/**
 * Security assessment for an endpoint (populated in Phase 3)
 */
export interface SecurityAssessment {
  vulnerabilities: PotentialVulnerability[];
  analyzedAt: string;
}

export interface PotentialVulnerability {
  id: string;
  name: string;
  categories: string[];
  relevanceScore: number;
  affectedParams: string[];
  deepDive: DeepDiveResult | null;
}

/**
 * Test scenario with context and examples
 */
export interface TestScenario {
  context: string;           // Business context description
  legitimateRequest: string; // Example legitimate request
  maliciousPayload: string;  // Example malicious payload
  explanation: string;       // Why this demonstrates the vulnerability
}

export interface DeepDiveResult {
  overview: string;
  testScenarios: TestScenario[];  // Changed from 'tests: string[]'
  tools: string[];                // NEW: Suggested testing tools
  samplePayload: PayloadExample | null;
}

export interface PayloadExample {
  label: string;
  contentType: string;
  body: string;
  description: string;
}
