/**
 * OWASP API Security Top 10 (2023) Categories
 */

/**
 * OWASP API Security Top 10 category
 */
export interface OWASPCategory {
  id: string; // "API1", "API2", etc.
  name: string; // Full name: "Broken Object Level Authorization"
  shortName: string; // Short name for UI badges: "Broken Object Auth"
  description: string; // What this vulnerability class is
  cwe: string[]; // Related CWE numbers
  relevanceIndicators: string[]; // Signals in an endpoint that suggest this category applies
  commonPatterns: string[]; // Typical manifestations in API specs
}

/**
 * All OWASP API Top 10 categories
 */
export const OWASP_CATEGORIES: OWASPCategory[] = [];

/**
 * Get a category by ID
 */
export function getOWASPCategory(id: string): OWASPCategory | undefined {
  return OWASP_CATEGORIES.find((cat) => cat.id === id);
}

/**
 * Get category short name for display
 */
export function getCategoryShortName(id: string): string {
  const category = getOWASPCategory(id);
  return category?.shortName || id;
}

/**
 * Get category full name for accessibility
 */
export function getCategoryFullName(id: string): string {
  const category = getOWASPCategory(id);
  return category?.name || id;
}
