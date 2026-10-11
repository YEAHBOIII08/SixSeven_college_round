"""Attacker Roles for AgentBreak (PRD Section 5.1).

- Attacker A: Direct vectors (user input, instruction override, tool abuse).
- Attacker B: Indirect vectors (poisoned documents, memory poisoning, multi-step chains).

Both execute assigned plan items against the sandboxed target agent and return full step transcripts.
"""

from typing import Any, Dict, List, Optional
from app.target.agent import TargetAgent, DefenseConfig, VulnerabilityConfig, AgentExecutionResult


class AttackerA:
    """Specialized in direct attack vectors (instructions, tool permission abuse)."""

    def __init__(self, role_name: str = "attacker_a"):
        self.role_name = role_name

    def execute_item(
        self,
        plan_item: Dict[str, Any],
        target_agent: TargetAgent,
        defense_config: Optional[DefenseConfig] = None,
        vuln_config: Optional[VulnerabilityConfig] = None,
    ) -> List[Dict[str, Any]]:
        """Execute direct plan item against target agent."""
        steps: List[Dict[str, Any]] = []
        prompt = plan_item.get("prompt", "")
        actor_id = plan_item.get("target_context", {}).get("user_id", "CUST-001")
        user_role = plan_item.get("target_context", {}).get("role", "customer")

        # Step 0: Attacker input
        steps.append({
            "idx": len(steps),
            "role": self.role_name,
            "type": "message",
            "content": prompt,
        })

        # Target execution
        exec_result: AgentExecutionResult = target_agent.process_message(
            message=prompt,
            authenticated_user_id=actor_id,
            user_role=user_role,
            vuln_config=vuln_config,
            defense_config=defense_config,
            reset_history=True,
        )

        # Record target tool calls
        for tc in exec_result.tool_calls:
            steps.append({
                "idx": len(steps),
                "role": "target",
                "type": "tool_call",
                "tool": tc.get("tool_name"),
                "args": tc.get("arguments", {}),
            })

        # Record target response
        steps.append({
            "idx": len(steps),
            "role": "target",
            "type": "response",
            "content": exec_result.target_response,
            "security_events": [e.model_dump() for e in exec_result.security_events],
            "execution_status": exec_result.execution_status,
        })

        return steps


class AttackerB:
    """Specialized in indirect vectors (poisoned documents, memory poisoning, multi-step chains)."""

    def __init__(self, role_name: str = "attacker_b"):
        self.role_name = role_name

    def execute_item(
        self,
        plan_item: Dict[str, Any],
        target_agent: TargetAgent,
        defense_config: Optional[DefenseConfig] = None,
        vuln_config: Optional[VulnerabilityConfig] = None,
    ) -> List[Dict[str, Any]]:
        """Execute indirect or multi-turn plan item against target agent."""
        steps: List[Dict[str, Any]] = []
        multi_turn = plan_item.get("multi_turn_prompts")
        actor_id = plan_item.get("target_context", {}).get("user_id", "CUST-001")
        user_role = plan_item.get("target_context", {}).get("role", "customer")

        if multi_turn and len(multi_turn) > 1:
            # Multi-turn execution (PRD Multi-step / Memory surfaces)
            for turn_idx, turn_prompt in enumerate(multi_turn):
                steps.append({
                    "idx": len(steps),
                    "role": self.role_name,
                    "type": "message",
                    "turn": turn_idx + 1,
                    "content": turn_prompt,
                })

                exec_result: AgentExecutionResult = target_agent.process_message(
                    message=turn_prompt,
                    authenticated_user_id=actor_id,
                    user_role=user_role,
                    vuln_config=vuln_config,
                    defense_config=defense_config,
                    reset_history=False,  # preserve state across multi-turn steps!
                )

                for tc in exec_result.tool_calls:
                    steps.append({
                        "idx": len(steps),
                        "role": "target",
                        "type": "tool_call",
                        "tool": tc.get("tool_name"),
                        "args": tc.get("arguments", {}),
                    })

                steps.append({
                    "idx": len(steps),
                    "role": "target",
                    "type": "response",
                    "turn": turn_idx + 1,
                    "content": exec_result.target_response,
                    "security_events": [e.model_dump() for e in exec_result.security_events],
                    "execution_status": exec_result.execution_status,
                })
        else:
            # Single-turn indirect vector (e.g. document retrieval or ticket injection)
            prompt = plan_item.get("prompt", "")
            steps.append({
                "idx": len(steps),
                "role": self.role_name,
                "type": "message",
                "content": prompt,
            })

            exec_result = target_agent.process_message(
                message=prompt,
                authenticated_user_id=actor_id,
                user_role=user_role,
                vuln_config=vuln_config,
                defense_config=defense_config,
                reset_history=True,
            )

            for tc in exec_result.tool_calls:
                steps.append({
                    "idx": len(steps),
                    "role": "target",
                    "type": "tool_call",
                    "tool": tc.get("tool_name"),
                    "args": tc.get("arguments", {}),
                })

            steps.append({
                "idx": len(steps),
                "role": "target",
                "type": "response",
                "content": exec_result.target_response,
                "security_events": [e.model_dump() for e in exec_result.security_events],
                "execution_status": exec_result.execution_status,
            })

        return steps
