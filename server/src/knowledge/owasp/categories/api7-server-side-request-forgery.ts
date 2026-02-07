import type { OWASPCategory } from "../types.js";

export const API7: OWASPCategory = {
  id: "API7",
  name: "Server-Side Request Forgery (SSRF)",
  shortName: "SSRF",
  description:
    "Server-Side Request Forgery (SSRF) flaws occur when an API is fetching a remote resource without validating the user-supplied URL. It enables an attacker to coerce the application to send a crafted request to an unexpected destination, even when protected by a firewall or a VPN. Modern concepts in application development make SSRF more common and more dangerous.",
  cwe: ["CWE-918"],
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
