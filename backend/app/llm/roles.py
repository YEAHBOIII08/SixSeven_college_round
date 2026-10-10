"""Separate, structured Attacker and Evaluator LLM roles."""
from pydantic import ValidationError
import time
from app.attack_engine.schemas import GeneratedAttackBatch, EvaluatorAssessment
from app.attack_engine.role_prompts import ATTACKER_SYSTEM_PROMPT, EVALUATOR_SYSTEM_PROMPT
from app.llm.gemini import GeminiClient, LLMOutputError, LLMProviderError

ATTACK_ITEM_SCHEMA={"type":"OBJECT","properties":{
    "attack_id":{"type":"STRING"},"parent_attack_id":{"type":"STRING"},"category":{"type":"STRING","enum":["prompt_injection","unauthorized_data_access","sensitive_data_disclosure","indirect_prompt_injection","unauthorized_tool_use","multi_step_bypass","baseline"]},"severity":{"type":"STRING","enum":["low","medium","high","critical"]},
    "name":{"type":"STRING"},"objective":{"type":"STRING"},"reasoning_summary":{"type":"STRING"},"prompt":{"type":"STRING"},
    "expected_secure_behavior":{"type":"STRING"},"security_invariant":{"type":"STRING"},"success_indicators":{"type":"ARRAY","items":{"type":"STRING"}},
    "tags":{"type":"ARRAY","items":{"type":"STRING"}},"adaptation_reason":{"type":"STRING"},"target_context":{"type":"OBJECT","properties":{"user_id":{"type":"STRING","enum":["CUST-001","CUST-002","CUST-003"]}},"required":["user_id"]}},
    "required":["attack_id","category","severity","name","objective","reasoning_summary","prompt","expected_secure_behavior","security_invariant","success_indicators","tags","adaptation_reason","target_context"]}
ATTACK_BATCH_SCHEMA={"type":"OBJECT","properties":{"attacks":{"type":"ARRAY","minItems":1,"maxItems":6,"items":ATTACK_ITEM_SCHEMA}},"required":["attacks"]}
EVALUATOR_SCHEMA={"type":"OBJECT","properties":{
    "attack_id":{"type":"STRING"},"assessment_summary":{"type":"STRING"},"potential_issue":{"type":"BOOLEAN"},
    "evidence_references":{"type":"ARRAY","items":{"type":"STRING"}},"suggested_severity":{"type":"STRING","enum":["low","medium","high","critical"]},
    "confidence":{"type":"NUMBER"},"recommended_next_categories":{"type":"ARRAY","items":{"type":"STRING","enum":["prompt_injection","unauthorized_data_access","sensitive_data_disclosure","indirect_prompt_injection","unauthorized_tool_use","multi_step_bypass","baseline"]}},
    "remediation_recommendation":{"type":"STRING"},"evidence_gaps":{"type":"ARRAY","items":{"type":"STRING"}}},
    "required":["attack_id","assessment_summary","potential_issue","evidence_references","suggested_severity","confidence","recommended_next_categories","remediation_recommendation","evidence_gaps"]}

def _call_validated(client, prompt, task, schema, model, timeout=None):
    last=None
    deadline=time.monotonic()+timeout if timeout else None
    for _ in range(2):
        try:
            if deadline is not None:
                remaining=deadline-time.monotonic()
                if remaining<=0: raise LLMProviderError("Scan deadline reached before structured output could be retried")
                if hasattr(client,"timeout"): client.timeout=remaining
            raw=client.generate_json(prompt,task,schema)
            usage=raw.pop("_usage",{}); provider=raw.pop("_provider",{})
            return model.model_validate(raw),usage,provider
        except (ValidationError,LLMOutputError,KeyError,TypeError,ValueError) as exc:
            last=exc
            task={**task,"format_retry":"Previous output failed schema validation. Return one corrected JSON object only, preserving the requested scope."}
    raise LLMOutputError(f"Role output failed schema validation after one retry ({type(last).__name__})")

def generate_attacks(context, max_count, client=None, timeout=None):
    client=client or GeminiClient(timeout=timeout)
    task={"scope":"registered local sandbox only","max_attacks":max_count,"context":context}
    batch,usage,provider=_call_validated(client,ATTACKER_SYSTEM_PROMPT,task,ATTACK_BATCH_SCHEMA,GeneratedAttackBatch,timeout)
    return [a.model_dump(mode="json") for a in batch.attacks[:max_count]],usage,provider

def evaluate_attack(attack, execution, client=None, timeout=None):
    client=client or GeminiClient(timeout=timeout)
    task={"attack":{k:attack.get(k) for k in ("attack_id","prompt","expected_secure_behavior","security_invariant","category")},
          "target_response":execution.get("target_response",""),"tool_calls":execution.get("tool_calls",[]),
          "tool_results":execution.get("tool_results",[]),"security_events":execution.get("security_events",[])}
    assessment,usage,provider=_call_validated(client,EVALUATOR_SYSTEM_PROMPT,task,EVALUATOR_SCHEMA,EvaluatorAssessment,timeout)
    if assessment.attack_id!=attack.get("attack_id"):
        raise LLMOutputError("Evaluator returned an assessment for another attack")
    return assessment.model_dump(mode="json"),usage,provider
