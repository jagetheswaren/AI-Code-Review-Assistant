"""End-to-end workflow tests for the published /api contract."""

from test_api_endpoints import client, register


def test_user_can_register_analyze_and_view_dashboard(client):
    headers = register(client, "workflow_user", "workflow@example.com")
    analysis = client.post("/api/analyze", headers=headers, json={"filename": "example.py", "code": "print('hello')"})
    assert analysis.status_code == 200

    dashboard = client.get("/api/dashboard", headers=headers)
    assert dashboard.status_code == 200
    assert dashboard.get_json()["statistics"]["total_scans"] == 1


def test_webhook_rejects_unsigned_requests(client):
    response = client.post("/api/webhook/github", json={"action": "opened"})
    assert response.status_code in {400, 401, 403, 503}
