/**
 * Testing Techniques Knowledge Base
 *
 * Structured testing methodologies for different vulnerability categories.
 * These are selectively included in Phase B prompts based on the OWASP category.
 */

/**
 * A testing technique with actionable steps
 */
export interface TestingTechnique {
  id: string;
  name: string;
  applicableCategories: string[];     // OWASP category IDs this applies to
  description: string;
  steps: string[];                    // Generic testing steps
  whatToObserve: string[];            // What to look for in responses
  toolSuggestions: string[];          // Relevant tools (Burp, sqlmap, etc.)
}

/**
 * Get all techniques applicable to a category
 */
export function getTechniquesForCategory(categoryId: string): TestingTechnique[] {
  const all = getAllTechniques();
  return all.filter(t => t.applicableCategories.includes(categoryId));
}

/**
 * Get all techniques
 */
export function getAllTechniques(): TestingTechnique[] {
  return [
    ...AUTHORIZATION_TECHNIQUES,
    ...AUTHENTICATION_TECHNIQUES,
    ...INJECTION_TECHNIQUES,
    ...SSRF_TECHNIQUES,
    ...INPUT_VALIDATION_TECHNIQUES,
    ...RESOURCE_CONSUMPTION_TECHNIQUES,
  ];
}

// Authorization techniques (API1, API3, API5)
const AUTHORIZATION_TECHNIQUES: TestingTechnique[] = [
  {
    id: "bola-id-iteration",
    name: "ID Iteration / Parameter Tampering",
    applicableCategories: ["API1", "API3"],
    description: "Sequentially increment or change identifiers to access unauthorized resources",
    steps: [
      "Identify parameters that reference resources (userId, orderId, petId, etc.)",
      "Submit requests with modified identifiers while keeping the same authentication token",
      "Test predictable IDs: sequential integers, UUIDs with patterns, hashed identifiers",
      "Attempt to access resources belonging to other users or roles",
      "Try accessing administrative or system resources with elevated IDs",
    ],
    whatToObserve: [
      "200 OK with data from different user's resource",
      "200 OK with data you shouldn't have access to",
      "404/403 for some IDs but not others (inconsistent access control)",
      "Different response times indicating access control bypass",
    ],
    toolSuggestions: ["Burp Intruder (number payloads)", "Postman with Collection Runner", "FFUF", "Bruno"],
  },
  {
    id: "bola-path-traversal",
    name: "Path Traversal in Resource Identifiers",
    applicableCategories: ["API1"],
    description: "Manipulate path parameters to access parent or sibling resources",
    steps: [
      "Test path parameters with directory traversal: ../, ..\\, %2e%2e/",
      "Attempt to bypass path sanitization with double encoding: %252e%252e/",
      "Test URL encoding variations: %2e%2e, ..%2f, ..%5c",
      "Wrap identifiers in path traversal: ../users/{targetId}/profile",
      "Test with encoded null bytes: ../%00admin",
    ],
    whatToObserve: [
      "200 OK returning data from different path",
      "Error messages revealing filesystem structure",
      "Unexpected redirect behavior",
    ],
    toolSuggestions: ["Burp Repeater", "curl with URL encoding", "Postman"],
  },
  {
    id: "bola-property-manipulation",
    name: "Object Property Mass Assignment",
    applicableCategories: ["API3"],
    description: "Submit additional properties in request body to modify fields that should be read-only",
    steps: [
      "Identify all object properties from schema and documentation",
      "Submit requests adding properties that shouldn't be modifiable (role, isAdmin, quota, status)",
      "Test properties in different formats: role=admin, role: 'admin', role: {\"admin\": true}",
      "Try nested properties: user.role=admin, permissions.role=admin",
      "Submit with array variations: roles=['admin', 'user']",
    ],
    whatToObserve: [
      "200 OK with object reflecting unintended property changes",
      "Objects created with elevated privileges",
      "Privilege escalation reflected in subsequent GET requests",
    ],
    toolSuggestions: ["Burp Suite", "OWASP ZAP", "Postman with pre-request scripts"],
  },
  {
    id: "bfla-method-enumeration",
    name: "HTTP Method Bypass",
    applicableCategories: ["API5"],
    description: "Access restricted functionality by changing the HTTP method",
    steps: [
      "Identify privileged operations (DELETE, PUT, PATCH)",
      "Attempt to access the same endpoint with different methods: GET, POST, OPTIONS",
      "Test method override headers: X-HTTP-Method-Override, X-HTTP-Method",
      "Try lowercase method names or mixed case",
      "Test with malformed methods combined with valid endpoints",
    ],
    whatToObserve: [
      "200 OK on privileged endpoint with unprivileged method",
      "Different error messages revealing routing logic",
      "OPTIONS revealing allowed methods that shouldn't be permitted",
    ],
    toolSuggestions: ["Burp Repeater", "curl -X", "Postman"],
  },
  {
    id: "bfla-path-variation",
    name: "Path Variation for Function-Level Bypass",
    applicableCategories: ["API5"],
    description: "Access administrative functions by manipulating request paths",
    steps: [
      "Test adding prefixes: /api/v2/admin/users vs /api/users",
      "Try path case variations: /admin/users, /Admin/users, /ADMIN/users",
      "Test double slashes: /admin//users",
      "Try URL encoding in path: %61dmin/users",
      "Test trailing slashes and path variations: /admin/users/, /admin/users/.",
    ],
    whatToObserve: [
      "200 OK on administrative path with non-admin credentials",
      "Inconsistent routing behavior",
      "Error messages leaking path information",
    ],
    toolSuggestions: ["FFUF for path fuzzing", "Burp Intruder", "Dirb"],
  },
];

