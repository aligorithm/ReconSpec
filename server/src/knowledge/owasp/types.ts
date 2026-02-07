/**
 * OWASP API Security Top 10 knowledge base types
 */

export interface OWASPCategory {
  id: string;
  name: string;
  shortName: string;
  description: string;
  cwe: string[];
  relevanceIndicators: string[];
  commonPatterns: string[];
}
