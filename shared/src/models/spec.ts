import type { EndpointDetail } from "./endpoint.js";
import type { PropertyDetail } from "./parameter.js";

/**
 * Schema definition from components/schemas
 */
export interface SchemaDefinition {
  name: string;
  properties: PropertyDetail[];
  required: string[];
  description: string | null;
  rawSchema: Record<string, unknown>;
}

/**
 * Parsed OpenAPI specification
 * Normalized form returned by the backend after parsing and validation
 */
export interface ParsedSpec {
  title: string;
  version: string;
  description: string | null;
  openApiVersion: string;
  servers: ServerInfo[];
  auth: AuthScheme[];
  tagGroups: TagGroup[];
  schemas: SchemaDefinition[];  // Reusable schema definitions
}

export interface ServerInfo {
  url: string;
  description: string | null;
}

export interface AuthScheme {
  name: string;
  type: "apiKey" | "http" | "oauth2" | "openIdConnect";
  scheme: string | null;
  in: "header" | "query" | "cookie" | null;
  flows: Record<string, unknown> | null;
}

export interface TagGroup {
  name: string;
  description: string | null;
  endpoints: EndpointDetail[];
}
