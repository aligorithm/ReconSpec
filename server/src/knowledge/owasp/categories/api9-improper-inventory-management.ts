import type { OWASPCategory } from "../types.js";

export const API9: OWASPCategory = {
  id: "API9",
  name: "Improper Inventory Management",
  shortName: "Inventory",
  description:
    "The sprawled and connected nature of APIs and modern applications brings new challenges. Running multiple versions of an API requires additional management resources and expands the attack surface. Threat agents may exploit deprecated endpoints available in old API versions to get access to administrative functions or exploit known vulnerabilities.",
  cwe: ["CWE-1059"],
  relevanceIndicators: [
    "Multiple API versions accessible simultaneously (/v1/, /v2/, /v3/)",
    "Deprecated endpoints marked but still exposed in the spec",
    "Admin or management endpoints exposed in production API specs",
    "Debug or test endpoints included in production documentation",
    "Endpoints with legacy or deprecated tags still accessible",
    "Version parameters allowing access to older API versions",
    "Undocumented endpoints discovered through enumeration",
  ],
  commonPatterns: [
    "GET /api/v1/users - Old version with known vulnerabilities",
    "POST /api/v2/legacy - Deprecated endpoint still active",
    "GET /admin/users - Admin endpoint exposed publicly",
    "POST /debug/test - Debug endpoint in production",
    "PUT /internal/config - Internal management endpoint accessible",
  ],
};
