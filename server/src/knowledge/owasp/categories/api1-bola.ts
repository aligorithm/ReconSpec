import type { OWASPCategory } from "../types.js";

export const API1: OWASPCategory = {
  id: "API1",
  name: "Broken Object Level Authorization",
  shortName: "Broken Object Auth",
  description:
    "APIs tend to handle object-level authorization by checking that the logged-in user has permission to access the object. However, developers often forget to enforce this check, leading to unauthorized access to data belonging to other users.",
  cwe: ["CWE-285", "CWE-862", "CWE-863"],
  relevanceIndicators: [
    "Path parameters with names like id, userId, orderId, petId, accountId suggesting direct object references",
    "GET/PUT/DELETE/PATCH endpoints with resource identifiers in the path",
    "Endpoints that return user-specific data based on a path or query parameter",
    "Endpoints accepting a resource identifier in query parameters (?id=123)",
    "Endpoints that operate on sequential or predictable IDs",
    "Endpoints with paths containing /users/{userId}, /pets/{petId}, /orders/{orderId} patterns",
    "Endpoints accepting account or profile IDs as input",
  ],
  commonPatterns: [
    "GET /users/{userId} - Retrieve another user's profile",
    "PUT /users/{userId} - Update another user's data",
    "DELETE /pets/{petId} - Delete a pet owned by a different user",
    "GET /orders/{orderId} - View orders placed by another customer",
    "PATCH /accounts/{accountId} - Modify account settings for different account",
  ],
};
