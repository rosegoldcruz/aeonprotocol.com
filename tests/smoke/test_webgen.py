import os, time, json
import pytest
import requests

API_BASE = os.getenv("API_BASE", "http://localhost:8000")
TOKEN = os.getenv("SMOKE_BEARER", "")

@pytest.mark.skipif(not TOKEN, reason="SMOKE_BEARER not set")
def test_enhance_commit_poll():
    h = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
    # Enhance
    r = requests.post(f"{API_BASE}/v1/enhance/webspec", headers=h, json={"raw":"SaaS landing with pricing and signup"})
    assert r.status_code == 200, r.text
    enh = r.json()["enhancement_id"]

    # Commit
    r = requests.post(f"{API_BASE}/v1/webgen/commit", headers=h, params={"enhancement_id": enh})
    assert r.status_code == 200, r.text
    pid = r.json()["project_id"]

    # Poll
    for _ in range(60):
        g = requests.get(f"{API_BASE}/v1/webgen/projects/{pid}", headers=h)
        assert g.status_code == 200, g.text
        data = g.json()
        if data["status"] in ("built","failed"):
            break
        time.sleep(2)
    assert data["status"] in ("built","failed")

