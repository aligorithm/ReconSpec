import type { OWASPCategory } from "../types.js";

export const API2: OWASPCategory = {
  id: "API2",
  name: "Broken Authentication",
  shortName: "Broken Auth",
  description:
    "The authentication mechanism is an easy target for attackers since it's exposed to everyone. Although more advanced technical skills may be required to exploit some authentication issues, exploitation tools are generally available. Attackers can gain complete control of other users' accounts in the system, read their personal data, and perform sensitive actions on their behalf.",
  cwe: ["CWE-204", "CWE-307"],
  relevanceIndicators: [
    "Endpoints with paths containing login, auth, token, register, password, signin, signup",
    "Request bodies with password, credential, currentPassword, newPassword fields",
    "Endpoints that accept authentication credentials in the request body",
    "Token refresh endpoints accepting refresh tokens in body or query params",
    "Endpoints returning authentication tokens or session identifiers",
    "Password reset endpoints accepting user identifiers without proper validation",
    "Endpoints accepting username/password for authentication",
  ],
  commonPatterns: [
    "POST /auth/login - Accept username/password credentials",
    "POST /auth/register - Create new user account",
    "POST /auth/refresh - Refresh access token",
    "POST /auth/password/reset - Reset forgotten password",
    "POST /users/login - Legacy login endpoint pattern",
  ],
};
