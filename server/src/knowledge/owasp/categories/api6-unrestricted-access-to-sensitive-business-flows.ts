import type { OWASPCategory } from "../types.js";

export const API6: OWASPCategory = {
  id: "API6",
  name: "Unrestricted Access to Sensitive Business Flows",
  shortName: "Business Flows",
  description:
    "Exploitation usually involves understanding the business model backed by the API, finding sensitive business flows, and automating access to these flows, causing harm to the business. An API Endpoint is vulnerable if it exposes a sensitive business flow, without appropriately restricting the access to it.",
  cwe: [],
  relevanceIndicators: [
    "Endpoints involved in purchase or checkout flows",
    "Password reset or account recovery workflows",
    "Account registration or verification endpoints",
    "Endpoints accepting promo codes, discounts, or coupons",
    "Payment processing endpoints without visible rate limiting",
    "Endpoints in workflows that could be automated for abuse (e.g., voting, scraping)",
    "Trial account or free tier signup endpoints",
  ],
  commonPatterns: [
    "POST /checkout - Checkout process exploitable for automation",
    "POST /auth/reset-password - Password reset abuse",
    "POST /accounts/create - Automated account creation",
    "POST /cart/apply-coupon - Coupon brute-forcing",
    "GET /search - Data scraping via automated queries",
  ],
};
