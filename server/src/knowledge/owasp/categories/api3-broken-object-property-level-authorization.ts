import type { OWASPCategory } from "../types.js";

export const API3: OWASPCategory = {
  id: "API3",
  name: "Broken Object Property Level Authorization",
  shortName: "Property Auth",
  description:
    "APIs tend to expose endpoints that return all object's properties. This is particularly valid for REST APIs. For other protocols such as GraphQL, it may require crafted requests to specify which properties should be returned. Unauthorized access to private/sensitive object properties may result in data disclosure, data loss, or data corruption.",
  cwe: ["CWE-213", "CWE-915"],
  // Priority indicators: When these patterns are present, BOPLA testing should be prioritized (higher relevance score)
  // However, ANY POST/PUT/PATCH endpoint with a request body is worth testing for mass assignment
  relevanceIndicators: [
    // High priority indicators (70-100 score):
    "Request bodies containing sensitive field names: role, isAdmin, admin, permissions, status, tier, subscription, balance, verified, quota, enabled, disabled",
    "Schema references with hidden sensitive properties not exposed in the endpoint (e.g., schema defines 'role' but endpoint only shows 'name' and 'email')",
    "User creation/update endpoints (POST /users, PUT /users/{id}, PATCH /users/{id}) with administrative properties",
    "Endpoints accepting profile fields like emailVerified, subscriptionLevel, balance, credits, quota that could influence access or billing",

    // Medium priority indicators (50-69 score):
    "POST/PUT/PATCH endpoints with request bodies - these accept user-modifiable data and mass assignment testing is relevant",
    "Request body referencing a schema ($ref) - may have additional properties not shown in documentation",
    "Endpoints that modify user-controlled data (profile settings, preferences, account details)",
    "Endpoints with fields that influence business logic (type, accountType, plan, organizationId)",

    // Always worth considering:
    "Any endpoint accepting object creation or modification should be considered for mass assignment testing, even without obvious sensitive fields",
  ],
  commonPatterns: [
    "POST /users or PUT /users/{id} with role field allowing privilege escalation",
    "PATCH /users/{userId} with isAdmin field allowing admin takeover",
    "PUT /orders/{orderId} with status field allowing unauthorized state changes",
    "POST /accounts with accountType field allowing tier upgrades",
    "PATCH /profiles with verified: true field allowing self-verification",
    "Mass assignment via schema gaps: POST /users accepts {name, email} but schema allows {role, isAdmin, subscriptionTier, balance}",
    "Hidden property exploitation: PATCH /profile shows {displayName} but allSchemaProperties includes {emailVerified, isPremium, accountStatus}",
  ],
};
