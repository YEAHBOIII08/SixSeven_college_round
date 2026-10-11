"""Defense Configuration Model for AgentBreak.

Maps UI and CLI defense options to boolean toggles for the three defensive layers:
1. input_filter: Input & Content Filter
2. tool_policy: Tool Policy Layer (RBAC & scoping)
3. spotlighting_output: Spotlighting delimiters & egress canary scrubber
"""

from typing import List
from pydantic import BaseModel, Field


class DefenseConfig(BaseModel):
    """Toggleable security defenses for target agents (PRD Section 8.1)."""

    input_filter: bool = Field(
        default=False,
        description="Filter 1: Injection classifier, role-play override interceptor, and input sanitizer.",
    )
    tool_policy: bool = Field(
        default=False,
        description="Filter 2: Role-based tool access control, BOLA/IDOR prevention, and admin gating.",
    )
    spotlighting_output: bool = Field(
        default=False,
        description="Filter 3: Untrusted content delimiting (<untrusted_content>) and egress canary leak scrubbing.",
    )

    @classmethod
    def from_name(cls, name: str) -> "DefenseConfig":
        """Factory from string descriptor supporting all UI and API alias keys."""
        normalized = (name or "none").strip().lower()
        if normalized in {"all", "all_defenses", "all_combined", "hardened"}:
            return cls(input_filter=True, tool_policy=True, spotlighting_output=True)
        if normalized in {"input_filter", "input"}:
            return cls(input_filter=True)
        if normalized in {"tool_policy", "policy", "rbac"}:
            return cls(tool_policy=True)
        if normalized in {"spotlighting", "spotlighting_output", "output_filter"}:
            return cls(spotlighting_output=True)
        return cls()

    @property
    def is_hardened(self) -> bool:
        """Return True if all defensive layers are simultaneously active."""
        return self.input_filter and self.tool_policy and self.spotlighting_output

    def active_layers(self) -> List[str]:
        """Return human-readable names of currently active defense layers."""
        layers = []
        if self.input_filter:
            layers.append("Input & Content Filter")
        if self.tool_policy:
            layers.append("Tool Policy Layer")
        if self.spotlighting_output:
            layers.append("Spotlighting & Output Filter")
        return layers or ["None (Baseline)"]