// Authentication techniques (API2)
const AUTHENTICATION_TECHNIQUES: TestingTechnique[] = [
  {
    id: "auth-credential-stuffing",
    name: "Credential Stuffing and Password Guessing",
    applicableCategories: ["API2"],
    description: "Test for weak password policies and credential reuse vulnerabilities",
    steps: [
      "Test with common passwords: password123, admin123, welcome, qwerty",
      "Try username as password (common pattern)",
      "Test with leaked credentials from public breaches",
      "Enumerate valid usernames via registration or password reset endpoints",
      "Test account lockout mechanisms by failing authentication multiple times",
    ],
    whatToObserve: [
      "200 OK / authentication success with weak passwords",
      "No rate limiting or account lockout after multiple failures",
      "Different response times for valid vs invalid usernames",
      "Error messages revealing valid usernames",
    ],
    toolSuggestions: ["Burp Intruder", "Hydra", "Patator", "SecLists wordlists"],
  },
  {
    id: "auth-token-manipulation",
    name: "JWT and Session Token Manipulation",
    applicableCategories: ["API2"],
    description: "Manipulate authentication tokens to bypass authentication",
    steps: [
      "Decode JWT tokens and examine claims: alg, typ, exp, nbf, roles",
      "Test 'none' algorithm: set header alg to none, remove signature",
      "Try algorithm confusion: RS256 tokens manipulated with HS256",
      "Modify token expiration: set exp to future date or remove it entirely",
      "Escalate privileges by modifying role claims: role=admin, is_admin=true",
      "Re-sign tokens with weak keys if public key is exposed",
    ],
    whatToObserve: [
      "200 OK with modified or unsigned tokens",
      "Tokens accepted without signature verification",
      "Privilege escalation successful with modified claims",
      "Error messages revealing token validation logic",
    ],
    toolSuggestions: ["jwt_tool", "jwt.io decoder", "Burp Extension JWT Editor", "cURL"],
  },
  {
    id: "auth-session-fixation",
    name: "Session Fixation and Hijacking",
    applicableCategories: ["API2"],
    description: "Test for session management vulnerabilities",
    steps: [
      "Authenticate and capture session token",
      "Log out and attempt to reuse the same session token",
      "Test with tokens from different users (session hijacking)",
      "Check if session tokens change after authentication",
      "Test concurrent sessions with same credentials",
    ],
    whatToObserve: [
      "Session remains valid after logout",
      "Can reuse another user's session token",
      "Session token doesn't change after privilege escalation",
      "Multiple concurrent sessions allowed without limit",
    ],
    toolSuggestions: ["Burp Suite", "Postman", "browser dev tools"],
  },
];

