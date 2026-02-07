# ReconSpec

API security testing tool that analyzes OpenAPI specifications and identifies potential attack scenarios.

## Features

- Import OpenAPI 3.x specifications (JSON/YAML)
- Automatic analysis against OWASP API Security Top 10 (2023)
- Phase A analysis: Identify relevant attack scenarios per endpoint
- Phase B deep dive: On-demand testing procedures with step-by-step guidance
- Sample payload generation for manual testing
- Real-time analysis progress tracking
- Copy-to-clipboard for payloads

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- LLM provider API key (OpenAI, Anthropic, or compatible)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ReconSpec
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure your LLM provider:
```
LLM_PROVIDER=openai
LLM_API_KEY=your_api_key_here
LLM_MODEL=gpt-4o-mini
```

Supported providers:
- `openai` - OpenAI (GPT-4o, GPT-4o-mini)
- `anthropic` - Anthropic (Claude Sonnet, Claude Opus)
- Custom endpoints via `LLM_BASE_URL`

4. Start development servers:
```bash
# Terminal 1: Backend server
cd server
pnpm run dev

# Terminal 2: Frontend
cd client
pnpm run dev
```

5. Open http://localhost:5173 in your browser

## Usage

### 1. Import a Spec

Click "Import Spec" and upload an OpenAPI 3.x specification file.

### 2. Analyze

Click "Analyze" to run automated security analysis. The tool will:
- Analyze each endpoint for OWASP API Top 10 vulnerabilities
- Generate attack scenarios with relevance scores
- Identify affected parameters
- Create an API-level security summary

### 3. Deep Dive

For any attack scenario, click "Deep Dive" to get:
- Detailed testing procedures
- Expected responses to observe
- Sample payloads for manual testing
- Parameter-specific guidance

### 4. Generate More Payloads

Within a deep dive, click "Generate More Payloads" to get additional test payloads.

## Architecture

```
ReconSpec/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── context/       # State management
│   │   ├── services/      # API calls
│   │   └── styles/        # CSS
├── server/          # Node.js backend
│   ├── src/
│   │   ├── analysis/      # Analysis engine
│   │   ├── knowledge/     # OWASP knowledge base
│   │   ├── llm/          # LLM gateway
│   │   ├── routes/       # API endpoints
│   │   └── services/     # Spec parser
└── shared/          # Shared TypeScript types
```

## OWASP Categories

The tool analyzes against the OWASP API Security Top 10 (2023):

- API1: Broken Object Level Authorization
- API2: Broken Authentication
- API3: Broken Object Property Level Authorization
- API4: Unrestricted Resource Consumption
- API5: Broken Function Level Authorization
- API6: Unrestricted Access to Sensitive Business Flows
- API7: Server-Side Request Forgery
- API8: Security Misconfiguration
- API9: Improper Inventory Management
- API10: Unsafe Consumption of APIs

## API Endpoints

- `POST /api/spec` - Parse OpenAPI spec
- `GET /api/provider/status` - Check LLM provider status
- `POST /api/provider` - Update LLM provider configuration
- `POST /api/analyze` - Run Phase A analysis (SSE streaming)
- `GET /api/analyze/status` - Get analysis status
- `POST /api/analyze/deep-dive` - Generate deep dive for scenario
- `POST /api/analyze/generate-payloads` - Generate additional payloads

## Development

### Project Structure

- **Knowledge Base** (`server/src/knowledge/`): OWASP categories, testing techniques, payload patterns
- **Analysis Engine** (`server/src/analysis/`): Prompt building, response parsing, orchestration
- **LLM Gateway** (`server/src/llm/`): Provider abstraction, error handling
- **Frontend Components**: Modular React components with TypeScript
- **State Management**: React Context API with useReducer

### Adding New Categories

1. Create category file in `server/src/knowledge/owasp/categories/`
2. Export from `server/src/knowledge/owasp/categories/index.ts`
3. Add testing techniques to `server/src/knowledge/techniques/types.ts`
4. Add payload patterns to `server/src/knowledge/payloads/types.ts`

## Security Notes

- LLM responses are sanitized before rendering
- Payloads are displayed as text, never executed
- API keys are stored in memory only
- No data is persisted to disk

## License

MIT

## Contributing

Contributions are welcome. Please read the project documentation for details on the code of conduct and the process for submitting pull requests.
