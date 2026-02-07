/**
 * Testing Techniques Knowledge Base Index
 *
 * Export accessors for testing techniques based on OWASP categories.
 */

export * from "./types.js";

// Re-export the functions we need for the helper functions below
import { getTechniquesForCategory } from "./types.js";

/**
 * Get techniques formatted for prompt inclusion
 */
export function getTechniquesPromptText(categoryId: string): string {
  const techniques = getTechniquesForCategory(categoryId);

  if (techniques.length === 0) {
    return "";
  }

  return `
# Testing Techniques for ${categoryId}

${techniques.map(t => `
## ${t.name}

${t.description}

**Steps:**
${t.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

**What to Observe:**
${t.whatToObserve.map(o => `- ${o}`).join("\n")}

**Tools:** ${t.toolSuggestions.join(", ")}
`).join("\n")}
`;
}

/**
 * Get all technique IDs for a category
 */
export function getTechniqueIdsForCategory(categoryId: string): string[] {
  const techniques = getTechniquesForCategory(categoryId);
  return techniques.map(t => t.id);
}
