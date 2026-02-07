/**
 * Payload Patterns Knowledge Base Index
 *
 * Export accessors for payload patterns based on OWASP categories.
 */

export * from "./types.js";

// Re-export the functions we need for the helper functions below
import { getPayloadsForCategory } from "./types.js";

/**
 * Get payloads formatted for prompt inclusion
 */
export function getPayloadsPromptText(categoryId: string): string {
  const patterns = getPayloadsForCategory(categoryId);

  if (patterns.length === 0) {
    return "";
  }

  return `
# Payload Patterns for ${categoryId}

${patterns.map(p => `
## ${p.name}

${p.payloads.map(payload => `
- **${payload.description}**
  - Value: \`${payload.value}\`
  - Context: ${payload.context}
`).join("\n")}
`).join("\n")}
`;
}

/**
 * Get all payload values for a category (for duplicate checking)
 */
export function getPayloadValuesForCategory(categoryId: string): string[] {
  const patterns = getPayloadsForCategory(categoryId);
  return patterns.flatMap(p => p.payloads.map(payload => payload.value));
}
