# ReconSpec

ReconSpec is an LLM-powered API security testing tool that helps security engineers identify potential attack vectors in APIs by analyzing OpenAPI specifications. It generates contextual security assessments, detailed testing strategies, and sample payloads, all grounded in the OWASP API Security Top 10.

## What It Does

ReconSpec takes an OpenAPI spec (JSON or YAML) as input and produces an interactive security test plan. For every endpoint in the spec, it identifies relevant attack scenarios, ranks them by relevance, and provides on-demand deep dives with step-by-step testing procedures and generated payloads tailored to the specific endpoint's parameters and context.

The tool supports a bring-your-own-key model, allowing users to connect their preferred AI provider (OpenAI, Anthropic, xAI, DeepSeek, Hugging Face, OpenRouter, or a custom endpoint).

## Who It's For

Security engineers and penetration testers who need to systematically assess APIs for vulnerabilities. The tool supplements their expertise by surfacing attack scenarios they might investigate, ordered by contextual relevance to the specific API under review.

The generated assessments represent *potential* attack scenarios, not confirmed vulnerabilities. ReconSpec helps prioritize where to look, not replace the tester's judgment.

## Core Concepts

**Security Assessment:** The collection of attack scenarios associated with a single endpoint. Each endpoint has one Security Assessment section containing zero or more Attack Scenarios.

**Attack Scenario:** A specific potential vulnerability or test case for an endpoint. Each scenario includes the attack type, the OWASP category it maps to, and the relevant parameters. Scenarios are ordered by a relevance score assigned by the LLM (the score itself is not displayed to the user).

**Two-Phase Analysis:** The LLM analysis happens in two stages. Phase A (initial scan) analyzes each endpoint against the OWASP API Top 10 and returns only the attack scenarios that are relevant, with a lightweight summary. Phase B (deep dive) fires on demand when a user expands a specific scenario, using an enriched knowledge base to generate detailed testing steps and sample payloads.

## Implementation Phases

### Phase 1: Foundation and Spec Handling

Import an OpenAPI spec, parse and validate it, and render endpoints in a custom API explorer UI. This phase establishes the shared data model, project structure, and core rendering pipeline.

Deliverable: Users can import a spec and browse endpoints in an accessible, navigable interface with parameters, request bodies, auth requirements, and response codes displayed for each endpoint.

### Phase 2: Provider Configuration and LLM Gateway

Build the backend abstraction layer that normalizes requests and responses across all supported AI providers. Users can configure their preferred provider, enter their API key, select a model, and test the connection.

Deliverable: A working LLM pipeline where requests can be routed through any configured provider, with keys held in memory only.

### Phase 3: OWASP Knowledge Base and Initial Scan

Structure the OWASP API Top 10 as typed data within the application and build the Analysis Engine. When triggered, the engine analyzes each endpoint and returns relevant attack scenarios as structured JSON. The frontend renders Security Assessment panels per endpoint and an API-level summary.

Deliverable: Import a spec, run analysis, and see categorized attack scenarios per endpoint plus a summary of the API's risk profile.

### Phase 4: On-Demand Deep Dive and Payload Generation

When a user expands an attack scenario, a second LLM call fires with enriched context (wider knowledge base including testing techniques and payload patterns). The response includes step-by-step testing procedures, expected responses, and context-aware sample payloads. A dedicated "Generate Payloads" action produces additional payloads for the specific endpoint.

Deliverable: Full interactive workflow from attack scenario overview to actionable testing steps and generated payloads, with streaming responses.

### Phase 5: Editing, Persistence, and Export

Users can edit generated attack scenarios, add custom ones, remove or reorder scenarios, and add notes. Projects can be saved as JSON files and re-imported. LocalStorage autosave provides crash recovery.

Deliverable: A fully editable, persistable, and exportable security testing workflow.

### Phase 6: Remaining Providers and Polish

Complete the provider adapter coverage for all supported AI providers. Conduct a comprehensive accessibility audit. Add keyboard shortcuts for power users, handle edge cases (malformed specs, very large specs), and optimize performance for specs with many endpoints.

Deliverable: Production-ready tool covering all providers with a polished, accessible experience.