// Injection techniques (API8, and others)
const INJECTION_TECHNIQUES: TestingTechnique[] = [
  {
    id: "injection-sql",
    name: "SQL Injection Testing",
    applicableCategories: ["API8"],
    description: "Inject SQL payloads to manipulate database queries",
    steps: [
      "Test with single quote bypass: ' or 1=1--",
      "Try double quotes: \\\" or 1=1#",
      "Test time-based: ' OR SLEEP(5)--",
      "Test error-based: ' AND extractvalue(1, concat(0x7e, database(), 0x7e))--",
      "Try UNION-based: ' UNION SELECT NULL, username, password FROM users--",
      "Test with stacked queries: '; DROP TABLE users; --",
    ],
    whatToObserve: [
      "Database error messages in responses (SQL syntax revealed)",
      "Response time delays indicating time-based injection",
      "Auth bypass with OR 1=1",
      "Unexpected data returned from UNION queries",
    ],
    toolSuggestions: ["sqlmap", "Burp Intruder", "SQLNinja", "commix"],
  },
  {
    id: "injection-nosql",
    name: "NoSQL Injection Testing",
    applicableCategories: ["API8"],
    description: "Test NoSQL-specific injection patterns (MongoDB, Cassandra, etc.)",
    steps: [
      "Test JSON operators: {\"$ne\": null} to bypass authentication",
      "Try regex injection: {\"$regex\": \".*\"}",
      "Test boolean bypass: {\"$gt\": \"\"}",
      "Attempt NoSQL-specific operators: $where, $expr, $in, $nin",
      "Test with PHP array serialization: username[$ne]=null",
    ],
    whatToObserve: [
      "Authentication bypass with NoSQL operators",
      "Error messages revealing database type",
      "Different responses for successful vs failed injections",
    ],
    toolSuggestions: ["NoSQLMap", "Burp Intruder with NoSQL payloads", "Postman"],
  },
  {
    id: "injection-command",
    name: "Command Injection Testing",
    applicableCategories: ["API8"],
    description: "Inject operating system commands",
    steps: [
      "Test command separators: ;, &&, ||, |, ``, $()",
      "Try basic commands: ; ls, ; whoami, ; pwd",
      "Test with backticks: `whoami`",
      "Try variable substitution: $(cat /etc/passwd)",
      "Test with pipe: | cat /etc/passwd",
    ],
    whatToObserve: [
      "Command output reflected in response",
      "Error messages revealing OS type",
      "Response time differences",
      "DNS callbacks indicating command execution",
    ],
    toolSuggestions: ["commix", "Burp Intruder", "curl"],
  },
  {
    id: "injection-xss",
    name: "Cross-Site Scripting (XSS) Testing",
    applicableCategories: ["API8"],
    description: "Inject scripts that execute in client contexts",
    steps: [
      "Test reflected XSS: <script>alert(1)</script>",
      "Try img tag: <img src=x onerror=alert(1)>",
      "Test event handlers: onmouseover, onload, onerror",
      "Try with HTML encoding: &lt;script&gt;alert(1)&lt;/script&gt;",
      "Test stored XSS in data that will be rendered later",
      "Try DOM-based payloads: #<img src=x onerror=alert(1)>",
    ],
    whatToObserve: [
      "Payload returned unescaped in responses",
      "Payload stored and rendered in later requests",
      "CSP headers missing or misconfigured",
    ],
    toolSuggestions: ["XSStrike", "Burp Suite", "beef", "browser dev tools"],
  },
];

