"""Health check router."""

import asyncio
from datetime import datetime
from typing import Dict, Any

import structlog
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..config import settings

logger = structlog.get_logger()

router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str
    timestamp: datetime
    version: str
    environment: str
    checks: Dict[str, Any]


class ServiceCheck(BaseModel):
    """Individual service check model."""
    status: str
    response_time_ms: float
    details: Dict[str, Any] = {}


@router.get("/", response_model=HealthResponse)
async def health_check():
    """Comprehensive health check endpoint."""
    start_time = datetime.utcnow()
    
    # Perform various health checks
    checks = {}
    
    # Database check
    try:
        db_start = asyncio.get_event_loop().time()
        # TODO: Add actual database health check
        # await check_database_connection()
        db_duration = (asyncio.get_event_loop().time() - db_start) * 1000
        checks["database"] = ServiceCheck(
            status="healthy",
            response_time_ms=round(db_duration, 2),
            details={"provider": "supabase"}
        ).dict()
    except Exception as e:
        checks["database"] = ServiceCheck(
            status="unhealthy",
            response_time_ms=0,
            details={"error": str(e)}
        ).dict()
    
    # Redis check
    try:
        redis_start = asyncio.get_event_loop().time()
        # TODO: Add actual Redis health check
        # await check_redis_connection()
        redis_duration = (asyncio.get_event_loop().time() - redis_start) * 1000
        checks["redis"] = ServiceCheck(
            status="healthy",
            response_time_ms=round(redis_duration, 2),
            details={"url": settings.redis_url.split("@")[-1] if "@" in settings.redis_url else settings.redis_url}
        ).dict()
    except Exception as e:
        checks["redis"] = ServiceCheck(
            status="unhealthy",
            response_time_ms=0,
            details={"error": str(e)}
        ).dict()
    
    # Storage check
    try:
        storage_start = asyncio.get_event_loop().time()
        # TODO: Add actual S3/storage health check
        # await check_storage_connection()
        storage_duration = (asyncio.get_event_loop().time() - storage_start) * 1000
        checks["storage"] = ServiceCheck(
            status="healthy",
            response_time_ms=round(storage_duration, 2),
            details={"endpoint": settings.s3_endpoint, "bucket": settings.s3_bucket}
        ).dict()
    except Exception as e:
        checks["storage"] = ServiceCheck(
            status="unhealthy",
            response_time_ms=0,
            details={"error": str(e)}
        ).dict()
    
    # AI Providers check
    providers_status = {}
    
    # OpenAI check
    try:
        providers_status["openai"] = {"status": "configured", "api_key_present": bool(settings.openai_api_key)}
    except Exception as e:
        providers_status["openai"] = {"status": "error", "error": str(e)}
    
    # Replicate check
    try:
        providers_status["replicate"] = {"status": "configured", "api_key_present": bool(settings.replicate_api_token)}
    except Exception as e:
        providers_status["replicate"] = {"status": "error", "error": str(e)}
    
    # ElevenLabs check
    try:
        providers_status["elevenlabs"] = {"status": "configured", "api_key_present": bool(settings.elevenlabs_api_key)}
    except Exception as e:
        providers_status["elevenlabs"] = {"status": "error", "error": str(e)}
    
    checks["ai_providers"] = ServiceCheck(
        status="healthy",
        response_time_ms=0,
        details=providers_status
    ).dict()
    
    # Determine overall health status
    unhealthy_services = [name for name, check in checks.items() if check["status"] == "unhealthy"]
    overall_status = "unhealthy" if unhealthy_services else "healthy"
    
    if unhealthy_services:
        logger.warning("Health check failed", unhealthy_services=unhealthy_services)
    
    return HealthResponse(
        status=overall_status,
        timestamp=start_time,
        version="0.1.0",
        environment=settings.environment,
        checks=checks
    )


@router.get("/ready")
async def readiness_check():
    """Readiness check for Kubernetes."""
    # Check if service is ready to handle requests
    # This should be lighter than the full health check
    
    try:
        # TODO: Check critical dependencies only
        return {"status": "ready", "timestamp": datetime.utcnow()}
    except Exception as e:
        logger.error("Readiness check failed", error=str(e))
        raise HTTPException(status_code=503, detail="Service not ready")


@router.get("/live")
async def liveness_check():
    """Liveness check for Kubernetes."""
    # Simple check to verify the service is running
    return {"status": "alive", "timestamp": datetime.utcnow()}