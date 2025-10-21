import os
import types
import pytest

# Minimal env for worker imports
REQUIRED = {
    "ENV": "test",
    "DATABASE_URL": "postgresql+asyncpg://user:pass@localhost:5432/aeon_test",
    "REDIS_URL": "redis://localhost:6379/0",
    "AWS_REGION": "us-east-1",
    "S3_BUCKET": "aeon-test-bucket",
    "CLERK_ISSUER": "https://example.com/issuer",
    "CLERK_JWKS_URL": "https://example.com/jwks.json",
    "CLERK_AUDIENCE": "test_pk",
    "CORS_ALLOW_ORIGINS": "http://localhost:3000,https://example.com",
}
for k, v in REQUIRED.items():
    os.environ.setdefault(k, v)

# Provide dummy S3 client
class DummyS3:
    def __init__(self):
        self.puts = []
    def put_object(self, **kwargs):
        # Record calls; allow failure injection via env
        if os.environ.get("TEST_S3_FAIL") == "1":
            raise RuntimeError("S3 failure")
        self.puts.append(kwargs)


@pytest.fixture(autouse=True)
def patch_boto3(monkeypatch):
    dummy = DummyS3()
    def _client(name, **kwargs):
        assert name == "s3"
        return dummy
    import boto3
    monkeypatch.setattr(boto3, "client", _client)
    # Also override the already-instantiated client inside the worker module
    try:
        import services.worker.worker as worker
        monkeypatch.setattr(worker, "s3_client", dummy, raising=False)
    except Exception:
        # Module may not be imported yet; tests that import it will still use patched boto3.client
        pass
    return dummy


@pytest.fixture(autouse=True)
def patch_status(monkeypatch):
    # Capture calls to set_job_status_sync and neutralize DB session
    calls = []
    import services.worker.worker as worker

    # Patch status setter to record calls only
    def _set(job_id, status, error=None):
        calls.append((job_id, status, error))
    monkeypatch.setattr(worker, "set_job_status_sync", _set)

    # Provide a no-op synchronous session to avoid real DB connections
    class DummySession:
        def __enter__(self):
            return self
        def __exit__(self, exc_type, exc, tb):
            return False
        def get(self, *args, **kwargs):
            class Obj:
                status = None
                error_message = None
                completed_at = None
            return Obj()
        def add(self, *args, **kwargs):
            pass
        def commit(self):
            pass
        def close(self):
            pass

    monkeypatch.setattr(worker, "SyncSessionLocal", lambda: DummySession(), raising=False)
    return calls


@pytest.fixture
def fake_task():
    # Celery Task-like shim for .update_state and .request.retries
    class T:
        def __init__(self, retries=0):
            self.max_retries = 3
            self.request = types.SimpleNamespace(retries=retries)
            self.state_updates = []
        def update_state(self, **meta):
            self.state_updates.append(meta)
        def retry(self, exc, countdown):
            # Simulate Celery's Retry by raising the exception directly
            raise exc
    return T()

