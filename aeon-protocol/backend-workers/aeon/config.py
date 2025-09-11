"""Configuration management for AEON Protocol Workers."""

import os
from typing import Any

from pydantic_settings import BaseSettings
from pydantic import validator


class ConfigError(Exception):
    """Raised when required configuration is missing or invalid."""
    
    def __init__(self, missing_vars: list[str]) -> None:
        """Initialize ConfigError with missing variables.
        
        Args:
            missing_vars: List of missing environment variable names
        """
        self.missing_vars = missing_vars
        var_list = ", ".join(missing_vars)
        super().__init__(f"Missing required environment variables: {var_list}")


class WorkerSettings(BaseSettings):
    """Worker settings with validation and environment variable loading."""
    
    # Clerk Authentication (for API calls)
    clerk_publishable_key: str
    clerk_secret_key: str
    
    # Supabase Database
    supabase_url: str
    supabase_service_role_key: str
    
    # AI Providers
    replicate_api_token: str
    elevenlabs_api_key: str
    openai_api_key: str
    
    # Storage
    s3_endpoint: str
    s3_access_key: str
    s3_secret_key: str
    s3_bucket: str
    
    # Redis (Celery Broker)
    redis_url: str
    
    # Email
    resend_api_key: str | None = None
    telegram_bot_token: str | None = None
    telegram_chat_id: str | None = None
    
    # Monitoring
    sentry_dsn: str | None = None
    
    # Environment
    environment: str = "development"
    debug: bool = False
    
    # Celery Configuration
    celery_broker_url: str | None = None
    celery_result_backend: str | None = None
    celery_task_serializer: str = "json"
    celery_result_serializer: str = "json"
    celery_accept_content: list[str] = ["json"]
    celery_timezone: str = "UTC"
    celery_enable_utc: bool = True
    
    class Config:
        """Pydantic configuration."""
        env_file = ".env"
        case_sensitive = False
        
    @validator("celery_broker_url", pre=True, always=True)
    def set_celery_broker_url(cls, v: str | None, values: dict[str, Any]) -> str:
        """Set Celery broker URL from Redis URL if not provided."""
        return v or values.get("redis_url", "")
        
    @validator("celery_result_backend", pre=True, always=True)
    def set_celery_result_backend(cls, v: str | None, values: dict[str, Any]) -> str:
        """Set Celery result backend from Redis URL if not provided."""
        return v or values.get("redis_url", "")


def load_worker_settings() -> WorkerSettings:
    """Load and validate worker settings.
    
    Returns:
        WorkerSettings instance
        
    Raises:
        ConfigError: If required environment variables are missing
    """
    # Check for required environment variables
    required_vars = [
        "CLERK_PUBLISHABLE_KEY",
        "CLERK_SECRET_KEY",
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "REPLICATE_API_TOKEN",
        "ELEVENLABS_API_KEY",
        "OPENAI_API_KEY",
        "S3_ENDPOINT",
        "S3_ACCESS_KEY",
        "S3_SECRET_KEY",
        "S3_BUCKET",
        "REDIS_URL",
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        raise ConfigError(missing_vars)
    
    try:
        return WorkerSettings()
    except Exception as e:
        raise ConfigError([f"Configuration validation failed: {str(e)}"])


# Global settings instance
settings = load_worker_settings()