"""Request logging middleware with structured logging."""

import time
import uuid
from typing import Callable

import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = structlog.get_logger()


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all requests with structured logging and request IDs."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with logging."""
        # Generate unique request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Start timing
        start_time = time.time()
        
        # Get client IP
        client_ip = self._get_client_ip(request)
        
        # Log request start
        logger.info(
            "Request started",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            query_params=str(request.query_params) if request.query_params else None,
            client_ip=client_ip,
            user_agent=request.headers.get("user-agent"),
            user_id=getattr(request.state, "user_id", None),
        )
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate processing time
            process_time = time.time() - start_time
            
            # Log successful response
            logger.info(
                "Request completed",
                request_id=request_id,
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                process_time_ms=round(process_time * 1000, 2),
                client_ip=client_ip,
                user_id=getattr(request.state, "user_id", None),
            )
            
            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            # Calculate processing time for errors too
            process_time = time.time() - start_time
            
            # Log error
            logger.error(
                "Request failed",
                request_id=request_id,
                method=request.method,
                path=request.url.path,
                error=str(e),
                error_type=type(e).__name__,
                process_time_ms=round(process_time * 1000, 2),
                client_ip=client_ip,
                user_id=getattr(request.state, "user_id", None),
            )
            
            # Re-raise the exception
            raise
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address from request headers."""
        # Check for forwarded headers (from reverse proxy)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # Take the first IP in the chain
            return forwarded_for.split(",")[0].strip()
        
        # Check for real IP header
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # Fall back to direct client IP
        return request.client.host if request.client else "unknown"