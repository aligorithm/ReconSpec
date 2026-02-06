import type { EndpointDetail } from "./endpoint.js";

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
