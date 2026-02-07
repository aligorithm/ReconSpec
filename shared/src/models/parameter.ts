/**
 * Parameter details extracted from OpenAPI spec
 */
export interface ParameterDetail {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required: boolean;
  type: string;
  format: string | null;
  enum: string[] | null;
  description: string | null;
  schema: Record<string, unknown> | null;
}

/**
 * Request body details with nested properties
 */
export interface RequestBodyDetail {
  required: boolean;
  contentType: string;
  properties: PropertyDetail[];
  rawSchema: Record<string, unknown> | null;
  schemaRef: string | null;
  allSchemaProperties: PropertyDetail[] | null;
}

/**
 * Property detail from request body schema
 */
export interface PropertyDetail {
  name: string;
  type: string;
  format: string | null;
  required: boolean;
  enum: string[] | null;
  description: string | null;
  nested: PropertyDetail[] | null;
}

/**
 * Response detail from OpenAPI spec
 */
export interface ResponseDetail {
  statusCode: string;
  description: string | null;
  schema: Record<string, unknown> | null;
}
