import type { OWASPCategory } from "../types.js";

export const API10: OWASPCategory = {
  id: "API10",
  name: "Unsafe Consumption of APIs",
  shortName: "Unsafe Consumption",
  description:
    "Developers often trust third-party APIs or services more than their own. This vulnerability occurs when APIs integrate with external services without proper validation, rate limiting, or security controls, allowing attackers to exploit the trust relationship.",
  cwe: ["CWE-939", "CWE-345"],
  relevanceIndicators: [
    "Endpoints that forward or proxy data to third-party APIs",
    "Integration endpoints with external services (payment, auth, analytics)",
    "Endpoints accepting data from third parties without proper validation",
    "Webhook endpoints that process external data",
    "Endpoints with fields like callbackUrl, webhook, integrationId suggesting external integrations",
    "Endpoints that trust headers or data from upstream services",
    "Payment processing endpoints using third-party payment gateways",
  ],
  commonPatterns: [
    "POST /payments forwarding to Stripe without proper validation",
    "POST /webhooks/stripe processing webhook data without signature verification",
    "GET /proxy/{service} - Open proxy to external APIs",
    "POST /auth/sso trusting SSO responses without verification",
    "POST /integrations/{service} sending data to third parties without sanitization",
  ],
};
