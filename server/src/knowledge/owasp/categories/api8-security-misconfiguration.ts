import type { OWASPCategory } from "../types.js";

export const API8: OWASPCategory = {
  id: "API8",
  name: "Security Misconfiguration",
  shortName: "Misconfiguration",
  description:
    "Attackers will often attempt to find unpatched flaws, common endpoints, services running with insecure default configurations, or unprotected files and directories to gain unauthorized access. Security misconfigurations not only expose sensitive user data, but also system details that can lead to full server compromise.",
  cwe: ["CWE-2", "CWE-16", "CWE-209", "CWE-319", "CWE-388", "CWE-444", "CWE-942"],
  relevanceIndicators: [
    "String fields with no format, pattern, or enum constraints suggesting possible injection",
    "Endpoints with no authentication requirement defined in the spec",
    "Endpoints returning stack traces or detailed error information",
    "Debug or test endpoints exposed",
    "CORS headers allowing all origins in response definitions",
    "Endpoints missing rate limiting information",
    "Auto-generated documentation exposing internal structure",
    "Endpoints returning detailed error messages with implementation details",
  ],
  commonPatterns: [
    "POST /login returning detailed 'Invalid password for user@example.com' messages",
    "GET /debug exposing stack traces",
    "OPTIONS requests returning overly permissive CORS headers",
    "Error responses revealing database or technology information",
    "Default credentials or test accounts in documentation",
  ],
};
