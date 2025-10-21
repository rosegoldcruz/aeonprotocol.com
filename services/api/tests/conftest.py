import os
import pytest

# Ensure minimal required env vars for app import
REQUIRED = {
    "ENV": "test",
    "DATABASE_URL": "postgresql+asyncpg://user:pass@localhost:5432/aeon_test",
    "REDIS_URL": "redis://localhost:6379/0",
    "AWS_REGION": "us-east-1",
    "S3_BUCKET": "aeon-test-bucket",
    "CLERK_ISSUER": "https://example",
    "CLERK_JWKS_URL": "https://example/.well-known/jwks.json",
    "CLERK_AUDIENCE": "pk_test",
    "CORS_ALLOW_ORIGINS": "http://localhost:3000",
}

for k, v in REQUIRED.items():
    os.environ.setdefault(k, v)

from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="session")
def client():
    return TestClient(app)

