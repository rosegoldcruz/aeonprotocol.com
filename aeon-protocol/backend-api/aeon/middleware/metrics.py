"""Prometheus metrics middleware."""

import time
from typing import Callable

import structlog
from fastapi import Request, Response
from prometheus_client import Counter, Histogram, Gauge
from starlette.middleware.base import BaseHTTPMiddleware

logger = structlog.get_logger()

# Prometheus metrics
REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total number of HTTP requests",
    ["method", "endpoint", "status_code"]
)

REQUEST_DURATION = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"]
)

ACTIVE_REQUESTS = Gauge(
    "http_requests_active",
    "Number of active HTTP requests"
)

# Business metrics
JOBS_CREATED = Counter(
    "jobs_created_total",
    "Total number of jobs created",
    ["job_type", "user_role"]
)

JOBS_COMPLETED = Counter(
    "jobs_completed_total",
    "Total number of jobs completed",
    ["job_type", "status"]
)

CREDITS_DEBITED = Counter(
    "credits_debited_total",
    "Total credits debited",
    ["reason", "user_role"]
)

CREDITS_CREDITED = Counter(
    "credits_credited_total",
    "Total credits credited",
    ["reason", "user_role"]
)

PROVIDER_REQUESTS = Counter(
    "provider_requests_total",
    "Total requests to AI providers",
    ["provider", "model", "status"]
)

PROVIDER_DURATION = Histogram(
    "provider_request_duration_seconds",
    "AI provider request duration in seconds",
    ["provider", "model"]
)


class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware to collect Prometheus metrics."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and collect metrics."""
        # Increment active requests
        ACTIVE_REQUESTS.inc()
        
        # Start timing
        start_time = time.time()
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate processing time
            duration = time.time() - start_time
            
            # Extract endpoint pattern (remove IDs, etc.)
            endpoint = self._normalize_endpoint(request.url.path)
            
            # Record metrics
            REQUEST_COUNT.labels(
                method=request.method,
                endpoint=endpoint,
                status_code=response.status_code
            ).inc()
            
            REQUEST_DURATION.labels(
                method=request.method,
                endpoint=endpoint
            ).observe(duration)
            
            return response
            
        except Exception as e:
            # Record error metrics
            endpoint = self._normalize_endpoint(request.url.path)
            REQUEST_COUNT.labels(
                method=request.method,
                endpoint=endpoint,
                status_code=500
            ).inc()
            
            # Re-raise the exception
            raise
        
        finally:
            # Decrement active requests
            ACTIVE_REQUESTS.dec()
    
    def _normalize_endpoint(self, path: str) -> str:
        """Normalize endpoint path for metrics (remove dynamic parts)."""
        # Replace UUIDs with placeholder
        import re
        
        # Replace UUID patterns
        path = re.sub(
            r'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
            '/{id}',
            path
        )
        
        # Replace other ID patterns
        path = re.sub(r'/\d+', '/{id}', path)
        
        # Limit path length for cardinality control
        if len(path) > 100:
            path = path[:97] + "..."
        
        return path


# Helper functions for business metrics
def record_job_created(job_type: str, user_role: str = "user") -> None:
    """Record job creation metric."""
    JOBS_CREATED.labels(job_type=job_type, user_role=user_role).inc()


def record_job_completed(job_type: str, status: str) -> None:
    """Record job completion metric."""
    JOBS_COMPLETED.labels(job_type=job_type, status=status).inc()


def record_credits_debited(amount: int, reason: str, user_role: str = "user") -> None:
    """Record credits debited metric."""
    CREDITS_DEBITED.labels(reason=reason, user_role=user_role).inc(amount)


def record_credits_credited(amount: int, reason: str, user_role: str = "user") -> None:
    """Record credits credited metric."""
    CREDITS_CREDITED.labels(reason=reason, user_role=user_role).inc(amount)


def record_provider_request(provider: str, model: str, status: str, duration: float) -> None:
    """Record AI provider request metrics."""
    PROVIDER_REQUESTS.labels(provider=provider, model=model, status=status).inc()
    PROVIDER_DURATION.labels(provider=provider, model=model).observe(duration)