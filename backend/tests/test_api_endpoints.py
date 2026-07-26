"""API tests using an injected in-memory MongoDB client."""

import sys
from pathlib import Path

import mongomock
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from app import create_app
from api import review_routes


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(review_routes.ai_reviewer, "review_code", lambda *_args, **_kwargs: "AI review skipped in tests")
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
