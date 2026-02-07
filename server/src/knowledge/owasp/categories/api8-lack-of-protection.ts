import type { OWASPCategory } from "../types.js";

export const API8_Misconfiguration: OWASPCategory = {
  id: "API8",
  name: "Security Misconfiguration",
  shortName: "Misconfiguration",
  description:
    "Security misconfiguration is one of the most common vulnerabilities. It occurs when APIs have improper security settings, default configurations, overly verbose error messages, or missing security headers.",
  cwe: ["CWE-16", "CWE-215", "CWE-927"],
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
