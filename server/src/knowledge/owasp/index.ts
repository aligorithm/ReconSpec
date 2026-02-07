/**
 * OWASP API Security Top 10 (2023) Knowledge Base
 *
 * This module exports structured data about each OWASP category,
 * including relevance indicators that can be observed in OpenAPI specs.
 */

import type { OWASPCategory } from "./types.js";
import { API1 } from "./categories/api1-bola.js";
import { API2 } from "./categories/api2-broken-auth.js";
import { API3 } from "./categories/api3-object-property.js";
import { API4 } from "./categories/api4-unrestricted-resource.js";
import { API5 } from "./categories/api5-broken-function-auth.js";
import { API6 } from "./categories/api6-server-side-request-forgery.js";
import { API7_SSRF } from "./categories/api7-ssrf.js";
import { API8_Misconfiguration } from "./categories/api8-lack-of-protection.js";
import { API9 } from "./categories/api9-improper-inventory.js";
import { API10 } from "./categories/api10-unsafe-api-consumption.js";

/**
 * All OWASP API Top 10 categories
 */
export const OWASP_CATEGORIES: OWASPCategory[] = [
  API1, // Broken Object Level Authorization
  API2, // Broken Authentication
  API3, // Broken Object Property Level Authorization
  API4, // Unrestricted Resource Consumption
  API5, // Broken Function Level Authorization
  API6, // Unrestricted Access to Sensitive Business Flows
  API7_SSRF, // Server Side Request Forgery
  API8_Misconfiguration, // Security Misconfiguration
  API9, // Improper Inventory Management
  API10, // Unsafe Consumption of APIs
];

/**
 * Get a category by ID
 */
export function getCategoryById(id: string): OWASPCategory | undefined {
  return OWASP_CATEGORIES.find((cat) => cat.id === id);
}

/**
 * Get all category IDs
 */
export function getAllCategoryIds(): string[] {
  return OWASP_CATEGORIES.map((cat) => cat.id);
}

/**
 * Get knowledge base as formatted text for LLM prompts
 */
export function getKnowledgeBaseText(): string {
  const sections = OWASP_CATEGORIES.map(
    (cat) => `
## ${cat.id}: ${cat.name}

**Description**: ${cat.description}

**Relevance Indicators** (signals observable in OpenAPI specs):
${cat.relevanceIndicators.map((ind) => `- ${ind}`).join("\n")}

**Common Patterns**:
${cat.commonPatterns.map((pat) => `- ${pat}`).join("\n")}
`
  );

  return `# OWASP API Security Top 10 (2023) Knowledge Base

This knowledge base describes the 10 most critical API security risks. For each category, relevance indicators are provided that can be observed in OpenAPI specifications to suggest when a given attack category is worth investigating.

${sections.join("\n---\n")}
`;
}
