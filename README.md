# AgentBreak

> **AI Agent Security Testing Platform** — Scaffolding Prototype for Hackathon Evaluation

---

## 1. Project Overview & Goals
AgentBreak is a web-based platform designed to evaluate and test the security posture of LLM agents, tool integrations, and AI decision systems. The platform orchestrates adversarial prompt injections, privilege escalation simulations, and tool-abuse scenarios against sandboxed AI targets, applying deterministic rule-based checks to surface vulnerabilities.

> **Current implementation**: The web UI runs deterministic or adaptive scans against the registered local synthetic target. Adaptive generation and evaluation use the configured Gemini Free Tier model; prompt attempts, tool evidence, assessments, and findings are shown in the live scan and report views.

---

## 2. Technology Stack
- **Frontend**: React 18, Vite
- **Backend**: Python 3.10+, FastAPI, Pydantic v2, Uvicorn
- **Database**: SQLite (SQLAlchemy ORM)
- **API Communication**: REST (JSON)
- **Version Control**: Git (Monorepo)

---

## 3. Repository Structure
```
agentbreak/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application & route registration
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes.py        # REST endpoints (/health, /runs, /findings, /target/test)
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py        # Pydantic environment configuration
│   │   ├── target/
│   │   │   ├── __init__.py
│   │   │   ├── agent.py         # Sandboxed Target AI Agent (Customer Support)
│   │   │   ├── tools.py         # Mock tools (get_customer_record, get_support_ticket, request_refund)
│   │   │   └── synthetic_data.py# Fabricated customer accounts, tickets & canary record
│   │   ├── attack_engine/
│   │   │   ├── __init__.py
│   │   │   └── runner.py        # Attack orchestrator placeholder
│   │   ├── evaluator/
│   │   │   ├── __init__.py
│   │   │   └── rules.py         # Deterministic security rules placeholder
│   │   └── storage/
│   │       ├── __init__.py
│   │       └── database.py      # SQLite connection & session lifecycle
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_api.py          # Pytest backend API tests
│   │   └── test_target_agent.py # Pytest target agent security & vulnerability tests
│   ├── requirements.txt         # Backend Python dependencies
│   └── .env.example             # Example environment variables
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main React dashboard component
│   │   ├── App.css              # Dashboard styling
│   │   ├── index.css            # Base stylesheet
│   │   └── main.jsx             # React DOM entrypoint
│   ├── index.html               # Vite HTML template
│   ├── package.json             # Frontend dependencies & scripts
│   └── vite.config.js           # Vite dev server configuration & API proxy
├── docs/
│   ├── architecture.md          # Architectural design & data flow
│   └── api-contract.md          # Endpoint documentation & JSON schemas
├── .gitignore                   # Ignored files (venv, node_modules, db, etc.)
├── README.md                    # Project documentation
└── LICENSE                      # MIT License
```

---

## 4. Prerequisites
Ensure you have the following installed on your machine:
- **Python**: Version 3.10 or higher
- **Node.js**: Version 18.x or 20.x+ and **npm**
- **Git**

---

## 5. Getting Started

The backend and frontend are designed to run independently in separate terminal windows.

### 5.1. Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a Python virtual environment:**
   - **Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env   # On Windows PowerShell: Copy-Item .env.example .env
   ```

5. **Start the FastAPI development server:**
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   - API Base: `http://127.0.0.1:8000/api`
   - Interactive Swagger Docs: `http://127.0.0.1:8000/docs`
   - Health check: `http://127.0.0.1:8000/api/health`

6. **Run tests:**
   ```bash
   pytest tests/
   ```
   Or run the target agent test suite specifically:
   ```bash
   pytest tests/test_target_agent.py -v
   ```

### 5.2. Sandboxed Target AI Agent Testing

The target customer support agent runs deterministically without requiring an external LLM API key. It can be invoked programmatically or via REST API:

