import pytest
import json
import hmac
import hashlib
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock
import mongomock

sys.path.insert(0, str(Path(__file__).parent.parent))
from app import create_app

@pytest.fixture
def client():
    app = create_app(mongo_client=mongomock.MongoClient(), database_name="api_test")
    app.config.update(TESTING=True)
    return app.test_client()

@pytest.fixture
def webhook_payload():
    return {
        "action": "opened",
        "pull_request": {"number": 42},
        "repository": {
            "full_name": "test-owner/test-repo",
            "owner": {"login": "test-owner"}
        }
    }

def generate_signature(secret, payload):
    mac = hmac.new(secret.encode(), msg=json.dumps(payload).encode(), digestmod=hashlib.sha256)
    return "sha256=" + mac.hexdigest()

def test_github_webhook_missing_signature(client, monkeypatch, webhook_payload):
    monkeypatch.setenv("GITHUB_WEBHOOK_SECRET", "test-secret")
    response = client.post('/api/github/webhook', json=webhook_payload, headers={"X-GitHub-Event": "pull_request"})
    assert response.status_code == 400
    assert response.json["error"] == "Missing signature"

def test_github_webhook_invalid_signature(client, monkeypatch, webhook_payload):
    monkeypatch.setenv("GITHUB_WEBHOOK_SECRET", "test-secret")
    headers = {
        "X-GitHub-Event": "pull_request",
        "X-Hub-Signature-256": "sha256=invalid"
    }
    response = client.post('/api/github/webhook', json=webhook_payload, headers=headers)
    assert response.status_code == 403
    assert response.json["error"] == "Invalid signature"

@patch('api.github_routes.threading.Thread')
def test_github_webhook_valid_signature_no_user(mock_thread, client, monkeypatch, webhook_payload):
    monkeypatch.setenv("GITHUB_WEBHOOK_SECRET", "test-secret")
    
    signature = generate_signature("test-secret", webhook_payload)
    headers = {
        "X-GitHub-Event": "pull_request",
        "X-Hub-Signature-256": signature
    }
    
    with patch('database.mongodb.user_service.collection.find_one', return_value=None):
        response = client.post('/api/github/webhook', data=json.dumps(webhook_payload), headers=headers, content_type='application/json')
        assert response.status_code == 500
        assert "No user token available" in response.json["error"]
        mock_thread.assert_not_called()

@patch('api.github_routes.threading.Thread')
def test_github_webhook_valid_signature_success(mock_thread, client, monkeypatch, webhook_payload):
    monkeypatch.setenv("GITHUB_WEBHOOK_SECRET", "test-secret")
    
    signature = generate_signature("test-secret", webhook_payload)
    headers = {
        "X-GitHub-Event": "pull_request",
        "X-Hub-Signature-256": signature
    }
    
    mock_user = {
        "_id": "5f9b3b3b3b3b3b3b3b3b3b3b",
        "github_token": "fake-token",
        "github_username": "test-owner"
    }
    
    with patch('database.mongodb.user_service.collection.find_one', return_value=mock_user):
        response = client.post('/api/github/webhook', data=json.dumps(webhook_payload), headers=headers, content_type='application/json')
        assert response.status_code == 202
        assert response.json["message"] == "Processing started"
        mock_thread.assert_called_once()

# --- OAuth Tests ---

def test_oauth_authorize_no_auth_header(client):
    response = client.get('/api/github/oauth/authorize')
    assert response.status_code == 401
    assert response.json["error"] == "Authentication required"

@patch('api.github_routes.decode_token')
def test_oauth_authorize_valid_token(mock_decode, client):
    client.application.config["GITHUB_CLIENT_ID"] = "test-client-id"
    mock_decode.return_value = {"user_id": "test-user-id"}
    
    response = client.get('/api/github/oauth/authorize', headers={"Authorization": "Bearer fake-jwt-token"})
    assert response.status_code == 200
    data = response.json
    assert "auth_url" in data
    assert "state" in data
    # Ensure JWT is NOT present in the returned URL
    assert "fake-jwt-token" not in data["auth_url"]
    assert "client_id=test-client-id" in data["auth_url"]

@patch('api.github_routes.decode_token')
def test_oauth_authorize_pat_still_works(mock_decode, client):
    mock_decode.return_value = {"user_id": "test-user-id"}
    with patch('api.github_routes.http_requests.get') as mock_get:
        mock_get.return_value = MagicMock(status_code=200, json=lambda: {"id": 12345, "login": "test-user"})
        with patch('database.mongodb.user_service.update_user') as mock_update:
            response = client.post('/api/github/pat/connect', json={"token": "ghp_fake_token"}, headers={"Authorization": "Bearer fake-jwt-token"})
            assert response.status_code == 200
            assert response.json["message"] == "GitHub connected successfully"
            mock_update.assert_called_once()

def test_oauth_callback_invalid_state(client):
    # Missing session state
    response = client.get('/api/github/oauth/callback?code=fake-code&state=fake-state')
    assert response.status_code == 400
    assert response.json["error"] == "Invalid OAuth state"
