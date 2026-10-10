"""Sequential scan orchestration with SQLite as the durable result store."""
import json, threading, uuid
import hashlib, re, time
from datetime import datetime, timezone
from typing import Any, Dict, List
from sqlalchemy import text
from app.storage.database import engine
from app.attack_engine.attack_library import ATTACKS, ATTACK_BY_ID
from app.attack_engine.runner import AttackRunner, REGISTERED_TARGET
from app.target.agent import TargetAgent

_lock = threading.RLock()
_events: Dict[str, List[dict]] = {}
_cancelled: set[str] = set()
_target_lock = threading.Lock()

def _now(): return datetime.now(timezone.utc).isoformat()

def ensure_tables():
    with engine.begin() as conn:
        conn.execute(text("CREATE TABLE IF NOT EXISTS scans (run_id TEXT PRIMARY KEY, created_at TEXT NOT NULL, status TEXT NOT NULL, data TEXT NOT NULL)"))
        conn.execute(text("CREATE TABLE IF NOT EXISTS scan_results (id INTEGER PRIMARY KEY AUTOINCREMENT, run_id TEXT NOT NULL, attack_id TEXT NOT NULL, outcome TEXT NOT NULL, data TEXT NOT NULL)"))
        conn.execute(text("CREATE TABLE IF NOT EXISTS attack_attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, run_id TEXT NOT NULL REFERENCES scans(run_id), attack_id TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, data TEXT NOT NULL, UNIQUE(run_id, attack_id))"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_attack_attempts_run ON attack_attempts(run_id, id)"))
        conn.execute(text("CREATE TABLE IF NOT EXISTS findings (finding_id TEXT PRIMARY KEY, run_id TEXT NOT NULL REFERENCES scans(run_id), group_key TEXT NOT NULL, attack_ids TEXT NOT NULL, data TEXT NOT NULL, UNIQUE(run_id, group_key))"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_findings_run ON findings(run_id)"))

def emit(run_id: str, event_type: str, **meta):
    event = {"run_id": run_id, "timestamp": _now(), "event": event_type, **meta}
    with _lock:
        _events.setdefault(run_id, []).append(event)
    with engine.begin() as conn:
        row = conn.execute(text("SELECT data FROM scans WHERE run_id=:id"), {"id":run_id}).first()
        if row:
            scan = json.loads(row[0]); scan.setdefault("events", []).append(event)
            conn.execute(text("UPDATE scans SET data=:data WHERE run_id=:id"), {"id":run_id,"data":json.dumps(scan)})

def create_scan(attack_ids=None, max_tests=30, vulnerable=False, target_name=REGISTERED_TARGET, max_rounds=5, timeout_seconds=180, scan_mode="deterministic"):
    ensure_tables()
    if target_name != REGISTERED_TARGET: raise ValueError("Only the registered CustomerSupportAgent sandbox is allowed")
    ids = attack_ids or [a["attack_id"] for a in ATTACKS]
    if any(i not in ATTACK_BY_ID for i in ids): raise ValueError("Unknown attack ID")
    ids = list(dict.fromkeys(ids))
    if scan_mode not in {"adaptive","deterministic"}: raise ValueError("Unsupported scan mode")
    if not 1 <= max_tests <= 30: raise ValueError("max_tests must be between 1 and 30")
    if not 1 <= max_rounds <= 5: raise ValueError("max_rounds must be between 1 and 5")
    if not 10 <= timeout_seconds <= 180: raise ValueError("timeout_seconds must be between 10 and 180")
    ids = ids[:max_tests]
    run_id = f"run_{uuid.uuid4().hex[:12]}"
    scan = {"run_id":run_id,"target_name":REGISTERED_TARGET,"status":"queued","created_at":_now(),"started_at":None,"completed_at":None,"total":max_tests if scan_mode=="adaptive" else min(max_tests,len(ids)),"attempted":0,"completed":0,
            "counts":{"vulnerable":0,"passed":0,"inconclusive":0,"error":0},"results":[],"events":[],"attack_ids":ids,"vulnerable_mode":vulnerable,
            "scan_mode":scan_mode,"budgets":{"max_attempts":max_tests,"max_rounds":max_rounds,"timeout_seconds":timeout_seconds},"stop_reason":None,"rounds_completed":0,"llm_usage":[]}
    with engine.begin() as conn: conn.execute(text("INSERT INTO scans(run_id,created_at,status,data) VALUES(:id,:created,'queued',:data)"), {"id":run_id,"created":scan["created_at"],"data":json.dumps(scan)})
    emit(run_id,"scan_started",total=scan["total"],target=REGISTERED_TARGET,scan_mode=scan_mode,budgets=scan["budgets"])
    return scan

def _save(scan):
    with engine.begin() as conn:
        row=conn.execute(text("SELECT data FROM scans WHERE run_id=:id"), {"id":scan["run_id"]}).first()
        if row:
            persisted=json.loads(row[0])
            scan["events"]=persisted.get("events",scan.get("events",[]))
        conn.execute(text("UPDATE scans SET status=:status,data=:data WHERE run_id=:id"), {"status":scan["status"],"data":json.dumps(scan),"id":scan["run_id"]})

def persist_attack(run_id, attack, source="template"):
    """Store the exact prompt before its availability event or target execution."""
    ensure_tables()
    stored={**attack,"source":source,"status":"generated","run_id":run_id,"generated_at":_now(),"execution":None,"assessment":None,"verification":None}
    with engine.begin() as conn:
        conn.execute(text("INSERT INTO attack_attempts(run_id,attack_id,status,created_at,data) VALUES(:run,:attack,'generated',:created,:data)"), {"run":run_id,"attack":attack["attack_id"],"created":stored["generated_at"],"data":json.dumps(stored)})
    return stored

def update_attack(run_id, attack_id, **updates):
    with engine.begin() as conn:
        row=conn.execute(text("SELECT data FROM attack_attempts WHERE run_id=:run AND attack_id=:attack"),{"run":run_id,"attack":attack_id}).first()
        if not row: raise ValueError("Attack must be persisted before updating or execution")
        data=json.loads(row[0]); data.update(updates)
        status=data.get("status","generated")
        conn.execute(text("UPDATE attack_attempts SET status=:status,data=:data WHERE run_id=:run AND attack_id=:attack"),{"status":status,"data":json.dumps(data),"run":run_id,"attack":attack_id})
    return data

def attacks_for_run(run_id):
    ensure_tables()
    with engine.connect() as conn: rows=conn.execute(text("SELECT data FROM attack_attempts WHERE run_id=:run ORDER BY id"),{"run":run_id}).all()
    return [json.loads(r[0]) for r in rows]

def attack_detail(attack_id):
    ensure_tables()
    with engine.connect() as conn: row=conn.execute(text("SELECT data FROM attack_attempts WHERE attack_id=:attack ORDER BY id DESC LIMIT 1"),{"attack":attack_id}).first()
    return json.loads(row[0]) if row else None

def _persist_finding(run_id, result):
    """Group related invariant violations once per scan while retaining all attempts."""
    group=f"{result.get('category')}:{result.get('rule_id')}"
    finding_id=f"finding_{uuid.uuid5(uuid.NAMESPACE_URL,run_id+group).hex[:16]}"
    data={"finding_id":finding_id,"run_id":run_id,"target_id":REGISTERED_TARGET,"category":result.get("category"),
          "title":result.get("attack_name"),"description":result.get("explanation"),"severity":result.get("severity"),
          "confidence":(result.get("assessment") or {}).get("confidence"),"evidence":result.get("evidence",[]),
          "remediation_recommendation":result.get("recommended_mitigation"),"reproducibility_status":"observed","attack_ids":[result.get("attack_id")],"reproduced_after_defense":None}
    with engine.begin() as conn:
        row=conn.execute(text("SELECT attack_ids FROM findings WHERE run_id=:run AND group_key=:group"),{"run":run_id,"group":group}).first()
        if row:
            ids=json.loads(row[0]);
            if result.get("attack_id") not in ids: ids.append(result.get("attack_id"))
            data["attack_ids"]=ids
            conn.execute(text("UPDATE findings SET attack_ids=:ids,data=:data WHERE run_id=:run AND group_key=:group"),{"ids":json.dumps(ids),"data":json.dumps(data),"run":run_id,"group":group})
        else: conn.execute(text("INSERT INTO findings(finding_id,run_id,group_key,attack_ids,data) VALUES(:id,:run,:group,:ids,:data)"),{"id":finding_id,"run":run_id,"group":group,"ids":json.dumps(data["attack_ids"]),"data":json.dumps(data)})
    return data

def _cancel_requested(run_id):
    with _lock: return run_id in _cancelled

def _remaining_seconds(scan):
    elapsed=(datetime.now(timezone.utc)-datetime.fromisoformat(scan["started_at"])).total_seconds()
    return max(0.0,scan["budgets"]["timeout_seconds"]-elapsed)

def _scope_rejection(attack, previous_summaries, allowed_categories, allowed_invariants):
    prompt=attack["prompt"]
    if re.search(r"https?://|www\.|\b(?:curl|wget|python3?|node|powershell|bash|zsh|cmd(?:\.exe)?|shell|subprocess|os\.system|terminal|internet|website|real payment|real refund|credit card|wire transfer|external (?:account|server|service|url|endpoint|network|destination))\b",prompt,re.I):
        return "Prompt requests an external destination or system execution."
    customer_ids=set(re.findall(r"CUST-[A-Z0-9-]+",prompt,re.I))
    if customer_ids-{"CUST-001","CUST-002","CUST-003","CUST-CANARY"}:
        return "Prompt references a customer outside the synthetic sandbox."
    ticket_ids=set(re.findall(r"TICK-\d+",prompt,re.I))
    if ticket_ids-{"TICK-101","TICK-102","TICK-666"}:
        return "Prompt references a ticket outside the synthetic sandbox."
    parent=attack.get("parent_attack_id")
    if parent and parent not in {item.get("attack_id") for item in previous_summaries} and parent not in ATTACK_BY_ID:
        return "Parent attack is outside this scan's authorized test history."
    if attack.get("category") not in allowed_categories:
        return "Attack category is outside the selected scan scope."
    if attack.get("security_invariant") not in allowed_invariants:
        return "Security invariant is outside the selected scan scope."
    return None

def _prepare_candidates(scan, candidates, source, previous_summaries, allowed_categories, allowed_invariants):
    """Persist and publish a whole generated batch before any member can execute."""
    accepted=[]; seen={item.get("prompt_hash") for item in previous_summaries}
    for raw in candidates:
        candidate=dict(raw)
        if source=="llm":
            candidate["proposed_attack_id"]=candidate["attack_id"]
            candidate["attack_id"]=f"atk_{uuid.uuid4().hex[:20]}"
        stored=persist_attack(scan["run_id"],candidate,source)
        prompt_hash=hashlib.sha256(" ".join(stored["prompt"].casefold().split()).encode("utf-8")).hexdigest()
        rejection=_scope_rejection(stored,previous_summaries,allowed_categories,allowed_invariants)
        if not rejection and prompt_hash in seen:
            rejection="Duplicate prompt already tested or queued in this scan."
        seen.add(prompt_hash)
        if rejection:
            update_attack(scan["run_id"],stored["attack_id"],status="rejected",rejection_reason=rejection)
            emit(scan["run_id"],"attack_rejected",attack_id=stored["attack_id"],prompt=stored["prompt"],reason=rejection)
            previous_summaries.append({"attack_id":stored["attack_id"],"prompt_hash":prompt_hash,"rejected":rejection})
        else:
            emit(scan["run_id"],"attack_generated",attack_id=stored["attack_id"],prompt=stored["prompt"],category=stored["category"],name=stored["name"],source=source)
            accepted.append(stored)
    return accepted

def _execute_candidate(scan, runner, stored, source, previous_summaries):
    attack_id=stored["attack_id"]
    prompt_hash=hashlib.sha256(" ".join(stored["prompt"].casefold().split()).encode("utf-8")).hexdigest()
    update_attack(scan["run_id"],attack_id,status="running",execution_started_at=_now())
    update_attack(scan["run_id"],attack_id,status="running",execution_started_at=_now())
    emit(scan["run_id"],"attack_started",attack_id=attack_id,name=stored["name"])
    started=time.monotonic()
    try:
        with _target_lock:
            result=runner.execute_candidate(stored,scan["target_name"],scan["vulnerable_mode"])
    except Exception as exc:
        result={"attack_id":attack_id,"attack_name":stored["name"],"category":stored["category"],"prompt":stored["prompt"],"severity":stored["severity"],
                "outcome":"error","rule_id":stored["security_invariant"],"evidence":[],"explanation":f"Target execution failed ({type(exc).__name__}).",
                "affected_tool":None,"affected_data":None,"recommended_mitigation":"Review target execution logs."}
    result["attack_id"]=attack_id; result["source"]=source; result["execution_duration_seconds"]=time.monotonic()-started
    assessment=None; assessment_error=None; assessment_usage={}; assessment_provider={}
    if source=="llm" and result["outcome"]!="error":
        try:
            from app.llm.roles import evaluate_attack
            remaining=_remaining_seconds(scan)
            if remaining<=0: raise TimeoutError("Scan deadline reached before evaluator request")
            assessment,assessment_usage,assessment_provider=evaluate_attack(stored,result.get("execution",{}),timeout=remaining)
            scan["llm_usage"].append({"role":"evaluator","attack_id":attack_id,"usage":assessment_usage,"provider":assessment_provider})
        except Exception as exc:
            assessment_error=f"Evaluator unavailable or invalid ({type(exc).__name__})."
            if result["outcome"]=="inconclusive": result["outcome"]="inconclusive"
    result["assessment"]=assessment
    result["assessment_error"]=assessment_error
    result["usage"]={"evaluator":assessment_usage}
    result["provider"]={"evaluator":assessment_provider}
    if source=="llm":
        result["proposed_severity"]=stored["severity"]
        if result["outcome"]=="vulnerable":
            result["severity"]={"sensitive_data_disclosure":"critical","indirect_prompt_injection":"high","unauthorized_data_access":"high","unauthorized_tool_use":"high","multi_step_bypass":"high","prompt_injection":"medium","baseline":"low"}[stored["category"]]
    verification={"verdict":result["outcome"],"rule_id":result.get("rule_id"),"evidence":result.get("evidence"),"explanation":result.get("explanation")}
    update_attack(scan["run_id"],attack_id,status="error" if result["outcome"]=="error" else "completed",execution=result.get("execution"),target_response=result.get("execution",{}).get("target_response"),
                  assessment=assessment,assessment_error=assessment_error,verification=verification,verdict=result["outcome"],severity=result.get("severity"),
                  confidence=(assessment or {}).get("confidence"),execution_completed_at=_now(),execution_duration_seconds=result["execution_duration_seconds"],
                  provider=result.get("provider"),usage=result.get("usage"))
    scan["attempted"]+=1; scan["completed"]+=1; scan["counts"][result["outcome"]]+=1; scan["results"].append(result)
    with engine.begin() as conn:
        conn.execute(text("INSERT INTO scan_results(run_id,attack_id,outcome,data) VALUES(:run,:attack,:outcome,:data)"),{"run":scan["run_id"],"attack":attack_id,"outcome":result["outcome"],"data":json.dumps(result)})
    emit(scan["run_id"],"attack_completed",attack_id=attack_id,outcome=result["outcome"],assessment_error=assessment_error)
    if result["outcome"]=="vulnerable":
        finding=_persist_finding(scan["run_id"],result)
        emit(scan["run_id"],"finding_detected",attack_id=attack_id,finding_id=finding["finding_id"],severity=finding["severity"],category=result["category"])
    emit(scan["run_id"],"scan_progress",completed=scan["completed"],attempted=scan["attempted"],total=scan["total"],counts=scan["counts"])
    _save(scan)
    previous_summaries.append({"attack_id":attack_id,"category":result["category"],"outcome":result["outcome"],"prompt":stored["prompt"],"prompt_hash":prompt_hash,
                               "evidence":result.get("evidence",[])[:4],"recommended_next_categories":(assessment or {}).get("recommended_next_categories",[])})
    return result

def execute_scan(run_id: str):
    scan=get_scan(run_id)
    if not scan: return
    scan["status"]="running"; scan["started_at"]=_now(); _save(scan); emit(run_id,"scan_progress",stage="running",total=scan["total"],scan_mode=scan["scan_mode"])
    runner=AttackRunner(TargetAgent()); history=[]; stop_reason="selected_tests_completed"
    try:
        if scan["scan_mode"]=="deterministic":
            batches=[([ATTACK_BY_ID[i] for i in scan["attack_ids"]],"template")]
        else:
            from app.llm.roles import generate_attacks
            seeds=[ATTACK_BY_ID[i] for i in scan["attack_ids"]]
            for round_index in range(scan["budgets"]["max_rounds"]):
                if scan["attempted"]>=scan["budgets"]["max_attempts"]: stop_reason="attempt_budget_exhausted"; break
                if _cancel_requested(run_id): stop_reason="user_requested"; break
                remaining=_remaining_seconds(scan)
                if remaining<=0: stop_reason="wall_clock_timeout"; break
                remaining=scan["budgets"]["max_attempts"]-scan["attempted"]
                context={"target_id":REGISTERED_TARGET,"scope":"local registered sandbox only","available_tools":["get_customer_record","get_support_ticket","request_refund"],
                         "security_invariants":list(dict.fromkeys(a["security_invariant"] for a in seeds)),"allowed_categories":list(dict.fromkeys(a["category"] for a in seeds)),
                         "seed_templates":[{k:a[k] for k in ("attack_id","category","name","prompt","security_invariant","expected_secure_behavior")} for a in seeds],
                         "previous_tests":history[-12:],"remaining_attempt_budget":remaining,"round":round_index+1}
                candidates,usage,provider=generate_attacks(context,min(6,remaining),timeout=_remaining_seconds(scan))
                scan["llm_usage"].append({"role":"attacker","round":round_index+1,"usage":usage,"provider":provider})
                scan["rounds_completed"]=round_index+1; _save(scan)
                executed_before=scan["attempted"]
                allowed_categories={a["category"] for a in seeds}
                allowed_invariants={a["security_invariant"] for a in seeds}
                prepared=_prepare_candidates(scan,candidates,"llm",history,allowed_categories,allowed_invariants)
                for candidate in prepared:
                    if scan["attempted"]>=scan["budgets"]["max_attempts"]: stop_reason="attempt_budget_exhausted"; break
                    if _cancel_requested(run_id): stop_reason="user_requested"; break
                    if _remaining_seconds(scan)<=0: stop_reason="wall_clock_timeout"; break
                    _execute_candidate(scan,runner,candidate,"llm",history)
                if stop_reason in {"attempt_budget_exhausted","user_requested","wall_clock_timeout"}: break
                if scan["attempted"]==executed_before:
                    stop_reason="no_useful_eligible_tests"; break
            if stop_reason=="selected_tests_completed":
                if scan["attempted"]>=scan["budgets"]["max_attempts"]: stop_reason="attempt_budget_exhausted"
                elif scan["rounds_completed"]>=scan["budgets"]["max_rounds"]: stop_reason="adaptive_round_budget_exhausted"
        if scan["scan_mode"]=="deterministic":
            selected=[ATTACK_BY_ID[i] for i in scan["attack_ids"]]
            prepared=_prepare_candidates(scan,batches[0][0],"template",history,{a["category"] for a in selected},{a["security_invariant"] for a in selected})
            for candidate in prepared:
                if _cancel_requested(run_id): stop_reason="user_requested"; break
                if _remaining_seconds(scan)<=0: stop_reason="wall_clock_timeout"; break
                _execute_candidate(scan,runner,candidate,"template",history)
        if stop_reason in {"user_requested","wall_clock_timeout","attempt_budget_exhausted","adaptive_round_budget_exhausted","no_useful_eligible_tests"}:
            pending_status="cancelled" if stop_reason=="user_requested" else "not_executed"
            for pending in attacks_for_run(run_id):
                if pending.get("status")=="generated": update_attack(run_id,pending["attack_id"],status=pending_status,stop_reason=stop_reason)
        scan["stop_reason"]=stop_reason; scan["completed_at"]=_now()
        if stop_reason=="user_requested":
            scan["status"]="cancelled"; emit(run_id,"scan_cancelled",reason=stop_reason,completed=scan["completed"])
            with _lock: _cancelled.discard(run_id)
        elif stop_reason=="wall_clock_timeout":
            scan["status"]="timed_out"; emit(run_id,"scan_completed",reason=stop_reason,completed=scan["completed"])
        else:
            scan["status"]="completed"; emit(run_id,"scan_completed",counts=scan["counts"],stop_reason=stop_reason)
        _save(scan)
    except Exception as exc:
        scan["status"]="failed"; scan["stop_reason"]="provider_or_critical_execution_error"; scan["completed_at"]=_now()
        scan["error"]={"type":type(exc).__name__,"message":str(exc)[:300] if type(exc).__name__ in {"LLMConfigurationError","LLMProviderError","LLMOutputError"} else "Internal scan error"}
        _save(scan); emit(run_id,"scan_failed",reason=scan["stop_reason"],error=scan["error"])

def get_scan(run_id):
    ensure_tables()
    with engine.connect() as conn: row=conn.execute(text("SELECT data FROM scans WHERE run_id=:id"),{"id":run_id}).first()
    return json.loads(row[0]) if row else None

def list_scans():
    ensure_tables()
    with engine.connect() as conn: rows=conn.execute(text("SELECT data FROM scans ORDER BY created_at DESC LIMIT 50")).all()
    return [json.loads(row[0]) for row in rows]

def list_findings(severity=None, category=None, run_id=None):
    ensure_tables(); clauses=["1=1"]; params={}
    if run_id: clauses.append("run_id=:run"); params["run"]=run_id
    with engine.connect() as conn: rows=conn.execute(text("SELECT data FROM findings WHERE "+" AND ".join(clauses)+" ORDER BY rowid DESC"),params).all()
    results=[json.loads(row[0]) for row in rows]
    return [r for r in results if (not severity or r.get("severity")==severity) and (not category or r.get("category")==category)]

def scan_report(run_id):
    scan=get_scan(run_id)
    if not scan: return None
    return {"run_id":run_id,"target_id":scan["target_name"],"status":scan["status"],"started_at":scan.get("started_at"),"completed_at":scan.get("completed_at"),
            "counts":scan["counts"],"attempted":scan.get("attempted",0),"stop_reason":scan.get("stop_reason"),"budgets":scan.get("budgets"),"findings":[f for f in list_findings(run_id=run_id)],
            "attacks":attacks_for_run(run_id)}

def events_for(run_id):
    with _lock: events=list(_events.get(run_id, []))
    if events: return events
    scan=get_scan(run_id)
    return scan.get("events",[]) if scan else []

def cancel_scan(run_id):
    scan=get_scan(run_id)
    if not scan: return None
    if scan["status"] in {"completed","failed","cancelled","timed_out"}: return scan
    with _lock: _cancelled.add(run_id)
    return scan
