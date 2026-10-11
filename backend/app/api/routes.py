"""FastAPI routes for sandbox scans, findings, and direct target inspection."""
import asyncio, json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from app.attack_engine.attack_library import ATTACKS, ATTACK_BY_ID, SURFACES
from app.orchestrator.scan_orchestrator import create_scan, execute_scan, get_scan, list_scans, list_findings, events_for, cancel_scan, attacks_for_run, attack_detail, scan_report
from app.target.agent import TargetAgent, VulnerabilityConfig, DefenseConfig, AgentExecutionResult
from app.llm.gemini import GeminiClient
from app.traces.trace_store import TraceStore
from app.roles.planner import Planner
from app.evaluator.defense_evaluator import DefenseEvaluator
from app.target.benign_suite import BENIGN_TASKS

router=APIRouter(); target_agent=TargetAgent()
trace_store=TraceStore()
planner=Planner()
evaluator=DefenseEvaluator()

class HealthResponse(BaseModel):
    status:str; version:str; message:str
class CreateRunRequest(BaseModel):
    target_name:str=Field(default="CustomerSupportAgent",max_length=80)
    attack_ids:Optional[List[str]]=None
    max_tests:Optional[int]=Field(default=None,ge=1,le=60)
    max_rounds:int=Field(default=5,ge=1,le=15)
    timeout_seconds:int=Field(default=180,ge=10,le=300)
    scan_mode:str=Field(default="adaptive",pattern="^adaptive$")
    vulnerable_mode:bool=False
    defense_config:Optional[str]=Field(default="none")
    defense_layer:Optional[str]=Field(default=None)
    surface:Optional[str]=None
class GeneratePlanRequest(BaseModel):
    target_spec:Optional[Dict[str,Any]]=None
    surface:Optional[str]=None
class ReplayRequest(BaseModel):
    defense_override:Optional[str]=None
class TargetTestRequest(BaseModel):
    message:str=Field(...,min_length=1,max_length=2000)
    user_id:str=Field(...,min_length=1,max_length=50)
    vulnerability_config:Optional[VulnerabilityConfig]=None

@router.get("/health",response_model=HealthResponse)
def health(): return {"status":"ok","version":"0.1.0","message":"AgentBreak backend is running"}

@router.get("/attacks")
def attacks(): return [{k:v for k,v in a.items() if k!="prompt"} for a in ATTACKS]

@router.post("/runs",status_code=status.HTTP_202_ACCEPTED)
def start_run(payload:CreateRunRequest, background:BackgroundTasks):
    if not GeminiClient.is_configured():
        raise HTTPException(status_code=503,detail="Adaptive scans require AGENTBREAK_LLM_API_KEY in backend/.env; please configure your Gemini API key.")
    defense_setting = payload.defense_layer or payload.defense_config or "none"
    try:
        max_tests_val = payload.max_tests if payload.max_tests is not None else min(60, payload.max_rounds * 6)
        scan=create_scan(
            attack_ids=payload.attack_ids,
            max_tests=max_tests_val,
            vulnerable=payload.vulnerable_mode,
            target_name=payload.target_name,
            max_rounds=payload.max_rounds,
            timeout_seconds=payload.timeout_seconds,
            scan_mode=payload.scan_mode,
            defense_config=defense_setting,
            surface=payload.surface,
        )
    except ValueError as exc: raise HTTPException(status_code=400,detail=str(exc))
    background.add_task(execute_scan,scan["run_id"])
    return {"run_id":scan["run_id"],"target_name":scan["target_name"],"attack_ids":scan["attack_ids"],"status":scan["status"],"created_at":scan["created_at"],"message":"Scan accepted; execution is running in the background."}

@router.get("/runs")
def runs(): return list_scans()

@router.get("/runs/{run_id}")
def run(run_id:str):
    scan=get_scan(run_id)
    if not scan: raise HTTPException(status_code=404,detail="Run not found")
    return scan

@router.get("/runs/{run_id}/attacks")
def run_attacks(run_id:str):
    if not get_scan(run_id): raise HTTPException(status_code=404,detail="Run not found")
    return attacks_for_run(run_id)

