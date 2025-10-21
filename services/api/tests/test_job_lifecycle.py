import os
import pytest
from starlette.testclient import TestClient
from services.api.app.main import app


@pytest.mark.skipif(not os.getenv("CELERY_TASK_ALWAYS_EAGER"), reason="requires eager celery mode and provider keys")
def test_job_lifecycle_unauth_skips():
	with TestClient(app) as client:
		# Without auth, endpoint should reject
		resp = client.post("/v1/media/jobs", json={"kind": "image", "provider": "flux", "payload": {"prompt": "cat"}})
		assert resp.status_code in (401, 403) 