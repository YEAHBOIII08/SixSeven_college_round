"""Executes a catalog item against the one registered in-process sandbox."""
from typing import Any, Dict
from app.attack_engine.attack_library import ATTACK_BY_ID
from app.evaluator.rules import evaluate_execution
from app.target.agent import TargetAgent, VulnerabilityConfig

REGISTERED_TARGET = "CustomerSupportAgent"

class AttackRunner:
    def __init__(self, target_agent: TargetAgent):
        self.target_agent = target_agent

    def execute(self, attack_id: str, target_name: str = REGISTERED_TARGET, vulnerable: bool = False) -> Dict[str, Any]:
        attack = ATTACK_BY_ID.get(attack_id)
        if attack is None:
            raise ValueError("Unknown attack ID")
        if target_name != REGISTERED_TARGET or self.target_agent.name != REGISTERED_TARGET:
            raise ValueError("Target is not registered in the local sandbox")
        return self.execute_candidate(attack, target_name, vulnerable)

    def execute_candidate(self, attack: Dict[str, Any], target_name: str = REGISTERED_TARGET, vulnerable: bool = False) -> Dict[str, Any]:
        """Execute the supplied persisted candidate verbatim inside the local target."""
        if target_name != REGISTERED_TARGET or self.target_agent.name != REGISTERED_TARGET:
            raise ValueError("Target is not registered in the local sandbox")
        context = attack.get("target_context", {"user_id": "CUST-001"})
        config = VulnerabilityConfig(
            allow_unauthorized_record_access=vulnerable,
            trust_untrusted_content=vulnerable,
        )
        try:
            execution = self.target_agent.process_message(
                message=attack["prompt"], authenticated_user_id=context["user_id"], vuln_config=config
            ).model_dump(mode="json")
            result = evaluate_execution(attack, execution)
            return {"attack_id": attack["attack_id"], "attack_name": attack["name"], "category": attack["category"],
                    "prompt": attack["prompt"], "severity": attack["severity"], "execution": execution,
                    **result}
        except Exception as exc:
            return {"attack_id": attack["attack_id"], "attack_name": attack["name"], "category": attack["category"],
                    "prompt": attack["prompt"], "severity": attack["severity"], "outcome": "error",
                    "rule_id": attack["security_invariant"], "evidence": [],
                    "explanation": f"Target execution failed ({type(exc).__name__}).", "affected_tool": None,
                    "affected_data": None, "recommended_mitigation": "Review target execution logs."}
