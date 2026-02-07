import type { OWASPCategory } from "../types.js";

export const API7_SSRF: OWASPCategory = {
  id: "API7",
  name: "Server-Side Request Forgery (SSRF)",
  shortName: "SSRF",
  description:
    "SSRF vulnerabilities occur when an API fetches a remote resource without validating the user-supplied URL. This allows attackers to force the server to make requests to internal services, cloud metadata endpoints, or other unintended destinations.",
  cwe: ["CWE-918", "CWE-441"],
  relevanceIndicators: [
    "Request body or query parameters with names like url, link, href, endpoint, callback, webhook, redirect, target, host",
    "Fields with names suggesting URLs: photoUrl, avatarUrl, callbackUrl, webhookUrl, returnUrl, redirectUri",
    "Endpoints that accept URLs as input and may fetch from them",
    "Webhook registration or callback configuration endpoints",
    "Endpoints with proxy or fetch functionality",
    "File upload via URL endpoints",
    "Endpoints accepting external service URLs for integration",
  ],
  commonPatterns: [
    "POST /users with avatarUrl parameter - SSRF via avatar fetch",
    "POST /webhooks with url field - SSRF via webhook registration",
    "GET /proxy?url= - Open proxy functionality",
    "POST /import?url= - Fetching resources from user-supplied URLs",
    "POST /integrations with callbackUrl - SSRF via integrations",
  ],
};
