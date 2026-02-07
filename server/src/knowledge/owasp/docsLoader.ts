/**
 * OWASP Documentation Loader
 *
 * Loads and formats OWASP markdown documentation for injection into LLM prompts.
 */

import { readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to owasp-docs folder
const OWASP_DOCS_PATH = join(__dirname, "owasp-docs");

/**
 * Cache for loaded documentation content
 */
const docsCache = new Map<string, string>();

/**
 * Map category ID to filename prefix
 */
function mapCategoryIdToFileName(categoryId: string): string {
  const mapping: Record<string, string> = {
    "API1": "0xa1",
    "API2": "0xa2",
    "API3": "0xa3",
    "API4": "0xa4",
    "API5": "0xa5",
    "API6": "0xa6",
    "API7": "0xa7",
    "API8": "0xa8",
    "API9": "0xa9",
    "API10": "0xaa",
  };

  const prefix = mapping[categoryId];
  if (!prefix) {
    return "";
  }

  // Find the actual file (in case naming varies slightly)
  try {
    const files = readdirSync(OWASP_DOCS_PATH);
    return files.find((f) => f.startsWith(prefix)) || "";
  } catch {
    return "";
  }
}

/**
 * Get documentation content for specified categories
 *
 * @param categoryIds - Array of OWASP category IDs (e.g., ["API1", "API3"])
 * @returns Formatted markdown content for injection into prompts
 */
export function getCategoryDocs(categoryIds: string[]): string {
  const sections: string[] = [];

  for (const categoryId of categoryIds) {
    // Check cache first
    if (docsCache.has(categoryId)) {
      sections.push(docsCache.get(categoryId)!);
      continue;
    }

    const filename = mapCategoryIdToFileName(categoryId);
    if (!filename) {
      console.warn(`[docsLoader] Unknown category ID: ${categoryId}`);
      continue;
    }

    try {
      const filePath = join(OWASP_DOCS_PATH, filename);
      const content = readFileSync(filePath, "utf-8");

      // Extract relevant sections from the markdown
      const formattedContent = formatDocumentation(content, categoryId);
      docsCache.set(categoryId, formattedContent);
      sections.push(formattedContent);
    } catch (error) {
      console.error(`[docsLoader] Failed to load documentation for ${categoryId}:`, error);
    }
  }

  if (sections.length === 0) {
    return "";
  }

  return `# OWASP Documentation Reference

${sections.join("\n\n---\n\n")}
`;
}

/**
 * Format documentation content for prompt injection
 *
 * Extracts the most relevant sections: vulnerability criteria,
 * attack scenarios, and prevention measures
 */
function formatDocumentation(content: string, categoryId: string): string {
  const lines = content.split("\n");

  // Extract sections we want
  const wantedSections = [
    "Is the API Vulnerable?",
    "Example Attack Scenarios",
    "How To Prevent"
  ];

  const result: string[] = [];
  let currentSection: string[] = [];
  let inWantedSection = false;

  for (const line of lines) {
    // Check if this line starts a section we want
    const sectionMatch = wantedSections.find((section) =>
      line.trim().startsWith(`## ${section}`)
    );

    if (sectionMatch) {
      // Save previous section if we were in one
      if (inWantedSection && currentSection.length > 0) {
        result.push(currentSection.join("\n"));
      }
      currentSection = [line];
      inWantedSection = true;
    } else if (line.startsWith("## ") && inWantedSection) {
      // We've hit a new section, and we were in a wanted section
      result.push(currentSection.join("\n"));
      currentSection = [];
      inWantedSection = false;
    } else if (inWantedSection) {
      currentSection.push(line);
    }
  }

  // Don't forget the last section
  if (inWantedSection && currentSection.length > 0) {
    result.push(currentSection.join("\n"));
  }

  return result.join("\n\n");
}

/**
 * Get all available category IDs from documentation files
 */
export function getAllDocCategories(): string[] {
  try {
    const files = readdirSync(OWASP_DOCS_PATH);
    const categories: string[] = [];

    for (const file of files) {
      if (file.endsWith(".md")) {
        // Extract prefix (e.g., "0xa1") and map to category ID
        const match = file.match(/^0x([a-z0-9]+)-/);
        if (match) {
          const prefix = "0x" + match[1].toUpperCase();
          // Map back to API1, API2, etc.
          const categoryMap: Record<string, string> = {
            "0XA1": "API1",
            "0XA2": "API2",
            "0XA3": "API3",
            "0XA4": "API4",
            "0XA5": "API5",
            "0XA6": "API6",
            "0XA7": "API7",
            "0XA8": "API8",
            "0XA9": "API9",
            "0XAA": "API10",
          };

          const categoryId = categoryMap[prefix.toUpperCase()];
          if (categoryId && !categories.includes(categoryId)) {
            categories.push(categoryId);
          }
        }
      }
    }

    return categories.sort();
  } catch (error) {
    console.error("[docsLoader] Failed to read owasp-docs directory:", error);
    return [];
  }
}
