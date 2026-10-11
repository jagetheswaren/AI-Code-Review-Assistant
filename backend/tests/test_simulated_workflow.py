import pytest
from test_api_endpoints import client, register

def test_full_user_workflow(client):
    # 1. Register & Login (Register function logs in via access token)
    headers = register(client, "full_user", "full@example.com")
    
    # 2. Dashboard empty
    dash1 = client.get("/api/dashboard", headers=headers)
    assert dash1.status_code == 200
    assert dash1.get_json()["statistics"]["total_scans"] == 0

    # 3. New Review -> Paste Python -> Start Review
    code = """
import os
def insecure_exec(cmd):
    os.system(cmd)
"""
    analysis = client.post("/api/analyze", headers=headers, json={"filename": "test.py", "code": code})
    assert analysis.status_code == 200
    res = analysis.get_json()
    assert "request_id" in res
    assert len(res["file_analyses"]) == 1
    issues = res["file_analyses"][0]["issues"]
    assert len(issues) > 0 # os.system should be caught

    # 4. Results & Finding Detail
    scan_id = res["request_id"]
    report = client.get(f"/api/report/{scan_id}", headers=headers)
    assert report.status_code == 200
    rep_data = report.get_json()
    assert rep_data["summary"]["health_score"] >= 0

    # 5. Dashboard updated
    dash2 = client.get("/api/dashboard", headers=headers)
    assert dash2.get_json()["statistics"]["total_scans"] == 1

    # 6. History
    history = client.get("/api/history", headers=headers)
    assert history.status_code == 200
    hist_data = history.get_json()
    assert hist_data["total"] == 1
