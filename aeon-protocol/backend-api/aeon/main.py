"""AEON Protocol FastAPI Application."""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import sentry_sdk
import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration

from .config import settings
from .exceptions import ConfigError
from .middleware.auth import ClerkAuthMiddleware
from .middleware.logging import RequestLoggingMiddleware
from .middleware.metrics import MetricsMiddleware
from .routers import (
    auth,
    billing,
    crm,
    health,
    media_image,
    media_music,
    media_video,
    webhooks,
)


# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager."""
    # Startup
    logger.info("Starting AEON Protocol API", version="0.1.0")
    
    # Initialize Sentry if configured
    if settings.sentry_dsn:
        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            environment=settings.environment,
            integrations=[
                StarletteIntegration(transaction_style="endpoint"),
                FastApiIntegration(auto_enabling=True),
            ],
            traces_sample_rate=0.1 if settings.environment == "production" else 1.0,
        )
        logger.info("Sentry initialized")
    
    # TODO: Initialize database connections, Redis, etc.
    
    yield
    
    # Shutdown
    logger.info("Shutting down AEON Protocol API")


# Create FastAPI application
app = FastAPI(
    title="AEON Protocol API",
    description="Advanced Enterprise AI Operations Network - Production API for AI-powered media generation",
    version="0.1.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    openapi_url="/openapi.json" if settings.debug else None,
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)

# Add compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add custom middleware
app.add_middleware(MetricsMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(ClerkAuthMiddleware)


# Exception handlers
@app.exception_handler(ConfigError)
async def config_error_handler(request: Request, exc: ConfigError) -> JSONResponse:
    """Handle configuration errors."""
    logger.error("Configuration error", error=str(exc), missing_vars=exc.missing_vars)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Configuration Error",
            "message": "Server configuration is incomplete",
            "request_id": getattr(request.state, "request_id", None),
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle general exceptions."""
    request_id = getattr(request.state, "request_id", "unknown")
    logger.error(
        "Unhandled exception",
        error=str(exc),
        error_type=type(exc).__name__,
        request_id=request_id,
        path=request.url.path,
        method=request.method,
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
            "request_id": request_id,
        }
    )


# Health check endpoint (always available)
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "aeon-api",
        "version": "0.1.0",
        "environment": settings.environment,
    }


# Metrics endpoint for Prometheus
@app.get("/metrics", tags=["Monitoring"])
async def metrics():
    """Prometheus metrics endpoint."""
    from fastapi.responses import Response
    return Response(
        generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )


# Include routers
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(media_video.router, prefix="/media/video", tags=["Media - Video"])
app.include_router(media_image.router, prefix="/media/image", tags=["Media - Image"])
app.include_router(media_music.router, prefix="/media/music", tags=["Media - Music"])
app.include_router(crm.router, prefix="/crm", tags=["CRM"])
app.include_router(billing.router, prefix="/billing", tags=["Billing"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "service": "AEON Protocol API",
        "version": "0.1.0",
        "description": "Advanced Enterprise AI Operations Network",
        "docs": "/docs" if settings.debug else "Documentation available in development mode only",
        "health": "/health",
        "metrics": "/metrics",
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "aeon.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        log_config=None,  # Use structlog configuration
    )