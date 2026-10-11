"""Trace Store and Replay Engine for AgentBreak (PRD Section 7).

Persists every attempt as a structured JSON trace and provides deterministic replay
to verify reproducibility and compute Replay Consistency.
"""

import json
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import text
from app.storage.database import engine
from app.core.config import settings
from app.target.agent import TargetAgent, DefenseConfig, VulnerabilityConfig
from app.roles.judge import Judge

_memory_traces: Dict[str, Dict[str, Any]] = {}


def ensure_trace_table() -> None:
    """Ensure attack_traces table exists."""
    with engine.begin() as conn:
        conn.execute(
            text(
                "CREATE TABLE IF NOT EXISTS attack_traces ("
                "trace_id TEXT PRIMARY KEY, "
                "run_id TEXT, "
                "surface TEXT, "
                "success INTEGER, "
                "created_at TEXT, "
                "data TEXT NOT NULL)"
            )
        )
        conn.execute(
            text("CREATE INDEX IF NOT EXISTS ix_traces_run ON attack_traces(run_id)")
        )


class TraceStore:
    """Stores reproducible attack traces and provides deterministic re-execution."""

    def __init__(self):
        ensure_trace_table()
        self.judge = Judge()

    def create_trace(
        self,
        target_id: str,
        plan_item: Dict[str, Any],
        steps: List[Dict[str, Any]],
        verdict: Dict[str, Any],
        state_snapshot: Optional[Dict[str, Any]] = None,
        defense_config: str = "none",
        run_id: Optional[str] = None,
        attempt: int = 1,
        model_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create and store a PRD-compliant attack trace."""
        trace_id = f"tr_{uuid.uuid4().hex[:8]}"
        now_iso = datetime.now(timezone.utc).isoformat()
        resolved_model = model_name or settings.AGENTBREAK_LLM_MODEL

        trace = {
            "trace_id": trace_id,
            "run_id": run_id,
            "timestamp": now_iso,
            "target": {
                "agent_id": target_id,
                "defense_config": defense_config,
            },
            "model": {
                "name": resolved_model,
                "temperature": 0,
                "seed": 42,
            },
            "plan_item": {
                "id": plan_item.get("id"),
                "surface": plan_item.get("surface"),
                "technique": plan_item.get("technique"),
                "goal": plan_item.get("goal"),
                "assigned_role": plan_item.get("assigned_role"),
            },
            "attempt": attempt,
            "steps": steps,
            "verdict": verdict,
            "state_snapshot": state_snapshot or {"memory": {}, "event_log": []},
        }

        self.save_trace(trace)
        return trace

    def save_trace(self, trace: Dict[str, Any]) -> None:
        """Persist trace in database and local cache."""
        ensure_trace_table()
        trace_id = trace["trace_id"]
        _memory_traces[trace_id] = trace

        with engine.begin() as conn:
            conn.execute(
                text(
                    "INSERT OR REPLACE INTO attack_traces (trace_id, run_id, surface, success, created_at, data) "
                    "VALUES (:trace_id, :run_id, :surface, :success, :created_at, :data)"
                ),
                {
                    "trace_id": trace_id,
                    "run_id": trace.get("run_id"),
                    "surface": trace.get("plan_item", {}).get("surface", "unknown"),
                    "success": 1 if trace.get("verdict", {}).get("success") else 0,
                    "created_at": trace.get("timestamp"),
                    "data": json.dumps(trace),
                },
            )

    def get_trace(self, trace_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve trace by ID."""
        if trace_id in _memory_traces:
            return _memory_traces[trace_id]

        ensure_trace_table()
        with engine.connect() as conn:
            row = conn.execute(
                text("SELECT data FROM attack_traces WHERE trace_id = :id"),
                {"id": trace_id},
            ).first()
            if row:
                t = json.loads(row[0])
                _memory_traces[trace_id] = t
                return t
        return None

    def list_traces(
        self, run_id: Optional[str] = None, surface: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """List all traces matching optional filters."""
        ensure_trace_table()
        clauses = ["1=1"]
        params: Dict[str, Any] = {}
        if run_id:
            clauses.append("run_id = :run_id")
            params["run_id"] = run_id
        if surface:
            clauses.append("surface = :surface")
            params["surface"] = surface

        with engine.connect() as conn:
            rows = conn.execute(
                text(
                    f"SELECT data FROM attack_traces WHERE {' AND '.join(clauses)} ORDER BY created_at DESC"
                ),
                params,
            ).all()
            return [json.loads(r[0]) for r in rows]

    def replay_trace(
        self, trace_id: str, defense_override: Optional[str] = None, live: bool = False
    ) -> Dict[str, Any]:
        """Re-execute recorded attacker inputs against fresh sandbox (cached or live)."""
        trace = self.get_trace(trace_id)
        if not trace:
            raise ValueError(f"Trace '{trace_id}' not found.")

        # Determine defense config (original or override)
        def_str = defense_override or trace.get("target", {}).get("defense_config", "none")
        defense_config = DefenseConfig.from_name(def_str)

        # Fresh target instance with fixed initial state
        target_agent = TargetAgent()
        target_agent.reset_sandbox()

        # Restore initial state snapshot if present
        initial_snap = trace.get("state_snapshot")
        if initial_snap:
            target_agent.tools.restore(initial_snap)

        plan_item = trace.get("plan_item", {})
        original_verdict = trace.get("verdict", {})
        steps = trace.get("steps", [])

        # Extract attacker input messages
        attacker_messages = [
            s.get("content", "")
            for s in steps
            if s.get("role") in {"attacker_a", "attacker_b"} and s.get("type") == "message"
        ]

        replayed_steps: List[Dict[str, Any]] = []

        for msg in attacker_messages:
            replayed_steps.append({
                "idx": len(replayed_steps),
                "role": plan_item.get("assigned_role", "attacker"),
                "type": "message",
                "content": msg,
            })

            # Re-execute against target
            res = target_agent.process_message(
                message=msg,
                authenticated_user_id="CUST-001",
                defense_config=defense_config,
                vuln_config=VulnerabilityConfig(
                    allow_unauthorized_record_access=True if def_str == "none" else False,
                    trust_untrusted_content=True if def_str == "none" else False,
                ),
                reset_history=False,
            )

            for tc in res.tool_calls:
                replayed_steps.append({
                    "idx": len(replayed_steps),
                    "role": "target",
                    "type": "tool_call",
                    "tool": tc.get("tool_name"),
                    "args": tc.get("arguments", {}),
                })

            replayed_steps.append({
                "idx": len(replayed_steps),
                "role": "target",
                "type": "response",
                "content": res.target_response,
                "security_events": [e.model_dump() for e in res.security_events],
            })

        # Judge the replayed execution
        replayed_verdict = self.judge.evaluate_attempt(
            plan_item=plan_item,
            steps=replayed_steps,
            state_snapshot=target_agent.tools.snapshot(),
            allow_llm_judge=live,
        )

        # Check consistency
        is_consistent = (
            replayed_verdict.get("success") == original_verdict.get("success")
        )

        return {
            "trace_id": trace_id,
            "mode": "live" if live else "cached",
            "original_defense": trace.get("target", {}).get("defense_config"),
            "replayed_defense": def_str,
            "original_verdict": original_verdict,
            "replayed_verdict": replayed_verdict,
            "is_consistent": is_consistent,
            "replayed_steps": replayed_steps,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def compute_replay_consistency(self, run_id: Optional[str] = None, live: bool = False) -> Dict[str, Any]:
        """Compute replay consistency metric across all stored traces."""
        traces = self.list_traces(run_id=run_id)
        if not traces:
            return {"total_replays": 0, "matches": 0, "consistency_rate": 1.0, "mode": "live" if live else "cached"}

        matches = 0
        results = []
        sample = traces[:20]  # sample traces for bounded verification
        for t in sample:
            res = self.replay_trace(t["trace_id"], live=live)
            if res["is_consistent"]:
                matches += 1
            results.append(res)

        total = len(results)
        rate = (matches / total) if total > 0 else 1.0
        return {
            "total_replays": total,
            "matches": matches,
            "consistency_rate": round(rate, 3),
            "consistency_percentage": f"{round(rate * 100, 1)}%",
            "mode": "live" if live else "cached",
            "results": results,
        }
