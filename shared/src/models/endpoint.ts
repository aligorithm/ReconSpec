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
  scenarios: AttackScenario[];
  analyzedAt: string;
}

export interface AttackScenario {
  id: string;
  name: string;
  category: string;
  relevanceScore: number;
  affectedParams: string[];
  deepDive: DeepDiveResult | null;
}

export interface DeepDiveResult {
  overview: string;
  steps: string[];
  samplePayloads: PayloadExample[];
}

export interface PayloadExample {
  label: string;
  contentType: string;
  body: string;
}
