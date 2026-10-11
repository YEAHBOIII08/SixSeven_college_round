"""Input & Content Filter Defense Layer for AgentBreak (PRD Section 8.1).

Sanitizes inbound prompts for:
1. Direct prompt injection patterns (system overrides, ignore previous instructions)
2. Role-play overrides (AuditBot, Supervisor Override, Maintenance Mode)
3. Base64 decode probes and obfuscated payload invocations
4. Direct attempts to extract internal secrets (canary tokens, API keys) or bypass auth
"""

import re
from typing import Any, Dict, List, Optional


class InputContentFilter:
    """Input sanitization and injection filter defense."""

    INJECTION_PATTERNS: List[str] = [
        # Direct instruction overrides
        r"ignore\s+(all\s+)?(previous|prior|current)\s+(rules|instructions|directives|guidelines)",
        r"system\s+(prompt|override|directive|reset)",
        r"priority\s+instruction",
        r"diagnostic\s+mode",
        r"developer\s+mode",
        r"dan\s+mode",
        r"unrestricted\s+mode",
        r"emergency\s+protocol\s+override",

        # Role-play & simulated personas
        r"\b(?:auditbot|system\s+directive\s+override|maintenance\s*mode|security\s*auditor|supervisor\s*override|god\s*mode|superuser\s*mode)\b",
        r"act\s+as\s+(?:an?\s+)?(?:unfiltered|unrestricted|auditor|superadmin)",

        # Base64 decode probes
        r"(?:base64|b64)(?:\s*(?:decode|eval|payload|execution)|:\s*[A-Za-z0-9+/=]{12,})",
        r"decode\s+(?:the\s+following\s+)?base64",

        # Canary & secret extraction attempts
        r"(?:reveal|print|disclose|show|leak|output|echo|repeat)\s+.*(?:canary|api[_\s-]?key|secret|internal\s+key|private\s+token|system\s+prompt|initial\s+prompt)",
        r"what\s+is\s+(?:the\s+)?(?:canary|internal\s+key|api\s+key|secret)",
        r"bypass\s+.*(?:auth|policy|rule|guardrail|permission)",
        r"standing_instruction",
        r"attacker@",
    ]

    def __init__(self, patterns: Optional[List[str]] = None):
        self.patterns = patterns or self.INJECTION_PATTERNS
        self._compiled = [re.compile(p, re.IGNORECASE) for p in self.patterns]

    def inspect(self, prompt: str) -> Dict[str, Any]:
        """Inspect inbound prompt against defensive filtering rules.
        
        Returns:
            Dict containing blocked status, matched pattern, and mitigation attribution.
        """
        normalized = prompt.strip()
        lower = normalized.lower()

        for regex, pattern_str in zip(self._compiled, self.patterns):
            match = regex.search(lower)
            if match:
                matched_snippet = match.group(0)
                return {
                    "blocked": True,
                    "matched_pattern": pattern_str,
                    "matched_text": matched_snippet,
                    "reason": f"Input violates security policy (matched pattern: '{matched_snippet}')",
                    "mitigated_by": "InputContentFilter: direct prompt injection / override attempt neutralized",
                    "safe_response": "Security violation: Input blocked by AgentBreak Input & Content Filter.",
                }

        return {
            "blocked": False,
            "matched_pattern": None,
            "matched_text": None,
            "reason": None,
            "mitigated_by": None,
            "safe_response": None,
        }

    def sanitize(self, prompt: str) -> str:
        """Sanitize prompt by stripping dangerous tags and instruction headers."""
        sanitized = re.sub(r"<\s*script[^>]*>.*?<\s*/\s*script\s*>", "", prompt, flags=re.DOTALL | re.IGNORECASE)
        sanitized = re.sub(r"<\s*system[^>]*>.*?<\s*/\s*system\s*>", "", sanitized, flags=re.DOTALL | re.IGNORECASE)
        return sanitized.strip()
