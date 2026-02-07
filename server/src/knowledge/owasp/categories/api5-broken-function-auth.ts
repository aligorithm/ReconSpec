import type { OWASPCategory } from "../types.js";

export const API5: OWASPCategory = {
  id: "API5",
  name: "Broken Function Level Authorization",
  shortName: "Function Auth",
  description:
    "This vulnerability allows attackers to access functionality they should not be able to reach. It occurs when APIs fail to verify that the user has permission to invoke specific functions or operations, not just access specific objects.",
  cwe: ["CWE-285", "CWE-863"],
  relevanceIndicators: [
    "Admin-only endpoints without visible role checks in the spec",
    "Endpoints with paths containing /admin, /manage, /config, /system, /control",
    "Endpoints performing sensitive operations (delete, reset, bulk operations) without apparent authorization",
    "Debug or test endpoints exposed in production",
    "Endpoints for bulk operations without visible permission requirements",
    "Configuration or system management endpoints",
    "Endpoints that modify global settings or system state",
  ],
  commonPatterns: [
    "POST /admin/reset - System reset accessible to non-admins",
    "DELETE /users/{id} - User deletion without admin verification",
    "POST /config/update - Configuration changes without authorization",
    "GET /debug/info - Debug information leaked to unprivileged users",
    "POST /bulk/delete - Bulk operations without elevated permission checks",
  ],
};
