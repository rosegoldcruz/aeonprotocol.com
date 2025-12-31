from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict

REQUIRED_ENV_VARS = [
    "CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
    "NEXT_PUBLIC_API_URL",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_ANON_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "COINBASE_COMMERCE_API_KEY",
    "COINBASE_COMMERCE_WEBHOOK_SECRET",
    "REPLICATE_API_TOKEN",
    "ELEVENLABS_API_KEY",
    "OPENAI_API_KEY",
    "S3_ENDPOINT",
    "S3_ACCESS_KEY",
    "S3_SECRET_KEY",
    "S3_BUCKET",
    "REDIS_URL",
    "SENTRY_DSN",
]


class ConfigError(RuntimeError):
    pass


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    clerk_publishable_key: str
    clerk_secret_key: str
    next_public_api_url: str
    supabase_url: str
    supabase_service_role_key: str
    supabase_anon_key: str
    stripe_secret_key: str
    stripe_webhook_secret: str
    coinbase_commerce_api_key: str
    coinbase_commerce_webhook_secret: str
    replicate_api_token: str
    elevenlabs_api_key: str
    openai_api_key: str
    s3_endpoint: str
    s3_access_key: str
    s3_secret_key: str
    s3_bucket: str
    redis_url: str
    sentry_dsn: str

    def validate_required(self) -> None:
        missing = [name for name in REQUIRED_ENV_VARS if not self.model_dump().get(_to_field(name))]
        if missing:
            raise ConfigError(f"Missing required environment variables: {', '.join(missing)}")


def _to_field(env_name: str) -> str:
    return env_name.lower()
