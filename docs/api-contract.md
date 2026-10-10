# AgentBreak Phase 2 API

Base URL: `http://127.0.0.1:8000/api`. Swagger UI: `http://127.0.0.1:8000/docs`.

The registered target is always the local `CustomerSupportAgent` with synthetic records and mock tools. Target URLs are not accepted. The existing deterministic scan mode remains the default for Phase 1 clients; it labels each attempt `source: template`. Adaptive mode requires the configured free-tier Gemini model and labels generated attempts `source: llm`.

## Attack catalog and individual details

`GET /attacks` returns safe metadata for built-in seed templates without prompt bodies. Generated prompt bodies are available immediately after generation from the SSE event and persisted API resources below.

`GET /attacks/{attack_id}` returns a stored attempt by its unique attack ID, including its exact prompt, generation status, target response, tool trace, evaluator assessment, deterministic verification, and final verdict. For stable seed-template IDs, this endpoint returns the latest stored attempt; use the run-scoped route to disambiguate history.

## Start and inspect scans

`POST /runs` accepts:

```json
{
  "target_name": "CustomerSupportAgent",
  "scan_mode": "adaptive",
  "attack_ids": ["canary-record-access", "indirect-ticket-injection"],
  "max_tests": 30,
  "max_rounds": 5,
  "timeout_seconds": 180,
  "vulnerable_mode": false
}
```

`attack_ids` selects seed templates; omit it to use the catalog. `max_tests` is capped at 30, `max_rounds` at 5, and the wall-clock budget at 180 seconds. Adaptive mode proposes up to six attacks per round and executes candidates sequentially. Secure target mode is the default. Set `vulnerable_mode` only to exercise the sandbox’s deliberate flaws. `scan_mode` may be `adaptive` or `deterministic`.

The endpoint returns HTTP 202 with a `run_id` promptly. Adaptive mode without `AGENTBREAK_LLM_API_KEY` returns HTTP 503 with a configuration message; it does not silently fall back to templates.

`GET /runs` lists the latest 50 scans. `GET /runs/{run_id}` returns lifecycle state, timestamps, budget, stop reason, attempt counts, verdict counts, result summaries, and token-use metadata. States are `queued`, `running`, `completed`, `cancelled`, `failed`, and `timed_out`.

`POST /runs/{run_id}/cancel` requests cancellation. Cancellation is observed between bounded model/target operations; an in-flight provider request has a configured timeout.

`GET /runs/{run_id}/attacks` returns every persisted attempt, including generated, rejected, running, completed, error, cancelled, and not-executed statuses. A candidate and its exact prompt are committed to SQLite before `attack_generated` is emitted or any candidate in that batch executes.

`GET /runs/{run_id}/report` returns scan summary, stop reason, persisted findings, and detailed attempts. Prompts and traces remain available after server restart.

## Progress events

`GET /runs/{run_id}/events` streams SSE events. Each JSON payload includes `run_id`, `timestamp`, and event name. An `attack_generated` payload includes the exact persisted prompt, attack ID, category, and safe metadata before execution starts. `attack_rejected` includes the stored prompt and rejection reason. Other events include `scan_started`, `attack_started`, `attack_completed`, `finding_detected`, `scan_progress`, `scan_completed`, `scan_failed`, and `scan_cancelled`.

## Findings and direct sandbox invocation

`GET /findings` returns deduplicated findings. Optional query filters: `run_id`, `severity`, `category`, and `status` (reproducibility status).

`POST /target/test` remains available for one direct sandbox prompt. It takes `message`, a registered synthetic `user_id`, and optional sandbox `vulnerability_config`.

## Verdict semantics

Each attempt records one deterministic verdict: `vulnerable`, `passed`, `inconclusive`, or `error`. The Attacker proposes test prompts; the Evaluator provides an assessment and separate confidence/severity recommendations. Only observable tool results and security events determine the verdict. Evaluator output cannot turn a suspicion or natural-language claim into a confirmed finding. A failed or malformed Evaluator response is recorded explicitly and does not replace the deterministic verification.

Findings are grouped by scan, category, and invariant to avoid duplicate findings. Each attempt remains available in its run’s attack list.
