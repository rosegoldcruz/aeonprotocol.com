from __future__ import annotations

import os
from pydantic import BaseModel, ValidationError


class ConfigError(RuntimeError):
    pass


class Settings(BaseModel):
    REDIS_URL: str
    SENTRY_DSN: str | None = None

    # Shared provider/storage keys for tasks
    REPLICATE_API_TOKEN: str
    ELEVENLABS_API_KEY: str
    OPENAI_API_KEY: str
    S3_ENDPOINT: str
    S3_ACCESS_KEY: str
    S3_SECRET_KEY: str
    S3_BUCKET: str


_cached: Settings | None = None


def get_settings() -> Settings:
    global _cached
    if _cached is not None:
        return _cached
    try:
        _cached = Settings(**os.environ)
        return _cached
    except ValidationError as exc:
        fields = {".".join(map(str, e.get("loc", []))) for e in exc.errors()}
        raise ConfigError(f"Missing or invalid environment variables: {', '.join(sorted(fields))}")

