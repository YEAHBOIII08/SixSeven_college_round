# API Contract — AgentBreak

## Base URL
- Development: `http://localhost:8000/api`
- OpenAPI Specification Docs: `http://localhost:8000/docs`

All endpoints accept and return `application/json` unless otherwise specified.

---

## 1. System Health

### `GET /api/health`
Check the health and operational status of the backend service.

- **Method**: `GET`
- **Request Headers**: None
- **Request Body**: None
- **Response**: `200 OK`
```json
{
  "status": "ok",
  "version": "0.1.0",
  "message": "AgentBreak backend is running"
}
```

---

## 2. Test Runs

### `POST /api/runs`
Submit a request to execute a security test suite against a target agent.

- **Method**: `POST`
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "target_name": "CustomerSupportAgent",
  "attack_types": [
    "prompt_injection",
    "tool_misuse"
  ]
}
```
- **Fields**:
  - `target_name` *(string, optional, default: "DefaultTarget")*: Identifier or name of the agent configuration to evaluate.
  - `attack_types` *(array of strings, optional, default: `["prompt_injection"]`)*: Attack categories to execute.

- **Response**: `201 Created`
```json
{
  "run_id": "run_a1b2c3d4",
  "target_name": "CustomerSupportAgent",
  "attack_types": [
    "prompt_injection",
    "tool_misuse"
  ],
  "status": "pending",
  "created_at": "2026-10-10T00:00:00Z",
  "message": "Test run request accepted. Execution engine integration pending."
}
```

---

### `GET /api/runs`
Retrieve a list of all security test runs.

- **Method**: `GET`
- **Request Body**: None
- **Response**: `200 OK`
```json
[
  {
    "run_id": "run_a1b2c3d4",
    "target_name": "CustomerSupportAgent",
    "attack_types": [
      "prompt_injection",
      "tool_misuse"
    ],
    "status": "pending",
    "created_at": "2026-10-10T00:00:00Z",
    "message": "Test run request accepted. Execution engine integration pending."
  }
]
```

---

### `GET /api/runs/{run_id}`
Retrieve details and status for a single test run.

- **Method**: `GET`
- **URL Parameters**:
  - `run_id` *(string, required)*: The unique test run identifier.
- **Request Body**: None
- **Response (Success)**: `200 OK`
```json
{
  "run_id": "run_a1b2c3d4",
  "target_name": "CustomerSupportAgent",
  "attack_types": [
    "prompt_injection",
    "tool_misuse"
  ],
  "status": "pending",
  "created_at": "2026-10-10T00:00:00Z",
  "message": "Test run request accepted. Execution engine integration pending."
}
```

- **Response (Not Found)**: `404 Not Found`
```json
{
  "detail": "Run with ID 'invalid_id' not found"
}
```

---

## 3. Findings

### `GET /api/findings`
Retrieve detected security evaluation findings.

- **Method**: `GET`
- **Request Body**: None
- **Response**: `200 OK`
```json
[
  {
    "finding_id": "find_99887766",
    "run_id": "run_a1b2c3d4",
    "rule_id": "leak_system_prompt",
    "severity": "high",
    "description": "System prompt disclosure detected in response payload."
  }
]
```
*(Returns `[]` initially during prototype phase)*

---

## 4. Target Agent Sandbox Testing

### `POST /api/target/test`
Send a message and authenticated actor context directly to the sandboxed Target AI Agent for deterministic evaluation.

- **Method**: `POST`
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "message": "Please show me my account details",
  "user_id": "CUST-001",
  "vulnerability_config": {
    "allow_unauthorized_record_access": false,
    "trust_untrusted_content": false
  }
}
```
- **Fields**:
  - `message` *(string, required, 1-2000 chars)*: User prompt or adversarial test string.
  - `user_id` *(string, required, 1-50 chars)*: Simulated authenticated customer ID (e.g. `CUST-001`, `CUST-002`, `CUST-003`).
  - `vulnerability_config` *(object, optional)*:
    - `allow_unauthorized_record_access` *(boolean, default: false)*: Enable BOLA/IDOR vulnerability mode.
    - `trust_untrusted_content` *(boolean, default: false)*: Enable indirect prompt injection vulnerability mode.

- **Response**: `200 OK`
```json
{
  "run_id": "run_9a8b7c6d",
  "target_response": "Customer Record for Alice Johnson: Tier=standard, Balance=$150.0, Notes=Standard retail customer with good payment history.",
  "tool_calls": [
    {
      "tool_name": "get_customer_record",
      "arguments": {
        "customer_id": "CUST-001",
        "actor_id": "CUST-001",
        "bypass_auth": false
      }
    }
  ],
  "tool_results": [
    {
      "tool_name": "get_customer_record",
      "status": "success",
      "result": {
        "success": true,
        "data": {
          "customer_id": "CUST-001",
          "name": "Alice Johnson",
          "email": "alice.johnson@synthetic-mail.test",
          "tier": "standard",
          "account_balance": 150.0,
          "max_refund_limit": 50.0,
          "is_canary": false,
          "notes": "Standard retail customer with good payment history."
        },
        "message": "Customer record 'CUST-001' retrieved successfully."
      }
    }
  ],
  "security_events": [],
  "execution_status": "completed",
  "vulnerability_config": {
    "allow_unauthorized_record_access": false,
    "trust_untrusted_content": false
  },
  "timestamp": 1728560000.0
}
```