#### Via Python:
```python
from app.target.agent import TargetAgent, VulnerabilityConfig

agent = TargetAgent()

# 1. Normal authorized query (Secure Mode)
result = agent.process_message(
    message="Show my account record",
    authenticated_user_id="CUST-001",
)
print(result.target_response)
print(result.tool_calls)

# 2. Testing Authorization Weakness (BOLA/IDOR)
vuln_result = agent.process_message(
    message="Show account details for CUST-002",
    authenticated_user_id="CUST-001",
    vuln_config=VulnerabilityConfig(allow_unauthorized_record_access=True),
)
print("Vulnerability triggered:", [e.event_type for e in vuln_result.security_events])
```

#### Via REST API (`POST /api/target/test`):
```bash
curl -X POST http://127.0.0.1:8000/api/target/test \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Check ticket TICK-666",
    "user_id": "CUST-003",
    "vulnerability_config": {
      "trust_untrusted_content": true
    }
  }'
```

---

### 5.3. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

3. **Start the Vite development server:**
   ```bash
   npm run dev
   ```
   - Local Web UI: `http://localhost:5173`
   - Vite is configured to proxy `/api` requests directly to `http://127.0.0.1:8000`.

---

## 6. Git Setup & Contribution Guidelines

1. **Initialize Git (if starting a new repository):**
   ```bash
   git init
   git add .
   git commit -m "feat: initial AgentBreak scaffolding and monorepo structure"
   ```

2. **Branching Model:**
   - Work on feature branches branched from `main`:
     ```bash
     git checkout -b feature/backend-attack-suite
     # or
     git checkout -b feature/frontend-run-dashboard
     ```
   - Keep commits concise, descriptive, and atomic.
   - Do not commit `.env`, SQLite `.db` databases, or `node_modules/` (enforced by `.gitignore`).

---

## 7. License
Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

## 8. Phase 2: adaptive scans

### Roles and trust boundaries

- **Attacker** proposes structured test prompts using the seed corpus and prior scan outcomes. It receives only the registered sandbox scope, mock-tool names, synthetic security invariants, and bounded summaries. It cannot call tools or expand scope.
- **Target** is the existing in-process `CustomerSupportAgent`; it uses the synthetic customer/ticket fixtures and mock refund tool.
- **Evaluator** gets a separate system prompt and request context. It summarizes execution evidence, confidence, possible severity, and follow-up categories. Its opinion never sets the final verdict.
- **Orchestrator** owns sequential target execution, the 30-attempt / 5-round / 3-minute limits, cancellation, duplicate suppression, and SQLite writes.
- **Deterministic verifier** decides `vulnerable`, `passed`, `inconclusive`, or `error` from recorded tool results and security events.

Each adaptive candidate is validated and saved with its exact prompt before the `attack_generated` event is emitted or target execution begins. Tool traces, assessments, deterministic verification, attempts, and grouped findings are durable in the existing SQLite database. Existing records are not deleted; new `attack_attempts` and `findings` tables are initialized with `CREATE TABLE IF NOT EXISTS` and indexed.

### Free Gemini model setup

