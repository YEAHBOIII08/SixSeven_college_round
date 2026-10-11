"""Executes a catalog item against the one registered in-process sandbox."""
from typing import Any, Dict, Optional
from app.attack_engine.attack_library import ATTACK_BY_ID
from app.evaluator.rules import evaluate_execution
from app.target.agent import TargetAgent, VulnerabilityConfig, DefenseConfig

REGISTERED_TARGET = "CustomerSupportAgent"

class AttackRunner:
    def __init__(self, target_agent: TargetAgent):
        self.target_agent = target_agent

    def execute(self, attack_id: str, target_name: str = REGISTERED_TARGET, vulnerable: bool = False, defense_config: Optional[DefenseConfig] = None) -> Dict[str, Any]:
        attack = ATTACK_BY_ID.get(attack_id)
        if attack is None:
            raise ValueError("Unknown attack ID")
        if target_name != REGISTERED_TARGET or self.target_agent.name != REGISTERED_TARGET:
            raise ValueError("Target is not registered in the local sandbox")
        return self.execute_candidate(attack, target_name, vulnerable, defense_config=defense_config)

    def execute_candidate(self, attack: Dict[str, Any], target_name: str = REGISTERED_TARGET, vulnerable: bool = False, defense_config: Optional[DefenseConfig] = None) -> Dict[str, Any]:
        """Execute the supplied persisted candidate verbatim inside the local target."""
        if target_name != REGISTERED_TARGET or self.target_agent.name != REGISTERED_TARGET:
            raise ValueError("Target is not registered in the local sandbox")
        context = attack.get("target_context", {"user_id": "CUST-001"})
        config = VulnerabilityConfig(
            allow_unauthorized_record_access=vulnerable,
            trust_untrusted_content=vulnerable,
        )
        try:
            multi_turn = attack.get("multi_turn_prompts")
            if multi_turn and len(multi_turn) > 1:
                # Execute multi-turn sequence
                last_exec = None
                for idx, turn_prompt in enumerate(multi_turn):
                    last_exec = self.target_agent.process_message(
                        message=turn_prompt,
                        authenticated_user_id=context.get("user_id", "CUST-001"),
                        vuln_config=config,
                        defense_config=defense_config,
                        reset_history=(idx == 0),
                    )
                execution = last_exec.model_dump(mode="json")
            else:
                execution = self.target_agent.process_message(
                    message=attack["prompt"],
                    authenticated_user_id=context.get("user_id", "CUST-001"),
                    vuln_config=config,
                    defense_config=defense_config,
                ).model_dump(mode="json")

            result = evaluate_execution(attack, execution)
            return {
                "attack_id": attack["attack_id"],
                "attack_name": attack.get("name", attack["attack_id"]),
                "category": attack.get("category", "unknown"),
                "surface": attack.get("surface", "instructions"),
                "prompt": attack["prompt"],
                "severity": attack.get("severity", "medium"),
                "execution": execution,
                **result,
            }
        except Exception as exc:
            return {
                "attack_id": attack["attack_id"],
                "attack_name": attack.get("name", attack["attack_id"]),
                "category": attack.get("category", "unknown"),
                "surface": attack.get("surface", "instructions"),
                "prompt": attack["prompt"],
                "severity": attack.get("severity", "medium"),
                "outcome": "error",
                "rule_id": attack.get("security_invariant", "Security policy invariant"),
                "evidence": [],
                "explanation": f"Target execution failed ({type(exc).__name__}).",
                "affected_tool": None,
                "affected_data": None,
                "recommended_mitigation": "Review target execution logs.",
            }
