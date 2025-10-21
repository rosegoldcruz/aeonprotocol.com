"""
AEON Platform Middleware Components
"""
import time
import logging
from typing import Callable, Optional
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import traceback

from .auth import get_current_user, AuthenticatedUser
from .config import settings

from .rate_limit import rate_limit as _apply_rate_limit

# Configure logging
logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))
logger = logging.getLogger(__name__)

class ErrorHandlingMiddleware(BaseHTTPMiddleware):
	"""Global error handling middleware to catch and format exceptions"""

	async def dispatch(self, request: Request, call_next: Callable) -> Response:
		try:
			response = await call_next(request)
			return response
		except HTTPException as e:
			return JSONResponse(
				status_code=e.status_code,
				content={
					"error": e.detail,
					"status_code": e.status_code,
					"path": str(request.url.path)
				}
			)
		except Exception as e:
			logger.error(f"Unhandled exception in {request.method} {request.url.path}: {str(e)}")
			logger.error(f"Traceback: {traceback.format_exc()}")
			return JSONResponse(
				status_code=500,
				content={
					"error": "Internal server error",
					"status_code": 500,
					"path": str(request.url.path),
					"request_id": getattr(request.state, 'request_id', None)
				}
			)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
	"""Middleware for logging requests and responses"""

	async def dispatch(self, request: Request, call_next: Callable) -> Response:
		# Generate request ID
		import uuid
		request_id = str(uuid.uuid4())
		request.state.request_id = request_id

		# Attach user context if present
		request.state.user = None
		try:
			# Best-effort: don't block request if no token
			user: Optional[AuthenticatedUser] = await get_current_user(request)  # type: ignore[arg-type]
			request.state.user = user
		except Exception:
			pass

		start_time = time.time()
		logger.info(f"[{request_id}] {request.method} {request.url.path} - Started")
		try:
			response = await call_next(request)
			process_time = time.time() - start_time
			logger.info(f"[{request_id}] {request.method} {request.url.path} - Completed {response.status_code} in {process_time:.3f}s")
			response.headers["X-Request-ID"] = request_id
			return response
		except Exception as e:
			process_time = time.time() - start_time
			logger.error(f"[{request_id}] {request.method} {request.url.path} - Failed in {process_time:.3f}s: {str(e)}")
			raise

class RateLimitingMiddleware(BaseHTTPMiddleware):
	"""Redis-backed rate limiting using shared helper in rate_limit.py"""

	def __init__(self, app: ASGIApp, calls: int = 100, period: int = 60, prefix: str = "global"):
		super().__init__(app)
		self.calls = calls
		self.period = period
		self.prefix = prefix

	async def dispatch(self, request: Request, call_next: Callable) -> Response:
		# Skip rate limiting for health/metrics endpoints
		path = request.url.path or ""
		if path.startswith("/health") or path.startswith("/metrics"):
			return await call_next(request)
		# Apply Redis-backed limiter
		try:
			await _apply_rate_limit(request, limit=self.calls, window=self.period, prefix=self.prefix)
		except HTTPException as e:
			return JSONResponse(status_code=e.status_code, content={"error": "Rate limit exceeded"})
		return await call_next(request)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
	"""Add security headers to responses"""

	async def dispatch(self, request: Request, call_next: Callable) -> Response:
		response = await call_next(request)
		response.headers["X-Content-Type-Options"] = "nosniff"
		response.headers["X-Frame-Options"] = "DENY"
		response.headers["X-XSS-Protection"] = "1; mode=block"
		response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
		response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
		return response
