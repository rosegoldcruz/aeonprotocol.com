"""Configuration management for AEON Protocol API."""

import os
from typing import Any

from pydantic import BaseSettings, validator
from pydantic_settings import BaseSettings as PydanticSettings

from .exceptions import ConfigError


class Settings(PydanticSettings):
    """Application settings with validation and environment variable loading."""
    
    # Clerk Authentication
    clerk_publishable_key: str
    clerk_secret_key: str
    
    # Supabase Database
    supabase_url: str
    supabase_service_role_key: str
    supabase_anon_key: str
    
    # Payment Providers
    stripe_secret_key: str
    stripe_webhook_secret: str
    
    # Crypto Payments
    coinbase_commerce_api_key: str
    coinbase_commerce_webhook_secret: str
    
    # AI Providers
    replicate_api_token: str
    elevenlabs_api_key: str
    openai_api_key: str
    
    # Storage
    s3_endpoint: str
    s3_access_key: str
    s3_secret_key: str
    s3_bucket: str
    
    # Redis
    redis_url: str
    
    # Monitoring
    sentry_dsn: str | None = None
    
    # Environment
    environment: str = "development"
    debug: bool = False
    
    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: list[str] = [
        "http://localhost:3000",
        "https://*.aeonprotocol.com",
        "https://aeonprotocol.com"
    ]
    
    class Config:
        """Pydantic configuration."""
        env_file = ".env"
        case_sensitive = False
        
    @validator("cors_origins", pre=True)
    def parse_cors_origins(cls, v: Any) -> list[str]:
        """Parse CORS origins from string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v


def load_settings() -> Settings:
    """Load and validate application settings.
    
    Returns:
        Settings instance
        
    Raises:
        ConfigError: If required environment variables are missing
    """
    # Check for required environment variables
    required_vars = [
        "CLERK_PUBLISHABLE_KEY",
        "CLERK_SECRET_KEY",
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
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        raise ConfigError(missing_vars)
    
    try:
        return Settings()
    except Exception as e:
        raise ConfigError([f"Configuration validation failed: {str(e)}"])


# Global settings instance
settings = load_settings()