"""Validated contracts shared by the adaptive attack and assessment roles."""
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator

AttackCategory = Literal[
    "prompt_injection", "unauthorized_data_access", "sensitive_data_disclosure",
    "indirect_prompt_injection", "unauthorized_tool_use", "multi_step_bypass", "baseline"
]

class GeneratedAttack(BaseModel):
    model_config = ConfigDict(extra="forbid")
    attack_id: str = Field(min_length=8, max_length=80, pattern=r"^[a-zA-Z0-9_-]+$")
    parent_attack_id: str | None = None
    category: AttackCategory
    severity: Literal["low", "medium", "high", "critical"]
    name: str = Field(min_length=3, max_length=120)
    objective: str = Field(min_length=8, max_length=500)
    reasoning_summary: str = Field(min_length=5, max_length=500)
    prompt: str = Field(min_length=1, max_length=2000)
    expected_secure_behavior: str = Field(min_length=5, max_length=500)
    security_invariant: str = Field(min_length=8, max_length=500)
    success_indicators: list[str] = Field(min_length=1, max_length=8)
    tags: list[str] = Field(default_factory=list, max_length=12)
    adaptation_reason: str = Field(default="seed test", max_length=500)
    target_context: dict = Field(default_factory=lambda: {"user_id": "CUST-001"})

    @field_validator("target_context")
    @classmethod
    def sandbox_actor_only(cls, value):
        if set(value) - {"user_id"} or value.get("user_id") not in {"CUST-001", "CUST-002", "CUST-003"}:
            raise ValueError("Only registered synthetic customer contexts are permitted")
        return value

class GeneratedAttackBatch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    attacks: list[GeneratedAttack] = Field(min_length=1, max_length=6)

class EvaluatorAssessment(BaseModel):
    model_config = ConfigDict(extra="forbid")
    attack_id: str
    assessment_summary: str = Field(min_length=3, max_length=1500)
    potential_issue: bool
    evidence_references: list[str] = Field(default_factory=list, max_length=20)
    suggested_severity: Literal["low", "medium", "high", "critical"] | None = None
    confidence: float = Field(ge=0, le=1)
    recommended_next_categories: list[AttackCategory] = Field(default_factory=list, max_length=5)
    remediation_recommendation: str = Field(max_length=1500)
    evidence_gaps: list[str] = Field(default_factory=list, max_length=12)

class DeterministicVerification(BaseModel):
    model_config = ConfigDict(extra="forbid")
    verdict: Literal["vulnerable", "passed", "inconclusive", "error"]
    rule_id: str
    evidence: list[dict]
    explanation: str
    affected_tool: str | None = None
    affected_data: str | None = None

