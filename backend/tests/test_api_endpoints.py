"""API tests using an injected in-memory MongoDB client."""

import sys
from pathlib import Path

import mongomock
import pytest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).parent.parent))

from app import create_app
from api import review_routes

from services import analysis_service

@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(analysis_service.AIReviewer, "review_code", lambda *_args, **_kwargs: "AI review skipped in tests")
    app = create_app(mongo_client=mongomock.MongoClient(), database_name="api_test")
    app.config.update(TESTING=True)
    return app.test_client()


def register(client, username="testuser", email="test@example.com"):
    response = client.post("/api/register", json={"username": username, "email": email, "password": "SecurePass123!"})
    assert response.status_code == 201
    return {"Authorization": f"Bearer {response.get_json()['token']}"}


def test_authentication_and_profile(client):
    headers = register(client)
    profile = client.get("/api/me", headers=headers)
    assert profile.status_code == 200
    assert profile.get_json()["email"] == "test@example.com"


def test_ai_status_reports_static_fallback_when_no_provider_available(client):
    health = {
        "reachable": False,
        "models": [],
        "error": "Ollama at http://127.0.0.1:11434 is unreachable.",
        "provider": "none",
        "model": None,
        "groq_status": "not_configured",
        "ollama_status": "unreachable",
        "ollama_models": [],
        "ollama_error": "Ollama at http://127.0.0.1:11434 is unreachable.",
    }
    with patch.object(review_routes.analysis_service.ai_reviewer, "check_health", return_value=health):
        response = client.get("/api/ai/status")

    assert response.status_code == 200
    assert response.get_json()["available"] is False
    assert response.get_json()["provider"] == "none"
    assert response.get_json()["fallback"] == "static"
    assert response.get_json()["static_analysis"] is True
    assert response.get_json()["ollama_status"] == "unreachable"


def test_analysis_history_statistics_and_trends(client):
    headers = register(client)
    response = client.post("/api/analyze", headers=headers, json={
        "filename": "unsafe.py", "code": 'import os\npassword = "secret123"\nos.system("echo " + password)'
    })
    assert response.status_code == 200
    result = response.get_json()
    assert result["summary"]["total_issues"] >= 1

    history = client.get("/api/history", headers=headers)
    assert history.status_code == 200
    assert len(history.get_json()["scans"]) == 1

    stats = client.get("/api/stats", headers=headers)
    assert stats.status_code == 200
    assert stats.get_json()["total_scans"] == 1

    trends = client.get("/api/trends", headers=headers)
    assert trends.status_code == 200
    assert isinstance(trends.get_json()["trends"], list)


def test_unauthenticated_instant_review_and_claim(client):
    # 1. Guest user submits code with NO Authorization header
    guest_response = client.post("/api/analyze", json={
        "filename": "guest_code.py",
        "code": "import subprocess\nsubprocess.call('echo hi', shell=True)\n"
    })
    assert guest_response.status_code == 200
    guest_data = guest_response.get_json()
    assert guest_data["summary"]["total_issues"] >= 1
    assert "request_id" in guest_data
    request_id = guest_data["request_id"]

    # 2. Guest decides to register/login
    user_headers = register(client, username="instant_reviewer", email="instant@example.com")

    # 3. Before claiming, user's history is empty
    history_before = client.get("/api/history", headers=user_headers)
    assert history_before.status_code == 200
    assert len(history_before.get_json()["scans"]) == 0

    # 4. User claims the guest scan
    claim_resp = client.post(f"/api/scan/{request_id}/claim", headers=user_headers)
    assert claim_resp.status_code == 200
    assert "scan_id" in claim_resp.get_json()

    # 5. After claiming, scan appears in user's history
    history_after = client.get("/api/history", headers=user_headers)
    assert history_after.status_code == 200
    assert len(history_after.get_json()["scans"]) == 1
    assert history_after.get_json()["scans"][0]["request_id"] == request_id
