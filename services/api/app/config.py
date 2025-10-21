from __future__ import annotations

import os
from functools import lru_cache
from typing import List, Optional

from pydantic import AnyHttpUrl, BaseModel, Field, ValidationError, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Backward-compatibility shims for env var names used elsewhere
# Map ENVIRONMENT -> ENV and ALLOWED_ORIGINS -> CORS_ALLOW_ORIGINS if needed
if not os.getenv("ENV") and os.getenv("ENVIRONMENT"):
	os.environ["ENV"] = os.environ["ENVIRONMENT"]
if not os.getenv("CORS_ALLOW_ORIGINS") and os.getenv("ALLOWED_ORIGINS"):
	os.environ["CORS_ALLOW_ORIGINS"] = os.environ["ALLOWED_ORIGINS"]


class Settings(BaseSettings):
	# Environment
	ENV: str = Field(..., description="Deployment environment: production|staging|development|test")
	LOG_LEVEL: str = Field("INFO", description="Log level: DEBUG|INFO|WARNING|ERROR")
	MAX_BODY_MB: int = Field(10, description="Maximum request body size in megabytes")
	RATE_LIMIT_DEFAULT: int = Field(100, description="Default max requests per minute")

	# Core services
	DATABASE_URL: str = Field(..., description="SQLAlchemy database URL")
	REDIS_URL: str = Field(..., description="Redis URL for Celery and rate limiting")

	# AWS / S3
	AWS_REGION: str = Field(..., description="AWS region for S3")
	S3_BUCKET: str = Field(..., description="S3 bucket name for asset storage")
	S3_ENDPOINT_URL: Optional[str] = Field(None, description="Custom S3 endpoint (e.g. for MinIO/Localstack)")
	S3_SSE: Optional[str] = Field(None, description="Server-side encryption algorithm (e.g., AES256)")

	# Auth (Clerk)
	CLERK_ISSUER: str = Field(..., description="Expected token issuer")
	CLERK_JWKS_URL: AnyHttpUrl = Field(..., description="Clerk JWKS URL")
	CLERK_AUDIENCE: str = Field(..., description="Expected token audience (publishable key)")

	# CORS
	CORS_ALLOW_ORIGINS: str = Field(..., description="Comma-separated list of allowed origins")

	# Observability
	SENTRY_DSN: Optional[AnyHttpUrl] = Field(None, description="Sentry DSN")

	model_config = SettingsConfigDict(env_file=None, case_sensitive=True)

	@field_validator("DATABASE_URL")
	@classmethod
	def normalize_db_url(cls, v: str) -> str:
		# Normalize postgres:// scheme to postgresql+asyncpg:// for SQLAlchemy async
		if v.startswith("postgres://"):
			return v.replace("postgres://", "postgresql+asyncpg://", 1)
		if v.startswith("postgresql://") and "+asyncpg" not in v:
			return v.replace("postgresql://", "postgresql+asyncpg://", 1)
		return v

	@property
	def allowed_origins(self) -> List[str]:
		return [o.strip() for o in self.CORS_ALLOW_ORIGINS.split(",") if o.strip()]


class RuntimeConfig(BaseModel):
	"""Derived runtime configuration values."""
	max_body_bytes: int

	@staticmethod
	def from_settings(s: Settings) -> "RuntimeConfig":
		return RuntimeConfig(max_body_bytes=s.MAX_BODY_MB * 1024 * 1024)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
	try:
		return Settings()  # type: ignore[call-arg]
	except ValidationError as e:
		# Fail fast with a clear error
		raise RuntimeError(f"Invalid or missing environment configuration: {e}")


# Singleton-like accessors
settings: Settings = get_settings()
runtime: RuntimeConfig = RuntimeConfig.from_settings(settings)

# Required environment variables for startup validation
REQUIRED_ENV_VARS = [
	"ENV",
	"DATABASE_URL",
	"REDIS_URL",
	"AWS_REGION",
	"S3_BUCKET",
	"CLERK_ISSUER",
	"CLERK_JWKS_URL",
	"CLERK_AUDIENCE",
	"CORS_ALLOW_ORIGINS",
]


def validate_config() -> None:
	"""Validate that critical environment variables are present. Raises RuntimeError if any are missing."""
	missing = [k for k in REQUIRED_ENV_VARS if not os.environ.get(k)]
	if missing:
		raise RuntimeError(f"Missing required environment variables: {missing}")

