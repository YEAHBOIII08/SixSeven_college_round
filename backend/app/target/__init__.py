"""Target agent package exports."""

from app.target.agent import TargetAgent, VulnerabilityConfig, AgentExecutionResult, SecurityEvent
from app.target.tools import MockToolExecutor, ToolCallRecord
from app.target.synthetic_data import (
    SYNTHETIC_CUSTOMERS,
    SYNTHETIC_TICKETS,
    get_synthetic_customer,
    get_synthetic_ticket,
)

__all__ = [
    "TargetAgent",
    "VulnerabilityConfig",
    "AgentExecutionResult",
    "SecurityEvent",
    "MockToolExecutor",
    "ToolCallRecord",
    "SYNTHETIC_CUSTOMERS",
    "SYNTHETIC_TICKETS",
    "get_synthetic_customer",
    "get_synthetic_ticket",
]
