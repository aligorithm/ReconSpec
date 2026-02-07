import type { OWASPCategory } from "../types.js";

export const API6: OWASPCategory = {
  id: "API6",
  name: "Unrestricted Access to Sensitive Business Flows",
  shortName: "Business Flows",
  description:
    "APIs often expose business flows that should be protected against automated abuse. This includes workflows like password recovery, account creation, payment processing, and purchasing that can be exploited by automating the process.",
  cwe: ["CWE-840", "CWE-502"],
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
