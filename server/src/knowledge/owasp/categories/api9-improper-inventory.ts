import type { OWASPCategory } from "../types.js";

export const API9: OWASPCategory = {
  id: "API9",
  name: "Improper Inventory Management",
  shortName: "Inventory Mgmt",
  description:
    "APIs have different versions, and older versions may be deprecated but still accessible. Improper inventory management allows attackers to exploit known vulnerabilities in older API versions or abuse administrative endpoints that should not be public.",
  cwe: ["CWE-284", "CWE-215"],
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
