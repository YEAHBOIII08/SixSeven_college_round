"""REST API route definitions for AgentBreak."""

import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter()

# In-memory store for initial prototype scaffolding
_RUNS_STORE: Dict[str, Dict[str, Any]] = {}
_FINDINGS_STORE: List[Dict[str, Any]] = []


# ---------------------------------------------------------------------------
# Request and Response Schemas
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: str = Field(..., example="ok")
    version: str = Field(..., example="0.1.0")
    message: str = Field(..., example="AgentBreak backend is running")


class CreateRunRequest(BaseModel):
    target_name: Optional[str] = Field("DefaultTarget", description="Name/ID of target agent")
    attack_types: Optional[List[str]] = Field(
        default_factory=lambda: ["prompt_injection"],
        description="List of attacks to test",
    )


class RunResponse(BaseModel):
    run_id: str
    target_name: str
    attack_types: List[str]
    status: str
    created_at: str
    message: str


class FindingResponse(BaseModel):
    finding_id: str
    run_id: str
    rule_id: str
    severity: str
    description: str


# ---------------------------------------------------------------------------
# Route Handlers
# ---------------------------------------------------------------------------

@router.get("/health", response_model=HealthResponse, tags=["Health"])
def get_health() -> Dict[str, str]:
    """Return backend operational status."""
    return {
        "status": "ok",
        "version": "0.1.0",
        "message": "AgentBreak backend is running",
    }


@router.post("/runs", response_model=RunResponse, status_code=status.HTTP_201_CREATED, tags=["Runs"])
def create_run(payload: CreateRunRequest) -> Dict[str, Any]:
    """Accept a security test run request and return a placeholder run ID and pending status.

    Note: This is initial scaffolding; no security attack execution is triggered yet.
    """
    run_id = f"run_{uuid.uuid4().hex[:8]}"
    run_record = {
        "run_id": run_id,
        "target_name": payload.target_name or "DefaultTarget",
        "attack_types": payload.attack_types or ["prompt_injection"],
        "status": "pending",
        "created_at": "2026-10-10T00:00:00Z",
        "message": "Test run request accepted. Execution engine integration pending.",
    }
    _RUNS_STORE[run_id] = run_record
    return run_record


@router.get("/runs", response_model=List[RunResponse], tags=["Runs"])
def list_runs() -> List[Dict[str, Any]]:
    """Return list of existing test runs (initially empty)."""
    return list(_RUNS_STORE.values())


@router.get("/runs/{run_id}", response_model=RunResponse, tags=["Runs"])
def get_run(run_id: str) -> Dict[str, Any]:
    """Return specific test run details or HTTP 404 if not found."""
    if run_id not in _RUNS_STORE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run with ID '{run_id}' not found",
        )
    return _RUNS_STORE[run_id]


@router.get("/findings", response_model=List[FindingResponse], tags=["Findings"])
def list_findings() -> List[Dict[str, Any]]:
    """Return security evaluation findings (initially empty)."""
    return _FINDINGS_STORE
