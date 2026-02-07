import type { OWASPCategory } from "../types.js";

export const API5: OWASPCategory = {
  id: "API5",
  name: "Broken Function Level Authorization",
  shortName: "Function Auth",
  description:
    "Exploitation requires the attacker to send legitimate API calls to an API endpoint that they should not have access to as anonymous users or regular, non-privileged users. Such flaws allow attackers to access unauthorized functionality. Administrative functions are key targets and may lead to data disclosure, data loss, or data corruption.",
  cwe: ["CWE-285"],
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
