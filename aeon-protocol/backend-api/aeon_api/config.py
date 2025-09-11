from __future__ import annotations

import os
from typing import List

from pydantic import BaseModel, HttpUrl, ValidationError


class ConfigError(RuntimeError):
    pass


class Settings(BaseModel):
    # Clerk
    CLERK_PUBLISHABLE_KEY: str
    CLERK_SECRET_KEY: str

    # Public API URL for FE
    NEXT_PUBLIC_API_URL: HttpUrl

    # Supabase
    SUPABASE_URL: HttpUrl
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_ANON_KEY: str

    # Stripe
    STRIPE_SECRET_KEY: str
    STRIPE_WEBHOOK_SECRET: str

    # Coinbase Commerce
    COINBASE_COMMERCE_API_KEY: str
    COINBASE_COMMERCE_WEBHOOK_SECRET: str

    # Providers
    REPLICATE_API_TOKEN: str
    ELEVENLABS_API_KEY: str
    OPENAI_API_KEY: str

    # Storage
    S3_ENDPOINT: str
    S3_ACCESS_KEY: str
    S3_SECRET_KEY: str
    S3_BUCKET: str

    # Infra
    REDIS_URL: str
    SENTRY_DSN: str | None = None


_cached: Settings | None = None


def get_settings() -> Settings:
    global _cached
    if _cached is not None:
        return _cached
    try:
        _cached = Settings(**os.environ)
        return _cached
    except ValidationError as exc:  # fail fast
        missing: List[str] = []
        for error in exc.errors():
            loc = ".".join([str(p) for p in error.get("loc", [])])
            missing.append(loc)
        raise ConfigError(
            f"Missing or invalid environment variables: {', '.join(sorted(set(missing)))}"
        )