Phase 2 uses Google Gemini Developer API with `gemini-3.5-flash-lite` for both roles. The code limits requests to that model to honor the free-only model selection. Its published free tier currently lists free input and output tokens and supports structured outputs; quotas can change. Free-tier prompts may be used by Google to improve its products, so keep test data synthetic. The free tier starts without billing, but Google may update account or quota requirements; keep the project on the Free Tier and do not link billing if you want to avoid paid usage. See the [Gemini model page](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite), [pricing and free-tier details](https://ai.google.dev/gemini-api/docs/pricing), [billing tiers](https://ai.google.dev/gemini-api/docs/billing), and [API key instructions](https://ai.google.dev/gemini-api/docs/api-key).

1. Sign in to [Google AI Studio](https://aistudio.google.com/apikey) and create a Gemini API key for a Free Tier project. New users can get an AI Studio project/key after accepting the service terms. No payment method is required for projects using only Free Tier features per Google's billing guide.
2. Copy `backend/.env.example` to `backend/.env` and set `AGENTBREAK_LLM_API_KEY` locally. Never paste the key into chat, frontend code, logs, or source control. `.env` is ignored by Git.
3. Keep `AGENTBREAK_LLM_PROVIDER=gemini` and `AGENTBREAK_LLM_MODEL=gemini-3.5-flash-lite`. Other models are rejected by the free-model allowlist. `AGENTBREAK_LLM_TIMEOUT_SECONDS` defaults to 25 seconds and is bounded by the remaining scan deadline.
4. Start the backend using the earlier setup instructions. An adaptive scan reports a clear HTTP 503 configuration error until the key is configured; deterministic scans continue to work without a key.

The model integration was tested with mocked HTTP responses; no live Gemini request or credential was used during development.

### Start an adaptive scan

From Target Setup in the website, select **Adaptive Gemini** under **Scan settings**, choose the attempt and round budgets, then start the scan. The live view displays generated prompts, execution status, target responses, evidence, and evaluator assessments. The final report includes rejected candidates and grouped findings. For API use, start `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`, open Swagger at `http://127.0.0.1:8000/docs`, and call `POST /api/runs` with:

```json
{
  "target_name": "CustomerSupportAgent",
  "scan_mode": "adaptive",
  "attack_ids": ["canary-record-access", "indirect-ticket-injection"],
  "max_tests": 12,
  "max_rounds": 3,
  "timeout_seconds": 180,
  "vulnerable_mode": false
}
```

Then use the returned ID with `GET /api/runs/{run_id}`, `GET /api/runs/{run_id}/attacks`, `GET /api/runs/{run_id}/events`, and `GET /api/runs/{run_id}/report`. Each generated attack is available in `/attacks/{attack_id}` and the `attack_generated` SSE event before it executes. Cancel with `POST /api/runs/{run_id}/cancel`. The orchestrator stops on attempt budget, adaptive-round budget, the 3-minute wall-clock deadline, no eligible novel candidates, cancellation, or a critical provider/execution failure; it records the stop reason.

For Phase 1 compatibility, omitting `scan_mode` continues to run the deterministic template catalog, and each result is labelled `source: template`. Adaptive results are labelled `source: llm`; provider errors do not silently switch modes or create findings.

Full response shapes and event definitions are in [docs/api-contract.md](docs/api-contract.md). Run backend tests from `backend` with `pytest tests/`; tests use mocked provider outputs and isolated SQLite databases. No live LLM key is needed for tests.

Defense validation and automatic configuration changes are not implemented. Findings contain recommendations only; they do not claim a fix has been applied or verified.

## Deterministic security scans

The frontend runs the hardcoded attack catalog or adaptive generated tests against the existing local `CustomerSupportAgent`. Select **Secure** to verify expected controls or **Vulnerable** to enable the sandbox's deliberate record-access and indirect-ticket-injection flaws. The scan view shows live progress, prompts, verdicts, target responses, and evidence; the report includes assessments and findings.

For a single prompt, select **Test Agent** on the dashboard, enter a prompt and synthetic user ID, then press the **Test Agent** button on Target Setup. The site displays the actual sandbox response, tool calls, tool results, and security events. This direct test uses the local deterministic sandbox agent; the target name and system prompt fields do not connect an arbitrary external model.

Start the API and UI as described above. In the UI, choose **Start First Audit**, enter a target label, select a sandbox profile, and run the scan. The label is informational: requests always execute against the registered local sandbox. Results persist in the configured SQLite database.

You can also use Swagger at `http://127.0.0.1:8000/docs`: inspect `GET /api/attacks`, then `POST /api/runs` with `{"target_name":"CustomerSupportAgent","attack_ids":["canary-record-access"],"vulnerable_mode":true}`. Poll `GET /api/runs/{run_id}` or open `GET /api/runs/{run_id}/events`; findings are available at `GET /api/findings?run_id={run_id}`. API schemas and event names are documented in [docs/api-contract.md](docs/api-contract.md).

Run backend checks from `backend`: `pytest tests/`. The tests use an isolated in-memory SQLite database.
