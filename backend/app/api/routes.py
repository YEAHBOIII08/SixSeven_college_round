"""FastAPI routes for sandbox scans, findings, and direct target inspection."""
import asyncio, json
from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from app.attack_engine.attack_library import ATTACKS, ATTACK_BY_ID
from app.orchestrator.scan_orchestrator import create_scan, execute_scan, get_scan, list_scans, list_findings, events_for, cancel_scan, attacks_for_run, attack_detail, scan_report
from app.target.agent import TargetAgent, VulnerabilityConfig, AgentExecutionResult
from app.llm.gemini import GeminiClient

router=APIRouter(); target_agent=TargetAgent()

class HealthResponse(BaseModel):
    status:str; version:str; message:str
class CreateRunRequest(BaseModel):
    target_name:str=Field(default="CustomerSupportAgent",max_length=80)
    attack_ids:Optional[List[str]]=None
    max_tests:int=Field(default=30,ge=1,le=30)
    max_rounds:int=Field(default=5,ge=1,le=5)
    timeout_seconds:int=Field(default=180,ge=10,le=180)
    scan_mode:str=Field(default="deterministic",pattern="^(adaptive|deterministic)$")
    vulnerable_mode:bool=False
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
    if payload.scan_mode=="adaptive" and not GeminiClient.is_configured():
        raise HTTPException(status_code=503,detail="Adaptive scans require AGENTBREAK_LLM_API_KEY in backend/.env; deterministic scans remain available without credentials.")
    try: scan=create_scan(payload.attack_ids,payload.max_tests,payload.vulnerable_mode,payload.target_name,payload.max_rounds,payload.timeout_seconds,payload.scan_mode)
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
