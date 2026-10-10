"""Basic unit test for AgentBreak backend endpoints."""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    """Verify /api/health endpoint returns status ok."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "0.1.0"


def test_list_runs_initial_empty():
    """Verify /api/runs initially returns an empty list."""
    response = client.get("/api/runs")
    assert response.status_code == 200
    assert response.json() == []


def test_create_and_get_run():
    """Verify run creation and retrieval."""
    post_resp = client.post("/api/runs", json={"target_name": "TestBot", "attack_types": ["prompt_injection"]})
    assert post_resp.status_code == 201
    created = post_resp.json()
    run_id = created["run_id"]
    assert created["status"] == "pending"

    get_resp = client.get(f"/api/runs/{run_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["run_id"] == run_id


def test_get_run_404():
    """Verify unknown run returns 404."""
    response = client.get("/api/runs/nonexistent_run_id")
    assert response.status_code == 404


def test_list_findings_initial_empty():
    """Verify /api/findings returns an empty list initially."""
    response = client.get("/api/findings")
    assert response.status_code == 200
    assert response.json() == []
