import type { OWASPCategory } from "../types.js";

export const API3: OWASPCategory = {
  id: "API3",
  name: "Broken Object Property Level Authorization",
  shortName: "Object Property Auth",
  description:
    "This vulnerability allows attackers to access or modify properties of objects they should not have access to. This often occurs when APIs automatically trust client-provided data without verifying which properties are allowed for the current user's role or permission level.",
  cwe: ["CWE-642", "CWE-862"],
  relevanceIndicators: [
    "PUT/PATCH request bodies with fields like role, status, isAdmin, permissions, admin, type",
    "Request body schemas that include properties which appear in the response but seem administrative or sensitive",
    "Endpoints that accept the same schema for creation and update (allowing mass assignment)",
    "User profile update endpoints accepting fields like emailVerified, subscriptionLevel, balance",
    "Endpoints accepting user role or permission fields in request body",
    "Create/update operations with objects containing privileged fields",
    "Endpoints with status or tier fields that control access levels",
  ],
  commonPatterns: [
    "POST /users or PUT /users/{id} with role field allowing privilege escalation",
    "PATCH /users/{userId} with isAdmin field allowing admin takeover",
    "PUT /orders/{orderId} with status field allowing unauthorized state changes",
    "POST /accounts with accountType field allowing tier upgrades",
    "PATCH /profiles with verified: true field allowing self-verification",
  ],
};
