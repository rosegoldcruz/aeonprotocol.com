import logging
import sys
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from pythonjsonlogger import jsonlogger
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

from .config import settings, validate_config
from .middleware import (
	ErrorHandlingMiddleware,
	RequestLoggingMiddleware,
	RateLimitingMiddleware,
	SecurityHeadersMiddleware,
)
from .rate_limit import get_redis
from .database import check_database_health, init_database
from .routers import media, agents, integrations, workflows, ai_coder, jobs, metrics, realtime
from .s3_client import create_bucket_if_not_exists

# Configure JSON logging with request_id
logger = logging.getLogger()
logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))
handler = logging.StreamHandler(sys.stdout)
formatter = jsonlogger.JsonFormatter("%(asctime)s %(levelname)s %(name)s %(message)s %(request_id)s")
handler.setFormatter(formatter)
logger.handlers = [handler]

# Sentry initialization
if settings.SENTRY_DSN:
	sentry_sdk.init(dsn=str(settings.SENTRY_DSN), environment=settings.ENV, integrations=[FastApiIntegration()])

app = FastAPI(title="AEON API", version="1.0.0")

# Security and platform middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(ErrorHandlingMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RateLimitingMiddleware, calls=1000, period=60)

# CORS from env
app.add_middleware(
	CORSMiddleware,
	allow_origins=settings.allowed_origins,
	allow_credentials=True,
	allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
	allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "User-Agent", "X-Request-ID"],
	expose_headers=["X-Request-ID"],
	max_age=86400,
)

# Routers with prefixes and tags
app.include_router(media.router, prefix="/v1/media", tags=["media"])
app.include_router(agents.router, prefix="/v1/agents", tags=["agents"])
app.include_router(integrations.router, prefix="/v1/integrations", tags=["integrations"])
app.include_router(workflows.router, prefix="/v1/workflows", tags=["workflows"])
app.include_router(ai_coder.router, prefix="/v1/ai-coder", tags=["ai-coder"])
# Expose legacy jobs endpoints used by the dashboard
app.include_router(jobs.router)
# Dashboard metrics and realtime
app.include_router(metrics.router, tags=["metrics"])
app.include_router(realtime.router, tags=["realtime"])


@app.on_event("startup")
async def on_startup():
	# Validate configuration early and fail fast in logs (do not crash server to keep /health available)
	try:
		validate_config()
	except Exception as e:
		logger.error(f"Config validation failed: {e}")
	# Initialize database connections
	try:
		await init_database()
	except Exception as e:
		logger.error(f"Database init failed (continuing to allow health checks): {e}")
	# Ensure S3 bucket exists in dev/localstack environments
	try:
		create_bucket_if_not_exists()
	except Exception as e:
		logger.error(f"S3 bucket init failed (continuing): {e}")
	# Prometheus metrics
	Instrumentator().instrument(app).expose(app, endpoint="/metrics")


@app.middleware("http")
async def add_request_id_header(request: Request, call_next):
	request_id = getattr(request.state, "request_id", None)
	response = await call_next(request)
	if request_id:
		response.headers["X-Request-ID"] = request_id
	return response


@app.get("/health/config")
async def health_config():
	missing = [k for k in ("ENV","DATABASE_URL","REDIS_URL","AWS_REGION","S3_BUCKET","CLERK_ISSUER","CLERK_JWKS_URL","CLERK_AUDIENCE","CORS_ALLOW_ORIGINS") if not os.environ.get(k)]
	return {"ok": len(missing) == 0, "missing": missing}


@app.get("/health/deps")
async def health_deps():
	# DB health
	db_ok = await check_database_health()
	# Redis health
	redis_ok = False
	try:
		r = await get_redis()
		redis_ok = await r.ping()  # type: ignore
	except Exception:
		redis_ok = False
	return {"database": bool(db_ok), "redis": bool(redis_ok)}

@app.get("/health")
async def health():
	return {"status": "ok"}

