import os
from starlette.testclient import TestClient
from services.api.app.main import app


def test_health_ok():
	with TestClient(app) as client:
		resp = client.get("/health")
		assert resp.status_code == 200
		assert resp.json().get("status") == "ok"


def test_media_jobs_requires_auth():
	with TestClient(app) as client:
		resp = client.post("/v1/media/jobs", json={"kind": "video", "provider": "runway", "payload": {"prompt": "test"}})
		assert resp.status_code in (401, 403) 