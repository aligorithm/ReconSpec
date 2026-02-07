import type { OWASPCategory } from "../types.js";

export const API4: OWASPCategory = {
  id: "API4",
  name: "Unrestricted Resource Consumption",
  shortName: "Unlimited Resources",
  description:
    "APIs that do not limit the resources they consume are vulnerable to denial of service attacks. This includes unlimited request sizes, unbounded query results, lack of rate limiting, and expensive operations that can be abused to exhaust server resources.",
  cwe: ["CWE-770", "CWE-400", "CWE-502"],
  relevanceIndicators: [
    "GET endpoints accepting limit, count, or size parameters without apparent maximum values",
    "Endpoints accepting pagination parameters without enforced limits",
    "File upload endpoints without visible file size constraints in the schema",
    "Query endpoints accepting array or list parameters without length restrictions",
    "Search or filter endpoints that could return large result sets",
    "Endpoints accepting depth or recursion parameters",
    "Endpoints with query strings that could cause expensive database operations",
  ],
  commonPatterns: [
    "GET /items?limit=1000000 - Unbounded pagination",
    "POST /upload with file size not limited",
    "GET /search with complex filter combinations",
    "GET /reports with date ranges spanning years",
    "POST /bulk with large arrays of items",
  ],
};