// SSRF techniques (API7)
const SSRF_TECHNIQUES: TestingTechnique[] = [
  {
    id: "ssrf-basic",
    name: "Server-Side Request Forgery (SSRF)",
    applicableCategories: ["API7"],
    description: "Manipulate URLs to make the server send requests to unintended destinations",
    steps: [
      "Test with internal IPs: http://127.0.0.1, http://localhost:8080",
      "Try private network ranges: http://192.168.1.1, http://10.0.0.1",
      "Test with AWS metadata: http://169.254.169.254/latest/meta-data/",
      "Try URL encoding bypass: http://%31127.0.0.1",
      "Test with IPv6: ::1, [::1]",
      "Try DNS rebinding: http://attacker.com (with TTL 0)",
    ],
    whatToObserve: [
      "Response data from internal services",
      "Different response times for internal requests",
      "Error messages revealing internal infrastructure",
      "Metadata service responses",
    ],
    toolSuggestions: ["Burp Intruder", "curl", "interactsh", "dnslog.cn"],
  },
];

// Input validation techniques (API9, API8)
const INPUT_VALIDATION_TECHNIQUES: TestingTechnique[] = [
  {
    id: "input-boundary",
    name: "Boundary Value and Type Testing",
    applicableCategories: ["API8"],
    description: "Test input validation limits and type enforcement",
    steps: [
      "Test numeric boundaries: -1, 0, MAX_INT, MAX_INT+1",
      "Try string length limits: empty string, max length+1, 10000 chars",
      "Test with unexpected types: number for string field, array for object",
      "Try special characters: null bytes, unicode, emojis",
      "Test with malformed data: truncated JSON, extra commas",
    ],
    whatToObserve: [
      "Different error messages revealing validation logic",
      "500 errors indicating unhandled exceptions",
      "Data corruption or truncation",
    ],
    toolSuggestions: ["Burp Intruder", "JFuzz", "zzuf"],
  },
  {
    id: "mass-assignment",
    name: "Mass Assignment via Extra Parameters",
    applicableCategories: ["API3", "API8"],
    description: "Submit additional parameters to test for over-posting vulnerabilities",
    steps: [
      "Reverse-engineer object schema from documentation and responses",
      "Submit requests with all possible fields, including sensitive ones",
      "Test with nested objects: user.role=admin instead of role",
      "Try array manipulations: tags=[\"admin\", \"user\"]",
      "Test properties that should be read-only: id, _id, createdAt, updatedAt",
    ],
    whatToObserve: [
      "Objects saved with unintended property values",
      "Privilege escalation via property manipulation",
      "Objects created with overridden system fields",
    ],
    toolSuggestions: ["Postman", "Burp Suite"],
  },
];

// Resource consumption techniques (API4)
const RESOURCE_CONSUMPTION_TECHNIQUES: TestingTechnique[] = [
  {
    id: "resource-bypass-limit",
    name: "Rate Limit and Quota Bypass",
    applicableCategories: ["API4"],
    description: "Test for insufficient rate limiting and resource quotas",
    steps: [
      "Send rapid requests to the same endpoint (100+ requests)",
      "Test from multiple sessions or tokens simultaneously",
      "Try IP rotation via different source addresses",
      "Test with different user agents or headers",
      "Attempt quota bypass: request 1GB instead of 1MB",
      "Test pagination limits: request page=999999",
    ],
    whatToObserve: [
      "No rate limiting (all requests succeed)",
      "Rate limit can be bypassed with header manipulation",
      "Server exhaustion (slow responses, 500 errors)",
      "Memory exhaustion on client",
    ],
    toolSuggestions: ["Apache Bench (ab)", "wrk", "hey", "JMeter"],
  },
  {
    id: "resource-dos",
    name: "Denial of Service via Expensive Operations",
    applicableCategories: ["API4"],
    description: "Trigger expensive operations to cause denial of service",
    steps: [
      "Request large datasets: limit=1000000",
      "Try complex search queries with nested wildcards",
      "Test with deeply nested data structures",
      "Attempt to trigger expensive aggregations or joins",
      "Submit simultaneous expensive requests from multiple threads",
    ],
    whatToObserve: [
      "Response times increase dramatically",
      "Server becomes unresponsive",
      "500 errors indicating resource exhaustion",
      "Memory/CPU spikes on server",
    ],
    toolSuggestions: ["Apache Bench", "wrk", "locust"],
  },
];
