import type { OWASPCategory } from "../types.js";

export const API10: OWASPCategory = {
  id: "API10",
  name: "Unsafe Consumption of APIs",
  shortName: "Unsafe Consumption",
  description:
    "Developers tend to trust data received from third-party APIs more than user input. Because of that, developers tend to adopt weaker security standards, for instance, in regards to input validation and sanitization. Successful exploitation may lead to sensitive information exposure to unauthorized actors, many kinds of injections, or denial of service.",
  cwe: ["CWE-20", "CWE-200", "CWE-319"],
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
