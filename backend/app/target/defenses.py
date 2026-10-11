"""Re-export of defense components for target agent package compatibility."""

from app.defenses import (
    DefenseConfig,
    InputContentFilter,
    ToolPolicyLayer,
    SpotlightingOutputFilter,
)

__all__ = [
    "DefenseConfig",
    "InputContentFilter",
    "ToolPolicyLayer",
    "SpotlightingOutputFilter",
]
