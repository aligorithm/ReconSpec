# ReconSpec: Architecture and Technical Decisions

## High-Level Architecture

ReconSpec is a client-server application with a React frontend and a Node/Express backend. LLM calls are made server-side to keep API keys off the client. The frontend handles spec display, user interaction, and state management, while the backend handles spec parsing, LLM orchestration, and knowledge base management.

```
┌─────────────────────────────────────────────────┐
│                React Frontend                    │
│  ┌───────────┐ ┌────────────┐ ┌──────────────┐  │
│  │ Spec      │ │ Endpoint   │ │ Provider     │  │
│  │ Importer  │ │ Renderer + │ │ Config       │  │
│  │ (JSON/    │ │ Security   │ │ (BYOK)       │  │
│  │  YAML)    │ │ Panels     │ │              │  │
│  └───────────┘ └────────────┘ └──────────────┘  │
│  ┌───────────┐ ┌────────────┐                    │
│  │ API       │ │ Test Plan  │                    │
│  │ Summary   │ │ Editor     │                    │
│  │ + Risks   │ │            │                    │
│  └───────────┘ └────────────┘                    │
└──────────────────────┬──────────────────────────┘
                       │ REST API
┌──────────────────────┴──────────────────────────┐
│              Node/Express Backend                │
│  ┌───────────┐ ┌────────────┐ ┌──────────────┐  │
│  │ Spec      │ │ Analysis   │ │ LLM Gateway  │  │
│  │ Parser &  │ │ Engine     │ │ (multi-      │  │
│  │ Validator │ │ (OWASP +   │ │  provider)   │  │
│  │           │ │  knowledge │ │              │  │
│  │           │ │  base)     │ │              │  │
│  └───────────┘ └────────────┘ └──────────────┘  │
│  ┌───────────────────────────────────────────┐   │
│  │ Knowledge Base (structured OWASP data,    │   │
│  │ testing techniques, payload patterns)     │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## Project Structure

```
reconspec/
├── client/          # React + TypeScript (Vite)
├── server/          # Node/Express + TypeScript
├── shared/          # Shared TypeScript types/interfaces
│   ├── models/      # Endpoint, AttackScenario, etc.
│   └── constants/   # OWASP categories, provider enums
├── package.json     # Root scripts for convenience
└── tsconfig.base.json
```

This is a simple multi-package layout without monorepo tooling (no Turborepo, Nx, or Lerna). The `shared` directory is referenced by both `client` and `server` via TypeScript path aliases. Either side can be built and run independently.

The decision to avoid monorepo tooling was made to reduce setup complexity for a single-developer project. The shared types benefit is achieved through path aliases alone. If the project grows to include additional packages (CLI tool, plugin system), monorepo tooling can be introduced later without major restructuring.

## Key Technical Decisions

### Custom Renderer vs. Embedded Swagger UI

**Decision:** Build a custom endpoint renderer rather than embedding Swagger UI.

Swagger UI's internals are tightly coupled to its own rendering pipeline. Its plugin system is limited, and injecting custom per-endpoint security panels is fragile across version updates. Since the security assessment panels are the core feature, having full control over the layout is worth the upfront investment.

The custom renderer uses `@apidevtools/swagger-parser` (the same library Swagger UI relies on) for parsing and validation, then renders endpoints in a familiar Swagger-like visual format using React components. This gives visual familiarity for the target audience while providing full control over the component tree.

### State Management: React Context + useReducer

**Decision:** Use React's built-in Context API with `useReducer` instead of a third-party state library.

For a single-user application with a relatively flat state tree, React's built-in tools are sufficient. This eliminates a third-party dependency and the risk of library abandonment or breaking changes. The primary store holds the parsed spec, UI state (expanded groups and endpoints), loading state, and errors. Migration to Zustand or similar is straightforward if needed later.

### LLM Gateway Pattern

**Decision:** Route all LLM calls through a backend gateway that abstracts provider differences.

A single `LLMGateway` interface normalizes request/response formats across all supported providers (OpenAI, Anthropic, xAI, DeepSeek, Hugging Face, OpenRouter, custom). Each provider gets an adapter that handles authentication, request formatting, and response parsing. This pattern means:

- API keys never reach the frontend
- Adding a new provider requires only a new adapter, no changes to the analysis engine or frontend
- Error handling (auth failures, rate limits, model availability) is normalized into consistent error types
- Keys are held in memory per session, never persisted to disk by default

### Two-Phase Analysis Model

**Decision:** Split the LLM analysis into an initial scan (Phase A) and on-demand deep dives (Phase B).

Phase A runs when a spec is first analyzed. For each endpoint, the LLM receives the endpoint details alongside the structured OWASP API Top 10 data and returns only the attack scenarios that are relevant. Each scenario includes the attack type, OWASP category, affected parameters, and a relevance score used for ordering (not displayed to the user). This keeps the initial response focused and cost-efficient.

Phase B fires on demand when a user clicks "Deep Dive" on a specific attack scenario. A second LLM call includes enriched context from the wider knowledge base (testing techniques, payload patterns, bug bounty submission patterns). The response includes step-by-step testing procedures, expected responses, and sample payloads. This lazy evaluation pattern reduces cost and initial latency at the expense of a wait time on expansion.

### Knowledge Base as Structured Data

**Decision:** Embed the OWASP API Top 10 as structured, typed data within the application rather than using RAG.

The OWASP API Top 10 is a small, well-defined dataset that changes infrequently (updated roughly every 3-4 years). Embedding it as TypeScript data structures within the app means it's always available, requires no external infrastructure, and can be precisely controlled in prompts. This also makes it straightforward to update when new versions of the Top 10 are published.

The wider knowledge base used in Phase B (testing techniques, payload patterns) follows the same approach: structured data modules that can be selectively included in prompts based on the attack category being expanded.

### Client-Server Architecture

**Decision:** Traditional client-server rather than browser-direct LLM calls.

Even though this is initially a single-user local tool, routing LLM calls through the backend provides:

- API key security (keys never in browser memory or network inspector)
- A single place to implement rate limiting, caching, and request logging
- The ability to add server-side features later (batch analysis, webhooks) without architectural changes
- A clean path to hosted deployment when the time comes

### Persistence Strategy

**Decision:** LocalStorage for autosave, JSON file export for explicit saves.

LocalStorage provides automatic crash recovery with zero user friction. The "Save Project" action serializes the full application state (parsed spec, generated assessments, user edits) to a downloadable JSON file with a documented schema. "Load Project" re-imports a saved file. This keeps the tool stateless on the server side and gives users full ownership of their data.

### Spec Parsing and Safety

**Decision:** YAML safe-loading with input validation before parsing.

OpenAPI specs are accepted as JSON or YAML strings via a POST endpoint (not multipart file upload, to reduce complexity). YAML is parsed with `js-yaml` using `safeLoad` to prevent deserialization attacks (no custom types, no code execution). A 2MB size limit is enforced server-side. The parsed spec is then validated through `@apidevtools/swagger-parser` which handles structural validation and `$ref` resolution.

Any HTML content in spec description fields is sanitized with DOMPurify before rendering, to prevent stored XSS via malicious spec files.

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React + TypeScript | Requested; strong ecosystem for component-based UI |
| Build tool | Vite | Fast dev server, simple config, TypeScript out of the box |
| State | React Context + useReducer | Zero dependencies, sufficient for single-user flat state |
| Backend | Node/Express + TypeScript | Requested; shared language with frontend |
| Spec parsing | @apidevtools/swagger-parser | Battle-tested OpenAPI parser, same lib Swagger UI uses |
| YAML | js-yaml (safeLoad) | Safe YAML parsing without code execution |
| Sanitization | DOMPurify | Prevents XSS from spec description fields |
| Security headers | helmet | Baseline HTTP security headers for Express |

## Accessibility Approach

Accessibility is a requirement across all phases, not an afterthought. Each phase includes an accessibility checklist that must be satisfied before the phase is considered complete.

Core principles applied throughout:

- All interactive elements are keyboard accessible with visible focus indicators
- Expand/collapse controls use `aria-expanded` that toggles with state
- Loading states are announced to screen readers via `aria-live` regions
- Color is never the sole means of conveying information (method badges always include text labels, relevance is conveyed through order rather than color)
- Focus is managed during state transitions (e.g., after importing a spec, focus moves to meaningful content)
- Landmarks (`role="navigation"`, `role="main"`, `role="dialog"`) structure the page for assistive technology

## Security Approach

Even as a local tool, ReconSpec applies defense-in-depth principles:

- API keys are stored in memory only, never persisted to disk unless the user opts in
- Input validation on all spec uploads (size limits, safe YAML loading)
- HTML content from spec descriptions is sanitized before rendering
- Express is configured with helmet for baseline security headers
- CORS is restricted to known origins
- Rate limiting on backend endpoints (prevents accidental resource exhaustion)
- The backend validates that incoming specs are structurally sound before processing, preventing malformed input from reaching the LLM pipeline
