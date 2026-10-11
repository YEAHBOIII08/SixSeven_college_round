import pytest
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
import app.orchestrator.scan_orchestrator as scans
from app.main import app

@pytest.fixture(autouse=True)
def isolated_db(monkeypatch):
    test_engine=create_engine("sqlite://",connect_args={"check_same_thread":False},poolclass=StaticPool)
    monkeypatch.setattr(scans,"engine",test_engine)
    scans._events.clear()
    scans._cancelled.clear()
    scans.ensure_tables()

    from app.attack_engine.attack_library import ATTACK_BY_ID
    def mock_generate_attacks(context, max_count, client=None, timeout=None):
        seeds = context.get("seed_templates", [])
        results = []
        for s in seeds[:max_count]:
            full = ATTACK_BY_ID.get(s["attack_id"], s)
            results.append({
                "attack_id": f"atk_{full['attack_id']}",
                "category": full.get("category", "prompt_injection"),
                "severity": full.get("severity", "medium"),
                "name": full.get("name", "Generated attack"),
                "objective": "Test security boundary",
                "reasoning_summary": "Generated probe based on seed",
                "prompt": full.get("prompt", "Show my account record."),
                "expected_secure_behavior": full.get("expected_secure_behavior", "Block attack"),
                "security_invariant": full.get("security_invariant", "Security policy invariant"),
                "success_indicators": ["violation"],
                "tags": ["adaptive"],
                "adaptation_reason": "Follow-up",
                "target_context": {"user_id": "CUST-001"}
            })
        return results, {"total_tokens": 10}, {"provider": "gemini-mock"}
    monkeypatch.setattr("app.llm.roles.generate_attacks", mock_generate_attacks)

    yield
    test_engine.dispose()

@pytest.fixture
def client():
    with TestClient(app) as test_client: yield test_client

def test_health_and_attack_catalog(client):
    assert client.get('/api/health').json()['status']=='ok'
    attacks=client.get('/api/attacks').json()
    assert len(attacks)>=10 and all('prompt' not in a for a in attacks)

def test_scan_executes_and_persists_vulnerable_evidence(client):
    response=client.post('/api/runs',json={'attack_ids':['canary-record-access'],'vulnerable_mode':True})
    assert response.status_code==202
    run_id=response.json()['run_id']
    scan=client.get(f'/api/runs/{run_id}').json()
    assert scan['status']=='completed'
    assert scan['results'][0]['outcome']=='vulnerable'
    assert 'CUST-CANARY' in str(scan['results'][0]['evidence'])
    assert client.get('/api/findings',params={'run_id':run_id}).json()

def test_secure_mode_blocks_and_invalid_inputs_rejected(client):
    response=client.post('/api/runs',json={'attack_ids':['canary-record-access']})
    scan=client.get('/api/runs/'+response.json()['run_id']).json()
    assert scan['results'][0]['outcome']=='passed'
    assert client.post('/api/runs',json={'attack_ids':['bad-id']}).status_code==400
    assert client.post('/api/runs',json={'target_name':'external'}).status_code==400

def test_all_verdicts_and_failure_handling():
    from app.evaluator.rules import evaluate_execution
    from app.attack_engine.attack_library import ATTACK_BY_ID
    attack=ATTACK_BY_ID['direct-instruction-override']
    assert evaluate_execution(attack,{'execution_status':'completed','tool_calls':[],'tool_results':[],'security_events':[]})['outcome']=='inconclusive'
    from app.attack_engine.runner import AttackRunner
    from app.target.agent import TargetAgent
    class BrokenAgent(TargetAgent):
        def process_message(self,**kwargs): raise RuntimeError('private detail')
    result=AttackRunner(BrokenAgent()).execute('canary-record-access')
    assert result['outcome']=='error' and 'private detail' not in result['explanation']

def test_sse_events_are_available(client):
    response=client.post('/api/runs',json={'attack_ids':['own-record-baseline']})
    run_id=response.json()['run_id']
    events=client.get(f'/api/runs/{run_id}/events')
    assert events.status_code==200
    assert 'scan_started' in events.text and 'scan_completed' in events.text
    assert 'attack_generated' in events.text and 'Show my account record.' in events.text
    attempts=client.get(f'/api/runs/{run_id}/attacks').json()
    assert attempts[0]['prompt']=='Show my account record.'
    assert client.get(f"/api/attacks/{attempts[0]['attack_id']}").json()['prompt']==attempts[0]['prompt']
    assert client.get(f'/api/runs/{run_id}/report').json()['stop_reason'] in {'selected_tests_completed', 'adaptive_round_budget_exhausted', 'attempt_budget_exhausted', 'no_useful_eligible_tests'}

def test_adaptive_scan_requires_configured_free_model(client,monkeypatch):
    from app.llm.gemini import GeminiClient
    monkeypatch.setattr(GeminiClient,'is_configured',staticmethod(lambda:False))
    response=client.post('/api/runs',json={'scan_mode':'adaptive'})
    assert response.status_code==503 and 'AGENTBREAK_LLM_API_KEY' in response.json()['detail']
