import type { OWASPCategory } from "../types.js";

export const API4: OWASPCategory = {
  id: "API4",
  name: "Unrestricted Resource Consumption",
  shortName: "Resource Consumption",
  description:
    "Satisfying API requests requires resources such as network bandwidth, CPU, memory, and storage. Sometimes required resources are made available by service providers via API integrations, and paid for per request. Exploitation can lead to DoS due to resource starvation, but it can also lead to operational costs increase.",
  cwe: ["CWE-770", "CWE-400", "CWE-799"],
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
