import type { OWASPCategory } from "../types.js";

export const API3: OWASPCategory = {
  id: "API3",
  name: "Broken Object Property Level Authorization",
  shortName: "Property Auth",
  description:
    "APIs tend to expose endpoints that return all object's properties. This is particularly valid for REST APIs. For other protocols such as GraphQL, it may require crafted requests to specify which properties should be returned. Unauthorized access to private/sensitive object properties may result in data disclosure, data loss, or data corruption.",
  cwe: ["CWE-213", "CWE-915"],
  relevanceIndicators: [
    "PUT/PATCH request bodies with fields like role, status, isAdmin, permissions, admin, type",
    "Request body schemas that include properties which appear in the response but seem administrative or sensitive",
    "Endpoints that accept the same schema for creation and update (allowing mass assignment)",
    "User profile update endpoints accepting fields like emailVerified, subscriptionLevel, balance",
    "Endpoints accepting user role or permission fields in request body",
    "Create/update operations with objects containing privileged fields",
    "Endpoints with status or tier fields that control access levels",
    "Request body referencing a schema ($ref) but exposing only subset of properties - hidden properties may be testable for mass assignment",
    "Mass assignment via hidden properties: POST /users only exposes {name, email} but User schema defines {role, isAdmin, balance}",
    "Schema references with hidden sensitive properties like tier, subscriptionLevel, verified, disabled, quota",
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
