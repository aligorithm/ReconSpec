import $RefParser from "@apidevtools/swagger-parser";
import YAML from "js-yaml";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import type {
  ParsedSpec,
  EndpointDetail,
  TagGroup,
  ServerInfo,
  AuthScheme,
  ParameterDetail,
  RequestBodyDetail,
  PropertyDetail,
  ResponseDetail,
  SecurityRequirement,
} from "@reconspec/shared";

// Initialize DOMPurify with jsdom
const window = new JSDOM("").window;
const dompurify = createDOMPurify(window);

/**
 * Create a deterministic hash from a string
 */
function createHash(str: string): string {
  // Simple hash function for endpoint IDs
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Sanitize HTML content to prevent XSS
 */
function sanitizeHtml(html: string | undefined | null): string | null {
  if (!html) return null;
  return dompurify.sanitize(html, { ALLOWED_TAGS: [] });
}

/**
 * Sanitize text content (strip all HTML)
 */
function sanitizeText(text: string | undefined | null): string | null {
  if (!text) return null;
  return dompurify.sanitize(text, { ALLOWED_TAGS: [] });
}

/**
 * Recursively extract properties from a schema
 */
function extractProperties(
  schema: any,
  required: string[] = []
): PropertyDetail[] {
  if (!schema || typeof schema !== "object") {
    return [];
  }

  const properties: PropertyDetail[] = [];

  // If schema has explicit properties, use those
  if (schema.properties && Object.keys(schema.properties).length > 0) {
    for (const [name, propSchema] of Object.entries(schema.properties)) {
      const prop = propSchema as any;
      const isRequired = required.includes(name);

      let property: PropertyDetail = {
        name,
        type: prop.type || "object",
        format: prop.format || null,
        required: isRequired,
        enum: prop.enum || null,
        description: sanitizeText(prop.description),
        nested: null,
      };

      // Handle nested objects
      if (prop.type === "object" && prop.properties) {
        property.nested = extractProperties(prop, prop.required || []);
      }

      // Handle arrays
      if (prop.type === "array" && prop.items) {
        const items = prop.items;
        property.type = `array[${items.type || "object"}]`;

        if (items.type === "object" && items.properties) {
          property.nested = extractProperties(items, items.required || []);
        }
      }

      properties.push(property);
    }
  }
  // If no explicit properties but there's an example, extract from example
  else if (schema.example && typeof schema.example === "object") {
    for (const [name, value] of Object.entries(schema.example)) {
      const inferredType = typeof value;
      const typeMap: Record<string, string> = {
        string: "string",
        number: "number",
        boolean: "boolean",
        object: "object",
      };

      properties.push({
        name,
        type: typeMap[inferredType] || "string",
        format: null,
        required: required.includes(name),
        enum: null,
        description: null,
        nested: null,
      });
    }
  }

  return properties;
}

/**
 * Parse OpenAPI spec and normalize to ParsedSpec
 */
export async function parseSpec(
  specContent: string,
  contentType: "json" | "yaml"
): Promise<ParsedSpec> {
  let spec: any;

  // Parse YAML or JSON
  try {
    if (contentType === "yaml") {
      spec = YAML.load(specContent, { schema: YAML.DEFAULT_SCHEMA });
    } else {
      spec = JSON.parse(specContent);
    }
  } catch (err: any) {
    throw new Error(
      `Failed to parse ${contentType.toUpperCase()}: ${err.message}`
    );
  }

  // Normalize spec - fix common issues
  // Convert version to string if it's a number
  if (spec.info?.version && typeof spec.info.version === "number") {
    spec.info.version = String(spec.info.version);
  }

  // Validate OpenAPI structure and resolve $ref
  try {
    spec = await $RefParser.validate(spec, {
      validate: {
        schema: false,
        spec: true,
      },
    });
  } catch (err: any) {
    throw new Error(`Invalid OpenAPI spec: ${err.message}`);
  }

  // Extract basic info
  const info = spec.info || {};
  const title = sanitizeText(info.title) || "API";
  const version = sanitizeText(info.version) || "1.0.0";
  const description = sanitizeHtml(info.description);
  const openApiVersion = spec.openapi || spec.swagger || "unknown";

  // Extract servers
  const servers: ServerInfo[] = (spec.servers || []).map((s: any) => ({
    url: s.url || "",
    description: sanitizeText(s.description),
  }));

  // If no servers, add a default
  if (servers.length === 0) {
    servers.push({ url: "/", description: null });
  }

  // Extract auth schemes
  const authSchemes: AuthScheme[] = [];
  const securityDefs =
    spec.components?.securitySchemes ||
    spec.securityDefinitions ||
    {};

  for (const [name, scheme] of Object.entries(securityDefs)) {
    const s = scheme as any;
    authSchemes.push({
      name,
      type: s.type || "apiKey",
      scheme: s.scheme || null,
      in: s.in || null,
      flows: s.flows || null,
    });
  }

  // Extract endpoints and group by tags
  const paths = spec.paths || {};
  const tagMap = new Map<string, EndpointDetail[]>();
  const untagged: EndpointDetail[] = [];

  for (const [path, pathItem] of Object.entries(paths)) {
    const pathObj = pathItem as any;

    for (const method of ["get", "post", "put", "patch", "delete", "options", "head"]) {
      const operation = pathObj[method];
      if (!operation) continue;

      // Extract parameters
      const parameters: ParameterDetail[] = [];

      // Path-level parameters
      for (const param of pathObj.parameters || []) {
        const p = param as any;
        parameters.push({
          name: p.name,
          in: p.in,
          required: p.required ?? p.in === "path",
          type: p.schema?.type || "string",
          format: p.schema?.format || null,
          enum: p.schema?.enum || null,
          description: sanitizeText(p.description),
          schema: p.schema || null,
        });
      }

      // Operation-level parameters
      for (const param of operation.parameters || []) {
        const p = param as any;
        parameters.push({
          name: p.name,
          in: p.in,
          required: p.required ?? p.in === "path",
          type: p.schema?.type || "string",
          format: p.schema?.format || null,
          enum: p.schema?.enum || null,
          description: sanitizeText(p.description),
          schema: p.schema || null,
        });
      }

      // Extract request body
      let requestBody: RequestBodyDetail | null = null;
      if (operation.requestBody) {
        const body = operation.requestBody;
        const content = body.content?.["application/json"];
        const contentType = content
          ? "application/json"
          : Object.keys(body.content || {})[0] || "application/json";

        let schema = content?.schema || body.content?.[contentType]?.schema;

        requestBody = {
          required: body.required ?? false,
          contentType,
          properties: schema ? extractProperties(schema) : [],
          rawSchema: schema || null,
        };
      }

      // Extract responses
      const responses: ResponseDetail[] = [];
      for (const [code, resp] of Object.entries(operation.responses || {})) {
        const r = resp as any;
        responses.push({
          statusCode: code,
          description: sanitizeText(r.description),
          schema: r.content?.["application/json"]?.schema || null,
        });
      }

      // Extract security requirements
      const security: SecurityRequirement[] = [];
      for (const req of operation.security || spec.security || []) {
        for (const [name, scopes] of Object.entries(req)) {
          security.push({
            name,
            scopes: scopes as string[],
          });
        }
      }

      // Create endpoint
      const endpointId = createHash(`${method.toUpperCase()}:${path}`);
      const tags = operation.tags || [];

      const endpoint: EndpointDetail = {
        id: endpointId,
        method: method as any,
        path,
        summary: sanitizeText(operation.summary),
        description: sanitizeHtml(operation.description),
        operationId: operation.operationId || null,
        tags,
        deprecated: operation.deprecated || false,
        parameters,
        requestBody,
        responses,
        security,
        assessment: null, // Phase 1 - no assessment
      };

      // Group by first tag
      if (tags.length > 0) {
        const tag = tags[0];
        if (!tagMap.has(tag)) {
          tagMap.set(tag, []);
        }
        tagMap.get(tag)!.push(endpoint);
      } else {
        untagged.push(endpoint);
      }
    }
  }

  // Build tag groups
  const tagGroups: TagGroup[] = [];

  for (const [name, endpoints] of tagMap.entries()) {
    const tagDef = (spec.tags || []).find((t: any) => t.name === name);
    tagGroups.push({
      name,
      description: sanitizeText(tagDef?.description),
      endpoints,
    });
  }

  // Add untagged group if needed
  if (untagged.length > 0) {
    tagGroups.push({
      name: "Untagged",
      description: null,
      endpoints: untagged,
    });
  }

  return {
    title,
    version,
    description,
    openApiVersion,
    servers,
    auth: authSchemes,
    tagGroups,
  };
}