@router.get("/runs/{run_id}/report")
def run_report(run_id:str):
    report=scan_report(run_id)
    if not report: raise HTTPException(status_code=404,detail="Run not found")
    return report

@router.post("/runs/{run_id}/cancel")
def stop_run(run_id:str):
    scan=cancel_scan(run_id)
    if not scan: raise HTTPException(status_code=404,detail="Run not found")
    if scan["status"] not in {"completed","failed","cancelled","timed_out"}:
        from app.orchestrator.scan_orchestrator import emit
        emit(run_id,"scan_cancel_requested",reason="user_requested")
        return {"run_id":run_id,"status":"cancellation_requested"}
    return {"run_id":run_id,"status":scan["status"]}

@router.get("/runs/{run_id}/events")
async def run_events(run_id:str):
    if not get_scan(run_id): raise HTTPException(status_code=404,detail="Run not found")
    async def stream():
        sent=0
        while True:
            events=events_for(run_id)
            while sent<len(events):
                event=events[sent]; sent+=1
                yield f"event: {event['event']}\ndata: {json.dumps(event)}\n\n"
            scan=get_scan(run_id)
            if scan and scan["status"] in {"completed","failed","cancelled","timed_out"} and sent>=len(events): break
            await asyncio.sleep(0.35)
    return StreamingResponse(stream(),media_type="text/event-stream",headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no"})

@router.get("/attacks/{attack_id}")
def get_attack(attack_id:str):
    stored=attack_detail(attack_id)
    if stored: return stored
    template=ATTACK_BY_ID.get(attack_id)
    if template: return template
    raise HTTPException(status_code=404,detail="Attack not found")

@router.get("/findings")
def findings(severity:Optional[str]=None,category:Optional[str]=None,run_id:Optional[str]=None,status:Optional[str]=None):
    results=list_findings(severity,category,run_id)
    return [item for item in results if not status or item.get("reproducibility_status")==status]

@router.post("/target/test",response_model=AgentExecutionResult)
def test_target_agent(payload:TargetTestRequest):
    return target_agent.process_message(message=payload.message,authenticated_user_id=payload.user_id,vuln_config=payload.vulnerability_config)

@router.get("/surfaces")
def surfaces():
    """Return all 5 PRD vulnerability surfaces and catalog metadata."""
    return SURFACES

@router.post("/scans/plan")
def generate_plan(payload: Optional[GeneratePlanRequest] = None):
    """Generate a structured red-teaming plan covering all five surfaces."""
    req = payload or GeneratePlanRequest()
    plan = planner.generate_plan(target_spec=req.target_spec, surface=req.surface)
    return {"plan": plan, "total_items": len(plan), "surfaces_covered": list(set(p.get("surface") for p in plan))}

@router.get("/traces")
def list_traces(run_id: Optional[str] = None, surface: Optional[str] = None):
    """List reproducible attack traces recorded during sandbox executions."""
    return trace_store.list_traces(run_id=run_id, surface=surface)

@router.get("/traces/{trace_id}")
def get_trace(trace_id: str):
    """Retrieve full reproducible attack trace by ID."""
    trace = trace_store.get_trace(trace_id)
    if not trace:
        raise HTTPException(status_code=404, detail="Trace not found")
    return trace

@router.post("/traces/{trace_id}/replay")
def replay_trace(trace_id: str, payload: Optional[ReplayRequest] = None):
    """Deterministic replay of recorded attacker inputs against a fresh sandbox."""
    override = payload.defense_override if payload else None
    try:
        return trace_store.replay_trace(trace_id, defense_override=override)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Replay failed: {str(exc)}")

@router.get("/traces/stats/consistency")
def replay_consistency(run_id: Optional[str] = None):
    """Compute replay consistency metric across recorded attack traces."""
    return trace_store.compute_replay_consistency(run_id=run_id)

@router.post("/evaluate/defenses")
def evaluate_defenses():
    """Run complete defense evaluation matrix across all defense configs and benign tasks."""
    return evaluator.evaluate_all_defenses()

@router.get("/benign-suite")
def benign_suite():
    """Return the 10 benign support tasks used to compute BTSR and utility cost."""
    return BENIGN_TASKS
