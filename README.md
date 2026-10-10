# AgentBreak

> **AI Agent Security Testing Platform** — Scaffolding Prototype for Hackathon Evaluation

---

## 1. Project Overview & Goals
AgentBreak is a web-based platform designed to evaluate and test the security posture of LLM agents, tool integrations, and AI decision systems. The platform orchestrates adversarial prompt injections, privilege escalation simulations, and tool-abuse scenarios against sandboxed AI targets, applying deterministic rule-based checks to surface vulnerabilities.

> **Note on Prototype Status**: This repository is currently an **early-stage foundation and architectural prototype**. It provides clean scaffolding, REST API interfaces, database connectivity, and frontend dashboard wiring for parallel developer collaboration. Complex autonomous agent behavior and live attack engine integrations are planned for subsequent phases.

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
